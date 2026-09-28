(* Decode worker wire values into model types. *)

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
  ; block_tag_idents = []
  ; block_reactions = reactions_of_wire w
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = count_refs w "logseq.property.comments/blocks"
  ; block_page_name =
      Option.value (Wire.map_get_string w "block/page-name") ~default:""
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
        ; page_blocks = []
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
