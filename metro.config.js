const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch only the specific workspace subdirectories needed for pnpm symlink
// resolution. Watching workspaceRoot directly causes Metro to recursively
// watch .local (agent temp dirs) and crash when they are deleted mid-session.
const sharedWatchDirs = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "packages"),
].filter((p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
});

config.watchFolders = [projectRoot, ...sharedWatchDirs];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = true;

module.exports = config;
