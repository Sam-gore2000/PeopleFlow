# HRMS API (Node + Express). Built and run by docker-compose.yml in the project root.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=5000 \
    UPLOAD_DIR=/app/uploads \
    TZ=Asia/Kolkata

WORKDIR /app

# Install production dependencies first (cached unless package files change).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Uploaded files (profile photos...) live in a volume mounted here.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health > /dev/null || exit 1

CMD ["node", "src/server.js"]
