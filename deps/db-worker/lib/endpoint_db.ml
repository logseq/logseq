(* Data-facing endpoints. Faithful ports of
   frontend.worker.handler.query / handler.transaction semantics;
   args are transit values, query/pull/tx forms round-trip as EDN
   text through datascript-ocaml's own parsers. *)

open Datascript

let require_repo args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | Some Wire.Nil | None -> ""
  | _ -> "" (* cljs: conn lookup misses on any non-string arg *)

let require_conn repo =
  match Worker_state.datascript_conn repo with
  | Some conn -> conn
  | None -> invalid_arg ("no datascript conn for " ^ repo)

(* :thread-api/q [repo inputs] -> (apply d/q (first inputs) @conn (rest inputs)) *)
let q args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       (match List.nth_opt args 1 with
        | None -> invalid_arg "q requires an inputs vector"
        | Some (Wire.Array inputs) | Some (Wire.List inputs) ->
            (match inputs with
             | [] -> invalid_arg "q requires a non-empty inputs vector"
             | query_t :: rest ->
                 (try
                    let query_edn = Ds_wire.edn_text_of_arg query_t in
                 let query = Parser.parse_query_string query_edn in
                 let db = Datascript.db conn in
                 (* match Query_runtime.initial_query_context: % consumes a
                    positional arg only when the query has no :rules section *)
                 let consume_rules = query.rules = [] in
                 (* cljs (apply d/q query @conn rest): every :in decl after
                    the first binds one positional arg — the first source
                    decl binds the injected @conn, later source decls
                    consume datascript/DB wire args by name *)
                 let rec bind first decls args sources inputs =
                   match decls, args with
                   | [], rest_args ->
                       ( List.rev_append inputs
                           (List.map Ds_wire.query_arg_of_transit rest_args)
                       , List.rev sources )
                   | Input_source_decl name :: ds, _ when first ->
                       bind false ds args ((name, Db_source db) :: sources) inputs
                   | Input_source_decl name :: ds, arg :: rest ->
                       let source_db =
                         Datascript.from_serializable
                           (Ds_wire.serializable_db_of_transit arg)
                       in
                       bind false ds rest
                         ((name, Db_source source_db) :: sources)
                         inputs
                   | Input_rules_decl :: ds, arg :: rest when consume_rules ->
                       bind false ds rest sources
                         (Arg_rules
                            (Parser.parse_rules
                               (Parser.read_edn (Ds_wire.edn_text_of_arg arg)))
                          :: inputs)
                   | (Input_source_decl _ | Input_rules_decl) :: ds, _ ->
                       bind false ds args sources inputs
                   | _ :: ds, arg :: rest ->
                       bind false ds rest sources
                         (Ds_wire.query_arg_of_transit arg :: inputs)
                   | _ :: ds, [] -> bind false ds [] sources inputs
                 in
                 let inputs', sources = bind true query.inputs rest [] [] in
                 let extra_sources =
                   List.filter (fun (name, _) -> name <> "$") sources
                 in
                 let output =
                   match extra_sources with
                   | [] -> Datascript.q_return_map_string ~inputs:inputs' db query_edn
                   | _ ->
                       (* multi-source query: q_sources returns raw rows, so
                          apply the return/find-spec shaping q_return_map
                          does in the single-source path *)
                       let return, return_map, query' =
                         Datascript.parse_query_return_map_string_with_pull_context
                           ~default_pull_db:db
                           ~pull_db_for_source:(fun name ->
                                Query.source_db db sources name)
                           query_edn
                       in
                       let rows = Datascript.q_sources ~inputs:inputs' db sources query' in
                       (match return_map with
                        | Some rm ->
                            let labels =
                              match rm with
                              | Return_keys ls -> List.map (fun l -> Keyword l) ls
                              | Return_syms ls -> List.map (fun l -> Symbol l) ls
                              | Return_strs ls -> List.map (fun l -> String l) ls
                            in
                            let map_row row =
                              if List.length labels <> List.length row then
                                invalid_arg
                                  "return map labels must match find count";
                              List.combine labels row
                              |> List.sort (fun (a, _) (b, _) ->
                                     Util.compare_value a b)
                            in
                            (match return with
                             | Return_relation ->
                                 Query_relation_maps (List.map map_row rows)
                             | Return_tuple ->
                                 Query_tuple_map
                                   (Option.map map_row (List.nth_opt rows 0))
                             | Return_collection | Return_scalar ->
                                 invalid_arg
                                   "return maps require relation or tuple query returns")
                        | None -> (
                            match return with
                            | Return_relation -> Query_relation rows
                            | Return_collection ->
                                Query_collection
                                  (List.filter_map
                                     (function v :: _ -> Some v | [] -> None)
                                     rows)
                            | Return_tuple -> Query_tuple (List.nth_opt rows 0)
                            | Return_scalar ->
                                Query_scalar
                                  (Option.bind (List.nth_opt rows 0)
                                     (function
                                       | v :: _ -> Some v | [] -> None))))
                 in
                 Db_worker_effect.pure (Ds_wire.wire_of_query_output output)
                 (* datascript raises ex-info {:error :parser/query} for
                    query parse/validation errors; datascript-ocaml
                    signals them as Invalid_argument. *)
                 with Invalid_argument msg ->
                   raise
                     (Dispatcher.Exn_info
                        ( msg
                        , [ Wire.Keyword "error", Wire.Keyword "parser/query" ] ))))
        | _ -> invalid_arg "q expects an inputs vector"))

