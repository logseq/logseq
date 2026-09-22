(* logseq.outliner.transaction — wrapper around batch-transact-with-temp-conn!
   using the outliner txs state. The cljs ns is macro-only; here the
   same semantics are plain functions that take the body as [f]. *)

open Datascript

(* tx-meta for the outer commit: opts minus the keys consumed by the
   wrapper itself (cljs (dissoc opts :additional-tx :transact-opts
   :current-block)). *)
let tx_meta_of_opts (opts : Wire.t) : tx_meta =
  Cljs_map.dissoc_list opts
    [ "additional-tx"; "transact-opts"; "current-block" ]
  |> Ds_wire.tx_meta_of_transit

let seq_tx_data (w : Wire.t) : Wire.t list =
  match w with
  | Wire.Array xs | Wire.List xs -> xs
  | _ -> []

let with_batch_tx (conn : conn) (opts : Wire.t) (f : conn -> unit)
    : tx_report option =
  let tx_meta = tx_meta_of_opts opts in
  Db_transact.batch_transact_with_temp_conn conn tx_meta (fun conn' ->
      f conn';
      (* (when (seq (:additional-tx opts))
           (logseq.db/transact! conn' (:additional-tx opts) {})) *)
      match Cljs_map.get opts "additional-tx" with
      | Some additional_tx ->
          (match seq_tx_data additional_tx with
           | [] -> ()
           | txs ->
               ignore
                 (Db_transact.transact conn' txs [] : tx_report option))
      | None -> ())

(* transact!: cljs reads the conn from (:conn (:transact-opts opts));
   a conn is not wire-representable so callers pass it directly here. *)
let transact (conn : conn) (opts : Wire.t) (f : conn -> unit)
    : tx_report option =
  with_batch_tx conn opts f
