(* Thread-api query endpoints ported from
   src/main/frontend/worker/handler/query.cljs.

   Maintainer wiring — Worker_core.init must force-link this module:
     ignore Endpoint_query.query_dsl_query;
     ignore Endpoint_query.query_dsl_custom_query;
     ignore Endpoint_query.task_spent_time;
     ignore Endpoint_query.resolve_query_inputs;
     ignore Endpoint_query.query_custom;
*)

open Datascript

let require_repo args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | Some Wire.Nil | None -> ""
  | _ -> "" (* cljs: conn lookup misses on any non-string arg *)

let arg args i = List.nth_opt args i
let kw s = Wire.Keyword s

let fail msg data = Db_worker_effect.error (Dispatcher.Exn_info (msg, data))

(* ---------- transit <-> query forms ---------- *)

let rec form_of_wire (t : Wire.t) : query_form =
  match t with
  | Wire.Nil -> QueryFormNil
  | Wire.Bool b -> QueryFormBool b
  | Wire.Int n -> QueryFormInt n
  | Wire.Float f -> QueryFormFloat f
  | Wire.String s -> QueryFormString s
  | Wire.Binary s -> QueryFormString s
  | Wire.Keyword s -> QueryFormKeyword s
  | Wire.Symbol s -> QueryFormSymbol s
  | Wire.Big_int s ->
      (try QueryFormInt (int_of_string s)
       with _ -> QueryFormFloat (float_of_string s))
  | Wire.Big_decimal s -> QueryFormFloat (float_of_string s)
  | Wire.Int64 n -> QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms n))
  | Wire.Date_ms ms ->
      QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms ms))
  | Wire.Uuid s -> QueryFormTagged ("uuid", QueryFormString s)
  | Wire.Uri s -> QueryFormString s
  | Wire.Array xs -> QueryFormVector (List.map form_of_wire xs)
  | Wire.List xs -> QueryFormList (List.map form_of_wire xs)
  | Wire.Set xs -> QueryFormSet (List.map form_of_wire xs)
  | Wire.Map kvs ->
      QueryFormMap (List.map (fun (k, v) -> (form_of_wire k, form_of_wire v)) kvs)
  | Wire.Tagged (tag, rep) -> QueryFormTagged (tag, form_of_wire rep)

let rec value_of_form (f : query_form) : value =
  match f with
  | QueryFormNil -> Nil
  | QueryFormBool b -> Bool b
  | QueryFormInt n -> Int n
  | QueryFormFloat x -> Float x
  | QueryFormString s -> String s
  | QueryFormKeyword k -> Keyword k
  | QueryFormSymbol s -> Symbol s
  | QueryFormVector xs -> Vector (List.map value_of_form xs)
  | QueryFormList xs -> List (List.map value_of_form xs)
  | QueryFormSet xs -> Set (List.map value_of_form xs)
  | QueryFormMap kvs ->
      Map (List.map (fun (k, v) -> (value_of_form k, value_of_form v)) kvs)
  | QueryFormTagged ("uuid", QueryFormString s) -> Uuid s
  | QueryFormTagged ("regex", QueryFormString s) -> Regex s
  | QueryFormTagged ("inst", QueryFormString s) ->
      (* ISO 8601 inst literal -> epoch ms; keep the raw string on
         unparseable input rather than fabricating a time. *)
      (match Date_time_util.epoch_ms_of_iso s with
       | Some ms -> Instant ms
       | None -> String s)
  | QueryFormTagged (_, f) -> value_of_form f

let result_arg (v : value) : query_arg =
  match v with
  | Keyword s -> Arg_scalar (Result_attr s)
  | Int n -> Arg_scalar (Result_entity n)
  | v -> Arg_scalar (Result_value v)

(* ---------- handler.cljs helpers ---------- *)

(* query-input-value — stringified EDN inputs from plugin callers; keep
   the original string when the reader yields a symbol or the input is a
   \-leading character literal. *)
let query_input_value (t : Wire.t) : value =
  match t with
  | Wire.String s when not (Page_ref.is_page_ref s) ->
      (match (try Some (Parser.read_edn s) with _ -> None) with
       | Some (QueryFormSymbol _) -> String s
       | Some _ when String.length s > 0 && s.[0] = '\\' -> String s
       | Some f -> value_of_form f
       | None -> String s)
  | t -> Ds_wire.value_of_transit t

