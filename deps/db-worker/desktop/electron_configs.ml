(* Port of electron.configs — user config (configs.edn) and the graph
   registry (graphs.edn), read/written as EDN via the deps/db-worker
   EDN parser. *)

open Electron_bindings
open Datascript

module Fs_extra = struct
  external ensureFileSync : string -> unit = "ensureFileSync"
    [@@mel.module "fs-extra"]
  external ensureDirSync : string -> unit = "ensureDirSync"
    [@@mel.module "fs-extra"]
end

let dot_root =
  Node.Path.join [| App.get_path App.t "home"; ".logseq" |]
let cfg_root = App.get_path App.t "userData"
let cfg_path = Node.Path.join [| cfg_root; "configs.edn" |]
let graph_registry_path () =
  Node.Path.join [| dot_root; "graphs.edn" |]

let exn_message (e : exn) : string =
  match Js.Exn.asJsExn e with
  | Some je ->
      (match Js.Exn.message je with
       | Some m -> m
       | None -> Js.String.make je)
  | None -> Printexc.to_string e

let ensure_cfg () : value option =
  try
    Fs_extra.ensureFileSync cfg_path;
    let body = Node.Fs.readFileAsUtf8Sync cfg_path in
    if body <> "" then Some (Edn_util.read_string body)
    else Some (Map [])
  with e ->
    Electron_logger.error ":cfg-error %s" (exn_message e);
    None

(* get-item k -> config value at key k (Datascript.value) *)
let get_item (k : string) : value =
  match ensure_cfg () with
  | Some cfg -> Clj_value.map_get cfg k
  | None -> Nil

(* write-cfg! *)
let write_cfg (cfg : value) : value option =
  try
    Node.Fs.writeFileAsUtf8Sync cfg_path (Edn_util.pr_str cfg);
    Some cfg
  with e ->
    Electron_logger.error ":cfg-error %s" (exn_message e);
    None

(* set-item! k v — writes merged map back to configs.edn *)
let set_item (k : string) (v : value) : unit =
  match ensure_cfg () with
  | None -> ()
  | Some cfg ->
      ignore (write_cfg (Clj_value.map_assoc cfg k v))

let get_config () : value =
  match ensure_cfg () with Some cfg -> cfg | None -> Nil

let semantic_search_enabled () : bool =
  Clj_value.map_get_opt (get_config ()) "feature/enable-semantic-search?"
    = Some (Bool true)

(* read-edn-file for graphs.edn — returns a vector of Wire.t maps *)
let read_edn_file (path : string) : Wire.t list =
  try
    Fs_extra.ensureFileSync path;
    let body = Node.Fs.readFileAsUtf8Sync path in
    if body <> "" then
      match Ds_wire.transit_of_value (Edn_util.read_string body) with
      | Wire.Array xs | Wire.List xs -> xs
      | _ -> []
    else []
  with e ->
    Electron_logger.error ":graph-registry-read-error %s"
      (exn_message e);
    []

let read_graph_registry () : Wire.t list =
  read_edn_file (graph_registry_path ())

let write_graph_registry (registry : Wire.t list) : Wire.t list option =
  try
    Fs_extra.ensureDirSync dot_root;
    Node.Fs.writeFileAsUtf8Sync
      (graph_registry_path ())
      (Edn_util.pr_str
         (Vector (List.map Ds_wire.value_of_transit registry)));
    Some registry
  with e ->
    Electron_logger.error ":graph-registry-write-error %s"
      (exn_message e);
    None

let upsert_graph_registry_entry (entry : Wire.t) : Wire.t list option =
  write_graph_registry
    (Graph_registry.upsert_entry (read_graph_registry ()) entry)
