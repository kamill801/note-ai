# NoteAI Voice Wake Debug Handoff

Use this document as a copy-paste handoff for another AI/debugger. The goal is to diagnose why the current NoteAI iOS dev build does not reliably react when the user says "노트AI야" while a YouTube video is playing inside the app.

## Product Context

NoteAI is a mobile-first YouTube knowledge capture app.

Core user flow:

1. User registers a YouTube URL in the app.
2. User plays the visible in-app YouTube player.
3. While listening, user says a wake phrase like "노트AI야".
4. App should pause the video immediately.
5. App should listen for the follow-up command, for example:
   - "방금 내용 요약해줘."
   - "방금 부분 저장해줘. 이건 온보딩 아이디어로 정리해줘."
   - "방금 플랫폼 정책 얘기 조사해줘. 그리고 다시 재생해줘."
6. App should capture the current YouTube timestamp, create a capture, create a voice memo, generate a Korean note, optionally create a research job, and resume playback if the command requests it.

Important product constraint:

- MVP1 uses a visible in-app YouTube player.
- It must not hide YouTube playback.
- It must not download/extract YouTube audio.
- It must not read the official YouTube app's playback state.
- The wake/capture behavior only needs to work while the NoteAI app is open in the foreground for MVP1.

## Current Repo / Branch

- Repo: `/Users/dd/Documents/note-ai`
- Branch: `codex/mvp1-mobile-backend-slice`
- Recent known implementation milestone: `Complete MVP1 voice capture loop`
- Current iPhone dev client can be installed and opened on the physical device.
- Backend and Metro have been run locally during testing.

## Current User-Observed Bug

The app opens and the YouTube video can be registered and played.

But while the video is playing:

- Saying "노트AI야" is often ignored.
- The player keeps playing.
- The app does not consistently enter an agent-like state.
- The desired behavior is Siri/ChatGPT-voice-like:
  - wake phrase heard
  - video pauses
  - app acknowledges
  - user speaks a command
  - app performs the command
  - app optionally resumes playback

Earlier manual observations:

- Sometimes the app appears to hear speech, but it only writes the raw spoken text.
- Sometimes it pauses after changes, but does not complete the agent loop.
- The user now reports it still ignores "노트AI야" during playback.

## Current Implementation Overview

### Main Screen

File: `mobile/src/screens/PlayerScreen.tsx`

The player screen owns:

- `YouTubePlayerView` ref for `play()` and `pause()`.
- `expo-speech-recognition` events.
- wake phase state:
  - `waiting_for_wake`
  - `awaiting_command`
- save processing state:
  - create exact capture
  - create voice memo
  - generate note
  - optionally create research job

Relevant implementation:

- `handleWakeWord()` sets phase to `awaiting_command`, calls `playerRef.current?.pause()`, and displays "네. 재생을 멈췄습니다."
- `handleVoiceCommand()` creates the capture/memo/note/research job and optionally calls `playerRef.current?.play()`.
- `startNativeSpeechRecognition()` starts `ExpoSpeechRecognitionModule.start()` with:
  - `lang`
  - `interimResults: true`
  - `continuous: true`
  - `iosCategory.category: playAndRecord`
  - `iosCategory.categoryOptions: defaultToSpeaker, allowBluetooth, mixWithOthers`
  - `iosCategory.mode: default`
  - `iosVoiceProcessingEnabled: true`
  - Korean contextual strings.

### Voice Command Parser

File: `mobile/src/services/voice-command.ts`

The parser supports many wake variants:

- `노트AI야`
- `노트 AI야`
- `노트 아이야`
- `노트 아야`
- `노트야`
- `노트아이야`
- `노트 에이아이야`
- `노트 에이야`
- `에이야`
- `A야`
- `note ai`
- `hey note ai`

It also supports save/resume/research phrases like:

- `방금 저장해줘`
- `방금 내용 요약해줘`
- `이 부분 저장해줘`
- `정리해줘`
- `조사해줘`
- `자료 찾아줘`
- `다시 재생해줘`

Fresh local test evidence:

```bash
node --test mobile/tests/voice-command.test.ts
```

Result:

- 12 tests passed.
- Wake phrase parsing and command parsing pass in isolation.

Interpretation:

- The pure parser is probably not the main root cause.
- The failure is more likely in runtime speech recognition events, audio session behavior, timing, or player control execution.

### YouTube Player Bridge

File: `mobile/src/components/YouTubePlayerView.tsx`

The app embeds a visible YouTube IFrame player in a React Native WebView.

The React Native side exposes:

- `play()`
- `pause()`

Both use `webViewRef.current?.injectJavaScript(...)` to call `window.NoteAIPlayerControls.play()` / `pause()` inside the WebView.

The IFrame side:

- loads `https://www.youtube.com/iframe_api`
- creates `new YT.Player(...)`
- posts player state/current time to React Native every 500ms
- exposes `window.NoteAIPlayerControls.pause()` that calls `player.pauseVideo()`
- posts a `control` message with `accepted: true` if pause/play ran

