(* Decode worker wire values into model types. *)

let rec block_of_wire (w : Wire.t) : Model.block =
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
  let children =
    match Wire.get w "block/children" with
    | Some (Wire.List xs) | Some (Wire.Array xs) ->
        List.map block_of_wire xs
    | _ -> []
  in
  let tag_ids =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
        List.filter_map (fun t -> Wire.map_get_int t "db/id") xs
    | _ -> []
  in
  { block_uuid = uuid
  ; block_db_id = db_id
  ; block_title = title
  ; block_level = level
  ; block_tag_ids = tag_ids
  ; block_tags = []
  ; block_page_name =
      (match Wire.get w "block/page" with
       | Some (Wire.Map _ as p) -> (
           match Wire.map_get_string p "block/title" with
           | Some t -> Some t
           | None -> Wire.map_get_string w "block/page-name")
       | _ -> Wire.map_get_string w "block/page-name")
  ; block_children = children
  }

let blocks_of_wire (w : Wire.t) : Model.block list =
  match w with
  | Wire.Array xs | Wire.List xs -> List.map block_of_wire xs
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
        ; page_blocks = []
        ; page_linked_refs = []
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
