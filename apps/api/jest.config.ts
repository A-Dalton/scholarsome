module.exports = {
  displayName: "api",
  preset: "../../jest.preset.js",
  globals: {},
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  moduleNameMapper: {
    // The generated Prisma Client server entry is ESM-only and cannot be loaded by
    // ts-jest/CommonJS. Point it at a stub since tests always mock PrismaService.
    "^@scholarsome/prisma/server$": "<rootDir>/src/prisma.server.mock.ts"
  },
  coverageDirectory: "../../coverage/apps/api",
};
