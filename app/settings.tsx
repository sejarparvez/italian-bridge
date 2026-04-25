import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settings-store';
import { colors } from '../constants/colors';

// ─── Nav sections ─────────────────────────────────────────────────────────────

type SectionId =
  | 'player'
  | 'bidding'
  | 'gameplay'
  | 'scoring'
  | 'table'
  | 'sound'
  | 'about';

const NAV_ITEMS: { id: SectionId; label: string; sub: string }[] = [
  { id: 'player', label: 'Player', sub: 'Name · seat' },
  { id: 'bidding', label: 'Bidding', sub: 'Bids · trump' },
  { id: 'gameplay', label: 'Gameplay', sub: 'Rules · tricks' },
  { id: 'scoring', label: 'Scoring', sub: 'Targets · win' },
  { id: 'table', label: 'Table', sub: 'Theme · cards' },
  { id: 'sound', label: 'Sound', sub: 'FX · haptics' },
  { id: 'about', label: 'About', sub: 'Version · reset' },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sLabel}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

function Divider() {
  return <View style={s.divider} />;
}

function Chevron() {
  return <View style={s.chevron} />;
}

type IconVariant = 'green' | 'gold' | 'ivory' | 'red';
const iconWrapStyle: Record<IconVariant, object> = {
  green: {
    backgroundColor: 'rgba(34,153,102,0.2)',
    borderColor: 'rgba(61,184,122,0.2)',
  },
  gold: {
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderColor: 'rgba(239,159,39,0.2)',
  },
  ivory: {
    backgroundColor: 'rgba(245,243,235,0.08)',
    borderColor: 'rgba(245,243,235,0.13)',
  },
  red: {
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderColor: 'rgba(192,57,43,0.2)',
  },
};

function IconWrap({
  variant,
  children,
}: {
  variant: IconVariant;
  children: React.ReactNode;
}) {
  return <View style={[s.iconWrap, iconWrapStyle[variant]]}>{children}</View>;
}

// ─── Row types ────────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  variant = 'green',
  title,
  sub,
  value,
  onToggle,
}: {
  icon: React.ReactNode;
  variant?: IconVariant;
  title: string;
  sub?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <IconWrap variant={variant}>{icon}</IconWrap>
      <View style={s.rowBody}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.felt500 }}
        thumbColor={colors.ivory300}
        ios_backgroundColor='rgba(255,255,255,0.08)'
      />
    </View>
  );
}

function ValueRow({
  icon,
  variant = 'gold',
  title,
  sub,
  values,
}: {
  icon: React.ReactNode;
  variant?: IconVariant;
  title: string;
  sub?: string;
  values: string[];
}) {
  const [idx, setIdx] = useState(0);
  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => setIdx((i) => (i + 1) % values.length)}
      activeOpacity={0.7}
    >
      <IconWrap variant={variant}>{icon}</IconWrap>
      <View style={s.rowBody}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <View style={s.rowRight}>
        <MotiView
          key={idx}
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          <Text style={s.valueText}>{values[idx]}</Text>
        </MotiView>
        <Chevron />
      </View>
    </TouchableOpacity>
  );
}

