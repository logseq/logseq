// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "LogseqApple",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "logseq-apple", targets: ["LogseqApple"])],
    dependencies: [
        .package(url: "https://github.com/logseq/lui.git", revision: "e42a6e6a9b9df92c41d721da8832f1b25f1eaa0c")
    ],
    targets: [
        .executableTarget(name: "LogseqApple", dependencies: [
            .product(name: "LUIAppleBackendStatic", package: "lui")
        ], linkerSettings: [.linkedFramework("AppKit"), .linkedFramework("Security"), .linkedFramework("PDFKit"), .linkedFramework("WebKit"), .linkedFramework("AVKit")])
    ]
)
