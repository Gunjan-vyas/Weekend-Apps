# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun run db:generate

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "bun run db:migrate:deploy && bun run start"]

