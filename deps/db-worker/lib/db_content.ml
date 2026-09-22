(* logseq.db.frontend.content (subset) — id-ref -> title/page-ref
   rewriting for heading routes. *)

open Datascript

(* [[uuid]] *)
let id_ref_re =
  Regexp.compile
    "\\[\\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\]\\]"

(* page-ref/page-ref-without-nested-re *)
let page_ref_without_nested_re = Regexp.compile "\\[\\[([^\\[\\]]+)\\]\\]"

let page_ref s = "[[" ^ s ^ "]]"

(* cljs string/replace with a string pattern: literal, all occurrences. *)
let replace_all s ~pattern ~replacement =
  let n = String.length s and m = String.length pattern in
  let b = Buffer.create n in
  let rec loop i =
    if i + m <= n && String.sub s i m = pattern then begin
      Buffer.add_string b replacement;
      loop (i + m)
    end else if i < n then begin
      Buffer.add_char b s.[i];
      loop (i + 1)
    end
  in
  loop 0;
  Buffer.contents b

(* sort-refs — "nested pages first": descending by
   [(title-contains-page-ref?), title]. *)
let sort_refs (refs : entity list) : entity list =
  let key (e : entity) =
    match Ldb.string_value e "block/title" with
    | None -> (0, "")
    | Some t -> ((if Regexp.test page_ref_without_nested_re t then 1 else 0), t)
  in
  List.sort
    (fun a b ->
      let (n1, t1) = key a and (n2, t2) = key b in
      if n1 <> n2 then compare n2 n1 else compare t2 t1)
    refs

let contains_space s = String.contains s ' '

let title_of (e : entity) = Ldb.string_value e "block/title"
let uuid_of (e : entity) =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None

(* content-id-ref->page — replace [[uuid]] with the ref's title. *)
let content_id_ref_to_page (content : string) (refs : entity list) : string =
  List.fold_left
    (fun c (r : entity) ->
      match title_of r, uuid_of r with
      | Some title, Some u -> replace_all c ~pattern:(page_ref u) ~replacement:title
      | _ -> c)
    content refs

(* id-ref->title-ref — [[uuid]] -> [[title]] (and #[[uuid]] -> #title
   for single-word titles). Only page refs participate. *)
let id_ref_to_title_ref (content : string) (refs : entity list) : string =
  if not (Regexp.test id_ref_re content) then content
  else
    let page_refs = List.filter Ldb.is_page refs in
    List.fold_left
      (fun c (r : entity) ->
        match title_of r, uuid_of r with
        | Some title, Some u ->
            let c =
              if not (contains_space title) then
                replace_all c ~pattern:("#" ^ page_ref u)
                  ~replacement:("#" ^ title)
              else c
            in
            replace_all c ~pattern:(page_ref u) ~replacement:(page_ref title)
        | _ -> c)
      content
      (sort_refs (List.filter (fun e -> Option.is_some (title_of e)) page_refs))

(* heading-content->route-name — first line of a heading title after
   leading '#'s and whitespace, lowercased. *)
let heading_content_to_route_name (s : string) : string option =
  let n = String.length s in
  let is_ws c =
    c = ' ' || c = '\t' || c = '\n' || c = '\r' || c = '\011' || c = '\012'
  in
  let i = ref 0 in
  while !i < n && s.[!i] = '#' do incr i done;
  while !i < n && is_ws s.[!i] do incr i done;
  let j = ref !i in
  while !j < n && s.[!j] <> '\n' do incr j done;
  Some (Unicode.lowercase (String.sub s !i (!j - !i)))

(* handler/page.cljs heading-route-name — title with id refs resolved
   to title refs, then to plain page names, then route-normalized. *)
let heading_route_name (block : entity) : string option =
  match title_of block with
  | None -> None
  | Some title ->
      let seen = Hashtbl.create 16 in
      let uniq xs =
        List.filter
          (fun (e : entity) ->
            if Hashtbl.mem seen e.id then false
            else (Hashtbl.replace seen e.id (); true))
          xs
      in
      let ref_tags =
        uniq (Ldb.ref_ents block "block/tags" @ Ldb.ref_ents block "block/refs")
      in
      let content = id_ref_to_title_ref title ref_tags in
      let content = content_id_ref_to_page content ref_tags in
      heading_content_to_route_name content

(* heading-route-candidates — heading blocks of the page. *)
let heading_route_candidates db (page_id : entity_id) : entity list =
  q_string db
    ~inputs:[ Arg_scalar (Result_entity page_id) ]
    "[:find [?block ...]
      :in $ ?page-id
      :where
      [?block :block/page ?page-id]
      [?block :logseq.property/heading]
      [?block :block/title]]"
  |> List.filter_map (function
       | [ Result_entity id ] -> Ldb.ent_of_id db id
       | _ -> None)

