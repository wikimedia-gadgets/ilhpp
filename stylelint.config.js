// @ts-check

/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard-less',
    'stylelint-prettier/recommended',
    'stylelint-config-html/vue',
  ],
  plugins: ['stylelint-no-unsupported-browser-features'],
  rules: {
    'plugin/no-unsupported-browser-features': [
      true,
      {
        severity: 'warning',

        ignore: [
          'css-nesting', // It mistakenly treat LESS nesting as CSS one
          'css-masks', // Supported via autoprefixer
        ],
      },
    ],
    'declaration-block-no-redundant-longhand-properties': [
      true,
      {
        ignoreShorthands: [
          'inset', // Bad browser support
        ],
      },
    ],
    'custom-property-pattern': null,
  },
};
