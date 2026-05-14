goog.provide("goog.fs.blob");
goog.fs.blob.getBlob = function(var_args) {
  const BlobBuilder = goog.global.BlobBuilder || goog.global.WebKitBlobBuilder;
  if (BlobBuilder !== undefined) {
    const bb = new BlobBuilder();
    for (let i = 0; i < arguments.length; i++) {
      bb.append(arguments[i]);
    }
    return bb.getBlob();
  } else {
    return goog.fs.blob.getBlobWithProperties(Array.prototype.slice.call(arguments));
  }
};
goog.fs.blob.getBlobWithProperties = function(parts, opt_type, opt_endings) {
  const BlobBuilder = goog.global.BlobBuilder || goog.global.WebKitBlobBuilder;
  if (BlobBuilder !== undefined) {
    const bb = new BlobBuilder();
    for (let i = 0; i < parts.length; i++) {
      bb.append(parts[i], opt_endings);
    }
    return bb.getBlob(opt_type);
  } else if (goog.global.Blob !== undefined) {
    const properties = {};
    if (opt_type) {
      properties["type"] = opt_type;
    }
    if (opt_endings) {
      properties["endings"] = opt_endings;
    }
    return new Blob(parts, properties);
  } else {
    throw new Error("This browser doesn't seem to support creating Blobs");
  }
};

//# sourceMappingURL=goog.fs.blob.js.map
