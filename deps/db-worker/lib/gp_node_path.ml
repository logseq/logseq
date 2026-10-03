(* Node.js `path` POSIX helpers used by the graph-parser importer
   (basename, dirname, join, isAbsolute, extname, parse). Paths here are
   always '/'-separated relative or absolute paths. *)

let is_absolute (p : string) : bool = String.length p > 0 && p.[0] = '/'

let normalize_segs (segs : string list) : string list =
  let rec loop acc = function
    | [] -> acc
    | seg :: tl ->
      if seg = "" || seg = "." then loop acc tl
      else if seg = ".." then
        match acc with
        | ".." :: _ -> loop (".." :: acc) tl
        | [] -> loop [ ".." ] tl
        | _ :: tl' -> loop tl' tl
      else loop (seg :: acc) tl
  in
  List.rev (loop [] segs)

let normalize (p : string) : string =
  if p = "" then "."
  else
    let abs = is_absolute p in
    let trailing_sep =
      String.length p > 1 && p.[String.length p - 1] = '/'
    in
    let segs = normalize_segs (String.split_on_char '/' p) in
    let segs =
      if abs then List.filter (fun s -> s <> "..") segs else segs
    in
    let res =
      match segs with
      | [] -> if abs then "/" else "."
      | _ -> (if abs then "/" else "") ^ String.concat "/" segs
    in
    if res <> "/" && trailing_sep then res ^ "/" else res

let basename ?(ext : string option) (p : string) : string =
  let end_ =
    let len = String.length p in
    (* strip trailing slashes *)
    let rec strip i = if i > 0 && p.[i - 1] = '/' then strip (i - 1) else i in
    strip len
  in
  let start =
    (* skip leading slashes region: find last '/' before end *)
    let rec last_sep i = if i < 0 then -1 else if p.[i] = '/' then i else last_sep (i - 1) in
    last_sep (end_ - 1) + 1
  in
  let base =
    if start >= end_ then "" else String.sub p start (end_ - start)
  in
  match ext with
  | Some e
    when String.length e > 0
         && String.length base >= String.length e
         && String.sub base (String.length base - String.length e) (String.length e) = e ->
    String.sub base 0 (String.length base - String.length e)
  | _ -> base

let dirname (p : string) : string =
  let len = String.length p in
  let has_root = len > 0 && p.[0] = '/' in
  let end_ =
    let rec strip i = if i > (if has_root then 1 else 0) && p.[i - 1] = '/' then strip (i - 1) else i in
    strip len
  in
  let rec last_sep i =
    if i <= (if has_root then 0 else -1) then (if has_root then 0 else -1)
    else if p.[i] = '/' then i
    else last_sep (i - 1)
  in
  let last = last_sep (end_ - 1) in
  if last = -1 then "."
  else if last = 0 then "/"
  else
    let dir_end =
      let rec strip i = if i > 1 && p.[i - 1] = '/' then strip (i - 1) else i in
      strip last
    in
    if dir_end = 0 then "/" else String.sub p 0 dir_end

let join (paths : string list) : string =
  match paths with
  | [] -> "."
  | _ ->
    let joined = String.concat "/" paths in
    normalize joined

let extname (p : string) : string =
  let base = basename p in
  let len = String.length base in
  let rec find_dot i =
    if i <= 0 then -1
    else if base.[i] = '.' then i
    else find_dot (i - 1)
  in
  let i = find_dot (len - 1) in
  if i < 0 then "" else String.sub base i (len - i)

type parsed =
  { root : string
  ; dir : string
  ; base : string
  ; ext : string
  ; name : string }

let parse (p : string) : parsed =
  let root = if is_absolute p then "/" else "" in
  let base = basename p in
  let ext = extname base in
  let name =
    if String.length ext > 0 then basename ~ext base else base
  in
  { root; dir = dirname p; base; ext; name }
