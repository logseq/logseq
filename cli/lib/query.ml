type input_spec = {
  name : string;
  optional : bool;
  default : Edn_ocaml.any option;
}

type source = Built_in | Custom

type query_entry = {
  name : string;
  source : source;
  doc : string option;
  inputs : input_spec list;
  query : Edn_ocaml.any;
}

type opts = {
  query_edn : string option;
  name : string option;
  inputs_edn : string option;
}

type parsed = Parsed_run of opts | Parsed_list

type action =
  | Run of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      query : Edn_ocaml.any;
      inputs : Edn_ocaml.any list;
      name : string option;
    }
  | List

let edn_value_of_string ~label text =
  try Ok (Edn_ocaml.of_edn_string text)
  with Edn_ocaml.Parse_error _ ->
    Error (Error.invalid_options ("invalid " ^ label ^ " edn"))

let normalize_query_name value =
  let value = String.trim value in
  if value = "" then None
  else if String.length value > 0 && value.[0] = ':' then
    Some (String.sub value 1 (String.length value - 1))
  else Some value

let parsed_edn text =
  match edn_value_of_string ~label:"built-in query" text with
  | Ok value -> value
  | Error err -> failwith err.message

let input ?default name =
  { name; optional = String.length name > 0 && name.[0] = '?'; default }

let built_in_queries =
  [
    {
      name = "list-priority";
      source = Built_in;
      doc = Some "List closed values for the Priority property.";
      inputs = [];
      query =
        parsed_edn
          "[:find [(pull ?value [:db/id :db/ident :block/order]) ...] :where \
           [?property :db/ident :logseq.property/priority] [?value \
           :block/closed-value-property ?property]]";
    };
    {
      name = "list-status";
      source = Built_in;
      doc = Some "List closed values for the Status property.";
      inputs = [];
      query =
        parsed_edn
          "[:find [(pull ?value [:db/id :db/ident :block/order]) ...] :where \
           [?property :db/ident :logseq.property/status] [?value \
           :block/closed-value-property ?property]]";
    };
    {
      name = "recent-updated";
      source = Built_in;
      doc = Some "Find entities updated within recent-days.";
      inputs = [ input "recent-days"; input "?now-ms" ];
      query =
        parsed_edn
          "[:find [(pull ?e [:db/id :block/title :block/updated-at]) ...] :in \
           $ ?recent-days ?now-ms :where [?e :block/updated-at ?updated-at] \
           [(missing? $ ?e :logseq.property/built-in?)] [(* ?recent-days \
           86400000) ?recent-days-ms] [(- ?now-ms ?recent-days-ms) ?days-ago] \
           [(>= ?updated-at ?days-ago)]]";
    };
    {
      name = "task-search";
      source = Built_in;
      doc =
        Some
          "Find tasks by status, optional title substring, optional \
           recent-days.";
      inputs =
        [
          input "search-status";
          input ~default:(Edn_util.string "") "?search-title";
          input ~default:(Edn_util.int 0) "?recent-days";
          input "?now-ms";
        ];
      query =
        parsed_edn
          "[:find [(pull ?e [:db/id :block/title :block/updated-at]) ...] :in \
           $ ?search-status ?search-title ?recent-days ?now-ms :where [?e \
           :block/title ?title] [?e :logseq.property/status ?status] [?status \
           :db/ident ?status-ident] [(= ?status-ident ?search-status)] \
           [(clojure.string/lower-case ?title) ?title-lower-case] [(str \
           ?search-title) ?search-title-string] [(clojure.string/lower-case \
           ?search-title-string) ?search-title-lower-case] \
           [(clojure.string/includes? ?title-lower-case \
           ?search-title-lower-case)] [(get-else $ ?e :block/updated-at 0) \
           ?updated-at] (or-join [?recent-days ?updated-at ?now-ms ?days-ago] \
           (and [(nil? ?recent-days)] [(identity 0) ?days-ago]) (and [(<= \
           ?recent-days 0)] [(identity 0) ?days-ago]) (and [(* ?recent-days \
           86400000) ?recent-days-ms] [(- ?now-ms ?recent-days-ms) ?days-ago] \
           [(>= ?updated-at ?days-ago)]))]";
    };
  ]
  |> List.sort (fun (a : query_entry) (b : query_entry) ->
      String.compare a.name b.name)

