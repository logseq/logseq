package com.logseq.sync;

import java.util.List;

public class RSFileSync {
    static {
        System.loadLibrary("rsapi");
    }

    public static native String getLastError();

    public static native String[] keygen();

    public static native long setEnvironment(String env);
    public static native long setKeys(String secretKey, String publicKey);

    public static native String[] encryptFilenames(List<String> filenames);
    public static native String[] decryptFilenames(List<String> encryptedFilenames);

    public static native FileMeta[] getLocalFilesMeta(String basePath, List<String> filePaths);
    public static native FileMeta[] getLocalAllFilesMeta(String basePath);

    public static native long renameLocalFile(String basePath, String oldPath, String newPath);

    public static native void deleteLocalFiles(String basePath, List<String> filePaths);

    public static native long updateLocalFiles(String basePath, List<String> filePaths, String graphUUID, String token);

    public static native long updateLocalVersionFiles(String basePath, List<String> filePaths, String graphUUID, String token);

    public static native long deleteRemoteFiles(List<String> filePaths, String graphUUID, String token, long txid);

    public static native long updateRemoteFiles(String basePath, List<String> filePaths, String graphUUID, String token, long txid);
}
