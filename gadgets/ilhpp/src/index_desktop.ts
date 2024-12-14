import { attachPopup, detachPopup, Popup } from './popups_desktop';
import { PopupMode, Preferences } from './prefs';
import { debounce } from './utils';
import { TOGGLE_DELAY_MS } from './consts';

let activePopup: Popup | null;
let isAttaching = false; // Prevent overlapping execution

async function detachActivePopup() {
  if (activePopup) {
    const currentActivePopup = activePopup;
    activePopup = null;
    // console.log('detach preview' + Date.now());
    await detachPopup(currentActivePopup);
  }
}

const toggleActivePopup = debounce(
  async (
    params: { show: false } | { show: true, anchor: HTMLAnchorElement, cursorPageX: number },
  ) => {
    if (params.show) {
      if (activePopup) {
        if (activePopup.anchor === params.anchor) {
          // Popup on the <a> has been active. Do nothing
          return;
        } else {
          await detachActivePopup();
        }
      }

      if (!isAttaching) {
        isAttaching = true;
        const popup = await attachPopup(params.anchor, params.cursorPageX);
        isAttaching = false;
        if (popup) {
          activePopup = popup;
        }
      }
    } else {
      await detachActivePopup();
    }
  },
  TOGGLE_DELAY_MS,
);

function run(prefs: Preferences) {
  document.body.addEventListener('click', (ev) => {
    if (
      prefs.popup === PopupMode.OnClick &&
      ev.target instanceof HTMLElement
    ) {
      // Click an <a>, show popup
      // Must not be in the popup itself
      if (!activePopup || activePopup && !activePopup.elem.contains(ev.target)) {
        const anchor = ev.target.closest('a');
        if (anchor) {
          // Prevent navigation before the <a>'s popup is shown
          if (!activePopup || activePopup && activePopup.anchor !== anchor) {
            ev.preventDefault();
          }
          void toggleActivePopup({
            show: true,
            anchor,
            cursorPageX: ev.pageX,
          });
        } else {
          // Click something out of popup, dismiss popup
          if (activePopup) {
            // Prevent interaction before closing popup
            ev.preventDefault();
          }
          void toggleActivePopup({ show: false });
        }
      }
    }
  });

  document.body.addEventListener('mouseover', (ev) => {
    if (
      prefs.popup === PopupMode.OnHover
      && ev.target instanceof HTMLElement
    ) {
      // NOTE: the order below is important to not cause bugs!

      // Hover out of popup and <a>, dismiss popup
      if (
        ev.relatedTarget instanceof HTMLElement
        && activePopup
        && (
          activePopup.elem.contains(ev.relatedTarget)
          || activePopup.anchor.contains(ev.relatedTarget)
        )
        && !activePopup.elem.contains(ev.target)
        && !activePopup.anchor.contains(ev.target)
      ) {

        void toggleActivePopup({ show: false });
      }

      // Hover onto an <a>, show popup
      // Must not be in the popup itself
      if (!activePopup || activePopup && !activePopup.elem.contains(ev.target)) {
        const anchor = ev.target.closest('a');
        if (anchor) {
          void toggleActivePopup({
            show: true,
            anchor,
            cursorPageX: ev.pageX,
          });
        }
      }

      // When moving from outside onto the popup
      // Trigger a fake "show" command to abort the dismissal process
      // This will be a no-op by settings the anchor to active popup's <a>
      if (
        ev.relatedTarget instanceof HTMLElement
        && activePopup
        && activePopup.elem.contains(ev.target)
        && !activePopup.elem.contains(ev.relatedTarget)
      ) {
        void toggleActivePopup({
          show: true,
          anchor: activePopup.anchor,
          cursorPageX: ev.pageX,
        });
      }
    }
  });


  document.body.addEventListener('focusin', (ev) => {
    if (ev.target instanceof HTMLElement) {
      // Moving to <a> outside of popup, show popup
      // <a> must not be in the popup itself
      if (!activePopup || activePopup && !activePopup.elem.contains(ev.target)) {
        const anchor = ev.target.closest('a');
        if (anchor) {
          void toggleActivePopup({
            show: true,
            anchor,
            cursorPageX: anchor.getBoundingClientRect().left, // Assume align with <a> vertically
          });
        }
      }

      // Focus moving out of the popup, dismiss popup
      if (
        ev.relatedTarget instanceof HTMLElement
        && activePopup
        && activePopup.elem.contains(ev.relatedTarget)
        && !activePopup.elem.contains(ev.target)
      ) {
        void toggleActivePopup({ show: false });
      }
    }
  });
}

export default run;
