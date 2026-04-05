import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { ScoreChip } from './ScoreChip';

interface PlayerBadgeProps {
  name: string;
  score: number;
  bid: number;
  isActive?: boolean;
}

export function TopPlayerBadge({
  name,
  score,
  bid,
  isActive,
}: PlayerBadgeProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 200, type: 'spring', damping: 18 }}
      style={styles.topPlayerBadge}
    >
      <View style={[styles.topAvatarRing, { borderColor: colors.felt400 }]}>
        <View style={[styles.topAvatar, { backgroundColor: colors.felt800 }]}>
          <Text style={styles.topAvatarInitial}>{name[0]}</Text>
        </View>
        {isActive && (
          <View
            style={[styles.activeDot, { backgroundColor: colors.felt400 }]}
          />
        )}
      </View>
      <Text style={styles.topPlayerName}>{name}</Text>
      <ScoreChip score={score} bid={bid} />
    </MotiView>
  );
}

interface SidePlayerBadgeProps extends PlayerBadgeProps {
  team: 'us' | 'them';
  flip?: boolean;
}

export function SidePlayerBadge({
  name,
  score,
  bid,
  isActive,
  team,
  flip,
}: SidePlayerBadgeProps) {
  const teamColor = team === 'us' ? colors.gold500 : colors.felt400;
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
            { backgroundColor: team === 'us' ? '#4A2800' : colors.felt800 },
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

export function UserPanel() {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: 300, type: 'spring', damping: 18 }}
      style={styles.userPanel}
    >
      <View style={[styles.userAvatarRing, { borderColor: colors.gold500 }]}>
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

const styles = StyleSheet.create({
  topPlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,51,35,0.82)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.felt600,
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
  topAvatarInitial: { fontSize: 11, fontWeight: '900', color: colors.ivory400 },
  topPlayerName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.felt300,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    borderColor: colors.felt600,
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
  sideAvatarInitial: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ivory400,
  },
  sidePlayerInfo: { gap: 2 },
  sidePlayerName: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.felt300,
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
    borderColor: colors.felt900,
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
    borderColor: colors.gold600,
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
  userAvatarInitial: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ivory400,
  },
  userInfo: { gap: 3 },
  userName: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold400,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
