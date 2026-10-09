// Steadiness insights for the selected domain (#525): what the Reflection
// Agent noticed, each with the date it was written (ADR 0019). A link shows
// on both of its domains, named from the side being read.
import { View } from "react-native";
import { AppText } from "@/src/components/shared/app-text";
import { DOMAIN_META, lastSeen, type DomainItem, type Insight } from "./domains";

const EYEBROW: Record<Insight["kind"], string> = {
  link: "Moves with",
  helped: "What's helped before",
  then_now: "Then and now",
  shape: "How it tends to arrive",
};

export function SteadinessInsights({ domain, insights }: { domain: DomainItem["domain"]; insights: Insight[] }) {
  const mine = insights.filter((i) => i.domains.includes(domain));
  if (mine.length === 0) return null;
  return (
    <View className="gap-4 border-t border-border pt-4">
      {mine.map((i) => {
        const other = i.domains.find((d) => d !== domain);
        const eyebrow = i.kind === "link" && other ? `${EYEBROW.link} ${DOMAIN_META[other].label}` : EYEBROW[i.kind];
        return (
          <View key={`${i.kind}:${i.domains.join()}`} className="gap-1">
            <AppText className="text-[12px] text-muted">{eyebrow}</AppText>
            <AppText className="text-[15px] leading-6">{i.text}</AppText>
            <AppText className="text-[11px] text-muted">Noticed {lastSeen(i.writtenAt)}</AppText>
          </View>
        );
      })}
    </View>
  );
}
