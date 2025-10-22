# Multi-stage build for optimal image size
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./
COPY jest.config.ts ./
COPY jest.preset.js ./

# Copy workspace configuration files
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/project.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/webpack.config.js ./apps/backend/
COPY apps/backend/jest.config.js ./apps/backend/

# Copy shared libraries
COPY libs/ ./libs/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install development dependencies needed for build
RUN npm ci

# Copy backend source code
COPY apps/backend/src/ ./apps/backend/src/

# Build the application using Nx
RUN npx nx build backend --configuration=production

# Stage 2: Runtime stage
FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/backend ./

# Copy generated package.json and install only production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/backend/package*.json ./

# Install production dependencies for the built application
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3030

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={host:'localhost',port:3000,path:'/api/health',timeout:2000};const req=http.request(options,(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3030

# Start the application
CMD ["node", "main.js"]
