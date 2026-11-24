import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCatalogue, seedCatalogue } from "./api";
import type { Catalogue, Session } from "./config";

interface CatalogueValue {
  data: Catalogue;
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  sessionBySlug: (slug: string) => Session | undefined;
}

const CatalogueContext = createContext<CatalogueValue | null>(null);

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Catalogue>(seedCatalogue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchCatalogue();
      setData(next);
      setError(null);
    } catch {
      setError("Showing the last saved catalogue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CatalogueValue>(() => {
    const sessions = [...data.sessions].filter((s) => s.active).sort((a, b) => a.sort_order - b.sort_order);
    return {
      data,
      sessions,
      loading,
      error,
      refresh,
      sessionBySlug: (slug) => sessions.find((s) => s.slug === slug),
    };
  }, [data, loading, error, refresh]);

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): CatalogueValue {
  const context = useContext(CatalogueContext);
  if (!context) throw new Error("useCatalogue must be used inside CatalogueProvider");
  return context;
}
