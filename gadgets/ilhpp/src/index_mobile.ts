import { GREEN_ANCHOR_SELECTOR } from './consts';
import { createAndAttachPopup } from './popups_mobile';
import { PopupMode, Preferences } from './prefs';

function run(prefs: Preferences) {
  mw.hook('wikipage.content').add(($content) => {
    $content.each((_, root) => {
      root.addEventListener(
        'click',
        (ev) => {
          if (prefs.popup !== PopupMode.Disabled && ev.target instanceof HTMLElement) {
            const anchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);
            if (anchor) {
              ev.preventDefault();
              // Block MobileFrontend's event listeners
              ev.stopImmediatePropagation();
              createAndAttachPopup(anchor);
            }
          }
        },
        true, // Make it fire earlier than MF a.new handler
      );
    });
  });
}

export default run;
