import { MotiView } from 'moti';
import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

// ── Colour tokens ─────────────────────────────────────────────────────
const C = {
  felt900: '#0B3323',
  felt800: '#0F4530',
  felt700: '#145C40',
  felt600: '#1A7A54',
  felt500: '#229966',
  felt400: '#3DB87A',
  felt300: '#7DD4A8',
  gold600: '#BA7517',
  gold500: '#EF9F27',
  gold400: '#FAC775',
  ivory300: '#F5F3EB',
  ivory400: '#E4E2D8',
  ivory500: '#C8C6B8',
  ivory900: '#2C2A24',
  suitRed: '#C0392B',
  suitBlack: '#1A1A1A',
  scorePosBg: '#145C40',
  scorePosText: '#7DD4A8',
  scoreNegBg: '#791F1F',
  scoreNegText: '#F7C1C1',
};

const CARD_W = 44;
const CARD_H = 62;

// ─────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────
interface CardProps {
  index?: number;
  rotate?: number;
  faceDown?: boolean;
  suit?: '♠' | '♥' | '♦' | '♣';
  rank?: string;
}
function Card({
  index = 0,
  rotate = 0,
  faceDown = true,
  suit,
  rank,
}: CardProps) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 40, type: 'spring', damping: 18 }}
      style={[
        styles.card,
        { transform: [{ rotate: `${rotate}deg` }] },
        faceDown && styles.cardBack,
      ]}
    >
      {!faceDown && suit && rank ? (
        <>
          <Text style={[styles.cardRankTL, isRed && styles.cardRed]}>
            {rank}
          </Text>
          <Text style={[styles.cardSuitCenter, isRed && styles.cardRed]}>
            {suit}
          </Text>
          <Text style={[styles.cardRankBR, isRed && styles.cardRed]}>
            {rank}
          </Text>
        </>
      ) : (
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackInner} />
        </View>
      )}
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Fans
// ─────────────────────────────────────────────────────────────────────
function TopFan({ count = 9 }: { count?: number }) {
  const spread = 9;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={styles.topFanContainer} pointerEvents='none'>
      {Array.from({ length: count }).map((_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
          key={i}
          style={[
            styles.topFanCard,
            {
              transform: [
                { rotate: `${180 + (i * spread - halfSpread)}deg` },
                { translateY: -40 },
              ],
              top: -60,
              zIndex: -1000000 + i, // ensure cards are always behind player badge
            },
          ]}
        >
          <View style={styles.topFanCardBack}>
            <View style={styles.cardBackInner} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SideFan({
  count = 8,
  rotationBase = 90,
  style,
}: {
  count?: number;
  rotationBase?: number;
  style?: ViewStyle;
}) {
  const spread = 10;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={[styles.sideFanContainer, style]} pointerEvents='none'>
      {Array.from({ length: count }).map((_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
          key={i}
          style={[
            styles.sideFanCard,
            {
              transform: [
                { rotate: `${rotationBase + (i * spread - halfSpread)}deg` },
                { translateY: -40 },
              ],
            },
          ]}
        >
          <View style={styles.sideFanCardBack}>
            <View style={styles.cardBackInner} />
          </View>
        </View>
      ))}
    </View>
  );
}

function BottomHand() {
  const count = 10;
  const spread = 11;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={styles.bottomHandContainer}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * spread - halfSpread;
        const translateY = Math.abs(angle) * 0.5;
        return (
          <MotiView
            // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
            key={i}
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY }}
            transition={{ delay: 600 + i * 50, type: 'spring', damping: 16 }}
            style={[
              styles.bottomCard,
              {
                transform: [{ rotate: `${angle}deg` }, { translateY }],
                zIndex: i,
                marginLeft: i === 0 ? 0 : -28,
              },
            ]}
          >
            <View style={styles.cardBackPattern}>
              <View style={styles.cardBackInner} />
            </View>
          </MotiView>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Score chip
// ─────────────────────────────────────────────────────────────────────
function ScoreChip({ score, bid }: { score: number; bid: number }) {
  const pos = score >= 0;
  return (
    <View style={[styles.scoreChip, pos ? styles.scorePos : styles.scoreNeg]}>
      <Text
        style={[
          styles.scoreText,
          pos ? styles.scoreTextPos : styles.scoreTextNeg,
        ]}
      >
        {pos ? '+' : ''}
        {score}
      </Text>
      <Text style={styles.bidText}>BID {bid}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Player badges
// ─────────────────────────────────────────────────────────────────────
function TopPlayerBadge({
  name,
  score,
  bid,
  isActive,
}: {
  name: string;
  score: number;
  bid: number;
  isActive?: boolean;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 200, type: 'spring', damping: 18 }}
      style={styles.topPlayerBadge}
    >
      <View style={[styles.topAvatarRing, { borderColor: C.felt400 }]}>
        <View style={[styles.topAvatar, { backgroundColor: '#0F4530' }]}>
          <Text style={styles.topAvatarInitial}>{name[0]}</Text>
        </View>
        {isActive && (
          <View style={[styles.activeDot, { backgroundColor: C.felt400 }]} />
        )}
      </View>
      <Text style={styles.topPlayerName}>{name}</Text>
      <ScoreChip score={score} bid={bid} />
    </MotiView>
  );
}

function SidePlayerBadge({
  name,
  score,
  bid,
  isActive,
  team,
  flip,
}: {
  name: string;
  score: number;
  bid: number;
  isActive?: boolean;
  team: 'us' | 'them';
  flip?: boolean;
}) {
  const teamColor = team === 'us' ? C.gold500 : C.felt400;
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 18 }}
      style={[styles.sidePlayerBadge, flip && styles.sidePlayerBadgeFlip]}
    >
      <View style={[styles.sideAvatarRing, { borderColor: teamColor }]}>
        <View
          style={[
            styles.sideAvatar,
            { backgroundColor: team === 'us' ? '#4A2800' : '#0F4530' },
          ]}
        >
          <Text style={styles.sideAvatarInitial}>{name[0]}</Text>
        </View>
        {isActive && (
          <View style={[styles.activeDot, { backgroundColor: teamColor }]} />
        )}
      </View>
      <View style={styles.sidePlayerInfo}>
        <Text style={styles.sidePlayerName}>{name}</Text>
        <ScoreChip score={score} bid={bid} />
      </View>
    </MotiView>
  );
}

