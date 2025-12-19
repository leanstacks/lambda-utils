import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Represents the headers for an API Gateway response
 */
export type Headers = Record<string, string | number | boolean>;

/**
 * Commonly used headers for API Gateway responses
 */
export const httpHeaders = {
  /** Content-Type: <type> */
  contentType: (type: string) => ({ 'Content-Type': type }),
  /** Content-Type: application/json */
  json: { 'Content-Type': 'application/json' },
  /** Access-Control-Allow-Origin: <origin> */
  cors: (origin: string = '*') => ({ 'Access-Control-Allow-Origin': origin }),
};

/**
 * Creates a standardized API Gateway response.
 * @param statusCode The HTTP status code of the response
 * @param body The body of the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 *
 * @example
 * ```ts
 * const response = createResponse(200, { message: 'Success' }, httpHeaders.json);
 * ```
 */
export const createResponse = (statusCode: number, body: unknown, headers: Headers = {}): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

// Common response patterns
/**
 * Creates a 200 OK API Gateway response
 * @param body The body of the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = ok({ message: 'Success' }, httpHeaders.json);
 * ```
 */
export const ok = (body: unknown, headers: Headers = {}): APIGatewayProxyResult => createResponse(200, body, headers);

/**
 * Creates a 201 Created API Gateway response
 * @param body The body of the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = created({ message: 'Resource created' }, httpHeaders.json);
 * ```
 */
export const created = (body: unknown, headers: Headers = {}): APIGatewayProxyResult =>
  createResponse(201, body, headers);

/**
 * Creates a 204 No Content API Gateway response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = noContent(httpHeaders.cors());
 * ```
 */
export const noContent = (headers: Headers = {}): APIGatewayProxyResult => createResponse(204, {}, headers);

/**
 * Creates a 400 Bad Request API Gateway response
 * @param message The error message to include in the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = badRequest('Invalid input', httpHeaders.json);
 * ```
 */
export const badRequest = (message = 'Bad Request', headers: Headers = {}): APIGatewayProxyResult =>
  createResponse(400, { message }, headers);

/**
 * Creates a 404 Not Found API Gateway response
 * @param message The error message to include in the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = notFound('Resource not found', httpHeaders.json);
 * ```
 */
export const notFound = (message = 'Not Found', headers: Headers = {}): APIGatewayProxyResult =>
  createResponse(404, { message }, headers);

/**
 * Creates a 500 Internal Server Error API Gateway response
 * @param message The error message to include in the response
 * @param headers Optional headers to include in the response
 * @returns An API Gateway proxy result
 * @example
 * ```ts
 * const response = internalServerError('Something went wrong', httpHeaders.json);
 * ```
 */
export const internalServerError = (message = 'Internal Server Error', headers: Headers = {}): APIGatewayProxyResult =>
  createResponse(500, { message }, headers);
