# SNS Client Utilities

The SNS client utilities provide a reusable singleton instance of `SNSClient` for use in AWS Lambda functions. These utilities enable you to configure the client once and reuse it across invocations, following AWS best practices for Lambda performance optimization.

## Overview

The utility exports the following functions:

- `initializeSNSClient()` - Initialize the SNS client with optional configuration
- `getSNSClient()` - Get the singleton SNS client instance
- `publishToTopic()` - Publish a message to an SNS topic
- `resetSNSClient()` - Reset the client instance (useful for testing)

## Usage

### Basic Usage

```typescript
import { publishToTopic } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  // Publish a message to an SNS topic
  const messageId = await publishToTopic('arn:aws:sns:us-east-1:123456789012:MyTopic', {
    orderId: '12345',
    status: 'completed',
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId }),
  };
};
```

### Publishing with Message Attributes

Message attributes enable SNS topic subscribers to filter messages based on metadata:

```typescript
import { publishToTopic, SNSMessageAttributes } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  const attributes: SNSMessageAttributes = {
    priority: {
      DataType: 'String',
      StringValue: 'high',
    },
    category: {
      DataType: 'String',
      StringValue: 'order',
    },
  };

  const messageId = await publishToTopic(
    'arn:aws:sns:us-east-1:123456789012:MyTopic',
    { orderId: '12345', status: 'completed' },
    attributes,
  );

  return { statusCode: 200, body: JSON.stringify({ messageId }) };
};
```

### Using String Arrays in Message Attributes

AWS SNS supports `String.Array` as the only array data type:

```typescript
import { publishToTopic, SNSMessageAttributes } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  const attributes: SNSMessageAttributes = {
    tags: {
      DataType: 'String.Array',
      StringValue: JSON.stringify(['urgent', 'vip', 'customer-request']),
    },
  };

  const messageId = await publishToTopic(
    'arn:aws:sns:us-east-1:123456789012:MyTopic',
    { orderId: '12345' },
    attributes,
  );

  return { statusCode: 200, body: JSON.stringify({ messageId }) };
};
```

### Using the SNS Client Directly

For advanced use cases, you can access the underlying SNS client:

```typescript
import { getSNSClient } from '@leanstacks/lambda-utils';
import { ListTopicsCommand } from '@aws-sdk/client-sns';

export const handler = async (event: any) => {
  const client = getSNSClient();

  const response = await client.send(new ListTopicsCommand({}));

  return {
    statusCode: 200,
    body: JSON.stringify(response.Topics),
  };
};
```

### Advanced Configuration

#### Custom SNS Client Configuration

```typescript
import { initializeSNSClient } from '@leanstacks/lambda-utils';

// Initialize client with custom configuration (typically done once outside the handler)
initializeSNSClient({
  region: 'us-west-2',
  endpoint: 'http://localhost:4566', // For local development with LocalStack
});

export const handler = async (event: any) => {
  // Client is now initialized and ready to use
  // Use publishToTopic or getSNSClient as needed
};
```

### Lambda Handler Pattern

