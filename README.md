# Daymark

Daymark is a phone-first habit tracker for quick daily check-ins and steady, low-pressure progress. It is built with Expo, React Native, TypeScript, and Expo Router.

## Features

- **Onboarding and quick check-ins:** a short first-run introduction and a one-tap daily completion flow.
- **Flexible habits:** create and edit habits with a name, start date, optional notes, reminder preference, and daily, weekdays, or three-times-per-week frequency.
- **Streaks and progress:** current/best streaks, weekly consistency, a compact week view, and recent completion history. A three-times-per-week habit counts three distinct check-ins toward its weekly goal; completed goals remain undoable from Today.
- **Habit library:** search and filter habits, then pause, resume, archive, restore, edit, or confirm permanent deletion.
- **Local reminders and ringtones:** optional scheduled notifications with permission recovery, three original bundled sounds plus the device default, and in-app audio previews. On Android 10+ in a native Daymark build, users can upload a short MP3, WAV, M4A, or OGG tune (up to 10 MB) and use it for reminders. Android notification channels are sound-specific and remain under device-user control.
- **Settings:** notification controls, tone selection and uploads, haptics, reduced motion, week-start preference, data export, and clearing check-in history.
- **Accessible recovery:** loading, empty, offline, permission, save-error, success, retry, and undo states; large controls, accessible labels, readable contrast, and reduced-motion support.

## Data and privacy

Habit state, selected tone, and imported-tone metadata are stored locally on the device using AsyncStorage. Imported audio files are copied to app-private storage; Android 10+ also registers a local MediaStore copy for notification playback. The system file picker is used without requesting microphone or broad external-storage access. Check-ins work offline and do not require an account or network connection. The app does not sync this habit data to the project's server/database. JSON exports include habit data and tone metadata but exclude the audio files; custom sounds remain on this device. Clearing history removes check-in dates while keeping the habits and tone library.

Because data is device-local, uninstalling or clearing Android app storage can remove it. Export a copy before changing devices if you need to preserve your history. Android notification permission and delivery must be checked on an installed native build; Expo Web Preview does not support native notification behavior.

### Sound compatibility

Bundled Daymark sounds work in native iOS and Android builds. Android 10+ can use uploaded audio as a notification sound through a tone-specific channel; Android 8–9 can import and preview audio but falls back to the device-default notification sound. Uploaded tunes can still be previewed on iPhone, but iOS background notifications only use sounds bundled with the app. Expo Go does not include Daymark's custom Android module, so a native Daymark build is required for uploaded notification sounds.

For a habit starting in the future, Daymark schedules its first seven due reminder dates; the schedule window is refreshed whenever the app returns to the foreground.

## Run the app

### Web preview

Requirements: Node.js 22 and pnpm (the project pins pnpm 9.12.0).

```bash
pnpm install --frozen-lockfile
pnpm dev:metro
```

`pnpm dev:metro` starts Expo Web on port `8081`. The optional API starter listens on port `3000`; the habit-tracking features themselves use local storage and do not depend on that API.

### Android emulator or device

Install Android Studio, an Android SDK, and an emulator (or connect an Android device). From the project root:

```bash
pnpm install --frozen-lockfile
pnpm exec expo prebuild --platform android --no-install
pnpm exec expo start --port 8081
```

Keep Metro running. Open the generated **`android/`** folder in Android Studio, let Gradle sync, choose a device, and run the `app` configuration. Alternatively, use `pnpm android` from the project root when SDK paths and a target device are configured.

To make a local debug APK from the `android/` directory:

```bash
./gradlew assembleDebug
```

On Windows use `gradlew.bat assembleDebug`. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. This is a development build, not a release-signed distribution package. Configure your own private signing key before publishing a release.

For a step-by-step handoff, see [ANDROID_STUDIO_README.md](ANDROID_STUDIO_README.md). A separate complete Android Studio source ZIP is also supplied with this project handoff.

The public source repository at `https://github.com/nothing7252568-alt/Daymark` includes a manually triggered GitHub Actions workflow at `.github/workflows/android-apk.yml`. Trigger **Android debug APK** from the repository's **Actions** tab to build an installable debug APK and download it from the run's artifacts. Because the repository is public, source and workflow artifacts may be publicly accessible. A debug APK is not a release-signed Play Store build.

## Checks

```bash
pnpm check
pnpm test
pnpm exec expo export --platform web --output-dir dist-web
```

The project tests cover date handling, check-in schedules, weekly-goal streaks, future reminder windows, progress calculations, backward-compatible local-state hydration, and imported-tone metadata validation.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the delivered features and platform notes.

## Project structure

- `app/` — Expo Router onboarding and the Today, Progress, Habits, and Settings screens.
- `components/habits/` — shared cards, check-in rows, progress ring, habit form, and confirmations.
- `lib/habits/` — habit types, local-date/streak logic, AsyncStorage persistence, notification scheduling, tone catalogue, and app state.
- `modules/daymark-tone/` — Android Expo module for MediaStore audio registration and per-tone notification channels.
- `assets/ringtones/` — short bundled notification sounds for native alerts and in-app previews.
- `assets/images/` — Daymark launcher, adaptive, splash, and web icons.
- `android/` — generated Android Studio/Gradle project.
- `tests/` — deterministic habit date, streak, progress, and persistence tests.

## Technology

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · AsyncStorage · Expo Notifications · Expo Audio · React Native SVG.
