import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

interface TrumpDialogOverlayProps {
  onReveal: () => void;
  onSkip: () => void;
}

export function TrumpDialogOverlay({
  onReveal,
  onSkip,
}: TrumpDialogOverlayProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} />
      <View style={styles.container}>
        <Text style={styles.title}>Can't follow suit</Text>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.revealButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onReveal}
          >
            <Text style={styles.revealText}>Reveal</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.skipButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 150,
    paddingBottom: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.gold500,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.felt300,
    marginRight: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  revealButton: {
    backgroundColor: colors.gold600,
    borderWidth: 1,
    borderColor: colors.gold400,
  },
  skipButton: {
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt500,
  },
  revealText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.felt900,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.felt300,
  },
});
