// swift-tools-version: 6.0

import PackageDescription
import Foundation

// Absolute path of the lui checkout's Apple package. Override with
// LOGSEQ_LUI_PACKAGE_PATH when the checkout lives elsewhere.
let luiPackagePath =
    ProcessInfo.processInfo.environment["LOGSEQ_LUI_PACKAGE_PATH"]
    ?? ("../../lui/platform/apple" as NSString).standardizingPath

// Colon-separated native objects/archives to link into the app binary:
// the OCaml complete object (deps/ui apple/native_embed.exe.o) plus any
// extra objects. The build script (apple/build.sh) supplies them.
let nativeLinkInputs = ProcessInfo.processInfo.environment["LOGSEQ_NATIVE_LINK_INPUTS"]?
    .split(separator: ":")
    .map(String.init) ?? []
let nativeLinkerSettings: [LinkerSetting] = nativeLinkInputs.isEmpty ? [] : [
    .unsafeFlags(nativeLinkInputs, .when(platforms: [.macOS])),
]

let package = Package(
    name: "LogseqNative",
    platforms: [.macOS("26.0")],
    dependencies: [
        // The dependency directory is named "apple" like this package's own
        // directory, so LOGSEQ_LUI_PACKAGE_PATH must point at a path whose
        // basename differs (e.g. a _build/lui-apple-backend symlink) — else
        // SwiftPM merges the identities and the product lookup fails.
        .package(path: luiPackagePath),
    ],
    targets: [
        .executableTarget(
            name: "Logseq",
            dependencies: [
                .product(name: "LUIAppleBackendStatic", package: "lui-apple-backend"), // dep identity = path basename
            ],
            path: "Sources/Logseq",
            linkerSettings: nativeLinkerSettings
        ),
    ]
)
