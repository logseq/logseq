(* Port of logseq.outliner.transaction — the with-batch-tx and transact!
   macros become functions taking [body : conn -> unit]. In the cljs
   macro the opts keys :additional-tx/:transact-opts/:current-block are
   dissoc'd before the rest is transacted as tx-meta; here they are
   named args, so [tx_meta] already excludes them. *)
open Datascript

(* with-batch-tx — runs body on a temp batch conn, then
   (when (seq (:additional-tx opts)) (ldb/transact! conn' additional-tx {}))
   inside the batch. *)
let with_batch_tx ?(tx_meta : tx_meta = [])
    ?(additional_tx : Wire.t list = []) (conn : conn)
    (body : conn -> unit) : tx_report option =
  Db_transact.batch_transact_with_temp_conn conn tx_meta (fun conn' ->
      body conn';
      match additional_tx with
      | [] -> ()
      | txs -> ignore (Db_transact.transact conn' txs []))

(* transact! — cljs takes conn from (:conn (:transact-opts opts)); here
   conn is a direct arg and remaining opts are tx-meta. If body produces
   no tx data, nothing is saved. *)
let transact ?(tx_meta : tx_meta = []) ?(additional_tx : Wire.t list = [])
    (conn : conn) (body : conn -> unit) : tx_report option =
  with_batch_tx ~tx_meta ~additional_tx conn body
