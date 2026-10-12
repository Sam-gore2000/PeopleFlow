# HRMS web: builds the React app, then serves it with Caddy (automatic HTTPS),
# which also forwards /api and /uploads to the backend container.

# ---- 1. Build the React app ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The app calls the API on the same address (/api), so no CORS and one domain.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- 2. Serve it ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
