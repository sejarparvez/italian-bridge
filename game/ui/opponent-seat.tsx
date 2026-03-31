import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { C } from "@/constants/theme";
import { MotiView } from "moti";
import { Animated } from "react-native";
import { ActiveHalo } from "./active-halo";
import { useShimmer } from "./hooks";
export default function OpponentSeat({
  name,
  active,
  orientation = 'vertical',
  scoreBadge,
}: {
  name: string;
  active: boolean;
  orientation?: 'vertical' | 'horizontal';
  scoreBadge?: React.ReactNode;
}) {
  const isH = orientation === 'horizontal';
  const borderShimmer = useShimmer(2200, 100);

  return (
    <View
      className={[
        'items-center p-2 rounded-2xl border relative',
        isH ? 'flex-row px-2.5' : '',
        active ? 'border-[rgba(200,168,64,0.25)]' : 'border-transparent',
      ].join(' ')}
      style={[
        { minWidth: 64 },
        active ? { backgroundColor: C.goldFaint } : undefined,
      ]}
    >
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: C.gold,
            opacity: borderShimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.5],
            }),
          }}
        />
      )}
      {active && (
        <View
          style={{
            position: 'absolute',
            left: isH ? 8 : undefined,
            alignSelf: isH ? undefined : 'center',
            top: isH ? 8 : 8,
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActiveHalo size={34} />
        </View>
      )}
      <View
        className='items-center justify-center rounded-full'
        style={[
          { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
          active
            ? { borderColor: C.gold, backgroundColor: C.goldAccent }
            : { borderColor: C.white10, backgroundColor: C.white05 },
        ]}
      >
        <Text
          className='font-black text-xs'
          style={{ color: 'rgba(240,220,160,0.6)' }}
        >
          {name[0].toUpperCase()}
        </Text>
      </View>
      <View className={isH ? 'ml-2' : 'mt-1.5 items-center'}>
        <Text
          className='text-[9px] font-bold uppercase tracking-wide'
          style={{
            maxWidth: 60,
            color: active ? 'rgba(240,220,160,0.9)' : 'rgba(255,255,255,0.3)',
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        {scoreBadge}
      </View>
      {active && (
        <>
          <MotiView
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ loop: true, duration: 900, type: 'timing' }}
            className='absolute top-1.5 right-1.5 w-2 h-2 rounded-full'
            style={{ backgroundColor: C.gold }}
          />
          <MotiView
            from={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            transition={{ loop: true, duration: 1100, type: 'timing' }}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: C.gold,
            }}
          />
        </>
      )}
    </View>
  );
}