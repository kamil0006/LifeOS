# --- Stage 1: build the Vite app ---
FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve static files with nginx ---
FROM nginx:1.27-alpine

# The entrypoint renders templates/*.template into /etc/nginx/conf.d at startup,
# substituting environment variables. Override BACKEND_URL to point the /api/
# proxy at a different backend (e.g. http://backend.railway.internal:3002 on Railway).
ENV BACKEND_URL=http://backend:3002
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
