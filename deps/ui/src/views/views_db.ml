(* Worker access for views — thread-api endpoints + outliner ops. *)

open Promise_ext
module W = Wire

let repo = Runtime.repo

let catch_quiet ?(on_error = fun () -> ()) (p : unit Js.Promise.t) =
  Js.Promise.catch
    (fun e ->
      Ui_services.log_error ("views worker call failed", e);
      on_error ();
      Js.Promise.resolve ())
    p

(* writes bypassing Outliner_ops.apply must still surface failure *)
let catch_write ?(current = fun () -> true) ?(on_error = fun () -> ())
    (p : unit Js.Promise.t) =
  Js.Promise.catch
    (fun e ->
      Ui_services.log_error ("views write failed", e);
      if current () then begin
        Toast.error (I18n.t "ui/save-changes-error");
        on_error ()
      end;
      Js.Promise.resolve ())
    p

let snapshots ?(on_error = fun () -> ()) ?(f = fun _ -> ())
    (resources : W.t list) =
  (let* w =
    Runtime.invoke2 "thread-api/get-render-snapshots" (W.String (repo ()))
      (W.Map
         [ (W.kw "blocks", W.Array [])
         ; (W.kw "children", W.Array [])
         ; (W.kw "resources", W.Array resources)
         ])
  in
  Outliner_ops.check_loader_result w;
  f w; Js.Promise.resolve ())
  |> Js.Promise.catch (fun e ->
      Ui_services.log_error ("views worker call failed", e);
      on_error ();
      Js.Promise.resolve ())
  |> ignore

let snapshot_value snap key =
  let value = Views_wire.snapshot_slot_value snap key in
  Option.iter Outliner_ops.check_loader_result value;
  value

(* inner resource keys — used both as the [:resource k] request spec and as
   the slot key inside get-render-snapshots results *)
let key_view_data view_uuid ctx =
  W.Array [ W.kw "view-data"; W.Uuid view_uuid; ctx ]

let key_views owner feature = W.Array [ W.kw "views"; owner; W.kw feature ]

let key_query spec = W.Array [ W.kw "query"; spec ]

let key_page_identity name = W.Array [ W.kw "page-identity"; W.String name ]

let key_ref_count uuid = W.Array [ W.kw "block-ref-count"; W.Uuid uuid ]

(* request resources are the bare key vectors; in the response the slot key
   is [:resource <key>] (see snapshot_slot_value) *)
let res (k : W.t) = k

let resource_view_data view_uuid ctx = res (key_view_data view_uuid ctx)

let resource_views owner feature = res (key_views owner feature)

let resource_query spec = res (key_query spec)

let resource_ref_count uuid = res (key_ref_count uuid)

let pull_many ?(on_error = fun () -> ()) selector_edn ids f =
  (let* w =
    Runtime.invoke3 "thread-api/pull-many" (W.String (repo ()))
      (W.String selector_edn)
      (W.Array
         (List.map (fun u -> W.Array [ W.kw "block/uuid"; W.Uuid u ]) ids))
  in
  Outliner_ops.check_loader_result w;
  f (W.args_list w); Js.Promise.resolve ())
  |> catch_quiet ~on_error
  |> ignore

