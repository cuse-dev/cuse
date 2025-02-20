FROM oven/bun AS build

WORKDIR /app
 
# Copy root package.json and lockfile
COPY package.json bun.lockb ./
 
# Copy workspace packages
COPY packages/ ./packages/

# Copy the api package
COPY apps/api/ ./apps/api/

# Install dependencies
RUN bun install

# Set production environment
ENV NODE_ENV=production

# Build the application
RUN cd apps/api && bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# Production image
FROM gcr.io/distroless/base

WORKDIR /app

# Copy only the built binary
COPY --from=build /app/apps/api/server ./server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["./server"]