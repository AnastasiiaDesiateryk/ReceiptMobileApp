import Foundation
import React
import Vision
import UIKit
import ImageIO

// MARK: - Orientation mapping (UIImage -> CGImagePropertyOrientation)
extension CGImagePropertyOrientation {
  init(_ uiOrientation: UIImage.Orientation) {
    switch uiOrientation {
    case .up: self = .up
    case .down: self = .down
    case .left: self = .left
    case .right: self = .right
    case .upMirrored: self = .upMirrored
    case .downMirrored: self = .downMirrored
    case .leftMirrored: self = .leftMirrored
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}

@objc(ReceiptScannerModule)
final class ReceiptScannerModule: NSObject {

  // MARK: - Config
  private static let debugLogs: Bool = false
  private static let debugMaxBlocks: Int = 30

  // MARK: - React Native
  @objc(recognizeText:resolve:rejecter:)
  func recognizeText(
    _ imagePath: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    log("OCR called: \(imagePath)")

    guard let imageInfo = loadImage(from: imagePath) else {
      dispatchToMain {
        reject("no_image", "Cannot load image", nil)
      }
      return
    }

    let request = VNRecognizeTextRequest { [weak self] request, error in
      guard let self else { return }

      if let error = error {
        self.dispatchToMain {
          reject("ocr_error", "Vision failed", error)
        }
        return
      }

      let raw = (request.results as? [VNRecognizedTextObservation]) ?? []
      self.log("OCR raw results count: \(raw.count)")

      let observations = raw.sorted { $0.boundingBox.midY > $1.boundingBox.midY }

      if Self.debugLogs {
        self.log("==== OCR DEBUG BLOCKS, first \(Self.debugMaxBlocks) ====")
        for (i, obs) in observations.prefix(Self.debugMaxBlocks).enumerated() {
          let txt = obs.topCandidates(1).first?.string ?? "<nil>"
          let bb = obs.boundingBox
          self.log("[\(i)] midY=\(bb.midY) x=\(bb.origin.x) y=\(bb.origin.y) w=\(bb.size.width) h=\(bb.size.height) :: \(txt)")
        }
        self.log("======================================================")
      }

      var blocks: [[String: Any]] = []
      blocks.reserveCapacity(observations.count)

      var lines: [String] = []
      lines.reserveCapacity(observations.count)

      for obs in observations {
        guard let cand = obs.topCandidates(1).first else { continue }
        let bb = obs.boundingBox

        lines.append(cand.string)
        blocks.append([
          "text": cand.string,
          "confidence": cand.confidence,
          "bbox": [
            "x": Double(bb.origin.x),
            "y": Double(bb.origin.y),
            "w": Double(bb.size.width),
            "h": Double(bb.size.height)
          ]
        ])
      }

      let payload: [String: Any] = [
        "blocks": blocks,
        "fullText": lines.joined(separator: "\n")
      ]

      self.dispatchToMain { resolve(payload) }
    }

    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-US", "de-CH", "de-DE", "ru-RU", "uk-UA"]
    request.usesLanguageCorrection = true

    DispatchQueue.global(qos: .userInitiated).async {
      let handler = VNImageRequestHandler(
        cgImage: imageInfo.cgImage,
        orientation: imageInfo.orientation,
        options: [:]
      )
      do {
        try handler.perform([request])
      } catch {
        self.dispatchToMain {
          reject("ocr_error", "Failed to run Vision OCR", error)
        }
      }
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }

  // MARK: - Helpers
  private struct LoadedImage {
    let cgImage: CGImage
    let orientation: CGImagePropertyOrientation
  }

  private func loadImage(from imagePath: String) -> LoadedImage? {
    let url: URL? = {
      if let u = URL(string: imagePath), u.scheme != nil { return u }
      return URL(fileURLWithPath: imagePath)
    }()

    guard let finalURL = url else { return nil }

    let path = finalURL.isFileURL ? finalURL.path : finalURL.path
    guard let uiImage = UIImage(contentsOfFile: path),
          let cgImage = uiImage.cgImage else {
      return nil
    }

    let orientation = CGImagePropertyOrientation(uiImage.imageOrientation)
    return LoadedImage(cgImage: cgImage, orientation: orientation)
  }

  private func dispatchToMain(_ block: @escaping () -> Void) {
    if Thread.isMainThread { block() }
    else { DispatchQueue.main.async(execute: block) }
  }

  private func log(_ msg: String) {
    guard Self.debugLogs else { return }
    print(msg)
  }
}
