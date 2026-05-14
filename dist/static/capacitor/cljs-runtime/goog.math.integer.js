goog.provide("goog.math.Integer");
goog.require("goog.reflect");
goog.math.Integer = function(bits, sign) {
  this.sign_ = sign;
  var localBits = [];
  var top = true;
  for (var i = bits.length - 1; i >= 0; i--) {
    var val = bits[i] | 0;
    if (!top || val != sign) {
      localBits[i] = val;
      top = false;
    }
  }
  this.bits_ = localBits;
};
goog.math.Integer.IntCache_ = {};
goog.math.Integer.fromInt = function(value) {
  if (-128 <= value && value < 128) {
    return goog.reflect.cache(goog.math.Integer.IntCache_, value, function(val) {
      return new goog.math.Integer([val | 0], val < 0 ? -1 : 0);
    });
  }
  return new goog.math.Integer([value | 0], value < 0 ? -1 : 0);
};
goog.math.Integer.fromNumber = function(value) {
  if (isNaN(value) || !isFinite(value)) {
    return goog.math.Integer.ZERO;
  } else if (value < 0) {
    return goog.math.Integer.fromNumber(-value).negate();
  } else {
    var bits = [];
    var pow = 1;
    for (var i = 0; value >= pow; i++) {
      bits[i] = value / pow | 0;
      pow *= goog.math.Integer.TWO_PWR_32_DBL_;
    }
    return new goog.math.Integer(bits, 0);
  }
};
goog.math.Integer.fromBits = function(bits) {
  var high = bits[bits.length - 1];
  return new goog.math.Integer(bits, high & 1 << 31 ? -1 : 0);
};
goog.math.Integer.fromString = function(str, opt_radix) {
  if (str.length == 0) {
    throw new Error("number format error: empty string");
  }
  var radix = opt_radix || 10;
  if (radix < 2 || 36 < radix) {
    throw new Error("radix out of range: " + radix);
  }
  if (str.charAt(0) == "-") {
    return goog.math.Integer.fromString(str.substring(1), radix).negate();
  } else if (str.indexOf("-") >= 0) {
    throw new Error('number format error: interior "-" character');
  }
  var radixToPower = goog.math.Integer.fromNumber(Math.pow(radix, 8));
  var result = goog.math.Integer.ZERO;
  for (var i = 0; i < str.length; i += 8) {
    var size = Math.min(8, str.length - i);
    var value = parseInt(str.substring(i, i + size), radix);
    if (size < 8) {
      var power = goog.math.Integer.fromNumber(Math.pow(radix, size));
      result = result.multiply(power).add(goog.math.Integer.fromNumber(value));
    } else {
      result = result.multiply(radixToPower);
      result = result.add(goog.math.Integer.fromNumber(value));
    }
  }
  return result;
};
goog.math.Integer.TWO_PWR_32_DBL_ = (1 << 16) * (1 << 16);
goog.math.Integer.ZERO = goog.math.Integer.fromInt(0);
goog.math.Integer.ONE = goog.math.Integer.fromInt(1);
goog.math.Integer.TWO_PWR_24_ = goog.math.Integer.fromInt(1 << 24);
goog.math.Integer.prototype.toInt = function() {
  return this.bits_.length > 0 ? this.bits_[0] : this.sign_;
};
goog.math.Integer.prototype.toNumber = function() {
  if (this.isNegative()) {
    return -this.negate().toNumber();
  } else {
    var val = 0;
    var pow = 1;
    for (var i = 0; i < this.bits_.length; i++) {
      val += this.getBitsUnsigned(i) * pow;
      pow *= goog.math.Integer.TWO_PWR_32_DBL_;
    }
    return val;
  }
};
goog.math.Integer.prototype.toString = function(opt_radix) {
  var radix = opt_radix || 10;
  if (radix < 2 || 36 < radix) {
    throw new Error("radix out of range: " + radix);
  }
  if (this.isZero()) {
    return "0";
  } else if (this.isNegative()) {
    return "-" + this.negate().toString(radix);
  }
  var radixToPower = goog.math.Integer.fromNumber(Math.pow(radix, 6));
  var rem = this;
  var result = "";
  while (true) {
    var remDiv = rem.divide(radixToPower);
    var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0;
    var digits = intval.toString(radix);
    rem = remDiv;
    if (rem.isZero()) {
      return digits + result;
    } else {
      while (digits.length < 6) {
        digits = "0" + digits;
      }
      result = "" + digits + result;
    }
  }
};
goog.math.Integer.prototype.getBits = function(index) {
  if (index < 0) {
    return 0;
  } else if (index < this.bits_.length) {
    return this.bits_[index];
  } else {
    return this.sign_;
  }
};
goog.math.Integer.prototype.getBitsUnsigned = function(index) {
  var val = this.getBits(index);
  return val >= 0 ? val : goog.math.Integer.TWO_PWR_32_DBL_ + val;
};
goog.math.Integer.prototype.getSign = function() {
  return this.sign_;
};
goog.math.Integer.prototype.isZero = function() {
  if (this.sign_ != 0) {
    return false;
  }
  for (var i = 0; i < this.bits_.length; i++) {
    if (this.bits_[i] != 0) {
      return false;
    }
  }
  return true;
};
goog.math.Integer.prototype.isNegative = function() {
  return this.sign_ == -1;
};
goog.math.Integer.prototype.isOdd = function() {
  return this.bits_.length == 0 && this.sign_ == -1 || this.bits_.length > 0 && (this.bits_[0] & 1) != 0;
};
goog.math.Integer.prototype.equals = function(other) {
  if (this.sign_ != other.sign_) {
    return false;
  }
  var len = Math.max(this.bits_.length, other.bits_.length);
  for (var i = 0; i < len; i++) {
    if (this.getBits(i) != other.getBits(i)) {
      return false;
    }
  }
  return true;
};
goog.math.Integer.prototype.notEquals = function(other) {
  return !this.equals(other);
};
goog.math.Integer.prototype.greaterThan = function(other) {
  return this.compare(other) > 0;
};
goog.math.Integer.prototype.greaterThanOrEqual = function(other) {
  return this.compare(other) >= 0;
};
goog.math.Integer.prototype.lessThan = function(other) {
  return this.compare(other) < 0;
};
goog.math.Integer.prototype.lessThanOrEqual = function(other) {
  return this.compare(other) <= 0;
};
goog.math.Integer.prototype.compare = function(other) {
  var diff = this.subtract(other);
  if (diff.isNegative()) {
    return -1;
  } else if (diff.isZero()) {
    return 0;
  } else {
    return +1;
  }
};
goog.math.Integer.prototype.shorten = function(numBits) {
  var arr_index = numBits - 1 >> 5;
  var bit_index = (numBits - 1) % 32;
  var bits = [];
  for (var i = 0; i < arr_index; i++) {
    bits[i] = this.getBits(i);
  }
  var sigBits = bit_index == 31 ? 4294967295 : (1 << bit_index + 1) - 1;
  var val = this.getBits(arr_index) & sigBits;
  if (val & 1 << bit_index) {
    val |= 4294967295 - sigBits;
    bits[arr_index] = val;
    return new goog.math.Integer(bits, -1);
  } else {
    bits[arr_index] = val;
    return new goog.math.Integer(bits, 0);
  }
};
goog.math.Integer.prototype.negate = function() {
  return this.not().add(goog.math.Integer.ONE);
};
goog.math.Integer.prototype.abs = function() {
  return this.isNegative() ? this.negate() : this;
};
goog.math.Integer.prototype.add = function(other) {
  var len = Math.max(this.bits_.length, other.bits_.length);
  var arr = [];
  var carry = 0;
  for (var i = 0; i <= len; i++) {
    var a1 = this.getBits(i) >>> 16;
    var a0 = this.getBits(i) & 65535;
    var b1 = other.getBits(i) >>> 16;
    var b0 = other.getBits(i) & 65535;
    var c0 = carry + a0 + b0;
    var c1 = (c0 >>> 16) + a1 + b1;
    carry = c1 >>> 16;
    c0 &= 65535;
    c1 &= 65535;
    arr[i] = c1 << 16 | c0;
  }
  return goog.math.Integer.fromBits(arr);
};
goog.math.Integer.prototype.subtract = function(other) {
  return this.add(other.negate());
};
goog.math.Integer.prototype.multiply = function(other) {
  if (this.isZero()) {
    return goog.math.Integer.ZERO;
  } else if (other.isZero()) {
    return goog.math.Integer.ZERO;
  }
  if (this.isNegative()) {
    if (other.isNegative()) {
      return this.negate().multiply(other.negate());
    } else {
      return this.negate().multiply(other).negate();
    }
  } else if (other.isNegative()) {
    return this.multiply(other.negate()).negate();
  }
  if (this.lessThan(goog.math.Integer.TWO_PWR_24_) && other.lessThan(goog.math.Integer.TWO_PWR_24_)) {
    return goog.math.Integer.fromNumber(this.toNumber() * other.toNumber());
  }
  var len = this.bits_.length + other.bits_.length;
  var arr = [];
  for (var i = 0; i < 2 * len; i++) {
    arr[i] = 0;
  }
  for (var i = 0; i < this.bits_.length; i++) {
    for (var j = 0; j < other.bits_.length; j++) {
      var a1 = this.getBits(i) >>> 16;
      var a0 = this.getBits(i) & 65535;
      var b1 = other.getBits(j) >>> 16;
      var b0 = other.getBits(j) & 65535;
      arr[2 * i + 2 * j] += a0 * b0;
      goog.math.Integer.carry16_(arr, 2 * i + 2 * j);
      arr[2 * i + 2 * j + 1] += a1 * b0;
      goog.math.Integer.carry16_(arr, 2 * i + 2 * j + 1);
      arr[2 * i + 2 * j + 1] += a0 * b1;
      goog.math.Integer.carry16_(arr, 2 * i + 2 * j + 1);
      arr[2 * i + 2 * j + 2] += a1 * b1;
      goog.math.Integer.carry16_(arr, 2 * i + 2 * j + 2);
    }
  }
  for (var i = 0; i < len; i++) {
    arr[i] = arr[2 * i + 1] << 16 | arr[2 * i];
  }
  for (var i = len; i < 2 * len; i++) {
    arr[i] = 0;
  }
  return new goog.math.Integer(arr, 0);
};
goog.math.Integer.carry16_ = function(bits, index) {
  while ((bits[index] & 65535) != bits[index]) {
    bits[index + 1] += bits[index] >>> 16;
    bits[index] &= 65535;
    index++;
  }
};
goog.math.Integer.prototype.slowDivide_ = function(other) {
  if (this.isNegative() || other.isNegative()) {
    throw new Error("slowDivide_ only works with positive integers.");
  }
  var twoPower = goog.math.Integer.ONE;
  var multiple = other;
  while (multiple.lessThanOrEqual(this)) {
    twoPower = twoPower.shiftLeft(1);
    multiple = multiple.shiftLeft(1);
  }
  var res = twoPower.shiftRight(1);
  var total = multiple.shiftRight(1);
  var total2;
  multiple = multiple.shiftRight(2);
  twoPower = twoPower.shiftRight(2);
  while (!multiple.isZero()) {
    total2 = total.add(multiple);
    if (total2.lessThanOrEqual(this)) {
      res = res.add(twoPower);
      total = total2;
    }
    multiple = multiple.shiftRight(1);
    twoPower = twoPower.shiftRight(1);
  }
  var remainder = this.subtract(res.multiply(other));
  return new goog.math.Integer.DivisionResult(res, remainder);
};
goog.math.Integer.prototype.divide = function(other) {
  return this.divideAndRemainder(other).quotient;
};
goog.math.Integer.DivisionResult = function(quotient, remainder) {
  this.quotient = quotient;
  this.remainder = remainder;
};
goog.math.Integer.prototype.divideAndRemainder = function(other) {
  if (other.isZero()) {
    throw new Error("division by zero");
  } else if (this.isZero()) {
    return new goog.math.Integer.DivisionResult(goog.math.Integer.ZERO, goog.math.Integer.ZERO);
  }
  if (this.isNegative()) {
    var result = this.negate().divideAndRemainder(other);
    return new goog.math.Integer.DivisionResult(result.quotient.negate(), result.remainder.negate());
  } else if (other.isNegative()) {
    var result = this.divideAndRemainder(other.negate());
    return new goog.math.Integer.DivisionResult(result.quotient.negate(), result.remainder);
  }
  if (this.bits_.length > 30) {
    return this.slowDivide_(other);
  }
  var res = goog.math.Integer.ZERO;
  var rem = this;
  while (rem.greaterThanOrEqual(other)) {
    var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
    var log2 = Math.ceil(Math.log(approx) / Math.LN2);
    var delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
    var approxRes = goog.math.Integer.fromNumber(approx);
    var approxRem = approxRes.multiply(other);
    while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
      approx -= delta;
      approxRes = goog.math.Integer.fromNumber(approx);
      approxRem = approxRes.multiply(other);
    }
    if (approxRes.isZero()) {
      approxRes = goog.math.Integer.ONE;
    }
    res = res.add(approxRes);
    rem = rem.subtract(approxRem);
  }
  return new goog.math.Integer.DivisionResult(res, rem);
};
goog.math.Integer.prototype.modulo = function(other) {
  return this.divideAndRemainder(other).remainder;
};
goog.math.Integer.prototype.not = function() {
  var len = this.bits_.length;
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr[i] = ~this.bits_[i];
  }
  return new goog.math.Integer(arr, ~this.sign_);
};
goog.math.Integer.prototype.and = function(other) {
  var len = Math.max(this.bits_.length, other.bits_.length);
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr[i] = this.getBits(i) & other.getBits(i);
  }
  return new goog.math.Integer(arr, this.sign_ & other.sign_);
};
goog.math.Integer.prototype.or = function(other) {
  var len = Math.max(this.bits_.length, other.bits_.length);
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr[i] = this.getBits(i) | other.getBits(i);
  }
  return new goog.math.Integer(arr, this.sign_ | other.sign_);
};
goog.math.Integer.prototype.xor = function(other) {
  var len = Math.max(this.bits_.length, other.bits_.length);
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr[i] = this.getBits(i) ^ other.getBits(i);
  }
  return new goog.math.Integer(arr, this.sign_ ^ other.sign_);
};
goog.math.Integer.prototype.shiftLeft = function(numBits) {
  var arr_delta = numBits >> 5;
  var bit_delta = numBits % 32;
  var len = this.bits_.length + arr_delta + (bit_delta > 0 ? 1 : 0);
  var arr = [];
  for (var i = 0; i < len; i++) {
    if (bit_delta > 0) {
      arr[i] = this.getBits(i - arr_delta) << bit_delta | this.getBits(i - arr_delta - 1) >>> 32 - bit_delta;
    } else {
      arr[i] = this.getBits(i - arr_delta);
    }
  }
  return new goog.math.Integer(arr, this.sign_);
};
goog.math.Integer.prototype.shiftRight = function(numBits) {
  var arr_delta = numBits >> 5;
  var bit_delta = numBits % 32;
  var len = this.bits_.length - arr_delta;
  var arr = [];
  for (var i = 0; i < len; i++) {
    if (bit_delta > 0) {
      arr[i] = this.getBits(i + arr_delta) >>> bit_delta | this.getBits(i + arr_delta + 1) << 32 - bit_delta;
    } else {
      arr[i] = this.getBits(i + arr_delta);
    }
  }
  return new goog.math.Integer(arr, this.sign_);
};

//# sourceMappingURL=goog.math.integer.js.map
