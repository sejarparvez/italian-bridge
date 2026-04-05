import { MotiView } from 'moti';
import { Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export type PlayerPosition = 'top' | 'left' | 'right' | 'bottom';

interface FlyingCardProps {
  index: number;
  dealIndex: number;
  targetPosition: PlayerPosition;
  cardIndex: number;
}

const CARD_SPACING = 8;

const TARGET_POSITIONS: Record<
  PlayerPosition,
  { baseX: number; baseY: number }
> = {
  top: { baseX: SCREEN_W / 2 - 22, baseY: 30 },
  left: { baseX: 30, baseY: SCREEN_H / 2 - 31 },
  right: { baseX: SCREEN_W - 74, baseY: SCREEN_H / 2 - 31 },
  bottom: { baseX: SCREEN_W / 2 - 22, baseY: SCREEN_H - 60 },
};

function getOffsetForCard(
  position: PlayerPosition,
  cardIndex: number,
): { x: number; y: number } {
  const offset = (cardIndex - 6) * CARD_SPACING;

  switch (position) {
    case 'top':
      return { x: offset, y: cardIndex * 3 };
    case 'bottom':
      return { x: offset, y: -cardIndex * 3 };
    case 'left':
      return { x: cardIndex * 2, y: offset };
    case 'right':
      return { x: -cardIndex * 2, y: offset };
  }
}

export function FlyingCard({
  index,
  dealIndex,
  targetPosition,
  cardIndex,
}: FlyingCardProps) {
  const target = TARGET_POSITIONS[targetPosition];
  const offset = getOffsetForCard(targetPosition, cardIndex);

  return (
    <MotiView
      from={{
        translateX: SCREEN_W / 2 - 22,
        translateY: SCREEN_H / 2 - 31,
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        translateX: target.baseX + offset.x,
        translateY: target.baseY + offset.y,
        opacity: 1,
        scale: 1,
      }}
      transition={
        {
          delay: dealIndex * 100,
          duration: 300,
          type: 'spring',
          damping: 18,
        } as never
      }
      style={[styles.card, { zIndex: 1000 - index }]}
    >
      <View style={styles.cardBackPattern}>
        <View style={styles.cardBackInner} />
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: 44,
    height: 62,
    borderRadius: 6,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  cardBackPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 5,
    padding: 4,
    backgroundColor: colors.felt800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    flex: 1,
    width: '100%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.felt600,
    backgroundColor: colors.felt700,
  },
});
