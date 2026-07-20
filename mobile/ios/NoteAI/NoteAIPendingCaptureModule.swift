import Foundation
import React

@objc(NoteAIPendingCaptureModule)
class NoteAIPendingCaptureModule: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(getPendingCaptureRequest:rejecter:)
  func getPendingCaptureRequest(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    resolve(NoteAIPendingCaptureStore.loadDictionary() ?? NSNull())
  }

  @objc(clearPendingCaptureRequest:resolver:rejecter:)
  func clearPendingCaptureRequest(
    _ id: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    resolve(NoteAIPendingCaptureStore.clear(id: id))
  }
}
