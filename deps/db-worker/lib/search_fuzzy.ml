(* Port of src/main/frontend/common/search_fuzzy.cljs — the surface
   frontend.worker.search uses (clean-str, remove-accents,
   str-len-distance, search-normalize, score, fuzzy-search,
   fuzzy-search-multi). hanzi->initials and the zh-* helpers depend on
   the tiny-pinyin npm package and are intentionally not ported: the
   worker search path never calls them.
*)
(* transcribed verbatim from node_modules remove-accents@0.5.0 index.js characterMap *)
let accent_map = [
  ("À", "A");
  ("Á", "A");
  ("Â", "A");
  ("Ã", "A");
  ("Ä", "A");
  ("Å", "A");
  ("Ấ", "A");
  ("Ắ", "A");
  ("Ẳ", "A");
  ("Ẵ", "A");
  ("Ặ", "A");
  ("Æ", "AE");
  ("Ầ", "A");
  ("Ằ", "A");
  ("Ȃ", "A");
  ("Ả", "A");
  ("Ạ", "A");
  ("Ẩ", "A");
  ("Ẫ", "A");
  ("Ậ", "A");
  ("Ç", "C");
  ("Ḉ", "C");
  ("È", "E");
  ("É", "E");
  ("Ê", "E");
  ("Ë", "E");
  ("Ế", "E");
  ("Ḗ", "E");
  ("Ề", "E");
  ("Ḕ", "E");
  ("Ḝ", "E");
  ("Ȇ", "E");
  ("Ẻ", "E");
  ("Ẽ", "E");
  ("Ẹ", "E");
  ("Ể", "E");
  ("Ễ", "E");
  ("Ệ", "E");
  ("Ì", "I");
  ("Í", "I");
  ("Î", "I");
  ("Ï", "I");
  ("Ḯ", "I");
  ("Ȋ", "I");
  ("Ỉ", "I");
  ("Ị", "I");
  ("Ð", "D");
  ("Ñ", "N");
  ("Ò", "O");
  ("Ó", "O");
  ("Ô", "O");
  ("Õ", "O");
  ("Ö", "O");
  ("Ø", "O");
  ("Ố", "O");
  ("Ṍ", "O");
  ("Ṓ", "O");
  ("Ȏ", "O");
  ("Ỏ", "O");
  ("Ọ", "O");
  ("Ổ", "O");
  ("Ỗ", "O");
  ("Ộ", "O");
  ("Ờ", "O");
  ("Ở", "O");
  ("Ỡ", "O");
  ("Ớ", "O");
  ("Ợ", "O");
  ("Ù", "U");
  ("Ú", "U");
  ("Û", "U");
  ("Ü", "U");
  ("Ủ", "U");
  ("Ụ", "U");
  ("Ử", "U");
  ("Ữ", "U");
  ("Ự", "U");
  ("Ý", "Y");
  ("à", "a");
  ("á", "a");
  ("â", "a");
  ("ã", "a");
  ("ä", "a");
  ("å", "a");
  ("ấ", "a");
  ("ắ", "a");
  ("ẳ", "a");
  ("ẵ", "a");
  ("ặ", "a");
  ("æ", "ae");
  ("ầ", "a");
  ("ằ", "a");
  ("ȃ", "a");
  ("ả", "a");
  ("ạ", "a");
  ("ẩ", "a");
  ("ẫ", "a");
  ("ậ", "a");
  ("ç", "c");
  ("ḉ", "c");
  ("è", "e");
  ("é", "e");
  ("ê", "e");
  ("ë", "e");
  ("ế", "e");
  ("ḗ", "e");
  ("ề", "e");
  ("ḕ", "e");
  ("ḝ", "e");
  ("ȇ", "e");
  ("ẻ", "e");
  ("ẽ", "e");
  ("ẹ", "e");
  ("ể", "e");
  ("ễ", "e");
  ("ệ", "e");
  ("ì", "i");
  ("í", "i");
  ("î", "i");
  ("ï", "i");
  ("ḯ", "i");
  ("ȋ", "i");
  ("ỉ", "i");
  ("ị", "i");
  ("ð", "d");
  ("ñ", "n");
  ("ò", "o");
  ("ó", "o");
  ("ô", "o");
  ("õ", "o");
  ("ö", "o");
  ("ø", "o");
  ("ố", "o");
  ("ṍ", "o");
  ("ṓ", "o");
  ("ȏ", "o");
  ("ỏ", "o");
  ("ọ", "o");
  ("ổ", "o");
  ("ỗ", "o");
  ("ộ", "o");
  ("ờ", "o");
  ("ở", "o");
  ("ỡ", "o");
  ("ớ", "o");
  ("ợ", "o");
  ("ù", "u");
  ("ú", "u");
  ("û", "u");
  ("ü", "u");
  ("ủ", "u");
  ("ụ", "u");
  ("ử", "u");
  ("ữ", "u");
  ("ự", "u");
  ("ý", "y");
  ("ÿ", "y");
  ("Ā", "A");
  ("ā", "a");
  ("Ă", "A");
  ("ă", "a");
  ("Ą", "A");
  ("ą", "a");
  ("Ć", "C");
  ("ć", "c");
  ("Ĉ", "C");
  ("ĉ", "c");
  ("Ċ", "C");
  ("ċ", "c");
  ("Č", "C");
  ("č", "c");
  ("C̆", "C");
  ("c̆", "c");
  ("Ď", "D");
  ("ď", "d");
  ("Đ", "D");
  ("đ", "d");
  ("Ē", "E");
  ("ē", "e");
  ("Ĕ", "E");
  ("ĕ", "e");
  ("Ė", "E");
  ("ė", "e");
  ("Ę", "E");
  ("ę", "e");
  ("Ě", "E");
  ("ě", "e");
  ("Ĝ", "G");
  ("Ǵ", "G");
  ("ĝ", "g");
  ("ǵ", "g");
  ("Ğ", "G");
  ("ğ", "g");
  ("Ġ", "G");
  ("ġ", "g");
  ("Ģ", "G");
  ("ģ", "g");
  ("Ĥ", "H");
  ("ĥ", "h");
  ("Ħ", "H");
  ("ħ", "h");
  ("Ḫ", "H");
  ("ḫ", "h");
  ("Ĩ", "I");
  ("ĩ", "i");
  ("Ī", "I");
  ("ī", "i");
  ("Ĭ", "I");
  ("ĭ", "i");
  ("Į", "I");
  ("į", "i");
  ("İ", "I");
  ("ı", "i");
  ("Ĳ", "IJ");
  ("ĳ", "ij");
  ("Ĵ", "J");
  ("ĵ", "j");
  ("Ķ", "K");
  ("ķ", "k");
  ("Ḱ", "K");
  ("ḱ", "k");
  ("K̆", "K");
  ("k̆", "k");
  ("Ĺ", "L");
  ("ĺ", "l");
  ("Ļ", "L");
  ("ļ", "l");
  ("Ľ", "L");
  ("ľ", "l");
  ("Ŀ", "L");
  ("ŀ", "l");
  ("Ł", "l");
  ("ł", "l");
  ("Ḿ", "M");
  ("ḿ", "m");
  ("M̆", "M");
  ("m̆", "m");
  ("Ń", "N");
  ("ń", "n");
  ("Ņ", "N");
  ("ņ", "n");
  ("Ň", "N");
  ("ň", "n");
  ("ŉ", "n");
  ("N̆", "N");
  ("n̆", "n");
  ("Ō", "O");
  ("ō", "o");
  ("Ŏ", "O");
  ("ŏ", "o");
  ("Ő", "O");
  ("ő", "o");
  ("Œ", "OE");
  ("œ", "oe");
  ("P̆", "P");
  ("p̆", "p");
  ("Ŕ", "R");
  ("ŕ", "r");
  ("Ŗ", "R");
  ("ŗ", "r");
  ("Ř", "R");
  ("ř", "r");
  ("R̆", "R");
  ("r̆", "r");
  ("Ȓ", "R");
  ("ȓ", "r");
  ("Ś", "S");
  ("ś", "s");
  ("Ŝ", "S");
  ("ŝ", "s");
  ("Ş", "S");
  ("Ș", "S");
  ("ș", "s");
  ("ş", "s");
  ("Š", "S");
  ("š", "s");
  ("Ţ", "T");
  ("ţ", "t");
  ("ț", "t");
  ("Ț", "T");
  ("Ť", "T");
  ("ť", "t");
  ("Ŧ", "T");
  ("ŧ", "t");
  ("T̆", "T");
  ("t̆", "t");
  ("Ũ", "U");
  ("ũ", "u");
  ("Ū", "U");
  ("ū", "u");
  ("Ŭ", "U");
  ("ŭ", "u");
  ("Ů", "U");
  ("ů", "u");
  ("Ű", "U");
  ("ű", "u");
  ("Ų", "U");
  ("ų", "u");
  ("Ȗ", "U");
  ("ȗ", "u");
  ("V̆", "V");
  ("v̆", "v");
  ("Ŵ", "W");
  ("ŵ", "w");
  ("Ẃ", "W");
  ("ẃ", "w");
  ("X̆", "X");
  ("x̆", "x");
  ("Ŷ", "Y");
  ("ŷ", "y");
  ("Ÿ", "Y");
  ("Y̆", "Y");
  ("y̆", "y");
  ("Ź", "Z");
  ("ź", "z");
  ("Ż", "Z");
  ("ż", "z");
  ("Ž", "Z");
  ("ž", "z");
  ("ſ", "s");
  ("ƒ", "f");
  ("Ơ", "O");
  ("ơ", "o");
  ("Ư", "U");
  ("ư", "u");
  ("Ǎ", "A");
  ("ǎ", "a");
  ("Ǐ", "I");
  ("ǐ", "i");
  ("Ǒ", "O");
  ("ǒ", "o");
  ("Ǔ", "U");
  ("ǔ", "u");
  ("Ǖ", "U");
  ("ǖ", "u");
  ("Ǘ", "U");
  ("ǘ", "u");
  ("Ǚ", "U");
  ("ǚ", "u");
  ("Ǜ", "U");
  ("ǜ", "u");
  ("Ứ", "U");
  ("ứ", "u");
  ("Ṹ", "U");
  ("ṹ", "u");
  ("Ǻ", "A");
  ("ǻ", "a");
  ("Ǽ", "AE");
  ("ǽ", "ae");
  ("Ǿ", "O");
  ("ǿ", "o");
  ("Þ", "TH");
  ("þ", "th");
  ("Ṕ", "P");
  ("ṕ", "p");
  ("Ṥ", "S");
  ("ṥ", "s");
  ("X́", "X");
  ("x́", "x");
  ("Ѓ", "Г");
  ("ѓ", "г");
  ("Ќ", "К");
  ("ќ", "к");
  ("A̋", "A");
  ("a̋", "a");
  ("E̋", "E");
  ("e̋", "e");
  ("I̋", "I");
  ("i̋", "i");
  ("Ǹ", "N");
  ("ǹ", "n");
  ("Ồ", "O");
  ("ồ", "o");
  ("Ṑ", "O");
  ("ṑ", "o");
  ("Ừ", "U");
  ("ừ", "u");
  ("Ẁ", "W");
  ("ẁ", "w");
  ("Ỳ", "Y");
  ("ỳ", "y");
  ("Ȁ", "A");
  ("ȁ", "a");
  ("Ȅ", "E");
  ("ȅ", "e");
  ("Ȉ", "I");
  ("ȉ", "i");
  ("Ȍ", "O");
  ("ȍ", "o");
  ("Ȑ", "R");
  ("ȑ", "r");
  ("Ȕ", "U");
  ("ȕ", "u");
  ("B̌", "B");
  ("b̌", "b");
  ("Č̣", "C");
  ("č̣", "c");
  ("Ê̌", "E");
  ("ê̌", "e");
  ("F̌", "F");
  ("f̌", "f");
  ("Ǧ", "G");
  ("ǧ", "g");
  ("Ȟ", "H");
  ("ȟ", "h");
  ("J̌", "J");
  ("ǰ", "j");
  ("Ǩ", "K");
  ("ǩ", "k");
  ("M̌", "M");
  ("m̌", "m");
  ("P̌", "P");
  ("p̌", "p");
  ("Q̌", "Q");
  ("q̌", "q");
  ("Ř̩", "R");
  ("ř̩", "r");
  ("Ṧ", "S");
  ("ṧ", "s");
  ("V̌", "V");
  ("v̌", "v");
  ("W̌", "W");
  ("w̌", "w");
  ("X̌", "X");
  ("x̌", "x");
  ("Y̌", "Y");
  ("y̌", "y");
  ("A̧", "A");
  ("a̧", "a");
  ("B̧", "B");
  ("b̧", "b");
  ("Ḑ", "D");
  ("ḑ", "d");
  ("Ȩ", "E");
  ("ȩ", "e");
  ("Ɛ̧", "E");
  ("ɛ̧", "e");
  ("Ḩ", "H");
  ("ḩ", "h");
  ("I̧", "I");
  ("i̧", "i");
  ("Ɨ̧", "I");
  ("ɨ̧", "i");
  ("M̧", "M");
  ("m̧", "m");
  ("O̧", "O");
  ("o̧", "o");
  ("Q̧", "Q");
  ("q̧", "q");
  ("U̧", "U");
  ("u̧", "u");
  ("X̧", "X");
  ("x̧", "x");
  ("Z̧", "Z");
  ("z̧", "z");
  ("й", "и");
  ("Й", "И");
  ("ё", "е");
  ("Ё", "Е");
]

