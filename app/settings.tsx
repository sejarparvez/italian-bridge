'use client';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Info,
  Music,
  Smartphone,
  Swords,
  Volume2,
  Zap,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Switch } from '@/components/ui/switch';
import { VStack } from '@/components/ui/vstack';

const SETTING_ICONS: Record<string, React.ReactNode> = {
  Difficulty: <Swords size={20} color='#C9A84C' />,
  'Sound Effects': <Volume2 size={20} color='#C9A84C' />,
  Music: <Music size={20} color='#C9A84C' />,
  Vibration: <Smartphone size={20} color='#C9A84C' />,
  'Card Back': <Swords size={20} color='#C9A84C' />,
  'Animation Speed': <Zap size={20} color='#C9A84C' />,
  'How to Play': <BookOpen size={20} color='#C9A84C' />,
  Version: <Info size={20} color='#C9A84C' />,
};

function SettingRow({
  title,
  subtitle,
  delay,
  onPress,
}: {
  title: string;
  subtitle?: string;
  delay: number;
  onPress?: () => void;
}) {
  const Icon = SETTING_ICONS[title];

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 100 }}
    >
      <Pressable onPress={onPress} style={styles.settingRow}>
        <HStack space='md' className='items-center' style={{ flex: 1 }}>
          <Box
            className='w-9 h-9 rounded-lg items-center justify-center'
            style={styles.iconContainer}
          >
            {Icon}
          </Box>
          <VStack className='flex-1'>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </VStack>
        </HStack>
        <ChevronRight size={22} color='#C9A84C' style={styles.chevron} />
      </Pressable>
    </MotiView>
  );
}

function ToggleRow({
  title,
  subtitle,
  delay,
  enabled = true,
  onPress,
}: {
  title: string;
  subtitle?: string;
  delay: number;
  enabled?: boolean;
  onPress?: () => void;
}) {
  const Icon = SETTING_ICONS[title];

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 100 }}
    >
      <Pressable onPress={onPress} style={styles.settingRow}>
        <HStack space='md' className='items-center' style={{ flex: 1 }}>
          <Box
            className='w-9 h-9 rounded-lg items-center justify-center'
            style={styles.iconContainer}
          >
            {Icon}
          </Box>
          <VStack className='flex-1'>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </VStack>
        </HStack>
        <Switch value={enabled} onValueChange={onPress} />
      </Pressable>
    </MotiView>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0D2B1A', '#1A4A2E', '#0D2B1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 100, type: 'spring', damping: 15 }}
        >
          <Text style={styles.sectionTitle}>Game</Text>
          <Box className='rounded-2xl border border-gold-200/20 bg-felt-mid/60 mb-7 overflow-hidden shadow-lg shadow-black/20'>
            <SettingRow title='Difficulty' subtitle='Normal' delay={200} />
            <View style={styles.divider} />
            <ToggleRow
              title='Sound Effects'
              subtitle='On'
              delay={300}
              enabled
            />
            <View style={styles.divider} />
            <ToggleRow title='Music' subtitle='On' delay={400} enabled />
            <View style={styles.divider} />
            <ToggleRow title='Vibration' subtitle='On' delay={500} enabled />
          </Box>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 300, type: 'spring', damping: 15 }}
        >
          <Text style={styles.sectionTitle}>Display</Text>
          <Box className='rounded-2xl border border-gold-200/20 bg-felt-mid/60 mb-7 overflow-hidden shadow-lg shadow-black/20'>
            <SettingRow title='Card Back' subtitle='Classic' delay={600} />
            <View style={styles.divider} />
            <SettingRow title='Animation Speed' subtitle='Normal' delay={700} />
          </Box>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 500, type: 'spring', damping: 15 }}
        >
          <Text style={styles.sectionTitle}>About</Text>
          <Box className='rounded-2xl border border-gold-200/20 bg-felt-mid/60 mb-7 overflow-hidden shadow-lg shadow-black/20'>
            <SettingRow title='How to Play' delay={800} />
            <View style={styles.divider} />
            <SettingRow title='Version' subtitle='1.0.0' delay={900} />
          </Box>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 168, 76, 0.2)',
  },
  backButton: { paddingVertical: 4, minWidth: 60 },
  backText: { fontSize: 18, color: '#C9A84C', fontWeight: '500' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8D5A3',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  placeholder: { width: 60 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9A84C',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  settingTitle: { fontSize: 16, fontWeight: '500', color: '#E8D5A3' },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(232, 213, 163, 0.5)',
    marginTop: 2,
  },
  chevron: { opacity: 0.7 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    marginLeft: 66,
  },
});
