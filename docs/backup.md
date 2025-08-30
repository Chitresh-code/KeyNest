# Backup & Recovery

[Docs Home](index.md)

KeyNest includes a portable backup script and a Docker Compose profile for automated database backups. This playbook explains how to run backups, verify them, and restore.

---

## Backup Options

1) One‑off using the script inside a Postgres container

- Script: ../backend/scripts/backup.sh (uses pg_dump with custom format, gzipped)
- Output: ../backend/backups/keynest_backup_YYYYMMDD_HHMMSS.sql.gz

2) Using the Compose backup profile (recommended)

- Service name: backup (profile "backup") in ../backend/docker-compose.yml

---

## Run a Backup (Compose)

From the backend directory:

```bash
cd backend
docker compose -f docker-compose.yml --profile backup up --abort-on-container-exit backup
```

Environment the backup job uses:

- DB_HOST: defaults to db
- DB_NAME: defaults to keynest_db
- DB_USER: defaults to keynest_user
- PGPASSWORD: sourced from ${DB_PASSWORD}
- BACKUP_DIR: defaults to /backups (mapped to ./backups)
- RETENTION_DAYS: defaults to 30

Artifacts are written under ./backups.

---

## Verify Backups

- Ensure a new file appears in ./backups after each run
- Record the size and timestamp; compare against previous runs
- Optionally list the dump contents with pg_restore -l

```bash
gunzip -c ./backups/keynest_backup_YYYYMMDD_HHMMSS.sql.gz | head -n 30
```

---

## Restore Procedure

The script produces a custom‑format dump piped through gzip. To restore:

1) Prepare database (drop/create as necessary)

```bash
docker compose -f docker-compose.yml exec db psql -U keynest_user -c "DROP DATABASE IF EXISTS keynest_db;"
docker compose -f docker-compose.yml exec db psql -U keynest_user -c "CREATE DATABASE keynest_db;"
```

2) Restore with pg_restore

```bash
zcat ./backups/keynest_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.yml exec -T db \
  pg_restore -U keynest_user -d keynest_db --clean --if-exists --verbose
```

3) Run migrations (to align with current code)

```bash
docker compose -f docker-compose.yml exec api python manage.py migrate --noinput
```

---

## Scheduling

Use cron or your orchestrator to run the backup profile on a schedule, e.g. hourly or nightly:

```bash
# Run daily at 01:30
30 1 * * * cd /path/to/backend && docker compose -f docker-compose.yml --profile backup up --abort-on-container-exit backup >> /var/log/keynest-backups.log 2>&1
```

Ensure retention is configured (RETENTION_DAYS) and logs are rotated.

---

## Disaster Recovery Checklist

- Off‑site or multi‑region backup storage
- Periodic restore drills to a staging environment
- Documented RPO/RTO targets and procedures
- Automated alerts for backup failures and size anomalies

---

Previous: deployment.md | Next: developer-backend.md
