(* Port of logseq.common.uuid (deps/common/src/logseq/common/uuid.cljs).

   cljs hashes strings and keywords differently (cljs.core/hash):
   - (hash "s")        = m3-hash-int (hash-string s)  — the Java-style
                         31-mult hash over UTF-16 units, passed through the
                         murmur3 integer finalizer.
   - (hash :ns/name)   = hash-symbol + 0x9e3779b9, where
                         hash-symbol = hash-combine (m3-hash-unencoded-chars
                         name) (hash-string ns).
   Verified against cljs: (hash :logseq.class/Root) = 273783827 and
   (hash "Library") = 1294776560, matching the deterministic uuids
   00000002-2737-8382-7000-000000000000 and
   00000004-1294-7765-6000-000000000000. *)

(* UTF-8 -> UTF-16 code units (surrogate pairs for code points > 0xFFFF),
   which is what cljs string iteration yields. *)
let utf16_units (s : string) : int list =
  let n = String.length s in
  let rec decode i acc =
    if i >= n then List.rev acc
    else
      let b = Char.code s.[i] in
      if b < 0x80 then decode (i + 1) (b :: acc)
      else if b < 0xE0 then
        let cp = ((b land 0x1F) lsl 6) lor (Char.code s.[i + 1] land 0x3F) in
        decode (i + 2) (cp :: acc)
      else if b < 0xF0 then
        let cp =
          ((b land 0x0F) lsl 12)
          lor ((Char.code s.[i + 1] land 0x3F) lsl 6)
          lor (Char.code s.[i + 2] land 0x3F)
        in
        decode (i + 3) (cp :: acc)
      else
        let cp =
          ((b land 0x07) lsl 18)
          lor ((Char.code s.[i + 1] land 0x3F) lsl 12)
          lor ((Char.code s.[i + 2] land 0x3F) lsl 6)
          lor (Char.code s.[i + 3] land 0x3F)
        in
        let hi = 0xD800 + ((cp - 0x10000) lsr 10) in
        let lo = 0xDC00 + ((cp - 0x10000) land 0x3FF) in
        decode (i + 4) (lo :: hi :: acc)
  in
  decode 0 []

(* murmur3 hashUnencodedChars (clojure.lang.Murmur3). *)
let hash_unencoded_chars (s : string) : int =
  let i32 = Int32.logand in
  let mix_k1 k1 =
    let k1 = Int32.mul k1 0xcc9e2d51l in
    Int32.shift_left k1 15 |> Int32.logor (Int32.shift_right_logical k1 17)
    |> fun r -> Int32.mul r 0x1b873593l
  in
  let mix_h1 h1 k1 =
    let h1 = Int32.logxor h1 k1 in
    Int32.shift_left h1 13 |> Int32.logor (Int32.shift_right_logical h1 19)
    |> fun r -> Int32.add (Int32.mul r 5l) 0xe6546b64l
  in
  let units = Array.of_list (utf16_units s) in
  let n = Array.length units in
  let h = ref 0l in
  let i = ref 1 in
  while !i < n do
    let k1 = Int32.of_int (units.(!i - 1) lor (units.(!i) lsl 16)) in
    h := mix_h1 !h (mix_k1 k1);
    i := !i + 2
  done;
  if n land 1 = 1 then
    h := Int32.logxor !h (mix_k1 (Int32.of_int units.(n - 1)));
  let h' = !h in
  (* cljs m3-fmix receives (h1, 2 * length) — the UTF-16 byte count. *)
  let h' = Int32.logxor h' (Int32.of_int (2 * n)) in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 16) in
  let h' = Int32.mul h' 0x85ebca6bl in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 13) in
  let h' = Int32.mul h' 0xc2b2ae35l in
  let _ = i32 in
  Int32.to_int (Int32.logxor h' (Int32.shift_right_logical h' 16))

(* cljs m3_mix_K1/m3_mix_H1/m3_fmix (int32). *)
let m3_mix_k1 k1 =
  let k1 = Int32.mul k1 0xcc9e2d51l in
  Int32.mul
    (Int32.logor (Int32.shift_left k1 15) (Int32.shift_right_logical k1 17))
    0x1b873593l

let m3_mix_h1 h1 k1 =
  let h1 = Int32.logxor h1 k1 in
  Int32.add
    (Int32.mul
       (Int32.logor (Int32.shift_left h1 13) (Int32.shift_right_logical h1 19))
       5l)
    0xe6546b64l

let m3_fmix h1 len =
  let h1 = Int32.logxor h1 len in
  let h1 = Int32.logxor h1 (Int32.shift_right_logical h1 16) in
  let h1 = Int32.mul h1 0x85ebca6bl in
  let h1 = Int32.logxor h1 (Int32.shift_right_logical h1 13) in
  let h1 = Int32.mul h1 0xc2b2ae35l in
  Int32.logxor h1 (Int32.shift_right_logical h1 16)

let m3_hash_int i =
  if i = 0l then 0l else m3_fmix (m3_mix_h1 0l (m3_mix_k1 i)) 4l

(* cljs hash_string_STAR_ — Java-style (31 * h + charCode) over UTF-16 code
   units. hash-symbol hashes the namespace with this, and (hash "s") wraps it
   in m3-hash-int. *)
