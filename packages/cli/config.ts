export const PROXY_PORT = 4242;

/**
 * A mapping from supported OS to their corresponding Docker image.
 */
export const imagesByOS: Record<string, string> = {
  linux: process.env.LINUX_IMAGE || 'ghcr.io/cuse-dev/cuse/linux:latest',
  browser: process.env.BROWSER_IMAGE || 'ghcr.io/cuse-dev/cuse/browser:latest',
};
