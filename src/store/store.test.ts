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

  it("ventIntroSeen is persisted", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).toContain("ventIntroSeen");
  });

  // The whole point of the cooldown is that a "no" survives a relaunch.
  it("plus offer cadence state is persisted", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).toContain("plusOfferLastDismissedAt");
    expect(persisted).toContain("plusOfferDismissalCount");
    expect(persisted).toContain("plusOfferFullStopAt");
  });
});

describe("recordPlusOfferDismissal", () => {
  it("stamps the moment and opens the full stop on the third dismissal", () => {
    useAppStore.setState({
      plusOfferLastDismissedAt: {},
      plusOfferDismissalCount: 0,
      plusOfferFullStopAt: null,
    });
    const { recordPlusOfferDismissal } = useAppStore.getState();

    recordPlusOfferDismissal(1);
    expect(useAppStore.getState().plusOfferLastDismissedAt[1]).toBeNumber();
    expect(useAppStore.getState().plusOfferFullStopAt).toBeNull();

    recordPlusOfferDismissal(2);
    recordPlusOfferDismissal(3);
    expect(useAppStore.getState().plusOfferDismissalCount).toBe(3);
    expect(useAppStore.getState().plusOfferFullStopAt).toBeNumber();
  });

  it("starts the count over once a full stop has run its course", () => {
    useAppStore.setState({
      plusOfferLastDismissedAt: {},
      plusOfferDismissalCount: 3,
      plusOfferFullStopAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
    });
    useAppStore.getState().recordPlusOfferDismissal(1);
    expect(useAppStore.getState().plusOfferDismissalCount).toBe(1);
    expect(useAppStore.getState().plusOfferFullStopAt).toBeNull();
  });
});
