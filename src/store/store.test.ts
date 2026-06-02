import { describe, expect, it } from "bun:test";
import { useAppStore } from "./store";

describe("store partialize", () => {
  it("bridgeEnabled is persisted", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).toContain("bridgeEnabled");
  });

  it("bridgeIntroSeen is persisted", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).toContain("bridgeIntroSeen");
  });
});
