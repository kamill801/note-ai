import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';

const milestoneCards = [
  {
    title: '1. 링크 등록',
    body: 'YouTube 링크를 붙여넣고 정확 저장을 시작합니다.',
  },
  {
    title: '2. 앱 내 재생',
    body: '보이는 공식 플레이어에서 재생 시간을 읽습니다.',
  },
  {
    title: '3. 이 부분 저장',
    body: '캡처 모드와 마이크 상태를 분명하게 보여줍니다.',
  },
];

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>MVP1 · 정확 저장</Text>
          <Text style={styles.title}>듣던 YouTube 순간을 내 생각과 함께 저장</Text>
          <Text style={styles.body}>
            Note AI는 숨김 재생이나 다운로드 없이, 앱 안의 보이는 플레이어에서 timestamp를 저장합니다.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>캡처 상태</Text>
          <Text style={styles.statusValue}>대기 중 · 마이크 꺼짐</Text>
          <Text style={styles.caption}>캡처 모드는 앱이 열려 있을 때만 동작합니다.</Text>
        </View>

        {milestoneCards.map((card) => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardBody}>{card.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    borderWidth: borders.heavy,
    padding: spacing.xl,
    ...shadows.brutal,
  },
  kicker: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '900',
    lineHeight: 39,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  statusLabel: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  statusValue: {
    color: colors.danger,
    fontSize: typography.title,
    fontWeight: '900',
    marginVertical: spacing.xs,
  },
  caption: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  cardBody: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
});
