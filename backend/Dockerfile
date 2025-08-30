# Multi-stage Docker build for production KeyNest backend

# Stage 1: Build stage with build dependencies
FROM python:3.11-slim-bullseye as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r /tmp/requirements.txt

# Stage 2: Production stage
FROM python:3.11-slim-bullseye as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=KeyNest.settings

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1000 keynest && \
    useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash keynest

# Copy virtual environment from builder stage
COPY --from=builder /venv /venv

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=keynest:keynest . /app/

# Create necessary directories
RUN mkdir -p /app/logs /app/static /app/media && \
    chown -R keynest:keynest /app/logs /app/static /app/media

# ---- Install production-only dependencies (as root, before dropping privileges) ----
RUN echo "gunicorn==21.2.0" >> /tmp/prod_requirements.txt && \
    echo "psycopg2-binary==2.9.7" >> /tmp/prod_requirements.txt && \
    pip install -r /tmp/prod_requirements.txt

# Switch to non-root user for runtime
USER keynest

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "sync", "--worker-connections", "1000", "--max-requests", "1000", "--max-requests-jitter", "50", "--preload", "--access-logfile", "-", "--error-logfile", "-", "KeyNest.wsgi:application"]