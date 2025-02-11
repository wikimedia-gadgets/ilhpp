import { build } from 'vite';

async function globalSetup() {
  await build({
    build: {
      outDir: '../../dist/__tests_DO_NOT_USE__',
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
          globals: {
            'ext.gadget.HanAssist': 'mw.libs.HanAssist',
          },
        },
      },
    },
    logLevel: 'error',
  });
}

export default globalSetup;
