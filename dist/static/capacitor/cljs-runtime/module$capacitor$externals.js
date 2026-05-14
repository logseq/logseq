var module$node_modules$$capacitor$keyboard$dist$plugin_cjs = shadow.js.require("module$node_modules$$capacitor$keyboard$dist$plugin_cjs", {});
var module$node_modules$$capacitor$core$dist$index_cjs = shadow.js.require("module$node_modules$$capacitor$core$dist$index_cjs", {});
var module$node_modules$$capacitor$status_bar$dist$plugin_cjs = shadow.js.require("module$node_modules$$capacitor$status_bar$dist$plugin_cjs", {});
var module$node_modules$$capacitor$app$dist$plugin_cjs = shadow.js.require("module$node_modules$$capacitor$app$dist$plugin_cjs", {});
function initGlobalListeners$$module$capacitor$externals(opts = {}) {
  console.debug("[externals] init global listeners");
  const didShowHandle = event => {
    const docHeight = document.documentElement.clientHeight;
    const {keyboardHeight} = event;
    const {onKeyboardShow} = opts;
    if (onKeyboardShow) {
      onKeyboardShow(event);
    }
    if (keyboardHeight !== 0) {
      document.body.style.height = docHeight - keyboardHeight + "px";
    }
  };
  const didHideHandle = () => {
    const {onKeyboardHide} = opts;
    if (onKeyboardHide) {
      onKeyboardHide();
    }
    document.body.style.removeProperty("height");
  };
  module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard.addListener("keyboardWillShow", didShowHandle);
  module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard.addListener("keyboardWillHide", didHideHandle);
  return () => {
    module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard.removeAllListeners();
  };
}
var initialSettled$$module$capacitor$externals = false;
var settleStatusBar$$module$capacitor$externals = async() => {
  if (module$node_modules$$capacitor$core$dist$index_cjs.Capacitor.getPlatform() === "android") {
    try {
      await module$node_modules$$capacitor$core$dist$index_cjs.Capacitor.Plugins.App.getInfo();
      await new Promise(r => setTimeout(r, initialSettled$$module$capacitor$externals ? 300 : 500));
      if (!initialSettled$$module$capacitor$externals) {
        initialSettled$$module$capacitor$externals = true;
      }
      await module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setStyle({style:module$node_modules$$capacitor$status_bar$dist$plugin_cjs.Style.Light});
      await module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setBackgroundColor({color:"#ffffff"});
      await module$node_modules$$capacitor$status_bar$dist$plugin_cjs.StatusBar.setOverlaysWebView({overlay:true});
    } catch (e) {
      console.error("[initStatusBar]", e);
    }
  }
};
window.externalsjs = {Keyboard:module$node_modules$$capacitor$keyboard$dist$plugin_cjs.Keyboard, Capacitor:module$node_modules$$capacitor$core$dist$index_cjs.Capacitor, initGlobalListeners:initGlobalListeners$$module$capacitor$externals, settleStatusBar:settleStatusBar$$module$capacitor$externals};
/** @const */ 
var module$capacitor$externals = {};

$CLJS.module$capacitor$externals=module$capacitor$externals;
//# sourceMappingURL=module$capacitor$externals.js.map
