(* Wire encoding for thread-api/apply-outliner-ops plus the post-op page
   refresh: re-invoke get-page-blocks-tree, sync the collapsed set from the
   raw wire (Decode drops block/collapsed?), and republish the page via
   Runtime.send (Page_loaded ...). *)

module S = Editor_state

let kw k v = (Wire.Keyword k, v)
let str k v = (Wire.String k, v)

let block_map ?title ?link uuid =
  Wire.Map
    ([ str "block/uuid" (Wire.Uuid uuid) ]
    @ (match title with
      | Some t -> [ str "block/title" (Wire.String t) ]
      | None -> [])
    @ match link with
      | Some db_id -> [ str "block/link" (Wire.Int db_id) ]
      | None -> [])

(* op entries are [:name [args]] — the args live in a nested seq; the
   worker's op_of_entry only accepts that shape (outliner_op.ml) *)
let op name args = Wire.Array [ Wire.Keyword name; Wire.Array args ]

let uuids_list uuids = Wire.List (List.map (fun u -> Wire.Uuid u) uuids)

let save_block uuid title =
  op "save-block" [ block_map ~title uuid; Wire.Map [] ]

let insert_blocks ?(replace_empty_target = false) blocks target_uuid
    ~sibling =
  op "insert-blocks"
    [ Wire.List blocks
    ; Wire.Uuid target_uuid
    ; Wire.Map
        ([ kw "sibling?" (Wire.Bool sibling)
         ; kw "keep-uuid?" (Wire.Bool true)
         ; kw "outliner-op" (Wire.Keyword "insert-blocks")
         ]
        @ if replace_empty_target then
            [ kw "replace-empty-target?" (Wire.Bool true) ]
          else [])
    ]

let delete_blocks uuids =
  op "delete-blocks" [ uuids_list uuids; Wire.Map [] ]

let move_blocks uuids target_uuid ~sibling =
  op "move-blocks"
    [ uuids_list uuids
    ; Wire.Uuid target_uuid
    ; Wire.Map [ kw "sibling?" (Wire.Bool sibling) ]
    ]

let move_up_down uuids up =
  op "move-blocks-up-down" [ uuids_list uuids; Wire.Bool up ]

let indent_outdent ?parent_original uuids indent =
  (* cljs indent-outdent-blocks! passes :parent-original = the embed block
     when the moved block is rendered inside a page embed — outdent then
     targets the linking block, not the embedded child's data parent *)
  let opts =
    match parent_original with
    | Some u ->
        Wire.Map
          [ kw "parent-original"
              (Wire.Map [ kw "block/uuid" (Wire.Uuid u) ]) ]
    | None -> Wire.Map []
  in
  op "indent-outdent-blocks" [ uuids_list uuids; Wire.Bool indent; opts ]

let collapse_expand pairs =
  op "collapse-expand-blocks"
    [ Wire.List
        (List.map
           (fun (u, collapsed) ->
             match block_map u with
             | Wire.Map kvs ->
                 Wire.Map (kvs @ [ str "block/collapsed?" (Wire.Bool collapsed) ])
             | _ -> Wire.Map [])
           pairs)
    ; Wire.Map []
    ]

let create_page title =
  op "create-page" [ Wire.String title; Wire.Map [] ]

(* mirror :block/collapsed? from the raw wire into editor state — the
   decoded Model.block drops it *)
let rec collect_collapsed set (w : Wire.t) =
  match w with
  | Wire.Array xs | Wire.List xs ->
      List.fold_left collect_collapsed set xs
  | _ -> (
      let set =
        match
          (Wire.map_get_uuid w "block/uuid", Wire.get w "block/collapsed?")
        with
        | Some u, Some (Wire.Bool true) -> S.String_set.add u set
        | _ -> set
      in
      match Wire.get w "block/children" with
      | Some children -> collect_collapsed set children
      | None -> set)

let set_collapsed set =
  let apply st = { st with S.collapsed = set } in
  (* on an empty page the first op's refresh runs before any block_row has
     mounted the editor state — defer the sync until ensure *)
  if S.ready () then S.set_silent apply
  else S.defer_init apply

(* Fetch the linked entity's blocks for every :block/link (embed) block in
   a decoded tree and attach them as block_embed_children. Recurses into
   fetched trees; [ancestors] is the chain of linked db ids guarding
   self-embed loops, [collapsed] accumulates :block/collapsed? flags from
   the embed wires (Decode drops the flag). *)
let rec fill_embed_children repo ancestors collapsed
    (blocks : Model.block list) : Model.block list Js.Promise.t =
  let rec go acc = function
    | [] -> Js.Promise.resolve (List.rev acc)
    | (b : Model.block) :: rest -> (
        let children_p =
          fill_embed_children repo ancestors collapsed
            b.Model.block_children
        in
        let embed_p =
          match b.Model.block_link with
          | Some link_id when not (List.mem link_id ancestors) ->
              Runtime.invoke3 "thread-api/get-page-blocks-tree"
                (Wire.String repo) (Wire.Int link_id) Wire.Nil
              |> Js.Promise.then_ (fun w ->
                     collapsed := collect_collapsed !collapsed w;
                     fill_embed_children repo (link_id :: ancestors)
                       collapsed (Decode.blocks_of_wire w))
              |> Js.Promise.catch (fun _ -> Js.Promise.resolve [])
          | _ -> Js.Promise.resolve []
        in
        children_p
        |> Js.Promise.then_ (fun children ->
               embed_p
               |> Js.Promise.then_ (fun embed_children ->
                      go
                        ({ b with
                           Model.block_children = children
                         ; block_embed_children = embed_children
                         }
                        :: acc)
                        rest)))
  in
  go [] blocks

let ancestors_of (page : Model.page) =
  match page.Model.page_db_id with Some id -> [ id ] | None -> []

let refresh_page () : unit Js.Promise.t =
  match (!Runtime.current_repo, !Runtime.current_page) with
  | Some repo, Some page -> (
      let ref_v =
        (* Ldb.get_page accepts Uuid/String/Int64 only — a [:block/uuid u]
           lookup-ref vector decodes to Vector and returns no page *)
        match page.Model.page_uuid with
        | Some u -> Wire.Uuid u
        | None -> Wire.String page.Model.page_title
      in
      let collapsed = ref S.String_set.empty in
      Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
        ref_v Wire.Nil
      |> Js.Promise.then_ (fun blocks_w ->
             collapsed := collect_collapsed !collapsed blocks_w;
             fill_embed_children repo (ancestors_of page) collapsed
               (Decode.blocks_of_wire blocks_w))
      |> Js.Promise.then_ (fun blocks ->
             set_collapsed !collapsed;
             Runtime.send
               (Action.Page_loaded
                  { page with Model.page_blocks = blocks });
             Js.Promise.resolve ()))
  | _ -> Js.Promise.resolve ()

let apply ?(opts = Wire.Map []) ops : unit Js.Promise.t =
  match !Runtime.current_repo with
  | None -> Js.Promise.resolve ()
  | Some repo ->
      Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
        (Wire.Array ops) opts
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("apply-outliner-ops failed", e);
             Js.Promise.resolve ())

let apply_and_refresh ?opts ops =
  apply ?opts ops
  |> Js.Promise.then_ (fun () -> refresh_page ())

let undo () =
  match !Runtime.current_repo with
  | Some repo ->
      Runtime.invoke1 "thread-api/undo-redo-undo" (Wire.String repo)
      |> Js.Promise.then_ (fun _ -> refresh_page ())
  | None -> Js.Promise.resolve ()

let redo () =
  match !Runtime.current_repo with
  | Some repo ->
      Runtime.invoke1 "thread-api/undo-redo-redo" (Wire.String repo)
      |> Js.Promise.then_ (fun _ -> refresh_page ())
  | None -> Js.Promise.resolve ()
