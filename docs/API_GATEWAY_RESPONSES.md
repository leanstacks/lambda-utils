# API Gateway Responses Guide

The Lambda Utilities library provides a set of helper functions for creating properly formatted API Gateway responses. These utilities abstract away the boilerplate of response construction and ensure consistent response formatting across your Lambda functions.

## Overview

API Gateway responses require a specific structure with a status code, headers, and a JSON-stringified body. The response helpers provided by Lambda Utilities simplify this by:

- Providing typed functions for common HTTP status codes
- Managing automatic JSON serialization
- Supporting custom headers
- Ensuring consistency with AWS Lambda proxy integration specifications

## Installation

```bash
npm install @leanstacks/lambda-utils
```

## Basic Usage

### Creating Responses

Import the response helpers from Lambda Utilities:

```typescript
import { ok, created, badRequest, notFound, internalServerError } from '@leanstacks/lambda-utils';
```

### Response Functions

#### `ok(body, headers?)`

Creates a **200 OK** response.

```typescript
export const handler = async (event: any) => {
  const data = { id: '123', name: 'Example' };
  return ok(data);
};

// Response:
// {
//   statusCode: 200,
//   body: '{"id":"123","name":"Example"}',
//   headers: {}
// }
```

#### `created(body, headers?)`

Creates a **201 Created** response, typically used when a resource is successfully created.

```typescript
export const handler = async (event: any) => {
  const newResource = { id: '456', name: 'New Resource' };
  return created(newResource);
};

// Response:
// {
//   statusCode: 201,
//   body: '{"id":"456","name":"New Resource"}',
//   headers: {}
// }
```

#### `noContent(headers?)`

Creates a **204 No Content** response, used when the request is successful but there's no content to return.

```typescript
export const handler = async (event: any) => {
  // Delete operation
  return noContent();
};

// Response:
// {
//   statusCode: 204,
//   body: '{}',
//   headers: {}
// }
```

#### `badRequest(message?, headers?)`

Creates a **400 Bad Request** error response.

```typescript
export const handler = async (event: any) => {
  if (!event.body) {
    return badRequest('Request body is required');
  }
};

// Response:
// {
//   statusCode: 400,
//   body: '{"message":"Request body is required"}',
//   headers: {}
// }
```

#### `notFound(message?, headers?)`

Creates a **404 Not Found** error response.

```typescript
export const handler = async (event: any) => {
  const resource = await getResource(event.pathParameters.id);

  if (!resource) {
    return notFound(`Resource with id ${event.pathParameters.id} not found`);
  }

  return ok(resource);
};

// Response:
// {
//   statusCode: 404,
//   body: '{"message":"Resource with id 123 not found"}',
//   headers: {}
// }
```

#### `internalServerError(message?, headers?)`

Creates a **500 Internal Server Error** response.

```typescript
export const handler = async (event: any) => {
  try {
    // Process request
  } catch (error) {
    return internalServerError('An unexpected error occurred');
  }
};

// Response:
// {
//   statusCode: 500,
//   body: '{"message":"An unexpected error occurred"}',
//   headers: {}
// }
```

#### `createResponse(statusCode, body, headers?)`

Creates a custom response with any status code. Use this for status codes not covered by the helper functions.

```typescript
import { createResponse } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  return createResponse(202, { status: 'Accepted' });
};

// Response:
// {
//   statusCode: 202,
//   body: '{"status":"Accepted"}',
//   headers: {}
// }
```

## Headers

### HTTP Headers Helpers

Lambda Utilities provides a `httpHeaders` object with common header builders:

#### `httpHeaders.json`

Sets the `Content-Type` header to `application/json`.

```typescript
import { ok, httpHeaders } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  return ok({ message: 'Success' }, httpHeaders.json);
};

// Response:
// {
//   statusCode: 200,
//   body: '{"message":"Success"}',
//   headers: { 'Content-Type': 'application/json' }
// }
```

#### `httpHeaders.contentType(type)`

Sets the `Content-Type` header to a custom MIME type.

```typescript
import { ok, httpHeaders } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  return ok(csvData, httpHeaders.contentType('text/csv'));
};

// Response:
// {
//   statusCode: 200,
//   body: '...',
//   headers: { 'Content-Type': 'text/csv' }
// }
```

#### `httpHeaders.cors(origin?)`

Sets the `Access-Control-Allow-Origin` header for CORS support. Default is `*`.

```typescript
import { ok, httpHeaders } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  return ok({ data: '...' }, httpHeaders.cors('https://example.com'));
};

// Response:
// {
//   statusCode: 200,
//   body: '{"data":"..."}',
//   headers: { 'Access-Control-Allow-Origin': 'https://example.com' }
// }
```

### Custom Headers

Combine multiple headers or add custom ones by passing a headers object:

