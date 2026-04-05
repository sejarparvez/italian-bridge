import { StyleSheet, View } from 'react-native';
import { Card } from './Card';

export function TrickPile() {
  const trickCards = [
    { suit: '♠' as const, rank: 'A', rot: -8 },
    { suit: '♥' as const, rank: 'K', rot: 5 },
    { suit: '♦' as const, rank: '7', rot: -3 },
    { suit: '♣' as const, rank: 'J', rot: 12 },
  ];
  return (
    <View style={styles.trickPile}>
      {trickCards.map((c, i) => (
        <Card
          // biome-ignore lint/suspicious/noArrayIndexKey: static UI
          key={i}
          index={i}
          rotate={c.rot}
          faceDown={false}
          suit={c.suit}
          rank={c.rank}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trickPile: {
    width: 110,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
