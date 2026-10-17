# Daymark Habit Tracker — Implementation Plan

## Product and implementation

Build Daymark as a portrait-first Expo / React Native / TypeScript app within the fixed managed Expo starter. Reuse Expo Router, React Native components, NativeWind, existing haptic tab support, AsyncStorage, Expo Notifications, and the existing icon set. Do not replace or regenerate the starter. No login is requested: persist habits, check-ins, onboarding completion, and preferences locally with AsyncStorage so the core check-in flow works without network access. Use an explicit storage version and safe hydration/migration behavior; never silently replace unreadable existing data with starter content. Keep the installed server/database configuration intact but do not introduce an unnecessary account or sync prerequisite.

Use four bottom tabs—Today, Progress, Habits, and Settings. Add a short, skippable onboarding flow and guide the user directly to the first habit. Today is the fast one-handed home: date and welcome, completion summary, focused streak detail, and stacked habit rows with a prominent one-tap check-in control. Create/edit in a compact keyboard-aware sheet/form. Habit fields: name, frequency/schedule, start date, optional notes, and reminder preference/time. Management includes pause/resume, archive/restore, and confirmed deletion with a recovery affordance where applicable. A 3×/week habit represents three distinct check-ins in the weekly summary; after the target is reached it leaves the open-task list but remains available with a durable latest-check-in undo. Progress shows current/best streak, weekly consistency, and completion history. Habits supports search plus active/paused/archived and completion filters.

Schedule local Expo notifications only after a clear permission request; handle granted, denied, unavailable, and unsupported preview/web conditions without blocking non-notification use. Do not notify before a habit's start date; for a future start, schedule its first seven due dates and refresh that window when the app resumes. Present reminders in the foreground, and reconcile/cancel schedules when a habit changes or is paused/archived, a weekly target is met, or the app resumes. Provide useful Settings for notification access, haptics/reduced motion, week start, and data controls. Make the device-local nature of data clear. A lost network must not block check-ins; show offline status where connectivity is available.

Extend Reminder settings with a device-default option and several original, previewable bundled tones. Let Android users import supported local audio files, preview them, choose one for reminders, and remove imported tones. Use the system file picker and app-private file storage without requesting microphone or broad external-storage permission. Persist and validate the selected tone and custom-tone metadata locally; register an Android MediaStore audio URI for OS playback. A local Android Expo module creates a unique NotificationChannel for each selected tone because Android fixes channel sound after creation. Keep bundled sound names in the Expo Notifications config plugin. Uploaded tunes can drive Android notification channels on Android 10+; Android 8–9 can import and preview them but falls back to a bundled/device-default alert. Expo Go cannot include the custom native module, and iOS/Web can preview an imported tune but cannot use a post-install upload as a background notification sound. State those platform limits beside the upload control and keep ordinary reminders usable with the bundled/default sounds.

Treat hydration, empty collections, permissions, offline use, storage errors, retry/recovery, and successful check-ins as explicit UI states. Keep operations optimistic only when rollback is safe; surface failed persistence with a retry and avoid implying an unsaved change is durable, including in onboarding. Confirm before discarding a dirty create/edit form. Use accessible labels/roles, high contrast, large touch targets, visible focus on web, and reduced-motion-aware feedback. Cover core date/streak/storage behavior with deterministic unit tests.

## Project structure

- `app/_layout.tsx`: existing app providers, plus shared habit-state provider and status bar behavior.
- `app/index.tsx`, `app/onboarding.tsx`: persisted first-run gate and concise onboarding.
- `app/(tabs)/_layout.tsx`: four accessible bottom tabs.
- `app/(tabs)/index.tsx`: Today and one-tap check-ins.
- `app/(tabs)/progress.tsx`: streaks, weekly completion, and history.
- `app/(tabs)/habits.tsx`: search, filters, management, and create/edit entry point.
- `app/(tabs)/settings.tsx`: notification preferences, accessibility, and data controls.
- `components/habits/`: reusable cards, progress indicators, form sheet, permission notice, empty/loading/error/offline states, and confirmation surfaces.
- `lib/habits/types.ts`, `dates.ts`, `streaks.ts`, `storage.ts`, `notifications.ts`, `context.tsx`: typed domain model, local calendar math, AsyncStorage persistence, local notification lifecycle, and screen-facing actions.
- `lib/habits/tones.ts` and `modules/daymark-tone/`: tone metadata/import lifecycle and the Android-only Expo module that registers uploaded audio and tone-specific notification channels.
- `assets/ringtones/`: short bundled tone files, previewed in-app and packaged for native notifications.
- `tests/`: focused unit tests for date calculations, streaks, filters, and persistence recovery.
- `assets/images/`: custom Daymark launcher/splash/web branding; preserve Expo identifiers in `app.config.ts`.

