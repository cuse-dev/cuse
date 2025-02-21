/**
 * Helper function to handle API responses
 */
export async function handleResponse<T>(
  promise: Promise<{ data: T }>
): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`API request failed: ${errorMessage}`);
  }
}
