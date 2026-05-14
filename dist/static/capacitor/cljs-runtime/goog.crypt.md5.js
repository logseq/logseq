goog.provide("goog.crypt.Md5");
goog.require("goog.crypt.Hash");
goog.crypt.Md5 = function() {
  goog.crypt.Md5.base(this, "constructor");
  this.blockSize = 512 / 8;
  this.chain_ = new Array(4);
  this.block_ = new Array(this.blockSize);
  this.blockLength_ = 0;
  this.totalLength_ = 0;
  this.reset();
};
goog.inherits(goog.crypt.Md5, goog.crypt.Hash);
goog.crypt.Md5.prototype.reset = function() {
  this.chain_[0] = 1732584193;
  this.chain_[1] = 4023233417;
  this.chain_[2] = 2562383102;
  this.chain_[3] = 271733878;
  this.blockLength_ = 0;
  this.totalLength_ = 0;
};
goog.crypt.Md5.prototype.compress_ = function(buf, opt_offset) {
  if (!opt_offset) {
    opt_offset = 0;
  }
  var X = new Array(16);
  if (typeof buf === "string") {
    for (var i = 0; i < 16; ++i) {
      X[i] = buf.charCodeAt(opt_offset++) | buf.charCodeAt(opt_offset++) << 8 | buf.charCodeAt(opt_offset++) << 16 | buf.charCodeAt(opt_offset++) << 24;
    }
  } else {
    for (var i = 0; i < 16; ++i) {
      X[i] = buf[opt_offset++] | buf[opt_offset++] << 8 | buf[opt_offset++] << 16 | buf[opt_offset++] << 24;
    }
  }
  var A = this.chain_[0];
  var B = this.chain_[1];
  var C = this.chain_[2];
  var D = this.chain_[3];
  var sum = 0;
  sum = A + (D ^ B & (C ^ D)) + X[0] + 3614090360 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[1] + 3905402710 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[2] + 606105819 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[3] + 3250441966 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[4] + 4118548399 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[5] + 1200080426 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[6] + 2821735955 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[7] + 4249261313 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[8] + 1770035416 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[9] + 2336552879 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[10] + 4294925233 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[11] + 2304563134 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[12] + 1804603682 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[13] + 4254626195 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[14] + 2792965006 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[15] + 1236535329 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (C ^ D & (B ^ C)) + X[1] + 4129170786 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[6] + 3225465664 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[11] + 643717713 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[0] + 3921069994 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[5] + 3593408605 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[10] + 38016083 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[15] + 3634488961 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[4] + 3889429448 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[9] + 568446438 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[14] + 3275163606 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[3] + 4107603335 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[8] + 1163531501 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[13] + 2850285829 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[2] + 4243563512 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[7] + 1735328473 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[12] + 2368359562 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (B ^ C ^ D) + X[5] + 4294588738 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[8] + 2272392833 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[11] + 1839030562 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[14] + 4259657740 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[1] + 2763975236 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[4] + 1272893353 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[7] + 4139469664 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[10] + 3200236656 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[13] + 681279174 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[0] + 3936430074 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[3] + 3572445317 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[6] + 76029189 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[9] + 3654602809 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[12] + 3873151461 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[15] + 530742520 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[2] + 3299628645 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (C ^ (B | ~D)) + X[0] + 4096336452 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[7] + 1126891415 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[14] + 2878612391 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[5] + 4237533241 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[12] + 1700485571 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[3] + 2399980690 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[10] + 4293915773 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[1] + 2240044497 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[8] + 1873313359 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[15] + 4264355552 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[6] + 2734768916 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[13] + 1309151649 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[4] + 4149444226 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[11] + 3174756917 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[2] + 718787259 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[9] + 3951481745 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  this.chain_[0] = this.chain_[0] + A & 4294967295;
  this.chain_[1] = this.chain_[1] + B & 4294967295;
  this.chain_[2] = this.chain_[2] + C & 4294967295;
  this.chain_[3] = this.chain_[3] + D & 4294967295;
};
goog.crypt.Md5.prototype.update = function(bytes, opt_length) {
  if (opt_length === undefined) {
    opt_length = bytes.length;
  }
  var lengthMinusBlock = opt_length - this.blockSize;
  var block = this.block_;
  var blockLength = this.blockLength_;
  var i = 0;
  while (i < opt_length) {
    if (blockLength == 0) {
      while (i <= lengthMinusBlock) {
        this.compress_(bytes, i);
        i += this.blockSize;
      }
    }
    if (typeof bytes === "string") {
      while (i < opt_length) {
        block[blockLength++] = bytes.charCodeAt(i++);
        if (blockLength == this.blockSize) {
          this.compress_(block);
          blockLength = 0;
          break;
        }
      }
    } else {
      while (i < opt_length) {
        block[blockLength++] = bytes[i++];
        if (blockLength == this.blockSize) {
          this.compress_(block);
          blockLength = 0;
          break;
        }
      }
    }
  }
  this.blockLength_ = blockLength;
  this.totalLength_ += opt_length;
};
goog.crypt.Md5.prototype.digest = function() {
  var pad = new Array((this.blockLength_ < 56 ? this.blockSize : this.blockSize * 2) - this.blockLength_);
  pad[0] = 128;
  for (var i = 1; i < pad.length - 8; ++i) {
    pad[i] = 0;
  }
  var totalBits = this.totalLength_ * 8;
  for (var i = pad.length - 8; i < pad.length; ++i) {
    pad[i] = totalBits & 255;
    totalBits /= 256;
  }
  this.update(pad);
  var digest = new Array(16);
  var n = 0;
  for (var i = 0; i < 4; ++i) {
    for (var j = 0; j < 32; j += 8) {
      digest[n++] = this.chain_[i] >>> j & 255;
    }
  }
  return digest;
};

//# sourceMappingURL=goog.crypt.md5.js.map
