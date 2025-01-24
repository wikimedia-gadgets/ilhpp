// ilhpp dev server entry point. This is not included in the build!
import '@wikimedia/codex/dist/codex.style.css';
import { createApp, reactive } from 'vue';
import SettingsDialog from './SettingsDialog.vue';
import { getPreferences, setPreferences } from 'ext.gadget.ilhpp';

export function showSettingsDialog() {
  const prefs = reactive(getPreferences());

  const root = document.createElement('div');
  document.body.append(root);

  createApp(SettingsDialog, {
    prefs,
    onSave() {
      setPreferences(prefs);
    },
  }).mount(root);
}
