import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './src/design/tokens';
import type { NoteRecord, ResearchJob, SourceSummary, TimestampCapture } from './src/domain/source';
import { HomeScreen } from './src/screens/HomeScreen';
import { ImportSourceScreen } from './src/screens/ImportSourceScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { CaptureModeScreen } from './src/screens/CaptureModeScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';

type Tab = 'home' | 'import' | 'player' | 'capture' | 'note';


export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedSource, setSelectedSource] = useState<SourceSummary | null>(null);
  const [latestCapture, setLatestCapture] = useState<TimestampCapture | null>(null);
  const [latestNote, setLatestNote] = useState<NoteRecord | null>(null);
  const [latestResearchJob, setLatestResearchJob] = useState<ResearchJob | null>(null);

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
    setTab('note');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {tab === 'home' ? <HomeScreen /> : null}
        {tab === 'import' ? <ImportSourceScreen onSourceReady={handleSourceReady} /> : null}
        {tab === 'player' ? <PlayerScreen source={selectedSource} onCaptureSaved={handleCaptureSaved} /> : null}
        {tab === 'capture' ? <CaptureModeScreen latestCapture={latestCapture} onNoteReady={handleNoteReady} /> : null}
        {tab === 'note' ? <NoteDetailScreen note={latestNote} researchJob={latestResearchJob} onResearchReady={setLatestResearchJob} /> : null}
      </View>
      <View style={styles.tabBar}>
        <TabButton active={tab === 'home'} label="홈" onPress={() => setTab('home')} />
        <TabButton active={tab === 'import'} label="링크 등록" onPress={() => setTab('import')} />
        <TabButton active={tab === 'player'} label="정확 저장" onPress={() => setTab('player')} />
        <TabButton active={tab === 'capture'} label="내 생각" onPress={() => setTab('capture')} />
        <TabButton active={tab === 'note'} label="노트" onPress={() => setTab('note')} />
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
