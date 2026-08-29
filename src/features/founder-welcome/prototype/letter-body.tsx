import { View } from "react-native";

import { AppText } from "@/src/components/shared/app-text";

import { FOUNDER_MESSAGE, RETURNING_CALLOUT, type AudienceKey, type Segment } from "./letter-copy";

// PROTOTYPE — throwaway. Renders the founder message body: shared heart, then the
// returning-user callout (highlighted block, existing users only), then the
// shared hand-off line + sign-off.

const renderSegments = (segments: Segment[]) =>
  segments.map((seg) =>
    seg.highlight ? (
      <AppText key={seg.text} className="text-accent" style={{ fontFamily: "Poppins-Medium" }}>
        {seg.text}
      </AppText>
    ) : (
      seg.text
    ),
  );

type Props = {
  audience: AudienceKey;
  paragraphClassName?: string;
  gap?: number;
};

export const LetterBody = ({ audience, paragraphClassName = "text-foreground/80 text-[15px]", gap = 16 }: Props) => (
  <View style={{ gap }}>
    {FOUNDER_MESSAGE.paragraphs.map((segments) => (
      <AppText
        key={segments[0].text}
        className={paragraphClassName}
        style={{ fontFamily: "Poppins-Regular", lineHeight: 26 }}
      >
        {renderSegments(segments)}
      </AppText>
    ))}

    {audience === "existing" ? (
      <View className="mt-1 rounded-2xl border-l-2 border-accent bg-accent/10 px-4 py-3">
        <AppText
          className="text-accent/60 text-[11px] mb-1"
          style={{ fontFamily: "Poppins-Medium", letterSpacing: 1, textTransform: "uppercase" }}
        >
          since you’ve been here
        </AppText>
        <AppText className="text-foreground/85 text-[15px]" style={{ fontFamily: "Poppins-Regular", lineHeight: 25 }}>
          {renderSegments(RETURNING_CALLOUT)}
        </AppText>
      </View>
    ) : null}

    <AppText className={paragraphClassName} style={{ fontFamily: "Poppins-Regular", lineHeight: 26 }}>
      {FOUNDER_MESSAGE.transition}
    </AppText>

    <View style={{ paddingTop: 12 }}>
      <AppText className="text-foreground/60" style={{ fontFamily: "Poppins-Italic", fontSize: 14 }}>
        {FOUNDER_MESSAGE.closing}
      </AppText>
      <AppText
        className="text-foreground/55"
        style={{ fontFamily: "Poppins-Light", fontSize: 17, marginTop: 4, letterSpacing: 0.8 }}
      >
        {FOUNDER_MESSAGE.signature}
      </AppText>
    </View>
  </View>
);
