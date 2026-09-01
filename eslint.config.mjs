import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "playwright-report/**", "test-results/**"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
