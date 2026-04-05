import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomHand, HAND_HEIGHT } from '../components/game/BottomHand';
import { SideFan, TopFan } from '../components/game/CardFan';
import { DealingAnimation } from '../components/game/DealingAnimation';
import { Deck } from '../components/game/Deck';
import { MenuOverlay } from '../components/game/MenuOverlay';
import {
  SidePlayerBadge,
  TopPlayerBadge,
  UserPanel,
} from '../components/game/PlayerBadges';
import { TopBar } from '../components/game/TopBar';
import { TrickPile } from '../components/game/TrickPile';
import { colors } from '../constants/colors';
import { useDealing } from '../hooks/useDealing';

const { height: H } = Dimensions.get('window');

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const { state, startNewGame } = useDealing(true);
  const topBarHeight = insets.top + 52;

  const showHands = !state.isDealing && state.deckCount === 0;
  const isDealing = state.isDealing;
  const showDeck = state.deckCount > 0;
  const showAnimation = state.isDealing && state.currentCardIndex > 0;
  const bottomHand = state.playerHands.bottom;

  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    if (action === 'New Game') {
      startNewGame();
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {Array.from({ length: 14 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static background
        <View key={i} style={[styles.feltLine, { top: i * (H / 14) }]} />
      ))}

      <TopBar onMenuPress={() => setMenuVisible(true)} topInset={insets.top} />

      <View
        style={[styles.topPlayerAbsolute, { top: topBarHeight - 40 }]}
        pointerEvents='none'
      >
        <TopPlayerBadge name='Marco' score={-2} bid={5} isActive />
        {!isDealing &&
          (showHands ? <TopFan count={13} /> : <TopFan count={9} />)}
      </View>

      <View style={[styles.middleRow, { marginTop: topBarHeight + 20 }]}>
        <View style={styles.sideColumn}>
          <SidePlayerBadge name='Sofia' score={3} bid={4} team='us' />
          {!isDealing &&
            (showHands ? (
              <SideFan
                count={13}
                rotationBase={90}
                style={{ top: -70, zIndex: -1 }}
              />
            ) : (
              <SideFan
                count={8}
                rotationBase={90}
                style={{ top: -70, zIndex: -1 }}
              />
            ))}
        </View>

        <View style={styles.centerTable}>
          {showDeck && <Deck cardCount={state.deckCount} />}
          {!showDeck && <TrickPile />}
        </View>

        <View style={[styles.sideColumn, { top: -60 }]}>
          {!isDealing &&
            (showHands ? (
              <SideFan count={13} rotationBase={-90} style={{ top: 70 }} />
            ) : (
              <SideFan count={8} rotationBase={-90} style={{ top: 70 }} />
            ))}
          <SidePlayerBadge name='Luca' score={-1} bid={4} team='them' flip />
        </View>
      </View>

      <View style={styles.bottomArea}>
        <UserPanel />
        <View style={styles.bottomHandWrapper}>
          {!isDealing && <BottomHand hand={bottomHand} />}
        </View>
      </View>

      {showAnimation && (
        <DealingAnimation currentCardIndex={state.currentCardIndex} />
      )}

      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        panelTop={topBarHeight + 6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.felt900, overflow: 'hidden' },
  feltLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(26,122,84,0.07)',
  },
  topPlayerAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    gap: 2,
  },
  middleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sideColumn: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  centerTable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  bottomHandWrapper: {
    position: 'absolute',
    left: 27,
    right: 0,
    bottom: 16, // sits above paddingBottom
    height: HAND_HEIGHT, // defined in game.tsx wrapper
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible', // cards arc outside bounds — must not clip
  },
});
