# Lambda Client Utilities

The Lambda client utilities provide a reusable singleton instance of `LambdaClient` for use in AWS Lambda functions. These utilities enable you to configure the client once and reuse it across invocations, following AWS best practices for Lambda performance optimization.

## Overview

The utility exports the following functions:

- `initializeLambdaClient()` - Initialize the Lambda client with optional configuration
- `getLambdaClient()` - Get the singleton Lambda client instance
- `invokeLambdaSync()` - Invoke a Lambda function synchronously (RequestResponse)
- `invokeLambdaAsync()` - Invoke a Lambda function asynchronously (Event)
- `resetLambdaClient()` - Reset the client instance (useful for testing)

## Usage

### Synchronous Invocation (RequestResponse)

Use synchronous invocation when you need to wait for the Lambda function to complete and return a response:

```typescript
import { invokeLambdaSync } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Invoke a Lambda function and wait for the response
  const response = await invokeLambdaSync('my-function-name', {
    key: 'value',
    data: { nested: true },
  });

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
```

### Synchronous Invocation with Typed Response

For better type safety, you can specify the expected response type:

```typescript
import { invokeLambdaSync } from '@leanstacks/lambda-utils';

interface MyFunctionResponse {
  result: string;
  statusCode: number;
  data: Record<string, unknown>;
}

export const handler = async (event: any) => {
  const response = await invokeLambdaSync<MyFunctionResponse>('my-function-name', {
    operation: 'getData',
    id: '12345',
  });

  console.log(`Function returned: ${response.result}`);

  return {
    statusCode: response.statusCode,
    body: JSON.stringify(response.data),
  };
};
```

### Asynchronous Invocation (Event)

Use asynchronous invocation for fire-and-forget scenarios where you don't need to wait for the Lambda function to complete:

```typescript
import { invokeLambdaAsync } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Invoke a Lambda function asynchronously (fire and forget)
  await invokeLambdaAsync('my-async-function', {
    eventType: 'process',
    data: [1, 2, 3],
  });

  // Returns immediately without waiting for the function to complete
  return {
    statusCode: 202,
    body: JSON.stringify({ message: 'Processing initiated' }),
  };
};
```

### Using Function ARN

You can invoke Lambda functions by name or ARN:

```typescript
import { invokeLambdaSync } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Using function ARN
  const response = await invokeLambdaSync('arn:aws:lambda:us-east-1:123456789012:function:my-function', {
    key: 'value',
  });

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
```

### Using the Lambda Client Directly

For advanced use cases, you can access the underlying Lambda client:

```typescript
import { getLambdaClient } from '@leanstacks/lambda-utils';
import { ListFunctionsCommand } from '@aws-sdk/client-lambda';

export const handler = async (event: any) => {
  const client = getLambdaClient();

  const response = await client.send(new ListFunctionsCommand({}));

  return {
    statusCode: 200,
    body: JSON.stringify(response.Functions),
  };
};
```

### Custom Configuration

Initialize the Lambda client with custom configuration at the start of your Lambda handler:

```typescript
import { initializeLambdaClient, invokeLambdaSync } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Initialize with custom configuration (only needs to be done once)
  initializeLambdaClient({
    region: 'us-west-2',
    maxAttempts: 3,
  });

  const response = await invokeLambdaSync('my-function', { key: 'value' });

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
```

## API Reference

### initializeLambdaClient(config?)

Initializes the Lambda client with the provided configuration. If the client is already initialized, this will replace it with a new instance.

**Parameters:**

- `config` (optional): `LambdaClientConfig` - AWS SDK Lambda client configuration

**Returns:** `LambdaClient` - The Lambda client instance

### getLambdaClient()

Returns the singleton Lambda client instance. If the client has not been initialized, creates one with default configuration.

**Returns:** `LambdaClient` - The Lambda client instance

### invokeLambdaSync<T>(functionName, payload)

Invokes a Lambda function synchronously (RequestResponse). The function waits for the response and returns the payload.

**Parameters:**

- `functionName`: `string` - The name or ARN of the Lambda function to invoke
- `payload`: `unknown` - The JSON payload to pass to the Lambda function

**Returns:** `Promise<T>` - Promise that resolves to the response payload from the Lambda function

**Throws:** `Error` - If the Lambda invocation fails or returns a function error

### invokeLambdaAsync(functionName, payload)

Invokes a Lambda function asynchronously (Event). The function returns immediately without waiting for the Lambda execution to complete.

**Parameters:**

- `functionName`: `string` - The name or ARN of the Lambda function to invoke
- `payload`: `unknown` - The JSON payload to pass to the Lambda function

**Returns:** `Promise<void>` - Promise that resolves when the invocation request is accepted

**Throws:** `Error` - If the Lambda invocation request fails

### resetLambdaClient()

Resets the Lambda client instance. Useful for testing or when you need to reinitialize the client with a different configuration.

**Returns:** `void`

## Error Handling

Both `invokeLambdaSync` and `invokeLambdaAsync` throw errors in the following cases:

1. **Function Errors**: When the invoked Lambda function returns an error (e.g., unhandled exceptions)
2. **AWS SDK Errors**: When the AWS SDK encounters an error (e.g., network issues, permission errors)

```typescript
import { invokeLambdaSync } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  try {
    const response = await invokeLambdaSync('my-function', { key: 'value' });
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Lambda invocation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to invoke Lambda function' }),
    };
  }
};
```

## Testing

The utility provides a `resetLambdaClient()` function for testing purposes:

```typescript
import { resetLambdaClient, initializeLambdaClient } from '@leanstacks/lambda-utils';
import { mockClient } from 'aws-sdk-client-mock';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

describe('My Lambda Tests', () => {
  const lambdaClientMock = mockClient(LambdaClient);

  beforeEach(() => {
    resetLambdaClient();
    lambdaClientMock.reset();
  });

  it('should invoke Lambda function successfully', async () => {
    // Mock the Lambda client response
    const responsePayload = { result: 'success' };
    const encoder = new TextEncoder();
    const responseBytes = encoder.encode(JSON.stringify(responsePayload));

    lambdaClientMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: responseBytes,
    });

    // Test your code that uses invokeLambdaSync or invokeLambdaAsync
    // ...
  });
});
```

## Best Practices

1. **Singleton Pattern**: The Lambda client is created once and reused across invocations, improving performance by reducing initialization overhead.

2. **Error Handling**: Always wrap Lambda invocations in try-catch blocks to handle potential errors gracefully.

3. **Type Safety**: Use TypeScript generics to specify the expected response type for synchronous invocations:

   ```typescript
   const response = await invokeLambdaSync<MyResponseType>('my-function', payload);
   ```

4. **Async vs Sync**: Choose the appropriate invocation type:
   - Use `invokeLambdaSync` when you need to wait for and process the response
   - Use `invokeLambdaAsync` for fire-and-forget scenarios to improve performance

5. **IAM Permissions**: Ensure your Lambda function has the necessary IAM permissions to invoke other Lambda functions:
   ```json
   {
     "Effect": "Allow",
     "Action": ["lambda:InvokeFunction"],
     "Resource": "arn:aws:lambda:region:account-id:function:function-name"
   }
   ```

## See Also

- [AWS SDK for JavaScript - Lambda Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/)
- [AWS Lambda Developer Guide - Invoking Functions](https://docs.aws.amazon.com/lambda/latest/dg/lambda-invocation.html)
- [DynamoDB Client Documentation](./DYNAMODB_CLIENT.md)
- [SNS Client Documentation](./SNS_CLIENT.md)
