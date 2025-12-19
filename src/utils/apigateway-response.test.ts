import { APIGatewayProxyResult } from 'aws-lambda';
import {
  Headers,
  httpHeaders,
  createResponse,
  ok,
  created,
  noContent,
  badRequest,
  notFound,
  internalServerError,
} from './apigateway-response';

describe('API Gateway Response Utilities', () => {
  describe('jsonHeaders constant', () => {
    it('should have Content-Type set to application/json', () => {
      // Arrange & Act
      const headers = httpHeaders.json;

      // Assert
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should be of type Headers', () => {
      // Arrange & Act
      const headers = httpHeaders.json;

      // Assert
      expect(typeof headers).toBe('object');
      expect(headers).not.toBeNull();
    });
  });

  describe('contentType function', () => {
    it('should return headers with provided content type', () => {
      // Arrange
      const type = 'application/json';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should accept text/plain as content type', () => {
      // Arrange
      const type = 'text/plain';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('text/plain');
    });

    it('should accept text/html as content type', () => {
      // Arrange
      const type = 'text/html';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('text/html');
    });

    it('should accept application/xml as content type', () => {
      // Arrange
      const type = 'application/xml';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('application/xml');
    });

    it('should handle custom content types with charset', () => {
      // Arrange
      const type = 'application/json; charset=utf-8';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
    });

    it('should accept empty string as content type', () => {
      // Arrange
      const type = '';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(headers['Content-Type']).toBe('');
    });

    it('should be of type Headers', () => {
      // Arrange
      const type = 'application/json';

      // Act
      const headers = httpHeaders.contentType(type);

      // Assert
      expect(typeof headers).toBe('object');
      expect(headers).not.toBeNull();
    });

    it('should handle multiple different content types', () => {
      // Arrange
      const types = ['application/json', 'text/plain', 'text/html', 'application/xml', 'image/png'];

      // Act & Assert
      types.forEach((type) => {
        const headers = httpHeaders.contentType(type);
        expect(headers['Content-Type']).toBe(type);
      });
    });
  });

  describe('corsHeaders function', () => {
    it('should return headers with default origin when no argument is provided', () => {
      // Arrange & Act
      const headers = httpHeaders.cors();

      // Assert
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should return headers with custom origin when origin is provided', () => {
      // Arrange
      const origin = 'https://example.com';

      // Act
      const headers = httpHeaders.cors(origin);

      // Assert
      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    });

    it('should accept empty string as origin', () => {
      // Arrange
      const origin = '';

      // Act
      const headers = httpHeaders.cors(origin);

      // Assert
      expect(headers['Access-Control-Allow-Origin']).toBe('');
    });

    it('should accept multiple domain patterns as origin', () => {
      // Arrange
      const origins = ['https://localhost:3000', 'https://api.example.com', 'https://example.com'];

      // Act & Assert
      origins.forEach((origin) => {
        const headers = httpHeaders.cors(origin);
        expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      });
    });
  });

  describe('createResponse function', () => {
    it('should create a response with status code and stringified body', () => {
      // Arrange
      const statusCode = 200;
      const body = { message: 'Success' };

      // Act
      const response = createResponse(statusCode, body);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(JSON.stringify(body));
      expect(typeof response.body).toBe('string');
    });

    it('should include empty headers object when headers are not provided', () => {
      // Arrange
      const statusCode = 200;
      const body = { message: 'Success' };

      // Act
      const response = createResponse(statusCode, body);

      // Assert
      expect(response.headers).toEqual({});
    });

    it('should merge provided headers with response', () => {
      // Arrange
      const statusCode = 200;
      const body = { message: 'Success' };
      const headers: Headers = { 'Content-Type': 'application/json', 'X-Custom-Header': 'value' };

      // Act
      const response = createResponse(statusCode, body, headers);

      // Assert
      expect(response.headers).toEqual(headers);
      expect(response.headers?.['Content-Type']).toBe('application/json');
      expect(response.headers?.['X-Custom-Header']).toBe('value');
    });

    it('should handle various status codes', () => {
      // Arrange
      const statusCodes = [200, 201, 204, 400, 404, 500];
      const body = { message: 'Test' };

      // Act & Assert
      statusCodes.forEach((statusCode) => {
        const response = createResponse(statusCode, body);
        expect(response.statusCode).toBe(statusCode);
      });
    });

    it('should stringify complex body objects', () => {
      // Arrange
      const statusCode = 200;
      const body = {
        id: 123,
        name: 'Test Item',
        nested: {
          value: 'nested value',
          array: [1, 2, 3],
        },
      };

      // Act
      const response = createResponse(statusCode, body);

      // Assert
      expect(response.body).toBe(JSON.stringify(body));
      expect(JSON.parse(response.body)).toEqual(body);
    });

    it('should handle null body', () => {
      // Arrange
      const statusCode = 204;
      const body = null;

      // Act
      const response = createResponse(statusCode, body);

      // Assert
      expect(response.body).toBe(JSON.stringify(null));
      expect(response.body).toBe('null');
    });

    it('should handle empty object body', () => {
      // Arrange
      const statusCode = 200;
      const body = {};

      // Act
      const response = createResponse(statusCode, body);

      // Assert
      expect(response.body).toBe('{}');
    });

    it('should return a valid APIGatewayProxyResult', () => {
      // Arrange
      const statusCode = 200;
      const body = { message: 'Success' };
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = createResponse(statusCode, body, headers);

      // Assert
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('body');
      expect(response).toHaveProperty('headers');
      expect(typeof response.statusCode).toBe('number');
      expect(typeof response.body).toBe('string');
      expect(typeof response.headers).toBe('object');
    });
  });

  describe('ok function (200)', () => {
    it('should create a 200 response with provided body', () => {
      // Arrange
      const body = { message: 'Success' };

      // Act
      const response = ok(body);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(body);
    });

    it('should accept headers parameter', () => {
      // Arrange
      const body = { message: 'Success' };
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = ok(body, headers);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(headers);
    });

    it('should create response without headers when not provided', () => {
      // Arrange
      const body = { message: 'Success' };

      // Act
      const response = ok(body);

      // Assert
      expect(response.headers).toEqual({});
    });

    it('should stringify complex body objects', () => {
      // Arrange
      const body = { id: 1, items: [{ name: 'item1' }, { name: 'item2' }] };

      // Act
      const response = ok(body);

      // Assert
      expect(JSON.parse(response.body)).toEqual(body);
    });
  });

  describe('created function (201)', () => {
    it('should create a 201 response with provided body', () => {
      // Arrange
      const body = { id: 123, message: 'Resource created' };

      // Act
      const response = created(body);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(body);
    });

    it('should accept headers parameter', () => {
      // Arrange
      const body = { id: 123 };
      const headers: Headers = { 'Content-Type': 'application/json', Location: '/resource/123' };

      // Act
      const response = created(body, headers);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(response.headers).toEqual(headers);
    });

    it('should create response without headers when not provided', () => {
      // Arrange
      const body = { id: 123 };

      // Act
      const response = created(body);

      // Assert
      expect(response.headers).toEqual({});
    });
  });

  describe('noContent function (204)', () => {
    it('should create a 204 response with empty body', () => {
      // Arrange & Act
      const response = noContent();

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('{}');
    });

    it('should accept headers parameter', () => {
      // Arrange
      const headers: Headers = { 'Cache-Control': 'no-cache' };

      // Act
      const response = noContent(headers);

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.headers).toEqual(headers);
    });

    it('should create response without headers when not provided', () => {
      // Arrange & Act
      const response = noContent();

      // Assert
      expect(response.headers).toEqual({});
    });
  });

  describe('badRequest function (400)', () => {
    it('should create a 400 response with default message', () => {
      // Arrange & Act
      const response = badRequest();

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: 'Bad Request' });
    });

    it('should create a 400 response with custom message', () => {
      // Arrange
      const message = 'Invalid input provided';

      // Act
      const response = badRequest(message);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message });
    });

    it('should accept headers parameter', () => {
      // Arrange
      const message = 'Invalid input';
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = badRequest(message, headers);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.headers).toEqual(headers);
    });

    it('should create response with default message when headers are provided', () => {
      // Arrange
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = badRequest(undefined, headers);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: 'Bad Request' });
      expect(response.headers).toEqual(headers);
    });

    it('should handle empty string message', () => {
      // Arrange
      const message = '';

      // Act
      const response = badRequest(message);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: '' });
    });
  });

  describe('notFound function (404)', () => {
    it('should create a 404 response with default message', () => {
      // Arrange & Act
      const response = notFound();

      // Assert
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Not Found' });
    });

    it('should create a 404 response with custom message', () => {
      // Arrange
      const message = 'Resource with ID 123 not found';

      // Act
      const response = notFound(message);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message });
    });

    it('should accept headers parameter', () => {
      // Arrange
      const message = 'Resource not found';
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = notFound(message, headers);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.headers).toEqual(headers);
    });

    it('should create response with default message when headers are provided', () => {
      // Arrange
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = notFound(undefined, headers);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Not Found' });
      expect(response.headers).toEqual(headers);
    });
  });

  describe('internalServerError function (500)', () => {
    it('should create a 500 response with default message', () => {
      // Arrange & Act
      const response = internalServerError();

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ message: 'Internal Server Error' });
    });

    it('should create a 500 response with custom message', () => {
      // Arrange
      const message = 'Database connection failed';

      // Act
      const response = internalServerError(message);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ message });
    });

    it('should accept headers parameter', () => {
      // Arrange
      const message = 'Something went wrong';
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = internalServerError(message, headers);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(response.headers).toEqual(headers);
    });

    it('should create response with default message when headers are provided', () => {
      // Arrange
      const headers: Headers = { 'Content-Type': 'application/json' };

      // Act
      const response = internalServerError(undefined, headers);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ message: 'Internal Server Error' });
      expect(response.headers).toEqual(headers);
    });
  });

  describe('Integration scenarios', () => {
    it('should combine jsonHeaders and corsHeaders with ok response', () => {
      // Arrange
      const body = { data: 'test' };
      const headers: Headers = {
        ...httpHeaders.json,
        ...httpHeaders.cors('https://example.com'),
      };

      // Act
      const response = ok(body, headers);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers?.['Content-Type']).toBe('application/json');
      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('https://example.com');
      expect(JSON.parse(response.body)).toEqual(body);
    });

    it('should handle complex error response scenario', () => {
      // Arrange
      const errorMessage = 'Validation failed for field: email';
      const headers: Headers = {
        ...httpHeaders.json,
        ...httpHeaders.cors(),
        'X-Error-Code': 'VALIDATION_ERROR',
      };

      // Act
      const response = badRequest(errorMessage, headers);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.headers?.['Content-Type']).toBe('application/json');
      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers?.['X-Error-Code']).toBe('VALIDATION_ERROR');
      expect(JSON.parse(response.body)).toEqual({ message: errorMessage });
    });

    it('should handle multiple status codes with consistent structure', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testCases: Array<{ fn: (...args: any[]) => APIGatewayProxyResult; statusCode: number; body?: any }> = [
        { fn: ok, statusCode: 200, body: { data: 'test' } },
        { fn: created, statusCode: 201, body: { id: 1, data: 'created' } },
        { fn: noContent, statusCode: 204, body: undefined },
        { fn: badRequest, statusCode: 400, body: undefined },
        { fn: notFound, statusCode: 404, body: undefined },
        { fn: internalServerError, statusCode: 500, body: undefined },
      ];

      // Act & Assert
      testCases.forEach(({ fn, statusCode, body }) => {
        const response = body !== undefined ? fn(body) : fn();
        expect(response.statusCode).toBe(statusCode);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('string');
        expect(response.headers).toBeDefined();
      });
    });
  });
});
