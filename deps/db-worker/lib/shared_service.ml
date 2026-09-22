(* frontend.worker.shared-service — master-client election over
   navigator.locks + BroadcastChannel. Idea and code ported from
   Matt-TOTW/sharedService (see cljs source for links).

   On node/native the service short-circuits to master; the lock and
   BroadcastChannel paths are browser-worker only. *)

module E = Db_worker_effect

(* The cljs target is a JS object of fns; only "remoteInvoke" is ever
   invoked through the proxy/handler. In OCaml it is a dispatcher fn:
   method-name -> args -> result effect. *)
type target = string -> Wire.t list -> Wire.t E.t

type in_flight =
  { method_name : string
  ; args : Wire.t list
  ; resolve_fn : Wire.t -> unit
  ; reject_fn : Wire.t -> unit
  }

type service =
  { proxy : Wire.t list -> Wire.t E.t
  ; status_ready : unit E.t
  ; client_id : string
  }

(* ---- the cljs *-atom state ---- *)

let master_client = ref false
let master_re_check_trigger : string option ref = ref None
(* cljs add-watch :check-master — watcher fns keyed by name, called
   with the new value. *)
let master_re_check_watchers : (string * (string option -> unit)) list ref =
  ref []
let common_channel : Broadcast_channel.t option ref = ref None
let client_channel : Broadcast_channel.t option ref = ref None
let master_slave_channels : Broadcast_channel.t list ref = ref []
let common_channel_listener : Broadcast_channel.listener option ref =
  ref None
let client_channel_listener : Broadcast_channel.listener option ref =
  ref None
let current_request_id = ref 0
(* cljs sorted-map by request-id; ids increase monotonically so a list
   append keeps the same order. *)
let requests_in_flight : (int * in_flight) list ref = ref []
let client_id : string option ref = ref None
let master_client_lock : unit E.resolver option ref = ref None

let node_runtime () = Runtime_env.kind () <> Runtime_env.Browser_worker

let next_request_id () =
  incr current_request_id;
  !current_request_id

let release_master_client_lock () =
  match !master_client_lock with
  | Some r ->
      E.wakeup r ();
      master_client_lock := None
  | None -> ()

let trigger_master_re_check v =
  master_re_check_trigger := Some v;
  List.iter (fun (_, f) -> f !master_re_check_trigger)
    !master_re_check_watchers

let common_channel_name service_name =
  "shared-service-common-channel-" ^ service_name

let get_broadcast_channel_name client_id service_name =
  client_id ^ "-" ^ service_name

let random_id () = Uuid_gen.uuid ()

(* cljs do-not-wait — fire and forget. *)
let do_not_wait (t : unit E.t) : unit = ignore t

(* cljs wire helpers: bean/->clj objects arrive as Wire.Map with
   String keys. *)
let wire_string (k : string) (data : Wire.t) : string option =
  match Wire.get k data with
  | Some (Wire.String s) -> Some s
  | _ -> None

let error_to_wire (e : exn) : Wire.t =
  Wire.Map
    [ Wire.String "message", Wire.String (Printexc.to_string e) ]

(* ---- client-id ---- *)

let get_client_id () : string E.t =
  let id = random_id () in
  E.bind
    (Navigator_locks.request ~name:id ~mode:"exclusive" (fun _lock ->
         E.map
           (fun (qr : Navigator_locks.query_result) ->
              match
                List.find_opt
                  (fun (li : Navigator_locks.lock_info) -> li.name = id)
                  qr.held
              with
              | Some li -> li.client_id
              | None -> assert false)
           (Navigator_locks.query ())))
    (fun cid ->
       assert (cid <> "");
       do_not_wait
         (Navigator_locks.request ~name:cid ~mode:"exclusive" (fun _ ->
              (* never release it *)
              fst (E.wait ())));
       Worker_log.debug "shared-service/client-id" [ "client-id", cid ];
       E.pure cid)

