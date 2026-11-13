(* ported from deps/ui/src/blocks/comments.ml — scrollIntoView
   stubbed (no imperative scroll on the native twin), dyn → reactive;
   keep in sync upstream *)
(* Comment thread areas — cljs components/block/comments.cljs +
   handler/comments.cljs.

   A block tagged logseq.class/Comments renders .ls-comments-area in place
   of the normal content row; its child blocks render as .ls-comment-row
   inside .ls-comments-list. Title editing reuses the standard
   .editor-wrapper textarea so the delegated key/input/save machinery in
   Editor_keys/Editor_actions applies unchanged. *)

open Promise_ext
open Lui_elements

module S = Editor_state
module D = Ui_services
module W = Wire
module U = I18n



let comments_area_ident = "logseq.class/Comments"
let comment_ident = "logseq.class/Comment"

let is_comments_area = Comments_ops.is_comments_area
let comment_target_block_p = Comments_ops.comment_target_block_p
let eligible_targets = Comments_ops.eligible_targets
let can_comment = Comments_ops.can_comment

let el_scroll_into_view (el : Ui_services.el) : unit =
  el.Ui_services.scroll_into_view ()

(* ---- write paths ---- *)

(* cljs reveal-comments-area!: scroll the area into view and focus its
   reply box *)
let reveal uuid =
  match Ui_services.dom_by_id ("ls-block-" ^ uuid) with
  | Some blk -> (
      el_scroll_into_view blk;
      match
        Ui_services.dom_query
          ("#ls-block-" ^ uuid ^ " .ls-comment-add textarea")
      with
      | Some el -> el.Ui_services.focus ()
      | None -> ())
  | None -> ()

(* cljs add-comment-to-blocks! → ensure-comments-area-for-blocks then
   reveal; the endpoint inserts the area child when it does not exist yet *)
let ensure_for uuids = Comments_ops.ensure_for ~on_ready:(fun _ -> ()) uuids

(* cljs add-comment-to-current-context!: an editing blank block becomes
   the comments area itself; otherwise ensure an area for the editing
   block or the current selection *)
let add_comment () =
  let targets=match S.editing_uuid () with
    | Some uuid -> [uuid]
    | None -> Editor_actions.selected_uuids () in
  ensure_for targets

(* cljs insert-comment! — api-insert-new-block! under the comments area
   (end position) tagged logseq.class/Comment *)
let insert_comment_op area_uuid text =
  let blk =
    W.Map
      [ (W.String "block/uuid", W.Uuid (Platform.random_uuid ()))
      ; (W.String "block/title", W.String text)
      ; (W.Keyword "block/tags", W.Set [ W.Keyword comment_ident ])
      ]
  in
  Outliner_ops.insert_blocks [ blk ] area_uuid ~sibling:false

let add_box_of area_uuid =
  Ui_services.dom_query
    ("#ls-block-" ^ area_uuid ^ " .ls-comment-add textarea")

let submit = Comments_ops.submit

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

(* ---- view ---- *)

let editing_sig uuid =
  Signal.map
    (fun e ->
      match e with
      | Some e -> e.S.uuid = uuid
      | None -> false)
    (S.editing_sig ())

