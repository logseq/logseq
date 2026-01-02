package com.logseq.kmp.platform

import android.content.Context
import android.os.Environment
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

actual class PlatformFileSystem actual constructor() {
    // Note: In Android, we'd typically inject Context
    // For now, using external storage as example
    private val documentsDir: String by lazy {
        val baseDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS)?.absolutePath +
                File.separator + "Logseq" ?: "/storage/emulated/0/Documents/Logseq"
        FileSystemSecurity.sanitizePath(baseDir)
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