let ensure_client_id () : string E.t =
  match !client_id with
  | Some id -> E.pure id
  | None -> E.map (fun id -> client_id := Some id; id) (get_client_id ())

(* ---- channels ---- *)

let ensure_common_channel (service_name : string) : Broadcast_channel.t =
  match !common_channel with
  | Some ch -> ch
  | None ->
      let ch = Broadcast_channel.create (common_channel_name service_name) in
      common_channel := Some ch;
      ch

let ensure_client_channel (slave_client_id : string) (service_name : string)
    : Broadcast_channel.t =
  match !client_channel with
  | Some ch -> ch
  | None ->
      let ch =
        Broadcast_channel.create
          (get_broadcast_channel_name slave_client_id service_name)
      in
      client_channel := Some ch;
      ch

let listen_common_channel (ch : Broadcast_channel.t)
    (listener_fn : Wire.t -> unit) : unit =
  (match !common_channel_listener with
   | Some old -> Broadcast_channel.remove_message_listener ch old
   | None -> ());
  common_channel_listener :=
    Some (Broadcast_channel.add_message_listener ch listener_fn)

let listen_client_channel (ch : Broadcast_channel.t)
    (listener_fn : Wire.t -> unit) : unit =
  (match !client_channel_listener with
   | Some old -> Broadcast_channel.remove_message_listener ch old
   | None -> ());
  client_channel_listener :=
    Some (Broadcast_channel.add_message_listener ch listener_fn)

(* cljs <apply-target-f! — gobj/get + apply; our target fn raises on
   unknown methods instead of asserting Some. *)
let apply_target_f (target : target) (method_name : string)
    (args : Wire.t list) : Wire.t E.t =
  target method_name args

(* ---- election ---- *)

let check_master_or_slave_client ~service_name ~on_become_master
    ~on_become_slave () : unit E.t =
  E.bind (ensure_client_id ()) (fun cid ->
      do_not_wait
        (Navigator_locks.request ~name:service_name ~mode:"exclusive"
           ~if_available:true (fun lock ->
             E.bind (Navigator_locks.query ()) (fun qr ->
                 let locked =
                   List.exists
                     (fun (li : Navigator_locks.lock_info) ->
                        li.name = service_name && li.client_id = cid)
                     qr.held
                 in
                 if locked && lock <> None then begin
                   (* become master *)
                   master_client := true;
                   E.bind (on_become_master ()) (fun () ->
                       let held, resolver = E.wait () in
                       master_client_lock := Some resolver;
                       (* keep lock until context destroyed *)
                       held)
                 end
                 else if locked (* already locked by this client *)
                 then begin
                   assert !master_client;
                   E.pure ()
                 end
                 else begin
                   (* become slave *)
                   master_client := false;
                   on_become_slave ()
                 end)));
      E.pure ())

let clear_old_service () =
  release_master_client_lock ();
  master_client := false;
  List.iter
    (fun ch -> Broadcast_channel.close ch)
    (!master_slave_channels
     @ List.filter_map Fun.id [ !common_channel; !client_channel ]);
  common_channel := None;
  client_channel := None;
  master_slave_channels := [];
  common_channel_listener := None;
  client_channel_listener := None;
  requests_in_flight := [];
  Broadcast.set_extra_poster None;
  (* cljs remove-watch :check-master *)
  master_re_check_watchers :=
    List.remove_assoc "check-master" !master_re_check_watchers

(* ---- request/response ---- *)

let on_response_handler (data : Wire.t) : unit =
  match wire_string "type" data with
  | Some "response" ->
      (match Option.bind (Wire.get "id" data) Wire.as_int with
       | Some id ->
           (match List.assoc_opt id !requests_in_flight with
            | Some entry ->
                requests_in_flight :=
                  List.remove_assoc id !requests_in_flight;
                (match Wire.get "error" data with
                 | Some err when err <> Wire.Nil ->
                     Worker_log.error "shared-service/error-process-request"
                       [ "error", Ds_wire.edn_of_transit err ];
                     entry.reject_fn err
                 | _ ->
                     entry.resolve_fn
                       (Option.value ~default:Wire.Nil
                          (Wire.get "result" data)))
            | None -> ())
       | _ -> ())
  | _ -> ()

