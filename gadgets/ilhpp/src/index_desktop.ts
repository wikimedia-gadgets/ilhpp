import { attachPopup, createPopup, detachPopup, Popup } from './popups_desktop';
import { PopupMode, Preferences } from './prefs';
import { Mutex, wait } from './utils';
import { ATTACH_DELAY_MS, DETACH_DELAY_MS, GREEN_ANCHOR_SELECTOR, PTR_SHORT_SIDE_LENGTH_PX } from './consts';

let activePopup: Popup | null;
// This is passed to `attachActivePopup` using closure instead of params
// Because this can change after mutex acquisition, it must always have the latest information
// to prevent attachments on incorrect items
let mouseArgs: {
  activeAnchor: HTMLAnchorElement, cursorPageX: number, cursorPageY: number,
} | null;

const mutex = new Mutex();
let attachmentAC = new AbortController();
let detachmentAC = new AbortController();

async function attachActivePopup() {
  // Test reveals edge cases which need to be solved by detaching as soon as user interaction
  // This section is idempotent, so it's safe to place both in and out of critical part
  if (activePopup) {
    if (mouseArgs && (!mouseArgs.activeAnchor || activePopup.anchor === mouseArgs.activeAnchor)) {
      // `mouseArgs.activeAnchor` is null: invalid state, should be detached first, do nothing
      // or `mouseArgs.activeAnchor` has popup on, also a no-op
      return;
    } else {
      await detachActivePopupImmediately();
    }
  }

  // We gave up :(
  // Defensively move title to data-tooltip to completely get rid of "double popups"
  if (mouseArgs?.activeAnchor && mouseArgs.activeAnchor.title) {
    mouseArgs.activeAnchor.dataset.tooltip = mouseArgs.activeAnchor.title;
    mouseArgs.activeAnchor.title = '';
  }

  const release = await mutex.acquire();
  try {
    if (activePopup) {
      if (mouseArgs && (!mouseArgs.activeAnchor || activePopup.anchor === mouseArgs.activeAnchor)) {
        // `mouseArgs.activeAnchor` is null: invalid state, should be detached first, do nothing
        // or `mouseArgs.activeAnchor` has popup on, also a no-op
        return;
      } else {
        await detachActivePopupImmediately();
      }
    }

    if (!mouseArgs) {
      return;
    }

    activePopup = createPopup(mouseArgs.activeAnchor, mouseArgs.cursorPageX, mouseArgs.cursorPageY);
    if (!activePopup) {
      return;
    }
    await wait(ATTACH_DELAY_MS, attachmentAC.signal);
    attachPopup(activePopup);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Attachment process cancelled, revert process
      await detachActivePopupImmediately();
    }

  } finally {
    release();
  }
}

function cancelAttachment() {
  attachmentAC.abort();
  attachmentAC = new AbortController();
}

async function detachActivePopupImmediately() {
  if (activePopup && activePopup.anchor !== mouseArgs?.activeAnchor) {
    const currentActivePopup = activePopup;
    activePopup = null;
    await detachPopup(currentActivePopup);
  }
}

async function detachActivePopup() {
  const release = await mutex.acquire();
  try {
    if (activePopup && activePopup.anchor !== mouseArgs?.activeAnchor) {
      await wait(DETACH_DELAY_MS, detachmentAC.signal);
      await detachActivePopupImmediately();
    }
  } catch {
    // No-op
  } finally {
    release();
  }
}

function cancelDetachment() {
  detachmentAC.abort();
  detachmentAC = new AbortController();
}

function run(prefs: Preferences) {
  document.body.addEventListener('mouseover', (ev) => {
    if (prefs.popup === PopupMode.OnHover && ev.target instanceof HTMLElement) {
      const activeAnchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);

      if (activeAnchor) {
        // Moving on an <a>
        mouseArgs = {
          activeAnchor,
          cursorPageX: ev.pageX,
          cursorPageY: ev.pageY,
        };
        cancelDetachment();
        void attachActivePopup();
      } else if (!activeAnchor && activePopup && !activePopup.elem.contains(ev.target)) {
        // Moving out of <a> and popup
        mouseArgs = null;
        cancelAttachment();
        void detachActivePopup();
      } else {
        // Moving out of <a> but to popup; or
        // Moving out of <a> and no popup
        mouseArgs = null;
        cancelDetachment();
      }
    }
  });

  document.body.addEventListener(
    'click',
    (ev) => {
      if (prefs.popup === PopupMode.OnClick && ev.target instanceof HTMLElement) {
        const oldAnchor = mouseArgs?.activeAnchor;
        const activeAnchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);

        if (activeAnchor) {
          mouseArgs = {
            activeAnchor,
            cursorPageX: ev.pageX,
            cursorPageY: ev.pageY,
          };
          if (!activePopup || oldAnchor !== mouseArgs.activeAnchor) {
            // No popup for active <a>, should prevent navigation
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }
          cancelDetachment();
          void attachActivePopup();
        } else if (!activePopup?.elem.contains(ev.target)) {
          // Clicked something else outside of popup and <a>
          if (activePopup) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
          }
          mouseArgs = null;
          cancelAttachment();
          void detachActivePopup();
        }
      }
    },
    true, // Add at capture phase to "mock an overlay"
  );

  document.body.addEventListener('focusin', (ev) => {
    // Only handle this in hover mode, otherwise it causes conflicts
    if (prefs.popup === PopupMode.OnHover && ev.target instanceof HTMLElement) {
      const activeAnchor = ev.target.closest<HTMLAnchorElement>(GREEN_ANCHOR_SELECTOR);

      if (activeAnchor) {
        // Assume align with <a> vertically
        const rect = activeAnchor.getBoundingClientRect();
        mouseArgs = {
          activeAnchor,
          cursorPageX: rect.left + PTR_SHORT_SIDE_LENGTH_PX,
          cursorPageY: rect.top,
        };
        cancelDetachment();
        void attachActivePopup();
      } else if (!activePopup?.elem.contains(ev.target)) {
        mouseArgs = null;
        cancelAttachment();
        void detachActivePopup();
      }
    }
  });
}

export default run;