(* cljs search-fuzzy remove-accents — npm remove-accents@0.5.0 builds
   one regex from the characterMap keys in map order and replaces
   leftmost-first; scanning the table in order at each position is
   equivalent. *)
let remove_accents (s : string) : string =
  let len = String.length s in
  let buf = Buffer.create len in
  let rec scan i =
    if i < len then begin
      let matches_at (k : string) =
        let klen = String.length k in
        let rec eq j = j = klen || (s.[i + j] = k.[j] && eq (j + 1)) in
        i + klen <= len && eq 0
      in
      let rec try_keys = function
        | [] -> None
        | (k, rep) :: rest ->
            if matches_at k then Some (String.length k, rep)
            else try_keys rest
      in
      match try_keys accent_map with
      | Some (klen, rep) ->
          Buffer.add_string buf rep;
          scan (i + klen)
      | None ->
          Buffer.add_char buf s.[i];
          scan (i + 1)
    end
  in
  scan 0;
  Buffer.contents buf

(* UTF-16 code units — cljs iterates strings by JS UTF-16 units
   ((seq s), .-length, .indexOf), so score/length math must count
   units, not codepoints or bytes. *)

let max_string_length = 1000.0

let utf8_decode (s : string) : int list =
  let len = String.length s in
  let byte i = Char.code s.[i] in
  let rec loop i acc =
    if i >= len then List.rev acc
    else
      let b0 = byte i in
      if b0 < 0x80 then loop (i + 1) (b0 :: acc)
      else if b0 < 0xC0 then loop (i + 1) (0xFFFD :: acc)
      else if b0 < 0xE0 && i + 1 < len then
        loop (i + 2) (((b0 land 0x1F) lsl 6 lor (byte (i + 1) land 0x3F)) :: acc)
      else if b0 < 0xF0 && i + 2 < len then
        loop (i + 3)
          (((b0 land 0x0F) lsl 12 lor ((byte (i + 1) land 0x3F) lsl 6)
            lor (byte (i + 2) land 0x3F))
          :: acc)
      else if i + 3 < len then
        loop (i + 4)
          (((b0 land 0x07) lsl 18 lor ((byte (i + 1) land 0x3F) lsl 12)
            lor ((byte (i + 2) land 0x3F) lsl 6)
            lor (byte (i + 3) land 0x3F))
          :: acc)
      else List.rev acc
  in
  loop 0 []

