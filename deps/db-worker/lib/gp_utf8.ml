(* logseq.graph-parser.utf8 — OCaml strings are already UTF-8 byte arrays,
   so encode is identity and substring is a byte-range slice. *)

let encode (s : string) : string = s

let decode (arr : string) : string = arr

let substring (arr : string) (start : int) ?end_ () : string =
  let n = String.length arr in
  let start = min (max start 0) n in
  let end_ = match end_ with Some e -> min e n | None -> n in
  if end_ <= start then "" else String.sub arr start (end_ - start)