```typescript
import { ok, httpHeaders } from '@leanstacks/lambda-utils';

export const handler = async (event: any) => {
  const headers = {
    ...httpHeaders.json,
    ...httpHeaders.cors(),
    'X-Custom-Header': 'value',
  };

  return ok({ message: 'Success' }, headers);
};

// Response:
// {
//   statusCode: 200,
//   body: '{"message":"Success"}',
//   headers: {
//     'Content-Type': 'application/json',
//     'Access-Control-Allow-Origin': '*',
//     'X-Custom-Header': 'value'
//   }
// }
```

## Complete Examples

### Validation and Error Handling

```typescript
import { ok, badRequest, internalServerError, httpHeaders } from '@leanstacks/lambda-utils';

interface RequestBody {
  email: string;
  name: string;
}

export const handler = async (event: any) => {
  try {
    // Validate request
    if (!event.body) {
      return badRequest('Request body is required', httpHeaders.json);
    }

    const body: RequestBody = JSON.parse(event.body);

    if (!body.email || !body.name) {
      return badRequest('Missing required fields: email, name', httpHeaders.json);
    }

    // Process request
    const result = { id: '123', ...body };

    return ok(result, httpHeaders.json);
  } catch (error) {
    console.error('Handler error:', error);
    return internalServerError('Failed to process request', httpHeaders.json);
  }
};
```

### CRUD Operations

```typescript
import {
  ok,
  created,
  noContent,
  badRequest,
  notFound,
  internalServerError,
  httpHeaders,
} from '@leanstacks/lambda-utils';

const headers = httpHeaders.json;

export const handlers = {
  // GET /items/{id}
  getItem: async (event: any) => {
    try {
      const item = await findItem(event.pathParameters.id);
      return item ? ok(item, headers) : notFound('Item not found', headers);
    } catch (error) {
      return internalServerError('Failed to retrieve item', headers);
    }
  },

  // POST /items
  createItem: async (event: any) => {
    try {
      if (!event.body) {
        return badRequest('Request body is required', headers);
      }

      const newItem = await saveItem(JSON.parse(event.body));
      return created(newItem, headers);
    } catch (error) {
      return internalServerError('Failed to create item', headers);
    }
  },

  // DELETE /items/{id}
  deleteItem: async (event: any) => {
    try {
      await removeItem(event.pathParameters.id);
      return noContent(headers);
    } catch (error) {
      return internalServerError('Failed to delete item', headers);
    }
  },
};
```

### CORS-Enabled Handler

```typescript
import { ok, badRequest, httpHeaders } from '@leanstacks/lambda-utils';

const corsHeaders = {
  ...httpHeaders.json,
  ...httpHeaders.cors('https://app.example.com'),
  'X-API-Version': '1.0',
};

export const handler = async (event: any) => {
  // Handle preflight requests
  if (event.requestContext.http.method === 'OPTIONS') {
    return ok({}, corsHeaders);
  }

  if (!event.body) {
    return badRequest('Body is required', corsHeaders);
  }

  return ok({ processed: true }, corsHeaders);
};
```

## Best Practices

1. **Use Consistent Headers** – Define headers once and reuse them across handlers to maintain consistency.

   ```typescript
   const defaultHeaders = httpHeaders.json;
   ```

2. **Provide Meaningful Error Messages** – Include specific error details to help clients understand what went wrong.

   ```typescript
   return badRequest(`Missing required field: ${fieldName}`, headers);
   ```

3. **Handle Errors Gracefully** – Use try-catch blocks and return appropriate error responses.

   ```typescript
   try {
     // Process
   } catch (error) {
     return internalServerError('Operation failed', headers);
   }
   ```

4. **Use Appropriate Status Codes** – Choose the correct HTTP status code for each scenario:
   - `200 OK` – Request successful
   - `201 Created` – Resource created
   - `204 No Content` – Request successful, no content
   - `400 Bad Request` – Invalid input
   - `404 Not Found` – Resource not found
   - `500 Internal Server Error` – Unexpected error

5. **Log Errors** – Log error details for debugging while returning user-friendly messages.

   ```typescript
   catch (error) {
     logger.error({ message: 'Processing failed', error: error.message });
     return internalServerError('Failed to process request', headers);
   }
   ```

6. **Combine with Logging** – Use response helpers with structured logging for complete observability.

   ```typescript
   import { Logger } from '@leanstacks/lambda-utils';
   const logger = new Logger().instance;

   export const handler = async (event: any) => {
     logger.info('Request received', { path: event.path });
     return ok({ message: 'Success' }, httpHeaders.json);
   };
   ```

## Type Safety

All response functions are fully typed with TypeScript. The `body` parameter accepts `unknown`, allowing you to pass any serializable value:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = { id: '1', name: 'John', email: 'john@example.com' };
return ok(user); // ✓ Type-safe
```

Error functions accept string or number messages:

```typescript
return badRequest('Invalid input'); // ✓ String message
return notFound(404); // ✓ Number message
```

## Further reading

- **[Logging Guide](./LOGGING.md)** – Structured logging for Lambda functions
- **[Back to the project documentation](README.md)**
