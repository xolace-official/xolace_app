import { Stack } from "expo-router";
import { SessionDetailsScreen } from "@/src/components/timeline/screens/SessionDetailsScreen";

const SessionDetails = () => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SessionDetailsScreen />
    </>
  );
};

export default SessionDetails;
