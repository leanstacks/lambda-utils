import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import {
  getLambdaClient,
  initializeLambdaClient,
  invokeLambdaAsync,
  invokeLambdaSync,
  resetLambdaClient,
} from './lambda-client';

// Create a mock for the Lambda client
const lambdaClientMock = mockClient(LambdaClient);

describe('lambda-client', () => {
  beforeEach(() => {
    // Reset the Lambda client before each test
    resetLambdaClient();
    // Reset all mocks
    lambdaClientMock.reset();
  });

  afterEach(() => {
    // Clean up after each test
    resetLambdaClient();
  });

  describe('initializeLambdaClient', () => {
    it('should create a new Lambda client with default config', () => {
      // Arrange
      // Act
      const client = initializeLambdaClient();

      // Assert
      expect(client).toBeInstanceOf(LambdaClient);
    });

    it('should create a new Lambda client with custom config', () => {
      // Arrange
      const config = { region: 'us-west-2' };

      // Act
      const client = initializeLambdaClient(config);

      // Assert
      expect(client).toBeInstanceOf(LambdaClient);
    });

    it('should replace existing client when called again', () => {
      // Arrange
      const firstClient = initializeLambdaClient({ region: 'us-east-1' });

      // Act
      const secondClient = initializeLambdaClient({ region: 'us-west-2' });

      // Assert
      expect(secondClient).toBeInstanceOf(LambdaClient);
      expect(secondClient).not.toBe(firstClient);
    });
  });

  describe('getLambdaClient', () => {
    it('should return the initialized client', () => {
      // Arrange
      const initializedClient = initializeLambdaClient();

      // Act
      const client = getLambdaClient();

      // Assert
      expect(client).toBe(initializedClient);
    });

    it('should create a client with default config if not initialized', () => {
      // Arrange
      // Act
      const client = getLambdaClient();

      // Assert
      expect(client).toBeInstanceOf(LambdaClient);
    });

    it('should return the same instance on multiple calls', () => {
      // Arrange
      // Act
      const firstCall = getLambdaClient();
      const secondCall = getLambdaClient();

      // Assert
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('resetLambdaClient', () => {
    it('should reset the client instance', () => {
      // Arrange
      const firstClient = getLambdaClient();

      // Act
      resetLambdaClient();
      const secondClient = getLambdaClient();

      // Assert
      expect(secondClient).toBeInstanceOf(LambdaClient);
      expect(secondClient).not.toBe(firstClient);
    });
  });

  describe('invokeLambdaSync', () => {
    it('should invoke Lambda function synchronously and return parsed response', async () => {
      // Arrange
      const functionName = 'test-function';
      const payload = { key: 'value', data: { nested: true } };
      const responsePayload = { result: 'success', statusCode: 200 };

      // Create a Uint8Array from the JSON string
      const responseBytes = new TextEncoder().encode(JSON.stringify(responsePayload));

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 200,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Payload: responseBytes as any,
      });

      // Act
      const result = await invokeLambdaSync(functionName, payload);

      // Assert
      expect(result).toEqual(responsePayload);
      expect(lambdaClientMock.calls()).toHaveLength(1);

      // Verify the command was called with correct parameters
      const call = lambdaClientMock.call(0);
      expect(call.args[0].input).toEqual({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
      });
    });

    it('should return null when response payload is undefined', async () => {
      // Arrange
      const functionName = 'test-function';
      const payload = { key: 'value' };

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 200,
        Payload: undefined,
      });

      // Act
      const result = await invokeLambdaSync(functionName, payload);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle typed response correctly', async () => {
      // Arrange
      interface MyResponse {
        result: string;
        statusCode: number;
      }
      const functionName = 'test-function';
      const payload = { key: 'value' };
      const responsePayload: MyResponse = { result: 'success', statusCode: 200 };

      const responseBytes = new TextEncoder().encode(JSON.stringify(responsePayload));

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 200,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Payload: responseBytes as any,
      });

      // Act
      const result = await invokeLambdaSync<MyResponse>(functionName, payload);

      // Assert
      expect(result.result).toBe('success');
      expect(result.statusCode).toBe(200);
    });

    it('should throw error when function error is returned', async () => {
      // Arrange
      const functionName = 'test-function';
      const payload = { key: 'value' };

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 200,
        FunctionError: 'Unhandled',
      });

      // Act & Assert
      await expect(invokeLambdaSync(functionName, payload)).rejects.toThrow('Lambda function error: Unhandled');
    });

    it('should propagate AWS SDK errors', async () => {
      // Arrange
      const functionName = 'test-function';
      const payload = { key: 'value' };
      const awsError = new Error('AWS service error');

      lambdaClientMock.on(InvokeCommand).rejects(awsError);

      // Act & Assert
      await expect(invokeLambdaSync(functionName, payload)).rejects.toThrow('AWS service error');
    });
  });

  describe('invokeLambdaAsync', () => {
    it('should invoke Lambda function asynchronously', async () => {
      // Arrange
      const functionName = 'test-async-function';
      const payload = { eventType: 'process', data: [1, 2, 3] };

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 202,
      });

      // Act
      await invokeLambdaAsync(functionName, payload);

      // Assert
      expect(lambdaClientMock.calls()).toHaveLength(1);

      // Verify the command was called with correct parameters
      const call = lambdaClientMock.call(0);
      expect(call.args[0].input).toEqual({
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload),
      });
    });

    it('should throw error when function error is returned', async () => {
      // Arrange
      const functionName = 'test-async-function';
      const payload = { key: 'value' };

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 202,
        FunctionError: 'Unhandled',
      });

      // Act & Assert
      await expect(invokeLambdaAsync(functionName, payload)).rejects.toThrow('Lambda function error: Unhandled');
    });

    it('should propagate AWS SDK errors', async () => {
      // Arrange
      const functionName = 'test-async-function';
      const payload = { key: 'value' };
      const awsError = new Error('AWS service error');

      lambdaClientMock.on(InvokeCommand).rejects(awsError);

      // Act & Assert
      await expect(invokeLambdaAsync(functionName, payload)).rejects.toThrow('AWS service error');
    });

    it('should not wait for function execution to complete', async () => {
      // Arrange
      const functionName = 'test-async-function';
      const payload = { key: 'value' };

      lambdaClientMock.on(InvokeCommand).resolves({
        StatusCode: 202,
      });

      // Act
      const startTime = Date.now();
      await invokeLambdaAsync(functionName, payload);
      const duration = Date.now() - startTime;

      // Assert
      // The call should return immediately (within reasonable test time)
      expect(duration).toBeLessThan(1000);
    });
  });
});
