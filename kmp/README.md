# Logseq Kotlin Multiplatform Module

This module contains the Kotlin Multiplatform implementation for Logseq, enabling gradual migration from ClojureScript to Kotlin.

## Architecture

The module is structured as a Kotlin Multiplatform library with the following targets:
- **JVM**: Desktop applications
- **JS (IR)**: Web applications (compatible with existing ClojureScript build)
- **Android**: Native Android apps
- **iOS**: Native iOS apps (iOS X64, ARM64, Simulator)

## Key Technologies

- **Kotlin Multiplatform**: Cross-platform Kotlin code
- **SQLDelight**: Type-safe SQL queries
- **Orbit MVI**: Model-View-Intent architecture
- **Compose Multiplatform**: Declarative UI framework

## Project Structure

```
kmp/
├── build.gradle.kts          # Main build configuration
├── gradle.properties         # Build properties
├── src/
│   ├── commonMain/           # Shared code across all platforms
│   │   ├── kotlin/
│   │   │   ├── com/logseq/kmp/
│   │   │   │   ├── model/     # Data models
│   │   │   │   ├── ui/        # UI state and components
│   │   │   │   └── platform/  # Platform abstractions
│   │   └── sqldelight/        # Database schemas
│   ├── commonTest/           # Shared tests
│   ├── jvmMain/              # JVM-specific code
│   ├── jvmTest/              # JVM tests
│   ├── jsMain/               # JavaScript-specific code
│   ├── jsTest/               # JavaScript tests
│   ├── androidMain/          # Android-specific code
│   ├── androidTest/          # Android tests
│   ├── iosMain/              # iOS-specific code
│   └── iosTest/              # iOS tests
```

## Building

### Prerequisites
- JDK 17+
- Android SDK (for Android target)
- Xcode (for iOS targets, macOS only)

### Commands
```bash
# Build all targets
./gradlew build

# Build specific target
./gradlew jvmJar
./gradlew jsBrowserProductionWebpack
./gradlew assembleDebug  # Android
./gradlew iosX64Binaries  # iOS

# Run tests
./gradlew allTests

# Generate SQLDelight code
./gradlew generateSqlDelightInterface
```

## Integration with Existing Logseq

This KMP module is designed to coexist with the existing ClojureScript codebase:

1. **Gradual Migration**: Start by porting individual features to Kotlin
2. **Interoperability**: Use Kotlin/JS to interface with existing JavaScript code
3. **Shared Logic**: Move business logic to `commonMain` for reuse across platforms
4. **Platform-Specific UI**: Use Compose Multiplatform for new UI components

## Development Workflow

1. Write shared code in `commonMain`
2. Add platform-specific implementations in respective `*Main` directories
3. Test on all target platforms
4. Integrate with existing build system via Gradle

## Next Steps

- Implement data synchronization with existing Logseq format
- Create Compose UI components for note editing
- Add search functionality using shared coroutines
- Implement file system operations for graph storage
- Set up CI/CD for multiplatform builds