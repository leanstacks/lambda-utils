# Lambda Utilities - Documentation

Welcome to the Lambda Utilities documentation. This library provides a comprehensive set of utilities and helper functions to streamline the development of AWS Lambda functions using TypeScript.

## Overview

Lambda Utilities is a collection of pre-configured tools and helpers designed to reduce boilerplate code when developing AWS Lambda functions. It provides utilities for logging, API responses, configuration validation, and AWS SDK client management—all with full TypeScript support.

## Documentation

- **[Configuration Guide](./CONFIGURATION.md)** – Validate environment variables with Zod schemas and type-safe configuration management
- **[Logging Guide](./LOGGING.md)** – Implement structured logging in your Lambda functions with Pino and automatic AWS context enrichment
- **[API Gateway Responses](./API_GATEWAY_RESPONSES.md)** – Format Lambda responses for API Gateway with standard HTTP status codes and headers
- **[DynamoDB Client](./DYNAMODB_CLIENT.md)** – Reusable singleton DynamoDB client instances with custom configuration
- **[SNS Client](./SNS_CLIENT.md)** – Reusable singleton SNS client for publishing messages to topics with message attributes
- **[Lambda Client](./LAMBDA_CLIENT.md)** – Reusable singleton Lambda client for invoking other Lambda functions

## Features

- 📝 **Structured Logging** – Pino logger pre-configured for Lambda with automatic request context
- 📤 **API Response Helpers** – Standard response formatting for API Gateway integration
- ⚙️ **Configuration Validation** – Environment variable validation with Zod schema support
- 🔌 **AWS Clients** – Pre-configured AWS SDK v3 clients for DynamoDB, SNS, and Lambda
- 🔒 **Type Safe** – Full TypeScript support with comprehensive type definitions

## Support

For issues or questions, visit the [GitHub repository](https://github.com/leanstacks/lambda-utils).
