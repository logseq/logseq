(* Tabler icon children — provided by resources/js/icon-data.js as
   globalThis.__tablerChildren = {name: [[tag, {attr: value}], ...]},
   regenerated from the installed @tabler/icons tabler-nodes JSON by
   deps/ui/scripts/gen-icon-data.mjs. Keeping the table in a separate
   static script shrinks main.js by ~4MB and lets it cache independently. *)
external children_table_u : Js.Json.t Js.Dict.t Js.Undefined.t
  = "__tablerChildren"
  [@@mel.scope "window"]

let decode_attrs obj : (string * string) list =
  Array.to_list (Js.Dict.entries obj)
  |> List.filter_map (fun (k, v) ->
         Option.map (fun s -> (k, s)) (Js.Json.decodeString v))

let decode_children (v : Js.Json.t) : (string * (string * string) list) list =
  match Js.Json.decodeArray v with
  | None -> []
  | Some arr ->
      Array.to_list arr
      |> List.filter_map (fun pair ->
             match Js.Json.decodeArray pair with
             | Some [| tag_j; attrs_j |] -> (
                 match
                   ( Js.Json.decodeString tag_j
                   , Js.Json.decodeObject attrs_j )
                 with
                 | Some tag, Some attrs -> Some (tag, decode_attrs attrs)
                 | _ -> None)
             | _ -> None)

let tabler_children name : (string * (string * string) list) list =
  match Js.Undefined.toOption children_table_u with
  | None -> []
  | Some dict -> (
      match Js.Dict.get dict name with
      | None -> []
      | Some v -> decode_children v)
