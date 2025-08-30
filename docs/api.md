# KeyNest API Documentation

[Docs Home](index.md)

This guide covers the KeyNest REST API for programmatic access to your environment variables and project management.

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Base URL & Versioning](#-base-url--versioning)
- [Response Format](#-response-format)
- [Rate Limiting](#-rate-limiting)
- [Error Handling](#-error-handling)
- [Authentication Endpoints](#-authentication-endpoints)
- [Organization Endpoints](#-organization-endpoints)
- [Project Endpoints](#-project-endpoints)
- [Environment Endpoints](#-environment-endpoints)
- [Variable Endpoints](#-variable-endpoints)
- [Import/Export Endpoints](#-importexport-endpoints)
- [Audit Log Endpoints](#-audit-log-endpoints)
- [Health and Status](#-health-and-status)
- [SDKs and Integrations](#-sdks-and-integrations)
- [Webhooks (Coming Soon)](#-webhooks-coming-soon)
- [Best Practices](#-best-practices)
- [API Support](#-api-support)

## 🔐 Authentication

KeyNest uses Token-based authentication for API access. Each user receives a unique token upon successful login that must be included in API requests.

### Getting Authentication Token

```bash
# Login to get authentication token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'

# Response
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe"
  }
}
```

### Using Authentication Token

Include the token in the `Authorization` header for all API requests:

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  http://localhost:8000/api/projects/
```

### Token Lifecycle

- **Token Lifetime**: Indefinite (until manually revoked)
- **Token Format**: 40-character hexadecimal string
- **Token Storage**: Store securely, never in plain text

## 🌐 Base URL & Versioning

**Base URL**: `http://localhost:8000` (Development) / `https://your-domain.com` (Production)

**Current Version**: `v1` (included in all endpoints)

**API Endpoints**: All endpoints are prefixed with `/api/`

**Full URL Format**: `http://localhost:8000/api/{endpoint}/` (Development)

## 📄 Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/projects/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "My Project",
      "created_at": "2025-08-30T10:30:00Z"
    }
  ]
}
```

### Single Resource Response

```json
{
  "id": 1,
  "name": "My Project",
  "description": "A sample project",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z"
}
```

### Error Response

```json
{
  "error": "Validation failed",
  "details": {
    "name": ["This field is required."],
    "email": ["Enter a valid email address."]
  }
}
```

## ⚡ Rate Limiting

API requests are rate limited to prevent abuse:

- **Authenticated Users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **Burst Limit**: 50 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "details": "Too many requests. Try again in 3600 seconds."
}
```

## 🚨 Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `204` | No Content | Request successful, no content returned |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details or field-specific errors",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-30T10:30:00Z"
}
```

## 🔑 Authentication Endpoints

### Register User

```http
POST /api/auth/register/
```

**Request Body**:

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword123",
  "confirm_password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201 Created):

```json
{
  "message": "User registered successfully",
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "date_joined": "2025-08-30T10:30:00Z"
  },
  "organization": {
    "id": 1,
    "name": "John's Organization"
  }
}
```

### Login User

```http
POST /api/auth/login/
```

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):

```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe"
  }
}
```

### Logout User

```http
POST /api/auth/logout/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "message": "Successfully logged out"
}
```

### Get User Profile

```http
GET /api/auth/profile/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "date_joined": "2025-08-30T10:30:00Z",
  "last_login": "2025-08-30T10:30:00Z",
  "is_active": true
}
```

## 🏢 Organization Endpoints

### List Organizations

```http
GET /api/organizations/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Acme Corp",
      "description": "Main company organization",
      "created_at": "2025-08-30T10:30:00Z",
      "updated_at": "2025-08-30T10:30:00Z",
      "member_count": 5,
      "project_count": 3,
      "user_role": "admin"
    }
  ]
}
```

### Get Organization

```http
GET /api/organizations/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "id": 1,
  "name": "Acme Corp",
  "description": "Main company organization",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "member_count": 5,
  "project_count": 3,
  "user_role": "admin"
}
```

### Create Organization

```http
POST /api/organizations/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body**:

```json
{
  "name": "New Organization",
  "description": "Description of the new organization"
}
```

**Response** (201 Created):

```json
{
  "id": 2,
  "name": "New Organization", 
  "description": "Description of the new organization",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "member_count": 1,
  "project_count": 0,
  "user_role": "admin"
}
```

## 📁 Project Endpoints

### List Projects

```http
GET /api/projects/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Query Parameters**:

- `organization` (optional): Filter by organization ID
- `search` (optional): Search project names and descriptions
- `page` (optional): Page number for pagination

**Example**:

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  "http://localhost:8000/api/projects/?organization=1&search=web"
```

**Response** (200 OK):

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Web Application",
      "description": "Main web application project",
      "organization": 1,
      "organization_name": "Acme Corp",
      "created_at": "2025-08-30T10:30:00Z",
      "updated_at": "2025-08-30T10:30:00Z",
      "created_by_name": "John Doe",
      "environment_count": 3
    }
  ]
}
```

### Get Project

```http
GET /api/projects/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "id": 1,
  "name": "Web Application",
  "description": "Main web application project",
  "organization": 1,
  "organization_name": "Acme Corp",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "created_by_name": "John Doe",
  "environment_count": 3
}
```

### Create Project

```http
POST /api/projects/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body**:

