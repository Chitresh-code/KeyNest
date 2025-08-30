# Backend Development Guide

[Docs Home](index.md)

This guide walks through local development for the Django/DRF backend, coding standards, and common commands.

---

## Prerequisites

- Python 3.11+
- PostgreSQL and Redis (or use Docker)

---

## Setup (Local)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8001
```

API: http://localhost:8001

---

## Setup (Docker, Recommended)

```bash
cd backend
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec api python manage.py migrate
docker compose -f docker-compose.dev.yml logs -f api
```

API: http://localhost:8001

---

## Key Components

- authentication/: user registration/login, JWT
- core/: organizations, projects, environments, variables, audit logs
- scripts/: DB init and backup scripts
- nginx/: reverse proxy config for production

---

## Testing

```bash
cd backend
python manage.py test

# With Docker
docker compose -f docker-compose.dev.yml exec api python manage.py test
```

---

## Configuration

See: configuration.md for a complete reference of environment variables.

---

## Useful Commands

```bash
# Django shell
python manage.py shell

# Create first migration if adding models
python manage.py makemigrations
python manage.py migrate

# Lint/format (if you add tools)
```

---

Previous: backup.md | Next: developer-frontend.md
