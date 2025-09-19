import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let entry = SimpleEntry(date: currentDate)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

struct ShortcutsEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        Link(destination: URL(string: "logseq://mobile/go/quick-add")!) {
            VStack(alignment: .leading, spacing: 0) {
                // Top heading
                Text("Logseq")
                    .font(.headline)
                    .bold()
                    .foregroundColor(Color(hex: "#002b36"))

                // Middle text
                Text("I have an idea...")
                    .font(.subheadline)
                    .bold()
                    .foregroundColor(.primary.opacity(0.8))

                Spacer(minLength: 0)

                // Bottom buttons row
                HStack(spacing: 8) {
                    // Left button (audio waves)
                    Link(destination: URL(string: "logseq://mobile/go/audio")!) {
                        Image(systemName: "waveform")
                            .font(.body)
                            .foregroundColor(Color(hex: "#002b36"))
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(Color.gray.opacity(0.05))
                            .clipShape(Capsule())
                            .contentShape(Capsule())
                    }

                    // Right button (quick add)
                    Link(destination: URL(string: "logseq://mobile/go/quick-add")!) {
                        Image(systemName: "plus")
                            .font(.body)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(Color(hex: "#002b36"))
                            .clipShape(Capsule())
                            .contentShape(Capsule())
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(-3)
        }
    }
}

// Helper to support hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255,
                            (int >> 8) * 17,
                            (int >> 4 & 0xF) * 17,
                            (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255,
                            int >> 16,
                            int >> 8 & 0xFF,
                            int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24,
                            int >> 16 & 0xFF,
                            int >> 8 & 0xFF,
                            int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct Shortcuts: Widget {
    let kind: String = "shortcuts"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                ShortcutsEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                ShortcutsEntryView(entry: entry)
                    .background()
            }
        }
        .configurationDisplayName("Logseq Shortcuts")
        .description("Quick actions for Logseq")
    }
}

#Preview(as: .systemSmall) {
    Shortcuts()
} timeline: {
    SimpleEntry(date: .now)
}
