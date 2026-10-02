(* Native twin of assets/asset_dom.ml — asset blocks render through the
   "asset" logseq-* extension tag; the Swift side resolves the file and
   shows it. Upload flows route through the file-picker dom-event. *)

open Promise_ext

let dom = Logseq_dom.dom
let t = Logseq_dom.dom ~tag:"raw-text" []

let upload_files (_files : Js.Json.t array) : unit = ()

let upload_input key : Lui_elements.t =
  dom ~key ~tag:"asset-upload-input" ~attrs:[ ("hidden", "") ] []

let on_asset_write_finish ~repo':_ ~asset_id:_ = ()
let retry_pending () = ()

(* minimal asset render — the asset extension tag carries the block
   uuid + stored file path so the Swift renderer can resolve it *)
let file_cell (w : Wire.t) : Views_dom.el =
  let uuid =
    Option.value (Wire.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (Wire.map_get_string w "logseq.property.asset/type") ~default:"" in
  Views_dom.h ~tag:"img"
    ~attrs:[ ("title", uuid ^ "." ^ ext); ("data-asset-file", uuid ^ "." ^ ext) ]
    ()

let block_view uuid (_b : Model.block) : Lui_elements.t =
  dom ~key:("asset-" ^ uuid) ~tag:"asset"
    ~attrs:[ ("data-asset-uuid", uuid) ] []

let install () = ()

let delete_asset uuid =
  let ext =
    match Editor_state.find uuid with
    | Some b -> Option.value b.Model.block_asset_type ~default:""
    | None -> ""
  in
  if ext <> "" then
    ignore (Asset_store.delete_asset ~repo:(Runtime.repo ()) ~name:(uuid ^ "." ^ ext));
  ignore
    (Outliner_ops.apply_and_refresh
       [ Outliner_ops.delete_blocks [ uuid ] ])


