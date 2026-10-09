/**
 * The steadiness-insight quality gate (#525, ADR 0019): pure, so every rule
 * is a test. An insight is shown only if it is grounded (two or more citable
 * sessions that touched what it names, kind-specific evidence, the score's
 * direction) and says something a template couldn't. A rejection's reason
 * goes back to the model, so it can try again with something real.
 */
import type { Domain } from "../lib/understandingVocab";

export const INSIGHT_KINDS = ["link", "helped", "then_now", "shape"] as const;
export type InsightKind = (typeof INSIGHT_KINDS)[number];
export const DIRECTIONS = ["lower", "higher", "none"] as const;

export type InsightDraft = {
  kind: InsightKind;
  /** One domain; a link names two, the one that slipped first leading. */
  domains: Domain[];
  text: string;
  citedSessionIds: string[];
  /** What the text says about the domain now against its usual. */
  direction: (typeof DIRECTIONS)[number];
};

/** A session this person may be shown a citation of: theirs, kept, still here. */
export type CitableSession = { id: string; at: number; domains: Domain[]; lighter: boolean };

export type GateEvidence = {
  sessions: Map<string, CitableSession>;
  /** Raw (ungated) steadiness and baseline per domain. */
  domains: Map<Domain, { steadiness: number; baseline: number }>;
};

const DAY = 86_400_000;
/** Then vs now, and a shape (a recurrence, not one bad week), span at least this. */
const SPAN_DAYS = 14;
const MIN_CHARS = 40;
const MAX_CHARS = 320;
const MIN_CONTENT_WORDS = 5;

// ponytail: word lists, not a classifier. Extend them when a bad insight slips through.
const SENSITIVE = /\b(trauma\w*|abus\w*|neglect\w*|addict\w*)\b/i;
const CLINICAL = /\b(diagnos\w*|disorders?|symptoms?|clinical\w*|ptsd|bipolar|depression|therap\w*)\b/i;
/** The machinery's words, never the person's. */
const INTERNAL = /\b(intensity|classifier|confidence|steadiness score|session ids?)\b/i;
const GENERIC = [
  /\bit'?s (okay|ok|normal|valid|understandable)\b/i,
  /\bbe (gentle|kind|patient) (with|to) yourself\b/i,
  /\bremember (to|that)\b/i,
  /\bself[- ]care\b/i,
  /\byou'?re not alone\b/i,
  /\bjourney\b/i,
  /\bit (seems|sounds|looks) like\b/i,
  /\bweighing on you\b/i,
  /\bon your mind\b/i,
  /\bprioriti[sz]\w*\b/i,
  /\bups and downs\b/i,
  /\bnavigat\w*\b/i,
  /\bresilien\w*\b/i,
  /\b(might|may) (want|be worth|help) to\b/i,
  /\btake (some )?time for\b/i,
];

/** Words a score-and-counts template is made of; an insight needs more than these. */
const TEMPLATE_WORDS = new Set(
  (
    "steadiness usual normal normally heavier lighter heavy light lower higher below above lately recently " +
    "session sessions came come comes up times more less than any other part parts life been has have had " +
    "is was are were your you the of in on at to it its and or this that where sitting week weeks last " +
    "day days lowest highest point points score right now under over for with most often much very what " +
    "there still about things into been being lot quite some " +
    "self purpose future work studies love friendship family belonging health rest money home"
  ).split(" "),
);

type Result = { ok: true } | { ok: false; reason: string };
const no = (reason: string): Result => ({ ok: false, reason });

export function gateInsight(draft: InsightDraft, evidence: GateEvidence): Result {
  const { kind, domains, text } = draft;
  const named = new Set(domains);
  if (kind === "link" ? named.size !== 2 || domains.length !== 2 : domains.length !== 1) {
    return no(kind === "link" ? "A link needs two domains." : `A ${kind} insight names one domain.`);
  }

  const ids = [...new Set(draft.citedSessionIds)];
  if (ids.length < 2) return no("Cite at least two different sessions.");
  const cited: CitableSession[] = [];
  for (const id of ids) {
    const session = evidence.sessions.get(id);
    if (!session) return no(`Session ${id} can't be cited (burned, gone, or not in the evidence).`);
    if (!session.domains.some((d) => named.has(d))) {
      return no(`Session ${id} doesn't touch ${domains.join(" or ")}.`);
    }
    cited.push(session);
  }
  const firstAt = (d: Domain) => Math.min(...cited.filter((s) => s.domains.includes(d)).map((s) => s.at));
  for (const d of domains) {
    if (firstAt(d) === Infinity) return no(`No cited session is about ${d}.`);
  }

  if (kind === "link" && firstAt(domains[0]) > firstAt(domains[1])) {
    return no(`Onset order: in these sessions ${domains[1]} came up first, so lead with it.`);
  }
  if (kind === "helped" && !cited.some((s) => s.lighter)) {
    return no("Nothing cited ended lighter, so it can't show what helped.");
  }
  if (kind === "shape" && cited.length < 3) return no("A recurring shape needs at least three cited sessions.");
  if (kind === "then_now" || kind === "shape") {
    const at = cited.map((s) => s.at);
    if (Math.max(...at) - Math.min(...at) < SPAN_DAYS * DAY) {
      return no(`Cited sessions must span at least ${SPAN_DAYS} days for this kind.`);
    }
  }

  for (const d of domains) {
    const now = evidence.domains.get(d);
    if (!now || draft.direction === "none") continue;
    const actual = now.steadiness < now.baseline ? "lower" : "higher";
    if (actual !== draft.direction) {
      return no(`Wrong direction: ${d} is ${actual} than its usual right now.`);
    }
  }

  return textCheck(text, domains, evidence);
}

function textCheck(text: string, domains: Domain[], evidence: GateEvidence): Result {
  const t = text.trim();
  if (t.length < MIN_CHARS) return no("Too short to tell them anything.");
  if (t.length > MAX_CHARS) return no(`Too long; keep it under ${MAX_CHARS} characters.`);
  if (SENSITIVE.test(t) || CLINICAL.test(t)) return no("Uses a sensitive or clinical word.");
  if (INTERNAL.test(t)) return no("Uses internal numbers or terms the person never sees.");
  if (GENERIC.some((re) => re.test(t))) return no("Generic phrasing; say what their sessions show.");

  const scores = new Set(
    domains.flatMap((d) => {
      const n = evidence.domains.get(d);
      return n ? [Math.round(n.steadiness), Math.round(n.baseline)] : [];
    }),
  );
  if ((t.match(/\d+/g) ?? []).some((n) => Number(n) >= 10 && scores.has(Number(n)))) {
    return no("Restates the score; the screen already shows it.");
  }

  const content = (t.toLowerCase().match(/[a-z']{3,}/g) ?? []).filter((w) => !TEMPLATE_WORDS.has(w));
  if (content.length < MIN_CONTENT_WORDS) {
    return no("A template could write this from the score and counts; say what their sessions show.");
  }
  return { ok: true };
}
