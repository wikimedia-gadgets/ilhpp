import {
  attachPopup,
  detachPopup,
  getOverriddenPopupMode,
  Popup,
  setOverriddenPopupMode,
} from './popups_desktop';
import { getPreferences, PopupMode } from './prefs';
import { DT_ATTACH_DELAY_MS, ORIG_A_SELECTOR } from './consts';
import { haveConflicts } from './utils';

let activePopup: Popup | null = null;
let activeAnchor: HTMLAnchorElement | null = null;
let activeAnchorTooltip: string | null = null;
let mouseOverTimeoutId: ReturnType<typeof setTimeout>;
let isTabPressed = false;

function run() {
  if (haveConflicts()) {
    return;
  }

  // Automatically switch to click mode when a touch is detected in hover mode (and vise versa)
  // This is achieved by listening to every pointer event at document root,
  // and check whether it's a touch action or not
  (
    [
      'pointercancel',
      'pointerdown',
      'pointermove',
      'pointerout',
      'pointerover',
      'pointerup',
    ] as const
  ).forEach((eventName) => {
    document.body.addEventListener(
      eventName,
      (ev) => {
        if (getPreferences().popup === PopupMode.OnHover) {
          setOverriddenPopupMode(ev.pointerType === 'touch' ? PopupMode.OnClick : null);
        }
      },
      {
        passive: true,
        capture: true, // Add at capture phase to be triggered as early as possible
      },
    );
  });

  document.body.addEventListener('mouseover', (ev) => {
    if (getOverriddenPopupMode() === PopupMode.OnHover && ev.target instanceof HTMLElement) {
      const targetAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

      clearTimeout(mouseOverTimeoutId);
      // Restore tooltips cleared by previous calls
      if (activeAnchor && activeAnchorTooltip && activePopup?.state !== 'attached') {
        activeAnchor.title = activeAnchorTooltip;
        activeAnchor = null;
        activeAnchorTooltip = null;
      }
      // Do not reattach when hovering on the same <a> with a popup
      if (
        targetAnchor &&
        ((activePopup?.state === 'attached' && activePopup?.anchor !== targetAnchor) ||
          activePopup?.state !== 'attached')
      ) {
        if (activePopup) {
          void detachPopup(activePopup);
        }
        activeAnchorTooltip = targetAnchor.getAttribute('title');
        targetAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"
        activeAnchor = targetAnchor;

        mouseOverTimeoutId = setTimeout(() => {
          activePopup = attachPopup(targetAnchor, activeAnchorTooltip, {
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
      if (getOverriddenPopupMode() === PopupMode.OnClick && ev.target instanceof HTMLElement) {
        const targetAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

        if (
          targetAnchor &&
          // When clicking on the same <a> with a popup, detach that popup
          ((activePopup?.state === 'attached' && activePopup?.anchor !== targetAnchor) ||
            activePopup?.state !== 'attached')
        ) {
          ev.stopImmediatePropagation();
          ev.preventDefault();

          if (activePopup && activePopup.state === 'attached') {
            // Is there an active popup on another <a>?
            if (activePopup.anchor !== targetAnchor) {
              void detachPopup(activePopup);
            } else {
              // No-op
              return;
            }
          }
          const oldTooltip = targetAnchor.getAttribute('title');
          targetAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"

          activePopup = attachPopup(targetAnchor, oldTooltip, {
            pageX: ev.pageX,
            pageY: ev.pageY,
          });
        } else if (!activePopup?.elem.contains(ev.target)) {
          // Clicked something else outside of popup and <a>
          if (activePopup && activePopup.state === 'attached') {
            ev.stopImmediatePropagation();
            ev.preventDefault();
            void detachPopup(activePopup);
          }
        }
      }
    },
    {
      passive: false,
      capture: true, // Add at capture phase to "mock an overlay"
    },
  );

  // Firing order: keydown -> focusin -> keyup
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
      getOverriddenPopupMode() !== PopupMode.Disabled &&
      ev.target instanceof HTMLElement
    ) {
      const targetAnchor = ev.target.closest<HTMLAnchorElement>(ORIG_A_SELECTOR);

      // Do not reattach when hovering on the same <a> with a popup
      if (targetAnchor) {
        if (
          (activePopup?.state === 'attached' && activePopup?.anchor !== targetAnchor) ||
          activePopup?.state !== 'attached'
        ) {
          // Is there an active popup on another <a>?
          if (
            activePopup &&
            activePopup.state === 'attached' &&
            activePopup.anchor !== targetAnchor
          ) {
            void detachPopup(activePopup);
          }
          const oldTooltip = targetAnchor.getAttribute('title');
          targetAnchor.removeAttribute('title'); // Clear tooltip to prevent "double popups"

          activePopup = attachPopup(targetAnchor, oldTooltip);
        }
      } else if (!activePopup?.elem.contains(ev.target)) {
        // Focused something else outside of popup and <a>
        if (activePopup && activePopup.state === 'attached') {
          void detachPopup(activePopup);
        }
      }
    }
  });
}

export default run;
