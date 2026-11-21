const vm = require("vm");

module.exports = {
  displayName: "api",
  preset: "../../jest.preset.js",
  globals: {},
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": [
      "<rootDir>/jest-ts-cjs-transform.js",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  // Jest's ESM loader only exists when it runs with
  // NODE_OPTIONS=--experimental-vm-modules. When it is available it loads the
  // ESM-only packages in node_modules (@nestjs/*, ...) as ESM, so they must
  // not be compiled. Without the flag they are compiled to CommonJS instead,
  // which is what makes the suites run without any special flags.
  transformIgnorePatterns: typeof vm.SourceTextModule === "function" ? ["/node_modules/"] : [],
  moduleFileExtensions: ["ts", "js", "html"],
  moduleNameMapper: {
    // The generated Prisma Client server entry is ESM-only and cannot be loaded by
    // ts-jest/CommonJS. Point it at a stub since tests always mock PrismaService.
    "^@scholarsome/prisma/server$": "<rootDir>/src/prisma.server.mock.ts"
  },
  coverageDirectory: "../../coverage/apps/api",
};
