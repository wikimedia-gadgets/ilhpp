/// <reference types="../../../node_modules/types-mediawiki"/>
/// <reference types="vite/client" />

import { createApp } from 'vue';

module 'vue' {
  export const createMwApp: typeof createApp;
}
