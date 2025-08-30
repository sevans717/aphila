module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "@babel/preset-typescript"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@/components": "./src/components",
            "@/screens": "./src/screens",
            "@/services": "./src/services",
            "@/stores": "./src/stores",
            "@/types": "./src/types",
            "@/config": "./src/config",
            "@/utils": "./src/utils",
            "@/hooks": "./src/hooks",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
