"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";

export type CatalogState = {
  searchQuery: string;
  selectedCourse: string | null;
  setSearchQuery: (searchQuery: string) => void;
  selectCourse: (selectedCourse: string) => void;
  clearSelectedCourse: () => void;
};

export function createCatalogStore(): StoreApi<CatalogState> {
  return createStore<CatalogState>((set) => ({
    searchQuery: "",
    selectedCourse: null,
    setSearchQuery: (searchQuery) => set({ searchQuery, selectedCourse: null }),
    selectCourse: (selectedCourse) => set({ searchQuery: "", selectedCourse }),
    clearSelectedCourse: () => set({ selectedCourse: null }),
  }));
}

const CatalogStoreContext = createContext<StoreApi<CatalogState> | null>(null);

export function CatalogStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<CatalogState> | null>(null);
  if (!storeRef.current) storeRef.current = createCatalogStore();

  return (
    <CatalogStoreContext.Provider value={storeRef.current}>
      {children}
    </CatalogStoreContext.Provider>
  );
}

export function useCatalogStore<T>(selector: (state: CatalogState) => T): T {
  const store = useContext(CatalogStoreContext);
  if (!store) throw new Error("useCatalogStore must be used within CatalogStoreProvider.");
  return useStore(store, selector);
}
