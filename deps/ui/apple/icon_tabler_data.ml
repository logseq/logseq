(* Native twin of core/icon_tabler_data.ml — the children table loads
   from a bundled tabler-children.json (same payload as
   resources/js/icon-data.js minus the JS wrapper) instead of the
   window.__tablerChildren global. *)

let decode_attrs obj : (string * string) list =
  Array.to_list (Js.Dict.entries obj)
  |> List.filter_map (fun (k, v) ->
         Option.map (fun s -> (k, s)) (Js.Json.decodeString v))

let decode_children (v : Js.Json.t) :
    (string * (string * string) list) list =
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

let children_table : Js.Json.t Js.Dict.t option ref = ref None

let load_children_table () =
  match !children_table with
  | Some t -> Some t
  | None -> (
      let paths =
        (match Sys.getenv_opt "LOGSEQ_ICON_DATA" with
         | Some p -> [ p ]
         | None -> [])
        @ [ Filename.concat (Filename.dirname Sys.executable_name)
              "../Resources/tabler-children.json"
          ; Filename.concat (Sys.getenv "HOME")
              "repos/logseq-swift/apple/Resources/tabler-children.json" ]
      in
      match List.find_opt Sys.file_exists paths with
      | Some p -> (
          try
            let ic = open_in_bin p in
            let n = in_channel_length ic in
            let s = really_input_string ic n in
            close_in ic;
            match Js.Json.decodeObject (Js.Json.parseExn s) with
            | Some d ->
                children_table := Some d;
                Some d
            | None -> None
          with _ -> None)
      | None -> None)

let tabler_children name : (string * (string * string) list) list =
  match load_children_table () with
  | None -> []
  | Some dict -> (
      match Js.Dict.get dict name with
      | None -> []
      | Some v -> decode_children v)
