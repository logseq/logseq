var module$node_modules$path$path = shadow.js.require("module$node_modules$path$path", {});
var module$node_modules$$capacitor$core$dist$index_cjs = shadow.js.require("module$node_modules$$capacitor$core$dist$index_cjs", {});
var module$node_modules$$capacitor$clipboard$dist$plugin_cjs = shadow.js.require("module$node_modules$$capacitor$clipboard$dist$plugin_cjs", {});
if (typeof window === "undefined") {
  global.window = {};
}
(function() {
  if (!window?.console) {
    return;
  }
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].startsWith(`Warning: Each child in a list should have a unique "key" prop`)) {
      console.groupCollapsed("[React] ⚠️ key warning!");
      console.warn(...args);
      console.groupEnd();
      return;
    }
    originalError(...args);
  };
})();
var closest$$module$frontend$utils = (target, selector) => {
  for (; target;) {
    if (target.matches && target.matches(selector)) {
      return target;
    }
    target = target.parentNode;
  }
  return null;
};
var getOffsetRect$$module$frontend$utils = elem => {
  const box = elem.getBoundingClientRect();
  const body = document.body;
  const docElem = document.documentElement;
  const scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
  const clientTop = docElem.clientTop || body.clientTop || 0;
  const clientLeft = docElem.clientLeft || body.clientLeft || 0;
  const top = box.top + scrollTop - clientTop;
  const left = box.left + scrollLeft - clientLeft;
  return {top:Math.round(top), left:Math.round(left)};
};
var focus$$module$frontend$utils = elem => elem === document.activeElement && document.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
var timeConversion$$module$frontend$utils = millisec => {
  let seconds = (millisec / 1000).toFixed(0);
  let minutes = (millisec / (1000 * 60)).toFixed(0);
  let hours = (millisec / (1000 * 60 * 60)).toFixed(1);
  let days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) {
    return seconds + "s";
  } else if (minutes < 60) {
    return minutes + "m";
  } else if (hours < 24) {
    return hours + "h";
  } else {
    return days + "d";
  }
};
var getSelectionText$$module$frontend$utils = () => {
  const selection = (window.getSelection() || "").toString().trim();
  if (selection) {
    return selection;
  }
  const activeElement = window.document.activeElement;
  if (activeElement) {
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
      const el = activeElement;
      return el.value.slice(el.selectionStart || 0, el.selectionEnd || 0);
    }
  }
  return "";
};
var getFiles$$module$frontend$utils = async(dirHandle, recursive, cb, path = dirHandle.name) => {
  const dirs = [];
  const files = [];
  for await (const entry of dirHandle.values()) {
    const nestedPath = `${path}/${entry.name}`;
    if (entry.kind === "file") {
      if (cb) {
        cb(nestedPath, entry);
      }
      files.push(entry.getFile().then(file => {
        Object.defineProperty(file, "webkitRelativePath", {configurable:true, enumerable:true, get:() => nestedPath});
        Object.defineProperty(file, "handle", {configurable:true, enumerable:true, get:() => entry});
        return file;
      }));
    } else if (entry.kind === "directory" && recursive) {
      if (cb) {
        cb(nestedPath, entry);
      }
      dirs.push(...(await getFiles$$module$frontend$utils(entry, recursive, cb, nestedPath)));
    }
  }
  return [...(await Promise.all(dirs)), ...(await Promise.all(files))];
};
var verifyPermission$$module$frontend$utils = async(handle, readWrite) => {
  const options = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
  if (await handle.queryPermission(options) === "granted") {
    return;
  }
  if (await handle.requestPermission(options) === "granted") {
    return;
  }
  throw new Error("Permission is not granted");
};
var openDirectory$$module$frontend$utils = async(options = {}, cb) => {
  options.recursive = options.recursive || false;
  const handle = await window.showDirectoryPicker({mode:"readwrite"});
  const _ask = await verifyPermission$$module$frontend$utils(handle, true);
  return [handle, ...(await getFiles$$module$frontend$utils(handle, options.recursive, cb))];
};
var writeFile$$module$frontend$utils = async(fileHandle, contents) => {
  const writable = await fileHandle.createWritable();
  if (contents instanceof ReadableStream) {
    await contents.pipeTo(writable);
  } else {
    await writable.write(contents);
    await writable.close();
  }
};
var nfsSupported$$module$frontend$utils = () => {
  if ("chooseFileSystemEntries" in self) {
    return "chooseFileSystemEntries";
  } else if ("showOpenFilePicker" in self) {
    return "showOpenFilePicker";
  }
  return false;
};
var inputTypes$$module$frontend$utils = [window.HTMLInputElement, window.HTMLSelectElement, window.HTMLTextAreaElement];
var triggerInputChange$$module$frontend$utils = (node, value = "", name = "change") => {
  if (inputTypes$$module$frontend$utils.indexOf(node.__proto__.constructor) > -1) {
    const setValue = Object.getOwnPropertyDescriptor(node.__proto__, "value").set;
    const event = new Event("change", {bubbles:true});
    setValue.call(node, value);
    node.dispatchEvent(event);
  }
};
var reversePatch$$module$frontend$utils = patch => patch.map(patchObj => ({diffs:patchObj.diffs.map(([op, val]) => [op * -1, val]), start1:patchObj.start2, start2:patchObj.start1, length1:patchObj.length2, length2:patchObj.length1}));
var win32$$module$frontend$utils = path => {
  const splitDeviceRe = /^([a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?([\\/])?([\s\S]*?)$/;
  const result = splitDeviceRe.exec(path);
  const device = result[1] || "";
  const isUnc = Boolean(device && device.charAt(1) !== ":");
  return Boolean(result[2] || isUnc);
};
var ios$$module$frontend$utils = () => ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
var getClipText$$module$frontend$utils = (cb, errorHandler) => {
  navigator.permissions.query({name:"clipboard-read"}).then(result => {
    if (result.state == "granted" || result.state == "prompt") {
      navigator.clipboard.readText().then(text => {
        cb(text);
      }).catch(err => {
        errorHandler(err);
      });
    }
  });
};
var writeClipboard$$module$frontend$utils = ({text, html, blocks}, ownerWindow) => {
  if (module$node_modules$$capacitor$core$dist$index_cjs.Capacitor.isNativePlatform()) {
    module$node_modules$$capacitor$clipboard$dist$plugin_cjs.Clipboard.write({string:text});
    return;
  }
  const navigator = (ownerWindow || window).navigator;
  navigator.permissions.query({name:"clipboard-write"}).then(result => {
    if (result.state != "granted" && result.state != "prompt") {
      console.debug("Copy without `clipboard-write` permission:", text);
      return;
    }
    let promise_written = null;
    if (typeof ClipboardItem !== "undefined") {
      let blob = new Blob([text], {type:["text/plain"]});
      let data = [new ClipboardItem({["text/plain"]:blob})];
      if (html) {
        let richBlob = new Blob([html], {type:["text/html"]});
        data = [new ClipboardItem({["text/plain"]:blob, ["text/html"]:richBlob})];
      }
      if (blocks) {
        let blocksBlob = new Blob([blocks], {type:["web application/logseq"]});
        let richBlob = new Blob([html], {type:["text/html"]});
        data = [new ClipboardItem({["text/plain"]:blob, ["text/html"]:richBlob, ["web application/logseq"]:blocksBlob})];
      }
      promise_written = navigator.clipboard.write(data);
    } else {
      console.debug("Degraded copy without `ClipboardItem` support:", text);
      promise_written = navigator.clipboard.writeText(text);
    }
    promise_written.then(() => {
    }).catch(e => {
      console.log(e, "fail");
    });
  });
};
var toPosixPath$$module$frontend$utils = input => input && input.replace(/\\+/g, "/");
var saveToFile$$module$frontend$utils = (data, fileName, format) => {
  if (!data) {
    return;
  }
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.${format}`;
  link.click();
};
var canvasToImage$$module$frontend$utils = (canvas, title = "Untitled", format = "png") => {
  canvas.toBlob(blob => {
    console.log(blob);
    saveToFile$$module$frontend$utils(blob, title, format);
  }, `image/.${format}`);
};
var nodePath$$module$frontend$utils = Object.assign({}, module$node_modules$path$path, {basename(input) {
  input = toPosixPath$$module$frontend$utils(input);
  return module$node_modules$path$path.basename(input);
}, name(input) {
  input = toPosixPath$$module$frontend$utils(input);
  return module$node_modules$path$path.parse(input).name;
}, dirname(input) {
  input = toPosixPath$$module$frontend$utils(input);
  return module$node_modules$path$path.dirname(input);
}, extname(input) {
  input = toPosixPath$$module$frontend$utils(input);
  return module$node_modules$path$path.extname(input);
}, join(input, ...paths) {
  let orURI = null;
  const s = ["file://", "http://", "https://", "content://"];
  if (s.some(p => input.startsWith(p))) {
    try {
      orURI = new URL(input);
      input = input.replace(orURI.protocol + "//", "").replace(orURI.protocol, "").replace(/^\/+/, "/");
    } catch (_e) {
    }
  }
  input = module$node_modules$path$path.join(input, ...paths);
  return (orURI ? orURI.protocol + "//" : "") + input;
}});
var prettifyXml$$module$frontend$utils = sourceXml => {
  const xmlDoc = (new DOMParser()).parseFromString(sourceXml, "application/xml");
  const xsltDoc = (new DOMParser()).parseFromString(['\x3cxsl:stylesheet xmlns:xsl\x3d"http://www.w3.org/1999/XSL/Transform"\x3e', '  \x3cxsl:strip-space elements\x3d"*"/\x3e', '  \x3cxsl:template match\x3d"para[content-style][not(text())]"\x3e', '    \x3cxsl:value-of select\x3d"normalize-space(.)"/\x3e', "  \x3c/xsl:template\x3e", '  \x3cxsl:template match\x3d"node()|@*"\x3e', '    \x3cxsl:copy\x3e\x3cxsl:apply-templates select\x3d"node()|@*"/\x3e\x3c/xsl:copy\x3e', "  \x3c/xsl:template\x3e", '  \x3cxsl:output indent\x3d"yes"/\x3e', 
  "\x3c/xsl:stylesheet\x3e"].join("\n"), "application/xml");
  const xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xsltDoc);
  const resultDoc = xsltProcessor.transformToDocument(xmlDoc);
  const resultXml = (new XMLSerializer()).serializeToString(resultDoc);
  return resultXml.indexOf("\x3cparsererror") === -1 ? resultXml : sourceXml;
};
var elementIsVisibleInViewport$$module$frontend$utils = (el, partiallyVisible = false) => {
  const {top, left, bottom, right} = el.getBoundingClientRect();
  const {innerHeight, innerWidth} = window;
  return partiallyVisible ? (top > 0 && top < innerHeight || bottom > 0 && bottom < innerHeight) && (left > 0 && left < innerWidth || right > 0 && right < innerWidth) : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
};
var convertToLetters$$module$frontend$utils = num => {
  if (!+num) {
    return false;
  }
  let s = "";
  let t;
  for (; num > 0;) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = (num - t) / 26 | 0;
  }
  return s;
};
var convertToRoman$$module$frontend$utils = num => {
  if (!+num) {
    return false;
  }
  const digits = String(+num).split("");
  const key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  let roman = "";
  let i = 3;
  for (; i--;) {
    roman = (key[+digits.pop() + i * 10] || "") + roman;
  }
  return Array(+digits.join("") + 1).join("M") + roman;
};
function hsl2hex$$module$frontend$utils(h, s, l, alpha) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  if (alpha) {
    alpha = Math.round(alpha * 255).toString(16).padStart(2, "0");
  } else {
    alpha = "";
  }
  return `#${f(0)}${f(8)}${f(4)}${alpha}`;
}
/** @const */ 
var module$frontend$utils = {};
/** @const */ 
module$frontend$utils.canvasToImage = canvasToImage$$module$frontend$utils;
/** @const */ 
module$frontend$utils.closest = closest$$module$frontend$utils;
/** @const */ 
module$frontend$utils.convertToLetters = convertToLetters$$module$frontend$utils;
/** @const */ 
module$frontend$utils.convertToRoman = convertToRoman$$module$frontend$utils;
/** @const */ 
module$frontend$utils.elementIsVisibleInViewport = elementIsVisibleInViewport$$module$frontend$utils;
/** @const */ 
module$frontend$utils.focus = focus$$module$frontend$utils;
/** @const */ 
module$frontend$utils.getClipText = getClipText$$module$frontend$utils;
/** @const */ 
module$frontend$utils.getFiles = getFiles$$module$frontend$utils;
/** @const */ 
module$frontend$utils.getOffsetRect = getOffsetRect$$module$frontend$utils;
/** @const */ 
module$frontend$utils.getSelectionText = getSelectionText$$module$frontend$utils;
/** @const */ 
module$frontend$utils.hsl2hex = hsl2hex$$module$frontend$utils;
/** @const */ 
module$frontend$utils.ios = ios$$module$frontend$utils;
/** @const */ 
module$frontend$utils.nfsSupported = nfsSupported$$module$frontend$utils;
/** @const */ 
module$frontend$utils.nodePath = nodePath$$module$frontend$utils;
/** @const */ 
module$frontend$utils.openDirectory = openDirectory$$module$frontend$utils;
/** @const */ 
module$frontend$utils.prettifyXml = prettifyXml$$module$frontend$utils;
/** @const */ 
module$frontend$utils.reversePatch = reversePatch$$module$frontend$utils;
/** @const */ 
module$frontend$utils.saveToFile = saveToFile$$module$frontend$utils;
/** @const */ 
module$frontend$utils.timeConversion = timeConversion$$module$frontend$utils;
/** @const */ 
module$frontend$utils.toPosixPath = toPosixPath$$module$frontend$utils;
/** @const */ 
module$frontend$utils.triggerInputChange = triggerInputChange$$module$frontend$utils;
/** @const */ 
module$frontend$utils.verifyPermission = verifyPermission$$module$frontend$utils;
/** @const */ 
module$frontend$utils.win32 = win32$$module$frontend$utils;
/** @const */ 
module$frontend$utils.writeClipboard = writeClipboard$$module$frontend$utils;
/** @const */ 
module$frontend$utils.writeFile = writeFile$$module$frontend$utils;

$CLJS.module$frontend$utils=module$frontend$utils;
//# sourceMappingURL=module$frontend$utils.js.map
