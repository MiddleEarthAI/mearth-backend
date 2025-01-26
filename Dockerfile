FROM node:23.3.0-slim AS builder

RUN apt-get update -y && apt-get install -y openssl

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN pnpm prisma generate

# Bundle app source
COPY . .

# Build the TypeScript files
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Start the app
CMD pnpm run db:migrate && pnpm run start
