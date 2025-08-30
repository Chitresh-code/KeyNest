# Getting Started with KeyNest

[Docs Home](index.md)

Welcome to KeyNest! This guide will help you get up and running with secure environment variable management in just a few minutes.

## 🚀 Quick Setup

### Option 1: Docker (Recommended)

The fastest way to get KeyNest running is with Docker:

1. **Prerequisites**
   - Docker Desktop or Docker Engine
   - Docker Compose
   - 4GB+ RAM available

2. **Clone and Start**
   ```bash
   # Clone the repository
   git clone https://github.com/keynest/keynest.git
   cd keynest

   # Start backend services
   cd backend
   docker compose -f docker-compose.dev.yml up -d

   # Start frontend (in a new terminal)
   cd ../frontend
   npm install
   npm run dev
   ```

3. **Access KeyNest**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/api/

### Option 2: Local Development

For development or if you prefer not to use Docker:

1. **Prerequisites**
   - Python 3.11+
   - Node.js 18+
   - PostgreSQL 14+
   - Redis 7+

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Start server
   python manage.py runserver 8001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Set up environment
   cp .env.local.example .env.local
   # Edit .env.local if needed
   
   # Start development server
   npm run dev
   ```

## 👤 First Steps

### 1. Create Your Account

1. Visit http://localhost:3000
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in your details:
   - Username
   - Email address
   - Password (min 8 characters)
   - First and Last name
4. Click **"Create Account"**

Your first organization will be created automatically!

### 2. Create Your First Project

1. After signing in, go to **Projects**
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: e.g., "My Web App"
   - **Description**: Brief description of your project
   - **Organization**: Select your organization
4. Click **"Create Project"**

### 3. Set Up Environments

1. Click on your new project
2. Click **"New Environment"**
3. Create environments for your workflow:
   - **development** (for local development)
   - **staging** (for testing)
   - **production** (for live deployment)

### 4. Add Environment Variables

1. Click on an environment (e.g., "development")
2. Click **"Add Variable"**
3. Add your first variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://user:pass@localhost/myapp_dev`
4. Click **"Create Variable"**

---

Previous: index.md | Next: user-guide.md

## 🔑 Key Concepts

### Organizations
- **Purpose**: Group users and projects together
- **Roles**: Admin, Editor, Viewer
- **Use Case**: Company, team, or personal workspace

### Projects
- **Purpose**: Organize related environments
- **Examples**: "Web App", "Mobile API", "Analytics Service"
- **Contains**: Multiple environments (dev, staging, prod)

### Environments
- **Purpose**: Separate configurations for different deployment stages
- **Types**: Development, Staging, Production, Testing
- **Contains**: Environment variables specific to that stage

### Variables
- **Purpose**: Store configuration values securely
- **Encryption**: All values encrypted with AES-256
- **Access**: Role-based viewing and editing

## 🔒 Security Best Practices

### Strong Passwords
```bash
# Good password examples
MyS3cur3P@ssw0rd!2024
K3yN3st_S3cur3_2024
Dev3l0per#S3cur1ty!
```

### Variable Naming
```bash
# Follow these conventions
DATABASE_URL          # ✅ Good
API_KEY              # ✅ Good
JWT_SECRET           # ✅ Good

database_url         # ❌ Avoid lowercase
apiKey              # ❌ Avoid camelCase
api-key             # ❌ Avoid hyphens
```

### Secret Values
```bash
# Examples of what to store in KeyNest
DATABASE_URL=postgresql://...
API_KEY=sk_live_abcd1234...
JWT_SECRET=your-random-secret
REDIS_URL=redis://...
SMTP_PASSWORD=your-email-password

# What NOT to store
PUBLIC_API_URL=https://api.example.com  # Public URLs
APP_NAME=MyApp                          # Non-sensitive config
PORT=3000                               # Port numbers
```

## 📥 Import/Export

### Import from .env File

1. Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://localhost/myapp
   API_KEY=your-api-key-here
   JWT_SECRET=your-jwt-secret
   ```

2. In KeyNest:
   - Go to your environment
   - Click **"Actions" → "Import from .env"**
   - Select your `.env` file
   - Review and confirm import

### Export to .env File

1. In your environment:
   - Click **"Actions" → "Export to .env"**
   - File downloads automatically
   - Use in your application

## 🔧 Integration Examples

### Node.js/Express

```javascript
// Install dotenv: npm install dotenv
require('dotenv').config();

const express = require('express');
const app = express();

// Use environment variables
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Python/Django

```python
# settings.py
import os
from pathlib import Path

# Load from .env file
from dotenv import load_dotenv
load_dotenv()

# Use environment variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

SECRET_KEY = os.environ.get('SECRET_KEY')
```

### Next.js

```javascript
// next.config.js
module.exports = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY: process.env.API_KEY,
  },
}

// In your application
export default function MyComponent() {
  const apiKey = process.env.API_KEY;
  // Use the API key...
}
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

# Copy environment file
COPY .env .env

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app
COPY . .

# Start app
CMD ["npm", "start"]
```

## 🌐 Team Collaboration

### Adding Team Members

1. Go to **Organization Settings**
2. Click **"Invite Members"**
3. Enter email addresses
4. Assign roles:
   - **Admin**: Full access, can manage users
   - **Editor**: Can create/edit projects and variables
   - **Viewer**: Read-only access

### Role Permissions

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View variables | ✅ | ✅ | ✅ |
| Create variables | ✅ | ✅ | ❌ |
| Edit variables | ✅ | ✅ | ❌ |
| Delete variables | ✅ | ✅ | ❌ |
| Create projects | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Organization settings | ✅ | ❌ | ❌ |

### Best Practices for Teams

1. **Use descriptive names** for projects and environments
2. **Document variables** with clear descriptions
3. **Regular access reviews** - remove unused accounts
4. **Separate environments** - don't mix dev/prod variables
5. **Use least privilege** - assign minimum required roles

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to database**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U keynest -d keynest
```

**Redis connection failed**
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

**Frontend won't start**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Variables not showing**
- Check your role permissions
- Verify you're in the correct organization
- Try refreshing the page

**Import failed**
- Check file format (should be `.env`)
- Verify variable names (use UPPERCASE_SNAKE_CASE)
- Check for special characters in values

### Getting Help

1. **Documentation**: Check our [User Guide](user-guide.md)
2. **GitHub Issues**: [Report bugs or request features](https://github.com/keynest/keynest/issues)
3. **Community**: Join our [GitHub Discussions](https://github.com/keynest/keynest/discussions)
4. **Security**: Email security@keynest.dev for security issues

## 🎯 What's Next?

Now that you're set up with KeyNest:

1. **Explore Features**: Try import/export, team collaboration
2. **Integrate**: Connect KeyNest to your applications
3. **Secure**: Review our [Security Guide](security.md)
4. **Deploy**: Check out our [Deployment Guide](deployment.md)
5. **Contribute**: Read our [Contributing Guide](../CONTRIBUTING.md)

---

**Need help?** Join our community or open an issue - we're here to help! 🚀
