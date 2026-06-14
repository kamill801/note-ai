export type GeneratedNote = {
  title: string;
  timestampLabel: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  userMemoSummary: string;
  applicationIdeas: string[];
  followUpKeywords: string[];
  recommendedMaterials: Array<{
    title: string;
    reason: string;
    url: string;
  }>;
  evidenceSegmentIds: string[];
  sourceEvidence: Array<{
    segmentId: string;
    timestampLabel: string;
    text: string;
  }>;
};

export function assertGeneratedNote(value: unknown): asserts value is GeneratedNote {
  if (typeof value !== 'object' || value === null) throw new Error('note must be an object');
  const note = value as Record<string, unknown>;
  for (const key of ['title', 'timestampLabel', 'confidence', 'summary', 'userMemoSummary']) {
    if (typeof note[key] !== 'string' || note[key].length === 0) throw new Error(`note.${key} must be a non-empty string`);
  }
  if (!['high', 'medium', 'low'].includes(note.confidence as string)) throw new Error('note.confidence is invalid');
  for (const key of ['applicationIdeas', 'followUpKeywords', 'recommendedMaterials', 'evidenceSegmentIds', 'sourceEvidence']) {
    if (!Array.isArray(note[key])) throw new Error(`note.${key} must be an array`);
  }
}
