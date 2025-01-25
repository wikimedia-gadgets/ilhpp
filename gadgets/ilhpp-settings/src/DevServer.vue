<!-- Vite dev server. This script is never run in the browser! -->

<script setup lang="ts">
import { reactive, ref } from 'vue';
import SettingsDialog from './SettingsDialog.vue';
import { CdxButton } from '@wikimedia/codex';
import { getPreferences } from 'ext.gadget.ilhpp';

let isSettingsDialogOpen = ref(false);
let isSettingsDialogDisabled = ref(false);
let prefs = reactive(getPreferences());

function onSaving() {
  isSettingsDialogDisabled.value = true;
  setTimeout(() => {
    alert(`Save ${JSON.stringify(prefs)} success!`);
    isSettingsDialogOpen.value = false;
  }, 3000);
}
</script>

<template>
  <h2>ilhpp-settings Dev Server</h2>

  <CdxButton @click="isSettingsDialogOpen = !isSettingsDialogOpen">
    Toggle settings dialog
  </CdxButton>

  <p>Dialog will close after 3s to mock up saving</p>
  <p>Prefs: {{ prefs }}</p>

  <SettingsDialog
    v-model:open="isSettingsDialogOpen"
    v-model:disabled="isSettingsDialogDisabled"
    v-model:prefs="prefs"
    @save="onSaving"
  />
</template>

<style lang="less">
#app {
  padding: 4px;
}

.saving-dialog {
  z-index: 9999;
}
</style>
