import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { NoteRecord, TimestampCapture, VoiceMemo } from '../domain/source';
import { createVoiceMemo, generateNote } from '../services/api';

type PermissionState = 'unknown' | 'granted' | 'denied';

type Props = {
  latestCapture?: TimestampCapture | null;
  onNoteReady: (note: NoteRecord) => void;
};

export function CaptureModeScreen({ latestCapture, onNoteReady }: Props) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [captureModeEnabled, setCaptureModeEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [memoText, setMemoText] = useState('');
  const [savedMemo, setSavedMemo] = useState<VoiceMemo | null>(null);
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsBackgroundRecording: false,
    });
  }, []);

  async function ensurePermission(): Promise<boolean> {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    const granted = status.granted;
    setPermissionState(granted ? 'granted' : 'denied');
    if (!granted) {
      Alert.alert('마이크 권한 필요', '내 생각 말하기를 저장하려면 마이크 권한이 필요합니다.');
    }
    return granted;
  }

  async function toggleCaptureMode() {
    if (captureModeEnabled) {
      if (recorderState.isRecording) await stopRecording();
      setCaptureModeEnabled(false);
      return;
    }

    const granted = await ensurePermission();
    if (!granted) return;
    setCaptureModeEnabled(true);
  }

  async function startRecording() {
    const granted = permissionState === 'granted' || (await ensurePermission());
    if (!granted) return;
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  }

  async function stopRecording() {
    await audioRecorder.stop();
    setAudioUri(audioRecorder.uri ?? undefined);
  }

  async function saveMemoFallback() {
    await saveMemoWithTranscript(memoText.trim());
  }

  async function saveMemoWithoutText() {
    await saveMemoWithTranscript('메모 없이 저장');
  }

  async function saveMemoWithTranscript(transcript: string) {
    if (!latestCapture) {
      Alert.alert('timestamp 먼저 저장', '플레이어에서 “이 부분 저장”을 누른 뒤 내 생각을 저장할 수 있습니다.');
      return;
    }

    if (transcript.length === 0) {
      Alert.alert('메모 텍스트 필요', '전사 결과가 들어오기 전에는 직접 메모 텍스트를 입력하거나 “메모 없이 저장”을 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const memo = await createVoiceMemo({
        captureId: latestCapture.id,
        memoTranscript: transcript,
        ...(audioUri ? { audioUri } : {}),
      });
      setSavedMemo(memo);
      const note = await generateNote(latestCapture.id);
      onNoteReady(note);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '메모 저장 또는 노트 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Milestone 3 · Capture Mode</Text>
          <Text style={styles.title}>앱이 열려 있을 때만 내 생각 말하기</Text>
          <Text style={styles.body}>시스템 전체 wake word가 아니라 foreground capture mode에서만 마이크를 사용합니다.</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>캡처 상태</Text>
          <StatusLine label="캡처 모드" value={captureModeEnabled ? '켜짐' : '꺼짐'} tone={captureModeEnabled ? 'ok' : 'idle'} />
          <StatusLine label="마이크 권한" value={permissionLabel(permissionState)} tone={permissionState === 'granted' ? 'ok' : permissionState === 'denied' ? 'danger' : 'idle'} />
          <StatusLine label="녹음" value={recorderState.isRecording ? '진행 중' : '대기 중'} tone={recorderState.isRecording ? 'danger' : 'idle'} />
          <StatusLine label="최근 저장" value={latestCapture ? `${latestCapture.capturedAtSec.toFixed(1)}초` : 'timestamp 없음'} tone={latestCapture ? 'ok' : 'idle'} />
          <StatusLine label="노트 생성" value={submitting ? '진행 중' : '대기 중'} tone={submitting ? 'ok' : 'idle'} />
        </View>

        <Pressable accessibilityRole="switch" accessibilityState={{ checked: captureModeEnabled }} onPress={toggleCaptureMode} style={({ pressed }) => [styles.primaryButton, captureModeEnabled && styles.activeButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>{captureModeEnabled ? '캡처 모드 끄기' : '캡처 모드 켜기'}</Text>
          <Text style={styles.buttonCaption}>마이크 상태를 화면에 계속 표시합니다</Text>
        </Pressable>

        <View style={styles.memoCard}>
          <Text style={styles.sectionTitle}>내 생각 말하기</Text>
          <Text style={styles.explainText}>녹음 파일은 현재 기기 URI만 표시합니다. 서버 저장/AI 전사는 API 키 연결 전까지 manual fallback으로 처리합니다.</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!captureModeEnabled}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            style={({ pressed }) => [styles.recordButton, !captureModeEnabled && styles.disabledButton, recorderState.isRecording && styles.recordingButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.recordButtonText}>{recorderState.isRecording ? '메모 녹음 종료' : '메모 녹음 시작'}</Text>
          </Pressable>
          {audioUri ? <Text style={styles.audioUri}>로컬 오디오 URI · {audioUri}</Text> : null}
          <TextInput
            multiline
            onChangeText={setMemoText}
            placeholder="전사 결과 또는 직접 입력: 이 아이디어를 내 서비스 온보딩에 적용해보기"
            placeholderTextColor="#746f66"
            style={styles.memoInput}
            value={memoText}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={submitting || !latestCapture}
            onPress={saveMemoFallback}
            style={({ pressed }) => [styles.saveMemoButton, (submitting || !latestCapture) && styles.disabledButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.saveMemoText}>{submitting ? '노트 만드는 중…' : '메모 저장하고 노트 만들기'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={submitting || !latestCapture}
            onPress={saveMemoWithoutText}
            style={({ pressed }) => [styles.secondaryButton, (submitting || !latestCapture) && styles.disabledButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.saveMemoText}>메모 없이 저장</Text>
          </Pressable>
        </View>

        <View style={styles.savedCard}>
          <Text style={styles.sectionTitle}>저장된 내 음성 메모</Text>
          {savedMemo ? (
            <View style={styles.savedMemoBox}>
              <Text style={styles.savedTranscript}>{savedMemo.memoTranscript}</Text>
              <Text style={styles.savedMeta}>{savedMemo.transcriptionStatus} · {savedMemo.detectedIntent} · 사용자 메모 보존됨</Text>
              {savedMemo.audioUri ? <Text style={styles.savedMeta}>audio · local_uri_only</Text> : null}
            </View>
          ) : (
            <Text style={styles.explainText}>아직 저장된 메모가 없습니다.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusLine({ label, tone, value }: { label: string; value: string; tone: 'ok' | 'danger' | 'idle' }) {
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, tone === 'ok' && styles.okText, tone === 'danger' && styles.dangerText]}>{value}</Text>
    </View>
  );
}

function permissionLabel(value: PermissionState): string {
  if (value === 'granted') return '허용됨';
  if (value === 'denied') return '거부됨';
  return '요청 전';
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
  statusCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  statusLine: {
    alignItems: 'center',
    borderBottomColor: colors.ink,
    borderBottomWidth: borders.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statusLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  statusValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  okText: {
    color: '#1f7a1f',
  },
  dangerText: {
    color: colors.danger,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.cobalt,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.heavy,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  activeButton: {
    backgroundColor: colors.hotPink,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '900',
  },
  buttonCaption: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  memoCard: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  explainText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  recordingButton: {
    backgroundColor: colors.warning,
  },
  disabledButton: {
    backgroundColor: colors.white,
    opacity: 0.55,
  },
  recordButtonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  audioUri: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  memoInput: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    minHeight: 120,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  saveMemoButton: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  saveMemoText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  savedCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  savedMemoBox: {
    backgroundColor: colors.blockLime,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.md,
  },
  savedTranscript: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 23,
  },
  savedMeta: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
