import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

const NAV_ITEMS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'player', label: 'Player', icon: '◈' },
  { id: 'bidding', label: 'Bidding', icon: '◆' },
  { id: 'gameplay', label: 'Gameplay', icon: '▷' },
  { id: 'scoring', label: 'Scoring', icon: '◉' },
  { id: 'table', label: 'Table', icon: '⬡' },
  { id: 'sound', label: 'Sound', icon: '♪' },
  { id: 'about', label: 'About', icon: 'ⓘ' },
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

type IconVariant = 'green' | 'gold' | 'ivory' | 'red';

const iconWrapColors: Record<
  IconVariant,
  { bg: string; border: string; iconColor: string }
> = {
  green: {
    bg: 'rgba(34,153,102,0.18)',
    border: 'rgba(61,184,122,0.25)',
    iconColor: colors.felt300,
  },
  gold: {
    bg: 'rgba(239,159,39,0.15)',
    border: 'rgba(239,159,39,0.25)',
    iconColor: colors.gold400,
  },
  ivory: {
    bg: 'rgba(245,243,235,0.07)',
    border: 'rgba(245,243,235,0.12)',
    iconColor: colors.ivory500,
  },
  red: {
    bg: 'rgba(192,57,43,0.14)',
    border: 'rgba(192,57,43,0.22)',
    iconColor: '#E57373',
  },
};

