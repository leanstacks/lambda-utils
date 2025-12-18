# Logging Guide

This guide explains how to use the Logger utility to implement structured logging in your AWS Lambda functions using TypeScript.

## Overview

The Logger utility provides a thin wrapper around [Pino](https://getpino.io/) configured specifically for AWS Lambda. It automatically includes Lambda request context information in your logs and supports multiple output formats suitable for CloudWatch.

## Installation

The Logger utility is included in the `@leanstacks/lambda-utils` package:

```bash
npm install @leanstacks/lambda-utils
```

## Quick Start

### Basic Usage

```typescript
import { Logger } from '@leanstacks/lambda-utils';

const logger = new Logger().instance;

export const handler = async (event: any, context: any) => {
  logger.info('[Handler] > Processing request');

  // Your handler logic here

  logger.info({ key: 'value' }, '[Handler] < Completed request');

  return { statusCode: 200, body: 'Success' };
};
```

## Configuration

The Logger accepts a configuration object to customize its behavior:

```typescript
import { Logger } from '@leanstacks/lambda-utils';

const logger = new Logger({
  enabled: true, // Enable/disable logging (default: true)
  level: 'info', // Minimum log level (default: 'info')
  format: 'json', // Output format: 'json' or 'text' (default: 'json')
}).instance;
```

### Configuration Options

| Option    | Type                                     | Default  | Description                                                                                              |
| --------- | ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `enabled` | `boolean`                                | `true`   | Whether logging is enabled. Set to `false` to disable all logging output.                                |
| `level`   | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Minimum log level to output. Messages below this level are filtered out.                                 |
| `format`  | `'json' \| 'text'`                       | `'json'` | Output format for log messages. Use `'json'` for structured logging or `'text'` for human-readable logs. |

### Log Levels

Log levels are ordered by severity:

- **`debug`**: Detailed information for diagnosing problems (lowest severity)
- **`info`**: General informational messages about application flow
- **`warn`**: Warning messages for potentially harmful situations
- **`error`**: Error messages for serious problems (highest severity)

## Logging Examples

### Basic Logging

```typescript
const logger = new Logger().instance;

logger.debug('Detailed diagnostic information');
logger.info('Application event or milestone');
logger.warn('Warning: something unexpected occurred');
logger.error('Error: operation failed');
```

When the log message contains a simple string, pass the string as the only aregument to the logger function.

### Structured Logging with Objects

```typescript
const logger = new Logger().instance;

const userId = '12345';
const permissions = ['user:read', 'user:write'];

logger.info(
  {
    userId,
    permissions,
  },
  'User authenticated',
);
```

When using structured logging, pass the context attributes object as the first parameter and the string log message as the second parameter. This allows the logger to properly format messages as either JSON or text.

### Error Logging

```typescript
const logger = new Logger().instance;

try {
  // Your code here
} catch (error) {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    'Operation failed',
  );
}
```

## Advanced Usage

### Request Tracking Middleware

The `withRequestTracking` middleware automatically adds AWS Lambda context information to all log messages. This enriches your logs with request IDs, function names, and other Lambda metadata.

```typescript
import { Logger, withRequestTracking } from '@leanstacks/lambda-utils';

const logger = new Logger().instance;

export const handler = async (event: any, context: any) => {
  // Add Lambda context to all subsequent log messages
  withRequestTracking(event, context);

  logger.info('Request started');

  // Your handler logic here

  return { statusCode: 200 };
};
```

### Environment-Based Configuration

Configure logging based on your environment:

```typescript
import { Logger } from '@leanstacks/lambda-utils';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = new Logger({
  level: isDevelopment ? 'debug' : 'info',
  format: isProduction ? 'json' : 'text',
}).instance;
```

### Singleton Pattern for Reusable Logger

For best performance, create a single logger instance and reuse it throughout your application:

```typescript
// logger.ts
import { Logger } from '@leanstacks/lambda-utils';

export const logger = new Logger({
  level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  format: (process.env.LOG_FORMAT as 'json' | 'text') || 'json',
}).instance;
```

Then import it in your handlers:

```typescript
// handler.ts
import { logger } from './logger';

export const handler = async (event: any) => {
  logger.info({ message: 'Processing event', event });

  // Your handler logic here

  return { statusCode: 200 };
};
```

## Best Practices

### 1. Use Structured Logging

Prefer objects over string concatenation:

```typescript
// ✅ Good: Structured logging
logger.info(
  {
    userId: user.id,
  },
  'User login',
);

// ❌ Avoid: String concatenation
logger.info(`User ${user.id} logged in at ${new Date().toISOString()}`);
```

### 2. Include Relevant Context

Include all relevant information that will help with debugging and monitoring:

```typescript
logger.info(
  {
    orderId: order.id,
    amount: order.total,
    paymentMethod: order.paymentMethod,
    duration: endTime - startTime,
  },
  'Payment processed',
);
```

### 3. Use Appropriate Log Levels

Choose log levels that match the severity and importance of the event:

```typescript
logger.debug('Cache hit for user profile'); // Development diagnostics
logger.info('User registered successfully'); // Normal operations
logger.warn('API rate limit approaching'); // Potential issues
logger.error('Database connection failed'); // Critical failures
```

### 4. Avoid Logging Sensitive Information

Never log passwords, API keys, tokens, or personally identifiable information (PII):

```typescript
// ❌ Never do this
logger.info({ password: user.password });

// ✅ Log safe information
logger.info({ userId: user.id, email: user.email });
```

### 5. Performance Considerations

The logger is optimized for Lambda and uses lazy evaluation. Only use `debug` level logs in development:

```typescript
// Disable debug logs in production for better performance
const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}).instance;
```

## Output Formats

### JSON Format (Default)

Best for production environments and log aggregation services like CloudWatch, Datadog, or Splunk:

```json
{
  "timestamp": "2025-12-18T13:42:40.502Z",
  "level": "INFO",
  "requestId": "req-abc-123",
  "message": {
    "awsRequestId": "req-def-456",
    "x-correlation-trace-id": "Root=1-2a-28ab;Parent=1e6;Sampled=0;Lineage=1:bf3:0",
    "x-correlation-id": "crl-abc-123",
    "time": 1702900123456,
    "pid": 1,
    "hostname": "lambda-container",
    "key": "value",
    "msg": "User authenticated"
  }
}
```

### Text Format

Best for local development and human-readable output:

```
[2024-12-18T12:34:56.789Z] INFO: User authenticated userId=12345 requestId=req-abc-123
```

## Testing

When testing Lambda functions that use the logger, you can mock or configure the logger:

```typescript
import { Logger } from '@leanstacks/lambda-utils';

describe('MyHandler', () => {
  it('should log info message', () => {
    const logger = new Logger({
      enabled: true,
      level: 'info',
    }).instance;

    const spyLog = jest.spyOn(logger, 'info');

    // Your test code here

    expect(spyLog).toHaveBeenCalledWith({
      message: 'Expected message',
    });
  });
});
```

## Troubleshooting

### Logs Not Appearing

1. **Check if logging is enabled**: Verify `enabled: true` in configuration
2. **Check log level**: Ensure the message log level meets the configured minimum level. Check the Lambda function [Logging configuration application log level](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs-log-level.html).
3. **Check CloudWatch**: Logs appear in CloudWatch Logs under `/aws/lambda/[function-name]`

### Performance Issues

1. **Use appropriate log level**: Reduce logs in production by using `level: 'info'`
2. **Limit object size**: Avoid logging very large objects that could impact performance
3. **Use singleton pattern**: Create one logger instance and reuse it

## Further reading

- [Pino Documentation](https://getpino.io/)
- [AWS Lambda Environment and Context](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Back to the project documentation](README.md)
