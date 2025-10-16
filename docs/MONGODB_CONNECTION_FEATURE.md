# MongoDB Connection Management Feature

## 📋 Overview

This feature adds a comprehensive MongoDB connection management system with:

- **Singleton Connection Service** - Centralized database connection handling
- **Health Check API** - RESTful endpoint to check database status
- **UI Component** - Real-time database status indicator in the sidebar
- **Dual Mode Support** - Separate URIs for demo and production environments

---

## 🏗️ Architecture

### Backend Components

#### 1. **MongoDBConnectionService** (Singleton)

Location: `apps/backend/src/app/database/mongodb-connection.service.ts`

**Features:**

- ✅ Singleton pattern for consistent connection state
- ✅ Automatic connection on module initialization
- ✅ Real-time connection monitoring with event listeners
- ✅ Graceful fallback to memory mode
- ✅ Connection status tracking with timestamps
- ✅ Sanitized URI for secure logging (hides credentials)

**Methods:**

- `connect()` - Establishes MongoDB connection
- `getStatus()` - Returns current connection status
- `isConnected()` - Boolean check for connection
- `isMemoryMode()` - Check if running in memory mode
- `disconnect()` - Manually close connection
- `reconnect()` - Reconnect to database

#### 2. **Health Check API Endpoints**

Location: `apps/backend/src/app/app.controller.ts`

**Endpoints:**

- `GET /api/health/database` - Get current database status
- `POST /api/health/database/reconnect` - Attempt to reconnect

**Response Format:**

```json
{
  "connected": true,
  "mode": "demo | production | memory",
  "uri": "mongodb://user:****@host:port/dbname",
  "database": "iagent",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "error": "Error message if any"
}
```

### Frontend Components

#### **DatabaseStatus Component**

Location: `apps/frontend/src/components/DatabaseStatus.tsx`

**Features:**

- ✅ Real-time status polling (configurable interval)
- ✅ Compact and full display modes
- ✅ Visual indicators (icons, colors)
- ✅ Reconnect functionality
- ✅ Error display
- ✅ Responsive design

**Props:**

```typescript
interface DatabaseStatusProps {
  apiBaseUrl?: string; // Default: http://localhost:3001
  refreshInterval?: number; // Default: 30000ms (30 seconds)
  showDetails?: boolean; // Default: true
  compact?: boolean; // Default: false
}
```

**Integration:**
Added to `Sidebar.tsx` in both desktop and mobile footers with compact mode enabled.

---

## 🚀 Usage

### Environment Configuration

#### Demo Mode (Development/Local Testing)

```bash
# .env or .env.local
DEMO_MODE=true
MONGODB_URI_LOCAL=mongodb://localhost:27017/iagent-dev
JWT_SECRET=your-secret-key
PORT=3001
```

#### Production Mode

```bash
# .env.production
DEMO_MODE=false
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/iagent
JWT_SECRET=your-production-secret
PORT=3001
```

### Connection Logic

```
┌─────────────────────────────────────────────┐
│  Application Startup                         │
└─────────────────┬───────────────────────────┘
                  │
                  v
       ┌──────────────────────┐
       │  Check DEMO_MODE     │
       └──────┬───────────────┘
              │
         ┌────┴────┐
         │ true?   │
         └────┬────┘
         yes  │  no
     ┌────────┴────────┐
     v                 v
┌──────────┐    ┌──────────────┐
│ Use      │    │ Use          │
│ MONGODB_ │    │ MONGODB_URI  │
│ URI_LOCAL│    │              │
└─────┬────┘    └──────┬───────┘
      │                │
      └────────┬───────┘
               v
     ┌─────────────────┐
     │ URI configured? │
     └────┬─────────┬──┘
       yes│         │no
          v         v
    ┌────────┐  ┌─────────────┐
    │Connect │  │ Memory Mode │
    │MongoDB │  │ (No persist)│
    └────┬───┘  └─────────────┘
         │
         v
    ┌──────────┐
    │ Success? │
    └────┬──┬──┘
      yes│  │no
         v  v
    ┌────┐┌──────────────┐
    │ OK ││ Memory Mode  │
    │    ││ (with warning)│
    └────┘└──────────────┘
```

### Connection Modes Explained

| Mode           | Environment       | URI Variable        | Persistence | Use Case                                      |
| -------------- | ----------------- | ------------------- | ----------- | --------------------------------------------- |
| **Demo**       | `DEMO_MODE=true`  | `MONGODB_URI_LOCAL` | ✅ Yes      | Local development, testing with local MongoDB |
| **Production** | `DEMO_MODE=false` | `MONGODB_URI`       | ✅ Yes      | Production, staging, cloud MongoDB            |
| **Memory**     | No URI configured | N/A                 | ❌ No       | Fallback when MongoDB unavailable             |

---

## 🧪 Testing

### 1. Test Memory Mode (No Database)

```bash
# Don't set any MongoDB URI
cd apps/backend
npx nx serve backend
```

**Expected:**

- Console warning: `⚠️ MONGODB_URI_LOCAL not set - Running in MEMORY MODE`
- API returns: `{ "connected": false, "mode": "memory" }`
- UI shows yellow/warning badge: "In-Memory"

### 2. Test Demo Mode (Local MongoDB)

```bash
# Start local MongoDB
mongod --dbpath /data/db

# Set environment
export DEMO_MODE=true
export MONGODB_URI_LOCAL=mongodb://localhost:27017/iagent-dev

cd apps/backend
npx nx serve backend
```

**Expected:**

- Console log: `✅ MongoDB connected successfully!`
- Console log: `📊 Database: iagent-dev`
- Console log: `🌐 Mode: DEMO`
- API returns: `{ "connected": true, "mode": "demo", "database": "iagent-dev" }`
- UI shows blue badge: "Demo Mode"

