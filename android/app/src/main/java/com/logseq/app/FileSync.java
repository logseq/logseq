package com.logseq.app;

import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.logseq.sync.FileMeta;
import com.logseq.sync.RSFileSync;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@CapacitorPlugin(name = "FileSync")
public class FileSync extends Plugin {

    @Override
    public void load() {
        super.load();

        Log.i("FileSync", "Android plugin loaded");
    }

    @PluginMethod()
    public void keygen(PluginCall call) {
        String[] keyPairs = RSFileSync.keygen();
        JSObject data = new JSObject();

        data.put("secretKey", keyPairs[0]);
        data.put("publicKey", keyPairs[1]);
        call.resolve(data);
    }

    @PluginMethod()
    public void setKey(PluginCall call) {
        String secretKey = call.getString("secretKey");
        String publicKey = call.getString("publicKey");
        long code =  RSFileSync.setKeys(secretKey, publicKey);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } else {
            call.reject("invalid setKey call");
        }
    }

    @PluginMethod()
    public void setEnv(PluginCall call) {
        String env = call.getString("env");
        if (env == null) {
            call.reject("required parameter: env");
            return;
        }
        this.setKey(call);
        long code = RSFileSync.setEnvironment(env);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } else {
            call.reject("invalid setEnv call");
        }
    }

    @PluginMethod()
    public void encryptFnames(PluginCall call) {
        JSArray filePaths = call.getArray("filePaths");
        String[] raw;
        try {
            raw = RSFileSync.encryptFilenames(filePaths.toList());
            if (raw != null) {
                JSObject ret = new JSObject();
                ret.put("value", JSArray.from(raw));
                call.resolve(ret);
            }
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject("cannot encrypt fnames: " + e.toString());
        }
    }

    @PluginMethod()
    public void decryptFnames(PluginCall call) {
        JSArray filePaths = call.getArray("filePaths");
        String[] raw;
        try {
            raw = RSFileSync.decryptFilenames(filePaths.toList());
            if (raw != null) {
                JSObject ret = new JSObject();
                ret.put("value", JSArray.from(raw));
                call.resolve(ret);
            }
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject("cannot decrypt fnames: " + e.toString());
        }
    }


    //@PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    @PluginMethod()
    public void getLocalFilesMeta(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        for (String filePath : filePaths) {
            Log.i("FileSync", "Got file Meta " + filePath);
        }

        FileMeta[] metas = RSFileSync.getLocalFilesMeta(basePath, filePaths);
        if (metas == null) {
            call.reject(RSFileSync.getLastError());
            return ;
        }
        JSObject dict = new JSObject();
        for (FileMeta meta : metas) {
            Log.i("FileSync", "got meta " + meta.toString());
            JSObject item = new JSObject();
            item.put("md5", meta.md5);
            item.put("size", meta.size);
            item.put("encryptedFname", meta.encryptedFilename);

            item.put("mtime", meta.mtime); // not used for now
            dict.put(meta.filePath, item);
        }
        JSObject ret = new JSObject();
        ret.put("result", dict);
        call.resolve(ret);
    }

    @PluginMethod()
    public void getLocalAllFilesMeta(PluginCall call) {
        String basePath = call.getString("basePath");
        FileMeta[] metas = RSFileSync.getLocalAllFilesMeta(basePath);
        if (metas == null) {
            call.reject(RSFileSync.getLastError());
            return ;
        }
        JSObject dict = new JSObject();
        for (FileMeta meta : metas) {
            JSObject item = new JSObject();
            item.put("md5", meta.md5);
            item.put("size", meta.size);
            item.put("encryptedFname", meta.encryptedFilename);

            item.put("mtime", meta.mtime); // not used for now
            dict.put(meta.filePath, item);
        }
        JSObject ret = new JSObject();
        ret.put("result", dict);;
        call.resolve(ret);
    }

    @PluginMethod()
    public void deleteLocalFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();

        RSFileSync.deleteLocalFiles(basePath, filePaths);

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void updateLocalFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");

        long code = RSFileSync.updateLocalFiles(basePath, filePaths, graphUUID, token);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } else {
            call.reject(RSFileSync.getLastError());
        }
    }

    @PluginMethod()
    public void updateLocalVersionFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");

        long code = RSFileSync.updateLocalVersionFiles(basePath, filePaths, graphUUID, token);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } else {
            call.reject(RSFileSync.getLastError());
        }
    }

    @PluginMethod()
    public void deleteRemoteFiles(PluginCall call) throws JSONException {
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");
        long txid = call.getInt("txid").longValue();

        long code = RSFileSync.deleteRemoteFiles(filePaths, graphUUID, token, txid);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("txid", code);
            call.resolve(ret);
        } else {
            call.reject(RSFileSync.getLastError());
        }
    }

    @PluginMethod()
    public void updateRemoteFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");
        long txid = call.getInt("txid").longValue();
        // NOTE: fnameEncryption is ignored. since it's always on.

        long code = RSFileSync.updateRemoteFiles(basePath, filePaths, graphUUID, token, txid);
        if (code != -1) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("txid", code);
            call.resolve(ret);
        } else {
            call.reject(RSFileSync.getLastError());
        }
    }
}
