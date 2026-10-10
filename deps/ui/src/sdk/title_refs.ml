(* cljs wrap-parse-block (frontend.handler.db-based.editor) reduced to a
   textual scan — mldoc is not linked into deps/ui. Extracts [[page]],
   #tag and #[[page]] from a title: every ref lands in block/refs,
   #[[..]]-refs and bare #tags land in block/tags as well (a bare #name
   is the same inline tag, verified against the cljs reference — the
   block is tagged and the stored title becomes `#name` -> `#[[uuid]]`),
   and the stored title is rewritten to [[uuid]] / #[[uuid]] form
   (cljs title-ref->id-ref) so outliner_core.resolve_page_refs can swap
   minted uuids for resolved ones. New pages carry block/tags
   [logseq.class/Page] (what new_page_ref looks for); new tags carry
   db/ident user.class/<x>-<rand> + block/tags [logseq.class/Tag] so the
   map itself creates the class. *)

open Promise_ext
let is_name_end c =
  match c with
  | ' ' | '\t' | '\n' | '\r' | '#' | '[' | ']' | '(' | ')' | '{' | '}'
  | '<' | '>' | '"' | '\'' | '`' | ',' | ';' | '|' | '^' ->
      true
  | _ -> false

let find_close (s : string) i =
  let n = String.length s in
  let rec go i =
    if i + 1 >= n then None
    else if s.[i] = ']' && s.[i + 1] = ']' then Some i
    else go (i + 1)
  in
  go i

(* returns (ordered deduped ref names, tag names, hash names).
   `#name` lands in `hash` and `tags`: a bare hashtag creates the
   tag-class entity, joins block/refs AND block/tags, and the stored
   title is rewritten to `#[[uuid]]` — identical to `#[[name]]`
   (verified against the cljs reference: appending `x with #tag`
   yields one Tag-class entity, a tagged block, and a `#[[uuid]]`
   title). *)
let scan_title (title : string) =
  let n = String.length title in
  let dedupe xs =
    List.rev (List.fold_left (fun a x -> if List.mem x a then a else x :: a)
                [] xs)
  in
  let rec go i refs tags hash =
    if i >= n then (refs, tags, hash)
    else if i + 1 < n && title.[i] = '[' && title.[i + 1] = '[' then
      match find_close title (i + 2) with
      | Some j ->
          let name = String.trim (String.sub title (i + 2) (j - i - 2)) in
          go (j + 2)
            (if name = "" then refs else name :: refs)
            tags hash
      | None -> go n refs tags hash
    else if title.[i] = '#' && i + 1 < n
            && (i = 0
                || (title.[i - 1] <> '#' && is_name_end title.[i - 1]))
    then
      if i + 2 < n && title.[i + 1] = '[' && title.[i + 2] = '[' then
        match find_close title (i + 3) with
        | Some j ->
            let name = String.trim (String.sub title (i + 3) (j - i - 3)) in
            go (j + 2)
              (if name = "" then refs else name :: refs)
              (if name = "" then tags else name :: tags)
              hash
        | None -> go n refs tags hash
      else
        let j = ref (i + 1) in
        while !j < n && not (is_name_end title.[!j]) do
          incr j
        done;
        let name = String.sub title (i + 1) (!j - i - 1) in
        go (max (i + 1) !j)
          (if name = "" then refs else name :: refs)
          (if name = "" then tags else name :: tags)
          (if name = "" then hash else name :: hash)
    else go (i + 1) refs tags hash
  in
  let refs, tags, hash = go 0 [] [] [] in
  (dedupe refs, dedupe tags, dedupe hash)

let lc name = String.lowercase_ascii (String.trim name)

(* db-ident/normalize-ident-name-part *)
let normalize_ident_name_part name =
  let name =
    if String.length name > 0 && name.[0] >= '0' && name.[0] <= '9' then
      "NUM-" ^ name
    else name
  in
  String.to_seq name
  |> Seq.filter (fun c ->
         (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z')
         || (c >= 'A' && c <= 'Z')
         || String.contains "=*+!_'?<>=-" c)
  |> String.of_seq

(* db-ident/create-user-class-ident-from-name — suffix is one letter +
   nano_id(7); uuid hex chars are a subset of the nano_id alphabet *)
let user_class_ident name =
  let hex =
    String.concat "" (String.split_on_char '-' (Ui_services.env_random_uuid ()))
  in
  let first =
    match
      String.to_seq hex
      |> Seq.find_map (fun c ->
             if c >= 'a' && c <= 'f' then Some c else None)
    with
    | Some c -> String.make 1 c
    | None -> "a"
  in
  "user.class/" ^ normalize_ident_name_part name ^ "-" ^ first
  ^ String.sub hex 0 7

let uuid_lookup u =
  Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]

