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

let rec block_of_wire ?(order_index = 1) (w : Wire.t) : Model.block =
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
  let children =
    (* cljs :block/children accessor (entity-plus) excludes
       property-created and closed-value children *)
    let renderable c =
      Wire.get c "logseq.property/created-from-property" = None
      && Wire.get c "block/closed-value-property" = None
    in
    match Wire.get w "block/children" with
    | Some (Wire.List xs) | Some (Wire.Array xs) ->
        assign_order_indices [] (List.filter renderable xs)
    | _ -> []
  in
  (* a pulled [:block/link ...] ref arrives as a {:db/id n} stub *)
  let link =
    match Wire.get w "block/link" with
    | Some l -> Wire.map_get_int l "db/id"
    | None -> None
  in
  let tag_ids =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
        List.filter_map
          (fun t ->
            match t with
            | Wire.Int i -> Some i
            | Wire.Int64 i -> Some (Int64.to_int i)
            | _ -> Wire.map_get_int t "db/id")
          xs
    | _ -> []
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
  { block_uuid = uuid
  ; block_db_id = db_id
  ; block_title = title
  ; block_level = level
  ; block_tag_ids = tag_ids
  ; block_tags = []
  ; block_display_type = prop_label w "logseq.property.node/display-type"
  ; block_order_list = order_list
  ; block_order_index =
      (match order_list with Some _ -> Some order_index | None -> None)
  ; block_code_lang = prop_label w "logseq.property.code/lang"
  ; block_tag_uuids = []
  ; block_page_name =
      (match Wire.get w "block/page" with
       | Some (Wire.Map _ as p) -> (
           match Wire.map_get_string p "block/title" with
           | Some t -> Some t
           | None -> Wire.map_get_string w "block/page-name")
       | _ -> Wire.map_get_string w "block/page-name")
  ; block_tag_idents = []
  ; block_reactions = reactions_of_wire w
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = count_refs w "logseq.property.comments/blocks"
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
  }

(* number = 1 + the run of consecutive same-type ordered-list siblings
   immediately to the left (plain_value.ml order_list_index) *)
and assign_order_indices acc ws =
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
      assign_order_indices (block_of_wire ~order_index w :: acc) rest

let blocks_of_wire (w : Wire.t) : Model.block list =
  match w with
  | Wire.Array xs | Wire.List xs -> assign_order_indices [] xs
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
      Some
        { Model.page_title = title
        ; page_uuid =
            (match Wire.map_get_uuid w "block/uuid" with
             | Some u -> Some u
             | None -> Wire.map_get_uuid w "page-uuid")
        ; page_db_id =
            (match Wire.map_get_int w "db/id" with
             | Some i -> Some i
             | None -> Wire.map_get_int w "page-id")
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
        ; page_internal = has_ident_page w "logseq.class/Page"
        ; page_built_in =
            (match
               ( Wire.get w "logseq.property/built-in?"
               , Wire.get w "built-in?" )
             with
             | Some (Wire.Bool true), _ | _, Some (Wire.Bool true) -> true
             | _ -> false)
        ; page_tags = []
        ; page_blocks = []
        ; page_linked_refs = []
        ; page_parents = []
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
            }
      | None -> None)
  | _ -> None
