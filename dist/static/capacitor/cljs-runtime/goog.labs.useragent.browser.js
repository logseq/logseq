goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.labs.userAgent.browser");
  goog.module.declareLegacyNamespace();
  const util = goog.require("goog.labs.userAgent.util");
  const {AsyncValue, Version} = goog.require("goog.labs.userAgent.highEntropy.highEntropyValue");
  const {assert, assertExists} = goog.require("goog.asserts");
  const {compareVersions} = goog.require("goog.string.internal");
  const {fullVersionList} = goog.require("goog.labs.userAgent.highEntropy.highEntropyData");
  const {useClientHints} = goog.require("goog.labs.userAgent");
  const Brand = {ANDROID_BROWSER:"Android Browser", CHROMIUM:"Chromium", EDGE:"Microsoft Edge", FIREFOX:"Firefox", IE:"Internet Explorer", OPERA:"Opera", SAFARI:"Safari", SILK:"Silk",};
  exports.Brand = Brand;
  function useUserAgentDataBrand(ignoreClientHintsFlag = false) {
    if (util.ASSUME_CLIENT_HINTS_SUPPORT) {
      return true;
    }
    if (!ignoreClientHintsFlag && !useClientHints()) {
      return false;
    }
    const userAgentData = util.getUserAgentData();
    return !!userAgentData && userAgentData.brands.length > 0;
  }
  function hasFullVersionList() {
    return isAtLeast(Brand.CHROMIUM, 98);
  }
  function matchOpera() {
    if (useUserAgentDataBrand()) {
      return false;
    }
    return util.matchUserAgent("Opera");
  }
  function matchIE() {
    if (useUserAgentDataBrand()) {
      return false;
    }
    return util.matchUserAgent("Trident") || util.matchUserAgent("MSIE");
  }
  function matchEdgeHtml() {
    if (useUserAgentDataBrand()) {
      return false;
    }
    return util.matchUserAgent("Edge");
  }
  function matchEdgeChromium() {
    if (useUserAgentDataBrand()) {
      return util.matchUserAgentDataBrand(Brand.EDGE);
    }
    return util.matchUserAgent("Edg/");
  }
  function matchOperaChromium() {
    if (useUserAgentDataBrand()) {
      return util.matchUserAgentDataBrand(Brand.OPERA);
    }
    return util.matchUserAgent("OPR");
  }
  function matchFirefox() {
    return util.matchUserAgent("Firefox") || util.matchUserAgent("FxiOS");
  }
  function matchSafari() {
    return util.matchUserAgent("Safari") && !(matchChrome() || matchCoast() || matchOpera() || matchEdgeHtml() || matchEdgeChromium() || matchOperaChromium() || matchFirefox() || isSilk() || util.matchUserAgent("Android"));
  }
  function matchCoast() {
    if (useUserAgentDataBrand()) {
      return false;
    }
    return util.matchUserAgent("Coast");
  }
  function matchIosWebview() {
    return (util.matchUserAgent("iPad") || util.matchUserAgent("iPhone")) && !matchSafari() && !matchChrome() && !matchCoast() && !matchFirefox() && util.matchUserAgent("AppleWebKit");
  }
  function matchChrome() {
    if (useUserAgentDataBrand()) {
      return util.matchUserAgentDataBrand(Brand.CHROMIUM);
    }
    return (util.matchUserAgent("Chrome") || util.matchUserAgent("CriOS")) && !matchEdgeHtml() || isSilk();
  }
  function matchAndroidBrowser() {
    return util.matchUserAgent("Android") && !(isChrome() || isFirefox() || isOpera() || isSilk());
  }
  const isOpera = matchOpera;
  exports.isOpera = isOpera;
  const isIE = matchIE;
  exports.isIE = isIE;
  const isEdge = matchEdgeHtml;
  exports.isEdge = isEdge;
  const isEdgeChromium = matchEdgeChromium;
  exports.isEdgeChromium = isEdgeChromium;
  const isOperaChromium = matchOperaChromium;
  exports.isOperaChromium = isOperaChromium;
  const isFirefox = matchFirefox;
  exports.isFirefox = isFirefox;
  const isSafari = matchSafari;
  exports.isSafari = isSafari;
  const isCoast = matchCoast;
  exports.isCoast = isCoast;
  const isIosWebview = matchIosWebview;
  exports.isIosWebview = isIosWebview;
  const isChrome = matchChrome;
  exports.isChrome = isChrome;
  const isAndroidBrowser = matchAndroidBrowser;
  exports.isAndroidBrowser = isAndroidBrowser;
  function isSilk() {
    return util.matchUserAgent("Silk");
  }
  exports.isSilk = isSilk;
  function createVersionMap(versionTuples) {
    const versionMap = {};
    versionTuples.forEach(tuple => {
      const key = tuple[0];
      const value = tuple[1];
      versionMap[key] = value;
    });
    return keys => versionMap[keys.find(key => key in versionMap)] || "";
  }
  function getVersion() {
    const userAgentString = util.getUserAgent();
    if (isIE()) {
      return getIEVersion(userAgentString);
    }
    const versionTuples = util.extractVersionTuples(userAgentString);
    const lookUpValueWithKeys = createVersionMap(versionTuples);
    if (isOpera()) {
      return lookUpValueWithKeys(["Version", "Opera"]);
    }
    if (isEdge()) {
      return lookUpValueWithKeys(["Edge"]);
    }
    if (isEdgeChromium()) {
      return lookUpValueWithKeys(["Edg"]);
    }
    if (isSilk()) {
      return lookUpValueWithKeys(["Silk"]);
    }
    if (isChrome()) {
      return lookUpValueWithKeys(["Chrome", "CriOS", "HeadlessChrome"]);
    }
    const tuple = versionTuples[2];
    return tuple && tuple[1] || "";
  }
  exports.getVersion = getVersion;
  function isVersionOrHigher(version) {
    return compareVersions(getVersion(), version) >= 0;
  }
  exports.isVersionOrHigher = isVersionOrHigher;
  function getIEVersion(userAgent) {
    const rv = /rv: *([\d\.]*)/.exec(userAgent);
    if (rv && rv[1]) {
      return rv[1];
    }
    let version = "";
    const msie = /MSIE +([\d\.]+)/.exec(userAgent);
    if (msie && msie[1]) {
      const tridentVersion = /Trident\/(\d.\d)/.exec(userAgent);
      if (msie[1] == "7.0") {
        if (tridentVersion && tridentVersion[1]) {
          switch(tridentVersion[1]) {
            case "4.0":
              version = "8.0";
              break;
            case "5.0":
              version = "9.0";
              break;
            case "6.0":
              version = "10.0";
              break;
            case "7.0":
              version = "11.0";
              break;
          }
        } else {
          version = "7.0";
        }
      } else {
        version = msie[1];
      }
    }
    return version;
  }
  function getFullVersionFromUserAgentString(browser) {
    const userAgentString = util.getUserAgent();
    if (browser === Brand.IE) {
      return isIE() ? getIEVersion(userAgentString) : "";
    }
    const versionTuples = util.extractVersionTuples(userAgentString);
    const lookUpValueWithKeys = createVersionMap(versionTuples);
    switch(browser) {
      case Brand.OPERA:
        if (isOpera()) {
          return lookUpValueWithKeys(["Version", "Opera"]);
        } else if (isOperaChromium()) {
          return lookUpValueWithKeys(["OPR"]);
        }
        break;
      case Brand.EDGE:
        if (isEdge()) {
          return lookUpValueWithKeys(["Edge"]);
        } else if (isEdgeChromium()) {
          return lookUpValueWithKeys(["Edg"]);
        }
        break;
      case Brand.CHROMIUM:
        if (isChrome()) {
          return lookUpValueWithKeys(["Chrome", "CriOS", "HeadlessChrome"]);
        }
        break;
    }
    if (browser === Brand.FIREFOX && isFirefox() || browser === Brand.SAFARI && isSafari() || browser === Brand.ANDROID_BROWSER && isAndroidBrowser() || browser === Brand.SILK && isSilk()) {
      const tuple = versionTuples[2];
      return tuple && tuple[1] || "";
    }
    return "";
  }
  function versionOf_(browser) {
    let versionParts;
    if (useUserAgentDataBrand() && browser !== Brand.SILK) {
      const data = util.getUserAgentData();
      const matchingBrand = data.brands.find(({brand}) => brand === browser);
      if (!matchingBrand || !matchingBrand.version) {
        return NaN;
      }
      versionParts = matchingBrand.version.split(".");
    } else {
      const fullVersion = getFullVersionFromUserAgentString(browser);
      if (fullVersion === "") {
        return NaN;
      }
      versionParts = fullVersion.split(".");
    }
    if (versionParts.length === 0) {
      return NaN;
    }
    const majorVersion = versionParts[0];
    return Number(majorVersion);
  }
  function isAtLeast(brand, majorVersion) {
    assert(Math.floor(majorVersion) === majorVersion, "Major version must be an integer");
    return versionOf_(brand) >= majorVersion;
  }
  exports.isAtLeast = isAtLeast;
  function isAtMost(brand, majorVersion) {
    assert(Math.floor(majorVersion) === majorVersion, "Major version must be an integer");
    return versionOf_(brand) <= majorVersion;
  }
  exports.isAtMost = isAtMost;
  class HighEntropyBrandVersion {
    constructor(brand, useUach, fallbackVersion) {
      this.brand_ = brand;
      this.version_ = new Version(fallbackVersion);
      this.useUach_ = useUach;
    }
    getIfLoaded() {
      if (this.useUach_) {
        const loadedVersionList = fullVersionList.getIfLoaded();
        if (loadedVersionList !== undefined) {
          const matchingBrand = loadedVersionList.find(({brand}) => this.brand_ === brand);
          assertExists(matchingBrand);
          return new Version(matchingBrand.version);
        }
      }
      if (preUachHasLoaded) {
        return this.version_;
      }
      return;
    }
    async load() {
      if (this.useUach_) {
        const loadedVersionList = await fullVersionList.load();
        if (loadedVersionList !== undefined) {
          const matchingBrand = loadedVersionList.find(({brand}) => this.brand_ === brand);
          assertExists(matchingBrand);
          return new Version(matchingBrand.version);
        }
      } else {
        await 0;
      }
      preUachHasLoaded = true;
      return this.version_;
    }
  }
  let preUachHasLoaded = false;
  async function loadFullVersions() {
    if (useUserAgentDataBrand(true)) {
      await fullVersionList.load();
    }
    preUachHasLoaded = true;
  }
  exports.loadFullVersions = loadFullVersions;
  exports.resetForTesting = () => {
    preUachHasLoaded = false;
    fullVersionList.resetForTesting();
  };
  function fullVersionOf(browser) {
    let fallbackVersionString = "";
    if (!hasFullVersionList()) {
      fallbackVersionString = getFullVersionFromUserAgentString(browser);
    }
    const useUach = browser !== Brand.SILK && useUserAgentDataBrand(true);
    if (useUach) {
      const data = util.getUserAgentData();
      if (!data.brands.find(({brand}) => brand === browser)) {
        return undefined;
      }
    } else if (fallbackVersionString === "") {
      return undefined;
    }
    return new HighEntropyBrandVersion(browser, useUach, fallbackVersionString);
  }
  exports.fullVersionOf = fullVersionOf;
  function getVersionStringForLogging(browser) {
    if (useUserAgentDataBrand(true)) {
      const fullVersionObj = fullVersionOf(browser);
      if (fullVersionObj) {
        const fullVersion = fullVersionObj.getIfLoaded();
        if (fullVersion) {
          return fullVersion.toVersionStringForLogging();
        }
        const data = util.getUserAgentData();
        const matchingBrand = data.brands.find(({brand}) => brand === browser);
        assertExists(matchingBrand);
        return matchingBrand.version;
      }
      return "";
    } else {
      return getFullVersionFromUserAgentString(browser);
    }
  }
  exports.getVersionStringForLogging = getVersionStringForLogging;
  return exports;
});

//# sourceMappingURL=goog.labs.useragent.browser.js.map
