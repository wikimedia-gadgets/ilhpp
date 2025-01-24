import { GREEN_ANCHOR_SELECTOR } from './consts';
import { attachPopup } from './popups_mobile';
import { getPreferences, PopupMode } from './prefs';

function run() {
  mw.hook('wikipage.content').add(($content) => {
    $content.each((_, root) => {
      root.addEventListener(
        'click',
        (ev) => {
          if (getPreferences().popup !== PopupMode.Disabled && ev.target instanceof HTMLElement) {
            const anchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);
            if (anchor) {
              ev.preventDefault();
              // Block MobileFrontend's event listeners
              ev.stopImmediatePropagation();
              attachPopup(anchor);
            }
          }
        },
        true, // Make it fire earlier than MF a.new handler
      );
    });
  });
}

export default run;
