import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { C } from '@/constants/theme';
import { MotiView } from 'moti';
import { Dimensions, Pressable, View } from 'react-native';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;



export default function TrumpIntentModal({
  trumpSuit,
  trumpSymbol,
  onTrump,
  onDiscard,
}: {
  trumpSuit: string;
  trumpSymbol: string;
  onTrump: () => void;
  onDiscard: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.88, translateY: 24 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
      style={{
        position: 'absolute',
        bottom: CARD_H * 0.72 + 12,
        alignSelf: 'center',
        zIndex: 100,
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Context label */}
      <View
        style={{
          backgroundColor: 'rgba(0,0,0,0.72)',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: C.goldDim,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: 'rgba(240,220,160,0.75)',
            fontWeight: '700',
            letterSpacing: 0.8,
            textAlign: 'center',
          }}
        >
          You have no {trumpSuit} — trump or discard?
        </Text>
      </View>

      {/* Action buttons */}
      <HStack style={{ gap: 10 }}>
        {/* Trump button */}
        <Pressable
          onPress={onTrump}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 14,
            backgroundColor: C.gold,
            shadowColor: C.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.55,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 16 }}>{trumpSymbol}</Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '900',
              color: '#07130D',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Trump
          </Text>
        </Pressable>

        {/* Discard button */}
        <Pressable
          onPress={onDiscard}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 14,
            backgroundColor: C.white05,
            borderWidth: 1,
            borderColor: C.white10,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Discard
          </Text>
        </Pressable>
      </HStack>
    </MotiView>
  );
}