function UserPanel() {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: 300, type: 'spring', damping: 18 }}
      style={styles.userPanel}
    >
      <View style={[styles.userAvatarRing, { borderColor: C.gold500 }]}>
        <View style={[styles.userAvatar, { backgroundColor: '#4A2800' }]}>
          <Text style={styles.userAvatarInitial}>Y</Text>
        </View>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>You</Text>
        <ScoreChip score={5} bid={6} />
      </View>
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Menu — pure in-tree absolute overlay (no Modal, no status bar flash)
// ─────────────────────────────────────────────────────────────────────
const MENU_ACTIONS = [
  { label: 'New Game', icon: '🃏', color: C.gold500 },
  { label: 'Show Scores', icon: '📊', color: C.felt300 },
  { label: 'Settings', icon: '⚙️', color: C.felt300 },
  { label: 'Exit Game', icon: '🚪', color: '#F7C1C1' },
];

interface MenuOverlayProps {
  visible: boolean;
  onClose: () => void;
  /** pixel offset from top of root so panel sits just below the top bar */
  panelTop: number;
}
function MenuOverlay({ visible, onClose, panelTop }: MenuOverlayProps) {
  if (!visible) return null;
  return (
    // Full-screen touchable backdrop — sits inside root so no Modal/StatusBar issues
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
      {/* dark scrim */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 180 }}
        style={[StyleSheet.absoluteFill, styles.menuScrim]}
        pointerEvents='none'
      />

      {/* Panel — stop touch propagation so tapping inside doesn't close */}
      <Pressable
        style={[styles.menuPanel, { top: panelTop, right: 14 }]}
        onPress={(e) => e.stopPropagation()}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: -8 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>GAME MENU</Text>
            <Pressable onPress={onClose} style={styles.menuCloseBtn}>
              <Text style={styles.menuCloseText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.menuDivider} />

          {/* Scrollable items */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.menuScroll}
          >
            {MENU_ACTIONS.map((action, i) => (
              <MotiView
                key={action.label}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 55, type: 'spring', damping: 18 }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={onClose}
                >
                  <Text style={styles.menuItemIcon}>{action.icon}</Text>
                  <Text style={[styles.menuItemLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                  <Text style={styles.menuItemChevron}>›</Text>
                </Pressable>
              </MotiView>
            ))}
          </ScrollView>
        </MotiView>
      </Pressable>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────────────
function TopBar({
  onMenuPress,
  topInset,
}: {
  onMenuPress: () => void;
  topInset: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 100 }}
      style={[styles.topBar, { paddingTop: topInset + 8 }]}
    >
      <View style={styles.teamBar}>
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: C.gold500 }]} />
          <Text style={styles.teamLabel}>Us</Text>
          <Text style={[styles.teamPoints, { color: C.gold500 }]}>47</Text>
        </View>
        <View style={styles.teamBarDivider} />
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: C.felt400 }]} />
          <Text style={styles.teamLabel}>Them</Text>
          <Text style={[styles.teamPoints, { color: C.felt400 }]}>31</Text>
        </View>
      </View>

      <View style={styles.topBarRight}>
        {/* Trump badge */}
        <View style={styles.trumpBadge}>
          <Text style={styles.trumpLabel}>TRUMP</Text>
          <Text style={styles.trumpSuit}>♠</Text>
        </View>
        {/* Hamburger */}
        <Pressable
          onPress={onMenuPress}
          style={({ pressed }) => [
            styles.menuBtn,
            pressed && styles.menuBtnPressed,
          ]}
        >
          <View style={styles.menuBtnLine} />
          <View style={styles.menuBtnLine} />
          <View style={styles.menuBtnLine} />
        </Pressable>
      </View>
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Center table
// ─────────────────────────────────────────────────────────────────────
function TrickPile() {
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
          // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
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

// ─────────────────────────────────────────────────────────────────────
// Root screen
// ─────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  // Height of the top bar so we can position absolute elements below it
  const topBarHeight = insets.top + 52;

  return (
    // zIndex stack: felt (0) → game elements (1-10) → menu overlay (99)
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Felt texture lines */}
      {Array.from({ length: 14 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
        <View key={i} style={[styles.feltLine, { top: i * (H / 14) }]} />
      ))}

      {/* TOP BAR */}
      <TopBar onMenuPress={() => setMenuVisible(true)} topInset={insets.top} />

      {/* TOP PLAYER — absolute, overlaps below bar */}
      <View
        style={[styles.topPlayerAbsolute, { top: topBarHeight - 40 }]}
        pointerEvents='none'
      >
        <TopPlayerBadge name='Marco' score={-2} bid={5} isActive />
        <TopFan count={9} />
      </View>

      {/* MIDDLE ROW */}
      <View style={[styles.middleRow, { marginTop: topBarHeight + 20 }]}>
        {/* Left — Sofia */}
        <View style={styles.sideColumn}>
          <SidePlayerBadge name='Sofia' score={3} bid={4} team='us' />
          <SideFan
            count={8}
            rotationBase={90}
            style={{ top: -70, zIndex: -1 }}
          />
        </View>

        {/* Center table */}
        <View style={styles.centerTable}>
          <TrickPile />
        </View>

        {/* Right — Luca */}
        <View style={styles.sideColumn}>
          <SideFan count={8} rotationBase={-90} style={{ top: 70 }} />
          <SidePlayerBadge name='Luca' score={-1} bid={4} team='them' flip />
        </View>
      </View>

      {/* BOTTOM AREA */}
      <View style={styles.bottomArea}>
        <UserPanel />
        <View style={styles.bottomHandWrapper}>
          <BottomHand />
        </View>
      </View>

      {/* MENU OVERLAY — inside root, no Modal, no status bar */}
      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        panelTop={topBarHeight + 6}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.felt900, overflow: 'hidden' },

  feltLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(26,122,84,0.07)',
  },

  // ── Top bar ──────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: 'rgba(11,51,35,0.95)',
  },
  teamBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamScore: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.felt300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  teamPoints: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  teamBarDivider: { width: 1, height: 20, backgroundColor: C.felt600 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  trumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.felt800,
    borderWidth: 1,
    borderColor: C.gold500,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trumpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.gold400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  trumpSuit: { fontSize: 15, color: C.suitBlack },

  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.felt700,
    borderWidth: 1,
    borderColor: C.felt600,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  menuBtnPressed: { backgroundColor: C.felt600 },
  menuBtnLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.felt300,
  },

  // ── Top player (absolute) ─────────────────────────────────────────────
  topPlayerAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    gap: 2,
  },
  topPlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,51,35,0.82)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.felt600,
    zIndex: 10,
  },
  topAvatarRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAvatarInitial: { fontSize: 11, fontWeight: '900', color: C.ivory400 },
  topPlayerName: {
    fontSize: 10,
    fontWeight: '700',
    color: C.felt300,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  topFanContainer: {
    height: 48,
    width: W * 0.55,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  topFanCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 4,
  },
  topFanCardBack: {
    flex: 1,
    backgroundColor: C.felt700,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.felt600,
    padding: 4,
  },

  // ── Middle row ────────────────────────────────────────────────────────
  middleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  // Wider + more inward padding pushes badges & fans away from screen edges
  sideColumn: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },

  sidePlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(11,51,35,0.82)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.felt600,
  },
  sidePlayerBadgeFlip: { flexDirection: 'row-reverse' },
  sideAvatarRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideAvatarInitial: { fontSize: 10, fontWeight: '900', color: C.ivory400 },
  sidePlayerInfo: { gap: 2 },
  sidePlayerName: {
    fontSize: 8,
    fontWeight: '700',
    color: C.felt300,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  activeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: C.felt900,
  },

  sideFanContainer: {
    width: 56,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideFanCard: {
    position: 'absolute',
    width: CARD_H,
    height: CARD_W,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 4,
  },
  sideFanCardBack: {
    flex: 1,
    backgroundColor: C.felt700,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.felt600,
    padding: 4,
  },

  // ── Center ────────────────────────────────────────────────────────────
  centerTable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,69,48,0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.felt600,
  },
  roundPill: { alignItems: 'center' },
  roundLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: C.felt400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  roundValue: { fontSize: 13, fontWeight: '900', color: C.ivory400 },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.felt600,
  },
  trickPile: {
    width: 110,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Cards ─────────────────────────────────────────────────────────────
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    backgroundColor: C.ivory300,
    borderWidth: 1,
    borderColor: C.ivory500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  cardBack: { backgroundColor: C.felt700, borderColor: C.felt600 },
  cardBackPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 5,
    padding: 4,
    backgroundColor: C.felt800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    flex: 1,
    width: '100%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.felt600,
    backgroundColor: C.felt700,
  },
  cardRankTL: {
    position: 'absolute',
    top: 4,
    left: 5,
    fontSize: 11,
    fontWeight: '900',
    color: C.suitBlack,
  },
  cardRankBR: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    fontSize: 11,
    fontWeight: '900',
    color: C.suitBlack,
    transform: [{ rotate: '180deg' }],
  },
  cardSuitCenter: { fontSize: 22, color: C.suitBlack },
  cardRed: { color: C.suitRed },

  // ── Bottom area ───────────────────────────────────────────────────────
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  bottomHandWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomHandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CARD_H + 20,
    justifyContent: 'center',
  },
  bottomCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    backgroundColor: C.felt700,
    borderWidth: 1,
    borderColor: C.felt600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },

  userPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11,51,35,0.90)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.gold600,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  userAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarInitial: { fontSize: 14, fontWeight: '900', color: C.ivory400 },
  userInfo: { gap: 3 },
  userName: {
    fontSize: 10,
    fontWeight: '800',
    color: C.gold400,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Score chip ────────────────────────────────────────────────────────
  scoreChip: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  scorePos: { backgroundColor: C.scorePosBg },
  scoreNeg: { backgroundColor: C.scoreNegBg },
  scoreText: { fontSize: 11, fontWeight: '900' },
  scoreTextPos: { color: C.scorePosText },
  scoreTextNeg: { color: C.scoreNegText },
  bidText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
  },

  // ── Menu overlay (no Modal) ───────────────────────────────────────────
  menuScrim: { backgroundColor: 'rgba(0,0,0,0.55)' },

  menuPanel: {
    position: 'absolute',
    width: 220,
    backgroundColor: C.felt800,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.felt600,
    overflow: 'hidden',
    elevation: 99,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.felt300,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  menuCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.felt700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCloseText: { fontSize: 11, color: C.felt300, fontWeight: '700' },
  menuDivider: { height: 1, backgroundColor: C.felt600 },
  menuScroll: { maxHeight: 280 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,122,84,0.2)',
  },
  menuItemPressed: { backgroundColor: C.felt700 },
  menuItemIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menuItemChevron: { fontSize: 18, color: C.felt600, fontWeight: '300' },
});
