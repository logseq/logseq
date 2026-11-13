// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "LogseqApple",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "logseq-apple", targets: ["LogseqApple"])],
    dependencies: [
        .package(url: "https://github.com/logseq/lui.git", revision: "9b598fc1e23e4b9f79ef470a19b5c87ea91cd7fa")
    ],
    targets: [
        .executableTarget(name: "LogseqApple", dependencies: [
            .product(name: "LUIAppleBackendStatic", package: "lui")
        ], linkerSettings: [.linkedFramework("AppKit"), .linkedFramework("Security"), .linkedFramework("PDFKit"), .linkedFramework("WebKit"), .linkedFramework("AVKit")])
    ]
)
