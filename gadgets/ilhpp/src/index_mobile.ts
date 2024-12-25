import { GREEN_ANCHOR_SELECTOR } from './consts';
import { createAndAttachPopup } from './popups_mobile';
import { PopupMode, Preferences } from './prefs';

function run(prefs: Preferences) {
  mw.hook('wikipage.content').add(($content) => {
    // Nuke MobileFrontend's event listeners set by jQuery
    $content.find(GREEN_ANCHOR_SELECTOR).off();

    $content.each((_, elem) => {
      elem.addEventListener('click', (ev) => {
        if (prefs.popup !== PopupMode.Disabled && ev.target instanceof HTMLElement) {
          const anchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);
          if (anchor) {
            ev.preventDefault();
            ev.stopPropagation();
            createAndAttachPopup(anchor);
          }
        }
      });
    });
  });
}

export default run;
