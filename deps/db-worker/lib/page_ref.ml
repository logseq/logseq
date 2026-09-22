(* Faithful port of logseq.common.util.page-ref
   (deps/common/src/logseq/common/util/page_ref.cljs). *)

let left_brackets = "[["
let right_brackets = "]]"

(* page-ref? *)
let is_page_ref (s : string) : bool =
  let n = String.length s in
  n >= 4
  && String.sub s 0 2 = left_brackets
  && String.sub s (n - 2) 2 = right_brackets

(* ->page-ref *)
let to_page_ref (page_name : string) : string =
  left_brackets ^ page_name ^ right_brackets

(* markdown-page-ref-re #"\[(.*)\]\(file:.*\)" — full match; label is
   greedy so the LAST "](file:" boundary wins. *)
let markdown_page_ref_name (s : string) : string option =
  let n = String.length s in
  if n >= 5 && s.[0] = '[' && s.[n - 1] = ')' then
    let sub = "](file:" in
    let sl = String.length sub in
    let rec find_last i =
      if i < 0 then None
      else if i + sl <= n && String.sub s i sl = sub then Some i
      else find_last (i - 1)
    in
    match find_last (n - sl) with
    | Some close -> Some (Unicode.trim (String.sub s 1 (close - 1)))
    | None -> None
  else None

(* get-page-name: markdown page-ref label or [[inner]] (greedy —
   equivalent to strip the outer brackets on a full match). *)
let get_page_name (s : string) : string option =
  match markdown_page_ref_name s with
  | Some _ as r -> r
  | None -> if is_page_ref s then Some (String.sub s 2 (String.length s - 4)) else None

(* get-page-name! / page-ref-un-brackets! *)
let get_page_name_exn (s : string) : string =
  match get_page_name s with Some n -> n | None -> s
