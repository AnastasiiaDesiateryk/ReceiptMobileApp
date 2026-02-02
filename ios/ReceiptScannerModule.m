#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ReceiptScannerModule, NSObject)

RCT_EXTERN_METHOD(recognizeText:(NSString *)imagePath
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
