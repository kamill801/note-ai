import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AVAudioSessionCategory,
  AVAudioSessionCategoryOptions,
  AVAudioSessionMode,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { YouTubePlayerView, type YouTubePlayerHandle, type YouTubePlayerState } from '../components/YouTubePlayerView';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { NoteRecord, SourceSummary, TimestampCapture } from '../domain/source';
import { createExactCapture, createResearchJob, createVoiceMemo, generateNote } from '../services/api';
import { parseVoiceCommand, parseWakeWord, type SaveVoiceCommand, type VoiceCommandParseResult, type WakeVoiceCommand } from '../services/voice-command';

type Props = {
  onCaptureSaved: (capture: TimestampCapture) => void;
  onNoteReady: (note: NoteRecord) => void;
  source: SourceSummary | null;
};

type VoiceStatus = 'permission_needed' | 'listening' | 'awake' | 'heard' | 'ignored' | 'saving' | 'saved' | 'error' | 'off';
type AgentLoopPhase = 'waiting_for_wake' | 'awaiting_command' | 'processing' | 'saved' | 'error';
type VoiceInteractionPhase = 'waiting_for_wake' | 'awaiting_command';

const initialPlayerState: YouTubePlayerState = {
  currentTimeSec: 0,
  durationSec: 0,
  playerState: -1,
  ready: false,
};