let db_query_dsl_rules =
  parsed_edn
    {|[
      [(parent ?p ?c) [?c :block/parent ?p]]
      [(parent ?p ?c) [?t :block/parent ?p] (parent ?t ?c)]
      [(class-extends ?p ?c) [?c :logseq.property.class/extends ?p]]
      [(class-extends ?p ?c) [?t :logseq.property.class/extends ?p] (class-extends ?t ?c)]
      [(alias ?e2 ?e1) [?e2 :block/alias ?e1]]
      [(alias ?e2 ?e1) [?e1 :block/alias ?e2]]
      [(self-ref ?b ?ref) [?b :block/refs ?ref]]
      [(has-ref ?b ?r) [?b :block/refs ?r]]
      [(has-ref ?b ?r) (parent ?p ?b) [?p :block/refs ?r]]
      [(page-ref ?b ?ref) (has-ref ?b ?ref)]
      [(block-content ?b ?query) [?b :block/title ?content] [(clojure.string/includes? ?content ?query)]]
      [(page ?b ?page-name) [?b :block/page ?bp] [?bp :block/name ?page-name]]
      [(between ?b ?start ?end) [?b :block/page ?p] [?p :block/tags :logseq.class/Journal] [?p :block/journal-day ?d] [(>= ?d ?start)] [(<= ?d ?end)]]
      [(ref->val ?pv ?val) [?pv :block/title ?val]]
      [(ref->val ?pv ?val) [?pv :logseq.property/value ?val]]
      [(property-missing-value ?b ?prop-e ?default-p ?default-v) [?t :logseq.property.class/properties ?prop-e] [?prop-e :db/ident ?prop] (object-has-class-property? ?b ?prop) [(get-else $ ?b ?prop "N/A") ?prop-v] [(= ?prop-v "N/A")] [?prop-e ?default-p ?default-v]]
      [(scalar-property-value ?b ?prop-e ?val) [?prop-e :db/ident ?prop] [?b ?prop ?val]]
      [(scalar-property-value-with-default ?b ?prop-e ?val) (scalar-property-value ?b ?prop-e ?val)]
      [(scalar-property-value-with-default ?b ?prop-e ?val) (property-missing-value ?b ?prop-e :logseq.property/scalar-default-value ?val)]
      [(ref-property-value ?b ?prop-e ?val) [?prop-e :db/ident ?prop] [?b ?prop ?pv] (ref->val ?pv ?val)]
      [(ref-property-value-with-default ?b ?prop-e ?val) (ref-property-value ?b ?prop-e ?val)]
      [(ref-property-value-with-default ?b ?prop-e ?val) (property-missing-value ?b ?prop-e :logseq.property/default-value ?pv) (ref->val ?pv ?val)]
      [(object-has-class-property? ?b ?prop) [?prop-e :db/ident ?prop] [?t :logseq.property.class/properties ?prop-e] [?b :block/tags ?tc] (or [(= ?t ?tc)] (class-extends ?t ?tc))]
      [(has-property-or-object-property? ?b ?prop) [?prop-e :db/ident ?prop] (or [?b ?prop _] (object-has-class-property? ?b ?prop))]
      [(has-simple-query-property ?b ?prop) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (has-property-or-object-property? ?b ?prop) (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(has-private-simple-query-property ?b ?prop) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (has-property-or-object-property? ?b ?prop)]
      [(has-property ?b ?prop) [?b ?prop _] [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(scalar-property ?b ?prop ?val) [?prop-e :db/ident ?prop] (scalar-property-value ?b ?prop-e ?val) (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(scalar-property-with-default ?b ?prop ?val) [?prop-e :db/ident ?prop] (scalar-property-value-with-default ?b ?prop-e ?val) (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(ref-property ?b ?prop ?val) [?prop-e :db/ident ?prop] (ref-property-value ?b ?prop-e ?val) (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(ref-property-with-default ?b ?prop ?val) [?prop-e :db/ident ?prop] (ref-property-value-with-default ?b ?prop-e ?val) (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true])]
      [(private-scalar-property ?b ?prop ?val) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (scalar-property-value ?b ?prop-e ?val)]
      [(private-scalar-property-with-default ?b ?prop ?val) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (scalar-property-value-with-default ?b ?prop-e ?val)]
      [(private-ref-property ?b ?prop ?val) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (ref-property-value ?b ?prop-e ?val)]
      [(private-ref-property-with-default ?b ?prop ?val) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (ref-property-value-with-default ?b ?prop-e ?val)]
      [(property ?b ?prop ?val) [?prop-e :db/ident ?prop] [?prop-e :block/tags :logseq.class/Property] (or [(missing? $ ?prop-e :logseq.property/public?)] [?prop-e :logseq.property/public? true]) [?b ?prop ?pv] (or (and [(missing? $ ?prop-e :db/valueType)] [?b ?prop ?val]) (and [?prop-e :db/valueType :db.type/ref] (or [?pv :block/title ?val] [?pv :logseq.property/value ?val])))]
      [(tag-spec->tag ?tag ?spec) [(number? ?spec)] [(identity ?spec) ?tag]]
      [(tag-spec->tag ?tag ?spec) [?tag :block/title ?spec]]
      [(tag-spec->tag ?tag ?spec) [?tag :db/ident ?spec]]
      [(tags ?b ?tags) [(identity ?tags) [?spec ...]] (tag-spec->tag ?tag ?spec) [?b :block/tags ?tc] (or [(= ?tag ?tc)] (class-extends ?tag ?tc)) [(missing? $ ?b :block/link)]]
      [(task ?b ?statuses) (ref-property-with-default ?b :logseq.property/status ?val) [(contains? ?statuses ?val)]]
      [(priority ?b ?priorities) (ref-property-with-default ?b :logseq.property/priority ?priority) [(contains? ?priorities ?priority)]]
    ]|}

let trim_non_empty value =
  let value = String.trim value in
  if value = "" then None else Some value

let strip_leading_colon value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let query_name_of_value value =
  match (Edn_util.as_string value, Edn_util.as_keyword value) with
  | Some value, _ | _, Some value -> trim_non_empty (strip_leading_colon value)
  | _ -> trim_non_empty (Edn_ocaml.to_edn_string value |> strip_leading_colon)

let custom_query_input value =
  match (Edn_util.as_string value, Edn_util.as_keyword value) with
  | Some value, _ | _, Some value ->
      Option.map
        (fun name -> input name)
        (trim_non_empty (strip_leading_colon value))
  | _ -> (
      match Edn_util.as_map value with
      | Some _ -> (
          match
            Option.bind (Edn_util.get value ":name") query_name_of_value
          with
          | None -> None
          | Some name ->
              Some
                {
                  name;
                  optional = String.length name > 0 && name.[0] = '?';
                  default = Edn_util.get value ":default";
                })
      | None -> None)

let custom_query_inputs = function
  | Some value -> (
      match Edn_util.as_seq value with
      | Some values -> List.filter_map custom_query_input values
      | _ -> [])
  | _ -> []

let custom_query_entry name source spec =
  let query, doc, inputs =
    match spec with
    | spec -> (
        match (Edn_util.as_vector spec, Edn_util.as_map spec) with
        | Some _, _ -> (Some spec, None, [])
        | _, Some _ ->
            ( Edn_util.get spec ":query",
              Edn_util.get_string spec ":doc",
              custom_query_inputs (Edn_util.get spec ":inputs") )
        | _ -> (None, None, []))
  in
  match (query_name_of_value name, query) with
  | Some name, Some query -> Some { name; source; doc; inputs; query }
  | _ -> None

let custom_queries config =
  match
    Option.bind config.Cli_config.raw_file_config (fun value ->
        Edn_util.get value ":custom-queries")
  with
  | Some value -> (
      match Edn_util.as_map value with
      | Some fields ->
          List.filter_map
            (fun (name, spec) -> custom_query_entry name Custom spec)
            fields
      | _ -> [])
  | _ -> []

let merge_queries (entries : query_entry list) =
  let rec upsert (entry : query_entry) = function
    | [] -> [ entry ]
    | (existing : query_entry) :: rest when existing.name = entry.name ->
        entry :: rest
    | existing :: rest -> existing :: upsert entry rest
  in
  entries
  |> List.fold_left (fun acc entry -> upsert entry acc) []
  |> List.sort (fun (a : query_entry) (b : query_entry) ->
      String.compare a.name b.name)

let list_queries config : query_entry list =
  merge_queries (built_in_queries @ custom_queries config)

let find_query config name =
  List.find_opt
    (fun (entry : query_entry) -> entry.name = name)
    (list_queries config)

let rec contains_db_id_datom_clause value =
  match (Edn_util.as_vector value, Edn_util.as_list value) with
  | Some (_ :: db_id :: _), _ when Edn_util.as_keyword db_id = Some ":db/id" ->
      true
  | Some values, _ | _, Some values ->
      List.exists contains_db_id_datom_clause values
  | _ -> false

let validate_query query =
  match Edn_util.as_vector query with
  | Some values ->
      let rec after_where = function
        | [] -> []
        | keyword :: clauses when Edn_util.as_keyword keyword = Some ":where" ->
            clauses
        | _ :: rest -> after_where rest
      in
      if List.exists contains_db_id_datom_clause (after_where values) then
        Error
          (Error.make
             (Edn_util.keyword_t "invalid-query")
             "invalid query: :db/id cannot be used as a datom attribute in \
              :where clauses. Bind entity ids through :in and --inputs.")
      else Ok query
  | _ -> Error (Error.invalid_options "query must be a vector")

let current_epoch_ms () = Ptime_util.time_to_epoch_ms (Ptime_util.now ())

let normalize_task_search_inputs (entry : query_entry option) inputs =
  match entry with
  | Some { name = "task-search"; _ } -> (
      match inputs with
      | status_value :: rest
        when Option.is_some (Edn_util.as_string status_value) ->
          let status =
            Option.value (Edn_util.as_string status_value) ~default:""
          in
          let status = String.trim status |> String.lowercase_ascii in
          if status = "" then inputs
          else Edn_util.keyword (":logseq.property/status." ^ status) :: rest
      | _ -> inputs)
  | _ -> inputs

let validate_recent_updated_inputs (entry : query_entry option) inputs =
  match (entry, inputs) with
  | ( Some { name = "recent-updated"; source = Built_in; _ },
      recent_days_value :: _ )
    when Option.value (Edn_util.as_int recent_days_value) ~default:0 > 0 ->
      Ok inputs
  | Some { name = "recent-updated"; source = Built_in; _ }, _ ->
      Error (Error.invalid_options "recent-days must be a positive integer")
  | _ -> Ok inputs

let normalize_inputs entry inputs =
  match entry with
  | None -> Ok inputs
  | Some entry ->
      let required =
        List.length (List.filter (fun spec -> not spec.optional) entry.inputs)
      in
      if List.length inputs < required then
        Error (Error.invalid_options "inputs missing required values")
      else
        let rec fill acc specs values =
          match (specs, values) with
          | spec :: rest_specs, value :: rest_values ->
              fill (value :: acc) rest_specs rest_values
          | [], rest_values -> List.rev_append acc rest_values
          | spec :: rest, [] ->
              let default =
                match spec.default with
                | Some value when Edn_util.as_keyword value = Some ":now-ms" ->
                    Edn_util.int64 (current_epoch_ms ())
                | Some value -> value
                | None when spec.name = "?now-ms" ->
                    Edn_util.int64 (current_epoch_ms ())
                | None -> Edn_util.nil
              in
              fill (default :: acc) rest []
        in
        fill [] entry.inputs inputs
        |> normalize_task_search_inputs (Some entry)
        |> validate_recent_updated_inputs (Some entry)

let command_id = function
  | Parsed_run _ -> Command_id.Query
  | Parsed_list -> Query_list

let validate_parsed _ = Ok ()

let symbol_is name = function
  | Edn_ocaml.Any (Edn_ocaml.String value) -> value = "~$" ^ name
  | Any (Symbol value) -> value = name
  | _ -> false

let query_in_ends_with_percent query =
  match Edn_util.as_vector query with
  | Some values -> (
      let rec find_in = function
        | [] -> []
        | keyword :: rest when Edn_util.as_keyword keyword = Some ":in" ->
            collect_in [] rest
        | _ :: rest -> find_in rest
      and collect_in acc = function
        | [] -> List.rev acc
        | keyword :: _ when Option.is_some (Edn_util.as_keyword keyword) ->
            List.rev acc
        | value :: rest -> collect_in (value :: acc) rest
      in
      match List.rev (find_in values) with
      | value :: _ -> symbol_is "%" value
      | [] -> false)
  | _ -> false

let query_args query inputs =
  let args = query :: inputs in
  if query_in_ends_with_percent query then args @ [ db_query_dsl_rules ]
  else args

let build ?registry:_ config _globals parsed =
  match parsed with
  | Parsed_list -> Ok List
  | Parsed_run opts -> (
      match config.Cli_config.repo with
      | None -> Error (Error.missing_repo "repo is required for query")
      | Some repo ->
          let query_text = Option.bind opts.query_edn Cli_primitive.non_empty in
          let query_name = Option.bind opts.name normalize_query_name in
          if Option.is_some query_text && Option.is_some query_name then
            Error
              (Error.invalid_options "use either --query or --name, not both")
          else if Option.is_none query_text && Option.is_none query_name then
            Error
              (Error.make
                 (Edn_util.keyword_t "missing-query")
                 "query is required")
          else
            let query_result, entry =
              match (query_text, query_name) with
              | Some text, _ -> (edn_value_of_string ~label:"query" text, None)
              | None, Some name -> (
                  match find_query config name with
                  | Some entry -> (Ok entry.query, Some entry)
                  | None ->
                      ( Error
                          (Error.make
                             (Edn_util.keyword_t "unknown-query")
                             ("unknown query: " ^ name)),
                        None ))
              | _ ->
                  ( Error
                      (Error.make
                         (Edn_util.keyword_t "missing-query")
                         "query is required"),
                    None )
            in
            Error.bind query_result (fun query ->
                Error.bind (validate_query query) (fun query ->
                    let inputs_result =
                      match
                        Option.bind opts.inputs_edn Cli_primitive.non_empty
                      with
                      | None -> Ok []
                      | Some text -> (
                          match edn_value_of_string ~label:"inputs" text with
                          | Ok value -> (
                              match Edn_util.as_vector value with
                              | Some inputs -> Ok inputs
                              | _ ->
                                  Error
                                    (Error.invalid_options
                                       "inputs must be a vector"))
                          | Error _ as err -> err)
                    in
                    Error.bind inputs_result (fun inputs ->
                        Error.bind (normalize_inputs entry inputs)
                          (fun inputs ->
                            Ok
                              (Run
                                 {
                                   repo;
                                   graph = Cli_config.repo_to_graph repo;
                                   query;
                                   inputs;
                                   name = query_name;
                                 }))))))

let source_value = function
  | Built_in -> Edn_util.string "built-in"
  | Custom -> Edn_util.string "custom"

let input_value (input : input_spec) =
  let fields =
    [
      (Edn_util.keyword ":name", Edn_util.string input.name);
      (Edn_util.keyword ":optional", Edn_util.bool input.optional);
    ]
    @
    match input.default with
    | Some value -> [ (Edn_util.keyword ":default", value) ]
    | None -> []
  in
  Edn_util.map fields

let hide_internal_inputs (entry : query_entry) : query_entry =
  {
    entry with
    inputs =
      List.filter
        (fun (input : input_spec) -> input.name <> "?now-ms")
        entry.inputs;
  }

let query_entry_value (entry : query_entry) =
  let entry = hide_internal_inputs entry in
  Edn_util.map
    [
      (Edn_util.keyword ":name", Edn_util.string entry.name);
      (Edn_util.keyword ":source", source_value entry.source);
      ( Edn_util.keyword ":doc",
        match entry.doc with
        | Some doc -> Edn_util.string doc
        | None -> Edn_util.nil );
      ( Edn_util.keyword ":inputs",
        Edn_util.vector (List.map input_value entry.inputs) );
      (Edn_util.keyword ":query", entry.query);
    ]

let execute action config mode =
  let open Cli_effect in
  match action with
  | List ->
      pure
        (Cli_result.ok ~command:Command_id.Query_list mode
           (Raw
              (Edn_util.map
                 [
                   ( Edn_util.keyword ":queries",
                     Edn_util.vector
                       (List.map query_entry_value (list_queries config)) );
                 ])))
  | Run { repo; query; inputs; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Query mode err)
        | Ok invoke_config ->
            bind
              (Transport.thread_api_q invoke_config ~repo
                 ~query:(Edn_util.vector_t (query_args query inputs)))
              (fun value ->
                pure
                  (Cli_result.ok ~command:Command_id.Query mode
                     (Query_result
                        (Edn_util.map [ (Edn_util.keyword ":result", value) ])))))

let meta ?(examples = []) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = [];
    category = Command_registry.Graph_inspect_and_edit;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
  }

let metadata () =
  [
    meta
      ~examples:
        [
          "logseq query --graph my-graph --name recent-updated --inputs '[30]'";
          "logseq query --graph my-graph --name task-search --inputs \
           '[:logseq.property/status.done \"daily\"]'";
          "logseq query --graph my-graph --query '[:find [?e ...] :where [?e \
           :block/name]]'";
        ]
      Command_id.Query "Run a Datascript query";
    meta
      ~examples:
        [
          "logseq query list --graph my-graph";
          "logseq query list --graph my-graph --output edn";
        ]
      Query_list "List available queries";
  ]