let hash_string_java (s : string) : int32 =
  List.fold_left
    (fun h u -> Int32.add (Int32.mul 31l h) (Int32.of_int u))
    0l (utf16_units s)

(* cljs (hash "s") = m3-hash-int (hash-string s) *)
let hash_string (s : string) : int =
  Int32.to_int (m3_hash_int (hash_string_java s))

(* cljs hash-symbol/hash-keyword: hash-combine (m3-hash-unencoded-chars name)
   (hash-string ns), then + 0x9e3779b9 for the keyword tag. *)
let hash_keyword (fqn : string) : int =
  let ns, name =
    match String.rindex_opt fqn '/' with
    | Some i ->
        Some (String.sub fqn 0 i), String.sub fqn (i + 1) (String.length fqn - i - 1)
    | None -> None, fqn
  in
  let seed = Int32.of_int (hash_unencoded_chars name) in
  let hs =
    match ns with Some ns -> hash_string_java ns | None -> 0l
  in
  let sym =
    Int32.logxor
      seed
      (Int32.add
         (Int32.add hs 0x9e3779b9l)
         (Int32.add (Int32.shift_left seed 6) (Int32.shift_right seed 2)))
  in
  Int32.to_int (Int32.add sym 0x9e3779b9l)

(* common-uuid/fill-with-0 — cljs appends zeros: s ++ "0"×(n-len). *)
let fill_with_0 (s : string) (n : int) : string =
  let len = String.length s in
  if len >= n then s else s ^ String.make (n - len) '0'

(* cljs subs = JS substring (clamps to length, empty past end). *)
let clamp_sub (s : string) (start : int) : string =
  let n = String.length s in
  if start >= n then "" else String.sub s start (n - start)

let clamp_sub_n (s : string) (start : int) (fin : int) : string =
  let n = String.length s in
  let fin = min fin n in
  if start >= fin then "" else String.sub s start (fin - start)

(* common-uuid/gen-block-uuid: [prefix]-abs-hash padded 4-4-4-12 *)
let gen_block_uuid (prefix : string) (h : int) : string =
  let h = Printf.sprintf "%d" (abs h) in
  Printf.sprintf "%s-%s-%s-%s-%s" prefix
    (fill_with_0 (clamp_sub_n h 0 4) 4)
    (fill_with_0 (clamp_sub_n h 4 8) 4)
    (fill_with_0 (clamp_sub_n h 8 12) 4)
    (fill_with_0 (clamp_sub h 12) 12)

(* common-uuid/gen-journal-page-uuid — cljs takes a yyyyMMdd integer. *)
let gen_journal_page_uuid (day : int) : string =
  Printf.sprintf "00000001-%04d-%04d-0000-000000000000" (day / 10000) (day mod 10000)

(* common-uuid/gen-uuid — :journal-page-uuid delegates to
   gen_journal_page_uuid; hash-seeded kinds:
   :db-ident-block-uuid 00000002, :migrate-new-block-uuid 00000003,
   :builtin-block-uuid 00000004, :view-block-uuid 00000006.
   cljs (hash k) on the seed value: db-ident seeds are keywords (hash-keyword);
   builtin/view/migrate seeds are strings (m3-hash-int of hash-string). *)
let gen_uuid (kind : string) (seed : string) : string =
  match kind with
  | "journal-page-uuid" -> gen_journal_page_uuid (int_of_string seed)
  | "db-ident-block-uuid" -> gen_block_uuid "00000002" (hash_keyword seed)
  | "migrate-new-block-uuid" -> gen_block_uuid "00000003" (hash_string seed)
  | "builtin-block-uuid" -> gen_block_uuid "00000004" (hash_string seed)
  | "view-block-uuid" -> gen_block_uuid "00000006" (hash_string seed)
  | _ -> invalid_arg ("unknown gen-uuid kind " ^ kind)

(* cljs dispatches (hash v) on the seed's type, so a keyword seed must
   hash via hash_keyword (e.g. :builtin-block-uuid called with
   :logseq.property/empty-placeholder in cljs create-graph). *)
let gen_uuid_keyword (kind : string) (seed : string) : string =
  match kind with
  | "migrate-new-block-uuid" -> gen_block_uuid "00000003" (hash_keyword seed)
  | "builtin-block-uuid" -> gen_block_uuid "00000004" (hash_keyword seed)
  | "view-block-uuid" -> gen_block_uuid "00000006" (hash_keyword seed)
  | _ -> invalid_arg ("unknown gen-uuid kind " ^ kind)

(* test hook — sim installs a deterministic generator so seeded runs are
   reproducible; production stays datascript squuid (wall-clock + random) *)
let new_block_id_override : (unit -> string) option ref = ref None

(* ldb/new-block-id / common-uuid/gen-uuid () — datascript squuid. *)
let new_block_id () : string =
  match !new_block_id_override with
  | Some f -> f ()
  | None -> (
      match Datascript.squuid () with
      | Datascript.Uuid u -> u
      | _ -> invalid_arg "squuid did not return a uuid")

(* common-uuid/gen-journal-template-block — persistent uuid for a
   journal's template block. *)
let gen_journal_template_block (journal_uuid : string) (template_block_uuid : string)
    : string =
  "00000005-" ^ String.sub journal_uuid 9 14
  ^ String.sub template_block_uuid 23 (String.length template_block_uuid - 23)
