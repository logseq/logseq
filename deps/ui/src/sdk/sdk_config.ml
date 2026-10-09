(* Graph config backed by the repo's logseq/config.edn file —
   mirrors config-handler/set-config! + state/get-config. *)

open Promise_ext
open Sdk_util

let config_path = "logseq/config.edn"

let published_config : Wire.t option ref = ref None

let read_config repo =
  match !published_config with
  | Some config -> Js.Promise.resolve config
  | None ->
  let* w =
    Runtime.invoke2 "thread-api/get-file-content" (Wire.String repo)
      (Wire.String config_path)
  in
  Js.Promise.resolve
    (match w with
     | Wire.String s when String.trim s <> "" -> (
         try Edn.parse s with _ -> Wire.Map [])
     | _ -> Wire.Map [])


let write_config repo (cfg : Wire.t) =
  let now_ms = Int64.of_float (Js.Date.now ()) in
  let* _ =
    Runtime.invoke "thread-api/transact"
      [ Wire.String repo
      ; Wire.Array
          [ Wire.Map
              (* file-block schema requires :block/uuid *)
              [ (Wire.kw "block/uuid", Wire.Uuid (Ui_services.env_random_uuid ()))
              ; (Wire.kw "file/path", Wire.String config_path)
              ; (Wire.kw "file/content", Wire.String (Edn.to_string cfg))
              ; (Wire.kw "file/created-at", Wire.Date_ms now_ms)
              ; (Wire.kw "file/last-modified-at", Wire.Date_ms now_ms)
              ]
          ]
      ; Wire.Map []
      ; Wire.Nil
      ]
  in
  Js.Promise.resolve ()

(* :app.getCurrentGraphConfigs [...keys] -> value at key path.
   Variadic: each positional arg is one key, so collect all of them. *)
let get_configs a b c d =
  let keys =
    List.concat_map
      (fun arg ->
        match Sdk_convert.wire_of_json (Sdk_json.of_js arg) with
        | Wire.String s -> [ s ]
        | Wire.Array xs | Wire.List xs -> List.filter_map Wire.as_string xs
        | _ -> [])
      [ a; b; c; d ]
  in
  let* cfg = read_config (repo ()) in
  let v =
    List.fold_left
      (fun m k ->
        match Wire.get m k with
        | Some v -> v
        | None -> Wire.Nil)
      cfg keys
  in
  resolved (Sdk_json.to_js (Sdk_convert.json_of_wire v))

(* :app.setCurrentGraphConfigs {k v...} -> merge into config.edn *)
let set_configs a _b _c _d =
  let repo = repo () in
  match Sdk_convert.wire_of_json (Sdk_json.of_js a) with
  | Wire.Map entries ->
      let* cfg = read_config repo in
      let base =
        match cfg with Wire.Map kvs -> kvs | _ -> []
      in
      let keys =
        List.map
          (fun (k, _) ->
            match k with
            | Wire.String s -> Wire.Keyword s
            | other -> other)
          entries
      in
      let kept =
        List.filter (fun (ek, _) -> not (List.mem ek keys)) base
      in
      let added =
        List.map
          (fun (k, v) ->
            ( (match k with
               | Wire.String s -> Wire.Keyword s
               | other -> other)
            , keywordize_keys v ))
          entries
      in
      let* () = write_config repo (Wire.Map (kept @ added)) in
      resolved_nil
  | _ -> resolved_nil
