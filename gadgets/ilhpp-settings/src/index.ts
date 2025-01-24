import { createMwApp, reactive } from 'vue';
import SettingsDialog from './SettingsDialog.vue';
import { getPreferences, setPreferences } from 'ext.gadget.ilhpp';

export function showSettingsDialog() {
  const prefs = reactive(getPreferences());

  const root = document.createElement('div');
  document.body.append(root);

  createMwApp(SettingsDialog, {
    prefs,
    onSave() {
      setPreferences(prefs);
    },
  }).mount(root);
}
