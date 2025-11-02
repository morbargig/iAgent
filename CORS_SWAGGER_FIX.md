# Swagger CORS Fix for Production

## Issue
Swagger UI in production was trying to make requests to `http://localhost:10000` instead of the production URL `https://iagent-1-jzyj.onrender.com`, causing CORS and URL scheme errors.

## Solution
Updated environment configuration to include `serverUrl` in the `swagger` configuration, and updated `apps/backend/src/main.ts` to use the server URL from the environment file.

### Changes Made:

1. **Updated Environment Type** (`environment.type.ts`):
   - Added `serverUrl?: string` to `swagger` configuration
   
2. **Updated Environment Files**:
   - **Production** (`env.prod.ts`): Uses `RENDER_EXTERNAL_URL` || `API_URL` || fallback to `https://iagent-1-jzyj.onrender.com`
   - **Development** (`env.dev.ts`): Uses `http://localhost:${PORT || 3030}`
   - **Test** (`test.env.ts`): Uses `http://localhost:3030`
   - **Default** (`environment.ts`): Uses `http://localhost:3030`

3. **Updated main.ts** (lines 29-50):
   - Now reads `baseUrl` from `environment.swagger.serverUrl`
   - Falls back to previous logic if `serverUrl` is not set
   - Automatically converts HTTP to HTTPS in production
   - Logs the Swagger base URL on startup for debugging

4. **Enhanced Swagger Options** (lines 91-98):
   - `persistAuthorization: true` - Saves auth tokens
   - `displayRequestDuration: true` - Shows API response times
   - `deepLinking: true` - Enables direct links to specific endpoints

## Environment Variables

The `serverUrl` is now configured in environment files and reads from environment variables in this priority order:

### Production:
1. `RENDER_EXTERNAL_URL` - Automatically set by Render.com
2. `API_URL` - Custom API URL if needed
3. Fallback: `https://iagent-1-jzyj.onrender.com`

### Development:
- Uses `http://localhost:${PORT || 3030}`

To override, you can set `API_URL` environment variable in Render.com dashboard.

## Testing Locally

The fix maintains backward compatibility with local development:
- Development mode: Uses `http://localhost:3030`
- Production mode: Uses the Render.com URL

## Next Steps

1. **Commit and push** the changes
2. **Deploy** to Render.com
3. **Verify** at `https://iagent-1-jzyj.onrender.com/docs` that Swagger UI now points to the correct server
4. **Test** an API endpoint through Swagger UI to confirm CORS is working

## Expected Result

After deployment, when you visit `https://iagent-1-jzyj.onrender.com/docs`:
- The server dropdown should show: `https://iagent-1-jzyj.onrender.com (Production)`
- API calls should work without CORS errors
- The "Server response" should show actual API responses instead of "Failed to fetch"

