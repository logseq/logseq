goog.provide("goog.crypt");
goog.require("goog.asserts");
goog.require("goog.async.throwException");
goog.crypt.ASYNC_THROW_ON_UNICODE_TO_BYTE = goog.define("goog.crypt.ASYNC_THROW_ON_UNICODE_TO_BYTE", goog.DEBUG);
goog.crypt.TEST_ONLY = {};
goog.crypt.TEST_ONLY.throwException = goog.async.throwException;
goog.crypt.TEST_ONLY.alwaysThrowSynchronously = goog.DEBUG;
goog.crypt.binaryStringToByteArray = function(str) {
  return goog.crypt.stringToByteArray(str, true);
};
goog.crypt.stringToByteArray = function(str, throwSync) {
  var output = [], p = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c > 255) {
      var err = new Error("go/unicode-to-byte-error");
      if (goog.crypt.TEST_ONLY.alwaysThrowSynchronously || throwSync) {
        throw err;
      } else if (goog.crypt.ASYNC_THROW_ON_UNICODE_TO_BYTE) {
        goog.crypt.TEST_ONLY.throwException(err);
      }
      output[p++] = c & 255;
      c >>= 8;
    }
    output[p++] = c;
  }
  return output;
};
goog.crypt.byteArrayToString = function(bytes) {
  return goog.crypt.byteArrayToBinaryString(bytes);
};
goog.crypt.byteArrayToBinaryString = function(bytes) {
  var CHUNK_SIZE = 8192;
  if (bytes.length <= CHUNK_SIZE) {
    return String.fromCharCode.apply(null, bytes);
  }
  var str = "";
  for (var i = 0; i < bytes.length; i += CHUNK_SIZE) {
    var chunk = Array.prototype.slice.call(bytes, i, i + CHUNK_SIZE);
    str += String.fromCharCode.apply(null, chunk);
  }
  return str;
};
goog.crypt.byteArrayToHex = function(array, opt_separator) {
  return Array.prototype.map.call(array, function(numByte) {
    var hexByte = numByte.toString(16);
    return hexByte.length > 1 ? hexByte : "0" + hexByte;
  }).join(opt_separator || "");
};
goog.crypt.hexToByteArray = function(hexString) {
  goog.asserts.assert(hexString.length % 2 == 0, "Key string length must be multiple of 2");
  var arr = [];
  for (var i = 0; i < hexString.length; i += 2) {
    arr.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return arr;
};
goog.crypt.stringToUtf8ByteArray = function(str) {
  return goog.crypt.textToByteArray(str);
};
goog.crypt.textToByteArray = function(str) {
  var out = [], p = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = c >> 6 | 192;
      out[p++] = c & 63 | 128;
    } else if ((c & 64512) == 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) == 56320) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p++] = c >> 18 | 240;
      out[p++] = c >> 12 & 63 | 128;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    } else {
      out[p++] = c >> 12 | 224;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    }
  }
  return out;
};
goog.crypt.utf8ByteArrayToString = function(bytes) {
  return goog.crypt.byteArrayToText(bytes);
};
goog.crypt.byteArrayToText = function(bytes) {
  var out = [], pos = 0, c = 0;
  while (pos < bytes.length) {
    var c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      var c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      var c2 = bytes[pos++];
      var c3 = bytes[pos++];
      var c4 = bytes[pos++];
      var u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      var c2 = bytes[pos++];
      var c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join("");
};
goog.crypt.xorByteArray = function(bytes1, bytes2) {
  goog.asserts.assert(bytes1.length == bytes2.length, "XOR array lengths must match");
  var result = [];
  for (var i = 0; i < bytes1.length; i++) {
    result.push(bytes1[i] ^ bytes2[i]);
  }
  return result;
};

//# sourceMappingURL=goog.crypt.crypt.js.map
