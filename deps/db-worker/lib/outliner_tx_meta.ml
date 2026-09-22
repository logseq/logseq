(* logseq.outliner.tx-meta — normalize tx metadata with outliner op entries. *)
open Datascript

(* cljs (assoc :outliner-ops [entry]) when absent *)
let ensure_outliner_ops (tx_meta : tx_meta) (entry : value option) : tx_meta =
  match entry with
  | Some e when not (List.mem_assoc "outliner-ops" tx_meta) ->
    tx_meta @ [ "outliner-ops", Vector [ e ] ]
  | _ -> tx_meta

(* cljs (update :outliner-ops (fnil into []) ops) *)
let append_outliner_ops (tx_meta : tx_meta) (ops : value list) : tx_meta =
  match ops with
  | [] -> tx_meta
  | _ ->
    let existing =
      match List.assoc_opt "outliner-ops" tx_meta with
      | Some (Vector xs) | Some (List xs) -> xs
      | _ -> []
    in
    List.filter (fun (a, _) -> a <> "outliner-ops") tx_meta
    @ [ "outliner-ops", Vector (existing @ ops) ]

(* op entry — cljs [op-kw [arg1 arg2 ...]] shape *)
let op_entry (op : string) (args : value list) : value =
  Vector [ Keyword op; Vector args ]

let tx_meta_put (tx_meta : tx_meta) (k : attr) (v : value) : tx_meta =
  List.filter (fun (a, _) -> a <> k) tx_meta @ [ (k, v) ]
