import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2021',
      },
    }),
  ],
  resolve: {
    alias: {
      '@palmetto/shared': resolve(__dirname, '../../libs/shared/src/index.ts'),
    },
  },
  test: {
    name: 'backend',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/backend',
      provider: 'v8',
    },
  },
});
