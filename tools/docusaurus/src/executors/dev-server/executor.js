"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lib_1 = require("@docusaurus/core/lib");
const path = require("path");

function getProjectRoot(context, projectName) {
  if (context.projectsConfigurations && context.projectsConfigurations.projects) {
    const proj = context.projectsConfigurations.projects[projectName];
    if (proj && proj.root) {
      return path.join(context.root, proj.root);
    }
  }
  if (context.workspace && context.workspace.projects) {
    const proj = context.workspace.projects[projectName];
    if (proj && proj.root) {
      return path.join(context.root, proj.root);
    }
  }
  if (context.projectGraph && context.projectGraph.nodes && context.projectGraph.nodes[projectName]) {
    const data = context.projectGraph.nodes[projectName].data;
    if (data && data.root != null) {
      return path.join(context.root, projectName === '.' ? '.' : data.root);
    }
  }
  return path.join(context.root, projectName);
}

function runExecutor(options, context) {
  return tslib_1.__asyncGenerator(this, arguments, function* runExecutor_1() {
    const projectName = context.projectName ?? '';
    const projectRoot = getProjectRoot(context, projectName);
    const port = options.port.toString();
    yield tslib_1.__await((0, lib_1.start)(projectRoot, {
      port,
      host: options.host,
      hotOnly: options.hotOnly,
      open: options.open,
    }));
    yield yield tslib_1.__await({
      baseUrl: `http://localhost:${port}`,
      success: true,
    });
    // This Promise intentionally never resolves, leaving the process running
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    yield tslib_1.__await(new Promise(() => { }));
  });
}
exports.default = runExecutor;
