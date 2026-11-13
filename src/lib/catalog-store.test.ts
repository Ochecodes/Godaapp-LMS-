import { beforeEach, describe, expect, it } from "vitest";
import { createCatalogStore } from "@/lib/catalog-store";

describe("catalog store", () => {
  const store = createCatalogStore();

  beforeEach(() => {
    store.setState({ searchQuery: "", selectedCourse: null });
  });

  it("selecting a course clears an active search", () => {
    store.getState().setSearchQuery("forex");
    store.getState().selectCourse("Forex Trading");

    expect(store.getState()).toMatchObject({
      searchQuery: "",
      selectedCourse: "Forex Trading",
    });
  });

  it("searching clears a selected course and clearing selection resets the filter", () => {
    store.getState().selectCourse("Crypto Markets");
    store.getState().setSearchQuery("market");

    expect(store.getState()).toMatchObject({
      searchQuery: "market",
      selectedCourse: null,
    });

    store.getState().selectCourse("Forex Trading");
    store.getState().clearSelectedCourse();

    expect(store.getState()).toMatchObject({
      searchQuery: "",
      selectedCourse: null,
    });
  });
});
