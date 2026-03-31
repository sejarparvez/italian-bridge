import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Icon } from '@/components/ui/icon';
import { C } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, RefreshCw, Settings, X } from 'lucide-react-native';
import TrumpMiniCard from '@/game/ui/trump-mini-card';
import ScorePanel from '@/game/ui/score-panel';
import { useGameStore } from '@/store/gameStore';

interface GameHUDProps {
  trumpSuit: string | null;
  trumpRevealed: boolean;
  canPeek: boolean;
  teamScores: { BT: number; LR: number };
}

export default function GameHUD({ trumpSuit, trumpRevealed, canPeek, teamScores }: GameHUDProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startNewGame } = useGameStore();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, delay: 80 }}
      className='absolute left-6 right-0 flex-row justify-between items-center px-3.5 z-50'
      style={{ top: insets.top + 8 }}
    >
      <HStack space='4xl'>
        {trumpSuit && (trumpRevealed || canPeek) && (
          <TrumpMiniCard
            suit={trumpSuit}
            revealed={trumpRevealed}
            canPeek={canPeek}
          />
        )}
        <ScorePanel btScore={teamScores.BT} lrScore={teamScores.LR} />
      </HStack>

      <Menu
        offset={-20}
        trigger={({ ...triggerProps }) => (
          <Pressable
            {...triggerProps}
            className='w-9 h-9 rounded-full border items-center justify-center right-10'
            style={{ borderColor: C.goldDim, backgroundColor: C.goldFaint }}
          >
            <Icon as={Settings} size='sm' style={{ color: C.gold }} />
          </Pressable>
        )}
        style={{
          backgroundColor: '#0C1F14',
          borderWidth: 1,
          borderColor: 'rgba(200,168,64,0.25)',
          borderRadius: 14,
          padding: 6,
          minWidth: 160,
        }}
      >
        <MenuItem
          key='home'
          textValue='Home'
          className='rounded-xl py-2.5 px-3 gap-2.5'
          onPress={() => router.replace('/')}
        >
          <Icon as={Home} size='sm' style={{ color: C.goldDim }} />
          <MenuItemLabel
            className='font-semibold text-sm'
            style={{ color: 'rgba(232,213,163,0.85)' }}
          >
            Main Menu
          </MenuItemLabel>
        </MenuItem>
        <MenuItem
          key='new-game'
          textValue='New Game'
          className='rounded-xl py-2.5 px-3 gap-2.5'
          onPress={() => {
            startNewGame();
            router.replace('/bid');
          }}
        >
          <Icon as={RefreshCw} size='sm' style={{ color: C.goldDim }} />
          <MenuItemLabel
            className='font-semibold text-sm'
            style={{ color: 'rgba(232,213,163,0.85)' }}
          >
            Restart Game
          </MenuItemLabel>
        </MenuItem>
        <MenuItem
          key='close'
          textValue='Close'
          className='rounded-xl py-2.5 px-3 gap-2.5 mt-1 border-t'
          style={{ borderTopColor: 'rgba(200,168,64,0.1)' }}
        >
          <Icon as={X} size='sm' style={{ color: C.dangerDim }} />
          <MenuItemLabel
            className='font-semibold text-sm'
            style={{ color: C.danger }}
          >
            Close Menu
          </MenuItemLabel>
        </MenuItem>
      </Menu>
    </MotiView>
  );
}