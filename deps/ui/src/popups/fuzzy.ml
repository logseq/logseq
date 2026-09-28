(* Port of src/main/frontend/common/search_fuzzy.cljs (score +
   fuzzy-search) so [[ ]] and # popups rank like cljs. Accent handling:
   NFD + strip combining marks approximates the remove-accents lib for
   Latin input; CJK is unaffected. Char iteration is over UTF-8 bytes —
   equivalent to cljs UTF-16 unit iteration for ASCII and still correct
   subsequence behavior for multi-byte chars. *)

external normalize_ : string -> string -> string = "normalize" [@@mel.send]

let lowercase s = Js.String.toLowerCase s

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

let search_normalize s = strip_combining (normalize_ s "NFKC")

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
  let n = String.length sub and m = String.length s in
  if n = 0 then Some 0
  else if n > m then None
  else
    let rec find i =
      if i > m - n then None
      else if String.sub s i n = sub then Some i
      else find (i + 1)
    in
    find 0

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
