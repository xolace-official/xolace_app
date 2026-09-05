import { useStablePaginatedQuery } from "@/src/lib/convex/use-stable-query";
import { api } from "@/convex/_generated/api";

/**
 * The archive: kept quotes, newest first, paginated.
 *
 * `useStablePaginatedQuery` by ruling of #311. Args are fixed here, so the raw
 * hook would also work; what the stable one buys is that a reactive reset —
 * an unsave from the open sheet, a re-auth — can never blank the list to
 * `LoadingFirstPage` + `[]` under the user's hands. The cost is that it also
 * holds `LoadingMore`, so a footer spinner keyed on `status` will not appear:
 * render the next page's arrival, not its wait.
 */
export function useSavedQuotes(initialNumItems = 12) {
  return useStablePaginatedQuery(api.dailyQuotes.listSaved, {}, { initialNumItems });
}
