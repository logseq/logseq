package com.logseq.app;

import android.system.ErrnoException;
import android.system.Os;
import android.system.StructStat;
import android.util.Log;
import android.os.FileObserver;

import android.net.Uri;

import java.io.*;

import java.net.URI;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;
import java.util.regex.Pattern;

import java.io.File;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;

@CapacitorPlugin(name = "FsWatcher")
public class FsWatcher extends Plugin {
    private String mPath;
    private PollingFsWatcher mWatcher;
    private Thread mThread;

    @Override
    public void load() {
        Log.i("FsWatcher", "Android fs-watcher loaded!");
    }

    @PluginMethod()
    public void watch(PluginCall call) {
        String pathParam = call.getString("path");
        // check file:// or no scheme uris
        Uri u = Uri.parse(pathParam);
        Log.i("FsWatcher", "watching " + u);
        // TODO: handle context:// uri
        if (u.getScheme() == null || u.getScheme().equals("file")) {
            File pathObj;
            try {
                pathObj = new File(u.getPath());
            } catch (Exception e) {
                call.reject("invalid watch path: " + pathParam);
                return;
            }

            mPath = pathObj.getAbsolutePath();

            if (mWatcher != null) {
                call.reject("already watching");
                return;
            }

            mWatcher = new PollingFsWatcher(mPath);
            mThread = new Thread(mWatcher);
            mThread.start();

            call.resolve();
        } else {
            call.reject(u.getScheme() + " scheme not supported");
        }
    }

    @PluginMethod()
    public void unwatch(PluginCall call) {
        Log.i("FsWatcher", "unwatch all...");

        if (mWatcher != null) {
            mThread.interrupt();
            mWatcher = null;
        }

        call.resolve();
    }

    // add, change, unlink events
    public void onObserverEvent(int event, String path, SimpleFileMetadata metadata) {
        JSObject obj = new JSObject();
        String content = null;
        File f = new File(path);

        boolean shouldRead = false;
        if (Pattern.matches("(?i)[^.].*?\\.(md|org|css|edn|js|markdown|excalidraw)$", f.getName())) {
            shouldRead = true;
        }

        Uri dir = Uri.fromFile(new File(mPath));
        Uri fpath = Uri.fromFile(f);
        String relpath = null;

        if (fpath.getPath().startsWith(dir.getPath())) {
            relpath = fpath.getPath().substring(dir.getPath().length());
            if (relpath.startsWith("/")) {
                relpath = relpath.substring(1);
            }
        } else {
            Log.e("FsWatcher", "file path not under watch path");
            return;
        }


        obj.put("path", Normalizer.normalize(relpath, Normalizer.Form.NFC));
        obj.put("dir", Uri.fromFile(new File(mPath))); // Uri is for Android. URI is for RFC compatible
        JSObject stat;

        switch (event) {
            case FileObserver.MODIFY:
                obj.put("event", "change");
                stat = new JSObject();
                stat.put("mtime", metadata.mtime);
                stat.put("ctime", metadata.ctime);
                stat.put("size", metadata.size);
                obj.put("stat", stat);
                if (shouldRead) {
                    try {
                        content = getFileContents(f);
                    } catch (IOException e) {
                        Log.e("FsWatcher", "error reading modified file");
                        e.printStackTrace();
                    }
                }

                Log.i("FsWatcher", "prepare event " + obj);
                obj.put("content", content);
                break;
            case FileObserver.CREATE:
                obj.put("event", "add");
                stat = new JSObject();
                stat.put("mtime", metadata.mtime);
                stat.put("ctime", metadata.ctime);
                stat.put("size", metadata.size);
                obj.put("stat", stat);
                if (shouldRead) {
                    try {
                        content = getFileContents(f);
                    } catch (IOException e) {
                        Log.e("FsWatcher", "error reading new file");
                        e.printStackTrace();
                    }
                }
                obj.put("content", content);
                break;
            case FileObserver.DELETE:
                if (f.exists()) {
                    Log.i("FsWatcher", "abandon delete notification due to file exists");
                    return;
                } else {
                    obj.put("event", "unlink");
                }
                Log.i("FsWatcher", "prepare event " + obj);
                break;
            default:
                // unreachable?
                obj.put("event", "unknown");
                break;
        }

        notifyListeners("watcher", obj);
    }

