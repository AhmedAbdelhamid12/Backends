# Multi-stage build for Swim Academy Pro
# Stage 1: Build web frontend
FROM node:18-alpine AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web .
RUN npm run build

# Stage 2: Final application
FROM node:18-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ netcat

# Copy backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy config and essential files
COPY config ./config
COPY models ./models
COPY routes ./routes
COPY controllers ./controllers
COPY middleware ./middleware
COPY utils ./utils
COPY scripts ./scripts
COPY server.js .

# Create uploads directory
RUN mkdir -p uploads/{avatars,progress/photos,progress/videos,sessions,documents,temp}

# Copy built web frontend
COPY --from=web-builder /app/web/dist ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5000
CMD ["node", "server.js"]
