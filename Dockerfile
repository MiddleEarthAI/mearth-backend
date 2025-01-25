# Use Node.js v20 as the base image
FROM node:20-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install OpenSSL and other required dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "dev"] 




# commands
# docker compose up --build
# docker compose up -d
# docker compose logs -f api
# docker compose down