    public static String getFileContents(final File file) throws IOException {
        InputStream inputStream = new FileInputStream(file);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        byte[] buffer = new byte[1024];
        int length;

        while ((length = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, length);
        }

        inputStream.close();
        return outputStream.toString("utf-8");
    }

    public class SimpleFileMetadata {
        public long mtime;
        public long ctime;
        public long size;
        public long ino;

        public SimpleFileMetadata(File file) throws ErrnoException {
            StructStat stat = Os.stat(file.getPath());
            mtime = stat.st_mtime;
            ctime = stat.st_ctime;
            size = stat.st_size;
            ino = stat.st_ino;
        }

        public boolean equals(SimpleFileMetadata other) {
            return mtime == other.mtime && ctime == other.ctime && size == other.size && ino == other.ino;
        }
    }


    public class PollingFsWatcher implements Runnable {
        private String mPath;
        private Map<String, SimpleFileMetadata> metaDb;

        public PollingFsWatcher(String path) {
            metaDb = new HashMap();

            File dir = new File(path);
            try {
                mPath = dir.getCanonicalPath();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        @Override
        public void run() {
            this.tick(false); // skip initial notification

            while (!Thread.currentThread().isInterrupted()) {
                try {
                    this.tick(true);
                    Thread.sleep(2000); // The same as iOS fswatcher, 2s interval
                } catch (InterruptedException e) {
                    // e.printStackTrace();
                    Log.i("FsWatcher", "interrupted, unwatch");
                    break;
                }
            }

        }

        private void tick(boolean shouldNotify) {
            Map<String, SimpleFileMetadata> newMetaDb = new HashMap();

            Stack<String> paths = new Stack();
            paths.push(mPath);
            while (!paths.isEmpty()) {
                String dir = paths.pop();
                File curr = new File(dir);

                File[] files = curr.listFiles();
                if (files != null) {
                    for (File file : files) {
                        String filename = file.getName();
                        if (file.isDirectory()) {
                            if (!filename.startsWith(".") && !filename.equals("bak") && !filename.equals("version-files") && !filename.equals("node_modules")) {
                                paths.push(file.getAbsolutePath());
                            }
                        } else if (file.isFile() && !filename.equals("graphs-txid.edn") && !filename.equals("broken-config.edn")) {
                            try {
                                SimpleFileMetadata metadata = new SimpleFileMetadata(file);
                                newMetaDb.put(file.getAbsolutePath(), metadata);
                            } catch (ErrnoException e) {
                            }
                        }
                    }
                }
            }

            if (shouldNotify) {
                this.updateMetaDb(newMetaDb);
            } else {
                this.metaDb = newMetaDb;
            }
        }

        private void updateMetaDb(Map<String, SimpleFileMetadata> newMetaDb) {
            for (Map.Entry<String, SimpleFileMetadata> entry : newMetaDb.entrySet()) {
                String path = entry.getKey();
                SimpleFileMetadata newMeta = entry.getValue();
                SimpleFileMetadata oldMeta = metaDb.remove(path);
                if (oldMeta == null) {
                    // new file
                    onObserverEvent(FileObserver.CREATE, path, newMeta);
                    Log.d("FsWatcher", "create " + path);
                } else if (!oldMeta.equals(newMeta)) {
                    // file changed
                    onObserverEvent(FileObserver.MODIFY, path, newMeta);
                    Log.d("FsWatcher", "changed " + path);
                }
            }
            for (String path : metaDb.keySet()) {
                // file deleted
                Thread timer = new Thread() {
                    @Override
                    public void run() {
                        try {
                            // delay 500ms then send, enough for most syncing net disks
                            Thread.sleep(500);
                            onObserverEvent(FileObserver.DELETE, path, null);
                            Log.d("FsWatcher", "deleted " + path);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                };
                timer.start();
            }

            this.metaDb = newMetaDb;
        }
    }
}
