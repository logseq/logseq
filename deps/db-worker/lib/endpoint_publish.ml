(* Port of frontend.worker.publish (src/main/frontend/worker/publish.cljs).

   Endpoints registered at module load:
     thread-api/build-publish-page-payload
   init () wiring: Worker_core.init touches
     Endpoint_publish.build_publish_page_payload *)

let arg args i = List.nth_opt args i

let repo_of args =
  match arg args 0 with
  | Some (Wire.String s) -> s
  | Some Wire.Nil | None -> ""
  | _ -> "" (* cljs: conn lookup misses on any non-string arg *)

(* :thread-api/build-publish-page-payload [repo eid] *)
let build_publish_page_payload args =
  let repo = repo_of args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn -> (
      let db = Datascript.db conn in
      match arg args 1 with
      | Some w -> (
          let eid = Ds_wire.entity_ref_of_transit w in
          match Datascript.entity db eid with
          | Some page_entity ->
              Db_worker_effect.pure
                (Worker_publish.build_publish_page_payload db page_entity)
          | None -> Db_worker_effect.pure Wire.Nil)
      | None -> Db_worker_effect.pure Wire.Nil)

let () =
  Dispatcher.register "thread-api/build-publish-page-payload"
    build_publish_page_payload
