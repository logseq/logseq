// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "LogseqApple",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "logseq-apple", targets: ["LogseqApple"])],
    dependencies: [
        .package(url: "https://github.com/logseq/lui.git", revision: "bc89138b7c44804ab5c0cf72e833635c85261db1")
    ],
    targets: [
        .executableTarget(name: "LogseqApple", dependencies: [
            .product(name: "LUIAppleBackendStatic", package: "lui")
        ], linkerSettings: [.linkedFramework("AppKit"), .linkedFramework("Security"), .linkedFramework("PDFKit"), .linkedFramework("WebKit"), .linkedFramework("AVKit")])
    ]
)
