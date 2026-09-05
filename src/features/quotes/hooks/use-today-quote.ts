import { useEffect, useRef, useState } from "react";
import type { OptimisticLocalStore } from "convex/browser";
import { useAction, useMutation, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuoteNotifications } from "@/src/features/quotes/hooks/use-quote-notifications";

/**
 * The line above the quote on the paper card. It *is* the Xolace+ gate — a locked user
 * sees the curated quote in full; what is withheld is provenance, not the
 * quote. One precedence chain, first match wins (#309).
 */
export type SourceLine = { text: string; isGate: boolean };

/**
 * Move the star before the round-trip. Both of today's quotes are checked by
 * id because either one can be the poster's, and `savedCount` moves with the
 * flag so the archive's count strip doesn't lag a tap behind.
 *
 * Exported because the archive's unsave chip needs the same patch. It passes
 * `countDelta` explicitly: the guard below reads the flag off today's two
 * quotes, and an archive row from a past day is neither, so the inferred delta
 * would be 0 for exactly the rows the archive is full of.
 */
export function patchSaved(
  store: OptimisticLocalStore,
  quoteId: Id<"daily_quotes">,
  saved: boolean,
  countDelta?: number,
) {
  const current = store.getQuery(api.dailyQuotes.getToday, {});
  if (current === undefined) return;

  const savedAt = saved ? Date.now() : undefined;

  const wasSaved = [current.session, current.curated].some(
    (q) => q?._id === quoteId && q.savedAt !== undefined,
  );
  const delta = countDelta ?? (saved ? (wasSaved ? 0 : 1) : wasSaved ? -1 : 0);

  const patch = <T extends { _id: Id<"daily_quotes"> } | null>(quote: T) =>
    quote && quote._id === quoteId ? { ...quote, savedAt } : quote;

  store.setQuery(api.dailyQuotes.getToday, {}, {
    ...current,
    session: patch(current.session),
    curated: patch(current.curated),
    savedCount: Math.max(0, current.savedCount + delta),
  });
}

/**
 * Everything today's poster needs: the quote, its one derived source line, and
 * the cold-start / first-visit machinery around it. The screen composes; it
 * does not decide.
 */
