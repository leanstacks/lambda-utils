# Lambda Utilities - Documentation

Welcome to the Lambda Utilities documentation. This library provides a comprehensive set of utilities and helper functions to streamline the development of AWS Lambda functions using TypeScript.

## Table of Contents

- [Getting Started](./GETTING_STARTED.md)
- [Logging](./LOGGING.md)
- [API Gateway Responses](./API_GATEWAY_RESPONSES.md)
- [Configuration](./CONFIGURATION.md)
- [Clients](./CLIENTS.md)

## Quick Start

Install the package:

```bash
npm install @leanstacks/lambda-utils
```

Use a utility in your Lambda function:

```typescript
import { getLogger } from '@leanstacks/lambda-utils';
import { success } from '@leanstacks/lambda-utils';

const logger = getLogger();

export const handler = async (event: any) => {
  logger.info({ message: 'Processing event', event });

  // Your handler logic here

  return success({ message: 'Success' });
};
```

## Features

- **Logging:** Structured logging with Pino configured for Lambda
- **API Responses:** Standard response formatting for API Gateway
- **Configuration:** Environment variable validation with Zod
- **AWS Clients:** Pre-configured AWS SDK v3 clients
- **Type Safe:** Full TypeScript support with comprehensive types

## Support

For issues or questions, please visit the [GitHub repository](https://github.com/leanstacks/lambda-utils).
