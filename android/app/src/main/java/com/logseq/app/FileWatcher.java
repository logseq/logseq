package com.logseq.app;

import android.os.FileObserver;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "FileWatcher")
public class FileWatcher extends Plugin {
    private FileObserver observer;

    @PluginMethod()
    public void startWatching(PluginCall call) {
        String path = call.getString("path");
        if (observer != null) {
            observer.stopWatching();
        }
        observer = new RecursiveFileObserver(path, new RecursiveFileObserver.EventListener() {
            @Override
            public void onEvent(int event, File file) {
                JSObject ret = new JSObject();
                ret.put("event", event);
                ret.put("file", file.getAbsolutePath());
                notifyListeners("fileChanged", ret);
            }
        });
        observer.startWatching();
        call.resolve(new JSObject().put("value", true));
    }

    @PluginMethod()
    public void stopWatching(PluginCall call) {
        observer.stopWatching();
        call.resolve(new JSObject().put("value", true));
    }

}
