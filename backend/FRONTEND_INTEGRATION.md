# KeyNest API - Frontend Integration Guide

This guide provides comprehensive information for integrating with the KeyNest API from frontend applications.

## API Overview

**Base URL:** `https://your-domain.com/api/`  
**Authentication:** JWT Bearer tokens  
**Content-Type:** `application/json`  

## Quick Start

### 1. Get API Configuration

```bash
GET /api/auth/config/
```

This endpoint returns all configuration needed for frontend integration, including:
- Available endpoints
- Authentication settings
- Feature flags
- Validation rules
- Rate limits

### 2. Health Check

```bash
GET /api/auth/status/
```

Returns API health status and user information (if authenticated).

## Authentication

### JWT Token Authentication

KeyNest uses JWT tokens for authentication with the following configuration:

- **Access Token Lifetime:** 1 hour
- **Refresh Token Lifetime:** 7 days
- **Token Rotation:** Enabled
- **Auto-refresh:** Supported

#### Headers
```bash
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout (blacklist tokens) |
| GET | `/api/auth/profile/` | Get user profile |

### OAuth Integration

#### Google OAuth
```javascript
// 1. Get Google access token from Google OAuth
// 2. Send to KeyNest API
POST /api/auth/oauth/google/
{
  "access_token": "google_access_token"
}
```

#### GitHub OAuth
```javascript
// 1. Get GitHub access token from GitHub OAuth
// 2. Send to KeyNest API
POST /api/auth/oauth/github/
{
  "access_token": "github_access_token"
}
```

## Core API Endpoints

### Organizations
```bash
GET    /api/core/organizations/           # List user's organizations
POST   /api/core/organizations/           # Create organization
GET    /api/core/organizations/{id}/      # Get organization details
PATCH  /api/core/organizations/{id}/      # Update organization
DELETE /api/core/organizations/{id}/      # Delete organization

# Organization Members
GET    /api/core/organizations/{id}/members/           # List members
POST   /api/core/organizations/{id}/invite_member/     # Send invitation
PATCH  /api/core/organizations/{id}/update_member_role/ # Update role
DELETE /api/core/organizations/{id}/remove_member/     # Remove member
```

### Projects
```bash
GET    /api/core/projects/               # List user's projects
POST   /api/core/projects/               # Create project
GET    /api/core/projects/{id}/          # Get project details
PATCH  /api/core/projects/{id}/          # Update project
DELETE /api/core/projects/{id}/          # Delete project
```

### Environments
```bash
GET    /api/core/environments/           # List environments
POST   /api/core/environments/           # Create environment
GET    /api/core/environments/{id}/      # Get environment details
PATCH  /api/core/environments/{id}/      # Update environment
DELETE /api/core/environments/{id}/      # Delete environment

# File Operations
GET    /api/core/environments/{id}/export/?format=env  # Export variables
POST   /api/core/environments/{id}/import/             # Import variables
```

### Environment Variables
```bash
GET    /api/core/variables/              # List variables
POST   /api/core/variables/              # Create variable
GET    /api/core/variables/{id}/         # Get variable details
PATCH  /api/core/variables/{id}/         # Update variable
DELETE /api/core/variables/{id}/         # Delete variable
```

## Request/Response Format

### Standard Response Structure
```json
{
  "data": {}, // Response data
  "message": "Success message", // Optional
  "timestamp": "2023-XX-XXTXX:XX:XX.XXXZ"
}
```

### Error Response Structure
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {}, // Detailed error information (optional)
  "timestamp": "2023-XX-XXTXX:XX:XX.XXXZ"
}
```

## Frontend Implementation Examples

### JavaScript/TypeScript

#### API Client Setup
```typescript
class KeyNestAPI {
  private baseURL = 'https://your-domain.com/api/';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      return this.request(endpoint, options);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request('auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access && response.refresh) {
      this.accessToken = response.access;
      this.refreshToken = response.refresh;
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
    }

    return response;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    const response = await fetch(`${this.baseURL}auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: this.refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.access;
      localStorage.setItem('access_token', data.access);
      return true;
    }

    return false;
  }
}
```

#### React Hook Example
```typescript
import { useState, useEffect } from 'react';

export function useKeyNestAPI() {
  const [api] = useState(() => new KeyNestAPI());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      api.accessToken = token;
      api.refreshToken = localStorage.getItem('refresh_token');
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await api.request('auth/profile/');
      setUser(profile.user);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return { api, user, loading };
}
```

### Vue.js Plugin Example
```typescript
// plugins/keynest.ts
export default {
  install(app: App) {
    const api = new KeyNestAPI();
    app.config.globalProperties.$keynest = api;
    app.provide('keynest', api);
  }
};
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Rate Limiting
- **Authenticated users:** 1000 requests/hour
- **Anonymous users:** 100 requests/hour
- **OAuth endpoints:** 50 requests/minute

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies recommended)
3. **Implement token refresh** automatically
4. **Handle authentication errors** gracefully
5. **Validate user input** on frontend and rely on backend validation
6. **Use environment variables** for sensitive configuration

## CORS Configuration

The API supports CORS with the following default origins:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)
- Production domains

## WebSocket Support

WebSocket support is planned but not currently implemented. Use HTTP polling for real-time updates.

## Support

For integration support or questions:
1. Check the `/api/auth/status/` endpoint for system status
2. Review error messages in API responses
3. Check browser network tab for detailed request/response information

## Example Frontend Applications

### React + TypeScript + Axios
```bash
# Install dependencies
npm install axios @types/node

# Environment variables (.env.local)
REACT_APP_API_URL=https://your-domain.com/api/
REACT_APP_ENABLE_OAUTH=true
```

### Vue.js + Composition API
```bash
# Install dependencies
npm install @vueuse/core pinia

# Environment variables (.env.local)
VITE_API_URL=https://your-domain.com/api/
VITE_ENABLE_OAUTH=true
```

---

This integration guide should provide everything needed to successfully connect your frontend application to the KeyNest API. The API is designed to be frontend-agnostic and supports modern web development practices.