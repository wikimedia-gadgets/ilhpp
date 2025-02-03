import { attachPopup, detachPopup, Popup, State } from './popups_desktop';
import { getPreferences, PopupMode } from './prefs';
import { DT_ATTACH_DELAY_MS, ORIG_A_SELECTOR } from './consts';
import { haveConflicts } from './utils';

let activePopup: Popup | null = null;
let activeAnchor: HTMLAnchorElement | null = null;
let activeAnchorTooltip: string | null = null;
let mouseOverTimeoutId: ReturnType<typeof setTimeout>;
let isTabPressed = false;
const elemPointerTypeMap = new WeakMap<HTMLElement, string>();

function run() {
  if (haveConflicts()) {
    return;
  }

  // This fires earlier than mouseover and click, which is why this works
  document.body.addEventListener('pointerup', (ev) => {
    if (ev.target instanceof HTMLElement) {
      elemPointerTypeMap.set(ev.target, ev.pointerType);
    }
  });

  document.body.addEventListener('mouseover', (ev) => {
    if (
      getPreferences().popup === PopupMode.OnHover &&
      ev.target instanceof HTMLElement &&
      elemPointerTypeMap.get(ev.target) !== 'touch' // Ignore when hover is caused by touch
    ) {
      const currentAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

      clearTimeout(mouseOverTimeoutId);
      // Restore tooltips cleared by previous calls
      if (activeAnchor && activeAnchorTooltip && activePopup?.state !== State.Attached) {
        activeAnchor.title = activeAnchorTooltip;
        activeAnchor = null;
        activeAnchorTooltip = null;
      }
      // Do not reattach when hovering on the same <a> with a popup
      if (
        currentAnchor &&
        ((activePopup?.state === State.Attached && activePopup?.anchor !== currentAnchor) ||
          activePopup?.state !== State.Attached)
      ) {
        if (activePopup) {
          void detachPopup(activePopup);
        }
        activeAnchorTooltip = currentAnchor.getAttribute('title');
        currentAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"
        activeAnchor = currentAnchor;

        mouseOverTimeoutId = setTimeout(() => {
          activePopup = attachPopup(currentAnchor, false, activeAnchorTooltip, {
            pageX: ev.pageX,
            pageY: ev.pageY,
          });
        }, DT_ATTACH_DELAY_MS);
      }
    }
  });

  document.body.addEventListener(
    'click',
    (ev) => {
      const prefs = getPreferences();
      // Used to disable popup mouse leave detaching handler when touch clicked in hover mode
      let isCausedByTouch = false;

      if (
        ev.target instanceof HTMLElement &&
        (prefs.popup === PopupMode.OnClick ||
          // Work as in click mode if touch clicked
          (prefs.popup === PopupMode.OnHover &&
            (isCausedByTouch = elemPointerTypeMap.get(ev.target) === 'touch')))
      ) {
        elemPointerTypeMap.delete(ev.target);

        const currentAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

        if (currentAnchor) {
          // Do not prevent navigation when clicking on the same <a> with a popup
          if (
            (activePopup?.state === State.Attached && activePopup?.anchor !== currentAnchor) ||
            activePopup?.state !== State.Attached
          ) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }

          if (activePopup && activePopup.state === State.Attached) {
            // Is there an active popup on another <a>?
            if (activePopup.anchor !== currentAnchor) {
              void detachPopup(activePopup);
            } else {
              // No-op
              return;
            }
          }
          const oldTooltip = currentAnchor.getAttribute('title');
          currentAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"

          activePopup = attachPopup(currentAnchor, isCausedByTouch, oldTooltip, {
            pageX: ev.pageX,
            pageY: ev.pageY,
          });
        } else if (!activePopup?.elem.contains(ev.target)) {
          // Clicked something else outside of popup and <a>
          if (activePopup && activePopup.state === State.Attached) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
            void detachPopup(activePopup);
          }
        }
      }
    },
    true, // Add at capture phase to "mock an overlay"
  );

  // Firing sequence: keydown -> focusin -> keyup
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Tab') {
      isTabPressed = true;
    }
  });

  document.body.addEventListener('keyup', (ev) => {
    if (ev.key === 'Tab') {
      isTabPressed = false;
    }
  });

  document.body.addEventListener('focusin', (ev) => {
    // Only handle this in hover mode, otherwise it causes conflicts
    if (
      isTabPressed &&
      getPreferences().popup !== PopupMode.Disabled &&
      ev.target instanceof HTMLElement
    ) {
      const currentAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

      // Do not reattach when hovering on the same <a> with a popup
      if (currentAnchor) {
        if (
          (activePopup?.state === State.Attached && activePopup?.anchor !== currentAnchor) ||
          activePopup?.state !== State.Attached
        ) {
          // Is there an active popup on another <a>?
          if (
            activePopup &&
            activePopup.state === State.Attached &&
            activePopup.anchor !== currentAnchor
          ) {
            void detachPopup(activePopup);
          }
          const oldTooltip = currentAnchor.getAttribute('title');
          currentAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"

          activePopup = attachPopup(currentAnchor, false, oldTooltip);
        }
      } else if (!activePopup?.elem.contains(ev.target)) {
        // Focused something else outside of popup and <a>
        if (activePopup && activePopup.state === State.Attached) {
          void detachPopup(activePopup);
        }
      }
    }
  });
}

export default run;
