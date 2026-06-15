import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { SourceSummary } from '../domain/source';
import { importDemoTranscript, listSources, registerSource } from '../services/api';

type Props = {
  onSourceReady: (source: SourceSummary) => void;
};

export function ImportSourceScreen({ onSourceReady }: Props) {
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'registering' | 'demo'>('idle');
  const [loadingSources, setLoadingSources] = useState(false);

  const canSubmit = useMemo(() => url.trim().length > 0 && loadingState === 'idle', [loadingState, url]);

  useEffect(() => {
    void refreshSources();
  }, []);

  async function refreshSources() {
    setLoadingSources(true);
    setError(null);
    try {
      setSources(await listSources());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '등록한 영상을 불러올 수 없습니다.');
    } finally {
      setLoadingSources(false);
    }
  }

  async function handleSubmit() {
    setLoadingState('registering');
    setError(null);
    try {
      const source = await registerSource({ url });
      setSources((current) => [source, ...current.filter((item) => item.videoId !== source.videoId)]);
      onSourceReady(source);
      setUrl('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '링크를 등록할 수 없습니다.');
    } finally {
      setLoadingState('idle');
    }
  }

  async function handleDemoStart() {
    setLoadingState('demo');
    setError(null);
    try {
      const source = await registerSource({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceLabel: 'MVP1 테스트 영상',
      });
      await importDemoTranscript(source.id);
      const readySource: SourceSummary = { ...source, transcriptStatus: 'ready' };
      setSources((current) => [readySource, ...current.filter((item) => item.videoId !== readySource.videoId)]);
      onSourceReady(readySource);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'MVP1 테스트 영상을 준비할 수 없습니다. backend dev server를 확인하세요.');
    } finally {
      setLoadingState('idle');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Milestone 1</Text>
          <Text style={styles.title}>YouTube 링크 등록</Text>
          <Text style={styles.body}>앱 안의 보이는 플레이어로 정확 저장하기 전에 영상을 먼저 등록합니다.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>YouTube URL</Text>
          <TextInput
            accessibilityLabel="YouTube URL 입력"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="#746f66"
            style={styles.input}
            value={url}
          />
          <Text style={styles.helperText}>지원하는 YouTube URL을 붙여넣어 주세요. watch, youtu.be, shorts, embed 링크를 backend에서 검증합니다.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.button, !canSubmit && styles.buttonDisabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{loadingState === 'registering' ? '등록 중…' : '링크 등록'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={loadingState !== 'idle'}
            onPress={handleDemoStart}
            style={({ pressed }) => [styles.secondaryButton, loadingState !== 'idle' && styles.buttonDisabled, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{loadingState === 'demo' ? '테스트 transcript 연결 중…' : 'MVP1 테스트 영상으로 시작'}</Text>
          </Pressable>
          <Text style={styles.helperText}>테스트 영상은 로컬 manual transcript를 backend에 연결해 근거 노트까지 검증합니다.</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>등록한 영상</Text>
          {sources.length === 0 ? (
            <Text style={styles.emptyText}>{loadingSources ? '등록한 영상을 불러오는 중입니다.' : '아직 등록한 영상이 없습니다. YouTube 링크를 붙여넣어 시작하세요.'}</Text>
          ) : (
            sources.map((source) => (
              <Pressable key={source.id} accessibilityRole="button" onPress={() => onSourceReady(source)} style={({ pressed }) => [styles.sourceRow, pressed && styles.buttonPressed]}>
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailText}>YT</Text>
                </View>
                <View style={styles.sourceTextBlock}>
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                  <Text style={styles.sourceMeta}>videoId · {source.videoId}</Text>
                  <Text style={styles.sourceMeta}>transcript · {source.transcriptStatus}</Text>
                </View>
              </Pressable>
            ))
          )}
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
    fontSize: typography.display,
    fontWeight: '900',
    lineHeight: 39,
  },
  body: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.md,
  },
  formCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  label: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.paper,
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
  button: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  buttonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  helperText: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  listCard: {
    backgroundColor: colors.muted,
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
  emptyText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  sourceRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.hairline,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.cobalt,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    height: 54,
    justifyContent: 'center',
    width: 72,
  },
  thumbnailText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  sourceTextBlock: {
    flex: 1,
  },
  sourceTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  sourceMeta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
