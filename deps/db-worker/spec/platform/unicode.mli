(* Unicode text normalization (page-name sanity uses NFC). *)
val nfc : string -> string

(* NFKC/NFD — cljs String.prototype.normalize. Search index
   sanitize/search-normalize use NFKC + accent stripping. *)
val nfkc : string -> string
val nfd : string -> string

(* Full-Unicode lowercase — cljs clojure.string/lower-case
   (String.prototype.toLowerCase on melange, uucp on native). *)
val lowercase : string -> string
