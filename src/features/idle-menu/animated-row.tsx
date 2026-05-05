import Animated, {
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  index: number;
};

export const AnimatedRow = ({ children, index }: Props) => (
  <Animated.View
    entering={FadeInDown.delay(index * 40).duration(200)}
    exiting={FadeOutDown.duration(150)}
  >
    {children}
  </Animated.View>
);