function IconWrap({
  variant,
  children,
}: {
  variant: IconVariant;
  children: React.ReactNode;
}) {
  const c = iconWrapColors[variant];
  return (
    <View
      style={[s.iconWrap, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      {children}
    </View>
  );
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
        trackColor={{ false: 'rgba(255,255,255,0.07)', true: colors.felt500 }}
        thumbColor={value ? colors.ivory300 : colors.ivory500}
        ios_backgroundColor='rgba(255,255,255,0.07)'
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
      activeOpacity={0.75}
    >
      <IconWrap variant={variant}>{icon}</IconWrap>
      <View style={s.rowBody}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <View style={s.rowRight}>
        <MotiView
          key={idx}
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        >
          <Text style={s.valueChip}>{values[idx]}</Text>
        </MotiView>
        <View style={s.chevron} />
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
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      <IconWrap variant={variant}>{icon}</IconWrap>
      <View style={s.rowBody}>
        <Text style={[s.rowTitle, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
        {sub && (
          <Text
            style={[
              s.rowSub,
              titleColor ? { color: 'rgba(229,115,115,0.65)' } : null,
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
        <View style={s.chevron} />
      )}
    </TouchableOpacity>
  );
}

function PlayerPanel() {
  const userName = useSettingsStore((s) => s.userName);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const seats = [
    {
      id: 'B2',
      name: 'Bot 2',
      role: 'North · Team A',
      direction: 'N',
      isHuman: false,
      isPartner: true,
    },
    {
      id: 'B1',
      name: 'Bot 1',
      role: 'West · Team B',
      direction: 'W',
      isHuman: false,
      isPartner: false,
    },
    {
      id: 'P1',
      name: 'You',
      role: 'South · Team A',
      direction: 'S',
      isHuman: true,
      isPartner: false,
    },
    {
      id: 'B3',
      name: 'Bot 3',
      role: 'East · Team B',
      direction: 'E',
      isHuman: false,
      isPartner: false,
    },
  ];

  const handleSave = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    } else {
      setTempName(userName);
    }
    setEditing(false);
  };

  return (
    <>
      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{userName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              style={[s.profileName, s.nameInput]}
              value={tempName}
              onChangeText={setTempName}
              autoFocus
              onBlur={handleSave}
              onSubmitEditing={handleSave}
              selectTextOnFocus
            />
          ) : (
            <Text style={s.profileName}>{userName}</Text>
          )}
          <Text style={s.profileSub}>Human · South · Team A</Text>
        </View>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => {
            if (editing) {
              handleSave();
            } else {
              setTempName(userName);
              setEditing(true);
            }
          }}
        >
          <Text style={s.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <SectionLabel label='Seat arrangement' />

      {/* Compass table layout */}
      <View style={s.compassWrap}>
        {/* Top row — North */}
        <View style={s.compassRow}>
          <View style={s.compassSpacer} />
          {seats
            .filter((s) => s.direction === 'N')
            .map((seat) => (
              <SeatTile key={seat.id} seat={seat} />
            ))}
          <View style={s.compassSpacer} />
        </View>
        {/* Middle row — West / South / East */}
        <View style={s.compassRow}>
          {seats
            .filter((s) => s.direction === 'W')
            .map((seat) => (
              <SeatTile key={seat.id} seat={seat} />
            ))}
          <View style={s.tableCenter}>
            <Text style={s.tableLabel}>TABLE</Text>
          </View>
          {seats
            .filter((s) => s.direction === 'E')
            .map((seat) => (
              <SeatTile key={seat.id} seat={seat} />
            ))}
        </View>
        {/* Bottom row — South */}
        <View style={s.compassRow}>
          <View style={s.compassSpacer} />
          {seats
            .filter((s) => s.direction === 'S')
            .map((seat) => (
              <SeatTile key={seat.id} seat={seat} />
            ))}
          <View style={s.compassSpacer} />
        </View>
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoText}>
          Turn order is{' '}
          <Text style={{ color: colors.gold400, fontWeight: '600' }}>
            clockwise
          </Text>
          : You → Bot 1 → Bot 2 → Bot 3. Dealer rotates each round.
        </Text>
      </View>
    </>
  );
}

function SeatTile({
  seat,
}: {
  seat: {
    id: string;
    name: string;
    role: string;
    isHuman: boolean;
    isPartner: boolean;
  };
}) {
  return (
    <View
      style={[
        s.seatTile,
        seat.isHuman && s.seatTileHuman,
        seat.isPartner && s.seatTilePartner,
      ]}
    >
      <View
        style={[
          s.seatDot,
          seat.isHuman
            ? s.seatDotHuman
            : seat.isPartner
              ? s.seatDotPartner
              : s.seatDotBot,
        ]}
      >
        <Text
          style={[
            s.seatDotText,
            seat.isHuman ? s.seatDotTextHuman : s.seatDotTextBot,
          ]}
        >
          {seat.id}
        </Text>
      </View>
      <Text style={s.seatName} numberOfLines={1}>
        {seat.name}
      </Text>
      <Text style={s.seatRole} numberOfLines={1}>
        {seat.role.split('·')[0].trim()}
      </Text>
    </View>
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
          icon={<Text style={s.iconText}>★</Text>}
          variant='gold'
          title='Minimum bid'
          sub='Lowest allowed opening bid'
          values={['7', '8']}
        />
        <Divider />
        <NavRow
          icon={<Text style={s.iconText}>↑</Text>}
          variant='gold'
          title='Maximum bid'
          sub='Wins all tricks for +13 bonus'
          badge='10 fixed'
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>⏱</Text>}
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
          icon={<Text style={s.iconText}>◉</Text>}
          variant='gold'
          title='Allow human peek'
          sub='View trump privately if you won the bid'
          value={allowPeek}
          onToggle={setAllowPeek}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>✓</Text>}
          variant='green'
          title='Show trump reveal dialog'
          sub='Prompt before revealing trump on first play'
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
          icon={<Text style={s.iconText}>▣</Text>}
          variant='green'
          title='Phase 1 cards'
          sub='Dealt before bidding'
          badge='5 fixed'
        />
        <Divider />
        <NavRow
          icon={<Text style={s.iconText}>▣</Text>}
          variant='green'
          title='Phase 2 cards'
          sub='Dealt after trump is chosen'
          badge='8 fixed'
        />
      </Card>
      <SectionLabel label='Tricks' />
      <Card>
        <ToggleRow
          icon={<Text style={s.iconText}>✦</Text>}
          variant='green'
          title='Highlight valid cards'
          sub='Show legally playable cards'
          value={highlightCards}
          onToggle={setHighlightCards}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>✓</Text>}
          variant='green'
          title='Show trick winner'
          sub='Brief highlight when a trick is won'
          value={showWinner}
          onToggle={setShowWinner}
        />
        <Divider />
        <ValueRow
          icon={<Text style={s.iconText}>▷</Text>}
          variant='gold'
          title='Bot play speed'
          sub='How fast bots play their cards'
          values={['Slow', 'Normal', 'Fast']}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>★</Text>}
          variant='gold'
          title='Bidding hints'
          sub='Suggestions based on your 5-card hand'
          value={showHints}
          onToggle={setShowHints}
        />
      </Card>
    </>
  );
}