```json
{
  "name": "New Project",
  "description": "Project description",
  "organization": 1
}
```

**Response** (201 Created):

```json
{
  "id": 2,
  "name": "New Project",
  "description": "Project description", 
  "organization": 1,
  "organization_name": "Acme Corp",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "created_by_name": "John Doe",
  "environment_count": 0
}
```

### Update Project

```http
PATCH /api/projects/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body** (partial update):

```json
{
  "description": "Updated project description"
}
```

**Response** (200 OK):

```json
{
  "id": 2,
  "name": "New Project",
  "description": "Updated project description",
  "organization": 1,
  "organization_name": "Acme Corp",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T11:00:00Z",
  "created_by_name": "John Doe",
  "environment_count": 0
}
```

### Delete Project

```http
DELETE /api/projects/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (204 No Content)

## 🌍 Environment Endpoints

### List Environments

```http
GET /api/environments/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Query Parameters**:

- `project` (optional): Filter by project ID
- `environment_type` (optional): Filter by type (development, staging, production, testing)

### Get Project Environments

```http
GET /api/projects/{project_id}/environments/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "production",
      "project": 1,
      "project_name": "Web Application",
      "environment_type": "production",
      "description": "Production environment",
      "created_at": "2025-08-30T10:30:00Z",
      "updated_at": "2025-08-30T10:30:00Z",
      "created_by_name": "John Doe",
      "variable_count": 15
    }
  ]
}
```

### Create Environment

```http
POST /api/environments/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body**:

```json
{
  "name": "staging",
  "project": 1,
  "environment_type": "staging",
  "description": "Staging environment for testing"
}
```

**Response** (201 Created):

```json
{
  "id": 2,
  "name": "staging",
  "project": 1,
  "project_name": "Web Application",
  "environment_type": "staging",
  "description": "Staging environment for testing",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "created_by_name": "John Doe",
  "variable_count": 0
}
```

## 🔑 Variable Endpoints

### List Environment Variables

```http
GET /api/environments/{environment_id}/variables/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "key": "DATABASE_URL",
      "decrypted_value": "postgresql://user:pass@host/db",
      "environment": 1,
      "environment_name": "production",
      "created_at": "2025-08-30T10:30:00Z",
      "updated_at": "2025-08-30T10:30:00Z",
      "created_by_name": "John Doe"
    }
  ]
}
```

### Create Variable

```http
POST /api/variables/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body**:

```json
{
  "key": "API_KEY",
  "value": "sk_live_abcd1234567890",
  "environment": 1
}
```

**Response** (201 Created):

```json
{
  "id": 2,
  "key": "API_KEY",
  "decrypted_value": "sk_live_abcd1234567890",
  "environment": 1,
  "environment_name": "production",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T10:30:00Z",
  "created_by_name": "John Doe"
}
```

### Update Variable

```http
PATCH /api/variables/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Request Body**:

```json
{
  "value": "new_secret_value"
}
```

**Response** (200 OK):

```json
{
  "id": 2,
  "key": "API_KEY",
  "decrypted_value": "new_secret_value",
  "environment": 1,
  "environment_name": "production",
  "created_at": "2025-08-30T10:30:00Z",
  "updated_at": "2025-08-30T11:00:00Z",
  "created_by_name": "John Doe"
}
```

### Delete Variable

```http
DELETE /api/variables/{id}/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (204 No Content)

## 📥📤 Import/Export Endpoints

### Export Environment

```http
GET /api/environments/{environment_id}/export/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Response** (200 OK):

```env
# Generated by KeyNest - Environment: production
# Project: Web Application
# Organization: Acme Corp
# Generated on: 2025-08-30 10:30:00 UTC

DATABASE_URL=postgresql://user:pass@host/db
API_KEY=sk_live_abcd1234567890
JWT_SECRET=super_secret_jwt_key
```

### Import Environment

```http
POST /api/environments/{environment_id}/import/
```

**Headers**:

- `Authorization: Token YOUR_TOKEN_HERE`
- `Content-Type: multipart/form-data`

**Request Body** (form data):

```text
file: [.env file content]
```

**Example**:

```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -F "file=@.env" \
  http://localhost:8000/api/environments/1/import/
```

