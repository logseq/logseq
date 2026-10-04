(* Shared string helpers — substring search, prefix/suffix tests, trim
   and substitution that used to be hand-rolled per file. *)

(* naive O(n*m) substring search; needles here are a few chars so the
   constant factor beats String.search-style machinery *)
let contains hay needle =
  let lh = String.length hay and ln = String.length needle in
  let rec go i = i + ln <= lh && (String.sub hay i ln = needle || go (i + 1)) in
  ln = 0 || go 0

let contains_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  contains h n

(* index of needle from position i *)
let index_from s i sub =
  let n = String.length s and m = String.length sub in
  if m = 0 then Some i
  else if i < 0 || i + m > n then None
  else
    let rec find j =
      if j + m > n then None
      else if String.sub s j m = sub then Some j
      else find (j + 1)
    in
    find i

let index_of s sub = index_from s 0 sub

let index_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  index_of h n

let starts_with s prefix =
  let lp = String.length prefix in
  String.length s >= lp && String.sub s 0 lp = prefix

let ends_with s suf =
  let ls = String.length s and lf = String.length suf in
  ls >= lf && String.sub s (ls - lf) lf = suf

let starts_with_ci s prefix =
  let n = String.length prefix in
  String.length s >= n
  && String.lowercase_ascii (String.sub s 0 n)
     = String.lowercase_ascii prefix

(* prefix test at an explicit offset *)
let starts_at s i pat =
  let n = String.length pat in
  i + n <= String.length s && String.sub s i n = pat

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
      if i + m <= n && String.sub s i m = pat then (
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