(* resolve-page-ref-equality — rewrite (= l r) with a [[page-ref]]
   literal to (contains? sym lowercased-name). *)
let resolve_page_ref_equality (form : query_form) : query_form =
  let is_page_ref_str = function
    | QueryFormString s -> Page_ref.is_page_ref s
    | _ -> false
  in
  Db_query_dsl.postwalk
    (fun f ->
      match f with
      | QueryFormList [ QueryFormSymbol "="; left; right ]
          when is_page_ref_str left || is_page_ref_str right ->
          let page_reference, sym_f =
            if is_page_ref_str left then (left, right) else (right, left)
          in
          let name =
            match page_reference with
            | QueryFormString s ->
                let lowered = Unicode.lowercase s in
                (match Page_ref.get_page_name lowered with
                 | Some n -> n
                 | None -> lowered)
            | _ -> assert false
          in
          QueryFormList
            [ QueryFormSymbol "contains?"; sym_f; QueryFormString name ]
      | f -> f)
    form

(* require-query-context! *)
let require_query_context (context : Wire.t) : (Wire.t * Wire.t) list option =
  match context with
  | Wire.Map kvs ->
      let valid_key = function
        | Wire.Keyword "current-page" | Wire.Keyword "current-page-title" -> true
        | _ -> false
      in
      let non_blank = function
        | Wire.String s -> Unicode.trim s <> ""
        | _ -> false
      in
      let current_page_ok =
        match List.assoc_opt (Wire.Keyword "current-page") kvs with
        | None -> true
        | Some (Wire.Uuid _) -> true
        | Some v -> non_blank v
      in
      let current_page_title_ok =
        match List.assoc_opt (Wire.Keyword "current-page-title") kvs with
        | None -> true
        | Some v -> non_blank v
      in
      if List.for_all (fun (k, _) -> valid_key k) kvs
         && current_page_ok && current_page_title_ok
      then Some kvs
      else None
  | _ -> None

(* query-current-page-title *)
let query_current_page_title (db : db) (ctx : (Wire.t * Wire.t) list) : string option =
  let get k = List.assoc_opt (Wire.Keyword k) ctx in
  match get "current-page-title" with
  | Some (Wire.String t) when Unicode.trim t <> "" -> Some t
  | _ ->
      let block_title =
        match get "current-block-uuid" with
        | Some v ->
            (match Ds_wire.value_of_transit v with
             | Uuid u ->
                 (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
                  | Some block ->
                      (match Entity_refs.ref_ent block "block/page" with
                       | Some page -> Ldb.string_value page "block/title"
                       | None -> None)
                  | None -> None)
             | _ -> None)
        | None -> None
      in
      (match block_title with
       | Some t -> Some t
       | None ->
           (match get "current-page" with
            | Some v ->
                (match Ldb.get_page db (Ds_wire.value_of_transit v) with
                 | Some page -> Ldb.string_value page "block/title"
                 | None -> None)
            | None -> None))

(* resolve-custom-query-input *)
let resolve_custom_query_input (db : db) (input : Wire.t)
    (ctx : (Wire.t * Wire.t) list) : value =
  let get k = List.assoc_opt (Wire.Keyword k) ctx in
  let current_block_uuid =
    match get "current-block-uuid" with
    | Some (Wire.Uuid u) -> Some u
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  let today_day = Option.bind (get "today-day") Wire.as_int in
  let require_today_day =
    match get "require-today-day?" with
    | Some (Wire.Bool b) -> b
    | _ -> false
  in
  let resolved_input = query_input_value input in
  let current_page_title = query_current_page_title db ctx in
  (match resolved_input with
   | Keyword "today" ->
       if require_today_day && Option.is_none today_day then
         raise
           (Dispatcher.Exn_info
              ("Query today input requires :today-day", []))
   | Keyword "current-page" ->
       if Option.is_none current_page_title then
         raise
           (Dispatcher.Exn_info
              ("Query current-page input requires a current page", []))
   | Keyword ("query-page" | "current-block" | "parent-block") ->
       if Option.is_none current_block_uuid then
         raise
           (Dispatcher.Exn_info
              ( "Query block input requires :current-block-uuid",
                [ (kw "input", Ds_wire.transit_of_value resolved_input) ] ))
   | _ -> ());
  match resolved_input, today_day with
  | Keyword "today", Some day -> Int day
  | _ ->
      Db_inputs.resolve_input db resolved_input
        { Db_inputs.current_block_uuid = current_block_uuid
        ; current_page_fn = (fun () -> current_page_title)
        }

