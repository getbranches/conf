/**
 * @type {import('eslint').Linter.Config}
 **/
module.exports = {
  extends: ['@bjerk/eslint-config'],
  rules: {
    'import/no-unassigned-import': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
  },
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
