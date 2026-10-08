(* Tabler icon children — {name: [[tag, {attr: value}], ...]}.

   The table itself is platform-provided: the web reads the
   window.__tablerChildren global (kept out of main.js by
   resources/js/icon-data.js), native loads the bundled
   tabler-children.json, and tests install a fixed table. Each adapter
   hands the shared decoders portable Json.t values. *)

type children = (string * (string * string) list) list

type source = {
  get : string -> Json.t option;
  keys : unit -> string array;
}

let installed : source option ref = ref None

let install s =
  match !installed with
  | Some _ -> invalid_arg "Icon_tabler_data source already installed"
  | None -> installed := Some s

let decode_attrs kvs : (string * string) list =
  List.filter_map
    (fun (k, v) -> Option.map (fun s -> (k, s)) (Json.as_string v))
    kvs

let decode_children (v : Json.t) : children =
  match Json.as_array v with
  | None -> []
  | Some arr ->
      Array.to_list arr
      |> List.filter_map (fun pair ->
             match Json.as_array pair with
             | Some [| tag_j; attrs_j |] -> (
                 match (Json.as_string tag_j, Json.as_object attrs_j) with
                 | Some tag, Some attrs -> Some (tag, decode_attrs attrs)
                 | _ -> None)
             | _ -> None)

(* absent icon data is a real state (the table stays outside the binary
   on both targets), so a missing source decodes to empty like the
   pre-shared window/table-absent paths did *)
let tabler_children name : children =
  match !installed with
  | None -> []
  | Some s -> (
      match s.get name with
      | None -> []
      | Some v -> decode_children v)

let tabler_names () : string list =
  match !installed with
  | None -> []
  | Some s -> Array.to_list (s.keys ())
