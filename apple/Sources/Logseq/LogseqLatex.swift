import AppKit
import Foundation
import SwiftMath
import SwiftUI

/// `.latex` / `.latex-inline` elements: the OCaml view emits the raw TeX
/// inside a `span.opacity-0` child for the web's katex scan; natively we
/// render it with SwiftMath (MTMathUILabel).
struct LogseqLatexView: NSViewRepresentable {
  let tex: String
  /// `latex` (block) uses display mode; `latex-inline` stays inline.
  let displayMode: Bool
  let fontSize: CGFloat

  func makeNSView(context: Context) -> MTMathUILabel {
    let label = MTMathUILabel()
    label.labelMode = displayMode ? .display : .text
    label.fontSize = fontSize
    label.textColor = .labelColor
    label.latex = tex
    return label
  }

  func updateNSView(_ label: MTMathUILabel, context: Context) {
    label.labelMode = displayMode ? .display : .text
    label.fontSize = fontSize
    label.textColor = .labelColor
    if label.latex != tex { label.latex = tex }
  }
}
