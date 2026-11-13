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

let comment_owned_by ~current_user (block : Model.block) =
  let author = Option.bind block.block_created_by (fun a -> a.Model.author_uuid) in
  match author, current_user with
  | Some author, Some user -> author = user
  | None, None -> true
  | _ -> false

let reply_focus_request : (string * string) option ref = ref None

let take_reply_focus_request uuid =
  if !reply_focus_request = Some (Runtime.repo (), uuid) then begin
    reply_focus_request := None;
    true
  end else false

let reveal uuid =
  match Ui_services.dom_by_id ("area-" ^ uuid) with
  | None -> ()
  | Some area ->
      area.Ui_services.scroll_into_view_nearest ();
      (match area.query ".ls-comment-add textarea" with
       | Some input ->
           ignore (take_reply_focus_request uuid);
           input.Ui_services.focus ()
       | None -> Option.iter (fun placeholder ->
           (* Claim before native activation: the placeholder's own appearance
              callback must not also open and retire this queued click target. *)
           ignore (take_reply_focus_request uuid);
           placeholder.Ui_services.click ())
           (area.query ".ls-comment-reply-placeholder"))

let reveal_if_requested uuid =
  if !reply_focus_request = Some (Runtime.repo (), uuid) then reveal uuid

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
         let uuid = W.map_get_uuid area "block/uuid" in
         reply_focus_request := Option.map (fun uuid -> repo, uuid) uuid;
         let* () = Outliner_ops.refresh_page () in
         if Runtime.repo () = repo then
           Option.iter (fun uuid ->
             Editor_state.set_collapsed uuid false;
             on_ready uuid;
             reveal_if_requested uuid)
             uuid;
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
  Outliner_ops.insert_blocks ~bottom:true [ blk ] area_uuid ~sibling:false

let add_box_of area_uuid =
  Option.bind (Ui_services.dom_by_id ("area-" ^ area_uuid))
    (fun area -> area.Ui_services.query ".ls-comment-add textarea")

let submitting : (string * string, unit) Hashtbl.t = Hashtbl.create 8

let submit_value area_uuid ~value ~current ~clear =
  let original = value () in
  let text = String.trim original in
  let repo = Runtime.repo () in
  let key = repo, area_uuid in
  if text <> "" && current () && not (Hashtbl.mem submitting key) then (
    Hashtbl.add submitting key ();
    (let* () = Outliner_ops.apply_and_refresh [insert_comment_op area_uuid text] in
     Hashtbl.remove submitting key;
     if Runtime.repo () = repo && current () && value () = original then clear ();
     Js.Promise.resolve ())
    |> Js.Promise.catch (fun error ->
         Hashtbl.remove submitting key;
         Ui_services.log_error ("Comment submission failed", error);
         Js.Promise.resolve ())
    |> ignore)

let submit area_uuid =
  Option.iter (fun textarea ->
    submit_value area_uuid ~value:textarea.Ui_services.value
      ~current:textarea.connected
      ~clear:(fun () -> textarea.set_value "";textarea.set_text ""))
    (add_box_of area_uuid)

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