type block_route =
  { page : entity
  ; candidates : entity list
  ; block : entity option
  }

(* handler/page.cljs block-route-resolution *)
let block_route_resolution db (ref_v : value) (route_name : string)
    : block_route option =
  match Ldb.get_page db ref_v with
  | None -> None
  | Some page ->
      let candidates = heading_route_candidates db page.id in
      let normalized = Unicode.lowercase route_name in
      let block =
        List.find_opt
          (fun b -> heading_route_name b = Some normalized)
          candidates
      in
      Some { page; candidates; block }

(* --- recur-replace-uuid-in-block-title (content.cljs) --- *)

let id_or_tag_ref_re =
  Regexp.compile
    "(#?)\\[\\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\]\\]"

let title_ref_replacement id_to_title ~match_ ~groups ~offset:_ ~input:_ =
  (* spec regexp groups: groups.(0) is the whole match, captures start at 1 *)
  let hash_prefix = match groups.(1) with Some s -> s | None -> "" in
  let id = match groups.(2) with Some s -> s | None -> "" in
  match List.assoc_opt id id_to_title with
  | Some ref_title ->
      if hash_prefix = "#" && not (String.contains ref_title ' ') then
        "#" ^ ref_title
      else hash_prefix ^ page_ref ref_title
  | None -> match_

let replace_title_refs_once content id_to_title =
  Regexp.replace id_or_tag_ref_re
    ~f:(title_ref_replacement id_to_title)
    content

let ref_to_title_entry replace_block_refs (ref_ : entity) =
  match Ldb.value ref_ "block/uuid", Ldb.string_value ref_ "block/title" with
  | Some (Uuid u), Some t when replace_block_refs || Ldb.is_page ref_ ->
      Some (u, t)
  | _ -> None

let uuid_of (e : entity) =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None

let block_ref_id_to_title (ent : entity) max_depth replace_block_refs =
  let rec loop frontier seen id_to_title depth =
    if depth >= max_depth || frontier = [] then id_to_title
    else begin
      let new_refs =
        List.filter
          (fun (e : entity) ->
            match uuid_of e with
            | Some u -> not (List.mem u seen)
            | None -> false)
          frontier
      in
      let seen' =
        seen @ List.filter_map uuid_of new_refs
      in
      let id_to_title' =
        id_to_title
        @ List.filter_map (ref_to_title_entry replace_block_refs) new_refs
      in
      let next =
        List.concat_map (fun e -> Ldb.ref_ents e "block/refs") new_refs
      in
      loop next seen' id_to_title' (depth + 1)
    end
  in
  loop (Ldb.ref_ents ent "block/refs") [] [] 0

(* db-content/recur-replace-uuid-in-block-title *)
let recur_replace_uuid_in_block_title ?(max_depth = 10)
    ?(replace_block_refs = true) (ent : entity) : string option =
  match Ldb.string_value ent "block/title" with
  | Some title when Regexp.test id_ref_re title ->
      let id_to_title =
        block_ref_id_to_title ent max_depth replace_block_refs
      in
      let rec loop result depth =
        if depth >= max_depth || not (Regexp.test id_ref_re result) then result
        else begin
          let next = replace_title_refs_once result id_to_title in
          if next = result then result else loop next (depth + 1)
        end
      in
      Some (loop title 0)
  | other -> other

(* common-util/escape-chars specials (utils) — regex-escape a literal *)
let regex_escape_specials = "\\[]{}().+*?|$^"

let regex_escape (s : string) : string =
  let buf = Buffer.create (String.length s * 2) in
  String.iter
    (fun c ->
      if String.contains regex_escape_specials c then begin
        Buffer.add_char buf '\\';
        Buffer.add_char buf c
      end else
        Buffer.add_char buf c)
    s;
  Buffer.contents buf

(* common-util/replace-ignore-case — literal match, replace all.
   Regexp is always compiled case-insensitive, matching the cljs "gi"
   flags. *)
let replace_ignore_case s ~pattern ~replacement =
  Regexp.replace_all (Regexp.compile (regex_escape pattern))
    ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement)
    s

