# 🚀 Swim Academy Pro - Deployment Guide

Welcome! This guide helps you deploy the Swim Academy Pro application anywhere for free.

## ⚡ Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended - Easiest)

**Requirements:**
- Docker and Docker Compose installed
- 2GB RAM available
- Internet connection

**Steps:**

1. Clone/Download the project
```bash
cd your-project-directory
```

2. Copy environment file
```bash
cp .env.example .env
```

3. Edit `.env` file (optional, defaults work for local development):
```bash
# Change these for production:
JWT_SECRET=your-new-secure-key-here
SESSION_SECRET=your-session-secret-here
# Optional: Add email, Google OAuth, Cloudinary credentials
```

4. Start the application
```bash
docker-compose up -d
```

5. Wait for services to start (30-60 seconds)
```bash
docker-compose logs -f backend
```

6. Access the application
- **Web App:** http://localhost:5000
- **API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health
- **MongoDB:** localhost:27017 (credentials: root/password123)
- **Redis:** localhost:6379

✅ **Done!** Your app is running.

---

## 🛑 Stop & Clean Up

```bash
# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs redis
```

---

## 🌍 Deploy to Cloud Providers (Free/Cheap Options)

### Option 2A: Railway.app (Free Tier Available)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your repo
5. Create MongoDB service
6. Create Redis service
7. Create Node.js app from the repository
8. Set environment variables from `.env.example`
9. Deploy!

**Cost:** Free tier available ($5/month credits)

### Option 2B: Render.com (Free Tier)

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repo
4. Select Node.js environment
5. Build: `npm install`
6. Start: `node server.js`
7. Add MongoDB and Redis services
8. Deploy!

**Cost:** Free tier available (limited)

### Option 2C: Heroku Alternative - Fly.io

1. Go to https://fly.io
2. Install flyctl CLI
3. Run:
```bash
flyctl launch
flyctl deploy
```

4. Add MongoDB and Redis services

**Cost:** Free tier with limitations

### Option 2D: AWS Free Tier (1 Year Free)

1. Create AWS account
2. Use EC2 t2.micro instance (free tier)
3. Install Docker
4. Clone your repo
5. Run Docker Compose

**Cost:** Free for 1 year (t2.micro)

### Option 2E: DigitalOcean ($4-5/month)

1. Create DigitalOcean account
2. Use Droplet (smallest: $4/month)
3. Install Docker
4. Run Docker Compose

**Cost:** $4-6/month

### Option 2F: Vercel (Web Frontend Only)

For just the React frontend:
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set build: `npm run build` in `web/` directory
4. Deploy!

**Cost:** Free

---

## 🔧 Manual Deployment (Advanced)

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- Redis 7.0+
- Git

### Installation Steps

1. **Clone repository**
```bash
git clone <your-repo-url>
cd project-directory
```

2. **Install dependencies**
```bash
# Backend
npm install

# Frontend (React)
cd web
npm install
cd ..
```

3. **Build frontend**
```bash
cd web
npm run build
cd ..
```

4. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB and Redis URLs
```

5. **Start services**

For development:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend (if needed for development)
cd web && npm run dev
```

For production:
```bash
NODE_ENV=production npm start
```

---

## 🔐 Production Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Update MongoDB password from default `password123`
- [ ] Setup HTTPS/SSL certificate
- [ ] Enable CORS properly (don't use localhost)
- [ ] Configure email service (Gmail, SendGrid, etc.)
- [ ] Setup daily backups
- [ ] Enable rate limiting
- [ ] Setup monitoring/logging
- [ ] Disable debug mode
- [ ] Update default admin credentials

---

## 📊 Environment Variables Explained

### Critical Variables
```
NODE_ENV=production        # development, production, test, staging
PORT=5000                  # Server port
MONGODB_URI=...           # MongoDB connection string
JWT_SECRET=...            # Secure random string for tokens
SESSION_SECRET=...        # Secure random string for sessions
```

### Optional but Recommended
```
EMAIL_USER=...            # Gmail for sending emails
GOOGLE_CLIENT_ID=...      # Google OAuth
CLOUDINARY_*=...          # Image hosting
REDIS_URL=...             # Cache service
```

### Generate Secure Secrets
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((Get-Random -Count 32))
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
# Linux/Mac
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# View MongoDB logs
docker-compose logs mongodb
```

### Frontend not loading
```bash
# Rebuild frontend
cd web && npm run build

# Check if static files exist
ls -la public/

# Restart backend
docker-compose restart backend
```

### Out of Memory
Increase Docker memory allocation in Docker Desktop settings.

---

## 📈 Scaling Tips

For high traffic:

1. **Use CDN** (Cloudflare - free tier)
2. **Database optimization** - Add indexes
3. **Caching** - Redis is already configured
4. **Load balancing** - Use Nginx reverse proxy
5. **Horizontal scaling** - Run multiple backend instances

---

## 🔄 Backup & Recovery

### Automated Backups
```bash
npm run db:backup
```

### Manual MongoDB Backup
```bash
# Using mongodump
mongodump --uri="mongodb://root:password123@localhost:27017/swim-academy?authSource=admin" --out=./backup
```

### Restore
```bash
mongorestore --uri="mongodb://root:password123@localhost:27017" ./backup
```

---

## 📞 Support

For issues:

1. Check logs: `docker-compose logs -f`
2. Check GitHub issues
3. Email: support@swimacademy.com
4. Common issues: See Troubleshooting section

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [MongoDB Deployment](https://docs.mongodb.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express Deployment](https://expressjs.com/en/advanced/best-practice-security.html)

---

## ✅ Deployment Checklist

- [ ] Docker installed and running
- [ ] Environment variables configured
- [ ] `.env` file created from `.env.example`
- [ ] `docker-compose up -d` executed
- [ ] All services healthy (`docker-compose ps`)
- [ ] Application accessible at localhost:5000
- [ ] API working (`/api/status`)
- [ ] MongoDB and Redis connected
- [ ] Security variables changed for production

---

**You're all set! Your Swim Academy Pro application is ready to use.** 🎉
