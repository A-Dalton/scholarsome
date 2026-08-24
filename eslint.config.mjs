import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import nx from "@nx/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  ...nx.configs["flat/base"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["@scholarsome/shared"],
          depConstraints: [
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            {
              sourceTag: "scope:admin",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:admin"],
            },
            {
              sourceTag: "scope:client",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:client"],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs["flat/typescript"],
  ...compat
    .config({
      extends: ["google"],
    })
    .map((config) => ({
      ...config,
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        ...config.rules,
        semi: ["error", "always"],
        "comma-dangle": ["error", "never"],
        "no-empty-function": [
          "error",
          {
            allow: ["constructors"],
          },
        ],
        "@typescript-eslint/no-empty-function": "off",
        "@angular-eslint/no-empty-lifecycle-method": "off",
        "no-trailing-spaces": "error",
        "eol-last": ["error", "always"],
        quotes: ["error", "double"],
        "object-curly-spacing": ["error", "always"],
        "new-cap": "off",
        "max-len": "off",
        "require-jsdoc": "off",
        camelcase: [
          "error",
          {
            allow: ["jwt_decode"],
          },
        ],
        "valid-jsdoc": "off",
        "linebreak-style": ["error", "unix"],
        // Newly enabled by the ESLint v9/v10 recommended set; was not enforced before the upgrade.
        "no-useless-assignment": "off",
      },
    })),
  ...nx.configs["flat/javascript"],
  ...compat
    .config({
      env: {
        jest: true,
      },
    })
    .map((config) => ({
      ...config,
      files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.spec.js", "**/*.spec.jsx"],
      rules: {
        ...config.rules,
      },
    })),
  {
    ignores: ["apps/front/src/environments/environment.ts"],
  },
];
