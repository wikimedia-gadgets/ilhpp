/// <reference types="../../../node_modules/types-mediawiki"/>

// Redirect HanAssist RL module to npm one to make TS happy
module 'ext.gadget.HanAssist' {
  export * from 'hanassist';
}
