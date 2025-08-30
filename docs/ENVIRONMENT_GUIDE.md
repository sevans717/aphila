# Environment Configuration Guide

## 🎯 Understanding Development, Staging, Production, Deployment & Publishing

### **1. Development Environment** 🛠️

**What it is:** Your local coding/testing playground

- **Purpose:** Write code, test features, debug issues
- **Users:** Only you (the developer)
- **Data:** Fake/test data, can be reset anytime
- **Settings:** Relaxed security, detailed logging, hot reload enabled
- **Example:** `http://localhost:3000` with debug tools visible

**Key Characteristics:**

- Fastest performance (no security overhead)
- Most permissive settings (allows localhost, high rate limits)
- Full debugging enabled
- Hot reload for instant code changes
- Local databases and services

### **2. Staging Environment** 🧪

**What it is:** Pre-production testing ground

- **Purpose:** Test with real data before going live
- **Users:** Your team + trusted testers
- **Data:** Copy of production data (anonymized)
- **Settings:** Production-like but with some debugging
- **Example:** `https://staging.aphila.io`

**Key Characteristics:**

- Mirrors production setup
- Uses real secrets (but limited permissions)
- Moderate security settings
- Used for final testing before deployment
- Can be reset/recreated from production backup

### **3. Production Environment** 🚀

**What it is:** The live app for real users

- **Purpose:** Serve your actual customers
- **Users:** Real customers paying for your service
- **Data:** Real customer data (GDPR compliant)
- **Settings:** Maximum security, performance optimized
- **Example:** `https://aphila.io`

**Key Characteristics:**

- Strictest security settings
- Optimized for performance and scalability
- Real payment processing
- Comprehensive monitoring and logging
- Backup and disaster recovery systems
- Compliance with data protection laws

---

## 📦 Deployment vs Publishing

### **Deployment** 📤

**What it is:** Moving your code to a server

- **Technical Process:** Copy files, configure servers, start services
- **Tools:** Docker, Kubernetes, AWS, DigitalOcean, etc.
- **Result:** Your app is running on a server somewhere

**Simple Analogy:** Like moving furniture into a house

- You pack everything up
- Transport it to the new location
- Unpack and arrange it
- Make sure everything works

### **Publishing** 🌐

**What it is:** Making your app discoverable to users

- **Business Process:** Domain setup, marketing, user acquisition
- **Tools:** Domain registrars, app stores, SEO, advertising
- **Result:** People can find and use your app

**Simple Analogy:** Like opening the house for visitors

- Put up a sign with the address
- List it in the phone book
- Tell friends about the new place
- Maybe advertise in the newspaper

---

## 🔄 Your Deployment Pipeline

```
Development → Staging → Production
     ↓           ↓           ↓
  localhost   staging.io   aphila.io
```

### **Current Setup:**

- **Development:** `.env.development` → `http://localhost:4000`
- **Staging:** `.env.staging` → `https://staging.aphila.io`
- **Production:** `.env.production` → `https://aphila.io`

---

## 🛠️ How to Switch Environments

### **Method 1: Manual Copy**

```bash
# For development
cp .env.development .env

# For staging
cp .env.staging .env

# For production
cp .env.production .env
```

### **Method 2: PowerShell Script**

```powershell
# Switch to any environment
.\switch-env.ps1 development
.\switch-env.ps1 staging
.\switch-env.ps1 production
```

---

## 🚀 Deployment Commands

### **Development (Local)**

```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Staging Deployment**

```bash
# Use staging environment
.\switch-env.ps1 staging

# Deploy to staging server
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### **Production Deployment**

```bash
# Use production environment
.\switch-env.ps1 production

# Deploy to production (with zero-downtime)
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run migrate:prod
```

---

## 🔐 Environment-Specific Security

### **Development Security** 🔓

- CORS allows localhost
- Rate limiting: 1000 requests/minute
- Debug logging enabled
- Security headers disabled
- Self-signed certificates OK

### **Staging Security** ⚠️

- CORS allows staging domain only
- Rate limiting: 100 requests/minute
- Info-level logging
- Security headers enabled
- Valid SSL certificates required

### **Production Security** 🔒

- CORS allows production domain only
- Rate limiting: 50 requests/minute
- Error-only logging
- Maximum security headers
- Valid SSL certificates required
- Database encryption enabled

---

## 📊 Monitoring & Logs

### **Development**

- Console logging with colors
- Debug level logging
- Hot reload notifications
- Development tools accessible

### **Staging**

- Structured JSON logging
- Info level logging
- Error tracking enabled
- Performance monitoring

### **Production**

- Structured JSON logging
- Warn/Error level only
- Full monitoring suite
- Alert system for issues
- Log aggregation service

---

## 🔄 Data Management

### **Development**

- Local PostgreSQL database
- Test data seeding
- Can drop/reset anytime
- No backups required

### **Staging**

- Separate database instance
- Production data (anonymized)
- Weekly backups
- Used for testing with real data

### **Production**

- High-availability database
- Real customer data
- Daily automated backups
- Point-in-time recovery
- Disaster recovery plan

---

## 💰 Cost Considerations

### **Development**

- **Cost:** $0 (local machine)
- **Services:** Local Docker containers
- **Storage:** Local disk space

### **Staging**

- **Cost:** $50-200/month
- **Services:** Cloud VPS or container service
- **Storage:** Cloud storage with backups

### **Production**

- **Cost:** $200-2000+/month
- **Services:** Load balancer, multiple servers, CDN
- **Storage:** Enterprise-grade storage with redundancy

---

## 🎯 When to Use Each Environment

### **Use Development When:**

- Writing new features
- Debugging code issues
- Testing with fake data
- Learning/experimenting
- Working offline

### **Use Staging When:**

- Testing with production-like data
- User acceptance testing (UAT)
- Performance testing
- Integration testing
- Before production releases

### **Use Production When:**

- Ready for real users
- All testing is complete
- Business is ready to launch
- Marketing campaigns are planned

---

## 🚨 Emergency Procedures

### **Rolling Back Production**

```bash
# Quick rollback to previous version
docker-compose -f docker-compose.prod.yml up -d --scale app=0
docker-compose -f docker-compose.prod.yml up -d app:previous-tag
```

### **Database Recovery**

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec db pg_restore /backups/latest.dump
```

---

## 📝 Best Practices

1. **Never commit real secrets** to version control
2. **Test in staging first** before production
3. **Use different secrets** for each environment
4. **Monitor production** 24/7
5. **Backup regularly** (especially production)
6. **Document everything** for team handoffs
7. **Automate deployment** when possible
8. **Use feature flags** for gradual rollouts

---

## 🎉 You're Ready!

Your app is now configured for:

- ✅ **Development:** Local coding and testing
- ✅ **Staging:** Pre-production validation
- ✅ **Production:** Live customer service

**Next Steps:**

1. Test each environment locally
2. Set up your staging server
3. Configure production infrastructure
4. Deploy and monitor!

**Need Help?** Check the logs, use the health endpoints, and monitor your Docker containers.
