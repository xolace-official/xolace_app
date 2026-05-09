import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const DuskDriftBackdrop = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[
          'rgba(245, 178, 124, 0.10)',
          'rgba(168, 132, 178, 0.06)',
          'rgba(54, 70, 110, 0.12)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};
