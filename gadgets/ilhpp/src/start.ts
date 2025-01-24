// Dev server entry point. This is not included in the build!

import '../styles/mockup.less';
import $ from 'jquery';
import { getPreferences, LinkMode, OrigLinkColor, PopupMode, setPreferences } from './prefs';

// Mockups
const mwMessageMap = new Map<string, string>();
Object.defineProperties(window, {
  mw: {
    value: {
      hook() {
        return {
          add(func: (elem: unknown) => void) {
            func($('#mw-content-text'));
          },
        };
      },
      user: {
        isNamed() {
          return false; // Mock up an anonymous user
        },
      },
      config: new Map([
        ['wgUserLanguage', 'zh-cn'],
        ['wgUserVariant', 'zh-cn'],
      ]),
      messages: {
        // Mock batch set only
        set(obj: Record<string, string>) {
          Object.entries(obj).forEach(([k, v]) => {
            mwMessageMap.set(k, v);
          });
        },
      },
      message(key: string, ...params: string[]) {
        return {
          parse() {
            return mwMessageMap.get(key)
              ?.replaceAll(/\[\[(.*)\|(.*)\]\]/g, '<a title="$1" href="/wiki/$1">$2</a>')
              ?.replaceAll(/\$(\d+)/g, (_, p1: string) => params[parseInt(p1) - 1]);
          },
        };
      },
      msg(key: string, ...params: string[]) {
        return mwMessageMap.get(key)
          ?.replaceAll(/\$(\d+)/g, (_, p1: string) => params[parseInt(p1) - 1]);
      },
    },
  },
  $: { value: $ },
});

// Color scheme switch
const colorSelect = document.getElementById('color') as HTMLSelectElement | null;
if (colorSelect) {
  colorSelect.value = 'light';
  colorSelect.addEventListener('change', () => {
    document.documentElement.className = document.documentElement.className.replace(/skin-theme-clientpref-\w+\b/g, '');
    switch (colorSelect.value) {
      case 'light':
        document.documentElement.classList.add('skin-theme-clientpref-day');
        break;
      case 'dark':
        document.documentElement.classList.add('skin-theme-clientpref-night');
        break;
      default: // OS
        document.documentElement.classList.add('skin-theme-clientpref-os');
        break;
    }
  });
}

// Load button logics
const loadButton = document.getElementById('load');
loadButton?.addEventListener('click', () => {
  void import('./index').then(() => {
    (loadButton as HTMLInputElement).disabled = true;

    const options = document.getElementById('options');
    if (options) {
      options.style.removeProperty('visibility');
      const prefs = getPreferences();

      // Build dropdowns
      ([
        ['link-mode', LinkMode, 'link'],
        ['popup-mode', PopupMode, 'popup'],
        ['orig-link-color', OrigLinkColor, 'origLinkColor'],
      ] as const).forEach(([id, enumName, prefKey]) => {
        const linkModeSelect = document.getElementById(id) as HTMLSelectElement | null;
        if (linkModeSelect) {
          Object.values(enumName).forEach((item: string) => {
            const option = document.createElement('option');
            option.value = item;
            option.innerText = item;
            linkModeSelect.appendChild(option);
            linkModeSelect.value = prefs[prefKey];
          });

          linkModeSelect.addEventListener('change', () => {
            (prefs[prefKey] as string) = linkModeSelect.value;
            void setPreferences(prefs);
          });
        }
      });

      // Build checkboxes
      const highlightExisting = document.getElementById('highlight-existing') as HTMLInputElement | null;
      if (highlightExisting) {
        highlightExisting.checked = prefs.highlightExisting;
        highlightExisting.addEventListener('change', () => {
          prefs.highlightExisting = highlightExisting.checked;
          void setPreferences(prefs);
        });
      }

      // Disable lang & variant & mf switch
      ['lang', 'variant', 'mock-mf'].forEach((id) => {
        const elem = document.getElementById(id);
        if (elem instanceof HTMLSelectElement || elem instanceof HTMLInputElement) {
          elem.disabled = true;
        }
      });
    }
  });
});

// Drag functionality
function dragElement(elem: HTMLElement) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById('draggable-header');
  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    elem.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e: MouseEvent) {
    e.preventDefault();
    // Get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e.preventDefault();
    // Calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position:
    elem.style.top = (elem.offsetTop - pos2) + 'px';
    elem.style.left = (elem.offsetLeft - pos1) + 'px';
  }

  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
const elem = document.getElementById('draggable');
if (elem) {
  dragElement(elem);
}

// Press space for debug functionality
document.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space') {
    // eslint-disable-next-line no-debugger
    debugger;
  }
});

// Language and variant switches
[
  ['lang', 'wgUserLanguage'],
  ['variant', 'wgUserVariant'],
].forEach(([id, key]) => {
  const select = document.getElementById(id);
  if (select && select instanceof HTMLSelectElement) {
    select.value = mw.config.get(key) as string;
    select.addEventListener('change', () => {
      mw.config.set(key, select.value);
    });
  }
});

// MF mock functionality
const mockMf = document.getElementById('mock-mf') as HTMLInputElement | null;
if (mockMf) {
  mw.config.set('wgMFMode', mockMf.checked ? 'active' : undefined);
  // @ts-expect-error Only `matches` is used in the code
  window.matchMedia = () => ({ matches: mockMf.checked });
  mockMf.addEventListener('change', () => {
    mw.config.set('wgMFMode', mockMf.checked ? 'active' : undefined);
  });
}

// Highlight no title functionality
const highlightNoTitle = document.getElementById('highlight-no-title') as HTMLInputElement | null;
if (highlightNoTitle) {
  document.documentElement.classList.toggle('highlight-no-title', highlightNoTitle.checked);
  highlightNoTitle.addEventListener('change', () => {
    document.documentElement.classList.toggle('highlight-no-title', highlightNoTitle.checked);
  });
}
