import { ConfigContext, ExpoConfig } from "expo/config"

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.xolaceincorg.xolace.dev';
  }

  if (IS_PREVIEW) {
    return 'com.xolaceincorg.xolace.preview';
  }

  return 'com.xolaceincorg.xolace';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Xolace (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Xolace (Preview)';
  }

  return 'Xolace';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: "xolace",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "xolace",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/xolace-icon-sample.icon",
      bundleIdentifier: getUniqueIdentifier(),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#040307",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: getUniqueIdentifier(),
      googleServicesFile: "./google-services.json"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#040307",
          android: {
            image: "./assets/images/icons/splash-icon-dark.png",
            imageWidth: 76
          },
          ios: {
            image: "./assets/images/icons/splash-icon-dark.png",
            imageWidth: 200,
            dark: {
              image: "./assets/images/icons/splash-icon-light.png",
              backgroundColor: "#040307"
            }
          }
        }
      ],
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Poppins-Regular.ttf",
            "./assets/fonts/Poppins-Medium.ttf",
            "./assets/fonts/Poppins-Bold.ttf",
            "./assets/fonts/Poppins-SemiBold.ttf"
          ]
        }
      ],
      "expo-sqlite",
      "@clerk/expo",
      "expo-secure-store",
      "expo-apple-authentication",
      "expo-notifications"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "9b49d23b-d85c-48c9-84a4-db117b864dd3"
      },
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
      EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID
    },
    updates: {
      url: "https://u.expo.dev/9b49d23b-d85c-48c9-84a4-db117b864dd3"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    owner: "xolace-inc-org"
})
