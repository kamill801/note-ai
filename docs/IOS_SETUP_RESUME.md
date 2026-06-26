# iOS Setup Resume

Last updated: 2026-06-16 00:16 KST

## Current State

- Xcode is installed and selected:
  - `xcodebuild -version` -> `Xcode 26.5`, build `17F42`
  - `xcode-select -p` -> `/Applications/Xcode.app/Contents/Developer`
- CocoaPods issue is resolved:
  - Root cause: `pod` was missing, and system Ruby `2.6.10` made `gem install cocoapods` fail.
  - Fix applied: `brew install cocoapods`
  - Verified: `pod --version` -> `1.16.2`
- iOS Simulator tooling is now available:
  - `xcrun simctl list runtimes` shows `iOS 26.5`
  - `xcrun simctl list devices` includes `iPhone 17`
- Native iOS project was created by Expo prebuild:
  - `mobile/ios/`
- iOS build succeeded:
  - Command used from `mobile/`:
    `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 npx expo run:ios --device "iPhone 17"`
  - Result: `Build Succeeded`
  - App installed and opened on iPhone 17 simulator.
- First screen rendered successfully. Screenshot evidence:
  - `/tmp/note-ai-ios-home.png`
  - `/tmp/note-ai-ios-home-fixed.png`
- UI tweak applied after screenshot:
  - Bottom tab label changed from `가져오기` to `등록` in `mobile/App.tsx`.
  - `npm run typecheck` passed after the tweak.

## Important Notes

- No paid APIs, API keys, or production deploys were added.
- `npm audit --omit=dev` still reports Expo transitive `xcode -> uuid` moderate advisory.
  - Do not run `npm audit fix --force`; it would downgrade Expo.
- Backend/Metro are currently stopped.
- The long-running `expo run:ios` and backend foreground sessions were stopped before pausing.

## Resume Commands

From repo root:

```bash
cd /Users/dd/Documents/note-ai
npm run dev:backend
```

In another terminal, from `mobile/`:

```bash
cd /Users/dd/Documents/note-ai/mobile
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 npx expo run:ios --device "iPhone 17"
```

If the app is already installed and only Metro/backend need to run:

```bash
cd /Users/dd/Documents/note-ai
npm run dev:backend
```

```bash
cd /Users/dd/Documents/note-ai/mobile
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 npm run dev -- --localhost --port 8081
```

Then open the installed Note AI app in the iPhone 17 simulator.

## Next Validation

Continue with the real simulator flow:

1. `등록`
2. `MVP1 테스트 영상으로 시작`
3. Confirm visible YouTube player on `듣기`
4. Tap `이 부분 저장`
5. Add memo on capture screen
6. Generate note
7. Confirm note details and follow-up research

