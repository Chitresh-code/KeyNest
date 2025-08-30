#!/bin/bash

# KeyNest Production Deployment Script
# This script handles the complete deployment process with proper error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Configuration
DEPLOY_PATH="/home/ubuntu/KeyNest"
BACKUP_DIR="/home/ubuntu/keynest-backups"
MAX_BACKUPS=5

# Determine which compose file to use based on DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    log "Using production configuration with external database"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    log "Using development configuration with local database"
fi

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to create backup
create_backup() {
    log "Creating backup..."
    mkdir -p $BACKUP_DIR
    
    if [ -d "$DEPLOY_PATH" ]; then
        backup_name="keynest-$(date +%Y%m%d-%H%M%S)"
        cp -r $DEPLOY_PATH $BACKUP_DIR/$backup_name
        success "Backup created: $backup_name"
        
        # Keep only last MAX_BACKUPS backups
        cd $BACKUP_DIR
        ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
        log "Cleaned up old backups, keeping last $MAX_BACKUPS"
    else
        warning "No existing deployment found, skipping backup"
    fi
}

# Function to check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check disk space (should have at least 1GB free)
    available_space=$(df /home | tail -1 | awk '{print $4}')
    if [ $available_space -lt 1048576 ]; then  # 1GB in KB
        error "Insufficient disk space! Available: $(($available_space / 1024))MB"
        exit 1
    fi
    
    # Check memory
    available_memory=$(free | grep '^Mem:' | awk '{print $7}')
    if [ $available_memory -lt 524288 ]; then  # 512MB in KB
        warning "Low available memory: $(($available_memory / 1024))MB"
    fi
    
    success "Resource check passed"
}

# Function to stop services
stop_services() {
    log "Stopping existing services..."
    cd $DEPLOY_PATH/backend
    
    if docker-compose -f $COMPOSE_FILE ps -q | grep -q .; then
        docker-compose -f $COMPOSE_FILE down --timeout 30
        success "Services stopped successfully"
    else
        log "No running services found"
    fi
}

# Function to update code
update_code() {
    log "Updating code from repository..."
    cd $DEPLOY_PATH
    
    # Stash any local changes
    git stash || true
    
    # Pull latest changes
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    
    # Show current commit
    current_commit=$(git rev-parse --short HEAD)
    commit_message=$(git log -1 --pretty=format:"%s")
    success "Updated to commit: $current_commit - $commit_message"
}

# Function to build and start services
start_services() {
    log "Building and starting services..."
    cd $DEPLOY_PATH/backend
    
    # Build with no cache for production
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    success "Services started"
}

# Function to wait for services
wait_for_services() {
    log "Waiting for services to become ready..."
    
    local timeout=120  # 2 minutes
    local interval=5
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if curl -f -s http://localhost:8001/api/ > /dev/null 2>&1; then
            success "API is ready!"
            return 0
        fi
        
        log "Waiting for API... (${elapsed}s/${timeout}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    error "Services failed to start within $timeout seconds"
    
    # Show logs for debugging
    log "Container status:"
    docker ps
    
    log "API container logs (last 50 lines):"
    docker-compose -f $COMPOSE_FILE logs --tail=50 api || true
    
    return 1
}

# Function to perform health check
health_check() {
    log "Performing comprehensive health check..."
    
    local all_healthy=true
    
    # Check API endpoint
    api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/ || echo "000")
    if [ "$api_status" = "200" ]; then
        success "API health check passed"
    else
        error "API health check failed (HTTP $api_status)"
        all_healthy=false
    fi
    
    # Check database connectivity (only for local database)
    if [ -z "$DATABASE_URL" ]; then
        if docker-compose -f $COMPOSE_FILE exec -T db pg_isready -U keynest_dev > /dev/null 2>&1; then
            success "Database health check passed"
        else
            error "Database health check failed"
            all_healthy=false
        fi
    else
        success "Database health check skipped (using external database)"
    fi
    
    # Check Redis connectivity
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "Redis health check passed"
    else
        error "Redis health check failed"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = false ]; then
        return 1
    fi
    
    success "All health checks passed!"
    return 0
}

# Function to cleanup
cleanup() {
    log "Performing cleanup..."
    
    # Remove dangling Docker images
    docker image prune -f > /dev/null 2>&1 || true
    
    # Remove unused containers
    docker container prune -f > /dev/null 2>&1 || true
    
    success "Cleanup completed"
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo "----------------------------------------"
    
    # Show container status
    cd $DEPLOY_PATH/backend
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    log "Service URLs:"
    echo "  🌐 API: http://13.203.105.44:8001/api/"
    echo "  🗄️  Database: localhost:5433"
    echo "  🔴 Redis: localhost:6380"
    
    echo ""
    log "Git Status:"
    cd $DEPLOY_PATH
    git log -1 --oneline
    
    echo ""
    log "System Resources:"
    df -h /home | grep -v Filesystem
    free -h | grep -v "^total"
}

# Rollback function
rollback() {
    error "Deployment failed! Attempting rollback..."
    
    # Stop current deployment
    cd $DEPLOY_PATH/backend
    docker-compose -f $COMPOSE_FILE down || true
    
    # Find latest backup
    latest_backup=$(ls -t $BACKUP_DIR 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ] && [ -d "$BACKUP_DIR/$latest_backup" ]; then
        log "Rolling back to backup: $latest_backup"
        
        # Remove current deployment and restore backup
        sudo rm -rf $DEPLOY_PATH
        cp -r $BACKUP_DIR/$latest_backup $DEPLOY_PATH
        
        # Start services from backup
        cd $DEPLOY_PATH/backend
        docker-compose -f $COMPOSE_FILE up -d
        
        if wait_for_services; then
            warning "Rollback successful"
            return 0
        else
            error "Rollback also failed!"
            return 1
        fi
    else
        error "No backup found for rollback!"
        return 1
    fi
}

# Main deployment function
main() {
    log "Starting KeyNest deployment..."
    
    # Check prerequisites
    check_resources
    
    # Create backup
    create_backup
    
    # Stop services
    stop_services
    
    # Update code
    if ! update_code; then
        error "Failed to update code"
        exit 1
    fi
    
    # Start services
    if ! start_services; then
        error "Failed to start services"
        rollback
        exit 1
    fi
    
    # Wait for services
    if ! wait_for_services; then
        error "Services failed to start properly"
        rollback
        exit 1
    fi
    
    # Health check
    if ! health_check; then
        error "Health check failed"
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    # Show final status
    show_status
    
    success "🎉 Deployment completed successfully!"
}

# Trap errors and attempt rollback
trap 'rollback' ERR

# Run main function
main "$@"