// @ts-check
import { readFileSync } from 'node:fs';
import mwGadget from 'rollup-plugin-mediawiki-gadget';
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };
import browserslistToEsbuild from '../../scripts/browserslist_to_esbuild';
import autoprefixer from 'autoprefixer';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command }) => {
  return {
    // This only works when fed to esbuild
    esbuild: {
      banner: readFileSync('../../assets/intro.js').toString().trim(),
      footer: readFileSync('../../assets/outro.js').toString().trim(),
    },

    resolve:
      command === 'serve'
        ? {
            alias: {
              'ext.gadget.HanAssist': 'hanassist',
              'ext.gadget.ilhpp': `${import.meta.dirname}/src/index`,
              'ext.gadget.ilhpp-settings': `${import.meta.dirname}/../ilhpp-settings/src/index`,
              vue: `${import.meta.dirname}/../ilhpp-settings/server/mockup_vue`,
              '@wikimedia/codex': `${import.meta.dirname}/../ilhpp-settings/server/mockup_codex`,
            },
          }
        : undefined,

    css: {
      postcss: {
        plugins: [autoprefixer()],
      },
      preprocessorOptions: {
        less: {
          strictUnits: true,
        },
      },
    },

    build: {
      outDir: '../../dist',
      emptyOutDir: false,
      lib: {
        entry: 'src/index.ts',
        formats: ['cjs'],
      },
      minify: false, // Let MediaWiki do its job
      target: ['es2016'], // MediaWiki >= 1.42.0-wmf.13 supports up to ES2016
      cssTarget: browserslistToEsbuild(), // Tell esbuild not to use too modern CSS features
      rollupOptions: {
        output: {
          entryFileNames: `Gadget-${packageJson.name}.js`,
          chunkFileNames: `Gadget-${packageJson.name}-[name].js`,
          assetFileNames: `Gadget-${packageJson.name}.css`,
        },
      },
    },

    plugins: [
      vue(),
      {
        enforce: 'pre',
        ...mwGadget({
          gadgetDef: '.gadgetdefinition',
          softDependencies: ['ext.gadget.ilhpp-settings', 'mobile.startup'],
        }),
      },
    ],
  };
});
