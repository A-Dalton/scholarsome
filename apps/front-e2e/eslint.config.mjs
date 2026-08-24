import baseConfig from "../../eslint.config.mjs";
import eslintPluginCypress from "eslint-plugin-cypress";

export default [
  ...baseConfig,
  { plugins: { cypress: eslintPluginCypress } },
  {
    languageOptions: {
      globals: {
        cy: true,
        Cypress: true,
        expect: true,
        assert: true,
        chai: true,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "cypress/no-assigning-return-values": "error",
      "cypress/no-unnecessary-waiting": "error",
      "cypress/no-async-tests": "error",
      "cypress/unsafe-to-chain-command": "error",
    },
  },
  {
    files: ["src/plugins/index.js"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off",
    },
  },
];
