(* Port of logseq.common.uuid (deps/common/src/logseq/common/uuid.cljs).

   cljs (hash x) is murmur3 hashUnencodedChars over UTF-16 code units for
   both strings and keywords — verified against the db-sync fixtures
   (hash :logseq.class/Root) = 273783827 and (hash "Library") =
   1294776560, matching the deterministic uuids
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
  let h' = Int32.logxor h' (Int32.of_int n) in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 16) in
  let h' = Int32.mul h' 0x85ebca6bl in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 13) in
  let h' = Int32.mul h' 0xc2b2ae35l in
  let _ = i32 in
  Int32.to_int (Int32.logxor h' (Int32.shift_right_logical h' 16))

let hash_string = hash_unencoded_chars
let hash_keyword = hash_unencoded_chars

(* common-uuid/fill-with-0 *)
let fill_with_0 (s : string) (n : int) : string =
  let len = String.length s in
  if len >= n then s else String.make (n - len) '0' ^ s

(* cljs subs = JS substring (clamps to length, empty past end). *)
let clamp_sub (s : string) (start : int) : string =
  let n = String.length s in
  if start >= n then "" else String.sub s start (n - start)

let clamp_sub_n (s : string) (start : int) (fin : int) : string =
  let n = String.length s in
  let fin = min fin n in
  if start >= fin then "" else String.sub s start (fin - start)

(* common-uuid/gen-block-uuid: [prefix]-abs-hash padded 4-4-4-12 *)
let gen_block_uuid (prefix : string) (s : string) : string =
  let h = Printf.sprintf "%d" (abs (hash_string s)) in
  Printf.sprintf "%s-%s-%s-%s-%s" prefix
    (fill_with_0 (clamp_sub_n h 0 4) 4)
    (fill_with_0 (clamp_sub_n h 4 8) 4)
    (fill_with_0 (clamp_sub_n h 8 12) 4)
    (fill_with_0 (clamp_sub h 12) 12)

(* common-uuid/gen-journal-page-uuid — cljs takes a yyyyMMdd integer. *)
let gen_journal_page_uuid (day : int) : string =
  Printf.sprintf "00000001-%04d-%04d-0000-000000000000" (day / 10000) (day mod 10000)

(* common-uuid/gen-uuid — hash-seeded kinds:
   :db-ident-block-uuid 00000002, :migrate-new-block-uuid 00000003,
   :builtin-block-uuid 00000004, :view-block-uuid 00000006.
   (:journal-page-uuid is separate: it hashes nothing.) *)
let gen_uuid (kind : string) (seed : string) : string =
  gen_block_uuid
    (match kind with
     | "db-ident-block-uuid" -> "00000002"
     | "migrate-new-block-uuid" -> "00000003"
     | "builtin-block-uuid" -> "00000004"
     | "view-block-uuid" -> "00000006"
     | _ -> invalid_arg ("unknown gen-uuid kind " ^ kind))
    seed

(* ldb/new-block-id / common-uuid/gen-uuid () — datascript squuid. *)
let new_block_id () : string =
  match Datascript.squuid () with
  | Datascript.Uuid u -> u
  | _ -> invalid_arg "squuid did not return a uuid"

(* common-uuid/gen-journal-template-block — persistent uuid for a
   journal's template block. *)
let gen_journal_template_block (journal_uuid : string) (template_block_uuid : string)
    : string =
  "00000005-" ^ String.sub journal_uuid 9 14
  ^ String.sub template_block_uuid 23 (String.length template_block_uuid - 23)
