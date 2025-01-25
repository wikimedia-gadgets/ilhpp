<script setup lang="ts">
import { CdxDialog, CdxField, CdxRadio, CdxCheckbox } from '@wikimedia/codex';
import { msg } from './utils';
import { ref, watch } from 'vue';
import { LinkMode, OrigLinkColor, PopupMode, Preferences } from 'ext.gadget.ilhpp';

const isOpen = defineModel<boolean>('open', { default: true });
const isDisabled = defineModel<boolean>('disabled', { default: false });
const prefs = defineModel<Preferences>('prefs', { required: true });
const emit = defineEmits<{
  save: [],
}>();
const isFallbackTipsShowing = ref(false);
const arePrefsChanged = ref(false);
watch(
  prefs,
  () => {
    arePrefsChanged.value = true;
  },
  { once: true, deep: true },
);
watch(isOpen, (newValue) => {
  if (newValue) {
    // Reset to initial state
    isFallbackTipsShowing.value = false;
    isDisabled.value = false;
  }
});

function onPrimary() {
  if (prefs.value.popup === PopupMode.Disabled && !isFallbackTipsShowing.value) {
    isFallbackTipsShowing.value = true;
  } else {
    // Note the dialog is not closed. Let client code handle it.
    emit('save');
  }
}
</script>

<template>
  <CdxDialog
    v-model:open="isOpen"
    :title="msg('ilhpps-title')"
    :primary-action="{
      label: msg('ilhpps-ok'),
      actionType: 'progressive',
      disabled: isDisabled || !arePrefsChanged,
    }"
    :use-close-button="true"
    @primary="onPrimary"
  >
    <div v-if="!isFallbackTipsShowing">
      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
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

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
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

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
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

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
        <CdxCheckbox v-model="prefs.highlightExisting">
          {{ msg('ilhpps-highlight-existing') }}
        </CdxCheckbox>
      </CdxField>
    </div>
    <div
      v-else
      class="ilhpps-fallback"
    >
      <div class="ilhpps-fallback__img" />
      <p class="ilhpps-fallback__text ilhpps-small">
        {{ msg('ilhpps-fallback-tips') }}
      </p>
    </div>

    <template
      v-if="!isFallbackTipsShowing"
      #footer-text
    >
      <!-- MF is messing around font size, so do it ourselves -->
      <span class="ilhpps-small">{{ msg('ilhpps-footnote') }}</span>
    </template>
  </CdxDialog>
</template>

<style lang="less" scoped>
@import (reference) '../../ilhpp/styles/base.less';

.ilhpps-small {
  font-size: .875rem;
}

.ilhpps-fallback {
  display: flex;

  @height: 140px;

  &__img {
    flex-shrink: 0;
    width: 180px;
    height: @height;
    background: url(../assets/footer-link-ltr-light.svg) no-repeat center / contain;

    .mw-dark({
      background-image: url(../assets/footer-link-ltr-dark.svg);
    });
  }
  
  &__text {
    margin-left: 8px;
    margin-top: calc(@height - 1.2em * 2);
  }
}
</style>
