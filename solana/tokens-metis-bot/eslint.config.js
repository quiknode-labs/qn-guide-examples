// Minimal flat config: recommended rules over the TypeScript sources.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "data/", "logs/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    rules: {
      // The Metis quote response keeps unknown passthrough fields by design.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
