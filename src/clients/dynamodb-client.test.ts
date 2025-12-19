import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import {
  getDynamoDBClient,
  getDynamoDBDocumentClient,
  initializeDynamoDBClients,
  resetDynamoDBClients,
} from './dynamodb-client';

describe('dynamodb-client', () => {
  beforeEach(() => {
    // Reset clients before each test
    resetDynamoDBClients();
  });

  afterEach(() => {
    // Clean up after each test
    resetDynamoDBClients();
  });

  describe('initializeDynamoDBClients', () => {
    it('should create both clients with default config', () => {
      // Arrange
      // Act
      const result = initializeDynamoDBClients();

      // Assert
      expect(result.client).toBeInstanceOf(DynamoDBClient);
      expect(result.documentClient).toBeInstanceOf(DynamoDBDocumentClient);
    });

    it('should create both clients with custom config', () => {
      // Arrange
      const config = { region: 'us-west-2' };
      const marshallOptions = { removeUndefinedValues: true };
      const unmarshallOptions = { wrapNumbers: false };

      // Act
      const result = initializeDynamoDBClients(config, marshallOptions, unmarshallOptions);

      // Assert
      expect(result.client).toBeInstanceOf(DynamoDBClient);
      expect(result.documentClient).toBeInstanceOf(DynamoDBDocumentClient);
    });

    it('should replace existing clients when called multiple times', () => {
      // Arrange
      const result1 = initializeDynamoDBClients({ region: 'us-east-1' });

      // Act
      const result2 = initializeDynamoDBClients({ region: 'us-west-2' });

      // Assert
      expect(result1.client).toBeInstanceOf(DynamoDBClient);
      expect(result1.documentClient).toBeInstanceOf(DynamoDBDocumentClient);
      expect(result2.client).toBeInstanceOf(DynamoDBClient);
      expect(result2.documentClient).toBeInstanceOf(DynamoDBDocumentClient);
      expect(result2.client).not.toBe(result1.client);
      expect(result2.documentClient).not.toBe(result1.documentClient);
    });

    it('should create document client from base client', () => {
      // Arrange
      // Act
      const result = initializeDynamoDBClients();
      const baseClient = getDynamoDBClient();

      // Assert
      expect(result.client).toBe(baseClient);
    });
  });

  describe('getDynamoDBClient', () => {
    it('should return the initialized client', () => {
      // Arrange
      const result = initializeDynamoDBClients();

      // Act
      const client = getDynamoDBClient();

      // Assert
      expect(client).toBe(result.client);
    });

    it('should throw error if client not initialized', () => {
      // Arrange
      // Act & Assert
      expect(() => getDynamoDBClient()).toThrow(
        'DynamoDB client not initialized. Call initializeDynamoDBClients() first.',
      );
    });

    it('should return same instance on multiple calls', () => {
      // Arrange
      initializeDynamoDBClients();

      // Act
      const client1 = getDynamoDBClient();
      const client2 = getDynamoDBClient();

      // Assert
      expect(client1).toBe(client2);
    });
  });

  describe('getDynamoDBDocumentClient', () => {
    it('should return the initialized document client', () => {
      // Arrange
      const result = initializeDynamoDBClients();

      // Act
      const client = getDynamoDBDocumentClient();

      // Assert
      expect(client).toBe(result.documentClient);
    });

    it('should throw error if document client not initialized', () => {
      // Arrange
      // Act & Assert
      expect(() => getDynamoDBDocumentClient()).toThrow(
        'DynamoDB Document client not initialized. Call initializeDynamoDBClients() first.',
      );
    });

    it('should return same instance on multiple calls', () => {
      // Arrange
      initializeDynamoDBClients();

      // Act
      const client1 = getDynamoDBDocumentClient();
      const client2 = getDynamoDBDocumentClient();

      // Assert
      expect(client1).toBe(client2);
    });
  });

  describe('resetDynamoDBClients', () => {
    it('should reset both clients', () => {
      // Arrange
      initializeDynamoDBClients();

      // Act
      resetDynamoDBClients();

      // Assert
      expect(() => getDynamoDBClient()).toThrow();
      expect(() => getDynamoDBDocumentClient()).toThrow();
    });

    it('should allow reinitialization after reset', () => {
      // Arrange
      initializeDynamoDBClients({ region: 'us-east-1' });
      resetDynamoDBClients();

      // Act
      const result = initializeDynamoDBClients({ region: 'us-west-2' });

      // Assert
      expect(result.client).toBeInstanceOf(DynamoDBClient);
      expect(result.documentClient).toBeInstanceOf(DynamoDBDocumentClient);
      expect(getDynamoDBClient()).toBe(result.client);
      expect(getDynamoDBDocumentClient()).toBe(result.documentClient);
    });
  });
});
