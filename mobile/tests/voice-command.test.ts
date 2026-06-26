import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVoiceCommand, parseWakeWord } from '../src/services/voice-command.ts';

test('Given a wake phrase only When parsing wake word Then it activates without requiring a save phrase', () => {
  const result = parseWakeWord('노트AI야');

  assert.equal(result.action, 'wake_word');
  if (result.action !== 'wake_word') return;
  assert.equal(result.matchedTrigger, '노트AI야');
  assert.equal(result.triggerTranscript, '노트AI야');
});

test('Given iOS transcribes AI as Korean words When parsing wake word Then it still activates', () => {
  const result = parseWakeWord('노트 아이야');

  assert.equal(result.action, 'wake_word');
  if (result.action !== 'wake_word') return;
  assert.equal(result.matchedTrigger, '노트 아이야');
});

test('Given iOS drops the AI syllable When parsing wake word Then it still activates', () => {
  const result = parseWakeWord('노트 아야');

  assert.equal(result.action, 'wake_word');
  if (result.action !== 'wake_word') return;
  assert.equal(result.matchedTrigger, '노트 아야');
});

test('Given wake has already activated When parsing save phrase without app name Then it saves the moment', () => {
  const result = parseVoiceCommand('방금 저장해줘. 온보딩 아이디어로 정리해줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'idea');
  assert.equal(result.matchedTrigger, '노트AI야');
  assert.equal(result.triggerTranscript, '노트AI야');
  assert.equal(result.memoTranscript, '온보딩 아이디어로 정리해줘');
});

test('Given wake has already activated When asking to summarize the last part Then it saves the moment', () => {
  const result = parseVoiceCommand('방금 부분 요약해줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'summary');
  assert.equal(result.matchedSavePhrase, '방금 부분 요약해줘');
});

test('Given old one-shot phrasing When parsing full command Then it still saves the moment', () => {
  const result = parseVoiceCommand('노트AI야 방금 저장해줘. 이건 리텐션 아이디어로 정리해줘');

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'idea');
  assert.equal(result.matchedTrigger, '노트AI야');
  assert.equal(result.memoTranscript, '이건 리텐션 아이디어로 정리해줘');
});

test('Given noisy wake and research command When parsing Then it preserves topic and detects resume', () => {
  const result = parseVoiceCommand('노트 아야 노트 AI 야 방금 플라톤에 대한 정책에 대해서 조사해줘 그래 다시 재생해줘');

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'research');
  assert.equal(result.shouldResumePlayback, true);
  assert.equal(result.matchedTrigger, '노트 아야');
  assert.equal(result.memoTranscript, '방금 플라톤에 대한 정책에 대해서');
  assert.equal(result.triggerTranscript, '노트 아야 노트 AI 야 방금 플라톤에 대한 정책에 대해서 조사해줘 그래 다시 재생해줘');
  assert.equal(result.originalTranscript, '노트 아야 노트 AI 야 방금 플라톤에 대한 정책에 대해서 조사해줘 그래 다시 재생해줘');
});

test('Given summary command When parsing Then it detects summary intent and keeps command as memo fallback', () => {
  const result = parseVoiceCommand('노트AI야 방금 내용 요약해줘');

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'summary');
  assert.equal(result.shouldResumePlayback, false);
  assert.equal(result.matchedTrigger, '노트AI야');
  assert.equal(result.memoTranscript, '');
});

test('Given organize command after wake When parsing Then it detects organize and resume', () => {
  const result = parseVoiceCommand('방금 부분 정리해줘 다시 재생해줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'organize');
  assert.equal(result.memoTranscript, '');
  assert.equal(result.shouldResumePlayback, true);
  assert.equal(result.matchedTrigger, '노트AI야');
});

test('Given idea-only command after wake When parsing Then it detects idea intent', () => {
  const result = parseVoiceCommand('내 서비스 아이디어로 정리해줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'idea');
  assert.equal(result.memoTranscript, '');
  assert.equal(result.shouldResumePlayback, false);
});

test('Given research-only command after wake When parsing Then it detects research intent', () => {
  const result = parseVoiceCommand('자료 찾아줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'save_moment');
  if (result.action !== 'save_moment') return;
  assert.equal(result.intent, 'research');
  assert.equal(result.memoTranscript, '');
  assert.equal(result.shouldResumePlayback, false);
});

test('Given pure resume command after wake When parsing Then it returns standalone resume action', () => {
  const result = parseVoiceCommand('다시 재생해줘', {
    fallbackMatchedTrigger: '노트AI야',
    fallbackTriggerTranscript: '노트AI야',
    requireTrigger: false,
  });

  assert.equal(result.action, 'resume_playback');
  if (result.action !== 'resume_playback') return;
  assert.equal(result.shouldResumePlayback, true);
  assert.equal(result.memoTranscript, '');
  assert.equal(result.matchedTrigger, '노트AI야');
  assert.equal(result.triggerTranscript, '노트AI야');
});
