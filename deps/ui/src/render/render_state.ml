(* Render-scoped access to the current repo for worker lookups
   (e.g. resolving [[uuid]] block references). Reads the app-tracked
   current repo; falls back to the first listed graph before boot. *)

open Promise_ext
let with_repo f =
  match (Runtime.model ()).Model.repo with
  | Some r -> f r
  | None ->
      ignore
        (let* w = Runtime.invoke "thread-api/list-db" [] in
        Js.Promise.resolve
          (match w with
           | Wire.Array (m :: _) -> (
               match Wire.map_get_string m "name" with
               | Some r -> f r
               | None -> ())
           | _ -> ()))

(* {{embed [[page]]}} live block-tree renderer. Registered by the blocks
   layer (tree.ml init) — render_inline cannot import that layer. The
   default degrades to the page-name link (pre-init/defensive). *)
let page_embed : (string -> Lui_elements.t) ref =
  ref
    (fun name ->
      Render_dom.el ~tag:"a" ~style_class:"page-ref"
        ~attrs:[ ("data-ref", name) ] ~text:name [])

(* Read-only block row for view list bodies (cljs block-container).
   Registered by tree.ml — views_table cannot import the blocks layer
   (cycle via comments -> render -> views). *)
let block_row_static : (Model.block -> Lui_elements.t) ref =
  ref (fun _ -> Render_dom.el ~tag:"div" ~style_class:"ls-block" [])
