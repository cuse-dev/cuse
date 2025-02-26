FROM node:18-alpine AS base

# Install pnpm in the base image and set up the global bin directory
RUN npm install -g pnpm
# Manually set up pnpm directories and environment
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# Install turbo
RUN npm install -g turbo@^2
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "app" is the name entered in the project's package.json: { name: "app" }
RUN turbo prune app --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
# Add required environment variables for the build
# These are default values that will be used during build time only
ENV NEXT_PUBLIC_APP_URL=http://localhost:4242
ENV NEXT_PUBLIC_WEB_URL=http://localhost:3001
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
# Create public directory if it doesn't exist
RUN mkdir -p /app/apps/app/public
RUN pnpm turbo run build --filter=app...

FROM base AS runner
WORKDIR /app

# Create non-root user for better security
# (but we'll decide at runtime whether to use it based on docker-compose.yml)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer /app/apps/app/.next/standalone ./
COPY --from=installer /app/apps/app/.next/static ./apps/app/.next/static
# Copy public directory (will be empty if it didn't exist)
COPY --from=installer /app/apps/app/public ./apps/app/public

# Make sure files are accessible by both root and non-root users
RUN chown -R nextjs:nodejs /app

# Expose the port that the Next.js app will run on
EXPOSE 3000

# Set runtime environment variables
# These will be overridden by any environment variables passed at runtime
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV DOCKER_SOCKET_PATH="/var/run/docker.sock"

# Note: We're not setting USER here - it will be controlled by docker-compose.yml

CMD ["node", "apps/app/server.js"]