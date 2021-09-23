package com.logseq.app;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;


@CapacitorPlugin(name = "FolderPicker")
public class FolderPicker extends Plugin {
    @PluginMethod()
    public void pickFolder(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addCategory(Intent.CATEGORY_DEFAULT);
        startActivityForResult(call, i, "folderPickerResult");
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
        ret.put("path", FileUtil.getPath(context, docUri));
        call.resolve(ret);
    }
}
