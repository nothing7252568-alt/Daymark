import { beforeEach, describe, expect, it, vi } from "vitest";
import { validatePersistedState } from "../lib/habits/storage";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const emptyLegacyState = {
  version: 1,
  onboardingComplete: true,
  habits: [],
  settings: {
    hapticsEnabled: true,
    reducedMotion: false,
    weekStartsOnMonday: true,
    remindersEnabled: true,
  },
};

beforeEach(() => vi.clearAllMocks());

describe("local reminder-tone state", () => {
  it("hydrates older saved settings with a bundled tone and an empty upload library", () => {
    const state = validatePersistedState(emptyLegacyState);
    expect(state.settings.reminderToneId).toBe("soft-rise");
    expect(state.customTones).toEqual([]);
    expect(state.onboardingComplete).toBe(true);
  });

  it("keeps a selected custom tone when its on-device metadata is valid", () => {
    const tone = {
      id: "custom-a1",
      name: "My tune",
      uri: "file:///documents/daymark-tones/custom-a1.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1200,
      createdAt: "2026-10-15T10:00:00.000Z",
      notificationUri: "content://media/external/audio/media/42",
    };
    const state = validatePersistedState({
      ...emptyLegacyState,
      customTones: [tone],
      settings: { ...emptyLegacyState.settings, reminderToneId: tone.id },
    });
    expect(state.customTones).toEqual([tone]);
    expect(state.settings.reminderToneId).toBe(tone.id);
  });

  it("falls back from a stale custom-tone selection without deleting other habits or records", () => {
    const state = validatePersistedState({
      ...emptyLegacyState,
      settings: { ...emptyLegacyState.settings, reminderToneId: "custom-missing" },
    });
    expect(state.settings.reminderToneId).toBe("soft-rise");
    expect(state.onboardingComplete).toBe(true);
  });

  it("rejects incomplete or unsafe imported-tone metadata and falls back to a bundled choice", () => {
    const state = validatePersistedState({
      ...emptyLegacyState,
      customTones: [
        { id: "custom-bad", name: "Missing fields", uri: "file:///private/tone.mp3" },
        {
          id: "custom-invalid",
          name: "Unsafe URI",
          uri: "file:///documents/daymark-tones/custom-invalid.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 1200,
          createdAt: "2026-10-15T10:00:00.000Z",
          notificationUri: "content://other.app/private/1",
        },
      ],
      settings: { ...emptyLegacyState.settings, reminderToneId: "custom-invalid" },
    });
    expect(state.customTones).toEqual([]);
    expect(state.settings.reminderToneId).toBe("soft-rise");
    expect(state.onboardingComplete).toBe(true);
  });
});
