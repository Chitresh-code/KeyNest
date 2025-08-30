# 🔐 KeyNest Backend

KeyNest is a production-ready developer tool for securely storing, managing, and sharing environment (.env) files across projects and platforms. This backend API provides comprehensive environment variable management with enterprise-grade security.

## 🚀 Features

### 🔑 Core Features

- **Secure Environment Management**: AES-256 encrypted storage of environment variables
- **Team Collaboration**: Organization-based access control with role management
- **Multi-Environment Support**: Separate configurations for dev, staging, and production
- **Advanced Import/Export**: Multi-format support (.env, JSON, YAML) with conflict resolution
- **File Upload Support**: Drag-and-drop file uploads with 10MB limit
- **Batch Operations**: Atomic transactions for bulk variable operations
- **Version Control**: Track changes and rollback capabilities (ready for implementation)
- **Audit Logging**: Complete activity tracking for compliance and security

### 🛡️ Security Features

- **Encryption at Rest**: All sensitive data encrypted with Fernet (AES-256)
- **Role-Based Access Control**: Admin, Editor, and Viewer roles
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **JWT Authentication**: Secure token-based authentication
- **Comprehensive Audit Logs**: Track all user activities
- **Input Validation**: Sanitization and validation of all inputs
- **CORS Protection**: Configurable cross-origin resource sharing

### 🏗️ Production Ready

- **Scalable Architecture**: Built with Django REST Framework
- **Database Agnostic**: Supports PostgreSQL, MySQL, SQLite
- **Comprehensive Logging**: Structured logging with security focus
- **Health Checks**: Load balancer compatible endpoints
- **Environment Configuration**: 12-factor app compliance
- **Docker Ready**: Containerization support

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 13+ (recommended) or SQLite for development
- Redis (optional, for caching and sessions)

## 🛠️ Installation

### Quick Start with Docker (Recommended)

The fastest way to get KeyNest running is with Docker:

```bash
# Navigate to backend directory
cd backend

# Start development environment with Docker
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
docker-compose -f docker-compose.dev.yml exec api python manage.py migrate

# Create superuser (optional)
docker-compose -f docker-compose.dev.yml exec api python manage.py createsuperuser

# View logs
docker-compose -f docker-compose.dev.yml logs -f api
```

**Services available:**

- **API**: <http://localhost:8001>
- **Database**: localhost:5433 (keynest_dev/keynest_dev/dev_password)
- **Redis**: localhost:6380

### Docker Development with Admin Tools

For enhanced development experience with database and cache admin interfaces:

```bash
# Start with admin interfaces
docker-compose -f docker-compose.dev.yml --profile admin up -d

# Start with email testing (MailHog)
docker-compose -f docker-compose.dev.yml --profile mail up -d

# Start with all profiles
docker-compose -f docker-compose.dev.yml --profile admin --profile mail up -d
```

**Additional services:**

- **PgAdmin**: <http://localhost:8080> (<admin@keynest.dev>/admin123)
- **Redis Commander**: <http://localhost:8081>
- **MailHog**: <http://localhost:8025> (email testing)

### Manual Installation (Alternative)

If you prefer to run without Docker:

#### 1. Clone and Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv ../env
source ../env/bin/activate  # On Windows: ..\env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# REQUIRED: Set SECRET_KEY and ENCRYPTION_KEY
nano .env
```

#### 3. Generate Encryption Key

```bash
# Generate a secure encryption key
python -c "from cryptography.fernet import Fernet; print(f'ENCRYPTION_KEY={Fernet.generate_key().decode()}')"
```

#### 4. Database Setup

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

#### 5. Start Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Docker Commands Reference

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View service status
docker-compose -f docker-compose.dev.yml ps

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs api
docker-compose -f docker-compose.dev.yml logs db
docker-compose -f docker-compose.dev.yml logs redis

# Execute commands in containers
docker-compose -f docker-compose.dev.yml exec api python manage.py shell
docker-compose -f docker-compose.dev.yml exec api python manage.py test
docker-compose -f docker-compose.dev.yml exec db psql -U keynest_dev -d keynest_dev

# Rebuild containers after code changes
docker-compose -f docker-compose.dev.yml build api
docker-compose -f docker-compose.dev.yml up -d api

# Clean up everything
docker-compose -f docker-compose.dev.yml down -v
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Core Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:pass@localhost/keynest

# Security
ENCRYPTION_KEY=your-fernet-key
JWT_SECRET_KEY=your-jwt-secret

# Rate Limiting
THROTTLE_ANON=100/hour
THROTTLE_USER=1000/hour
THROTTLE_AUTH=5/min
```

