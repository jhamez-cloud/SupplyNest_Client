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
    "next-env.d.ts",
  ]),
  {
    // The React Compiler advisories that ship on-by-default with Next 16 flag
    // patterns that are intrinsic to this app's architecture: every data page
    // is a Client Component loading browser-only mock data inside effects, the
    // theme toggle guards on mount (next-themes), and forms use react-hook-form
    // (handleSubmit). These are performance hints, not correctness bugs — keep
    // them visible as warnings rather than failing the lint gate.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