```typescript
import { initializeSNSClient, publishToTopic } from '@leanstacks/lambda-utils';

// Initialize client outside the handler (runs once per cold start)
initializeSNSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  const messageId = await publishToTopic(process.env.TOPIC_ARN!, {
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

### `initializeSNSClient(config?): SNSClient`

Initializes the SNS client with the provided configuration.

**Parameters:**

- `config` (optional) - SNS client configuration object

**Returns:**

- The `SNSClient` instance

**Notes:**

- If called multiple times, it will replace the existing client instance
- If no config is provided, uses default AWS SDK configuration

### `getSNSClient(): SNSClient`

Returns the singleton SNS client instance.

**Returns:**

- The `SNSClient` instance

**Notes:**

- If the client has not been initialized, creates one with default configuration
- Automatically initializes the client on first use if not already initialized

### `publishToTopic(topicArn, message, attributes?): Promise<string>`

Publishes a message to an SNS topic.

**Parameters:**

- `topicArn` (string) - The ARN of the SNS topic to publish to
- `message` (Record<string, unknown>) - The message content (will be converted to JSON string)
- `attributes` (optional) - Message attributes for filtering

**Returns:**

- Promise that resolves to the message ID (string)

**Throws:**

- Error if the SNS publish operation fails

**Notes:**

- Automatically initializes the SNS client if not already initialized
- Message is automatically serialized to JSON
- Returns empty string if MessageId is not provided in the response

### `resetSNSClient(): void`

Resets the SNS client instance to null.

**Notes:**

- Primarily useful for testing scenarios where you need to reinitialize the client with different configurations
- After calling this, the client will be automatically re-initialized on next use

### `SNSMessageAttributes`

Type definition for SNS message attributes.

**Interface:**

```typescript
interface SNSMessageAttributes {
  [key: string]: {
    DataType: 'String' | 'String.Array' | 'Number' | 'Binary';
    StringValue?: string;
    BinaryValue?: Uint8Array;
  };
}
```

**Supported Data Types:**

- `String` - UTF-8 encoded string values
- `String.Array` - Array of strings (must be JSON-stringified)
- `Number` - Numeric values (stored as strings)
- `Binary` - Binary data

**Note:** `String.Array` is the only array type supported by AWS SNS. There are no `Number.Array` or `Binary.Array` types.

## Best Practices

1. **Initialize Outside the Handler**: Always initialize the client outside your Lambda handler function to reuse the instance across invocations.

2. **Use Environment Variables**: Configure the client using environment variables for flexibility across environments.

3. **Error Handling**: Always wrap publish operations in try-catch blocks to handle errors gracefully.

4. **Message Attributes**: Use message attributes for subscriber filtering rather than including filter criteria in the message body.

5. **Testing**: Use `resetSNSClient()` in test setup/teardown to ensure clean test isolation.

## Message Attribute Examples

### String Attribute

```typescript
const attributes: SNSMessageAttributes = {
  priority: {
    DataType: 'String',
    StringValue: 'high',
  },
};
```

### Number Attribute

```typescript
const attributes: SNSMessageAttributes = {
  temperature: {
    DataType: 'Number',
    StringValue: '72.5',
  },
};
```

### String Array Attribute

```typescript
const attributes: SNSMessageAttributes = {
  tags: {
    DataType: 'String.Array',
    StringValue: JSON.stringify(['urgent', 'vip', 'customer-request']),
  },
};
```

### Binary Attribute

```typescript
const attributes: SNSMessageAttributes = {
  thumbnail: {
    DataType: 'Binary',
    BinaryValue: new Uint8Array([1, 2, 3, 4]),
  },
};
```

## Testing Example

```typescript
import { initializeSNSClient, publishToTopic, resetSNSClient } from '@leanstacks/lambda-utils';

describe('MyLambdaHandler', () => {
  beforeEach(() => {
    resetSNSClient();
    initializeSNSClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566', // LocalStack
    });
  });

  afterEach(() => {
    resetSNSClient();
  });

  it('should publish message to SNS topic', async () => {
    const messageId = await publishToTopic('arn:aws:sns:us-east-1:123456789012:TestTopic', {
      test: 'data',
    });

    expect(messageId).toBeTruthy();
  });
});
```

## Error Handling Example

```typescript
import { publishToTopic } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  try {
    const messageId = await publishToTopic(
      process.env.TOPIC_ARN!,
      { orderId: event.orderId, status: 'completed' },
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
    console.error('Failed to publish message to SNS', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to publish message' }),
    };
  }
};
```

## Related Resources

- **[AWS SDK for JavaScript v3 - SNS Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sns/)**
- **[Amazon SNS Message Attributes](https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html)**
- **[AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)**
- **[Back to the project documentation](README.md)**
