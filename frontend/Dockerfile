# Multi-stage build: compile the React app with Node, then serve the static
# files with a tiny nginx image. The final image contains no Node/source.
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (cached unless package files change).
COPY package*.json ./
RUN npm install

COPY . .

# The API URL must be known at build time because Vite inlines VITE_ vars into
# the bundle. docker-compose passes it as a build arg.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
