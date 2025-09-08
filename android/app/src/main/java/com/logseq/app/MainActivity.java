package com.logseq.app;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.ValueCallback;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FolderPicker.class);
        registerPlugin(UILocal.class);

        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setLoadWithOverviewMode(true);

        setNavigationBarColorBasedOnTheme();

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

    private void setNavigationBarColorBasedOnTheme() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) { // API 26及以上支持
            // 根据主题选择颜色
            int navBarColor = isDarkMode()
                    ? getResources().getColor(R.color.colorPrimaryDark, getTheme())
                    : getResources().getColor(R.color.colorPrimary, getTheme());

            // 设置导航栏颜色
            window.setNavigationBarColor(navBarColor);
        }
    }

    private boolean isDarkMode() {
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
    }
}
