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
