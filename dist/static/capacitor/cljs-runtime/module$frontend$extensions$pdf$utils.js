var getPdfjsLib$$module$frontend$extensions$pdf$utils = () => window.pdfjsLib;
var viewportToScaled$$module$frontend$extensions$pdf$utils = (rect, {width, height}) => ({x1:rect.left, y1:rect.top, x2:rect.left + rect.width, y2:rect.top + rect.height, width, height});
var pdfToViewport$$module$frontend$extensions$pdf$utils = (pdf, viewport) => {
  const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([pdf.x1, pdf.y1, pdf.x2, pdf.y2]);
  return {left:x1, top:y1, width:x2 - x1, height:y1 - y2};
};
var scaledToViewport$$module$frontend$extensions$pdf$utils = (scaled, viewport, usePdfCoordinates = false) => {
  const {width, height} = viewport;
  if (usePdfCoordinates) {
    return pdfToViewport$$module$frontend$extensions$pdf$utils(scaled, viewport);
  }
  if (scaled.x1 === undefined) {
    throw new Error("You are using old position format, please update");
  }
  const x1 = width * scaled.x1 / scaled.width;
  const y1 = height * scaled.y1 / scaled.height;
  const x2 = width * scaled.x2 / scaled.width;
  const y2 = height * scaled.y2 / scaled.height;
  return {left:x1, top:y1, width:x2 - x1, height:y2 - y1};
};
var getBoundingRect$$module$frontend$extensions$pdf$utils = clientRects => {
  const rects = Array.from(clientRects).map(rect => {
    const {left, top, width, height} = rect;
    const X0 = left;
    const X1 = left + width;
    const Y0 = top;
    const Y1 = top + height;
    return {X0, X1, Y0, Y1};
  });
  const optimal = rects.reduce((res, rect) => ({X0:Math.min(res.X0, rect.X0), X1:Math.max(res.X1, rect.X1), Y0:Math.min(res.Y0, rect.Y0), Y1:Math.max(res.Y1, rect.Y1)}), rects[0]);
  const {X0, X1, Y0, Y1} = optimal;
  return {left:X0, top:Y0, width:X1 - X0, height:Y1 - Y0};
};
var scrollToHighlight$$module$frontend$extensions$pdf$utils = (viewer, highlight) => {
  function blinkHighlight() {
    const id = highlight?.id;
    const el = document.getElementById(`hl_${id}`);
    if (!el) {
      return;
    }
    el.classList.add("hl-flash");
    setTimeout(() => el?.classList.remove("hl-flash"), 1200);
  }
  if (!highlight) {
    return;
  }
  const {page, bounding} = highlight.position;
  const viewport = viewer.getPageView(page - 1)?.viewport;
  if (!viewport) {
    return;
  }
  viewer.scrollPageIntoView({pageNumber:page, destArray:[null, {name:"XYZ"}, ...viewport.convertToPdfPoint(viewer.container.scrollLeft, scaledToViewport$$module$frontend$extensions$pdf$utils(bounding, viewport).top - 200), viewer.currentScale], ignoreDestinationZoom:true});
  setTimeout(blinkHighlight, 200);
};
var optimizeClientRects$$module$frontend$extensions$pdf$utils = clientRects => {
  const sort = rects => rects.sort((A, B) => {
    const top = A.top - B.top;
    if (top === 0) {
      return A.left - B.left;
    }
    return top;
  });
  const overlaps = (A, B) => A.left <= B.left && B.left <= A.left + A.width;
  const sameLine = (A, B, yMargin = 5) => Math.abs(A.top - B.top) < yMargin && Math.abs(A.height - B.height) < yMargin;
  const inside = (A, B) => A.top > B.top && A.left > B.left && A.top + A.height < B.top + B.height && A.left + A.width < B.left + B.width;
  const nextTo = (A, B, xMargin = 10) => {
    const Aright = A.left + A.width;
    const Bright = B.left + B.width;
    return A.left <= B.left && Aright <= Bright && B.left - Aright <= xMargin;
  };
  const extendWidth = (A, B) => {
    A.width = Math.max(B.width - A.left + B.left, A.width);
  };
  const rects = sort(clientRects);
  const toRemove = new Set();
  const firstPass = rects.filter(rect => rects.every(otherRect => !inside(rect, otherRect)));
  let passCount = 0;
  for (; passCount <= 2;) {
    firstPass.forEach(A => {
      firstPass.forEach(B => {
        if (A === B || toRemove.has(A) || toRemove.has(B)) {
          return;
        }
        if (!sameLine(A, B)) {
          return;
        }
        if (overlaps(A, B)) {
          extendWidth(A, B);
          A.height = Math.max(A.height, B.height);
          toRemove.add(B);
        }
        if (nextTo(A, B)) {
          extendWidth(A, B);
          toRemove.add(B);
        }
      });
    });
    passCount += 1;
  }
  return firstPass.filter(rect => !toRemove.has(rect));
};
function binarySearchFirstItem$$module$frontend$extensions$pdf$utils(items, condition, start = 0) {
  let minIndex = start;
  let maxIndex = items.length - 1;
  if (maxIndex < 0 || !condition(items[maxIndex])) {
    return items.length;
  }
  if (condition(items[minIndex])) {
    return minIndex;
  }
  for (; minIndex < maxIndex;) {
    const currentIndex = minIndex + maxIndex >> 1;
    const currentItem = items[currentIndex];
    if (condition(currentItem)) {
      maxIndex = currentIndex;
    } else {
      minIndex = currentIndex + 1;
    }
  }
  return minIndex;
}
function scrollIntoView$$module$frontend$extensions$pdf$utils(element, spot, scrollMatches = false) {
  let parent = element.offsetParent;
  if (!parent) {
    console.error("offsetParent is not set -- cannot scroll");
    return;
  }
  let offsetY = element.offsetTop + element.clientTop;
  let offsetX = element.offsetLeft + element.clientLeft;
  for (; parent.clientHeight === parent.scrollHeight && parent.clientWidth === parent.scrollWidth || scrollMatches && (parent.classList.contains("markedContent") || getComputedStyle(parent).overflow === "hidden");) {
    offsetY += parent.offsetTop;
    offsetX += parent.offsetLeft;
    parent = parent.offsetParent;
    if (!parent) {
      return;
    }
  }
  if (spot) {
    if (spot.top !== undefined) {
      offsetY += spot.top;
    }
    if (spot.left !== undefined) {
      offsetX += spot.left;
      parent.scrollLeft = offsetX;
    }
  }
  parent.scrollTop = offsetY;
}
var CharacterType$$module$frontend$extensions$pdf$utils = {SPACE:0, ALPHA_LETTER:1, PUNCT:2, HAN_LETTER:3, KATAKANA_LETTER:4, HIRAGANA_LETTER:5, HALFWIDTH_KATAKANA_LETTER:6, THAI_LETTER:7};
function isAlphabeticalScript$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode < 11904;
}
function isAscii$$module$frontend$extensions$pdf$utils(charCode) {
  return (charCode & 65408) === 0;
}
function isAsciiAlpha$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 97 && charCode <= 122 || charCode >= 65 && charCode <= 90;
}
function isAsciiDigit$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 48 && charCode <= 57;
}
function isAsciiSpace$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode === 32 || charCode === 9 || charCode === 13 || charCode === 10;
}
function isHan$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 13312 && charCode <= 40959 || charCode >= 63744 && charCode <= 64255;
}
function isKatakana$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 12448 && charCode <= 12543;
}
function isHiragana$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 12352 && charCode <= 12447;
}
function isHalfwidthKatakana$$module$frontend$extensions$pdf$utils(charCode) {
  return charCode >= 65376 && charCode <= 65439;
}
function isThai$$module$frontend$extensions$pdf$utils(charCode) {
  return (charCode & 65408) === 3584;
}
function getCharacterType$$module$frontend$extensions$pdf$utils(charCode) {
  if (isAlphabeticalScript$$module$frontend$extensions$pdf$utils(charCode)) {
    if (isAscii$$module$frontend$extensions$pdf$utils(charCode)) {
      if (isAsciiSpace$$module$frontend$extensions$pdf$utils(charCode)) {
        return CharacterType$$module$frontend$extensions$pdf$utils.SPACE;
      } else if (isAsciiAlpha$$module$frontend$extensions$pdf$utils(charCode) || isAsciiDigit$$module$frontend$extensions$pdf$utils(charCode) || charCode === 95) {
        return CharacterType$$module$frontend$extensions$pdf$utils.ALPHA_LETTER;
      }
      return CharacterType$$module$frontend$extensions$pdf$utils.PUNCT;
    } else if (isThai$$module$frontend$extensions$pdf$utils(charCode)) {
      return CharacterType$$module$frontend$extensions$pdf$utils.THAI_LETTER;
    } else if (charCode === 160) {
      return CharacterType$$module$frontend$extensions$pdf$utils.SPACE;
    }
    return CharacterType$$module$frontend$extensions$pdf$utils.ALPHA_LETTER;
  }
  if (isHan$$module$frontend$extensions$pdf$utils(charCode)) {
    return CharacterType$$module$frontend$extensions$pdf$utils.HAN_LETTER;
  } else if (isKatakana$$module$frontend$extensions$pdf$utils(charCode)) {
    return CharacterType$$module$frontend$extensions$pdf$utils.KATAKANA_LETTER;
  } else if (isHiragana$$module$frontend$extensions$pdf$utils(charCode)) {
    return CharacterType$$module$frontend$extensions$pdf$utils.HIRAGANA_LETTER;
  } else if (isHalfwidthKatakana$$module$frontend$extensions$pdf$utils(charCode)) {
    return CharacterType$$module$frontend$extensions$pdf$utils.HALFWIDTH_KATAKANA_LETTER;
  }
  return CharacterType$$module$frontend$extensions$pdf$utils.ALPHA_LETTER;
}
/** @const */ 
var module$frontend$extensions$pdf$utils = {};
/** @const */ 
module$frontend$extensions$pdf$utils.CharacterType = CharacterType$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.binarySearchFirstItem = binarySearchFirstItem$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.getBoundingRect = getBoundingRect$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.getCharacterType = getCharacterType$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.getPdfjsLib = getPdfjsLib$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.optimizeClientRects = optimizeClientRects$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.scaledToViewport = scaledToViewport$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.scrollToHighlight = scrollToHighlight$$module$frontend$extensions$pdf$utils;
/** @const */ 
module$frontend$extensions$pdf$utils.viewportToScaled = viewportToScaled$$module$frontend$extensions$pdf$utils;

$CLJS.module$frontend$extensions$pdf$utils=module$frontend$extensions$pdf$utils;
//# sourceMappingURL=module$frontend$extensions$pdf$utils.js.map
