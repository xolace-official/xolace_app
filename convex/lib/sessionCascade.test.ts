import { describe, expect, it } from "bun:test";
import schema from "../schema";
import { SESSION_CASCADE_TABLES, SESSION_ID_EXEMPT } from "./sessionCascade";

/**
 * The guard that makes lib/sessionCascade the single owner of the session
 * reference graph: every table carrying a `sessionId` must be either purged
 * by purgeSessions or explicitly exempted with a reason.
 *
 * This is the test that would have caught `follow_up_cards` — added to the
 * schema, wired into dataWipe and accountDeletion, silently forgotten by
 * dataRetention, leaving orphan cards pointing at deleted sessions.
 */
function tablesWithSessionId(): string[] {
  const found: string[] = [];
  for (const [name, table] of Object.entries(schema.tables)) {
    // validator.fields is the object validator's field map for a defineTable.
    const fields = (table as any).validator?.fields;
    if (fields && "sessionId" in fields) found.push(name);
  }
  return found.sort();
}

describe("session cascade reference graph", () => {
  it("classifies every table that references a session", () => {
    const classified = [
      ...SESSION_CASCADE_TABLES,
      ...Object.keys(SESSION_ID_EXEMPT),
    ].sort();

    expect(tablesWithSessionId()).toEqual(classified);
  });

  it("finds a non-trivial set (guards against a broken schema walk)", () => {
    // If introspection silently returns [], the assertion above would pass
    // only when both lists are empty — which they never are.
    expect(tablesWithSessionId().length).toBeGreaterThanOrEqual(5);
  });

  it("never both purges and exempts the same table", () => {
    for (const table of SESSION_CASCADE_TABLES) {
      expect(Object.keys(SESSION_ID_EXEMPT)).not.toContain(table);
    }
  });
});
