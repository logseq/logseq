package com.logseq.app

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmarks
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.DataArray
import androidx.compose.material.icons.outlined.KeyboardCommandKey
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material.icons.outlined.BookmarkAdd
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.CheckBox
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Equalizer
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.GraphicEq
import androidx.compose.material.icons.outlined.KeyboardHide
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material.icons.outlined.Redo
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material.icons.outlined.Undo
import androidx.compose.ui.graphics.vector.ImageVector

object MaterialIconResolver {
    fun resolve(name: String?): ImageVector? {
        val key = name
            ?.trim()
            ?.lowercase()
            ?.replace("_", "-")
            ?.replace("\\s+".toRegex(), "-")
            ?.replace(".", "-")
            ?: return null

        return when (key) {
            "chevron-backward", "arrow-left", "back" -> Icons.Outlined.ArrowBack
            "arrow-right" -> Icons.Outlined.ArrowForward
            "arrow-uturn-backward" -> Icons.Outlined.Undo
            "arrow-uturn-forward" -> Icons.Outlined.Redo
            "calendar" -> Icons.Outlined.CalendarToday
            "waveform", "audio", "equalizer" -> Icons.Outlined.GraphicEq
            "ellipsis" -> Icons.Outlined.MoreVert
            "star-fill" -> Icons.Filled.Star
            "star" -> Icons.Outlined.StarBorder
            "circle-fill" -> Icons.Filled.Circle
            "plus", "add" -> Icons.Outlined.Add
            "paperplane", "send" -> Icons.Filled.Send
            "todo", "checkmark-square" -> Icons.Outlined.CheckBox
            "number", "tag" -> Icons.Outlined.LocalOffer
            "parentheses" -> Icons.Outlined.DataArray
            "command", "slash" -> Icons.Outlined.KeyboardCommandKey
            "camera" -> Icons.Outlined.CameraAlt
            "keyboard-chevron-compact-down", "keyboard-hide" -> Icons.Outlined.KeyboardHide
            "doc-on-doc", "copy" -> Icons.Outlined.ContentCopy
            "trash", "delete" -> Icons.Outlined.Delete
            "r-square", "bookmark-ref" -> Icons.Outlined.BookmarkAdd
            "link" -> Icons.Outlined.Link
            "xmark", "close" -> Icons.Filled.Close
            "house", "home" -> Icons.Filled.Home
            "app-background-dotted" -> Icons.Outlined.Dashboard
            "tray", "add" -> Icons.Outlined.AddCircle
            "square-stack-3d-down-right", "layers" -> Icons.Filled.Layers
            "magnifyingglass", "search" -> Icons.Outlined.Search
            "go-to", "goto" -> Icons.Outlined.Explore
            "bookmark" -> Icons.Filled.Bookmarks
            "sync" -> Icons.Outlined.Equalizer
            else -> null
        }
    }
}
