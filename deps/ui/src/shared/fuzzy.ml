(* Port of src/main/frontend/common/search_fuzzy.cljs (score +
   fuzzy-search) so [[ ]] and # popups rank like cljs. Accent handling:
   NFD + strip combining marks approximates the remove-accents lib for
   Latin input; CJK is unaffected. Normalize host text to UTF-8 at the
   scoring boundary, then compare complete Unicode characters.

   Portability: String.prototype.normalize('NFKC') and
   String.prototype.toLowerCase() are implemented over the generated
   Unicode_data per-codepoint tables so the module compiles in byte,
   native, and Melange modes. Sequence-level NFKC details (canonical
   ordering of combining marks, composition) are outside the search
   use-case: precomposed Latin input decomposes identically. *)

(* Native text is UTF-8; Melange text contains UTF-16 code units. The
   normalization tables below contain UTF-8 bytes on every backend. *)
let utf8_bytes text =
  match Sys.backend_type with
  | Native | Bytecode -> text
  | Other "Melange" ->
      if not (String.exists (fun c -> Char.code c >= 0x80) text) then text
      else
        let buffer = Buffer.create (String.length text) in
        let index = ref 0 in
        while !index < String.length text do
          let first = Char.code text.[!index] in
          incr index;
          let codepoint =
            if first >= 0xD800 && first <= 0xDBFF
               && !index < String.length text then
              let second = Char.code text.[!index] in
              if second >= 0xDC00 && second <= 0xDFFF then begin
                incr index;
                0x10000 + ((first - 0xD800) lsl 10) + second - 0xDC00
              end else first
            else first in
          Buffer.add_utf_8_uchar buffer (Uchar.of_int codepoint)
        done;
        Buffer.contents buffer
  | Other backend -> invalid_arg ("Fuzzy: unsupported text backend " ^ backend)

(* Internal normalization helpers consume UTF-8 bytes. Public scoring
   and search functions accept host text and return original items. *)

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
    let decoded = String.get_utf_8_uchar s !i in
    let cp = Uchar.to_int (Uchar.utf_decode_uchar decoded) in
    let w = Uchar.utf_decode_length decoded in
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
  let length text = String.fold_left (fun count c ->
      if Char.code c land 0xC0 = 0x80 then count else count + 1) 0 text in
  let c1 = float_of_int (length s1) in
  let c2 = float_of_int (length s2) in
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
  let query = search_normalize (clean_str (utf8_bytes oquery)) in
  let original_s = search_normalize (clean_str (utf8_bytes ostr)) in
  let qlen = String.length query and slen = String.length original_s in
  let rec loop qi si mult score' =
    if qi >= qlen then
      score'
      +. str_len_distance query original_s
      +. (if starts_with original_s query then max_string_length +. 10.
          else if index_of original_s query <> None then max_string_length
          else 0.)
      +. if si >= slen then 1.0 else 0.0
    else if si >= slen then 0.0
    else
      let query_char = String.get_utf_8_uchar query qi in
      let text_char = String.get_utf_8_uchar original_s si in
      let next_text = si + Uchar.utf_decode_length text_char in
      if Uchar.utf_decode_uchar query_char = Uchar.utf_decode_uchar text_char then
        loop (qi + Uchar.utf_decode_length query_char) next_text
          (mult +. 1.) (score' +. mult)
      else loop qi next_text 1. (score' -. 0.1)
  in
  loop 0 0 1. 0.

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
