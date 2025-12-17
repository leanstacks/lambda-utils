import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
    },
  ],
  external: ['pino', 'pino-lambda', 'zod', '@aws-sdk/client-dynamodb', '@aws-sdk/client-lambda'],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      clean: true,
    }),
  ],
};
