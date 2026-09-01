import { describe, expect, it } from "vitest";
import {
  REFLECT_TOUR_VERSION,
  shouldShowReflectTour,
} from "@/src/features/reflect/tour-copy";
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
    // "Never two sessions in a row" is only enforceable if the id survives a
    // relaunch — the app is routinely closed between one session and the next.
    expect(persisted).toContain("plusOfferShownSessionId");
  });

  // A cold kill mid-intake must restart at the founder message with nothing
  // half-answered (T6, issue #263).
  it("intake answers are NOT persisted", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).not.toContain("intakeAnswers");
  });
});

describe("reflect tour version", () => {
  it("defaults to 0, so a device that never finished a tour sees the current one", () => {
    expect(useAppStore.getState().reflectTourVersion).toBe(0);
    expect(shouldShowReflectTour(0)).toBe(true);
  });

  it("does not re-show the tour to a device already at the current version", () => {
    expect(shouldShowReflectTour(REFLECT_TOUR_VERSION)).toBe(false);
  });

  it("is persisted, so a finished tour stays finished across relaunches", () => {
    const state = useAppStore.getState();
    const persisted = Object.keys(
      (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
        .persist.getOptions()
        .partialize(state),
    );
    expect(persisted).toContain("reflectTourVersion");
  });
});

describe("recordPlusOfferDismissal", () => {
  it("stamps the surface and opens the full stop on the third dismissal", () => {
    useAppStore.setState({
      plusOfferLastDismissedAt: {},
      plusOfferDismissalCount: 0,
      plusOfferFullStopAt: null,
    });
    const { recordPlusOfferDismissal } = useAppStore.getState();

    recordPlusOfferDismissal("session_close");
    expect(
      useAppStore.getState().plusOfferLastDismissedAt.session_close,
    ).toBeTypeOf('number');
    expect(useAppStore.getState().plusOfferFullStopAt).toBeNull();

    recordPlusOfferDismissal("mirror_landed");
    recordPlusOfferDismissal("profile_insight");
    expect(useAppStore.getState().plusOfferDismissalCount).toBe(3);
    expect(useAppStore.getState().plusOfferFullStopAt).toBeTypeOf('number');
  });

  it("starts the count over once a full stop has run its course", () => {
    useAppStore.setState({
      plusOfferLastDismissedAt: {},
      plusOfferDismissalCount: 3,
      plusOfferFullStopAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
    });
    useAppStore.getState().recordPlusOfferDismissal("session_close");
    expect(useAppStore.getState().plusOfferDismissalCount).toBe(1);
    expect(useAppStore.getState().plusOfferFullStopAt).toBeNull();
  });
});
