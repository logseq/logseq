(* Comment operations — the non-view half of comments.ml kept separate so
   the document-level editor dispatch (editor_keys) can submit/delete
   comments without depending on the view module. *)

open Promise_ext

module W = Wire

let comment_ident = "logseq.class/Comment"
let comments_area_ident = "logseq.class/Comments"

let is_comments_area (b : Model.block) =
  b.block_is_comments_area || List.mem comments_area_ident b.block_tag_idents

let is_comment ?parent (b : Model.block) =
  b.block_is_comment || List.mem comment_ident b.block_tag_idents
  || Option.fold ~none:false ~some:is_comments_area parent

(* A direct child of a Comments area is a comment even without its own tag. *)
let comment_target_block_p ~parent b =
  not (is_comments_area b || is_comment ?parent b)

let eligible_targets ~parent_of blocks =
  List.filter (fun b -> comment_target_block_p ~parent:(parent_of b) b) blocks

let can_comment ~parent_of blocks =
  List.exists (fun b -> comment_target_block_p ~parent:(parent_of b) b) blocks

let ensure_for ~on_ready uuids =
  match (Runtime.model ()).Model.repo, uuids with
  | None, _ | _, [] -> ()
  | Some repo, _ ->
      (let* area =
         Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
           (W.String repo)
           (W.List (List.map (fun u -> W.String u) uuids))
       in
       if Runtime.repo () <> repo then Js.Promise.resolve ()
       else
         let* () = Outliner_ops.refresh_page () in
         if Runtime.repo () = repo then
           Option.iter on_ready (W.map_get_uuid area "block/uuid");
         Js.Promise.resolve ())
      |> Js.Promise.catch (fun error ->
           Ui_services.log_error ("Opening comment thread failed", error);
           Js.Promise.resolve ())
      |> ignore

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
  Ui_services.dom_query
    ("#ls-block-" ^ area_uuid ^ " .ls-comment-add textarea")

let submitting : (string * string, unit) Hashtbl.t = Hashtbl.create 8

let submit area_uuid =
  match add_box_of area_uuid with
  | Some ta ->
      let original = ta.Ui_services.value () in
      let text = String.trim original in
      let repo = Runtime.repo () in
      let key = repo, area_uuid in
      if text <> "" && not (Hashtbl.mem submitting key) then (
        Hashtbl.add submitting key ();
        (let* () = Outliner_ops.apply_and_refresh
             [ insert_comment_op area_uuid text ] in
         Hashtbl.remove submitting key;
         if Runtime.repo () = repo && ta.Ui_services.connected ()
            && ta.Ui_services.value () = original then (
           ta.Ui_services.set_value "";
           ta.Ui_services.set_text "");
         Js.Promise.resolve ())
        |> Js.Promise.catch (fun error ->
             Hashtbl.remove submitting key;
             Ui_services.log_error ("Comment submission failed", error);
             Js.Promise.resolve ())
        |> ignore)
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
