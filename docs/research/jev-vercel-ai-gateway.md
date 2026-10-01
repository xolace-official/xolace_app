# Jev through Vercel AI Gateway, called from a Convex action

**Status:** Research only, for #476 (part of #475). Nothing decided, no code changed. Written 2026-10-01.
**Builds on:** `docs/research/typesafe-jev-ai-pipeline-analysis.md` §1 (TypeSafe's native `POST /v1/systemone` contract) and §2 (TypeSafe's own privacy terms). Neither is repeated here.
**Method:** Vercel AI Gateway docs and changelog, ai-sdk.dev, TypeSafe docs, the published npm tarballs, and the gateway's public, unauthenticated model catalog (`GET /v1/models`). No API key was used and no evaluation call was made.

Each claim is tagged:
- **[doc]** stated by a primary source, with a link;
- **[src]** read from a published package or this repo's `node_modules` (path given);
- **[catalog]** read from the live, public gateway catalog on 2026-10-01 (a point-in-time snapshot);
- **[unknown]** not established by any primary source.

---

## 0. TL;DR

1. **Model id is `typesafe-ai/jev`, with no versioned variant on the gateway.** Every gateway doc and the live catalog list only `typesafe-ai/jev`. Nothing documents pinning `jev-1.13.0` through the gateway. This contradicts TypeSafe's own advice to pin the versioned id (analysis §1.1).
2. **There are three request paths, and they use different field names.** (a) AI SDK `experimental_evaluate` (`boolean` / `probability`, camelCase usage). (b) Gateway HTTP `POST /v1/evaluate`, same shape as (a). (c) The TypeSafe-compatible `POST /typesafe/v1/systemone`, which keeps TypeSafe's native shape (`noul`, snake_case usage) and adds gateway cost metadata.
3. **A raw `fetch` to (b) or (c) needs no new package and runs in Convex's default V8 runtime.** The AI SDK path needs `ai >= 7.0.105`. The repo already has `ai@7.0.85` through `@convex-dev/rag`, which is too old, and it has no `experimental_evaluate`. From reading package source, the AI SDK path should bundle for V8, but nobody has tried it.
4. **Auth has to be an AI Gateway API key in a Convex env var (`AI_GATEWAY_API_KEY`).** OIDC tokens are issued to Vercel deployments only. Convex isn't one, and in a V8 bundle the OIDC helper returns an empty string.
5. **No gateway markup:** $0.042 per M input tokens, $0 output, the same as TypeSafe direct. Paid tier: no gateway rate limits, but provider limits still apply. The AI SDK retries 2 times by default. The gateway also retries across a model's other providers.
6. **Data handling.** Vercel says the gateway does not retain or log prompts or responses, and stores only metadata, which it keeps 30 days. Per-request ZDR (`zeroDataRetention: true`) is free on Pro and Enterprise, and TypeSafe AI is on Vercel's ZDR-provider list. **But the live catalog shows a conflict:** it lists Jev with `zdr: "none"` and only one endpoint, **DigitalOcean**, with `has_zdr: false`. A ZDR-required Jev request may therefore fail with `no_providers_available`, and without `only: ["typesafe-ai"]` the request may be served by DigitalOcean, which is a different subprocessor. Jev has no `regions` entry, so it can't be pinned to `us` or `eu`. The gateway itself can terminate the request in any Vercel region.

---

## 1. Model id and version pinning

| Claim | Tag |
|---|---|
| The gateway model id is `typesafe-ai/jev` on all three paths | [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe), [evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation), [changelog](https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev) |
| The catalog lists only `typesafe-ai/jev` (`type: "evaluation"`, `context_window: 32000`, `max_tokens: 0`). No `jev-1.13.0` or other versioned id appears | [catalog] `GET https://ai-gateway.vercel.sh/v1/models` |
| The Vercel KB guide uses only `typesafe-ai/jev` and says nothing about versions | [doc] [KB guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk) |
| Whether `model: "jev-1.13.0"` (or `typesafe-ai/jev-1.13.0`) sent to `/typesafe/v1/systemone` is accepted, rejected, or silently mapped to `typesafe-ai/jev` | **[unknown]**. Not documented. Finding out needs one keyed test call, which this pass did not make |
| Which TypeSafe version `typesafe-ai/jev` resolves to (alias of `jev-latest`?) | **[unknown]**. The response's `routing.canonicalSlug` is `typesafe-ai/jev`, which says nothing about the version ([typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)) |
| Calling TypeSafe *directly* with the AI SDK provider `@ai-sdk/typesafe-ai` takes `jev-latest` "or specific versions" | [doc] [ai-sdk typesafe provider](https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai). That route skips the gateway entirely |

