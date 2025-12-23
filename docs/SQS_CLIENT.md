# SQS Client Utilities

The SQS client utilities provide a reusable singleton instance of `SQSClient` for use in AWS Lambda functions. These utilities enable you to configure the client once and reuse it across invocations, following AWS best practices for Lambda performance optimization.

## Overview

The utility exports the following functions:

- `initializeSQSClient()` - Initialize the SQS client with optional configuration
- `getSQSClient()` - Get the singleton SQS client instance
- `sendToQueue()` - Send a message to an SQS queue
- `resetSQSClient()` - Reset the client instance (useful for testing)

## Usage

### Basic Usage

```typescript
import { sendToQueue } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Send a message to an SQS queue
  const messageId = await sendToQueue('https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue', {
    orderId: '12345',
    status: 'completed',
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId }),
  };
};
```

### Sending with Message Attributes

Message attributes enable SQS subscribers to filter messages based on metadata:

```typescript
import { sendToQueue, SQSMessageAttributes } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  const attributes: SQSMessageAttributes = {
    priority: {
      DataType: 'String',
      StringValue: 'high',
    },
    attempts: {
      DataType: 'Number',
      StringValue: '1',
    },
  };

  const messageId = await sendToQueue(
    'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue',
    { orderId: '12345', status: 'completed' },
    attributes,
  );

  return { statusCode: 200, body: JSON.stringify({ messageId }) };
};
```

### Using Binary Data in Message Attributes

SQS supports binary data in message attributes:

```typescript
import { sendToQueue, SQSMessageAttributes } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
  const attributes: SQSMessageAttributes = {
    imageData: {
      DataType: 'Binary',
      BinaryValue: binaryData,
    },
  };

  const messageId = await sendToQueue(
    'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue',
    { imageId: '12345' },
    attributes,
  );

  return { statusCode: 200, body: JSON.stringify({ messageId }) };
};
```

### Using the SQS Client Directly

For advanced use cases, you can access the underlying SQS client:

```typescript
import { getSQSClient } from '@leanstacks/lambda-utils';
import { ListQueuesCommand } from '@aws-sdk/client-sqs';

export const handler = async (event: any) => {
  const client = getSQSClient();

  const response = await client.send(new ListQueuesCommand({}));

  return {
    statusCode: 200,
    body: JSON.stringify(response.QueueUrls),
  };
};
```

### Advanced Configuration

#### Custom SQS Client Configuration

```typescript
import { initializeSQSClient } from '@leanstacks/lambda-utils';

// Initialize client with custom configuration (typically done once outside the handler)
initializeSQSClient({
  region: 'us-west-2',
  endpoint: 'http://localhost:9324', // For local development with LocalStack
});

export const handler = async (event: any) => {
  // Client is now initialized and ready to use
  // Use sendToQueue or getSQSClient as needed
};
```

### Lambda Handler Pattern

```typescript
import { initializeSQSClient, sendToQueue } from '@leanstacks/lambda-utils';

// Initialize client outside the handler (runs once per cold start)
initializeSQSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  const messageId = await sendToQueue(process.env.QUEUE_URL!, {
    timestamp: new Date().toISOString(),
    data: event,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId }),
  };
};
```

## API Reference

### `initializeSQSClient(config?): SQSClient`

Initializes the SQS client with the provided configuration.

**Parameters:**

- `config` (optional) - SQS client configuration object

**Returns:**

- The `SQSClient` instance

**Notes:**

- If called multiple times, it will replace the existing client instance
- If no config is provided, uses default AWS SDK configuration

### `getSQSClient(): SQSClient`

Returns the singleton SQS client instance.

**Returns:**

- The `SQSClient` instance

**Notes:**

- If the client has not been initialized, creates one with default configuration
- Automatically initializes the client on first use if not already initialized

### `sendToQueue(queueUrl, message, attributes?): Promise<string>`

Sends a message to an SQS queue.

**Parameters:**

- `queueUrl` (string) - The URL of the SQS queue to send to
- `message` (Record<string, unknown>) - The message content (will be converted to JSON string)
- `attributes` (optional) - Message attributes for filtering

**Returns:**

- Promise that resolves to the message ID (string)

**Throws:**

- Error if the SQS send operation fails

**Notes:**

- Automatically initializes the SQS client if not already initialized
- Message is automatically serialized to JSON
- Returns empty string if MessageId is not provided in the response

### `resetSQSClient(): void`

Resets the SQS client instance to null.

**Notes:**

- Primarily useful for testing scenarios where you need to reinitialize the client with different configurations
- After calling this, the client will be automatically re-initialized on next use

### `SQSMessageAttributes`

Type definition for SQS message attributes.

**Interface:**

```typescript
interface SQSMessageAttributes {
  [key: string]: {
    DataType: 'String' | 'Number' | 'Binary';
    StringValue?: string;
    BinaryValue?: Uint8Array;
  };
}
```

**Supported Data Types:**

- `String` - UTF-8 encoded string values
- `Number` - Numeric values (stored as strings)
- `Binary` - Binary data

**Note:** Unlike SNS, SQS does not support array data types (`String.Array`).

## Best Practices

1. **Initialize Outside the Handler**: Always initialize the client outside your Lambda handler function to reuse the instance across invocations.

2. **Use Environment Variables**: Configure the client using environment variables for flexibility across environments.

3. **Error Handling**: Always wrap send operations in try-catch blocks to handle errors gracefully.

4. **Message Attributes**: Use message attributes for message filtering and routing rather than including filter criteria in the message body.

5. **Testing**: Use `resetSQSClient()` in test setup/teardown to ensure clean test isolation.

## Message Attribute Examples

### String Attribute

```typescript
const attributes: SQSMessageAttributes = {
  priority: {
    DataType: 'String',
    StringValue: 'high',
  },
};
```

### Number Attribute

```typescript
const attributes: SQSMessageAttributes = {
  temperature: {
    DataType: 'Number',
    StringValue: '72.5',
  },
};
```

### Binary Attribute

```typescript
const attributes: SQSMessageAttributes = {
  thumbnail: {
    DataType: 'Binary',
    BinaryValue: new Uint8Array([1, 2, 3, 4]),
  },
};
```

## Testing Example

```typescript
import { initializeSQSClient, sendToQueue, resetSQSClient } from '@leanstacks/lambda-utils';

describe('MyLambdaHandler', () => {
  beforeEach(() => {
    resetSQSClient();
    initializeSQSClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:9324', // LocalStack
    });
  });

  afterEach(() => {
    resetSQSClient();
  });

  it('should send message to SQS queue', async () => {
    const messageId = await sendToQueue('https://sqs.us-east-1.amazonaws.com/123456789012/TestQueue', {
      test: 'data',
    });

    expect(messageId).toBeTruthy();
  });
});
```

## Error Handling Example

```typescript
import { sendToQueue } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  try {
    const messageId = await sendToQueue(
      process.env.QUEUE_URL!,
      { orderId: event.orderId, status: 'processing' },
      {
        priority: {
          DataType: 'String',
          StringValue: 'high',
        },
      },
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId }),
    };
  } catch (error) {
    console.error('Failed to send message to SQS', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to send message' }),
    };
  }
};
```

## Related Resources

- **[AWS SDK for JavaScript v3 - SQS Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/)**
- **[Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/)**
- **[AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)**
- **[Back to the project documentation](README.md)**
