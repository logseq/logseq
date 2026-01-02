package com.logseq.app;

import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.BridgeActivity;
import androidx.activity.OnBackPressedDispatcher;
import android.util.Log;
import android.view.View;

import java.util.Timer;
import java.util.TimerTask;

import ee.forgr.capacitor_navigation_bar.NavigationBarPlugin;

public class MainActivity extends BridgeActivity {
    private NavigationCoordinator navigationCoordinator = new NavigationCoordinator();
    private BroadcastReceiver routeChangeReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FolderPicker.class);
        registerPlugin(UILocal.class);
        registerPlugin(NativeTopBarPlugin.class);
        registerPlugin(NativeBottomSheetPlugin.class);
        registerPlugin(NativeEditorToolbarPlugin.class);
        registerPlugin(NativeSelectionActionBarPlugin.class);
        registerPlugin(LiquidTabsPlugin.class);
        registerPlugin(Utils.class);

        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        WebView webView = getBridge().getWebView();
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setLoadWithOverviewMode(true);

        applyLogseqTheme();

        // Let Compose host the WebView with system bar padding for safe areas and handle back.
        ComposeHost.INSTANCE.renderWithSystemInsets(this, webView, () -> {
            sendJsBack(webView);
            return null;
        }, () -> {
            finish();
            return null;
        });

        routeChangeReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!UILocal.ACTION_ROUTE_CHANGED.equals(intent.getAction())) return;
                String stack = intent.getStringExtra("stack");
                String navigationType = intent.getStringExtra("navigationType");
                String path = intent.getStringExtra("path");
                navigationCoordinator.onRouteChange(stack, navigationType, path);
            }
        };
        IntentFilter filter = new IntentFilter(UILocal.ACTION_ROUTE_CHANGED);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(routeChangeReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(routeChangeReceiver, filter);
        }

        // initNavigationBarBgColor();

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
        applyLogseqTheme();
        dispatchSystemThemeToWeb();
    }

    private void applyLogseqTheme() {
        LogseqTheme.INSTANCE.update(this);
        LogseqThemeColors colors = LogseqTheme.INSTANCE.current();

        int bg = colors.getBackground();
        boolean isDark = colors.isDark();

        View content = findViewById(android.R.id.content);
        if (content != null) {
            content.setBackgroundColor(bg);
        }

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(bg);
        }

        getWindow().getDecorView().setBackgroundColor(bg);
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);

        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!isDark);
        controller.setAppearanceLightNavigationBars(!isDark);

        WebViewSnapshotManager.INSTANCE.setSnapshotBackgroundColor(bg);
    }

    public void applyLogseqThemeNow() {
        applyLogseqTheme();
    }

    private void dispatchSystemThemeToWeb() {
        try {
            if (bridge == null) return;
            boolean isDark = LogseqTheme.INSTANCE.isDark(this);
            String js = "window.dispatchEvent(new CustomEvent('logseq:native-system-theme-changed', { detail: { isDark: "
                + (isDark ? "true" : "false")
                + " } }));";
            bridge.eval(js, null);
        } catch (Exception e) {
            // ignore
        }
    }

    public void initNavigationBarBgColor() {
        NavigationBarPlugin navigationBarPlugin = new NavigationBarPlugin();
        JSObject data = new JSObject();
        data.put("color", "transparent");

        PluginCall call = new PluginCall(null, null, null, "t", data);
        navigationBarPlugin.setNavigationBarColor(call);
    }

    @Override
    public void onPause() {
        overridePendingTransition(0, R.anim.byebye);
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        Log.d("onBackPressed", "Debug");

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Send "native back" into JS. JS will call your UILocal/route-change,
            // which flows into ComposeHost.applyNavigation(...) and animates.
            sendJsBack(webView);
        } else {
            // Fallback if for some reason there is no webview
            super.onBackPressed();
        }
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

    @Override
    public void onDestroy() {
        if (routeChangeReceiver != null) {
            unregisterReceiver(routeChangeReceiver);
            routeChangeReceiver = null;
        }
        super.onDestroy();
    }

    private void sendJsBack(WebView webView) {
        if (webView == null) return;
        webView.post(() -> webView.evaluateJavascript(
            "window.LogseqNative && window.LogseqNative.onNativePop && window.LogseqNative.onNativePop();",
            null
        ));
    }
}
