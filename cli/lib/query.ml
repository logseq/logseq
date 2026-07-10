type input_spec = {
  name : string;
  optional : bool;
  default : Melange_edn_melange.any option;
}

type source = Built_in | Custom

type query_entry = {
  name : string;
  source : source;
  doc : string option;
  inputs : input_spec Rrbvec.t;
  query : Melange_edn_melange.any;
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
      query : Melange_edn_melange.any;
      inputs : Melange_edn_melange.any Rrbvec.t;
      name : string option;
    }
  | List

let edn_value_of_string ~label text =
  try Ok (Melange_edn_melange.of_edn_string text)
  with Melange_edn_melange.Parse_error _ ->
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

let kw value = Edn_util.keyword value
let sym value = Edn_util.symbol value
let in_sym value = Melange_edn_melange.symbol value
let vector_vec values = Edn_util.vector_vec values
let vector_t_vec values = Edn_util.vector_t_vec values
let vector_t values = vector_t_vec values
let list_vec values = Edn_util.list_vec values
let list_t_vec values = Edn_util.list_t_vec values
let list_t values = list_t_vec values
let where_v values = Cli_primitive.V (vector_t values)
let where_l values = Cli_primitive.L (list_t values)

let query_value query =
  Edn_util.any (Cli_primitive.datascript_query_to_edn query)

let input ?default name =
  { name; optional = String.length name > 0 && name.[0] = '?'; default }

