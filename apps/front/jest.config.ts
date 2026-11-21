const vm = require("vm");

module.exports = {
  displayName: "front",
  preset: "../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  globals: {},
  coverageDirectory: "../../coverage/apps/front",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
      },
    ],
  },
  // Jest's ESM loader only exists when it runs with NODE_OPTIONS=--experimental-vm-modules.
  // When it is available it loads the ESM-only packages in node_modules (Angular's .mjs
  // bundles, ngx-cookie-service, ...) as ESM, so they must not be transformed - compiling
  // them to CommonJS would make them fail evaluation as ESM with "ReferenceError: module is
  // not defined". Without the flag they are compiled to CommonJS instead, which is what makes
  // the suite run without any special flags.
  transformIgnorePatterns: typeof vm.SourceTextModule === "function" ? ["node_modules"] : [],
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment",
  ],
};
