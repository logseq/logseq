(* Generated from @tabler/icons-react export list (cljs get-tabler-icons
   order). Ships as assets/icon-names.json — a lazy vite chunk fetched on
   first icon-picker open via the lazy-assets shim instead of being
   compiled into main.js. *)

external raw_require : string -> Js.Json.t = "require"

external load_icon_names_chunk : Js.Json.t -> string Js.Promise.t
  = "loadIconNames"
  [@@mel.send]

let items : (string * string) array ref = ref [||]

let jstr j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> failwith "icon_picker_names: bad json"

let parse_items text =
  match Js.Json.decodeArray (Js.Json.parseExn text) with
  | None -> failwith "icon_picker_names: bad json"
  | Some arr ->
      Array.map
        (fun j ->
          match Js.Json.decodeArray j with
          | Some [| d; k |] -> (jstr d, jstr k)
          | _ -> failwith "icon_picker_names: bad pair")
        arr

let load =
  lazy
    (load_icon_names_chunk (raw_require "lui-shims/lazy-assets")
     |> Js.Promise.then_ (fun text ->
            items := parse_items text;
            Js.Promise.resolve ()))