export function PlayerScreen({ onCaptureSaved, onNoteReady, source }: Props) {
  const [playerState, setPlayerState] = useState<YouTubePlayerState>(initialPlayerState);
  const [captures, setCaptures] = useState<TimestampCapture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(true);
  const [voiceRecognizing, setVoiceRecognizing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('permission_needed');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('영상이 준비되면 말로 저장을 시작합니다.');
  const [voiceDebug, setVoiceDebug] = useState('진단 대기 중');
  const [speechLocale, setSpeechLocale] = useState('ko-KR');
  const [agentLoopPhase, setAgentLoopPhase] = useState<AgentLoopPhase>('waiting_for_wake');
  const commandInFlightRef = useRef(false);
  const recognitionStartingRef = useRef(false);
  const lastCommandKeyRef = useRef<string | null>(null);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const lastPlayerStateCodeRef = useRef<number | null>(null);
  const voicePhaseRef = useRef<VoiceInteractionPhase>('waiting_for_wake');
  const activeWakeRef = useRef<WakeVoiceCommand | null>(null);
  const speechLocaleCandidatesRef = useRef<string[]>(['ko-KR', 'en-US']);
  const speechLocaleAttemptRef = useRef(0);
  const speechLocaleRetryingRef = useRef(false);

  const updateVoiceDebug = useCallback((message: string) => {
    setVoiceDebug(message);
    console.log(`[NoteAI voice] ${message}`);
  }, []);

  const handleVoiceCommand = useCallback(
    async (command: SaveVoiceCommand) => {
      if (!source || commandInFlightRef.current) return;
      if (!playerState.ready) {
        setVoiceStatus('error');
        setVoiceMessage('플레이어가 준비된 뒤 다시 말해주세요.');
        return;
      }

      const capturedAtSec = roundTimestamp(playerState.currentTimeSec);
      const commandKey = `${command.normalizedTranscript}:${capturedAtSec}`;
      if (lastCommandKeyRef.current === commandKey) return;
      lastCommandKeyRef.current = commandKey;
      commandInFlightRef.current = true;
      setAgentLoopPhase('processing');
      updateVoiceDebug(`command parsed; intent detected: ${command.intent}`);
      setSaving(true);
      setError(null);
      setVoiceStatus('saving');
      setVoiceMessage(`요청 처리 중 · ${formatSeconds(capturedAtSec)}`);

      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Recognition may already be stopped by the native recognizer.
      }

      try {
        const capture = await createExactCapture({
          sourceId: source.id,
          capturedAtSec,
          trigger: 'voice_trigger',
          triggerTranscript: command.triggerTranscript,
        });
        updateVoiceDebug(`capture created: ${capture.id} @ ${capturedAtSec}`);
        setCaptures((current) => [capture, ...current]);

        const memoTranscript = command.memoTranscript.length > 0 ? command.memoTranscript : command.originalTranscript;
        const memo = await createVoiceMemo({
          captureId: capture.id,
          memoTranscript,
        });
        updateVoiceDebug(`voice memo created: ${memo.id}`);
        const note = await generateNote(capture.id);
        updateVoiceDebug(`note generated: ${note.id}`);
        let researchCreated = false;
        if (isResearchCommand(command)) {
          const researchJob = await createResearchJob({
            noteId: note.id,
            request: memoTranscript,
          });
          researchCreated = true;
          updateVoiceDebug(`research job created: ${researchJob.id}`);
        }
        setAgentLoopPhase('saved');
        setVoiceStatus('saved');
        setVoiceMessage(researchCreated ? '조사 자료 준비 완료' : '노트 저장 완료');
        if (command.shouldResumePlayback) {
          setVoiceMessage('다시 재생합니다');
        }
        onCaptureSaved(capture);
        onNoteReady(note);
        if (command.shouldResumePlayback) {
          playerRef.current?.play();
          updateVoiceDebug('command completed; play requested');
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '음성 명령 저장에 실패했습니다.';
        setAgentLoopPhase('error');
        setError(message);
        setVoiceStatus('error');
        setVoiceMessage(message);
      } finally {
        voicePhaseRef.current = 'waiting_for_wake';
        activeWakeRef.current = null;
        if (voiceModeEnabled) updateVoiceDebug('returned to waiting_for_wake');
        commandInFlightRef.current = false;
        setSaving(false);
      }
    },
    [onCaptureSaved, onNoteReady, playerState.currentTimeSec, playerState.ready, source, updateVoiceDebug, voiceModeEnabled],
  );


  const handleResumeCommand = useCallback((command: Extract<VoiceCommandParseResult, { action: 'resume_playback' }>) => {
    if (voicePhaseRef.current !== 'awaiting_command') return;
    updateVoiceDebug(`command parsed; resume requested: ${command.originalTranscript}`);
    setAgentLoopPhase('saved');
    setVoiceStatus('saved');
    setVoiceMessage('다시 재생합니다');
    playerRef.current?.play();
    updateVoiceDebug('command completed; play requested');
    voicePhaseRef.current = 'waiting_for_wake';
    activeWakeRef.current = null;
    updateVoiceDebug('returned to waiting_for_wake');
  }, [updateVoiceDebug]);

  const handleWakeWord = useCallback((wakeCommand: WakeVoiceCommand) => {
    if (voicePhaseRef.current === 'awaiting_command') return;
    voicePhaseRef.current = 'awaiting_command';
    setAgentLoopPhase('awaiting_command');
    activeWakeRef.current = wakeCommand;
    playerRef.current?.pause();
    updateVoiceDebug(`wake matched; pause requested: ${wakeCommand.originalTranscript}`);
    setVoiceStatus('awake');
    setVoiceMessage('네. 재생을 멈췄습니다.');
  }, [updateVoiceDebug]);

  const handlePlayerStateChange = useCallback(
    (nextState: YouTubePlayerState) => {
      setPlayerState(nextState);
      if (lastPlayerStateCodeRef.current === nextState.playerState) return;
      lastPlayerStateCodeRef.current = nextState.playerState;
      console.log(`[NoteAI player] state: ${playerStateLabel(nextState.playerState)} (${nextState.playerState})`);
      if (voicePhaseRef.current === 'awaiting_command' && nextState.playerState === 2) {
        updateVoiceDebug('player paused after wake word');
      }
      if (nextState.playerState === 1) {
        updateVoiceDebug('player playing');
      }
    },
    [updateVoiceDebug],
  );

  const startVoiceRecognition = useCallback(async () => {
    if (!source) {
      updateVoiceDebug('start skipped: no source');
      return;
    }
    if (!playerState.ready) {
      updateVoiceDebug('start skipped: player not ready');
      return;
    }
    if (!voiceModeEnabled) {
      updateVoiceDebug('start skipped: voice mode off');
      return;
    }
    if (commandInFlightRef.current) {
      updateVoiceDebug('start skipped: command in flight');
      return;
    }
    if (recognitionStartingRef.current) {
      updateVoiceDebug('start skipped: recognition already starting');
      return;
    }
    if (voiceRecognizing) {
      updateVoiceDebug('start skipped: already recognizing');
      return;
    }

    recognitionStartingRef.current = true;
    setVoiceStatus('permission_needed');
    setVoiceMessage('마이크와 음성 인식 권한을 확인하고 있습니다.');
    updateVoiceDebug('requesting speech permission');

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        updateVoiceDebug('permission denied');
        setVoiceStatus('error');
        setVoiceMessage('마이크/음성 인식 권한이 필요합니다. 설정에서 권한을 허용하거나 수동 저장을 사용하세요.');
        return;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        updateVoiceDebug('recognition unavailable');
        setVoiceStatus('error');
        setVoiceMessage('이 기기에서 음성 인식을 사용할 수 없습니다. 수동 저장을 사용하세요.');
        return;
      }

      const localeCandidates = await resolveSpeechLocaleCandidates();
      speechLocaleCandidatesRef.current = localeCandidates;
      speechLocaleAttemptRef.current = 0;
      const locale = localeCandidates[0] ?? 'en-US';
      setSpeechLocale(locale);

      updateVoiceDebug(`starting recognizer: ${locale}`);
      startNativeSpeechRecognition(locale);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '음성 인식을 시작할 수 없습니다.';
      updateVoiceDebug(`start failed: ${message}`);
      setVoiceStatus('error');
      setVoiceMessage(message);
    } finally {
      recognitionStartingRef.current = false;
    }
  }, [playerState.ready, source, updateVoiceDebug, voiceModeEnabled, voiceRecognizing]);

  useSpeechRecognitionEvent('start', () => {
    setVoiceRecognizing(true);
    updateVoiceDebug(`recognizer started: ${voicePhaseRef.current}`);
    if (voicePhaseRef.current === 'awaiting_command') {
      setVoiceStatus('awake');
      setVoiceMessage('네. 저장할 내용과 내 생각을 말해주세요.');
      return;
    }
    setVoiceStatus('listening');
    setVoiceMessage('“노트AI야”라고 부르면 영상을 멈추고 듣습니다.');
  });

  useSpeechRecognitionEvent('end', () => {
    setVoiceRecognizing(false);
    updateVoiceDebug(`recognizer ended: ${voicePhaseRef.current}`);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (transcript.length === 0) return;

    setVoiceTranscript(transcript);
    updateVoiceDebug(`result ${event.isFinal ? 'final' : 'interim'}: ${transcript}`);
    const wakeCommand = parseWakeWord(transcript);
    if (wakeCommand.action === 'wake_word') {
      if (!event.isFinal) {
        setVoiceStatus('heard');
        setVoiceMessage('호출어를 들었습니다. 말이 끝나면 재생을 멈춥니다.');
        return;
      }

      handleWakeWord(wakeCommand);
      const commandInWakeUtterance = parseVoiceCommand(transcript);
      if (commandInWakeUtterance.action === 'save_moment') {
        void handleVoiceCommand(commandInWakeUtterance);
        return;
      }
      if (commandInWakeUtterance.action === 'resume_playback') {
        handleResumeCommand(commandInWakeUtterance);
        return;
      }
      setVoiceTranscript('');
      return;
    }

    const activeWake = activeWakeRef.current;
    const command = parseVoiceCommand(transcript, {
      fallbackMatchedTrigger: activeWake?.matchedTrigger,
      fallbackTriggerTranscript: activeWake?.triggerTranscript,
      requireTrigger: voicePhaseRef.current === 'waiting_for_wake',
    });
    if (command.action === 'resume_playback') {
      if (!event.isFinal) {
        setVoiceStatus('heard');
        setVoiceMessage('재생 재개 명령을 들었습니다. 말을 마치면 다시 재생합니다.');
        return;
      }
      handleResumeCommand(command);
      return;
    }

    if (command.action === 'ignore') {
      if (voicePhaseRef.current === 'awaiting_command') {
        setVoiceStatus('awake');
        setVoiceMessage('듣고 있습니다. “방금 저장해줘”처럼 저장할 내용을 말해주세요.');
        return;
      }
      if (event.isFinal) {
        setVoiceStatus('ignored');
        setVoiceMessage('호출어가 아니어서 지나쳤습니다. “노트AI야”라고 먼저 불러주세요.');
      } else {
        setVoiceStatus('heard');
        setVoiceMessage('듣고 있습니다. “노트AI야”라고 부르면 멈추고 듣습니다.');
      }
      return;
    }

    if (!event.isFinal) {
      setVoiceStatus('heard');
      setVoiceMessage('저장 명령을 들었습니다. 말을 마치면 저장합니다.');
      return;
    }

    void handleVoiceCommand(command);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setVoiceRecognizing(false);
    updateVoiceDebug(`recognizer error: ${event.error} ${event.message ?? ''}`.trim());
    if (event.error === 'aborted') return;

    const nextLocale = getNextSpeechLocale(
      speechLocaleCandidatesRef.current,
      speechLocaleAttemptRef.current,
      event.message,
    );
    if (nextLocale && !speechLocaleRetryingRef.current) {
      speechLocaleRetryingRef.current = true;
      speechLocaleAttemptRef.current += 1;
      setSpeechLocale(nextLocale);
      setVoiceStatus('permission_needed');
      setVoiceMessage(`${speechLocale} 인식 엔진을 시작할 수 없어 ${nextLocale}로 다시 시도합니다.`);
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Native recognizer may already be inactive after an error event.
      }
      setTimeout(() => {
        try {
          startNativeSpeechRecognition(nextLocale);
        } catch {
          // A following error event will surface the failure to the user.
        } finally {
          speechLocaleRetryingRef.current = false;
        }
      }, 300);
      return;
    }

    setVoiceStatus('error');
    setVoiceMessage(formatSpeechRecognitionError(event.error, event.message));
  });

  useEffect(() => {
    if (!source) return;
    setVoiceModeEnabled(true);
    setVoiceStatus('permission_needed');
    setVoiceTranscript('');
    setVoiceMessage('영상이 준비되면 말로 저장을 시작합니다.');
    setAgentLoopPhase('waiting_for_wake');
    setVoiceDebug('새 영상 진단 대기 중');
    lastCommandKeyRef.current = null;
    voicePhaseRef.current = 'waiting_for_wake';
    activeWakeRef.current = null;
  }, [source?.id, source]);

  useEffect(() => {
    if (!source || !playerState.ready || !voiceModeEnabled || voiceRecognizing || saving || voiceStatus === 'error' || commandInFlightRef.current) return;
    const timer = setTimeout(() => {
      void startVoiceRecognition();
    }, 500);
    return () => clearTimeout(timer);
  }, [playerState.ready, saving, source, startVoiceRecognition, voiceModeEnabled, voiceRecognizing]);

  function toggleVoiceMode() {
    if (voiceModeEnabled) {
      setVoiceModeEnabled(false);
      setAgentLoopPhase('waiting_for_wake');
      setVoiceStatus('off');
      setVoiceMessage('말로 저장을 껐습니다. 수동 버튼은 계속 사용할 수 있습니다.');
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Native recognizer may already be inactive.
      }
      return;
    }

    setVoiceModeEnabled(true);
    setAgentLoopPhase('waiting_for_wake');
    setVoiceStatus('permission_needed');
    setVoiceMessage('말로 저장을 다시 시작합니다.');
  }

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
          <Text style={styles.kicker}>MVP1 · 말로 정확 저장</Text>
          <Text style={styles.title}>듣다가 말하면 바로 노트로</Text>
          <Text style={styles.body}>앱이 열린 동안 “노트AI야”라고 부르면 재생을 멈추고, 이어서 말한 저장 명령과 내 생각을 현재 timestamp에 붙입니다. 숨김/백그라운드 재생 없이 보이는 플레이어에서만 동작합니다.</Text>
        </View>

        <View style={styles.playerCard}>
          <Text style={styles.sourceTitle}>{activeSource.title}</Text>
          <Text style={styles.meta}>videoId · {activeSource.videoId}</Text>
          <YouTubePlayerView ref={playerRef} videoId={activeSource.videoId} onError={setError} onStateChange={handlePlayerStateChange} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.statusGrid}>
          <StatusTile label="현재 재생" value={formatSeconds(playerState.currentTimeSec)} />
          <StatusTile label="전체 길이" value={playerState.durationSec > 0 ? formatSeconds(playerState.durationSec) : '대기 중'} />
          <StatusTile label="플레이어" value={playerState.ready ? playerStateLabel(playerState.playerState) : '로딩 중'} />
        </View>

        <View style={[styles.voiceCard, voiceStatus === 'listening' && styles.voiceCardActive, voiceStatus === 'error' && styles.voiceCardError]}>
          <View style={styles.voiceHeader}>
            <View>
              <Text style={styles.voiceKicker}>말로 저장</Text>
              <Text style={styles.sectionTitle}>{voiceStatusLabel(voiceStatus)}</Text>
            </View>
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: voiceModeEnabled }} onPress={toggleVoiceMode} style={({ pressed }) => [styles.voiceToggle, !voiceModeEnabled && styles.voiceToggleOff, pressed && styles.buttonPressed]}>
              <Text style={styles.voiceToggleText}>{voiceModeEnabled ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>
          <Text style={styles.voiceMessage}>{voiceMessage}</Text>
          <Text style={styles.voiceLocale}>에이전트 상태 · {agentLoopPhaseLabel(agentLoopPhase)}</Text>
          <Text style={styles.voiceLocale}>인식 언어 · {speechLocale}</Text>
          <Text style={styles.voiceDebug}>진단 · {voiceDebug}</Text>
          <View style={styles.commandExampleBox}>
            <Text style={styles.commandExample}>“노트AI야” → “방금 저장해줘. 이건 온보딩 아이디어로 정리해줘.”</Text>
          </View>
          {voiceTranscript.length > 0 ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>방금 들은 말</Text>
              <Text style={styles.transcriptText}>{voiceTranscript}</Text>
            </View>
          ) : null}
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
            <Text style={styles.emptyText}>아직 저장한 구간이 없습니다. 재생 중 “노트AI야”라고 부른 뒤 저장할 내용을 말하거나 수동 버튼을 누르세요.</Text>
          ) : (
            captures.map((capture) => (
              <View key={capture.id} style={styles.captureRow}>
                <Text style={styles.captureTime}>{formatSeconds(capture.capturedAtSec)}</Text>
                <Text style={styles.captureMeta}>{capture.trigger ?? 'manual_button'} · 정확 저장</Text>
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

function startNativeSpeechRecognition(locale: string) {
  ExpoSpeechRecognitionModule.start({
    lang: locale,
    interimResults: true,
    continuous: true,
    maxAlternatives: 1,
    iosCategory: {
      category: AVAudioSessionCategory.playAndRecord,
      categoryOptions: [
        AVAudioSessionCategoryOptions.defaultToSpeaker,
        AVAudioSessionCategoryOptions.allowBluetooth,
        AVAudioSessionCategoryOptions.mixWithOthers,
      ],
      mode: AVAudioSessionMode.default,
    },
    iosVoiceProcessingEnabled: true,
    contextualStrings: ['Note AI', '노트 AI', '노트 에이', '방금 저장', '이 부분 저장', '듣던 부분 저장', '온보딩', '아이디어'],
  });
}

async function resolveSpeechLocaleCandidates(): Promise<string[]> {
  const preferredLocales = ['ko-KR', 'ko_KR', 'ko', 'en-US', 'en_US'];
  const fallbackLocales = ['ko-KR', 'en-US'];
  try {
    const supported = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    const normalizedSupported = supported.locales.map((locale) => ({
      locale,
      normalized: locale.replace(/_/g, '-').toLocaleLowerCase(),
    }));
    const matches = preferredLocales
      .map((locale) => locale.replace(/_/g, '-').toLocaleLowerCase())
      .map((preferred) => normalizedSupported.find((supportedLocale) => supportedLocale.normalized === preferred || supportedLocale.normalized.startsWith(`${preferred}-`)))
      .filter((supportedLocale): supportedLocale is { locale: string; normalized: string } => supportedLocale !== undefined)
      .map((supportedLocale) => supportedLocale.locale);
    return uniqueLocales([...matches, ...fallbackLocales]);
  } catch {
    return fallbackLocales;
  }
}

function getNextSpeechLocale(candidates: string[], currentIndex: number, message?: string): string | null {
  if (!isRetryableSpeechRecognizerMessage(message)) return null;
  return candidates[currentIndex + 1] ?? null;
}

function isRetryableSpeechRecognizerMessage(message?: string): boolean {
  const normalized = message?.toLocaleLowerCase() ?? '';
  return normalized.includes('initialize recognizer') || normalized.includes('recognizer is unavailable');
}

function formatSpeechRecognitionError(error: string, message?: string): string {
  const normalized = message?.toLocaleLowerCase() ?? '';
  if (normalized.includes('recognizer is unavailable') || normalized.includes('initialize recognizer')) {
    return 'iOS 음성 인식 서비스를 사용할 수 없습니다. 시뮬레이터의 Siri/Dictation 제한일 수 있어 실제 iPhone 테스트가 필요합니다.';
  }
  return message || `음성 인식 오류: ${error}`;
}

function uniqueLocales(locales: string[]): string[] {
  const seen = new Set<string>();
  return locales.filter((locale) => {
    const normalized = locale.replace(/_/g, '-').toLocaleLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}


function isResearchCommand(command: SaveVoiceCommand): boolean {
  return command.intent === 'research';
}

function agentLoopPhaseLabel(value: AgentLoopPhase): string {
  switch (value) {
    case 'waiting_for_wake':
      return '호출 대기 중';
    case 'awaiting_command':
      return '네. 재생을 멈췄습니다.';
    case 'processing':
      return '요청 처리 중';
    case 'saved':
      return '노트 저장 완료';
    case 'error':
      return '확인 필요';
  }
}

function voiceStatusLabel(value: VoiceStatus): string {
  switch (value) {
    case 'permission_needed':
      return '권한 확인 중';
    case 'listening':
      return '호출 대기 중';
    case 'awake':
      return '듣는 중';
    case 'heard':
      return '명령 확인 중';
    case 'ignored':
      return '저장 명령 아님';
    case 'saving':
      return '요청 처리 중';
    case 'saved':
      return '노트 저장 완료';
    case 'error':
      return '확인 필요';
    case 'off':
      return '꺼짐';
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
  voiceCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.heavy,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  voiceCardActive: {
    backgroundColor: colors.blockLime,
  },
  voiceCardError: {
    backgroundColor: colors.warning,
  },
  voiceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  voiceKicker: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  voiceToggle: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    minWidth: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  voiceToggleOff: {
    backgroundColor: colors.muted,
  },
  voiceToggleText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  voiceMessage: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 23,
  },
  voiceLocale: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  voiceDebug: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  commandExampleBox: {
    backgroundColor: colors.muted,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.md,
  },
  commandExample: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 23,
  },
  transcriptBox: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    borderWidth: borders.thick,
    padding: spacing.md,
  },
  transcriptLabel: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  transcriptText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 23,
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
