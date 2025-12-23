import { SendMessageCommand, SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';

/**
 * Interface for SQS message attributes.
 * Supports the AWS SQS data types: String, Number, and Binary.
 */
export interface SQSMessageAttributes {
  [key: string]: {
    DataType: 'String' | 'Number' | 'Binary';
    StringValue?: string;
    BinaryValue?: Uint8Array;
  };
}

/**
 * Singleton instance of SQS client
 */
let sqsClient: SQSClient | null = null;

/**
 * Initializes the SQS client with the provided configuration.
 * If the client is already initialized, this will replace it with a new instance.
 *
 * @param config - SQS client configuration
 * @returns The SQS client instance
 *
 * @example
 * ```typescript
 * // Initialize with default configuration
 * initializeSQSClient();
 *
 * // Initialize with custom configuration
 * initializeSQSClient({ region: 'us-east-1' });
 * ```
 */
export const initializeSQSClient = (config?: SQSClientConfig): SQSClient => {
  sqsClient = new SQSClient(config || {});
  return sqsClient;
};

/**
 * Returns the singleton SQS client instance.
 * If the client has not been initialized, creates one with default configuration.
 *
 * @returns The SQS client instance
 *
 * @example
 * ```typescript
 * const client = getSQSClient();
 * ```
 */
export const getSQSClient = (): SQSClient => {
  if (!sqsClient) {
    sqsClient = new SQSClient({});
  }
  return sqsClient;
};

/**
 * Resets the SQS client instance.
 * Useful for testing or when you need to reinitialize the client with a different configuration.
 */
export const resetSQSClient = (): void => {
  sqsClient = null;
};

/**
 * Sends a message to an SQS queue.
 *
 * @param queueUrl - The URL of the SQS queue to send to
 * @param message - The message content (will be converted to JSON string)
 * @param attributes - Optional message attributes for filtering
 * @returns Promise that resolves to the message ID
 * @throws Error if the SQS send operation fails
 *
 * @example
 * ```typescript
 * const messageId = await sendToQueue(
 *   'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue',
 *   { orderId: '12345', status: 'completed' },
 *   {
 *     priority: {
 *       DataType: 'String',
 *       StringValue: 'high'
 *     },
 *     attempts: {
 *       DataType: 'Number',
 *       StringValue: '1'
 *     }
 *   }
 * );
 * ```
 */
export const sendToQueue = async (
  queueUrl: string,
  message: Record<string, unknown>,
  attributes?: SQSMessageAttributes,
): Promise<string> => {
  const client = getSQSClient();

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: attributes,
  });

  const response = await client.send(command);
  return response.MessageId ?? '';
};
