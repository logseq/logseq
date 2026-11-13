import AppKit
import LUIAppleBackend
import PDFKit
import SwiftUI

// PDFKit selection/annotation behavior follows mobile's LGPDFWorkspace.
// The desktop adapter preserves native/pdf.ml's scoped pdf-* event contract.
@MainActor
struct PDFWorkspace: View {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    @StateObject private var model = PDFWorkspaceModel()

    var body: some View {
        VStack(spacing: 0) {
            if model.ready {
                ScrollView(.horizontal) {
                    HStack {
                        action("close", "xmark") { model.send("pdf-close") }
                        Button(action: { model.view?.goToPreviousPage(nil) }) { Image(systemName: "chevron.left") }
                        Text("\(model.page) / \(model.pageCount)").monospacedDigit()
                        Button(action: { model.view?.goToNextPage(nil) }) { Image(systemName: "chevron.right") }
                        action("zoom-out", "minus.magnifyingglass") { model.view?.zoomOut(nil) }
                        action("zoom-in", "plus.magnifyingglass") { model.view?.zoomIn(nil) }
                        action("auto-fit", "arrow.up.left.and.arrow.down.right") { model.fit() }
                        action("highlight", "highlighter") { model.highlightSelection() }.disabled(model.selection.isEmpty)
                        Menu {
                            ForEach(model.colors, id: \.self) { color in
                                Button(model.label(color)) { model.setColor(color) }
                            }
                        } label: { Image(systemName: "paintpalette") }
                        action("copy-ref", "doc.on.doc") { model.annotationAction("pdf-hl-ref") }.disabled(model.selectedID == nil)
                        action("linked-ref", "link") { model.annotationAction("pdf-hl-link") }.disabled(model.selectedID == nil)
                        action("delete", "trash") { model.annotationAction("pdf-hl-del") }.disabled(model.selectedID == nil)
                        action("annotations", "list.bullet.rectangle") { model.send("pdf-annots") }
                        Menu {
                            ForEach(["hl_mode", "area_mode"], id: \.self) { key in
                                Toggle(model.label(key), isOn: Binding(get: { model.flag(key) }, set: { model.send("pdf-mode", ["name": key == "hl_mode" ? "highlight" : "area", "on": String($0)]) }))
                            }
                            ForEach(["dashed", "colored", "automenu"], id: \.self) { key in
                                Toggle(model.label(key), isOn: Binding(get: { model.flag(key) }, set: { model.send("pdf-flag", ["name": key, "value": String($0)]) }))
                            }
                        } label: { Image(systemName: "ellipsis.circle") }
                    }.buttonStyle(.borderless).padding(8)
                }
                Divider()
            }
            ZStack {
                PDFCanvas(model: model)
                if model.loading { ProgressView() }
                if let error = model.error { Text(error).textSelection(.enabled).padding().background(.regularMaterial) }
            }.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear { model.apply(context, services: services) }
        .onChange(of: context.revision) { _, _ in model.apply(context, services: services) }
        .onDisappear { model.stop() }
    }

    private func action(_ key: String, _ icon: String, _ perform: @escaping () -> Void) -> some View {
        Button(action: perform) { Image(systemName: icon) }
            .help(model.label(key)).accessibilityLabel(model.label(key))
            .accessibilityIdentifier("pdf." + key)
    }
}

@MainActor
extension PlatformServices {
    func assetURL(_ source: String) throws -> URL {
        if let url = URL(string: source), ["https", "http"].contains(url.scheme?.lowercased() ?? "") { return url }
        guard let rootPath = graphContext["asset-dir"], !rootPath.isEmpty else { throw HostError("Asset graph context is unavailable") }
        let root = URL(fileURLWithPath: rootPath, isDirectory: true).standardizedFileURL.resolvingSymlinksInPath()
        let candidate: URL
        if let url = URL(string: source), url.isFileURL { candidate = url }
        else if source.hasPrefix("/") { candidate = URL(fileURLWithPath: source) }
        else {
            var relative = source
            for prefix in ["../assets/", "./assets/", "assets/"] where relative.hasPrefix(prefix) { relative = String(relative.dropFirst(prefix.count)); break }
            candidate = root.appendingPathComponent(relative)
        }
        let resolved = candidate.standardizedFileURL.resolvingSymlinksInPath()
        guard resolved.path.hasPrefix(root.path + "/") else { throw HostError("Asset path escapes the active graph") }
        return resolved
    }
}

@MainActor
private struct PDFCanvas: NSViewRepresentable {
    let model: PDFWorkspaceModel
    func makeNSView(context: Context) -> DesktopPDFView {
        let view = DesktopPDFView()
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.autoScales = true
        model.attach(view)
        return view
    }
    func updateNSView(_ view: DesktopPDFView, context: Context) { view.areaMode = model.flag("area_mode") }
}

@MainActor
private final class DesktopPDFView: PDFView {
    var areaMode = false
    var didFinishSelection: (() -> Void)?
    var didSelectAnnotation: ((String) -> Void)?
    var didSelectArea: ((PDFPage, CGRect) -> Void)?
    var didLayout: (() -> Void)?
    private var start: (PDFPage, NSPoint)?
    private var area: CGRect?

