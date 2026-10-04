(* frontend.worker.ui-request — ask the embedder UI to run an action and
   await its resolve/reject, with a timeout and a cancel-all path.
   [ui_request_fn] is the cljs with-redefs seam; [Sync_crypt.reset_hooks]
   restores it with the crypt seams. *)

open Db_worker_effect

let default_ui_timeout_ms = 60000

let kw s = Wire.Keyword s
let str s = Wire.String s
let ex_info msg data = Dispatcher.Exn_info (msg, data)

let exn_data (e : exn) : (Wire.t * Wire.t) list =
  match e with
  | Dispatcher.Exn_info (_, data) -> data
  | _ -> []

let seq_ = function
  | Some s -> String.length (Unicode.trim s) > 0
  | None -> false

(* Wraps an effect-body so sync raises (fail-fast, transit errors
   before the first bind) become rejections, like promesa. *)
let run f = try f () with e -> error e

let ui_interaction_required_error action hint =
  ex_info "ui-interaction-required"
    ([ (kw "code", kw "ui-interaction-required"); (kw "action", action) ]
     @
     match hint with
     | Some h when seq_ (Some h) -> [ (kw "hint", str h) ]
     | _ -> [])

(* cljs ui-request/->rejectable-error — an Error-map's fields become
   ex-data; code defaults to :ui-request-rejected. *)
let rejectable_exn_of_wire request_id action (m : Wire.t) =
  let entries = Wire.as_map m in
  let code =
    match Wire.get "code" m with
    | Some (Wire.Keyword s) | Some (Wire.String s) -> s
    | _ -> "ui-request-rejected"
  in
  let message =
    match Wire.get "message" m with
    | Some (Wire.String s) -> s
    | _ -> code
  in
  let entries =
    entries
    @ (match Wire.get "code" m with
       | Some _ -> []
       | None -> [ (kw "code", kw "ui-request-rejected") ])
    @ (match Wire.get "request-id" m with
       | Some _ -> []
       | None -> [ (kw "request-id", str request_id) ])
    @ (match Wire.get "action" m with
       | Some _ -> []
       | None -> [ (kw "action", action) ])
  in
  ex_info message entries

let ui_request_impl (action : Wire.t) (payload : Wire.t) ?hint ?timeout_ms () : Wire.t t =
  run (fun () ->
      if not (Sync_platform.interactive_runtime ()) then
        error (ui_interaction_required_error action hint)
      else begin
        let request_id = Uuid_gen.uuid () in
        let timeout_ms =
          match timeout_ms with
          | Some t when t > 0 -> t
          | _ -> default_ui_timeout_ms
        in
        let task, resolver = wait () in
        Worker_state.ui_request_put request_id resolver action;
        let timer =
          Timers.set_timeout timeout_ms (fun () ->
              match Worker_state.ui_request_take request_id with
              | Some (r, _) ->
                  wakeup r
                    (Error
                       (Wire.kw_map
                          [ ("code", kw "ui-request-timeout");
                            ("request-id", str request_id);
                            ("action", action);
                            ("timeout-ms", Wire.Int timeout_ms) ]))
              | None -> ())
        in
        (try
           !Sync_platform.post_message_fn
             (Sync_platform.transit_write
                (Wire.Array
                   [ kw "db-worker/ui-request";
                     Wire.kw_map
                       [ ("request-id", str request_id);
                         ("action", action);
                         ("payload", payload);
                         ("timeout-ms", Wire.Int timeout_ms) ] ]))
         with e ->
           (match Worker_state.ui_request_take request_id with
            | Some (r, _) ->
                Timers.clear timer;
                wakeup r
                  (Error
                     (Wire.kw_map
                        [ ("code", kw "ui-request-rejected");
                          ("request-id", str request_id);
                          ("action", action);
                          ("data", Wire.Map (exn_data e)) ]))
            | None -> ()));
        bind task (function
          | Ok v ->
              Timers.clear timer;
              pure v
          | Error m ->
              Timers.clear timer;
              error (rejectable_exn_of_wire request_id action m))
      end)

let ui_request_fn :
    (Wire.t -> Wire.t -> ?hint:string -> ?timeout_ms:int -> unit -> Wire.t t) ref =
  ref ui_request_impl

let request_ui action payload ?hint ?timeout_ms () =
  !ui_request_fn action payload ?hint ?timeout_ms ()

(* cljs ui-request/cancel-all! — resolve/reject endpoints already live
   in endpoint_state.ml. *)
let cancel_all_ui_requests context =
  let ids = Worker_state.ui_request_ids () in
  List.iter
    (fun id ->
      match Worker_state.ui_request_take id with
      | Some (r, action) ->
          wakeup r
            (Error
               (Wire.kw_map
                  [ ("code", kw "ui-request-cancelled");
                    ("request-id", str id);
                    ("action", action);
                    ("context", context) ]))
      | None -> ())
    ids;
  Wire.kw_map [ ("ok", Wire.Bool true); ("cancelled", Wire.Int (List.length ids)) ]
