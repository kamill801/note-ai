# Design References

Status: Neo Brutalism selected for MVP1
Last updated: 2026-06-15

This file supports the `product-ideation-workflow` design stage. It is not the final design lock. Final choices must be reflected in `DESIGN.md` before development starts.

Current design lock:

- MVP1 visual style: Neo Brutalism.
- Signature color: Block Lime `#dceeb1`.
- Active implementation contract: root `DESIGN.md`.
- Active visual board: `docs/design-review.html`.

## MVP1 Final Reference Translation

The final MVP1 design does not copy one product. It combines reference behavior with a Neo Brutalist visual system:

- Snipd -> save while listening.
- Readwise Reader -> source-backed highlights and transcript evidence.
- mymind -> low-organization personal memory.
- Granola -> quiet AI note transformation.
- Voicenotes -> speak, finish, walk away with clarity.

Neo Brutalism application rules:

- Use bold borders and hard offset shadows for functional hierarchy.
- Use Block Lime only for actions/states, not full-screen decoration.
- Keep note-reading surfaces legible; brutalism should not fight the content.
- Keep product language direct: `이 부분 저장`, `방금 저장`, `내 생각 말하기`.
- Avoid turning the app into a playful dashboard; it is still a serious knowledge capture utility.

## Reference Candidates

### 1. Snipd

Use for:

- Moving-context capture.
- Prominent capture action during playback.
- Audio/player surface with transcript and saved moments nearby.

Observed signals:

- Snipd positions itself around saving insights while listening.
- It highlights "Create snip" as a primary action.
- It supports transcript, summary, headphone snipping, and YouTube imports.
- Current official positioning emphasizes saving insights while listening, including headphones-based capture and AI-created snips with audio, transcript, and summary.

Design takeaways for note-ai:

- The capture button should be large, thumb-friendly, and impossible to miss.
- The player surface should keep transcript/evidence nearby.
- Avoid copying Snipd's podcast-first identity; our wedge is YouTube/source-moment plus user intent memo.

### 2. Readwise Reader

Use for:

- Knowledge-worker trust.
- Source evidence and highlight management.
- Dense but calm note/review surfaces.

Observed signals:

- Reader focuses on saving everything into one reading workflow.
- It supports YouTube transcript highlighting.
- It emphasizes annotation, highlighting, search, and revisiting saved knowledge.
- Current official positioning emphasizes YouTube transcript highlighting and a unified reading/highlighting workflow for power readers.

Design takeaways for note-ai:

- Notes should feel evidence-backed, not magical.
- Timestamp, transcript excerpt, and user memo should be visible as first-class content.
- Search and retrieval can feel serious and utilitarian rather than playful.

### 3. Matter

Use for:

- Premium mobile reading/listening tone.
- Light/dark mode contrast.
- Smooth switching between audio and text.

Observed signals:

- Matter describes itself as a modern read-later app for iPhone, iPad, and web.
- It supports saving YouTube and podcast episodes with time-synced text.
- It emphasizes "capture knowledge as you go" and audio highlights.

Design takeaways for note-ai:

- A premium mobile utility style fits the target better than a generic SaaS dashboard.
- Text/audio switching should feel native and calm.
- Dark mode can work well for listening contexts, but capture/recording states need high contrast.

### 4. mymind

Use for:

- Private personal knowledge space.
- Minimal organization burden.
- Memory-like brand language.

Observed signals:

- mymind emphasizes "Remember everything. Organize nothing."
- It frames saved knowledge as private and free from social pressure, ads, and vanity metrics.
- It emphasizes saving without filing, labeling, or tagging.
- Current official positioning emphasizes quick notes on the go, private saved knowledge, automatic content enrichment, and beautiful/simple design.

Design takeaways for note-ai:

- The product should not ask users to organize while moving.
- The library can be auto-organized by source, topic, intent, and recent captures.
- Avoid making the app feel like a productivity chore.

### 5. Granola

Use for:

- Quiet AI note transformation.
- Minimal post-capture note structure.
- Showing output without making the user manage formatting.

Observed signals:

- Granola positions itself as an AI notepad where notes, actions, and memory are handled quietly.
- It shows enhanced notes, follow-up actions, and queryable meeting memory without overwhelming the primary note surface.

Design takeaways for note-ai:

- AI output should look like a clean note, not a dashboard.
- Keep generated sections few and obvious.
- Make the user's original note and the AI-enhanced note clearly distinct.

### 6. Voicenotes

Use for:

- Simple record/capture mental model.
- Clear sequence: record, stay present, walk away with clarity.
- Memo-first capture for non-desk contexts.

Observed signals:

- Voicenotes explains the workflow as hit record, stay in the conversation, then receive a clear summary and action items.
- It emphasizes recording, transcript, and key points living together in one place.

Design takeaways for note-ai:

