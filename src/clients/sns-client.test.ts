import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';

import { getSNSClient, initializeSNSClient, SNSMessageAttributes, publishToTopic, resetSNSClient } from './sns-client';

// Create a mock for SNSClient
const snsMock = mockClient(SNSClient);

describe('sns-client', () => {
  beforeEach(() => {
    // Reset the client and mock before each test
    resetSNSClient();
    snsMock.reset();
  });

  afterEach(() => {
    // Clean up after each test
    resetSNSClient();
    snsMock.reset();
  });

  describe('initializeSNSClient', () => {
    it('should create client with default config', () => {
      // Arrange
      // Act
      const result = initializeSNSClient();

      // Assert
      expect(result).toBeInstanceOf(SNSClient);
    });

    it('should create client with custom config', () => {
      // Arrange
      const config = { region: 'us-west-2' };

      // Act
      const result = initializeSNSClient(config);

      // Assert
      expect(result).toBeInstanceOf(SNSClient);
    });

    it('should replace existing client when called multiple times', () => {
      // Arrange
      const result1 = initializeSNSClient({ region: 'us-east-1' });

      // Act
      const result2 = initializeSNSClient({ region: 'us-west-2' });

      // Assert
      expect(result1).toBeInstanceOf(SNSClient);
      expect(result2).toBeInstanceOf(SNSClient);
      expect(result2).not.toBe(result1);
    });
  });

  describe('getSNSClient', () => {
    it('should return the initialized client', () => {
      // Arrange
      const result = initializeSNSClient();

      // Act
      const client = getSNSClient();

      // Assert
      expect(client).toBe(result);
    });

    it('should create client with default config if not initialized', () => {
      // Arrange
      // Act
      const client = getSNSClient();

      // Assert
      expect(client).toBeInstanceOf(SNSClient);
    });

    it('should return same instance on multiple calls', () => {
      // Arrange
      initializeSNSClient();

      // Act
      const client1 = getSNSClient();
      const client2 = getSNSClient();

      // Assert
      expect(client1).toBe(client2);
    });

    it('should return same instance when auto-initialized', () => {
      // Arrange
      // Act
      const client1 = getSNSClient();
      const client2 = getSNSClient();

      // Assert
      expect(client1).toBe(client2);
    });
  });

  describe('resetSNSClient', () => {
    it('should reset the client', () => {
      // Arrange
      const client1 = initializeSNSClient();

      // Act
      resetSNSClient();
      const client2 = getSNSClient();

      // Assert
      expect(client2).not.toBe(client1);
    });

    it('should allow reinitialization after reset', () => {
      // Arrange
      initializeSNSClient({ region: 'us-east-1' });
      resetSNSClient();

      // Act
      const result = initializeSNSClient({ region: 'us-west-2' });

      // Assert
      expect(result).toBeInstanceOf(SNSClient);
      expect(getSNSClient()).toBe(result);
    });
  });

  describe('publishToTopic', () => {
    const topicArn = 'arn:aws:sns:us-east-1:123456789012:MyTopic';
    const message = { orderId: '12345', status: 'completed' };
    const messageId = 'test-message-id-123';

    beforeEach(() => {
      // Mock successful publish
      snsMock.on(PublishCommand).resolves({
        MessageId: messageId,
      });
    });

    it('should publish message to topic', async () => {
      // Arrange
      initializeSNSClient();

      // Act
      const result = await publishToTopic(topicArn, message);

      // Assert
      expect(result).toBe(messageId);
      expect(snsMock.calls()).toHaveLength(1);
    });

    it('should publish message with attributes', async () => {
      // Arrange
      initializeSNSClient();
      const attributes: SNSMessageAttributes = {
        priority: {
          DataType: 'String',
          StringValue: 'high',
        },
        count: {
          DataType: 'Number',
          StringValue: '5',
        },
      };

      // Act
      const result = await publishToTopic(topicArn, message, attributes);

      // Assert
      expect(result).toBe(messageId);
      expect(snsMock.calls()).toHaveLength(1);
      const call = snsMock.call(0);
      expect(call.args[0].input).toEqual({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: attributes,
      });
    });

    it('should publish message with array data type attributes', async () => {
      // Arrange
      initializeSNSClient();
      const attributes: SNSMessageAttributes = {
        categories: {
          DataType: 'String.Array',
          StringValue: JSON.stringify(['urgent', 'vip', 'high-priority']),
        },
        department: {
          DataType: 'String',
          StringValue: 'sales',
        },
      };

      // Act
      const result = await publishToTopic(topicArn, message, attributes);

      // Assert
      expect(result).toBe(messageId);
      expect(snsMock.calls()).toHaveLength(1);
      const call = snsMock.call(0);
      expect(call.args[0].input).toEqual({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: attributes,
      });
    });

    it('should initialize client if not already initialized', async () => {
      // Arrange
      // Do not initialize the client

      // Act
      const result = await publishToTopic(topicArn, message);

      // Assert
      expect(result).toBe(messageId);
      expect(snsMock.calls()).toHaveLength(1);
    });

    it('should use singleton client instance', async () => {
      // Arrange
      initializeSNSClient();

      // Act
      await publishToTopic(topicArn, message);
      await publishToTopic(topicArn, { orderId: '67890' });

      // Assert
      expect(snsMock.calls()).toHaveLength(2);
    });

    it('should convert message to JSON string', async () => {
      // Arrange
      initializeSNSClient();
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
      await publishToTopic(topicArn, complexMessage);

      // Assert
      const call = snsMock.call(0);
      const input = call.args[0].input as { Message?: string };
      expect(input.Message).toBe(JSON.stringify(complexMessage));
    });

    it('should return empty string if MessageId is undefined', async () => {
      // Arrange
      initializeSNSClient();
      snsMock.reset();
      snsMock.on(PublishCommand).resolves({
        MessageId: undefined,
      });

      // Act
      const result = await publishToTopic(topicArn, message);

      // Assert
      expect(result).toBe('');
    });

    it('should throw error if publish fails', async () => {
      // Arrange
      initializeSNSClient();
      const error = new Error('Failed to publish message');
      snsMock.reset();
      snsMock.on(PublishCommand).rejects(error);

      // Act & Assert
      await expect(publishToTopic(topicArn, message)).rejects.toThrow('Failed to publish message');
    });

    it('should throw error if SNS service is unavailable', async () => {
      // Arrange
      initializeSNSClient();
      snsMock.reset();
      snsMock.on(PublishCommand).rejects(new Error('Service Unavailable'));

      // Act & Assert
      await expect(publishToTopic(topicArn, message)).rejects.toThrow('Service Unavailable');
    });
  });
});
