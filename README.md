# Daymark

Daymark is a phone-first habit tracker for quick daily check-ins and steady, low-pressure progress. It is built with Expo, React Native, TypeScript, and Expo Router.

## Features

- **Onboarding and quick check-ins:** a short first-run introduction and a one-tap daily completion flow.
- **Flexible habits:** create and edit habits with a name, start date, optional notes, reminder preference, and daily, weekdays, or three-times-per-week frequency.
- **Streaks and progress:** current/best streaks, weekly consistency, a compact week view, and recent completion history. A three-times-per-week habit counts three distinct check-ins toward its weekly goal; completed goals remain undoable from Today.
- **Habit library:** search and filter habits, then pause, resume, archive, restore, edit, or confirm permanent deletion.
- **Local reminders:** optional scheduled notifications with a clear permission flow. Schedules follow a habit's frequency and start date and are reconciled as habits change.
- **Settings:** notification controls, haptics, reduced motion, week-start preference, data export, and clearing check-in history.
- **Accessible recovery:** loading, empty, offline, permission, save-error, success, retry, and undo states; large controls, accessible labels, readable contrast, and reduced-motion support.

## Data and privacy

Habit state is stored locally on the device using AsyncStorage. Check-ins work offline and do not require an account or network connection. The app does not sync this habit data to the project's server/database. Settings can export the saved state as JSON; clearing history removes check-in dates while keeping the habits.

Because data is device-local, uninstalling or clearing Android app storage can remove it. Export a copy before changing devices if you need to preserve your history. Android notification permission and delivery must be checked on an installed native build; Expo Web Preview does not support native notification behavior.

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
pnpm exec expo start --port 8081
```

Keep Metro running. Open the generated **`android/`** folder in Android Studio, let Gradle sync, choose a device, and run the `app` configuration. Alternatively, use `pnpm android` from the project root when SDK paths and a target device are configured.

To make a local debug APK from the `android/` directory:

```bash
./gradlew assembleDebug
```

On Windows use `gradlew.bat assembleDebug`. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. This is a development build, not a release-signed distribution package. Configure your own private signing key before publishing a release.

For a step-by-step handoff, see [ANDROID_STUDIO_README.md](ANDROID_STUDIO_README.md). A separate complete Android Studio source ZIP is also supplied with this project handoff.

## Checks

```bash
pnpm check
pnpm test
pnpm exec expo export --platform web --output-dir dist-web
```

The project tests cover date handling, check-in schedules, weekly-goal streaks, and progress calculations.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the v1.0.0 feature summary and platform notes.

## Project structure

- `app/` — Expo Router onboarding and the Today, Progress, Habits, and Settings screens.
- `components/habits/` — shared cards, check-in rows, progress ring, habit form, and confirmations.
- `lib/habits/` — habit types, local-date/streak logic, AsyncStorage persistence, notifications, and app state.
- `assets/images/` — Daymark launcher, adaptive, splash, and web icons.
- `android/` — generated Android Studio/Gradle project.
- `tests/` — deterministic habit date, streak, and progress tests.

## Technology

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · AsyncStorage · Expo Notifications · React Native SVG.
