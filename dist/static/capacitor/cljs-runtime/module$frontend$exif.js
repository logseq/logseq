var objectURLToBlob$$module$frontend$exif = (url, callback) => {
  const http = new XMLHttpRequest();
  http.open("GET", url, true);
  http.responseType = "blob";
  http.onload = e => {
    if (http.status == 200 || http.status === 0) {
      callback(http.response);
    }
  };
  http.send();
};
var getEXIFOrientation$$module$frontend$exif = (img, callback) => {
  const reader = new FileReader();
  reader.onload = e => {
    const view = new DataView(e.target.result);
    if (view.getUint16(0, false) !== 65496) {
      return callback(-2);
    }
    const length = view.byteLength;
    let offset = 2;
    for (; offset < length;) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 65505) {
        if (view.getUint32(offset += 2, false) !== 1165519206) {
          return callback(-1);
        }
        const little = view.getUint16(offset += 6, false) === 18761;
        offset += view.getUint32(offset + 4, little);
        const tags = view.getUint16(offset, little);
        offset += 2;
        for (let i = 0; i < tags; i++) {
          if (view.getUint16(offset + i * 12, little) === 274) {
            const o = view.getUint16(offset + i * 12 + 8, little);
            return callback(o);
          }
        }
      } else if ((marker & 65280) !== 65280) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
    return callback(-1);
  };
  objectURLToBlob$$module$frontend$exif(img.src, blob => {
    reader.readAsArrayBuffer(blob.slice(0, 65536));
  });
};
/** @const */ 
var module$frontend$exif = {};
/** @const */ 
module$frontend$exif.getEXIFOrientation = getEXIFOrientation$$module$frontend$exif;

$CLJS.module$frontend$exif=module$frontend$exif;
//# sourceMappingURL=module$frontend$exif.js.map
