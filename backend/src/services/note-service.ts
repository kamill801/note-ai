import { randomUUID } from 'node:crypto';
import { generateKoreanNote, type GenerateNoteContext } from '../ai/note-generator.ts';
import { assertGeneratedNote, type GeneratedNote } from '../ai/note-schema.ts';
import { listCaptures } from './capture-service.ts';
import { selectSegmentsForCapture } from './segment-selection-service.ts';
import { getSourceById } from './source-service.ts';
import { getVoiceMemoByCaptureId } from './voice-memo-service.ts';

export type NoteRecord = {
  id: string;
  captureId: string;
  title: string;
  noteJson: GeneratedNote;
  evidenceSegmentIds: string[];
  followUpKeywords: string[];
  generationStatus: 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
};

const notesById = new Map<string, NoteRecord>();
const notesByCaptureId = new Map<string, NoteRecord>();

export function generateNoteForCapture(captureId: string): NoteRecord {
  const capture = listCaptures().find((item) => item.id === captureId);
  if (!capture) throw new Error('등록된 capture를 찾을 수 없습니다.');
  const source = getSourceById(capture.sourceId);
  if (!source) throw new Error('등록된 source를 찾을 수 없습니다.');
  const voiceMemo = getVoiceMemoByCaptureId(capture.id);
  if (!voiceMemo) throw new Error('노트 생성을 위해 사용자 음성 메모가 필요합니다.');

  const selection = selectSegmentsForCapture({ captureId: capture.id });
  const context: GenerateNoteContext = { source, selection, voiceMemo };
  const noteJson = generateKoreanNote(context);
  assertGeneratedNote(noteJson);

  const now = new Date().toISOString();
  const note: NoteRecord = {
    id: `note_${randomUUID()}`,
    captureId: capture.id,
    title: noteJson.title,
    noteJson,
    evidenceSegmentIds: noteJson.evidenceSegmentIds,
    followUpKeywords: noteJson.followUpKeywords,
    generationStatus: 'succeeded',
    createdAt: now,
    updatedAt: now,
  };

  notesById.set(note.id, note);
  notesByCaptureId.set(note.captureId, note);
  return note;
}

export function getNoteByCaptureId(captureId: string): NoteRecord | undefined {
  return notesByCaptureId.get(captureId);
}

export function getNoteById(noteId: string): NoteRecord | undefined {
  return notesById.get(noteId);
}

export function listNotes(): NoteRecord[] {
  return [...notesById.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resetNotesForTest(): void {
  notesById.clear();
  notesByCaptureId.clear();
}
