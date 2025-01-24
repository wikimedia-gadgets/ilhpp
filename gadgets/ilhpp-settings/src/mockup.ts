import $ from 'jquery';

// Mockups. This is not included in the build!
const mwMessageMap = new Map<string, string>();
Object.defineProperties(window, {
  mw: {
    value: {
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
