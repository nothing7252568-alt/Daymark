import type { AudioSource } from "expo-audio";
import type { CustomReminderTone } from "./types";

export interface ReminderToneOption {
  id: string;
  name: string;
  description: string;
  resourceName: string | null;
  source: AudioSource | null;
  customTone?: CustomReminderTone;
}

export const BUILT_IN_REMINDER_TONES: readonly ReminderToneOption[] = [
  {
    id: "device-default",
    name: "Device default",
    description: "Use the notification sound set on your phone",
    resourceName: null,
    source: null,
  },
  {
    id: "soft-rise",
    name: "Soft rise",
    description: "A calm, airy three-note chime",
    resourceName: "soft_rise.wav",
    source: require("../../assets/ringtones/soft_rise.wav"),
  },
  {
    id: "bright-bell",
    name: "Bright bell",
    description: "A clear double bell, easy to notice",
    resourceName: "bright_bell.wav",
    source: require("../../assets/ringtones/bright_bell.wav"),
  },
  {
    id: "warm-bloom",
    name: "Warm bloom",
    description: "A soft, rounded two-note tone",
    resourceName: "warm_bloom.wav",
    source: require("../../assets/ringtones/warm_bloom.wav"),
  },
];

export function isBuiltInReminderToneId(id: string): boolean {
  return BUILT_IN_REMINDER_TONES.some((tone) => tone.id === id);
}

export function getReminderToneOption(id: string, customTones: CustomReminderTone[]): ReminderToneOption {
  const builtIn = BUILT_IN_REMINDER_TONES.find((tone) => tone.id === id);
  if (builtIn) return builtIn;
  const customTone = customTones.find((tone) => tone.id === id);
  if (!customTone) return BUILT_IN_REMINDER_TONES[1];
  return {
    id: customTone.id,
    name: customTone.name,
    description: "Your imported tune",
    resourceName: null,
    source: customTone.uri,
    customTone,
  };
}
