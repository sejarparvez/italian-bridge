import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { C } from '@/constants/theme';
import { ActiveHalo } from './active-halo';
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

  return (
    <View
      className={`items-center ${isH ? 'flex-row' : 'flex-col'} py-1 gap-2 rounded-full`}
    >
      {active && (
        <View
          style={{
            position: 'absolute',
            alignSelf: isH ? undefined : 'center',
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
    </View>
  );
}