let utf16_units (s : string) : int array =
  s |> utf8_decode
  |> List.concat_map (fun cp ->
         if cp <= 0xFFFF then [ cp ]
         else
           let cp' = cp - 0x10000 in
           [ 0xD800 lor (cp' lsr 10); 0xDC00 lor (cp' land 0x3FF) ])
  |> Array.of_list

let utf16_length (s : string) : int =
  utf8_decode s
  |> List.fold_left (fun n cp -> if cp <= 0xFFFF then n + 1 else n + 2) 0

(* cljs search-fuzzy/clean-str: lower-case, strip [ \ / _ ] ( ) chars,
   lower-case again. *)
let clean_str (s : string) : string =
  let is_clean c =
    match c with
    | '[' | ' ' | '/' | '_' | ']' | '(' | ')' -> false
    | _ -> true
  in
  let lowered = Unicode.lowercase s in
  let buf = Buffer.create (String.length lowered) in
  String.iter (fun c -> if is_clean c then Buffer.add_char buf c) lowered;
  Unicode.lowercase (Buffer.contents buf)

(* cljs search-fuzzy/str-len-distance *)
let str_len_distance s1 s2 =
  let c1 = utf16_length s1 and c2 = utf16_length s2 in
  let maxed = max c1 c2 and mined = min c1 c2 in
  if maxed = 0 then 1.0
  else 1.0 -. (Float.of_int (maxed - mined) /. Float.of_int maxed)