(* add-query-rules — returns rewritten query forms, the rules-input
   forms to feed %, and whether rules are required *)
let add_query_rules (query : query_form list) (user_rules : query_form list)
    : query_form list * query_form list * bool =
  let sections = Db_query_dsl.query_map_sections query in
  let section k =
    Option.value
      (Option.map snd (List.find_opt (fun (k', _) -> k' = Some k) sections))
      ~default:[]
  in
  let where = section "where" and in_ = section "in" in
  let rules_found =
    Db_query_dsl.find_rules_in_where where
      (List.map fst Db_query_dsl.db_query_dsl_rules)
  in
  let built_in = Db_query_dsl.extract_rules rules_found in
  let rules_input =
    Db_query_dsl.distinct_preserve_order (user_rules @ built_in)
  in
  let has_pct = List.exists (function QueryFormSymbol "%" -> true | _ -> false) in_ in
  let rules_required = rules_input <> [] || has_pct in
  let query_with_rules =
    if rules_required && not has_pct then
      if List.exists (fun (k, _) -> k = Some "in") sections then
        Db_query_dsl.add_to_end_of_query_section query "in" [ QueryFormSymbol "%" ]
      else
        query @ [ QueryFormKeyword "in"; QueryFormSymbol "$"; QueryFormSymbol "%" ]
    else query
  in
  (query_with_rules, rules_input, rules_required)

(* execute-custom-query — db query-m context *)
let execute_custom_query (db : db) (query_m : Wire.t)
    (ctx : (Wire.t * Wire.t) list) : Wire.t Db_worker_effect.t =
  let valid =
    match query_m with
    | Wire.Map _ ->
        let query_ok =
          match Wire.get "query" query_m with
          | Some (Wire.Array (Wire.Keyword "find" :: _)) -> true
          | _ -> false
        in
        let inputs_ok =
          match Wire.get "inputs" query_m with
          | Some (Wire.Array _) | None -> true
          | _ -> false
        in
        let rules_ok =
          match Wire.get "rules" query_m with
          | Some (Wire.Array _) | None -> true
          | _ -> false
        in
        query_ok && inputs_ok && rules_ok
    | _ -> false
  in
  if not valid then
    fail "Invalid custom query" [ (kw "query", query_m) ]
  else
    let query_forms =
      match Wire.get "query" query_m with
      | Some (Wire.Array xs) -> List.map form_of_wire xs
      | _ -> []
    in
    let user_rules =
      match Wire.get "rules" query_m with
      | Some (Wire.Array xs) -> List.map form_of_wire xs
      | _ -> []
    in
    let query_with_rules, rules_input, rules_required =
      add_query_rules query_forms user_rules
    in
    let resolved_query =
      List.map resolve_page_ref_equality query_with_rules
    in
    let inputs =
      match Wire.get "inputs" query_m with
      | Some (Wire.Array xs) -> xs
      | _ -> []
    in
    let resolved_inputs =
      List.map (fun i -> result_arg (resolve_custom_query_input db i ctx)) inputs
    in
    let query_args =
      resolved_inputs
      @ (if rules_required then
           [ Db_query_dsl.parse_rules_input rules_input ]
         else [])
    in
    let query_edn = Ds_wire.edn_of_query_form (QueryFormVector resolved_query) in
    let rows = Datascript.q_string db query_edn ~inputs:query_args in
    Db_worker_effect.pure
      (Wire.Array
         (List.map
            (fun row -> Wire.Array (List.map Ds_wire.transit_of_query_result row))
            rows))

(* ---------- endpoints ---------- *)

(* :thread-api/query-dsl-query [repo query-string opts] *)
let query_dsl_query args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let query_string = Option.bind (arg args 1) Wire.as_string in
       let opts = arg args 2 in
       let exec_opts =
         { Db_query_dsl.opt_cards =
             (match Option.bind opts (Wire.get "cards?") with
              | Some (Wire.Bool b) -> b
              | _ -> false)
         ; opt_block_attrs =
             Option.map Ds_wire.edn_text_of_arg
               (Option.bind opts (Wire.get "block-attrs"))
         ; opt_current_page_title =
             Option.bind
               (Option.bind opts (Wire.get "current-page-title"))
               Wire.as_string
         ; opt_today_day =
             Option.bind (Option.bind opts (Wire.get "today-day")) Wire.as_int
         }
       in
       (match query_string with
        | Some s ->
            let rows =
              Db_query_dsl.execute_query (Datascript.db conn) s exec_opts
            in
            Db_worker_effect.pure
              (match rows with
               | Some rows ->
                   Wire.Array
                     (List.map
                        (fun row ->
                          Wire.Array (List.map Ds_wire.transit_of_query_result row))
                        rows)
               | None -> Wire.nil)
        | None -> Db_worker_effect.pure Wire.nil))

