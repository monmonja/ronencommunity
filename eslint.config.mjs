import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";

export default [
  {
    ignores: ["dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      import: pluginImport,
    },
    settings: {
      "import/resolver": {
        typescript: {
          // This makes it read your tsconfig.json paths & extensions
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "import/no-unresolved": "error",
      "keyword-spacing": ["error", { before: true, after: true }], // `if (`
      "space-before-blocks": ["error", "always"],                  // `) {`
      "space-infix-ops": ["error"],                                // `a || b`, `x !== y`
      "space-unary-ops": ["error", { words: true, nonwords: false }], // `!token` (no space), `typeof x` (space)
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "if" },
        { blankLine: "always", prev: "if", next: "*" }
      ],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "eol-last": ["error", "always"],
    },
  },
];
