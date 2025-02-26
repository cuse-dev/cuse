FROM node:20-bookworm AS base

# Install pnpm in the base image and set up the global bin directory
RUN npm install -g pnpm
# Manually set up pnpm directories and environment
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

# Add metadata labels
LABEL name="@cuse-dev/cuse/browser"
LABEL version="0.0.1"
LABEL description="Browser platform implementation using Playwright"

FROM base AS builder
# Set working directory
WORKDIR /app
# Install turbo
RUN npm install -g turbo@^2
COPY . .

# Generate a partial monorepo with a pruned lockfile for the browser platform
RUN turbo prune @cusedev/browser --docker

FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy the project files
COPY --from=builder /app/out/full/ .

# Make sure the platform-specific dependencies are installed
RUN cd platforms/browser && pnpm install --frozen-lockfile

# Install Playwright with all browsers and dependencies
# Clean up apt cache in the same layer to save space
RUN apt-get update && \
    apt-get install -y --no-install-recommends xvfb fonts-freefont-ttf fonts-liberation && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pnpm install -g playwright && \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 playwright install-deps chromium && \
    playwright install chromium

# Build the project
RUN pnpm turbo run build --filter=@cusedev/browser...

FROM base AS runner
WORKDIR /app

# Copy package.json and built files from installer stage
COPY --from=installer /app/platforms/browser/package.json ./
COPY --from=installer /app/platforms/browser/dist ./dist
# Copy all dependencies, including those in node_modules
COPY --from=installer /app/node_modules ./node_modules

# Make sure we have all necessary dependencies installed
RUN pnpm install --prod --no-frozen-lockfile

# Install Playwright and Xvfb with minimized layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends xvfb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pnpm install -g playwright && \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 playwright install-deps chromium && \
    playwright install chromium

# Set environment variables
ENV NODE_ENV=production
ENV DISPLAY=:99
ENV SCREEN_WIDTH=1024
ENV SCREEN_HEIGHT=768
ENV SCREEN_DEPTH=24

# Expose the port the app runs on
EXPOSE 8000

# Create a script to start Xvfb and the application
RUN echo '#!/bin/sh\n\
Xvfb $DISPLAY -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} &\n\
XVFB_PID=$!\n\
sleep 2\n\
echo "Starting application..."\n\
node ./dist/server/app.js\n\
kill $XVFB_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]