let () = Dispatcher.register "thread-api/query-dsl-query" query_dsl_query

(* :thread-api/query-dsl-custom-query [repo query-m opts] *)
let query_dsl_custom_query args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let query_edn =
         match Option.bind (arg args 1) (Wire.get "query") with
         | Some t ->
             let elems =
               match t with
               | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
               | _ -> []
             in
             if elems = [] then None else Some (Ds_wire.edn_of_transit t)
         | None -> None
       in
       let opts = arg args 2 in
       let exec_opts =
         { Db_query_dsl.opt_cards = false
         ; opt_block_attrs =
             Option.map Ds_wire.edn_text_of_arg
               (Option.bind opts (Wire.get "block-attrs"))
         ; opt_current_page_title = None
         ; opt_today_day = None
         }
       in
       (match query_edn with
        | Some edn ->
            let rows =
              Db_query_dsl.execute_custom_query (Datascript.db conn) edn exec_opts
            in
            Db_worker_effect.pure
              (match rows with
               | Some rows ->
                   Wire.Array
                     (List.map
                        (fun row ->
                          Wire.Array (List.map Ds_wire.transit_of_query_result row))
                        rows)
               | None -> Wire.nil)
        | None -> Db_worker_effect.pure Wire.nil))

let () = Dispatcher.register "thread-api/query-dsl-custom-query" query_dsl_custom_query

(* ---------- task-spent-time ---------- *)

type history_item =
  { history_id : entity_id
  ; created_at : int
  ; status_ident : string option
  ; status_uuid : value option
  ; status_title : value option
  }

(* block-status-history — rows sorted by :block/created-at *)
let block_status_history (db : db) (block_id : int) : history_item list =
  let rows =
    Datascript.q_string db
      "[:find ?history ?created-at ?status :in $ ?block-id :where \
       [?history :logseq.property.history/block ?block-id] \
       [?history :logseq.property.history/property :logseq.property/status] \
       [?history :logseq.property.history/ref-value ?status] \
       [?history :block/created-at ?created-at]]"
      (* Ref not Result_entity — the engine drops Arg_scalar Result_entity
         inputs, leaving ?block-id unbound and returning every history row *)
      ~inputs:[ Arg_scalar (Result_value (Ref block_id)) ]
  in
  rows
  |> List.filter_map (fun row ->
         match row with
         | [ history_id; created_at; status_id ] ->
             let int_of = function
               | Result_entity n | Result_value (Int n) -> Some n
               | Result_value (Ref n) -> Some n
               | _ -> None
             in
             (match (int_of history_id, int_of created_at, int_of status_id) with
              | Some hid, Some cat, Some sid ->
                  let status = entity db (Entity_id sid) in
                  Some
                    { history_id = hid
                    ; created_at = cat
                    ; status_ident =
                        Option.bind status (fun s ->
                            match Ldb.ident_of s with
                            | Some ident -> Some ident
                            | None -> None)
                    ; status_uuid =
                        Option.bind status (fun s -> Ldb.value s "block/uuid")
                    ; status_title =
                        Option.bind status (fun s -> Ldb.value s "block/title")
                    }
              | _ -> None)
         | _ -> None)
  |> List.stable_sort (fun a b -> compare a.created_at b.created_at)

