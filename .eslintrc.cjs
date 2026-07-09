module.exports = {
  env: { browser: true, es2020: true },
  ignorePatterns: [
    'functions/',
    'index.js',
    'firestore.js',
    'scripts/',
    'dist/',
    'node_modules/',
    'postcss.config.js',
    'tailwind.config.js',
    'vite.config.js',
    'eslintrc.js',
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  plugins: ["unused-imports"],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' }
    ]
  },
};
