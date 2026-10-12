import React from "react";
import { Redirect } from "expo-router";
import { AppScreen, LoadingState, PrimaryButton, StateCard } from "@/components/habits/ui";
import { useHabitStore } from "@/lib/habits/context";

export default function IndexGate() {
  const { hydrated, loadingError, retryLoad, state } = useHabitStore();
  if (!hydrated) return <AppScreen><LoadingState /></AppScreen>;
  if (loadingError) {
    return (
      <AppScreen>
        <StateCard icon="cloud-offline-outline" title="Your day is still here" message={`${loadingError} Try opening your saved habits again.`} action={<PrimaryButton onPress={() => void retryLoad()} icon="refresh">Try again</PrimaryButton>} />
      </AppScreen>
    );
  }
  return <Redirect href={state.onboardingComplete ? "/(tabs)" : "/onboarding"} />;
}