export function useTodayQuote() {
  const posthog = usePostHog();

  const todayQuotes = useQuery(api.dailyQuotes.getToday);
  const quotePrefs = useQuery(api.preferences.getQuotePreferences);
  const coldStart = useAction(api.dailyQuotes.coldStart);
  const reactToQuote = useMutation(api.dailyQuotes.react);
  const clearReaction = useMutation(api.dailyQuotes.clearReaction);
  const saveQuote = useMutation(api.dailyQuotes.save).withOptimisticUpdate(
    (store, args) => patchSaved(store, args.quoteId, true),
  );
  const unsaveQuote = useMutation(api.dailyQuotes.unsave).withOptimisticUpdate(
    (store, args) => patchSaved(store, args.quoteId, false),
  );
  const { state: notifState, scheduleNotification } = useQuoteNotifications();

  const [isManualColdStarting, setIsManualColdStarting] = useState(false);
  const [coldStartError, setColdStartError] = useState(false);
  const viewedTrackedRef = useRef(false);
  const gateViewedTrackedRef = useRef(false);

  /**
   * Invariant: one cold start per mount. It is reset **only** on an explicit
   * retry — never on the error path, or a failing action re-arms the effect
   * that failed and loops.
   */
  const coldStartIssuedRef = useRef(false);

  const isLoading = todayQuotes === undefined || quotePrefs === undefined;
  const quote = todayQuotes?.session ?? todayQuotes?.curated ?? null;
  const sessionLocked = todayQuotes?.sessionLocked ?? false;
  const isFirstVisit = !isLoading && quotePrefs === null;
  const needsColdStart =
    !isLoading &&
    !isFirstVisit &&
    quote === null &&
    !isManualColdStarting &&
    !coldStartError;
  const isColdStarting = isManualColdStarting || needsColdStart;

  const sourceLine: SourceLine | null = !quote
    ? null
    : sessionLocked
      ? { text: "This one's for everyone. Yours is waiting →", isGate: true }
      : quote.type === "session"
        ? { text: "based on what you've been sharing.", isGate: false }
        : todayQuotes?.hasSessionToday === false
          ? { text: "reflect today and tomorrow's is yours.", isGate: false }
          : { text: "chosen for you today.", isGate: false };

  useEffect(() => {
    if (!needsColdStart || coldStartIssuedRef.current) return;
    coldStartIssuedRef.current = true;
    coldStart().catch((e) => {
      console.error(e);
      setColdStartError(true);
    });
  }, [needsColdStart, coldStart]);

  useEffect(() => {
    if (viewedTrackedRef.current || isFirstVisit || isLoading || !quote) return;
    viewedTrackedRef.current = true;
    posthog.capture("quote_viewed", {
      quote_type: quote.type,
      has_session_today: todayQuotes?.hasSessionToday ?? false,
    });
  }, [isFirstVisit, isLoading, quote, todayQuotes?.hasSessionToday, posthog]);

  useEffect(() => {
    if (gateViewedTrackedRef.current || isLoading || !sessionLocked) return;
    gateViewedTrackedRef.current = true;
    posthog.capture("premium_gate_hit", {
      feature: "daily_quote",
      hasData: true,
    });
  }, [isLoading, sessionLocked, posthog]);

  const runColdStart = async () => {
    if (coldStartIssuedRef.current) return;
    coldStartIssuedRef.current = true;
    setIsManualColdStarting(true);
    await coldStart()
      .catch((e) => {
        console.error(e);
        setColdStartError(true);
      })
      .finally(() => setIsManualColdStarting(false));
  };

  const retry = () => {
    setColdStartError(false);
    coldStartIssuedRef.current = false;
    void runColdStart();
  };

  const completePreferences = async (
    themes: string[],
    notifEnabled: boolean,
    notifTime?: string,
  ) => {
    posthog.capture("quote_preferences_set", {
      theme_count: themes.length,
      themes,
      notifications_enabled: notifEnabled,
      notification_time: notifTime ?? null,
    });
    await scheduleNotification(themes, notifEnabled, notifTime);
    setColdStartError(false);
    await runColdStart();
  };

  /** `not_today` is gone from the UI (#303) — resonate is a toggle to null. */
  const setReaction = async (next: "resonates" | null) => {
    if (!quote) return;
    if (!next) {
      posthog.capture("quote_reaction_cleared", {
        previous_reaction: quote.reaction ?? null,
        quote_type: quote.type,
      });
      await clearReaction({ quoteId: quote._id });
      return;
    }
    posthog.capture("quote_reacted", { reaction: next, quote_type: quote.type });
    await reactToQuote({ quoteId: quote._id, reaction: next });
  };

  /**
   * The star is optimistic, so a rejection un-fills it with nothing said. Log
   * it, and count the event only once the write actually landed — capturing
   * first would score every failed save as a save.
   */
  const setSaved = async (next: boolean) => {
    if (!quote) return;
    try {
      await (next
        ? saveQuote({ quoteId: quote._id })
        : unsaveQuote({ quoteId: quote._id }));
      posthog.capture(next ? "quote_saved" : "quote_unsaved", {
        quote_type: quote.type,
      });
    } catch (e) {
      console.error("[quotes] save toggle failed", e);
    }
  };

  return {
    quote,
    sourceLine,
    /** The archive's count strip — rides on `getToday`, so a star moves it. */
    savedCount: todayQuotes?.savedCount ?? 0,
    isFirstVisit,
    isLoading,
    isColdStarting,
    coldStartError,
    isCompletingPreferences: notifState === "requesting" || isColdStarting,
    retry,
    react: setReaction,
    setSaved,
    completePreferences,
  };
}
