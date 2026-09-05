const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");

// The generated Prisma Client uses ESM syntax which conflicts with the
// CommonJS-compiled NestJS bundle. Treat the generated files as CommonJS
// so the PrismaClient class is exported correctly at runtime.
module.exports = async () => {
  // These options were migrated from the project.json file and merged with
  // the options in this file as part of the @nx/webpack:convert-to-inferred
  // migration (the `@nx/webpack:webpack` executor is deprecated).
  const configValues = {
    build: {
      default: {
        outputPath: "../../dist/apps/api",
        main: "./src/main.ts",
        additionalEntryPoints: [
          {
            entryName: "api-spec",
            entryPath: "./src/api-spec.ts",
          },
        ],
        tsConfig: "./tsconfig.app.json",
        assets: ["./src/assets"],
        target: "node",
        compiler: "tsc",
        // The executor left `optimization` and `outputHashing` unset, which
        // kept default builds unminified and emitted stable filenames
        // (main.js / api-spec.js). Keep that behavior instead of the plugin's
        // `NODE_ENV === "production"` defaults.
        optimization: false,
        outputHashing: "none",
      },
      production: {
        optimization: true,
        extractLicenses: true,
        fileReplacements: [
          {
            replace: "apps/api/src/environments/environment.ts",
            with: "apps/api/src/environments/environment.prod.ts",
          },
        ],
      },
    },
  };

  // Determine the correct configValue to use based on the configuration
  const configuration = process.env.NX_TASK_TARGET_CONFIGURATION || "default";

  const buildOptions = {
    ...configValues.build.default,
    ...configValues.build[configuration],
  };

  return {
    plugins: [new NxAppWebpackPlugin(buildOptions)],
    module: {
      rules: [
        {
          test: /[/\\]libs[/\\]shared[/\\]generated[/\\]prisma[/\\]/,
          type: "javascript/auto",
          parser: { harmony: false },
        },
      ],
    },
  };
};
