package com.logseq.app;

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
    private Uri mPathUri;

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
        if (u.getScheme() == null || u.getScheme().equals("file")) {
            File pathObj = new File(u.getPath());
            if (pathObj == null) {
                call.reject("invalid watch path: " + pathParam);
                return;
            }
            mPathUri = Uri.fromFile(pathObj);
            mPath = pathObj.getAbsolutePath();

            int mask = FileObserver.CLOSE_WRITE |
                    FileObserver.MOVE_SELF | FileObserver.MOVED_FROM | FileObserver.MOVED_TO |
                    FileObserver.DELETE | FileObserver.DELETE_SELF;

            if (observers != null) {
                call.reject("already watching");
                return;
            }
            observers = new ArrayList<SingleFileObserver>();
            observers.add(new SingleFileObserver(pathObj, mask));

            // NOTE: only watch first level of directory
            File[] files = pathObj.listFiles();
            if (files != null) {
                for (int i = 0; i < files.length; ++i) {
                    if (files[i].isDirectory() && !files[i].getName().startsWith(".")) {
                        observers.add(new SingleFileObserver(files[i], mask));
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
        Log.i("FsWatcher", "unwatching...");

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
            for (int i = 0; i < files.length; ++i) {
                if (files[i].isDirectory() && !files[i].getName().startsWith(".") && !files[i].getName().equals("bak")) {
                    this.initialNotify(files[i], maxDepth - 1);
                } else if (files[i].isFile()
                        && Pattern.matches("[^.].*?\\.(md|org|css|edn|text|markdown|yml|yaml|json|js)$",
                                files[i].getName())) {
                    this.onObserverEvent(FileObserver.CREATE, files[i].getAbsolutePath());
                }
            }
        }
    }

    // add, change, unlink events
    public void onObserverEvent(int event, String path) {
        JSObject obj = new JSObject();
        String content = null;
        // FIXME: Current repo/path impl requires path to be a URL, dir to be a bare
        // path.
        File f = new File(path);
        obj.put("path", Uri.fromFile(f));
        obj.put("dir", mPath);
        Log.i("FsWatcher", "prepare event " + obj);

        switch (event) {
            case FileObserver.CLOSE_WRITE:
                obj.put("event", "change");
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
                Log.d("FsWatcher", "got path=" + path + " event=" + event);
                if (Pattern.matches("[^.].*?\\.(md|org|css|edn|text|markdown|yml|yaml|json|js)$", path)) {
                    String fullPath = mPath + "/" + path;
                    FsWatcher.this.onObserverEvent(event, fullPath);
                }
            }
        }
    }
}
