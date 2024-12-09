import { batchConv } from 'ext.gadget.HanAssist';
import msg from '../msg.json';
import '../styles/base.less';
import '../styles/links.less';
import '../styles/popups.less';
import { attachPopup, detachPopup, Popup } from './popup';
import { getPreferences, LinkMode, PopupMode } from './prefs';
import { debounce, throttle } from './utils';

// Initialize
const prefs = getPreferences();

mw.messages.set(batchConv(msg));

let activePopup: Popup | null;
let isAttaching = false; // Prevent overlapping execution
let isOutOfLink = false;
let isOutOfPopup = false;

async function detachActivePopup() {
  if (activePopup) {
    try {
      const currentActivePopup = activePopup;
      activePopup = null;
      // console.log('detach preview' + Date.now());
      await detachPopup(currentActivePopup);
    } catch {
      // Fail silently
    }
  }
}

async function handleShowEvent(ev: MouseEvent) {
  if (isOutOfPopup) {
    await detachActivePopup();
  }

  if (ev.target && ev.target instanceof HTMLElement) {
    const anchor = ev.target.closest('a');
    if (anchor && !isAttaching) {
      isAttaching = true;
      // console.log('show preview' + Date.now());
      const popup = await attachPopup(anchor, ev.pageX, ev.pageY);
      isAttaching = false;
      if (popup) {
        activePopup = popup;
      }
    }
  }
}

const debouncedHandleShowEvent = debounce(handleShowEvent, 50);

mw.hook('wikipage.content').add(($content) => {
  $content.each((_, elem) => {
    elem.addEventListener('click', (ev) => {
      // FIXME: Bugged
      if (prefs.popup === PopupMode.OnClick) {
        ev.preventDefault();
        void debouncedHandleShowEvent(ev);
      }
    });

    elem.addEventListener('mouseover', (ev) => {
      // console.log('mouseover' + Date.now());
      isOutOfLink = false;
      if (prefs.popup === PopupMode.OnHover) {
        void debouncedHandleShowEvent(ev);
      }
    });

    elem.addEventListener('mouseout', (ev) => {
      // console.log('mouseout' + Date.now());
      isOutOfLink = true;

      // Await mouseenter to complete
      setTimeout(() => {
        // console.log('mouseout setTimeout' + Date.now(), isOutOfPopup, isOutOfLink);
        if (prefs.popup === PopupMode.OnHover && isOutOfPopup && isOutOfLink) {
          void detachActivePopup();
        }
      }, 0);
    });

    // When users hover on a popup, it's typically out of the container element
    // So use mouseenter and mouseleave to implement this
    elem.addEventListener('mouseenter', (ev) => {
      // console.log('mouseenter' + Date.now());
      isOutOfPopup = true;

      // Await mouseout to complete
      setTimeout(() => {
        // console.log('mouseenter setTimeout' + Date.now(), isOutOfPopup, isOutOfLink);
        if (prefs.popup === PopupMode.OnHover && isOutOfPopup && isOutOfLink) {
          void detachActivePopup();
        }
      }, 0);
    });

    elem.addEventListener('mouseleave', () => {
      // console.log('mouseleave' + Date.now());
      isOutOfPopup = false;
    });
  });
});
