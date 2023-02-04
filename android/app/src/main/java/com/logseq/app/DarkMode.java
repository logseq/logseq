package com.logseq.app;

import android.content.res.Configuration;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DarkMode")
public class DarkMode extends Plugin {
    private boolean currentDarkModeStatus = false;

    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        onDarkModeChange();
    }

    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        onDarkModeChange();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        onDarkModeChange();
    }

    void onDarkModeChange() {
        getDarkMode();
        JSObject event = new JSObject();
        event.put("darkmode", currentDarkModeStatus);
        notifyListeners("darkmodechanged", event);
    }

    @PluginMethod()
    public void requestDarkMode(PluginCall call) {
        onDarkModeChange();
    }

    void getDarkMode() {
        var context = getContext();
        var darkModeFlag = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        if (darkModeFlag == Configuration.UI_MODE_NIGHT_YES) {
            currentDarkModeStatus = true;
        } else if (darkModeFlag == Configuration.UI_MODE_NIGHT_NO) {
            currentDarkModeStatus = false;
        }
    }
}