let built_in_queries =
  Vec.of_array
    [|
      {
        name = "list-priority";
        source = Built_in;
        doc = Some "List closed values for the Priority property.";
        inputs = Vec.empty;
        query =
          query_value
            (Cli_primitive.make_datascript_query
               ~find:
                 (Vec.of_array
                    [|
                      vector_vec
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "pull";
                                    sym "?value";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           kw "db/id";
                                           kw "db/ident";
                                           kw "block/order";
                                         |]);
                                  |]);
                             sym "...";
                           |]);
                    |])
               ~where:
                 (Vec.of_array
                    [|
                      where_v
                        (Vec.of_array
                           [|
                             sym "?property";
                             kw "db/ident";
                             kw "logseq.property/priority";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             sym "?value";
                             kw "block/closed-value-property";
                             sym "?property";
                           |]);
                    |])
               ());
      };
      {
        name = "list-status";
        source = Built_in;
        doc = Some "List closed values for the Status property.";
        inputs = Vec.empty;
        query =
          query_value
            (Cli_primitive.make_datascript_query
               ~find:
                 (Vec.of_array
                    [|
                      vector_vec
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "pull";
                                    sym "?value";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           kw "db/id";
                                           kw "db/ident";
                                           kw "block/order";
                                         |]);
                                  |]);
                             sym "...";
                           |]);
                    |])
               ~where:
                 (Vec.of_array
                    [|
                      where_v
                        (Vec.of_array
                           [|
                             sym "?property";
                             kw "db/ident";
                             kw "logseq.property/status";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             sym "?value";
                             kw "block/closed-value-property";
                             sym "?property";
                           |]);
                    |])
               ());
      };
      {
        name = "recent-updated";
        source = Built_in;
        doc = Some "Find entities updated within recent-days.";
        inputs = Vec.of_array [| input "recent-days"; input "?now-ms" |];
        query =
          query_value
            (Cli_primitive.make_datascript_query
               ~find:
                 (Vec.of_array
                    [|
                      vector_vec
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "pull";
                                    sym "?e";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           kw "db/id";
                                           kw "block/title";
                                           kw "block/updated-at";
                                         |]);
                                  |]);
                             sym "...";
                           |]);
                    |])
               ~in_:
                 (Vec.of_array
                    [| in_sym "$"; in_sym "?recent-days"; in_sym "?now-ms" |])
               ~where:
                 (Vec.of_array
                    [|
                      where_v
                        (Vec.of_array
                           [|
                             sym "?e"; kw "block/updated-at"; sym "?updated-at";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "missing?";
                                    sym "$";
                                    sym "?e";
                                    kw "logseq.property/built-in?";
                                  |]);
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "*";
                                    sym "?recent-days";
                                    Edn_util.int 86400000;
                                  |]);
                             sym "?recent-days-ms";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "-";
                                    sym "?now-ms";
                                    sym "?recent-days-ms";
                                  |]);
                             sym "?days-ago";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym ">="; sym "?updated-at"; sym "?days-ago";
                                  |]);
                           |]);
                    |])
               ());
      };
      {
        name = "task-search";
        source = Built_in;
        doc =
          Some
            "Find tasks by status, optional title substring, optional \
             recent-days.";
        inputs =
          Vec.of_array
            [|
              input "search-status";
              input ~default:(Edn_util.string "") "?search-title";
              input ~default:(Edn_util.int 0) "?recent-days";
              input "?now-ms";
            |];
        query =
          query_value
            (Cli_primitive.make_datascript_query
               ~find:
                 (Vec.of_array
                    [|
                      vector_vec
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "pull";
                                    sym "?e";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           kw "db/id";
                                           kw "block/title";
                                           kw "block/updated-at";
                                         |]);
                                  |]);
                             sym "...";
                           |]);
                    |])
               ~in_:
                 (Vec.of_array
                    [|
                      in_sym "$";
                      in_sym "?search-status";
                      in_sym "?search-title";
                      in_sym "?recent-days";
                      in_sym "?now-ms";
                    |])
               ~where:
                 (Vec.of_array
                    [|
                      where_v
                        (Vec.of_array
                           [| sym "?e"; kw "block/title"; sym "?title" |]);
                      where_v
                        (Vec.of_array
                           [|
                             sym "?e";
                             kw "logseq.property/status";
                             sym "?status";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             sym "?status"; kw "db/ident"; sym "?status-ident";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "=";
                                    sym "?status-ident";
                                    sym "?search-status";
                                  |]);
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "clojure.string/lower-case";
                                    sym "?title";
                                  |]);
                             sym "?title-lower-case";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [| sym "str"; sym "?search-title" |]);
                             sym "?search-title-string";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "clojure.string/lower-case";
                                    sym "?search-title-string";
                                  |]);
                             sym "?search-title-lower-case";
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "clojure.string/includes?";
                                    sym "?title-lower-case";
                                    sym "?search-title-lower-case";
                                  |]);
                           |]);
                      where_v
                        (Vec.of_array
                           [|
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "get-else";
                                    sym "$";
                                    sym "?e";
                                    kw "block/updated-at";
                                    Edn_util.int 0;
                                  |]);
                             sym "?updated-at";
                           |]);
                      where_l
                        (Vec.of_array
                           [|
                             sym "or-join";
                             vector_vec
                               (Vec.of_array
                                  [|
                                    sym "?recent-days";
                                    sym "?updated-at";
                                    sym "?now-ms";
                                    sym "?days-ago";
                                  |]);
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "and";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "nil?"; sym "?recent-days";
                                                |]);
                                         |]);
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "identity"; Edn_util.int 0;
                                                |]);
                                           sym "?days-ago";
                                         |]);
                                  |]);
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "and";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "<=";
                                                  sym "?recent-days";
                                                  Edn_util.int 0;
                                                |]);
                                         |]);
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "identity"; Edn_util.int 0;
                                                |]);
                                           sym "?days-ago";
                                         |]);
                                  |]);
                             list_vec
                               (Vec.of_array
                                  [|
                                    sym "and";
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "*";
                                                  sym "?recent-days";
                                                  Edn_util.int 86400000;
                                                |]);
                                           sym "?recent-days-ms";
                                         |]);
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym "-";
                                                  sym "?now-ms";
                                                  sym "?recent-days-ms";
                                                |]);
                                           sym "?days-ago";
                                         |]);
                                    vector_vec
                                      (Vec.of_array
                                         [|
                                           list_vec
                                             (Vec.of_array
                                                [|
                                                  sym ">=";
                                                  sym "?updated-at";
                                                  sym "?days-ago";
                                                |]);
                                         |]);
                                  |]);
                           |]);
                    |])
               ());
      };
    |]
  |> Vec.sort (fun (a : query_entry) (b : query_entry) ->
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
  | _ ->
      trim_non_empty
        (Melange_edn_melange.to_edn_string value |> strip_leading_colon)

let custom_query_input value =
  match (Edn_util.as_string value, Edn_util.as_keyword value) with
  | Some value, _ | _, Some value ->
      Option.map
        (fun name -> input name)
        (trim_non_empty (strip_leading_colon value))
  | _ -> (
      match Edn_util.as_map value with
      | Some _ -> (
          match Option.bind (Edn_util.get value "name") query_name_of_value with
          | None -> None
          | Some name ->
              Some
                {
                  name;
                  optional = String.length name > 0 && name.[0] = '?';
                  default = Edn_util.get value "default";
                })
      | None -> None)

let custom_query_inputs = function
  | Some value -> (
      match Edn_util.as_seq value with
      | Some values -> Vec.filter_map custom_query_input values
      | _ -> Vec.empty)
  | _ -> Vec.empty

let custom_query_entry name source spec =
  let query, doc, inputs =
    match spec with
    | spec -> (
        match (Edn_util.as_vector spec, Edn_util.as_map spec) with
        | Some _, _ -> (Some spec, None, Vec.empty)
        | _, Some _ ->
            ( Edn_util.get spec "query",
              Edn_util.get_string spec "doc",
              custom_query_inputs (Edn_util.get spec "inputs") )
        | _ -> (None, None, Vec.empty))
  in
  match (query_name_of_value name, query) with
  | Some name, Some query -> Some { name; source; doc; inputs; query }
  | _ -> None

let custom_queries config =
  match
    Option.bind config.Cli_config.raw_file_config (fun value ->
        Edn_util.get value "custom-queries")
  with
  | Some value -> (
      match Edn_util.as_map value with
      | Some fields ->
          Vec.filter_map
            (fun (name, spec) -> custom_query_entry name Custom spec)
            fields
      | _ -> Vec.empty)
  | _ -> Vec.empty

let merge_queries entries =
  let upsert acc (entry : query_entry) =
    acc
    |> Vec.filter (fun (existing : query_entry) -> existing.name <> entry.name)
    |> fun acc -> Vec.push_back acc entry
  in
  entries
  |> Vec.fold_left upsert Vec.empty
  |> Vec.sort (fun (a : query_entry) (b : query_entry) ->
      String.compare a.name b.name)

let list_queries config : query_entry Rrbvec.t =
  merge_queries (Vec.append built_in_queries (custom_queries config))

let find_query config name =
  Vec.find_opt
    (fun (entry : query_entry) -> entry.name = name)
    (list_queries config)

let rec contains_db_id_datom_clause value =
  match (Edn_util.as_vector value, Edn_util.as_list value) with
  | Some values, _
    when Vec.length values >= 2
         && Edn_util.as_keyword (Vec.nth values 1) = Some "db/id" ->
      true
  | Some values, _ | _, Some values ->
      Vec.exists contains_db_id_datom_clause values
  | _ -> false

let validate_query query =
  match Edn_util.as_vector query with
  | Some values ->
      let rec after_where values =
        match Vec.pop_front values with
        | None -> Vec.empty
        | Some (keyword, clauses)
          when Edn_util.as_keyword keyword = Some "where" ->
            clauses
        | Some (_, rest) -> after_where rest
      in
      if Vec.exists contains_db_id_datom_clause (after_where values) then
        Error
          (Error.make Error.Invalid_query
             "invalid query: :db/id cannot be used as a datom attribute in \
              :where clauses. Bind entity ids through :in and --inputs.")
      else Ok query
  | _ -> Error (Error.invalid_options "query must be a vector")

let current_epoch_ms () = Time.time_to_epoch_ms (Time.now ())

let normalize_task_search_inputs (entry : query_entry option) inputs =
  match entry with
  | Some { name = "task-search"; _ } -> (
      match Vec.pop_front inputs with
      | Some (status_value, rest)
        when Option.is_some (Edn_util.as_string status_value) ->
          let status =
            Option.value (Edn_util.as_string status_value) ~default:""
          in
          let status = String.trim status |> String.lowercase_ascii in
          if status = "" then inputs
          else
            Vec.push_front rest
              (Edn_util.keyword ("logseq.property/status." ^ status))
      | _ -> inputs)
  | _ -> inputs

let validate_recent_updated_inputs (entry : query_entry option) inputs =
  match (entry, Vec.peek_front_opt inputs) with
  | ( Some { name = "recent-updated"; source = Built_in; _ },
      Some recent_days_value )
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
        Vec.length (Vec.filter (fun spec -> not spec.optional) entry.inputs)
      in
      if Vec.length inputs < required then
        Error (Error.invalid_options "inputs missing required values")
      else
        let rec fill acc specs values =
          match Vec.pop_front specs with
          | Some (_spec, rest_specs) when not (Vec.is_empty values) ->
              let value, rest_values =
                match Vec.pop_front values with
                | Some pair -> pair
                | None -> failwith "non-empty vector must have a front value"
              in
              fill (Vec.push_back acc value) rest_specs rest_values
          | None -> Vec.append acc values
          | Some (spec, rest) ->
              let default =
                match spec.default with
                | Some value when Edn_util.as_keyword value = Some "now-ms" ->
                    Edn_util.int64 (current_epoch_ms ())
                | Some value -> value
                | None when spec.name = "?now-ms" ->
                    Edn_util.int64 (current_epoch_ms ())
                | None -> Edn_util.nil
              in
              fill (Vec.push_back acc default) rest Vec.empty
        in
        fill Vec.empty entry.inputs inputs
        |> normalize_task_search_inputs (Some entry)
        |> validate_recent_updated_inputs (Some entry)

let command_id = function
  | Parsed_run _ -> Command_id.Query
  | Parsed_list -> Query_list

let validate_parsed _ = Ok ()

let symbol_is name = function
  | Melange_edn_melange.Any (Melange_edn_melange.Symbol value) -> value = name
  | _ -> false

let query_in_ends_with_percent query =
  match Edn_util.as_vector query with
  | Some values -> (
      let rec find_in values =
        match Vec.pop_front values with
        | None -> Vec.empty
        | Some (keyword, rest) when Edn_util.as_keyword keyword = Some "in" ->
            collect_in Vec.empty rest
        | Some (_, rest) -> find_in rest
      and collect_in acc values =
        match Vec.pop_front values with
        | None -> acc
        | Some (keyword, _) when Option.is_some (Edn_util.as_keyword keyword) ->
            acc
        | Some (value, rest) -> collect_in (Vec.push_back acc value) rest
      in
      match find_in values with
      | values when not (Vec.is_empty values) ->
          symbol_is "%" (Vec.nth values (Vec.length values - 1))
      | _ -> false)
  | _ -> false

let query_args query inputs =
  let args = Vec.push_front inputs query in
  if query_in_ends_with_percent query then Vec.push_back args db_query_dsl_rules
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
            Error (Error.make Error.Missing_query "query is required")
          else
            let query_result, entry =
              match (query_text, query_name) with
              | Some text, _ -> (edn_value_of_string ~label:"query" text, None)
              | None, Some name -> (
                  match find_query config name with
                  | Some entry -> (Ok entry.query, Some entry)
                  | None ->
                      ( Error
                          (Error.make Error.Unknown_query
                             ("unknown query: " ^ name)),
                        None ))
              | _ ->
                  ( Error (Error.make Error.Missing_query "query is required"),
                    None )
            in
            Error.bind query_result (fun query ->
                Error.bind (validate_query query) (fun query ->
                    let inputs_result =
                      match
                        Option.bind opts.inputs_edn Cli_primitive.non_empty
                      with
                      | None -> Ok Vec.empty
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
    Vec.of_array
      [|
        (Edn_util.keyword "name", Edn_util.string input.name);
        (Edn_util.keyword "optional", Edn_util.bool input.optional);
      |]
    |> fun fields ->
    match input.default with
    | Some value -> Vec.push_back fields (Edn_util.keyword "default", value)
    | None -> fields
  in
  Edn_util.map_vec fields

let hide_internal_inputs (entry : query_entry) : query_entry =
  {
    entry with
    inputs =
      Vec.filter
        (fun (input : input_spec) -> input.name <> "?now-ms")
        entry.inputs;
  }

let query_entry_value (entry : query_entry) =
  let entry = hide_internal_inputs entry in
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "name", Edn_util.string entry.name);
         (Edn_util.keyword "source", source_value entry.source);
         ( Edn_util.keyword "doc",
           match entry.doc with
           | Some doc -> Edn_util.string doc
           | None -> Edn_util.nil );
         ( Edn_util.keyword "inputs",
           Edn_util.vector_vec (entry.inputs |> Vec.map input_value) );
         (Edn_util.keyword "query", entry.query);
       |])

