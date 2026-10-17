# Daymark — Android Studio handoff

This archive contains the complete Daymark Expo/React Native source, the local `modules/daymark-tone` Android helper, and the generated `android/` Gradle project. Open **`android/`** in Android Studio.

## Run a development build

1. Install Android Studio with an Android SDK and emulator, plus Node.js 22 and pnpm.
2. In a terminal, change to this folder (the one containing `package.json`) and run `pnpm install --frozen-lockfile`.
3. Regenerate the native project after config or local-module changes with `pnpm exec expo prebuild --platform android --no-install`.
4. Start Metro from this folder with `pnpm exec expo start --port 8081` and leave it running.
5. In Android Studio, open the `android/` folder, allow Gradle sync to complete, choose an emulator or connected Android device, then click **Run** for the `app` configuration. A physical device and computer must be able to reach the Metro server.

The equivalent project script `pnpm android` uses Expo's native `run:android` command. It can build/install the app when SDK paths and a target device are configured.

## Build a debug APK

From Android Studio use **Build → Build Bundle(s) / APK(s) → Build APK(s)**, or from a terminal in `android/` run `./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`). The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Important notes

- This is a source project, **not a prebuilt APK**. Gradle downloads Android build dependencies during its first sync/build, so internet access is required.
- A debug run uses the JavaScript Metro server. Local habit data and uploaded tune metadata are stored on the device. Notification delivery and permission prompts need to be exercised on an installed Android build/device; a Web preview does not validate them.
- Bundled Daymark tones work in native builds. Custom uploaded tones can drive notification channels on Android 10+; Android 8–9 supports local import and preview but uses the device-default notification sound. Expo Go does not include the custom native module, so use a Daymark native build to validate uploaded notification sounds.
- The app uses the system audio-file picker and app-private storage; it does not need microphone or broad external-storage permission. Future-start reminders cover the first seven due dates and are refreshed when Daymark returns to the foreground.
- Android notification-channel sound is controlled by the device user after the channel is created. Each Daymark tone gets its own channel.
- The generated Gradle release signing configuration is for local development only. Before distributing a release, configure your own private signing key in Android Studio/Gradle; never share that key in this archive or source control.
- The GitHub Actions build produces a debug APK, not a release-signed Play Store artifact. This repository is public, so workflow artifacts may also be accessible to the public.
- The archive omits `node_modules`, build caches, `.git` history, and environment/secrets files. Reinstall JavaScript dependencies with the lockfile command above.
