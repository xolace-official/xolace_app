import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWeekIntensity() {
  return useQuery(api.profile.getWeekIntensity);
}
