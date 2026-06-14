# Research: YouTube App Capture With Transcript-Based Segment Estimation

Date: 2026-06-14

## Research Question

How should a mobile-first "voice capture while listening to YouTube" product estimate the most likely segment when the user keeps listening in the official YouTube app, and what can be learned from LilysAI's public behavior?

## Direct Recommendation

Updated decision after product review: split the product into two modes.

MVP1 should use an in-app visible YouTube player as a **functional validation mode** because it can capture exact playback time and prove the full pipeline end to end. MVP2 should use the official YouTube app as the user's default listening surface and estimate the segment from:

1. a YouTube URL/video ID,
2. timestamped transcript segments when available,
3. the user's spoken memo and intent,
4. semantic/keyword matching over transcript windows,
5. a confidence score and editable suggested segment.

The product should therefore use two labels:

- `앱 내 재생 기반 정확 저장`: exact timestamp capture while the user plays inside our app.
- `YouTube 앱 연동형 추정 저장`: estimated segment capture while the user keeps listening in the official YouTube app.

In estimated mode, the product must show "estimated segment" rather than pretending to know the exact playback position.

## What LilysAI Publicly Shows

Confirmed from LilysAI public pages:

- LilysAI accepts YouTube videos, audio, PDFs, articles, books, and websites as sources.
- Its public example exposes a "Script" area with timestamped transcript rows such as `0:00`, `0:08`, and speaker names.
- Its summary contains source markers like `[188] source view`, implying summary claims are linked back to source transcript units.
- The help center describes YouTube playlist summarization by copying a playlist link and pasting it into LilysAI; LilysAI then automatically detects and summarizes the playlist as a unified knowledge source.
- The Chrome Web Store listing describes LilysAI as a web clipper that saves and summarizes YouTube videos and web pages, and declares that the extension handles website content.

Important inference:

LilysAI's public behavior looks transcript-first, not playback-first. The product appears to ingest a link/source, build a timestamped script, generate summaries from that script, and link output claims back to script units. There is no public evidence that LilysAI reads a user's current playback position from the official YouTube mobile app.

## What We Can Infer About LilysAI's Technical Pattern

The likely architecture is:

1. Source ingestion
   - User pastes a YouTube URL, playlist URL, web URL, or uploads a file/audio source.
   - Browser extension can collect current page URL/content for web and YouTube surfaces.

2. Transcript extraction
   - For videos, obtain or generate a transcript with timestamped segments.
   - Store transcript units as rows with `start_sec`, `end_sec`, `speaker`, `text`, `language`, and source metadata.

3. Normalization and translation
   - Normalize captions into consistent windows.
   - Translate or bilingual-render transcript text when needed.

4. Summary generation
   - Generate hierarchical summaries from transcript chunks.
   - Preserve source references by attaching each generated claim/section to transcript segment IDs.

5. Source-grounded UX
   - User clicks a source marker.
   - App opens the transcript row or seeks a player to the corresponding timestamp when a player is available.

This is the most relevant reference for us: build a timestamped source ledger first, then generate notes with provenance.

## YouTube Policy and API Constraints

### Official Captions API Is Not Enough for Public Videos

YouTube's official `captions.list` can list caption tracks for a specified video, but the response does not contain actual caption text. The `captions.download` endpoint returns the caption track and supports formats such as `srt`, `ttml`, and `vtt`, but it requires the user to have permission to edit the video.

Implication:

We should not assume official YouTube Data API captions can fetch arbitrary public video transcripts for our users.

### Avoid Unofficial Download/Audio Extraction As A Core Requirement

YouTube's developer policies prohibit downloading, caching, or storing copies of YouTube audiovisual content without prior written approval. They also prohibit background-player behavior, modifying or blocking YouTube player functionality/ads, separating audio/video components, and using non-YouTube API technology to retrieve YouTube API Data.

Implication:

The MVP should avoid:

- downloading YouTube audio,
- providing background YouTube playback inside our app,
- stripping audio from video,
- modifying or hiding the YouTube player,
- building a YouTube replacement UX.

### IFrame Player Is Useful For MVP1 Exact Save Mode

