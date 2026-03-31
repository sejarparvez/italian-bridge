import { MotiView } from 'moti';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { C } from '@/constants/theme';
import { ActiveHalo } from '@/game/ui/active-halo';
import TeamScoreBadge from '@/game/ui/team-score-badge';

interface GamePlayerBarProps {
  playerName: string;
  isPlayerActive: boolean;
  btTricks: number;
  btIsBidding: boolean;
  winningBid: number | null;
}

export default function GamePlayerBar({
  playerName,
  isPlayerActive,
  btTricks,
  btIsBidding,
  winningBid,
}: GamePlayerBarProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, delay: 240 }}
      className='flex-row items-center justify-between px-4 pb-1 left-6 mb-0.5'
    >
      <HStack className='items-center gap-2.5'>
        <View className='items-center justify-center' style={{ width: 42, height: 42 }}>
          {isPlayerActive && <ActiveHalo size={38} />}
          <View
            className='items-center justify-center rounded-full'
            style={[
              { width: 38, height: 38, borderRadius: 19, borderWidth: 2 },
              isPlayerActive
                ? { borderColor: C.gold, backgroundColor: C.goldAccent }
                : { borderColor: C.white10, backgroundColor: C.white05 },
            ]}
          >
            <Text
              className='font-black text-xs'
              style={{ color: 'rgba(240,220,160,0.6)' }}
            >
              {playerName[0].toUpperCase()}
            </Text>
          </View>
        </View>
        <VStack>
          <Text
            className='font-extrabold uppercase tracking-wide'
            style={{
              fontSize: 11,
              color: 'rgba(240,220,160,0.7)',
              letterSpacing: 0.5,
            }}
          >
            {playerName}
          </Text>
          <TeamScoreBadge
            tricks={btTricks}
            bid={btIsBidding ? winningBid : null}
            isBiddingTeam={btIsBidding}
            active={isPlayerActive}
          />
        </VStack>
      </HStack>
    </MotiView>
  );
}