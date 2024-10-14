module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:json/recommended",
    "plugin:@cspell/recommended",
    "plugin:unicorn/recommended",
    "plugin:markdown/recommended",
    "plugin:svelte/recommended",
    "plugin:svelte/prettier",
    "prettier",
  ],
  plugins: [
    "@typescript-eslint",
    "no-only-tests",
    "html",
    "jest",
    "json",
    "@cspell",
    "sort-keys",
    "@mermaidchart",
    "unicorn",
  ],
  ignorePatterns: ["*.cjs"],
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "typescript-eslint-parser-for-extra-files",
      },
    },
    {
      files: ["*.ts"],
      parser: "typescript-eslint-parser-for-extra-files",
    },
  ],
  parserOptions: {
    ecmaVersion: 2020,
    /**
     * This has issues when running with `CI=true` and when running with
     * svelte-eslint-parser on `.svelte` files.
     *
     * See https://github.com/Mermaid-Chart/collab/commit/e669fdb34b77a393afac8593e00dc8a72d00cc12
     */
    allowAutomaticSingleRunInference: false,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
    extraFileExtensions: [".svelte"],
    parser: "@typescript-eslint/parser",
  },
  settings: {
    "svelte3/typescript": () => require("typescript"),
  },
  rules: {
    "@mermaidchart/no-string-testid": "warn",
    curly: "error",
    "no-console": "error",
    "no-var": "error",
    "unicorn/filename-case": [
      "error",
      {
        case: "camelCase",
      },
    ],
    "no-unused-vars": "off",
    "sort-keys": "off",
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/consistent-type-definitions": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-unsafe-enum-comparison": "warn",
    "@typescript-eslint/no-base-to-string": "warn",
    "@typescript-eslint/unbound-method": "off", // temporary until SvelteKit's types are improved
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": "allow-with-description",
        "ts-nocheck": "allow-with-description",
        "ts-check": "allow-with-description",
        minimumDescriptionLength: 10,
      },
    ],
    "json/*": ["error", "allowComments"],
    "@cspell/spellchecker": [
      "error",
      {
        checkIdentifiers: true,
        checkStrings: true,
        checkStringTemplates: true,
        configFile: "../../cSpell.json",
      },
    ],
    "no-empty": [
      "error",
      {
        allowEmptyCatch: true,
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["lodash-es/*"],
            message:
              'Please use `import {x} from "lodash-es"` instead for Node.JS compatibility.',
          },
        ],
      },
    ],
    "unicorn/template-indent": "off",
    "unicorn/no-typeof-undefined": "error",
    "unicorn/prefer-at": "off", // Some browsers still don't support .at()
    "unicorn/prefer-top-level-await": "off",
    "unicorn/prefer-switch": "off",
    "unicorn/prevent-abbreviations": [
      "off",
      {
        allowList: {
          err: true,
          req: true,
          ctx: true,
          res: true,
          env: true,
          refs: true,
          doc: true,
          db: true,
          Refs: true,
          ImportMetaEnv: true,
        },
      },
    ],
    "unicorn/filename-case": "off",
    "no-restricted-properties": [
      "error",
      {
        object: "document",
        property: "querySelector",
      },
      {
        object: "document",
        property: "querySelectorAll",
      },
      {
        object: "document",
        property: "getElementById",
      },
      {
        object: "location",
        property: "reload",
        message:
          "Please use reload function from `import { reload } from '$lib/client/util/reload';`",
      },
    ],
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
};
