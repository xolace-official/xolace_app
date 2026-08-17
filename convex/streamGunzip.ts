"use node";

import { v } from "convex/values";
import { gunzipSync } from "node:zlib";
import { internalAction } from "./_generated/server";

/**
 * Stream's prod webhook client gzips its payload, and Convex hands HTTP actions
 * the body exactly as it arrived — no transparent decoding. The default runtime
 * has no `DecompressionStream`, so the one gunzip in this codebase lives here,
 * in Node, and is called only when `content-encoding: gzip` is actually set.
 */
export const gunzip = internalAction({
  args: { body: v.bytes() },
  returns: v.string(),
  handler: async (_ctx, args) =>
    gunzipSync(Buffer.from(args.body)).toString("utf8"),
});
