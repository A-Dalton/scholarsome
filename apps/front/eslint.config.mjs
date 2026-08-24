import baseConfig from "../../eslint.config.mjs";
import nx from "@nx/eslint-plugin";

export default [
  ...baseConfig,
  ...nx.configs["flat/angular"],
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "scholarsome",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "scholarsome",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/prefer-inject": "off",
    },
  },
  ...nx.configs["flat/angular-template"],
  {
    files: ["**/*.html"],
    rules: {
      "@angular-eslint/template/prefer-control-flow": "off",
      // Newly enabled by the ESLint/angular-eslint preset change during the ESLint v9/v10 migration; was not enforced before.
      "@angular-eslint/template/alt-text": "off",
      "@angular-eslint/template/click-events-have-key-events": "off",
      "@angular-eslint/template/interactive-supports-focus": "off",
    },
  },
];
