// @ts-check
import { readFileSync } from 'node:fs';
import mwGadget from 'rollup-plugin-mediawiki-gadget';
import { defineConfig } from 'vite';
import { name as packageName } from './package.json';
import browserslistToEsbuild from '../../scripts/browserslist_to_esbuild';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ command }) => {
  return {
    // This only works when fed to esbuild
    esbuild: {
      banner: readFileSync('../../assets/intro.js').toString().trim(),
      footer: readFileSync('../../assets/outro.js').toString().trim(),
    },

    resolve: command === 'serve' ? {
      alias: {
        'ext.gadget.HanAssist': 'hanassist',
      },
    } : undefined,

    css: {
      postcss: {
        plugins: [
          autoprefixer(),
        ],
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
          entryFileNames: `Gadget-${packageName}.js`,
          chunkFileNames: `Gadget-${packageName}-[name].js`,
          assetFileNames: `Gadget-${packageName}.css`,
        },
      },
    },

    plugins: [
      {
        enforce: 'pre',
        ...mwGadget({
          gadgetDef: '.gadgetdefinition',
        }),
      },
    ],
  };
});
