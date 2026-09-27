"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Prefs = {
  timezone: string;
  petName: string;
  displayName: string;
  soundEffects: boolean;
  reduceMotion: boolean;
};

const PrefsContext = createContext<Prefs>({
  timezone: "UTC",
  petName: "Pip",
  displayName: "",
  soundEffects: false,
  reduceMotion: false,
});

export function PrefsProvider({ value, children }: { value: Prefs; children: ReactNode }) {
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  return useContext(PrefsContext);
}
