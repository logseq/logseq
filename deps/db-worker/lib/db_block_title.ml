(* Port of logseq.db.frontend.block-title/block-unique-title — display
   title disambiguating duplicate class titles and appending
   user-visible tags. db is option because cljs callers pass a conn
   or nil. *)

open Datascript
module Ev = Entity_view

(* db-class/private-tags *)
let private_tags =
  [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag"
  ; "logseq.class/Asset"; "logseq.class/Journal"; "logseq.class/Whiteboard"
  ; "logseq.class/Pdf-annotation" ]

(* needs-resolved-block? — title nil, class?, or numeric tag values.
   Pulled bare refs surface as Int64 scalars (cljs number? on pulled
   {:db/id} maps is false — only raw ids count). *)
let needs_resolved_block (block : Ev.node) : bool =
  match block with
  | E _ -> false (* entities are already resolved *)
  | P p ->
      Ev.title block = None
      || Ev.is_class block
      || (match Ev.pulled_values p "block/tags" with
          | Some (Pulled_scalar (Int64 _)) -> true
          | Some (Pulled_many vs) ->
              List.exists
                (fun v ->
                   match v with
                   | Pulled_scalar (Int64 _) -> true
                   | _ -> false)
                vs
          | _ -> false)

let resolve_block (db : db option) (block : Ev.node) : Ev.node =
  match block with
  | E _ -> block
  | P _ ->
      if needs_resolved_block block then
        match db, Ev.db_id block, Ev.uuid block with
        | Some db, Some id, _ ->
            (match Ldb.ent_of_id db id with
             | Some e -> E e
             | None -> block)
        | Some db, None, Some u ->
            (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
             | Some e -> E e
             | None -> block)
        | _ -> block
      else block

(* class-title-conflicts? — another Tag-tagged entity with the same
   :block/title and no deleted-at. *)
let class_title_conflicts (db : db) (class_ : Ev.node) : bool =
  match Ev.title class_, Ev.db_id class_ with
  | Some class_title, Some class_id ->
      datoms db Avet ~a:"block/title" ~v:(String class_title) ()
      |> Seq.filter_map (fun d ->
             if d.e = class_id then None else Ldb.ent_of_id db d.e)
      |> Seq.exists (fun e ->
             Ldb.is_class e && Ldb.value e "logseq.property/deleted-at" = None)
  | _ -> false

(* class-title-with-extends — same shape as block_title.cljs's local
   version (uses the caller-supplied display title). *)
let class_title_with_extends (class_ : Ev.node) (display_title : string) : string =
  let class_title = Ev.title class_ in
  let extends =
    Ev.ref_nodes class_ "logseq.property.class/extends"
    |> List.filter (fun ex ->
           not (Ev.built_in ex || Ev.title ex = class_title))
  in
  match extends with
  | [] -> display_title
  | [ single ] ->
      Option.value (Ev.title single) ~default:"" ^ "/" ^ display_title
  | _ ->
      let titles =
        extends
        |> (fun xs ->
             let rec take n = function
               | _ when n <= 0 -> []
               | [] -> []
               | x :: rest -> x :: take (n - 1) rest
             in
             take 2 xs)
        |> List.map (fun ex -> Option.value (Ev.title ex) ~default:"")
      in
      String.concat " | " titles ^ "/" ^ display_title

(* block-unique-title — ?title is a caller-prepared display title
   (e.g. a search snippet with highlight markers). *)
let block_unique_title ?(with_tags = true) ?(truncate = true) ?(alias : string option)
    ?(display_title : string option) (db : db option) (block : Ev.node) : string option =
  let block_e = resolve_block db block in
  if Ev.built_in block_e then Ev.title block_e
  else
    let class_ = Ev.is_class block_e in
    let tags =
      if with_tags && not class_ then
        let block_raw_title =
          match Ev.value block_e "block/raw-title" with
          | Some (String s) -> Some s
          | _ -> None
        in
        let source_tags =
          match Ev.ref_nodes block "block/tags" with
          | [] -> Ev.ref_nodes block_e "block/tags"
          | ts -> ts
        in
        List.filter
          (fun tag ->
            let inline =
              match block_raw_title with
              | Some rt -> Ev.inline_tag rt tag
              | None -> false
            in
            let private_ =
              match Ev.ident tag with
              | Some i -> List.mem i private_tags
              | None -> false
            in
            not (inline || private_))
          source_tags
      else []
    in
    let base_title =
      if class_ then
        let display =
          match display_title with
          | Some t -> t
          | None -> Option.value (Ev.title block_e) ~default:""
        in
        (match db with
         | Some db when class_title_conflicts db block_e ->
             Some (class_title_with_extends block_e display)
         | _ -> Some display)
      else
        (match display_title with
         | Some t -> Some t
         | None -> Ev.title block_e)
    in
    let trunc_title =
      match base_title with
      | Some t when truncate && String.length t > 256 -> Some (String.sub t 0 256)
      | t -> t
    in
    let result =
      match tags with
      | [] -> trunc_title
      | _ ->
          let tag_strs =
            List.filter_map
              (fun tag ->
                 match Ev.title tag with
                 | Some t -> Some ("#" ^ t)
                 | None -> None)
              tags
          in
          (match tag_strs with
           | [] -> trunc_title
           | _ ->
               Some
                 (Option.value trunc_title ~default:"" ^ " "
                  ^ String.concat ", " tag_strs))
    in
    match result with
    | None -> None
    | Some t ->
        (match alias with
         | Some a -> Some (t ^ " -> alias: " ^ a)
         | None -> Some t)
