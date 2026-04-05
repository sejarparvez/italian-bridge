import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useGameStore } from '@/store/game-store';

// ─────────────────────────────────────────────────────────────────────────────
// Card geometry
// ─────────────────────────────────────────────────────────────────────────────
const CARD_W = 72;
const CARD_H = 102;

// Fan arc constants — tweak these to reshape the spread
const FAN_RADIUS = 210; // arc radius from pivot to card bottom-center
const FAN_PIVOT_BELOW = 160; // how far below the fan-area's bottom the pivot sits
const FAN_AREA_W = 260;
const FAN_AREA_H = 210;

const FAN_CARDS = [
  {
    rank: '7',
    suit: '♣',
    red: false,
    angle: -34,
    zIndex: 0,
    opacity: 0.65,
    delay: 80,
  },
  {
    rank: 'K',
    suit: '♥',
    red: true,
    angle: -17,
    zIndex: 1,
    opacity: 1,
    delay: 160,
  },
  {
    rank: 'A',
    suit: '♠',
    red: false,
    angle: 0,
    zIndex: 4,
    opacity: 1,
    delay: 260,
  },
  {
    rank: 'Q',
    suit: '♦',
    red: true,
    angle: 17,
    zIndex: 2,
    opacity: 1,
    delay: 160,
  },
  {
    rank: 'J',
    suit: '♠',
    red: false,
    angle: 34,
    zIndex: 0,
    opacity: 0.65,
    delay: 80,
  },
] as const;

