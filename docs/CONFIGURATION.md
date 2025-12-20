# Configuration Guide

This guide explains how to use the `createConfigManager` utility to validate and manage environment variables in your Lambda functions with full TypeScript type safety.

## Overview

The configuration utility provides:

- **Schema-based validation** using Zod for environment variables
- **Type-safe access** to your configuration with full TypeScript support
- **Caching** of validated configuration for performance
- **Flexible defaults** for optional environment variables
- **Clear error messages** when validation fails

## Quick Start

### Define Your Schema

Create a Zod schema that describes your environment variables:

```typescript
import { z } from 'zod';

const configSchema = z.object({
  // Required variables
  TABLE_NAME: z.string().min(1, 'TABLE_NAME is required'),

  // Optional with defaults
  AWS_REGION: z.string().default('us-east-1'),
  DEBUG_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});

// Infer the TypeScript type from your schema
type Config = z.infer<typeof configSchema>;
```

### Create and Use ConfigManager

```typescript
import { createConfigManager } from '@leanstacks/lambda-utils';

// Create the manager
const configManager = createConfigManager(configSchema);

// Get validated config (cached after first call)
const config = configManager.get();

// Use your configuration
console.log(config.TABLE_NAME); // Type-safe access
console.log(config.AWS_REGION); // Automatically defaults to 'us-east-1'
console.log(config.DEBUG_MODE); // Typed as boolean
```

## Complete Example

Here's a realistic Lambda function configuration:

```typescript
import { z } from 'zod';
import { createConfigManager } from '@leanstacks/lambda-utils';

/**
 * Schema for validating environment variables
 */
const envSchema = z.object({
  // Required variables
  TASKS_TABLE: z.string().min(1, 'TASKS_TABLE environment variable is required'),

  // Optional variables with defaults
  AWS_REGION: z.string().default('us-east-1'),

  // Logging configuration
  LOGGING_ENABLED: z
    .enum(['true', 'false'] as const)
    .default('true')
    .transform((val) => val === 'true'),
  LOGGING_LEVEL: z.enum(['debug', 'info', 'warn', 'error'] as const).default('debug'),
  LOGGING_FORMAT: z.enum(['text', 'json'] as const).default('json'),

  // CORS configuration
  CORS_ALLOW_ORIGIN: z.string().default('*'),
});

/**
 * Type representing our validated config
 */
export type Config = z.infer<typeof envSchema>;

/**
 * Configuration manager instance
 */
const configManager = createConfigManager(envSchema);

/**
 * Validated configuration object. Singleton.
 */
export const config = configManager.get();

/**
 * Refresh configuration (useful in tests)
 */
export const refreshConfig = () => configManager.refresh();
```

Then use it in your handler:

```typescript
import { config } from './config';
import { Logger } from '@leanstacks/lambda-utils';

const logger = new Logger({
  level: config.LOGGING_LEVEL,
  format: config.LOGGING_FORMAT,
}).instance;

export const handler = async (event: any) => {
  logger.info({
    message: 'Processing request',
    table: config.TASKS_TABLE,
    region: config.AWS_REGION,
  });

  // Your handler logic here
};
```

## API Reference

### `createConfigManager<T>(schema: T): ConfigManager<z.infer<T>>`

Creates a configuration manager instance.

**Parameters:**

- `schema` - A Zod schema defining your environment variables

**Returns:** A `ConfigManager` instance with two methods

### `ConfigManager.get(): T`

Gets the validated configuration (cached after the first call).

**Throws:** `Error` if validation fails

**Returns:** The validated configuration object

```typescript
const config = configManager.get();
// First call: validates and caches
// Subsequent calls: returns cached value
```

### `ConfigManager.refresh(): T`

Refreshes the configuration by re-validating environment variables against the schema.

**Throws:** `Error` if validation fails

**Returns:** The newly validated configuration object

Use this in tests when you need to change environment variables:

```typescript
beforeEach(() => {
  process.env.TABLE_NAME = 'test-table';
  configManager.refresh(); // Re-validate with new values
});
```

## Best Practices

### 1. Separate Configuration Module

Create a dedicated configuration module for your Lambda function:

```typescript
// src/config.ts
import { z } from 'zod';
import { createConfigManager } from '@leanstacks/lambda-utils';

const schema = z.object({
  TABLE_NAME: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
});

export type Config = z.infer<typeof schema>;

const configManager = createConfigManager(schema);

export const config = configManager.get();
export const refresh = () => configManager.refresh();
```

### 2. Validate Early

Call `config.get()` during handler initialization to validate configuration before processing requests:

```typescript
export const handler = async (event: any, context: any) => {
  // Validation happens here, fails fast if config is invalid
  const config = configManager.get();

  // Handler logic with validated config
};
```

### 3. Use Enums for Known Values

Use `z.enum()` for configuration options with limited valid values:

```typescript
const schema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENVIRONMENT: z.enum(['dev', 'staging', 'prod']),
});

// TypeScript autocomplete for config.LOG_LEVEL
```

### 4. Transform String to Boolean

Since environment variables are always strings, use `transform()` to convert them:

```typescript
const schema = z.object({
  ENABLE_FEATURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});

// config.ENABLE_FEATURE is now a boolean
if (config.ENABLE_FEATURE) {
  // Feature is enabled
}
```

### 5. Provide Helpful Error Messages

Use Zod's second parameter to provide context-specific error messages:

```typescript
const schema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  API_KEY: z.string().min(32, 'API_KEY must be at least 32 characters'),
});
```

### 6. Test Configuration Validation

Test that your schema properly validates configuration:

```typescript
import { config, refresh } from './config';

describe('Configuration', () => {
  it('should load default values', () => {
    delete process.env.AWS_REGION;
    refresh();
    expect(config.AWS_REGION).toBe('us-east-1');
  });

  it('should validate required variables', () => {
    delete process.env.TABLE_NAME;
    expect(() => refresh()).toThrow();
  });

  it('should parse boolean values', () => {
    process.env.DEBUG_MODE = 'true';
    refresh();
    expect(config.DEBUG_MODE).toBe(true);
  });
});
```

## Common Patterns

### Database Configuration

```typescript
const schema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  DATABASE_TIMEOUT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
});
```

### Feature Flags

```typescript
const schema = z.object({
  FEATURE_NEW_UI: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  FEATURE_BETA_API: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});
```

### Multi-Environment Setup

```typescript
const schema = z.object({
  ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DEBUG_MODE: z
    .enum(['true', 'false'])
    .refine(
      (val) => (val === 'true' ? process.env.ENVIRONMENT === 'development' : true),
      'DEBUG_MODE can only be true in development',
    )
    .transform((val) => val === 'true'),
});
```

## Error Handling

Configuration validation errors include detailed information about what failed:

```typescript
try {
  const config = configManager.get();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Output: "Configuration validation failed: TABLE_NAME: String must contain at least 1 character"
  }
}
```

Lambda will automatically fail fast if configuration is invalid, which is the desired behavior for Lambda functions.

## Related Documentation

- **[Zod Documentation](https://zod.dev/)** – Learn more about schema validation with Zod
- **[Back to the project documentation](README.md)**
