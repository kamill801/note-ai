import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { NoteRecord, ResearchJob } from '../domain/source';
import { createResearchJob } from '../services/api';

type Props = {
  note: NoteRecord | null;
  researchJob: ResearchJob | null;
  onResearchReady: (job: ResearchJob) => void;
};

export function NoteDetailScreen({ note, onResearchReady, researchJob }: Props) {
  const [request, setRequest] = useState('비슷한 실제 사례와 추가 자료 찾아줘');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    if (!note) return;
    setLoading(true);
    setError(null);
    try {
      const job = await createResearchJob({
        noteId: note.id,
        request,
      });
      onResearchReady(job);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '추가 리서치를 만들 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerCard}>
            <Text style={styles.kicker}>Milestone 5 · Note</Text>
            <Text style={styles.title}>아직 생성된 노트가 없습니다</Text>
            <Text style={styles.body}>정확 저장 후 “내 생각 말하기”에서 메모를 저장하면 한국어 노트가 생성됩니다.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const noteJson = note.noteJson;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Milestone 5 · Korean Note</Text>
          <Text style={styles.title}>{noteJson.title}</Text>
          <Text style={styles.body}>저장 구간 · {noteJson.timestampLabel} · 신뢰도 {confidenceLabel(noteJson.confidence)}</Text>
        </View>

        <Section title="핵심 요약">
          <Text style={styles.paragraph}>{noteJson.summary}</Text>
        </Section>

        <Section title="내 음성 메모">
          <View style={styles.memoBox}>
            <Text style={styles.memoText}>{noteJson.userMemoSummary}</Text>
            <Text style={styles.meta}>사용자 원문 보존</Text>
          </View>
        </Section>

        <Section title="내 생각 / 적용 아이디어">
          {noteJson.applicationIdeas.map((idea) => (
            <Text key={idea} style={styles.bullet}>• {idea}</Text>
          ))}
        </Section>

        <Section title="근거 transcript">
          {noteJson.sourceEvidence.length === 0 ? (
            <Text style={styles.paragraph}>자막 근거가 없어 memo-only fallback으로 저장되었습니다.</Text>
          ) : (
            noteJson.sourceEvidence.map((evidence) => (
              <View key={evidence.segmentId} style={styles.evidenceRow}>
                <Text style={styles.evidenceTime}>{evidence.timestampLabel}</Text>
                <Text style={styles.paragraph}>{evidence.text}</Text>
              </View>
            ))
          )}
        </Section>

        <Section title="추가 검색 키워드">
          <View style={styles.keywordWrap}>
            {noteJson.followUpKeywords.map((keyword) => (
              <Text key={keyword} style={styles.keyword}>{keyword}</Text>
            ))}
          </View>
        </Section>

        <Section title="추천 자료">
          {noteJson.recommendedMaterials.map((material) => (
            <View key={material.url} style={styles.materialRow}>
              <Text style={styles.materialTitle}>{material.title}</Text>
              <Text style={styles.paragraph}>{material.reason}</Text>
              <Text style={styles.urlText}>{material.url}</Text>
            </View>
          ))}
        </Section>

        <View style={styles.researchCard}>
          <Text style={styles.sectionTitle}>관련 자료 찾기</Text>
          <TextInput
            onChangeText={setRequest}
            placeholder="어떤 자료를 더 찾을까요?"
            placeholderTextColor="#746f66"
            style={styles.input}
            value={request}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={loading || request.trim().length === 0}
            onPress={handleResearch}
            style={({ pressed }) => [styles.researchButton, (loading || request.trim().length === 0) && styles.disabledButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.researchButtonText}>{loading ? '자료 찾는 중…' : '관련 자료 찾기'}</Text>
          </Pressable>
        </View>

        {researchJob ? (
          <Section title="추가 리서치 결과">
            <Text style={styles.paragraph}>{researchJob.result.koreanSynthesis}</Text>
            <Text style={styles.meta}>query · {researchJob.result.query}</Text>
            {researchJob.result.sources.map((source) => (
              <View key={source.url} style={styles.materialRow}>
                <Text style={styles.materialTitle}>{source.title}</Text>
                <Text style={styles.paragraph}>{source.reason}</Text>
                <Text style={styles.urlText}>{source.url}</Text>
              </View>
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function confidenceLabel(value: NoteRecord['noteJson']['confidence']): string {
  if (value === 'high') return '높음';
  if (value === 'medium') return '중간';
  return '낮음';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerCard: {
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
    fontSize: typography.title,
    fontWeight: '900',
    lineHeight: 30,
  },
  body: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  paragraph: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  memoBox: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.md,
  },
  memoText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 23,
  },
  meta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  bullet: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 24,
  },
  evidenceRow: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.hairline,
    gap: spacing.xs,
    padding: spacing.md,
  },
  evidenceTime: {
    color: colors.cobalt,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyword: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  materialRow: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.hairline,
    gap: spacing.xs,
    padding: spacing.md,
  },
  materialTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  urlText: {
    color: colors.cobalt,
    fontSize: typography.caption,
    fontWeight: '900',
    lineHeight: 18,
  },
  researchCard: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  researchButton: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  disabledButton: {
    backgroundColor: colors.white,
    shadowOpacity: 0,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  researchButtonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
});
