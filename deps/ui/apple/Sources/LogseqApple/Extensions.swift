import AppKit
import LUIAppleBackend
import SwiftUI

let rawTags = "div span a button textarea input img main header h1 h2 h3 h4 h5 h6 p ul li nav section strong em code pre label form select option video audio iframe small kbd table thead tbody tr td th br hr canvas article aside footer details summary u mark b i del ins sub blockquote svg path circle rect line polyline polygon g defs use ellipse tspan sup em-emoji pdf".split(separator: " ").map(String.init)

private struct Field {
    let name: String
    let kind: String
    let required: Bool
    var token: String { "\(name.utf8.count):\(name):\(kind):\(required ? "required" : "optional")" }
    var swiftKind: LUIExtensionValueKind {
        switch kind { case "bool": .bool; case "int": .int; case "float": .double; default: .string }
    }
}
private func fields(_ names: String, _ kind: String = "string", _ required: Bool = false) -> [Field] {
    names.split(separator: " ").map { Field(name: String($0), kind: kind, required: required) }
}
private struct EventSchema { let name: String; let fields: [Field] }
private func token(_ s: String) -> String { "\(s.utf8.count):\(s)" }

@MainActor
func logseqExtensions(_ services: PlatformServices) throws -> LUIAppleExtensionRegistry {
    let registry = LUIAppleExtensionRegistry()
    let dom = EventSchema(name: "dom-event", fields: fields("name", "string", true) + fields("payload"))
    func register(_ id: String, _ standard: Bool, _ children: [String], _ properties: [Field], _ events: [EventSchema], _ render: @escaping LUIAppleExtension.ViewFactory) throws {
        let fingerprint = "lui-extension-v1|" + token(id)
            + "|profiles:linux/generic,macos/generic,macos/swiftui,web/web,windows/generic"
            + "|standard-children:\(standard ? 1 : 0)|children:" + children.sorted().map(token).joined(separator: ",")
            + "|properties:" + properties.map { $0.token + ":none" }.sorted().joined(separator: ",")
            + "|events:" + events.map { token($0.name) + "[" + $0.fields.map(\.token).sorted().joined(separator: ",") + "]" }.sorted().joined(separator: ",")
        try registry.register(LUIAppleExtension(identifier: id, fingerprint: fingerprint,
            acceptsStandardChildren: standard, childIdentifiers: children,
            properties: properties.map { LUIExtensionProperty(name: $0.name, kind: $0.swiftKind, isRequired: $0.required) },
            events: events.map { LUIExtensionEvent(name: $0.name, fields: $0.fields.map { LUIExtensionEventField(name: $0.name, kind: $0.swiftKind, isRequired: $0.required) }) }, viewFactory: render))
    }
    let rawProps = fields("attrs events text style-class accessibility-identifier orientation flex-wrap padding padding-top padding-right padding-bottom padding-left padding-horizontal padding-vertical margin margin-top margin-right margin-bottom margin-left margin-horizontal margin-vertical width height min-width min-height max-width max-height gap row-gap column-gap background shadow display main cross")
        + fields("font-size font-weight line-height letter-spacing opacity corner-radius", "float")
    let children = rawTags.map { "logseq-" + $0 } + ["logseq-codemirror", "logseq-katex"]
    for tag in rawTags {
        try register("logseq-" + tag, true, children, rawProps, [dom]) { context in
            AnyView(RawElement(context: context, tag: tag, services: services))
        }
    }
    try register("logseq-dom", false, [], [], [dom]) { _ in AnyView(EmptyView()) }
    let editorProps = fields("composition runs accessibility-identifier data-testid style-class attrs") + fields("block-id", "string", true) + fields("caret", "int")
    let editorEvents = [
        EventSchema(name: "key", fields: fields("key", "string", true) + fields("code key-char") + fields("shift alt meta ctrl repeat", "bool")),
        EventSchema(name: "insert", fields: fields("text", "string", true)),
        EventSchema(name: "delete", fields: fields("kind", "string", true)),
        EventSchema(name: "composition", fields: fields("state", "string", true) + fields("text range")),
        EventSchema(name: "focus", fields: []), EventSchema(name: "blur", fields: []),
        EventSchema(name: "pointer", fields: fields("offset", "int", true) + fields("extend", "bool")),
        EventSchema(name: "dblclick", fields: fields("offset", "int", true)), dom]
    try register("logseq-editor", false, [], editorProps, editorEvents) { context in
        AnyView(EditorSink(context: context, services: services).frame(width: 1, height: 1))
    }
    try register("logseq-codemirror", false, [], fields("uuid lang value source-role style-class accessibility-identifier") + fields("read-only", "bool"), [EventSchema(name: "cm-event", fields: fields("name", "string", true) + fields("value key"))]) { context in
        AnyView(CodeEditor(context: context, services: services).frame(minHeight: 80))
    }
    try register("logseq-katex", false, [], fields("tex", "string", true) + fields("display inline", "bool") + fields("style-class accessibility-identifier"), []) { context in
        AnyView(NativeMath(context: context, services: services).id(services.incarnations[context.nodeID]))
    }
    return registry
}

