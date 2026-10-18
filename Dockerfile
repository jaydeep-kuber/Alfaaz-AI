FROM node:22-alpine

WORKDIR /app

# Install libc6-compat for Next.js and wget for Docker healthcheck
RUN apk add --no-cache libc6-compat wget

# Copy dependency manifests and npm configuration
COPY package.json package-lock.json* .npmrc* ./

# Install dependencies (including tsx and migration tools)
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Expose Next.js default port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start development server by default
CMD ["npm", "run", "dev"]