let create_on_request_handler (client_channel : Broadcast_channel.t)
    (target : target) : Wire.t -> unit =
  fun data ->
    match wire_string "type" data, Option.bind (Wire.get "id" data) Wire.as_int with
    | Some "request", Some id ->
        let method_name =
          match Wire.get "method" data with
          | Some (Wire.String m) -> m
          | _ -> ""
        in
        let args =
          match Wire.get "args" data with
          | Some (Wire.Array a) -> a
          | _ -> []
        in
        E.async (fun () ->
            E.bind
              (E.catch
                 (E.map (fun res -> res, Wire.Nil)
                    (apply_target_f target method_name args))
                 (fun e -> E.pure (Wire.Nil, error_to_wire e)))
              (fun (result, error) ->
                 Broadcast_channel.post_message client_channel
                   (Wire.Map
                      [ Wire.String "id", Wire.Int id
                      ; Wire.String "type", Wire.String "response"
                      ; Wire.String "result", result
                      ; Wire.String "error", error
                      ; ( Wire.String "method-key"
                        , match args with a :: _ -> a | [] -> Wire.Nil ) ]);
                 E.pure ()))
    | _ -> ()

let slave_registered_handler ~service_name ~slave_client_id ~event
    ~(register_finish : (unit E.t * unit E.resolver) option ref) : unit =
  match Wire.get "slave-client-id" event with
  | Some (Wire.String sid) when sid = slave_client_id ->
      E.async (fun () ->
          E.bind (Navigator_locks.query ()) (fun qr ->
              let already_watching =
                List.exists
                  (fun (li : Navigator_locks.lock_info) ->
                     li.name = service_name && li.client_id = slave_client_id)
                  qr.pending
              in
              if not already_watching then
                (* dont watch multiple times *)
                do_not_wait
                  (Navigator_locks.request ~name:service_name
                     ~mode:"exclusive" (fun _lock ->
                       (* The master has gone, elect the new master *)
                       Worker_log.debug "shared-service/master-has-gone" [];
                       trigger_master_re_check "re-check";
                       E.pure ()));
              (match !register_finish with
               | Some (_, r) -> E.wakeup r ()
               | None -> ());
              E.pure ()))
  | _ -> ()

let re_requests_in_flight_on_slave (client_channel : Broadcast_channel.t)
    : unit =
  if !requests_in_flight <> [] then begin
    Worker_log.debug "shared-service/re-requests-in-flight"
      [ "count", string_of_int (List.length !requests_in_flight) ];
    List.iter
      (fun (id, e) ->
         Broadcast_channel.post_message client_channel
           (Wire.Map
              [ Wire.String "id", Wire.Int id
              ; Wire.String "type", Wire.String "request"
              ; Wire.String "method", Wire.String e.method_name
              ; Wire.String "args", Wire.Array e.args ]))
      !requests_in_flight
  end

let re_requests_in_flight_on_master (target : target) : unit =
  if !requests_in_flight <> [] then begin
    Worker_log.debug "shared-service/re-requests-in-flight"
      [ "count", string_of_int (List.length !requests_in_flight) ];
    List.iter
      (fun (id, e) ->
         E.async (fun () ->
             E.finally
               (E.catch
                  (E.map e.resolve_fn
                     (apply_target_f target e.method_name e.args))
                  (fun exn ->
                     Worker_log.error "shared-service/error-processing-request"
                       [ "error", Printexc.to_string exn ];
                     e.reject_fn (error_to_wire exn);
                     E.pure ()))
               (fun () ->
                  requests_in_flight := List.remove_assoc id !requests_in_flight;
                  E.pure ())))
      !requests_in_flight
  end

