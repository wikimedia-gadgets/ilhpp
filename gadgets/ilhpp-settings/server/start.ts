// Dev server entry point. This is not included in the build!
import '../../../server/mockup_mw';
import { createMwApp } from 'vue';
import { batchConv } from 'ext.gadget.HanAssist';
import messages from '../messages.json';
import DevServer from './DevServer.vue';

mw.messages.set(batchConv(messages));

// Bugged: https://github.com/typescript-eslint/typescript-eslint/issues/2865
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
createMwApp(DevServer).mount('#app');
