<!-- Vite dev server. This script is never run in the browser! -->

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import SettingsDialog from './SettingsDialog.vue';
import { CdxButton } from '@wikimedia/codex';
import { getPreferences, Preferences } from 'ext.gadget.ilhpp';

let isSettingsDialogOpen = ref(false);
let prefs = reactive(getPreferences());

function onSave() {
  alert(`Save ${JSON.stringify(prefs)}!`);
}
</script>

<template>
  <h2>ilhpp-settings Dev Server</h2>

  <CdxButton @click="isSettingsDialogOpen = !isSettingsDialogOpen">
    Toggle settings dialog
  </CdxButton>


  <p>Prefs: {{ prefs }}</p>

  <SettingsDialog
    v-model:open="isSettingsDialogOpen"
    v-model:prefs="prefs"
    @save="onSave"
  />
</template>

<style lang="less">
#app {
  padding: 4px;
}
</style>
