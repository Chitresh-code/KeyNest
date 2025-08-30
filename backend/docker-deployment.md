# KeyNest Docker Deployment Guide

Complete guide for deploying KeyNest using Docker and Docker Compose with production PostgreSQL database.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- 10GB+ disk space for production deployment

## 🚀 Quick Start

### Development Deployment

1. **Clone and setup environment:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Start development services:**
```bash
# Start core services (API, DB, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Optional: Start with admin interfaces
docker-compose -f docker-compose.dev.yml --profile admin up -d

# Optional: Start with email testing
docker-compose -f docker-compose.dev.yml --profile mail up -d
```

3. **Initialize database:**
```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec api python manage.py migrate

# Create superuser
docker-compose -f docker-compose.dev.yml exec api python manage.py createsuperuser
```

4. **Access services:**
- **API**: http://localhost:8001
- **Database**: localhost:5433 (keynest_dev/keynest_dev/dev_password)
- **Redis**: localhost:6380
- **PgAdmin** (if started): http://localhost:8080 (admin@keynest.dev/admin123)
- **Redis Commander** (if started): http://localhost:8081
- **MailHog** (if started): http://localhost:8025

### Production Deployment

1. **Prepare production environment:**
```bash
# Copy and configure production environment
cp .env.production .env.prod

# IMPORTANT: Update these values in .env.prod
# - SECRET_KEY (generate new random string)
# - ENCRYPTION_KEY (generate with Fernet.generate_key())
# - DB_PASSWORD (secure database password)
# - ALLOWED_HOSTS (your domain names)
# - EMAIL_* (SMTP configuration)
```

2. **Generate encryption key:**
```bash
python3 -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
```

3. **Start production services:**
```bash
# Load environment variables
export $(cat .env.prod | xargs)

# Start all production services
docker-compose --env-file .env.prod up -d

# Check service health
docker-compose ps
```

4. **Initialize production database:**
```bash
# Wait for services to be healthy
docker-compose exec api python manage.py migrate

# Collect static files
docker-compose exec api python manage.py collectstatic --noinput

# Create admin user
docker-compose exec api python manage.py createsuperuser
```

5. **Verify deployment:**
```bash
# Check API health
curl http://localhost:8000/health/

# Check with authentication
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"TestPass123!"}'
```

## 🏗️ Architecture Overview

### Production Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │────│   KeyNest API   │────│   PostgreSQL    │
│  (Reverse Proxy)│    │   (Django)      │    │   (Database)    │
│   Port: 80/443  │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │    (Cache)      │
                       │   Port: 6379    │
                       └─────────────────┘
```

### Service Dependencies

1. **Database (PostgreSQL)**: Primary data store with encryption support
2. **Cache (Redis)**: Session storage and application caching
3. **API (Django)**: Core application logic with REST API
4. **Proxy (Nginx)**: Load balancing, SSL termination, static files
5. **Backup**: Automated database backup service

## 🔧 Configuration

### Environment Variables

#### Required for Production
```bash
# Security
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-fernet-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Database
DB_PASSWORD=secure-database-password
DATABASE_URL=postgresql://keynest_user:password@db:5432/keynest_db

# Domains
ALLOWED_HOSTS=keynest.com,api.keynest.com
CORS_ALLOWED_ORIGINS=https://keynest.com,https://app.keynest.com

# Email (SMTP)
EMAIL_HOST=smtp.your-provider.com
EMAIL_HOST_USER=noreply@keynest.com
EMAIL_HOST_PASSWORD=your-email-password
```

#### Optional Configuration
```bash
# Redis
REDIS_PASSWORD=redis-password
CACHE_LOCATION=redis://redis:6379/1

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=INFO

# SSL/Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000

# Performance
WEB_CONCURRENCY=4
MAX_REQUESTS=1000
```

### SSL Configuration

1. **For development** (self-signed certificates):
```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/keynest.key \
  -out ssl/keynest.crt \
  -subj "/C=US/ST=CA/L=SF/O=KeyNest/CN=localhost"
```

2. **For production** (Let's Encrypt):
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.keynest.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/api.keynest.com/fullchain.pem ssl/keynest.crt
sudo cp /etc/letsencrypt/live/api.keynest.com/privkey.pem ssl/keynest.key
```

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# Check all services
docker-compose ps

# Check individual service logs
docker-compose logs api
docker-compose logs db
docker-compose logs redis
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f api
```

### Database Maintenance
```bash
# Manual backup
docker-compose --profile backup run --rm backup

# View backup files
ls -la backups/

# Restore from backup
docker-compose exec db psql -U keynest_user -d keynest_db < backups/backup_file.sql
```

### Performance Monitoring
```bash
# Start monitoring stack (optional)
docker-compose --profile monitoring up -d

# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Loki: http://localhost:3100
```

### Scaling
```bash
# Scale API service
docker-compose up -d --scale api=3

# Update nginx upstream configuration to include new instances
# Edit nginx/conf.d/keynest.conf and add new servers
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default passwords (DB_PASSWORD, REDIS_PASSWORD)
- [ ] Generate new SECRET_KEY and ENCRYPTION_KEY
- [ ] Configure SSL certificates
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Enable log aggregation
- [ ] Configure backup storage (encrypted)
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### Network Security
```bash
# Create custom network with restricted access
docker network create keynest-prod \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1
```

### Backup Security
```bash
# Encrypt backups before storage
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA256 --s2k-count 65536 --symmetric \
    --output backup.sql.gz.gpg backup.sql.gz
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database health
docker-compose exec db pg_isready -U keynest_user

# Check connection from API container
docker-compose exec api python manage.py dbshell
```

#### API Not Responding
```bash
# Check API logs
docker-compose logs api

# Check if migrations are applied
docker-compose exec api python manage.py showmigrations

# Restart API service
docker-compose restart api
```

#### Static Files Not Loading
```bash
# Collect static files
docker-compose exec api python manage.py collectstatic --noinput

# Check nginx configuration
docker-compose exec nginx nginx -t

# Restart nginx
docker-compose restart nginx
```

#### Memory Issues
```bash
# Check resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Recovery Procedures

#### Database Recovery
```bash
# Stop all services except database
docker-compose stop api nginx redis

# Restore from backup
docker-compose exec db psql -U keynest_user -d keynest_db < backups/latest_backup.sql

# Start services
docker-compose up -d
```

#### Complete System Recovery
```bash
# Pull latest images
docker-compose pull

# Rebuild containers
docker-compose build --no-cache

# Start with clean state
docker-compose down -v
docker-compose up -d

# Restore data
docker-compose exec api python manage.py migrate
# Restore database from backup if needed
```

## 📊 Performance Tuning

### Database Optimization
```bash
# Connect to database
docker-compose exec db psql -U keynest_user -d keynest_db

# Check database statistics
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats;

# Analyze tables
ANALYZE;
```

### API Performance
```bash
# Monitor API performance
docker-compose exec api python manage.py check --deploy

# Check for N+1 queries in logs
# Look for django.db.backends DEBUG logs
```

### Nginx Optimization
```bash
# Test nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx configuration
docker-compose exec nginx nginx -s reload

# Monitor nginx access logs
docker-compose logs nginx | grep -E "(POST|PUT|DELETE)"
```

This completes the comprehensive Docker deployment setup for KeyNest with production PostgreSQL database!