(* Data-facing endpoints. Faithful ports of
   frontend.worker.handler.query / handler.transaction semantics;
   args are transit values, query/pull/tx forms round-trip as EDN
   text through datascript-ocaml's own parsers. *)

open Datascript

let require_repo args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | _ -> invalid_arg "first arg must be repo name"

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
        | None -> Db_worker_effect.pure Wire.nil
        | Some (Wire.Array inputs) | Some (Wire.List inputs) ->
            (match inputs with
             | [] -> Db_worker_effect.pure Wire.nil
             | query_t :: rest ->
                 let query_edn = Ds_wire.edn_text_of_arg query_t in
                 let inputs' = List.map Ds_wire.query_arg_of_transit rest in
                 let rows = Datascript.q_string ~inputs:inputs' (Datascript.db conn) query_edn in
                 Db_worker_effect.pure
                   (Wire.Array (List.map (fun row -> Wire.Array (List.map Ds_wire.transit_of_query_result row)) rows)))
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
       let opt_int i = Option.bind (List.nth_opt rest i) Wire.as_int in
       let opt_attr i = Option.bind (List.nth_opt rest i) Wire.as_keyword in
       let opt_value i = Option.map Ds_wire.value_of_transit (List.nth_opt rest i) in
       let ds =
         Datascript.datoms (Datascript.db conn) index
           ?e:(opt_int 1) ?a:(opt_attr 2) ?v:(opt_value 3) ?tx:(opt_int 4) ()
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
       (* cljs special-case: [:block/name "x"] resolves through get-page *)
       let eref = Ds_wire.entity_ref_of_transit id_t in
       (match Datascript.pull_string (Datascript.db conn) selector_edn eref with
        | Some pulled -> Db_worker_effect.pure (Ds_wire.transit_of_pulled pulled)
        | None -> Db_worker_effect.pure Wire.nil))

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

(* :thread-api/transact [repo tx-data tx-meta context] *)
let transact args =
  let repo = require_repo args in
  let conn = require_conn repo in
  let tx_data_edn =
    match List.nth_opt args 1 with
    | Some t -> Ds_wire.edn_text_of_arg t
    | None -> "[]"
  in
  let tx_meta =
    match List.nth_opt args 2 with
    | Some t -> Ds_wire.tx_meta_of_transit t
    | None -> []
  in
  let report = Datascript.transact_conn_string ~tx_meta conn tx_data_edn in
  Db_worker_effect.pure (Ds_wire.transit_of_tx_report report)

let () = Dispatcher.register "thread-api/transact" transact

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
