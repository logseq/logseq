goog.provide("goog.crypt.Sha2");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.crypt.Hash");
goog.crypt.Sha2 = function(numHashBlocks, initHashBlocks) {
  goog.crypt.Sha2.base(this, "constructor");
  this.blockSize = goog.crypt.Sha2.BLOCKSIZE_;
  this.chunk_ = goog.global["Uint8Array"] ? new Uint8Array(this.blockSize) : new Array(this.blockSize);
  this.inChunk_ = 0;
  this.total_ = 0;
  this.hash_ = [];
  this.numHashBlocks_ = numHashBlocks;
  this.initHashBlocks_ = initHashBlocks;
  this.w_ = goog.global["Int32Array"] ? new Int32Array(64) : new Array(64);
  if (goog.crypt.Sha2.Kx_ === undefined) {
    if (goog.global["Int32Array"]) {
      goog.crypt.Sha2.Kx_ = new Int32Array(goog.crypt.Sha2.K_);
    } else {
      goog.crypt.Sha2.Kx_ = goog.crypt.Sha2.K_;
    }
  }
  this.reset();
};
goog.inherits(goog.crypt.Sha2, goog.crypt.Hash);
goog.crypt.Sha2.BLOCKSIZE_ = 512 / 8;
goog.crypt.Sha2.PADDING_ = [].concat(128, goog.array.repeat(0, goog.crypt.Sha2.BLOCKSIZE_ - 1));
goog.crypt.Sha2.prototype.reset = function() {
  this.inChunk_ = 0;
  this.total_ = 0;
  this.hash_ = goog.global["Int32Array"] ? new Int32Array(this.initHashBlocks_) : goog.array.clone(this.initHashBlocks_);
};
goog.crypt.Sha2.prototype.computeChunk_ = function() {
  var chunk = this.chunk_;
  goog.asserts.assert(chunk.length == this.blockSize);
  var rounds = 64;
  var w = this.w_;
  var index = 0;
  var offset = 0;
  while (offset < chunk.length) {
    w[index++] = chunk[offset] << 24 | chunk[offset + 1] << 16 | chunk[offset + 2] << 8 | chunk[offset + 3];
    offset = index * 4;
  }
  for (var i = 16; i < rounds; i++) {
    var w_15 = w[i - 15] | 0;
    var s0 = (w_15 >>> 7 | w_15 << 25) ^ (w_15 >>> 18 | w_15 << 14) ^ w_15 >>> 3;
    var w_2 = w[i - 2] | 0;
    var s1 = (w_2 >>> 17 | w_2 << 15) ^ (w_2 >>> 19 | w_2 << 13) ^ w_2 >>> 10;
    var partialSum1 = (w[i - 16] | 0) + s0 | 0;
    var partialSum2 = (w[i - 7] | 0) + s1 | 0;
    w[i] = partialSum1 + partialSum2 | 0;
  }
  var a = this.hash_[0] | 0;
  var b = this.hash_[1] | 0;
  var c = this.hash_[2] | 0;
  var d = this.hash_[3] | 0;
  var e = this.hash_[4] | 0;
  var f = this.hash_[5] | 0;
  var g = this.hash_[6] | 0;
  var h = this.hash_[7] | 0;
  for (var i = 0; i < rounds; i++) {
    var S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
    var maj = a & b ^ a & c ^ b & c;
    var t2 = S0 + maj | 0;
    var S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
    var ch = e & f ^ ~e & g;
    var partialSum1 = h + S1 | 0;
    var partialSum2 = ch + (goog.crypt.Sha2.Kx_[i] | 0) | 0;
    var partialSum3 = partialSum2 + (w[i] | 0) | 0;
    var t1 = partialSum1 + partialSum3 | 0;
    h = g;
    g = f;
    f = e;
    e = d + t1 | 0;
    d = c;
    c = b;
    b = a;
    a = t1 + t2 | 0;
  }
  this.hash_[0] = this.hash_[0] + a | 0;
  this.hash_[1] = this.hash_[1] + b | 0;
  this.hash_[2] = this.hash_[2] + c | 0;
  this.hash_[3] = this.hash_[3] + d | 0;
  this.hash_[4] = this.hash_[4] + e | 0;
  this.hash_[5] = this.hash_[5] + f | 0;
  this.hash_[6] = this.hash_[6] + g | 0;
  this.hash_[7] = this.hash_[7] + h | 0;
};
goog.crypt.Sha2.prototype.update = function(message, opt_length) {
  if (opt_length === undefined) {
    opt_length = message.length;
  }
  var n = 0;
  var inChunk = this.inChunk_;
  if (typeof message === "string") {
    while (n < opt_length) {
      this.chunk_[inChunk++] = message.charCodeAt(n++);
      if (inChunk == this.blockSize) {
        this.computeChunk_();
        inChunk = 0;
      }
    }
  } else if (goog.isArrayLike(message)) {
    while (n < opt_length) {
      var b = message[n++];
      if (!("number" == typeof b && 0 <= b && 255 >= b && b == (b | 0))) {
        throw new Error("message must be a byte array");
      }
      this.chunk_[inChunk++] = b;
      if (inChunk == this.blockSize) {
        this.computeChunk_();
        inChunk = 0;
      }
    }
  } else {
    throw new Error("message must be string or array");
  }
  this.inChunk_ = inChunk;
  this.total_ += opt_length;
};
goog.crypt.Sha2.prototype.digest = function() {
  var digest = [];
  var totalBits = this.total_ * 8;
  if (this.inChunk_ < 56) {
    this.update(goog.crypt.Sha2.PADDING_, 56 - this.inChunk_);
  } else {
    this.update(goog.crypt.Sha2.PADDING_, this.blockSize - (this.inChunk_ - 56));
  }
  for (var i = 63; i >= 56; i--) {
    this.chunk_[i] = totalBits & 255;
    totalBits /= 256;
  }
  this.computeChunk_();
  var n = 0;
  for (var i = 0; i < this.numHashBlocks_; i++) {
    for (var j = 24; j >= 0; j -= 8) {
      digest[n++] = this.hash_[i] >> j & 255;
    }
  }
  return digest;
};
goog.crypt.Sha2.K_ = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 
2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
goog.crypt.Sha2.Kx_;

//# sourceMappingURL=goog.crypt.sha2.js.map
