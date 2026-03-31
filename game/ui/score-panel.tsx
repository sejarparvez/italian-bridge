import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { C } from '@/constants/theme';

export default function ScorePanel({
  btScore,
  lrScore,
}: {
  btScore: number;
  lrScore: number;
}) {
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <View
      className='flex-row items-center rounded-xl border overflow-hidden'
      style={{ borderColor: C.white10, backgroundColor: C.white05 }}
    >
      <View className='px-2.5 py-1 items-center' style={{ minWidth: 52 }}>
        <Text
          className='text-[7px] font-bold uppercase tracking-widest'
          style={{ color: 'rgba(200,168,64,0.45)' }}
        >
          US
        </Text>
        <Text
          className='text-sm font-black'
          style={{
            color:
              btScore > 0
                ? C.gold
                : btScore <= -20
                  ? C.danger
                  : 'rgba(240,220,160,0.4)',
          }}
        >
          {fmt(btScore)}
        </Text>
      </View>
      <View
        className='w-px self-stretch'
        style={{ backgroundColor: C.white10, marginVertical: '15%' }}
      />
      <View className='px-2.5 py-1 items-center' style={{ minWidth: 52 }}>
        <Text
          className='text-[7px] font-bold uppercase tracking-widest'
          style={{ color: 'rgba(200,168,64,0.45)' }}
        >
          THEM
        </Text>
        <Text
          className='text-sm font-black'
          style={{
            color:
              lrScore > 0
                ? 'rgba(255,255,255,0.5)'
                : lrScore <= -20
                  ? C.danger
                  : 'rgba(240,220,160,0.4)',
          }}
        >
          {fmt(lrScore)}
        </Text>
      </View>
    </View>
  );
}