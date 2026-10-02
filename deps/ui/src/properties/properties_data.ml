(* Data access for the properties UI: wire-value helpers over the
   get-display-properties / get-bidirectional-properties endpoints, the
   outliner ops the cljs handlers use, and row/choice decode.

   Property data intentionally lives outside Model (the worker owns it);
   we call thread-api endpoints directly, same as sdk_*. *)

open Promise_ext
module W = Wire

let repo () = W.String (Runtime.repo ())

(* ---------- generic wire accessors ---------- *)

let getf m key = W.get m key
let gets m key = W.map_get_string m key
let geti m key = W.map_get_int m key
let getu m key = W.map_get_uuid m key

(* int-keyed wire maps (extends-by-class-id, structured-children-by-class-id) *)
let int_map_get m id =
  match m with W.Map kvs -> List.assoc_opt (W.Int id) kvs | _ -> None

let getb m key =
  match W.get m key with Some (W.Bool b) -> b | _ -> false

let getk m key =
  match W.get m key with Some (W.Keyword s) -> Some s | _ -> None



(* unwrap datascript/Entity tagged maps *)
let untag = function W.Tagged (_, inner) -> inner | w -> w

let key_eq k v = match v with W.Keyword s -> s = k | _ -> false

(* ---------- entity helpers ---------- *)

let entity_id_of w = geti (untag w) "db/id"
let entity_uuid_of w = getu (untag w) "block/uuid"
let entity_title_of w = gets (untag w) "block/title"

(* [:db/ident {:db/id n}] lookup-ref forms appear in class schema lists;
   resolve to the db/id either way. *)
let ident_entry_id w =
  match w with
  | W.Map _ -> geti w "db/id"
  | _ -> None

let ident_entry_ident w =
  match w with W.Map _ -> getk w "db/ident" | _ -> None

(* The tag idents of an entity — "block/tags" is a set of {db/ident}. *)
let tag_idents entity =
  match getf (untag entity) "block/tags" with
  | Some w ->
      List.filter_map
        (fun item -> getk (untag item) "db/ident")
        (W.elems w)
  | None -> []

(* ---------- display-property rows ---------- *)

(* A row is Map {property-id: kw, property: display-map, value}. *)
let row_ident row = Option.bind (getf row "property-id") W.as_keyword
let row_prop row = Option.value ~default:W.Nil (getf row "property")
let row_value row = Option.value ~default:W.Nil (getf row "value")
let row_title row =
  gets (row_prop row) "block/title" |> Option.value ~default:""

let row_type row =
  getk (row_prop row) "logseq.property/type"
  |> Option.value ~default:"default"

let row_many row =
  match getk (row_prop row) "db/cardinality" with
  | Some "db.cardinality/many" -> true
  | _ -> false

let row_closed_values row =
  match getf (row_prop row) "property/closed-values" with
  | Some w -> W.elems w
  | None -> []

let row_is_class_schema row = match getf row "schema?" with Some _ -> true | None -> false

let row_hidden row =
  getb (row_prop row) "logseq.property/hide?"

let row_hide_empty row =
  getb (row_prop row) "logseq.property/hide-empty-value"

(* ui-position is a ref attr: the display map carries a ref summary with
   db/ident (e.g. :logseq.property.ui-position/block-left) *)
let row_position row =
  match getf (row_prop row) "logseq.property/ui-position" with
  | Some w -> (
      match untag w with
      | W.Map _ as m ->
          Option.value (getk m "db/ident")
            ~default:"logseq.property.ui-position/properties"
      | W.Keyword s | W.String s -> s
      | _ -> "logseq.property.ui-position/properties")
  | None -> "logseq.property.ui-position/properties"

