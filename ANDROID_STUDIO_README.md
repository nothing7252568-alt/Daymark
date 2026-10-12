# Daymark — Android Studio handoff

This archive contains the complete Daymark Expo/React Native source plus the generated `android/` Gradle project. Open **`android/`** in Android Studio.

## Run a development build

1. Install Android Studio with an Android SDK and emulator, plus Node.js 22 and pnpm.
2. In a terminal, change to this folder (the one containing `package.json`) and run `pnpm install --frozen-lockfile`.
3. Start Metro from this folder with `pnpm exec expo start --port 8081` and leave it running.
4. In Android Studio, open the `android/` folder, allow Gradle sync to complete, choose an emulator or connected Android device, then click **Run** for the `app` configuration. A physical device and computer must be able to reach the Metro server.

The equivalent project script `pnpm android` uses Expo's native `run:android` command. It can build/install the app when Android SDK tooling is configured.

## Build a debug APK

From Android Studio use **Build → Build Bundle(s) / APK(s) → Build APK(s)**, or from a terminal in `android/` run `./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`). The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Important notes

- This is a source project, **not a prebuilt APK**. Gradle downloads Android build dependencies during its first sync/build, so internet access is required.
- A debug run uses the JavaScript Metro server. Local habit data is stored on the device. Notification delivery and permission prompts need to be exercised on an installed Android build/device; a Web preview does not validate them.
- The generated Gradle release signing configuration is for local development only. Before distributing a release, configure your own private signing key in Android Studio/Gradle; never share that key in this archive or source control.
- The archive omits `node_modules`, build caches, `.git` history, and environment/secrets files. Reinstall JavaScript dependencies with the lockfile command above.
