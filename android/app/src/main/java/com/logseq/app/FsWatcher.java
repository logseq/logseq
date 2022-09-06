package com.logseq.app;

import android.annotation.SuppressLint;
import android.os.Build;
import android.system.ErrnoException;
import android.system.Os;
import android.system.StructStat;
import android.util.Log;
import android.os.FileObserver;

import android.net.Uri;

import java.io.*;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import java.io.File;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;

@CapacitorPlugin(name = "FsWatcher")
public class FsWatcher extends Plugin {

    List<SingleFileObserver> observers;
    private String mPath;

    @Override
    public void load() {
        Log.i("FsWatcher", "Android fs-watcher loaded!");
    }

    @PluginMethod()
    public void watch(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Android version not supported");
            return;
        }
        String pathParam = call.getString("path");
        // check file:// or no scheme uris
        Uri u = Uri.parse(pathParam);
        Log.i("FsWatcher", "watching " + u);
        if (u.getScheme() == null || u.getScheme().equals("file")) {
            File pathObj;
            try {
                pathObj = new File(u.getPath());
            } catch (Exception e) {
                call.reject("invalid watch path: " + pathParam);
                return;
            }

            mPath = pathObj.getAbsolutePath();

            int mask = FileObserver.CLOSE_WRITE |
                    FileObserver.MOVE_SELF | FileObserver.MOVED_FROM | FileObserver.MOVED_TO |
                    FileObserver.DELETE | FileObserver.DELETE_SELF | FileObserver.CREATE;

            if (observers != null) {
                call.reject("already watching");
                return;
            }
            observers = new ArrayList<>();
            observers.add(new SingleFileObserver(pathObj, mask));

            // NOTE: only watch first level of directory
            File[] files = pathObj.listFiles();
            if (files != null) {
                for (File file : files) {
                    String filename = file.getName();
                    if (file.isDirectory() && !filename.startsWith(".") && !filename.equals("bak") && !filename.equals("version-files") && !filename.equals("node_modules")) {
                        observers.add(new SingleFileObserver(file, mask));
                    }
                }
            }

            this.initialNotify(pathObj);

            for (int i = 0; i < observers.size(); i++)
                observers.get(i).startWatching();
            call.resolve();
        } else {
            call.reject(u.getScheme() + " scheme not supported");
        }
    }

    @PluginMethod()
    public void unwatch(PluginCall call) {
        Log.i("FsWatcher", "unwatch all...");

        if (observers != null) {
            for (int i = 0; i < observers.size(); ++i)
                observers.get(i).stopWatching();
            observers.clear();
            observers = null;
        }

        call.resolve();
    }

    public void initialNotify(File pathObj) {
        this.initialNotify(pathObj, 2);
    }

    public void initialNotify(File pathObj, int maxDepth) {
        if (maxDepth == 0) {
            return;
        }
        File[] files = pathObj.listFiles();
        if (files != null) {
            for (File file : files) {
                String filename = file.getName();
                if (file.isDirectory() && !filename.startsWith(".") && !filename.equals("bak") && !filename.equals("version-files") && !filename.equals("node_modules")) {
                    this.initialNotify(file, maxDepth - 1);
                } else if (file.isFile()
                        && Pattern.matches("(?i)[^.].*?\\.(md|org|css|edn|js|markdown)$",
                        file.getName())) {
                    this.onObserverEvent(FileObserver.CREATE, file.getAbsolutePath());
                }
            }
        }
    }

    // add, change, unlink events
    public void onObserverEvent(int event, String path) {
        JSObject obj = new JSObject();
        String content = null;
        File f = new File(path);
        obj.put("path", Uri.fromFile(f));
        obj.put("dir", Uri.fromFile(new File(mPath)));

        switch (event) {
            case FileObserver.CLOSE_WRITE:
                obj.put("event", "change");
                try {
                    obj.put("stat", getFileStat(path));
                    content = getFileContents(f);
                } catch (IOException | ErrnoException e) {
                    e.printStackTrace();
                }
                Log.i("FsWatcher", "prepare event " + obj);
                obj.put("content", content);
                break;
            case FileObserver.MOVED_TO:
            case FileObserver.CREATE:
                obj.put("event", "add");
                try {
                    obj.put("stat", getFileStat(path));
                    content = getFileContents(f);
                } catch (IOException | ErrnoException e) {
                    e.printStackTrace();
                }
                Log.i("FsWatcher", "prepare event " + obj);
                obj.put("content", content);
                break;
            case FileObserver.MOVE_SELF:
            case FileObserver.MOVED_FROM:
            case FileObserver.DELETE:
            case FileObserver.DELETE_SELF:
                if (f.exists()) {
                    Log.i("FsWatcher", "abandon notification due to file exists");
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

    public static JSObject getFileStat(final String path) throws ErrnoException {
        File file = new File(path);
        StructStat stat = Os.stat(path);
        JSObject obj = new JSObject();
        obj.put("atime", stat.st_atime);
        obj.put("mtime", stat.st_mtime);
        obj.put("ctime", stat.st_ctime);
        obj.put("size", file.length());
        return obj;
    }

    private class SingleFileObserver extends FileObserver {
        private final String mPath;

        public SingleFileObserver(String path, int mask) {
            super(path, mask);
            mPath = path;
        }

        @SuppressLint("NewApi")
        public SingleFileObserver(File path, int mask) {
            super(path, mask);
            mPath = path.getAbsolutePath();
        }

        @Override
        public void onEvent(int event, String path) {
            if (path != null && !path.equals("graphs-txid.edn") && !path.equals("broken-config.edn")) {
                Log.d("FsWatcher", "got path=" + mPath + "/" + path + " event=" + event);
                // TODO: handle newly created directory
                if (Pattern.matches("(?i)[^.].*?\\.(md|org|css|edn|js|markdown)$", path)) {
                    String fullPath = mPath + "/" + path;
                    if (event == FileObserver.MOVE_SELF || event == FileObserver.MOVED_FROM ||
                        event == FileObserver.DELETE || event == FileObserver.DELETE_SELF) {
                        Log.d("FsWatcher", "defer delete notification for " + path);
                        Thread timer = new Thread() {
                            @Override
                            public void run() {
                                try {
                                    // delay 500ms then send, enough for most syncing net disks
                                    Thread.sleep(500);
                                    FsWatcher.this.onObserverEvent(event, fullPath);
                                } catch (InterruptedException e) {
                                    e.printStackTrace();
                                }
                            }
                        };
                        timer.start();
                    } else {
                        FsWatcher.this.onObserverEvent(event, fullPath);
                    }
                }
            }
        }
    }
}
