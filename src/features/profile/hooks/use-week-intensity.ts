import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWeekIntensity(weekOffset = 0) {
  return useQuery(api.profile.getWeekIntensity, { weekOffset });
}
