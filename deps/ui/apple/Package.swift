// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "LogseqApple",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "logseq-apple", targets: ["LogseqApple"])],
    dependencies: [
        .package(url: "https://github.com/logseq/lui.git", revision: "2508ce9e00fb6268fd081855ceb776adf00c93fa")
    ],
    targets: [
        .executableTarget(name: "LogseqApple", dependencies: [
            .product(name: "LUIAppleBackendStatic", package: "lui")
        ], linkerSettings: [.linkedFramework("AppKit"), .linkedFramework("Security"), .linkedFramework("PDFKit"), .linkedFramework("WebKit"), .linkedFramework("AVKit")])
    ]
)
