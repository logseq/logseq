package com.logseq.sync;

public class FileMeta {
    public String filePath;
    public long size;
    public long mtime;
    public String md5;
    public String encryptedFilename;

    public FileMeta(String filePath, long size, long mtime, String md5) {
        this.filePath = filePath;
        this.size = size;
        this.mtime = mtime;
        this.md5 = md5;
        this.encryptedFilename = encryptedFilename;
    }

    public FileMeta(long size, long mtime, String md5) {
        this.size = size;
        this.mtime = mtime;
        this.md5 = md5;
        this.encryptedFilename = null;
    }

    public String toString() {
        return "FileMeta{" +
                "size=" + size +
                ", mtime=" + mtime +
                ", md5='" + md5 + '\'' +
                ", encryptedFilename='" + encryptedFilename + '\'' +
                '}';
    }
}
