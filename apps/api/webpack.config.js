const { composePlugins, withNx } = require("@nx/webpack")

module.exports = composePlugins(withNx(), (config) => {
  // The generated Prisma Client uses ESM syntax which conflicts with the
  // CommonJS-compiled NestJS bundle. Treat the generated files as CommonJS
  // so the PrismaClient class is exported correctly at runtime.
  config.module.rules.push({
    test: /[/\\]libs[/\\]shared[/\\]generated[/\\]prisma[/\\]/, 
    type: "javascript/auto",
    parser: { harmony: false }
  });
  return config
})
