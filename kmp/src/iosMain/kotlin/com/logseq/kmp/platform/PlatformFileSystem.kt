package com.logseq.kmp.platform

import platform.Foundation.NSDocumentDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSUserDomainMask
import platform.Foundation.NSURL

actual class PlatformFileSystem actual constructor() {
    private val documentsDir: String by lazy {
        val fileManager = NSFileManager.defaultManager
        val urls = fileManager.URLsForDirectory(NSDocumentDirectory, NSUserDomainMask)
        val documentsUrl = urls.firstOrNull() as? NSURL
        val basePath = documentsUrl?.path + "/Logseq" ?: "~/Documents/Logseq"
        FileSystemSecurity.sanitizePath(basePath)
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

        // Basic path traversal check for iOS
        if (fullPath.contains("..") || !fullPath.startsWith(documentsDir)) {
            throw SecurityException("Directory creation outside of allowed path: $path")
        }

        val fileManager = NSFileManager.defaultManager
        return try {
            fileManager.createDirectoryAtPath(fullPath, true, null, null)
            true
        } catch (e: Exception) {
            false
        }
    }

    actual fun fileExists(path: String): Boolean {
        val sanitizedPath = FileSystemSecurity.sanitizePath(path)
        val fullPath = if (sanitizedPath.startsWith("/")) {
            sanitizedPath
        } else {
            "$documentsDir/$sanitizedPath"
        }

        // Basic path traversal check for iOS
        if (fullPath.contains("..") || !fullPath.startsWith(documentsDir)) {
            return false
        }

        val fileManager = NSFileManager.defaultManager
        return fileManager.fileExistsAtPath(fullPath)
    }
}