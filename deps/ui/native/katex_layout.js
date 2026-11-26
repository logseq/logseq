/* Converts KaTeX's internal layout tree into backend-independent paint
   commands. Units are root ems; x grows right, y grows up from the math
   baseline. This file is evaluated inside QuickJS by the native host. */
(function () {
  "use strict";

  function has(node, name) {
    return node.classes && node.classes.indexOf(name) >= 0;
  }

  function em(value) {
    if (typeof value !== "string") return 0;
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function horizontalExtra(node) {
    var s = node.style || {};
    return em(s.marginLeft) + em(s.marginRight) +
      em(s.paddingLeft) + em(s.paddingRight);
  }

  function explicitWidth(node) {
    var s = node.style || {};
    if (s.width) return em(s.width);
    if (s.minWidth) return em(s.minWidth);
    return 0;
  }

  function isSymbol(node) {
    return typeof node.text === "string" && typeof node.width === "number";
  }

  function isSvg(node) {
    return !!(node.attributes && node.attributes.viewBox);
  }

  function isInvisible(node) {
    return has(node, "katex-mathml") || has(node, "strut") ||
      has(node, "pstrut") || has(node, "vlist-s");
  }

  function fontOf(node) {
    if (has(node, "large-op")) return "KaTeX_Size2";
    if (has(node, "small-op")) return "KaTeX_Size1";
    if (has(node, "delimsizing")) {
      if (has(node, "size4")) return "KaTeX_Size4";
      if (has(node, "size3")) return "KaTeX_Size3";
      if (has(node, "size2")) return "KaTeX_Size2";
      if (has(node, "size1")) return "KaTeX_Size1";
    }
    if (has(node, "mathbb") || has(node, "textbb") || has(node, "amsrm")) return "KaTeX_AMS";
    if (has(node, "mathnormal") || has(node, "boldsymbol")) return "KaTeX_Math";
    if (has(node, "mathsf") || has(node, "textsf") || has(node, "mathsfit") ||
        has(node, "mathitsf") || has(node, "textitsf")) return "KaTeX_SansSerif";
    if (has(node, "mathtt") || has(node, "texttt")) return "KaTeX_Typewriter";
    if (has(node, "mathcal")) return "KaTeX_Caligraphic";
    if (has(node, "mathfrak") || has(node, "textfrak") || has(node, "mathboldfrak") ||
        has(node, "textboldfrak")) return "KaTeX_Fraktur";
    if (has(node, "mathscr") || has(node, "textscr")) return "KaTeX_Script";
    return "KaTeX_Main";
  }

  function widthOf(node) {
    if (!node || isInvisible(node)) return 0;
    if (isSymbol(node)) {
      return (node.width || 0) * (node.maxFontSize || 0);
    }
    if (has(node, "mspace")) return em((node.style || {}).marginRight);
    if (has(node, "nulldelimiter")) return 0.12;
    if (has(node, "frac-line") || has(node, "overline-line") ||
        has(node, "underline-line") || has(node, "hline")) return 0;
    var fixed = explicitWidth(node);
    var children = node.children || [];
    var i, total = 0;
    if (has(node, "vlist") || has(node, "vlist-r") || has(node, "vlist-t")) {
      for (i = 0; i < children.length; i++) total = Math.max(total, widthOf(children[i]));
    } else {
      for (i = 0; i < children.length; i++) total += widthOf(children[i]);
    }
    total += horizontalExtra(node);
    if (fixed > total) total = fixed;
    return total;
  }

  function childAfterPstrut(wrapper) {
    var children = wrapper.children || [];
    for (var i = 0; i < children.length; i++) {
      if (!has(children[i], "pstrut")) return children[i];
    }
    return null;
  }

  function layout(node, x, baseline, out, ctx) {
    if (!node || isInvisible(node)) return;
    var i, children, cursor, child, width;

    if (isSymbol(node)) {
      if (node.text && node.text !== "\u200b") {
        out.items.push({
          type: "text",
          x: x,
          y: baseline,
          text: node.text,
          font: fontOf(node),
          size: node.maxFontSize || 1,
          italic: has(node, "mathnormal") || has(node, "mathit") || has(node, "boldsymbol") ||
            has(node, "mathsfit") || has(node, "mathitsf") || has(node, "textitsf"),
          bold: has(node, "mathbf") || has(node, "boldsymbol") || has(node, "mathboldfrak") ||
            has(node, "textboldfrak") || has(node, "mathboldsf") || has(node, "textboldsf") ||
            has(node, "textbf")
        });
      }
      return;
    }

    if (has(node, "frac-line") || has(node, "overline-line") ||
        has(node, "underline-line") || has(node, "hline")) {
      out.items.push({
        type: "rule",
        x: x,
        y: baseline,
        w: ctx.width,
        h: Math.max(em((node.style || {}).borderBottomWidth), 0.015)
      });
      return;
    }

    if (isSvg(node)) {
      var paths = [];
      (node.children || []).forEach(function (childNode) {
        if (childNode.alternate) {
          paths.push(childNode.alternate);
        }
      });
      if (paths.length) {
        var box = (node.attributes && node.attributes.viewBox || "0 0 0 0").split(/\s+/).map(Number);
        var svgHeight = ctx.svgHeight || em((node.attributes || {}).height) || 1;
        /* KaTeX stretchy art uses very wide viewBoxes with xMinYMin slice.
           Crop the viewBox to the same leftmost slice here; this avoids
           shrinking the visible art when a rasterizer meets instead. */
        if (box.length === 4 && box[3] > 0 && ctx.width > 0 && svgHeight > 0) {
          box[2] = box[3] * (ctx.width / svgHeight);
        }
        out.items.push({
          type: "svg",
          x: x,
          y: baseline + svgHeight,
          w: ctx.width,
          h: svgHeight,
          viewBox: box,
          paths: paths
        });
      }
      return;
    }

    if (has(node, "vlist")) {
      children = node.children || [];
      for (i = 0; i < children.length; i++) {
        var wrapper = children[i];
        if (has(wrapper, "vlist-s")) continue;
        var ws = wrapper.style || {};
        var pstrut = 0;
        (wrapper.children || []).forEach(function (part) {
          if (has(part, "pstrut")) pstrut = em((part.style || {}).height);
        });
        child = childAfterPstrut(wrapper);
        if (!child) continue;
        /* makeVList stores top = -pstrut - bottom - depth, so the child
           baseline is simply -top - pstrut in positive-up coordinates. */
        var childBaseline = baseline - em(ws.top) - pstrut;
        var childWidth = widthOf(child);
        var offset = em(ws.marginLeft);
        var stretchChild = has(child, "frac-line") || has(child, "overline-line") ||
          has(child, "underline-line") || has(child, "hline") || has(child, "hide-tail");
        if (!stretchChild && ctx.align === "center") offset += Math.max(0, (ctx.width - childWidth) / 2);
        else if (!stretchChild && ctx.align === "right") offset += Math.max(0, ctx.width - childWidth);
        var nextCtx = {width: ctx.width, align: ctx.align, svgHeight: ctx.svgHeight};
        if (has(child, "hide-tail")) nextCtx.svgHeight = em((child.style || {}).height) || node.height || 1;
        layout(child, x + offset, childBaseline, out, nextCtx);
      }
      return;
    }

    if (has(node, "vlist-r")) {
      children = node.children || [];
      for (i = 0; i < children.length; i++) {
        if (has(children[i], "vlist")) {
          layout(children[i], x, baseline, out, ctx);
          return;
        }
      }
      return;
    }

    if (has(node, "vlist-t")) {
      children = node.children || [];
      for (i = 0; i < children.length; i++) {
        if (has(children[i], "vlist-r")) {
          layout(children[i], x, baseline, out, ctx);
          return;
        }
      }
      return;
    }

    var top = em((node.style || {}).top);
    var childBaseline = baseline - top;
    var align = ctx.align;
    if (has(node, "mfrac") || has(node, "col-align-c")) align = "center";
    if (has(node, "col-align-r")) align = "right";
    if (has(node, "col-align-l") || has(node, "svg-align")) align = "left";

    children = node.children || [];
    cursor = x + em((node.style || {}).marginLeft) + em((node.style || {}).paddingLeft);
    var ownWidth = widthOf(node);
    for (i = 0; i < children.length; i++) {
      child = children[i];
      width = widthOf(child);
      var childCtx = {width: width, align: align, svgHeight: ctx.svgHeight};
      if (has(node, "vlist") || has(node, "mfrac")) childCtx.width = ownWidth;
      if (has(node, "hide-tail")) childCtx.width = ctx.width;
      else if (has(child, "frac-line") || has(child, "overline-line") ||
          has(child, "underline-line") || has(child, "hline") ||
          has(child, "hide-tail")) childCtx.width = ownWidth;
      layout(child, cursor, childBaseline, out, childCtx);
      cursor += width;
    }
  }

  function findHtml(node) {
    if (!node) return null;
    if (has(node, "katex-html")) return node;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      var found = findHtml(children[i]);
      if (found) return found;
    }
    return null;
  }

  function layoutTree(node) {
    var html = findHtml(node);
    if (!html) throw new Error("KaTeX HTML tree is missing");
    var out = {items: []};
    var width = widthOf(html);
    layout(html, 0, 0, out, {width: width, align: "left", svgHeight: 1});
    return {
      width: width,
      height: node.height || html.height || 0,
      depth: node.depth || html.depth || 0,
      items: out.items
    };
  }

  globalThis.logseqKatexLayout = function (tex, displayMode) {
    var tree = katex.__renderToDomTree(tex, {
      displayMode: !!displayMode,
      throwOnError: true,
      strict: false
    });
    return JSON.stringify(layoutTree(tree));
  };
}());
