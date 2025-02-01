
/// <reference types="../../../node_modules/types-mediawiki"/>
/// <reference types="vite/client" />

import { createApp } from 'vue';

declare module 'vue' {
  export const createMwApp: typeof createApp;

  interface ComponentCustomProperties {
    $i18n: (key: string, ...parameters: any[]) => mw.Message;
  }
}