### Database Configuration

#### PostgreSQL (Recommended for Production)

```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

#### SQLite (Development)

```bash
DATABASE_URL=sqlite:///db.sqlite3
```

## 📚 API Documentation

### Base URL

```bash
http://localhost:8000/api/
```

### Authentication

All authenticated endpoints require an `Authorization` header:

```bash
Authorization: Token your-auth-token
```

### Core Endpoints

#### Authentication Endpoints

```bash
POST /api/auth/register/     # User registration
POST /api/auth/login/        # User login
POST /api/auth/logout/       # User logout
GET  /api/auth/profile/      # Get user profile
```

#### Organizations

```bash
GET    /api/organizations/           # List organizations
POST   /api/organizations/           # Create organization
GET    /api/organizations/{id}/      # Get organization
PUT    /api/organizations/{id}/      # Update organization
DELETE /api/organizations/{id}/      # Delete organization
```

#### Projects

```bash
GET    /api/projects/                # List projects
POST   /api/projects/                # Create project
GET    /api/projects/{id}/           # Get project
PUT    /api/projects/{id}/           # Update project
DELETE /api/projects/{id}/           # Delete project
```

#### Environments

```bash
GET    /api/environments/            # List environments
POST   /api/environments/            # Create environment
GET    /api/environments/{id}/       # Get environment
PUT    /api/environments/{id}/       # Update environment
DELETE /api/environments/{id}/       # Delete environment
GET    /api/environments/{id}/export/ # Export .env file
POST   /api/environments/{id}/import/ # Import .env file
```

#### Environment Variable Endpoints

```bash
GET    /api/variables/               # List variables
POST   /api/variables/               # Create variable
GET    /api/variables/{id}/          # Get variable
PUT    /api/variables/{id}/          # Update variable
DELETE /api/variables/{id}/          # Delete variable
```

#### Audit Logs

```bash
GET /api/audit-logs/                 # List audit logs
```

### Example Requests

#### Register User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

#### Create Project

```bash
curl -X POST http://localhost:8000/api/projects/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token your-auth-token" \
  -d '{
    "name": "My Web App",
    "description": "Production web application",
    "organization": 1
  }'
```

#### Export Environment

```bash
# Export as .env file (default)
curl -X GET http://localhost:8000/api/environments/1/export/ \
  -H "Authorization: Token your-auth-token"

# Export as JSON
curl -X GET http://localhost:8000/api/environments/1/export/?format=json \
  -H "Authorization: Token your-auth-token"

# Export as YAML
curl -X GET http://localhost:8000/api/environments/1/export/?format=yaml \
  -H "Authorization: Token your-auth-token"
```

#### Import Environment Variables

```bash
# Import from file upload
curl -X POST http://localhost:8000/api/environments/1/import/ \
  -H "Authorization: Token your-auth-token" \
  -F "file=@myapp.env" \
  -F "overwrite=true"

# Import from raw data
curl -X POST http://localhost:8000/api/environments/1/import/ \
  -H "Authorization: Token your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "DATABASE_URL=postgresql://localhost/db\nSECRET_KEY=mysecret",
    "format": "env",
    "overwrite": false
  }'

# Import JSON data
curl -X POST http://localhost:8000/api/environments/1/import/ \
  -H "Authorization: Token your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"DATABASE_URL\":\"postgresql://localhost/db\",\"SECRET_KEY\":\"mysecret\"}",
    "format": "json",
    "overwrite": true
  }'