    override func mouseDown(with event: NSEvent) {
        let point = convert(event.locationInWindow, from: nil)
        if areaMode, let page = page(for: point, nearest: false) { start = (page, point); return }
        if let page = page(for: point, nearest: false),
           let annotation = page.annotation(at: convert(point, to: page)),
           let user = annotation.userName, user.hasPrefix("logseq:") {
            clearSelection(); didSelectAnnotation?(String(user.dropFirst(7))); return
        }
        super.mouseDown(with: event)
    }
    override func mouseDragged(with event: NSEvent) {
        guard let (page, origin) = start else { super.mouseDragged(with: event); return }
        let point = convert(event.locationInWindow, from: nil)
        area = CGRect(x: min(origin.x, point.x), y: min(origin.y, point.y), width: abs(origin.x - point.x), height: abs(origin.y - point.y))
            .intersection(convert(page.bounds(for: .cropBox), from: page))
        needsDisplay = true
    }
    override func mouseUp(with event: NSEvent) {
        if let (page, _) = start {
            if let area, !area.isNull, area.width > 2, area.height > 2 { didSelectArea?(page, area) }
            start = nil; area = nil; needsDisplay = true
            return
        }
        super.mouseUp(with: event); didFinishSelection?()
    }
    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        if let area { NSColor.controlAccentColor.setStroke(); NSBezierPath(rect: area).stroke() }
    }
    override func layout() { super.layout(); didLayout?() }
}

@MainActor
private final class PDFWorkspaceModel: NSObject, ObservableObject {
    @Published var ready = false
    @Published var loading = true
    @Published var error: String?
    @Published var page = 1
    @Published var pageCount = 0
    @Published var selection = ""
    @Published var selectedID: String?
    @Published private var attributes: [String: String] = [:]
    weak var view: DesktopPDFView?
    let colors = ["yellow", "red", "green", "blue", "purple"]
    private var color = "yellow"
    private var labels: [String: String] = [:]
    private var scope = ""
    private var context: LUIAppleExtensionViewContext?
    private weak var services: PlatformServices?
    private var incarnation: UInt64?
    private var documentTask: Task<Void, Never>?
    private var visitTask: Task<Void, Never>?
    private var highlights: [[String: Any]] = []
    private var annotations: [PDFAnnotation] = []
    private var rendered = ""
    private var lastSize = CGSize.zero
    private var navigatedReference = ""
    private var appliedPage = 0
    private var appliedScale = ""

