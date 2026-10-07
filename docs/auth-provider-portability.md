# Auth provider portability

**Status:** plan, not implemented. **Goal:** make it possible to swap auth providers (Clerk → WorkOS or anything else) later without users losing their accounts, and without breaking app versions already in the stores. We stay on Clerk for now.

## Why we can't swap providers today

`requireAuth` (`convex/lib/auth.ts`) finds the user by `users.tokenIdentifier`, which is `"{issuer}|{subject}"` from the Clerk JWT. A token from any other provider has a different issuer and subject, so:

1. On the user's first sign-in with the new provider, `users.getOrCreate` finds no match and **creates a brand-new user with an empty emotional profile**. Their history is still in the database, just unreachable.
2. Email-based matching (what the WorkOS migration guide relies on) is not available to us: `users` stores no email by design (privacy-first schema).
3. The user lookup is copied in three places: `convex/lib/auth.ts` (`requireAuth`), `convex/users.ts` (`getOrCreate`), and `convex/dailyQuotes.ts` (`getMyProfile`).

The fix is to separate "who signed in" (an identity) from "which user that is". A user can then have more than one identity, and adding a provider becomes a data change, not a code change.

## Plan

### Phase 1: identity table and a single lookup (backend only, invisible to users)

**Schema:** add a new table. Adding tables is always safe.

```ts
auth_identities: defineTable({
  userId: v.id("users"),
  // "{issuer}|{subject}" exactly as ctx.auth.getUserIdentity() reports it.
  tokenIdentifier: v.string(),
})
  .index("by_token_identifier", ["tokenIdentifier"])
  .index("by_user", ["userId"]),
```

**Lookup helper** in `convex/lib/auth.ts`, so every caller resolves users the same way:

```ts
export async function findUserByIdentity(ctx: QueryCtx | MutationCtx, tokenIdentifier: string) {
  const link = await ctx.db
    .query("auth_identities")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
  if (link) return await ctx.db.get("users", link.userId);
  // Fallback for users created before auth_identities existed.
  // Remove after backfillAuthIdentities has run on prod (Phase 2).
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}
```

**Call sites:**
- `requireAuth`, `getOrCreate`, and `dailyQuotes.getMyProfile` call `findUserByIdentity` instead of querying `users.by_token`.
- `getOrCreate` inserts an `auth_identities` row when it creates a user. Linking must be idempotent: check for an existing row first, because a duplicate makes `.unique()` throw and locks the user out.
- `finalizePurge` (`convex/jobs/accountDeletionFinalize.ts`) deletes the user's `auth_identities` rows (`by_user`) before deleting the user row. Account deletion must leave nothing behind.

`users.tokenIdentifier` and `authProviderAccountId` stay as they are. Schema must match existing data, and old clients don't care. Their comments should say they record the *original* sign-in identity, not what lookups use.

### Phase 2: backfill existing users

Add a `migrations.define` on `users` in `convex/migrations.ts` that inserts an `auth_identities` row for each user's `tokenIdentifier` if one is missing. It must be idempotent and safe to re-run.

```sh
bunx convex run migrations:run '{"fn": "migrations:backfillAuthIdentities"}'
```

Verify that the number of `auth_identities` rows matches the number of `users` rows. Then, in a later deploy, remove the `users.by_token` fallback from `findUserByIdentity`.

### Phase 3: only when we actually migrate (not now)

1. **Accept both providers.** List the new provider in `convex/auth.config.ts` next to Clerk. WorkOS AuthKit tokens use the `customJwt` provider type. Clerk must stay listed until the store-published minimum app version no longer signs in with Clerk (store-gap rule; see Deferred Deprecations in CLAUDE.md).
2. **Import users and link them.** Export users from Clerk, create them in the new provider, and for each one insert an `auth_identities` row: new `tokenIdentifier` → existing `userId`. This must run server-side from the import output (an internal mutation run from the CLI). Never accept a mapping from the client: that would let anyone claim another user's account.
3. **Ship a client update** that signs in with the new provider. Users who update sign in once and land on their existing account.
4. **Retire Clerk** once the version floor allows it. Then delete the Clerk-specific client code (`AuthSyncGuard`, `use-resilient-clerk-auth`, `clerk-online-polyfill`, `instrumented-token-cache`), the Clerk provider entry, and Clerk references like `admin:promoteXolacer`'s `clerkUserId` argument.

## Tests (write before the code)

Write these in `convex/test/authIdentities.test.ts` using the existing `harness.helpers.ts`, one per failure mode:

| # | Failure mode | Test |
|---|---|---|
| 1 | An existing user with no identity row is locked out or duplicated | Delete the user's link row; `getOrCreate` and `requireAuth` still resolve the same `userId` (fallback) |
| 2 | A new user is created without an identity row | After `asNewUser`, exactly one `auth_identities` row points at the user |
| 3 | A second provider's identity doesn't resolve to the same user (the property the migration depends on) | Insert a link for a WorkOS-shaped identity, then `getOrCreate` under that identity returns the existing `userId` and creates no new user |
| 4 | Linking twice creates duplicates and `.unique()` throws | Call `getOrCreate` twice and check there is still one row |
| 5 | Purge leaves identity rows behind | After `purgeUser` finalizes, there are no `auth_identities` rows for that `userId` |

## Things to verify before Phase 3 (not needed for Phases 1–2)

- **Native sign-in.** Today we use Clerk's native Google (`@clerk/expo/google`) and Apple (`@clerk/expo/apple`) flows. Check whether the new provider has a native React Native SDK or only a browser-redirect login.
- **Apple users.** Apple's `sub` is scoped per developer team. The new provider must use the same Apple team and Services ID, or Apple users won't match their existing accounts.
- **Token refresh.** Without Clerk's SDK, we own refresh-token storage and refreshing in the app, which is the same class of code behind the cold-start logout bugs in `docs/bug-log.md`.
- **Session lifetime.** Check the new provider's maximum session length. The 7-day Clerk logout (bug log, 2026-10-06) came from a setting like this.

## Effort

Phases 1–2: a small backend PR (one table, one helper, three call sites, one purge line, one migration, five tests) with no client change and no store release. Phase 3 is the real migration and only happens if we decide to switch.
