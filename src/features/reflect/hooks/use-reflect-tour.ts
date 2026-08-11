import { useEffect, useRef, useState } from "react";
import { posthog } from "@/src/config/posthog";
import { useAppStore } from "@/src/store/store";

/**
 * When the first-install walkthrough runs, and what to record about it.
 *
 * Stepping belongs to `<Tour>` — this only decides whether it is open, and
 * marks it seen once it closes either way.
 */
export function useReflectTour() {
  const reflectTourSeen = useAppStore((s) => s.reflectTourSeen);
  const setReflectTourSeen = useAppStore((s) => s.setReflectTourSeen);
  const founderWelcomeSeen = useAppStore((s) => s.founderWelcomeSeen);
  const homeSheetBlocking = useAppStore((s) => s.homeSheetBlocking);

  const [isActive, setIsActive] = useState(false);
  // Only read when the tour is abandoned, so a ref rather than state: the
  // number the event wants is the last step shown, not a render input.
  const lastStep = useRef(0);

  // Start after the idle screen settles, once the founder welcome is dismissed
  // and no other home sheet is covering the screen. A returning user on a build
  // that added the tour has founderWelcomeSeen already true, so without the
  // homeSheetBlocking gate the spotlight would render under the return-welcome
  // or awareness sheet.
  useEffect(() => {
    if (reflectTourSeen || !founderWelcomeSeen || homeSheetBlocking) return;

    const timer = setTimeout(() => {
      setIsActive(true);
      posthog.capture("tour_started");
    }, 800);

    return () => clearTimeout(timer);
  }, [reflectTourSeen, founderWelcomeSeen, homeSheetBlocking]);

  const finish = () => {
    setIsActive(false);
    setReflectTourSeen(true);
    posthog.capture("tour_completed");
  };

  const skip = () => {
    setIsActive(false);
    setReflectTourSeen(true);
    posthog.capture("tour_skipped", { at_step: lastStep.current });
  };

  const trackStep = (order: number) => {
    lastStep.current = order;
  };

  return { isActive, finish, skip, trackStep };
}
