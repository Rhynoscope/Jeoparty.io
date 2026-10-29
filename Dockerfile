# Multi-stage / lightweight production container for Jeoparty.io
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Copy all game files (pure standard Node.js, zero external dependencies!)
COPY . .

# Expose server port
EXPOSE 3000

# Healthcheck for orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/server-info || exit 1

# Start server
CMD ["node", "server/server.js"]