(* cljs resolved-property-value-for-render: when the block has no own
   value, the property's :logseq.property/default-value renders instead *)
let row_effective_value row =
  let v = row_value row in
  let empty =
    match v with
    | W.Nil -> true
    | W.Set [] | W.Array [] | W.List [] -> true
    | _ -> false
  in
  if empty then
    match getf (row_prop row) "logseq.property/default-value" with
    | Some d -> d
    | None -> v
  else v

(* like row_effective_value but returns a row with the value substituted,
   so all cell renderers see the default *)
let row_with_effective_value row =
  match row with
  | W.Map kvs ->
      let eff = row_effective_value row in
      if eff = row_value row then row
      else
        W.Map
          (List.map
             (fun (k, v) ->
               match k with
               | W.Keyword "value" | W.String "value" -> (k, eff)
               | _ -> (k, v))
             kvs)
  | _ -> row

(* A display row's value for ref types is a ref_value_summary map or a
   set of them; plain types come through as scalars. *)
let value_is_ref = function W.Map _ | W.Set _ | W.Array _ | W.List _ -> true | _ -> false

let ref_title w =
  let w = untag w in
  match gets w "block/title" with
  | Some t -> t
  | None -> (
      match gets w "block/name" with Some n -> n | None -> "")

let ref_uuid w = entity_uuid_of w
let ref_dbid w = entity_id_of w

(* cljs entity/class?: entity tagged with :logseq.class/Tag *)
let ref_is_class w =
  let w = untag w in
  match getf w "block/tags" with
  | Some tags ->
      List.exists
        (fun t ->
          match gets t "db/ident" with
          | Some "logseq.class/Tag" -> true
          | _ -> false)
        (W.elems tags)
  | None -> false

let value_elems w =
  match w with
  | W.Set l | W.List l | W.Array l -> l
  | W.Nil -> []
  | other -> [ other ]

let rec value_display w =
  match w with
  | W.Nil -> ""
  | W.Bool b -> if b then "true" else "false"
  | W.Int n -> string_of_int n
  | W.Int64 n -> Int64.to_string n
  | W.Float f ->
      if Float.is_integer f then string_of_int (int_of_float f)
      else string_of_float f
  | W.String s -> s
  | W.Keyword s -> s
  | W.Map _ -> ref_title w
  | W.Set l | W.List l | W.Array l ->
      List.map value_display l |> String.concat ", "
  | W.Tagged (_, inner) -> value_display inner
  | other -> Option.value ~default:"" (W.as_string other)

let value_empty_p w =
  match w with
  | W.Nil -> true
  | W.String s -> String.trim s = ""
  | W.Set l | W.List l | W.Array l -> l = []
  | _ -> false

(* ---------- endpoints ---------- *)

let invoke name args =
  Runtime.invoke ("thread-api/" ^ name) args

(* opts map for get-display-properties. *)
let display_opts ~page_title ~tag_dialog ~sidebar =
  W.Map
    [ (W.Keyword "gallery-view?", W.Bool false)
    ; (W.Keyword "page-title?", W.Bool page_title)
    ; (W.Keyword "sidebar-properties?", W.Bool sidebar)
    ; (W.Keyword "tag-dialog?", W.Bool tag_dialog)
    ; (W.Keyword "publishing?", W.Bool false)
    ; (W.Keyword "state-hide-empty-properties?", W.Bool false)
    ]

let display_props ?(page_title = false) ?(tag_dialog = false)
    ?(sidebar = false) ~show_hidden block_ref =
  invoke "get-display-properties"
    [ repo ()
    ; W.Map
        [ (W.Keyword "block", block_ref)
        ; ( W.Keyword "opts"
          , display_opts ~page_title ~tag_dialog ~sidebar )
        ; ( W.Keyword "show-empty-and-hidden-properties?"
          , W.Bool show_hidden )
        ]
    ]

(* positioned-rows block_wire position — synthesize display rows
   {property-id, property, value} for the idents the worker grouped
   under POSITION (its render_property_position gating already applied).
   Values come straight off the block's own attrs. *)
let positioned_rows block_wire position =
  match getf block_wire "block.temp/positioned-properties" with
  | Some positioned -> (
      match getf positioned position with
      | Some props_w ->
          List.filter_map
            (fun prop ->
              match getk prop "db/ident" with
              | Some ident ->
                  let value =
                    match getf block_wire ident with
                    | Some (W.Map _ as m) -> (
                        (* scalar property values live in a value
                           entity: {db/id, block/uuid,
                           logseq.property/value} *)
                        match getf m "logseq.property/value" with
                        | Some v -> v
                        | None -> m)
                    | Some v -> v
                    | None -> W.Nil
                  in
                  Some
                    (W.Map
                       [ (W.String "property-id", W.Keyword ident)
                       ; (W.String "property", prop)
                       ; (W.String "value", value) ])
              | None -> None)
            (W.elems props_w)
      | None -> [])
  | None -> []

let split_display wire =
  let rows =
    match W.get wire "full-properties" with
    | Some w -> W.elems w
    | None -> []
  in
  let hidden =
    match W.get wire "hidden-properties" with
    | Some w -> W.elems w
    | None -> []
  in
  (rows, hidden)

let bidirectional target_id =
  invoke "get-bidirectional-properties"
    [ repo ()
    ; W.Map [ (W.Keyword "target-id", W.Int target_id) ]
    ]

let property_values ~property_ident ~block =
  invoke "get-property-values"
    [ repo ()
    ; W.Map
        [ (W.Keyword "property-ident", W.Keyword property_ident)
        ; (W.Keyword "block", block)
        ]
    ]

let closed_values property_ref =
  invoke "get-property-closed-values" [ repo (); property_ref ]

(* cljs db-async/<get-property-node-selector-data {property block} *)
let node_selector_data ~property_id ~block =
  invoke "get-property-node-selector-data"
    [ repo ()
    ; W.Map
        [ (W.Keyword "property", W.Int property_id)
        ; (W.Keyword "block", block)
        ]
    ]

(* cljs search/block-search — returns a bare array of result maps
   ({db/id, block/uuid, block/title, page?, ...}) *)
let search_blocks q =
  invoke "search-blocks"
    [ repo ()
    ; W.String q
    ; W.Map
        [ (W.Keyword "limit", W.Int 20)
        ; (W.Keyword "search-limit", W.Int 100)
        ; (W.Keyword "enable-snippet?", W.Bool false)
        ; (W.Keyword "built-in?", W.Bool false)
        ]
    ]

let all_properties block =
  invoke "get-all-properties"
    [ repo ()
    ; W.Map
        [ (W.Keyword "remove-ui-non-suitable-properties?", W.Bool true)
        ; (W.Keyword "block", block)
        ]
    ]

let class_properties entity_ref =
  invoke "get-class-properties" [ repo (); entity_ref ]

let all_classes () =
  invoke "get-all-classes"
    [ repo ()
    ; W.Map
        [ (W.Keyword "except-root-class?", W.Bool true)
        ; (W.Keyword "except-private-tags?", W.Bool false)
        ]
    ]

(* page-summary for a journal day ({db/id, block/title, ...}) *)
let journal_page_by_day day =
  invoke "get-journal-page-by-day" [ repo (); W.Int day ]

(* worker entity-of-arg rejects a bare Uuid — pass a [:block/uuid _]
   lookup-ref wherever an endpoint arg is an entity ref *)
let uuid_ref uuid = W.List [ W.Keyword "block/uuid"; W.Uuid uuid ]

(* resolve any entity by uuid string / db/id / title-ish ref *)
let entity ref_wire = invoke "entity" [ repo (); ref_wire ]

let entity_by_uuid uuid = entity (uuid_ref uuid)

(* get-blocks {:render-data? true} -> block wire carrying
   block.temp/positioned-properties. Every mounted .ls-block properties
   area calls this — batching callers in the same task into ONE request
   turns a page load's N+1 roundtrip storm into a single call. *)
external rd_set_timeout : (unit -> unit) -> int -> unit = "setTimeout"

let rd_pending : (string * (W.t -> unit)) list ref = ref []
let rd_scheduled = ref false

let rd_result_of_pair pair =
  match getf pair "block" with
  | Some res -> res
  | None -> ( match W.elems pair with [ _; res ] -> res | _ -> W.Nil)

let rd_pair_uuid pair =
  match W.get pair "id" with
  | Some w -> (
      match W.as_uuid w with
      | Some u -> Some u
      | None -> W.as_string w)
  | None -> entity_uuid_of (rd_result_of_pair pair)

let rd_flush () =
  rd_scheduled := false;
  let pending = List.rev !rd_pending in
  rd_pending := [];
  match pending with
  | [] -> ()
  | _ -> (
      try
        (let* w =
         invoke "get-blocks"
           [ repo ()
           ; W.Array
               (List.map
                  (fun u ->
                    W.Map
                      [ (W.String "id", W.Uuid u)
                      ; ( W.String "opts"
                        , W.Map
                            [ (W.Keyword "render-data?", W.Bool true) ]
                        ) ])
                  (List.sort_uniq String.compare (List.map fst pending)))
           ]
       in
       let results =
         List.filter_map
           (fun pair ->
             Option.map
               (fun u -> (u, rd_result_of_pair pair))
               (rd_pair_uuid pair))
           (W.elems w)
       in
       List.iter
         (fun (uuid, resolve) ->
           resolve
             (Option.value (List.assoc_opt uuid results) ~default:W.Nil))
         pending;
       Js.Promise.resolve ())
       |> Js.Promise.catch (fun e ->
              Platform.console_error ("render-data batch failed", e);
              List.iter (fun (_, resolve) -> resolve W.Nil) pending;
              Js.Promise.resolve ())
       |> ignore
      with e ->
        Platform.console_error ("render-data batch failed", e);
        List.iter (fun (_, resolve) -> resolve W.Nil) pending)

let block_render_data uuid =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      rd_pending := (uuid, (fun w -> resolve w [@u])) :: !rd_pending;
      if not !rd_scheduled then (
        rd_scheduled := true;
        rd_set_timeout rd_flush 0))

(* ---------- ops ---------- *)

let apply = Sdk_util.apply_op
let apply_many = Sdk_util.apply_ops

let set_block_property ~block_uuid ~ident ~value =
  apply "set-block-property"
    [ W.Uuid block_uuid; W.Keyword ident; value ]

let remove_block_property ~block_uuid ~ident =
  apply "remove-block-property" [ W.Uuid block_uuid; W.Keyword ident ]

let delete_property_value ~block_uuid ~ident ~value =
  apply "delete-property-value"
    [ W.Uuid block_uuid; W.Keyword ident; value ]

let uuid_list uuids = W.List (List.map (fun u -> W.Uuid u) uuids)

(* cljs batch ops for multi-block selection *)
let batch_set_property ~block_uuids ~ident ~value =
  apply "batch-set-property"
    [ uuid_list block_uuids; W.Keyword ident; value; W.Map [] ]

let batch_delete_property_value ~block_uuids ~ident ~value =
  apply "batch-delete-property-value"
    [ uuid_list block_uuids; W.Keyword ident; value ]

let upsert_property ?ident ~schema ~property_name () =
  apply "upsert-property"
    [ (match ident with Some i -> W.Keyword i | None -> W.Nil)
    ; schema
    ; W.Map [ (W.Keyword "property-name", W.String property_name) ]
    ]

let upsert_property_no_name ?ident ~schema () =
  apply "upsert-property"
    [ (match ident with Some i -> W.Keyword i | None -> W.Nil)
    ; schema
    ; W.Map []
    ]

let create_property_text_block ~block_uuid ~ident ~title ?new_block_id () =
  let opts =
    W.Map
      ([ (W.Keyword "set-block-property?", W.Bool true) ]
       @
       match new_block_id with
       | Some id -> [ (W.Keyword "new-block-id", W.Uuid id) ]
       | None -> [])
  in
  apply "create-property-text-block"
    [ W.Uuid block_uuid; W.Keyword ident; W.String title; opts ]

let class_add_property ~class_uuid ~ident =
  apply "class-add-property" [ W.Uuid class_uuid; W.Keyword ident ]

let class_remove_property ~class_uuid ~ident =
  apply "class-remove-property" [ W.Uuid class_uuid; W.Keyword ident ]

let upsert_closed_value ~ident ?choice_id ~value ?description
    ?scoped_class_id () =
  let kv acc k v = (W.Keyword k, v) :: acc in
  let opts =
    []
    |> (fun acc ->
         match choice_id with
         | Some id -> kv acc "id" (W.Uuid id)
         | None -> acc)
    |> (fun acc -> kv acc "value" (W.String value))
    |> (fun acc ->
         match description with
         | Some d -> kv acc "description" (W.String d)
         | None -> acc)
    |> fun acc ->
       match scoped_class_id with
       | Some id -> kv acc "scoped-class-id" (W.Int id)
       | None -> acc
  in
  apply "upsert-closed-value" [ W.Keyword ident; W.Map opts ]

let delete_closed_value ~ident ~choice_uuid =
  apply "delete-closed-value" [ W.Keyword ident; W.Uuid choice_uuid ]

let add_existing_to_closed_values ~ident values =
  apply "add-existing-values-to-closed-values"
    [ W.Keyword ident; W.List (List.map (fun v -> W.String v) values) ]

let transact tx =
  apply "transact" [ W.List tx; W.Map [] ]

(* property text values save through the same wrap-parse-block path as
   block titles so [[refs]]/#tags inside them materialize entities *)
let save_block ~uuid ~title =
  let* p = Title_refs.parse (String.trim title) in
  apply "save-block"
    [ W.Map
        ([ (W.String "block/uuid", W.Uuid uuid)
         ; (W.String "block/title", W.String p.Title_refs.title) ]
        @ Title_refs.kvs_of_parsed p)
    ; W.Map []
    ]

let set_choice_scope ~choice_id ~class_id ~add =
  transact
    [ W.List
        [ W.Keyword (if add then "db/add" else "db/retract")
        ; W.Int choice_id
        ; W.Keyword "logseq.property/choice-classes"
        ; W.Int class_id
        ]
    ]

let reorder_display_property ~block_id ~active_ident ~over_ident ~direction
    ~property_idents =
  invoke "reorder-display-property"
    [ repo ()
    ; W.Map
        [ (W.Keyword "block-id", W.Int block_id)
        ; (W.Keyword "active-ident", W.Keyword active_ident)
        ; (W.Keyword "over-ident", W.Keyword over_ident)
        ; (W.Keyword "direction", W.String direction)
        ; ( W.Keyword "property-idents"
          , W.List (List.map (fun i -> W.Keyword i) property_idents) )
        ]
    ]

let create_page title =
  apply "create-page" [ W.String title; W.Map [] ]

let create_class title =
  apply "create-page"
    [ W.String title; W.Map [ (W.Keyword "class?", W.Bool true) ] ]

(* the create-page op result is [title, uuid] — no db/id *)
let create_result_uuid res =
  match W.elems res with
  | [ _; W.Uuid u ] | [ _; W.String u ] -> Some u
  | _ -> None

let db_id_of_uuid uuid =
  let* w = invoke "get-case-page" [ repo (); W.Uuid uuid ] in
  Js.Promise.resolve (geti w "db/id")
