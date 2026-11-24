import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BookingSelections } from "./config";

export interface SavedEstimate {
  id: string;
  slug: string;
  title: string;
  selections: BookingSelections;
  estimateKes: number;
  depositKes: number;
  createdAt: number;
}

interface SavedValue {
  estimates: SavedEstimate[];
  sessions: string[];
  saveEstimate: (entry: Omit<SavedEstimate, "id" | "createdAt">) => SavedEstimate;
  removeEstimate: (id: string) => void;
  toggleSession: (slug: string) => boolean;
  isSaved: (slug: string) => boolean;
}

const SavedContext = createContext<SavedValue | null>(null);
const ESTIMATES_KEY = "w4l.saved.estimates";
const SESSIONS_KEY = "w4l.saved.sessions";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [estimates, setEstimates] = useState<SavedEstimate[]>(() => read<SavedEstimate[]>(ESTIMATES_KEY, []));
  const [sessions, setSessions] = useState<string[]>(() => read<string[]>(SESSIONS_KEY, []));

  useEffect(() => persist(ESTIMATES_KEY, estimates), [estimates]);
  useEffect(() => persist(SESSIONS_KEY, sessions), [sessions]);

  const saveEstimate = useCallback((entry: Omit<SavedEstimate, "id" | "createdAt">) => {
    const saved: SavedEstimate = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
    setEstimates((current) => [saved, ...current].slice(0, 20));
    return saved;
  }, []);

  const removeEstimate = useCallback((id: string) => {
    setEstimates((current) => current.filter((e) => e.id !== id));
  }, []);

  const toggleSession = useCallback((slug: string) => {
    let added = false;
    setSessions((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      added = true;
      return [...current, slug];
    });
    return added;
  }, []);

  const isSaved = useCallback((slug: string) => sessions.includes(slug), [sessions]);

  const value = useMemo<SavedValue>(
    () => ({ estimates, sessions, saveEstimate, removeEstimate, toggleSession, isSaved }),
    [estimates, sessions, saveEstimate, removeEstimate, toggleSession, isSaved],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedValue {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used inside SavedProvider");
  return context;
}
