# DynamoDB Client Utilities

The DynamoDB client utilities provide reusable singleton instances of `DynamoDBClient` and `DynamoDBDocumentClient` for use in AWS Lambda functions. These utilities enable you to configure clients once and reuse them across invocations, following AWS best practices for Lambda performance optimization.

## Overview

The utility exports the following functions:

- `initializeDynamoDBClients()` - Initialize both DynamoDB clients with optional configuration
- `getDynamoDBClient()` - Get the singleton DynamoDB client instance
- `getDynamoDBDocumentClient()` - Get the singleton DynamoDB Document client instance
- `resetDynamoDBClients()` - Reset both client instances (useful for testing)

## Usage

### Basic Usage

```typescript
import { initializeDynamoDBClients, getDynamoDBDocumentClient } from '@leanstacks/lambda-utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize both clients (typically done once outside the handler)
initializeDynamoDBClients({ region: 'us-east-1' });

export const handler = async (event: any) => {
  // Get the document client (most common use case)
  const docClient = getDynamoDBDocumentClient();

  // Use the document client
  await docClient.send(
    new PutCommand({
      TableName: 'MyTable',
      Item: { id: '123', name: 'Example' },
    }),
  );
};
```

### Using the Base DynamoDB Client

````typescript
import { initializeDynamoDBClients, getDynamoDBClient } from '@leanstacks/lambda-utils';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';

// Initialize both clients
initializeDynamoDBClients({ region: 'us-east-1' });

export const handler = async (event: any) => {
  // Get the base client for advanced use cases
  const client = getDynamoDBClient();

  // Use the base client
  await client.send(new PutItemCommand({
    TableName: 'MyTable',
    Item: { id: { S: '123' }, name: { S: 'Example' } }
  }));

### Advanced Configuration

#### Custom DynamoDB Client Configuration

```typescript
import { initializeDynamoDBClients } from '@leanstacks/lambda-utils';

initializeDynamoDBClients({
  region: 'us-west-2',
  endpoint: 'http://localhost:8000', // For local development
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});
````

#### Custom Marshall/Unmarshall Options

```typescript
import { initializeDynamoDBClients } from '@leanstacks/lambda-utils';

initializeDynamoDBClients(
  { region: 'us-east-1' },
  {
    // Marshall options
    removeUndefinedValues: true,
    convertEmptyValues: false,
    convertClassInstanceToMap: true,
  },
  {
    // Unmarshall options
    wrapNumbers: false,
  },
);
```

### Lambda Handler Pattern

```typescript
import { initializeDynamoDBClients, getDynamoDBDocumentClient } from '@leanstacks/lambda-utils';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients outside the handler (runs once per cold start)
initializeDynamoDBClients({ region: process.env.AWS_REGION }, { removeUndefinedValues: true });

// Handler function
export const handler = async (event: any) => {
  const docClient = getDynamoDBDocumentClient();

  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: event.id },
    }),
  );

  return result.Item;
};
```

## API Reference

### `initializeDynamoDBClients(config?, marshallOptions?, unmarshallOptions?): { client: DynamoDBClient; documentClient: DynamoDBDocumentClient }`

Initializes both the DynamoDB client and DynamoDB Document client with the provided configuration.

**Parameters:**

- `config` (optional) - DynamoDB client configuration object
- `marshallOptions` (optional) - Options for marshalling JavaScript objects to DynamoDB AttributeValues
- `unmarshallOptions` (optional) - Options for unmarshalling DynamoDB AttributeValues to JavaScript objects

**Returns:**

- An object containing both `client` (DynamoDBClient) and `documentClient` (DynamoDBDocumentClient)

**Notes:**

- Creates both clients in a single call
- If called multiple times, it will replace the existing client instances
- If no config is provided, uses default AWS SDK configuration
- Most users will only need the `documentClient` from the return value or via `getDynamoDBDocumentClient()`

### `getDynamoDBClient(): DynamoDBClient`

Returns the singleton DynamoDB client instance.

**Returns:**

- The `DynamoDBClient` instance

**Throws:**

- Error if the client has not been initialized

### `getDynamoDBDocumentClient(): DynamoDBDocumentClient`

Returns the singleton DynamoDB Document client instance.

**Returns:**

- The `DynamoDBDocumentClient` instance

**Throws:**

- Error if the document client has not been initialized

### `resetDynamoDBClients(): void`

Resets both DynamoDB client instances to null.

**Notes:**

- Primarily useful for testing scenarios where you need to reinitialize clients with different configurations
- After calling this, you must reinitialize the clients before using the getter functions

## Best Practices

1. **Initialize Outside the Handler**: Always initialize clients outside your Lambda handler function to reuse the instance across invocations.

2. **Use Environment Variables**: Configure clients using environment variables for flexibility across environments.

3. **Error Handling**: Always wrap client operations in try-catch blocks to handle errors gracefully.

4. **Testing**: Use `resetDynamoDBClients()` in test setup/teardown to ensure clean test isolation.

## Testing Example

```typescript
import { initializeDynamoDBClients, getDynamoDBDocumentClient, resetDynamoDBClients } from '@leanstacks/lambda-utils';

describe('MyLambdaHandler', () => {
  beforeEach(() => {
    resetDynamoDBClients();
    initializeDynamoDBClients(
      { region: 'us-east-1', endpoint: 'http://localhost:8000' },
      { removeUndefinedValues: true },
    );
  });

  afterEach(() => {
    resetDynamoDBClients();
  });

  it('should retrieve item from DynamoDB', async () => {
    // Your test code here
  });
});
```

## Related Resources

- **[AWS SDK for JavaScript v3 - DynamoDB Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/)**
- **[AWS SDK for JavaScript v3 - DynamoDB Document Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/Class/DynamoDBDocumentClient/)**
- **[AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)**
- **[Back to the project documentation](README.md)**
