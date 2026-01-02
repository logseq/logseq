package com.logseq.kmp.platform

import kotlinx.browser.window

actual class PlatformFileSystem {
    private val documentsDir: String by lazy {
        FileSystemSecurity.sanitizePath("/logseq")
    }

    actual fun getDocumentsDirectory(): String {
        return documentsDir
    }

    actual fun createDirectory(path: String): Boolean {
        val sanitizedPath = FileSystemSecurity.sanitizePath(path)
        val fullPath = if (sanitizedPath.startsWith("/")) {
            sanitizedPath
        } else {
            "$documentsDir/$sanitizedPath"
        }

        // Path traversal check for browser environment
        if (fullPath.contains("..") || !fullPath.startsWith(documentsDir)) {
            throw SecurityException("Directory creation outside of allowed path: $path")
        }

        // Browser FS simulation - would need actual implementation
        console.log("Creating directory: $fullPath")
        return true
    }

    actual fun fileExists(path: String): Boolean {
        val sanitizedPath = FileSystemSecurity.sanitizePath(path)
        val fullPath = if (sanitizedPath.startsWith("/")) {
            sanitizedPath
        } else {
            "$documentsDir/$sanitizedPath"
        }

        // Path traversal check for browser environment
        if (fullPath.contains("..") || !fullPath.startsWith(documentsDir)) {
            return false
        }

        // Browser FS simulation - would need actual implementation
        return false
    }
}