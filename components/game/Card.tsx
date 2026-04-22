import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

const AS = require('../../assets/cards/AS.svg') as number;
const KS = require('../../assets/cards/KS.svg');
const QS = require('../../assets/cards/QS.svg');
const JS = require('../../assets/cards/JS.svg');
const TS = require('../../assets/cards/10S.svg');
const N9S = require('../../assets/cards/9S.svg');
const N8S = require('../../assets/cards/8S.svg');
const N7S = require('../../assets/cards/7S.svg');
const N6S = require('../../assets/cards/6S.svg');
const N5S = require('../../assets/cards/5S.svg');
const N4S = require('../../assets/cards/4S.svg');
const N3S = require('../../assets/cards/3S.svg');
const N2S = require('../../assets/cards/2S.svg');

const AH = require('../../assets/cards/AH.svg');
const KH = require('../../assets/cards/KH.svg');
const QH = require('../../assets/cards/QH.svg');
const JH = require('../../assets/cards/JH.svg');
const TH = require('../../assets/cards/10H.svg');
const N9H = require('../../assets/cards/9H.svg');
const N8H = require('../../assets/cards/8H.svg');
const N7H = require('../../assets/cards/7H.svg');
const N6H = require('../../assets/cards/6H.svg');
const N5H = require('../../assets/cards/5H.svg');
const N4H = require('../../assets/cards/4H.svg');
const N3H = require('../../assets/cards/3H.svg');
const N2H = require('../../assets/cards/2H.svg');

const AD = require('../../assets/cards/AD.svg');
const KD = require('../../assets/cards/KD.svg');
const QD = require('../../assets/cards/QD.svg');
const JD = require('../../assets/cards/JD.svg');
const TD = require('../../assets/cards/10D.svg');
const N9D = require('../../assets/cards/9D.svg');
const N8D = require('../../assets/cards/8D.svg');
const N7D = require('../../assets/cards/7D.svg');
const N6D = require('../../assets/cards/6D.svg');
const N5D = require('../../assets/cards/5D.svg');
const N4D = require('../../assets/cards/4D.svg');
const N3D = require('../../assets/cards/3D.svg');
const N2D = require('../../assets/cards/2D.svg');

const AC = require('../../assets/cards/AC.svg');
const KC = require('../../assets/cards/KC.svg');
const QC = require('../../assets/cards/QC.svg');
const JC = require('../../assets/cards/JC.svg');
const TC = require('../../assets/cards/10C.svg');
const N9C = require('../../assets/cards/9C.svg');
const N8C = require('../../assets/cards/8C.svg');
const N7C = require('../../assets/cards/7C.svg');
const N6C = require('../../assets/cards/6C.svg');
const N5C = require('../../assets/cards/5C.svg');
const N4C = require('../../assets/cards/4C.svg');
const N3C = require('../../assets/cards/3C.svg');
const N2C = require('../../assets/cards/2C.svg');

const cardImages: Record<string, number> = {
  AS,
  KS,
  QS,
  JS,
  '10S': TS,
  '9S': N9S,
  '8S': N8S,
  '7S': N7S,
  '6S': N6S,
  '5S': N5S,
  '4S': N4S,
  '3S': N3S,
  '2S': N2S,
  AH,
  KH,
  QH,
  JH,
  '10H': TH,
  '9H': N9H,
  '8H': N8H,
  '7H': N7H,
  '6H': N6H,
  '5H': N5H,
  '4H': N4H,
  '3H': N3H,
  '2H': N2H,
  AD,
  KD,
  QD,
  JD,
  '10D': TD,
  '9D': N9D,
  '8D': N8D,
  '7D': N7D,
  '6D': N6D,
  '5D': N5D,
  '4D': N4D,
  '3D': N3D,
  '2D': N2D,
  AC,
  KC,
  QC,
  JC,
  '10C': TC,
  '9C': N9C,
  '8C': N8C,
  '7C': N7C,
  '6C': N6C,
  '5C': N5C,
  '4C': N4C,
  '3C': N3C,
  '2C': N2C,
};

interface CardProps {
  index?: number;
  rotate?: number;
  faceDown?: boolean;
  suit?: '♠' | '♥' | '♦' | '♣';
  rank?: string;
  cardKey?: string;
}

const CARD_W = 44;
const CARD_H = 62;

export function Card({
  index = 0,
  rotate = 0,
  faceDown = true,
  suit,
  rank,
  cardKey,
}: CardProps) {
  const SUIT_MAP: Record<string, string> = {
    '♠': 'S',
    '♥': 'H',
    '♦': 'D',
    '♣': 'C',
  };
  const key = cardKey || (suit && rank ? `${rank}${SUIT_MAP[suit]}` : '');
  const svgSource = key ? cardImages[key] : undefined;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 40, type: 'spring', damping: 18 }}
      style={[
        styles.card,
        { transform: [{ rotate: `${rotate}deg` }] },
        faceDown && styles.cardBack,
      ]}
    >
      {!faceDown && svgSource ? (
        <Image source={svgSource} style={styles.cardImage} contentFit='fill' />
      ) : !faceDown && suit && rank ? (
        <>
          <Text
            style={[
              styles.cardRankTL,
              (suit === '♥' || suit === '♦') && styles.cardRed,
            ]}
          >
            {rank}
          </Text>
          <Text
            style={[
              styles.cardSuitCenter,
              (suit === '♥' || suit === '♦') && styles.cardRed,
            ]}
          >
            {suit}
          </Text>
          <Text
            style={[
              styles.cardRankBR,
              (suit === '♥' || suit === '♦') && styles.cardRed,
            ]}
          >
            {rank}
          </Text>
        </>
      ) : (
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackInner} />
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    backgroundColor: colors.ivory300,
    borderWidth: 1,
    borderColor: colors.ivory500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  cardBack: { backgroundColor: colors.felt700, borderColor: colors.felt600 },
  cardImage: { width: '100%', height: '100%' },
  cardBackPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 5,
    padding: 4,
    backgroundColor: colors.felt800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    flex: 1,
    width: '100%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.felt600,
    backgroundColor: colors.felt700,
  },
  cardRankTL: {
    position: 'absolute',
    top: 4,
    left: 5,
    fontSize: 11,
    fontWeight: '900',
    color: colors.suitBlack,
  },
  cardRankBR: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    fontSize: 11,
    fontWeight: '900',
    color: colors.suitBlack,
    transform: [{ rotate: '180deg' }],
  },
  cardSuitCenter: { fontSize: 22, color: colors.suitBlack },
  cardRed: { color: colors.suitRed },
});
