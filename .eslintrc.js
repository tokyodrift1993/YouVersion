module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'simple-import-sort', 'unused-imports'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        bracketSpacing: false,
        trailingComma: 'all',
        arrowParens: 'always',
        printWidth: 140,
      },
    ],
    indent: 'off',
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', {avoidEscape: true}],
    semi: ['error', 'always'],
    '@typescript-eslint/no-empty-interface': 'warn',
    'no-duplicate-imports': 'off',
    'simple-import-sort/exports': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'no-console': ['error', {allow: ['log', 'warn', 'error', 'table']}],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', {functions: false}],
    'eol-last': ['error', 'always'],

    // setup "eslint-plugin-simple-import-sort"
    'simple-import-sort/imports': [
      'error',
      {
        // adapted from internal typescript eslint-config
        groups: [
          // Side effect imports.
          ['^\\u0000'],

          [
            // Node.js builtins.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            `^(${require('module').builtinModules.join('|')})(/|$)`,

            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            '^@?\\w',

            // Type imports.
            '^@?\\w.*\\u0000$',
          ],

          // Project package imports.
          ['^(@tokyodrift1993)(/.*|$)'],

          [
            // Absolute imports and other imports such as Vue-style `@/foo`.
            // Anything not matched in another group.
            '^',

            // Type imports.
            '(?<=\\u0000)$',
          ],

          [
            // Internal alias imports.
            '^(@app)(/.*|$)',

            // Style imports.
            '^.+\\.s?css$',

            // Relative imports.
            // Anything that starts with a dot.
            '^\\.',

            // Type imports.
            '^\\..*\\u0000$',
          ],
        ],
      },
    ],
  },
};
