import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './src/design/tokens';
import type { NoteRecord, ResearchJob, SourceSummary, TimestampCapture } from './src/domain/source';
import { HomeScreen } from './src/screens/HomeScreen';
import { ImportSourceScreen } from './src/screens/ImportSourceScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { CaptureModeScreen } from './src/screens/CaptureModeScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { NoteLibraryScreen } from './src/screens/NoteLibraryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { listNotes, listSources } from './src/services/api';
import {
  createShortcutActionGate,
  parseShortcutAction,
  type CaptureNowShortcutAction,
} from './src/services/shortcut-action';
import {
  clearPendingCaptureRequest,
  readPendingCaptureRequest,
} from './src/services/pending-capture-native';
import { pendingRequestToShortcutAction } from './src/services/pending-capture-request';

type Tab = 'home' | 'import' | 'player' | 'capture' | 'library' | 'noteDetail' | 'settings';


export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedSource, setSelectedSource] = useState<SourceSummary | null>(null);
  const [latestCapture, setLatestCapture] = useState<TimestampCapture | null>(null);
  const [latestNote, setLatestNote] = useState<NoteRecord | null>(null);
  const [latestResearchJob, setLatestResearchJob] = useState<ResearchJob | null>(null);
  const [pendingShortcutAction, setPendingShortcutAction] = useState<CaptureNowShortcutAction | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);
  const shortcutActionGateRef = useRef(createShortcutActionGate({ dedupeWindowMs: 1500 }));

  const handleShortcutUrl = useCallback((url: string) => {
    const action = parseShortcutAction(url);
    if (action.action !== 'capture_now') return;
    if (!shortcutActionGateRef.current.shouldAccept(action)) return;
    setPendingShortcutAction(action);
    setTab('player');
  }, []);

  const handleShortcutActionHandled = useCallback(() => {
    const handledActionId = pendingShortcutAction?.id;
    if (handledActionId) {
      void clearPendingCaptureRequest(handledActionId);
    }
    setPendingShortcutAction(null);
  }, [pendingShortcutAction?.id]);

  const handleNativePendingRequest = useCallback(async () => {
    const request = await readPendingCaptureRequest();
    if (!request) return;
    const action = pendingRequestToShortcutAction(request);
    if (!shortcutActionGateRef.current.shouldAccept(action)) return;
    setPendingShortcutAction(action);
    setTab('player');
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      setStartupError(null);
      try {
        const [sources, notes] = await Promise.all([listSources(), listNotes()]);
        if (!active) return;
        setSelectedSource((current) => current ?? sources[0] ?? null);
        setLatestNote((current) => current ?? notes[0] ?? null);
      } catch (caught) {
        if (!active) return;
        setStartupError(caught instanceof Error ? caught.message : '로컬 API 상태를 확인할 수 없습니다.');
      } finally {
        if (active) setHydrating(false);
      }
    }

    void hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Linking.getInitialURL()
      .then((url) => {
        if (!active || url === null) return;
        handleShortcutUrl(url);
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : 'Shortcut URL을 확인할 수 없습니다.';
        setStartupError(message);
      });

    const subscription = Linking.addEventListener('url', (event) => {
      handleShortcutUrl(event.url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [handleShortcutUrl]);

  useEffect(() => {
    void handleNativePendingRequest();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void handleNativePendingRequest();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleNativePendingRequest]);

  function handleSourceReady(source: SourceSummary) {
    setSelectedSource(source);
    setLatestCapture(null);
    setLatestNote(null);
    setLatestResearchJob(null);
    setTab('player');
  }

  function handleCaptureSaved(capture: TimestampCapture) {
    setLatestCapture(capture);
    setLatestNote(null);
    setLatestResearchJob(null);
    setTab('capture');
  }

  function handleNoteReady(note: NoteRecord) {
    setLatestNote(note);
    setLatestResearchJob(null);
    setTab('noteDetail');
  }

  function handleOpenNote(note: NoteRecord) {
    setLatestNote(note);
    setLatestResearchJob(null);
    setTab('noteDetail');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {tab === 'home' ? (
          <HomeScreen
            hydrating={hydrating}
            latestNote={latestNote}
            latestSource={selectedSource}
            onImportPress={() => setTab('import')}
            onListenPress={() => setTab('player')}
            onNotesPress={() => setTab(latestNote ? 'noteDetail' : 'library')}
            onSettingsPress={() => setTab('settings')}
            startupError={startupError}
          />
        ) : null}
        {tab === 'import' ? <ImportSourceScreen onSourceReady={handleSourceReady} /> : null}
        {tab === 'player' ? (
          <PlayerScreen
            source={selectedSource}
            shortcutAction={pendingShortcutAction}
            onCaptureSaved={handleCaptureSaved}
            onNoteReady={handleNoteReady}
            onShortcutActionHandled={handleShortcutActionHandled}
          />
        ) : null}
        {tab === 'capture' ? <CaptureModeScreen latestCapture={latestCapture} onNoteReady={handleNoteReady} /> : null}
        {tab === 'library' ? <NoteLibraryScreen latestNote={latestNote} onOpenNote={handleOpenNote} /> : null}
        {tab === 'noteDetail' ? <NoteDetailScreen note={latestNote} researchJob={latestResearchJob} onResearchReady={setLatestResearchJob} /> : null}
        {tab === 'settings' ? <SettingsScreen /> : null}
      </View>
      <View style={styles.tabBar}>
        <TabButton active={tab === 'home'} label="홈" onPress={() => setTab('home')} />
        <TabButton active={tab === 'import'} label="등록" onPress={() => setTab('import')} />
        <TabButton active={tab === 'player'} label="듣기" onPress={() => setTab('player')} />
        <TabButton active={tab === 'library' || tab === 'noteDetail'} label="노트" onPress={() => setTab('library')} />
        <TabButton active={tab === 'settings'} label="설정" onPress={() => setTab('settings')} />
      </View>
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={styles.tabLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.ink,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    padding: spacing.md,
  },
  tabButtonActive: {
    backgroundColor: colors.blockLime,
  },
  tabLabel: {
    color: colors.ink,
    fontWeight: '900',
  },
});
