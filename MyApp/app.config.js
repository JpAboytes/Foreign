
export default {
  expo: {
    name: "Foreign",
    slug: "MyApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    // "mx.foreign.app" es el esquema al que regresa el login de Google (expo-auth-session usa <bundleId>:/oauthredirect).
    scheme: ["foreign", "mx.foreign.app"],
    userInterfaceStyle: "automatic",
    owner: "foreign-project",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: "mx.foreign.app",
      usesAppleSignIn: true,
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Foreign usa tu ubicación para mostrarte lugares y recomendaciones cerca de ti en el mapa.",
        NSCameraUsageDescription:
          "Foreign usa la cámara para que puedas tomar fotos para tu perfil y tus publicaciones.",
        NSPhotoLibraryUsageDescription:
          "Foreign accede a tus fotos para que puedas elegir imágenes para tu perfil y tus publicaciones.",
      },
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
            NSPrivacyAccessedAPITypeReasons: ["C617.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
            NSPrivacyAccessedAPITypeReasons: ["E174.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
            NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
          },
        ],
      },
    },
    android: {
      package: "mx.foreign.app",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_MEDIA_IMAGES",
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-apple-authentication",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Foreign usa tu ubicación para mostrarte lugares y recomendaciones cerca de ti en el mapa.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Foreign usa la cámara para que puedas tomar fotos para tu perfil y tus publicaciones.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Foreign accede a tus fotos para que puedas elegir imágenes para tu perfil y tus publicaciones.",
          cameraPermission:
            "Foreign usa la cámara para que puedas tomar fotos para tu perfil y tus publicaciones.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/82b7e50c-dca6-4025-988a-090c649ce802",
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "82b7e50c-dca6-4025-988a-090c649ce802",
      },
    },
  },
};