let execute_with_mode action config mode =
  let open Cli_effect in
  match action with
  | List ->
      pure
        (Cli_result.ok ~command:Command_id.Query_list mode
           (Raw
              (Edn_util.map_vec
                 (Vec.of_array
                    [|
                      ( Edn_util.keyword "queries",
                        Edn_util.vector_vec
                          (list_queries config |> Vec.map query_entry_value) );
                    |]))))
  | Run { repo; query; inputs; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Query mode err)
        | Ok invoke_config ->
            bind
              (Transport.thread_api_q invoke_config ~repo
                 ~query:(Edn_util.vector_t_vec (query_args query inputs)))
              (fun value ->
                pure
                  (Cli_result.ok ~command:Command_id.Query mode
                     (Query_result
                        (Edn_util.map_vec
                           (Vec.of_array
                              [| (Edn_util.keyword "result", value) |]))))))

let meta ?(examples = Vec.empty) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = Vec.empty;
    category = Command_registry.Graph_inspect_and_edit;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = Vec.empty;
  }

let metadata () =
  Vec.of_array
    [|
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq query --graph my-graph --name recent-updated --inputs \
                '[30]'";
               "logseq query --graph my-graph --name task-search --inputs \
                '[:logseq.property/status.done \"daily\"]'";
               "logseq query --graph my-graph --query '[:find [?e ...] :where \
                [?e :block/name]]'";
             |])
        Command_id.Query "Run a Datascript query";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq query list --graph my-graph";
               "logseq query list --graph my-graph --output edn";
             |])
        Query_list "List available queries";
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
