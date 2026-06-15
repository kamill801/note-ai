import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { NoteRecord, SourceSummary } from '../domain/source';

type Props = {
  hydrating: boolean;
  latestNote: NoteRecord | null;
  latestSource: SourceSummary | null;
  onImportPress: () => void;
  onListenPress: () => void;
  onNotesPress: () => void;
  onSettingsPress: () => void;
  startupError: string | null;
};

export function HomeScreen({ hydrating, latestNote, latestSource, onImportPress, onListenPress, onNotesPress, onSettingsPress, startupError }: Props) {
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

        <Pressable accessibilityRole="button" onPress={onImportPress} style={({ pressed }) => [styles.primaryAction, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryActionText}>새 영상 가져오기</Text>
          <Text style={styles.primaryActionCaption}>YouTube 링크 또는 테스트 영상으로 시작</Text>
        </Pressable>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>현재 작업</Text>
          <Text style={styles.statusValue}>{hydrating ? '최근 작업 확인 중' : latestSource ? '듣기 이어갈 준비됨' : '새 영상 대기 중'}</Text>
          <Text style={styles.caption}>{latestNote ? latestNote.noteJson.timestampLabel : '마이크 꺼짐 · 듣기 화면에서 이 부분 저장'}</Text>
        </View>

        {startupError ? (
          <Pressable accessibilityRole="button" onPress={onSettingsPress} style={({ pressed }) => [styles.errorCard, pressed && styles.buttonPressed]}>
            <Text style={styles.errorTitle}>API 연결 확인 필요</Text>
            <Text style={styles.errorBody}>{startupError}</Text>
          </Pressable>
        ) : null}

        <View style={styles.grid}>
          <Pressable accessibilityRole="button" disabled={!latestSource} onPress={onListenPress} style={({ pressed }) => [styles.card, !latestSource && styles.cardDisabled, pressed && styles.buttonPressed]}>
            <Text style={styles.cardTitle}>듣기</Text>
            <Text style={styles.cardBody}>{latestSource ? latestSource.title : '등록한 영상이 없습니다.'}</Text>
            <Text style={styles.cardMeta}>{latestSource ? `transcript · ${latestSource.transcriptStatus}` : '링크 등록부터 시작'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onNotesPress} style={({ pressed }) => [styles.card, pressed && styles.buttonPressed]}>
            <Text style={styles.cardTitle}>노트</Text>
            <Text style={styles.cardBody}>{latestNote ? latestNote.title : '아직 생성된 노트가 없습니다.'}</Text>
            <Text style={styles.cardMeta}>{latestNote ? latestNote.noteJson.timestampLabel : '저장 후 자동 생성'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>로컬 MVP 모드</Text>
          <Text style={styles.cardBody}>지금 버전은 실제 유료 AI/Search API 없이 manual transcript와 mock research로 전체 흐름을 검증합니다.</Text>
        </View>
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
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginVertical: spacing.xs,
  },
  caption: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.heavy,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  primaryActionText: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  primaryActionCaption: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  grid: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.warning,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  errorBody: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    lineHeight: 18,
  },
  cardDisabled: {
    backgroundColor: colors.muted,
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
  cardMeta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
});
