// @ts-check

import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tsEslint.config(
  {
    files: ['**/*.ts', '**/*.d.ts', '**/*.js', '**/*.vue'],
    extends: [
      eslint.configs.recommended,
      ...tsEslint.configs.recommendedTypeChecked,
      ...pluginVue.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        parser: tsEslint.parser,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      semi: 'error',
      'comma-dangle': ['error', 'always-multiline'],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      'max-len': [
        'error',
        {
          code: 100,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      'no-constant-condition': [
        'error',
        {
          checkLoops: false,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'quote-props': ['error', 'as-needed'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'smart'],
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: true }],
      'no-console': ['warn'],
    },
  },

  {
    files: ['**/*.js'],
    ...tsEslint.configs.disableTypeChecked,
  },

  {
    files: ['scripts/*.js', '**/*.config.js'],
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
    },
  },

  {
    ignores: ['dist/', 'assets/'],
  },
);
