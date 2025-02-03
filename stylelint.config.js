// @ts-check

/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard-less',
    'stylelint-prettier/recommended',
    'stylelint-config-html/vue',
  ],
  rules: {
    'custom-property-pattern': null,
  },
};
