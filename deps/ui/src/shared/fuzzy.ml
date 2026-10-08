(* Port of src/main/frontend/common/search_fuzzy.cljs (score +
   fuzzy-search) so [[ ]] and # popups rank like cljs. Accent handling:
   NFD + strip combining marks approximates the remove-accents lib for
   Latin input; CJK is unaffected. Char iteration is over UTF-8 bytes —
   equivalent to cljs UTF-16 unit iteration for ASCII and still correct
   subsequence behavior for multi-byte chars.

   Portability: String.prototype.normalize('NFKC') and
   String.prototype.toLowerCase() are implemented over the generated
   Unicode_data per-codepoint tables so the module compiles in byte,
   native, and Melange modes. Sequence-level NFKC details (canonical
   ordering of combining marks, composition) are outside the search
   use-case: precomposed Latin input decomposes identically. *)

(* ---- UTF-8 codepoint iteration ---- *)

let decode_utf8 s i =
  let n = String.length s in
  let byte j = Char.code s.[i + j] in
  let cont j =
    if i + j < n then byte j land 0x3F else 0
  in
  let c = byte 0 in
  if c < 0x80 then (c, 1)
  else if c < 0xC0 then (0xFFFD, 1)
  else if c < 0xE0 then (((c land 0x1F) lsl 6) lor cont 1, 2)
  else if c < 0xF0 then
    (((c land 0x0F) lsl 12) lor (cont 1 lsl 6) lor cont 2, 3)
  else if c < 0xF8 then
    (((c land 0x07) lsl 18) lor (cont 1 lsl 12) lor (cont 2 lsl 6)
     lor cont 3, 4)
  else (0xFFFD, 1)

(* binary search in a sorted (codepoint, replacement) table *)
let lookup table cp =
  let lo = ref 0 and hi = ref (Array.length table - 1) and hit = ref None in
  while !lo <= !hi && !hit = None do
    let mid = (!lo + !hi) / 2 in
    let k, v = table.(mid) in
    if k = cp then hit := Some v
    else if k < cp then lo := mid + 1
    else hi := mid - 1
  done;
  !hit

let map_codepoints table s =
  let n = String.length s in
  let b = Buffer.create n in
  let i = ref 0 in
  while !i < n do
    let cp, w = decode_utf8 s !i in
    (match lookup table cp with
     | Some rep -> Buffer.add_string b rep
     | None -> Buffer.add_substring b s !i w);
    i := !i + w
  done;
  Buffer.contents b

(* String.prototype.normalize('NFKC'), per codepoint *)
let nfkd s = map_codepoints Unicode_data.nfkd s

(* String.prototype.toLowerCase(): per codepoint, plus the
   string-final sigma fix (U+03C3 -> U+03C2). *)
let lowercase s =
  let r = map_codepoints Unicode_data.lower s in
  let n = String.length r in
  if n >= 2 && Char.code r.[n - 2] = 0xCF && Char.code r.[n - 1] = 0x83 then begin
    let b = Bytes.of_string r in
    Bytes.set b (n - 1) '\x82';
    Bytes.unsafe_to_string b
  end else r

(* ---- original implementation (unchanged semantics) ---- *)

let strip_combining s =
  let n = String.length s in
  let b = Buffer.create n in
  let i = ref 0 in
  while !i < n do
    let c = Char.code s.[!i] in
    if c = 0xCC && !i + 1 < n then
      (* U+0300–U+036F encode as 0xCC 0x80–0xBF *)
      let c2 = Char.code s.[!i + 1] in
      if c2 >= 0x80 && c2 <= 0xBF then i := !i + 2
      else begin
        Buffer.add_char b s.[!i];
        incr i
      end
    else begin
      Buffer.add_char b s.[!i];
      incr i
    end
  done;
  Buffer.contents b

let clean_str s =
  let s = lowercase s in
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
      match c with
      | '[' | ']' | ' ' | '\\' | '/' | '_' | '(' | ')' -> ()
      | _ -> Buffer.add_char b c)
    s;
  Buffer.contents b

let search_normalize s = strip_combining (nfkd s)

let max_string_length = 1000.0

let str_len_distance s1 s2 =
  let c1 = float_of_int (String.length s1) in
  let c2 = float_of_int (String.length s2) in
  let maxed = Float.max c1 c2 in
  if maxed = 0.0 then 1.0
  else
    let mined = Float.min c1 c2 in
    1.0 -. (maxed -. mined) /. maxed

let starts_with s prefix =
  let n = String.length prefix in
  String.length s >= n && String.sub s 0 n = prefix

let index_of s sub =
  let n = String.length s and m = String.length sub in
  let rec scan i =
    if i + m > n then None
    else if String.sub s i m = sub then Some i
    else scan (i + 1)
  in
  if m = 0 then Some 0 else scan 0

let score oquery ostr =
  let query = search_normalize (clean_str oquery) in
  let original_s = search_normalize (clean_str ostr) in
  let qlen = String.length query and slen = String.length original_s in
  let rec loop qi si mult idx score' =
    if qi >= qlen then
      score'
      +. str_len_distance query original_s
      +. (if starts_with original_s query then max_string_length +. 10.
          else if index_of original_s query <> None then max_string_length
          else 0.)
      +. if si >= slen then 1.0 else 0.0
    else if si >= slen then 0.0
    else if query.[qi] = original_s.[si] then
      loop (qi + 1) (si + 1) (mult +. 1.) (idx -. 1.) (score' +. mult)
    else loop qi (si + 1) 1. (idx -. 1.) (score' -. 0.1)
  in
  loop 0 0 1. max_string_length 0.

(* cljs fuzzy-search-multi: max score over the extract fns, keep score>
   0, stable sort by score desc, take `limit` *)
let fuzzy_search_multi ~extract_fns ~limit data query =
  data
  |> List.filter_map (fun item ->
         let s =
           extract_fns
           |> List.filter_map (fun f ->
                  match f item with
                  | "" -> None
                  | s -> Some (score query s))
           |> List.fold_left Float.max 0.0
         in
         if s > 0.0 then Some (item, s) else None)
  |> List.stable_sort (fun (_, a) (_, b) -> Float.compare b a)
  |> (fun xs ->
       let rec take n = function
         | [] -> []
         | (it, _) :: tl when n > 0 -> it :: take (n - 1) tl
         | _ -> []
       in
       take limit xs)

let fuzzy_search ~extract ~limit data query =
  fuzzy_search_multi ~extract_fns:[ extract ] ~limit data query
