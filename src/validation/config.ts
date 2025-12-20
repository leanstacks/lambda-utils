import { z } from 'zod';

/**
 * Interface for a configuration manager instance
 */
export interface ConfigManager<T> {
  /**
   * Get the validated configuration (cached after first call)
   * @throws {Error} if validation fails
   * @returns The validated configuration object
   */
  get: () => T;

  /**
   * Refresh the configuration by re-validating environment variables
   * Useful in tests when environment variables are changed
   * @throws {Error} if validation fails
   * @returns The newly validated configuration object
   */
  refresh: () => T;
}

/**
 * Creates a reusable configuration manager for any Lambda function
 *
 * @template T - The configuration type inferred from the provided Zod schema
 * @param schema - A Zod schema that defines the structure and validation rules for environment variables
 * @returns A ConfigManager instance with get() and refresh() methods
 *
 * @example
 * ```typescript
 * // Define your schema
 * const configSchema = z.object({
 *   TABLE_NAME: z.string().min(1),
 *   AWS_REGION: z.string().default('us-east-1'),
 * });
 *
 * // Create config manager
 * const configManager = createConfigManager(configSchema);
 *
 * // Access configuration (cached on first call)
 * const config = configManager.get();
 *
 * // Type your config
 * type Config = z.infer<typeof configSchema>;
 * ```
 */
export const createConfigManager = <T extends z.ZodSchema>(schema: T): ConfigManager<z.infer<T>> => {
  let cache: z.infer<T> | null = null;

  const _validateConfig = (): z.infer<T> => {
    try {
      // Parse and validate environment variables against the schema
      return schema.parse(process.env);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

        throw new Error(`Configuration validation failed: ${errorMessage}`);
      }

      // Re-throw other errors
      throw error;
    }
  };

  return {
    get: (): z.infer<T> => {
      if (!cache) {
        cache = _validateConfig();
      }
      return cache;
    },

    refresh: (): z.infer<T> => {
      cache = _validateConfig();
      return cache;
    },
  };
};
