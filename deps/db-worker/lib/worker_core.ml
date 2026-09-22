let initialized = ref false

let init () =
  if not !initialized then begin
    (* touching the endpoint modules runs their registration side
       effects *)
    ignore Endpoint_db.q;
    ignore Endpoint_lifecycle.create_or_open_db;
    ignore Endpoint_state.cancel_ui_requests;
    ignore Endpoint_import.import_file_graph;
    ignore Endpoint_markdown.set_enabled;
    ignore Endpoint_markdown.flush;
    ignore Endpoint_markdown.regenerate;
    ignore Endpoint_read.get_journal_page_by_day;
    ignore Endpoint_read.get_block_source;
    ignore Endpoint_read.get_block_parents;
    ignore Endpoint_read.get_alias_source_page;
    ignore Endpoint_read.get_bidirectional_properties;
    ignore Endpoint_read.get_block_refs;
    ignore Endpoint_read.get_page_blocks_tree;
    ignore Endpoint_comment.get_comment_threads_for_block;
    ignore Endpoint_comment.get_comment_thread_block_uuids;
    ignore Endpoint_cli.cli_list_properties;
    ignore Endpoint_cli.api_get_page_data;
    ignore Endpoint_view.get_view_filter_data;
    ignore Endpoint_view.get_view_data;
    ignore Endpoint_validate.validate_db_endpoint;
    ignore Endpoint_validate.recompute_checksum_diagnostics;
    ignore Endpoint_export.export_get_debug_datoms;
    ignore Endpoint_export.export_get_all_page_content;
    ignore Endpoint_export.export_get_blocks_data;
    ignore Endpoint_export.export_blocks_as_format;
    ignore Endpoint_export.export_db_binary;
    ignore Endpoint_export.export_client_ops_db_binary;
    ignore Endpoint_export.import_db_binary;
    ignore Endpoint_export.export_edn_endpoint;
    ignore Endpoint_export.import_edn_endpoint;
    ignore Endpoint_export.build_publishing_html;
    ignore Endpoint_publish.build_publish_page_payload;
    (* cljs db.cljs *transact-fn validate hook + db-core
       notify-invalid-data callback *)
    Db_tx.validate_tx_report_fn
    := Some
         (fun (r : Datascript.tx_report) ->
           let ok, errs =
             Db_validate.validate_tx_report ~closed_schema:false
               r.db_after r.tx_data
           in
           ( ok
           , List.map
               (fun (e : Db_validate.tx_entity_error) ->
                 (* cljs {:entity-map m' :errors humanized} — the
                    notify-invalid-data payload includes both *)
                 Ds_wire.edn_of_transit
                   (Ds_wire.transit_of_value
                      (Datascript.Map
                         [ ( Datascript.Keyword "entity-map"
                           , e.entity_map )
                         ; ( Datascript.Keyword "errors"
                           , e.errors_humanized ) ])))
               errs ));
    Db_tx.transact_invalid_callback
    := Some Worker_db_validate.notify_invalid_data;
    ignore Endpoint_state.cancel_ui_requests;
    ignore Endpoint_property.get_all_classes;
    ignore Endpoint_property.get_all_properties;
    ignore Endpoint_property.get_block_class_default_properties;
    ignore Endpoint_property.get_class_extends_children_tree;
    ignore Endpoint_property.get_class_objects;
    ignore Endpoint_property.get_class_properties;
    ignore Endpoint_property.get_first_url_property_value;
    ignore Endpoint_property.get_property_closed_values;
    ignore Endpoint_property.get_property_node_selector_data;
    ignore Endpoint_property.get_property_values;
    ignore Endpoint_property.get_structured_children;
    ignore Endpoint_property.validate_block_tag;
    ignore Endpoint_property.validate_property_value;
    ignore Endpoint_property.convert_tag_to_page;
    ignore Endpoint_property.convert_page_to_tag;
    ignore Endpoint_property.get_date_scheduled_or_deadlines_endpoint;
    ignore Endpoint_property.get_display_properties_endpoint;
    ignore Endpoint_property.reorder_display_property;
    ignore Endpoint_user.ensure_id_and_access_token;
    ignore Endpoint_crypt.arg;
    ignore Endpoint_block.get_blocks;
    ignore Render_resource.get_render_snapshots;
    ignore Endpoint_search.clear_search_index_builds;
    ignore Endpoint_sync.pure_nil;
    ignore Sync_crypt.init;
    ignore Endpoint_query.query_dsl_query;
    ignore Endpoint_transaction.transact;
    ignore Endpoint_transaction.apply_outliner_ops;
    ignore Endpoint_comment.ensure_comments_area;
    ignore Endpoint_flashcard.get_fsrs_due_card_block_ids;
    ignore Render_snapshot.canonical_blocks;
    initialized := true
  end

let invoke name transit_args =
  init ();
  Dispatcher.invoke_transit name transit_args

(* ==== graph service routing ====
   cljs db-core: *service, broadcast-data-types, on-become-master,
   <init-service! and the build-proxy-object wrappers that sit in
   front of remote-function. In a standalone worker these are the
   functions exposed through Comlink as remoteInvoke /
   remoteInvokeBinary. *)

module E = Db_worker_effect

(* cljs [graph, service-or-promise]; a resolved promise is swapped
   back in so subsequent calls skip re-election. *)
type service_slot =
  | Pending of Shared_service.service E.t
  | Ready of Shared_service.service

let service_cell : (string * service_slot) option ref = ref None

(* cljs broadcast-data-types — slave clients forward broadcasts with
   these type strings to their own UI thread. *)
let broadcast_data_types =
  [ "sync-db-changes"
  ; "sync-conflicts-updated"
  ; "notification"
  ; "log"
  ; "add-repo"
  ; "rtc-log"
  ; "rtc-sync-state" ]

let edn_of_opt = function
  | Some w -> Ds_wire.edn_of_transit w
  | None -> "nil"

(* cljs db-core's `target` (fns {remoteInvoke, remoteInvokeBinary}).
   Only "remoteInvoke" flows through the service proxy and slave
   channels, and args stay at the transit-string level end to end:
   [method-str, transit-args] -> transit-string result. *)
let target (name : string) (args : Wire.t list) : Wire.t E.t =
  match name, args with
  | "remoteInvoke",
    Wire.String method_str :: Wire.String transit_args :: _ ->
      E.map (fun s -> Wire.String s) (invoke method_str transit_args)
  | _ -> E.error (Failure ("invalid service target invoke: " ^ name))

(* cljs on-become-master — runs inside the elected master client only. *)
let on_become_master (repo : string) (start_opts : Wire.t) : unit E.t =
  Worker_log.info "db-worker/on-become-master-start"
    [ "repo", repo
    ; "import-type", edn_of_opt (Wire.get "import-type" start_opts) ];
  E.bind (Sqlite.init ()) (fun () ->
      match Wire.get "import-type" start_opts with
      | Some w when w <> Wire.Nil -> E.pure ()
      | _ ->
          E.bind
            (Endpoint_lifecycle.create_or_open_db
               [ Wire.String repo; start_opts ])
            (fun _ ->
               (* cljs asserts the datascript conn opened *)
               assert (Worker_state.datascript_conn repo <> None);
               E.pure ()))

(* cljs <init-service! — per-graph shared-service creation. *)
let init_service (graph : string option) (start_opts : Wire.t)
    : Shared_service.service option E.t =
  match graph with
  | None ->
      (match !service_cell with
       | Some (prev, _) ->
           Endpoint_lifecycle.close_db_aux prev;
           E.pure None
       | None -> E.pure None)
  | Some g ->
      (match !service_cell with
       | Some (prev, Ready s) when prev = g -> E.pure (Some s)
       | Some (prev, Pending p) when prev = g ->
           E.map (fun s -> Some s) p
       | _ ->
           let prev_graph =
             match !service_cell with
             | Some (prev, _) ->
                 Endpoint_lifecycle.close_db_aux prev;
                 prev
             | None -> "nil"
           in
           Worker_log.info "db-worker/init-service"
             [ "graph", g
             ; "prev-graph", prev_graph
             ; "import-type",
               edn_of_opt (Wire.get "import-type" start_opts) ];
           let service_effect =
             Shared_service.create_service ~service_name:g ~target
               ~on_become_master_handler:(fun _service_name ->
                  on_become_master g start_opts)
               ~broadcast_data_types
               ~import:
                 (match Wire.get "import-type?" start_opts with
                  | Some w when w <> Wire.Nil -> true
                  | _ -> false)
               ()
           in
           service_cell := Some (g, Pending service_effect);
           E.map
             (fun service ->
                (match !service_cell with
                 | Some (g', Pending p')
                   when g' = g && p' == service_effect ->
                     service_cell := Some (g, Ready service)
                 | _ -> ());
                Some service)
             service_effect)

(* cljs platform/post-message! — self.postMessage of a transit
   [type-kw data] pair; deliberately bypasses the extra_poster
   channel relay (worker-util/post-message posts to self only). *)
let post_message (type_str : string) (data : Wire.t) : unit =
  Comlink.post_message
    (Transit_codec.to_string (Wire.Array [ Wire.Keyword type_str; data ]))

(* cljs build-proxy-object remoteInvoke — per-call routing in front
   of remote-function. Returns the transit-string result. *)
let remote_invoke (method_str : string) (transit_args : string)
    : string E.t =
  init ();
  let via_proxy (service : Shared_service.service) : string E.t =
    E.bind service.status_ready (fun () ->
        E.bind
          (service.proxy
             [ Wire.String method_str; Wire.String transit_args ])
          (fun result ->
            match result with
            | Wire.String s -> E.pure s
            | _ ->
                E.error
                  (Failure "remoteInvoke: non-string result from service")))
  in
  if method_str = "thread-api/create-or-open-db" then
    (* payload is the decoded [graph opts] vector *)
    let graph, opts =
      match Transit_codec.of_string transit_args with
      | Wire.Array (g :: o :: _) | Wire.List (g :: o :: _) ->
          ((match g with
            | Wire.String s -> Some s
            | _ -> None),
           o)
      | _ -> (None, Wire.Nil)
    in
    E.bind (init_service graph opts) (fun service_opt ->
        match service_opt with
        | Some service ->
            post_message "record-worker-client-id"
              (Wire.Map
                 [ Wire.Keyword "client-id", Wire.String service.client_id ]);
            via_proxy service
        | None -> invoke method_str transit_args)
  else if method_str = "thread-api/sync-app-state" then
    invoke method_str transit_args
  else
    match !service_cell with
    | None -> invoke method_str transit_args
    | Some (_, Pending p) ->
        E.bind p (fun service -> via_proxy service)
    | Some (_, Ready service) -> via_proxy service

(* cljs remote-binary-function — bypasses the service entirely;
   the binary payload crosses as a raw byte string, the result comes
   back as Wire.Binary (converted to Uint8Array by the js entry). *)
let remote_invoke_binary (method_str : string) (repo : string)
    (payload : string option) : Wire.t E.t =
  init ();
  Dispatcher.invoke method_str
    (match payload with
     | Some p -> [ Wire.String repo; Wire.Binary p ]
     | None -> [ Wire.String repo ])
