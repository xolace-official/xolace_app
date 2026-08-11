import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Shared push notification component instance.
 *
 * Recipients are `push_devices` document ids — one per installation — so a
 * second device does not replace the first. Typed as `string` rather than
 * `Id<"push_devices">` because pre-migration recipients are keyed by profile
 * id and stay valid until every client has re-registered; `string` is what the
 * component validates on the wire either way.
 */
export const pushNotifications = new PushNotifications<string>(
  components.pushNotifications,
);

type Notification = Parameters<
  typeof pushNotifications.sendPushNotification
>[1]["notification"];

/**
 * Bound on every per-profile device read. Nobody has more than a handful of
 * installations; the cap exists to keep the read bounded, and reads take the
 * most recently registered first so rotation orphans can never crowd out the
 * live device.
 *
 * ponytail: a profile that somehow exceeds this keeps a few inert component
 * recipients after deletion — nothing addresses them once the device rows are
 * gone. Batch-and-reschedule if that ever stops being implausible.
 */
export const MAX_DEVICES_PER_PROFILE = 50;

/**
 * Drop one installation: its component recipient first, then the registry row.
 *
 * Shared by registration, removal, and account deletion — the pair has to move
 * together, and three copies is how one of them gets forgotten.
 */
export async function deletePushDevice(
  ctx: MutationCtx,
  deviceId: Id<"push_devices">,
): Promise<void> {
  await pushNotifications.removeToken(ctx, { userId: deviceId });
  await ctx.db.delete(deviceId);
}

/** Every installation for a profile, most recently registered first. */
export async function profilePushDevices(
  ctx: MutationCtx,
  emotionalProfileId: Id<"emotional_profiles">,
) {
  return await ctx.db
    .query("push_devices")
    .withIndex("by_profile", (q) =>
      q.eq("emotionalProfileId", emotionalProfileId),
    )
    .order("desc")
    .take(MAX_DEVICES_PER_PROFILE);
}

/**
 * Send one logical notification to every installation a profile has registered.
 *
 * Target resolution only — rate limiting and `notification_log` stay per
 * logical notification and happen before this is called, so one nudge remains
 * one rate-limit event and one log row regardless of device count.
 */
export async function sendPushToProfile(
  ctx: MutationCtx,
  args: {
    emotionalProfileId: Id<"emotional_profiles">;
    notification: Notification;
  },
): Promise<void> {
  const devices = await profilePushDevices(ctx, args.emotionalProfileId);

  // DEPRECATED(remove-after: app >= 1.9.0): profile-keyed fallback. A user who
  // has not relaunched since this deploy still has their token under the
  // profile-keyed recipient, and the nudge meant to bring them back is exactly
  // the one that must still reach them. Any registration retires that
  // recipient, so remove this once the supported version floor has passed.
  if (devices.length === 0) {
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.emotionalProfileId,
      notification: args.notification,
      // The recipient may have preferences on and no token at all — never
      // opened the app on a physical device.
      allowUnregisteredTokens: true,
    });
    return;
  }

  await pushNotifications.sendPushNotificationBatch(ctx, {
    notifications: devices.map((device) => ({
      userId: device._id,
      notification: args.notification,
    })),
    allowUnregisteredTokens: true,
  });
}