```

## 🏗️ Database Schema

### Core Models

- **User**: Extended Django user with email authentication
- **Organization**: Team/company structure
- **OrganizationMembership**: Role-based access control
- **Project**: Container for environments
- **Environment**: Development stages (dev/staging/prod)
- **EnvVariable**: Encrypted environment variables
- **EnvVariableVersion**: Version history for rollback
- **AuditLog**: Complete activity tracking

### Relationships

```bash
Organization (1) --> (*) Project
Project (1) --> (*) Environment  
Environment (1) --> (*) EnvVariable
User (*) --> (*) Organization (through OrganizationMembership)
```

## 🔒 Security

### Encryption

- **Algorithm**: AES-256 via Fernet
- **Key Management**: Environment-based key storage
- **Data Protection**: All sensitive values encrypted at rest

### Access Control

- **Admin**: Full organization access
- **Editor**: Read/write access to projects and environments
- **Viewer**: Read-only access

### Rate Limiting

- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Authentication endpoints: 5 attempts/minute

### Security Headers

```python
# Automatically configured
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
```

## 📊 Monitoring & Logging

### Health Check Endpoint

```bash
GET /health/
```

### Log Files

- `logs/keynest.log` - Application logs
- `logs/security.log` - Security events

### Log Levels

```python
LOGGING = {
    'loggers': {
        'authentication': 'INFO',
        'core': 'INFO',
        'django.security': 'WARNING',
    }
}
```

## 🧪 Testing

### Docker Testing (Recommended)

Run tests in the containerized environment for consistency:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run Django unit tests in container
docker-compose -f docker-compose.dev.yml exec api python manage.py test

# Run specific app tests
docker-compose -f docker-compose.dev.yml exec api python manage.py test core
docker-compose -f docker-compose.dev.yml exec api python manage.py test authentication

# Run with coverage
docker-compose -f docker-compose.dev.yml exec api pip install coverage
docker-compose -f docker-compose.dev.yml exec api coverage run --source='.' manage.py test
docker-compose -f docker-compose.dev.yml exec api coverage report --show-missing

# Run comprehensive API integration tests
docker-compose -f docker-compose.dev.yml exec api python test_examples.py
```

### Manual Testing with Docker

```bash
# Access API shell for manual testing
docker-compose -f docker-compose.dev.yml exec api python manage.py shell

# Test database connectivity
docker-compose -f docker-compose.dev.yml exec api python manage.py dbshell

# Check migrations status
docker-compose -f docker-compose.dev.yml exec api python manage.py showmigrations

# Test import/export with sample file
echo "DATABASE_URL=postgresql://localhost/test" > sample.env
docker-compose -f docker-compose.dev.yml cp sample.env api:/app/
docker-compose -f docker-compose.dev.yml exec api curl -X POST http://localhost:8000/api/environments/1/import/ \
  -H "Authorization: Token your-token" \
  -F "file=@sample.env"
```

### Local Testing (Alternative)

If running without Docker:

```bash
# Run Django unit tests
python manage.py test

# Run specific app tests
python manage.py test core
python manage.py test authentication

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report --show-missing

# Start the development server
python manage.py runserver

# Run the comprehensive API test suite
python test_examples.py
```

The `test_examples.py` script provides:

- **User Registration & Authentication** testing
- **Organization, Project, Environment** management testing
- **Environment Variable** CRUD operations testing
- **Import/Export functionality** testing (all formats)
- **Permission and Security** validation
- **Audit Logging** verification
- **Error Handling** testing

### Manual Testing Examples

#### Test Import/Export Flow

```bash
# 1. Register and login
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}'

# 2. Get auth token from response and set it
export TOKEN="your-token-here"

# 3. Create a project
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test App","organization":1}'

# 4. Create an environment
curl -X POST http://localhost:8000/api/environments/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production","project":1,"environment_type":"production"}'

# 5. Import variables from file
curl -X POST http://localhost:8000/api/environments/1/import/ \
  -H "Authorization: Token $TOKEN" \
  -F "file=@sample.env" \
  -F "overwrite=true"

# 6. Export variables as JSON
curl -X GET http://localhost:8000/api/environments/1/export/?format=json \
  -H "Authorization: Token $TOKEN" \
  -o exported_vars.json
```

### Test Data

```bash
# Create superuser for admin access
python manage.py createsuperuser

# Load sample data (development only)
python manage.py loaddata fixtures/sample_data.json
```

## 🚀 Deployment

### Production Checklist

1. **Environment Configuration**

   ```bash
   DEBUG=False
   SECURE_SSL_REDIRECT=True
   SECURE_HSTS_SECONDS=31536000
   ```

