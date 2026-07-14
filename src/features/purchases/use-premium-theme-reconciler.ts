import { useEffect } from 'react';
import { Uniwind } from 'uniwind';
import { useAppStore } from '@/src/store/store';
import { THEME_BY_ID } from '@/src/lib/themes';
import { usePreferenceMutation } from '@/src/features/settings/hooks/use-preference-mutation';
import { usePlusEntitlement } from './use-plus-entitlement';

/** True for a variant like `velvet-dark` whose base theme is premium. */
function isPremiumVariant(variant: string | null): boolean {
  if (!variant) return false;
  const id = variant.replace(/-(light|dark)$/, '');
  return THEME_BY_ID[id]?.tier === 'premium';
}

/**
 * Drops a lapsed subscriber off a premium theme.
 *
 * `colorThemeId` is persisted locally and re-applied by theme-bootstrap.ts on
 * every cold start, long before the entitlement is known — so without this, a
 * user who picked a Plus theme and then let their subscription lapse would keep
 * it forever. Once the entitlement resolves to not-Plus, reset to `default`.
 *
 * Night mode complicates this: SessionModeProvider stashes the active theme in
 * `previousTheme` and applies `nightly-*` over it. If the stashed theme is the
 * premium one, clearing it is what actually prevents the restore from reviving
 * it at 4am — so both the live theme and the stash are checked.
 */
export function usePremiumThemeReconciler() {
  const { isPlus, isResolved } = usePlusEntitlement();
  const colorThemeId = useAppStore((s) => s.colorThemeId);
  const updatePreferences = usePreferenceMutation();

  useEffect(() => {
    // `isResolved`, not `!isLoading`: an unauthenticated cold start reports
    // isPlus=false with nothing loading, and treating that as a lapse would strip
    // a paying subscriber's theme on every launch (and fire an unauthenticated
    // mutation). Only revoke on a definitive answer from the server.
    if (!isResolved || isPlus) return;
    if (THEME_BY_ID[colorThemeId]?.tier !== 'premium') return;

    const {
      theme: storedTheme,
      previousTheme,
      setColorThemeId,
      setPreviousTheme,
    } = useAppStore.getState();

    setColorThemeId('default');
    updatePreferences({ colorTheme: 'default' });

    // Night mode is holding the premium theme in reserve — drop it so the
    // morning restore falls through to the (now default) colorThemeId.
    if (isPremiumVariant(previousTheme)) setPreviousTheme(null);

    // Only touch the live theme if the premium one is what's actually on screen;
    // if nightly is currently applied, leave it be.
    if (isPremiumVariant(Uniwind.currentTheme)) {
      Uniwind.setTheme(
        storedTheme === 'system' ? ('system' as never) : storedTheme,
      );
    }
  }, [isPlus, isResolved, colorThemeId, updatePreferences]);
}