Interpretation:

- If `handleWakeWord()` is actually reached, `pause()` should at least request a pause through the WebView bridge.
- Need runtime evidence to verify whether `pause()` is reached and whether the WebView reports `control pause accepted=true`.

## Important Code-Level Suspect

In `PlayerScreen.tsx`, the `result` event currently handles wake words like this:

```ts
const wakeCommand = parseWakeWord(transcript);
if (wakeCommand.action === 'wake_word') {
  if (!event.isFinal) {
    setVoiceStatus('heard');
    setVoiceMessage('호출어를 들었습니다. 말이 끝나면 재생을 멈춥니다.');
    return;
  }

  handleWakeWord(wakeCommand);
  ...
}
```

This means:

- The app may detect "노트AI야" in an interim result.
- But it refuses to pause until `event.isFinal === true`.
- During YouTube playback, final results may be delayed, noisy, absent, or interrupted.
- The user perceives this as "노트AI야" being ignored because the video keeps playing.

Strong candidate fix:

- Pause immediately when the wake phrase appears in an interim result.
- Do not wait for final result to call `handleWakeWord()`.
- After pausing, transition into a separate command-listening phase.

This should be tested carefully to avoid false positives from video audio.

## Library / iOS Audio Session Evidence

Dependency: `expo-speech-recognition`

Relevant local docs from `node_modules/expo-speech-recognition/README.md`:

- Multimedia apps with audio/video playback must account for the library modifying the current audio session category and mode.
- The library recommends using:
  - `getAudioSessionCategoryAndOptionsIOS()`
  - `ExpoSpeechRecognitionModule.start({ iosCategory })`
  - `setAudioCategoryIOS(...)`
- By default, starting speech recognition changes iOS audio session to:
  - category `playAndRecord`
  - options `defaultToSpeaker`, `allowBluetooth`
  - mode `measurement`
- The current app overrides this with `playAndRecord`, `defaultToSpeaker`, `allowBluetooth`, `mixWithOthers`, mode `default`.

Relevant local native code from `node_modules/expo-speech-recognition/ios/ExpoSpeechRecognizer.swift`:

- `setupAudioSession` calls `AVAudioSession.sharedInstance().setCategory(...)` and `setActive(true)`.
- It registers AVAudioSession interruption and route change observers.
- If the audio session is interrupted while recognition is running/starting, it emits an `audioSessionInterrupted` error and resets recognition.
- Route changes during active recognition can also stop/reset recognition.

Interpretation:

- Running YouTube audio and speech recognition at the same time is not a simple JS problem.
- The audio session may be interrupted or reconfigured when the WebView/YouTube player starts playing.
- If recognition stops or emits errors while the video is playing, wake detection will not work.
- Need device logs or in-app diagnostic timeline to know whether recognition is actually running at the moment the user says "노트AI야".

## External Technical References

Apple / iOS:

- App Shortcuts / App Intents are the official Apple direction for exposing app actions through Siri/Shortcuts:
  - https://developer.apple.com/documentation/appintents/app-shortcuts
- Speech recognition framework:
  - https://developer.apple.com/documentation/speech/sfspeechrecognizer
- AVAudioSession category control:
  - https://developer.apple.com/documentation/avfaudio/avaudiosession/category/playandrecord

Wake word SDK option:

- Picovoice Porcupine React Native Wake Word SDK:
  - https://picovoice.ai/docs/quick-start/porcupine-react-native/
  - Supports React Native.
  - Requires a Picovoice account and AccessKey.
  - Supports custom keyword files.
  - Has non-English model support, including demo language code examples such as `ko`.

## Likely Root Cause Hypotheses

### H1. Wake is detected only as interim, but code waits for final

Claim:

- The app hears enough to show an interim transcript, but `handleWakeWord()` is only called on final results.

Evidence that would confirm:

- UI/debug log shows `result interim: 노트AI야...`
- No later `result final: ...`
- No `wake matched; pause requested`
- Player keeps playing.

Fix if true:

- On interim wake match, immediately call `handleWakeWord()`.
- Debounce with a wake lock/ref so it only fires once per utterance.
- Then continue command capture after video is paused.

### H2. Recognition is not active while YouTube is playing

Claim:

- Speech recognition starts, but WebView/YouTube playback causes audio session interruption/route change, so recognition stops.

Evidence that would confirm:

- Debug log shows:
  - `recognizer started: waiting_for_wake`
  - then `recognizer error: audioSessionInterrupted`
  - or `recognizer ended: waiting_for_wake`
  - while player state remains `재생 중`.

Fix if true:

- Tune iOS audio session category/mode/options.
- Test combinations:
  - `mode: measurement`
  - `mode: voiceChat`
  - `mixWithOthers` vs no `mixWithOthers`
  - `duckOthers`
  - `iosVoiceProcessingEnabled: true/false`
- Use `getAudioSessionCategoryAndOptionsIOS()` before/after playback and recognition start.
- Consider starting recognition only after playback is ducked/paused via a non-speech trigger.

