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
  // node_modules must not be transformed: Angular ships ESM-only .mjs bundles, and Jest
  // is run with NODE_OPTIONS=--experimental-vm-modules (required by the api's ESM-only
  // @nestjs/* packages), which loads them via its ESM machinery. Transforming them to
  // CommonJS makes them fail evaluation as ESM with "ReferenceError: module is not defined".
  transformIgnorePatterns: ["node_modules"],
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment",
  ],
};
