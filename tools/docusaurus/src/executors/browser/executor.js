"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("@docusaurus/core/lib");
const path = require("path");
const path_1 = require("path");

function getProjectRoot(context, projectName) {
  // Nx >= 20 context shape
  if (context.projectsConfigurations && context.projectsConfigurations.projects) {
    const proj = context.projectsConfigurations.projects[projectName];
    if (proj && proj.root) {
      return path.join(context.root, proj.root);
    }
  }
  // Legacy Nx < 20 context shape (kept for safety)
  if (context.workspace && context.workspace.projects) {
    const proj = context.workspace.projects[projectName];
    if (proj && proj.root) {
      return path.join(context.root, proj.root);
    }
  }
  // Fallback: look up via project graph
  if (context.projectGraph && context.projectGraph.nodes && context.projectGraph.nodes[projectName]) {
    const data = context.projectGraph.nodes[projectName].data;
    if (data && data.root != null) {
      return path.join(context.root, projectName === '.' ? '.' : data.root);
    }
  }
  // Last-resort fallback: use the project name as a relative path
  return path.join(context.root, projectName);
}

function runExecutor(options, context) {
  return tslib_1.__asyncGenerator(this, arguments, function* runExecutor_1() {
    const projectName = context.projectName ?? '';
    const projectRoot = getProjectRoot(context, projectName);
    try {
      yield tslib_1.__await((0, lib_1.build)(projectRoot, {
        bundleAnalyzer: options.bundleAnalyzer,
        outDir: (0, path_1.join)(context.root, options.outputPath),
        minify: options.minify,
      }));
      yield yield tslib_1.__await({
        success: true,
      });
    }
    catch (err) {
      console.error(err);
      yield yield tslib_1.__await({
        success: false,
      });
    }
  });
}
exports.default = runExecutor;