let get_view_filter_data ?(opts = W.Map []) property f =
  (let* w =
    Runtime.invoke2 "thread-api/get-view-filter-data" (W.String (repo ()))
      (W.Map
         ((W.kw "property", property)
          :: (match opts with W.Map kvs -> kvs | _ -> [])))
  in
  Outliner_ops.check_loader_result w;
  f w; Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

let get_class_properties ?(on_error = fun () -> ()) class_id f =
  (let* w =
    Runtime.invoke2 "thread-api/get-class-properties" (W.String (repo ()))
      class_id
  in
  Outliner_ops.check_loader_result w;
  f (W.args_list w); Js.Promise.resolve ())
  |> catch_quiet ~on_error
  |> ignore

let get_all_classes f =
  (let* w =
    Runtime.invoke2 "thread-api/get-all-classes" (W.String (repo ()))
      (W.Map
         [ (W.kw "except-root-class?", W.Bool true)
         ; (W.kw "except-private-tags?", W.Bool false)
         ])
  in
  f (W.args_list w); Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

let get_all_properties ?(on_error = fun () -> ()) f =
  (let* w =
    Runtime.invoke2 "thread-api/get-all-properties" (W.String (repo ()))
      (W.Map
         [ (W.kw "remove-built-in-property?", W.Bool false)
         ; (W.kw "remove-non-queryable-built-in-property?", W.Bool true)
         ])
  in
  Outliner_ops.check_loader_result w;
  f (W.args_list w); Js.Promise.resolve ())
  |> catch_quiet ~on_error
  |> ignore

let get_closed_values ident f =
  (let* w =
    Runtime.invoke2 "thread-api/get-property-closed-values"
      (W.String (repo ()))
      (W.Keyword ident)
  in
  f (W.args_list w); Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

let get_property_values ident f =
  (let* w =
    Runtime.invoke2 "thread-api/get-property-values" (W.String (repo ()))
      (W.Map [ (W.kw "property-ident", W.Keyword ident) ])
  in
  f w; Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

let get_all_page_titles f =
  (let* w = Runtime.invoke1 "thread-api/get-all-page-titles" (W.String (repo ())) in
  f (List.filter_map W.as_string (W.args_list w));
  Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

(* get-blocks returns one {block, children?} wrapper per request —
   callers want the entity map; fold a present children list onto
   block/children so the wire shape matches entity-forward-map trees *)
let block_of_result (w : W.t) : W.t =
  match W.get w "block" with
  | Some (W.Map ps) -> (
      match W.get w "children" with
      | Some cs -> W.Map (ps @ [ (W.Keyword "block/children", cs) ])
      | None -> W.Map ps)
  | Some b -> b
  | None -> w

let get_blocks uuids ?(metadata = false) ?(children = false)
    ?(include_property_block = false) ?(on_error = fun () -> ()) f =
  (let* w =
    Runtime.invoke2 "thread-api/get-blocks" (W.String (repo ()))
      (W.Array
         (List.map
            (fun u ->
              W.Map
                [ (W.kw "id", W.Uuid u)
                ; ( W.kw "opts"
                  , W.Map
                      ([ (W.kw "block-metadata?", W.Bool metadata)
                       ; (W.kw "children?", W.Bool children)
                       ; ( W.kw "include-property-block?"
                         , W.Bool include_property_block )
                       ]) )
                ])
            uuids))
  in
  Outliner_ops.check_loader_result w;
  f (List.map block_of_result (W.args_list w));
  Js.Promise.resolve ())
  |> Js.Promise.catch (fun e ->
         Ui_services.log_error ("views worker call failed", e);
         on_error ();
         Js.Promise.resolve ())
  |> ignore

let q query_edn f =
  (let* w =
    Runtime.invoke2 "thread-api/q" (W.String (repo ()))
      (W.Array [ W.String query_edn ])
  in
  f w; Js.Promise.resolve ())
  |> catch_quiet
  |> ignore

(* -- write ops -- *)

let apply_ops ?current ops f =
  (let* result = Outliner_ops.apply_result ?current ops in
  if result <> None && Option.fold ~none:true ~some:(fun current -> current ()) current
  then f ();
  Js.Promise.resolve ())
  |> ignore

let set_view_property ?current view_uuid ident v f =
  apply_ops ?current
    [ Outliner_ops.op "set-block-property"
        [ W.Uuid view_uuid; W.Keyword ident; v ] ]
    f

let remove_view_property ?current view_uuid ident f =
  apply_ops ?current
    [ Outliner_ops.op "remove-block-property" [ W.Uuid view_uuid; W.Keyword ident ] ]
    f

let set_gallery_display_properties ~current view_uuid idents f =
  let source_repo = repo () in
  let route = Runtime.route () in
  let revision = (Runtime.model ()).Model.context_revision in
  let fresh () = current () && (Runtime.model ()).Model.context_revision = revision
    && repo () = source_repo && Runtime.route () = route in
  let rec resolve acc = function
    | [] -> Js.Promise.resolve (List.rev acc)
    | ident :: rest ->
        let* property =
          Runtime.invoke3 "thread-api/pull" (W.String source_repo)
            (W.String "[:db/id]") (W.Keyword ident)
        in
        Outliner_ops.check_loader_result property;
        match W.map_get_int property "db/id" with
        | Some id -> resolve (W.Int id :: acc) rest
        | None -> failwith "Gallery display property has no db/id"
  in
  (let* ids = resolve [] idents in
   if not (fresh ()) then failwith "Gallery context changed";
   let* result = Outliner_ops.apply_result ~current:fresh
     [ Outliner_ops.op "set-block-property"
         [ W.Uuid view_uuid
         ; W.Keyword "logseq.property.view/gallery-display-properties"
         ; W.Array ids ] ]
   in
   if result <> None && fresh () then f ();
   Js.Promise.resolve ())
  |> catch_write ~current:fresh |> ignore

let set_gallery_asset_property ~current view_uuid ident f =
  let source_repo = repo () in
  let route = Runtime.route () in
  let revision = (Runtime.model ()).Model.context_revision in
  let fresh () = current () && (Runtime.model ()).Model.context_revision = revision
    && repo () = source_repo && Runtime.route () = route in
  (let* property =
     Runtime.invoke3 "thread-api/pull" (W.String source_repo)
       (W.String "[:db/id]") (W.Keyword ident)
   in
   Outliner_ops.check_loader_result property;
   let id = match W.map_get_int property "db/id" with
     | Some id -> id
     | None -> failwith "Gallery cover property has no db/id" in
   if not (fresh ()) then failwith "Gallery context changed";
   let* result = Outliner_ops.apply_result ~current:fresh
     [ Outliner_ops.op "set-block-property"
         [ W.Uuid view_uuid
         ; W.Keyword "logseq.property.view/gallery-asset-property"
         ; W.Int id ] ]
   in
   if result <> None && fresh () then f ();
   Js.Promise.resolve ())
  |> catch_write ~current:fresh |> ignore

let set_gallery_card_size view_uuid size f =
  if not (List.mem size ["default"; "compact"]) then
    invalid_arg "Invalid gallery card size";
  set_view_property view_uuid "logseq.property.view/gallery-card-size"
    (W.Keyword size) f

let set_gallery_dimensions view_uuid width height f =
  let set ident value = Outliner_ops.op "set-block-property"
    [W.Uuid view_uuid; W.Keyword ident; value] in
  apply_ops
    [ set "logseq.property.view/gallery-card-size" (W.Keyword "custom")
    ; set "logseq.property.view/gallery-card-width" (W.Int (max 100 (min 1024 width)))
    ; set "logseq.property.view/gallery-card-height" (W.Int (max 100 (min 1024 height))) ] f

let save_block_title uuid title f =
  let _ =
    (let* op = Outliner_ops.save_block_parsed uuid title in
    Js.Promise.resolve (apply_ops [ op ] f))
  in
  ()

let delete_blocks uuids f =
  apply_ops [ Outliner_ops.delete_blocks uuids ] f

let delete_page uuid f =
  apply_ops
    [ Outliner_ops.op "delete-page" [ W.Uuid uuid; W.Map [] ] ]
    f

(* ---------- linked-references include/exclude filters ---------- *)

let includes_prop = "logseq.property.linked-references/includes"

let excludes_prop = "logseq.property.linked-references/excludes"

(* pull the owner page's included/excluded ref pages — (block/name,
   block/title) pairs like cljs db-reference/get-filters *)
let pull_ref_filters ?(on_error = fun () -> ()) owner_uuid f =
  pull_many ~on_error
    ("[:db/id {:" ^ includes_prop
   ^ " [:db/id :block/name :block/title]} {:" ^ excludes_prop
   ^ " [:db/id :block/name :block/title]}]")
    [ owner_uuid ] (fun rows ->
      let names prop =
        match rows with
        | [ page ] -> (
            match W.get page prop with
            | Some vs ->
                List.filter_map
                  (fun e ->
                    match W.map_get_string e "block/name" with
                    | Some n ->
                        Some
                          ( n
                          , Option.value
                              (W.map_get_string e "block/title")
                              ~default:n )
                    | None -> None)
                  (W.elems vs)
            | None -> [])
        | _ -> []
      in
      f (names includes_prop, names excludes_prop))

(* page-handler/db-based-save-filter!: add -> set-block-property,
   remove -> delete-property-value *)
let save_ref_filter ?current owner_uuid ~prop ~ref_eid ~add f =
  apply_ops ?current
    [ Outliner_ops.op
        (if add then "set-block-property" else "delete-property-value")
        [ W.Uuid owner_uuid; W.Keyword prop; W.Int ref_eid ] ]
    f

(* insert a view block under the $$$views page; [owner_uuid] is the
   entity the view is for (tag page / $$$views page / property). cljs
   api-insert-new-block! inserts after the last child (sibling insert)
   so new views append at the end — a non-sibling insert would prepend
   and the default view would lose its first position *)
let insert_view_block ~current ?(on_error = fun () -> ())
    ?(after = fun () -> ()) ~title ~uuid ~page_uuid
    ~owner_uuid ~feature_type () =
  let repo = repo () in
  get_blocks [ page_uuid ] ~metadata:true ~children:true ~on_error (fun ents ->
      if current () then begin
      let last_child_uuid =
        match ents with
        | [ e ] -> (
            match W.get e "block/children" with
            | Some (W.Array cs) | Some (W.List cs) ->
                List.fold_left
                  (fun acc c ->
                    match W.map_get_uuid c "block/uuid" with
                    | Some u -> (
                        let o =
                          match W.get c "block/order" with
                          | Some (W.String s) -> s
                          | _ -> ""
                        in
                        match acc with
                        | Some (_, o') when String.compare o o' <= 0 -> acc
                        | _ -> Some (u, o))
                    | None -> acc)
                  None cs
                |> Option.map fst
            | _ -> None)
        | _ -> None
      in
      let target_uuid, sibling =
        match last_child_uuid with
        | Some u -> (u, true)
        | None -> (page_uuid, false)
      in
      let refs_props =
        (* cljs create-view!: refs views are list views grouped by
           block/page — stamped on the view entity at insert time *)
        match feature_type with
        | "linked-references" | "unlinked-references" ->
            [ ( W.String "logseq.property.view/type"
              , W.Array
                  [ W.kw "db/ident"
                  ; W.Keyword "logseq.property.view/type.list" ] )
            ; ( W.String "logseq.property.view/group-by-property"
              , W.Array [ W.kw "db/ident"; W.Keyword "block/page" ] )
            ]
        | _ -> []
      in
      let block_map =
        W.Map
          ([ (W.String "block/uuid", W.Uuid uuid)
           ; (W.String "block/title", W.String title)
           ; ( W.String "logseq.property/view-for"
             , W.Array [ W.kw "block/uuid"; W.Uuid owner_uuid ] )
           ; ( W.String "logseq.property.view/feature-type"
             , W.Keyword feature_type )
           ]
          @ refs_props)
      in
      (let* result =
        Runtime.invoke3 "thread-api/apply-outliner-ops" (W.String repo)
          (W.Array
             [ Outliner_ops.op "insert-blocks"
                 [ W.List [ block_map ]
                 ; W.Uuid target_uuid
                 ; W.Map
                     [ (W.kw "sibling?", W.Bool sibling)
                     ; (W.kw "keep-uuid?", W.Bool true)
                     ; (W.kw "outliner-op", W.Keyword "insert-blocks")
                     ]
                 ]
             ])
          (W.Map [])
      in
      Outliner_ops.check_loader_result result;
      if current () then after ();
      Js.Promise.resolve ())
      |> catch_write ~current ~on_error
      |> ignore end)

let insert_object_block ~uuid ~page_uuid ~title ~tags ~props f =
  let tags_w =
    match tags with
    | [] -> []
    | ts ->
        [ ( W.String "block/tags"
          , W.Array
              (List.map
                 (fun t -> W.Array [ W.kw "block/uuid"; W.Uuid t ])
                 ts) )
        ]
  in
  let block_map =
    W.Map
      ([ (W.String "block/uuid", W.Uuid uuid)
       ; (W.String "block/title", W.String title)
       ; ( W.String "block/page"
         , W.Array [ W.kw "block/uuid"; W.Uuid page_uuid ] )
       ]
      @ tags_w @ props)
  in
  (let* w =
    Runtime.invoke3 "thread-api/apply-outliner-ops" (W.String (repo ()))
      (W.Array
         [ Outliner_ops.op "insert-blocks"
             [ W.List [ block_map ]
             ; W.Uuid page_uuid
             ; W.Map
                 [ (W.kw "sibling?", W.Bool false)
                 ; (W.kw "keep-uuid?", W.Bool true)
                 ; (W.kw "outliner-op", W.Keyword "insert-blocks")
                 ]
             ]
         ])
      (W.Map [])
  in
  f w; Js.Promise.resolve ())
  |> catch_write
  |> ignore

(* common-uuid/gen-uuid :view-block-uuid port — verbatim copy of
   deps/db-worker/lib/common_uuid.ml (murmur3 hashUnencodedChars over
   UTF-16 units). *)
let utf16_units (s : string) : int list =
  let n = String.length s in
  let rec decode i acc =
    if i >= n then List.rev acc
    else
      let b = Char.code s.[i] in
      if b < 0x80 then decode (i + 1) (b :: acc)
      else if b < 0xE0 then
        let cp = ((b land 0x1F) lsl 6) lor (Char.code s.[i + 1] land 0x3F) in
        decode (i + 2) (cp :: acc)
      else if b < 0xF0 then
        let cp =
          ((b land 0x0F) lsl 12)
          lor ((Char.code s.[i + 1] land 0x3F) lsl 6)
          lor (Char.code s.[i + 2] land 0x3F)
        in
        decode (i + 3) (cp :: acc)
      else
        let cp =
          ((b land 0x07) lsl 18)
          lor ((Char.code s.[i + 1] land 0x3F) lsl 12)
          lor ((Char.code s.[i + 2] land 0x3F) lsl 6)
          lor (Char.code s.[i + 3] land 0x3F)
        in
        let hi = 0xD800 + ((cp - 0x10000) lsr 10) in
        let lo = 0xDC00 + ((cp - 0x10000) land 0x3FF) in
        decode (i + 4) (lo :: hi :: acc)
  in
  decode 0 []

let hash_string (s : string) : int =
  let mix_k1 k1 =
    let k1 = Int32.mul k1 0xcc9e2d51l in
    Int32.shift_left k1 15 |> Int32.logor (Int32.shift_right_logical k1 17)
    |> fun r -> Int32.mul r 0x1b873593l
  in
  let mix_h1 h1 k1 =
    let h1 = Int32.logxor h1 k1 in
    Int32.shift_left h1 13 |> Int32.logor (Int32.shift_right_logical h1 19)
    |> fun r -> Int32.add (Int32.mul r 5l) 0xe6546b64l
  in
  let units = Array.of_list (utf16_units s) in
  let n = Array.length units in
  let h = ref 0l in
  let i = ref 1 in
  while !i < n do
    let k1 = Int32.of_int (units.(!i - 1) lor (units.(!i) lsl 16)) in
    h := mix_h1 !h (mix_k1 k1);
    i := !i + 2
  done;
  if n land 1 = 1 then
    h := Int32.logxor !h (mix_k1 (Int32.of_int units.(n - 1)));
  let h' = !h in
  let h' = Int32.logxor h' (Int32.of_int n) in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 16) in
  let h' = Int32.mul h' 0x85ebca6bl in
  let h' = Int32.logxor h' (Int32.shift_right_logical h' 13) in
  let h' = Int32.mul h' 0xc2b2ae35l in
  Int32.to_int (Int32.logxor h' (Int32.shift_right_logical h' 16))

let clamp_sub s start =
  let n = String.length s in
  if start >= n then "" else String.sub s start (n - start)

let clamp_sub_n s start fin =
  let n = String.length s in
  let fin = min fin n in
  if start >= fin then "" else String.sub s start (fin - start)

let fill0 s n =
  let len = String.length s in
  if len >= n then s else String.make (n - len) '0' ^ s

let gen_view_uuid ~(owner : string) ~(feature_type : string) : string =
  let seed = owner ^ feature_type in
  let h = Printf.sprintf "%d" (abs (hash_string seed)) in
  Printf.sprintf "00000006-%s-%s-%s-%s" (fill0 (clamp_sub_n h 0 4) 4)
    (fill0 (clamp_sub_n h 4 8) 4)
    (fill0 (clamp_sub_n h 8 12) 4)
    (fill0 (clamp_sub h 12) 12)