(* cljs use-cached-refs swaps a parsed ref for the cached entity's
   ref-summary map ({:db/id :block/uuid :block/title :block/name
   :db/ident :block/tags}). A bare [:block/uuid u] carries no
   block/name, so remove-orphaned-page-refs cannot keep the still
   referenced page alive — it gets retracted mid-tx and the lookup
   then throws "Nothing found for entity id". *)
let existing_ref_map w =
  let keep =
    [ "db/id"; "block/uuid"; "block/title"; "block/name"; "db/ident"
    ; "block/tags" ]
  in
  Wire.Map
    (List.filter_map
       (fun k -> Option.map (fun v -> (Wire.String k, v)) (Wire.get w k))
       keep)

let new_page_map name uuid =
  Wire.Map
    [ (Wire.String "block/name", Wire.String (lc name))
    ; (Wire.String "block/title", Wire.String name)
    ; (Wire.String "block/uuid", Wire.Uuid uuid)
    ; ( Wire.String "block/tags"
      , Wire.Array [ Wire.Keyword "logseq.class/Page" ] )
    ]

(* cljs sqlite-util/build-new-class: the map transacts raw (db/ident
   present -> not a new-page-ref), so it must carry the full class
   entity: keyword ident, Tag tag, Root extends, timestamps *)
let new_tag_map name uuid =
  let now = Dates.date_now () in
  Wire.Map
    [ (Wire.String "block/name", Wire.String (lc name))
    ; (Wire.String "block/title", Wire.String name)
    ; (Wire.String "block/uuid", Wire.Uuid uuid)
    ; (Wire.String "db/ident", Wire.Keyword (user_class_ident name))
    ; ( Wire.String "block/tags"
      , Wire.Array [ Wire.Keyword "logseq.class/Tag" ] )
    ; ( Wire.String "logseq.property.class/extends"
      , Wire.Keyword "logseq.class/Root" )
    ; (Wire.String "block/created-at", Wire.Int64 (Int64.of_float now))
    ; (Wire.String "block/updated-at", Wire.Int64 (Int64.of_float now))
    ]

type resolved =
  { name : string; uuid : string; is_tag : bool; is_hash : bool
  ; fresh : bool; entity : Wire.t }

(* cljs existing-markdown-hashtag-link-refs + tag-page?: a bare
   hashtag resolves only to a Tag-class instance (its :block/tags
   include logseq.class/Tag) — and never to a logseq.* built-in:
   built-in classes are Tag-tagged too, so a same-named one ("Tag"
   itself, title "Tag") would outrank the written "#tag". Resolve via
   the class-only index, keeping only non-built-in entities *)
let tag_class_by_name name =
  let* w =
    Runtime.invoke "thread-api/get-tags-by-name"
      [ Wire.String (Sdk_util.repo ()); Wire.String name ]
  in
  let is_builtin t =
    match Wire.get t "db/ident" with
    | Some (Wire.Keyword s) | Some (Wire.String s) ->
        String.length s >= 7 && String.sub s 0 7 = "logseq."
    | _ -> false
  in
  (* get-tags-by-name emits entity_map_wire (stub refs); a hit is
     re-fetched through get-blocks by uuid so the wire carries the sdk
     entity shape, same as get_entity *)
  match
    Wire.elems w
    |> List.filter (fun t -> not (is_builtin t))
    |> List.filter_map (fun t -> Wire.map_get_uuid t "block/uuid")
  with
  | uuid :: _ -> Sdk_util.get_by_id (Wire.Uuid uuid)
  | [] -> Js.Promise.resolve Wire.Nil

