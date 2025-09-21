// copied from https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side

const objectURLToBlob=(url, callback)=> {
  const http = new XMLHttpRequest();
  http.open("GET", url, true);
  http.responseType = "blob";
  http.onload = (e)=> {
    if (http.status == 200 || http.status === 0) {
      callback(http.response);
    }
  };
  http.send();
}

export const getEXIFOrientation =  (img, callback)=> {
  const reader = new FileReader();
  reader.onload = e => {
    const view = new DataView(e.target.result)

    if (view.getUint16(0, false) !== 0xFFD8) {
      return callback(-2)
    }
    const length = view.byteLength
    let offset = 2
    while (offset < length) {
      const marker = view.getUint16(offset, false)
      offset += 2
      if (marker === 0xFFE1) {
        if (view.getUint32(offset += 2, false) !== 0x45786966) {
          return callback(-1)
        }
        const little = view.getUint16(offset += 6, false) === 0x4949
        offset += view.getUint32(offset + 4, little)
        const tags = view.getUint16(offset, little)
        offset += 2
        for (let i = 0; i < tags; i++) {
          if (view.getUint16(offset + (i * 12), little) === 0x0112) {
            const o = view.getUint16(offset + (i * 12) + 8, little);
            return callback(o)
          }
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break
      } else {
        offset += view.getUint16(offset, false)
      }
    }
    return callback(-1)
  };

  objectURLToBlob(img.src,  (blob)=> {
    reader.readAsArrayBuffer(blob.slice(0, 65536));
  });
}
