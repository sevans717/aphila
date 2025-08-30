export default {
  expo: {
    name: "Sav3 Mobile",
    slug: "sav3-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sav3.mobile",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.sav3.mobile",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash.png",
          dark: {
            image: "./assets/splash.png",
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    scheme: "sav3-mobile",
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "sav3-mobile-project-id",
      },
    },
  },
};