let resolve_names names tags hash =
  let* a =
    names
    |> List.map (fun name ->
           let is_tag = List.mem name tags in
           let is_hash = is_tag || List.mem name hash in
           let* w =
             if List.mem name hash then tag_class_by_name name
             else Sdk_util.get_entity name
           in
           Js.Promise.resolve
             (match Wire.map_get_uuid w "block/uuid" with
              | Some u ->
                  { name; uuid = u; is_tag; is_hash
                  ; fresh = false; entity = w }
              | None ->
                  { name; uuid = Ui_services.env_random_uuid ()
                  ; is_tag; is_hash; fresh = true
                  ; entity = Wire.Nil }))
    |> Array.of_list |> Js.Promise.all
  in
  Js.Promise.resolve (Array.to_list a)

let replace_all = Str_util.replace_all
(* longest tag name matching at i followed by a boundary *)
let tag_name_at (s : string) i resolved =
  let n = String.length s in
  List.fold_left
    (fun best r ->
      let m = String.length r.name in
      if m > 0 && i + m <= n && String.sub s i m = r.name
         && (i + m = n || is_name_end s.[i + m])
      then
        match best with
        | Some b when String.length b.name >= m -> best
        | _ -> Some r
      else best)
    None resolved

let rewrite_title title resolved =
  (* [[name]] -> [[uuid]] first — also fixes #[[name]] -> #[[uuid]] *)
  let title =
    List.fold_left
      (fun t r ->
        replace_all t
          ~pat:("[[" ^ r.name ^ "]]")
          ~rep:("[[" ^ r.uuid ^ "]]"))
      title resolved
  in
  (* #[[name]] -> #[[uuid]] via the pass above; a bare #name at a
     boundary rewrites to #[[uuid]] the same way (cljs
     title-ref->id-ref stores id-refs for inline tags) *)
  let tagged = List.filter (fun r -> r.is_tag) resolved in
  let n = String.length title in
  let buf = Buffer.create n in
  let rec go i =
    if i < n then
      if title.[i] = '#' && i + 1 < n && title.[i + 1] <> '['
         && (i = 0
             || (title.[i - 1] <> '#' && is_name_end title.[i - 1]))
      then
        match tag_name_at title (i + 1) tagged with
        | Some r ->
            Buffer.add_string buf ("#[[" ^ r.uuid ^ "]]");
            go (i + 1 + String.length r.name)
        | None ->
            Buffer.add_char buf title.[i];
            go (i + 1)
      else (
        Buffer.add_char buf title.[i];
        go (i + 1))
  in
  go 0;
  Buffer.contents buf

type parsed = { title : string; refs : Wire.t list; tags : Wire.t list }

let parse title =
  let names, tags, hash = scan_title title in
  let* resolved = resolve_names names tags hash in
  (* seed the render pull caches with the resolved metas: a remounted
     [[uuid]] anchor then paints its title immediately instead of
     waiting on a worker pull *)
  List.iter
    (fun r ->
      if r.fresh then Render_inline.prime_ref_metas [ (r.name, r.uuid) ]
      else
        match Wire.map_get_string r.entity "block/title" with
        | Some t ->
            Render_inline.prime_pull_meta ~name:r.name ~uuid:r.uuid
              ~title:t
              ~is_page:(Wire.map_get_string r.entity "block/name" <> None)
              ~is_math:(Decode.prop_label r.entity "logseq.property.node/display-type" = Some "math")
        | None -> ())
    resolved;
  let ref_of r =
    if r.fresh then
      if r.is_hash then new_tag_map r.name r.uuid
      else new_page_map r.name r.uuid
    else existing_ref_map r.entity
  in
  let tag_of r =
    if r.fresh then new_tag_map r.name r.uuid else uuid_lookup r.uuid
  in
  Js.Promise.resolve
    { title = rewrite_title title resolved
    ; refs = List.map ref_of resolved
    ; tags = List.filter_map
               (fun r -> if r.is_tag then Some (tag_of r) else None)
               resolved
    }

(* block map kvs for block/refs + block/tags — omitted when empty so
   save-block merges do not clobber existing values *)
let kvs_of_parsed (p : parsed) =
  (match p.refs with
   | [] -> []
   | rs -> [ (Wire.String "block/refs", Wire.List rs) ])
  @ (match p.tags with
     | [] -> []
     | ts -> [ (Wire.String "block/tags", Wire.List ts) ])
