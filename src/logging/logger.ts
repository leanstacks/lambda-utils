import pino from 'pino';
import {
  CloudwatchLogFormatter,
  lambdaRequestTracker,
  pinoLambdaDestination,
  StructuredLogFormatter,
} from 'pino-lambda';

/**
 * Logger middleware which adds AWS Lambda attributes to log messages.
 *
 * @example
 * ```typescript
 * import { withRequestTracking } from '@leanstacks/lambda-utils';
 *
 * export const handler = async (event, context) => {
 *   withRequestTracking(event, context);
 *
 *   // Your Lambda handler logic here
 * };
 * ```
 */
export const withRequestTracking = lambdaRequestTracker();

/**
 * Configuration options for the Logger
 */
export interface LoggerConfig {
  /** Whether logging is enabled */
  enabled?: boolean;
  /** Minimum log level (e.g., 'debug', 'info', 'warn', 'error') */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Output format: 'json' for StructuredLogFormatter, 'text' for CloudwatchLogFormatter */
  format?: 'json' | 'text';
}

/**
 * Logger class which provides a Pino logger instance with AWS Lambda attributes.
 *
 * @example
 * ```typescript
 * import { Logger } from '@leanstacks/lambda-utils';
 * const logger = new Logger().instance;
 *
 * logger.info('Hello, world!');
 * ```
 */
export class Logger {
  private _loggerConfig: LoggerConfig = {
    enabled: true,
    level: 'info',
    format: 'json',
  };

  private _instance: pino.Logger | null = null;

  constructor(config?: LoggerConfig) {
    if (config) {
      this._loggerConfig = {
        enabled: config.enabled ?? true,
        level: config.level ?? 'info',
        format: config.format ?? 'json',
      };
    }
  }

  /**
   * Creates a new, fully configured Pino logger instance.
   */
  private _createLogger = (): pino.Logger => {
    const formatter =
      this._loggerConfig.format === 'json' ? new StructuredLogFormatter() : new CloudwatchLogFormatter();

    const lambdaDestination = pinoLambdaDestination({
      formatter,
    });

    return pino(
      {
        enabled: this._loggerConfig.enabled,
        level: this._loggerConfig.level,
      },
      lambdaDestination,
    );
  };

  /**
   * Get the logger instance.
   *
   * @example
   * ```typescript
   * import { Logger } from '@leanstacks/lambda-utils';
   * const logger = new Logger().instance;
   *
   * logger.info('Hello, world!');
   * ```
   */
  get instance(): pino.Logger {
    if (this._instance === null) {
      this._instance = this._createLogger();
    }
    return this._instance;
  }
}
