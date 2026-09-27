(* Wire encoding for thread-api/apply-outliner-ops plus the post-op page
   refresh: re-invoke get-page-blocks-tree, sync the collapsed set from the
   raw wire (Decode drops block/collapsed?), and republish the page via
   Runtime.send (Page_loaded ...). *)

module S = Editor_state

let kw k v = (Wire.Keyword k, v)
let str k v = (Wire.String k, v)

let block_map ?title uuid =
  Wire.Map
    ([ str "block/uuid" (Wire.Uuid uuid) ]
    @ (match title with
      | Some t -> [ str "block/title" (Wire.String t) ]
      | None -> []))

(* op entries are [:name [args]] — the args live in a nested seq; the
   worker's op_of_entry only accepts that shape (outliner_op.ml) *)
let op name args = Wire.Array [ Wire.Keyword name; Wire.Array args ]

let uuids_list uuids = Wire.List (List.map (fun u -> Wire.Uuid u) uuids)

let save_block uuid title =
  op "save-block" [ block_map ~title uuid; Wire.Map [] ]

let insert_blocks blocks target_uuid ~sibling =
  op "insert-blocks"
    [ Wire.List blocks
    ; Wire.Uuid target_uuid
    ; Wire.Map
        [ kw "sibling?" (Wire.Bool sibling)
        ; kw "keep-uuid?" (Wire.Bool true)
        ; kw "outliner-op" (Wire.Keyword "insert-blocks")
        ]
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

let indent_outdent uuids indent =
  op "indent-outdent-blocks"
    [ uuids_list uuids; Wire.Bool indent; Wire.Map [] ]

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
  let set =
    match
      (Wire.map_get_uuid w "block/uuid", Wire.get w "block/collapsed?")
    with
    | Some u, Some (Wire.Bool true) -> S.String_set.add u set
    | _ -> set
  in
  match Wire.get w "block/children" with
  | Some (Wire.List xs) | Some (Wire.Array xs) ->
      List.fold_left collect_collapsed set xs
  | _ -> set

let set_collapsed set =
  let apply st = { st with S.collapsed = set } in
  (* on an empty page the first op's refresh runs before any block_row has
     mounted the editor state — defer the sync until ensure *)
  if S.ready () then S.set_silent apply
  else S.defer_init apply

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
      Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
        ref_v Wire.Nil
      |> Js.Promise.then_ (fun blocks_w ->
             set_collapsed (collect_collapsed S.String_set.empty blocks_w);
             Runtime.send
               (Action.Page_loaded
                  { page with
                    Model.page_blocks = Decode.blocks_of_wire blocks_w
                  });
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
