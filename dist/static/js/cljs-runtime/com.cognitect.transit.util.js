goog.provide("com.cognitect.transit.util");
goog.require("goog.object");
goog.scope(function() {
  var util = com.cognitect.transit.util, gobject = goog.object;
  if (typeof Object.keys != "undefined") {
    util.objectKeys = function(obj) {
      return Object.keys(obj);
    };
  } else {
    util.objectKeys = function(obj) {
      return gobject.getKeys(obj);
    };
  }
  if (typeof Array.isArray != "undefined") {
    util.isArray = function(obj) {
      return Array.isArray(obj);
    };
  } else {
    util.isArray = function(obj) {
      return goog.typeOf(obj) === "array";
    };
  }
  util.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\x3d";
  util.randInt = function(ub) {
    return Math.round(Math.random() * ub);
  };
  util.randHex = function() {
    return util.randInt(15).toString(16);
  };
  util.randomUUID = function() {
    var rhex = (8 | 3 & util.randInt(14)).toString(16), ret = util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + "-" + util.randHex() + util.randHex() + util.randHex() + util.randHex() + "-" + "4" + util.randHex() + util.randHex() + util.randHex() + "-" + rhex + util.randHex() + util.randHex() + util.randHex() + "-" + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + 
    util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex() + util.randHex();
    return ret;
  };
  util.btoa = function(input) {
    if (typeof btoa != "undefined") {
      return btoa(input);
    } else {
      var str = String(input);
      for (var block, charCode, idx = 0, map = util.chars, output = ""; str.charAt(idx | 0) || (map = "\x3d", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
        charCode = str.charCodeAt(idx += 3 / 4);
        if (charCode > 255) {
          throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        }
        block = block << 8 | charCode;
      }
      return output;
    }
  };
  util.atob = function(input) {
    if (typeof atob != "undefined") {
      return atob(input);
    } else {
      var str = String(input).replace(/=+$/, "");
      if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (var bc = 0, bs, buffer, idx = 0, output = ""; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = util.chars.indexOf(buffer);
      }
      return output;
    }
  };
  util.Uint8ToBase64 = function(u8Arr) {
    var CHUNK_SIZE = 32768, index = 0, length = u8Arr.length, result = "", slice = null;
    while (index < length) {
      slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, slice);
      index += CHUNK_SIZE;
    }
    return util.btoa(result);
  };
  util.Base64ToUint8 = function(base64) {
    var binary_string = util.atob(base64), len = binary_string.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      var ascii = binary_string.charCodeAt(i);
      bytes[i] = ascii;
    }
    return bytes;
  };
});

//# sourceMappingURL=com.cognitect.transit.util.js.map
