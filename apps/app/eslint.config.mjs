import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // JS/JSX has no type checker: catch a missing import before it ships as
  // "X is not defined" at runtime (tsc and next build don't see it).
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "no-undef": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copied from node_modules at build time.
    "public/maplibre/**",
  ]),
]);

export default eslintConfig;
