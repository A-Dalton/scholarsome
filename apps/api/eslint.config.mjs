import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    // Override or add rules here
    rules: {},
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    // Override or add rules here
    rules: {},
  },
  {
    ignores: ["Observable<any>"],
  },
];
