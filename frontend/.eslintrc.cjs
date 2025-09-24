module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['unused-imports', 'import'],
  extends: ['react-app', 'react-app/jest'],
  ignorePatterns: ['build/', 'dist/', 'node_modules/'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'unused-imports/no-unused-imports': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'import/order': 'off',
    'no-restricted-globals': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    'jsx-a11y/heading-has-content': 'off',
    'jsx-a11y/no-redundant-roles': 'off',
  },
};