- MVP1 should make the capture action feel obvious in one glance.
- Avoid exposing too many AI sections before the user has saved anything.
- Generated notes should group recording/source evidence, transcript, and key points together.

## Candidate Visual Directions

## Round 3 Reference Synthesis

Product-fit references:

- Snipd: use the "save while listening" mental model, but do not copy podcast identity.
- Readwise Reader: use source-backed highlights, transcript evidence, and serious reading trust.
- Granola / Voicenotes: use simple capture-to-clarity flow and quiet AI enhancement.
- mymind / Reflect: use private memory and low-organization note storage.
- Heptabase / Tana / Notion AI: use source-linked knowledge and AI output as a work artifact, not as a magic interface.

Style references to test:

1. Editorial Minimal
   - Clean, readerly, strong typography, restrained UI chrome.
   - Best match for Note AI because it makes notes and evidence feel trustworthy.
2. Bento Knowledge
   - Modular cards and grouped content.
   - Useful for results and research, but risky if every feature becomes a card.
3. Neo Brutalism
   - Bold borders, direct affordances, memorable brand personality.
   - Useful as a differentiation test, but too loud for long-form notes.
4. Liquid Glass / Glassmorphism
   - Native, layered, modern mobile feel.
   - Useful for transient overlays, but risky for outdoor readability while moving.
5. Material Expressive
   - Friendlier shapes, vivid accents, more emotional UI.
   - Useful for onboarding and empty states, but must not become toy-like.

Round 3 UX language decision:

```txt
Do not use "캡처" in primary UI.
Use "방금 저장", "듣던 부분", "내 생각 추가", and "노트로 정리됨".
```

Round 3 recommendation:

```txt
Primary visual style: Editorial Minimal
Signature color: Block Lime #dceeb1
Secondary style influences:
- Snipd/Voicenotes for the listening save moment
- Readwise/Reflect for note review
- mymind for low-organization library
```

### Round 2 Direction Principles

User feedback:

- Use Block Lime `#dceeb1` as the main/signature color.
- Drop the previous dark A direction because readability was too low.
- Keep B as the main direction.
- Borrow C's personal-memory feeling only where it reduces organization burden.
- Reduce UI/UX complexity and prioritize intuitive function plus polished visuals.

Round 2 design rule:

```txt
Evidence Notebook is the visual base.
Block Lime is the signature system color.
The user should understand the primary action in one second.
```

### Round 2 Direction 1: Lime Capture Note

- Best reference: Snipd + Voicenotes.
- Feel: exact capture, simple, mobile, one obvious action.
- Color direction: light/neutral shell with Block Lime save sheet and graphite button.
- Best for: MVP1 playback/capture screen.
- Risk: can feel too utility-only unless the note result is previewed quickly.

### Round 2 Direction 2: Evidence Note Home

- Best reference: Readwise Reader + Granola.
- Feel: calm, readable, source-backed, beautiful but not decorative.
- Color direction: warm paper base, white cards, Block Lime hero note, graphite text, green secondary action.
- Best for: default home and generated note review.
- Risk: capture action needs persistent access so it does not feel like a passive note app.

### Round 2 Direction 3: Simple Memory Stack

- Best reference: mymind + Readwise Reader.
- Feel: private knowledge stack, low-organization, recent saved moments.
- Color direction: warm paper base, Block Lime primary cards, small amber/violet status accents.
- Best for: library/review.
- Risk: can drift into saved-content app if source-time capture is not visible.

### Direction A: Listening Console

- Best reference: Snipd + Matter.
- Feel: focused, dark, playback-first, capture button as the hero control.
- Color direction: charcoal base, off-white text, vivid mint or green capture accent, restrained amber for processing.
- Best for: MVP1 player/capture screen.
- Risk: can feel too podcast-player-like if notes/research are visually secondary.

### Direction B: Evidence Notebook

- Best reference: Readwise Reader + Matter.
- Feel: calm, trustworthy, readable, source-backed.
- Color direction: warm white or soft gray base, ink text, blue or teal action accent, subtle yellow highlight evidence.
- Best for: note detail, transcript evidence, research results.
- Risk: capture screen may feel too desk-oriented unless the primary action stays large.

### Direction C: Private Memory

- Best reference: mymind + Readwise.
- Feel: quiet, personal, private, low-organization.
- Color direction: soft off-white base, graphite text, muted violet or sage accent, low-saturation content cards.
- Best for: source library and saved idea review.
- Risk: could become too moodboard-like unless playback/timestamp precision stays visible.

## Recommended MVP Direction

Start with a hybrid:

```txt
Listening Console for Player/Capture
+ Evidence Notebook for Note Detail
+ Private Memory restraint for Library
```

The primary visual decision still needs user confirmation:

- dark-first vs light-first;
- capture accent color;
- whether the app should feel more "audio tool", "knowledge notebook", or "private memory".
