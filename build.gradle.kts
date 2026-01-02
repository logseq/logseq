// Root build file for Logseq Kotlin Multiplatform migration
// This allows gradual migration from ClojureScript to Kotlin Multiplatform

plugins {
    // Note: Most build logic is handled by individual modules
    // This root file mainly coordinates multi-module builds
}

allprojects {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

