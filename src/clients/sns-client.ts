import { PublishCommand, SNSClient, SNSClientConfig } from '@aws-sdk/client-sns';

/**
 * Interface for SNS message attributes.
 * Supports the AWS SNS data types: String, String.Array, Number, and Binary.
 * Note: String.Array is the only array type supported by AWS SNS.
 */
export interface SNSMessageAttributes {
  [key: string]: {
    DataType: 'String' | 'String.Array' | 'Number' | 'Binary';
    StringValue?: string;
    BinaryValue?: Uint8Array;
  };
}

/**
 * Singleton instance of SNS client
 */
let snsClient: SNSClient | null = null;

/**
 * Initializes the SNS client with the provided configuration.
 * If the client is already initialized, this will replace it with a new instance.
 *
 * @param config - SNS client configuration
 * @returns The SNS client instance
 *
 * @example
 * ```typescript
 * // Initialize with default configuration
 * initializeSNSClient();
 *
 * // Initialize with custom configuration
 * initializeSNSClient({ region: 'us-east-1' });
 * ```
 */
export const initializeSNSClient = (config?: SNSClientConfig): SNSClient => {
  snsClient = new SNSClient(config || {});
  return snsClient;
};

/**
 * Returns the singleton SNS client instance.
 * If the client has not been initialized, creates one with default configuration.
 *
 * @returns The SNS client instance
 *
 * @example
 * ```typescript
 * const client = getSNSClient();
 * ```
 */
export const getSNSClient = (): SNSClient => {
  if (!snsClient) {
    snsClient = new SNSClient({});
  }
  return snsClient;
};

/**
 * Resets the SNS client instance.
 * Useful for testing or when you need to reinitialize the client with a different configuration.
 */
export const resetSNSClient = (): void => {
  snsClient = null;
};

/**
 * Publishes a message to an SNS topic.
 *
 * @param topicArn - The ARN of the SNS topic to publish to
 * @param message - The message content (will be converted to JSON string)
 * @param attributes - Optional message attributes for filtering
 * @returns Promise that resolves to the message ID
 * @throws Error if the SNS publish operation fails
 *
 * @example
 * ```typescript
 * const messageId = await publishToTopic(
 *   'arn:aws:sns:us-east-1:123456789012:MyTopic',
 *   { orderId: '12345', status: 'completed' },
 *   {
 *     priority: {
 *       DataType: 'String',
 *       StringValue: 'high'
 *     },
 *     categories: {
 *       DataType: 'String.Array',
 *       StringValue: JSON.stringify(['urgent', 'vip', 'customer-request'])
 *     }
 *   }
 * );
 * ```
 */
export const publishToTopic = async (
  topicArn: string,
  message: Record<string, unknown>,
  attributes?: SNSMessageAttributes,
): Promise<string> => {
  const client = getSNSClient();

  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(message),
    MessageAttributes: attributes,
  });

  const response = await client.send(command);
  return response.MessageId ?? '';
};