### H3. The microphone hears video audio more than the user

Claim:

- The recognizer is active, but the phone mic mostly captures the YouTube speaker audio, not the user's wake phrase.

Evidence that would confirm:

- Transcripts contain video/podcast words instead of user speech.
- Wake works when video is muted/low-volume, but fails at normal volume.
- Wake works with earbuds/mic, but fails on speaker playback.

Fix if true:

- Add echo/noise strategy:
  - pause on a hardware/UI trigger first
  - use earbud mic
  - use Voice Processing mode if stable
  - use a dedicated wake-word engine with better keyword spotting
  - reduce player volume or duck on likely voice activity

### H4. STT is being used as a wake-word engine, which is the wrong primitive

Claim:

- `SFSpeechRecognizer`-style STT is built for speech-to-text, not low-latency always-on wake-word detection during media playback.

Evidence that would confirm:

- Parser tests pass.
- Recognition events are delayed, unstable, final-only, or polluted by media audio.
- Wake detection is unreliable even with code tweaks.

Fix if true:

- Split architecture:
  1. Foreground wake detector: local keyword spotting engine.
  2. After wake: pause YouTube.
  3. Command STT: Apple Speech / OpenAI STT / other transcription.
  4. Agent execution: capture timestamp, note, research, resume.

Possible wake detector:

- Picovoice Porcupine React Native.
- Custom native iOS SoundAnalysis/CoreML keyword spotting model.
- App Shortcut/Siri trigger for OS-level wake path.

### H5. The code running on the device is stale

Claim:

- The installed iOS app may not include the latest wake-loop code.

Evidence that would confirm:

- UI text or diagnostics do not match current `PlayerScreen.tsx`.
- Xcode/Expo build timestamp predates latest source changes.

Fix if true:

- Clean rebuild and reinstall dev client.
- Relaunch app with fresh Metro bundle.
- Confirm visible UI strings from current source.

## What Other Services Usually Do

Most reliable voice-note/audio-capture products avoid "arbitrary app name wake word while media is playing" as the primary path.

Typical patterns:

1. OS assistant trigger:
   - Use Siri/App Shortcuts/App Intents.
   - User says "Siri, run X".
   - Apple handles wake word; app handles action.

2. Foreground push-to-talk/session mode:
   - User starts a recording/listening session.
   - App listens while visibly active.
   - Common in transcription/meeting apps.

3. Dedicated hardware or wearable:
   - Hardware has its own mic/button/always-on pipeline.
   - App syncs recordings/notes later.

4. Dedicated wake-word SDK:
   - Local keyword spotter listens for a short phrase.
   - Full STT starts only after wake is detected.
   - This is closer to Siri/Alexa architecture than using STT alone.

For NoteAI, the most robust product architecture is probably:

- MVP foreground mode:
  - visible player
  - visible mic ON indicator
  - local wake detector or interim wake match
  - pause immediately
  - command STT
  - save/note/research/resume loop

- Later OS-level mode:
  - Siri/App Shortcut: "Siri, NoteAI에 방금 저장"
  - No custom "노트AI야" system-wide wake word.

## Recommended Next Debug Steps

1. Add a device-visible diagnostic timeline:
   - recognizer start/end/error
   - interim/final transcript
   - parsed wake yes/no
   - `handleWakeWord()` called yes/no
   - player pause requested yes/no
   - WebView control accepted yes/no
   - player state changed to paused yes/no

2. Test three controlled scenarios:
   - no video playing, say "노트AI야"
   - video playing muted/low volume, say "노트AI야"
   - video playing normal volume, say "노트AI야"

3. First minimal code fix to test:
   - call `handleWakeWord()` immediately on interim wake match.
   - add debounce to prevent repeated wake.
   - after wake, keep/ restart recognition for command mode.

4. If still unreliable:
   - run audio session A/B tests.
   - capture `getAudioSessionCategoryAndOptionsIOS()` before/after playback and recognition.
   - test `iosVoiceProcessingEnabled` true/false.
   - test `mode: measurement`, `mode: default`, `mode: voiceChat`.

5. If still unreliable after A/B:
   - stop relying on STT as wake detector.
   - evaluate Picovoice Porcupine or another on-device wake-word SDK.
   - keep Apple Speech/OpenAI STT only for post-wake command transcription.

## Key Question For Follow-Up Analysis

Given this React Native/Expo implementation and iOS constraints, what is the most reliable MVP architecture for "while a visible in-app YouTube player is playing, user says 노트AI야, app pauses video and captures a command"?

Please analyze:

1. Whether the current `expo-speech-recognition` approach can be stabilized enough for MVP.
2. Whether the interim-result wake handling bug is likely the immediate blocker.
3. Which AVAudioSession configuration should be tested first.
4. Whether a dedicated wake-word SDK such as Picovoice Porcupine is necessary.
5. What is impossible or App Store-risky on iOS, especially background/system-wide custom wake words.