(* cljs search-fuzzy/search-normalize *)
let search_normalize ?(lower_case = true) remove_accents_flag (s : string) : string =
  let s' = if lower_case then Unicode.lowercase s else s in
  let normalized = Unicode.nfkc s' in
  if remove_accents_flag then remove_accents normalized else normalized

(* cljs search-fuzzy/score — loops over UTF-16 units like cljs seq. *)
let score (oquery : string) (ostr : string) : float =
  let query = search_normalize true (clean_str oquery) in
  let original_s = search_normalize true (clean_str ostr) in
  let qu = utf16_units query and su = utf16_units original_s in
  let qlen = Array.length qu and slen = Array.length su in
  (* .indexOf original_s query at unit level *)
  let index_of () =
    if qlen = 0 then 0
    else if qlen > slen then -1
    else
      let rec find i =
        if i + qlen > slen then -1
        else
          let rec eq j = j = qlen || (qu.(j) = su.(i + j) && eq (j + 1)) in
          if eq 0 then i else find (i + 1)
      in
      find 0
  in
  let starts_with () =
    qlen <= slen
    && (let rec eq j = j = qlen || (qu.(j) = su.(j) && eq (j + 1)) in
        eq 0)
  in
  let rec loop qi si mult idx score' =
    if qi >= qlen then
      score'
      +. str_len_distance query original_s
      +. (if starts_with () then max_string_length +. 10.0
          else if index_of () >= 0 then max_string_length
          else 0.0)
      +. (if si >= slen then 1.0 else 0.0)
    else if si >= slen then 0.0
    else if qu.(qi) = su.(si) then
      loop (qi + 1) (si + 1) (mult +. 1.0) (idx -. 1.0) (mult +. score')
    else loop qi (si + 1) 1.0 (idx -. 1.0) (score' -. 0.1)
  in
  loop 0 0 1.0 max_string_length 0.0

(* cljs search-fuzzy/fuzzy-search *)
let fuzzy_search ?(limit = 20) ?(extract_fn = fun x -> x) data query =
  data
  |> List.filter_map (fun item ->
         let s = extract_fn item in
         let sc = score query s in
         if sc > 0.0 then Some (item, sc) else None)
  |> List.sort (fun (_, a) (_, b) -> compare b a)
  |> (fun xs ->
       let rec take n = function
         | [] -> []
         | _ when n <= 0 -> []
         | (x, _) :: rest -> x :: take (n - 1) rest
       in
       take limit xs)

(* cljs search-fuzzy/fuzzy-search-multi — best score across extract fns *)
let fuzzy_search_multi ?(limit = 20) ~extract_fns data query =
  data
  |> List.filter_map (fun item ->
         let strings =
           extract_fns
           |> List.filter_map (fun f ->
                  match f item with
                  | Some s when String.length (Unicode.trim s) > 0 -> Some s
                  | _ -> None)
         in
         let best =
           match strings with
           | [] -> 0.0
           | _ -> List.fold_left (fun acc s -> Float.max acc (score query s)) 0.0 strings
         in
         if best > 0.0 then Some (item, best) else None)
  |> List.sort (fun (_, a) (_, b) -> compare b a)
  |> (fun xs ->
       let rec take n = function
         | [] -> []
         | _ when n <= 0 -> []
         | (x, _) :: rest -> x :: take (n - 1) rest
       in
       take limit xs)
