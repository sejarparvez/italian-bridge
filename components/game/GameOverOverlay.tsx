import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import type { TeamId } from '../../types/game-type';

interface GameOverOverlayProps {
  teamScores: Record<TeamId, number>;
  onNewGame: () => void;
}

export function GameOverOverlay({
  teamScores,
  onNewGame,
}: GameOverOverlayProps) {
  const btScore = teamScores.BT;
  const lrScore = teamScores.LR;

  const playerWins = btScore >= 30;
  const playerTeamName = playerWins ? 'You & Alex Win!' : 'Jordan & Sam Win!';
  const message = playerWins
    ? btScore >= 30
      ? 'Congratulations!'
      : 'You recovered!'
    : 'Better luck next time!';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 400, type: 'spring' }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Game Over</Text>

        <Text style={styles.winner}>{playerTeamName}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.finalScores}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>You & Alex:</Text>
            <Text
              style={[
                styles.scoreValue,
                btScore > 0 ? styles.positive : styles.negative,
              ]}
            >
              {btScore > 0 ? '+' : ''}
              {btScore}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Jordan & Sam:</Text>
            <Text
              style={[
                styles.scoreValue,
                lrScore > 0 ? styles.positive : styles.negative,
              ]}
            >
              {lrScore > 0 ? '+' : ''}
              {lrScore}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
          <Text style={styles.newGameButtonText}>New Game</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.gold500,
    minWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.felt300,
    marginBottom: 8,
  },
  winner: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.gold400,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.felt300,
    marginBottom: 24,
  },
  finalScores: {
    width: '100%',
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.felt600,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.felt300,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  positive: { color: colors.gold400 },
  negative: { color: '#FF6B6B' },
  newGameButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: colors.gold600,
    borderWidth: 3,
    borderColor: colors.gold400,
  },
  newGameButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.felt900,
  },
});
