import pino from 'pino';
import { CloudwatchLogFormatter, pinoLambdaDestination, StructuredLogFormatter } from 'pino-lambda';

/**
 * Configuration options for the Pino Lambda logger
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
 * Module-level state to store logger configuration
 */
let _loggerConfig: LoggerConfig = {
  enabled: true,
  level: 'info',
  format: 'json',
};

/**
 * Module-level cache for the logger instance
 */
let _loggerInstance: pino.Logger | null = null;

/**
 * Create and return the Pino Lambda logger instance
 * Uses the configuration set by initializeLogger
 * Logger instance is cached after first creation
 */
const _createLogger = (): pino.Logger => {
  const formatter = _loggerConfig.format === 'json' ? new StructuredLogFormatter() : new CloudwatchLogFormatter();

  const lambdaDestination = pinoLambdaDestination({
    formatter,
  });

  return pino(
    {
      enabled: _loggerConfig.enabled,
      level: _loggerConfig.level,
    },
    lambdaDestination,
  );
};

/**
 * Get the cached logger instance, creating it if necessary
 */
const _getLogger = (): pino.Logger => {
  if (_loggerInstance === null) {
    _loggerInstance = _createLogger();
  }
  return _loggerInstance;
};

/**
 * Initialize the logger with configuration
 * Should be called once at Lambda handler entry point
 * Invalidates the cached logger instance so a new one is created with the updated config
 *
 * @param config Logger configuration options
 * @returns void
 *
 * @example
 * ```typescript
 * import { initializeLogger } from '@utils/logging/logger';
 *
 * initializeLogger({
 *   enabled: true,
 *   level: 'debug',
 *   format: 'json',
 * });
 * ```
 */
export const initializeLogger = (config: LoggerConfig): void => {
  _loggerConfig = {
    enabled: config.enabled ?? true,
    level: config.level ?? 'info',
    format: config.format ?? 'json',
  };
  // Invalidate the cached logger instance so a new one is created with updated config
  _loggerInstance = null;
};

/**
 * Pino logger instance
 * Configuration is supplied via initializeLogger() and persists across imports
 * Logger instance is cached after first creation for reuse
 */
export const logger = _getLogger();
