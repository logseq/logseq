(* Entity icon data and precedence shared by every host and UI surface. *)
type t =
  { icon_kind : string
  ; icon_id : string
  ; icon_color : string option
  }

let tabler ?color id =
  { icon_kind = "tabler-icon"; icon_id = id; icon_color = color }

let emoji id = { icon_kind = "emoji"; icon_id = id; icon_color = None }

let name = function
  | Some (Wire.Keyword value) | Some (Wire.String value) -> Some value
  | _ -> None

let decode value =
  match name (Wire.get value "type"), name (Wire.get value "id") with
  | Some icon_kind, Some icon_id ->
      Some { icon_kind; icon_id; icon_color = Wire.map_get_string value "color" }
  | _ -> None

let own entity =
  match Wire.get entity "icon" with
  | Some value -> decode value
  | None -> Option.bind (Wire.get entity "logseq.property/icon") decode

let tags entity =
  let value = match Wire.get entity "tags" with
    | Some value -> Some value
    | None -> Wire.get entity "block/tags" in
  Option.fold ~none:[] ~some:Wire.elems value

let tag_ident tag =
  match name (Wire.get tag "ident") with
  | Some _ as value -> value
  | None -> name (Wire.get tag "db/ident")

let inherited tags =
  tags
  |> List.stable_sort (fun a b -> compare (Wire.map_get_int a "db/id") (Wire.map_get_int b "db/id"))
  |> List.filter_map own

let resolve ~own ~is_class ~is_property ~asset_type ~inherited ~fallback =
  match own with
  | Some _ -> own
  | None when is_class -> Some (tabler "hash")
  | None when is_property -> Some (tabler "letter-p")
  | None when asset_type = Some "pdf" -> Some (tabler "book")
  | None -> (match inherited with first :: _ -> Some first | [] -> fallback)

let of_entity ?(ignore_current = false) ~fallback entity =
  let tags = tags entity in
  let predicate flag ident =
    match Option.bind (Wire.get entity flag) Wire.as_bool with
    | Some value -> value
    | None -> List.exists (fun tag -> tag_ident tag = Some ident) tags in
  resolve ~own:(if ignore_current then None else own entity)
    ~is_class:(predicate "tag?" "logseq.class/Tag")
    ~is_property:(predicate "property?" "logseq.class/Property")
    ~asset_type:(Wire.map_get_string entity "logseq.property.asset/type")
    ~inherited:(inherited tags) ~fallback
