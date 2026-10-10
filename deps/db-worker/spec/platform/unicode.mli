(* Unicode text normalization (page-name sanity uses NFC). *)
val nfc : string -> string

(* NFKC/NFD — cljs String.prototype.normalize. Search index
   sanitize/search-normalize use NFKC + accent stripping. *)
val nfkc : string -> string
val nfd : string -> string

(* Full-Unicode lowercase — cljs clojure.string/lower-case
   (String.prototype.toLowerCase on melange, uucp on native). *)
val lowercase : string -> string

(* Full-Unicode uppercase — cljs clojure.string/upper-case
   (String.prototype.toUpperCase on melange, uucp on native). *)
val uppercase : string -> string

(* ECMAScript String.prototype.trim — strips WhiteSpace and
   LineTerminator code points (incl. U+00A0, U+1680, U+2000-200A,
   U+2028-2029, U+202F, U+205F, U+3000, U+FEFF), not just ASCII.
   cljs clojure.string/trim delegates to this. *)
val trim : string -> string

(* Left/right variants — cljs clojure.string/triml / trimr
   (goog.string.trimLeft/trimRight use the same WhiteSpace set). *)
val triml : string -> string
val trimr : string -> string

(* cljs clojure.string/capitalize — first char toUpperCase, rest
   toLowerCase. *)
val capitalize : string -> string

(* JS String.length / cljs (count s) — UTF-16 code units, not bytes:
   BMP code points count 1, astral 2 (surrogate pair). *)
val js_length : string -> int

(* JS (subs s start end) — slices on UTF-16 code units. Native cannot
   encode a lone surrogate, so a boundary falling inside an astral
   character keeps/drops the whole character. *)
val js_sub : string -> int -> int -> string
