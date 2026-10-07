(* Decode worker wire values into model types. *)

(* ref-typed property values arrive either as scalars or as a map of the
   value entity (ref_value_summary / expanded pull stub); the label is the
   entity's title/name/ident tail (plain_value.order_list_type) *)
let prop_label (w : Wire.t) (key : string) : string option =
  let ident_tail (e : Wire.t) =
    match Wire.get e "db/ident" with
    | Some (Wire.Keyword i) | Some (Wire.String i) -> (
        match String.rindex_opt i '/' with
        | Some idx ->
            Some (String.sub i (idx + 1) (String.length i - idx - 1))
        | None -> Some i)
    | _ -> None
  in
  let label_of_entity (e : Wire.t) =
    match Wire.map_get_string e "block/title" with
    | Some t -> Some t
    | None -> (
        match Wire.map_get_string e "block/name" with
        | Some n -> Some n
        | None -> (
            match ident_tail e with
            | Some _ as s -> s
            | None -> (
                match Wire.get e "logseq.property/value" with
                | Some (Wire.String s) -> Some s
                | Some (Wire.Int n) -> Some (string_of_int n)
                | _ -> None)))
  in
  match Wire.get w key with
  | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
  | Some (Wire.Int n) -> Some (string_of_int n)
  | Some (Wire.Map _ as m) -> label_of_entity m
  | _ -> None
;;

let map_assoc s v kvs =
  let hit k =
    match k with
    | Wire.Keyword k' | Wire.String k' | Wire.Symbol k' -> k' = s
    | _ -> false
  in
  let rec go acc = function
    | [] -> List.rev ((Wire.kw s, v) :: acc)
    | (k, _) :: rest when hit k -> List.rev_append acc ((k, v) :: rest)
    | kv :: rest -> go (kv :: acc) rest
  in
  go [] kvs

(* :thread-api/get-blocks answers {block, children:<flat list>} — the
   children are not nested under block/children there. Regroup them by
   block/parent-uuid, ordered by block/order like the worker's tree pull,
   so block_of_wire sees the get-page-blocks-tree shape. *)
let nest_get_blocks (pair : Wire.t) : Wire.t option =
  match Wire.get pair "block" with
  | Some (Wire.Map _ as root) ->
      let flat =
        match Wire.get pair "children" with
        | Some (Wire.List xs) | Some (Wire.Array xs) -> xs
        | _ -> []
      in
      let by_parent = Hashtbl.create 16 in
      List.iter
        (fun c ->
          match Wire.map_get_uuid c "block/parent-uuid" with
          | Some u ->
              Hashtbl.replace by_parent u
                (c :: Option.value (Hashtbl.find_opt by_parent u)
                     ~default:[])
          | None -> ())
        flat;
      let order_of c =
        Option.value (Wire.map_get_string c "block/order") ~default:""
      in
      let rec fill w =
        match Wire.map_get_uuid w "block/uuid" with
        | Some u -> (
            (* block/children ref summaries in the flat maps are not the
               rendered children — replace unconditionally so filtered
               (property/recycled) children don't ghost through *)
            let kids =
              Option.value (Hashtbl.find_opt by_parent u) ~default:[]
              |> List.sort (fun a b -> compare (order_of a) (order_of b))
              |> List.map fill
            in
            match w with
            | Wire.Map kvs ->
                Wire.Map
                  (map_assoc "block/children" (Wire.Array kids) kvs)
            | _ -> w)
        | None -> w
      in
      Some (fill root)
  | _ -> None
;;

let order_list_type_of_wire (w : Wire.t) : string option =
  match prop_label w "logseq.property/order-list-type" with
  | Some s -> Some (String.lowercase_ascii s)
  | None -> None
;;

(* block.temp/reactions — raw {emoji-id} entity maps grouped by emoji
   for the count chips (cljs groups identically for .ls-block-reactions) *)
let reactions_of_wire (w : Wire.t) : (string * int) list =
  let xs =
    match Wire.get w "block.temp/reactions" with
    | Some (Wire.Array xs) | Some (Wire.List xs) | Some (Wire.Set xs) -> xs
    | _ -> []
  in
  List.fold_left
    (fun acc r ->
      match Wire.map_get_string r "logseq.property.reaction/emoji-id" with
      | Some id -> (
          match List.assoc_opt id acc with
          | Some n -> (id, n + 1) :: List.remove_assoc id acc
          | None -> (id, 1) :: acc)
      | None -> acc)
    [] xs
  |> List.rev

let count_refs (w : Wire.t) (k : string) : int =
  match Wire.get w k with
  | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
      List.length xs
  | _ -> 0

(* pull [*] emits ref values as bare db-id ints (or {:db/id} stubs where
   explicit ref fields were requested) *)
let ref_ids (w : Wire.t) (k : string) : int list =
  match Wire.get w k with
  | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
      List.filter_map
        (fun x ->
          match x with
          | Wire.Int n -> Some n
          | Wire.Int64 n -> Some (Int64.to_int n)
          | Wire.Map _ -> Wire.map_get_int x "db/id"
          | _ -> None)
        xs
  | _ -> []

(* cljs editor-handler/db-collapsable?: the entity's property keys minus
   internal db-attribute and created-* properties, or a query ref. On the
   wire the entity carries every logseq.property/* and user.property/*
   key it holds (text values live on child blocks, not keys), so the
   same predicate reads directly off the map keys. *)
let db_collapsable_of_wire (w : Wire.t) : bool =
  let property_key (k : string) =
    let pref p =
      String.length k >= String.length p
      && String.sub k 0 (String.length p) = p
    in
    (pref "logseq.property/" || pref "user.property/")
    && k <> "logseq.property/created-by-ref"
    && k <> "logseq.property/created-from-property"
  in
  match w with
  | Wire.Map kvs ->
      List.exists
        (fun (k, _) -> match k with Wire.String s | Wire.Keyword s | Wire.Symbol s -> property_key s | _ -> false)
        kvs
  | _ -> false

(* cljs :block/children accessor (entity-plus) excludes property-created
   and closed-value children — applies to the page's top-level list too *)
let renderable_child (c : Wire.t) : bool =
  Wire.get c "logseq.property/created-from-property" = None
  && Wire.get c "block/closed-value-property" = None

(* worker str_of_value for :block/order — the fractional keys are
   strings but the wire may carry another scalar *)
let order_str_of_wire (w : Wire.t) : string option =
  match w with
  | Wire.String s -> Some s
  | Wire.Int n -> Some (string_of_int n)
  | Wire.Int64 n -> Some (Int64.to_string n)
  | Wire.Float f -> Some (string_of_float f)
  | Wire.Uuid s -> Some s
  | Wire.Keyword s -> Some s
  | Wire.Bool b -> Some (string_of_bool b)
  | _ -> None

(* logseq.property/icon is a {type, id} map on the entity itself; block
   icons use the Model.icon record (page icons use the tuple form below) *)
let block_icon_of_wire (w : Wire.t) : Model.icon option =
  let str_or_kw = function
    | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
    | _ -> None
  in
  match Wire.get w "logseq.property/icon" with
  | Some (Wire.Map _ as m) -> (
      match str_or_kw (Wire.get m "id") with
      | Some id ->
          Some
            { Model.icon_kind =
                Option.value (str_or_kw (Wire.get m "type"))
                  ~default:"tabler-icon"
            ; icon_id = id
            }
      | None -> None)
  | _ -> None

(* ---------- pdf hl-value (logseq.property.pdf/hl-value map prop) ---------- *)

let num_of = function
  | Wire.Int n -> Some (float_of_int n)
  | Wire.Int64 n -> Some (Int64.to_float n)
  | Wire.Float f -> Some f
  | _ -> None

(* scaled rects and the vw rects derived from them share the record —
   wire keys are always {x1,y1,x2,y2,width,height}; vw rects carry
   left/top/width/height into the same slots *)
let hl_rect_of_wire (w : Wire.t) : Model.hl_rect option =
  match
    ( num_of (Option.value (Wire.get w "x1") ~default:Wire.Nil)
    , num_of (Option.value (Wire.get w "y1") ~default:Wire.Nil)
    , num_of (Option.value (Wire.get w "x2") ~default:Wire.Nil)
    , num_of (Option.value (Wire.get w "y2") ~default:Wire.Nil)
    , num_of (Option.value (Wire.get w "width") ~default:Wire.Nil)
    , num_of (Option.value (Wire.get w "height") ~default:Wire.Nil) )
  with
  | Some x1, Some y1, Some x2, Some y2, Some wd, Some ht ->
      Some
        { Model.hl_x1 = x1; hl_y1 = y1; hl_x2 = x2; hl_y2 = y2
        ; hl_w = wd; hl_h = ht }
  | _ -> None

let hl_of_wire (v : Wire.t option) : Model.hl option =
  match v with
  | Some (Wire.Map _ as m) ->
      let pos =
        match Wire.get m "position" with
        | Some p -> (
            match hl_rect_of_wire (Option.value (Wire.get p "bounding")
                                     ~default:Wire.Nil)
            with
            | Some b ->
                Some
                  ( b
                  , List.filter_map hl_rect_of_wire
                      (Wire.elems
                         (Option.value (Wire.get p "rects")
                            ~default:(Wire.Array [])))
                  , Wire.map_get_int p "page" )
            | None -> None)
        | None -> None
      in
      let content = Wire.get m "content" in
      (match pos with
       | Some (bounding, rects, pos_page) ->
           Some
             { Model.hl_id = Wire.map_get_uuid m "id"
             ; hl_page =
                 (match Wire.map_get_int m "page" with
                  | Some n -> n
                  | None -> Option.value pos_page ~default:1)
             ; hl_bounding = bounding
             ; hl_rects = rects
             ; hl_text =
                 Option.value
                   (Option.bind content (fun c ->
                        Wire.map_get_string c "text"))
                   ~default:""
             ; hl_image =
                 (match
                    Option.bind content (fun c -> Wire.get c "image")
                  with
                  | Some (Wire.Int n) -> Some (Int64.of_int n)
                  | Some (Wire.Int64 n) -> Some n
                  | Some (Wire.Float f) -> Some (Int64.of_float f)
                  | _ -> None)
             ; hl_color =
                 (match Wire.get m "properties" with
                  | Some p -> (
                      match Wire.get p "color" with
                      | Some (Wire.Keyword s) | Some (Wire.String s) ->
                          Some s
                      | _ -> None)
                  | None -> None)
             }
       | None -> None)
  | _ -> None

let rec block_of_wire ?(order_index = 1) ?(parent_query_id = None)
    (w : Wire.t) : Model.block =
  let uuid = Wire.map_get_uuid w "block/uuid" in
  let db_id = Wire.map_get_int w "db/id" in
  let title =
    match Wire.map_get_string w "block/title" with
    | Some t -> t
    | None -> Option.value (Wire.map_get_string w "block/name") ~default:""
  in
  let level =
    Option.value (Wire.map_get_int w "block/level") ~default:1
  in
  let order_list = order_list_type_of_wire w in
  (* the pull's forward ref is a {:db/id} stub — a child is this block's
     query value block when its db/id matches *)
  let query_ref_id =
    match Wire.get w "logseq.property/query" with
    | Some q -> (
        match q with
        | Wire.Tagged (_, inner) -> Wire.map_get_int inner "db/id"
        | _ -> Wire.map_get_int q "db/id")
    | None -> None
  in
  let children =
    match Wire.get w "block/children" with
    | Some (Wire.List xs) | Some (Wire.Array xs) ->
        assign_order_indices ~parent_query_id:query_ref_id []
          (List.filter renderable_child xs)
    | _ -> []
  in
  (* a pulled [:block/link ...] ref arrives as a {:db/id n} stub *)
  let link =
    match Wire.get w "block/link" with
    | Some l -> Wire.map_get_int l "db/id"
    | None -> None
  in
  let tag_entries =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) -> xs
    | _ -> []
  in
  let tag_ids =
    List.filter_map
      (fun t ->
        match t with
        | Wire.Int i -> Some i
        | Wire.Int64 i -> Some (Int64.to_int i)
        | _ -> Wire.map_get_int t "db/id")
      tag_entries
  in
  (* tag wires carry {db/id, db/ident?, block/title?, icon?} once the
     worker expands the ref; use them eagerly when present *)
  let tag_titles =
    List.filter_map
      (fun t ->
        match t with
        | Wire.Map _ -> Wire.map_get_string t "block/title"
        | Wire.Keyword s -> Some s
        | _ -> None)
      tag_entries
  in
  let tag_idents =
    List.filter_map
      (fun t ->
        match Wire.get t "db/ident" with
        | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
        | _ -> None)
      tag_entries
  in
  let num_prop k =
    match Wire.get w k with
    | Some (Wire.Int n) -> Some n
    | Some (Wire.Int64 n) -> Some (Int64.to_int n)
    | Some (Wire.Float f) -> Some (int_of_float f)
    | _ -> None
  in
  let resize_w =
    match Wire.get w "logseq.property.asset/resize-metadata" with
    | Some m -> (
        match Wire.get m "width" with
        | Some (Wire.Int n) -> Some n
        | Some (Wire.Int64 n) -> Some (Int64.to_int n)
        | Some (Wire.Float f) -> Some (int_of_float f)
        | _ -> None)
    | _ -> None
  in
  let hl = hl_of_wire (Wire.get w "logseq.property.pdf/hl-value") in
  let hl_color =
    match hl with Some h -> h.Model.hl_color | None -> None
  in
  { block_uuid = uuid
  ; block_db_id = db_id
  ; block_title = title
  ; block_level = level
  ; block_tag_ids = tag_ids
  ; block_tags = tag_titles
  ; block_display_type = prop_label w "logseq.property.node/display-type"
  ; block_order_list = order_list
  ; block_order_index =
      (match order_list with Some _ -> Some order_index | None -> None)
  ; block_order =
      Option.bind (Wire.get w "block/order") order_str_of_wire
  ; block_code_lang = prop_label w "logseq.property.code/lang"
  ; block_tag_uuids =
      List.map
        (fun t ->
          match t with
          | Wire.Map _ ->
              Option.value (Wire.map_get_uuid t "block/uuid") ~default:""
          | _ -> "")
        tag_entries
  ; block_tag_db_ids = tag_ids
  ; block_page_name =
      (match Wire.get w "block/page" with
       | Some (Wire.Map _ as p) -> (
           match Wire.map_get_string p "block/title" with
           | Some t -> Some t
           | None -> Wire.map_get_string w "block/page-name")
       | _ -> Wire.map_get_string w "block/page-name")
  ; block_page_uuid =
      (match Wire.get w "block/page" with
       | Some (Wire.Map _ as p) -> Wire.map_get_uuid p "block/uuid"
       | _ -> Wire.map_get_uuid w "block/page-uuid")
  ; block_tag_idents = tag_idents
  ; block_icon = block_icon_of_wire w
  ; block_tag_icons = List.filter_map block_icon_of_wire tag_entries
  ; block_reactions = reactions_of_wire w
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = count_refs w "logseq.property.comments/blocks"
  ; block_comment_target_ids =
      ref_ids w "logseq.property.comments/blocks"
  ; block_children = children
  ; block_link = link
  ; block_embed_children = []
  ; block_is_page =
      Option.is_some (Wire.map_get_string w "block/name")
  ; block_heading =
      (* cljs block-heading-level: :block/heading-level first, else the
         logseq.property/heading value (int 1-6, or true = level+1) *)
      (match Wire.map_get_int w "block/heading-level" with
       | Some n -> Some n
       | None -> (
           match Wire.get w "logseq.property/heading" with
           | Some (Wire.Int n) when n >= 1 && n <= 6 -> Some n
           | Some (Wire.Bool true) -> Some (min (level + 1) 6)
           | _ -> None))
  ; block_default_collapsed = false
  ; block_asset_type = Wire.map_get_string w "logseq.property.asset/type"
  ; block_asset_url =
      Wire.map_get_string w "logseq.property.asset/external-url"
  ; block_asset_width = num_prop "logseq.property.asset/width"
  ; block_asset_height = num_prop "logseq.property.asset/height"
  ; block_asset_resize = resize_w
  ; block_asset_align =
      (match Wire.get w "logseq.property.asset/align" with
       | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
       | _ -> None)
  ; block_is_query =
      (match parent_query_id, db_id with
       | Some p, Some id -> p = id
       | _ -> false)
  ; block_db_collapsable = db_collapsable_of_wire w
  ; block_ls_type = prop_label w "logseq.property/ls-type"
  ; block_hl_type = prop_label w "logseq.property.pdf/hl-type"
  ; block_hl_page = num_prop "logseq.property.pdf/hl-page"
  ; block_hl_color = hl_color
  ; block_hl = hl
  ; block_asset_ref =
      (match Wire.get w "logseq.property/asset" with
       | Some m -> Wire.map_get_int m "db/id"
       | None -> None)
  ; block_hl_image =
      (match Wire.get w "logseq.property.pdf/hl-image" with
       | Some m -> Wire.map_get_int m "db/id"
       | None -> None)
  }

(* number = 1 + the run of consecutive same-type ordered-list siblings
   immediately to the left (plain_value.ml order_list_index) *)
and assign_order_indices ?(parent_query_id = None) acc ws =
  match ws with
  | [] -> List.rev acc
  | w :: rest ->
      let order_list = order_list_type_of_wire w in
      let order_index =
        match acc with
        | prev :: _ -> (
            match (prev.Model.block_order_list, order_list) with
            | Some pt, Some t when pt = t ->
                Option.value prev.block_order_index ~default:0 + 1
            | _ -> 1)
        | [] -> 1
      in
      assign_order_indices ~parent_query_id
        (block_of_wire ~order_index ~parent_query_id w :: acc)
        rest

let blocks_of_wire (w : Wire.t) : Model.block list =
  match w with
  | Wire.Array xs | Wire.List xs ->
      assign_order_indices [] (List.filter renderable_child xs)
  | _ -> []

(* cljs block-default-collapsed?: page-typed children render collapsed on
   non-Library pages. *)
let rec mark_default_collapsed (b : Model.block) : Model.block =
  { b with
    block_children = List.map mark_default_collapsed b.block_children
  ; block_default_collapsed = b.block_is_page
  }

(* Library page outlines nested pages only (cljs with-library-child-uuids
   keeps entity/page? children): drop non-page subtrees. *)
let rec pages_only (bs : Model.block list) : Model.block list =
  List.filter_map
    (fun (b : Model.block) ->
      if b.block_is_page then
        Some { b with block_children = pages_only b.block_children }
      else None)
    bs

(* view-specific shaping of a fetched block tree *)
let view_blocks ~(library : bool) (bs : Model.block list) :
    Model.block list =
  if library then pages_only bs else List.map mark_default_collapsed bs

(* page is a tag/class when route-info says tag? or its entity tags
   contain logseq.class/Tag *)
let is_tag_page (w : Wire.t) : bool =
  match Option.bind (Wire.get w "tag?") Wire.as_bool with
  | Some b -> b
  | None -> (
      match Wire.get w "tags" with
      | Some (Wire.Array xs) | Some (Wire.List xs) ->
          List.exists
            (fun t ->
              Wire.map_get_string t "ident" = Some "logseq.class/Tag")
            xs
      | _ -> false)

(* entity internal-page? = :block/tags contains the given class ident
   (route-info maps carry "tags" [{ident}] stubs) *)
let has_ident_page (w : Wire.t) (ident : string) : bool =
  match Wire.get w "tags" with
  | Some (Wire.Array xs) | Some (Wire.List xs) ->
      List.exists
        (fun t -> Wire.map_get_string t "ident" = Some ident)
        xs
  | _ -> false
(* page is a property entity when route-info says property? or its
   entity tags contain logseq.class/Property *)
let is_property_page (w : Wire.t) : bool =
  match Option.bind (Wire.get w "property?") Wire.as_bool with
  | Some b -> b
  | None -> (
      match Wire.get w "tags" with
      | Some (Wire.Array xs) | Some (Wire.List xs) ->
          List.exists
            (fun t ->
              Wire.map_get_string t "ident" = Some "logseq.class/Property")
            xs
      | _ -> false)

(* tag titles for data-page-tags — wire ships [{ident, title}] *)
let page_tag_titles (w : Wire.t) : string list =
  match Wire.get w "tags" with
  | Some (Wire.Array xs) | Some (Wire.List xs) ->
      List.filter_map
        (fun t -> Wire.map_get_string t "title")
        xs
  | _ -> []

(* idents aligned with page_tag_titles *)
let page_tag_idents (w : Wire.t) : string list =
  match Wire.get w "tags" with
  | Some (Wire.Array xs) | Some (Wire.List xs) ->
      List.map
        (fun t ->
          match Wire.map_get_string t "ident" with
          | Some s -> s
          | None -> "")
        xs
  | _ -> []

(* logseq.property/icon is a map {type: :emoji|:tabler-icon, id: str} *)
let icon_of_wire (w : Wire.t) : (string * string) option =
  let ty =
    match Wire.get w "type" with
    | Some (Wire.Keyword s) -> Some s
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  match ty, Wire.map_get_string w "id" with
  | Some t, Some i -> Some (t, i)
  | _ -> None

(* accepts entity maps (block/title) and get-page-route-info maps
   (page-title/page-uuid/page-id) *)
let page_of_summary (w : Wire.t) : Model.page option =
  let str ks =
    List.fold_left
      (fun acc k -> match acc with Some _ -> acc | None ->
         Wire.map_get_string w k)
      None ks
  in
  match w with
  | Wire.Map _ ->
      let title =
        Option.value
          (str [ "block/title"; "page-title"; "block/raw-title" ])
          ~default:""
      in
      let page_uuid =
        match Wire.map_get_uuid w "block/uuid" with
        | Some u -> Some u
        | None -> Wire.map_get_uuid w "page-uuid"
      in
      let page_db_id =
        match Wire.map_get_int w "db/id" with
        | Some i -> Some i
        | None -> Wire.map_get_int w "page-id"
      in
      (* a map with no identity fields isn't a page — fabricating an
         empty record would render an anonymous row instead of dropping
         the malformed entry *)
      if title = "" && page_uuid = None && page_db_id = None then None
      else
        Some
          { Model.page_title = title
        ; page_uuid
        ; page_db_id
        ; page_is_tag = is_tag_page w
        ; page_is_property = is_property_page w
        ; page_icon =
            (match Wire.get w "icon" with
             | Some v -> icon_of_wire v
             | None ->
                 Option.bind
                   (Wire.get w "logseq.property/icon") icon_of_wire)
        ; page_journal_day =
            (match Wire.map_get_int w "journal-day" with
             | Some d -> Some d
             | None -> Wire.map_get_int w "block/journal-day")
        ; page_is_library =
            (* cljs entity-util/library? = :logseq.property/built-in?
               && title = "Library". get-case-page exposes the raw attr
               key; get-page-route-info returns the computed "built-in?". *)
            (match
               ( Wire.get w "logseq.property/built-in?"
               , Wire.get w "built-in?" )
             with
             | Some (Wire.Bool true), _ | _, Some (Wire.Bool true) ->
                 title = "Library"
             | _ -> false)
        ; page_internal =
            (* route-info carries "internal?" (cljs entity-util/internal-page?);
               entity maps expose their tag idents instead *)
            (match Option.bind (Wire.get w "internal?") Wire.as_bool with
             | Some b -> b
             | None -> has_ident_page w "logseq.class/Page")
        ; page_built_in =
            (match
               ( Wire.get w "logseq.property/built-in?"
               , Wire.get w "built-in?" )
             with
             | Some (Wire.Bool true), _ | _, Some (Wire.Bool true) -> true
             | _ -> false)
        ; page_add_object =
            (match Wire.get w "add-object?" with
             | Some (Wire.Bool b) -> b
             | _ -> false)
        ; page_tags = page_tag_titles w
        ; page_tag_idents = page_tag_idents w
        ; page_tag_uuids = []
        ; page_tag_db_ids = []
        ; page_blocks = []
        ; page_linked_refs = []
        ; page_parents = []
        ; page_db_collapsable = db_collapsable_of_wire w
        }
  | _ -> None

let repos_of_list_db (w : Wire.t) : string list =
  match w with
  | Wire.Array xs | Wire.List xs ->
      List.filter_map
        (fun item ->
          match Wire.map_get_string item "name" with
          | Some name when String.lowercase_ascii name <> "upload-temp" ->
              Some name
          | _ -> None)
        xs
  | _ -> []

(* worker :notification broadcast payload:
   [message type clear? uid timeout {:i18n-key :i18n-args}] *)
let toast_of_wire (w : Wire.t) : Model.toast option =
  let text_of = function
    | Wire.String s -> Some s
    | Wire.Keyword s -> Some s
    | _ -> None
  in
  match w with
  | Wire.Array (m :: ty :: _) | Wire.List (m :: ty :: _) -> (
      match text_of m with
      | Some text ->
          Some
            { Model.toast_id = 0
            ; toast_text = text
            ; toast_kind = Option.value (text_of ty) ~default:"info"
            ; toast_key = None
            }
      | None -> None)
  | _ -> None

(* rtc-sync-state broadcast (deps/db-worker sync_presence.ml rtc_state_payload):
   rtc-state {ws-state} / rtc-lock / tx counters / pending op counts *)
let rtc_of_wire (w : Wire.t) : Model.rtc =
  let ws_state =
    match Wire.get w "rtc-state" with
    | Some m -> (
        match Wire.get m "ws-state" with
        | Some (Wire.Keyword s) | Some (Wire.String s) -> s
        | _ -> "")
    | _ -> ""
  in
  let int k = Option.value (Wire.map_get_int w k) ~default:0 in
  let online_users =
    match Wire.get w "online-users" with
    | Some (Wire.Array us) | Some (Wire.List us) ->
        List.filter_map
          (fun u ->
            match Wire.get u "user/uuid" with
            | Some (Wire.String uuid) ->
                let name =
                  match Wire.get u "user/name" with
                  | Some (Wire.String n) -> n
                  | _ -> uuid
                in
                Some
                  { Model.ru_uuid = uuid; ru_name = name
                  ; ru_email =
                      (match Wire.get u "user/email" with
                       | Some (Wire.String e) -> Some e
                       | _ -> None)
                  }
            | _ -> None)
          us
    | _ -> []
  in
  { Model.rtc_lock =
      Option.value (Option.bind (Wire.get w "rtc-lock") Wire.as_bool)
        ~default:false
  ; rtc_ws_state = ws_state
  ; rtc_local_tx = Wire.map_get_int w "local-tx"
  ; rtc_remote_tx = Wire.map_get_int w "remote-tx"
  ; rtc_pending_local = int "unpushed-block-update-count"
  ; rtc_pending_asset = int "pending-asset-ops-count"
  ; rtc_pending_server = int "pending-server-ops-count"
  ; rtc_online_users = online_users
  ; rtc_missing_files =
      (match Wire.get w "missing-asset-upload-files" with
       | Some (Wire.Array xs) | Some (Wire.List xs) ->
           List.filter_map
             (fun f ->
               match Wire.get f "file" with
               | Some (Wire.String s) -> Some s
               | _ -> None)
             xs
       | _ -> [])
  }
