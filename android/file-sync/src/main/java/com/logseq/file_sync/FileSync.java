package com.logseq.file_sync;

import java.util.List;

public class FileSync {
    static {
        System.loadLibrary("filesync");
    }

    public static native String watch(final Object plugin, final String path, final List<String> ignorePatterns);

    public static native void close();
    public static native String ping();
}
