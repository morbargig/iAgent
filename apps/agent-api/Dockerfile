# Multi-stage build for optimal image size
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all package files first for better caching
COPY package*.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY nx.json ./
COPY jest.config.ts ./
COPY jest.preset.js ./

# Create agent-api directory structure
RUN mkdir -p ./apps/agent-api

# Copy workspace configuration files
COPY apps/agent-api/package.json ./apps/agent-api/
COPY apps/agent-api/project.json ./apps/agent-api/
COPY apps/agent-api/tsconfig*.json ./apps/agent-api/
COPY apps/agent-api/webpack.config.js ./apps/agent-api/

# Copy shared libraries (if they exist)
COPY libs/ ./libs/

# Install all dependencies (including dev dependencies for build)
RUN npm i && npm cache clean --force

# Copy the entire apps/agent-api directory (including src)
COPY apps/agent-api/ ./apps/agent-api/

# Set build environment variables
ENV NODE_ENV=production

# Build the application using Nx (it will automatically build dependencies)
RUN npx nx build agent-api --configuration=production

# Stage 2: Runtime stage
FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/agent-api ./

# Copy generated package.json and install only production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/agent-api/package*.json ./

# Install production dependencies for the built application
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3033

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3033;const options={host:'localhost',port:port,path:'/api',timeout:2000};const req=http.request(options,(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Set environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3033
ENV HOST=0.0.0.0

# Start the application
CMD ["node", "main.js"]

