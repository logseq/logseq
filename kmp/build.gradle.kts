plugins {
    kotlin("multiplatform") version "2.0.21"
    kotlin("plugin.compose") version "2.0.21"
    id("com.android.library") version "8.7.2"
    id("org.jetbrains.compose") version "1.7.1"
}

kotlin {
    jvmToolchain(21)

    // Configure targets
    jvm()

    js(IR) {
        browser()
        binaries.executable()
    }

    androidTarget()

    iosX64()
    iosArm64()
    iosSimulatorArm64()

    // Configure source sets
    sourceSets {
        val commonMain by getting {
            dependencies {
                // Kotlinx libraries
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

                // Compose Multiplatform
                implementation(compose.runtime)
                implementation(compose.foundation)
                implementation(compose.material3)
                @OptIn(org.jetbrains.compose.ExperimentalComposeLibrary::class)
                implementation(compose.components.resources)
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            }
        }

        val jvmMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-swing:1.8.1")
            }
        }

        val jvmTest by getting {
            dependencies {
                implementation(kotlin("test-junit"))
            }
        }

        val jsMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.8.1")
                implementation(compose.html.core)
            }
        }

        val jsTest by getting {
            dependencies {
                implementation(kotlin("test-js"))
            }
        }

        val androidMain by getting {
            dependencies {
                implementation("androidx.activity:activity-compose:1.9.2")
                implementation("androidx.appcompat:appcompat:1.6.1")
                implementation("androidx.core:core-ktx:1.13.1")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

                // Compose BOM
                implementation(platform("androidx.compose:compose-bom:2024.09.03"))
                implementation("androidx.compose.ui:ui")
                implementation("androidx.compose.ui:ui-graphics")
                implementation("androidx.compose.material3:material3")
            }
        }

        val androidUnitTest by getting {
            dependencies {
                implementation(kotlin("test-junit"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
                implementation("androidx.arch.core:core-testing:2.2.0")
            }
        }

        val iosMain by creating {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-iosx64:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-iosarm64:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-iossimulatorarm64:1.8.1")
            }
        }

        val iosTest by creating {
            dependencies {
                implementation(kotlin("test"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
            }
        }
    }
}

android {
    compileSdk = 35
    namespace = "com.logseq.kmp"

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}