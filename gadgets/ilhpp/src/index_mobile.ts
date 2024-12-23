import { GREEN_ANCHOR_SELECTOR } from './consts';
import { createAndAttachPopup, detachPopup, Popup } from './popups_mobile';
import { PopupMode, Preferences } from './prefs';

/* let activePopup: Popup | null;

async function detachActivePopup() {
  if (activePopup) {
    const currentActivePopup = activePopup;
    activePopup = null;
    await detachPopup(currentActivePopup);
  }
} */

function run(prefs: Preferences) {
  document.body.addEventListener('click', (ev) => {
    if (prefs.popup !== PopupMode.Disabled && ev.target instanceof HTMLElement) {
      const anchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);

      if (anchor) {
        ev.preventDefault();
        ev.stopPropagation();
        createAndAttachPopup(anchor);
      } /* else {
        void detachActivePopup();
      } */
    }
  });
}

export default run;
