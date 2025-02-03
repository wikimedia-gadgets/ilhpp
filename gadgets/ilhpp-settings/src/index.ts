import { createMwApp, reactive, ref, h } from 'vue';
import SettingsDialog from './SettingsDialog.vue';
import { getPreferences, setPreferences } from 'ext.gadget.ilhpp';
import { batchConv } from 'ext.gadget.HanAssist';
import messages from '../messages.json';

export function showSettingsDialog() {
  mw.messages.set(batchConv(messages));

  const root = document.createElement('div');
  document.body.append(root);

  createMwApp({
    setup() {
      const isOpen = ref(true);
      const isDisabled = ref(false);
      const prefs = reactive(getPreferences());

      return () =>
        h(SettingsDialog, {
          open: isOpen.value,
          'onUpdate:open': (val: boolean) => {
            isOpen.value = val;
          },
          disabled: isDisabled.value,
          'onUpdate:disabled': (val: boolean) => {
            isDisabled.value = val;
          },
          prefs,
          async onSave() {
            try {
              isDisabled.value = true;
              await setPreferences(prefs);
              isOpen.value = false;
            } catch {
              // No-op, gives user a feeling that it keeps saving
            }
          },
        });
    },
  }).mount(root);
}
