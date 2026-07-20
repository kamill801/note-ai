#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NoteAIPendingCaptureModule, NSObject)

RCT_EXTERN_METHOD(getPendingCaptureRequest:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingCaptureRequest:(NSString *)id
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
