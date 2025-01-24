// Dev server entry point. This is not included in the build!
import './mockup';
import '@wikimedia/codex/dist/codex.style.css';
import { createApp } from 'vue';
import DevServer from './DevServer.vue';

createApp(DevServer).mount('#app');
