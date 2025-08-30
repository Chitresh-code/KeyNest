# Configuration Reference

[Docs Home](index.md)

Central reference for environment variables and configuration required by KeyNest. Use this with ./deployment.md and ./getting-started.md.

---

## Backend (.env)

Copy ../backend/.env.example to ../backend/.env and adjust values.

```
# Django
SECRET_KEY=your-secret-key-here-make-it-long-and-random
DEBUG=True                     # False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=keynest
DB_USER=keynest
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432
# Or use DATABASE_URL instead of the discrete settings

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=15          # minutes
JWT_REFRESH_TOKEN_LIFETIME=7          # days

# Encryption key (Fernet)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=your-fernet-encryption-key-here-32-characters

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Security (enable in prod)
# SECURE_SSL_REDIRECT=True
# SECURE_HSTS_SECONDS=31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS=True
# SECURE_HSTS_PRELOAD=True
# SESSION_COOKIE_SECURE=True
# CSRF_COOKIE_SECURE=True

# Logging
LOG_LEVEL=INFO

# Rate limiting
RATE_LIMIT_ENABLED=True

# Uploads
MAX_UPLOAD_SIZE=10485760
```

Notes:

- FERNET_KEY is required for encryption/decryption of variable values
- Use DEBUG=False and set ALLOWED_HOSTS in production
- Prefer DATABASE_URL in production; ensure TLS to DB if applicable

---

## Backend (Docker Compose variables)

Compose file ../backend/docker-compose.yml references variables via ${VAR}. Define them in ../backend/.env or your shell:

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

---

## Frontend (.env.local)

Expose API URL to the Next.js app:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

In production, point it at your public API gateway or Nginx:

```
NEXT_PUBLIC_API_BASE_URL=https://api.keynest.example.com
```

---

## Key Ports and URLs

- Frontend (dev): http://localhost:3000
- Backend API (dev): http://localhost:8001
- API Root: /api/
- Health: /health/

---

Previous: security.md | Next: deployment.md
