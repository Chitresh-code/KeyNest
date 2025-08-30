#!/bin/bash
# KeyNest Database Backup Script

set -e

# Configuration
DB_HOST=${DB_HOST:-db}
DB_NAME=${DB_NAME:-keynest_db}
DB_USER=${DB_USER:-keynest_user}
BACKUP_DIR=${BACKUP_DIR:-/backups}
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/keynest_backup_${DATE}.sql.gz"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}"
echo "User: ${DB_USER}"
echo "Backup file: ${BACKUP_FILE}"

# Create database dump
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --compress=9 \
    | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully: ${BACKUP_FILE}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"
    
    # Clean up old backups
    echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "keynest_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
    
    # List remaining backups
    echo "Current backups:"
    ls -lh "${BACKUP_DIR}"/keynest_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    
else
    echo "Database backup failed!"
    exit 1
fi

echo "Backup process completed."