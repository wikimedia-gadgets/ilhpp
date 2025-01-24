import messages from '../messages.json';

import '../styles/base.less';
import '../styles/links.less';
import '../styles/popups_desktop.less';
import '../styles/popups_mobile.less';

import { batchConv } from 'ext.gadget.HanAssist';
import { getPreferences, LinkMode, OrigLinkColor, PopupMode, Preferences, setPreferences } from './prefs';
import { isMobileDevice } from './utils';
import runDesktop from './index_desktop';
import runMobile from './index_mobile';

function toggleInactivityClass() {
  // Deactivate if MF editor is active, activate otherwise
  document.documentElement.classList.toggle('ilhpp-inactive', location.hash.includes('/editor/'));
}

// Initialize
const prefs = getPreferences();
mw.messages.set(batchConv(messages, mw.config.get('wgUserVariant')!));

if (mw.config.get('wgMFMode')) {
  window.addEventListener('hashchange', toggleInactivityClass);
  toggleInactivityClass();
}

if (isMobileDevice()) {
  runMobile(prefs);
} else {
  runDesktop(prefs);
}

export {
  type Preferences, LinkMode, OrigLinkColor, PopupMode,
  getPreferences, setPreferences,
};