// ─── Panel: Scoring ───────────────────────────────────────────────────────────

const WIN_LEVELS = [30, 50, 70, 100];

function ScoringPanel() {
  const winThreshold = useSettingsStore((s) => s.winThreshold);
  const setWinThreshold = useSettingsStore((s) => s.setWinThreshold);
  const winIdx =
    WIN_LEVELS.indexOf(winThreshold) === -1
      ? 1
      : WIN_LEVELS.indexOf(winThreshold);

  return (
    <>
      <SectionLabel label='Win condition' />
      <View style={s.scoreGrid}>
        <View style={s.scoreBox}>
          <Text style={s.scoreBoxLabel}>WIN AT</Text>
          <MotiView
            key={`win-${winThreshold}`}
            from={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
          >
            <Text style={[s.scoreBoxValue, { color: colors.felt400 }]}>
              +{winThreshold}
            </Text>
          </MotiView>
          <Text style={s.scoreBoxSub}>cumulative pts</Text>
        </View>
        <View style={s.scoreBox}>
          <Text style={s.scoreBoxLabel}>LOSE AT</Text>
          <MotiView
            key={`lose-${winThreshold}`}
            from={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
          >
            <Text style={[s.scoreBoxValue, { color: '#E57373' }]}>
              −{winThreshold}
            </Text>
          </MotiView>
          <Text style={s.scoreBoxSub}>cumulative pts</Text>
        </View>
      </View>

      <Card>
        <TouchableOpacity
          style={s.row}
          onPress={() => {
            const next = (winIdx + 1) % WIN_LEVELS.length;
            setWinThreshold(WIN_LEVELS[next]);
          }}
          activeOpacity={0.75}
        >
          <IconWrap variant='green'>
            <Text style={[s.iconText, { color: colors.felt400 }]}>◈</Text>
          </IconWrap>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Win threshold</Text>
            <Text style={s.rowSub}>
              Tap to cycle: {WIN_LEVELS.join(' / ')} pts
            </Text>
          </View>
          <View style={s.rowRight}>
            <MotiView
              key={winThreshold}
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18 }}
            >
              <Text style={s.valueChip}>{winThreshold} pts</Text>
            </MotiView>
            <View style={s.chevron} />
          </View>
        </TouchableOpacity>
      </Card>

      <SectionLabel label='Round scoring reference' />
      <Card>
        {[
          { label: 'Bid 7–9 success', badge: '+bid', color: colors.felt400 },
          { label: 'Bid 7–9 failure', badge: '−bid', color: '#E57373' },
          {
            label: 'Bid 10 success (all tricks)',
            badge: '+13 ★',
            color: colors.gold500,
          },
          { label: 'Opponents score 4+', badge: '+4', color: colors.felt400 },
          { label: 'Opponents score below 4', badge: '−4', color: '#E57373' },
        ].map((item, i, arr) => (
          <View key={item.label}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{item.label}</Text>
              </View>
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor: `${item.color}18`,
                    borderColor: `${item.color}30`,
                  },
                ]}
              >
                <Text style={[s.badgeText, { color: item.color }]}>
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
          icon={<Text style={s.iconText}>◉</Text>}
          variant='green'
          title='Table felt'
          sub='Background color'
          values={['Classic Felt', 'Midnight', 'Burgundy', 'Navy']}
        />
        <Divider />
        <ValueRow
          icon={<Text style={s.iconText}>⬡</Text>}
          variant='ivory'
          title='Card back'
          sub='Pattern on card backs'
          values={['Classic', 'Diamond', 'Minimal']}
        />
        <Divider />
        <ValueRow
          icon={<Text style={s.iconText}>⊡</Text>}
          variant='ivory'
          title='Card size'
          sub='Size of cards on table'
          values={['Standard', 'Large', 'Accessible']}
        />
      </Card>
      <SectionLabel label='Animations' />
      <Card>
        <ToggleRow
          icon={<Text style={s.iconText}>✦</Text>}
          variant='gold'
          title='Deal animation'
          sub='Animate cards at round start'
          value={dealAnim}
          onToggle={setDealAnim}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>↗</Text>}
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
          icon={<Text style={s.iconText}>♪</Text>}
          variant='gold'
          title='Card play sounds'
          sub='Sound on each card played'
          value={cardSound}
          onToggle={setCardSound}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>★</Text>}
          variant='gold'
          title='Bid placed sound'
          sub='Audio cue when a player bids'
          value={bidSound}
          onToggle={setBidSound}
        />
        <Divider />
        <ToggleRow
          icon={<Text style={s.iconText}>♫</Text>}
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
          icon={<Text style={s.iconText}>◈</Text>}
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
          icon={<Text style={s.iconText}>ⓘ</Text>}
          variant='ivory'
          title='Version'
          badge='1.2.3'
        />
        <Divider />
        <NavRow
          icon={<Text style={s.iconText}>◈</Text>}
          variant='ivory'
          title='Privacy policy'
        />
        <Divider />
        <NavRow
          icon={<Text style={s.iconText}>▣</Text>}
          variant='ivory'
          title='How to play'
          sub='Full rules for Italian Bridge'
        />
      </Card>
      <SectionLabel label='Danger zone' />
      <Card>
        <NavRow
          icon={<Text style={[s.iconText, { color: '#E57373' }]}>✕</Text>}
          variant='red'
          title='Reset all settings'
          sub='Restore all defaults'
          titleColor='#E57373'
        />
        <Divider />
        <NavRow
          icon={<Text style={[s.iconText, { color: '#E57373' }]}>✕</Text>}
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
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <View style={s.backArrow} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Settings</Text>
          <View style={s.titleRule} />
        </View>
      </View>

      {/* Body */}
      <View style={s.body}>
        {/* Left nav rail */}
        <View style={s.navRail}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 6 }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.navItem, isActive && s.navItemActive]}
                  onPress={() => setActive(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.navIcon, isActive && s.navIconActive]}>
                    {item.icon}
                  </Text>
                  <Text style={[s.navLabel, isActive && s.navLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={s.navIndicator} />}
                </TouchableOpacity>
              );
            })}
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
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
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
  // ── Screen shell ──────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.felt900,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: colors.felt800,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(61,184,122,0.22)',
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(61,184,122,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,184,122,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.felt300,
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ivory300,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  titleRule: {
    width: 18,
    height: 2,
    backgroundColor: colors.gold500,
    borderRadius: 1,
    marginTop: 3,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  body: { flex: 1, flexDirection: 'row' },

  // ── Nav rail ──────────────────────────────────────────────────────────────
  navRail: {
    width: 110,
    backgroundColor: colors.felt800,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(61,184,122,0.14)',
  },
  navItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(61,184,122,0.09)',
  },
  navIcon: {
    fontSize: 13,
    color: colors.felt300,
    width: 16,
    textAlign: 'center',
  },
  navIconActive: {
    color: colors.felt400,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ivory500,
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: colors.ivory300,
    fontWeight: '700',
  },
  navIndicator: {
    position: 'absolute',
    right: 0,
    top: '15%',
    bottom: '15%',
    width: 2,
    backgroundColor: colors.felt400,
    borderRadius: 1,
  },

  // ── Content area ──────────────────────────────────────────────────────────
  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 32 },

  // ── Section label ─────────────────────────────────────────────────────────
  sLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.felt400,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
    paddingLeft: 3,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.felt800,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,184,122,0.16)',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(61,184,122,0.1)',
    marginHorizontal: 12,
  },

  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 11,
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    color: colors.felt300,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ivory300,
    letterSpacing: 0.1,
  },
  rowSub: {
    fontSize: 10,
    color: colors.felt300,
    marginTop: 1.5,
    letterSpacing: 0.1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  valueChip: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold400,
    backgroundColor: 'rgba(239,159,39,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,159,39,0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  chevron: {
    width: 5,
    height: 5,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(125,212,168,0.35)',
    transform: [{ rotate: '45deg' }],
  },
  badge: {
    backgroundColor: 'rgba(239,159,39,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,159,39,0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Player panel ──────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: colors.felt800,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,159,39,0.2)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 0,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(239,159,39,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,159,39,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold400,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ivory300,
    letterSpacing: 0.1,
  },
  nameInput: {
    backgroundColor: colors.felt800,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginHorizontal: -6,
    marginTop: -2,
    color: colors.ivory300,
  },
  profileSub: {
    fontSize: 10,
    color: colors.felt300,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,159,39,0.3)',
    backgroundColor: 'rgba(239,159,39,0.07)',
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold400,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Compass seat layout
  compassWrap: {
    gap: 4,
    marginBottom: 8,
  },
  compassRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    alignItems: 'center',
  },
  compassSpacer: {
    flex: 1,
  },
  tableCenter: {
    flex: 1,
    height: 58,
    backgroundColor: 'rgba(61,184,122,0.06)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,184,122,0.14)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(61,184,122,0.35)',
    letterSpacing: 2,
  },
  seatTile: {
    flex: 1,
    backgroundColor: colors.felt800,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,184,122,0.14)',
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  seatTileHuman: {
    borderColor: 'rgba(239,159,39,0.28)',
    backgroundColor: 'rgba(239,159,39,0.05)',
  },
  seatTilePartner: {
    borderColor: 'rgba(61,184,122,0.24)',
  },
  seatDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  seatDotHuman: {
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderColor: 'rgba(239,159,39,0.35)',
  },
  seatDotPartner: {
    backgroundColor: 'rgba(61,184,122,0.12)',
    borderColor: 'rgba(61,184,122,0.28)',
  },
  seatDotBot: {
    backgroundColor: 'rgba(61,184,122,0.08)',
    borderColor: 'rgba(61,184,122,0.16)',
  },
  seatDotText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  seatDotTextHuman: { color: colors.gold400 },
  seatDotTextBot: { color: colors.felt300 },
  seatName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ivory300,
  },
  seatRole: {
    fontSize: 9,
    color: colors.felt300,
  },

  // ── Info box ──────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: 'rgba(239,159,39,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,159,39,0.16)',
    borderRadius: 8,
    padding: 9,
    marginTop: 4,
  },
  infoText: {
    fontSize: 10.5,
    color: 'rgba(245,243,235,0.55)',
    lineHeight: 15,
  },

  // ── Score grid ────────────────────────────────────────────────────────────
  scoreGrid: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.felt800,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,184,122,0.14)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  scoreBoxLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(125,212,168,0.45)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreBoxValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  scoreBoxSub: {
    fontSize: 9,
    color: 'rgba(125,212,168,0.4)',
    marginTop: 3,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  version: {
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(125,212,168,0.22)',
    letterSpacing: 1,
    marginTop: 18,
  },
});
