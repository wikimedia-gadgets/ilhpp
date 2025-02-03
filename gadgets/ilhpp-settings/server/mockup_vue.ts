// Mockups. This is not included in the build!
import { createApp } from '../node_modules/vue';

export * from '../node_modules/vue';
export function createMwApp(...args: Parameters<typeof createApp>) {
  const app = createApp(...args);
  app.config.globalProperties.$i18n = mw.message;
  return app;
}
