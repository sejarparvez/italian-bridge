import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Can't Follow Suit</Text>
        <Text style={styles.subtitle}>What would you like to do?</Text>

        <TouchableOpacity style={styles.revealButton} onPress={onReveal}>
          <Text style={styles.revealButtonText}>Reveal & Trump</Text>
          <Text style={styles.revealButtonDesc}>
            Reveal trump to all players
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
          <Text style={styles.skipButtonDesc}>
            Play any card, trump stays hidden
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold500,
    minWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gold400,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.felt300,
    marginBottom: 20,
  },
  revealButton: {
    backgroundColor: colors.gold600,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.gold400,
  },
  revealButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.felt900,
    marginBottom: 4,
  },
  revealButtonDesc: {
    fontSize: 12,
    color: colors.felt900,
    opacity: 0.7,
  },
  skipButton: {
    backgroundColor: colors.felt700,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.felt500,
  },
  skipButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.felt300,
    marginBottom: 4,
  },
  skipButtonDesc: {
    fontSize: 12,
    color: colors.felt400,
  },
});