**Response** (200 OK):

```json
{
  "message": "Import completed successfully",
  "summary": {
    "imported": 5,
    "updated": 2,
    "failed": 0,
    "total_variables": 7
  },
  "failed_imports": null
}
```

## 📋 Audit Log Endpoints

### List Audit Logs

```http
GET /api/audit-logs/
```

**Headers**: `Authorization: Token YOUR_TOKEN_HERE`

**Query Parameters**:

- `user` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `target_type` (optional): Filter by resource type
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response** (200 OK):

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "action": "variable_created",
      "target_type": "variable",
      "target_id": 1,
      "details": {
        "variable_key": "API_KEY",
        "environment_name": "production"
      },
      "ip_address": "192.168.1.1",
      "timestamp": "2025-08-30T10:30:00Z"
    }
  ]
}
```

## 📊 Health and Status

### Health Check

```http
GET /health/
```

**Response** (200 OK):

```json
{
  "status": "healthy",
  "service": "KeyNest API",
  "version": "1.0.0"
}
```

### API Status

```http
GET /api/
```

**Response** (200 OK):

```json
{
  "message": "Welcome to KeyNest API",
  "version": "1.0.0",
  "endpoints": {
    "authentication": "/api/auth/",
    "projects": "/api/projects/",
    "health": "/health/",
    "admin": "/admin/"
  }
}
```

## 🔧 SDKs and Integrations

### Python SDK (Coming Soon)

```python
from keynest import KeyNestClient

# Initialize client
client = KeyNestClient(token="your_jwt_token")

# List projects
projects = client.projects.list()

# Get environment variables
variables = client.environments.variables(env_id=1)

# Create variable
client.variables.create(
    key="NEW_SECRET",
    value="secret_value",
    environment_id=1
)
```

### Node.js SDK (Coming Soon)

```javascript
const KeyNest = require('@keynest/sdk');

const client = new KeyNest({
  token: 'your_jwt_token'
});

// List projects
const projects = await client.projects.list();

// Get variables
const variables = await client.environments.variables(1);

// Create variable
await client.variables.create({
  key: 'NEW_SECRET',
  value: 'secret_value',
  environmentId: 1
});
```

### CLI Tool (Coming Soon)

```bash
# Install CLI
npm install -g @keynest/cli

# Configure
keynest config set-token your_jwt_token

# List projects
keynest projects list

# Get variables
keynest env export --environment-id=1 --output=.env

# Import variables
keynest env import --environment-id=1 --file=.env
```

## 🔄 Webhooks (Coming Soon)

Configure webhooks to receive notifications about KeyNest events:

```json
{
  "id": "webhook_123",
  "url": "https://your-app.com/webhooks/keynest",
  "events": ["variable.created", "variable.updated", "variable.deleted"],
  "secret": "webhook_secret_for_verification"
}
```

**Webhook Payload Example**:

```json
{
  "event": "variable.created",
  "timestamp": "2025-08-30T10:30:00Z",
  "data": {
    "variable": {
      "id": 1,
      "key": "NEW_SECRET",
      "environment_id": 1,
      "created_by": "john@example.com"
    }
  }
}
```

## 🔐 Best Practices

### Security

1. **Store tokens securely**: Never hardcode tokens in your application
2. **Use HTTPS**: Always use HTTPS for API requests
3. **Rotate tokens**: Regularly rotate authentication tokens
4. **Least privilege**: Use tokens with minimum required permissions
5. **Monitor usage**: Track API usage in audit logs

### Performance

1. **Pagination**: Use pagination for large datasets
2. **Filtering**: Use query parameters to filter results
3. **Caching**: Cache responses when appropriate
4. **Rate limiting**: Respect rate limits and implement exponential backoff

### Error Handling

```python
import requests

def make_api_request(url, headers, data=None):
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            # Handle authentication error
            refresh_token()
        elif e.response.status_code == 429:
            # Handle rate limiting
            time.sleep(60)
            return make_api_request(url, headers, data)
        else:
            # Handle other errors
            logger.error(f"API error: {e.response.text}")
            raise
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {e}")
        raise
```

---

## 📞 API Support

### Getting Help

- **API Issues**: [GitHub Issues](https://github.com/your-org/keynest/issues)
- **Integration Help**: [GitHub Discussions](https://github.com/your-org/keynest/discussions)
- **Documentation**: This guide and [User Guide](user-guide.md)

### API Updates

- **Breaking Changes**: Announced 30 days in advance
- **New Features**: Documented in changelog
- **Deprecations**: 6 months notice before removal

Stay updated with API changes by watching our [GitHub repository](https://github.com/your-org/keynest)!

---

**Happy coding with KeyNest API!** 🚀🔑

---

Previous: user-guide.md | Next: security.md