let () = Dispatcher.register "thread-api/q" q

(* :thread-api/datoms [repo & args] -> (apply d/datoms @conn args)
   cljs returns [e a v tx added] tuples. *)
let datoms args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let rest = List.tl args in
       let index =
         match List.nth_opt rest 0 with
         | Some (Wire.Keyword "eavt") | Some (Wire.Symbol "eavt") -> Eavt
         | Some (Wire.Keyword "aevt") | Some (Wire.Symbol "aevt") -> Aevt
         | Some (Wire.Keyword "avet") | Some (Wire.Symbol "avet") -> Avet
         | _ -> invalid_arg "datoms index must be :eavt/:aevt/:avet"
       in
       (* cljs d/datoms takes positional components c0..c3 in INDEX
          order: :eavt e a v tx | :aevt a e v tx | :avet a v e tx *)
       let c i = List.nth_opt rest (i + 1) in
       let c_int i = Option.bind (c i) Wire.as_int in
       let c_attr i = Option.bind (c i) Wire.as_keyword in
       let c_val i = Option.map Ds_wire.value_of_transit (c i) in
       let db = Datascript.db conn in
       let c_eid i =
         match c i with
         | None -> None
         | Some w -> (
             match Wire.as_int w with
             | Some _ as r -> r
             | None -> (
                 match Ds_wire.value_of_transit w with
                 | (Vector [ Keyword a; v ]) | (List [ Keyword a; v ]) ->
                     Datascript.entid db a v
                 | _ -> None))
       in
       let e, a, v, tx =
         match index with
         | Eavt -> (c_eid 0, c_attr 1, c_val 2, c_int 3)
         | Aevt -> (c_int 1, c_attr 0, c_val 2, c_int 3)
         | Avet -> (c_eid 2, c_attr 0, c_val 1, c_int 3)
       in
       let ds = Datascript.datoms db index ?e ?a ?v ?tx ()
       in
       let rows =
         List.of_seq ds
         |> List.map (fun (d : datom) ->
                Wire.Array
                  [
                    Wire.Int d.e; Wire.Keyword d.a; Ds_wire.transit_of_value d.v;
                    Wire.Int d.tx; Wire.Bool d.added;
                  ])
       in
       Db_worker_effect.pure (Wire.Array rows))

let () = Dispatcher.register "thread-api/datoms" datoms

(* :thread-api/pull [repo selector id] *)
let pull args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let selector_edn =
         match List.nth_opt args 1 with
         | Some t -> Ds_wire.edn_text_of_arg t
         | None -> invalid_arg "pull requires a selector"
       in
       let id_t = match List.nth_opt args 2 with Some t -> t | None -> invalid_arg "pull requires an id" in
       let pull_by eref =
         match Datascript.pull_string (Datascript.db conn) selector_edn eref with
         | Some pulled ->
             Db_worker_effect.pure
               (Common_initial_data.with_parent (Datascript.db conn)
                  (Ds_wire.transit_of_pulled pulled))
         | None -> Db_worker_effect.pure Wire.nil
       in
       (* cljs special-case: [:block/name "x"] resolves through get-page;
          (vector? id) only — any length, (second id) is the page name *)
       (match id_t with
        | Wire.Array (Wire.Keyword "block/name" :: name_v :: _) ->
            (match Ldb.get_page (Datascript.db conn) (Ds_wire.value_of_transit name_v) with
             | Some page -> pull_by (Entity_id page.id)
             | None -> Db_worker_effect.pure Wire.nil)
        | Wire.Array [ Wire.Keyword "block/name" ] -> Db_worker_effect.pure Wire.nil
        | _ -> pull_by (Ds_wire.entity_ref_of_transit id_t)))

let () = Dispatcher.register "thread-api/pull" pull

(* :thread-api/pull-many [repo selector ids] *)
let pull_many args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let selector_edn = Ds_wire.edn_text_of_arg (List.nth args 1) in
       let ids = List.map Ds_wire.entity_ref_of_transit (Wire.as_seq (List.nth args 2)) in
       let pulled = Datascript.pull_many_string (Datascript.db conn) selector_edn ids in
       Db_worker_effect.pure
         (Wire.Array
            (List.map (function Some p -> Ds_wire.transit_of_pulled p | None -> Wire.nil) pulled)))

let () = Dispatcher.register "thread-api/pull-many" pull_many

(* :thread-api/transact lives in endpoint_transaction.ml *)

(* :thread-api/entity [repo eid] -> tagged entity map *)
let entity args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn ->
       let eref = Ds_wire.entity_ref_of_transit (List.nth args 1) in
       (match Datascript.entity (Datascript.db conn) eref with
        | None -> Db_worker_effect.pure Wire.nil
        | Some e ->
            Db_worker_effect.pure
              (Wire.Tagged ("datascript/Entity", Ds_wire.entity_map_wire e))))

let () = Dispatcher.register "thread-api/entity" entity

(* :thread-api/db [repo] -> tagged datascript/DB *)
let db args =
  let repo = require_repo args in
  (match Worker_state.datascript_conn repo with
   | None -> Db_worker_effect.pure Wire.nil
   | Some conn -> Db_worker_effect.pure (Ds_wire.transit_of_serializable_db (Datascript.serializable (Datascript.db conn))))

let () = Dispatcher.register "thread-api/db" db