**Implication:** through the gateway, the model can change underneath us whenever TypeSafe ships a new version. If a shadow eval is calibrated against one version, it needs version pinning, which today means going direct to TypeSafe.

## 2. Request and response shapes

### 2.1 Path A: AI SDK `experimental_evaluate`

```ts
import { experimental_evaluate as evaluate } from 'ai';
const result = await evaluate({
  model: 'typesafe-ai/jev',            // gateway string, reads AI_GATEWAY_API_KEY
  state: '...',                         // string | object | array
  questions: {
    crisis: { type: 'boolean', instructions: '...', criteria: { true: '...', false: '...' } },
    route:  { type: 'choice', instructions: '...', criteria: { a: '...', b: '...' } },
    level:  { type: 'score',  instructions: '...', criteria: ['low', 'medium', 'high'] },
  },
  providerOptions: { gateway: { zeroDataRetention: true, only: ['typesafe-ai'] } },
  maxRetries: 2,                        // default
});
// result.answers.crisis -> { type: 'boolean', probability: 0.98 }
// result.answers.route  -> { type: 'choice', choice: 'a', probabilities: { a: 1, b: 0 } }
// result.answers.level  -> { type: 'score', score: 2.97, probabilities: { '0': 0, '1': 0.02, '2': 0.98 } }
```

