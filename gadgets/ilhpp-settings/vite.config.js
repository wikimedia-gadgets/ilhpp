// @ts-check
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mwGadget from 'rollup-plugin-mediawiki-gadget';
import { readFileSync } from 'node:fs';
import { name as packageName } from './package.json';

export default defineConfig({
  // This only works when fed to esbuild
  esbuild: {
    banner: readFileSync('../../assets/intro.js').toString().trim(),
    footer: readFileSync('../../assets/outro.js').toString().trim(),
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
    // cssTarget: browserslistToEsbuild(), // Tell esbuild not to use too modern CSS features
    rollupOptions: {
      output: {
        entryFileNames: `Gadget-${packageName}.js`,
        chunkFileNames: `Gadget-${packageName}-[name].js`,
        assetFileNames: `Gadget-${packageName}.css`,
      },
    },
  },

  plugins: [
    vue(),
    {
      enforce: 'pre',
      ...mwGadget({
        gadgetDef: '.gadgetdefinition',
      }),
    },
  ],
});