(* content/replace-tag-refs-with-page-refs — "Replace tag refs in content
   with page refs e.g. #[[UUID]] -> [[UUID]]". Upstream runs the identical
   "#id-ref -> id-ref" replacement twice (the second was presumably meant
   to replace bare #tag references but is passed id-ref again) — kept
   1:1. *)
let replace_tag_refs_with_page_refs (content : string) (tags : entity list)
    : string =
  let content =
    List.fold_left
      (fun c (tag : entity) ->
        match uuid_of tag with
        | Some u ->
            let id_ref = page_ref u in
            let c =
              replace_ignore_case c ~pattern:("#" ^ id_ref)
                ~replacement:id_ref
            in
            replace_ignore_case c ~pattern:("#" ^ id_ref)
              ~replacement:id_ref
        | None -> c)
      content (sort_refs tags)
  in
  Unicode.trim content

(* common-util/clear-markdown-heading — strip leading "#"s + whitespace *)
let clear_markdown_heading (s : string) : string =
  let n = String.length s in
  let i = ref 0 in
  while !i < n && s.[!i] = '#' do
    incr i
  done;
  if !i > 0 && !i < n && (s.[!i] = ' ' || s.[!i] = '\t') then begin
    while !i < n && (s.[!i] = ' ' || s.[!i] = '\t') do
      incr i
    done;
    String.sub s !i (n - !i)
  end
  else s


(* ---------- import-side ref rewriting ---------- *)

(* The extracted-ref maps below are (attr * value) list tx maps, not
   entities — the importer works on raw tx data before transacting. *)

(* Keyword-keyed pairs out of a Map value; non-keyword keys are
   unobservable to these fns so they are dropped. *)
let pairs_of_map_value (m : value) : (attr * value) list =
  match m with
  | Map pairs ->
      List.filter_map
        (function Keyword k, v -> Some (k, v) | _ -> None)
        pairs
  | _ -> []

let ref_map_get (m : (attr * value) list) (k : attr) : value option =
  match List.assoc_opt k m with Some v -> Some v | None -> None

let ref_map_string m k =
  match ref_map_get m k with Some (String s) -> Some s | _ -> None

let ref_map_uuid m =
  match ref_map_get m "block/uuid" with Some (Uuid u) -> Some u | _ -> None

(* db-content/sort-refs over extracted-ref maps — nested pages first. *)
let sort_ref_maps (refs : (attr * value) list list) : (attr * value) list list =
  let key m =
    match ref_map_string m "block/title" with
    | None -> (0, "")
    | Some t -> ((if Regexp.test page_ref_without_nested_re t then 1 else 0), t)
  in
  List.sort
    (fun a b ->
      let (n1, t1) = key a and (n2, t2) = key b in
      if n1 <> n2 then compare n2 n1 else compare t2 t1)
    refs

(* db-content/replace-tag-ref *)
let replace_tag_ref (content : string) (page_name : string) (id : string) : string =
  let page = if String.contains page_name ' ' then page_ref page_name else page_name in
  let wrapped_id = page_ref id in
  let page_name' = "#" ^ page in
  let r = "#" ^ wrapped_id in
  (* Re.Pcre has no lookahead — group 3 consumes the lookahead body
     ([,.]* followed by terminator) and is re-emitted. *)
  let re =
    Regexp.compile
      ("(^|\\s|\\()(" ^ Common_util.escape_regex_chars page_name'
       ^ ")([,\\.\\)]*($|\\s|\\)))")
  in
  Regexp.replace_all re
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      (match groups.(1) with Some l -> l | None -> "")
      ^ r
      ^ (match groups.(3) with Some t -> t | None -> ""))
    content

(* db-content/replace-page-ref *)
let replace_page_ref (content : string) (page_name : string) (id : string) : string =
  let page = page_ref page_name and wrapped_id = page_ref id in
  let re =
    Regexp.compile ("(^|[^#])" ^ Common_util.escape_regex_chars page)
  in
  Regexp.replace_all re
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      (match groups.(1) with Some l -> l | None -> "") ^ wrapped_id)
    content

(* db-content/replace-page-ref-with-id *)
let replace_page_ref_with_id ?(replace_tag = false) (content : string)
    (page_name : string) (id : string) : string =
  let page_name = replace_all page_name ~pattern:"HashTag-" ~replacement:"#" in
  let content' = replace_page_ref content page_name id in
  if replace_tag then replace_tag_ref content' page_name id else content'