function NavRow({
  icon,
  variant = 'ivory',
  title,
  sub,
  badge,
  titleColor,
  onPress,
}: {
  icon: React.ReactNode;
  variant?: IconVariant;
  title: string;
  sub?: string;
  badge?: string;
  titleColor?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <IconWrap variant={variant}>{icon}</IconWrap>
      <View style={s.rowBody}>
        <Text style={[s.rowTitle, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
        {sub && (
          <Text
            style={[
              s.rowSub,
              titleColor ? { color: 'rgba(192,57,43,0.6)' } : null,
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
      {badge ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Chevron />
      )}
    </TouchableOpacity>
  );
}

// ─── Panel: Player ────────────────────────────────────────────────────────────

function PlayerPanel() {
  const seats = [
    {
      id: 'B2',
      name: 'Bot 2',
      role: 'North · Team A (Partner)',
      isHuman: false,
    },
    { id: 'B1', name: 'Bot 1', role: 'West · Team B', isHuman: false },
    { id: 'P1', name: 'You', role: 'South · Team A', isHuman: true },
    { id: 'B3', name: 'Bot 3', role: 'East · Team B', isHuman: false },
  ];
  return (
    <>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>P1</Text>
        </View>
        <View>
          <Text style={s.profileName}>Player One</Text>
          <Text style={s.profileSub}>Human · South seat · Team A</Text>
        </View>
        <TouchableOpacity style={s.editBtn}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <SectionLabel label='Seat arrangement' />
      <View style={s.seatGrid}>
        {seats.map((seat) => (
          <View
            key={seat.id}
            style={[s.seatCard, seat.isHuman && s.seatCardHuman]}
          >
            <View
              style={[
                s.seatAvatar,
                seat.isHuman ? s.seatAvatarHuman : s.seatAvatarBot,
              ]}
            >
              <Text
                style={[
                  s.seatAvatarText,
                  seat.isHuman ? s.seatAvatarTextHuman : s.seatAvatarTextBot,
                ]}
              >
                {seat.id}
              </Text>
            </View>
            <View>
              <Text style={s.seatName}>{seat.name}</Text>
              <Text style={s.seatRole}>{seat.role}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          Turn order is{' '}
          <Text style={{ color: colors.gold500, fontWeight: '600' }}>
            clockwise
          </Text>
          : You → Bot 1 → Bot 2 → Bot 3. Dealer rotates each round.
        </Text>
      </View>
    </>
  );
}

// ─── Panel: Bidding ───────────────────────────────────────────────────────────

function BiddingPanel() {
  const [allowPeek, setAllowPeek] = useState(true);
  const [revealDialog, setRevealDialog] = useState(true);
  const [bidTimer, setBidTimer] = useState(false);
  return (
    <>
      <SectionLabel label='Bid range' />
      <Card>
        <ValueRow
          icon={<Text>★</Text>}
          variant='gold'
          title='Minimum bid'
          sub='Lowest allowed opening bid'
          values={['7', '8']}
        />
        <Divider />
        <NavRow
          icon={<Text>↑</Text>}
          variant='gold'
          title='Maximum bid'
          sub='Always 10 — wins all tricks for +13 bonus'
          badge='10 fixed'
        />
        <Divider />
        <ToggleRow
          icon={<Text>⏱</Text>}
          variant='gold'
          title='Bid timer'
          sub='Limit time per bidding turn'
          value={bidTimer}
          onToggle={setBidTimer}
        />
      </Card>
      <SectionLabel label='Trump card' />
      <Card>
        <ToggleRow
          icon={<Text>👁</Text>}
          variant='gold'
          title='Allow human peek'
          sub='View trump privately if you won the bid'
          value={allowPeek}
          onToggle={setAllowPeek}
        />
        <Divider />
        <ToggleRow
          icon={<Text>✓</Text>}
          variant='green'
          title='Show trump reveal dialog'
          sub='Prompt before revealing trump on first trump play'
          value={revealDialog}
          onToggle={setRevealDialog}
        />
      </Card>
    </>
  );
}

// ─── Panel: Gameplay ──────────────────────────────────────────────────────────

function GameplayPanel() {
  const [highlightCards, setHighlightCards] = useState(true);
  const [showWinner, setShowWinner] = useState(true);
  const [showHints, setShowHints] = useState(false);
  return (
    <>
      <SectionLabel label='Dealing' />
      <Card>
        <NavRow
          icon={<Text>📋</Text>}
          variant='green'
          title='Phase 1 cards'
          sub='Dealt before bidding — used to decide bid'
          badge='5 fixed'
        />
        <Divider />
        <NavRow
          icon={<Text>📋</Text>}
          variant='green'
          title='Phase 2 cards'
          sub='Dealt after trump is chosen'
          badge='8 fixed'
        />
      </Card>
      <SectionLabel label='Tricks' />
      <Card>
        <ToggleRow
          icon={<Text>✦</Text>}
          variant='green'
          title='Highlight valid cards'
          sub='Show which cards can be legally played'
          value={highlightCards}
          onToggle={setHighlightCards}
        />
        <Divider />
        <ToggleRow
          icon={<Text>✓</Text>}
          variant='green'
          title='Show trick winner'
          sub='Brief animation when a trick is won'
          value={showWinner}
          onToggle={setShowWinner}
        />
        <Divider />
        <ValueRow
          icon={<Text>⏱</Text>}
          variant='gold'
          title='Bot play speed'
          sub='How fast bots play their cards'
          values={['Slow', 'Normal', 'Fast']}
        />
        <Divider />
        <ToggleRow
          icon={<Text>★</Text>}
          variant='gold'
          title='Show bidding hints'
          sub='Suggestions based on your 5-card hand'
          value={showHints}
          onToggle={setShowHints}
        />
      </Card>
    </>
  );
}

// ─── Panel: Scoring ───────────────────────────────────────────────────────────

const WIN_LEVELS = [7, 20, 30, 50, 70, 100];

function ScoringPanel() {
  const winThreshold = useSettingsStore((s) => s.winThreshold);
  const setWinThreshold = useSettingsStore((s) => s.setWinThreshold);

  const winIdx =
    WIN_LEVELS.indexOf(winThreshold) === -1
      ? 1
      : WIN_LEVELS.indexOf(winThreshold);

  const cycleThreshold = () => {
    const nextIdx = (winIdx + 1) % WIN_LEVELS.length;
    setWinThreshold(WIN_LEVELS[nextIdx]);
  };

  return (
    <>
      <SectionLabel label='Win condition' />
      <View style={s.scoreGrid}>
        <View style={s.scoreBox}>
          <Text style={s.scoreLabel}>Win at</Text>
          <Text style={s.scoreValue}>+{winThreshold}</Text>
          <Text style={s.scoreSub}>cumulative points</Text>
        </View>
        <View style={s.scoreBox}>
          <Text style={s.scoreLabel}>Lose at</Text>
          <Text style={[s.scoreValue, { color: '#E57373' }]}>
            −{winThreshold}
          </Text>
          <Text style={s.scoreSub}>cumulative points</Text>
        </View>
      </View>
      <Card>
        <TouchableOpacity
          style={s.row}
          onPress={cycleThreshold}
          activeOpacity={0.7}
        >
          <IconWrap variant='green'>
            <Text style={{ color: colors.felt400, fontSize: 14 }}>+</Text>
          </IconWrap>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Win threshold</Text>
            <Text style={s.rowSub}>
              Tap to cycle: {WIN_LEVELS.join(' / ')} points
            </Text>
          </View>
          <View style={s.rowRight}>
            <MotiView
              key={winThreshold}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
            >
              <Text style={s.valueText}>{winThreshold} pts</Text>
            </MotiView>
            <Chevron />
          </View>
        </TouchableOpacity>
      </Card>
      <SectionLabel label='Round scoring reference' />
      <Card>
        {[
          {
            label: 'Bid 7–9 success',
            badge: '+bid',
            badgeColor: colors.felt400,
          },
          { label: 'Bid 7–9 failure', badge: '−bid', badgeColor: '#E57373' },
          {
            label: 'Bid 10 success (all tricks)',
            badge: '+13 ★',
            badgeColor: colors.gold500,
          },
          {
            label: 'Opponents score 4+',
            badge: '+4',
            badgeColor: colors.felt400,
          },
          {
            label: 'Opponents score below 4',
            badge: '−4',
            badgeColor: '#E57373',
          },
        ].map((item, i, arr) => (
          <View key={item.label}>
            <View style={s.row}>
              <View style={s.rowBody}>
                <Text style={s.rowTitle}>{item.label}</Text>
              </View>
              <View style={[s.badge, { borderColor: `${item.badgeColor}44` }]}>
                <Text style={[s.badgeText, { color: item.badgeColor }]}>
                  {item.badge}
                </Text>
              </View>
            </View>
            {i < arr.length - 1 && <Divider />}
          </View>
        ))}
      </Card>
    </>
  );
}

// ─── Panel: Table ─────────────────────────────────────────────────────────────

function TablePanel() {
  const [dealAnim, setDealAnim] = useState(true);
  const [playAnim, setPlayAnim] = useState(true);
  return (
    <>
      <SectionLabel label='Appearance' />
      <Card>
        <ValueRow
          icon={<Text>◉</Text>}
          variant='green'
          title='Table felt'
          sub='Background color'
          values={['Classic Felt', 'Midnight', 'Burgundy', 'Navy']}
        />
        <Divider />
        <ValueRow
          icon={<Text>🃏</Text>}
          variant='ivory'
          title='Card back'
          sub='Pattern on card backs'
          values={['Classic', 'Diamond', 'Minimal']}
        />
        <Divider />
        <ValueRow
          icon={<Text>⊡</Text>}
          variant='ivory'
          title='Card size'
          sub='Size of cards on table'
          values={['Standard', 'Large', 'Accessible']}
        />
      </Card>
      <SectionLabel label='Animations' />
      <Card>
        <ToggleRow
          icon={<Text>✦</Text>}
          variant='gold'
          title='Deal animation'
          sub='Animate cards dealt at round start'
          value={dealAnim}
          onToggle={setDealAnim}
        />
        <Divider />
        <ToggleRow
          icon={<Text>↗</Text>}
          variant='gold'
          title='Play animations'
          sub='Animate cards played to table'
          value={playAnim}
          onToggle={setPlayAnim}
        />
      </Card>
    </>
  );
}

// ─── Panel: Sound ─────────────────────────────────────────────────────────────

function SoundPanel() {
  const [cardSound, setCardSound] = useState(true);
  const [bidSound, setBidSound] = useState(true);
  const [fanfare, setFanfare] = useState(false);
  const [haptics, setHaptics] = useState(false);
  return (
    <>
      <SectionLabel label='Sound effects' />
      <Card>
        <ToggleRow
          icon={<Text>🔊</Text>}
          variant='gold'
          title='Card play sounds'
          sub='Sound on each card played'
          value={cardSound}
          onToggle={setCardSound}
        />
        <Divider />
        <ToggleRow
          icon={<Text>★</Text>}
          variant='gold'
          title='Bid placed sound'
          sub='Audio cue when a player bids'
          value={bidSound}
          onToggle={setBidSound}
        />
        <Divider />
        <ToggleRow
          icon={<Text>♫</Text>}
          variant='gold'
          title='Round end fanfare'
          sub='Music sting at round completion'
          value={fanfare}
          onToggle={setFanfare}
        />
      </Card>
      <SectionLabel label='Haptics' />
      <Card>
        <ToggleRow
          icon={<Text>📳</Text>}
          variant='ivory'
          title='Haptic feedback'
          sub='Vibration on card plays and bids'
          value={haptics}
          onToggle={setHaptics}
        />
      </Card>
    </>
  );
}

// ─── Panel: About ─────────────────────────────────────────────────────────────

function AboutPanel() {
  return (
    <>
      <SectionLabel label='App info' />
      <Card>
        <NavRow
          icon={<Text>ℹ</Text>}
          variant='ivory'
          title='Version'
          badge='1.2.3'
        />
        <Divider />
        <NavRow icon={<Text>🔗</Text>} variant='ivory' title='Privacy policy' />
        <Divider />
        <NavRow
          icon={<Text>📖</Text>}
          variant='ivory'
          title='How to play'
          sub='Full rules for Italian Bridge'
        />
      </Card>
      <SectionLabel label='Danger zone' />
      <Card>
        <NavRow
          icon={<Text>🗑</Text>}
          variant='red'
          title='Reset all settings'
          sub='Restore all defaults'
          titleColor='#E57373'
        />
        <Divider />
        <NavRow
          icon={<Text>✕</Text>}
          variant='red'
          title='Reset scores'
          sub='Clear all cumulative scores'
          titleColor='#E57373'
        />
      </Card>
      <Text style={s.version}>Italian Bridge · v1.2.3 · © 2025</Text>
    </>
  );
}

// ─── Panels map ───────────────────────────────────────────────────────────────

const PANELS: Record<SectionId, React.ReactNode> = {
  player: <PlayerPanel />,
  bidding: <BiddingPanel />,
  gameplay: <GameplayPanel />,
  scoring: <ScoringPanel />,
  table: <TablePanel />,
  sound: <SoundPanel />,
  about: <AboutPanel />,
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<SectionId>('player');

  return (
    <View
      style={[
        s.screen,
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: 4 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <View style={s.backArrow} />
        </TouchableOpacity>
        <MotiView
          from={{ opacity: 0, translateX: 12 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Text style={s.headerTitle}>
            Set<Text style={{ color: colors.gold500 }}>tings</Text>
          </Text>
          <View style={s.titleRule} />
        </MotiView>
      </View>

      {/* Body — left nav + right content */}
      <View style={s.body}>
        {/* Left nav */}
        <View>
          <ScrollView
            style={s.leftNav}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.navItem, active === item.id && s.navItemActive]}
                onPress={() => setActive(item.id)}
                activeOpacity={0.7}
              >
                <View style={s.navText}>
                  <Text
                    style={[s.navLabel, active === item.id && s.navLabelActive]}
                  >
                    {item.label}
                  </Text>
                  <Text style={s.navSub}>{item.sub}</Text>
                </View>
                {active === item.id && <View style={s.navIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right content */}
        <ScrollView
          style={s.content}
          contentContainerStyle={s.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            key={active}
            from={{ opacity: 0, translateX: 8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 18 }}
          >
            {PANELS[active]}
          </MotiView>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.felt900,
    flexDirection: 'column',
  },
  cornerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.felt600,
    zIndex: 10,
  },
  topBar: {
    backgroundColor: colors.felt800,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61,184,122,0.2)',
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(61,184,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.felt400,
    marginLeft: 2,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.felt400,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ivory300,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  titleRule: {
    width: 22,
    height: 2,
    backgroundColor: colors.gold500,
    marginTop: 3,
  },
  body: { flex: 1, flexDirection: 'row' },
  leftNav: {
    width: 148,
    backgroundColor: colors.felt800,
    borderRightWidth: 1,
    borderRightColor: 'rgba(61,184,122,0.14)',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    position: 'relative',
  },
  navItemActive: { backgroundColor: 'rgba(61,184,122,0.1)' },
  navText: { flex: 1 },
  navLabel: { fontSize: 12, fontWeight: '600', color: colors.ivory500 },
  navLabelActive: { color: colors.ivory300 },
  navSub: { fontSize: 10, color: colors.felt300, marginTop: 1 },
  navIndicator: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 2,
    backgroundColor: colors.felt400,
    borderRadius: 2,
  },
  content: { flex: 1 },
  contentInner: { padding: 14, paddingBottom: 24 },
  sLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.felt400,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 7,
    marginTop: 1,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: colors.felt800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.15)',
    overflow: 'hidden',
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(61,184,122,0.08)',
    marginHorizontal: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 13,
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 12.5, fontWeight: '600', color: colors.ivory300 },
  rowSub: { fontSize: 10, color: colors.felt300, marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  valueText: { fontSize: 11, color: colors.felt300, fontWeight: '500' },
  chevron: {
    width: 5,
    height: 5,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(125,212,168,0.4)',
    transform: [{ rotate: '45deg' }],
  },
  badge: {
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  profileCard: {
    backgroundColor: colors.felt800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.2)',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.felt700,
    borderWidth: 2,
    borderColor: 'rgba(239,159,39,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: colors.gold400 },
  profileName: { fontSize: 13, fontWeight: '700', color: colors.ivory300 },
  profileSub: { fontSize: 10, color: colors.felt300, marginTop: 2 },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.28)',
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold500,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  seatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.felt800,
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.14)',
    borderRadius: 9,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  seatCardHuman: { borderColor: 'rgba(239,159,39,0.26)' },
  seatAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  seatAvatarHuman: {
    backgroundColor: colors.felt700,
    borderColor: 'rgba(239,159,39,0.32)',
  },
  seatAvatarBot: {
    backgroundColor: 'rgba(61,184,122,0.1)',
    borderColor: 'rgba(61,184,122,0.18)',
  },
  seatAvatarText: { fontSize: 10, fontWeight: '800' },
  seatAvatarTextHuman: { color: colors.gold400 },
  seatAvatarTextBot: { color: colors.felt300 },
  seatName: { fontSize: 11, fontWeight: '600', color: colors.ivory300 },
  seatRole: { fontSize: 9, color: colors.felt300, marginTop: 1 },
  infoBox: {
    backgroundColor: 'rgba(239,159,39,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.15)',
    borderRadius: 8,
    padding: 9,
    marginTop: 8,
  },
  infoText: { fontSize: 10, color: 'rgba(245,243,235,0.6)', lineHeight: 15 },
  scoreGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.felt800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.14)',
    padding: 11,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.felt300,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: { fontSize: 22, fontWeight: '900', color: colors.gold500 },
  scoreSub: { fontSize: 9, color: 'rgba(125,212,168,0.45)', marginTop: 2 },
  version: {
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(125,212,168,0.25)',
    letterSpacing: 0.7,
    marginTop: 16,
  },
});
