import { MotiView } from 'moti';
import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../constants/colors';

interface MenuButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  delay?: number;
  disabled?: boolean;
}

export function MenuButton({
  title,
  onPress,
  variant = 'secondary',
  delay,
  disabled,
}: MenuButtonProps) {
  const variantStyle =
    styles[
      `btn${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
    ];
  const variantText = styles[
    `btnText${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
  ] as TextStyle;

  const buttonStyle: ViewStyle = {
    ...(styles.btn as ViewStyle),
    ...(variantStyle as ViewStyle),
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: disabled ? 0.4 : 1, translateX: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={(state) => [buttonStyle, state.pressed && styles.btnPressed]}
      >
        <Text style={variantText}>{title}</Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.gold500 },
  btnSecondary: {
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  btnPressed: { opacity: 0.8 },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  btnTextPrimary: { color: '#2A1A00' },
  btnTextSecondary: { color: colors.felt300 },
  btnTextGhost: { color: colors.felt400 },
});
