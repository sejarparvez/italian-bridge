import { MotiView } from 'moti';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

const MENU_ACTIONS = [
  { label: 'New Game', icon: '🃏', color: colors.gold500 },
  { label: 'Show Scores', icon: '📊', color: colors.felt300 },
  { label: 'Settings', icon: '⚙️', color: colors.felt300 },
  { label: 'Exit Game', icon: '🚪', color: '#F7C1C1' },
];

interface MenuOverlayProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  panelTop: number;
}

export function MenuOverlay({
  visible,
  onClose,
  onAction,
  panelTop,
}: MenuOverlayProps) {
  if (!visible) return null;
  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 180 }}
        style={[StyleSheet.absoluteFill, styles.menuScrim]}
        pointerEvents='none'
      />
      <Pressable
        style={[styles.menuPanel, { top: panelTop, right: 14 }]}
        onPress={(e) => e.stopPropagation()}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: -8 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>GAME MENU</Text>
            <Pressable onPress={onClose} style={styles.menuCloseBtn}>
              <Text style={styles.menuCloseText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.menuDivider} />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.menuScroll}
          >
            {MENU_ACTIONS.map((action, i) => (
              <MotiView
                key={action.label}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 55, type: 'spring', damping: 18 }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => onAction(action.label)}
                >
                  <Text style={styles.menuItemIcon}>{action.icon}</Text>
                  <Text style={[styles.menuItemLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                  <Text style={styles.menuItemChevron}>›</Text>
                </Pressable>
              </MotiView>
            ))}
          </ScrollView>
        </MotiView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuScrim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  menuPanel: {
    position: 'absolute',
    width: 220,
    backgroundColor: colors.felt800,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.felt600,
    overflow: 'hidden',
    elevation: 99,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.felt300,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  menuCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.felt700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCloseText: { fontSize: 11, color: colors.felt300, fontWeight: '700' },
  menuDivider: { height: 1, backgroundColor: colors.felt600 },
  menuScroll: { maxHeight: 280 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,122,84,0.2)',
  },
  menuItemPressed: { backgroundColor: colors.felt700 },
  menuItemIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menuItemChevron: { fontSize: 18, color: colors.felt600, fontWeight: '300' },
});
