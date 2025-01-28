import messages from '../messages.json';

import '../styles/base.less';
import '../styles/links.less';
import '../styles/popups_desktop.less';
import '../styles/popups_mobile.less';

import { batchConv } from 'ext.gadget.HanAssist';
import { getPreferences, LinkMode, OrigLinkColor, PopupMode, Preferences, setPreferences } from './prefs';
import { haveConflicts, isMobileDevice } from './utils';
import runDesktop from './index_desktop';
import runMobile from './index_mobile';

// Initialize
mw.messages.set(batchConv(messages, mw.config.get('wgUserVariant')!));
const _ = getPreferences();

function toggleInactivityClass() {
  document.documentElement.classList.toggle('ilhpp-inactive', location.hash.includes('/editor/'));
}

// Deactivate if MF editor is active, activate otherwise
if (mw.config.get('wgMFMode')) {
  window.addEventListener('hashchange', toggleInactivityClass);
  toggleInactivityClass();
}

if (isMobileDevice()) {
  runMobile();
} else {
  runDesktop();
}

export {
  type Preferences, LinkMode, OrigLinkColor, PopupMode,
  getPreferences, setPreferences, haveConflicts,
};
