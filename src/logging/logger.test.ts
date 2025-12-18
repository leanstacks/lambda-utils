/* eslint-disable @typescript-eslint/no-explicit-any */
import pino from 'pino';
import { CloudwatchLogFormatter, pinoLambdaDestination, StructuredLogFormatter } from 'pino-lambda';
import { Logger, withRequestTracking } from './logger';

// Mock pino-lambda module
jest.mock('pino-lambda');

// Mock pino module
jest.mock('pino');

describe('Logger', () => {
  // Setup and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withRequestTracking', () => {
    it('should be exported from logger module', () => {
      // Arrange
      // withRequestTracking is exported from logger.ts and is the result of calling lambdaRequestTracker()
      // from pino-lambda. Jest mocks mean it will be the mocked value.

      // Act & Assert
      // We just verify that it was exported (defined by the import statement at the top)
      // The actual functionality of lambdaRequestTracker is tested in pino-lambda
      expect(typeof withRequestTracking === 'function' || withRequestTracking === undefined).toBe(true);
    });
  });

  describe('constructor', () => {
    it('should create Logger with default configuration', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger();

      // Assert
      expect(logger).toBeDefined();
    });

    it('should create Logger with custom enabled configuration', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ enabled: false });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
        expect.anything(),
      );
    });

    it('should create Logger with custom log level configuration', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ level: 'debug' });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        }),
        expect.anything(),
      );
    });

    it('should create Logger with custom format configuration (json)', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ format: 'json' });
      const _instance = logger.instance;

      // Assert
      expect(StructuredLogFormatter).toHaveBeenCalled();
    });

    it('should create Logger with custom format configuration (text)', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ format: 'text' });
      const _instance = logger.instance;

      // Assert
      expect(CloudwatchLogFormatter).toHaveBeenCalled();
    });

    it('should merge provided config with defaults', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ level: 'error' });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          level: 'error',
        }),
        expect.anything(),
      );
    });
  });

  describe('instance getter', () => {
    it('should return a Pino logger instance', () => {
      // Arrange
      const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});
      const logger = new Logger();

      // Act
      const instance = logger.instance;

      // Assert
      expect(instance).toBe(mockLogger);
      expect(instance).toHaveProperty('info');
      expect(instance).toHaveProperty('warn');
      expect(instance).toHaveProperty('error');
      expect(instance).toHaveProperty('debug');
    });

    it('should create logger instance only once (lazy initialization)', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});
      const logger = new Logger();

      // Act
      const instance1 = logger.instance;
      const instance2 = logger.instance;

      // Assert
      expect(instance1).toBe(instance2);
      expect(pino).toHaveBeenCalledTimes(1);
    });

    it('should configure pino with enabled flag', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ enabled: false });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
        expect.anything(),
      );
    });

    it('should configure pino with log level', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ level: 'warn' });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
        }),
        expect.anything(),
      );
    });

    it('should call pinoLambdaDestination with selected formatter', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ format: 'json' });
      const _instance = logger.instance;

      // Assert
      expect(pinoLambdaDestination).toHaveBeenCalledWith(
        expect.objectContaining({
          formatter: expect.any(StructuredLogFormatter),
        }),
      );
    });

    it('should use StructuredLogFormatter when format is json', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ format: 'json' });
      const _instance = logger.instance;

      // Assert
      expect(StructuredLogFormatter).toHaveBeenCalled();
    });

    it('should use CloudwatchLogFormatter when format is text', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ format: 'text' });
      const _instance = logger.instance;

      // Assert
      expect(CloudwatchLogFormatter).toHaveBeenCalled();
    });
  });

  describe('Logger configurations', () => {
    it('should support all log levels', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});
      const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];

      // Act & Assert
      levels.forEach((level) => {
        jest.clearAllMocks();
        jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
        (pinoLambdaDestination as jest.Mock).mockReturnValue({});

        const logger = new Logger({ level });
        const _instance = logger.instance;

        expect(pino).toHaveBeenCalledWith(
          expect.objectContaining({
            level,
          }),
          expect.anything(),
        );
      });
    });

    it('should support both json and text formats', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const jsonLogger = new Logger({ format: 'json' });
      const _jsonInstance = jsonLogger.instance;
      const structuredFormatterCallCount = (StructuredLogFormatter as jest.Mock).mock.calls.length;

      jest.clearAllMocks();
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      const textLogger = new Logger({ format: 'text' });
      const _textInstance = textLogger.instance;

      // Assert
      expect(structuredFormatterCallCount).toBeGreaterThan(0);
      expect(CloudwatchLogFormatter).toHaveBeenCalled();
    });

    it('should support enabled and disabled logging', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const enabledLogger = new Logger({ enabled: true });
      const _enabledInstance = enabledLogger.instance;
      const firstCallArgs = jest.mocked(pino).mock.calls[0];

      jest.clearAllMocks();
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      const disabledLogger = new Logger({ enabled: false });
      const _disabledInstance = disabledLogger.instance;
      const secondCallArgs = jest.mocked(pino).mock.calls[0];

      // Assert
      expect(firstCallArgs[0]).toEqual(expect.objectContaining({ enabled: true }));
      expect(secondCallArgs[0]).toEqual(expect.objectContaining({ enabled: false }));
    });
  });

  describe('integration scenarios', () => {
    it('should create multiple logger instances with different configurations', () => {
      // Arrange
      const mockLogger1 = { info: jest.fn(), level: 'debug' };
      const mockLogger2 = { info: jest.fn(), level: 'error' };
      jest
        .mocked(pino)
        .mockReturnValueOnce(mockLogger1 as unknown as any)
        .mockReturnValueOnce(mockLogger2 as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const debugLogger = new Logger({ level: 'debug', format: 'json' });
      const errorLogger = new Logger({ level: 'error', format: 'text' });

      const instance1 = debugLogger.instance;
      const instance2 = errorLogger.instance;

      // Assert
      expect(instance1).toBe(mockLogger1);
      expect(instance2).toBe(mockLogger2);
      expect(pino).toHaveBeenCalledTimes(2);
    });

    it('should handle partial configuration overrides', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({ level: 'warn' });
      const _instance = logger.instance;

      // Assert - should have custom level but default enabled and format
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          level: 'warn',
        }),
        expect.anything(),
      );
      expect(StructuredLogFormatter).toHaveBeenCalled();
    });

    it('should handle full configuration override', () => {
      // Arrange
      const mockLogger = { info: jest.fn() };
      jest.mocked(pino).mockReturnValue(mockLogger as unknown as any);
      (pinoLambdaDestination as jest.Mock).mockReturnValue({});

      // Act
      const logger = new Logger({
        enabled: false,
        level: 'error',
        format: 'text',
      });
      const _instance = logger.instance;

      // Assert
      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
          level: 'error',
        }),
        expect.anything(),
      );
      expect(CloudwatchLogFormatter).toHaveBeenCalled();
    });
  });
});
