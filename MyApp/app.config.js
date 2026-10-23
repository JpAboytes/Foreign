
export default {
  expo: {
    name: "Foreign",
    slug: "MyApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "foreign",
    userInterfaceStyle: "automatic",
    owner: "foreign-project",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: "mx.foreign.app",
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
      config: {
        googleSignIn: {
          reservedClientId: "com.googleusercontent.apps.497729458678-oovq36fgcgdm6ho6unb5rql4gg30cupn",
        },
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
      googleServicesFile: "./google-services.json",
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
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      },
    },
  },
};
