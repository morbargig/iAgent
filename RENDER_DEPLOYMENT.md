# Render Deployment Guide

## Required Environment Variables

Your Render deployment is failing because **required environment variables are not set**. You must configure these in your Render dashboard:

### 🔴 Critical (Required)

1. **MONGODB_URI**
   - Value: Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`
   - Location: Render Dashboard → Your Service → Environment

2. **JWT_SECRET**
   - Value: Your JWT secret key (64+ characters recommended)
   - Example: Generate with: `openssl rand -base64 32`
   - Location: Render Dashboard → Your Service → Environment

### 🟡 Optional (Recommended)

3. **DB_NAME**
   - Value: MongoDB database name
   - Default: `filesdb`
   - Example: `filesdb`

4. **JWT_EXPIRES_IN**
   - Value: JWT token expiration time
   - Default: `1h`
   - Example: `1h` or `24h`

5. **PORT**
   - Value: Server port
   - Default: `3030`
   - Note: Render usually sets this automatically

6. **NODE_ENV**
   - Value: Environment mode
   - Production: `production`

7. **API_URL**
   - Value: Your API URL
   - Example: `https://iagent-1-jzyj.onrender.com/api`

## How to Set Environment Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **Web Service** (backend service)
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable** for each variable
5. Enter the **Key** (e.g., `MONGODB_URI`)
6. Enter the **Value** (your actual connection string/secret)
7. Click **Save Changes**
8. Render will automatically redeploy your service

## Quick Setup Script

You can add these all at once in Render:

```
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
DB_NAME=filesdb
JWT_EXPIRES_IN=1h
NODE_ENV=production
```

⚠️ **Important**: Replace the placeholder values with your actual credentials!

## Verification

After setting the environment variables, check the deployment logs. You should see:

```
🚀 Connecting to MongoDB...
📁 Database: filesdb
🚀 MongoDB connection enabled
🚀 Application is running on: http://localhost:3030/api
```

If you see error messages about missing environment variables, double-check that they're set correctly in Render.

## Troubleshooting

### Error: "MONGODB_URI environment variable is required"
- **Solution**: Add `MONGODB_URI` in Render environment variables

### Error: "JWT_SECRET environment variable is required"
- **Solution**: Add `JWT_SECRET` in Render environment variables

### Error: "Exited with status 1"
- **Solution**: Check Render logs for specific error message
- Usually means a required environment variable is missing or MongoDB connection failed

### MongoDB Connection Failed
- **Solution**: 
  - Verify your MongoDB connection string is correct
  - Check if your MongoDB cluster allows connections from Render's IP addresses
  - Ensure MongoDB username/password are correct in the connection string


