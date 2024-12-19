import msg from '../msg.json';

import '../styles/base.less';
import '../styles/links.less';
import '../styles/popups_desktop.less';
import '../styles/popups_mobile.less';

import { batchConv } from 'ext.gadget.HanAssist';
import { getPreferences } from './prefs';
import { isMobileDevice } from './utils';
import runDesktop from './index_desktop';
import runMobile from './index_mobile';

// Initialize
const prefs = getPreferences();
mw.messages.set(batchConv(msg, mw.config.get('wgUserVariant')!));

const isVeInactive = window.ve?.init?.target?.active !== true;

if (isVeInactive) {
  if (isMobileDevice()) {
    runMobile(prefs);
  } else {
    runDesktop(prefs);
  }
}

