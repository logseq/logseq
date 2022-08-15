package com.logseq.app;

import android.annotation.TargetApi;
import android.content.ContentUris;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.util.Log;

import java.io.File;

// The following refs
// https://stackoverflow.com/questions/29713587/how-to-get-the-real-path-with-action-open-document-tree-intent
// https://gist.github.com/asifmujteba/d89ba9074bc941de1eaa#file-asfurihelper
// with bug fixes and patches.
public class FileUtil {
    @TargetApi(Build.VERSION_CODES.KITKAT)
    public static String getPath(final Context context, final Uri uri) {

        final boolean isKitKat = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;

        // DocumentProvider
        if (isKitKat && DocumentsContract.isDocumentUri(context, uri)) {
            // ExternalStorageProvider
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];
                // NOTE: It's not a good idea to use storage root as Graph root.
                String remain = "";
                if (split.length == 2) {
                    remain = split[1];
                }

                if ("primary".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/" + remain;
                } else if ("home".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/Documents/" + remain;
                } else if ("downloads".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/Download/" + remain; // No 's' here
                }

                File dir = null;
                File[] mdirs = context.getExternalMediaDirs();
                for (File mdir : mdirs) {
                    String extPath = mdir.getAbsolutePath();

                    if (extPath.contains("/" + type + "/")) {
                        dir = new File(extPath.substring(0, extPath.indexOf("/Android")) + "/" + remain);
                        if (dir.exists()) {
                            return dir.getAbsolutePath();
                        }
                    }
                }
                // FIXME: The following attempt cannot handle same directory name on different devices!
                // attempt 1
                dir = new File("/storage/" + type + "/" + remain);
                if (dir.exists()) {
                    return dir.getAbsolutePath();
                }
                // attempt 3
                dir = new File("/mnt/media_rw/" + type + "/" + remain);
                if (dir.exists()) {
                    return dir.getAbsolutePath();
                }
                // attempt 3
                dir = new File("/mnt/" + type + "/" + remain);
                if (dir.exists()) {
                    return dir.getAbsolutePath();
                }

                // TODO: other cases
            } else if (isDownloadsDocument(uri)) {
                final String id = DocumentsContract.getDocumentId(uri);
                if (!TextUtils.isEmpty(id)) {
                    if (id.startsWith("raw:")) {
                        return id.replaceFirst("raw:", "");
                    }
                    try {
                        final Uri contentUri = ContentUris.withAppendedId(Uri.parse("content://downloads/public_downloads"), Long.valueOf(id));
                        return getDataColumn(context, contentUri, null, null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
            } else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                final String selection = "_id=?";
                final String[] selectionArgs = new String[]{
                        split[1]
                };

                return getDataColumn(context, contentUri, selection, selectionArgs);
            } else if (isTermuxDocument(uri)) {
                String docId = DocumentsContract.getDocumentId(uri);

                // Ref: https://github.com/termux/termux-app/blob/master/app/src/main/java/com/termux/app/TermuxInstaller.java
                if (docId.startsWith("/")) {
                    if (docId.contains("/com.termux/files/home/storage/")) {
                        String remain = docId.replaceFirst("^.*?com\\.termux/files/home/storage/[^/]+/", "");
                        if (docId.contains("/storage/external-1")) { // TODO: Support external-2 or more
                            File[] dirs = context.getExternalFilesDirs(remain);
                            if (dirs != null && dirs.length >= 2) {
                                docId = dirs[1].getAbsolutePath();
                            }
                        } else if (docId.contains("/storage/media-1")) {
                            File[] dirs = context.getExternalMediaDirs();
                            if (dirs != null && dirs.length >= 2) {
                                docId = dirs[1].getAbsolutePath() + "/" + remain;
                            }
                        } else if (docId.contains("/storage/downloads")) {
                            docId = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS) + "/" + remain;
                        } else if (docId.contains("/storage/shared")) {
                            docId = Environment.getExternalStorageDirectory() + "/" + remain;
                        }
                    }
                    File dir = new File(docId);
                    if (dir.exists()) {
                        return dir.getAbsolutePath();
                    }
                    Log.e("Logseq/FileUtil", "Handle termux content url failed: " + docId);
                }
                // FIXME: Are there any other cases?
            }
        } else if ("content".equalsIgnoreCase(uri.getScheme())) {
            // Return the remote address
            if (isGooglePhotosUri(uri))
                return uri.getLastPathSegment();

            return getDataColumn(context, uri, null, null);
        } else if ("file".equalsIgnoreCase(uri.getScheme())) {
            return uri.getPath();
        }

        return null;
    }

    public static String getDataColumn(Context context, Uri uri, String selection,
                                       String[] selectionArgs) {

        Cursor cursor = null;
        final String column = "_data";
        final String[] projection = {
                column
        };

        try {
            cursor = context.getContentResolver().query(uri, projection, selection, selectionArgs,
                    null);
            if (cursor != null && cursor.moveToFirst()) {
                final int index = cursor.getColumnIndexOrThrow(column);
                return cursor.getString(index);
            }
        } finally {
            if (cursor != null)
                cursor.close();
        }
        return null;
    }


    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is ExternalStorageProvider.
     */
    public static boolean isExternalStorageDocument(Uri uri) {
        return "com.android.externalstorage.documents".equals(uri.getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is DownloadsProvider.
     */
    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri.getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is MediaProvider.
     */
    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri.getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is Google Photos.
     */
    public static boolean isGooglePhotosUri(Uri uri) {
        return "com.google.android.apps.photos.content".equals(uri.getAuthority());
    }

    public static boolean isTermuxDocument(Uri uri) {
        return "com.termux.documents".equals(uri.getAuthority());
    }
}
