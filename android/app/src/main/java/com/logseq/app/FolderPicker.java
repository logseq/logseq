package com.logseq.app;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.Settings;
import android.util.Log;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.File;


@CapacitorPlugin(name = "FolderPicker")
public class FolderPicker extends Plugin {
    public static boolean FileAccessAllowed()
        {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                return true;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                return (Environment.isExternalStorageManager());
            }
            return false;
        }

    @PluginMethod()
    public void pickFolder(PluginCall call) {
        if (FileAccessAllowed()) {
            Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            i.addCategory(Intent.CATEGORY_DEFAULT);
            startActivityForResult(call, i, "folderPickerResult");
        } else {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
            Uri uri = Uri.fromParts("package", this.getContext().getPackageName(), null);
            intent.setData(uri);
            startActivityForResult(call, intent, 20);
        }
    }

    @PluginMethod()
    public void openFile(PluginCall call) {
        Uri uri = Uri.parse(call.getString("uri"));
        File file = new File(uri.getPath());

        // Get URI and MIME type of file
        String appId = getAppId();
        uri = FileProvider.getUriForFile(getActivity(), appId + ".fileprovider", file);
        String mime = getContext().getContentResolver().getType(uri);

        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, mime);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        getContext().startActivity(intent);
    }

    @ActivityCallback
    private void folderPickerResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        JSObject ret = new JSObject();
        Context context = this.getContext();
        Uri treeUri = result.getData().getData();
        Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri,
                DocumentsContract.getTreeDocumentId(treeUri));
        Log.i("Logseq/FolderPicker", "Got uri " + docUri);
        String path = FileUtil.getPath(context, docUri);
        Log.i("Logseq/FolderPicker", "Convert to path " + FileUtil.getPath(context, docUri));
        if (path == null || path.isEmpty()) {
            call.reject("Cannot support this directory type: " + docUri);
        } else {
            Uri folderUri = Uri.fromFile(new File(path));
            ret.put("path", folderUri.toString());
            call.resolve(ret);
        }
    }
}