extension LUIAppleExtensionViewContext {
    func string(_ name: String) -> String? { if case .string(let s) = property(name) { return s }; return nil }
    func number(_ name: String) -> Double? {
        switch property(name) { case .double(let n): n; case .int(let n): Double(n); case .string(let s): Double(s); default: nil }
    }
    func dimension(_ name: String) -> CGFloat? { number(name).map { CGFloat($0) } }
}

@MainActor
struct RawElement: View {
    let context: LUIAppleExtensionViewContext
    let tag: String
    let services: PlatformServices
    @ViewBuilder var children: some View {
        if let text = context.string("text"), !text.isEmpty { Text(text) }
        ForEach(context.childIDs, id: \.self) { context.content(for: $0) }
    }
    var body: some View {
        let _ = context.revision
        if context.string("display") != "none" {
        element
            .font(context.number("font-size").map { .system(size: $0) })
            .opacity(context.number("opacity") ?? 1)
            .padding(context.number("padding") ?? 0)
            .frame(width: context.dimension("width"), height: context.dimension("height"))
            .frame(minWidth: context.dimension("min-width"), maxWidth: context.dimension("max-width"), minHeight: context.dimension("min-height"), maxHeight: context.dimension("max-height"))
            .accessibilityIdentifier(context.string("accessibility-identifier") ?? "lui-node-\(context.nodeID)")
            .background(ViewAnchor(node: context.nodeID, services: services))
        }
    }
    @ViewBuilder private var element: some View {
        switch tag {
        case "br": Color.clear.frame(height: 1)
        case "hr": Divider()
        case "button", "summary": Button(action: { services.emitDOM(context, "click") }) { children }
        case "input", "textarea": RawInput(context: context, services: services)
        case "img": NativeAssetImage(context: context, services: services).id(services.incarnations[context.nodeID])
        case "video", "audio": NativeAssetPlayer(context: context, services: services).id(services.incarnations[context.nodeID]).frame(height: tag == "audio" ? 48 : 240)
        case "iframe": NativeEmbeddedWeb(context: context, services: services).id(services.incarnations[context.nodeID]).frame(height: context.dimension("height") ?? 240)
        case "table": nativeTable
        case "tr": HStack(alignment: .top, spacing: 12) { children }
        case "th", "strong", "b": container.bold()
        case "em", "i": container.italic()
        case "del": container.strikethrough()
        case "u", "ins": container.underline()
        case "pre", "code", "kbd": container.font(.system(.body, design: .monospaced))
        case "blockquote": HStack(alignment: .top, spacing: 10) { Rectangle().fill(.secondary).frame(width: 3); container.italic() }
        case "pdf": PDFWorkspace(context: context, services: services).id(services.incarnations[context.nodeID])
        case "canvas", "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g", "defs", "use", "ellipse":
            Text("[\(tag)]").onAppear { services.unsupported("logseq-\(tag)", "Native extension rendering is unavailable") }
        default:
            if context.string("display") == "none" { EmptyView() } else { container }
        }
    }
    @ViewBuilder private var container: some View {
        if context.string("orientation") == "horizontal" { HStack(alignment: .top, spacing: context.number("gap") ?? 0) { children } }
        else { VStack(alignment: .leading, spacing: context.number("gap") ?? 0) { children } }
    }
    private var tableRows: [Int] {
        var rows: [Int] = []
        func walk(_ id: Int) {
            if context.extensionIdentifier(of: id) == "logseq-tr" { rows.append(id); return }
            for child in context.childIDs(of: id) { walk(child) }
        }
        for child in context.childIDs { walk(child) }
        return rows
    }
    private var nativeTable: some View {
        let _ = context.measureStamp(of: context.nodeID)
        return ScrollView(.horizontal) {
            Grid(alignment: .topLeading, horizontalSpacing: 12, verticalSpacing: 8) {
                ForEach(tableRows, id: \.self) { row in
                    GridRow {
                        ForEach(context.childIDs(of: row), id: \.self) { cell in context.nodeView(of: cell).padding(6) }
                    }
                }
            }.padding(6)
        }
    }
}

@MainActor
struct ViewAnchor: NSViewRepresentable {
    let node: Int
    let services: PlatformServices
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        services.views[node] = WeakView(view)
        return view
    }
    func updateNSView(_ view: NSView, context: Context) { services.views[node] = WeakView(view) }
}
struct WeakView { weak var value: NSView?; init(_ value: NSView) { self.value = value } }

@MainActor
struct RawInput: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    func makeNSView(context: Context) -> NSTextField {
        let field = NSTextField()
        field.delegate = context.coordinator
        return field
    }
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func updateNSView(_ field: NSTextField, context: Context) {
        context.coordinator.parent = self
        if let attrs = self.context.string("attrs"), let obj = try? services.object(attrs), let value = obj["value"] as? String, field.currentEditor() == nil { field.stringValue = value }
        field.setAccessibilityIdentifier(self.context.string("accessibility-identifier"))
        services.views[self.context.nodeID] = WeakView(field)
    }
    @MainActor final class Coordinator: NSObject, NSTextFieldDelegate {
        var parent: RawInput
        init(_ parent: RawInput) { self.parent = parent }
        func controlTextDidChange(_ notification: Notification) {
            guard let field = notification.object as? NSTextField else { return }
            parent.services.emitDOM(parent.context, "input", ["value": field.stringValue])
        }
    }
}