/** Compute absolute left/top and rotation for a card in the fan. */
function getFanTransform(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const pivotX = FAN_AREA_W / 2;
  const pivotY = FAN_AREA_H + FAN_PIVOT_BELOW;
  const bx = pivotX + FAN_RADIUS * Math.sin(rad);
  const by = pivotY - FAN_RADIUS * Math.cos(rad);
  return {
    left: bx - CARD_W / 2,
    top: by - CARD_H,
    rotate: `${angle}deg`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG playing card — corners are text elements anchored precisely, no layout
// ─────────────────────────────────────────────────────────────────────────────
interface CardSvgProps {
  rank: string;
  suit: string;
  red: boolean;
}

function CardSvg({ rank, suit, red }: CardSvgProps) {
  const col = red ? '#C0392B' : '#1A1A1A';
  const cx = CARD_W / 2;
  const cy = CARD_H / 2;

  return (
    <Svg width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`}>
      {/* Card body */}
      <Rect
        width={CARD_W}
        height={CARD_H}
        rx={7}
        ry={7}
        fill='#F5F3EB'
        stroke='#C8C6B8'
        strokeWidth={0.5}
      />
      {/* Subtle gloss */}
      <Rect
        width={CARD_W}
        height={CARD_H / 2}
        rx={7}
        ry={7}
        fill='rgba(255,255,255,0.07)'
      />

      {/* ── Top-left corner ── */}
      <SvgText
        x={6}
        y={17}
        fontFamily='Georgia, serif'
        fontSize={14}
        fontWeight='800'
        fill={col}
      >
        {rank}
      </SvgText>
      <SvgText
        x={7}
        y={29}
        fontFamily='Georgia, serif'
        fontSize={12}
        fill={col}
      >
        {suit}
      </SvgText>

      {/* ── Bottom-right corner (rotated 180°) ── */}
      <SvgText
        x={CARD_W - 6}
        y={CARD_H - 16}
        fontFamily='Georgia, serif'
        fontSize={14}
        fontWeight='800'
        fill={col}
        textAnchor='end'
        rotation={180}
        originX={CARD_W - 6}
        originY={CARD_H - 16}
      >
        {rank}
      </SvgText>
      <SvgText
        x={CARD_W - 7}
        y={CARD_H - 4}
        fontFamily='Georgia, serif'
        fontSize={12}
        fill={col}
        textAnchor='end'
        rotation={180}
        originX={CARD_W - 7}
        originY={CARD_H - 4}
      >
        {suit}
      </SvgText>

      {/* ── Centre suit watermark ── */}
      <SvgText
        x={cx}
        y={cy + 12}
        fontFamily='Georgia, serif'
        fontSize={38}
        fill={col}
        textAnchor='middle'
      >
        {suit}
      </SvgText>
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single fan card with animation
// ─────────────────────────────────────────────────────────────────────────────
interface FanCardProps {
  rank: string;
  suit: string;
  red: boolean;
  angle: number;
  zIndex: number;
  opacity: number;
  delay: number;
}

function FanCard({
  rank,
  suit,
  red,
  angle,
  zIndex,
  opacity,
  delay,
}: FanCardProps) {
  const { left, top, rotate } = getFanTransform(angle);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity, translateY: 0 }}
      transition={{ delay, type: 'spring', damping: 18, stiffness: 90 }}
      style={{
        position: 'absolute',
        left,
        top,
        zIndex,
        width: CARD_W,
        height: CARD_H,
        transform: [{ rotate }],
        // Shadow applied here — not on the SVG itself
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <CardSvg rank={rank} suit={suit} red={red} />
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu button
// ─────────────────────────────────────────────────────────────────────────────
interface MenuButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  delay: number;
  disabled?: boolean;
}

function MenuButton({
  title,
  onPress,
  variant = 'secondary',
  delay,
  disabled = false,
}: MenuButtonProps) {
  const variantStyle = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    ghost: styles.btnGhost,
  }[variant];

  const variantText = {
    primary: styles.btnTextPrimary,
    secondary: styles.btnTextSecondary,
    ghost: styles.btnTextGhost,
  }[variant];

  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: disabled ? 0.4 : 1, translateX: 0 }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 100 }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.btn, variantStyle]}
      >
        <Text style={[styles.btnText, variantText]}>{title}</Text>
      </Pressable>
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNewGame = () => {
    useGameStore.getState().startNewGame();
    router.replace('/game' as const);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      {/* ── Left panel tint + divider ───────────────────────────────────── */}
      <View style={styles.leftPanelBg} />
      <View style={styles.leftPanelBorder} />

      {/* ── Corner dots ────────────────────────────────────────────────── */}
      <View style={[styles.cornerDot, { top: 14, left: 16 }]} />
      <View style={[styles.cornerDot, { top: 14, right: 16 }]} />
      <View style={[styles.cornerDot, { bottom: 14, left: 16 }]} />
      <View style={[styles.cornerDot, { bottom: 14, right: 16 }]} />

      {/* ══ LEFT PANEL — visual hero ═══════════════════════════════════════ */}
      <View style={styles.leftPanel}>
        {/* Felt table + fanned cards */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 60, type: 'spring', damping: 18, stiffness: 80 }}
          style={styles.fanArea}
        >
          {/* Circular felt surface */}
          <View style={styles.felt} />

          {/* Cards — positioned absolutely inside fanArea */}
          {FAN_CARDS.map((c) => (
            <FanCard
              key={c.rank + c.suit}
              rank={c.rank}
              suit={c.suit}
              red={c.red}
              angle={c.angle}
              zIndex={c.zIndex}
              opacity={c.opacity}
              delay={c.delay}
            />
          ))}
        </MotiView>

        {/* Suit pip row */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 400, type: 'timing', duration: 400 }}
          style={styles.pipRow}
        >
          {(['♣', '♦', '♥', '♠'] as const).map((suit, i) => (
            <Text
              key={suit}
              style={[
                styles.pip,
                { color: i % 2 === 0 ? '#7DD4A8' : '#C0392B' },
              ]}
            >
              {suit}
            </Text>
          ))}
        </MotiView>
      </View>

      {/* ══ RIGHT PANEL — title + buttons ══════════════════════════════════ */}
      <View style={styles.rightPanel}>
        <MotiView
          from={{ opacity: 0, translateX: 20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <Text style={styles.eyebrow}>4-player partnership</Text>
          <Text style={styles.titleMain}>Italian</Text>
          <Text style={styles.titleAccent}>Bridge</Text>
          <View style={styles.titleRule} />
        </MotiView>

        <View style={styles.btnStack}>
          <MenuButton
            title='New Game'
            onPress={handleNewGame}
            variant='primary'
            delay={300}
          />
          <MenuButton
            title='Resume Game'
            onPress={() => {}}
            variant='secondary'
            delay={380}
            disabled
          />
          <MenuButton
            title='Settings'
            onPress={() => router.push('/settings')}
            variant='ghost'
            delay={460}
          />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3323',
    flexDirection: 'row',
  },

  // Left panel tint + divider
  leftPanelBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '55%',
    backgroundColor: '#0F4530',
  },
  leftPanelBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '55%',
    width: 1,
    backgroundColor: '#1A7A54',
  },

  cornerDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#145C40',
    zIndex: 10,
  },

  // ── Left panel
  leftPanel: {
    width: '55%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    gap: 16,
  },

  // Fan area — absolute positioning parent for all cards
  fanArea: {
    width: FAN_AREA_W,
    height: FAN_AREA_H,
    position: 'relative',
  },

  // Circular felt under the cards
  felt: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#092C1D',
    borderWidth: 2,
    borderColor: '#1A7A54',
    bottom: -40,
    alignSelf: 'center',
  },

  pipRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pip: {
    fontSize: 16,
    opacity: 0.4,
  },

  // ── Right panel
  rightPanel: {
    width: '45%',
    justifyContent: 'center',
    paddingLeft: 32,
    paddingRight: 36,
    zIndex: 2,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3DB87A',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleMain: {
    fontSize: 36,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#E4E2D8',
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 38,
  },
  titleAccent: {
    fontSize: 42,
    fontWeight: '900',
    color: '#EF9F27',
    letterSpacing: 4,
    textTransform: 'uppercase',
    lineHeight: 46,
  },
  titleRule: {
    width: 32,
    height: 1.5,
    backgroundColor: '#1A7A54',
    marginTop: 10,
    marginBottom: 18,
  },

  btnStack: {
    gap: 8,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#EF9F27' },
  btnSecondary: {
    backgroundColor: '#145C40',
    borderWidth: 1,
    borderColor: '#1A7A54',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1A7A54',
  },

  btnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnTextPrimary: { color: '#4A2800' },
  btnTextSecondary: { color: '#7DD4A8' },
  btnTextGhost: { color: '#3DB87A' },
});
