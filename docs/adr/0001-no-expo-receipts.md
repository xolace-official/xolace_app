# Stale push devices are reaped from the component's verdict, not from Expo receipts

Expo's documented way to learn that a token is dead is the push *receipt*: send,
keep the ticket id, fetch the receipt later, act on `DeviceNotRegistered`. Xolace
does not do this, and the code will look wrong to anyone who knows Expo. This
records why.

We cannot reach the tickets. `@convex-dev/expo-push-notifications@0.3.1` performs
the send inside its own internal action and reduces Expo's per-message ticket to
a boolean before persisting anything:

```js
// dist/component/internal.js — action_sendPushNotifications
const responseItem = responseBody.data[idx];
if (responseItem && responseItem.status === "ok")  → state "delivered"
else                                               → state "failed"
```

The ticket `id` and `details.error` are never stored and never returned;
`getNotification` exposes state only. Receipt processing therefore requires
owning the send, which means forking the component or bypassing its sender —
and the sender is the part carrying batching, retry, coordination, and the
100-message chunking we would otherwise write and maintain ourselves.

So we read the component's own verdict instead. A ticket error puts the
notification in `failed`, the component retries it five times, and then marks it
`unable_to_deliver`. `getNotificationsForUser({ userId: deviceId, limit })`
returns those states per recipient, and every recipient is a `push_devices`
document id. One `unable_to_deliver` means Expo rejected that token five
consecutive times, which is a stronger permanence signal than a single receipt,
arriving later and coarser: we learn *that* the token is dead, never *why*.

## Consequences

**We cannot distinguish `DeviceNotRegistered` from `InvalidCredentials`.** A
broken FCM key produces ticket errors for every Android message, so five retries
later we would delete every Android device row in the fleet. Accepted
deliberately: during such an outage those users already receive nothing, and the
row is recreated the next time each of them cold-starts the app or touches a
notification surface. Recovery is per-user and passive, not a single fix on our
side. The alternative — a `deadAt` marker and a second confirmation pass — buys
a faster recovery from an outage that is itself rare, and costs a schema field
and a second reap path forever.

**Reaping must never touch preferences.** Recreation depends on
`preferences.notifications.enabled` still being true when the client next runs
`registerToken` (`src/lib/use-notifications.ts:75` returns early otherwise). The
reaper goes through `deletePushDevice`, which drops the component recipient and
the registry row and nothing else — it leaves preferences alone, so a reaped
device comes back on the next cold start. It cannot reuse
`notifications.removeToken`: that is a public mutation behind `requireAuth`, and
the reaper runs from a cron with no identity. `removeToken` also retires the
legacy profile-keyed recipient once the last device goes, which is a
user-initiated opt-out, not something a delivery failure should trigger.

**Age is the second reaper, at 180 days on `lastRegisteredAt`.** The verdict only
fires for devices we actually send to; a rotation orphan that never receives
anything needs a clock. Both nudge families already cap at 30 days of inactivity
(`convex/jobs/notificationTriggers.ts:6`), so the only thing a long threshold can
cost is a chat notification to someone who has not opened the app in half a year.

**Revisit if upstream lands receipts.** The gap is tracked at
get-convex/expo-push-notifications; if the component starts persisting ticket ids,
the verdict rule becomes a fallback rather than the mechanism.
