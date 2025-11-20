# Backend Debugging Guide

This guide explains how to debug the NestJS backend using VS Code (or Cursor) debugger.

## Quick Start

1. **Set Breakpoints**: Click in the gutter (left of line numbers) in any TypeScript file to set breakpoints
2. **Start Debugging**: 
   - Press `F5` or go to Run and Debug panel (Cmd+Shift+D / Ctrl+Shift+D)
   - Select "Debug Backend (NestJS)" from the dropdown
   - Click the green play button or press `F5`
3. **Debug**: The backend will start and stop at your breakpoints

## Debug Configurations

### Debug Backend (NestJS) - Recommended
- **Type**: Launch
- **What it does**: Starts the backend with debugging enabled
- **Port**: 9229 (Node.js inspector)
- **Configuration**: Uses `local` build configuration with source maps

### Attach to Backend
- **Type**: Attach
- **What it does**: Attaches to an already running backend process
- **Use case**: When you've started the backend manually with `npm run dev:backend`

## Setting Breakpoints

### In Controller Methods
```typescript
// apps/backend/src/app/controllers/auth.controller.ts
async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
  // Set breakpoint here 👈
  if (!loginRequest || typeof loginRequest !== 'object') {
    throw new BadRequestException('Invalid request body');
  }
  return await this.authService.login(loginRequest);
}
```

### In Service Methods
```typescript
// apps/backend/src/app/auth/auth.service.ts
async login(loginRequest: LoginRequest): Promise<LoginResponse> {
  const { email, password } = loginRequest;
  // Set breakpoint here 👈
  const normalizedEmail = email.trim().toLowerCase();
  // ...
}
```

### In Middleware/Guards
```typescript
// apps/backend/src/app/middleware/text-body-parser.middleware.ts
use(req: Request, res: Response, next: NextFunction) {
  // Set breakpoint here 👈
  if (req.method === 'PUT' && req.headers['content-type'] === 'text/plain') {
    // ...
  }
}
```

## Debugging Tips

### 1. Watch Variables
- Open the **Watch** panel to monitor specific variables
- Right-click a variable → "Add to Watch"

### 2. Call Stack
- Use the **Call Stack** panel to see the execution path
- Click any frame to jump to that code location

### 3. Debug Console
- Use the **Debug Console** to evaluate expressions
- Type variable names or expressions to see their values

### 4. Conditional Breakpoints
- Right-click a breakpoint → "Edit Breakpoint"
- Add a condition (e.g., `email === 'demo@iagent.com'`)

### 5. Logpoints
- Right-click → "Add Logpoint"
- Log expressions without stopping execution

## Common Debugging Scenarios

### Debug Login Flow
1. Set breakpoint in `auth.controller.ts` → `login()` method
2. Set breakpoint in `auth.service.ts` → `login()` method
3. Start debugging
4. Make a POST request to `/api/auth/login`
5. Step through the code with F10 (step over) or F11 (step into)

### Debug API Requests
1. Set breakpoint in controller method
2. Start debugging
3. Make API request from frontend or Postman
4. Inspect request body, params, headers

### Debug Middleware
1. Set breakpoint in middleware `use()` method
2. Start debugging
3. Make request that triggers the middleware
4. Inspect request object

## Environment Variables

Debug configuration uses environment variables from `.env` file. Make sure you have:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- Other required environment variables

## Troubleshooting

### Breakpoints Not Hitting
1. **Check source maps**: Ensure `sourceMap: true` in build configuration
2. **Rebuild**: Run `nx build backend --configuration=local`
3. **Check file paths**: Ensure you're debugging the correct file

### Can't Attach to Process
1. **Check port**: Ensure port 9229 is not in use
2. **Start with inspect**: Backend must be started with `--inspect=9229`
3. **Check firewall**: Ensure port is not blocked

### Source Maps Not Working
1. Verify `sourceMap: true` in `project.json` build configuration
2. Check `tsconfig.app.json` has `"sourceMap": true`
3. Rebuild the project

## Manual Debugging (Alternative)

If the debugger doesn't work, you can also:

1. **Start backend manually**:
   ```bash
   NODE_OPTIONS='--inspect=9229' npx nx serve backend
   ```

2. **Attach debugger**: Use "Attach to Backend" configuration

## Keyboard Shortcuts

- `F5` - Start/Continue debugging
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+F5` / `Cmd+Shift+F5` - Restart debugging
- `Shift+F5` - Stop debugging

## Additional Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [NestJS Debugging Guide](https://docs.nestjs.com/recipes/debugging)
- [Node.js Inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/)

