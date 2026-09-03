import CoreGraphics

/// Converts AppKit screen frames to AX coordinates without pixel scaling.
struct DisplayGeometry {
  let screenFrames: [CGRect]
  let visibleFrames: [CGRect]
  let primaryTop: CGFloat

  init(screenFrames: [CGRect], visibleFrames: [CGRect]) {
    precondition(screenFrames.count == visibleFrames.count)
    self.screenFrames = screenFrames
    self.visibleFrames = visibleFrames
    self.primaryTop = screenFrames.first?.maxY ?? 0
  }

  var geometries: [ScreenGeometry] {
    zip(screenFrames, visibleFrames).map { frame, visibleFrame in
      ScreenGeometry(
        frame: accessibilityFrame(frame),
        visibleFrame: accessibilityFrame(visibleFrame))
    }
  }

  func accessibilityFrame(_ frame: CGRect) -> CGRect {
    CGRect(
      x: frame.minX,
      y: primaryTop - frame.maxY,
      width: frame.width,
      height: frame.height)
  }

  func screenContaining(frame: CGRect) -> ScreenGeometry? {
    geometry(at: indexOfScreen(containing: frame) ?? 0)
  }

  /// Index of the screen holding the window's center, falling back to the
  /// screen with the largest overlap (0 when the window touches nothing).
  func indexOfScreen(containing frame: CGRect) -> Int? {
    let geometries = geometries
    let center = CGPoint(x: frame.midX, y: frame.midY)
    if let index = geometries.firstIndex(where: { $0.frame.contains(center) }) {
      return index
    }
    return geometries.indices.max {
      intersectionArea(geometries[$0].frame, frame)
        < intersectionArea(geometries[$1].frame, frame)
    }
  }

  func geometry(at index: Int) -> ScreenGeometry? {
    guard index >= 0, index < geometries.count else { return nil }
    return geometries[index]
  }
  func intersectionArea(_ first: CGRect, _ second: CGRect) -> CGFloat {
    let intersection = first.intersection(second)
    return intersection.isNull ? 0 : intersection.width * intersection.height
  }
}
