import { Stack } from "expo-router";
import { SessionDetailsScreen } from "@/src/features/timeline/components/screens/SessionDetailsScreen";

const SessionDetails = () => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SessionDetailsScreen />
    </>
  );
};

export default SessionDetails;
