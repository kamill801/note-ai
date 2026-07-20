import Foundation

struct NoteAIPendingCaptureRequest: Codable {
  let action: String
  let createdAt: String
  let id: String
  let memo: String
  let source: String
}

enum NoteAIPendingCaptureStore {
  private static let key = "noteai.pendingCaptureRequest"

  static func save(_ request: NoteAIPendingCaptureRequest) {
    guard let encoded = try? JSONEncoder().encode(request) else {
      return
    }
    UserDefaults.standard.set(encoded, forKey: key)
  }

  static func load() -> NoteAIPendingCaptureRequest? {
    guard let data = UserDefaults.standard.data(forKey: key) else {
      return nil
    }
    return try? JSONDecoder().decode(NoteAIPendingCaptureRequest.self, from: data)
  }

  static func loadDictionary() -> [String: String]? {
    guard let request = load() else {
      return nil
    }
    return [
      "action": request.action,
      "createdAt": request.createdAt,
      "id": request.id,
      "memo": request.memo,
      "source": request.source,
    ]
  }

  static func clear(id: String) -> Bool {
    guard let request = load(), request.id == id else {
      return false
    }
    UserDefaults.standard.removeObject(forKey: key)
    return true
  }
}
