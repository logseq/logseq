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
  let tag_ids =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
        List.filter_map (fun t -> Wire.map_get_int t "db/id") xs
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
  ; block_heading =
      Option.bind (prop_label w "logseq.property/heading")
        int_of_string_opt
  ; block_display_type = prop_label w "logseq.property.node/display-type"
  ; block_order_list = order_list
  ; block_order_index =
      (match order_list with Some _ -> Some order_index | None -> None)
  ; block_code_lang = prop_label w "logseq.property.code/lang"
  ; block_tag_idents = []
  ; block_children = children
  ; block_page_name = Wire.map_get_string w "block/page-name"
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
      Some
        { Model.page_title =
            Option.value
              (str [ "block/title"; "page-title"; "block/raw-title" ])
              ~default:""
        ; page_uuid =
            (match Wire.map_get_uuid w "block/uuid" with
             | Some u -> Some u
             | None -> Wire.map_get_uuid w "page-uuid")
        ; page_db_id =
            (match Wire.map_get_int w "db/id" with
             | Some i -> Some i
             | None -> Wire.map_get_int w "page-id")
        ; page_is_tag = is_tag_page w
        ; page_journal_day =
            (match Wire.map_get_int w "journal-day" with
             | Some d -> Some d
             | None -> Wire.map_get_int w "block/journal-day")
        ; page_tags = []
        ; page_blocks = []
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
