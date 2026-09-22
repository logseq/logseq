(* logseq.outliner.datascript — fns related to batch txs state.
   The cljs new-outliner-txs-state atom maps to
   Outliner_core.txs_state (mutable tx_op list); this module keeps the
   cljs module surface for the ported call sites. *)

open Datascript

type t = Outliner_core.txs_state

(* new-outliner-txs-state *)
let new_outliner_txs_state () : t = Outliner_core.new_txs_state ()

(* outliner-txs-state? — trivially true for this representation; kept
   for API parity with the cljs predicate. *)
let outliner_txs_state (_state : t) : bool = true

(* contents as a tx_op list (cljs @state) *)
let txs (state : t) : tx_op list = state.Outliner_core.txs

(* conj tx ops into the state (cljs swap! state into ...) *)
let push (state : t) (ops : tx_op list) : unit =
  Outliner_core.txs_push state ops
