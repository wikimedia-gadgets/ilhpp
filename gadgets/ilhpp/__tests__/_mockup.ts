import '../server/mockup_mw';
import * as HanAssist from 'hanassist';

// Re-export HanAssist as AMD module
define('ext.gadget.HanAssist', [], () => {
  return HanAssist;
});
