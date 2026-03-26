'use client';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HowToPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const rules = [
    {
      title: 'Objective',
      content:
        'Italian Bridge is a trick-taking card game played by 4 players in two partnerships. The goal is to win tricks and score the most points by the end of the round.',
    },
    {
      title: 'The Deal',
      content:
        'Each player receives 13 cards from a standard 52-card deck. The dealer rotates clockwise after each round.',
    },
    {
      title: 'Bidding',
      content:
        'Before play begins, players bid on how many tricks they will win. The highest bidder becomes the declarer and chooses the trump suit.',
    },
    {
      title: 'Playing',
      content:
        'The player to the left of the declarer leads the first trick. Players must follow suit if possible. The highest card of the trump suit wins, or the highest card of the lead suit if no trump is played.',
    },
    {
      title: 'Scoring',
      content:
        'Points are awarded for each trick won. The declarer must meet their bid to score. If successful, they get points equal to their bid. If not, the points go to the opposing team.',
    },
    {
      title: 'Winning',
      content:
        'The game continues until a team reaches a target score (usually 1000 points). The team with the highest score wins.',
    },
  ];

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
        <Text style={styles.title}>How to Play</Text>
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
          <Text style={styles.subtitle}>Learn the rules of Italian Bridge</Text>

          <View style={styles.rulesContainer}>
            {rules.map((rule, index) => (
              <MotiView
                key={rule.title}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  delay: 200 + index * 100,
                  type: 'spring',
                  damping: 15,
                }}
                style={styles.ruleCard}
              >
                <View style={styles.ruleNumber}>
                  <Text style={styles.ruleNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleText}>{rule.content}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1000, duration: 500 }}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Good luck and have fun!</Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(232, 213, 163, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  rulesContainer: {
    gap: 16,
  },
  ruleCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 74, 46, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ruleNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C9A84C',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8D5A3',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 14,
    color: 'rgba(232, 213, 163, 0.7)',
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#C9A84C',
    fontStyle: 'italic',
  },
});
