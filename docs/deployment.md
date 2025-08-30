# Deployment Guide

[Docs Home](index.md)

This guide covers production deployment of KeyNest using Docker Compose, with optional Nginx reverse proxy, health checks, and backup automation.

---

## Prerequisites

- Docker and Docker Compose v2+
- Public domain and DNS pointing to your host (for HTTPS)
- TLS certificates (self‑managed, ACME, or provided by your infra)

---

## Files and Layout

- Compose (prod): ../backend/docker-compose.yml
- Nginx config: ../backend/nginx/
- Optional SSL dir: ../backend/ssl
- API settings (env): ../backend/.env.production (example) or Compose .env

Compose uses variable expansion (e.g., ${SECRET_KEY}). Create a .env file next to docker-compose.yml or export variables in your shell.

---

## Configure Environment

Create ../backend/.env with strong values:

```
SECRET_KEY=change_this_secret_key_in_production
ENCRYPTION_KEY=<fernet_key_generated>
DB_PASSWORD=<strong_db_password>
ALLOWED_HOSTS=keynest.example.com,api.keynest.example.com
CORS_ALLOWED_ORIGINS=https://keynest.example.com,https://app.keynest.example.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
SENTRY_DSN=
LOG_LEVEL=INFO
```

Generate a Fernet key:

```
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Bring Up the Stack

From the backend directory:

```
cd backend
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
```

Run initial migrations (first deploy):

```
docker compose -f docker-compose.yml exec api python manage.py migrate --noinput
```

Create an admin user (optional):

```
docker compose -f docker-compose.yml exec api python manage.py createsuperuser
```

---

## TLS and Nginx

Place your certificates in ../backend/ssl and verify server_name and upstreams in ../backend/nginx/conf.d/.

Expose ports 80/443 on the host; Nginx routes to the API service and serves static/media volumes.

---

## Health Checks and Monitoring

- API health: http://<host>/health/ via Nginx
- Container healthchecks are defined for API and Nginx
- Optional profiles (monitoring): Loki and Prometheus are included; enable with:

```
docker compose -f docker-compose.yml --profile monitoring up -d
```

---

## Scaling and Updates

Scale API horizontally (stateless):

```
docker compose -f docker-compose.yml up -d --scale api=2
```

Zero‑downtime deploy (basic):

```
docker compose -f docker-compose.yml pull api
docker compose -f docker-compose.yml up -d api
docker compose -f docker-compose.yml exec api python manage.py migrate --noinput
```

---

## Hardening Checklist

- DEBUG=False everywhere
- Strong SECRET_KEY and ENCRYPTION_KEY
- Restrictive ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS
- Enforce HTTPS in Nginx; HSTS where appropriate
- Regular database backups (see ./backup.md)
- Limit exposed ports; use private bridge networks
- Log rotation and centralization (Loki/ELK)
- Enable Sentry (SENTRY_DSN) if used

---

## Verification

- API responds at /api/ and /health/
- Frontend configured with NEXT_PUBLIC_API_BASE_URL to your public API URL
- Static and media volumes mounted; Nginx serves them
- Backups scheduled or runnable on demand

---

Previous: configuration.md | Next: backup.md