## Design system

- **Design movement:** contemporary editorial wellness, expressed as a calm, precise dark-mode native product rather than a gamified scoreboard.
- **Core principles:** one-thumb speed; quiet confidence; progress without guilt; legible, reversible controls.
- **Color philosophy:** near-black graphite (`#0B0E0D`) is the restful canvas, lifted charcoal (`#151A17`) distinguishes surfaces without boxed-in clutter, warm chalk (`#EFF2E9`) keeps copy readable, and bright citron (`#D9F66F`) is reserved for the brand and high-value actions. Muted sage supports secondary information; coral is a restrained warning cue. Keep contrast strong and semantic states distinct.
- **Layout paradigm:** editorial portrait flow with asymmetric header alignment, one large focus zone and a vertical stack of actionable habits; persistent bottom navigation and compact modal sheets keep important actions in thumb reach. Avoid a central tile dashboard.
- **Signature elements:** a custom sunrise/orbit Daymark symbol; thin citron progress arc and day markers; rounded-outline check controls that fill on success.
- **Interaction philosophy:** checking in is instant and rewarding but never noisy; destructive actions are explicit, reversible where possible, and clearly named. Use haptics only when enabled and supported.
- **Animation:** short 150–220 ms fades/slides for sheets and a soft 350–450 ms ease-out ring fill; no perpetual motion or success pulse. Respect the reduced-motion preference and render the ring/sheets without animation when disabled.
- **Typography system:** platform system sans for predictable native rendering (San Francisco on iOS, Roboto on Android, system sans on web). Use a bold, slightly rounded display weight for the day headline, strong medium-weight habit titles, and small high-contrast uppercase metadata with restrained tracking; numeric streaks receive tabular-looking emphasis where supported.
- **Brand essence:** “A quieter way to make small actions add up”—for people building routines who want quick daily follow-through without guilt or setup friction. Personality: grounded, optimistic, clear.
- **Brand voice:** short, kind, specific; praise effort rather than perfection. Example lines: “One small thing, kept.” and “You’re still in the rhythm. Pick up today.”
- **Wordmark & logo:** a compact bespoke sunrise/orbit mark made of a rising citron arc and three ascending day marks, paired with a letter-spaced DAYMARK wordmark; do not bake text into the launcher symbol.
- **Signature brand color:** electric citron `#D9F66F`.

## Source and Android build handoff

Keep Manus as the project's canonical repository. For this request, push the complete source to the user's explicitly authorized public `https://github.com/nothing7252568-alt/Daymark` repository without rewriting its existing history or removing its existing files. Include an on-demand GitHub Actions workflow that builds an installable Android debug APK from committed source and uploads it as an artifact; because the repository is public, the source and workflow artifacts may be publicly accessible. Do not include signing keys or claim the debug APK is a release-signed distribution build.

## Constraints

Managed Mobile is the fixed Expo/React Native/TypeScript starter, with declared Metro/API ports 8081/3000; keep both unchanged. Preserve the generated app slug, scheme, and bundle identifiers. The app’s native notifications require a real mobile runtime and user permission; Expo Web preview cannot validate native notification delivery. Local persistence intentionally avoids login/network gating, and the app should state that data belongs on this device unless the product later adds an explicit sync choice. Do not deploy the app publicly unless separately requested, and do not claim a native release build unless the build result reports it.
