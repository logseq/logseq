(* Cross-package dependency hooks for the db-sync port.
   The sync layer calls into packages owned by other ports (crypt, outliner
   ops, search index, outliner op construction). Each entry is an option ref
   that the owning package's init wires up — same mechanism as
   Db_tx.transact_pipeline_fn and Undo_redo.apply_history_action.
   Every call site fails fast if the hook is unset (cljs throws on nil fns the
   same way). *)

open Datascript

let missing name = invalid_arg ("sync_deps: not wired: " ^ name)

let require name (r : 'a option ref) : 'a =
  match !r with Some f -> f | None -> missing name

(* ---- crypt package (sync/crypt.cljs + sync/auth e2ee parts) ---- *)

(* crypt/<encrypt-tx-data : repo uuid-string? txs -> promise<txs> *)
let encrypt_tx_data : (string -> Wire.t list -> Wire.t list Db_worker_effect.t) option ref =
  ref None

(* crypt/<decrypt-tx-data : repo uuid-string? -> txs *)
let decrypt_tx_data : (string -> Wire.t list -> Wire.t list Db_worker_effect.t) option ref =
  ref None

(* crypt/<ensure-graph-aes-key : repo -> promise<aes-key> *)
let ensure_graph_aes_key : (string -> Wire.t Db_worker_effect.t) option ref = ref None

(* crypt/graph-e2ee? : db -> bool *)
let graph_e2ee : (Datascript.db -> bool) option ref = ref None

(* crypt/<encrypt-datoms : repo aes-key datoms -> promise<datoms> *)
let encrypt_datoms :
    (string -> Wire.t -> Wire.t list -> Wire.t list Db_worker_effect.t) option ref =
  ref None

(* crypt/<decrypt-snapshot-datoms-batch : aes-key datoms -> datoms *)
let decrypt_snapshot_datoms_batch :
    (Wire.t -> Wire.t list -> Wire.t list Db_worker_effect.t) option ref =
  ref None

(* crypt/<encrypt-text-value : aes-key text -> cipher-text *)
let encrypt_text_value : (Wire.t -> string -> string Db_worker_effect.t) option ref =
  ref None

(* crypt/<decrypt-text-value : aes-key cipher -> plain *)
let decrypt_text_value : (Wire.t -> string -> string Db_worker_effect.t) option ref =
  ref None

(* crypt/<encrypt-uint8array : aes-key bytes -> bytes *)
let encrypt_bytes : (Wire.t -> string -> string Db_worker_effect.t) option ref =
  ref None

(* crypt/<decrypt-uint8array : aes-key bytes -> bytes *)
let decrypt_bytes : (Wire.t -> string -> string Db_worker_effect.t) option ref =
  ref None

(* crypt/<fetch-graph-aes-key-for-download : repo graph-id -> aes-key *)
let fetch_graph_aes_key_for_download :
    (string -> string -> Wire.t Db_worker_effect.t) option ref =
  ref None

(* crypt/<preflight-upload-e2ee! : repo e2ee? -> promise *)
let preflight_upload_e2ee : (string -> bool -> unit Db_worker_effect.t) option ref =
  ref None

(* crypt/ensure-user-rsa-keys! : repo -> promise *)
let ensure_user_rsa_keys : (string -> unit Db_worker_effect.t) option ref = ref None

(* crypt/<grant-graph-access! : repo graph-id user-uids -> promise *)
let grant_graph_access :
    (string -> string -> Wire.t list -> unit Db_worker_effect.t) option ref =
  ref None

(* ---- outliner/op-construct package ---- *)

(* op-construct/derive-history-outliner-ops :
   db-before db-after tx-data tx-meta ->
   {:forward-outliner-ops, :inverse-outliner-ops} wire maps *)
let derive_history_outliner_ops :
    (db -> db -> Wire.t list -> (Wire.t * Wire.t) list ->
     Wire.t * Wire.t) option ref =
  ref None

(* op-construct/semantic-outliner-ops : set of op keywords *)
let semantic_outliner_ops : (string -> bool) option ref = ref None

(* op-construct/assert-no-numeric-entity-ids! : conn ops stage *)
let assert_no_numeric_entity_ids :
    (Datascript.conn -> Wire.t list -> string -> unit) option ref =
  ref None

(* op-construct/rewrite-block-title-with-retracted-refs : db block-map -> block-map *)
let rewrite_block_title_with_retracted_refs :
    (Datascript.db -> Wire.t -> Wire.t) option ref =
  ref None

(* outliner-op/apply-ops! : conn ops opts -> tx-report *)
let outliner_apply_ops :
    (Datascript.conn -> Wire.t list -> (string * value) list -> tx_report)
    option ref =
  ref None

(* outliner-page/create! : conn title opts -> tx-report *)
let outliner_page_create :
    (Datascript.conn -> string -> (string * value) list -> tx_report) option ref =
  ref None

(* outliner-page/delete! : conn page-uuid opts -> tx-report *)
let outliner_page_delete :
    (Datascript.conn -> string -> (string * value) list -> tx_report) option ref =
  ref None

(* outliner-property/upsert-property! : conn property-id schema opts *)
let outliner_upsert_property :
    (Datascript.conn -> entity_ref -> (Wire.t * Wire.t) list ->
     (string * value) list -> tx_report) option ref =
  ref None

(* outliner-core replay fns — each takes conn then its cljs args *)
let outliner_save_block :
    (Datascript.conn -> Wire.t -> (string * value) list -> tx_report) option ref =
  ref None

let outliner_insert_blocks :
    (Datascript.conn -> Wire.t -> Wire.t -> (string * value) list -> tx_report)
    option ref =
  ref None

let outliner_move_blocks :
    (Datascript.conn -> Wire.t -> Wire.t -> bool -> tx_report) option ref =
  ref None

let outliner_move_blocks_up_down :
    (Datascript.conn -> Wire.t -> bool -> (string * value) list -> tx_report)
    option ref =
  ref None

let outliner_indent_outdent_blocks :
    (Datascript.conn -> Wire.t -> bool -> (string * value) list -> tx_report)
    option ref =
  ref None

let outliner_delete_blocks :
    (Datascript.conn -> Wire.t -> (string * value) list -> tx_report) option ref =
  ref None

(* outliner-template/apply-template -> option 'apply-template' op impl *)
let outliner_apply_template :
    (Datascript.conn -> Wire.t -> (string * value) list -> tx_report) option ref =
  ref None

(* outliner-recycle/restore-tx-data + permanently-delete-tx-data exist in
   Outliner_recycle — no hook needed for them. *)

(* ---- search package ---- *)

(* frontend.worker.search/truncate-table! — wipe the search sqlite table *)
let search_truncate_table : (Sqlite.db -> unit) option ref = ref None

(* ---- worker pipeline / misc ---- *)

(* handler file for :capture-error reporting — cljs posts to the shared
   service channel; OCaml posts Comlink.post_message. *)

(* entity-plus/lookup-kv-then-entity equivalent lives in Ldb. *)

(* outliner-op/import-edn-data : conn export-map import-options -> result *)
let batch_import_edn_fn :
    (Datascript.conn -> Wire.t -> Wire.t -> Wire.t option) option ref =
  ref None

(* block-handler/canonical-blocks : db block-uuids -> {:blocks {uuid row}} *)
let canonical_blocks_fn :
    (Datascript.db -> Wire.t list -> Wire.t) option ref =
  ref None
