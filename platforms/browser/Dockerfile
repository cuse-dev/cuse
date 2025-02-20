# Use a specific version of bun for better reproducibility
FROM oven/bun:1.0.29 AS builder

LABEL name="@cuse-dev/cuse/browser"
LABEL version="0.0.1"
LABEL description="Browser platform implementation using Playwright"

# Build arguments
ARG PLAYWRIGHT_VERSION=1.42.1
ARG DEBIAN_FRONTEND=noninteractive

# Install system dependencies required by Playwright
RUN apt-get update && apt-get install -y \
    # Playwright browser dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    # Additional dependencies for headless Chrome
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    # Additional utilities
    curl \
    wget \
    gnupg \
    ca-certificates \
    xvfb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create and set up the app directory
WORKDIR /app

# Copy package files
COPY platforms/browser/package.json ./
COPY bun.lockb ./

# Install dependencies with network retry logic
RUN --mount=type=cache,target=/root/.bun \
    for i in {1..3}; do bun install && break || sleep 5; done

# Copy the rest of the application
COPY platforms/browser .

# Install Playwright with all browsers and dependencies
RUN for i in {1..3}; do \
        echo "Attempt $i: Installing Playwright..." && \
        bunx playwright@${PLAYWRIGHT_VERSION} install --with-deps && \
        break || { \
            echo "Attempt $i failed. Waiting before retry..." && \
            sleep 10; \
        }; \
    done

RUN bunx playwright install 
    
# Build the application
RUN bun run build


# Start a new stage for the runtime image
FROM oven/bun:1.0.29-slim

# Install required runtime dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    xvfb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy necessary runtime files and dependencies
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Set working directory
WORKDIR /app

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DISPLAY_NUM=1
ENV HEIGHT=768
ENV WIDTH=1024
ENV DISPLAY=:${DISPLAY_NUM}

# Create a script to start Xvfb and the application
RUN echo '#!/bin/sh\nXvfb :${DISPLAY_NUM} -screen 0 ${WIDTH}x${HEIGHT}x24 &\nsleep 1\nexec bun run start' > /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"] 