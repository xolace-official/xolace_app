<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Xolace Expo app. PostHog is initialized via `src/config/posthog.ts` using `expo-constants` to read credentials from `app.config.ts` extras (sourced from `.env`). The `PostHogProvider` was added to `src/providers/root-provider.tsx`, wrapping the app. Manual screen tracking was added to `src/app/_layout.tsx` using `usePathname`. User identification fires on successful Apple/Google sign-in. The full reflection loop — from submission through mirror confirmation, path selection, and session completion — is now instrumented with rich event properties.

| Event | Description | File |
|-------|-------------|------|
| `onboarding_completed` | User taps "That makes sense" completing the onboarding frame | `src/components/onboarding/screens/FrameScreen.tsx` |
| `user_signed_in` | Successful Apple or Google OAuth sign-in; triggers `posthog.identify()` with the Convex user ID | `src/components/auth/screens/AuthScreen.tsx` |
| `reflection_submitted` | User submits a reflection (freeform or scaffold); includes `entry_type`, `input_length`, `freeze_occurred` | `src/hooks/use-reflection-machine.ts` |
| `mirror_confirmed` | User confirms the AI mirror ("That's it"); includes `turns_count` | `src/hooks/use-reflection-machine.ts` |
| `mirror_not_quite` | User requests clarification with "Not quite"; includes `turns_count` | `src/hooks/use-reflection-machine.ts` |
| `mirror_say_more` | User requests elaboration with "Say more"; includes `turns_count` | `src/hooks/use-reflection-machine.ts` |
| `path_selected` | User selects a post-mirror path; includes `path` (solo/peers/exit) | `src/hooks/use-reflection-machine.ts` |
| `escalation_triggered` | Server detected high-risk content and triggered escalation flow | `src/hooks/use-reflection-machine.ts` |
| `escalation_engaged` | User engaged with the escalation resources | `src/hooks/use-reflection-machine.ts` |
| `session_completed` | Session marked complete on the session-end screen; includes `post_session_mood`, `contributed_reflection`, `action` | `src/hooks/use-session-end.ts` |
| `peer_resonance_toggled` | User toggles resonance on a peer reflection card; includes `resonated`, `reflection_index`, `is_fallback` | `src/components/peer-reflection/screen/PeerReflectionScreen.tsx` |
| `exercise_swapped` | User swaps to a different guided exercise during the solo path; includes `swaps_used` | `src/components/sit-with-this/sit-with-this-screen.tsx` |
| `$exception` | Auth errors (Apple/Google) captured with type and message | `src/components/auth/screens/AuthScreen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/396459/dashboard/1517145
- **Onboarding → Sign-in Funnel**: https://us.posthog.com/project/396459/insights/VLLINrex
- **Core Loop Funnel: Reflect → Mirror → Path**: https://us.posthog.com/project/396459/insights/paROiaMy
- **Mirror Acceptance Rate**: https://us.posthog.com/project/396459/insights/HjXnHgno
- **Path Selection Distribution**: https://us.posthog.com/project/396459/insights/W4Nj3RTp
- **Post-Session Mood Breakdown**: https://us.posthog.com/project/396459/insights/MrQ8lzal

> **Packages installed**: `posthog-react-native@4.43.10`, `expo-file-system`, `expo-application`, `expo-localization` — all installed via `npx expo install`.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
