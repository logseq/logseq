let initialized = ref false

let init () =
  if not !initialized then begin
    (* touching the endpoint modules runs their registration side
       effects *)
    ignore Endpoint_db.q;
    ignore Endpoint_lifecycle.create_or_open_db;
    ignore Endpoint_state.cancel_ui_requests;
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
    ignore Endpoint_state.cancel_ui_requests;
    initialized := true
  end

let invoke name transit_args =
  init ();
  Dispatcher.invoke_transit name transit_args
