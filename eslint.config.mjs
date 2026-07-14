import js from "@eslint/js";
import nextPlugin from "eslint-config-next";

export default [
  js.configs.recommended,
  ...nextPlugin,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
