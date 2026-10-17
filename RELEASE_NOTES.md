# Daymark v1.0.0 — Initial release

Daymark makes it easier to keep small routines moving with quick check-ins, clear streaks, and a calm, phone-first experience.

## What's included

- Short onboarding and a Today screen with one-tap daily check-ins, a weekly overview, and undo for recent check-ins.
- Create and edit habits with daily, weekday, or three-times-per-week schedules, start dates, notes, and optional reminders.
- Current and best streaks, weekly goal progress, and recent completion history.
- A searchable habit library with completion and status filters; pause, resume, archive, restore, and confirmed deletion flows.
- Optional local notifications, scheduled around each habit's frequency and start date, with clear permission handling.
- Settings for notification access, haptics, reduced motion, week start, exporting saved data, and clearing check-in history.
- Local-first storage and offline check-ins, plus loading, empty, offline, permission, save-error, retry, success, and recovery states.

## Reminder tone update

Daymark now offers three original bundled notification tones and the device-default option, with in-app previews. On Android 10+ in a native Daymark build, users can add an MP3, WAV, M4A, or OGG tune from device storage (up to 10 MB), preview it, select it for reminders, or remove it. Uploaded audio is stored locally, not sent to a service. Android uses a separate notification channel for each sound; device users can change or mute those channels in Android settings. Android 8–9 and Expo Go use a default/bundled reminder sound for uploaded tunes. On iOS, uploads remain previewable, while background notifications use only tones bundled with the app.

## Data and platform notes

Habit data and preferences are stored on the device; this release does not sync them to a cloud account. Export a JSON backup before changing devices or clearing the app's storage. Android notification permission and delivery require checking the installed native app. Notifications are unsupported in the Expo Web Preview.

The Android Studio handoff is a source project with a generated Gradle folder, not a prebuilt or release-signed APK. Use your own signing configuration before distributing an Android release.
