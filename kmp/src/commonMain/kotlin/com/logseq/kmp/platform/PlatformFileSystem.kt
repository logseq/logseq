package com.logseq.kmp.platform

/**
 * Security utilities for file system operations
 */
object FileSystemSecurity {
    private const val MAX_PATH_LENGTH = 4096
    private val DANGEROUS_PATTERNS = listOf("..", "../", "..\\", "\\", "\u0000")

    fun validatePath(path: String): String {
        require(path.length <= MAX_PATH_LENGTH) { "Path exceeds maximum length" }
        require(!path.contains('\u0000')) { "Path contains null bytes" }
        DANGEROUS_PATTERNS.forEach { pattern ->
            require(!path.contains(pattern)) { "Path contains dangerous pattern: $pattern" }
        }
        // Ensure path doesn't start with absolute patterns
        require(!path.startsWith("/")) { "Absolute paths not allowed" }
        require(!Regex("^[A-Za-z]:\\\\").containsMatchIn(path)) { "Windows absolute paths not allowed" }
        return path.trim()
    }

    fun sanitizePath(path: String): String {
        return validatePath(path).replace(Regex("[/\\\\]+"), "/") // Normalize separators
    }
}

expect class PlatformFileSystem() {
    fun getDocumentsDirectory(): String
    fun createDirectory(path: String): Boolean
    fun fileExists(path: String): Boolean
}