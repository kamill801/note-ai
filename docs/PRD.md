# PRD: 이동 중 YouTube 지식 캡처 앱

Status: Draft
Last updated: 2026-06-14

## 1. Product Goal

이 앱은 사용자가 이동 중 YouTube 영상을 보거나 들을 때, 중요한 순간을 말로 저장하고 자기 생각까지 음성으로 남기면 AI가 해당 구간, 사용자 메모, 추가 리서치를 한국어 지식 노트로 정리해주는 모바일 앱이다.

한 줄 정의:

> 이동하면서 유튜브를 듣다가 중요한 순간이 나오면, 말로 해당 구간과 내 생각을 저장하고 AI가 노트와 추가 리서치로 정리해주는 앱.

## 2. Positioning

이 앱은 "AI 요약툴"이 아니다. 핵심은 전체 영상을 요약하는 것이 아니라, **사용자가 중요하다고 느낀 순간과 그 순간 떠오른 생각을 놓치지 않게 하는 것**이다.

### Primary Wedge

- 이동 중 손을 쓰기 어려운 상황에서도 저장 가능.
- 콘텐츠 구간과 사용자 생각을 함께 저장.
- 단순 요약이 아니라 의도별 노트로 변환.
- 추가 키워드/자료/리서치까지 이어짐.

## 3. Target Users

### Primary Persona

이동 중 YouTube로 지식을 소비하는 사람:

- 출퇴근 중 강의/비즈니스/테크/창업 영상을 듣는 사람.
- 운동, 산책, 운전 중 YouTube를 오디오처럼 듣는 사람.
- 좋은 아이디어가 떠올라도 바로 적기 어려운 사람.
- 나중에 다시 볼 수 있는 구조화된 한국어 노트를 원하는 사람.

### Jobs To Be Done

- "방금 들은 중요한 내용을 놓치지 않고 저장하고 싶다."
- "그 내용에 대해 내가 떠올린 아이디어도 같이 남기고 싶다."
- "나중에 다시 열었을 때 바로 쓸 수 있는 노트로 정리돼 있으면 좋겠다."
- "필요하면 이 주제의 추가 자료도 바로 찾아두고 싶다."

## 4. Core Problem

이동 중 YouTube를 듣는 사용자는 중요한 내용을 발견해도 다음 문제가 있다.

- 링크 복사/앱 전환/타이핑이 번거롭다.
- 이동 중에는 텍스트 메모가 어렵거나 위험하다.
- 나중에 다시 찾으려면 어느 영상의 어느 구간인지 기억하기 어렵다.
- 단순 저장만으로는 "내가 왜 중요하다고 생각했는지"가 사라진다.
- 추가로 공부하거나 적용하고 싶은 맥락이 흩어진다.

## 5. MVP Strategy

### MVP1: 앱 내 재생 기반 정확 저장

기능 검증용 1차 MVP는 사용자가 YouTube 영상을 우리 앱에 등록하고, 앱 안의 공식 YouTube 플레이어로 재생하는 방식이다.

이유:

- 현재 재생 초를 정확히 알 수 있다.
- timestamp 기반 캡처가 안정적으로 동작한다.
- 음성 메모, 구간 요약, 노트 생성, 리서치까지 전체 파이프라인을 검증하기 쉽다.
- "기능적으로 정상작동하는 MVP" 기준에 맞다.

핵심 흐름:

1. 사용자가 YouTube 링크를 앱에 등록한다.
2. 앱 내 YouTube 플레이어에서 영상을 재생한다.
3. 사용자가 캡처 모드를 켠다.
4. 영상 재생 중 앱 내부 트리거로 "방금 저장"을 말한다.
5. 앱이 현재 timestamp를 저장한다.
6. 사용자가 추가 음성 메모를 말한다.
7. 앱이 timestamp 앞뒤 transcript를 요약한다.
8. 앱이 사용자 메모 의도를 반영한 한국어 노트를 만든다.
9. 앱이 추가 검색 키워드와 자료를 추천한다.
10. 사용자가 원하면 추가 리서치를 실행한다.

### MVP2: YouTube 앱 연동형 추정 저장

실사용 확장 MVP는 사용자가 공식 YouTube 앱에서 계속 듣고, 우리 앱은 최근 등록된 영상과 음성 메모, transcript를 기반으로 방금 들은 구간을 추정하는 방식이다.

중요한 표현:

- 이 모드는 YouTube 앱의 현재 재생 상태를 직접 읽지 않는다.
- "YouTube 앱 캡처"가 아니라 "YouTube 앱 연동형 추정 저장"이다.
- 결과는 `추정 구간 + 신뢰도 + 근거`로 표시한다.

## 6. MVP1 Feature Requirements

### 6.1 YouTube Link Registration

사용자는 YouTube 링크를 앱에 등록할 수 있어야 한다.

Required:

- URL 붙여넣기.
- 모바일 공유 시트에서 앱으로 보내기.
- videoId 추출.
- 제목/썸네일/채널/길이 표시.
- transcript 처리 상태 표시.

