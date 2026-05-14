goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.labs.userAgent.platform");
  goog.module.declareLegacyNamespace();
  const googString = goog.require("goog.string.internal");
  const util = goog.require("goog.labs.userAgent.util");
  const {AsyncValue, Version} = goog.require("goog.labs.userAgent.highEntropy.highEntropyValue");
  const {platformVersion} = goog.require("goog.labs.userAgent.highEntropy.highEntropyData");
  const {useClientHints} = goog.require("goog.labs.userAgent");
  function useUserAgentDataPlatform(ignoreClientHintsFlag = false) {
    if (util.ASSUME_CLIENT_HINTS_SUPPORT) {
      return true;
    }
    if (!ignoreClientHintsFlag && !useClientHints()) {
      return false;
    }
    const userAgentData = util.getUserAgentData();
    return !!userAgentData && !!userAgentData.platform;
  }
  function isAndroid() {
    if (useUserAgentDataPlatform()) {
      return util.getUserAgentData().platform === "Android";
    }
    return util.matchUserAgent("Android");
  }
  function isIpod() {
    return util.matchUserAgent("iPod");
  }
  function isIphone() {
    return util.matchUserAgent("iPhone") && !util.matchUserAgent("iPod") && !util.matchUserAgent("iPad");
  }
  function isIpad() {
    return util.matchUserAgent("iPad");
  }
  function isIos() {
    return isIphone() || isIpad() || isIpod();
  }
  function isMacintosh() {
    if (useUserAgentDataPlatform()) {
      return util.getUserAgentData().platform === "macOS";
    }
    return util.matchUserAgent("Macintosh");
  }
  function isLinux() {
    if (useUserAgentDataPlatform()) {
      return util.getUserAgentData().platform === "Linux";
    }
    return util.matchUserAgent("Linux");
  }
  function isWindows() {
    if (useUserAgentDataPlatform()) {
      return util.getUserAgentData().platform === "Windows";
    }
    return util.matchUserAgent("Windows");
  }
  function isChromeOS() {
    if (useUserAgentDataPlatform()) {
      return util.getUserAgentData().platform === "Chrome OS";
    }
    return util.matchUserAgent("CrOS");
  }
  function isChromecast() {
    return util.matchUserAgent("CrKey");
  }
  function isKaiOS() {
    return util.matchUserAgentIgnoreCase("KaiOS");
  }
  function getVersion() {
    const userAgentString = util.getUserAgent();
    let version = "", re;
    if (isWindows()) {
      re = /Windows (?:NT|Phone) ([0-9.]+)/;
      const match = re.exec(userAgentString);
      if (match) {
        version = match[1];
      } else {
        version = "0.0";
      }
    } else if (isIos()) {
      re = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/;
      const match = re.exec(userAgentString);
      version = match && match[1].replace(/_/g, ".");
    } else if (isMacintosh()) {
      re = /Mac OS X ([0-9_.]+)/;
      const match = re.exec(userAgentString);
      version = match ? match[1].replace(/_/g, ".") : "10";
    } else if (isKaiOS()) {
      re = /(?:KaiOS)\/(\S+)/i;
      const match = re.exec(userAgentString);
      version = match && match[1];
    } else if (isAndroid()) {
      re = /Android\s+([^\);]+)(\)|;)/;
      const match = re.exec(userAgentString);
      version = match && match[1];
    } else if (isChromeOS()) {
      re = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/;
      const match = re.exec(userAgentString);
      version = match && match[1];
    }
    return version || "";
  }
  function isVersionOrHigher(version) {
    return googString.compareVersions(getVersion(), version) >= 0;
  }
  class PlatformVersion {
    constructor() {
      this.preUachHasLoaded_ = false;
    }
    getIfLoaded() {
      if (useUserAgentDataPlatform(true)) {
        const loadedPlatformVersion = platformVersion.getIfLoaded();
        if (loadedPlatformVersion === undefined) {
          return undefined;
        }
        return new Version(loadedPlatformVersion);
      } else if (!this.preUachHasLoaded_) {
        return undefined;
      } else {
        return new Version(getVersion());
      }
    }
    async load() {
      if (useUserAgentDataPlatform(true)) {
        return new Version(await platformVersion.load());
      } else {
        this.preUachHasLoaded_ = true;
        return new Version(getVersion());
      }
    }
    resetForTesting() {
      platformVersion.resetForTesting();
      this.preUachHasLoaded_ = false;
    }
  }
  const version = new PlatformVersion();
  exports = {getVersion, isAndroid, isChromeOS, isChromecast, isIos, isIpad, isIphone, isIpod, isKaiOS, isLinux, isMacintosh, isVersionOrHigher, isWindows, version,};
  return exports;
});

//# sourceMappingURL=goog.labs.useragent.platform.js.map
