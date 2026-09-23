(* logseq.outliner.db-pipeline — datascript listener for CLI/test conns
   that applies the outliner pipeline's per-transact extras (no frontend
   worker assumed). *)

open Datascript

(* cljs skip-imported-graph-refs? — the conn flag :skip-store? is
   Db_tx's conn-flags table; the rest are tx-meta keys. *)
let skip_imported_graph_refs (conn : conn) (tx_meta : tx_meta) : bool =
  Db_tx.tx_meta_flag tx_meta "transact-new-graph-refs?"
  || (Db_tx.flags_of conn).skip_store
  || Db_tx.tx_meta_flag tx_meta "logseq.graph-parser.exporter/new-graph?"
  || Db_tx.tx_meta_flag tx_meta "logseq.graph-parser.exporter/imported-data?"
  || Db_tx.tx_meta_flag tx_meta "logseq.db.sqlite.export/imported-data?"

(* cljs invoke-hooks — worker-pipeline invoke-hooks for new DB graphs
   only (:block/tx-id etc not handled). *)
let invoke_hooks (conn : conn) (tx_report : tx_report) : unit =
  if not (skip_imported_graph_refs conn tx_report.tx_meta) then begin
    ignore (Outliner_pipeline.transact_new_db_graph_refs conn tx_report)
  end

(* cljs add-listener — d/listen! conn :pipeline-updates *)
let add_listener (conn : conn) : unit =
  ignore
    (Datascript.listen conn "pipeline-updates" (fun tx_report ->
         invoke_hooks conn tx_report))
