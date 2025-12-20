import { z } from 'zod';
import { createConfigManager, type ConfigManager } from './config';

describe('createConfigManager', () => {
  // Store original env for restoration
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment variables before each test
    process.env = {};
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should create a ConfigManager instance with get and refresh methods', () => {
      // Arrange
      const schema = z.object({
        TEST_VAR: z.string().default('default'),
      });

      // Act
      const manager = createConfigManager(schema);

      // Assert
      expect(manager).toHaveProperty('get');
      expect(manager).toHaveProperty('refresh');
      expect(typeof manager.get).toBe('function');
      expect(typeof manager.refresh).toBe('function');
    });

    it('should validate and return configuration on first get() call', () => {
      // Arrange
      process.env.TABLE_NAME = 'my-table';
      process.env.AWS_REGION = 'us-west-2';

      const schema = z.object({
        TABLE_NAME: z.string().min(1),
        AWS_REGION: z.string(),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(config).toEqual({
        TABLE_NAME: 'my-table',
        AWS_REGION: 'us-west-2',
      });
    });

    it('should apply default values from schema', () => {
      // Arrange
      process.env.REQUIRED_VAR = 'value';

      const schema = z.object({
        REQUIRED_VAR: z.string(),
        OPTIONAL_VAR: z.string().default('default-value'),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(config.REQUIRED_VAR).toBe('value');
      expect(config.OPTIONAL_VAR).toBe('default-value');
    });

    it('should apply transformations from schema', () => {
      // Arrange
      process.env.ENABLED = 'true';

      const schema = z.object({
        ENABLED: z.enum(['true', 'false'] as const).transform((val) => val === 'true'),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(config.ENABLED).toBe(true);
    });
  });

  describe('caching behavior', () => {
    it('should cache configuration after first get() call', () => {
      // Arrange
      process.env.APP_NAME = 'initial';

      const schema = z.object({
        APP_NAME: z.string(),
      });

      const manager = createConfigManager(schema);

      // Act - first call
      const config1 = manager.get();

      // Change environment variable
      process.env.APP_NAME = 'changed';

      // Second call should return cached value
      const config2 = manager.get();

      // Assert
      expect(config1.APP_NAME).toBe('initial');
      expect(config2.APP_NAME).toBe('initial');
      expect(config1).toBe(config2); // Same reference
    });

    it('should return same cached instance on multiple get() calls', () => {
      // Arrange
      const schema = z.object({
        VAR: z.string().default('value'),
      });

      const manager = createConfigManager(schema);

      // Act
      const config1 = manager.get();
      const config2 = manager.get();
      const config3 = manager.get();

      // Assert
      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
    });
  });

  describe('refresh() method', () => {
    it('should re-validate and update cache on refresh() call', () => {
      // Arrange
      process.env.COUNTER = '1';

      const schema = z.object({
        COUNTER: z.coerce.number(),
      });

      const manager = createConfigManager(schema);

      // Act - initial get
      const config1 = manager.get();
      expect(config1.COUNTER).toBe(1);

      // Change environment and refresh
      process.env.COUNTER = '2';
      const config2 = manager.refresh();

      // Assert
      expect(config2.COUNTER).toBe(2);
      expect(config1).not.toBe(config2); // Different instances
    });

    it('should clear cache and revalidate on refresh()', () => {
      // Arrange
      process.env.VALUE = 'old';

      const schema = z.object({
        VALUE: z.string(),
      });

      const manager = createConfigManager(schema);

      // Act - initial
      const initial = manager.get();
      expect(initial.VALUE).toBe('old');

      // Refresh with new value
      process.env.VALUE = 'new';
      const refreshed = manager.refresh();

      // Assert
      expect(refreshed.VALUE).toBe('new');
      expect(manager.get().VALUE).toBe('new'); // Cache updated
    });

    it('should return the new config instance from refresh()', () => {
      // Arrange
      const schema = z.object({
        VAR: z.string().default('default'),
      });

      const manager = createConfigManager(schema);

      // Act
      const refreshed = manager.refresh();
      const cached = manager.get();

      // Assert
      expect(refreshed).toBe(cached);
    });
  });

  describe('error handling', () => {
    it('should throw error when required variable is missing', () => {
      // Arrange
      process.env = {};

      const schema = z.object({
        REQUIRED_VAR: z.string().min(1),
      });

      const manager = createConfigManager(schema);

      // Act & Assert
      expect(() => manager.get()).toThrow('Configuration validation failed');
    });

    it('should throw error when validation fails', () => {
      // Arrange
      process.env.PORT = 'not-a-number';

      const schema = z.object({
        PORT: z.coerce.number(),
      });

      const manager = createConfigManager(schema);

      // Act & Assert
      expect(() => manager.get()).toThrow('Configuration validation failed');
    });

    it('should include all validation errors in error message', () => {
      // Arrange
      process.env.PORT = 'invalid';

      const schema = z.object({
        DB_HOST: z.string().min(1, 'DB_HOST is required'),
        DB_PORT: z.coerce.number().positive('PORT must be positive'),
        PORT: z.coerce.number().positive('PORT must be positive'),
      });

      const manager = createConfigManager(schema);

      // Act & Assert
      expect(() => manager.get()).toThrow('Configuration validation failed');
    });

    it('should throw error on refresh() if validation fails', () => {
      // Arrange
      process.env.STATUS = 'valid';

      const schema = z.object({
        STATUS: z.enum(['valid', 'invalid'] as const),
      });

      const manager = createConfigManager(schema);

      // Act - initial should succeed
      expect(() => manager.get()).not.toThrow();

      // Change to invalid value and refresh
      process.env.STATUS = 'unknown';

      // Assert
      expect(() => manager.refresh()).toThrow('Configuration validation failed');
    });
  });

  describe('type inference', () => {
    it('should maintain type safety with schema', () => {
      // Arrange
      process.env.NAME = 'test';
      process.env.COUNT = '42';
      process.env.ENABLED = 'true';

      const schema = z.object({
        NAME: z.string(),
        COUNT: z.coerce.number(),
        ENABLED: z.enum(['true', 'false'] as const).transform((val) => val === 'true'),
      });

      type TestConfig = z.infer<typeof schema>;

      const manager: ConfigManager<TestConfig> = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert - TypeScript would catch type errors here
      expect(typeof config.NAME).toBe('string');
      expect(typeof config.COUNT).toBe('number');
      expect(typeof config.ENABLED).toBe('boolean');
    });
  });

  describe('complex schemas', () => {
    it('should handle nested objects in schema', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.APP_NAME = 'myapp';

      const schema = z.object({
        APP_NAME: z.string(),
        DATABASE: z
          .object({
            HOST: z.string(),
            PORT: z.coerce.number(),
          })
          .default({
            HOST: process.env.DB_HOST || 'localhost',
            PORT: parseInt(process.env.DB_PORT || '5432'),
          }),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(config.APP_NAME).toBe('myapp');
      expect(config.DATABASE.HOST).toBeDefined();
    });

    it('should handle array validation in schema', () => {
      // Arrange
      process.env.ALLOWED_HOSTS = 'host1,host2,host3';

      const schema = z.object({
        ALLOWED_HOSTS: z
          .string()
          .transform((val) => val.split(','))
          .default(['localhost']),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(Array.isArray(config.ALLOWED_HOSTS)).toBe(true);
    });

    it('should handle enum values', () => {
      // Arrange
      process.env.LOG_LEVEL = 'warn';

      const schema = z.object({
        LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'] as const).default('info'),
      });

      const manager = createConfigManager(schema);

      // Act
      const config = manager.get();

      // Assert
      expect(config.LOG_LEVEL).toBe('warn');
    });
  });

  describe('multiple instances', () => {
    it('should maintain separate caches for different manager instances', () => {
      // Arrange
      process.env.VALUE = 'instance1';

      const schema = z.object({
        VALUE: z.string(),
      });

      const manager1 = createConfigManager(schema);
      const config1 = manager1.get();

      process.env.VALUE = 'instance2';

      const manager2 = createConfigManager(schema);
      const config2 = manager2.get();

      // Act & Assert
      expect(config1.VALUE).toBe('instance1');
      expect(config2.VALUE).toBe('instance2');
    });
  });
});
