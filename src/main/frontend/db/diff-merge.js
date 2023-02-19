var L = Object.defineProperty;
var F = (r, e, n) => e in r ? L(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n;
var T = (r, e, n) => (F(r, typeof e != "symbol" ? e + "" : e, n), n);
function u() {
  this.Diff_Timeout = 1, this.Diff_EditCost = 4, this.Match_Threshold = 0.5, this.Match_Distance = 1e3, this.Patch_DeleteThreshold = 0.5, this.Patch_Margin = 4, this.Match_MaxBits = 32;
}
var M = -1, A = 1, _ = 0;
u.prototype.diff_main = function(r, e, n, s) {
  typeof s > "u" && (this.Diff_Timeout <= 0 ? s = Number.MAX_VALUE : s = new Date().getTime() + this.Diff_Timeout * 1e3);
  var i = s;
  if (r == null || e == null)
    throw new Error("Null input. (diff_main)");
  if (r == e)
    return r ? [[_, r]] : [];
  typeof n > "u" && (n = !0);
  var t = n, a = this.diff_commonPrefix(r, e), l = r.substring(0, a);
  r = r.substring(a), e = e.substring(a), a = this.diff_commonSuffix(r, e);
  var h = r.substring(r.length - a);
  r = r.substring(0, r.length - a), e = e.substring(0, e.length - a);
  var o = this.diff_compute_(r, e, t, i);
  return l && o.unshift([_, l]), h && o.push([_, h]), this.diff_cleanupMerge(o), o;
};
u.prototype.diff_compute_ = function(r, e, n, s) {
  var i;
  if (!r)
    return [[A, e]];
  if (!e)
    return [[M, r]];
  var t = r.length > e.length ? r : e, a = r.length > e.length ? e : r, l = t.indexOf(a);
  if (l != -1)
    return i = [
      [A, t.substring(0, l)],
      [_, a],
      [A, t.substring(l + a.length)]
    ], r.length > e.length && (i[0][0] = i[2][0] = M), i;
  if (a.length == 1)
    return [[M, r], [A, e]];
  var h = this.diff_halfMatch_(r, e);
  if (h) {
    var o = h[0], f = h[1], g = h[2], c = h[3], v = h[4], b = this.diff_main(o, g, n, s), m = this.diff_main(f, c, n, s);
    return b.concat([[_, v]], m);
  }
  return n && r.length > 100 && e.length > 100 ? this.diff_lineMode_(r, e, s) : this.diff_bisect_(r, e, s);
};
u.prototype.diff_lineMode_ = function(r, e, n) {
  var s = this.diff_linesToChars_(r, e);
  r = s.chars1, e = s.chars2;
  var i = s.lineArray, t = this.diff_main(r, e, !1, n);
  this.diff_charsToLines_(t, i), this.diff_cleanupSemantic(t), t.push([_, ""]);
  for (var a = 0, l = 0, h = 0, o = "", f = ""; a < t.length; ) {
    switch (t[a][0]) {
      case A:
        h++, f += t[a][1];
        break;
      case M:
        l++, o += t[a][1];
        break;
      case _:
        if (l >= 1 && h >= 1) {
          t.splice(
            a - l - h,
            l + h
          ), a = a - l - h;
          for (var s = this.diff_main(o, f, !1, n), g = s.length - 1; g >= 0; g--)
            t.splice(a, 0, s[g]);
          a = a + s.length;
        }
        h = 0, l = 0, o = "", f = "";
        break;
    }
    a++;
  }
  return t.pop(), t;
};
u.prototype.diff_bisect_ = function(r, e, n) {
  for (var s = r.length, i = e.length, t = Math.ceil((s + i) / 2), a = t, l = 2 * t, h = new Array(l), o = new Array(l), f = 0; f < l; f++)
    h[f] = -1, o[f] = -1;
  h[a + 1] = 0, o[a + 1] = 0;
  for (var g = s - i, c = g % 2 != 0, v = 0, b = 0, m = 0, y = 0, d = 0; d < t && !(new Date().getTime() > n); d++) {
    for (var p = -d + v; p <= d - b; p += 2) {
      var w = a + p, k;
      p == -d || p != d && h[w - 1] < h[w + 1] ? k = h[w + 1] : k = h[w - 1] + 1;
      for (var D = k - p; k < s && D < i && r.charAt(k) == e.charAt(D); )
        k++, D++;
      if (h[w] = k, k > s)
        b += 2;
      else if (D > i)
        v += 2;
      else if (c) {
        var B = a + g - p;
        if (B >= 0 && B < l && o[B] != -1) {
          var I = s - o[B];
          if (k >= I)
            return this.diff_bisectSplit_(r, e, k, D, n);
        }
      }
    }
    for (var E = -d + m; E <= d - y; E += 2) {
      var B = a + E, I;
      E == -d || E != d && o[B - 1] < o[B + 1] ? I = o[B + 1] : I = o[B - 1] + 1;
      for (var P = I - E; I < s && P < i && r.charAt(s - I - 1) == e.charAt(i - P - 1); )
        I++, P++;
      if (o[B] = I, I > s)
        y += 2;
      else if (P > i)
        m += 2;
      else if (!c) {
        var w = a + g - E;
        if (w >= 0 && w < l && h[w] != -1) {
          var k = h[w], D = a + k - w;
          if (I = s - I, k >= I)
            return this.diff_bisectSplit_(r, e, k, D, n);
        }
      }
    }
  }
  return [[M, r], [A, e]];
};
u.prototype.diff_bisectSplit_ = function(r, e, n, s, i) {
  var t = r.substring(0, n), a = e.substring(0, s), l = r.substring(n), h = e.substring(s), o = this.diff_main(t, a, !1, i), f = this.diff_main(l, h, !1, i);
  return o.concat(f);
};
u.prototype.diff_linesToChars_ = function(r, e) {
  var n = [], s = {};
  n[0] = "";
  function i(l) {
    for (var h = "", o = 0, f = -1, g = n.length; f < l.length - 1; ) {
      f = l.indexOf(`
`, o), f == -1 && (f = l.length - 1);
      var c = l.substring(o, f + 1);
      o = f + 1, (s.hasOwnProperty ? s.hasOwnProperty(c) : s[c] !== void 0) ? h += String.fromCharCode(s[c]) : (h += String.fromCharCode(g), s[c] = g, n[g++] = c);
    }
    return h;
  }
  var t = i(r), a = i(e);
  return { chars1: t, chars2: a, lineArray: n };
};
u.prototype.diff_charsToLines_ = function(r, e) {
  for (var n = 0; n < r.length; n++) {
    for (var s = r[n][1], i = [], t = 0; t < s.length; t++)
      i[t] = e[s.charCodeAt(t)];
    r[n][1] = i.join("");
  }
};
u.prototype.diff_commonPrefix = function(r, e) {
  if (!r || !e || r.charAt(0) != e.charAt(0))
    return 0;
  for (var n = 0, s = Math.min(r.length, e.length), i = s, t = 0; n < i; )
    r.substring(t, i) == e.substring(t, i) ? (n = i, t = n) : s = i, i = Math.floor((s - n) / 2 + n);
  return i;
};
u.prototype.diff_commonSuffix = function(r, e) {
  if (!r || !e || r.charAt(r.length - 1) != e.charAt(e.length - 1))
    return 0;
  for (var n = 0, s = Math.min(r.length, e.length), i = s, t = 0; n < i; )
    r.substring(r.length - i, r.length - t) == e.substring(e.length - i, e.length - t) ? (n = i, t = n) : s = i, i = Math.floor((s - n) / 2 + n);
  return i;
};
u.prototype.diff_commonOverlap_ = function(r, e) {
  var n = r.length, s = e.length;
  if (n == 0 || s == 0)
    return 0;
  n > s ? r = r.substring(n - s) : n < s && (e = e.substring(0, n));
  var i = Math.min(n, s);
  if (r == e)
    return i;
  for (var t = 0, a = 1; ; ) {
    var l = r.substring(i - a), h = e.indexOf(l);
    if (h == -1)
      return t;
    a += h, (h == 0 || r.substring(i - a) == e.substring(0, a)) && (t = a, a++);
  }
};
u.prototype.diff_halfMatch_ = function(r, e) {
  if (this.Diff_Timeout <= 0)
    return null;
  var n = r.length > e.length ? r : e, s = r.length > e.length ? e : r;
  if (n.length < 4 || s.length * 2 < n.length)
    return null;
  var i = this;
  function t(b, m, y) {
    for (var d = b.substring(y, y + Math.floor(b.length / 4)), p = -1, w = "", k, D, B, I; (p = m.indexOf(d, p + 1)) != -1; ) {
      var E = i.diff_commonPrefix(
        b.substring(y),
        m.substring(p)
      ), P = i.diff_commonSuffix(
        b.substring(0, y),
        m.substring(0, p)
      );
      w.length < P + E && (w = m.substring(p - P, p) + m.substring(p, p + E), k = b.substring(0, y - P), D = b.substring(y + E), B = m.substring(0, p - P), I = m.substring(p + E));
    }
    return w.length * 2 >= b.length ? [
      k,
      D,
      B,
      I,
      w
    ] : null;
  }
  var a = t(
    n,
    s,
    Math.ceil(n.length / 4)
  ), l = t(
    n,
    s,
    Math.ceil(n.length / 2)
  ), h;
  if (!a && !l)
    return null;
  l ? a ? h = a[4].length > l[4].length ? a : l : h = l : h = a;
  var o, f, g, c;
  r.length > e.length ? (o = h[0], f = h[1], g = h[2], c = h[3]) : (g = h[0], c = h[1], o = h[2], f = h[3]);
  var v = h[4];
  return [o, f, g, c, v];
};
u.prototype.diff_cleanupSemantic = function(r) {
  for (var e = !1, n = [], s = 0, i = null, t = 0, a = 0, l = 0, h = 0, o = 0; t < r.length; )
    r[t][0] == _ ? (n[s++] = t, a = h, l = o, h = 0, o = 0, i = r[t][1]) : (r[t][0] == A ? h += r[t][1].length : o += r[t][1].length, i && i.length <= Math.max(a, l) && i.length <= Math.max(
      h,
      o
    ) && (r.splice(
      n[s - 1],
      0,
      [M, i]
    ), r[n[s - 1] + 1][0] = A, s--, s--, t = s > 0 ? n[s - 1] : -1, a = 0, l = 0, h = 0, o = 0, i = null, e = !0)), t++;
  for (e && this.diff_cleanupMerge(r), this.diff_cleanupSemanticLossless(r), t = 1; t < r.length; ) {
    if (r[t - 1][0] == M && r[t][0] == A) {
      var f = r[t - 1][1], g = r[t][1], c = this.diff_commonOverlap_(f, g), v = this.diff_commonOverlap_(g, f);
      c >= v ? (c >= f.length / 2 || c >= g.length / 2) && (r.splice(
        t,
        0,
        [_, g.substring(0, c)]
      ), r[t - 1][1] = f.substring(0, f.length - c), r[t + 1][1] = g.substring(c), t++) : (v >= f.length / 2 || v >= g.length / 2) && (r.splice(
        t,
        0,
        [_, f.substring(0, v)]
      ), r[t - 1][0] = A, r[t - 1][1] = g.substring(0, g.length - v), r[t + 1][0] = M, r[t + 1][1] = f.substring(v), t++), t++;
    }
    t++;
  }
};
u.prototype.diff_cleanupSemanticLossless = function(r) {
  function e(v, b) {
    if (!v || !b)
      return 6;
    var m = v.charAt(v.length - 1), y = b.charAt(0), d = m.match(u.nonAlphaNumericRegex_), p = y.match(u.nonAlphaNumericRegex_), w = d && m.match(u.whitespaceRegex_), k = p && y.match(u.whitespaceRegex_), D = w && m.match(u.linebreakRegex_), B = k && y.match(u.linebreakRegex_), I = D && v.match(u.blanklineEndRegex_), E = B && b.match(u.blanklineStartRegex_);
    return I || E ? 5 : D || B ? 4 : d && !w && k ? 3 : w || k ? 2 : d || p ? 1 : 0;
  }
  for (var n = 1; n < r.length - 1; ) {
    if (r[n - 1][0] == _ && r[n + 1][0] == _) {
      var s = r[n - 1][1], i = r[n][1], t = r[n + 1][1], a = this.diff_commonSuffix(s, i);
      if (a) {
        var l = i.substring(i.length - a);
        s = s.substring(0, s.length - a), i = l + i.substring(0, i.length - a), t = l + t;
      }
      for (var h = s, o = i, f = t, g = e(s, i) + e(i, t); i.charAt(0) === t.charAt(0); ) {
        s += i.charAt(0), i = i.substring(1) + t.charAt(0), t = t.substring(1);
        var c = e(s, i) + e(i, t);
        c >= g && (g = c, h = s, o = i, f = t);
      }
      r[n - 1][1] != h && (h ? r[n - 1][1] = h : (r.splice(n - 1, 1), n--), r[n][1] = o, f ? r[n + 1][1] = f : (r.splice(n + 1, 1), n--));
    }
    n++;
  }
};
u.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
u.whitespaceRegex_ = /\s/;
u.linebreakRegex_ = /[\r\n]/;
u.blanklineEndRegex_ = /\n\r?\n$/;
u.blanklineStartRegex_ = /^\r?\n\r?\n/;
u.prototype.diff_cleanupEfficiency = function(r) {
  for (var e = !1, n = [], s = 0, i = null, t = 0, a = !1, l = !1, h = !1, o = !1; t < r.length; )
    r[t][0] == _ ? (r[t][1].length < this.Diff_EditCost && (h || o) ? (n[s++] = t, a = h, l = o, i = r[t][1]) : (s = 0, i = null), h = o = !1) : (r[t][0] == M ? o = !0 : h = !0, i && (a && l && h && o || i.length < this.Diff_EditCost / 2 && a + l + h + o == 3) && (r.splice(
      n[s - 1],
      0,
      [M, i]
    ), r[n[s - 1] + 1][0] = A, s--, i = null, a && l ? (h = o = !0, s = 0) : (s--, t = s > 0 ? n[s - 1] : -1, h = o = !1), e = !0)), t++;
  e && this.diff_cleanupMerge(r);
};
u.prototype.diff_cleanupMerge = function(r) {
  r.push([_, ""]);
  for (var e = 0, n = 0, s = 0, i = "", t = "", a; e < r.length; )
    switch (r[e][0]) {
      case A:
        s++, t += r[e][1], e++;
        break;
      case M:
        n++, i += r[e][1], e++;
        break;
      case _:
        n + s > 1 ? (n !== 0 && s !== 0 && (a = this.diff_commonPrefix(t, i), a !== 0 && (e - n - s > 0 && r[e - n - s - 1][0] == _ ? r[e - n - s - 1][1] += t.substring(0, a) : (r.splice(0, 0, [
          _,
          t.substring(0, a)
        ]), e++), t = t.substring(a), i = i.substring(a)), a = this.diff_commonSuffix(t, i), a !== 0 && (r[e][1] = t.substring(t.length - a) + r[e][1], t = t.substring(0, t.length - a), i = i.substring(0, i.length - a))), n === 0 ? r.splice(
          e - s,
          n + s,
          [A, t]
        ) : s === 0 ? r.splice(
          e - n,
          n + s,
          [M, i]
        ) : r.splice(
          e - n - s,
          n + s,
          [M, i],
          [A, t]
        ), e = e - n - s + (n ? 1 : 0) + (s ? 1 : 0) + 1) : e !== 0 && r[e - 1][0] == _ ? (r[e - 1][1] += r[e][1], r.splice(e, 1)) : e++, s = 0, n = 0, i = "", t = "";
        break;
    }
  r[r.length - 1][1] === "" && r.pop();
  var l = !1;
  for (e = 1; e < r.length - 1; )
    r[e - 1][0] == _ && r[e + 1][0] == _ && (r[e][1].substring(r[e][1].length - r[e - 1][1].length) == r[e - 1][1] ? (r[e][1] = r[e - 1][1] + r[e][1].substring(0, r[e][1].length - r[e - 1][1].length), r[e + 1][1] = r[e - 1][1] + r[e + 1][1], r.splice(e - 1, 1), l = !0) : r[e][1].substring(0, r[e + 1][1].length) == r[e + 1][1] && (r[e - 1][1] += r[e + 1][1], r[e][1] = r[e][1].substring(r[e + 1][1].length) + r[e + 1][1], r.splice(e + 1, 1), l = !0)), e++;
  l && this.diff_cleanupMerge(r);
};
u.prototype.diff_xIndex = function(r, e) {
  var n = 0, s = 0, i = 0, t = 0, a;
  for (a = 0; a < r.length && (r[a][0] !== A && (n += r[a][1].length), r[a][0] !== M && (s += r[a][1].length), !(n > e)); a++)
    i = n, t = s;
  return r.length != a && r[a][0] === M ? t : t + (e - i);
};
u.prototype.diff_prettyHtml = function(r) {
  for (var e = [], n = /&/g, s = /</g, i = />/g, t = /\n/g, a = 0; a < r.length; a++) {
    var l = r[a][0], h = r[a][1], o = h.replace(n, "&amp;").replace(s, "&lt;").replace(i, "&gt;").replace(t, "&para;<br>");
    switch (l) {
      case A:
        e[a] = '<ins style="background:#e6ffe6;">' + o + "</ins>";
        break;
      case M:
        e[a] = '<del style="background:#ffe6e6;">' + o + "</del>";
        break;
      case _:
        e[a] = "<span>" + o + "</span>";
        break;
    }
  }
  return e.join("");
};
u.prototype.diff_text1 = function(r) {
  for (var e = [], n = 0; n < r.length; n++)
    r[n][0] !== A && (e[n] = r[n][1]);
  return e.join("");
};
u.prototype.diff_text2 = function(r) {
  for (var e = [], n = 0; n < r.length; n++)
    r[n][0] !== M && (e[n] = r[n][1]);
  return e.join("");
};
u.prototype.diff_levenshtein = function(r) {
  for (var e = 0, n = 0, s = 0, i = 0; i < r.length; i++) {
    var t = r[i][0], a = r[i][1];
    switch (t) {
      case A:
        n += a.length;
        break;
      case M:
        s += a.length;
        break;
      case _:
        e += Math.max(n, s), n = 0, s = 0;
        break;
    }
  }
  return e += Math.max(n, s), e;
};
u.prototype.diff_toDelta = function(r) {
  for (var e = [], n = 0; n < r.length; n++)
    switch (r[n][0]) {
      case A:
        e[n] = "+" + encodeURI(r[n][1]);
        break;
      case M:
        e[n] = "-" + r[n][1].length;
        break;
      case _:
        e[n] = "=" + r[n][1].length;
        break;
    }
  return e.join("	").replace(/%20/g, " ");
};
u.prototype.diff_fromDelta = function(r, e) {
  for (var n = [], s = 0, i = 0, t = e.split(/\t/g), a = 0; a < t.length; a++) {
    var l = t[a].substring(1);
    switch (t[a].charAt(0)) {
      case "+":
        try {
          n[s++] = [A, decodeURI(l)];
        } catch {
          throw new Error("Illegal escape in diff_fromDelta: " + l);
        }
        break;
      case "-":
      case "=":
        var h = parseInt(l, 10);
        if (isNaN(h) || h < 0)
          throw new Error("Invalid number in diff_fromDelta: " + l);
        var o = r.substring(i, i += h);
        t[a].charAt(0) == "=" ? n[s++] = [_, o] : n[s++] = [M, o];
        break;
      default:
        if (t[a])
          throw new Error("Invalid diff operation in diff_fromDelta: " + t[a]);
    }
  }
  if (i != r.length)
    throw new Error("Delta length (" + i + ") does not equal source text length (" + r.length + ").");
  return n;
};
u.prototype.match_main = function(r, e, n) {
  if (r == null || e == null || n == null)
    throw new Error("Null input. (match_main)");
  return n = Math.max(0, Math.min(n, r.length)), r == e ? 0 : r.length ? r.substring(n, n + e.length) == e ? n : this.match_bitap_(r, e, n) : -1;
};
u.prototype.match_bitap_ = function(r, e, n) {
  if (e.length > this.Match_MaxBits)
    throw new Error("Pattern too long for this browser.");
  var s = this.match_alphabet_(e), i = this;
  function t(k, D) {
    var B = k / e.length, I = Math.abs(n - D);
    return i.Match_Distance ? B + I / i.Match_Distance : I ? 1 : B;
  }
  var a = this.Match_Threshold, l = r.indexOf(e, n);
  l != -1 && (a = Math.min(t(0, l), a), l = r.lastIndexOf(e, n + e.length), l != -1 && (a = Math.min(t(0, l), a)));
  var h = 1 << e.length - 1;
  l = -1;
  for (var o, f, g = e.length + r.length, c, v = 0; v < e.length; v++) {
    for (o = 0, f = g; o < f; )
      t(v, n + f) <= a ? o = f : g = f, f = Math.floor((g - o) / 2 + o);
    g = f;
    var b = Math.max(1, n - f + 1), m = Math.min(n + f, r.length) + e.length, y = Array(m + 2);
    y[m + 1] = (1 << v) - 1;
    for (var d = m; d >= b; d--) {
      var p = s[r.charAt(d - 1)];
      if (v === 0 ? y[d] = (y[d + 1] << 1 | 1) & p : y[d] = (y[d + 1] << 1 | 1) & p | ((c[d + 1] | c[d]) << 1 | 1) | c[d + 1], y[d] & h) {
        var w = t(v, d - 1);
        if (w <= a)
          if (a = w, l = d - 1, l > n)
            b = Math.max(1, 2 * n - l);
          else
            break;
      }
    }
    if (t(v + 1, n) > a)
      break;
    c = y;
  }
  return l;
};
u.prototype.match_alphabet_ = function(r) {
  for (var e = {}, n = 0; n < r.length; n++)
    e[r.charAt(n)] = 0;
  for (var n = 0; n < r.length; n++)
    e[r.charAt(n)] |= 1 << r.length - n - 1;
  return e;
};
u.prototype.patch_addContext_ = function(r, e) {
  if (e.length != 0) {
    for (var n = e.substring(r.start2, r.start2 + r.length1), s = 0; e.indexOf(n) != e.lastIndexOf(n) && n.length < this.Match_MaxBits - this.Patch_Margin - this.Patch_Margin; )
      s += this.Patch_Margin, n = e.substring(
        r.start2 - s,
        r.start2 + r.length1 + s
      );
    s += this.Patch_Margin;
    var i = e.substring(r.start2 - s, r.start2);
    i && r.diffs.unshift([_, i]);
    var t = e.substring(
      r.start2 + r.length1,
      r.start2 + r.length1 + s
    );
    t && r.diffs.push([_, t]), r.start1 -= i.length, r.start2 -= i.length, r.length1 += i.length + t.length, r.length2 += i.length + t.length;
  }
};
u.prototype.patch_make = function(r, e, n) {
  var s, i;
  if (typeof r == "string" && typeof e == "string" && typeof n > "u")
    s = /** @type {string} */
    r, i = this.diff_main(
      s,
      /** @type {string} */
      e,
      !0
    ), i.length > 2 && (this.diff_cleanupSemantic(i), this.diff_cleanupEfficiency(i));
  else if (r && typeof r == "object" && typeof e > "u" && typeof n > "u")
    i = /** @type {!Array.<!diff_match_patch.Diff>} */
    r, s = this.diff_text1(i);
  else if (typeof r == "string" && e && typeof e == "object" && typeof n > "u")
    s = /** @type {string} */
    r, i = /** @type {!Array.<!diff_match_patch.Diff>} */
    e;
  else if (typeof r == "string" && typeof e == "string" && n && typeof n == "object")
    s = /** @type {string} */
    r, i = /** @type {!Array.<!diff_match_patch.Diff>} */
    n;
  else
    throw new Error("Unknown call format to patch_make.");
  if (i.length === 0)
    return [];
  for (var t = [], a = new u.patch_obj(), l = 0, h = 0, o = 0, f = s, g = s, c = 0; c < i.length; c++) {
    var v = i[c][0], b = i[c][1];
    switch (!l && v !== _ && (a.start1 = h, a.start2 = o), v) {
      case A:
        a.diffs[l++] = i[c], a.length2 += b.length, g = g.substring(0, o) + b + g.substring(o);
        break;
      case M:
        a.length1 += b.length, a.diffs[l++] = i[c], g = g.substring(0, o) + g.substring(o + b.length);
        break;
      case _:
        b.length <= 2 * this.Patch_Margin && l && i.length != c + 1 ? (a.diffs[l++] = i[c], a.length1 += b.length, a.length2 += b.length) : b.length >= 2 * this.Patch_Margin && l && (this.patch_addContext_(a, f), t.push(a), a = new u.patch_obj(), l = 0, f = g, h = o);
        break;
    }
    v !== A && (h += b.length), v !== M && (o += b.length);
  }
  return l && (this.patch_addContext_(a, f), t.push(a)), t;
};
u.prototype.patch_deepCopy = function(r) {
  for (var e = [], n = 0; n < r.length; n++) {
    var s = r[n], i = new u.patch_obj();
    i.diffs = [];
    for (var t = 0; t < s.diffs.length; t++)
      i.diffs[t] = s.diffs[t].slice();
    i.start1 = s.start1, i.start2 = s.start2, i.length1 = s.length1, i.length2 = s.length2, e[n] = i;
  }
  return e;
};
u.prototype.patch_apply = function(r, e) {
  if (r.length == 0)
    return [e, []];
  r = this.patch_deepCopy(r);
  var n = this.patch_addPadding(r);
  e = n + e + n, this.patch_splitMax(r);
  for (var s = 0, i = [], t = 0; t < r.length; t++) {
    var a = r[t].start2 + s, l = this.diff_text1(r[t].diffs), h, o = -1;
    if (l.length > this.Match_MaxBits ? (h = this.match_main(
      e,
      l.substring(0, this.Match_MaxBits),
      a
    ), h != -1 && (o = this.match_main(
      e,
      l.substring(l.length - this.Match_MaxBits),
      a + l.length - this.Match_MaxBits
    ), (o == -1 || h >= o) && (h = -1))) : h = this.match_main(e, l, a), h == -1)
      i[t] = !1, s -= r[t].length2 - r[t].length1;
    else {
      i[t] = !0, s = h - a;
      var f;
      if (o == -1 ? f = e.substring(h, h + l.length) : f = e.substring(h, o + this.Match_MaxBits), l == f)
        e = e.substring(0, h) + this.diff_text2(r[t].diffs) + e.substring(h + l.length);
      else {
        var g = this.diff_main(l, f, !1);
        if (l.length > this.Match_MaxBits && this.diff_levenshtein(g) / l.length > this.Patch_DeleteThreshold)
          i[t] = !1;
        else {
          this.diff_cleanupSemanticLossless(g);
          for (var c = 0, v, b = 0; b < r[t].diffs.length; b++) {
            var m = r[t].diffs[b];
            m[0] !== _ && (v = this.diff_xIndex(g, c)), m[0] === A ? e = e.substring(0, h + v) + m[1] + e.substring(h + v) : m[0] === M && (e = e.substring(0, h + v) + e.substring(h + this.diff_xIndex(
              g,
              c + m[1].length
            ))), m[0] !== M && (c += m[1].length);
          }
        }
      }
    }
  }
  return e = e.substring(n.length, e.length - n.length), [e, i];
};
u.prototype.patch_addPadding = function(r) {
  for (var e = this.Patch_Margin, n = "", s = 1; s <= e; s++)
    n += String.fromCharCode(s);
  for (var s = 0; s < r.length; s++)
    r[s].start1 += e, r[s].start2 += e;
  var i = r[0], t = i.diffs;
  if (t.length == 0 || t[0][0] != _)
    t.unshift([_, n]), i.start1 -= e, i.start2 -= e, i.length1 += e, i.length2 += e;
  else if (e > t[0][1].length) {
    var a = e - t[0][1].length;
    t[0][1] = n.substring(t[0][1].length) + t[0][1], i.start1 -= a, i.start2 -= a, i.length1 += a, i.length2 += a;
  }
  if (i = r[r.length - 1], t = i.diffs, t.length == 0 || t[t.length - 1][0] != _)
    t.push([_, n]), i.length1 += e, i.length2 += e;
  else if (e > t[t.length - 1][1].length) {
    var a = e - t[t.length - 1][1].length;
    t[t.length - 1][1] += n.substring(0, a), i.length1 += a, i.length2 += a;
  }
  return n;
};
u.prototype.patch_splitMax = function(r) {
  for (var e = this.Match_MaxBits, n = 0; n < r.length; n++)
    if (!(r[n].length1 <= e)) {
      var s = r[n];
      r.splice(n--, 1);
      for (var i = s.start1, t = s.start2, a = ""; s.diffs.length !== 0; ) {
        var l = new u.patch_obj(), h = !0;
        for (l.start1 = i - a.length, l.start2 = t - a.length, a !== "" && (l.length1 = l.length2 = a.length, l.diffs.push([_, a])); s.diffs.length !== 0 && l.length1 < e - this.Patch_Margin; ) {
          var o = s.diffs[0][0], f = s.diffs[0][1];
          o === A ? (l.length2 += f.length, t += f.length, l.diffs.push(s.diffs.shift()), h = !1) : o === M && l.diffs.length == 1 && l.diffs[0][0] == _ && f.length > 2 * e ? (l.length1 += f.length, i += f.length, h = !1, l.diffs.push([o, f]), s.diffs.shift()) : (f = f.substring(
            0,
            e - l.length1 - this.Patch_Margin
          ), l.length1 += f.length, i += f.length, o === _ ? (l.length2 += f.length, t += f.length) : h = !1, l.diffs.push([o, f]), f == s.diffs[0][1] ? s.diffs.shift() : s.diffs[0][1] = s.diffs[0][1].substring(f.length));
        }
        a = this.diff_text2(l.diffs), a = a.substring(a.length - this.Patch_Margin);
        var g = this.diff_text1(s.diffs).substring(0, this.Patch_Margin);
        g !== "" && (l.length1 += g.length, l.length2 += g.length, l.diffs.length !== 0 && l.diffs[l.diffs.length - 1][0] === _ ? l.diffs[l.diffs.length - 1][1] += g : l.diffs.push([_, g])), h || r.splice(++n, 0, l);
      }
    }
};
u.prototype.patch_toText = function(r) {
  for (var e = [], n = 0; n < r.length; n++)
    e[n] = r[n];
  return e.join("");
};
u.prototype.patch_fromText = function(r) {
  var e = [];
  if (!r)
    return e;
  for (var n = r.split(`
`), s = 0, i = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/; s < n.length; ) {
    var t = n[s].match(i);
    if (!t)
      throw new Error("Invalid patch string: " + n[s]);
    var a = new u.patch_obj();
    for (e.push(a), a.start1 = parseInt(t[1], 10), t[2] === "" ? (a.start1--, a.length1 = 1) : t[2] == "0" ? a.length1 = 0 : (a.start1--, a.length1 = parseInt(t[2], 10)), a.start2 = parseInt(t[3], 10), t[4] === "" ? (a.start2--, a.length2 = 1) : t[4] == "0" ? a.length2 = 0 : (a.start2--, a.length2 = parseInt(t[4], 10)), s++; s < n.length; ) {
      var l = n[s].charAt(0);
      try {
        var h = decodeURI(n[s].substring(1));
      } catch {
        throw new Error("Illegal escape in patch_fromText: " + h);
      }
      if (l == "-")
        a.diffs.push([M, h]);
      else if (l == "+")
        a.diffs.push([A, h]);
      else if (l == " ")
        a.diffs.push([_, h]);
      else {
        if (l == "@")
          break;
        if (l !== "")
          throw new Error('Invalid patch mode "' + l + '" in: ' + h);
      }
      s++;
    }
  }
  return e;
};
u.patch_obj = function() {
  this.diffs = [], this.start1 = null, this.start2 = null, this.length1 = 0, this.length2 = 0;
};
u.patch_obj.prototype.toString = function() {
  var r, e;
  this.length1 === 0 ? r = this.start1 + ",0" : this.length1 == 1 ? r = this.start1 + 1 : r = this.start1 + 1 + "," + this.length1, this.length2 === 0 ? e = this.start2 + ",0" : this.length2 == 1 ? e = this.start2 + 1 : e = this.start2 + 1 + "," + this.length2;
  for (var n = ["@@ -" + r + " +" + e + ` @@
`], s, i = 0; i < this.diffs.length; i++) {
    switch (this.diffs[i][0]) {
      case A:
        s = "+";
        break;
      case M:
        s = "-";
        break;
      case _:
        s = " ";
        break;
    }
    n[i + 1] = s + encodeURI(this.diffs[i][1]) + `
`;
  }
  return n.join("").replace(/%20/g, " ");
};
const R = JSON.stringify({
  format: "Markdown",
  toc: !1,
  parse_outline_only: !1,
  export_md_remove_options: [],
  heading_to_list: !1,
  heading_number: !1,
  keep_line_break: !0
}), N = /^(\s*)/;
class H {
  constructor(e, n = R) {
    T(this, "mldoc");
    T(this, "config");
    T(this, "format");
    T(this, "byteEncoder", new TextEncoder());
    T(this, "byteDecoder", new TextDecoder());
    this.mldoc = e, this.config = n, this.format = JSON.parse(n).format;
  }
  parse(e) {
    return JSON.parse(this.mldoc.parseJson(e, this.config));
  }
  /**
   * 
   * @param text 
   * @returns block bodies and their indents
   */
  parseBlocks(e) {
    const n = [], s = this.parse(e), i = this.byteEncoder.encode(e);
    for (const l of s) {
      const h = l[1], o = i.slice(h.start_pos, h.end_pos), f = this.byteDecoder.decode(o);
      f[f.length - 1] === `
` ? n.push(f.substring(0, f.length - 1)) : n.push(f);
    }
    const t = [];
    let a = [];
    for (let l = 0; l < s.length; l++) {
      if (s[l][0][0] != "Heading") {
        a.push(n[l]);
        continue;
      }
      a.length > 0 && t.push(a.join(`
`)), a = [], a.push(n[l]);
    }
    return a.length > 0 && t.push(a.join(`
`)), t;
  }
  parseMarkdownBlocksAndIndents(e) {
    const n = this.parseBlocks(e), s = [], i = [];
    for (const t of n) {
      const a = t.split(`
`), l = [], h = [];
      for (const o of a) {
        const f = N.exec(o), g = (f == null ? void 0 : f[1]) || "", c = o.substring(g.length, o.length);
        l.push(g), h.push(c);
      }
      i.push(l), s.push(h);
    }
    return [s, i];
  }
  /**
   * 
   * @param text 
   * @returns the line bodies and their indents, indexed by block, without EOL
   */
  parseBlocksAndIndents(e) {
    if (this.format === "Markdown")
      return this.parseMarkdownBlocksAndIndents(e);
    throw new Error(`Unimplemented format: ${this.format}`);
  }
}
function O(r, e) {
  return e.map((s, i) => r[i] + s).join(`
`);
}
var C = /* @__PURE__ */ ((r) => (r[r.DIFF_DELETE = -1] = "DIFF_DELETE", r[r.DIFF_EQUAL = 0] = "DIFF_EQUAL", r[r.DIFF_INSERT = 1] = "DIFF_INSERT", r))(C || {});
class j {
  // Keeping our own length variable is faster than looking it up.
  /**
   * Storing the block->char hash table
   * CharHash for one transact (merging), call the base version first to ensure best indent resolution
   * > 65536 blocks might break DMP (see WATCH OUT 1)
   * It's tolerable for our use case as LCS doesn't require the char to be unique
   */
  constructor() {
    T(this, "blockArray");
    // e.g. blockArray[4] == ['Hello','World']
    // Case that the indent changes are lost - so we need to overwrite it by the different from the based one
    T(this, "blockHash");
    // e.g. blockHash['Hello\nWorld'] == 4
    T(this, "blockArrayLength", 0);
    this.blockArray = [], this.blockArray[0] = [""], this.blockHash = /* @__PURE__ */ new Map();
  }
  /**
   * We have to keep indents of each block to ensure the best indent resolution
   * @param allLinesByBlock the lines, in the index of block (string[blockIdx][lineIdx])
   * @return Encoded string and all indents by block
  */
  diff_blocksToChars(e) {
    let n = [];
    for (const i of e) {
      const t = i.join(`
`);
      if (this.blockHash.has(t)) {
        const a = this.blockHash.get(t);
        n.push(a);
      } else
        n.push(this.blockArrayLength), this.blockHash.set(t, this.blockArrayLength), this.blockArray[this.blockArrayLength] = i, this.blockArrayLength += 1;
    }
    return String.fromCodePoint(...n);
  }
  /**
   * The golden standard of indentation is the blockIndentsTar
   * 
   * @returns the diff of the blocks, with the original block position as index
   *   [  // #1 block of the original text
   *      [
   *         [0, ...], // Keep the first block
   *      ],
   *      // #2 block of the original text
   *      [
   *         [-1, ...], // Delete the original second block
   *         [1, ...], // Insert a new line at the position
   *         [1, ...], // Insert another new line at the same position
   *      ],
   *      // #3 block of the original text
   *      [
   *        [0, ...], // Keep the third block
   *        [1, ...], // Insert a new block at the same position
   *      ],
   * ]
   */
  diff_charsToBlocks(e, n, s) {
    const i = [];
    let t = -1, a = -1, l = 0;
    for (var h = 0; h < e.length; h++) {
      const o = e[h][0], f = e[h][1];
      if (o != 1) {
        o == -1 && (l = i.length);
        for (const g of f) {
          let c = g.codePointAt(0), v;
          o == 0 ? (t += 1, a += 1, v = [e[h][0], s[a], this.blockArray[c]]) : (t += 1, v = [e[h][0], n[t], this.blockArray[c]]), i.push([v]);
        }
        o == 0 && (l = i.length - 1);
      } else
        for (const g of f) {
          let c = g.codePointAt(0);
          a += 1;
          const v = [e[h][0], s[a], this.blockArray[c]];
          i[l] === void 0 && (i[l] = []), i[l].push(v);
        }
    }
    return i;
  }
}
function U(r, e = "", n = "") {
  const [s, i, t] = r;
  return O(i, t).split(`
`).map((o, f) => f == 0 ? n + o : e + o).join(`
`);
}
function z(r) {
  const e = document.createElement("div"), n = document.createElement("div");
  n.classList.add("diff-equal"), n.innerText = `BlockPos | Text
----------------------------------------------------------------------------------------------------`, e.appendChild(n);
  for (const [s, i] of r.entries())
    for (const t of i) {
      const [a, l] = t, o = U(t, "		|", `${s}		|`);
      switch (a) {
        case 1:
          const f = document.createElement("div");
          f.style.backgroundColor = "#e6ffed", f.style.color = "#24292e", f.style.padding = "0 0.2em", f.style.borderRadius = "0.2em", f.style.whiteSpace = "pre", f.innerText = o, e.appendChild(f);
          break;
        case 0:
          const g = document.createElement("div");
          g.style.backgroundColor = "#f6f8fa", g.style.color = "#24292e", g.style.padding = "0 0.2em", g.style.borderRadius = "0.2em", g.style.whiteSpace = "pre", g.innerText = o, e.appendChild(g);
          break;
        case -1:
          const c = document.createElement("div");
          c.style.backgroundColor = "#ffeef0", c.style.color = "#24292e", c.style.padding = "0 0.2em", c.style.borderRadius = "0.2em", c.style.textDecoration = "line-through", c.style.whiteSpace = "pre", c.innerText = o, e.appendChild(c);
          break;
      }
    }
  return e;
}
class Q {
  /**
   * Can be used for only one time (charHash is shared) with maximum 65536 blocks
   */
  constructor(e = 1) {
    T(this, "dmp", new u());
    T(this, "charHash", new j());
    this.dmp.Diff_Timeout = e;
  }
  diff_logseqMode(e, n, s, i) {
    const t = this.charHash.diff_blocksToChars(e), a = this.charHash.diff_blocksToChars(n), l = this.dmp.diff_main(t, a, !1);
    return this.charHash.diff_charsToBlocks(l, s, i);
  }
}
function S(r) {
  const e = [[], [], []];
  for (const n of r)
    e[n[0] + 1].push(n);
  return e;
}
function J(r, e) {
  for (let n = 0; n < 3; n++)
    r[n] = r[n].concat(e[n]);
}
class W {
  /**
   * Merger with max 65536 unique blocks support
   *
   * @param timeout optional the timeout for the diff algorithm (in sec, 1 sec by default)
   */
  constructor(e, n) {
    T(this, "parser");
    this.parser = new H(e, n);
  }
  /**
   * 
   * @param baseText the base text (the text to be merged into, the anchor of block index)
   * @param branchTexts  the texts to be merged
   * @returns the DMP operations of the final merged text (to be applied on the base text)
   *   resolvedDiffs[blockPos][DMPOP id][DMPOPType, text]
   *   where blockPos is the block # in the baseText
   */
  mergeBranches(e, n) {
    const s = new Q(1), [i, t] = this.parser.parseBlocksAndIndents(e), a = n.map((f) => {
      const [g, c] = this.parser.parseBlocksAndIndents(f);
      return s.diff_logseqMode(i, g, t, c);
    }), l = [], h = a.reduce((f, g) => {
      for (const [c, v] of g.entries())
        f[c] === void 0 ? f[c] = S(v) : J(f[c], S(v));
      return f;
    }, l), o = [];
    for (const [f, g] of h.entries()) {
      const [c, v, b] = g;
      if (c.length >= 1) {
        const d = c[0][2], p = t[f];
        o.push([[C.DIFF_DELETE, p, d]]);
      } else if (v.length >= 1) {
        const d = v[0][2], p = t[f], w = v.reduce((k, [D, B, I]) => k.join(`
`) === p.join(`
`) ? B : k, p);
        o.push([[C.DIFF_EQUAL, w, d]]);
      } else
        console.warn("No DIFF_EQUAL or DIFF_DELETE");
      const m = /* @__PURE__ */ new Set(), y = b.filter(([d, p, w]) => {
        const k = w.join(`
`);
        return m.has(k) ? !1 : (m.add(k), !0);
      });
      o[o.length - 1] = o[o.length - 1].concat(y);
    }
    return o;
  }
  merge(e, ...n) {
    return this.mergeBranches(e, n);
  }
}
export {
  Q as Differ,
  W as Merger,
  H as Parser,
  z as visualizeAsHTML
};
