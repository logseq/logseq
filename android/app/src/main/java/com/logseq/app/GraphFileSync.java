package com.logseq.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.logseq.file_sync.FileSync;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "GraphFileSync")
public class GraphFileSync extends Plugin {

    //@PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    @PluginMethod()
    public void watch(PluginCall call) {
        String path = call.getString("path");
        List<String> ignorePatterns = new ArrayList<>();
        android.util.Log.i("FileSync", "path = " + path);

        FileSync.ping();
        String watched = FileSync.watch(this, path, ignorePatterns);
        android.util.Log.i("FileSync", "started");
        JSObject ret = new JSObject();
        ret.put("path", watched);

        // call.setKeepAlive(true);
        call.resolve(ret);
    }

    public void notifyChange(String event, List<String> paths) {
        android.util.Log.i("FileSync", "Event:" + event + " path: " + paths);
        for (String p : paths) {
            android.util.Log.i("FileSync", "Got path:" + p);
        }
        JSObject ret = new JSObject();
        ret.put("event", event);
        ret.put("path", paths);
        notifyListeners(event, ret);
    }

    @PluginMethod()
    public void close(PluginCall call) {
        FileSync.close();
        JSObject ret = new JSObject();
        ret.put("value", "closed watcher");
        call.resolve(ret);
    }

    @PluginMethod()
    public void ping(PluginCall call) {
        String res = FileSync.ping();
        JSObject ret = new JSObject();
        ret.put("value", res);
        call.resolve(ret);
    }
}
