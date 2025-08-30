import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(__dirname);

// Enable support for TypeScript and JSX
config.resolver.sourceExts = ["js", "jsx", "ts", "tsx", "json"];

// Add support for SVG files and other assets
config.transformer = {
  ...config.transformer,
  assetPlugins: ["expo-asset/tools/hashAssetFiles"],
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// Configure resolver for better module resolution
config.resolver = {
  ...config.resolver,
  alias: {
    "@": "./src",
    "@components": "./src/components",
    "@screens": "./src/screens",
    "@services": "./src/services",
    "@utils": "./src/utils",
    "@types": "./src/types",
    "@hooks": "./src/hooks",
    "@store": "./src/store",
    "@assets": "./assets",
  },
  platforms: ["native", "android", "ios", "web"],
};

// Watch folders for hot reloading
config.watchFolders = [__dirname];

module.exports = config;
