goog.provide("goog.userAgent.product");
goog.require("goog.labs.userAgent.browser");
goog.require("goog.labs.userAgent.platform");
goog.require("goog.userAgent");
goog.userAgent.product.ASSUME_FIREFOX = goog.define("goog.userAgent.product.ASSUME_FIREFOX", false);
goog.userAgent.product.ASSUME_IPHONE = goog.define("goog.userAgent.product.ASSUME_IPHONE", false);
goog.userAgent.product.ASSUME_IPAD = goog.define("goog.userAgent.product.ASSUME_IPAD", false);
goog.userAgent.product.ASSUME_ANDROID = goog.define("goog.userAgent.product.ASSUME_ANDROID", false);
goog.userAgent.product.ASSUME_CHROME = goog.define("goog.userAgent.product.ASSUME_CHROME", false);
goog.userAgent.product.ASSUME_SAFARI = goog.define("goog.userAgent.product.ASSUME_SAFARI", false);
goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI;
goog.userAgent.product.OPERA = goog.userAgent.OPERA;
goog.userAgent.product.IE = goog.userAgent.IE;
goog.userAgent.product.EDGE = goog.userAgent.EDGE;
goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.labs.userAgent.browser.isFirefox();
goog.userAgent.product.isIphoneOrIpod_ = function() {
  return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpod();
};
goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.isIphoneOrIpod_();
goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad();
goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.labs.userAgent.browser.isAndroidBrowser();
goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.labs.userAgent.browser.isChrome();
goog.userAgent.product.isSafariDesktop_ = function() {
  return goog.labs.userAgent.browser.isSafari() && !goog.labs.userAgent.platform.isIos();
};
goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.isSafariDesktop_();

//# sourceMappingURL=goog.useragent.product.js.map
