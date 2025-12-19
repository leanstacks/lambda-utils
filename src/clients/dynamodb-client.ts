import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  marshallOptions as MarshallOptions,
  TranslateConfig,
  unmarshallOptions as UnmarshallOptions,
} from '@aws-sdk/lib-dynamodb';

/**
 * Singleton instance of DynamoDB client
 */
let dynamoClient: DynamoDBClient | null = null;

/**
 * Singleton instance of DynamoDB Document client
 */
let dynamoDocClient: DynamoDBDocumentClient | null = null;

/**
 * Initializes both the DynamoDB client and DynamoDB Document client with the provided configuration.
 * If the clients are already initialized, this will replace them with new instances.
 *
 * @param config - DynamoDB client configuration
 * @param marshallOptions - Options for marshalling JavaScript objects to DynamoDB AttributeValues
 * @param unmarshallOptions - Options for unmarshalling DynamoDB AttributeValues to JavaScript objects
 * @returns An object containing both the base client and document client
 *
 * @example
 * ```typescript
 * // Initialize with default configuration
 * initializeDynamoDBClients();
 *
 * // Initialize with custom configuration
 * initializeDynamoDBClients(
 *   { region: 'us-east-1' },
 *   { removeUndefinedValues: true },
 *   { wrapNumbers: false }
 * );
 * ```
 */
export const initializeDynamoDBClients = (
  config?: DynamoDBClientConfig,
  marshallOptions?: MarshallOptions,
  unmarshallOptions?: UnmarshallOptions,
): { client: DynamoDBClient; documentClient: DynamoDBDocumentClient } => {
  // Create the base DynamoDB client
  dynamoClient = new DynamoDBClient(config || {});

  // Create the DynamoDB Document client
  const translateConfig: TranslateConfig = {
    marshallOptions: marshallOptions || {},
    unmarshallOptions: unmarshallOptions || {},
  };

  dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient, translateConfig);

  return {
    client: dynamoClient,
    documentClient: dynamoDocClient,
  };
};

/**
 * Returns the singleton DynamoDB client instance.
 * Throws an error if the client has not been initialized.
 *
 * @returns The DynamoDB client instance
 * @throws Error if the client has not been initialized
 *
 * @example
 * ```typescript
 * const client = getDynamoDBClient();
 * ```
 */
export const getDynamoDBClient = (): DynamoDBClient => {
  if (!dynamoClient) {
    throw new Error('DynamoDB client not initialized. Call initializeDynamoDBClients() first.');
  }
  return dynamoClient;
};

/**
 * Returns the singleton DynamoDB Document client instance.
 * Throws an error if the client has not been initialized.
 *
 * @returns The DynamoDB Document client instance
 * @throws Error if the client has not been initialized
 *
 * @example
 * ```typescript
 * const docClient = getDynamoDBDocumentClient();
 * ```
 */
export const getDynamoDBDocumentClient = (): DynamoDBDocumentClient => {
  if (!dynamoDocClient) {
    throw new Error('DynamoDB Document client not initialized. Call initializeDynamoDBClients() first.');
  }
  return dynamoDocClient;
};

/**
 * Resets both DynamoDB client instances.
 * Useful for testing or when you need to reinitialize the clients with different configurations.
 */
export const resetDynamoDBClients = (): void => {
  dynamoClient = null;
  dynamoDocClient = null;
};
