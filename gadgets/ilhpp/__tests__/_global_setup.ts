import { build, mergeConfig } from 'vite';
import config from '../vite.config';

async function globalSetup() {
  const mainConfig = config({ mode: 'testing', command: 'build' });

  await build(
    mergeConfig(mainConfig, {
      build: {
        emptyOutDir: true,
        outDir: `${import.meta.dirname}/../../../dist/__tests_DO_NOT_USE__`,
        lib: {
          name: 'ext.gadget.ilhpp',
          entry: `${import.meta.dirname}/../src/index.ts`,
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
    }),
  );
}

export default globalSetup;
