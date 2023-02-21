var N = Object.defineProperty;
var H = (e, n, r) => n in e ? N(e, n, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[n] = r;
var F = (e, n, r) => (H(e, typeof n != "symbol" ? n + "" : n, r), r);
function v() {
  this.Diff_Timeout = 1, this.Diff_EditCost = 4, this.Match_Threshold = 0.5, this.Match_Distance = 1e3, this.Patch_DeleteThreshold = 0.5, this.Patch_Margin = 4, this.Match_MaxBits = 32;
}
var k = -1, w = 1, d = 0;
v.prototype.diff_main = function(e, n, r, s) {
  typeof s > "u" && (this.Diff_Timeout <= 0 ? s = Number.MAX_VALUE : s = new Date().getTime() + this.Diff_Timeout * 1e3);
  var i = s;
  if (e == null || n == null)
    throw new Error("Null input. (diff_main)");
  if (e == n)
    return e ? [[d, e]] : [];
  typeof r > "u" && (r = !0);
  var t = r, a = this.diff_commonPrefix(e, n), l = e.substring(0, a);
  e = e.substring(a), n = n.substring(a), a = this.diff_commonSuffix(e, n);
  var h = e.substring(e.length - a);
  e = e.substring(0, e.length - a), n = n.substring(0, n.length - a);
  var o = this.diff_compute_(e, n, t, i);
  return l && o.unshift([d, l]), h && o.push([d, h]), this.diff_cleanupMerge(o), o;
};
v.prototype.diff_compute_ = function(e, n, r, s) {
  var i;
  if (!e)
    return [[w, n]];
  if (!n)
    return [[k, e]];
  var t = e.length > n.length ? e : n, a = e.length > n.length ? n : e, l = t.indexOf(a);
  if (l != -1)
    return i = [
      [w, t.substring(0, l)],
      [d, a],
      [w, t.substring(l + a.length)]
    ], e.length > n.length && (i[0][0] = i[2][0] = k), i;
  if (a.length == 1)
    return [[k, e], [w, n]];
  var h = this.diff_halfMatch_(e, n);
  if (h) {
    var o = h[0], f = h[1], u = h[2], c = h[3], _ = h[4], g = this.diff_main(o, u, r, s), b = this.diff_main(f, c, r, s);
    return g.concat([[d, _]], b);
  }
  return r && e.length > 100 && n.length > 100 ? this.diff_lineMode_(e, n, s) : this.diff_bisect_(e, n, s);
};
v.prototype.diff_lineMode_ = function(e, n, r) {
  var s = this.diff_linesToChars_(e, n);
  e = s.chars1, n = s.chars2;
  var i = s.lineArray, t = this.diff_main(e, n, !1, r);
  this.diff_charsToLines_(t, i), this.diff_cleanupSemantic(t), t.push([d, ""]);
  for (var a = 0, l = 0, h = 0, o = "", f = ""; a < t.length; ) {
    switch (t[a][0]) {
      case w:
        h++, f += t[a][1];
        break;
      case k:
        l++, o += t[a][1];
        break;
      case d:
        if (l >= 1 && h >= 1) {
          t.splice(
            a - l - h,
            l + h
          ), a = a - l - h;
          for (var s = this.diff_main(o, f, !1, r), u = s.length - 1; u >= 0; u--)
            t.splice(a, 0, s[u]);
          a = a + s.length;
        }
        h = 0, l = 0, o = "", f = "";
        break;
    }
    a++;
  }
  return t.pop(), t;
};
v.prototype.diff_bisect_ = function(e, n, r) {
  for (var s = e.length, i = n.length, t = Math.ceil((s + i) / 2), a = t, l = 2 * t, h = new Array(l), o = new Array(l), f = 0; f < l; f++)
    h[f] = -1, o[f] = -1;
  h[a + 1] = 0, o[a + 1] = 0;
  for (var u = s - i, c = u % 2 != 0, _ = 0, g = 0, b = 0, M = 0, p = 0; p < t && !(new Date().getTime() > r); p++) {
    for (var m = -p + _; m <= p - g; m += 2) {
      var I = a + m, E;
      m == -p || m != p && h[I - 1] < h[I + 1] ? E = h[I + 1] : E = h[I - 1] + 1;
      for (var A = E - m; E < s && A < i && e.charAt(E) == n.charAt(A); )
        E++, A++;
      if (h[I] = E, E > s)
        g += 2;
      else if (A > i)
        _ += 2;
      else if (c) {
        var y = a + u - m;
        if (y >= 0 && y < l && o[y] != -1) {
          var D = s - o[y];
          if (E >= D)
            return this.diff_bisectSplit_(e, n, E, A, r);
        }
      }
    }
    for (var C = -p + b; C <= p - M; C += 2) {
      var y = a + C, D;
      C == -p || C != p && o[y - 1] < o[y + 1] ? D = o[y + 1] : D = o[y - 1] + 1;
      for (var U = D - C; D < s && U < i && e.charAt(s - D - 1) == n.charAt(i - U - 1); )
        D++, U++;
      if (o[y] = D, D > s)
        M += 2;
      else if (U > i)
        b += 2;
      else if (!c) {
        var I = a + u - C;
        if (I >= 0 && I < l && h[I] != -1) {
          var E = h[I], A = a + E - I;
          if (D = s - D, E >= D)
            return this.diff_bisectSplit_(e, n, E, A, r);
        }
      }
    }
  }
  return [[k, e], [w, n]];
};
v.prototype.diff_bisectSplit_ = function(e, n, r, s, i) {
  var t = e.substring(0, r), a = n.substring(0, s), l = e.substring(r), h = n.substring(s), o = this.diff_main(t, a, !1, i), f = this.diff_main(l, h, !1, i);
  return o.concat(f);
};
v.prototype.diff_linesToChars_ = function(e, n) {
  var r = [], s = {};
  r[0] = "";
  function i(l) {
    for (var h = "", o = 0, f = -1, u = r.length; f < l.length - 1; ) {
      f = l.indexOf(`
`, o), f == -1 && (f = l.length - 1);
      var c = l.substring(o, f + 1);
      o = f + 1, (s.hasOwnProperty ? s.hasOwnProperty(c) : s[c] !== void 0) ? h += String.fromCharCode(s[c]) : (h += String.fromCharCode(u), s[c] = u, r[u++] = c);
    }
    return h;
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
    var l = e.substring(i - a), h = n.indexOf(l);
    if (h == -1)
      return t;
    a += h, (h == 0 || e.substring(i - a) == n.substring(0, a)) && (t = a, a++);
  }
};
v.prototype.diff_halfMatch_ = function(e, n) {
  if (this.Diff_Timeout <= 0)
    return null;
  var r = e.length > n.length ? e : n, s = e.length > n.length ? n : e;
  if (r.length < 4 || s.length * 2 < r.length)
    return null;
  var i = this;
  function t(g, b, M) {
    for (var p = g.substring(M, M + Math.floor(g.length / 4)), m = -1, I = "", E, A, y, D; (m = b.indexOf(p, m + 1)) != -1; ) {
      var C = i.diff_commonPrefix(
        g.substring(M),
        b.substring(m)
      ), U = i.diff_commonSuffix(
        g.substring(0, M),
        b.substring(0, m)
      );
      I.length < U + C && (I = b.substring(m - U, m) + b.substring(m, m + C), E = g.substring(0, M - U), A = g.substring(M + C), y = b.substring(0, m - U), D = b.substring(m + C));
    }
    return I.length * 2 >= g.length ? [
      E,
      A,
      y,
      D,
      I
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
  ), h;
  if (!a && !l)
    return null;
  l ? a ? h = a[4].length > l[4].length ? a : l : h = l : h = a;
  var o, f, u, c;
  e.length > n.length ? (o = h[0], f = h[1], u = h[2], c = h[3]) : (u = h[0], c = h[1], o = h[2], f = h[3]);
  var _ = h[4];
  return [o, f, u, c, _];
};
v.prototype.diff_cleanupSemantic = function(e) {
  for (var n = !1, r = [], s = 0, i = null, t = 0, a = 0, l = 0, h = 0, o = 0; t < e.length; )
    e[t][0] == d ? (r[s++] = t, a = h, l = o, h = 0, o = 0, i = e[t][1]) : (e[t][0] == w ? h += e[t][1].length : o += e[t][1].length, i && i.length <= Math.max(a, l) && i.length <= Math.max(
      h,
      o
    ) && (e.splice(
      r[s - 1],
      0,
      [k, i]
    ), e[r[s - 1] + 1][0] = w, s--, s--, t = s > 0 ? r[s - 1] : -1, a = 0, l = 0, h = 0, o = 0, i = null, n = !0)), t++;
  for (n && this.diff_cleanupMerge(e), this.diff_cleanupSemanticLossless(e), t = 1; t < e.length; ) {
    if (e[t - 1][0] == k && e[t][0] == w) {
      var f = e[t - 1][1], u = e[t][1], c = this.diff_commonOverlap_(f, u), _ = this.diff_commonOverlap_(u, f);
      c >= _ ? (c >= f.length / 2 || c >= u.length / 2) && (e.splice(
        t,
        0,
        [d, u.substring(0, c)]
      ), e[t - 1][1] = f.substring(0, f.length - c), e[t + 1][1] = u.substring(c), t++) : (_ >= f.length / 2 || _ >= u.length / 2) && (e.splice(
        t,
        0,
        [d, f.substring(0, _)]
      ), e[t - 1][0] = w, e[t - 1][1] = u.substring(0, u.length - _), e[t + 1][0] = k, e[t + 1][1] = f.substring(_), t++), t++;
    }
    t++;
  }
};
v.prototype.diff_cleanupSemanticLossless = function(e) {
  function n(_, g) {
    if (!_ || !g)
      return 6;
    var b = _.charAt(_.length - 1), M = g.charAt(0), p = b.match(v.nonAlphaNumericRegex_), m = M.match(v.nonAlphaNumericRegex_), I = p && b.match(v.whitespaceRegex_), E = m && M.match(v.whitespaceRegex_), A = I && b.match(v.linebreakRegex_), y = E && M.match(v.linebreakRegex_), D = A && _.match(v.blanklineEndRegex_), C = y && g.match(v.blanklineStartRegex_);
    return D || C ? 5 : A || y ? 4 : p && !I && E ? 3 : I || E ? 2 : p || m ? 1 : 0;
  }
  for (var r = 1; r < e.length - 1; ) {
    if (e[r - 1][0] == d && e[r + 1][0] == d) {
      var s = e[r - 1][1], i = e[r][1], t = e[r + 1][1], a = this.diff_commonSuffix(s, i);
      if (a) {
        var l = i.substring(i.length - a);
        s = s.substring(0, s.length - a), i = l + i.substring(0, i.length - a), t = l + t;
      }
      for (var h = s, o = i, f = t, u = n(s, i) + n(i, t); i.charAt(0) === t.charAt(0); ) {
        s += i.charAt(0), i = i.substring(1) + t.charAt(0), t = t.substring(1);
        var c = n(s, i) + n(i, t);
        c >= u && (u = c, h = s, o = i, f = t);
      }
      e[r - 1][1] != h && (h ? e[r - 1][1] = h : (e.splice(r - 1, 1), r--), e[r][1] = o, f ? e[r + 1][1] = f : (e.splice(r + 1, 1), r--));
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
  for (var n = !1, r = [], s = 0, i = null, t = 0, a = !1, l = !1, h = !1, o = !1; t < e.length; )
    e[t][0] == d ? (e[t][1].length < this.Diff_EditCost && (h || o) ? (r[s++] = t, a = h, l = o, i = e[t][1]) : (s = 0, i = null), h = o = !1) : (e[t][0] == k ? o = !0 : h = !0, i && (a && l && h && o || i.length < this.Diff_EditCost / 2 && a + l + h + o == 3) && (e.splice(
      r[s - 1],
      0,
      [k, i]
    ), e[r[s - 1] + 1][0] = w, s--, i = null, a && l ? (h = o = !0, s = 0) : (s--, t = s > 0 ? r[s - 1] : -1, h = o = !1), n = !0)), t++;
  n && this.diff_cleanupMerge(e);
};
v.prototype.diff_cleanupMerge = function(e) {
  e.push([d, ""]);
  for (var n = 0, r = 0, s = 0, i = "", t = "", a; n < e.length; )
    switch (e[n][0]) {
      case w:
        s++, t += e[n][1], n++;
        break;
      case k:
        r++, i += e[n][1], n++;
        break;
      case d:
        r + s > 1 ? (r !== 0 && s !== 0 && (a = this.diff_commonPrefix(t, i), a !== 0 && (n - r - s > 0 && e[n - r - s - 1][0] == d ? e[n - r - s - 1][1] += t.substring(0, a) : (e.splice(0, 0, [
          d,
          t.substring(0, a)
        ]), n++), t = t.substring(a), i = i.substring(a)), a = this.diff_commonSuffix(t, i), a !== 0 && (e[n][1] = t.substring(t.length - a) + e[n][1], t = t.substring(0, t.length - a), i = i.substring(0, i.length - a))), r === 0 ? e.splice(
          n - s,
          r + s,
          [w, t]
        ) : s === 0 ? e.splice(
          n - r,
          r + s,
          [k, i]
        ) : e.splice(
          n - r - s,
          r + s,
          [k, i],
          [w, t]
        ), n = n - r - s + (r ? 1 : 0) + (s ? 1 : 0) + 1) : n !== 0 && e[n - 1][0] == d ? (e[n - 1][1] += e[n][1], e.splice(n, 1)) : n++, s = 0, r = 0, i = "", t = "";
        break;
    }
  e[e.length - 1][1] === "" && e.pop();
  var l = !1;
  for (n = 1; n < e.length - 1; )
    e[n - 1][0] == d && e[n + 1][0] == d && (e[n][1].substring(e[n][1].length - e[n - 1][1].length) == e[n - 1][1] ? (e[n][1] = e[n - 1][1] + e[n][1].substring(0, e[n][1].length - e[n - 1][1].length), e[n + 1][1] = e[n - 1][1] + e[n + 1][1], e.splice(n - 1, 1), l = !0) : e[n][1].substring(0, e[n + 1][1].length) == e[n + 1][1] && (e[n - 1][1] += e[n + 1][1], e[n][1] = e[n][1].substring(e[n + 1][1].length) + e[n + 1][1], e.splice(n + 1, 1), l = !0)), n++;
  l && this.diff_cleanupMerge(e);
};
v.prototype.diff_xIndex = function(e, n) {
  var r = 0, s = 0, i = 0, t = 0, a;
  for (a = 0; a < e.length && (e[a][0] !== w && (r += e[a][1].length), e[a][0] !== k && (s += e[a][1].length), !(r > n)); a++)
    i = r, t = s;
  return e.length != a && e[a][0] === k ? t : t + (n - i);
};
v.prototype.diff_prettyHtml = function(e) {
  for (var n = [], r = /&/g, s = /</g, i = />/g, t = /\n/g, a = 0; a < e.length; a++) {
    var l = e[a][0], h = e[a][1], o = h.replace(r, "&amp;").replace(s, "&lt;").replace(i, "&gt;").replace(t, "&para;<br>");
    switch (l) {
      case w:
        n[a] = '<ins style="background:#e6ffe6;">' + o + "</ins>";
        break;
      case k:
        n[a] = '<del style="background:#ffe6e6;">' + o + "</del>";
        break;
      case d:
        n[a] = "<span>" + o + "</span>";
        break;
    }
  }
  return n.join("");
};
v.prototype.diff_text1 = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    e[r][0] !== w && (n[r] = e[r][1]);
  return n.join("");
};
v.prototype.diff_text2 = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    e[r][0] !== k && (n[r] = e[r][1]);
  return n.join("");
};
v.prototype.diff_levenshtein = function(e) {
  for (var n = 0, r = 0, s = 0, i = 0; i < e.length; i++) {
    var t = e[i][0], a = e[i][1];
    switch (t) {
      case w:
        r += a.length;
        break;
      case k:
        s += a.length;
        break;
      case d:
        n += Math.max(r, s), r = 0, s = 0;
        break;
    }
  }
  return n += Math.max(r, s), n;
};
v.prototype.diff_toDelta = function(e) {
  for (var n = [], r = 0; r < e.length; r++)
    switch (e[r][0]) {
      case w:
        n[r] = "+" + encodeURI(e[r][1]);
        break;
      case k:
        n[r] = "-" + e[r][1].length;
        break;
      case d:
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
          r[s++] = [w, decodeURI(l)];
        } catch {
          throw new Error("Illegal escape in diff_fromDelta: " + l);
        }
        break;
      case "-":
      case "=":
        var h = parseInt(l, 10);
        if (isNaN(h) || h < 0)
          throw new Error("Invalid number in diff_fromDelta: " + l);
        var o = e.substring(i, i += h);
        t[a].charAt(0) == "=" ? r[s++] = [d, o] : r[s++] = [k, o];
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
  function t(E, A) {
    var y = E / n.length, D = Math.abs(r - A);
    return i.Match_Distance ? y + D / i.Match_Distance : D ? 1 : y;
  }
  var a = this.Match_Threshold, l = e.indexOf(n, r);
  l != -1 && (a = Math.min(t(0, l), a), l = e.lastIndexOf(n, r + n.length), l != -1 && (a = Math.min(t(0, l), a)));
  var h = 1 << n.length - 1;
  l = -1;
  for (var o, f, u = n.length + e.length, c, _ = 0; _ < n.length; _++) {
    for (o = 0, f = u; o < f; )
      t(_, r + f) <= a ? o = f : u = f, f = Math.floor((u - o) / 2 + o);
    u = f;
    var g = Math.max(1, r - f + 1), b = Math.min(r + f, e.length) + n.length, M = Array(b + 2);
    M[b + 1] = (1 << _) - 1;
    for (var p = b; p >= g; p--) {
      var m = s[e.charAt(p - 1)];
      if (_ === 0 ? M[p] = (M[p + 1] << 1 | 1) & m : M[p] = (M[p + 1] << 1 | 1) & m | ((c[p + 1] | c[p]) << 1 | 1) | c[p + 1], M[p] & h) {
        var I = t(_, p - 1);
        if (I <= a)
          if (a = I, l = p - 1, l > r)
            g = Math.max(1, 2 * r - l);
          else
            break;
      }
    }
    if (t(_ + 1, r) > a)
      break;
    c = M;
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
    i && e.diffs.unshift([d, i]);
    var t = n.substring(
      e.start2 + e.length1,
      e.start2 + e.length1 + s
    );
    t && e.diffs.push([d, t]), e.start1 -= i.length, e.start2 -= i.length, e.length1 += i.length + t.length, e.length2 += i.length + t.length;
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
  for (var t = [], a = new v.patch_obj(), l = 0, h = 0, o = 0, f = s, u = s, c = 0; c < i.length; c++) {
    var _ = i[c][0], g = i[c][1];
    switch (!l && _ !== d && (a.start1 = h, a.start2 = o), _) {
      case w:
        a.diffs[l++] = i[c], a.length2 += g.length, u = u.substring(0, o) + g + u.substring(o);
        break;
      case k:
        a.length1 += g.length, a.diffs[l++] = i[c], u = u.substring(0, o) + u.substring(o + g.length);
        break;
      case d:
        g.length <= 2 * this.Patch_Margin && l && i.length != c + 1 ? (a.diffs[l++] = i[c], a.length1 += g.length, a.length2 += g.length) : g.length >= 2 * this.Patch_Margin && l && (this.patch_addContext_(a, f), t.push(a), a = new v.patch_obj(), l = 0, f = u, h = o);
        break;
    }
    _ !== w && (h += g.length), _ !== k && (o += g.length);
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
    var a = e[t].start2 + s, l = this.diff_text1(e[t].diffs), h, o = -1;
    if (l.length > this.Match_MaxBits ? (h = this.match_main(
      n,
      l.substring(0, this.Match_MaxBits),
      a
    ), h != -1 && (o = this.match_main(
      n,
      l.substring(l.length - this.Match_MaxBits),
      a + l.length - this.Match_MaxBits
    ), (o == -1 || h >= o) && (h = -1))) : h = this.match_main(n, l, a), h == -1)
      i[t] = !1, s -= e[t].length2 - e[t].length1;
    else {
      i[t] = !0, s = h - a;
      var f;
      if (o == -1 ? f = n.substring(h, h + l.length) : f = n.substring(h, o + this.Match_MaxBits), l == f)
        n = n.substring(0, h) + this.diff_text2(e[t].diffs) + n.substring(h + l.length);
      else {
        var u = this.diff_main(l, f, !1);
        if (l.length > this.Match_MaxBits && this.diff_levenshtein(u) / l.length > this.Patch_DeleteThreshold)
          i[t] = !1;
        else {
          this.diff_cleanupSemanticLossless(u);
          for (var c = 0, _, g = 0; g < e[t].diffs.length; g++) {
            var b = e[t].diffs[g];
            b[0] !== d && (_ = this.diff_xIndex(u, c)), b[0] === w ? n = n.substring(0, h + _) + b[1] + n.substring(h + _) : b[0] === k && (n = n.substring(0, h + _) + n.substring(h + this.diff_xIndex(
              u,
              c + b[1].length
            ))), b[0] !== k && (c += b[1].length);
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
  if (t.length == 0 || t[0][0] != d)
    t.unshift([d, r]), i.start1 -= n, i.start2 -= n, i.length1 += n, i.length2 += n;
  else if (n > t[0][1].length) {
    var a = n - t[0][1].length;
    t[0][1] = r.substring(t[0][1].length) + t[0][1], i.start1 -= a, i.start2 -= a, i.length1 += a, i.length2 += a;
  }
  if (i = e[e.length - 1], t = i.diffs, t.length == 0 || t[t.length - 1][0] != d)
    t.push([d, r]), i.length1 += n, i.length2 += n;
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
        var l = new v.patch_obj(), h = !0;
        for (l.start1 = i - a.length, l.start2 = t - a.length, a !== "" && (l.length1 = l.length2 = a.length, l.diffs.push([d, a])); s.diffs.length !== 0 && l.length1 < n - this.Patch_Margin; ) {
          var o = s.diffs[0][0], f = s.diffs[0][1];
          o === w ? (l.length2 += f.length, t += f.length, l.diffs.push(s.diffs.shift()), h = !1) : o === k && l.diffs.length == 1 && l.diffs[0][0] == d && f.length > 2 * n ? (l.length1 += f.length, i += f.length, h = !1, l.diffs.push([o, f]), s.diffs.shift()) : (f = f.substring(
            0,
            n - l.length1 - this.Patch_Margin
          ), l.length1 += f.length, i += f.length, o === d ? (l.length2 += f.length, t += f.length) : h = !1, l.diffs.push([o, f]), f == s.diffs[0][1] ? s.diffs.shift() : s.diffs[0][1] = s.diffs[0][1].substring(f.length));
        }
        a = this.diff_text2(l.diffs), a = a.substring(a.length - this.Patch_Margin);
        var u = this.diff_text1(s.diffs).substring(0, this.Patch_Margin);
        u !== "" && (l.length1 += u.length, l.length2 += u.length, l.diffs.length !== 0 && l.diffs[l.diffs.length - 1][0] === d ? l.diffs[l.diffs.length - 1][1] += u : l.diffs.push([d, u])), h || e.splice(++r, 0, l);
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
        var h = decodeURI(r[s].substring(1));
      } catch {
        throw new Error("Illegal escape in patch_fromText: " + h);
      }
      if (l == "-")
        a.diffs.push([k, h]);
      else if (l == "+")
        a.diffs.push([w, h]);
      else if (l == " ")
        a.diffs.push([d, h]);
      else {
        if (l == "@")
          break;
        if (l !== "")
          throw new Error('Invalid patch mode "' + l + '" in: ' + h);
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
      case w:
        s = "+";
        break;
      case k:
        s = "-";
        break;
      case d:
        s = " ";
        break;
    }
    r[i + 1] = s + encodeURI(this.diffs[i][1]) + `
`;
  }
  return r.join("").replace(/%20/g, " ");
};
var L = /* @__PURE__ */ ((e) => (e[e.BLOCK_SOURCE_BASE = 0] = "BLOCK_SOURCE_BASE", e[e.BLOCK_SOURCE_BRANCH = 1] = "BLOCK_SOURCE_BRANCH", e))(L || {});
const K = JSON.stringify({
  format: "Markdown",
  toc: !1,
  parse_outline_only: !1,
  export_md_remove_options: [],
  heading_to_list: !1,
  heading_number: !1,
  keep_line_break: !0
}), j = /^[0-9a-fA-F\-]{32,40}$/, T = "$PROPERTY!!DRAWER!!UUID$", Q = /^(\s*)/;
function $(e) {
  for (const [n, r, s] of e)
    if (n == "id")
      return r;
}
class Y {
  constructor(n, r = K) {
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
    for (const o of s) {
      const f = o[1], u = i.slice(f.start_pos, f.end_pos), c = this.byteDecoder.decode(u);
      c[c.length - 1] === `
` ? r.push(c.substring(0, c.length - 1)) : r.push(c);
    }
    const t = [];
    let a = [], l, h;
    for (let o = 0; o < s.length; o++) {
      const f = s[o];
      if (f[0][0] == "Property_Drawer") {
        const u = f[0][1], c = $(u);
        c && t.length > 0 && j.test(c) ? (h = c, a.push(r[o].replace(c, T))) : a.push(r[o]);
        continue;
      } else if (f[0][0] != "Heading") {
        a.push(r[o]);
        continue;
      }
      a.length > 0 && t.push({ lines: a, uuid: h, level: l }), a = [], h = void 0, a.push(r[o]), l = f[0][1].level;
    }
    return a.length > 0 && t.push({ lines: a, level: l }), t;
  }
  parseMarkdownBlocksAndIndents(n, r) {
    const s = this.parseBlocks(n), i = [];
    for (const t of s) {
      const a = t.lines, l = [];
      for (const [h, o] of a.entries()) {
        const f = Q.exec(o), u = (f == null ? void 0 : f[1]) || "", c = o.substring(u.length + (h > 0 ? 0 : 2), o.length);
        l.push(c);
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
function z(e) {
  let r = e.body.split(`
`).map((s, i) => {
    const t = (e.level || 1) - 1;
    return "	".repeat(t) + (i == 0 ? "- " : "  ") + s;
  }).join(`
`);
  return r.includes(T) && (e.uuid || console.warn("Block content contains UUID placeholder but block has no UUID"), r = r.replace(T, e.uuid || "")), r;
}
const R = new v();
function J(e, n) {
  let r = R.diff_linesToChars_(e, n);
  const s = r.chars1, i = r.chars2, t = r.lineArray, a = R.diff_main(s, i, !1);
  return R.diff_charsToLines_(a, t), a.map((h) => h[1].endsWith(`
`) ? h[1].slice(0, h[1].length - 1) : h[1]).join(`
`);
}
function P(e) {
  let n = !0, r, s = [];
  for (const g of e)
    g[1].src === L.BLOCK_SOURCE_BASE ? r = g : s.push(g);
  if (r || (r = e[0], s = e.slice(1), n = !1), !n) {
    const g = [r].concat(s), b = S(g).map((m) => m[1]), M = [[B.DIFF_EQUAL, b[0]]], p = b.slice(1).map((m) => [B.DIFF_INSERT, m]);
    return M.concat(p);
  }
  const i = r[1], t = s.map((g) => g[1]), a = i.body, l = {
    src: i.src,
    uuid: i.uuid,
    body: i.body,
    level: i.level
  };
  let h = !1, o = l.body;
  const f = [];
  for (const g of t) {
    const b = g.body;
    if (g.uuid && l.uuid && g.uuid != l.uuid) {
      f.push(g);
      continue;
    }
    if (h && o != b && a != b) {
      f.push(g);
      continue;
    }
    !h && a != b && (h = !0, o = b, l.body = g.body, l.src = g.src), !l.uuid && g.uuid && (l.uuid = g.uuid, l.src = g.src), g.level && i.level != g.level && (l.level = g.level, l.src = g.src);
  }
  const u = [[B.DIFF_EQUAL, l]], c = f.map((g) => [B.DIFF_INSERT, g]), _ = S(c);
  return u.concat(_);
}
function S(e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), i = [];
  let t = 0;
  for (const a of e) {
    const l = a[1].body, h = a[1].uuid;
    if (h && s.has(h)) {
      r.get(h).has(l) || r.get(h).add(l);
      continue;
    }
    (h || !n.has(l)) && (n.has(l) || n.set(l, t), h && !s.has(h) && (s.set(h, t), r.set(h, /* @__PURE__ */ new Set([l]))), i.push(a[1]), t += 1);
  }
  for (const a of r.keys()) {
    const l = r.get(a);
    if (l.size > 1) {
      const h = s.get(a), o = i[h], f = o.body;
      let u = f;
      for (const c of l)
        c != f && (u = J(u, c));
      i[h] = {
        src: o.src,
        uuid: o.uuid,
        body: u,
        level: o.level
      };
    }
  }
  return i.map((a) => [B.DIFF_INSERT, a]);
}
var B = /* @__PURE__ */ ((e) => (e[e.DIFF_DELETE = -1] = "DIFF_DELETE", e[e.DIFF_EQUAL = 0] = "DIFF_EQUAL", e[e.DIFF_INSERT = 1] = "DIFF_INSERT", e))(B || {});
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
    for (var h = 0; h < n.length; h++) {
      const o = n[h][0], f = n[h][1];
      if (o != 1) {
        o == -1 && (l = i.length);
        for (const u of f) {
          let c = [];
          o == 0 ? (t += 1, a += 1, c = P([[o, r[t]], [o, s[a]]])) : (t += 1, c = [[o, r[t]]]), i.push(c);
        }
        o == 0 && (l = i.length - 1);
      } else
        for (const u of f) {
          a += 1;
          const c = [o, s[a]];
          i[l] === void 0 && (i[l] = []), i[l].push(c);
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
    R.Diff_Timeout = n;
  }
  /**
   * The diff steps, in order of the block position in the base
   */
  diff_logseqMode(n, r) {
    const s = this.charHash.diff_blocksToChars(n), i = this.charHash.diff_blocksToChars(r), t = R.diff_main(s, i, !1);
    return this.charHash.diff_charsToBlocks(t, n, r);
  }
  /**
   * differentiate the baseInsert and newInsert, keep all the non-overlapping operations
   */
  diff_insert_ops(n, r) {
    return this.diff_logseqMode(n.map((t) => t[1]), r.map((t) => t[1])).flat(1).map((t) => [B.DIFF_INSERT, t[1]]);
  }
}
function Z(e, n, r) {
  const s = document.createElement("div");
  let i = 0;
  for (const [t, a] of e.entries())
    for (const l of a) {
      const [h, o] = l, f = z(l[1]), u = document.createElement("tr");
      if (u.style.padding = "0 0.2em", u.style.borderRadius = "0.2em", n) {
        const g = document.createElement("td");
        g.innerText = h === B.DIFF_INSERT ? "" : n[t], g.style.opacity = "0.5", u.appendChild(g);
      }
      if (r) {
        const g = document.createElement("td");
        g.innerText = h === B.DIFF_DELETE ? "" : r[i], g.style.opacity = "0.5", u.appendChild(g);
      }
      const c = document.createElement("td");
      c.innerText = t.toString(), c.style.borderRight = "1px solid #e1e4e8";
      const _ = document.createElement("td");
      switch (_.innerText = f, _.style.whiteSpace = "pre", u.appendChild(c), u.appendChild(_), h) {
        case B.DIFF_INSERT:
          u.style.backgroundColor = "#e6ffed", u.style.color = "#24292e";
          break;
        case B.DIFF_EQUAL:
          u.style.color = "#24292e", o.src === L.BLOCK_SOURCE_BRANCH && (u.style.backgroundColor = "#fff2cc");
          break;
        case B.DIFF_DELETE:
          u.style.backgroundColor = "#ffeef0", u.style.color = "#24292e", u.style.textDecoration = "line-through";
          break;
      }
      s.appendChild(u), h !== B.DIFF_DELETE && (i += 1);
    }
  return s;
}
function O(e) {
  const n = [[], [], []];
  for (const r of e)
    n[r[0] + 1].push(r);
  return n;
}
class q {
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
      (o) => s.diff_logseqMode(n, o)
    ), t = [], a = i.reduce((o, f) => {
      for (const [u, c] of f.entries())
        if (o[u] === void 0)
          o[u] = O(c);
        else {
          const _ = O(c);
          o[u][0] = o[u][0].concat(_[0]), o[u][1] = o[u][1].concat(_[1]), o[u][2] = s.diff_insert_ops(o[u][2], _[2]);
        }
      return o;
    }, t), l = [];
    let h = 0;
    for (const [o, f] of a.entries()) {
      const [u, c, _] = f;
      if (u.length >= 1)
        l.push([[B.DIFF_DELETE, n[o]]]), h += 1;
      else if (c.length >= 1) {
        const b = P(c);
        l.push(b), h += 1;
      } else
        console.warn(`No DIFF_EQUAL or DIFF_DELETE at position ${o}`);
      const g = S(_);
      h === 0 ? (l.push(g), h += 1) : l[h - 1] = l[h - 1].concat(g);
    }
    return l;
  }
}
export {
  V as Differ,
  q as Merger,
  Y as Parser,
  Z as visualizeAsHTML
};
