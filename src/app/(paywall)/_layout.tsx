import { Stack } from "expo-router";
import {
  PaywallCloseButton,
  PaywallRestoreButton,
} from "@/src/features/purchases/screens/paywall-header-actions";

export default function PaywallLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => null,
          presentation: "fullScreenModal",
          gestureEnabled: true,
        }}
      >
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.View>
            <PaywallCloseButton />
          </Stack.Toolbar.View>
        </Stack.Toolbar>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.View>
            <PaywallRestoreButton />
          </Stack.Toolbar.View>
        </Stack.Toolbar>
      </Stack.Screen>
    </Stack>
  );
}
