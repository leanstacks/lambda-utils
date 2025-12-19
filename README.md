# Lambda Utilities

[![npm version](https://badge.fury.io/js/@leanstacks%2Flambda-utils.svg)](https://badge.fury.io/js/@leanstacks%2Flambda-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript utility library for AWS Lambda functions. Provides pre-configured logging, API response formatting, configuration validation, and AWS SDK clients—reducing boilerplate and promoting best practices.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Installation

```bash
npm install @leanstacks/lambda-utils
```

### Requirements

- Node.js 24.x or higher
- TypeScript 5.0 or higher

## Quick Start

### Logging Example

```typescript
import { Logger, withRequestTracking } from '@leanstacks/lambda-utils';

const logger = new Logger().instance;

export const handler = async (event: any, context: any) => {
  withRequestTracking(event, context);

  logger.info('Processing request');

  // Your Lambda handler logic here

  return { statusCode: 200, body: 'Success' };
};
```

### API Response Example

```typescript
import { ok, badRequest } from '@leanstacks/lambda-utils';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return badRequest('Body is required');
  }

  // Process request

  return ok({ message: 'Request processed successfully' });
};
```

## Features

- **📝 Structured Logging** – Pino logger pre-configured for Lambda with automatic AWS request context enrichment
- **📤 API Response Helpers** – Standard response formatting for API Gateway with proper HTTP status codes
- **⚙️ Configuration Validation** – Environment variable validation with Zod schema support
- **🔌 AWS SDK Clients** – Pre-configured AWS SDK v3 clients including DynamoDB with document client support
- **🔒 Full TypeScript Support** – Complete type definitions and IDE autocomplete
- **⚡ Lambda Optimized** – Designed for performance in serverless environments

## Documentation

Comprehensive guides and examples are available in the `docs` directory:

| Guide                                                        | Description                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **[Logging Guide](./docs/LOGGING.md)**                       | Configure and use structured logging with automatic AWS Lambda context |
| **[API Gateway Responses](./docs/API_GATEWAY_RESPONSES.md)** | Format responses for API Gateway with standard HTTP patterns           |
| **[AWS Clients](./docs/README.md)**                          | Use pre-configured AWS SDK v3 clients in your handlers                 |

## Usage

### Logging

The Logger utility provides structured logging configured specifically for AWS Lambda:

```typescript
import { Logger } from '@leanstacks/lambda-utils';

const logger = new Logger({
  level: 'info', // debug, info, warn, error
  format: 'json', // json or text
}).instance;

logger.info({ message: 'User authenticated', userId: '12345' });
logger.error({ message: 'Operation failed', error: err.message });
```

**→ See [Logging Guide](./docs/LOGGING.md) for detailed configuration and best practices**

### API Responses

Generate properly formatted responses for API Gateway:

```typescript
import { ok, created, badRequest } from '@leanstacks/lambda-utils';

export const handler = async (event: APIGatewayProxyEvent) => {
  return ok({
    data: { id: '123', name: 'Example' },
  });
};
```

**→ See [API Gateway Responses](./docs/API_GATEWAY_RESPONSES.md) for all response types**

### AWS Clients

Use pre-configured AWS SDK v3 clients. Currently available:

#### DynamoDB Client

Initialize the DynamoDB clients (base client and document client) once during handler initialization:

```typescript
import { initializeDynamoDBClients, getDynamoDBDocumentClient } from '@leanstacks/lambda-utils';

export const handler = async (event: any, context: any) => {
  // Initialize clients once
  initializeDynamoDBClients({ region: 'us-east-1' });

  // Use the document client for operations
  const docClient = getDynamoDBDocumentClient();
  const result = await docClient.get({
    TableName: 'MyTable',
    Key: { id: 'item-123' },
  });

  return { statusCode: 200, body: JSON.stringify(result) };
};
```

**→ See [DynamoDB Client Guide](./docs/DYNAMODB_CLIENT.md) for detailed configuration and examples**

Additional AWS Clients are coming soon.

## Examples

Example Lambda functions using Lambda Utilities are available in the repository:

- API Gateway with logging and response formatting
- Configuration validation and DynamoDB integration
- Error handling and structured logging

## Reporting Issues

If you encounter a bug or have a feature request, please report it on [GitHub Issues](https://github.com/leanstacks/lambda-utils/issues). Include as much detail as possible to help us investigate and resolve the issue quickly.

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Issues & Questions:** [GitHub Issues](https://github.com/leanstacks/lambda-utils/issues)
- **Documentation:** [docs](./docs/README.md)
- **NPM Package:** [@leanstacks/lambda-utils](https://www.npmjs.com/package/@leanstacks/lambda-utils)

## Changelog

See the project [releases](https://github.com/leanstacks/lambda-utils/releases) for version history and updates.
