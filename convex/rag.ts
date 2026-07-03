import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";

// =============================================================
// XOLACE — SHARED RAG INSTANCE
// =============================================================
//
// Single source of truth for semantic search, mirroring the
// convex/posthog.ts shared-instance pattern. Import `rag` from
// here anywhere you need to index or query embeddings.
//
// Embeddings use OpenAI text-embedding-3-small (1536 dims).
// Anthropic (our text provider) has no embeddings API, so a
// separate provider is required. OPENAI_API_KEY is read from
// the Convex deployment env automatically.
//
// Namespaces isolate content:
// - Personal emotional memory  → namespace = emotionalProfileId
//   (each user's own mirror history, never cross-user)
// - Peer reflection pool        → namespace = REFLECTION_POOL_NAMESPACE
//   (shared, anonymized; filter on status to drop flagged/removed)
//
// filterNames declares which metadata fields can be filtered at
// query time. They must be declared here up front — filtering on
// an undeclared name throws.
// =============================================================

export const REFLECTION_POOL_NAMESPACE = "reflection-pool";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
  filterNames: ["primaryEmotion", "granularLabel", "status"],
});
