const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Set the project root explicitly
config.projectRoot = projectRoot;

// 1. Watch all files within the monorepo
config.watchFolders = [projectRoot, workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Resolve symlinks for critical packages
const reactPath = fs.realpathSync(path.resolve(projectRoot, 'node_modules/react'));
const reactNativePath = fs.realpathSync(path.resolve(projectRoot, 'node_modules/react-native'));

// 4. Custom resolver to handle pnpm symlinks
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle react and react-native specially
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const reactBase = reactPath;

    if (moduleName === 'react') {
      return {
        filePath: path.join(reactBase, 'index.js'),
        type: 'sourceFile',
      };
    }

    // Handle react/jsx-runtime and react/jsx-dev-runtime
    if (moduleName === 'react/jsx-runtime') {
      return {
        filePath: path.join(reactBase, 'jsx-runtime.js'),
        type: 'sourceFile',
      };
    }

    if (moduleName === 'react/jsx-dev-runtime') {
      return {
        filePath: path.join(reactBase, 'jsx-dev-runtime.js'),
        type: 'sourceFile',
      };
    }
  }

  if (moduleName === 'react-native') {
    return {
      filePath: path.join(reactNativePath, 'index.js'),
      type: 'sourceFile',
    };
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// 5. Additional extraNodeModules for fallback
config.resolver.extraNodeModules = {
  'react': reactPath,
  'react-native': reactNativePath,
};

// 6. Disable watchman
config.resolver.useWatchman = false;

module.exports = config;
