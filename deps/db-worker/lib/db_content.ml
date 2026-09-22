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
  Some (String.lowercase_ascii (String.sub s !i (!j - !i)))

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
      let normalized = String.lowercase_ascii route_name in
      let block =
        List.find_opt
          (fun b -> heading_route_name b = Some normalized)
          candidates
      in
      Some { page; candidates; block }
