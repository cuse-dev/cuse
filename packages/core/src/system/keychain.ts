import * as client from './client';
import type {
  AuthenticateParams,
  DeleteItemParams,
  KeychainInterface,
  SetItemParams,
  SystemConfig,
} from './types';

/**
 * Keychain control implementation
 * Provides functionality for managing credentials and authentication
 */
export class Keychain implements KeychainInterface {
  private config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
  }

  /**
   * Set a keychain item
   * @param params Item parameters
   * @throws Error if setting item fails
   */
  async setItem({ service, item }: SetItemParams): Promise<void> {
    await client.setKeychainItem({
      body: { service, item },
    });
  }

  /**
   * Delete a keychain item
   * @param params Delete parameters
   * @throws Error if deletion fails
   */
  async deleteItem({ service }: DeleteItemParams): Promise<void> {
    await client.deleteKeychainItem({
      body: { service },
    });
  }

  /**
   * List all services in the keychain
   * @returns Promise with list of service names
   * @throws Error if listing fails
   */
  async listServices(): Promise<string[]> {
    const response = await client.listKeychainServices();

    if (!response.data) {
      throw new Error('Failed to list keychain services');
    }

    return response.data as string[];
  }

  /**
   * Authenticate a given service
   * @param params Authentication parameters
   * @returns Promise resolving to authentication success
   * @throws Error if authentication fails
   */
  async authenticate({
    service,
    authElements,
  }: AuthenticateParams): Promise<boolean> {
    const response = await client.authenticateService({
      body: { service, authElements },
    });

    if (response.data === undefined) {
      throw new Error('Failed to authenticate service');
    }

    return response.data as boolean;
  }
}
