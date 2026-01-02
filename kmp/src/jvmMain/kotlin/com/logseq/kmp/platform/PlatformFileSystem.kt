package com.logseq.kmp.platform

import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

actual class PlatformFileSystem {
    private val documentsDir: String by lazy {
        FileSystemSecurity.sanitizePath(
            System.getProperty("user.home") + File.separator + "Documents" + File.separator + "Logseq"
        )
    }

    actual fun getDocumentsDirectory(): String {
        return documentsDir
    }

    actual fun createDirectory(path: String): Boolean {
        val sanitizedPath = FileSystemSecurity.sanitizePath(path)
        val absolutePath = Paths.get(documentsDir, sanitizedPath).normalize()

        // Ensure the path is within the documents directory
        if (!absolutePath.startsWith(Paths.get(documentsDir))) {
            throw SecurityException("Directory creation outside of allowed path: $path")
        }

        return try {
            Files.createDirectories(absolutePath)
            true
        } catch (e: Exception) {
            false
        }
    }

    actual fun fileExists(path: String): Boolean {
        val sanitizedPath = FileSystemSecurity.sanitizePath(path)
        val absolutePath = Paths.get(documentsDir, sanitizedPath).normalize()

        // Ensure the path is within the documents directory
        return if (absolutePath.startsWith(Paths.get(documentsDir))) {
            Files.exists(absolutePath)
        } else {
            false
        }
    }
}