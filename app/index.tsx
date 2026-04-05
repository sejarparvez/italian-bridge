import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import splashImage from '../assets/images/splash.png';
import { MenuButton } from '../components/MenuButton';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <View style={styles.leftPanelBg} />
      <View style={styles.leftPanelBorder} />
      <View style={[styles.cornerDot, { top: 20, left: 20 }]} />
      <View style={[styles.cornerDot, { bottom: 20, left: 20 }]} />

      <View style={styles.leftPanel}>
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1000 }}
        >
          <Image
            source={splashImage}
            style={styles.heroImage}
            resizeMode='contain'
          />
        </MotiView>
      </View>

      <View style={styles.rightPanel}>
        <MotiView
          from={{ opacity: 0, translateX: 20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Text style={styles.eyebrow}>4-player partnership</Text>
          <Text style={styles.titleMain}>Italian</Text>
          <Text style={styles.titleAccent}>Bridge</Text>
          <View style={styles.titleRule} />
        </MotiView>

        <View style={styles.btnStack}>
          <MenuButton
            title='New Game'
            variant='primary'
            delay={300}
            onPress={() => router.push('/game')}
          />
          <MenuButton
            title='Resume'
            variant='secondary'
            delay={400}
            disabled
            onPress={() => {}}
          />
          <MenuButton
            title='Settings'
            variant='ghost'
            delay={500}
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B3323', flexDirection: 'row' },
  leftPanelBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '55%',
    backgroundColor: '#0F4530',
  },
  leftPanelBorder: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    left: '55%',
    width: 1,
    backgroundColor: 'rgba(61, 184, 122, 0.2)',
  },
  cornerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A7A54',
    zIndex: 10,
  },

  leftPanel: { width: '55%', justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: 240, height: 240 },

  rightPanel: { width: '45%', justifyContent: 'center', paddingHorizontal: 40 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3DB87A',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleMain: {
    fontSize: SCREEN_W * 0.04,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#E4E2D8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 40,
  },
  titleAccent: {
    fontSize: SCREEN_W * 0.05,
    fontWeight: '900',
    color: '#EF9F27',
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 50,
  },
  titleRule: {
    width: 40,
    height: 2,
    backgroundColor: '#EF9F27',
    marginTop: 12,
    marginBottom: 24,
  },

  btnStack: { gap: 12 },
});
