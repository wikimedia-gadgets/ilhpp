<script setup lang="ts">
import { CdxDialog, CdxField, CdxRadio, CdxCheckbox } from '@wikimedia/codex';
import { ref, watch } from 'vue';
import { haveConflicts as haveConflictsFn, LinkMode, OrigLinkColor, PopupMode, Preferences } from 'ext.gadget.ilhpp';

const isOpen = defineModel<boolean>('open', { default: true });
const isDisabled = defineModel<boolean>('disabled', { default: false });
const prefs = defineModel<Preferences>('prefs', { required: true });
const emit = defineEmits<{
  save: [],
}>();
const isFallbackTipsShowing = ref(false);
const isAnyPrefChanged = ref(false);
const haveConflicts = haveConflictsFn();
watch(
  prefs,
  () => {
    isAnyPrefChanged.value = true;
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
    :title="$i18n('ilhpps-title').text()"
    :primary-action="{
      label: $i18n('ilhpps-ok').text(),
      actionType: 'progressive',
      disabled: isDisabled || !isAnyPrefChanged,
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
          {{ $i18n('ilhpps-link-mode').text() }}
        </template>
        <CdxRadio
          v-for="option in LinkMode"
          :key="option"
          v-model="prefs.link"
          :input-value="option"
          name="ilhpps-link-mode"
        >
          {{ $i18n(`ilhpps-link-mode-${option.toLowerCase().replace(/_/g, '-')}`).text() }}
        </CdxRadio>
      </CdxField>

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled || haveConflicts"
        :status="haveConflicts ? 'error' : 'default'"
      >
        <template #label>
          {{ $i18n('ilhpps-popup-mode').text() }}
        </template>
        <CdxRadio
          v-for="option in PopupMode"
          :key="option"
          v-model="prefs.popup"
          :input-value="option"
          name="ilhpps-popup-mode"
        >
          {{ $i18n(`ilhpps-popup-mode-${option.toLowerCase().replace(/_/g, '-')}`).text() }}
          <template
            v-if="option === PopupMode.OnHover"
            #description
          >
            <span class="ilhpps-small">{{ $i18n('ilhpps-popup-mode-footnote').text() }}</span>
          </template>
        </CdxRadio>
        <template #error>
          {{ $i18n('ilhpps-popup-have-conflicts').text() }}
        </template>
      </CdxField>

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
        <template #label>
          {{ $i18n('ilhpps-orig-link-color').text() }}
        </template>
        <CdxRadio
          v-for="option in OrigLinkColor"
          :key="option"
          v-model="prefs.origLinkColor"
          :input-value="option"
          name="ilhpps-orig-link-color"
        >
          {{ $i18n(`ilhpps-orig-link-color-${option.toLowerCase().replace(/_/g, '-')}`).text() }}
        </CdxRadio>
      </CdxField>

      <CdxField
        :is-fieldset="true"
        :disabled="isDisabled"
      >
        <CdxCheckbox v-model="prefs.highlightExisting">
          {{ $i18n('ilhpps-highlight-existing').text() }}
        </CdxCheckbox>
      </CdxField>
    </div>
    <div
      v-else
      class="ilhpps-fallback"
    >
      <div class="ilhpps-fallback__img" />
      <p class="ilhpps-fallback__text ilhpps-small">
        {{ $i18n('ilhpps-fallback-tips').text() }}
      </p>
    </div>

    <template
      v-if="!isFallbackTipsShowing"
      #footer-text
    >
      <!-- MF is messing around font size, so do it ourselves -->
      <span class="ilhpps-small">{{ $i18n('ilhpps-footnote').text() }}</span>
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
