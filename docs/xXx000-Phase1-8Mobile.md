# xXx000-Phase1-8Mobile - Complete SAV3 Dating App Validation Plan

## 🎯 **Complete Next Steps Plan - SAV3 Dating App Validation**

### ✅ **Environment Status Confirmed**

- **Working Directory**: `C:\Users\evans\Desktop\sav3-backend` ✅
- **Database**: PostGIS container healthy on port 10000 ✅
- **API**: Healthy on port 10010 with correct DB connection ✅
- **Mobile**: Expo server starting with tunnel on port 8081 ✅

---

## 📋 **Phase 1: API Endpoint Validation** (30-45 minutes)

### **1.1 User Registration API Test**

```bash
# Test user registration endpoint
curl -X POST http://localhost:10010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

**Expected Response**: User created with JWT token

### **1.2 User Login API Test**

```bash
# Test user login endpoint
curl -X POST http://localhost:10010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

**Expected Response**: JWT access & refresh tokens

### **1.3 User Profile API Test**

```bash
# Test user profile retrieval (use token from login)
curl -X GET http://localhost:10010/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 **Phase 2: Mobile App Integration** (45-60 minutes)

### **2.1 Mobile Registration Flow**

```bash
# Wait for Expo QR code to appear, then scan with mobile device
# Test registration through mobile app interface
```

### **2.2 Mobile Login Flow**

```bash
# Test login through mobile app interface
# Verify token storage and API communication
```

### **2.3 API Communication Verification**

```bash
# Monitor network requests in mobile app
# Verify all API calls reach backend successfully
```

---

## 🔔 **Phase 3: Push Notifications** (20-30 minutes)

### **3.1 Device Registration Test**

```bash
# Test device token registration
curl -X POST http://localhost:10010/api/v1/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"deviceToken":"test-device-token","platform":"ios"}'
```

### **3.2 Push Notification Test**

```bash
# Test sending push notification
curl -X POST http://localhost:10010/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId":"test-user-id","title":"Test","body":"Hello World"}'
```

---

## 👤 **Phase 4: User Profile Features** (30-45 minutes)

### **4.1 Profile Creation**

```bash
# Test profile creation/update
curl -X PUT http://localhost:10010/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test User","age":25,"bio":"Hello!","location":{"lat":40.7128,"lng":-74.0060}}'
```

### **4.2 Profile Retrieval**

```bash
# Test profile retrieval
curl -X GET http://localhost:10010/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📍 **Phase 5: Geospatial Features** (25-35 minutes)

### **5.1 Nearby Users Query**

```bash
# Test geospatial query for nearby users
curl -X GET "http://localhost:10010/api/v1/discovery/nearby?lat=40.7128&lng=-74.0060&radius=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **5.2 Location Update**

```bash
# Test location update
curl -X POST http://localhost:10010/api/v1/user/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"lat":40.7128,"lng":-74.0060}'
```

---

## 📸 **Phase 6: Media Upload/Download** (20-30 minutes)

### **6.1 File Upload Test**

```bash
# Test file upload to MinIO
curl -X POST http://localhost:10010/api/v1/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test-image.jpg"
```

### **6.2 File Retrieval Test**

```bash
# Test file retrieval
curl -X GET http://localhost:10010/api/v1/media/YOUR_FILE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **Phase 7: Monitoring & Performance** (15-20 minutes)

### **7.1 Start Monitoring Stack**

```bash
# Start Prometheus, Grafana, and exporters
docker-compose -f docker-compose.monitoring.yml up -d
```

### **7.2 Access Monitoring Dashboards**

```bash
# Grafana: http://localhost:10023 (admin/admin)
# Prometheus: http://localhost:10022
```

---

## 🎨 **Phase 8: UI/Design Polish** (Last - 60+ minutes)

### **8.1 Mobile App UI Review**

- Review all screens and user flows
- Optimize layouts and interactions
- Test on different device sizes
- Polish animations and transitions

### **8.2 Backend Admin Interface**

- Review API documentation at `/api-docs`
- Test admin features if any
- Verify error handling UI

---

## 🛠️ **Utility Commands**

### **Quick Health Checks**

```bash
# Backend health
curl -s http://localhost:10010/health

# Database connectivity
docker-compose exec api npx prisma db push

# Mobile server status
curl -s http://localhost:8081
```

### **Logs & Debugging**

```bash
# API logs
docker-compose logs -f api

# Database logs
docker-compose logs -f db

# Mobile logs (in mobile directory)
npx expo logs
```

### **Reset Commands**

```bash
# Reset database
docker-compose down -v
docker-compose up -d db

# Reset API
docker-compose up -d --build api

# Reset mobile
cd sav3-frontend/mobile
rm -rf node_modules
npm install
```

---

## 📈 **Progress Tracking**

- [ ] **Phase 1**: API Endpoint Validation
- [ ] **Phase 2**: Mobile App Integration
- [ ] **Phase 3**: Push Notifications
- [ ] **Phase 4**: User Profile Features
- [ ] **Phase 5**: Geospatial Features
- [ ] **Phase 6**: Media Upload/Download
- [ ] **Phase 7**: Monitoring & Performance
- [ ] **Phase 8**: UI/Design Polish

---

## 📋 **Execution Strategy**

1. **Complete All Functionality First** - Phases 1-7
2. **UI/Design Last** - Phase 8
3. **No Interruptions** - Execute systematically
4. **100% Completion** - Each phase fully validated
5. **Documentation** - All results recorded

---

## 🎯 **Success Criteria**

- All API endpoints responding correctly
- Mobile app fully functional
- Push notifications working
- Geospatial queries accurate
- Media upload/download operational
- Monitoring dashboards accessible
- UI polished and responsive

---

_Generated: August 28, 2025_
_Strategy: Functionality First → UI Last_
_Goal: 100% Feature Completion_
