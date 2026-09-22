let initialized = ref false

let init () =
  if not !initialized then begin
    (* touching the endpoint modules runs their registration side
       effects *)
    ignore Endpoint_db.q;
    ignore Endpoint_lifecycle.create_or_open_db;
    ignore Endpoint_state.cancel_ui_requests;
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
    ignore Endpoint_crypt.arg;
    ignore Endpoint_search.clear_search_index_builds;
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