    func label(_ key: String) -> String { labels[key] ?? key }
    func flag(_ key: String) -> Bool { attributes[key] == "true" }
    private var live: Bool {
        guard let context, let services, !services.closed else { return false }
        return services.incarnations[context.nodeID] == incarnation
    }
    func send(_ name: String, _ payload: [String: Any] = [:]) {
        guard live, let context, let services else { return }
        var body = payload
        for key in ["repo", "identity", "instance"] { body[key] = attributes[key] }
        services.emitDOM(context, name, body)
    }
    func attach(_ view: DesktopPDFView) {
        self.view = view
        view.didFinishSelection = { [weak self] in
            guard let self else { return }
            selectionChanged()
            if flag("hl_mode") { highlightSelection() }
        }
        view.didSelectAnnotation = { [weak self] id in self?.selectedID = id }
        view.didSelectArea = { [weak self] page, rect in self?.areaHighlight(page, rect) }
        view.didLayout = { [weak self] in self?.renderHighlights() }
        for name in [Notification.Name.PDFViewSelectionChanged, .PDFViewPageChanged, .PDFViewScaleChanged] {
            NotificationCenter.default.addObserver(self, selector: #selector(changed(_:)), name: name, object: view)
        }
    }
    func apply(_ context: LUIAppleExtensionViewContext, services: PlatformServices) {
        self.context = context; self.services = services
        incarnation = services.incarnations[context.nodeID]
        do {
            let raw = try services.object(context.string("attrs") ?? "{}")
            guard let attrs = raw as? [String: String] else { throw HostError("PDF attrs must be strings") }
            // The native view may mount before asynchronous annotation data.
            guard let identity = attrs["identity"], let repo = attrs["repo"], let instance = attrs["instance"] else { return }
            let nextScope = repo + "\n" + identity + "\n" + instance
            let path: String = try services.required(attrs, "path")
            let labelsJSON: String = try services.required(attrs, "labels")
            labels = try JSONDecoder().decode([String: String].self, from: Data(labelsJSON.utf8))
            let hls: String = try services.required(attrs, "hls")
            guard let decoded = try JSONSerialization.jsonObject(with: Data(hls.utf8)) as? [[String: Any]] else { throw HostError("Invalid PDF annotations") }
            attributes = attrs; highlights = decoded; ready = true
            view?.areaMode = flag("area_mode")
            if scope != nextScope {
                scope = nextScope; selectedID = nil; appliedPage = 0; appliedScale = ""; rendered = ""; navigatedReference = ""
                documentTask?.cancel(); visitTask?.cancel(); annotations.removeAll(); view?.document = nil
                loading = true; error = nil
                let url = try services.assetURL(path)
                documentTask = Task { [weak self] in
                    do {
                        let data: Data
                        if url.isFileURL { data = try Data(contentsOf: url) }
                        else {
                            let (bytes, response) = try await URLSession.shared.data(from: url)
                            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw HostError("PDF download failed") }
                            data = bytes
                        }
                        try Task.checkCancellation()
                        guard let self, scope == nextScope, live else { return }
                        guard let document = PDFDocument(data: data), !document.isLocked else { throw HostError("Invalid or locked PDF document") }
                        view?.document = document; pageCount = document.pageCount; loading = false
                        restorePosition(); renderHighlights(force: true)
                    } catch is CancellationError { return }
                    catch { guard let self, !Task.isCancelled, scope == nextScope, live else { return }; fail(error) }
                }
            } else { restorePosition(); renderHighlights() }
        } catch { fail(error) }
    }
    private func fail(_ failure: Error) {
        loading = false; error = failure.localizedDescription
        services?.unsupported("pdf", String(describing: failure))
    }
    func stop() { documentTask?.cancel(); visitTask?.cancel(); NotificationCenter.default.removeObserver(self) }
    @objc private func changed(_ notification: Notification) {
        // PDFKit can notify inside an NSViewRepresentable update.
        let name = notification.name
        DispatchQueue.main.async { [weak self] in
            guard let self, live else { return }
            if name == .PDFViewSelectionChanged { selectionChanged(); return }
            guard let view, let document = view.document else { return }
            if name == .PDFViewPageChanged, let current = view.currentPage {
                let number = document.index(for: current) + 1
                page = number
                if number != appliedPage {
                    appliedPage = number; visitTask?.cancel()
                    visitTask = Task { [weak self] in
                        do { try await Task.sleep(for: .milliseconds(500)) } catch { return }
                        self?.send("pdf-page", ["page": number])
                    }
                }
            }
            if name == .PDFViewScaleChanged, !view.autoScales {
                let scale = String(Double(view.scaleFactor))
                if appliedScale != scale { appliedScale = scale; send("pdf-scale", ["scale": scale]) }
            }
            renderHighlights(force: true)
        }
    }
    private func selectionChanged() {
        selection = view?.currentSelection?.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !selection.isEmpty { selectedID = nil }
    }
    private func restorePosition() {
        guard let view, let document = view.document else { return }
        if let number = attributes["page"].flatMap(Int.init), number != appliedPage, number > 0, let target = document.page(at: number - 1) {
            appliedPage = number; page = number; view.go(to: target)
        }
        if let scale = attributes["scale"], appliedScale != scale {
            appliedScale = scale
            if let value = Double(scale), value.isFinite, value > 0 { view.autoScales = false; view.scaleFactor = value }
            else if ["auto", "page-fit", "page-width"].contains(scale) { view.autoScales = true }
            else { services?.unsupported("pdf-scale", "Unrecognized scale: " + scale) }
        }
        if let id = attributes["ref_hl"], !id.isEmpty, id != navigatedReference,
           let highlight = highlights.first(where: { $0["id"] as? String == id }),
           let number = highlight["page"] as? Int, let target = document.page(at: number - 1),
           let bounding = highlight["bounding"] as? [String: Any], let rect = pageRect(bounding, target) {
            navigatedReference = id; selectedID = id; view.go(to: rect, on: target)
        }
    }
    func fit() { view?.autoScales = true; appliedScale = "auto"; send("pdf-scale", ["scale": "auto"]) }
    func setColor(_ color: String) { self.color = color; if let selectedID { send("pdf-hl-color", ["id": selectedID, "color": color]) } }
    func annotationAction(_ name: String) { if let selectedID { send(name, ["id": selectedID]) } }

