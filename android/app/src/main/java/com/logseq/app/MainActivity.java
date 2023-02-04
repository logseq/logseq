package com.logseq.app;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends BridgeActivity {
    void setDarkModeToWebView() {
        // Android "fix" for enabling dark mode
        // Reference: https://github.com/ionic-team/capacitor/discussions/1978
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        WebSettings webSettings = this.bridge.getWebView().getSettings();
        // As of Android 10, you can simply force the dark mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (nightModeFlags == Configuration.UI_MODE_NIGHT_YES) {
                webSettings.setForceDark(WebSettings.FORCE_DARK_ON);
            } else {
                webSettings.setForceDark(WebSettings.FORCE_DARK_OFF);
            }
        }
    }

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
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        setDarkModeToWebView();
    }

    @Override
    public void onStart() {
        super.onStart();
        setDarkModeToWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        setDarkModeToWebView();
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