### 6.2 In-App YouTube Playback

앱은 공식 YouTube 임베드 플레이어로 영상을 재생한다.

Required:

- 플레이어는 사용자에게 보여야 한다.
- 숨김 재생, 오디오 분리, 다운로드, 백그라운드 YouTube 플레이어를 제공하지 않는다.
- 현재 재생 시간 조회.
- 캡처 시점 timestamp 기록.

### 6.3 Capture Mode

사용자는 앱 내에서 캡처 모드를 켤 수 있다.

Required:

- 마이크 권한 요청.
- 캡처 모드 상태 표시.
- 앱 내부 트리거 문구 감지.
- 트리거 감지 시 timestamp 저장.
- 추가 메모 녹음 시작/종료.

MVP trigger examples:

- "[앱이름]아 방금 저장."
- "방금 내용 메모해줘."
- "이거 아이디어로 저장."

### 6.4 Voice Memo Recognition

사용자의 음성 메모를 텍스트로 변환한다.

Required:

- 원본 음성 저장 여부를 사용자에게 명확히 표시.
- transcript 생성.
- 사용자 의도 분류:
  - 요약 노트.
  - 아이디어 노트.
  - 리서치 노트.
  - 콘텐츠 초안 노트.

### 6.5 Segment Selection

MVP1은 timestamp 기준으로 앞뒤 transcript 구간을 선택한다.

Default window:

- 기본: timestamp 기준 앞 45초, 뒤 75초.
- 영상/자막 밀도에 따라 30-120초 범위로 조정 가능.

### 6.6 Korean Note Generation

노트는 한국어로 생성한다.

Required sections:

- 제목.
- 원본 영상 정보.
- 저장 timestamp.
- 핵심 요약.
- 내 음성 메모.
- 내 생각/적용 아이디어.
- 근거 transcript.
- 추가 검색 키워드.
- 추천 자료.
- 추가 리서치 결과.

### 6.7 Follow-Up Research

사용자가 추가 리서치를 요청하면 관련 자료를 찾아 요약한다.

Required:

- 검색 키워드 자동 생성.
- 사용자 요청 기반 검색.
- 출처 URL 포함.
- 기존 노트에 연구 결과 추가.

## 7. Explicit Non-Goals

MVP에서는 하지 않는다.

- 모든 YouTube 영상 전체 요약을 핵심 기능으로 삼지 않음.
- YouTube 앱을 대체하지 않음.
- YouTube 콘텐츠 다운로드/오프라인 저장을 제공하지 않음.
- 숨겨진 백그라운드 YouTube 오디오 재생을 제공하지 않음.
- 시스템 전체에서 항상 듣는 커스텀 웨이크워드 제공하지 않음.
- 팟캐스트 지원하지 않음.
- Notion/Obsidian 연동하지 않음.

## 8. Success Metrics

MVP 성공 기준은 초기에는 시장 지표가 아니라 기능적 완성도다.

### Functional Success Criteria

- YouTube 링크 등록이 안정적으로 된다.
- 앱 내 플레이어가 재생되고 현재 시간이 기록된다.
- 캡처 모드에서 트리거가 정상 인식된다.
- 음성 메모가 누락 없이 텍스트화된다.
- 저장 시점 주변 transcript가 정확히 선택된다.
- 한국어 노트가 의도에 맞게 생성된다.
- 추가 검색 키워드와 자료 추천이 생성된다.
- 추가 리서치 요청이 정상 수행된다.
- 생성된 노트를 나중에 열었을 때 바로 재사용할 수 있다.

### Quality Targets

- MVP1 timestamp capture: 플레이어 기준 +/- 2초 이내.
- Voice memo transcription: 핵심 명사/동사 누락 없이 보존.
- Note usefulness: 사용자가 다시 읽었을 때 왜 저장했는지 이해 가능.
- Research grounding: 추천 자료는 URL과 짧은 이유를 포함.

## 9. Risks

### YouTube Policy Risk

공식 플레이어를 보이게 유지하고, 백그라운드/숨김 재생/오디오 분리/다운로드를 피한다.

### Transcript Availability Risk

모든 영상에서 transcript를 안정적으로 확보할 수 있다고 가정하지 않는다. provider abstraction과 fallback이 필요하다.

### Voice Trigger Reliability Risk

MVP1의 앱 이름 호출은 시스템 전체 wake word가 아니라 앱이 foreground/capture mode일 때의 내부 트리거다.

### User Habit Risk

앱 내 재생은 정확하지만 YouTube 공식 앱 습관과 다르다. MVP2에서 YouTube 앱 연동형 추정 저장을 추가해 실사용성을 보완한다.

## 10. Open Questions

- 최종 제품명은 미정.
- transcript provider의 production-safe 방식은 추가 정책/법무 검토가 필요하다.
- 무료/유료 과금 기준은 미정.
- iOS와 Android 중 첫 출시 플랫폼은 구현 단계에서 리소스 기준으로 확정한다.

