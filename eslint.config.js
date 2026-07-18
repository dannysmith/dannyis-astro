import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import globals from 'globals'

export default defineConfig([
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript/JavaScript: recommended rules + project rule tweaks
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Astro recommended (sets up the .astro parser and rules)
  ...astro.configs.recommended,

  // Global ignores (node_modules and .git are ignored by default)
  {
    ignores: ['dist/**', '.astro/**', '.unlighthouse/**', 'public/**'],
  },
])
