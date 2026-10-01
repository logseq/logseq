(* Title -> refs/tags parse — the cljs-side counterpart of
   db_based.editor/wrap-parse-block + gp-block title ref extraction.

   For each `[[Page]]` / `#tag` in a block title we emit a new-page-ref map
   ({block/name, block/title, block/uuid, block/type "page"}) in
   :block/refs; `#tag` additionally produces a :block/tags entry sharing the
   same uuid so the worker's resolve-page-refs marks it class? and creates a
   Tag class entity. ((uuid)) emits a [:block/uuid u] lookup ref. The title
   is rewritten to id-ref form: [[name]] -> [[uuid]], #name -> #[[uuid]]
   (cljs db-content/title-ref->id-ref). *)

module S = String

let lc s = S.lowercase_ascii s

let uuid_re_char c =
  (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
  || c = '-'

(* exactly 8-4-4-4-12 hex *)
let uuid_shaped s =
  let hex c =
    (c >= '0' && c <= '9')
    || (c >= 'a' && c <= 'f')
    || (c >= 'A' && c <= 'F')
  in
  let rec go i =
    if i = 36 then true
    else
      match i with
      | 8 | 13 | 18 | 23 -> String.get s i = '-' && go (i + 1)
      | _ -> hex (String.get s i) && go (i + 1)
  in
  String.length s = 36 && go 0

(* hashtag name chars: run until whitespace or a bracket/paren delimiter *)
let tag_char c =
  match c with
  | ' ' | '\t' | '\n' | '\r' | '[' | ']' | '(' | ')' | '#' -> false
  | _ -> true

let scan_tok s i =
  (* at i s.[i] is '[' or '#'; returns (kind, name, end_idx excl) *)
  let n = S.length s in
  if i + 1 < n && s.[i] = '[' && s.[i + 1] = '[' then (
    (* [[name]] *)
    let j = ref (i + 2) in
    while !j + 1 < n && not (s.[!j] = ']' && s.[!j + 1] = ']') do
      incr j
    done;
    if !j + 1 < n then
      Some (`Page, S.sub s (i + 2) (!j - i - 2), !j + 2)
    else None)
  else if s.[i] = '#' then
    if i + 1 < n && s.[i + 1] = '[' && i + 2 < n && s.[i + 2] = '[' then (
      (* #[[name]] *)
      let j = ref (i + 3) in
      while !j + 1 < n && not (s.[!j] = ']' && s.[!j + 1] = ']') do
        incr j
      done;
      if !j + 1 < n then
        Some (`Tag, S.sub s (i + 3) (!j - i - 3), !j + 2)
      else None)
    else if
      (* #name — skip heading markers (`# ` / `## `) and a bare '#' *)
      i + 1 >= n || s.[i + 1] = ' ' || s.[i + 1] = '#'
    then None
    else
        let j = ref (i + 1) in
        while !j < n && tag_char s.[!j] do
          incr j
        done;
        if !j > i + 1 then Some (`Tag, S.sub s (i + 1) (!j - i - 1), !j)
        else None
  else None

(* ((uuid)) block refs *)
let block_ref_at s i =
  let n = S.length s in
  if
    i + 1 < n && s.[i] = '(' && s.[i + 1] = '('
    &&
    let j = ref (i + 2) in
    while !j < n && uuid_re_char s.[!j] do
      incr j
    done;
    !j + 1 < n && s.[!j] = ')' && s.[!j + 1] = ')' && !j - (i + 2) = 36
  then
    Some (S.sub s (i + 2) 36, i + 40)
  else None

let parse_title (title : string) :
    string * Wire.t list * Wire.t list * (string * string) list =
  let n = S.length title in
  let buf = Buffer.create n in
  let refs = ref [] in
  let tags = ref [] in
  (* name -> uuid for page/tag entities this title mints — the caller
     primes the render pull caches with them so a remount that resolves
     the rewritten [[uuid]] form before the worker pull returns still
     paints the title on the first frame *)
  let created : (string * string) list ref = ref [] in
  let seen : (string, string) Hashtbl.t = Hashtbl.create 8 in
  let seen_tag : (string, string) Hashtbl.t = Hashtbl.create 8 in
  let ref_map name u =
    Wire.Map
      [ (Wire.String "block/name", Wire.String (lc name))
      ; (Wire.String "block/title", Wire.String name)
      ; (Wire.String "block/uuid", Wire.Uuid u)
      ; (Wire.String "block/type", Wire.String "page") ]
  in
  let tag_map name u =
    Wire.Map
      [ (Wire.String "block/name", Wire.String (lc name))
      ; (Wire.String "block/title", Wire.String name)
      ; (Wire.String "block/uuid", Wire.Uuid u) ]
  in
  let rec go i =
    if i >= n then ()
    else
      match scan_tok title i with
      | Some (`Page, name, e) ->
          if uuid_shaped name then begin
            (* already id-ref form — keep the text and emit a lookup ref *)
            refs :=
              Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid name ]
              :: !refs;
            Buffer.add_string buf (S.sub title i (e - i));
            go e
          end
          else begin
            let u =
              match Hashtbl.find_opt seen (lc name) with
              | Some u -> u
              | None ->
                  let u = Platform.random_uuid () in
                  Hashtbl.replace seen (lc name) u;
                  refs := ref_map name u :: !refs;
                  created := (name, u) :: !created;
                  u
            in
            Buffer.add_string buf ("[[" ^ u ^ "]]");
            go e
          end
      | Some (`Tag, name, e) ->
          if uuid_shaped name then begin
            refs :=
              Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid name ]
              :: !refs;
            tags :=
              Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid name ]
              :: !tags;
            Buffer.add_string buf (S.sub title i (e - i));
            go e
          end
          else begin
            let u =
              match Hashtbl.find_opt seen_tag (lc name) with
              | Some u -> u
              | None ->
                  let u = Platform.random_uuid () in
                  Hashtbl.replace seen_tag (lc name) u;
                  refs := ref_map name u :: !refs;
                  tags := tag_map name u :: !tags;
                  created := (name, u) :: !created;
                  u
            in
            Buffer.add_string buf ("#[[" ^ u ^ "]]");
            go e
          end
      | None -> (
          match block_ref_at title i with
          | Some (u, e) ->
              refs :=
                Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
                :: !refs;
              Buffer.add_string buf (S.sub title i (e - i));
              go e
          | None ->
              Buffer.add_char buf title.[i];
              go (i + 1))
  in
  go 0;
  (Buffer.contents buf, List.rev !refs, List.rev !tags, List.rev !created)

(* (block/title, block/refs, block/tags) kvs for a raw title plus the
   (name, uuid) pairs it mints — drop the collection fields when empty so
   existing callers keep their shape *)
let title_fields (title : string) :
    (string * Wire.t) list * (string * string) list =
  let title', refs, tags, created = parse_title title in
  ( [ ("block/title", Wire.String title') ]
    @ (match refs with [] -> [] | rs -> [ ("block/refs", Wire.List rs) ])
    @ (match tags with [] -> [] | ts -> [ ("block/tags", Wire.List ts) ])
  , created )