    // Canonical PDF rectangles use a top-left origin and retain their original
    // viewport size. AppKit's PDFView may use an unflipped coordinate system.
    private func storedRect(_ rect: CGRect, _ page: PDFPage) -> [String: Double]? {
        guard let view else { return nil }
        let viewport = view.convert(page.bounds(for: .cropBox), from: page)
        guard viewport.width > 0, viewport.height > 0 else { return nil }
        let top = view.isFlipped ? rect.minY - viewport.minY : viewport.maxY - rect.maxY
        return ["x1": rect.minX - viewport.minX, "y1": top, "x2": rect.maxX - viewport.minX, "y2": top + rect.height, "w": viewport.width, "h": viewport.height]
    }
    private func pageRect(_ stored: [String: Any], _ page: PDFPage) -> CGRect? {
        guard let view, let x1 = stored["x1"] as? Double, let y1 = stored["y1"] as? Double,
              let x2 = stored["x2"] as? Double, let y2 = stored["y2"] as? Double,
              let w = stored["w"] as? Double, let h = stored["h"] as? Double, w > 0, h > 0 else { return nil }
        let viewport = view.convert(page.bounds(for: .cropBox), from: page)
        let height = (y2 - y1) / h * viewport.height
        let top = y1 / h * viewport.height
        let rect = CGRect(x: viewport.minX + x1 / w * viewport.width, y: view.isFlipped ? viewport.minY + top : viewport.maxY - top - height, width: (x2 - x1) / w * viewport.width, height: height)
        return view.convert(rect, to: page)
    }
    func highlightSelection() {
        guard let view, let selection = view.currentSelection, let document = view.document else { return }
        for page in selection.pages {
            let lines = selection.selectionsByLine().filter { $0.pages.contains(where: { $0 === page }) }
            let rects = lines.map { view.convert($0.bounds(for: page), from: page) }.filter { !$0.isNull && $0.width > 0 && $0.height > 0 }
            guard let first = rects.first, let bounding = storedRect(rects.dropFirst().reduce(first, { $0.union($1) }), page) else { continue }
            let id = UUID().uuidString.lowercased(); selectedID = id
            send("pdf-hl-add", ["id": id, "page": document.index(for: page) + 1, "text": lines.compactMap(\.string).joined(separator: "\n"), "bounding": bounding, "rects": rects.compactMap { storedRect($0, page) }, "color": color])
        }
        view.clearSelection(); selectionChanged()
    }
    private func areaHighlight(_ page: PDFPage, _ rect: CGRect) {
        guard let view, let document = view.document, let bounding = storedRect(rect, page) else { return }
        let viewport = view.convert(page.bounds(for: .cropBox), from: page)
        let target = page.bounds(for: .cropBox).size
        let factor = min(2, 4096 / max(target.width, target.height))
        let image = page.thumbnail(of: CGSize(width: target.width * factor, height: target.height * factor), for: .cropBox)
        guard let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil),
              let cropped = cg.cropping(to: CGRect(x: bounding["x1"]! / viewport.width * Double(cg.width), y: bounding["y1"]! / viewport.height * Double(cg.height), width: rect.width / viewport.width * Double(cg.width), height: rect.height / viewport.height * Double(cg.height))),
              let png = NSBitmapImageRep(cgImage: cropped).representation(using: .png, properties: [:]) else {
            services?.unsupported("pdf-area", "PDF area could not be rasterized"); return
        }
        let id = UUID().uuidString.lowercased(); selectedID = id
        send("pdf-hl-area", ["id": id, "page": document.index(for: page) + 1, "text": "", "bounding": bounding, "rects": [], "color": color, "png": png.base64EncodedString()])
    }
    private func renderHighlights(force: Bool = false) {
        guard let view, let document = view.document, view.bounds.width > 0, view.bounds.height > 0 else { return }
        let current = attributes["hls"] ?? ""
        guard force || current != rendered || lastSize != view.bounds.size else { return }
        rendered = current; lastSize = view.bounds.size
        annotations.forEach { $0.page?.removeAnnotation($0) }; annotations.removeAll()
        for highlight in highlights {
            guard let number = highlight["page"] as? Int, number > 0, let page = document.page(at: number - 1), let id = highlight["id"] as? String else { continue }
            let area = highlight["image"] is String
            var rects = highlight["rects"] as? [[String: Any]] ?? []
            if rects.isEmpty, let bounding = highlight["bounding"] as? [String: Any] { rects = [bounding] }
            for stored in rects {
                guard let rect = pageRect(stored, page), !rect.isEmpty else { continue }
                let annotation = PDFAnnotation(bounds: rect, forType: area ? .square : .highlight, withProperties: nil)
                let colors: [String: NSColor] = ["yellow": .systemYellow, "red": .systemRed, "green": .systemGreen, "blue": .systemBlue, "purple": .systemPurple]
                annotation.color = (colors[highlight["color"] as? String ?? "yellow"] ?? .systemYellow).withAlphaComponent(area ? 0.8 : 0.35)
                annotation.userName = "logseq:" + id; annotation.contents = highlight["text"] as? String
                if area, flag("dashed") { let border = PDFBorder(); border.style = .dashed; border.dashPattern = [3, 3]; annotation.border = border }
                page.addAnnotation(annotation); annotations.append(annotation)
            }
        }
    }
}
