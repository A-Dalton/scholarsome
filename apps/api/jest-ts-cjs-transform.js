/*
 * Thin wrapper around ts-jest that makes the CommonJS output of the ESM
 * packages in node_modules (@nestjs/*) evaluable, so the api tests run
 * without NODE_OPTIONS=--experimental-vm-modules:
 *
 * 1. TypeScript cannot downlevel `import.meta` when emitting CommonJS, so
 *    files using Nest's `createRequire(import.meta.url)` idiom would still
 *    contain `import.meta` - a syntax error in CommonJS. `import.meta.url`
 *    identifies the file, just like `__filename`, so the two are equivalent.
 *
 * 2. Those same files shadow the CommonJS wrapper's `require` parameter with
 *    `const require = createRequire(...)`, which is a redeclaration error when
 *    evaluated as CommonJS. Renaming the binding keeps it usable.
 */
const tsJest = require("ts-jest");

const SHADOWED_REQUIRE = /(?:const|let|var|function)\s+require\b/;

function prepareForCommonJs(sourceText) {
  let result = sourceText;

  if (SHADOWED_REQUIRE.test(result)) {
    result = result
      // rename the shadowed binding; `createRequire(` is not matched here
      .replace(/(?:const|let|var|function)\s+require\b/, (match) => match.replace("require", "__esm_require"))
      // its call sites, which in an ESM file can only refer to that binding
      .replace(/\brequire\(/g, "__esm_require(");
  }

 	return result.replace(/\bimport\.meta\.url\b/g, "__filename");
}

exports.createTransformer = (transformerConfig) => {
  const transformer = new tsJest.TsJestTransformer(transformerConfig);

  return {
    process: (sourceText, sourcePath, transformOptions) =>
      transformer.process(prepareForCommonJs(sourceText), sourcePath, transformOptions),
    getCacheKey: transformer.getCacheKey
  };
};
