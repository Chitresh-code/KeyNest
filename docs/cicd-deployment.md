# KeyNest CI/CD Deployment Guide

## 🚀 Automated CI/CD Deployment

KeyNest features automatic deployment to EC2 using GitHub Actions. Every push to the `main` branch automatically deploys the latest version to your production server.

## 📋 Prerequisites

### 1. GitHub Repository Secrets

You need to configure the following secret in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `EC2_PRIVATE_KEY` | Contents of `keynest-prod-key.pem` file | Private key for EC2 SSH access |

#### How to get EC2_PRIVATE_KEY value:

```bash
# On your local machine, copy the entire contents of the key file:
cat keynest-prod-key.pem
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`) and paste it as the secret value.

### 2. EC2 Server Configuration

Your EC2 instance should have:
- ✅ Docker and docker-compose installed
- ✅ Git installed
- ✅ Port 8001 accessible (for API)
- ✅ SSH access enabled
- ✅ KeyNest repository cloned in `/home/ubuntu/KeyNest`

## 🔄 Deployment Process

### Automatic Deployment

The deployment triggers automatically when:
- Code is pushed to the `main` branch
- Changes are made to `backend/` directory
- Deployment workflow file is modified

### Manual Deployment

You can also trigger deployment manually:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy KeyNest Backend to EC2** workflow
3. Click **Run workflow**
4. Choose the branch and click **Run workflow**

## 📊 Deployment Pipeline Steps

1. **🔍 Checkout Code** - Downloads latest repository code
2. **🔐 Setup SSH** - Configures SSH access to EC2 instance  
3. **🧪 Test Connection** - Verifies SSH connectivity
4. **📦 Deploy Application**:
   - Stops existing containers gracefully
   - Creates backup of current version
   - Pulls latest changes from Git
   - Builds Docker images with no cache
   - Starts all services
   - Waits for services to be ready (up to 60s)
   - Performs health checks
5. **✅ Verify Deployment** - Checks API endpoint accessibility
6. **🧹 Cleanup** - Removes temporary files and unused Docker images

## 🏥 Health Checks

The deployment includes comprehensive health checks:

- **API Endpoint**: `GET http://13.203.105.44:8001/api/`
- **Database**: PostgreSQL connection test
- **Cache**: Redis connectivity test
- **Container Status**: All containers running and healthy

## 🔄 Rollback Strategy

If deployment fails:
1. **Automatic Backup**: Previous version is automatically backed up before deployment
2. **Error Detection**: Health checks detect failures
3. **Automatic Rollback**: System automatically reverts to last working version
4. **Notification**: GitHub Actions shows failure status and logs

## 📝 Deployment Logs

Monitor deployment progress in:
- **GitHub Actions**: Real-time deployment logs
- **EC2 Server**: `/home/ubuntu/KeyNest/backend/logs/`
- **Docker Logs**: `docker-compose logs -f`

## 🛠️ Manual Deployment Commands

If you need to deploy manually on the server:

```bash
# SSH to the server
ssh -i keynest-prod-key.pem ubuntu@13.203.105.44

# Navigate to project directory
cd /home/ubuntu/KeyNest

# Pull latest changes
git pull origin main

# Deploy using the script
cd backend
./scripts/deploy.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```
Permission denied (publickey)
```
**Solution**: Verify `EC2_PRIVATE_KEY` secret is correctly set with the full private key content.

#### 2. Health Check Failed
```
❌ Deployment verification failed! HTTP status: 000
```
**Solution**: 
- Check if containers are running: `docker ps`
- View API logs: `docker-compose logs api`
- Verify port 8001 is accessible

#### 3. Out of Disk Space
```
❌ Insufficient disk space!
```
**Solution**:
- Clean Docker images: `docker system prune -f`
- Remove old backups: `rm -rf /home/ubuntu/keynest-backups/keynest-*`

#### 4. Port Already in Use
```
ERROR: Port is already allocated
```
**Solution**:
- Stop existing containers: `docker-compose down`
- Check running processes: `sudo netstat -tlnp | grep :8001`

### Deployment Status Endpoints

- **API Health**: http://13.203.105.44:8001/api/
- **Admin Panel**: http://13.203.105.44:8001/admin/
- **Database**: Port 5433 (internal only)
- **Redis**: Port 6380 (internal only)

## 🔒 Security Considerations

- ✅ SSH key stored securely in GitHub Secrets
- ✅ Private key never exposed in logs
- ✅ Database credentials in environment variables
- ✅ Redis accessible only internally
- ✅ API behind firewall (configure security groups)
- ✅ Regular backup rotation (keeps last 5 versions)

---

**🎉 Your KeyNest backend is now configured for automatic deployment!** 

Every push to `main` branch will automatically deploy to your EC2 instance at `13.203.105.44:8001`.