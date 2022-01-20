package com.logseq.app;

import android.system.ErrnoException;
import android.system.Os;
import android.system.StructStat;
import android.util.Log;
import android.os.FileObserver;

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
        Log.i("FsWatcher", "fs-watcher loaded!");
    }

    @PluginMethod()
    public void watch(PluginCall call) {
        String pathParam = call.getString("path");
        if (pathParam.startsWith("file://")) {
            pathParam = pathParam.substring(7);
        }
        File path = new File(pathParam);
        mPath = path.getAbsolutePath();

        Log.i("FsWatcher", "watching..." + path);
        if (path == null) {
            call.reject("invalid watch path: " + path);
            return;
        }
        int mask = FileObserver.CLOSE_WRITE |
                FileObserver.MOVE_SELF | FileObserver.MOVED_FROM | FileObserver.MOVED_TO |
                FileObserver.DELETE | FileObserver.DELETE_SELF;

        if (observers != null) {
            call.reject("Already watching");
            return;
        }
        observers = new ArrayList<SingleFileObserver>();
        observers.add(new SingleFileObserver(path, mask));

        // NOTE: only watch first level of directory
        File[] files = path.listFiles();
        if (files != null) {
            for (int i = 0; i < files.length; ++i) {
                if (files[i].isDirectory() && !files[i].getName().startsWith(".")) {
                    observers.add(new SingleFileObserver(files[i], mask));
                }
            }
        }

        for (int i = 0; i < observers.size(); i++)
            observers.get(i).startWatching();
        call.resolve();
    }

    @PluginMethod()
    public void unwatch(PluginCall call) {
        Log.i("FsWatcher", "unwatching...");

        if (observers != null) {
            for (int i = 0; i < observers.size(); ++i)
                observers.get(i).stopWatching();
            observers.clear();
            observers = null;
        }

        call.resolve();
    }

    // add, change, unlink events
    public void onObserverEvent(int event, String path) {
        Log.i("FsWatcher", "got path=" + path + " event=" + event);

        JSObject obj = new JSObject();
        String content = null;
        File f = null;
        // FIXME: Current repo/path impl requires path to be a URL, dir to be a bare path.
        obj.put("path", "file://" + path);
        obj.put("dir", mPath);
        switch (event) {
            case FileObserver.CLOSE_WRITE:
                obj.put("event", "change");
                f = new File(path);
                try {
                    obj.put("stat", getFileStat(path));
                    content = getFileContents(f);
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (ErrnoException e) {
                    e.printStackTrace();
                }
                obj.put("content", content);
                break;
            case FileObserver.MOVED_TO:
            case FileObserver.CREATE:
                obj.put("event", "add");
                f = new File(path);
                try {
                    obj.put("stat", getFileStat(path));
                    content = getFileContents(f);
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (ErrnoException e) {
                    e.printStackTrace();
                }
                obj.put("content", content);
                break;
            case FileObserver.MOVE_SELF:
            case FileObserver.MOVED_FROM:
            case FileObserver.DELETE:
            case FileObserver.DELETE_SELF:
                obj.put("event", "unlink");
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
        int length = 0;

        while ((length = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, length);
        }

        inputStream.close();
        return outputStream.toString("utf-8");
    }

    public static JSObject getFileStat(final String path) throws ErrnoException {
        StructStat stat = Os.stat(path);
        JSObject obj = new JSObject();
        obj.put("atime", stat.st_atime);
        obj.put("mtime", stat.st_mtime);
        obj.put("ctime", stat.st_ctime);
        return obj;
    }

    private class SingleFileObserver extends FileObserver {
        private String mPath;

        public SingleFileObserver(String path, int mask) {
            super(path, mask);
            mPath = path;
        }

        public SingleFileObserver(File path, int mask) {
            super(path, mask);
            mPath = path.getAbsolutePath();
        }

        @Override
        public void onEvent(int event, String path) {
            if (path != null) {
                Log.i("FsWatcher", "got path=" + path + " event=" + event);
                if (Pattern.matches("[^.].*?\\.(md|org|css|edn|text|markdown|yml|yaml|json|js)$", path)) {
                    String fullPath = mPath + "/" + path;
                    FsWatcher.this.onObserverEvent(event, fullPath);
                }
            }
        }
    }
}