let on_become_slave ~slave_client_id ~service_name ~common_channel
    ~broadcast_data_types ~(status_ready : unit E.resolver) () : unit E.t =
  let client_channel = ensure_client_channel slave_client_id service_name in
  let register_finish : (unit E.t * unit E.resolver) option ref = ref None in
  let register () =
    Broadcast_channel.post_message common_channel
      (Wire.Map
         [ Wire.String "type", Wire.String "slave-register"
         ; Wire.String "slave-client-id", Wire.String slave_client_id ]);
    let t, r = E.wait () in
    register_finish := Some (t, r);
    t
  in
  listen_client_channel client_channel on_response_handler;
  listen_common_channel common_channel (fun data ->
      let ty = wire_string "type" data in
      match ty with
      | Some t when List.mem t broadcast_data_types ->
          (* cljs (.postMessage js/self data) — the broadcast
             transit-payload forwarded to this client's UI thread *)
          (match Wire.get "data" data with
           | Some (Wire.String payload) ->
               Broadcast.to_clients ~kind:t ~transit_payload:payload
           | _ -> ())
      | Some "master-changed" ->
          E.async (fun () ->
              Worker_log.debug
                "shared-service/master-client-change-detected" [];
              E.bind (register ()) (fun () ->
                  re_requests_in_flight_on_slave client_channel;
                  E.pure ()))
      | Some "slave-registered" ->
          slave_registered_handler ~service_name ~slave_client_id
            ~event:data ~register_finish
      | Some "slave-register" ->
          Worker_log.debug "shared-service/ignored-event"
            [ "event", Ds_wire.edn_of_transit data ]
      | _ ->
          Worker_log.error "shared-service/unknown-event"
            [ "event", Ds_wire.edn_of_transit data ]);
  E.catch
    (E.bind (register ()) (fun () ->
         E.wakeup status_ready ();
         E.pure ()))
    (fun e ->
       Worker_log.error "shared-service/on-become-slave"
         [ "error", Printexc.to_string e ];
       E.error e)

let on_become_master ~master_client_id ~service_name ~common_channel
    ~target ~on_become_master_handler ~(status_ready : unit E.resolver) ()
    : unit E.t =
  Worker_log.debug "shared-service/become-master"
    [ "master-client-id", master_client_id; "service", service_name ];
  listen_common_channel common_channel (fun data ->
      match wire_string "type" data, wire_string "slave-client-id" data with
      | Some "slave-register", Some sid ->
          let ch =
            Broadcast_channel.create
              (get_broadcast_channel_name sid service_name)
          in
          master_slave_channels := ch :: !master_slave_channels;
          do_not_wait
            (Navigator_locks.request ~name:sid ~mode:"exclusive" (fun _ ->
                 Worker_log.debug "shared-service/slave-has-gone"
                   [ "slave-client-id", sid ];
                 Broadcast_channel.close ch;
                 E.pure ()));
          listen_client_channel ch (create_on_request_handler ch target);
          Broadcast_channel.post_message common_channel
            (Wire.Map
               [ Wire.String "type", Wire.String "slave-registered"
               ; Wire.String "slave-client-id", Wire.String sid
               ; Wire.String "master-client-id", Wire.String master_client_id
               ; Wire.String "serviceName", Wire.String service_name ])
      | _ -> ());
  Broadcast_channel.post_message common_channel
    (Wire.Map
       [ Wire.String "type", Wire.String "master-changed"
       ; Wire.String "master-client-id", Wire.String master_client_id
       ; Wire.String "serviceName", Wire.String service_name ]);
  E.finally
    (E.bind
       (E.catch
          (on_become_master_handler service_name)
          (fun e -> E.error e))
       (fun () -> re_requests_in_flight_on_master target; E.pure ()))
    (fun () -> E.wakeup status_ready (); E.pure ())

(* cljs <create-service — broadcast-data-types: wire "type" strings
   whose broadcasts are forwarded straight to this client's UI thread
   (postMessage js/self). *)
let create_service ~service_name ~target ~on_become_master_handler
    ~broadcast_data_types ?(import = false) () : service E.t =
  clear_old_service ();
  if node_runtime () then begin
    master_client := true;
    client_id := Some "node";
    let ready, ready_r = E.wait () in
    E.async (fun () ->
        E.bind (on_become_master_handler service_name) (fun () ->
            E.wakeup ready_r ();
            E.pure ()));
    E.pure
      { proxy = (fun args -> apply_target_f target "remoteInvoke" args)
      ; status_ready = ready
      ; client_id = "node"
      }
  end
  else begin
    if import then master_client := true;
    let ready, ready_r = E.wait () in
    let common = ensure_common_channel service_name in
    (* cljs broadcast-to-clients! also relays every broadcast onto the
       common channel so slave clients' UI threads see them. *)
    Broadcast.set_extra_poster
      (Some
         (fun ~kind ~transit_payload ->
            (match !common_channel with
             | Some ch ->
                 Broadcast_channel.post_message ch
                   (Wire.Map
                      [ Wire.String "type", Wire.String kind
                      ; Wire.String "data", Wire.String transit_payload ])
             | None -> ())));
    E.bind (ensure_client_id ()) (fun cid ->
        let check_master_slave () =
          check_master_or_slave_client ~service_name
            ~on_become_master:(fun () ->
              on_become_master ~master_client_id:cid ~service_name
                ~common_channel:common ~target ~on_become_master_handler
                ~status_ready:ready_r ())
            ~on_become_slave:(fun () ->
              on_become_slave ~slave_client_id:cid ~service_name
                ~common_channel:common ~broadcast_data_types
                ~status_ready:ready_r ())
            ()
        in
        ignore (check_master_slave ());
        Worker_log.info "shared-service/create-client"
          [ "service", service_name; "client-id", cid
          ; "import?", string_of_bool import ];
        master_re_check_watchers :=
          ( "check-master"
          , fun new_value ->
              if new_value = Some "re-check" then
                E.async (fun () ->
                    E.bind (E.sleep 100.) (fun () ->
                        check_master_slave ())) )
          :: !master_re_check_watchers;
        let proxy (args : Wire.t list) : Wire.t E.t =
          (* cljs js/Proxy get-trap on "remoteInvoke" *)
          if !master_client then apply_target_f target "remoteInvoke" args
          else begin
            let request_id = next_request_id () in
            let ch = ensure_client_channel cid service_name in
            let t, r = E.wait () in
            requests_in_flight :=
              !requests_in_flight
              @ [ ( request_id
                  , { method_name = "remoteInvoke"
                    ; args
                    ; resolve_fn = (fun v -> E.wakeup r v)
                    ; reject_fn =
                        (fun err ->
                           E.reject r
                             (Failure (Ds_wire.edn_of_transit err)))
                    } ) ];
            Broadcast_channel.post_message ch
              (Wire.Map
                 [ Wire.String "id", Wire.Int request_id
                 ; Wire.String "type", Wire.String "request"
                 ; Wire.String "method", Wire.String "remoteInvoke"
                 ; Wire.String "args", Wire.Array args ]);
            t
          end
        in
        E.pure
          { proxy; status_ready = ready; client_id = cid })
  end

(* cljs broadcast-to-clients! — Broadcast.to_clients covers the
   self.postMessage / node event-fn halves and the extra_poster relay
   registered by create_service covers the common-channel broadcast
   (browser slave forwarding). *)
let broadcast_to_clients ~(kind : string) ~(transit_payload : string) : unit =
  Broadcast.to_clients ~kind ~transit_payload
