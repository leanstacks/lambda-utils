import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';

import { getSQSClient, initializeSQSClient, SQSMessageAttributes, sendToQueue, resetSQSClient } from './sqs-client';

// Create a mock for SQSClient
const sqsMock = mockClient(SQSClient);

describe('sqs-client', () => {
  beforeEach(() => {
    // Reset the client and mock before each test
    resetSQSClient();
    sqsMock.reset();
  });

  afterEach(() => {
    // Clean up after each test
    resetSQSClient();
    sqsMock.reset();
  });

  describe('initializeSQSClient', () => {
    it('should create client with default config', () => {
      // Arrange
      // Act
      const result = initializeSQSClient();

      // Assert
      expect(result).toBeInstanceOf(SQSClient);
    });

    it('should create client with custom config', () => {
      // Arrange
      const config = { region: 'us-west-2' };

      // Act
      const result = initializeSQSClient(config);

      // Assert
      expect(result).toBeInstanceOf(SQSClient);
    });

    it('should replace existing client when called multiple times', () => {
      // Arrange
      const result1 = initializeSQSClient({ region: 'us-east-1' });

      // Act
      const result2 = initializeSQSClient({ region: 'us-west-2' });

      // Assert
      expect(result1).toBeInstanceOf(SQSClient);
      expect(result2).toBeInstanceOf(SQSClient);
      expect(result2).not.toBe(result1);
    });
  });

  describe('getSQSClient', () => {
    it('should return the initialized client', () => {
      // Arrange
      const result = initializeSQSClient();

      // Act
      const client = getSQSClient();

      // Assert
      expect(client).toBe(result);
    });

    it('should create client with default config if not initialized', () => {
      // Arrange
      // Act
      const client = getSQSClient();

      // Assert
      expect(client).toBeInstanceOf(SQSClient);
    });

    it('should return same instance on multiple calls', () => {
      // Arrange
      initializeSQSClient();

      // Act
      const client1 = getSQSClient();
      const client2 = getSQSClient();

      // Assert
      expect(client1).toBe(client2);
    });

    it('should return same instance when auto-initialized', () => {
      // Arrange
      // Act
      const client1 = getSQSClient();
      const client2 = getSQSClient();

      // Assert
      expect(client1).toBe(client2);
    });
  });

  describe('resetSQSClient', () => {
    it('should reset the client', () => {
      // Arrange
      const client1 = initializeSQSClient();

      // Act
      resetSQSClient();
      const client2 = getSQSClient();

      // Assert
      expect(client2).not.toBe(client1);
    });

    it('should allow reinitialization after reset', () => {
      // Arrange
      initializeSQSClient({ region: 'us-east-1' });
      resetSQSClient();

      // Act
      const result = initializeSQSClient({ region: 'us-west-2' });

      // Assert
      expect(result).toBeInstanceOf(SQSClient);
      expect(getSQSClient()).toBe(result);
    });
  });

  describe('sendToQueue', () => {
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue';
    const message = { orderId: '12345', status: 'completed' };
    const messageId = 'test-message-id-123';

    beforeEach(() => {
      // Mock successful send
      sqsMock.on(SendMessageCommand).resolves({
        MessageId: messageId,
      });
    });

    it('should send message to queue', async () => {
      // Arrange
      initializeSQSClient();

      // Act
      const result = await sendToQueue(queueUrl, message);

      // Assert
      expect(result).toBe(messageId);
      expect(sqsMock.calls()).toHaveLength(1);
    });

    it('should send message with attributes', async () => {
      // Arrange
      initializeSQSClient();
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

      // Act
      const result = await sendToQueue(queueUrl, message, attributes);

      // Assert
      expect(result).toBe(messageId);
      expect(sqsMock.calls()).toHaveLength(1);
      const call = sqsMock.call(0);
      expect(call.args[0].input).toEqual({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: attributes,
      });
    });

    it('should send message with binary data attributes', async () => {
      // Arrange
      initializeSQSClient();
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const attributes: SQSMessageAttributes = {
        imageData: {
          DataType: 'Binary',
          BinaryValue: binaryData,
        },
        priority: {
          DataType: 'String',
          StringValue: 'normal',
        },
      };

      // Act
      const result = await sendToQueue(queueUrl, message, attributes);

      // Assert
      expect(result).toBe(messageId);
      expect(sqsMock.calls()).toHaveLength(1);
      const call = sqsMock.call(0);
      expect(call.args[0].input).toEqual({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: attributes,
      });
    });

    it('should initialize client if not already initialized', async () => {
      // Arrange
      // Do not initialize the client

      // Act
      const result = await sendToQueue(queueUrl, message);

      // Assert
      expect(result).toBe(messageId);
      expect(sqsMock.calls()).toHaveLength(1);
    });

    it('should use singleton client instance', async () => {
      // Arrange
      initializeSQSClient();

      // Act
      await sendToQueue(queueUrl, message);
      await sendToQueue(queueUrl, { orderId: '67890' });

      // Assert
      expect(sqsMock.calls()).toHaveLength(2);
    });

    it('should convert message to JSON string', async () => {
      // Arrange
      initializeSQSClient();
      const complexMessage = {
        orderId: '12345',
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        metadata: {
          source: 'web',
          timestamp: '2025-12-23T12:00:00Z',
        },
      };

      // Act
      await sendToQueue(queueUrl, complexMessage);

      // Assert
      const call = sqsMock.call(0);
      const input = call.args[0].input as { MessageBody?: string };
      expect(input.MessageBody).toBe(JSON.stringify(complexMessage));
    });

    it('should return empty string if MessageId is undefined', async () => {
      // Arrange
      initializeSQSClient();
      sqsMock.reset();
      sqsMock.on(SendMessageCommand).resolves({
        MessageId: undefined,
      });

      // Act
      const result = await sendToQueue(queueUrl, message);

      // Assert
      expect(result).toBe('');
    });

    it('should throw error if send fails', async () => {
      // Arrange
      initializeSQSClient();
      const error = new Error('Failed to send message');
      sqsMock.reset();
      sqsMock.on(SendMessageCommand).rejects(error);

      // Act & Assert
      await expect(sendToQueue(queueUrl, message)).rejects.toThrow('Failed to send message');
    });

    it('should throw error if SQS service is unavailable', async () => {
      // Arrange
      initializeSQSClient();
      sqsMock.reset();
      sqsMock.on(SendMessageCommand).rejects(new Error('Service Unavailable'));

      // Act & Assert
      await expect(sendToQueue(queueUrl, message)).rejects.toThrow('Service Unavailable');
    });
  });
});