2. **Database**
   - Use PostgreSQL
   - Configure connection pooling
   - Set up regular backups

3. **Security**
   - Generate new SECRET_KEY and ENCRYPTION_KEY
   - Configure CORS for frontend domain
   - Set up SSL/TLS certificates

4. **Performance**
   - Configure Redis for caching
   - Set up static file serving
   - Configure logging aggregation

### Docker Production Deployment

#### Quick Production Setup

```bash
# 1. Clone and configure
git clone <repository>
cd backend
cp .env.production .env.prod

# 2. Generate secure keys
python3 -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
# Update .env.prod with the generated key and other production settings

# 3. Start production stack
export $(cat .env.prod | xargs)
docker-compose --env-file .env.prod up -d

# 4. Initialize database
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py collectstatic --noinput
docker-compose exec api python manage.py createsuperuser

# 5. Verify deployment
curl http://localhost:8000/health/
```

#### Production Architecture

The production setup includes:

- **PostgreSQL**: Production database with connection pooling
- **Redis**: Caching and session storage
- **Nginx**: Reverse proxy with SSL termination and static files
- **KeyNest API**: Multi-worker Gunicorn setup
- **Automated Backups**: Daily database backups with retention

#### Scaling and Monitoring

```bash
# Scale API service
docker-compose up -d --scale api=3

# View service metrics
docker-compose exec nginx wget -qO- http://localhost/nginx-status

# Monitor logs
docker-compose logs -f api
docker-compose logs -f nginx

# Enable monitoring stack (optional)
docker-compose --profile monitoring up -d
# Access Prometheus: http://localhost:9090
# Access Loki: http://localhost:3100
```

For detailed deployment instructions, see [docker-deployment.md](docker-deployment.md).

### Environment Variables for Production

```bash
# Required
SECRET_KEY=production-secret-key
ENCRYPTION_KEY=production-encryption-key
DATABASE_URL=postgresql://user:pass@db:5432/keynest
ALLOWED_HOSTS=api.keynest.com

# Security
DEBUG=False
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Performance
CACHE_BACKEND=django.core.cache.backends.redis.RedisCache
CACHE_LOCATION=redis://redis:6379/1
```

## 🤝 Development

### Project Structure

```bash
backend/
├── KeyNest/           # Django project settings
│   ├── settings.py    # Main configuration
│   ├── urls.py        # URL routing
│   └── wsgi.py        # WSGI application
├── core/              # Core business logic
│   ├── models.py      # Database models
│   ├── views.py       # API endpoints
│   ├── serializers.py # Data validation
│   └── urls.py        # URL patterns
├── authentication/    # Authentication system
│   ├── views.py       # Auth endpoints
│   ├── serializers.py # Auth validation
│   └── urls.py        # Auth URLs
├── logs/              # Application logs
├── requirements.txt   # Python dependencies
└── manage.py          # Django CLI
```

### Code Style

- Follow PEP 8
- Use type hints where applicable
- Comprehensive docstrings
- 100% test coverage for critical paths

### Contributing

1. Fork the repository
2. Create feature branch
3. Write tests
4. Ensure all tests pass
5. Submit pull request

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error

```bash
# Check database credentials and connectivity
python manage.py dbshell
```

#### Encryption/Decryption Errors

```bash
# Verify ENCRYPTION_KEY is set correctly
python manage.py shell
>>> from django.conf import settings
>>> print(settings.ENCRYPTION_KEY)
```

#### Migration Issues

```bash
# Reset migrations (development only)
python manage.py migrate core zero
python manage.py makemigrations core
python manage.py migrate
```

#### Performance Issues

```bash
# Check database queries
python manage.py shell
>>> from django.db import connection
>>> print(len(connection.queries))
```

### Debug Mode

```bash
# Enable debug mode (development only)
DEBUG=True python manage.py runserver --settings=KeyNest.settings
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [API Docs](http://localhost:8000/api/)
- **Issues**: [GitHub Issues](https://github.com/your-org/keynest/issues)
- **Email**: <support@keynest.com>

## 🔄 Changelog

### v1.0.0 (Current)

- Initial release
- Core environment management
- User authentication and authorization
- Organization and project management
- Import/export functionality
- Comprehensive security features
- Production-ready deploymen
