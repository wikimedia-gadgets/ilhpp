import { PREF_KEY_LS, PREF_KEY_MW } from './consts';

enum LinkMode {
  Orig = 'ORIG',
  OrigAndUnlinkedForeign = 'ORIG_N_UNLINKED_FOREIGN',
  Foreign = 'FOREIGN',
  ForeignAndLangCode = 'FOREIGN_N_LANG_CODE',
}

enum PopupMode {
  Disabled = 'DISABLED',
  OnHover = 'ON_HOVER',
  OnClick = 'ON_CLICK',
}

enum OrigLinkColor {
  Red = 'RED',
  Green = 'GREEN',
}

interface Preferences {
  link: LinkMode,
  popup: PopupMode,
  highlightExisting: boolean,
  origLinkColor: OrigLinkColor,
}

const DEFAULT_PREFS: Preferences = {
  link: LinkMode.Orig,
  popup: PopupMode.OnHover,
  highlightExisting: false,
  origLinkColor: OrigLinkColor.Green,
};

let currentPrefs: Preferences | null = null;

function toCSSClassName(item: string): string {
  return item.toLowerCase().replace(/_/g, '-');
}

function toCSSClassNames(prefs: Preferences): string[] {
  const result = [
    `ilhpp-pref-link-${toCSSClassName(prefs.link)}`,
    `ilhpp-pref-popup-${toCSSClassName(prefs.popup)}`,
    `ilhpp-pref-orig-link-color-${toCSSClassName(prefs.origLinkColor)}`,
  ];

  if (prefs.highlightExisting) {
    result.push('ilhpp-pref-hl-existing');
  }

  return result;
}

function getPreferences(): Preferences {
  if (currentPrefs) {
    return currentPrefs;
  }

  // Deep clone DEFAULT_PREFS
  // FIXME: Currently use the old method as structuredClone is not widely available
  let result = JSON.parse(JSON.stringify(DEFAULT_PREFS)) as Preferences;

  try {
    const mwOptionSerialized = mw.user.options.get(PREF_KEY_MW) as string | null;
    const localStorageSerialized = localStorage.getItem(PREF_KEY_LS);

    let mwOptionPrefs: Preferences | null = null;
    let localStoragePrefs: Preferences | null = null;

    if (mwOptionSerialized) {
      const maybePrefs: unknown = JSON.parse(mwOptionSerialized);

      // Only accept valid object structure
      if (
        Object.values(LinkMode).includes((maybePrefs as Preferences).link)
        && Object.values(PopupMode).includes((maybePrefs as Preferences).popup)
        && typeof (maybePrefs as Preferences).highlightExisting === 'boolean'
        && Object.values(OrigLinkColor).includes((maybePrefs as Preferences).origLinkColor)
      ) {
        mwOptionPrefs = maybePrefs as Preferences;
      }
    }

    if (localStorageSerialized) {
      const maybePrefs: unknown = JSON.parse(localStorageSerialized);

      if (
        Object.values(LinkMode).includes((maybePrefs as Preferences).link)
        && Object.values(PopupMode).includes((maybePrefs as Preferences).popup)
        && typeof (maybePrefs as Preferences).highlightExisting === 'boolean'
        && Object.values(OrigLinkColor).includes((maybePrefs as Preferences).origLinkColor)
      ) {
        localStoragePrefs = maybePrefs as Preferences;
      }
    }

    // Precedence: MW options > local storage > default
    result = mwOptionPrefs ?? localStoragePrefs ?? DEFAULT_PREFS;

    // Sync between these
    if (!mwOptionPrefs) {
      if (mw.user.isNamed()) {
        // Sync MW options prefs with local storage prefs (only logged in)
        // will not wait for its completion
        void new mw.Api().saveOption(
          PREF_KEY_MW,
          // Only set good shaped local storage prefs
          JSON.stringify(localStoragePrefs ?? DEFAULT_PREFS),
        );
      }

      if (!localStoragePrefs) {
        localStorage.setItem(PREF_KEY_LS, JSON.stringify(DEFAULT_PREFS));
      }
    }
    else {
      localStorage.setItem(PREF_KEY_LS, JSON.stringify(mwOptionPrefs));
    }
  }
  catch { }

  currentPrefs = result;
  document.body.classList.add(...toCSSClassNames(result));
  return result;
}

async function setPreferences(prefs: Preferences) {
  currentPrefs = prefs;

  document.body.className = document.body.className.replace(/\bilhpp-pref[\w-]+\b/g, '');
  document.body.classList.add(...toCSSClassNames(prefs));

  const serialized = JSON.stringify(prefs);

  // Save to both local storage and MediaWiki user options
  // so that when user logged out, it is not lost
  try {
    localStorage.setItem(PREF_KEY_LS, serialized);
  }
  catch { }

  if (mw.user.isNamed()) {
    const response = await new mw.Api().saveOption(PREF_KEY_MW, serialized);
    if (response.options !== 'success') {
      throw new Error('Failed to save options!');
    }
  }
}

export {
  LinkMode, OrigLinkColor, PopupMode, Preferences,
  getPreferences, setPreferences,
};
