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

let reply_focus_current uuid =
  match Editor_state.editing () with
  | None -> not (Editor_state.selection_active ())
  | Some editing ->
      (match editing.Editor_state.owner with
       | Editor_state.Explicit_draft owner -> owner#current && owner#asset_target = uuid
       | Editor_state.Persisted -> false)

let take_reply_focus_request uuid =
  if !reply_focus_request = Some (Runtime.repo (), uuid) then begin
    reply_focus_request := None;
    reply_focus_current uuid
  end else false

let reveal uuid =
  if !reply_focus_request = Some (Runtime.repo (), uuid) && not (reply_focus_current uuid) then
    ignore (take_reply_focus_request uuid)
  else match Ui_services.dom_by_id ("area-" ^ uuid) with
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
  match (Runtime.model ()).Model.repo, uuids, Editor_state.editing () with
  | None, _, _ | _, [], _ -> ()
  | _, _, Some editing when Editor_state.is_draft editing -> ()
  | Some repo, _, editing when not (Ui_services.env_publishing ()) ->
      let route=Runtime.route () and worker= !Runtime.worker in
      let selected=Editor_state.selected () and scope=Editor_state.selection_scope () in
      let current ()=Runtime.repo ()=repo && Runtime.route ()=route && !Runtime.worker==worker
        && not (Ui_services.env_publishing ()) in
      let selection_current ()=Editor_state.String_set.equal (Editor_state.selected ()) selected
        && Editor_state.selection_scope ()=scope in
      let blank=match editing,uuids with
        | Some editing,[uuid] when editing.Editor_state.uuid=uuid
            && String.trim (Editor_actions.live_buffer uuid)="" -> Some uuid
        | _ -> None in
      let perform () =
        if not (current ()) then Js.Promise.resolve () else
        let ()=reply_focus_request:=None in
        let* uuid = match blank with
          | Some uuid ->
              let* ()=Outliner_ops.apply
                [Outliner_ops.set_block_property uuid "block/tags" (W.Set [W.Keyword comments_area_ident])] in
              Js.Promise.resolve (Some uuid)
          | None ->
              let* area=Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
                (W.String repo) (W.List (List.map (fun uuid -> W.String uuid) uuids)) in
              Js.Promise.resolve (W.map_get_uuid area "block/uuid") in
        match uuid with
        | Some uuid when current () && Option.is_none (Editor_state.editing ()) && selection_current () ->
            (* The completed operation owns only its captured selection. A new
               editor or selection must not be replaced by a late reply focus. *)
            Editor_actions.clear_selection ();
            let* result=match Runtime.capture_reload_origin () with
              | Some entry -> Outliner_ops.refresh_page_owned_result entry
              | None -> Js.Promise.resolve Runtime.Reload_superseded in
            if current () && Runtime.reload_result_current result && reply_focus_current uuid then begin
              Editor_state.set_collapsed uuid false;
              reply_focus_request:=Some (repo,uuid);
              on_ready uuid;
              reveal_if_requested uuid
            end;
            Js.Promise.resolve ()
        | _ -> Js.Promise.resolve () in
      Editor_actions.after_pending_input perform
      |> Js.Promise.catch (fun error ->
           Ui_services.log_error ("Opening comment thread failed", error);
           Js.Promise.resolve ())
      |> ignore
  | Some _, _, _ -> ()

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
