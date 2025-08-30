# KeyNest User Guide

[Docs Home](index.md)

This comprehensive guide covers all features and functionality of KeyNest, from basic usage to advanced team collaboration.

## 📋 Table of Contents

- [Dashboard Overview](#dashboard-overview)
- [Organizations](#organizations)
- [Projects Management](#projects-management)
- [Environments](#environments)
- [Variables Management](#variables-management)
- [Import/Export](#importexport)
- [Team Collaboration](#team-collaboration)
- [Security Features](#security-features)
- [API Usage](#api-usage)
- [Best Practices](#best-practices)

## 🏠 Dashboard Overview

The KeyNest dashboard is your central hub for managing environment variables across all your projects.

### Main Navigation

- **Dashboard**: Overview of your projects and recent activity
- **Projects**: Manage your applications and their environments
- **Settings**: Organization and user preferences (coming soon)

### Dashboard Widgets

1. **Projects Summary**: Total projects and environments
2. **Recent Activity**: Latest changes to variables and environments
3. **Quick Actions**: Fast access to create new projects
4. **Team Activity**: What your team members are working on

## 🏢 Organizations

Organizations are the top-level containers that group users, projects, and environments together.

### Creating an Organization

When you first sign up, an organization is automatically created for you:
- **Name**: "{Your Name}'s Organization"
- **Role**: You become the Admin
- **Access**: Full control over the organization

### Organization Roles

| Role | Permissions |
|------|-------------|
| **Admin** | • Full access to all projects and environments<br>• Can invite/remove users<br>• Can change user roles<br>• Can delete the organization |
| **Editor** | • Can create, edit, and delete projects<br>• Can manage all environment variables<br>• Cannot manage users or organization settings |
| **Viewer** | • Read-only access to projects and environments<br>• Can view variable keys but not values<br>• Cannot create or modify anything |

### Managing Organization Members

**Inviting Members** (Admin only):
1. Go to Organization Settings
2. Click "Invite Members"
3. Enter email addresses (one per line)
4. Select default role
5. Send invitations

**Changing Roles** (Admin only):
1. Go to Organization Settings
2. Find the user in the members list
3. Click the role dropdown
4. Select new role
5. Changes take effect immediately

**Removing Members** (Admin only):
1. Go to Organization Settings
2. Find the user in the members list
3. Click "Remove"
4. Confirm the action

## 📁 Projects Management

Projects organize your applications and their associated environments.

### Creating Projects

1. **Navigate to Projects**: Click "Projects" in the main navigation
2. **Click "New Project"**: Blue button in the top-right
3. **Fill Project Details**:
   - **Name**: Descriptive name (e.g., "E-commerce API")
   - **Description**: Brief explanation of the project
   - **Organization**: Select which organization owns this project
4. **Create**: Click "Create Project"

### Project Information

Each project displays:
- **Name and Description**: What this project is for
- **Organization**: Which organization it belongs to
- **Environment Count**: Number of environments in this project
- **Created Date**: When the project was created
- **Created By**: Who created the project

### Project Actions

**Edit Project**:
1. Click the settings icon (⚙️) on a project card
2. Select "Edit"
3. Modify name or description
4. Save changes

**Delete Project**:
1. Click the settings icon (⚙️) on a project card
2. Select "Delete"
3. Type the project name to confirm
4. Confirm deletion

⚠️ **Warning**: Deleting a project removes all environments and variables. This cannot be undone.

## 🌍 Environments

Environments represent different stages of your application deployment.

### Environment Types

- **Development**: Local development and testing
- **Staging**: Pre-production testing and QA
- **Production**: Live application serving users
- **Testing**: Automated testing and CI/CD

### Creating Environments

1. **Click on a Project**: Go to the project detail page
2. **Click "New Environment"**: Green button in the environments section
3. **Fill Environment Details**:
   - **Name**: Environment identifier (e.g., "production")
   - **Type**: Select from dropdown (development, staging, production, testing)
   - **Description**: Optional details about this environment
4. **Create**: Click "Create Environment"

### Environment Naming Conventions

```bash
# Good environment names
production          # ✅ Clear and standard
staging            # ✅ Widely understood
development        # ✅ Self-explanatory
testing            # ✅ Purpose is clear

# Avoid these
prod               # ❌ Unclear abbreviation
env1               # ❌ Non-descriptive
john-dev           # ❌ Person-specific
temp               # ❌ Unclear purpose
```

### Environment Management

**Edit Environment**:
1. Click settings icon on environment card
2. Select "Edit"
3. Modify name, type, or description
4. Save changes

**Delete Environment**:
1. Click settings icon on environment card
2. Select "Delete" 
3. Confirm deletion

⚠️ **Warning**: Deleting an environment removes all its variables.

## 🔑 Variables Management

Environment variables are key-value pairs that configure your applications.

### Adding Variables

1. **Navigate to Environment**: Click on an environment
2. **Click "Add Variable"**: Green button above the variables table
3. **Enter Variable Details**:
   - **Key**: Variable name (UPPERCASE_SNAKE_CASE recommended)
   - **Value**: The secret or configuration value
4. **Create**: Click "Create Variable"

### Variable Key Guidelines

```bash
# Recommended format: UPPERCASE_SNAKE_CASE
DATABASE_URL         # ✅ Database connection string
API_KEY             # ✅ External service API key
JWT_SECRET          # ✅ Token signing secret
REDIS_URL           # ✅ Cache connection string
EMAIL_PASSWORD      # ✅ SMTP password

# Avoid these formats
databaseUrl         # ❌ camelCase
database-url        # ❌ kebab-case
DatabaseURL         # ❌ PascalCase
database_url        # ❌ lowercase
```

### Variable Value Examples

```bash
# Database connections
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MONGODB_URI=mongodb://user:pass@host:27017/database
REDIS_URL=redis://localhost:6379/0

# API keys and secrets
STRIPE_SECRET_KEY=sk_live_abcdef123456...
SENDGRID_API_KEY=SG.abcdef123456...
JWT_SECRET=your-super-secret-jwt-signing-key

# Service configurations  
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Application settings
APP_ENV=production
DEBUG=false
LOG_LEVEL=info
MAX_CONNECTIONS=100
```

### Variable Operations

**View Variables**:
- Variable values are hidden by default (shown as dots)
- Click the eye icon (👁️) to reveal values
- Click the copy icon (📋) to copy values to clipboard

**Edit Variables**:
1. Click settings icon (⚙️) in the variable row
2. Select "Edit"
3. Modify key or value
4. Save changes

**Delete Variables**:
1. Click settings icon (⚙️) in the variable row
2. Select "Delete"
3. Confirm deletion

### Search and Filter

**Search Variables**:
- Use the search box above the variables table
- Searches both keys and values
- Real-time filtering as you type

**Filter by Environment**:
- Each environment has its own set of variables
- Switch between environments to see different variable sets

## 📥📤 Import/Export

KeyNest supports importing from and exporting to standard `.env` files.

### Importing Variables

**From .env File**:
1. **Navigate to Environment**: Go to the target environment
2. **Click "Actions"**: Button above variables table  
3. **Select "Import from .env"**: Choose this option
4. **Select File**: Choose your `.env` file
5. **Review**: Check the variables to be imported
6. **Confirm**: Click "Import" to add variables

**Supported .env Format**:
```env
# Comments are supported
DATABASE_URL=postgresql://localhost/myapp
API_KEY=your-api-key-here

# Quotes are optional but supported
JWT_SECRET="your-jwt-secret"
EMAIL_HOST='smtp.gmail.com'

# Multi-line values (use quotes)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

**Import Behavior**:
- **New variables**: Added to environment
- **Existing variables**: Updated with new values
- **Duplicates**: Existing values are overwritten
- **Invalid keys**: Skipped with error report

### Exporting Variables

**To .env File**:
1. **Navigate to Environment**: Go to source environment
2. **Click "Actions"**: Button above variables table
3. **Select "Export to .env"**: Choose this option
4. **Download**: File downloads automatically

**Export Format**:
```env
# Generated by KeyNest - Environment: production
# Project: My Web App
# Organization: Acme Corp
# Generated on: 2024-01-15 10:30:00 UTC

DATABASE_URL=postgresql://prod-db:5432/myapp
API_KEY=sk_live_abcdef123456
JWT_SECRET=super-secret-jwt-key
REDIS_URL=redis://prod-cache:6379/0
```

### Bulk Operations

**Import Multiple Environments**:
1. Create separate `.env` files for each environment:
   - `.env.development`
   - `.env.staging` 
   - `.env.production`
2. Import each file to its corresponding environment

**Export All Environments**:
1. Export each environment separately
2. Rename files appropriately
3. Use in your deployment pipeline

## 👥 Team Collaboration

KeyNest is designed for team collaboration with role-based access control.

### Collaboration Workflows

**Development Team Workflow**:
1. **Admin** creates projects and environments
2. **Editors** add and manage variables for their features
3. **Viewers** can see configurations without modification access
4. **All roles** can export variables for their local development

**DevOps Workflow**:
1. **Admin** manages production environments
2. **Editors** handle staging and development environments  
3. **Automated systems** export variables for deployment
4. **Audit logs** track all changes for compliance

### Sharing Best Practices

**For Development**:
```bash
# Share development variables freely
DATABASE_URL=postgresql://localhost/myapp_dev
API_KEY=test_key_development_only
DEBUG=true
LOG_LEVEL=debug
```

**For Production**:
```bash
# Restrict access to production secrets
DATABASE_URL=postgresql://prod-server/myapp
API_KEY=live_key_production_only
DEBUG=false
LOG_LEVEL=warn
```

### Activity Tracking

KeyNest automatically tracks:
- **Variable changes**: Who changed what and when
- **Environment creation**: New environments and their creators
- **Team member activity**: Login and access patterns
- **Export events**: When variables are downloaded

## 🔒 Security Features

KeyNest implements multiple layers of security to protect your sensitive data.

### Encryption

**Data at Rest**:
- All variable values encrypted with AES-256
- Encryption keys stored separately from data
- Database-level encryption for additional protection

**Data in Transit**:
- HTTPS/TLS encryption for all communications
- Secure API endpoints with authentication
- Encrypted database connections

### Authentication

**User Authentication**:
- Strong password requirements
- JWT token-based sessions
- Configurable session timeouts
- Account lockout after failed attempts

**API Authentication**:
- Bearer token authentication
- API key rotation (coming soon)
- Rate limiting to prevent abuse

### Access Control

**Role-Based Permissions**:
- Granular permissions per role
- Organization-level access control
- Project-specific permissions
- Environment-based restrictions

**Audit Logging**:
- Complete audit trail of all actions
- User identification for all changes
- Timestamp and IP address logging
- Export logs for compliance

### Security Best Practices

**For Users**:
1. **Use strong passwords**: 12+ characters with mixed case, numbers, symbols
2. **Enable 2FA**: When available (coming soon)
3. **Regular password changes**: Every 90 days for sensitive environments
4. **Review access regularly**: Remove unused team members

**For Organizations**:
1. **Principle of least privilege**: Assign minimum required roles
2. **Environment separation**: Keep dev/staging/prod variables separate
3. **Regular access audits**: Review who has access to what
4. **Incident response plan**: Know what to do if credentials are compromised

## 🔌 API Usage

KeyNest provides a comprehensive REST API for integration with your applications and CI/CD pipelines.

### Authentication

All API requests require authentication:

```bash
# Get your API token from the dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.keynest.dev/projects/
```

### Common API Endpoints

**List Projects**:
```bash
GET /api/projects/
Authorization: Bearer YOUR_TOKEN
```

**Get Environment Variables**:
```bash  
GET /api/environments/{env_id}/variables/
Authorization: Bearer YOUR_TOKEN
```

**Create Variable**:
```bash
POST /api/variables/
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "key": "NEW_API_KEY",
  "value": "secret-value",
  "environment": 123
}
```

**Export Environment**:
```bash
GET /api/environments/{env_id}/export/
Authorization: Bearer YOUR_TOKEN
Accept: text/plain
```

### CI/CD Integration

**GitHub Actions Example**:
```yaml
- name: Export KeyNest Variables
  run: |
    curl -H "Authorization: Bearer ${{ secrets.KEYNEST_TOKEN }}" \
         -o .env \
         https://api.keynest.dev/environments/123/export/
    
- name: Deploy with Variables
  run: docker deploy --env-file .env myapp
```

**Jenkins Example**:
```groovy
pipeline {
  stages {
    stage('Get Variables') {
      steps {
        sh '''
          curl -H "Authorization: Bearer ${KEYNEST_TOKEN}" \
               -o .env \
               https://api.keynest.dev/environments/123/export/
        '''
      }
    }
  }
}
```

## 💡 Best Practices

### Organization

**Project Structure**:
```
Organization: Acme Corp
├── Web Application
│   ├── development
│   ├── staging  
│   └── production
├── Mobile API
│   ├── development
│   ├── staging
│   └── production
└── Analytics Service
    ├── development
    └── production
```

**Naming Conventions**:
```bash
# Projects: Clear, descriptive names
"E-commerce Web App"     # ✅ Clear purpose
"User Authentication API" # ✅ Specific function
"Data Processing Service" # ✅ Self-explanatory

# Environments: Standard names
development, staging, production, testing  # ✅ Standard
dev, stage, prod, test                    # ✅ Acceptable abbreviations

# Variables: UPPERCASE_SNAKE_CASE
DATABASE_URL, API_KEY, JWT_SECRET         # ✅ Standard format
```

### Security

**Variable Classification**:
```bash
# High Security (Production secrets)
DATABASE_PASSWORD=***        # Restrict to Admin only
PAYMENT_API_KEY=***         # Critical for business
JWT_SIGNING_KEY=***         # Security-critical

# Medium Security (Service configs)  
REDIS_URL=***               # Important but less critical
EMAIL_API_KEY=***          # Operational impact

# Low Security (Public configs)
API_BASE_URL=https://...    # Public information
ENVIRONMENT=production      # Non-sensitive
```

**Access Management**:
1. **Regular reviews**: Audit access quarterly
2. **Offboarding**: Remove access immediately when team members leave
3. **Principle of least privilege**: Give minimum required access
4. **Environment separation**: Different access for dev/staging/prod

### Operational

**Change Management**:
1. **Document changes**: Use clear variable names and descriptions
2. **Test changes**: Always test in development first
3. **Staged rollouts**: Dev → Staging → Production
4. **Rollback plan**: Keep previous values for quick rollback

**Backup and Recovery**:
1. **Regular exports**: Export critical environments weekly
2. **Version control**: Store exports in secure version control
3. **Disaster recovery**: Test restoration procedures
4. **Multiple admins**: Ensure multiple people have admin access

**Monitoring**:
1. **Audit logs**: Review regularly for suspicious activity
2. **Access patterns**: Monitor for unusual access
3. **Change frequency**: Track how often variables change
4. **Failed attempts**: Monitor for brute force attempts

---

## 📞 Support

### Getting Help

1. **Documentation**: Start with this user guide
2. **Getting Started**: Check the [getting started guide](getting-started.md)
3. **API Reference**: See the [API documentation](api.md)
4. **GitHub Issues**: [Report bugs or request features](https://github.com/keynest/keynest/issues)
5. **Community**: [Join discussions](https://github.com/keynest/keynest/discussions)

### Feedback

We love hearing from our users! Please share:
- Feature requests
- Bug reports
- Usability feedback
- Integration ideas
- Success stories

**Contact us**:
- GitHub Issues: Technical problems and feature requests
- GitHub Discussions: Questions and community chat
- Email: support@keynest.dev for direct support

---

**Happy secret managing!** 🔐✨

---

Previous: getting-started.md | Next: api.md