(* task-spent-time — [status-history time-in-seconds] *)
let task_spent_time_impl (db : db) (block_id : int) (now_ms : float) : Wire.t =
  let doing = "logseq.property/status.doing" in
  let done_ = "logseq.property/status.done" in
  let terminal =
    [ "logseq.property/status.canceled"; "logseq.property/status.backlog";
      "logseq.property/status.done" ]
  in
  let status_history = block_status_history db block_id in
  match status_history with
  | [] -> Wire.nil
  | _ ->
      let rec loop items time =
        match items with
        | last_item :: item :: others ->
            if item.status_ident = Some doing && others = [] then
              int_of_float ((time +. (now_ms -. Float.of_int item.created_at)) /. 1000.)
            else
              let time' =
                if
                  last_item.status_ident = Some doing
                  || (match last_item.status_ident with
                      | Some s -> not (List.mem s terminal)
                      | None -> true)
                     && item.status_ident = Some done_
                then time +. Float.of_int (item.created_at - last_item.created_at)
                else time
              in
              loop (item :: others) time'
        | _ -> int_of_float (time /. 1000.)
      in
      let time = loop status_history 0. in
      let item_wire (it : history_item) =
        Wire.Map
          [ (kw "db/id", Wire.Int it.history_id)
          ; (kw "block/created-at", Wire.Int it.created_at)
          ; ( kw "logseq.property.history/property-ident",
              kw "logseq.property/status" )
          ; ( kw "logseq.property.history/ref-value-ident",
              match it.status_ident with
              | Some s -> kw s
              | None -> Wire.Nil )
          ; ( kw "logseq.property.history/ref-value-uuid",
              match it.status_uuid with
              | Some v -> Ds_wire.transit_of_value v
              | None -> Wire.Nil )
          ; ( kw "logseq.property.history/ref-value-title",
              match it.status_title with
              | Some v -> Ds_wire.transit_of_value v
              | None -> Wire.Nil )
          ]
      in
      Wire.Array
        [ Wire.Array (List.map item_wire status_history); Wire.Int time ]

(* :thread-api/task-spent-time [repo block-id] *)
let task_spent_time args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let block_id = Option.bind (arg args 1) Wire.as_int in
       Db_worker_effect.pure
         (match block_id with
          | Some id ->
              task_spent_time_impl (Datascript.db conn) id (Clock.now_ms ())
          | None -> Wire.nil))

let () = Dispatcher.register "thread-api/task-spent-time" task_spent_time

(* :thread-api/resolve-query-inputs [repo inputs {:keys [current-page current-page-title today-title]}] *)
let resolve_query_inputs args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let db = Datascript.db conn in
       let opts = arg args 2 in
       let current_page_title =
         match Option.bind opts (Wire.get "current-page-title") with
         | Some (Wire.String t) -> Some t
         | _ ->
             (match Option.bind opts (Wire.get "current-page") with
              | Some v ->
                  (match Ldb.get_page db (Ds_wire.value_of_transit v) with
                   | Some page -> Ldb.string_value page "block/title"
                   | None -> None)
              | None -> None)
       in
       let today_title =
         match Option.bind opts (Wire.get "today-title") with
         | Some (Wire.String t) -> Some t
         | _ -> None
       in
       let ctx =
         { Db_inputs.current_block_uuid = None
         ; current_page_fn =
             (fun () ->
               match current_page_title with
               | Some t -> Some t
               | None -> today_title)
         }
       in
       let inputs =
         match arg args 1 with
         | Some (Wire.Array xs | Wire.List xs) -> xs
         | _ -> []
       in
       let resolved =
         List.map
           (fun i ->
             Ds_wire.transit_of_value
               (Db_inputs.resolve_input db (query_input_value i) ctx))
           inputs
       in
       Db_worker_effect.pure (Wire.Array resolved))

let () = Dispatcher.register "thread-api/resolve-query-inputs" resolve_query_inputs

(* :thread-api/query-custom [repo query-m context] *)
let query_custom args =
  let repo = require_repo args in
  let context = Option.value (arg args 2) ~default:Wire.nil in
  match require_query_context context with
  | None -> fail "Invalid custom query context" [ (kw "context", context) ]
  | Some ctx ->
      (match Worker_state.datascript_conn repo with
       | None ->
           fail "Missing custom query database" [ (kw "repo", Wire.String repo) ]
       | Some conn ->
           let query_m = Option.value (arg args 1) ~default:Wire.nil in
           execute_custom_query (Datascript.db conn) query_m ctx)

let () = Dispatcher.register "thread-api/query-custom" query_custom
