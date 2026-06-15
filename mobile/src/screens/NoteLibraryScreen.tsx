import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borders, colors, radii, shadows, spacing, typography } from '../design/tokens';
import type { NoteRecord } from '../domain/source';
import { listNotes } from '../services/api';

type Props = {
  latestNote: NoteRecord | null;
  onOpenNote: (note: NoteRecord) => void;
};

export function NoteLibraryScreen({ latestNote, onOpenNote }: Props) {
  const [notes, setNotes] = useState<NoteRecord[]>(latestNote ? [latestNote] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshNotes();
  }, [latestNote?.id]);

  async function refreshNotes() {
    setLoading(true);
    setError(null);
    try {
      const nextNotes = await listNotes();
      const merged = mergeLatestNote(nextNotes, latestNote);
      setNotes(merged);
    } catch (caught) {
      if (latestNote) setNotes([latestNote]);
      setError(caught instanceof Error ? caught.message : '노트 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Library</Text>
          <Text style={styles.title}>저장한 생각 노트</Text>
          <Text style={styles.body}>내가 저장한 순간과 음성 메모가 함께 남아있는 노트입니다.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={refreshNotes} style={({ pressed }) => [styles.refreshButton, pressed && styles.buttonPressed]}>
          <Text style={styles.refreshButtonText}>{loading ? '불러오는 중…' : '노트 새로고침'}</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {notes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.sectionTitle}>아직 노트가 없습니다</Text>
            <Text style={styles.body}>듣기 화면에서 “이 부분 저장”을 누른 뒤 내 생각을 남기면 노트가 생성됩니다.</Text>
          </View>
        ) : (
          notes.map((note) => (
            <Pressable key={note.id} accessibilityRole="button" onPress={() => onOpenNote(note)} style={({ pressed }) => [styles.noteCard, pressed && styles.buttonPressed]}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteSummary}>{note.noteJson.summary}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>{note.noteJson.timestampLabel}</Text>
                <Text style={styles.metaPill}>근거 {note.evidenceSegmentIds.length}개</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function mergeLatestNote(notes: NoteRecord[], latestNote: NoteRecord | null): NoteRecord[] {
  if (!latestNote) return notes;
  if (notes.some((note) => note.id === latestNote.id)) return notes;
  return [latestNote, ...notes];
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
  refreshButton: {
    alignItems: 'center',
    backgroundColor: colors.hotPink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  refreshButtonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  noteCard: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: borders.thick,
    gap: spacing.md,
    padding: spacing.lg,
  },
  noteTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    lineHeight: 29,
  },
  noteSummary: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
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
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
});
