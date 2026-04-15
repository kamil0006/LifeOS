import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Deliberate: React 19's `set-state-in-effect` flags common modal/controlled-form resets
      // (sync local state when `open` or `initialValues` change). Fixing every case with keys or
      // derived state is tracked separately; re-enable as `warn` if you want new sites flagged.
      'react-hooks/set-state-in-effect': 'off',
      // Context modules export hooks + Provider; splitting every file is noisy for a small app.
      'react-refresh/only-export-components': 'off',
    },
  },
])
