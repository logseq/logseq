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
  { block_uuid = uuid
  ; block_db_id = db_id
  ; block_title = title
  ; block_level = level
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