The YouTube IFrame Player API exposes `getCurrentTime()` and `seekTo()`. This solves exact timestamp capture only if the user is watching inside our embedded player.

Implication:

In-app player mode is appropriate for MVP1 functional validation, as long as the embedded YouTube player remains visible and the app does not become a hidden/background YouTube audio player. The official YouTube app linked mode remains the better long-term habit-preserving flow, but it should be implemented after the exact-save pipeline is proven.

## Recommended MVP Technical Architecture

### 1. Capture Surfaces

Support multiple capture paths, ranked by practicality:

1. Share-sheet capture
   - User shares the current YouTube video URL to our app.
   - Lowest policy risk and easiest to make reliable.

2. Voice shortcut capture
   - iOS: "Hey Siri, save this to Note AI" triggers a Shortcut/App Intent.
   - Apple's Shortcuts guide says Siri can run shortcuts by name, and Shortcuts can receive onscreen items from supported apps.
   - This may provide a URL when the app/screen supports it, but should not be treated as guaranteed for YouTube.

3. Clipboard fallback
   - If the user copied a YouTube URL recently, the app can ask to use that URL.

4. Last-active-source fallback
   - If the user previously registered/opened a video in our app, a later voice capture can attach to that last source.

5. Optional precision mode
   - User plays inside our app's YouTube embed.
   - We can use `getCurrentTime()` for exact timestamp and `seekTo()` for source review.

### 2. Transcript Provider Abstraction

Create a `TranscriptProvider` interface so the product is not locked to one brittle ingestion source:

```ts
type TranscriptSegment = {
  id: string;
  videoId: string;
  sourceUrl: string;
  lang: string;
  startSec: number;
  endSec: number | null;
  speaker?: string;
  text: string;
  isAutoGenerated?: boolean;
  confidence?: number;
};

type TranscriptProviderResult = {
  provider: "official_captions" | "user_supplied" | "page_transcript" | "manual" | "third_party";
  policyRisk: "low" | "medium" | "high";
  segments: TranscriptSegment[];
  warnings: string[];
};
```

Provider strategy:

- `official_captions`: only for videos where the authenticated user has permission.
- `user_supplied`: user pastes transcript or uploads a subtitle file.
- `page_transcript`: experimental; requires policy/legal review before production.
- `manual`: user enters key phrase only; no full transcript, use note-only mode.
- `third_party`: only after legal and ToS review.

### 3. Transcript Indexing

For each video:

1. Normalize captions into 20-90 second sliding windows.
2. Keep raw caption segments for precise source display.
3. Store both:
   - sparse text index for exact keyword and phrase match,
   - vector embeddings for semantic search.

Recommended database tables:

- `sources`: YouTube video/playlist metadata.
- `transcript_segments`: raw caption rows.
- `transcript_windows`: merged chunks for retrieval.
- `captures`: user's voice-triggered capture events.
- `capture_matches`: candidate transcript windows with scores.
- `notes`: generated Korean note output.
- `note_citations`: mapping from note sections to transcript segments/windows.

### 4. Segment Estimation Algorithm

Input:

- YouTube URL or last known video ID.
- User voice memo transcript: e.g. "방금 리텐션 루프 이야기 저장해줘. 내 서비스 온보딩 아이디어로 정리해줘."
- Optional user hint: "방금", "아까", "이 주제", "사업 아이디어로".
- Optional approximate capture time if the user started playback through our app or shared timestamped URL.

Pipeline:

1. Transcribe user's memo.
2. Classify intent:
   - summary note,
   - idea note,
   - research note,
   - content draft note.
3. Extract anchors:
   - quoted phrase candidates,
   - named entities,
   - domain terms,
   - verbs like "적용", "검색", "공부", "블로그".
4. Retrieve candidate transcript windows:
   - BM25/sparse keyword score,
   - embedding similarity score,
   - optional temporal prior score,
   - optional recency score from last capture on same video.
5. Re-rank with an LLM:
   - "Which transcript window best matches the user's spoken memo and intent?"
   - Return top window, neighboring context, confidence, and rationale.
6. Generate the Korean note using only selected transcript evidence plus the user's memo.
7. Attach source citations:
   - note section -> transcript segment IDs,
   - display estimated start/end seconds,
   - show confidence.

