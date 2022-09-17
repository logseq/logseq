package com.logseq.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.ValueCallback;

import com.getcapacitor.BridgeActivity;

import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FolderPicker.class);
        registerPlugin(FsWatcher.class);
        super.onCreate(savedInstanceState);

        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                bridge.eval("window.dispatchEvent(new Event('sendIntentReceived'))", new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String s) {
                        //
                    }
                });
            }
        }, 5000);

    }

    @Override
    public void onPause() {
        overridePendingTransition(0, R.anim.byebye);
        super.onPause();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String action = intent.getAction();
        String type = intent.getType();
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            bridge.getActivity().setIntent(intent);
            bridge.eval("window.dispatchEvent(new Event('sendIntentReceived'))", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String s) {
                    //
                }
            });
        }
    }


}
