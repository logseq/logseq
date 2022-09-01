package com.logseq.app;

import android.net.Uri;
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
        call.setKeepAlive(true);
        Thread runner = new Thread() {
            @Override
            public void run() {
                String[] keyPairs = RSFileSync.keygen();
                JSObject data = new JSObject();
                data.put("secretKey", keyPairs[0]);
                data.put("publicKey", keyPairs[1]);
                call.resolve(data);
            }
        };
        runner.start();
    }

    @PluginMethod()
    public void setKey(PluginCall call) {
        String secretKey = call.getString("secretKey");
        String publicKey = call.getString("publicKey");
        long code = RSFileSync.setKeys(secretKey, publicKey);
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
        call.setKeepAlive(true);

        Thread runner = new Thread() {
            @Override
            public void run() {
                List<String> filePaths = null;
                try {
                    filePaths = call.getArray("filePaths").toList();
                } catch (JSONException e) {
                    e.printStackTrace();
                    return;
                }

                for (int i = 0; i < filePaths.size(); i++) {
                    String filePath = filePaths.get(i);
                    filePaths.set(i, Uri.decode(filePath));
                }

                String[] raw;
                raw = RSFileSync.encryptFilenames(filePaths);
                if (raw != null) {
                    JSObject ret = new JSObject();
                    ret.put("value", JSArray.from(raw));
                    call.resolve(ret);
                }

            }
        };
        runner.start();
    }

    @PluginMethod()
    public void decryptFnames(PluginCall call) {
        call.setKeepAlive(true);

        Thread runner = new Thread() {
            @Override
            public void run() {
                JSArray filePaths = call.getArray("filePaths");
                String[] raw;
                try {
                    raw = RSFileSync.decryptFilenames(filePaths.toList());
                    for (int i = 0; i < raw.length; i++) {
                        raw[i] = Uri.encode(raw[i], "/");
                    }
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
        };
        runner.start();
    }

    //@PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    @PluginMethod()
    public void getLocalFilesMeta(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();


        call.setKeepAlive(true);
        Thread runner = new Thread() {
            @Override
            public void run() {
                for (int i = 0; i < filePaths.size(); i++) {
                    String filePath = filePaths.get(i);
                    filePaths.set(i, Uri.decode(filePath));
                }

                FileMeta[] metas = RSFileSync.getLocalFilesMeta(basePath, filePaths);
                if (metas == null) {
                    call.reject(RSFileSync.getLastError());
                    return;
                }
                JSObject dict = new JSObject();
                for (FileMeta meta : metas) {
                    if (meta == null) {
                        continue;
                    }
                    Log.i("FileSync", "got meta " + meta.toString());
                    JSObject item = new JSObject();
                    item.put("md5", meta.md5);
                    item.put("size", meta.size);
                    item.put("encryptedFname", meta.encryptedFilename);

                    item.put("mtime", meta.mtime); // not used for now
                    dict.put(Uri.encode(meta.filePath, "/"), item);
                }
                JSObject ret = new JSObject();
                ret.put("result", dict);
                call.resolve(ret);
            }
        };
        runner.start();
    }

    @PluginMethod()
    public void getLocalAllFilesMeta(PluginCall call) {
        call.setKeepAlive(true);

        Thread runner = new Thread() {
            @Override
            public void run() {
                String basePath = call.getString("basePath");
                FileMeta[] metas = RSFileSync.getLocalAllFilesMeta(basePath);
                if (metas == null) {
                    call.reject(RSFileSync.getLastError());
                    return;
                }
                JSObject dict = new JSObject();
                for (FileMeta meta : metas) {
                    JSObject item = new JSObject();
                    item.put("md5", meta.md5);
                    item.put("size", meta.size);
                    item.put("encryptedFname", meta.encryptedFilename);

                    item.put("mtime", meta.mtime); // not used for now
                    dict.put(Uri.encode(meta.filePath, "/"), item);
                }
                JSObject ret = new JSObject();
                ret.put("result", dict);
                call.resolve(ret);
            }
        };
        runner.start();
    }

    @PluginMethod()
    public void deleteLocalFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        for (int i = 0; i < filePaths.size(); i++) {
            filePaths.set(i, Uri.decode(filePaths.get(i)));
        }

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

        for (int i = 0; i < filePaths.size(); i++) {
            filePaths.set(i, Uri.decode(filePaths.get(i)));
        }

        call.setKeepAlive(true);
        Thread runner = new Thread() {
            @Override
            public void run() {
                long code = RSFileSync.updateLocalFiles(basePath, filePaths, graphUUID, token);
                if (code != -1) {
                    JSObject ret = new JSObject();
                    ret.put("ok", true);
                    call.resolve(ret);
                } else {
                    call.reject(RSFileSync.getLastError());
                }
            }
        };
        runner.start();
    }

    @PluginMethod()
    public void updateLocalVersionFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");

        for (int i = 0; i < filePaths.size(); i++) {
            filePaths.set(i, Uri.decode(filePaths.get(i)));
        }

        call.setKeepAlive(true);
        Thread runner = new Thread() {
            @Override
            public void run() {
                long code = RSFileSync.updateLocalVersionFiles(basePath, filePaths, graphUUID, token);
                if (code != -1) {
                    JSObject ret = new JSObject();
                    ret.put("ok", true);
                    call.resolve(ret);
                } else {
                    call.reject(RSFileSync.getLastError());
                }
            }
        };
        runner.start();
    }

    @PluginMethod()
    public void deleteRemoteFiles(PluginCall call) throws JSONException {
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");
        long txid = call.getInt("txid").longValue();

        for (int i = 0; i < filePaths.size(); i++) {
            filePaths.set(i, Uri.decode(filePaths.get(i)));
        }

        call.setKeepAlive(true);
        Thread runner = new Thread() {
            @Override
            public void run() {
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
        };
        runner.start();
    }

    @PluginMethod()
    public void updateRemoteFiles(PluginCall call) throws JSONException {
        String basePath = call.getString("basePath");
        List<String> filePaths = call.getArray("filePaths").toList();
        String graphUUID = call.getString("graphUUID");
        String token = call.getString("token");
        long txid = call.getInt("txid").longValue();
        // NOTE: fnameEncryption is ignored. since it's always on.

        for (int i = 0; i < filePaths.size(); i++) {
            filePaths.set(i, Uri.decode(filePaths.get(i)));
        }

        Thread runner = new Thread() {
            @Override
            public void run() {
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
        };
        runner.start();
    }

    @PluginMethod()
    public void ageEncryptWithPassphrase(PluginCall call) {
        call.reject("unimplemented");
    }

    @PluginMethod()
    public void ageDecryptWithPassphrase(PluginCall call) {
        call.reject("unimplemented");
    }
}
