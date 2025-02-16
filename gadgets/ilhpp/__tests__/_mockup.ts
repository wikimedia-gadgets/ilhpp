/// <reference types="requirejs" />
import '../server/mockup_mw';
import * as HanAssist from 'hanassist';

// Mockup mw.loader.using by redirecting to requirejs
Object.defineProperty(window.mw, 'loader', {
  value: {
    using(outerName: string) {
      return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require([outerName], () => {
          resolve(window.require);
        });
      });
    },
  },
});

// Re-export HanAssist as AMD module
define('ext.gadget.HanAssist', [], () => {
  return HanAssist;
});

define('mobile.startup', () => {
  return {
    getOverlayManager() {},
  };
});
