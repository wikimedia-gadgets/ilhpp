/// <reference types="vitest" />
import { build } from 'vite';

async function setup() {
  await build({
    build: {
      outDir: '../../dist/__tests__',
      lib: {
        name: 'ext.gadget.ilhpp',
        entry: 'src/index.ts',
        formats: ['umd'],
      },
      rollupOptions: {
        output: {
          amd: {
            id: 'ext.gadget.ilhpp',
          },
        },
      },
    },
  });
}

export { setup };
