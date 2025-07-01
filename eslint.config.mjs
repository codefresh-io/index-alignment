// @ts-check
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config([
  {
    ignores: ['dist/**'],
  },
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylisticTypeChecked,
      stylistic.configs.customize({
        flat: true,
        indent: 2,
        quotes: 'single',
        semi: true,
        braceStyle: '1tbs',
      }),
    ],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.mjs',
            'vitest.config.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {},
  },
]);
