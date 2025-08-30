const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push("db", "mp3", "ttf", "obj", "png", "jpg");

// Configure transformer for TypeScript
config.resolver.sourceExts.push("ts", "tsx");

// Support for symlinks (if needed for monorepo)
config.resolver.symlinks = true;

// Configure watchman for better performance
config.watcher = {
  ...config.watcher,
  additionalExts: ["ts", "tsx"],
  ignore: [/node_modules\/.*\/node_modules\/.*/],
};

module.exports = config;
