import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { YouTubePlayerView, type YouTubePlayerState } from '../components/YouTubePlayerView';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { SourceSummary, TimestampCapture } from '../domain/source';
import { createExactCapture } from '../services/api';

type Props = {
  source: SourceSummary | null;
  onCaptureSaved: (capture: TimestampCapture) => void;
};

const initialPlayerState: YouTubePlayerState = {
  currentTimeSec: 0,
  durationSec: 0,
  playerState: -1,
  ready: false,
};

export function PlayerScreen({ onCaptureSaved, source }: Props) {
  const [playerState, setPlayerState] = useState<YouTubePlayerState>(initialPlayerState);
  const [captures, setCaptures] = useState<TimestampCapture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!source) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerCard}>
            <Text style={styles.kicker}>Milestone 2 · 정확 저장</Text>
            <Text style={styles.title}>먼저 YouTube 링크를 등록하세요</Text>
            <Text style={styles.body}>정확 저장은 등록한 영상의 보이는 플레이어에서만 동작합니다. 링크 등록 탭에서 영상을 추가한 뒤 돌아오세요.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activeSource = source;

  async function handleManualSave() {
    setSaving(true);
    setError(null);
    try {
      const capture = await createExactCapture({
        sourceId: activeSource.id,
        capturedAtSec: roundTimestamp(playerState.currentTimeSec),
        trigger: 'manual_button',
      });
      setCaptures((current) => [capture, ...current]);
      onCaptureSaved(capture);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'timestamp 저장에 실패했습니다. backend dev server를 확인하세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Milestone 2 · 정확 저장</Text>
          <Text style={styles.title}>앱 안에서 보이는 플레이어로 저장</Text>
          <Text style={styles.body}>숨김/백그라운드 재생 없이 현재 재생 초를 읽고, 수동 버튼으로 timestamp를 저장합니다.</Text>
        </View>

        <View style={styles.playerCard}>
          <Text style={styles.sourceTitle}>{activeSource.title}</Text>
          <Text style={styles.meta}>videoId · {activeSource.videoId}</Text>
          <YouTubePlayerView videoId={activeSource.videoId} onError={setError} onStateChange={setPlayerState} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.statusGrid}>
          <StatusTile label="현재 재생" value={formatSeconds(playerState.currentTimeSec)} />
          <StatusTile label="전체 길이" value={playerState.durationSec > 0 ? formatSeconds(playerState.durationSec) : '대기 중'} />
          <StatusTile label="플레이어" value={playerState.ready ? playerStateLabel(playerState.playerState) : '로딩 중'} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!playerState.ready || saving}
          onPress={handleManualSave}
          style={({ pressed }) => [styles.saveButton, (!playerState.ready || saving) && styles.saveButtonDisabled, pressed && styles.buttonPressed]}
        >
          <Text style={styles.saveButtonText}>{saving ? '저장 중…' : '이 부분 저장'}</Text>
          <Text style={styles.saveButtonCaption}>현재 timestamp {formatSeconds(playerState.currentTimeSec)}</Text>
        </Pressable>

        <View style={styles.captureCard}>
          <Text style={styles.sectionTitle}>저장한 timestamp</Text>
          {captures.length === 0 ? (
            <Text style={styles.emptyText}>아직 저장한 구간이 없습니다. 재생 중 중요한 순간에 “이 부분 저장”을 누르세요.</Text>
          ) : (
            captures.map((capture) => (
              <View key={capture.id} style={styles.captureRow}>
                <Text style={styles.captureTime}>{formatSeconds(capture.capturedAtSec)}</Text>
                <Text style={styles.captureMeta}>manual_button · 정확 저장</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusTile}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function formatSeconds(value: number): string {
  const safe = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function roundTimestamp(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function playerStateLabel(value: number): string {
  switch (value) {
    case -1:
      return '시작 전';
    case 0:
      return '종료';
    case 1:
      return '재생 중';
    case 2:
      return '일시정지';
    case 3:
      return '버퍼링';
    case 5:
      return '준비됨';
    default:
      return '상태 확인';
  }
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
  playerCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sourceTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  meta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusTile: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    flex: 1,
    padding: spacing.md,
  },
  statusLabel: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  statusValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.heavy,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  saveButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  saveButtonText: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  saveButtonCaption: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  captureCard: {
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
  emptyText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  captureRow: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.md,
  },
  captureTime: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  captureMeta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