### 3. Test Production Mode (Cloud MongoDB)

```bash
# Set environment
export DEMO_MODE=false
export MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/iagent

cd apps/backend
npx nx serve backend
```

**Expected:**

- Console log: `✅ MongoDB connected successfully!`
- Console log: `🌐 Mode: PRODUCTION`
- API returns: `{ "connected": true, "mode": "production" }`
- UI shows green badge: "Production"

### 4. Test Reconnection

```bash
# While backend is running:
# 1. Stop MongoDB (if local)
# 2. Check UI - should show disconnected
# 3. Restart MongoDB
# 4. Click "Reconnect" button in UI or call API:

curl -X POST http://localhost:3001/api/health/database/reconnect
```

**Expected:**

- Successful reconnection
- Status updates in real-time
- Console logs show reconnection attempt

### 5. Test UI Component

```bash
# Terminal 1: Start backend
cd apps/backend
npx nx serve backend

# Terminal 2: Start frontend
cd apps/frontend
npx nx serve frontend

# Open browser: http://localhost:3001 (or 4200)
# Look at sidebar footer - database status badge should be visible
```

**Expected:**

- Compact badge shows in sidebar footer
- Click badge for tooltip with details
- Auto-refreshes every 60 seconds
- Color-coded by status (green=connected, yellow=memory, red=error)

---

## 🔧 API Testing with cURL

### Get Database Status

```bash
curl http://localhost:3001/api/health/database
```

### Attempt Reconnection

```bash
curl -X POST http://localhost:3001/api/health/database/reconnect
```

### Get Full Health Check

```bash
curl http://localhost:3001/api
```

---

## 📊 Status Indicators

### Backend Console

**Connected:**

```
============================================================
🚀 iAgent Backend - Startup Configuration
============================================================
📌 Mode: DEMO
🔌 MongoDB URI: ✅ Configured
============================================================

🔌 Attempting to connect to MongoDB (DEMO mode)...
✅ MongoDB connected successfully!
📊 Database: iagent-dev
🌐 Mode: DEMO
📁 GridFS bucket initialized for file storage
```

**Memory Mode (Fallback):**

```
============================================================
🚀 iAgent Backend - Startup Configuration
============================================================
📌 Mode: DEMO
🔌 MongoDB URI: ❌ Not configured
⚠️  MONGODB_URI_LOCAL not set - Running in MEMORY MODE
📝 All chat data will be stored in memory and will not persist
============================================================
```

### Frontend UI

| Status           | Badge Color | Badge Text     | Tooltip                                       |
| ---------------- | ----------- | -------------- | --------------------------------------------- |
| Connected (Demo) | Blue        | "Demo Mode"    | "Connected to MongoDB / Database: iagent-dev" |
| Connected (Prod) | Green       | "Production"   | "Connected to MongoDB / Database: iagent"     |
| Memory Mode      | Yellow      | "In-Memory"    | "Not connected / Data will not persist"       |
| Error            | Red         | "Disconnected" | Shows error message                           |

---

## 🛠️ Troubleshooting

### Issue: "Connection timeout"

**Solution:**

- Check MongoDB is running: `mongod --version`
- Verify connection string format
- Check firewall/network settings
- For Atlas: Whitelist your IP address

### Issue: "Authentication failed"

**Solution:**

- Verify username/password in connection string
- Check database user permissions
- For Atlas: Ensure user has correct roles

### Issue: UI shows "Not connected" but backend logs show success

**Solution:**

- Check CORS configuration in `main.ts`
- Verify frontend is pointing to correct backend port
- Check browser console for network errors
- Ensure both frontend and backend are running

### Issue: Memory mode when URI is configured

**Solution:**

- Check environment variable is set: `echo $MONGODB_URI_LOCAL`
- Restart backend after setting environment variables
- Verify .env file is in correct location
- Check for typos in variable names

---

## 📝 Files Created/Modified

### New Files:

1. `apps/backend/src/app/database/mongodb-connection.service.ts` - Singleton service
2. `apps/frontend/src/components/DatabaseStatus.tsx` - UI component
3. `docs/MONGODB_CONNECTION_FEATURE.md` - This documentation

### Modified Files:

1. `apps/backend/src/app/app.module.ts` - Integration and startup logging
2. `apps/backend/src/app/app.controller.ts` - Health check endpoints
3. `apps/frontend/src/components/Sidebar.tsx` - UI integration

---

## 🎯 Next Steps

### Recommended Enhancements:

1. **Add Connection Pool Monitoring** - Track active connections
2. **Add Metrics Dashboard** - Query performance, cache hit rates
3. **Add Alerts** - Notify on connection failures
4. **Add Database Migration Tools** - Schema versioning
5. **Add Backup Status** - Show last backup time
6. **Add Query Performance Logs** - Slow query detection

### Optional Features:

- Connection retry with exponential backoff
- Multiple database connection support
- Read replica monitoring
- Sharding status display

---

## 🔒 Security Notes

1. **Never expose full connection strings in logs** - Already sanitized
2. **Use environment variables** - Never commit credentials
3. **Restrict API endpoints** - Consider adding authentication to health endpoints
4. **Monitor failed connection attempts** - Potential security breach indicator

---

## 📚 Additional Resources

- [MongoDB Node.js Driver Docs](https://www.mongodb.com/docs/drivers/node/)
- [Mongoose Connection Docs](https://mongoosejs.com/docs/connections.html)
- [NestJS MongoDB Guide](https://docs.nestjs.com/techniques/mongodb)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

**Created:** [Current Date]  
**Author:** AI Assistant  
**Version:** 1.0.0  
**Status:** ✅ Completed
