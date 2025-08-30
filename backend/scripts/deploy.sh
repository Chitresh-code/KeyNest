#!/bin/bash

# KeyNest Production Deployment Script (Improved)
# Handles deployment with backups, health checks, and rollback

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Config
DEPLOY_PATH="/home/ubuntu/KeyNest"
BACKUP_DIR="/home/ubuntu/keynest-backups"
MAX_BACKUPS=5
BUILD_CACHE="true"

# Detect docker compose command
DOCKER_COMPOSE_CMD=$(command -v docker-compose || echo "docker compose")

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-cache) BUILD_CACHE="false"; shift ;;
    *) shift ;;
  esac
done

# Pick compose file
if [ -n "${DATABASE_URL:-}" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    log "Using production configuration with external database"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    log "Using development configuration with local database"
fi

# === FUNCTIONS ===

create_backup() {
    log "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    if [ -d "$DEPLOY_PATH" ]; then
        backup_name="keynest-$(date +%Y%m%d-%H%M%S)"
        cp -r "$DEPLOY_PATH" "$BACKUP_DIR/$backup_name"
        success "Backup created: $backup_name"
        cd "$BACKUP_DIR"
        ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
        log "Cleaned old backups, kept last $MAX_BACKUPS"
    else
        warning "No existing deployment found, skipping backup"
    fi
}

check_resources() {
    log "Checking system resources..."
    available_space=$(df /home | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 1048576 ]; then
        error "Insufficient disk space! Available: $(($available_space / 1024))MB"
        exit 1
    fi
    available_memory=$(free | grep '^Mem:' | awk '{print $7}')
    if [ "$available_memory" -lt 524288 ]; then
        warning "Low available memory: $(($available_memory / 1024))MB"
    fi
    success "Resource check passed"
}

stop_services() {
    log "Stopping existing services..."
    cd "$DEPLOY_PATH/backend"
    if $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps -q | grep -q .; then
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down --timeout 30
        success "Services stopped"
    else
        log "No running services found"
    fi
}

update_code() {
    log "Updating code from Git..."
    cd "$DEPLOY_PATH"
    git stash || true
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    current_commit=$(git rev-parse --short HEAD)
    commit_message=$(git log -1 --pretty=format:"%s")
    success "Updated to commit $current_commit - $commit_message"
}

start_services() {
    log "Building and starting services..."
    cd "$DEPLOY_PATH/backend"
    if [ "$BUILD_CACHE" = "false" ]; then
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
    else
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build
    fi
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    success "Services started"
}

wait_for_services() {
    log "Waiting for API..."
    local timeout=120 interval=5 elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -f -s http://localhost:8001/api/ > /dev/null 2>&1; then
            success "API is ready!"
            return 0
        fi
        log "Waiting for API... (${elapsed}s/${timeout}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    error "API failed to start in $timeout seconds"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50 api || true
    return 1
}

run_migrations() {
    log "Running Django migrations..."
    cd "$DEPLOY_PATH/backend"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec -T api python manage.py migrate --noinput
    success "Migrations applied"
}

collect_static() {
    log "Collecting static files..."
    cd "$DEPLOY_PATH/backend"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec -T api python manage.py collectstatic --noinput
    success "Static files collected"
}

health_check() {
    log "Performing health check..."
    local all_healthy=true
    api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/ || echo "000")
    if [ "$api_status" = "200" ]; then
        success "API OK"
    else
        error "API failed (HTTP $api_status)"
        all_healthy=false
    fi
    if [ -z "${DATABASE_URL:-}" ]; then
        if $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec -T db pg_isready -U keynest_dev > /dev/null 2>&1; then
            success "Database OK"
        else
            error "Database check failed"
            all_healthy=false
        fi
    else
        success "Database check skipped (external)"
    fi
    if $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "Redis OK"
    else
        error "Redis check failed"
        all_healthy=false
    fi
    [ "$all_healthy" = true ]
}

cleanup() {
    log "Cleaning Docker..."
    docker image prune -f > /dev/null 2>&1 || true
    docker container prune -f > /dev/null 2>&1 || true
    success "Cleanup done"
}

show_status() {
    log "Deployment Status:"
    cd "$DEPLOY_PATH/backend"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
    echo ""
    log "Service URLs:"
    echo "  🌐 API: http://13.203.105.44:8001/api/"
    echo "  🗄️  Database: localhost:5433"
    echo "  🔴 Redis: localhost:6380"
    cd "$DEPLOY_PATH"
    log "Git Commit:"
    git log -1 --oneline
    log "System Resources:"
    df -h /home | grep -v Filesystem
    free -h | grep -v "^total"
}

rollback() {
    error "Deployment failed, rolling back..."
    cd "$DEPLOY_PATH/backend"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down || true
    latest_backup=$(ls -t $BACKUP_DIR 2>/dev/null | head -1)
    if [ -n "$latest_backup" ] && [ -d "$BACKUP_DIR/$latest_backup" ]; then
        log "Restoring backup: $latest_backup"
        sudo rm -rf "$DEPLOY_PATH"
        cp -r "$BACKUP_DIR/$latest_backup" "$DEPLOY_PATH"
        cd "$DEPLOY_PATH/backend"
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
        wait_for_services && warning "Rollback succeeded" || error "Rollback failed"
        warning "⚠️ Database rollback not automatic — check migrations manually!"
    else
        error "No backup available for rollback"
    fi
}

main() {
    log "🚀 Starting KeyNest deployment..."
    check_resources
    create_backup
    stop_services
    update_code
    start_services
    wait_for_services
    run_migrations
    collect_static
    health_check || { rollback; exit 1; }
    cleanup
    show_status
    success "🎉 Deployment completed!"
}

trap 'rollback' ERR
main "$@"