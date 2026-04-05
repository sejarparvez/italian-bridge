import type React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlyingCard, type PlayerPosition } from './FlyingCard';

interface DealingAnimationProps {
  currentCardIndex: number;
}

const DEAL_ORDER: PlayerPosition[] = ['bottom', 'right', 'top', 'left'];

export function DealingAnimation({ currentCardIndex }: DealingAnimationProps) {
  const cards: React.ReactNode[] = [];
  const playerCardCount: Record<PlayerPosition, number> = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  for (let i = 0; i < currentCardIndex; i++) {
    const playerIndex = i % 4;
    const position = DEAL_ORDER[playerIndex];
    const cardIndex = playerCardCount[position];
    playerCardCount[position]++;

    cards.push(
      <FlyingCard
        key={i}
        index={i}
        dealIndex={i}
        targetPosition={position}
        cardIndex={cardIndex}
      />,
    );
  }

  return <View style={StyleSheet.absoluteFillObject}>{cards}</View>;
}
