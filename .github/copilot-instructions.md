# Lambda Utilities Project Instructions

This project contains a set of utilities and helper functions designed to streamline the development of AWS Lambda functions using TypeScript. The utilities cover common tasks such as input validation, response formatting, error handling, and logging. The project is packaged and published as an npm package for easy integration into other Lambda projects.

---

## Technology Stack

Each pattern project uses the following technology stack:

- **Language:** TypeScript
- **Platform:** AWS Lambda
- **Runtime:** Node.js 24.x
- **AWS SDK:** v3 (modular packages)
- **Testing:** Jest
- **Linting/Formatting:** ESLint + Prettier
- **Validation:** Zod
- **Logging:** Pino + Pino-Lambda
- **Package Manager:** npm
- **Package Bundler:** rollup

---

## Pattern Project Structure

Each pattern project follows a consistent directory and file structure to promote maintainability and scalability. Below is an example structure:

```
/docs                               # Project documentation
  README.md                         # Documentation table of contents

/src
  /logging
    logger.ts                       # Logger utility using Pino
    logger.test.ts                  # Unit tests for logger
  /clients
    dynamodb-client.ts              # AWS SDK client for DynamoDB
    dynamodb-client.test.ts         # Unit tests for DynamoDB client
    lambda-client.ts                # AWS SDK client for Lambda
    lambda-client.test.ts           # Unit tests for Lambda client
  /validation
    config.ts                       # Configuration validation with Zod
    config.test.ts                  # Unit tests for config
    validator.ts                    # Generic validator helpers
    validator.test.ts               # Unit tests for validator
  /responses
    apigateway-response.ts          # Standard API response helpers
    apigateway-response.test.ts     # Unit tests for API response helpers
.editorconfig                       # Editor config
.gitignore                          # Git ignore rules
.nvmrc                              # Node version manager config
.prettierrc                         # Prettier config
eslint.config.mjs                   # ESLint config
jest.config.ts                      # App Jest config
jest.setup.ts                       # App Jest setup
package.json                        # App NPM package config
README.md                           # Project README
tsconfig.json                       # Project TypeScript config
```

---

## Source Code Guidelines

Each pattern project follows best practices for source code organization, naming conventions, and coding standards. Below are the key guidelines:

- Use **TypeScript** for all source and infrastructure code.
- Use arrow functions for defining functions.
- Use path aliases for cleaner imports (e.g., `@utils`, `@models`).
- Organize import statements: external packages first, then internal modules.
- Use async/await for asynchronous operations.
- Document functions and modules with JSDoc comments.

### Source Code Commands & Scripts

- Use `npm run build` to compile TypeScript.
- Use `npm run test` to run tests.
- Use `npm run test:coverage` to run tests with coverage report.
- Use `npm run lint` to run ESLint.
- Use `npm run lint:fix` to fix ESLint issues.
- Use `npm run format` to run Prettier to format code.
- Use `npm run format:check` to check code formatting with Prettier.

---

## Unit Testing Guidelines

Each pattern project includes comprehensive unit tests for both application and infrastructure code. Below are the key guidelines for writing unit tests:

- Use the **Jest** testing framework.
- Place test files next to the source file, with `.test.ts` suffix.
- Use `describe` and `it` blocks for organization.
- Use `beforeEach` for setup and `afterEach` for cleanup.
- Use `expect` assertions for results.
- Mock dependencies to isolate the component under test.
- Mock external calls (e.g., AWS SDK, databases).
- Structure your tests using the Arrange-Act-Assert pattern:
  - **Arrange:** Set up the test environment, including any necessary mocks and test data.
  - **Act:** Execute the function or service being tested.
  - **Assert:** Verify that the results are as expected.
  - Add comments to separate these sections for clarity.