Sources: [doc] [gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation), [ai-sdk evaluation](https://ai-sdk.dev/docs/ai-sdk-core/evaluation).

- The result also carries `usage` (may be `undefined`), `warnings`, `providerMetadata`, `response` and `rounding`. Options: `abortSignal`, `headers`, `maxRetries` (default 2). [doc] [ai-sdk evaluation](https://ai-sdk.dev/docs/ai-sdk-core/evaluation)
- Errors thrown: `Experimental_EvaluationUnsupportedQuestionTypeError`, `InvalidArgumentError`, `InvalidResponseDataError`, `NoSuchProviderError`, `NoSuchModelError`, `UnsupportedModelVersionError`. [doc] same page
- Equivalent provider-instance form: `gateway.evaluationModel('typesafe-ai/jev')` from `@ai-sdk/gateway`. [doc] [gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation)
- Requires `ai` 7.0.105 or later. [doc] [KB guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk), [Jev launch changelog](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway)
- Internally, the gateway provider calls `https://ai-gateway.vercel.sh/v4/ai...`, not `/v1/evaluate`. [src] `@ai-sdk/gateway@4.0.103/dist/index.js`
- **Confidence:** when TypeSafe is called *directly*, the per-question `confidence` is exposed under `result.providerMetadata.typesafe.confidence`, for Choice and Score only ([ai-sdk typesafe provider](https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai)). The KB guide says the same for the gateway path ([KB guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk)). The `answers` object itself has no `confidence`.

### 2.2 Path B: gateway HTTP `POST https://ai-gateway.vercel.sh/v1/evaluate`

The request body uses the same `model` / `state` / `questions` / `providerOptions` fields as path A. The response looks like this:

```json
{
  "model": "typesafe-ai/jev",
  "answers": { "refund": { "type": "boolean", "probability": 0.98 } },
  "usage": { "inputTokens": 275, "outputTokens": 20 },
  "providerMetadata": { "gateway": { "routing": { "finalProvider": "typesafe-ai", "...": "..." },
    "cost": "0.00001155", "marketCost": "0.00001155", "surchargeCost": "0", "gatewayCost": "0.00001155", "generationId": "gen_..." } }
}
```

[doc] [gateway evaluation, HTTP API](https://vercel.com/docs/ai-gateway/modalities/evaluation#http-api). Whether this response carries Choice/Score `confidence`, and where, is **[unknown]**. The documented example only shows a boolean.

### 2.3 Path C: TypeSafe-compatible `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`

The gateway "implements the TypeSafe request and response shapes": `type: 'noul'`, the answer `{ type: 'noul', noul: 0.98 }`, and usage `{ input_tokens, output_tokens }`. It adds `provider_metadata.gateway` (routing and cost) in snake_case. It also serves `GET /typesafe/v1/models`. Gateway extensions (`providerOptions`) can be added to the body. The official `@typesafe-ai/sdk` forwards them at runtime but doesn't type them. [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)

Vercel recommends path B or A over C for new code ("the same capability without TypeSafe-specific naming"). [doc] same page

### 2.4 Differences from native `api.typesafe.ai/v1/systemone`

| Aspect | Native TypeSafe ([api](https://docs.typesafe.ai/api.md)) | Path C (`/typesafe/v1/systemone`) | Paths A / B (`evaluate`) |
|---|---|---|---|
| Boolean type name | `noul` | `noul` | `boolean` |
| Boolean answer field | `noul` | `noul` | `probability` |
| Choice / Score request | `criteria` map / `criteria` array | same | same |
| Score answer | `score`, `legend`, `probabilities`, `confidence` | "TypeSafe shape" ([doc](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)); `legend`/`confidence` presence not shown in an example | `score`, `probabilities` in the answer; `confidence` in provider metadata (A). `legend` not shown |
| Choice answer | `choice`, `probabilities`, `confidence` | TypeSafe shape | `choice`, `probabilities`; `confidence` in provider metadata (A) |
| Usage | `input_tokens`, `output_tokens` | same | `inputTokens`, `outputTokens` |
| Model id | `jev-1.13.0` / `jev-latest` | `typesafe-ai/jev` | `typesafe-ai/jev` |
| Extra | none | `provider_metadata.gateway` (cost, routing, `generationId`) | `providerMetadata.gateway` |
| Error body | 401 / 422 / 429 / 529 | `{ "message", "error_type" }`; provider errors "passed through unchanged" | AI SDK error classes (A), or the gateway error shape (B) |

Precision: "TypeSafe returns scores and probabilities rounded to two decimal places." [doc] [ai-sdk typesafe provider](https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai)

**Evaluation fallbacks (gateway-only extension):** `providerOptions.gateway.models: [{ model, when: { question, confidenceBelow } }]` reruns an uncertain answer on another model. Both stages are billed and their latencies add up. If an LLM produced the final answer, `confidence: 0` and `probabilities: {}` mean "unavailable". [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe), [evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation). For crisis lanes this would silently route text to a second processor, so we should not configure it there.

## 3. Convex default V8 runtime and packages

| Claim | Tag |
|---|---|
| `fetch` works in Convex's default runtime without `"use node"` | [doc] repo rule `.claude/rules/convex_rules.md` ("`fetch()` is available in the default Convex runtime") |
| Convex bundles default-runtime (isolate) functions with esbuild `platform: "browser"`, so package `exports` resolve with the `browser` condition | [src] `node_modules/convex/dist/esm/bundler/index.js` (lines ~154, 208, 238) |
| **Paths B and C over raw `fetch`: no new dependency.** Plain JSON over HTTPS with a Bearer header | [doc] cURL examples on [evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation) and [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) |
| `ai@7.0.127` (latest) and `@ai-sdk/gateway@4.0.103` declare `engines: node >=22`. That field is metadata only and Convex's bundler doesn't enforce it | [src] npm registry metadata |
| `ai` reaches Node built-ins (`node:async_hooks`, `node:diagnostics_channel`) only through a guarded `process.getBuiltinModule?.()` that returns `undefined` when absent. It has no static Node imports | [src] `ai@7.0.127/dist/index.js` (`loadBuiltinModule`, ~line 4228) |
| `@ai-sdk/gateway` statically imports `@vercel/oidc`. That package's `browser` export (`index-browser.js`) has no `fs`/`os`/`path` and returns `""` for the OIDC token. Its Node export does `require("fs")` | [src] `@vercel/oidc@3.2.0/package.json` exports, `dist/index-browser.js` |
| **So the AI SDK path should bundle and run in V8 with an API key.** | Inference from [src]. **[unknown] until verified** by `npx convex dev --once` with a test action |
| The repo already resolves `ai@7.0.85` (a peer of `@convex-dev/rag@0.7.6`, which needs `ai ^7.0.0`) and `@ai-sdk/gateway@4.0.69`. **Neither exports `experimental_evaluate` / `evaluationModel`** (0 matches in their `.d.ts`). Path A needs `ai` bumped to ≥ 7.0.105 (latest 7.0.127) and added as a direct dependency | [src] `bun.lock`, `node_modules/ai/dist/index.d.ts` |
| `@ai-sdk/openai@3.0.80` (used in `convex/rag.ts` for embeddings) is on the v6 provider line (`@ai-sdk/provider@3.0.13`). `ai@7` uses `@ai-sdk/provider@4`. That mismatch already exists today and Jev doesn't change it. Bumping `ai` should be done together with a check that `@convex-dev/rag` embeddings still work | [src] `bun.lock`, npm registry. Compatibility of the mix: **[unknown]** |
| `@typesafe-ai/sdk@0.6.0` (for path C): `engines: node >=20`, uses `globalThis.fetch`, no Node built-in imports in `dist/index.mjs`, built-in retry with `maxRetries: 2` that retries on 408/429/5xx | [src] npm tarball. V8 behavior **[unknown]** until tried |
| `zod` is a peer of `ai` / `@ai-sdk/*` (`^3.25.76 \|\| ^4.1.8`) | [src] npm registry |

**Lowest-dependency shape:** a raw `fetch` to `/v1/evaluate` (path B) inside an `internalAction` under `convex/ai/`, with no `"use node"`. That keeps the AI SDK upgrade out of scope.

## 4. Auth and the Convex env var

| Claim | Tag |
|---|---|
| Every request needs `Authorization: Bearer <AI Gateway API key or Vercel OIDC token>` | [doc] [auth](https://vercel.com/docs/ai-gateway/authentication-and-byok), [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) |
| API keys "work anywhere … external servers", "never expire unless you revoke them", and are deactivated when the team member who created them leaves | [doc] [auth](https://vercel.com/docs/ai-gateway/authentication-and-byok) |
| OIDC: "Vercel deployments receive an OIDC token as `VERCEL_OIDC_TOKEN`". Convex is not a Vercel deployment, so **OIDC does not apply** | [doc] [auth](https://vercel.com/docs/ai-gateway/authentication-and-byok), [FAQ](https://vercel.com/docs/ai-gateway/faq#does-ai-gateway-only-work-on-vercel) |
| The AI SDK reads `AI_GATEWAY_API_KEY` from the environment automatically | [doc] [auth](https://vercel.com/docs/ai-gateway/authentication-and-byok); [src] `@ai-sdk/gateway` `environmentVariableName: "AI_GATEWAY_API_KEY"` |
| Set it with `npx convex env set AI_GATEWAY_API_KEY <key>` (per deployment: dev and prod separately) and read it as `process.env.AI_GATEWAY_API_KEY` | [doc] Convex env vars (existing repo practice; see the `convex-env` skill). Not a gateway-specific claim |
| Per-key spend caps exist (budgets; a `402` with `quota_for_entity_exceeded` when one is hit) | [doc] [rate limits](https://vercel.com/docs/ai-gateway/rate-limits), [FAQ](https://vercel.com/docs/ai-gateway/faq) |
| BYOK: a TypeSafe key can be added so TypeSafe bills directly. ZDR skips BYOK keys unless a key is marked ZDR | [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe), [ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr#byok) |

## 5. Pricing, rate limits, errors, retries

| Claim | Tag |
|---|---|
| "AI Gateway charges no markup and no platform fee on tokens," including BYOK | [doc] [pricing](https://vercel.com/docs/ai-gateway/pricing), [FAQ](https://vercel.com/docs/ai-gateway/faq#does-ai-gateway-mark-up-token-prices) |
| Jev: `input: 0.000000042` ($0.042/M), `output: 0`. Matches TypeSafe direct (analysis §1.1). The example response shows `surchargeCost: "0"` | [catalog]; [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) |
| Add-ons that cost extra: team-wide ZDR at $0.10 per 1k requests (per-request ZDR is free); team-wide provider allowlist at $0.10 per 1k (per-request `only` is free); trace drains | [doc] [pricing](https://vercel.com/docs/ai-gateway/pricing) |
| ZDR (either form) needs a **Pro or Enterprise** plan | [doc] [ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr) |
| Paid tier: "AI Gateway does not rate limit paid-tier requests". Provider limits still apply. Free tier: lower per-model limits, and only a subset of models | [doc] [rate limits](https://vercel.com/docs/ai-gateway/rate-limits) |
| Whether Jev is on the free tier | **[unknown]** (not checked against `?freeTier=true`) |
| TypeSafe's own limits (250k tok/s, 1,200 req/min, "adjusting dynamically") presumably apply to the gateway's shared upstream credential, but the gateway doesn't document this | **[unknown]** |
| 429 body: `{ "error": { "message": "Rate limit exceeded", "type": "rate_limit_exceeded" } }`, sometimes with `retry-after`. A provider's 429 "can carry that provider's own error body" | [doc] [rate limits](https://vercel.com/docs/ai-gateway/rate-limits) |
| Error table: 401 (bad key), 402 (no credits / budget hit), 403 (verification, free-tier model, allowlist), 429 | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#why-did-my-ai-gateway-request-fail) |
| Path C errors: `{ "message", "error_type" }` (e.g. `invalid_request`); provider errors pass through unchanged, so TypeSafe's 422 / 529 should reach the caller | [doc] [typesafe page](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) |
| ZDR with no eligible provider: HTTP 400, `type: "no_providers_available"`. A region that can't be honored: HTTP 400 `invalid_request_error` | [doc] [ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr), [regional inference](https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference) |
| Retries: the AI SDK retries with exponential backoff, `maxRetries` defaults to 2. For raw HTTP, honor `retry-after`, otherwise back off exponentially and keep retries bounded | [doc] [rate limits](https://vercel.com/docs/ai-gateway/rate-limits) |
| Server-side: "AI Gateway retries a failed request across the model's other eligible providers." For Jev that may mean failing over between TypeSafe and DigitalOcean (see §6) | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#what-happens-when-a-provider-has-an-outage) |
| Latency overhead: published per provider at `GET /v1/models/{creator}/{model}/endpoints` (`latency_last_1h`). For Jev it is `null` today | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#how-much-latency-does-ai-gateway-add); [catalog] |

## 6. Data handling, ZDR and region

| Claim | Tag |
|---|---|
| "AI Gateway itself does not retain prompt or response content: it is deleted once the request completes." "Vercel does not train on your prompts." | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#does-vercel-train-on-my-prompts-or-store-my-data), [ZDR § Vercel](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr#vercel) |
| "AI Gateway does not log the prompts or responses." It records **metadata**: status, model, provider, token usage, cost, duration, auth method and routing attempts. Routing-attempt detail is kept 30 days in Logs | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#what-does-ai-gateway-log-about-my-requests) |
| "Vercel's own retention policy does not constrain providers." Use ZDR, no-training, allowlists and regional inference to cover the whole path | [doc] [FAQ](https://vercel.com/docs/ai-gateway/faq#does-vercel-train-on-my-prompts-or-store-my-data) |
| Per-request ZDR: `providerOptions.gateway.zeroDataRetention: true` routes only to providers with a ZDR agreement with Vercel. It also applies to fallbacks. Team-wide ZDR is a dashboard toggle (and the two are ORed together) | [doc] [ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr) |
| **TypeSafe AI is listed as a ZDR and no-training provider**, under this policy text: "TypeSafe shall not retain (a) prompts that are Customer Data for any longer than is necessary to generate Output … and (b) Output for any longer than necessary to … fulfil its obligations … under the Agreement." That is Vercel's negotiated term, a **provider-level ZDR pass-through** that the direct TypeSafe route only offers to enterprise customers through sales | [doc] [ZDR providers table](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr#zdr-providers-and-policies) |
| The Jev launch changelog: "Jev supports Zero Data Retention and No Training … configurable per request" | [doc] [changelog](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway) |
| **Conflict.** The live catalog lists `typesafe-ai/jev` with `"zdr": "none"`, `"no_training": "all"`, and **one endpoint: `digitalocean`**, with `has_zdr: false` and `has_no_training: true`. No `typesafe-ai` endpoint is listed. The gateway's own docs example shows `finalProvider: "typesafe-ai"`, and the ZDR table lists DigitalOcean as a ZDR provider in general | [catalog] `GET /v1/models`, `GET /v1/models/typesafe-ai/jev/endpoints` (2026-10-01) |
| What a `zeroDataRetention: true` Jev request returns today: success via TypeSafe, or 400 `no_providers_available` | **[unknown]**. Needs one keyed call. If it 400s, then ZDR for Jev is documented but not yet live |
| Whether DigitalOcean's Jev endpoint runs TypeSafe's weights on DigitalOcean infrastructure (so DigitalOcean becomes a processor) and under what retention terms | **[unknown]**. Pinning with `providerOptions.gateway.only: ["typesafe-ai"]` (free, per request) keeps traffic off it; the field is [doc] [evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation#provider-options) |
| Regional inference: `inferenceRegion: { scope: 'zone', geoRegion: 'us' \| 'eu' }`. "A model with no `regions` field doesn't support regional routing." **Jev has no `regions` field**, so its inference location can't be pinned. The default `global` "can resolve to a different region on each request" | [doc] [regional inference](https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference); [catalog] |
| Gateway hop: "your request can terminate and be processed in any Vercel region before AI Gateway forwards it to the provider". Single-region gateway hosts are "coming" | [doc] [regional inference](https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference) |
| Provider abuse and safety review retains flagged requests under the provider's own policy, regardless of ZDR or region | [doc] [regional inference § where your data goes](https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference#where-your-data-goes) |
| Health or special-category data, HIPAA or a BAA, or a Vercel DPA covering AI Gateway | **[unknown]**. None of the AI Gateway pages above mention it. Not researched beyond them |
| TypeSafe's own docs say nothing about Vercel, AI Gateway or DigitalOcean | [doc] [docs.typesafe.ai/llms.txt](https://docs.typesafe.ai/llms.txt) index, 2026-10-01 |

**Privacy read for the clearance task.** The gateway route appears to solve the gap the analysis found in §2: per-request ZDR without an enterprise sales contract, under a TypeSafe retention clause negotiated by Vercel. It also adds Vercel as a processor, though the content itself isn't retained. Three things have to be confirmed before any traffic, shadow included:
1. A keyed request with `zeroDataRetention: true` and `only: ["typesafe-ai"]` succeeds, and `providerMetadata.gateway.routing.finalProvider` is `typesafe-ai`.
2. Vercel's DPA covers AI Gateway with health-adjacent data.
3. We accept that inference may not run in the user's region (no `regions` for Jev).

Every request should send `zeroDataRetention: true` and `only: ["typesafe-ai"]` explicitly, rather than relying on the team-wide toggle, so the guarantee is visible in code.

## 7. Open questions (need a key or a human)

1. Does `jev-1.13.0` resolve through path C? What TypeSafe version does `typesafe-ai/jev` serve today?
2. Does a ZDR plus `only: ["typesafe-ai"]` request succeed right now, given the catalog lists only a non-ZDR DigitalOcean endpoint?
3. Does `experimental_evaluate` with `ai@>=7.0.105` actually deploy and run in a Convex V8 action? Does bumping `ai` break `@convex-dev/rag` with `@ai-sdk/openai@3.0.80`?
4. Is `confidence` returned on path B (`/v1/evaluate`), and is `legend` returned on path C?
5. What is the latency from Convex's region to the gateway to TypeSafe? The catalog's `latency_last_1h` for Jev is `null`.
6. Vercel DPA and subprocessor coverage of AI Gateway for health-adjacent text.
