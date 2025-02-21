/**
 * Error thrown when platform is not found
 */
export class PlatformNotFoundError extends Error {
  constructor(platformId: string) {
    super(`Platform with ID "${platformId}" not found`);
    this.name = 'PlatformNotFoundError';
  }
}
