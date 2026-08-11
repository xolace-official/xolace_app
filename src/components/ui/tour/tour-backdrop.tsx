import { StyleSheet, View } from "react-native";

import type { Rect } from "@/src/components/ui/tour/types";

type Props = {
  interactive: boolean;
  dismissible: boolean;
  spot: Rect | null;
  screenWidth: number;
  screenHeight: number;
  onDismiss: () => void;
};

/**
 * The layer that takes the touches the dim does not.
 *
 * One full-screen responder, or four around the cutout when the target has to
 * stay usable. Four rather than one with a hole, because a view cannot have a
 * hole — the gap between them is the hole, and it is the only construction
 * that leaves a rectangle of the screen reachable.
 */
export const TourBackdrop = ({
  interactive,
  dismissible,
  spot,
  screenWidth,
  screenHeight,
  onDismiss,
}: Props) => {
  const press = dismissible
    ? { onStartShouldSetResponder: () => true, onResponderRelease: onDismiss }
    : { onStartShouldSetResponder: () => true };

  if (!interactive || !spot) {
    return <View style={StyleSheet.absoluteFill} {...press} />;
  }

  const bottom = spot.y + spot.height;
  const right = spot.x + spot.width;

  return (
    <>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: Math.max(0, spot.y),
        }}
        {...press}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          top: bottom,
          right: 0,
          height: Math.max(0, screenHeight - bottom),
        }}
        {...press}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          top: spot.y,
          width: Math.max(0, spot.x),
          height: spot.height,
        }}
        {...press}
      />
      <View
        style={{
          position: "absolute",
          left: right,
          top: spot.y,
          width: Math.max(0, screenWidth - right),
          height: spot.height,
        }}
        {...press}
      />
    </>
  );
};
