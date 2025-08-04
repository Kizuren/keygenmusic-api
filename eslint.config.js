import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import unicornPlugin from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';
import process from 'node:process';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      '.env*',
      '*.log',
      'tmp/**',
      'temp/**',
      '*.config.js',
      '.next/**',
      '.nuxt/**'
    ]
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
        tsconfigRootDir: process.cwd()
      },
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettierPlugin,
      unicorn: unicornPlugin,
      import: importPlugin
    },
    rules: {
      // Prettier integration
      ...prettierConfig.rules,
      'prettier/prettier': 'error',

      // TypeScript - Keep it reasonable
      '@typescript-eslint/no-unused-vars': [
        'warn', 
        { 
          argsIgnorePattern: '^_', 
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/array-type': 'off', // Let people choose
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

      // Unicorn - Keep the good stuff, ditch the annoying
      'unicorn/better-regex': 'warn',
      'unicorn/catch-error-name': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/error-message': 'warn',
      'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      'unicorn/new-for-builtins': 'warn',
      'unicorn/no-array-for-each': 'off', // forEach is fine
      'unicorn/no-array-reduce': 'off', // Reduce is useful
      'unicorn/no-null': 'off', // TypeScript handles this
      'unicorn/no-process-exit': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-array-find': 'warn',
      'unicorn/prefer-array-flat': 'warn',
      'unicorn/prefer-array-some': 'warn',
      'unicorn/prefer-default-parameters': 'warn',
      'unicorn/prefer-includes': 'warn',
      'unicorn/prefer-logical-operator-over-ternary': 'warn',
      'unicorn/prefer-modern-math-apis': 'warn',
      'unicorn/prefer-modern-dom-apis': 'warn',
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-object-from-entries': 'warn',
      'unicorn/prefer-optional-catch-binding': 'warn',
      'unicorn/prefer-string-replace-all': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/prefer-string-starts-ends-with': 'warn',
      'unicorn/prefer-switch': 'warn',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/prefer-top-level-await': 'warn',
      'unicorn/prevent-abbreviations': 'off', // Too opinionated
      'unicorn/throw-new-error': 'warn',

      // Import rules - Basic organization
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/named': 'off', // TypeScript handles this
      'import/no-duplicates': 'warn',
      'import/no-self-import': 'error',
      'import/no-cycle': 'warn',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-default-export': 'off', // Sometimes you need default exports
      'import/prefer-default-export': 'off',

      // Core ESLint - Keep it simple
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'no-useless-rename': 'warn',
      'no-duplicate-imports': 'off', // Handled by import plugin
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'max-len': [
        'warn',
        {
          code: 120, // More reasonable line length
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true
        }
      ],
      'complexity': ['warn', 15], // More reasonable complexity
      'max-depth': ['warn', 5],
      'max-params': ['warn', 6]
    }
  },

  // JavaScript files (fallback)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      prettier: prettierPlugin,
      unicorn: unicornPlugin
    },
    rules: {
      'prettier/prettier': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },

  // Test files - Even more relaxed
  {
    files: [
      '**/*.test.ts', 
      '**/*.spec.ts', 
      '**/__tests__/**/*.ts',
      '**/*.test.js',
      '**/*.spec.js',
      '**/__tests__/**/*.js'
    ],
    rules: {
      // Relax rules for test files
      'max-len': 'off',
      'complexity': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'no-console': 'off'
    }
  },

  // Config files - Super relaxed
  {
    files: [
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
      'vite.config.*',
      'vitest.config.*',
      'rollup.config.*',
      'webpack.config.*',
      'next.config.*',
      'nuxt.config.*'
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-default-export': 'off',
      'unicorn/prefer-module': 'off'
    }
  }
];