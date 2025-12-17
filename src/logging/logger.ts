import pino from 'pino';
import { CloudwatchLogFormatter, pinoLambdaDestination, StructuredLogFormatter } from 'pino-lambda';

/**
 * Initialize Pino Lambda destination
 * @see https://www.npmjs.com/package/pino-lambda#best-practices
 */
const _lambdaDestination = pinoLambdaDestination({
  formatter: process.env.LOGGING_FORMAT === 'json' ? new StructuredLogFormatter() : new CloudwatchLogFormatter(),
});

/**
 * Pino logger instance
 */
export const logger = pino(
  {
    enabled: process.env.LOGGING_ENABLED === 'true',
    level: process.env.LOGGING_LEVEL,
  },
  _lambdaDestination,
);
