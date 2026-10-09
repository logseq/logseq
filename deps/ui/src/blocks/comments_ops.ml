(* Comment operations — the non-view half of comments.ml kept separate so
   the document-level editor dispatch (editor_keys) can submit/delete
   comments without depending on the view module. *)

open Promise_ext

module D = Web_dom
module W = Wire

let comment_ident = "logseq.class/Comment"

(* cljs insert-comment! — api-insert-new-block! under the comments area
   (end position) tagged logseq.class/Comment *)
let insert_comment_op area_uuid text =
  let blk =
    W.Map
      [ (W.String "block/uuid", W.Uuid (Ui_services.env_random_uuid ()))
      ; (W.String "block/title", W.String text)
      ; (W.Keyword "block/tags", W.Set [ W.Keyword comment_ident ])
      ]
  in
  Outliner_ops.insert_blocks [ blk ] area_uuid ~sibling:false

let add_box_of area_uuid =
  Web_dom.query_selector
    ("#ls-block-" ^ area_uuid ^ " .ls-comment-add textarea")

let submit area_uuid =
  match add_box_of area_uuid with
  | Some ta ->
      let text = String.trim (D.el_value ta) in
      if text <> "" then (
        D.el_set_value ta "";
        D.el_set_text_content ta "";
        ignore
          (Outliner_ops.apply_and_refresh
             [ insert_comment_op area_uuid text ]))
  | None -> ()

let delete uuid =
  match (Runtime.model ()).Model.repo with
  | Some repo ->
      ignore
        (let* _ =
          Runtime.invoke2 "thread-api/delete-comment" (W.String repo)
            (W.String uuid)
        in
        Outliner_ops.refresh_page ())
  | None -> ()
