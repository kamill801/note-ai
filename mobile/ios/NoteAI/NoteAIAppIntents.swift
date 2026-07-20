import AppIntents
import Foundation

@available(iOS 16.0, *)
struct CaptureCurrentSegmentIntent: AppIntent {
  static var title: LocalizedStringResource = "방금 들은 부분 저장"
  static var description = IntentDescription("현재 NoteAI에서 듣고 있는 영상 구간을 저장하고 요청 내용에 맞게 정리합니다.")
  static var openAppWhenRun: Bool { true }

  @Parameter(
    title: "요청 내용",
    requestValueDialog: IntentDialog("무엇을 기록하거나 정리할까요?")
  )
  var memo: String

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let request = NoteAIPendingCaptureRequest(
      action: "capture_current_segment",
      createdAt: ISO8601DateFormatter().string(from: Date()),
      id: UUID().uuidString,
      memo: memo,
      source: "siri_app_intent"
    )

    NoteAIPendingCaptureStore.save(request)
    return .result(dialog: "NoteAI에서 현재 구간을 정리하겠습니다.")
  }
}

@available(iOS 16.0, *)
struct NoteAIShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CaptureCurrentSegmentIntent(),
      phrases: [
        "\(.applicationName)에 방금 저장해줘",
        "\(.applicationName)에 방금 요약해줘",
        "\(.applicationName)에 방금 조사해줘",
        "\(.applicationName)에 방금 들은 부분 정리해줘",
      ],
      shortTitle: "방금 저장",
      systemImageName: "note.text"
    )
  }
}
