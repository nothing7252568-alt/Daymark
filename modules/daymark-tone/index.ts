import { requireOptionalNativeModule } from "expo-modules-core";

export interface DaymarkToneNativeModule {
  getApiLevel(): Promise<number>;
  registerNotificationAudio(sourceUri: string, displayName: string): Promise<string>;
  createToneNotificationChannel(channelId: string, name: string, soundUri: string): Promise<void>;
  deleteNotificationAudio(soundUri: string): Promise<void>;
  deleteToneNotificationChannel(channelId: string): Promise<void>;
}

export const DaymarkToneModule = requireOptionalNativeModule<DaymarkToneNativeModule>("DaymarkTone");
