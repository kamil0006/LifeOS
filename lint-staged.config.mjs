// frontend/ and backend/ are two independent npm projects (own package.json +
// lockfile, no npm workspaces). `npm --prefix <dir> exec` does NOT change the
// child process's cwd on this setup, so eslint/tsc can't auto-discover config —
// call each workspace's local binary directly instead, pointing it at its own
// config/tsconfig explicitly. lint-staged always passes absolute file paths,
// which both eslint and tsc accept fine.
export default {
  'frontend/**/*.{ts,tsx}': (files) => [
    `frontend/node_modules/.bin/eslint --fix --config frontend/eslint.config.js ${files
      .map((f) => JSON.stringify(f))
      .join(' ')}`,
    // Same incremental project-reference build tsc already uses in `npm run build`.
    'frontend/node_modules/.bin/tsc -b frontend',
  ],
  'backend/**/*.ts': () => 'backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit',
}
