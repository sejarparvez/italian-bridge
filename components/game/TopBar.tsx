import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

interface TopBarProps {
  onMenuPress: () => void;
  topInset: number;
}

export function TopBar({ onMenuPress, topInset }: TopBarProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 100 }}
      style={[styles.topBar, { paddingTop: topInset + 8 }]}
    >
      <View style={styles.teamBar}>
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: colors.gold500 }]} />
          <Text style={styles.teamLabel}>Us</Text>
          <Text style={[styles.teamPoints, { color: colors.gold500 }]}>47</Text>
        </View>
        <View style={styles.teamBarDivider} />
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: colors.felt400 }]} />
          <Text style={styles.teamLabel}>Them</Text>
          <Text style={[styles.teamPoints, { color: colors.felt400 }]}>31</Text>
        </View>
      </View>

      <View style={styles.topBarRight}>
        <View style={styles.trumpBadge}>
          <Text style={styles.trumpLabel}>TRUMP</Text>
          <Text style={styles.trumpSuit}>♠</Text>
        </View>
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

const styles = StyleSheet.create({
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
    color: colors.felt300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  teamPoints: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  teamBarDivider: { width: 1, height: 20, backgroundColor: colors.felt600 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.felt800,
    borderWidth: 1,
    borderColor: colors.gold500,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trumpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  trumpSuit: { fontSize: 15, color: colors.suitBlack },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  menuBtnPressed: { backgroundColor: colors.felt600 },
  menuBtnLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.felt300,
  },
});
