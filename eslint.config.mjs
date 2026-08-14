import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Generated weather assets are validated by the dedicated weather QA
    // scripts. Excluding them keeps ESLint focused on executable source and
    // avoids traversing hundreds of large frames and videos.
    "public/media/**",
    "production/weather-cinema/qa/**",
    "production/weather-cinema/generated-reference-frames/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
