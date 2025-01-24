<script setup lang="ts">
import { CdxDialog, CdxField, CdxRadio, CdxCheckbox } from '@wikimedia/codex';
import { msg } from './utils';
import { reactive, ref, watch } from 'vue';
import { LinkMode, OrigLinkColor, PopupMode, Preferences } from 'ext.gadget.ilhpp';

const isOpen = defineModel<boolean>('open', { default: true });
const prefs = defineModel<Preferences>('prefs', { required: true });
const emit = defineEmits<{
  save: []
}>();

function onPrimary() {
  isOpen.value = false;
  emit('save');
}
</script>

<template>
  <CdxDialog
    v-model:open="isOpen"
    :title="msg('ilhpps-title')"
    :primary-action="{ label: msg('ilhpps-ok'), actionType: 'progressive' }"
    :use-close-button="true"
    @primary="onPrimary"
  >
    <CdxField :is-fieldset="true">
      <template #label>
        {{ msg('ilhpps-link-mode') }}
      </template>
      <CdxRadio
        v-for="option in LinkMode"
        :key="option"
        v-model="prefs.link"
        :input-value="option"
        name="ilhpps-link-mode"
      >
        {{ msg(`ilhpps-link-mode-${option.toLowerCase().replace(/_/g, '-')}`) }}
      </CdxRadio>
    </CdxField>

    <CdxField :is-fieldset="true">
      <template #label>
        {{ msg('ilhpps-popup-mode') }}
      </template>
      <CdxRadio
        v-for="option in PopupMode"
        :key="option"
        v-model="prefs.popup"
        :input-value="option"
        name="ilhpps-popup-mode"
      >
        {{ msg(`ilhpps-popup-mode-${option.toLowerCase().replace(/_/g, '-')}`) }}
        <template
          v-if="option === PopupMode.OnHover"
          #description
        >
          <span class="ilhpps-small">{{ msg('ilhpps-popup-mode-footnote') }}</span>
        </template>
      </CdxRadio>
    </CdxField>

    <CdxField :is-fieldset="true">
      <template #label>
        {{ msg('ilhpps-orig-link-color') }}
      </template>
      <CdxRadio
        v-for="option in OrigLinkColor"
        :key="option"
        v-model="prefs.origLinkColor"
        :input-value="option"
        name="ilhpps-orig-link-color"
      >
        {{ msg(`ilhpps-orig-link-color-${option.toLowerCase().replace(/_/g, '-')}`) }}
      </CdxRadio>
    </CdxField>

    <CdxField :is-fieldset="true">
      <CdxCheckbox v-model="prefs.highlightExisting">
        {{ msg('ilhpps-highlight-existing') }}
      </CdxCheckbox>
    </CdxField>

    <template #footer-text>
      {{ msg('ilhpps-footnote') }}
    </template>
  </CdxDialog>
</template>

<style lang="less" scoped>
.ilhpps-small {
  font-size: .875em;
}
</style>
