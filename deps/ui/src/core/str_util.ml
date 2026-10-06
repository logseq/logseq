(* Shared string helpers — substring search, prefix/suffix tests, trim
   and substitution that used to be hand-rolled per file.

   Every comparison here is a byte-compare loop, never [String.sub]:
   under Melange [String.sub] materializes the whole string as a
   char-code array before slicing, so a per-position sub-compare is
   O(len s) per position — quadratic on buffer-scale scans. *)

(* byte-wise equality of [pat] against s[i, i+len pat) — no allocation *)
let starts_at s i pat =
  let n = String.length pat in
  i >= 0
  && i + n <= String.length s
  &&
  let rec go k = k = n || (String.unsafe_get s (i + k) = String.unsafe_get pat k && go (k + 1)) in
  go 0

(* index of needle from position i *)
let index_from s i sub =
  let n = String.length s and m = String.length sub in
  if m = 0 then Some i
  else if i < 0 || i + m > n then None
  else
    let c0 = String.unsafe_get sub 0 in
    let rec match_rest j k =
      k = m
      || (String.unsafe_get s (j + k) = String.unsafe_get sub k
          && match_rest j (k + 1))
    in
    let rec find j =
      if j + m > n then None
      else if String.unsafe_get s j <> c0 then find (j + 1)
      else if match_rest j 1 then Some j
      else find (j + 1)
    in
    find i

(* naive O(n*m) substring search; needles here are a few chars so the
   constant factor beats String.search-style machinery *)
let contains hay needle = index_from hay 0 needle <> None

let contains_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  contains h n

let index_of s sub = index_from s 0 sub

let index_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  index_of h n

let starts_with s prefix = starts_at s 0 prefix

let ends_with s suf =
  let ls = String.length s and lf = String.length suf in
  ls >= lf && starts_at s (ls - lf) suf

let starts_with_ci s prefix =
  let n = String.length prefix in
  String.length s >= n
  &&
  let rec go k =
    k = n
    || (Char.lowercase_ascii (String.unsafe_get s k)
        = Char.lowercase_ascii (String.unsafe_get prefix k)
        && go (k + 1))
  in
  go 0

(* leading whitespace: space, tab, CR *)
let ltrim s =
  let n = String.length s in
  let rec go i =
    if i < n && (s.[i] = ' ' || s.[i] = '\t' || s.[i] = '\r') then
      go (i + 1)
    else i
  in
  String.sub s (go 0) (n - go 0)

(* space, tab and newline on both ends (String.trim plus \r/\f coverage
   is a superset callers never relied on) *)
let trim = String.trim

let replace_all s ~pat ~rep =
  let n = String.length s and m = String.length pat in
  if m = 0 then s
  else
    let buf = Buffer.create n in
    let rec go i =
      if i + m <= n && starts_at s i pat then (
        Buffer.add_string buf rep;
        go (i + m))
      else if i < n then (
        Buffer.add_char buf s.[i];
        go (i + 1))
    in
    go 0;
    Buffer.contents buf

(* "\"en\"" -> "en" — storage values are edn-ish strings *)
(* "ws://host///" -> "ws://host" *)
let strip_trailing_slashes s =
  let n = String.length s in
  let j = ref n in
  while !j > 0 && s.[!j - 1] = '/' do
    decr j
  done;
  String.sub s 0 !j
