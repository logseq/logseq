(* Graph configuration is persisted only under the repo's logseq/config.edn. *)

open Promise_ext
open Sdk_util

let config_path = "logseq/config.edn"
let global_config_path = "config/config.edn"

let published_config : Wire.t option ref = ref None
let global_config = ref (Wire.Map [])
let db_default_config = Edn.parse
  {|{:feature/enable-search-remove-accents? true
     :ui/auto-expand-block-refs? true
     :default-queries
     {:journals
      [{:title-key :journal.default-query/doing
        :title-icon "InProgress50"
        :query [:find (pull ?b [*])
                :in $ ?start ?today
                :where
                (task ?b #{"Doing"})
                [?b :block/page ?p]
                [?p :block/journal-day ?d]
                [(>= ?d ?start)]
                [(<= ?d ?today)]]
        :inputs [:14d :today]
        :collapsed? true}
       {:title-key :journal.default-query/todo
        :title-icon "Todo"
        :query [:find (pull ?b [*])
                :in $ ?start ?next
                :where
                (task ?b #{"Todo"})
                [?b :block/page ?p]
                [?p :block/journal-day ?d]
                [(> ?d ?start)]
                [(< ?d ?next)]]
        :inputs [:today :7d-after]
        :group-by-page? false
        :collapsed? true}]}
     :ui/hide-empty-properties? false
     :ui/mask-email? true}|}

let merge_configs current next =
  match current, next with
  | Wire.Map current, Wire.Map next ->
      let kept =
        List.filter (fun (key, _) -> not (List.mem_assoc key next)) current in
      let updated =
        List.map (fun (key, value) ->
          let value = match List.assoc_opt key current, value with
            | Some (Wire.Map previous), Wire.Map newer ->
                let kept =
                  List.filter (fun (key, _) -> not (List.mem_assoc key newer))
                    previous in
                Wire.Map (kept @ newer)
            | _ -> value in
          key, value) next in
      Wire.Map (kept @ updated)
  | Wire.Map _, _ -> current
  | _, Wire.Map _ -> next
  | _ -> Wire.Map []

let effective_config graph =
  merge_configs (merge_configs db_default_config !global_config) graph

let start_of_week config =
  match config with
  | Wire.Map _ ->
      (match Wire.get config "start-of-week" with
       | None -> 6
       | Some (Wire.Int day) when day>=0 && day<=6 -> day
       | Some _ -> invalid_arg "Graph start-of-week must be an integer between zero and six")
  | _ -> invalid_arg "Graph configuration must be an EDN map"

let validate_config config = ignore (start_of_week config);config

(* Graph preferences number Monday as zero; host calendar weekdays start at Sunday. *)
let calendar_week_starts_on () =
  (start_of_week (Runtime.model ()).Model.graph_config + 1) mod 7

let report_config_error ?(path = config_path) = function
  | Edn.Parse_error _ -> Toast.error (I18n.t1 "file.config/read-failed-title" path)
  | Sys_error _ -> Toast.error (I18n.t1 "file.config/read-failed-title" path)
  | Invalid_argument _ -> Toast.error (I18n.t1 "file.config/invalid-title" path)
  | error -> raise error

let parse_config content = validate_config (Edn.parse content)

let note_file_saved repo path content =
  if path=config_path then
    match parse_config content with
    | config ->
        Runtime.send
          (Action.Graph_config_loaded (repo, effective_config config))
    | exception (Edn.Parse_error _ | Invalid_argument _ as error) -> report_config_error error

let read_repo_config repo =
  let* content = Runtime.invoke2 "thread-api/get-file-content" (Wire.String repo)
    (Wire.String config_path) in
  let config = match content with
    | Wire.Nil -> Wire.Map []
    | Wire.String text when String.trim text="" -> Wire.Map []
    | Wire.String text ->
        (match parse_config text with
         | config -> config
         | exception (Edn.Parse_error _ | Invalid_argument _ as error) ->
             report_config_error error;raise error)
    | _ -> invalid_arg "Graph configuration file must be text" in
  Js.Promise.resolve config

let read_config repo =
  match !published_config with
  | Some config ->
      Js.Promise.resolve (validate_config (merge_configs db_default_config config))
  | None ->
      let contents =
        try Platform.global_config_contents () with Sys_error _ as error ->
          report_config_error ~path:global_config_path error;
          raise error in
      let* content = contents in
      let global = match content with
        | None | Some "" -> Wire.Map []
        | Some text ->
            (match Edn.parse text with
             | config -> config
             | exception (Edn.Parse_error _ | Invalid_argument _ as error) ->
                 report_config_error ~path:global_config_path error;
                 raise error) in
      let* graph = read_repo_config repo in
      let effective = merge_configs (merge_configs db_default_config global) graph in
      (match validate_config effective with
       | config ->
           global_config := global;
           Js.Promise.resolve config
       | exception (Invalid_argument _ as error) ->
           report_config_error ~path:global_config_path error;
           raise error)

let config_mutations : (string, bool Js.Promise.t) Hashtbl.t = Hashtbl.create 4

let serialize_config_mutation repo operation =
  if Option.is_some !published_config then
    Js.Promise.reject (Invalid_argument "Published graph configuration is read-only")
  else
    let previous = Hashtbl.find_opt config_mutations repo in
    let release = ref (fun () -> ()) in
    let tail = Js.Promise.make (fun ~resolve ~reject:_ ->
      release := (fun () -> resolve true [@u])) in
    (* Install the tail before starting: native promise callbacks can run inline. *)
    Hashtbl.replace config_mutations repo tail;
    let finished () =
      (match Hashtbl.find_opt config_mutations repo with
       | Some current when current == tail -> Hashtbl.remove config_mutations repo
       | _ -> ());
      !release ()
    in
    let result = match previous with
      | Some pending -> let* _ = pending in operation ()
      | None -> (try operation () with error -> Js.Promise.reject error)
    in
    ignore
      ((let* () = result in finished ();Js.Promise.resolve ())
       |> Js.Promise.catch (fun _ -> finished ();Js.Promise.resolve ()));
    result

let persist_config repo (cfg : Wire.t) =
  let cfg=validate_config cfg in
  let now_ms = Int64.of_float (Js.Date.now ()) in
  let* result =
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
  if Rtc_error.is_error result then failwith "Failed to write graph configuration";
  Runtime.send
    (Action.Graph_config_loaded (repo, effective_config cfg));
  Js.Promise.resolve ()

let write_config repo cfg =
  let cfg = validate_config cfg in
  serialize_config_mutation repo (fun () -> persist_config repo cfg)

let mutate_config repo transform =
  serialize_config_mutation repo (fun () ->
    let* cfg = read_repo_config repo in
    persist_config repo (transform cfg))

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
      let* () = mutate_config repo (fun cfg ->
      let base =
        match cfg with Wire.Map kvs -> kvs
        | _ -> invalid_arg "Graph configuration must be an EDN map"
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
      Wire.Map (kept @ added)) in
      resolved_nil
  | _ -> resolved_nil
