import { ORIG_A_SELECTOR } from './consts';
import { attachPopup } from './popups_mobile';
import { getPreferences, PopupMode } from './prefs';
import { haveConflicts } from './utils';

function handleClick(ev: MouseEvent) {
  if (getPreferences().popup !== PopupMode.Disabled && ev.target instanceof HTMLElement) {
    const anchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);
    if (anchor) {
      ev.preventDefault();
      // Block MobileFrontend's event listeners
      ev.stopImmediatePropagation();
      attachPopup(anchor);
    }
  }
}

function run() {
  if (haveConflicts()) {
    return;
  }

  mw.hook('wikipage.content').add(($content) => {
    $content.each((_, root) => {
      root.addEventListener(
        'click',
        handleClick,
        true, // Make it fire earlier than MF a.new handler
      );
    });
  });

  // In some circumstances, wikipage.content hook may not be called (e.g., in references drawers)
  // So also add a global listener on body
  document.body.addEventListener(
    'click',
    handleClick,
    true, // Also in capture phase due to other interventions on the page
  );
}

export default run;
