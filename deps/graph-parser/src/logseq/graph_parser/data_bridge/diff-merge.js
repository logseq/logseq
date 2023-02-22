var P = Object.defineProperty;
var H = (e, n, r) => n in e ? P(e, n, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[n] = r;
var F = (e, n, r) => (H(e, typeof n != "symbol" ? n + "" : n, r), r);
function v() {
  this.Diff_Timeout = 1, this.Diff_EditCost = 4, this.Match_Threshold = 0.5, this.Match_Distance = 1e3, this.Patch_DeleteThreshold = 0.5, this.Patch_Margin = 4, this.Match_MaxBits = 32;
}
var w = -1, I = 1, b = 0;
v.prototype.diff_main = function(e, n, r, s) {
  typeof s > "u" && (this.Diff_Timeout <= 0 ? s = Number.MAX_VALUE : s = new Date().getTime() + this.Diff_Timeout * 1e3);
  var i = s;
  if (e == null || n == null)
    throw new Error("Null input. (diff_main)");
  if (e == n)
    return e ? [[b, e]] : [];
  typeof r > "u" && (r = !0);
  var t = r, a = this.diff_commonPrefix(e, n), l = e.substring(0, a);
  e = e.substring(a), n = n.substring(a), a = this.diff_commonSuffix(e, n);
  var o = e.substring(e.length - a);
  e = e.substring(0, e.length - a), n = n.substring(0, n.length - a);
  var h = this.diff_compute_(e, n, t, i);
  return l && h.unshift([b, l]), o && h.push([b, o]), this.diff_cleanupMerge(h), h;
};
v.prototype.diff_compute_ = function(e, n, r, s) {
  var i;
  if (!e)
    return [[I, n]];
  if (!n)
    return [[w, e]];
  var t = e.length > n.length ? e : n, a = e.length > n.length ? n : e, l = t.indexOf(a);
  if (l != -1)
    return i = [
      [I, t.substring(0, l)],
      [b, a],
      [I, t.substring(l + a.length)]
    ], e.length > n.length && (i[0][0] = i[2][0] = w), i;
  if (a.length == 1)
    return [[w, e], [I, n]];
  var o = this.diff_halfMatch_(e, n);
  if (o) {
    var h = o[0], f = o[1], c = o[2], u = o[3], _ = o[4], g = this.diff_main(h, c, r, s), d = this.diff_main(f, u, r, s);
    return g.concat([[b, _]], d);
  }
  return r && e.length > 100 && n.length > 100 ? this.diff_lineMode_(e, n, s) : this.diff_bisect_(e, n, s);
};
v.prototype.diff_lineMode_ = function(e, n, r) {
  var s = this.diff_linesToChars_(e, n);
  e = s.chars1, n = s.chars2;
  var i = s.lineArray, t = this.diff_main(e, n, !1, r);
  this.diff_charsToLines_(t, i), this.diff_cleanupSemantic(t), t.push([b, ""]);
  for (var a = 0, l = 0, o = 0, h = "", f = ""; a < t.length; ) {
    switch (t[a][0]) {
      case I:
        o++, f += t[a][1];
        break;
      case w:
        l++, h += t[a][1];
        break;
      case b:
        if (l >= 1 && o >= 1) {
          t.splice(
            a - l - o,
            l + o
          ), a = a - l - o;
          for (var s = this.diff_main(h, f, !1, r), c = s.length - 1; c >= 0; c--)
            t.splice(a, 0, s[c]);
          a = a + s.length;
        }
        o = 0, l = 0, h = "", f = "";
        break;
    }
    a++;
  }
  return t.pop(), t;
};
v.prototype.diff_bisect_ = function(e, n, r) {
  for (var s = e.length, i = n.length, t = Math.ceil((s + i) / 2), a = t, l = 2 * t, o = new Array(l), h = new Array(l), f = 0; f < l; f++)
    o[f] = -1, h[f] = -1;
  o[a + 1] = 0, h[a + 1] = 0;
  for (var c = s - i, u = c % 2 != 0, _ = 0, g = 0, d = 0, m = 0, p = 0; p < t && !(new Date().getTime() > r); p++) {
    for (var k = -p + _; k <= p - g; k += 2) {
      var M = a + k, E;
      k == -p || k != p && o[M - 1] < o[M + 1] ? E = o[M + 1] : E = o[M - 1] + 1;
      for (var y = E - k; E < s && y < i && e.charAt(E) == n.charAt(y); )
        E++, y++;
      if (o[M] = E, E > s)
        g += 2;
      else if (y > i)
        _ += 2;
      else if (u) {
        var A = a + c - k;
        if (A >= 0 && A < l && h[A] != -1) {
          var D = s - h[A];
          if (E >= D)
            return this.diff_bisectSplit_(e, n, E, y, r);
        }
      }
    }
    for (var B = -p + d; B <= p - m; B += 2) {
      var A = a + B, D;
      B == -p || B != p && h[A - 1] < h[A + 1] ? D = h[A + 1] : D = h[A - 1] + 1;
      for (var R = D - B; D < s && R < i && e.charAt(s - D - 1) == n.charAt(i - R - 1); )
        D++, R++;
      if (h[A] = D, D > s)
        m += 2;
      else if (R > i)
        d += 2;
      else if (!u) {
        var M = a + c - B;
        if (M >= 0 && M < l && o[M] != -1) {
          var E = o[M], y = a + E - M;
          if (D = s - D, E >= D)
            return this.diff_bisectSplit_(e, n, E, y, r);
        }
      }
    }
  }
  return [[w, e], [I, n]];
};
v.prototype.diff_bisectSplit_ = function(e, n, r, s, i) {
  var t = e.substring(0, r), a = n.substring(0, s), l = e.substring(r), o = n.substring(s), h = this.diff_main(t, a, !1, i), f = this.diff_main(l, o, !1, i);
  return h.concat(f);
};
v.prototype.diff_linesToChars_ = function(e, n) {
  var r = [], s = {};
  r[0] = "";
  function i(l) {
    for (var o = "", h = 0, f = -1, c = r.length; f < l.length - 1; ) {
      f = l.indexOf(`
`, h), f == -1 && (f = l.length - 1);
      var u = l.substring(h, f + 1);
      h = f + 1, (s.hasOwnProperty ? s.hasOwnProperty(u) : s[u] !== void 0) ? o += String.fromCharCode(s[u]) : (o += String.fromCharCode(c), s[u] = c, r[c++] = u);
    }
    return o;
  }
  var t = i(e), a = i(n);
  return { chars1: t, chars2: a, lineArray: r };
};
v.prototype.diff_charsToLines_ = function(e, n) {
  for (var r = 0; r < e.length; r++) {
    for (var s = e[r][1], i = [], t = 0; t < s.length; t++)
      i[t] = n[s.charCodeAt(t)];
    e[r][1] = i.join("");
  }
};
v.prototype.diff_commonPrefix = function(e, n) {
  if (!e || !n || e.charAt(0) != n.charAt(0))
    return 0;
  for (var r = 0, s = Math.min(e.length, n.length), i = s, t = 0; r < i; )
    e.substring(t, i) == n.substring(t, i) ? (r = i, t = r) : s = i, i = Math.floor((s - r) / 2 + r);
  return i;
};
v.prototype.diff_commonSuffix = function(e, n) {
  if (!e || !n || e.charAt(e.length - 1) != n.charAt(n.length - 1))
    return 0;
  for (var r = 0, s = Math.min(e.length, n.length), i = s, t = 0; r < i; )
    e.substring(e.length - i, e.length - t) == n.substring(n.length - i, n.length - t) ? (r = i, t = r) : s = i, i = Math.floor((s - r) / 2 + r);
  return i;
};
v.prototype.diff_commonOverlap_ = function(e, n) {
  var r = e.length, s = n.length;
  if (r == 0 || s == 0)
    return 0;
  r > s ? e = e.substring(r - s) : r < s && (n = n.substring(0, r));
  var i = Math.min(r, s);
  if (e == n)
    return i;
  for (var t = 0, a = 1; ; ) {
    var l = e.substring(i - a), o = n.indexOf(l);
    if (o == -1)
      return t;
    a += o, (o == 0 || e.substring(i - a) == n.substring(0, a)) && (t = a, a++);
  }
};
v.prototype.diff_halfMatch_ = function(e, n) {
  if (this.Diff_Timeout <= 0)
    return null;
  var r = e.length > n.length ? e : n, s = e.length > n.length ? n : e;
  if (r.length < 4 || s.length * 2 < r.length)
    return null;
  var i = this;
  function t(g, d, m) {
    for (var p = g.substring(m, m + Math.floor(g.length / 4)), k = -1, M = "", E, y, A, D; (k = d.indexOf(p, k + 1)) != -1; ) {
      var B = i.diff_commonPrefix(
        g.substring(m),
        d.substring(k)
      ), R = i.diff_commonSuffix(
        g.substring(0, m),
        d.substring(0, k)
      );
      M.length < R + B && (M = d.substring(k - R, k) + d.substring(k, k + B), E = g.substring(0, m - R), y = g.substring(m + B), A = d.substring(0, k - R), D = d.substring(k + B));
    }
    return M.length * 2 >= g.length ? [
      E,
      y,
      A,
      D,
      M
    ] : null;
  }
  var a = t(
    r,
    s,
    Math.ceil(r.length / 4)
  ), l = t(
    r,
    s,
    Math.ceil(r.length / 2)
  ), o;
  if (!a && !l)
    return null;
  l ? a ? o = a[4].length > l[4].length ? a : l : o = l : o = a;
  var h, f, c, u;
  e.length > n.length ? (h = o[0], f = o[1], c = o[2], u = o[3]) : (c = o[0], u = o[1], h = o[2], f = o[3]);
  var _ = o[4];
  return [h, f, c, u, _];
};
v.prototype.diff_cleanupSemantic = function(e) {
  for (var n = !1, r = [], s = 0, i = null, t = 0, a = 0, l = 0, o = 0, h = 0; t < e.length; )
    e[t][0] == b ? (r[s++] = t, a = o, l = h, o = 0, h = 0, i = e[t][1]) : (e[t][0] == I ? o += e[t][1].length : h += e[t][1].length, i && i.length <= Math.max(a, l) && i.length <= Math.max(
      o,
      h
    ) && (e.splice(
      r[s - 1],
      0,
      [w, i]
    ), e[r[s - 1] + 1][0] = I, s--, s--, t = s > 0 ? r[s - 1] : -1, a = 0, l = 0, o = 0, h = 0, i = null, n = !0)), t++;
  for (n && this.diff_cleanupMerge(e), this.diff_cleanupSemanticLossless(e), t = 1; t < e.length; ) {
    if (e[t - 1][0] == w && e[t][0] == I) {
      var f = e[t - 1][1], c = e[t][1], u = this.diff_commonOverlap_(f, c), _ = this.diff_commonOverlap_(c, f);
      u >= _ ? (u >= f.length / 2 || u >= c.length / 2) && (e.splice(
        t,
        0,
        [b, c.substring(0, u)]
      ), e[t - 1][1] = f.substring(0, f.length - u), e[t + 1][1] = c.substring(u), t++) : (_ >= f.length / 2 || _ >= c.length / 2) && (e.splice(
        t,
        0,
        [b, f.substring(0, _)]
      ), e[t - 1][0] = I, e[t - 1][1] = c.substring(0, c.length - _), e[t + 1][0] = w, e[t + 1][1] = f.substring(_), t++), t++;
    }
    t++;
  }
};
v.prototype.diff_cleanupSemanticLossless = function(e) {
  function n(_, g) {
    if (!_ || !g)
      return 6;
    var d = _.charAt(_.length - 1), m = g.charAt(0), p = d.match(v.nonAlphaNumericRegex_), k = m.match(v.nonAlphaNumericRegex_), M = p && d.match(v.whitespaceRegex_), E = k && m.match(v.whitespaceRegex_), y = M && d.match(v.linebreakRegex_), A = E && m.match(v.linebreakRegex_), D = y && _.match(v.blanklineEndRegex_), B = A && g.match(v.blanklineStartRegex_);
    return D || B ? 5 : y || A ? 4 : p && !M && E ? 3 : M || E ? 2 : p || k ? 1 : 0;
  }
  for (var r = 1; r < e.length - 1; ) {
    if (e[r - 1][0] == b && e[r + 1][0] == b) {
      var s = e[r - 1][1], i = e[r][1], t = e[r + 1][1], a = this.diff_commonSuffix(s, i);
      if (a) {
        var l = i.substring(i.length - a);
        s = s.substring(0, s.length - a), i = l + i.substring(0, i.length - a), t = l + t;
      }
      for (var o = s, h = i, f = t, c = n(s, i) + n(i, t); i.charAt(0) === t.charAt(0); ) {
        s += i.charAt(0), i = i.substring(1) + t.charAt(0), t = t.substring(1);
        var u = n(s, i) + n(i, t);
        u >= c && (c = u, o = s, h = i, f = t);
      }
      e[r - 1][1] != o && (o ? e[r - 1][1] = o : (e.splice(r - 1, 1), r--), e[r][1] = h, f ? e[r + 1][1] = f : (e.splice(r + 1, 1), r--));
    }
    r++;
  }
};
v.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
v.whitespaceRegex_ = /\s/;
v.linebreakRegex_ = /[\r\n]/;
v.blanklineEndRegex_ = /\n\r?\n$/;
v.blanklineStartRegex_ = /^\r?\n\r?\n/;
v.prototype.diff_cleanupEfficiency = function(e) {
  for (var n = !1, r = [], s = 0, i = null, t = 0, a = !1, l = !1, o = !1, h = !1; t < e.length; )
    e[t][0] == b ? (e[t][1].length < this.Diff_EditCost && (o || h) ? (r[s++] = t, a = o, l = h, i = e[t][1]) : (s = 0, i = null), o = h = !1) : (e[t][0] == w ? h = !0 : o = !0, i && (a && l && o && h || i.length < this.Diff_EditCost / 2 && a + l + o + h == 3) && (e.splice(
      r[s - 1],
      0,
      [w, i]
    ), e[r[s - 1] + 1][0] = I, s--, i = null, a && l ? (o = h = !0, s = 0) : (s--, t = s > 0 ? r[s - 1] : -1, o = h = !1), n = !0)), t++;
  n && this.diff_cleanupMerge(e);
};
v.prototype.diff_cleanupMerge = function(e) {
  e.push([b, ""]);
  for (var n = 0, r = 0, s = 0, i = "", t = "", a; n < e.length; )
    switch (e[n][0]) {
      case I:
        s++, t += e[n][1], n++;
        break;
      case w:
        r++, i += e[n][1], n++;
        break;
      case b:
        r + s > 1 ? (r !== 0 && s !== 0 && (a = this.diff_commonPrefix(t, i), a !== 0 && (n - r - s > 0 && e[n - r - s - 1][0] == b ? e[n - r - s - 1][1] += t.substring(0, a) : (e.splice(0, 0, [
          b,
          t.substring(0, a)
        ]), n++), t = t.substring(a), i = i.substring(a)), a = this.diff_commonSuffix(t, i), a !== 0 && (e[n][1] = t.substring(t.length - a) + e[n][1], t = t.substring(0, t.length - a), i = i.substring(0, i.length - a))), r === 0 ? e.splice(
          n - s,
          r + s,
          [I, t]
        ) : s === 0 ? e.splice(
          n - r,
          r + s,
          [w, i]
        ) : e.splice(
          n - r - s,
          r + s,
          [w, i],
          [I, t]
        ), n = n - r - s + (r ? 1 : 0) + (s ? 1 : 0) + 1) : n !== 0 && e[n - 1][0] == b ? (e[n - 1][1] += e[n][1], e.splice(n, 1)) : n++, s = 0, r = 0, i = "", t = "";
        break;
    }
  e[e.length - 1][1] === "" && e.pop();
  var l = !1;
  for (n = 1; n < e.length - 1; )
    e[n - 1][0] == b && e[n + 1][0] == b && (e[n][1].substring(e[n][1].length - e[n - 1][1].length) == e[n - 1][1] ? (e[n][1] = e[n - 1][1] + e[n][1].substring(0, e[n][1].length - e[n - 1][1].length), e[n + 1][1] = e[n - 1][1] + e[n + 1][1], e.splice(n - 1, 1), l = !0) : e[n][1].substring(0, e[n + 1][1].length) == e[n + 1][1] && (e[n - 1][1] += e[n + 1][1], e[n][1] = e[n][1].substring(e[n + 1][1].length) + e[n + 1][1], e.splice(n + 1, 1), l = !0)), n++;
  l && this.diff_cleanupMerge(e);
};
v.prototype.diff_xIndex = function(e, n) {
  var r = 0, s = 0, i = 0, t = 0, a;
  for (a = 0; a < e.length && (e[a][0] !== I && (r += e[a][1].length), e[a][0] !== w && (s += e[a][1].length), !(r > n)); a++)
    i = r, t = s;
  return e.length != a && e[a][0] === w ? t : t + (n - i);
};
v.prototype.diff_prettyHtml = function(e) {
  for (var n = [], r = /&/g, s = /</g, i = />/g, t = /\n/g, a = 0; a < e.length; a++) {
    var l = e[a][0], o = e[a][1], h = o.replace(r, "&amp;").replace(s, "&lt;").replace(i, "&gt;").replace(t, "&para;<br>");
    switch (l) {
      case I:
        n[a] = '<ins style="background:#e6ffe6;">' + h + "</ins>";
        break;
      case w:
        n[a] = '<del style="background:#ffe6e6;">' + h + "</del>";
        break;
      case b:
        n[a] = "<span>" + h + "</span>";
        break;
    }
  }
  return n.join("");
};
v.prototype.diff_text1 = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    e[r][0] !== I && (n[r] = e[r][1]);
  return n.join("");
};
v.prototype.diff_text2 = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    e[r][0] !== w && (n[r] = e[r][1]);
  return n.join("");
};
v.prototype.diff_levenshtein = function(e) {
  for (var n = 0, r = 0, s = 0, i = 0; i < e.length; i++) {
    var t = e[i][0], a = e[i][1];
    switch (t) {
      case I:
        r += a.length;
        break;
      case w:
        s += a.length;
        break;
      case b:
        n += Math.max(r, s), r = 0, s = 0;
        break;
    }
  }
  return n += Math.max(r, s), n;
};
v.prototype.diff_toDelta = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    switch (e[r][0]) {
      case I:
        n[r] = "+" + encodeURI(e[r][1]);
        break;
      case w:
        n[r] = "-" + e[r][1].length;
        break;
      case b:
        n[r] = "=" + e[r][1].length;
        break;
    }
  return n.join("	").replace(/%20/g, " ");
};
v.prototype.diff_fromDelta = function(e, n) {
  for (var r = [], s = 0, i = 0, t = n.split(/\t/g), a = 0; a < t.length; a++) {
    var l = t[a].substring(1);
    switch (t[a].charAt(0)) {
      case "+":
        try {
          r[s++] = [I, decodeURI(l)];
        } catch {
          throw new Error("Illegal escape in diff_fromDelta: " + l);
        }
        break;
      case "-":
      case "=":
        var o = parseInt(l, 10);
        if (isNaN(o) || o < 0)
          throw new Error("Invalid number in diff_fromDelta: " + l);
        var h = e.substring(i, i += o);
        t[a].charAt(0) == "=" ? r[s++] = [b, h] : r[s++] = [w, h];
        break;
      default:
        if (t[a])
          throw new Error("Invalid diff operation in diff_fromDelta: " + t[a]);
    }
  }
  if (i != e.length)
    throw new Error("Delta length (" + i + ") does not equal source text length (" + e.length + ").");
  return r;
};
v.prototype.match_main = function(e, n, r) {
  if (e == null || n == null || r == null)
    throw new Error("Null input. (match_main)");
  return r = Math.max(0, Math.min(r, e.length)), e == n ? 0 : e.length ? e.substring(r, r + n.length) == n ? r : this.match_bitap_(e, n, r) : -1;
};
v.prototype.match_bitap_ = function(e, n, r) {
  if (n.length > this.Match_MaxBits)
    throw new Error("Pattern too long for this browser.");
  var s = this.match_alphabet_(n), i = this;
  function t(E, y) {
    var A = E / n.length, D = Math.abs(r - y);
    return i.Match_Distance ? A + D / i.Match_Distance : D ? 1 : A;
  }
  var a = this.Match_Threshold, l = e.indexOf(n, r);
  l != -1 && (a = Math.min(t(0, l), a), l = e.lastIndexOf(n, r + n.length), l != -1 && (a = Math.min(t(0, l), a)));
  var o = 1 << n.length - 1;
  l = -1;
  for (var h, f, c = n.length + e.length, u, _ = 0; _ < n.length; _++) {
    for (h = 0, f = c; h < f; )
      t(_, r + f) <= a ? h = f : c = f, f = Math.floor((c - h) / 2 + h);
    c = f;
    var g = Math.max(1, r - f + 1), d = Math.min(r + f, e.length) + n.length, m = Array(d + 2);
    m[d + 1] = (1 << _) - 1;
    for (var p = d; p >= g; p--) {
      var k = s[e.charAt(p - 1)];
      if (_ === 0 ? m[p] = (m[p + 1] << 1 | 1) & k : m[p] = (m[p + 1] << 1 | 1) & k | ((u[p + 1] | u[p]) << 1 | 1) | u[p + 1], m[p] & o) {
        var M = t(_, p - 1);
        if (M <= a)
          if (a = M, l = p - 1, l > r)
            g = Math.max(1, 2 * r - l);
          else
            break;
      }
    }
    if (t(_ + 1, r) > a)
      break;
    u = m;
  }
  return l;
};
v.prototype.match_alphabet_ = function(e) {
  for (var n = {}, r = 0; r < e.length; r++)
    n[e.charAt(r)] = 0;
  for (var r = 0; r < e.length; r++)
    n[e.charAt(r)] |= 1 << e.length - r - 1;
  return n;
};
v.prototype.patch_addContext_ = function(e, n) {
  if (n.length != 0) {
    for (var r = n.substring(e.start2, e.start2 + e.length1), s = 0; n.indexOf(r) != n.lastIndexOf(r) && r.length < this.Match_MaxBits - this.Patch_Margin - this.Patch_Margin; )
      s += this.Patch_Margin, r = n.substring(
        e.start2 - s,
        e.start2 + e.length1 + s
      );
    s += this.Patch_Margin;
    var i = n.substring(e.start2 - s, e.start2);
    i && e.diffs.unshift([b, i]);
    var t = n.substring(
      e.start2 + e.length1,
      e.start2 + e.length1 + s
    );
    t && e.diffs.push([b, t]), e.start1 -= i.length, e.start2 -= i.length, e.length1 += i.length + t.length, e.length2 += i.length + t.length;
  }
};
v.prototype.patch_make = function(e, n, r) {
  var s, i;
  if (typeof e == "string" && typeof n == "string" && typeof r > "u")
    s = /** @type {string} */
    e, i = this.diff_main(
      s,
      /** @type {string} */
      n,
      !0
    ), i.length > 2 && (this.diff_cleanupSemantic(i), this.diff_cleanupEfficiency(i));
  else if (e && typeof e == "object" && typeof n > "u" && typeof r > "u")
    i = /** @type {!Array.<!diff_match_patch.Diff>} */
    e, s = this.diff_text1(i);
  else if (typeof e == "string" && n && typeof n == "object" && typeof r > "u")
    s = /** @type {string} */
    e, i = /** @type {!Array.<!diff_match_patch.Diff>} */
    n;
  else if (typeof e == "string" && typeof n == "string" && r && typeof r == "object")
    s = /** @type {string} */
    e, i = /** @type {!Array.<!diff_match_patch.Diff>} */
    r;
  else
    throw new Error("Unknown call format to patch_make.");
  if (i.length === 0)
    return [];
  for (var t = [], a = new v.patch_obj(), l = 0, o = 0, h = 0, f = s, c = s, u = 0; u < i.length; u++) {
    var _ = i[u][0], g = i[u][1];
    switch (!l && _ !== b && (a.start1 = o, a.start2 = h), _) {
      case I:
        a.diffs[l++] = i[u], a.length2 += g.length, c = c.substring(0, h) + g + c.substring(h);
        break;
      case w:
        a.length1 += g.length, a.diffs[l++] = i[u], c = c.substring(0, h) + c.substring(h + g.length);
        break;
      case b:
        g.length <= 2 * this.Patch_Margin && l && i.length != u + 1 ? (a.diffs[l++] = i[u], a.length1 += g.length, a.length2 += g.length) : g.length >= 2 * this.Patch_Margin && l && (this.patch_addContext_(a, f), t.push(a), a = new v.patch_obj(), l = 0, f = c, o = h);
        break;
    }
    _ !== I && (o += g.length), _ !== w && (h += g.length);
  }
  return l && (this.patch_addContext_(a, f), t.push(a)), t;
};
v.prototype.patch_deepCopy = function(e) {
  for (var n = [], r = 0; r < e.length; r++) {
    var s = e[r], i = new v.patch_obj();
    i.diffs = [];
    for (var t = 0; t < s.diffs.length; t++)
      i.diffs[t] = s.diffs[t].slice();
    i.start1 = s.start1, i.start2 = s.start2, i.length1 = s.length1, i.length2 = s.length2, n[r] = i;
  }
  return n;
};
v.prototype.patch_apply = function(e, n) {
  if (e.length == 0)
    return [n, []];
  e = this.patch_deepCopy(e);
  var r = this.patch_addPadding(e);
  n = r + n + r, this.patch_splitMax(e);
  for (var s = 0, i = [], t = 0; t < e.length; t++) {
    var a = e[t].start2 + s, l = this.diff_text1(e[t].diffs), o, h = -1;
    if (l.length > this.Match_MaxBits ? (o = this.match_main(
      n,
      l.substring(0, this.Match_MaxBits),
      a
    ), o != -1 && (h = this.match_main(
      n,
      l.substring(l.length - this.Match_MaxBits),
      a + l.length - this.Match_MaxBits
    ), (h == -1 || o >= h) && (o = -1))) : o = this.match_main(n, l, a), o == -1)
      i[t] = !1, s -= e[t].length2 - e[t].length1;
    else {
      i[t] = !0, s = o - a;
      var f;
      if (h == -1 ? f = n.substring(o, o + l.length) : f = n.substring(o, h + this.Match_MaxBits), l == f)
        n = n.substring(0, o) + this.diff_text2(e[t].diffs) + n.substring(o + l.length);
      else {
        var c = this.diff_main(l, f, !1);
        if (l.length > this.Match_MaxBits && this.diff_levenshtein(c) / l.length > this.Patch_DeleteThreshold)
          i[t] = !1;
        else {
          this.diff_cleanupSemanticLossless(c);
          for (var u = 0, _, g = 0; g < e[t].diffs.length; g++) {
            var d = e[t].diffs[g];
            d[0] !== b && (_ = this.diff_xIndex(c, u)), d[0] === I ? n = n.substring(0, o + _) + d[1] + n.substring(o + _) : d[0] === w && (n = n.substring(0, o + _) + n.substring(o + this.diff_xIndex(
              c,
              u + d[1].length
            ))), d[0] !== w && (u += d[1].length);
          }
        }
      }
    }
  }
  return n = n.substring(r.length, n.length - r.length), [n, i];
};
v.prototype.patch_addPadding = function(e) {
  for (var n = this.Patch_Margin, r = "", s = 1; s <= n; s++)
    r += String.fromCharCode(s);
  for (var s = 0; s < e.length; s++)
    e[s].start1 += n, e[s].start2 += n;
  var i = e[0], t = i.diffs;
  if (t.length == 0 || t[0][0] != b)
    t.unshift([b, r]), i.start1 -= n, i.start2 -= n, i.length1 += n, i.length2 += n;
  else if (n > t[0][1].length) {
    var a = n - t[0][1].length;
    t[0][1] = r.substring(t[0][1].length) + t[0][1], i.start1 -= a, i.start2 -= a, i.length1 += a, i.length2 += a;
  }
  if (i = e[e.length - 1], t = i.diffs, t.length == 0 || t[t.length - 1][0] != b)
    t.push([b, r]), i.length1 += n, i.length2 += n;
  else if (n > t[t.length - 1][1].length) {
    var a = n - t[t.length - 1][1].length;
    t[t.length - 1][1] += r.substring(0, a), i.length1 += a, i.length2 += a;
  }
  return r;
};
v.prototype.patch_splitMax = function(e) {
  for (var n = this.Match_MaxBits, r = 0; r < e.length; r++)
    if (!(e[r].length1 <= n)) {
      var s = e[r];
      e.splice(r--, 1);
      for (var i = s.start1, t = s.start2, a = ""; s.diffs.length !== 0; ) {
        var l = new v.patch_obj(), o = !0;
        for (l.start1 = i - a.length, l.start2 = t - a.length, a !== "" && (l.length1 = l.length2 = a.length, l.diffs.push([b, a])); s.diffs.length !== 0 && l.length1 < n - this.Patch_Margin; ) {
          var h = s.diffs[0][0], f = s.diffs[0][1];
          h === I ? (l.length2 += f.length, t += f.length, l.diffs.push(s.diffs.shift()), o = !1) : h === w && l.diffs.length == 1 && l.diffs[0][0] == b && f.length > 2 * n ? (l.length1 += f.length, i += f.length, o = !1, l.diffs.push([h, f]), s.diffs.shift()) : (f = f.substring(
            0,
            n - l.length1 - this.Patch_Margin
          ), l.length1 += f.length, i += f.length, h === b ? (l.length2 += f.length, t += f.length) : o = !1, l.diffs.push([h, f]), f == s.diffs[0][1] ? s.diffs.shift() : s.diffs[0][1] = s.diffs[0][1].substring(f.length));
        }
        a = this.diff_text2(l.diffs), a = a.substring(a.length - this.Patch_Margin);
        var c = this.diff_text1(s.diffs).substring(0, this.Patch_Margin);
        c !== "" && (l.length1 += c.length, l.length2 += c.length, l.diffs.length !== 0 && l.diffs[l.diffs.length - 1][0] === b ? l.diffs[l.diffs.length - 1][1] += c : l.diffs.push([b, c])), o || e.splice(++r, 0, l);
      }
    }
};
v.prototype.patch_toText = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    n[r] = e[r];
  return n.join("");
};
v.prototype.patch_fromText = function(e) {
  var n = [];
  if (!e)
    return n;
  for (var r = e.split(`
`), s = 0, i = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/; s < r.length; ) {
    var t = r[s].match(i);
    if (!t)
      throw new Error("Invalid patch string: " + r[s]);
    var a = new v.patch_obj();
    for (n.push(a), a.start1 = parseInt(t[1], 10), t[2] === "" ? (a.start1--, a.length1 = 1) : t[2] == "0" ? a.length1 = 0 : (a.start1--, a.length1 = parseInt(t[2], 10)), a.start2 = parseInt(t[3], 10), t[4] === "" ? (a.start2--, a.length2 = 1) : t[4] == "0" ? a.length2 = 0 : (a.start2--, a.length2 = parseInt(t[4], 10)), s++; s < r.length; ) {
      var l = r[s].charAt(0);
      try {
        var o = decodeURI(r[s].substring(1));
      } catch {
        throw new Error("Illegal escape in patch_fromText: " + o);
      }
      if (l == "-")
        a.diffs.push([w, o]);
      else if (l == "+")
        a.diffs.push([I, o]);
      else if (l == " ")
        a.diffs.push([b, o]);
      else {
        if (l == "@")
          break;
        if (l !== "")
          throw new Error('Invalid patch mode "' + l + '" in: ' + o);
      }
      s++;
    }
  }
  return n;
};
v.patch_obj = function() {
  this.diffs = [], this.start1 = null, this.start2 = null, this.length1 = 0, this.length2 = 0;
};
v.patch_obj.prototype.toString = function() {
  var e, n;
  this.length1 === 0 ? e = this.start1 + ",0" : this.length1 == 1 ? e = this.start1 + 1 : e = this.start1 + 1 + "," + this.length1, this.length2 === 0 ? n = this.start2 + ",0" : this.length2 == 1 ? n = this.start2 + 1 : n = this.start2 + 1 + "," + this.length2;
  for (var r = ["@@ -" + e + " +" + n + ` @@
`], s, i = 0; i < this.diffs.length; i++) {
    switch (this.diffs[i][0]) {
      case I:
        s = "+";
        break;
      case w:
        s = "-";
        break;
      case b:
        s = " ";
        break;
    }
    r[i + 1] = s + encodeURI(this.diffs[i][1]) + `
`;
  }
  return r.join("").replace(/%20/g, " ");
};
var L = /* @__PURE__ */ ((e) => (e[e.BLOCK_SOURCE_BASE = 0] = "BLOCK_SOURCE_BASE", e[e.BLOCK_SOURCE_BRANCH = 1] = "BLOCK_SOURCE_BRANCH", e))(L || {});
const $ = JSON.stringify({
  format: "Markdown",
  toc: !1,
  parse_outline_only: !1,
  export_md_remove_options: [],
  heading_to_list: !1,
  heading_number: !1,
  keep_line_break: !0
}), Q = /^[0-9a-fA-F\-]{32,40}$/, U = "$PROPERTY!!DRAWER!!UUID$", j = /^(\s*)/;
function z(e) {
  for (const [n, r, s] of e)
    if (n == "id")
      return r;
}
class Y {
  constructor(n, r = $) {
    F(this, "mldoc");
    F(this, "config");
    F(this, "format");
    F(this, "byteEncoder", new TextEncoder());
    F(this, "byteDecoder", new TextDecoder());
    this.mldoc = n, this.config = r, this.format = JSON.parse(r).format;
  }
  parse(n) {
    return JSON.parse(this.mldoc.parseJson(n, this.config));
  }
  parseBlocks(n) {
    const r = [], s = this.parse(n), i = this.byteEncoder.encode(n);
    for (const h of s) {
      const f = h[1], c = i.slice(f.start_pos, f.end_pos), u = this.byteDecoder.decode(c);
      u[u.length - 1] === `
` ? r.push(u.substring(0, u.length - 1)) : r.push(u);
    }
    const t = [];
    let a = [], l, o;
    for (let h = 0; h < s.length; h++) {
      const f = s[h];
      if (f[0][0] == "Property_Drawer") {
        const c = f[0][1], u = z(c);
        u && t.length > 0 && Q.test(u) ? (o = u, a.push(r[h].replace(u, U))) : a.push(r[h]);
        continue;
      } else if (f[0][0] != "Heading") {
        a.push(r[h]);
        continue;
      }
      a.length > 0 && t.push({ lines: a, uuid: o, level: l }), a = [], o = void 0, a.push(r[h]), l = f[0][1].level;
    }
    return a.length > 0 && t.push({ lines: a, level: l }), t;
  }
  /**
   * Don't use! For demo only! Doesn't fully support all features in Logseq
   */
  parseMarkdownBlocksAndIndents(n, r) {
    const s = this.parseBlocks(n), i = [];
    for (const t of s) {
      const a = t.lines, l = [];
      for (const [o, h] of a.entries()) {
        const f = j.exec(h), c = (f == null ? void 0 : f[1]) || "", u = h.substring(c.length + (o > 0 ? 0 : 2), h.length);
        l.push(u);
      }
      i.push({
        body: l.join(`
`),
        level: t.level,
        uuid: t.uuid,
        src: r ? 0 : 1
        /* BLOCK_SOURCE_BRANCH */
      });
    }
    return i;
  }
  /**
   * 
   * @param text 
   * @returns the line bodies and their indents, indexed by block, without EOL
   */
  parseBlocksAndIndents(n, r) {
    if (this.format === "Markdown")
      return this.parseMarkdownBlocksAndIndents(n, r);
    throw new Error(`Unimplemented format: ${this.format}`);
  }
}
function J(e) {
  let r = e.body.split(`
`).map((s, i) => {
    const t = (e.level || 1) - 1;
    return "	".repeat(t) + (i == 0 ? "- " : "  ") + s;
  }).join(`
`);
  return r.includes(U) && (e.uuid || console.warn("Block content contains UUID placeholder but block has no UUID"), r = r.replace(U, e.uuid || "")), r;
}
const T = new v();
function K(e, n) {
  let r = T.diff_linesToChars_(e, n);
  const s = r.chars1, i = r.chars2, t = r.lineArray, a = T.diff_main(s, i, !1);
  return T.diff_charsToLines_(a, t), a.map((o) => o[1].endsWith(`
`) ? o[1].slice(0, o[1].length - 1) : o[1]).join(`
`);
}
function O(e) {
  let n = !0, r, s = [];
  for (const g of e)
    g[1].src === L.BLOCK_SOURCE_BASE ? r = g : s.push(g);
  if (r || (r = e[0], s = e.slice(1), n = !1), !n) {
    const g = [r].concat(s), d = S(g).map((k) => k[1]), m = [[C.DIFF_EQUAL, d[0]]], p = d.slice(1).map((k) => [C.DIFF_INSERT, k]);
    return m.concat(p);
  }
  const i = r[1], t = s.map((g) => g[1]), a = i.body, l = {
    src: i.src,
    uuid: i.uuid,
    body: i.body,
    level: i.level
  };
  let o = !1, h = l.body;
  const f = [];
  for (const g of t) {
    const d = g.body;
    if (g.uuid && l.uuid && g.uuid != l.uuid) {
      f.push(g);
      continue;
    }
    if (o && h != d && a != d) {
      f.push(g);
      continue;
    }
    !o && a != d && (o = !0, h = d, l.body = g.body, l.src = g.src), !l.uuid && g.uuid && (l.uuid = g.uuid, l.src = g.src), g.level && i.level != g.level && (l.level = g.level, l.src = g.src);
  }
  const c = [[C.DIFF_EQUAL, l]], u = f.map((g) => [C.DIFF_INSERT, g]), _ = S(u);
  return c.concat(_);
}
function S(e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), i = [], t = [];
  let a = 0;
  for (const l of e) {
    const o = l[1].body, h = l[1].uuid;
    if (h && s.has(h)) {
      r.get(h).has(o) || r.get(h).add(o);
      continue;
    }
    (h || !n.has(o)) && (n.has(o) || n.set(o, a), h && !s.has(h) && (s.set(h, a), r.set(h, /* @__PURE__ */ new Set([o]))), i.push(l[1]), t.push(`Resolved #${a} with uuid ${l[1].uuid} and content '${l[1].body}'`), a += 1);
  }
  for (const l of r.keys()) {
    const o = r.get(l);
    if (o.size > 1) {
      const h = s.get(l), f = i[h], c = f.body;
      let u = c;
      for (const _ of o)
        _ != c && (u = K(u, _));
      i[h] = {
        src: f.src,
        uuid: f.uuid,
        body: u,
        level: f.level
      }, t[h] += ` Merged content of duplicated uuid ${f.uuid} from ${o.size} blocks`;
    }
  }
  return i.map((l, o) => [C.DIFF_INSERT, l, t[o]]);
}
var C = /* @__PURE__ */ ((e) => (e[e.DIFF_DELETE = -1] = "DIFF_DELETE", e[e.DIFF_EQUAL = 0] = "DIFF_EQUAL", e[e.DIFF_INSERT = 1] = "DIFF_INSERT", e))(C || {});
class W {
  // Keeping our own length variable is faster than looking it up.
  /**
   * Storing the block->char hash table
   * CharHash for one transact (merging), call the base version first to ensure best indent resolution
   * > 65536 blocks might break DMP (see WATCH OUT 1)
   * It's tolerable for our use case as LCS doesn't require the char to be unique
   */
  constructor() {
    F(this, "uniqueBlocks");
    // Block[uniqueId][sameIdBlocksIdx]
    // Case that the indent changes are lost - so we need to overwrite it by the different from the based one
    F(this, "blockContentHash");
    // e.g. blockHash['Hello\nWorld'] == 4
    F(this, "blockUUIDHash");
    // e.g. blockHash['Hello\nWorld'] == 4
    F(this, "blockArrayLength", 0);
    this.uniqueBlocks = [], this.uniqueBlocks[0] = [{ level: 0, body: "", src: 0 }], this.blockContentHash = /* @__PURE__ */ new Map(), this.blockUUIDHash = /* @__PURE__ */ new Map();
  }
  diff_blocksToUniqueId(n) {
    let r = [];
    for (const s of n) {
      const i = s.body;
      if (s.uuid && this.blockUUIDHash.has(s.uuid)) {
        const t = this.blockUUIDHash.get(s.uuid);
        r.push(t), this.uniqueBlocks[t].push(s), this.blockContentHash.set(i, t);
      } else if (!s.uuid && this.blockContentHash.has(i)) {
        const t = this.blockContentHash.get(i);
        r.push(t), this.uniqueBlocks[t].push(s);
      } else {
        const t = this.blockArrayLength;
        r.push(t), this.blockContentHash.has(i) || this.blockContentHash.set(i, t), s.uuid && !this.blockUUIDHash.has(s.uuid) && this.blockUUIDHash.set(s.uuid, t), this.uniqueBlocks.push([s]), this.blockArrayLength += 1;
      }
    }
    return r;
  }
  /**
   * We have to keep indents of each block to ensure the best indent resolution
   * @param allBlocks the lines, in the index of block
   * @return Encoded string and all indents by block
  */
  diff_blocksToChars(n) {
    const r = this.diff_blocksToUniqueId(n);
    return String.fromCodePoint(...r);
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
  diff_charsToBlocks(n, r, s) {
    const i = [];
    let t = -1, a = -1, l = 0;
    for (var o = 0; o < n.length; o++) {
      const h = n[o][0], f = n[o][1];
      if (h != 1) {
        h == -1 && (l = i.length);
        for (const c of f) {
          let u = [];
          h == 0 ? (t += 1, a += 1, u = O([[h, r[t]], [h, s[a]]])) : (t += 1, u = [[h, r[t]]]), i.push(u);
        }
        h == 0 && (l = i.length - 1);
      } else
        for (const c of f) {
          a += 1;
          const u = [h, s[a]];
          i[l] === void 0 && (i[l] = []), i[l].push(u);
        }
    }
    return i;
  }
}
class V {
  /**
   * Can be used for only one time (charHash is shared) with maximum 65536 unique blocks, or unexpected behavior may occur
   */
  constructor(n = 1) {
    F(this, "charHash", new W());
    T.Diff_Timeout = n;
  }
  /**
   * The diff steps, in order of the block position in the base
   */
  diff_logseqMode(n, r) {
    const s = this.charHash.diff_blocksToChars(n), i = this.charHash.diff_blocksToChars(r), t = T.diff_main(s, i, !1);
    return this.charHash.diff_charsToBlocks(t, n, r);
  }
  /**
   * differentiate the baseInsert and newInsert, keep all the non-overlapping operations
   */
  diff_insert_ops(n, r) {
    return this.diff_logseqMode(n.map((t) => t[1]), r.map((t) => t[1])).flat(1).map((t) => [C.DIFF_INSERT, t[1]]);
  }
}
function Z(e, n, r) {
  const s = [];
  let i = !1;
  n.length < e.length && (n = n.concat(Array(e.length - n.length).fill(r)));
  for (const [t, a] of e.entries()) {
    i = !0;
    for (const l of a) {
      const [o, h] = l;
      (o === C.DIFF_EQUAL || o === C.DIFF_INSERT) && (i ? h.uuid ? (s.push(h.uuid), h.uuid == n[t] && (i = !1)) : (s.push(n[t]), i = !1) : h.uuid ? s.push(h.uuid) : s.push(r));
    }
  }
  return s;
}
function q(e, n, r) {
  const s = document.createElement("div");
  let i = 0;
  for (const [t, a] of e.entries())
    for (const l of a) {
      const [o, h, f] = l, c = J(l[1]), u = document.createElement("tr");
      if (u.style.padding = "0 0.2em", u.style.borderRadius = "0.2em", n) {
        const m = document.createElement("td");
        m.innerText = o === C.DIFF_INSERT ? "" : n[t] || "", m.style.opacity = "0.5", u.appendChild(m);
      }
      if (r) {
        const m = document.createElement("td");
        m.innerText = o === C.DIFF_DELETE ? "" : r[i] || "", m.style.opacity = "0.5", u.appendChild(m);
      }
      const _ = document.createElement("td");
      _.innerText = t.toString(), _.style.borderRight = "1px solid #e1e4e8";
      const g = document.createElement("td");
      g.innerText = c, g.style.whiteSpace = "pre", u.appendChild(_), u.appendChild(g);
      const d = document.createElement("td");
      switch (d.innerHTML = f || "", u.appendChild(d), o) {
        case C.DIFF_INSERT:
          u.style.backgroundColor = "#e6ffed", u.style.color = "#24292e";
          break;
        case C.DIFF_EQUAL:
          u.style.color = "#24292e", h.src === L.BLOCK_SOURCE_BRANCH && (u.style.backgroundColor = "#fff2cc");
          break;
        case C.DIFF_DELETE:
          u.style.backgroundColor = "#ffeef0", u.style.color = "#24292e", u.style.textDecoration = "line-through";
          break;
      }
      s.appendChild(u), o !== C.DIFF_DELETE && (i += 1);
    }
  return s;
}
function N(e) {
  const n = [[], [], []];
  for (const r of e)
    n[r[0] + 1].push(r);
  return n;
}
class G {
  /**
   * Merger with max 65536 unique blocks support
   *
   * @param timeout optional the timeout for the diff algorithm (in sec, 1 sec by default)
   */
  constructor() {
  }
  /**
   * 
   * @param baseText the base text (the text to be merged into, the anchor of block index)
   * @param branchTexts  the texts to be merged
   * @returns the DMP operations of the final merged text (to be applied on the base text)
   *   resolvedDiffs[blockPos][DMPOP id][DMPOPType, text]
   *   where blockPos is the block # in the baseText
   */
  mergeBlocks(n, r) {
    const s = new V(1), i = r.map(
      (h) => s.diff_logseqMode(n, h)
    ), t = [], a = i.reduce((h, f) => {
      for (const [c, u] of f.entries())
        if (h[c] === void 0)
          h[c] = N(u);
        else {
          const _ = N(u);
          h[c][0] = h[c][0].concat(_[0]), h[c][1] = h[c][1].concat(_[1]), h[c][2] = s.diff_insert_ops(h[c][2], _[2]);
        }
      return h;
    }, t), l = [];
    let o = 0;
    for (const [h, f] of a.entries()) {
      const [c, u, _] = f;
      if (c.length >= 1)
        l.push([[C.DIFF_DELETE, n[h]]]), o += 1;
      else if (u.length >= 1) {
        const d = O(u);
        l.push(d), o += 1;
      } else
        console.warn(`No DIFF_EQUAL or DIFF_DELETE at position ${h}`);
      const g = S(_);
      o === 0 ? (l.push(g), o += 1) : l[o - 1] = l[o - 1].concat(g);
    }
    return l;
  }
}
export {
  V as Differ,
  G as Merger,
  Y as Parser,
  Z as attach_uuids,
  q as visualizeAsHTML
};