Example scoring:

```txt
final_score =
  0.45 * semantic_similarity +
  0.30 * keyword_overlap +
  0.15 * entity_overlap +
  0.10 * temporal_prior
```

If there is no reliable timestamp prior, set `temporal_prior = 0` and rely on semantic/keyword matching.

### 5. Confidence UX

Never hide uncertainty. Display:

- "추정 구간: 12:34-13:20"
- "신뢰도: 높음/중간/낮음"
- "근거: 사용자 메모의 '리텐션 루프', '온보딩'과 자막 내 'retention loop', 'first user action'이 일치"
- "다른 후보 보기"

This turns an imperfect technical constraint into a trustworthy product behavior.

### 6. Note Generation Contract

For each capture, generate:

```json
{
  "source": {
    "platform": "youtube",
    "url": "...",
    "videoId": "...",
    "estimatedStartSec": 754,
    "estimatedEndSec": 820,
    "confidence": "medium"
  },
  "userMemo": {
    "rawAudioUrl": "...",
    "transcript": "...",
    "intent": "idea_note"
  },
  "evidence": [
    {
      "segmentId": "...",
      "startSec": 754,
      "endSec": 782,
      "text": "..."
    }
  ],
  "note": {
    "title": "...",
    "summary": "...",
    "userInsight": "...",
    "applicationIdeas": ["..."],
    "followUpSearchKeywords": ["..."],
    "recommendedMaterials": ["..."]
  }
}
```

## Why This Is Better Than In-App Playback For MVP

This architecture preserves the user's existing YouTube habit. It gives up exact current-time capture in exchange for:

- lower policy risk,
- lower UX friction,
- faster MVP build,
- compatibility with YouTube official app usage,
- a clear path to improve accuracy later.

The hard technical problem becomes retrieval quality, not media playback ownership. That is a better problem for this product because the wedge is "my intent-aware knowledge note", not "a better YouTube player".

## Open Technical Risks

1. Transcript availability
   - Some videos may have no accessible transcript.
   - Need fallback note-only mode.

2. Legal/ToS boundary
   - Arbitrary transcript extraction from YouTube public pages needs review.
   - Official captions API is not enough for all public videos.

3. Ambiguous user memo
   - "방금 이거 저장해줘" with no phrase may be hard without playback timestamp.
   - UX should prompt one short follow-up: "어떤 내용이었나요?"

4. Long videos
   - Matching across 2-3 hour videos can be expensive.
   - Need chunking, caching, and retrieval indexes.

5. Multilingual videos
   - Need language detection and optional Korean translation.

## Product Implication

MVP positioning should be:

> YouTube를 대체하는 앱이 아니라, YouTube를 듣다가 떠오른 생각을 음성으로 붙잡아 timestamped transcript 위에 정리하는 지식 캡처 레이어.

## Sources

- LilysAI landing page: https://lilys.ai/
- LilysAI Chrome Web Store listing: https://chromewebstore.google.com/detail/lilysai-save-and-summariz/ooipofofnficlkcfhfncjiccaoceaodh
- LilysAI Help Center, YouTube playlists: https://help.lilys.ai/en/articles/12553485-youtube-playlists-summarized-in-one-click
- LilysAI Help Center, Deep Search: https://help.lilys.ai/en/articles/12469136-deeper-more-accurate-search-with-deep-search
- YouTube Captions list API: https://developers.google.com/youtube/v3/docs/captions/list
- YouTube Captions download API: https://developers.google.com/youtube/v3/docs/captions/download
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- YouTube API Services Developer Policies: https://developers.google.com/youtube/terms/developer-policies
- Apple Shortcuts, Siri: https://support.apple.com/guide/shortcuts/run-shortcuts-with-siri-apd07c25bb38/ios
- Apple Shortcuts, onscreen items: https://support.apple.com/guide/shortcuts/receive-onscreen-items-apd350ce757a/ios
- OpenAI speech-to-text guide: https://developers.openai.com/api/docs/guides/speech-to-text
- OpenAI embeddings guide: https://developers.openai.com/api/docs/guides/embeddings
- OpenAI retrieval guide: https://developers.openai.com/api/docs/guides/retrieval
