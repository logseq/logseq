(* Data access for the properties UI: wire-value helpers over the
   get-display-properties / get-bidirectional-properties endpoints, the
   outliner ops the cljs handlers use, and row/choice decode.

   Property data intentionally lives outside Model (the worker owns it);
   we call thread-api endpoints directly, same as sdk_*. *)

module W = Wire

let repo () = W.String (Sdk_util.repo ())

(* ---------- generic wire accessors ---------- *)

let getf m key = W.get m key
let gets m key = W.map_get_string m key
let geti m key = W.map_get_int m key
let getu m key = W.map_get_uuid m key

let getb m key =
  match W.get m key with Some (W.Bool b) -> b | _ -> false

let getk m key =
  match W.get m key with Some (W.Keyword s) -> Some s | _ -> None

(* Elements of Array|List|Set — choice lists come back as Set. *)
let elems w = match w with W.Array l | W.List l | W.Set l -> l | _ -> []

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
        (elems w)
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
  | Some w -> elems w
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
let display_opts ~page_title ~tag_dialog =
  W.Map
    [ (W.Keyword "gallery-view?", W.Bool false)
    ; (W.Keyword "page-title?", W.Bool page_title)
    ; (W.Keyword "sidebar-properties?", W.Bool false)
    ; (W.Keyword "tag-dialog?", W.Bool tag_dialog)
    ; (W.Keyword "publishing?", W.Bool false)
    ; (W.Keyword "state-hide-empty-properties?", W.Bool false)
    ]

let display_props ?(page_title = false) ?(tag_dialog = false)
    ~show_hidden block_ref =
  invoke "get-display-properties"
    [ repo ()
    ; W.Map
        [ (W.Keyword "block", block_ref)
        ; (W.Keyword "opts", display_opts ~page_title ~tag_dialog)
        ; ( W.Keyword "show-empty-and-hidden-properties?"
          , W.Bool show_hidden )
        ]
    ]

(* returns (rows, hidden-rows, positioned-by-position) — the worker emits
   positioned-properties as {block-left|block-right|block-below: rows}
   (cljs block.temp/positioned-properties) *)
let split_display wire =
  let rows =
    match W.get wire "full-properties" with
    | Some w -> elems w
    | None -> []
  in
  let hidden =
    match W.get wire "hidden-properties" with
    | Some w -> elems w
    | None -> []
  in
  let positioned position =
    match W.get wire "positioned-properties" with
    | Some p -> (
        match W.get p position with Some w -> elems w | None -> [])
    | None -> []
  in
  (rows, hidden, positioned)

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

let entity_by_title title = invoke "get-case-page" [ repo (); W.String title ]

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

let save_block ~uuid ~title =
  apply "save-block"
    [ W.Map
        [ (W.String "block/uuid", W.Uuid uuid)
        ; (W.String "block/title", W.String title)
        ]
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

let reorder_display_property ~block ~active_ident ~over_ident ~direction
    ~property_idents =
  invoke "reorder-display-property"
    [ repo ()
    ; W.Map
        [ (W.Keyword "block-id", W.Uuid block)
        ; (W.Keyword "active-ident", W.Keyword active_ident)
        ; (W.Keyword "over-ident", W.Keyword over_ident)
        ; (W.Keyword "direction", W.String direction)
        ; ( W.Keyword "property-idents"
          , W.List (List.map (fun i -> W.Keyword i) property_idents) )
        ]
    ]

let convert_page_to_tag db_id =
  invoke "convert-page-to-tag" [ repo (); W.Int db_id ]

let create_page title =
  apply "create-page" [ W.String title; W.Map [] ]
