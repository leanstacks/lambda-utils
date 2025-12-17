// Jest setup file for global test configuration
// Add any global test setup here

// Mock pino-lambda for tests
jest.mock('pino-lambda', () => {
  return {
    target: 'pino-lambda',
  };
});
