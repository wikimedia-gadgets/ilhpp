/// <reference types="../../../node_modules/types-mediawiki"/>

// Redirect HanAssist RL module to npm one to make TS happy
module 'ext.gadget.HanAssist' {
  export * from 'hanassist';
}

// VisualEditor interface
interface Window {
  ve?: {
    init?: {
      target?: {
        active: boolean;
      },
    },
  }
};

const ve = window.ve;

// Not present in TS right now: https://github.com/microsoft/TypeScript/pull/60656
// FIXME: Remove in the future
declare namespace Intl {
  interface Locale {
    /**
     * Returns the ordering of characters indicated by either ltr (left-to-right) or by rtl (right-to-left) for this locale.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo)
     */
    getTextInfo(): TextInfo;

    textInfo: TextInfo;
  }

  interface TextInfo {
    direction: 'ltr' | 'rtl';
  }
}
