import { GREEN_ANCHOR_SELECTOR } from './consts';
import { createAndAttachPopup, detachPopup, Popup } from './popups_mobile';
import { PopupMode, Preferences } from './prefs';

function run(prefs: Preferences) {
  document.querySelectorAll(GREEN_ANCHOR_SELECTOR).forEach((anchor) => {
    // Nuke MobileFrontend's event listeners
    const replacementAnchor = anchor.cloneNode(true) as HTMLAnchorElement;
    anchor.replaceWith(replacementAnchor);

    replacementAnchor.addEventListener('click', (ev) => {
      if (prefs.popup !== PopupMode.Disabled) {
        ev.preventDefault();
        ev.stopPropagation();
        createAndAttachPopup(replacementAnchor);
      }
    });
  });
}

export default run;