(* same shell as the block editor's textarea — the document-level
   editor listeners key off .editor-wrapper / #edit-block-<uuid> *)
let title_editor_el uuid : t =
  let buffer =
    match S.editing () with
    | Some e when e.S.uuid = uuid -> e.S.buffer
    | _ -> ""
  in
  Ui_parts.editor_wrapper ~key:("ctew-" ^ uuid)
    ~id:("editor-edit-block-" ^ uuid)
    [ Ui_parts.editor_inner ~key:("ctei-" ^ uuid)
        [ (* TODO(component): #edit-block-<uuid> textarea — imperative
             editor surface, migrates with logseq-editor extension *)
          Logseq_el.el ~key:("ctet-" ^ uuid) ~tag:"textarea"
            ~id:("edit-block-" ^ uuid) ~text:buffer [] ] ]

(* cljs comments-area-title-view: the label swaps for the block editor
   while the area's title is being edited *)
let title_cell uuid (b : Model.block) : t =
  reactive
    (fun editing ->
      if editing then
        box ~key:("cte-" ^ uuid) ~style_class:"ls-comments-title-editor"
          [ title_editor_el uuid ]
      else
        (* data-area-uuid dropped — the direct on_press below covers the
           action; the delegated editor_keys lookup now no-ops *)
        button ~key:("clab-" ^ uuid)
          ~style_class:"ls-comments-label"
          ~label:(U.t "editor/click-to-edit")
          ~text:(S.title_for uuid b.Model.block_title)
          ~on_press:(fun _ ->
            (* cljs edit-comments-area-title! → edit-block! on the area
               block; the standard editor machinery renders the textarea *)
            Editor_actions.enter_edit uuid 0)
          [])
    (editing_sig uuid)

let comment_row uuid (b : Model.block) : t =
  box ~key:("crw-" ^ uuid) ~style_class:"ls-comment-row"
    [ box ~key:("crm-" ^ uuid) 
        [ box ~key:("crmeta-" ^ uuid)  []
        ; box ~key:("crb-" ^ uuid) 
            (Render.title (S.title_for uuid b.Model.block_title))
        ]
    ; box ~key:("cra-" ^ uuid) ~style_class:"ls-comment-actions"
        [ (* data-comment-uuid dropped — direct on_press covers the
             action; the delegated editor_keys lookup now no-ops *)
          button ~key:("crd-" ^ uuid)
            ~style_class:"ls-comment-delete"
            ~variant:`ghost ~size:`icon
            ~label:(U.t "ui/delete")
            ~icon:(`app "trash")
            ~on_press:(fun _ -> delete uuid)
            []
        ]
    ]

(* The mounted reply owner supplies its input and completion-aware submit. *)
let add_box_body uuid ~input ~submit : t =
  box ~key:("caa-" ^ uuid) ~style_class:"ls-comment-add"
    [ box ~key:("cab-" ^ uuid) 
        [ box ~key:("cae-" ^ uuid) 
            [input]
        ; box ~key:("cax-" ^ uuid) 
            [ (* data-area-uuid dropped — direct on_press covers the
                 action; the delegated editor_keys lookup now no-ops *)
              button ~key:("cas-" ^ uuid)
                ~style_class:"ls-comment-submit"
                ~variant:`ghost ~size:`icon
                ~label:(U.t "ui/submit")
                ~icon:(`app "send")
                ~on_press:(fun _ -> submit ())
                []
            ]
        ]
    ]

let reply_draft_slot : string Signal.state_slot = Signal.state_slot "comments-reply-draft"

let add_box uuid : t =
 fun context parent ->
  if Lui_ui.host context <> Lui_protocol.NshHost then
    add_box_body uuid
      ~input:(textarea ~key:("cat-" ^ uuid)
        ~placeholder:(U.t "block.comments/placeholder") [])
      ~submit:(fun () -> submit uuid) context parent
  else
    let context=Lui_ui.child_context context ("comment-reply-" ^ Runtime.repo () ^ "-" ^ uuid) in
    let draft=Signal.state_at context.Lui_ui.ui_scheduler context.ui_state_scope
      reply_draft_slot "" in
    let repo=Runtime.repo () in
    let current ()=not (Signal.scope_is_disposed context.ui_state_scope)
      && Runtime.repo ()=repo in
    add_box_body uuid
      ~input:(textarea ~key:("cat-" ^ uuid)
        ~accessibility_identifier:("comment-reply-" ^ uuid)
        ~text:(reactive Fun.id (Signal.value draft))
        ~placeholder:(U.t "block.comments/placeholder")
        ~on_input:(function
          | Lui_protocol.TextChanged (_,value) -> Runtime.signal_set draft value
          | _ -> ()) [])
      ~submit:(fun () -> Comments_ops.submit_value uuid
        ~value:(fun () -> Runtime.signal_get draft) ~current
        ~clear:(fun () -> Runtime.signal_set draft "")) context parent

(* cljs comments-area-view (expanded branch) *)
let area_view uuid (b : Model.block) : t =
  box ~key:("cav-" ^ uuid) ~style_class:"ls-comments-area"
    [ box ~key:("cah-" ^ uuid) 
        [ title_cell uuid b
        ; text ~key:("cac-" ^ uuid)
            ~value:(string_of_int (List.length b.Model.block_children))
            []
        ]
    ; (match b.Model.block_children with
       | [] -> box ~key:("cal-" ^ uuid) []
       | children ->
           box ~key:("cal-" ^ uuid) ~style_class:"ls-comments-list"
             (List.map
                (fun c ->
                  comment_row
                    (Option.value c.Model.block_uuid ~default:"")
                    c)
                children))
    ; add_box uuid
    ]