(* db-content/ref-replacement-title *)
let ref_replacement_title (ref : (attr * value) list) : string option =
  match ref_map_string ref "block.temp/original-page-name" with
  | Some s when not (Common_util.uuid_string s) -> Some s
  | _ -> ref_map_string ref "block/title"

(* db-content/title-ref->id-ref — refs are raw values (maps or
   [:block/uuid uuid] vectors) as they appear in extracted :block/refs. *)
let title_ref_to_id_ref ?(replace_tag = true) (title : string) (refs : value list)
    : string =
  let ref_to_pairs (r : value) : (attr * value) list option =
    match r with
    | Map _ ->
        let pairs = pairs_of_map_value r in
        (match ref_map_string pairs "block.temp/original-page-name" with
         | Some s when Common_util.uuid_string s ->
             Some
               (List.filter
                  (fun (k, _) -> k <> "block.temp/original-page-name")
                  pairs)
         | _ -> Some pairs)
    | Vector (Keyword "block/uuid" :: v :: _) ->
        Some [ ("block/uuid", v); ("block/title", String "block/uuid") ]
    | Tuple (Some (Keyword "block/uuid") :: Some v :: _) ->
        Some [ ("block/uuid", v); ("block/title", String "block/uuid") ]
    | _ -> None
  in
  let refs' =
    refs
    |> List.filter_map ref_to_pairs
    |> List.filter (fun r ->
           Option.is_some (ref_map_uuid r)
           && Option.is_some (ref_map_string r "block/title"))
    |> sort_ref_maps
  in
  List.fold_left
    (fun content (ref_ : (attr * value) list) ->
      match ref_map_uuid ref_, ref_replacement_title ref_ with
      | Some u, Some t -> replace_page_ref_with_id ~replace_tag content t u
      | _ -> content)
    title
    refs'

(* db-content/replace-tags-with-id-refs *)
let replace_tags_with_id_refs (content : string) (tags : (attr * value) list list)
    : string =
  Unicode.trim
    (List.fold_left
       (fun content tag ->
         match ref_map_uuid tag, ref_map_string tag "block/title" with
         | Some u, Some t ->
             let id_ref = page_ref u in
             Common_util.replace_ignore_case content ("#" ^ page_ref t) id_ref
             |> fun c -> Common_util.replace_ignore_case c ("#" ^ t) id_ref
         | _ -> content)
       content
       (sort_ref_maps tags))

(* db-content/replace-tag-refs-with-page-refs — extracted-ref-map version
   for the import pipeline (the entity version above serves endpoints). *)
let replace_tag_refs_with_page_refs_maps (content : string)
    (tags : (attr * value) list list) : string =
  Unicode.trim
    (List.fold_left
       (fun content tag ->
         match ref_map_uuid tag with
         | Some u ->
             let id_ref = page_ref u in
             Common_util.replace_ignore_case content ("#" ^ id_ref) id_ref
             |> fun c -> Common_util.replace_ignore_case c ("#" ^ id_ref) id_ref
         | _ -> content)
       content
       (sort_ref_maps tags))

(* cljs get-matched-ids — distinct uuids captured by id-ref-pattern. *)
let get_matched_ids (content : string) : string list =
  let rec loop pos acc =
    match Regexp.exec ~pos id_ref_re content with
    | None -> List.rev acc
    | Some m ->
        let uuid =
          match m.Regexp.groups.(1) with
          | Some u -> u
          | None -> ""
        in
        loop m.Regexp.last (uuid :: acc)
  in
  List.fold_left
    (fun acc u -> if u <> "" && not (List.mem u acc) then acc @ [ u ] else acc)
    [] (loop 0 [])


(* entity-plus/get-block-title — cljs (:block/title e) via
   lookup-kv-then-entity: journal pages get the formatted journal
   title; other db-graph blocks get [[uuid]] refs resolved to
   [[title]] via :block/refs. *)
let block_title (e : entity) : string option =
  let db = e.db in
  let db_based = Sqlite_util.db_based_graph db in
  if db_based && Ldb.is_journal e then
    match Ldb.int_value e "block/journal-day" with
    | Some day ->
        Some (Ldb.journal_title_of_day day (Ldb.journal_title_format db))
    | None -> Ldb.string_value e "block/title"
  else
    match Ldb.value e "block/title" with
    | Some (String s) when db_based ->
        let refs = Ldb.ref_ents e "block/refs" in
        if refs = [] then Some s else Some (id_ref_to_title_ref s refs)
    | Some (String s) -> Some s
    | _ -> None

