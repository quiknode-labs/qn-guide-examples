/**
 * Utility function to create a promise that resolves after a specified number of milliseconds
 * @param timeoutMs - Number of milliseconds to wait
 * @returns Promise that resolves after the timeout
 */
export const sleep = (timeoutMs: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, timeoutMs));
};

