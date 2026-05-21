package com.logseq.app;

import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Build;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.BackEventCompat;
import androidx.activity.EdgeToEdge;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.Plugin;
import android.util.Log;
import android.view.View;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import java.lang.reflect.Field;
import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends BridgeActivity {
    private static final String NAV_STACK_DEBUG_PREFIX = "[DEBUG-navstack]";
    private final NavigationCoordinator navigationCoordinator = new NavigationCoordinator();
    private BroadcastReceiver routeChangeReceiver;
    private OnBackInvokedCallback overlayBackInvokedCallback;

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
        // @capacitor/app installs its own OnBackPressedCallback during plugin load (inside
        // super.onCreate above). Its callback consumes the first system/edge back press by
        // calling webView.goBack(), which both makes the WebView flash and prevents our
        // MainActivity-level handler (below) from ever running. We route back through JS
        // instead, so disable that plugin's back handler defensively even if the config
        // entry "App.disableBackButtonHandler" hasn't been synced yet.
        disableCapacitorAppBackHandler();

        EdgeToEdge.enable(this);
        WebView webView = getBridge().getWebView();
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setLoadWithOverviewMode(true);

        applyLogseqTheme();

        // Let Compose host the WebView with system bar padding for safe areas.
        // Android back is still delegated to JS from the Activity back dispatcher.
        ComposeHost.INSTANCE.renderWithSystemInsets(this, webView);

        // On API 33+ (Android 13+), predictive back routes through the platform-level
        // OnBackInvokedDispatcher. AndroidX's OnBackPressedDispatcher bridges into it at
        // PRIORITY_DEFAULT, so plugin / Compose / WebView callbacks registered through
        // AndroidX can pre-empt ours. Register OUR callback directly on the platform
        // dispatcher at PRIORITY_OVERLAY to guarantee the first edge-back gesture is
        // delivered to handleNativeBack().
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            overlayBackInvokedCallback = () -> {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackInvoked source=window-overlay");
                handleNativeBack();
            };
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_OVERLAY,
                overlayBackInvokedCallback
            );
            Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackInvoked.registered priority=OVERLAY");
        }

        // Fallback for API < 33 and as defense in depth. Predictive-back lifecycle methods
        // log so we can see whether the system is starting/cancelling vs committing.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackStarted(BackEventCompat backEvent) {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackStarted progress=" + backEvent.getProgress() + " edge=" + backEvent.getSwipeEdge());
            }

            @Override
            public void handleOnBackProgressed(BackEventCompat backEvent) {
                // Intentionally not logging every progress tick; uncomment for tracing.
                // Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackProgressed progress=" + backEvent.getProgress());
            }

            @Override
            public void handleOnBackCancelled() {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackCancelled");
            }

            @Override
            public void handleOnBackPressed() {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.onBackPressed source=androidx-dispatcher");
                handleNativeBack();
            }
        });

        routeChangeReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!UILocal.ACTION_ROUTE_CHANGED.equals(intent.getAction())) return;
                String stack = intent.getStringExtra("stack");
                String navigationType = intent.getStringExtra("navigationType");
                String path = intent.getStringExtra("path");
                Log.d(
                    "NavStack",
                    NAV_STACK_DEBUG_PREFIX + " activity.routeChange.received stack=" + stack
                        + " type=" + navigationType
                        + " path=" + path
                        + " before=" + navigationCoordinator.debugState()
                );
                NavigationRenderState renderState = navigationCoordinator.onRouteChange(stack, navigationType, path);
                if (renderState.getApplyToCompose()) {
                    ComposeHost.applyNavigation(renderState);
                } else {
                    Log.d(
                        "NavStack",
                        NAV_STACK_DEBUG_PREFIX + " activity.routeChange.skippedCompose stack="
                            + renderState.getActiveStackId()
                            + " type=" + renderState.getNavigationType()
                            + " path=" + renderState.getPath()
                    );
                }
                Log.d(
                    "NavStack",
                    NAV_STACK_DEBUG_PREFIX + " activity.routeChange.applied after="
                        + navigationCoordinator.debugState()
                        + " renderStack=" + renderState.getActiveStackId()
                        + " renderPaths=" + renderState.getPaths()
                        + " stackSwitched=" + renderState.getStackSwitched()
                        + " applyToCompose=" + renderState.getApplyToCompose()
                );
            }
        };
        IntentFilter filter = new IntentFilter(UILocal.ACTION_ROUTE_CHANGED);
        ContextCompat.registerReceiver(this, routeChangeReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                bridge.eval("window.dispatchEvent(new Event('sendIntentReceived'))", s -> {});
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

    @Override
    public void onPause() {
        overridePendingTransition(0, R.anim.byebye);
        super.onPause();
    }

    private void handleNativeBack() {
        Log.d("onBackPressed", "Debug");
        Log.d(
            "NavStack",
            NAV_STACK_DEBUG_PREFIX + " activity.nativeBack source=system-or-edge before="
                + navigationCoordinator.debugState()
        );

        if (consumeNativeOverlayBack()) {
            Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.nativeBack consumed=native-overlay");
            return;
        }

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            NavigationRenderState nativePopState = navigationCoordinator.prepareNativePop();
            if (nativePopState == null) {
                finish();
                return;
            }
            Log.d(
                "NavStack",
                NAV_STACK_DEBUG_PREFIX + " activity.nativeBack consumed=native-stack-pop target="
                    + nativePopState.getPath()
                    + " paths=" + nativePopState.getPaths()
            );
            ComposeHost.applyNavigation(nativePopState);
            // Send "native back" into JS. JS will call your UILocal/route-change,
            // which flows into ComposeHost.applyNavigation(...) and animates.
            sendJsBack(webView);
        } else {
            // Fallback if for some reason there is no webview
            finish();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String action = intent.getAction();
        String type = intent.getType();
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            bridge.getActivity().setIntent(intent);
            bridge.eval("window.dispatchEvent(new Event('sendIntentReceived'))", s -> {});
        }
    }

    @Override
    public void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && overlayBackInvokedCallback != null) {
            try {
                getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(overlayBackInvokedCallback);
            } catch (Exception ignored) {
            }
            overlayBackInvokedCallback = null;
        }
        if (routeChangeReceiver != null) {
            unregisterReceiver(routeChangeReceiver);
            routeChangeReceiver = null;
        }
        super.onDestroy();
    }

    private void sendJsBack(WebView webView) {
        if (webView == null) return;
        Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.sendJsBack dispatching onNativePop");
        webView.post(() -> webView.evaluateJavascript(
            "window.LogseqNative && window.LogseqNative.onNativePop && window.LogseqNative.onNativePop();",
            null
        ));
    }

    private boolean consumeNativeOverlayBack() {
        try {
            if (getBridge() == null) {
                return false;
            }

            PluginHandle handle = getBridge().getPlugin("LiquidTabsPlugin");
            if (handle == null) {
                return false;
            }

            Plugin instance = handle.getInstance();
            if (!(instance instanceof LiquidTabsPlugin)) {
                return false;
            }

            return ((LiquidTabsPlugin) instance).handleNativeBackPressed();
        } catch (Exception e) {
            Log.d(
                "NavStack",
                NAV_STACK_DEBUG_PREFIX + " activity.nativeOverlayBack error="
                    + e.getClass().getSimpleName() + ":" + e.getMessage()
            );
            return false;
        }
    }

    private void disableCapacitorAppBackHandler() {
        try {
            if (getBridge() == null) {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack bridge=null skip");
                return;
            }
            PluginHandle handle = getBridge().getPlugin("App");
            if (handle == null) {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack pluginHandle=null skip");
                return;
            }
            Plugin instance = handle.getInstance();
            if (instance == null) {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack pluginInstance=null skip");
                return;
            }
            Field field = instance.getClass().getDeclaredField("onBackPressedCallback");
            field.setAccessible(true);
            Object callback = field.get(instance);
            if (callback instanceof OnBackPressedCallback) {
                ((OnBackPressedCallback) callback).setEnabled(false);
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack disabled");
            } else {
                Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack unexpectedType=" + (callback == null ? "null" : callback.getClass().getName()));
            }
        } catch (NoSuchFieldException e) {
            Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack noField=" + e.getMessage());
        } catch (Exception e) {
            Log.d("NavStack", NAV_STACK_DEBUG_PREFIX + " activity.appPluginBack error=" + e.getClass().getSimpleName() + ":" + e.getMessage());
        }
    }
}
