import AppKit
import Foundation
import LUIAppleBackend
import PDFKit
import SwiftUI

/// `logseq-pdf` — the PDF viewer portal. OCaml emits it inside
/// #app-single-container when Pdf_state.current is set; the container's
/// grow class gives it the right half of the window (web's pdf area).
/// `path` is the absolute filesystem path under the graph's assets dir.
struct LogseqPDFView: View {
  let context: LUIAppleExtensionViewContext
  let attrs: [String: Any]

  private var path: String { attrs["path"] as? String ?? "" }
  private var filename: String { attrs["filename"] as? String ?? "" }

  private func emit(_ name: String) {
    var payload: [String: Any] = ["nodeId": context.nodeID]
    payload["target"] = LogseqDOMSnapshot.snapshot(for: context)
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string(name), "payload": .string(json)])
  }

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        Image(systemName: "doc.richtext")
          .foregroundStyle(.secondary)
        Text(filename)
          .font(.system(size: 12))
          .foregroundStyle(.secondary)
          .lineLimit(1)
        Spacer()
        Button {
          emit("pdf-close")
        } label: {
          Image(systemName: "xmark")
            .foregroundStyle(.secondary)
        }
        .buttonStyle(.plain)
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 6)
      .background(LogseqColors.secondaryBackground)
      PDFKitView(path: path)
    }
    .background(LogseqColors.primaryBackground)
  }
}

private struct PDFKitView: NSViewRepresentable {
  let path: String

  func makeNSView(context: Context) -> PDFView {
    let view = PDFView()
    view.autoScales = true
    view.displayMode = .singlePageContinuous
    view.displaysPageBreaks = true
    if !path.isEmpty, let doc = PDFDocument(url: URL(fileURLWithPath: path)) {
      view.document = doc
    }
    return view
  }

  func updateNSView(_ view: PDFView, context: Context) {
    guard !path.isEmpty,
      view.document?.documentURL?.path != path
    else { return }
    view.document = PDFDocument(url: URL(fileURLWithPath: path))
  }
}
