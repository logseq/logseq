(* Comment thread areas — cljs components/block/comments.cljs +
   handler/comments.cljs.

   A block tagged logseq.class/Comments renders .ls-comments-area in place
   of the normal content row; its child blocks render as .ls-comment-row
   inside .ls-comments-list. Title editing reuses the standard
   editor surface so the delegated key/input/save machinery in
   Editor_keys/Editor_actions applies unchanged. *)

open Lui_elements

module S = Editor_state
module D = Web_dom
module W = Wire
module U = I18n

let comments_area_ident = "logseq.class/Comments"

let is_comments_area = Comments_ops.is_comments_area
let comment_target_block_p = Comments_ops.comment_target_block_p
let eligible_targets = Comments_ops.eligible_targets
let can_comment = Comments_ops.can_comment

(* ---- write paths ---- *)

(* cljs reveal-comments-area!: scroll the area into view and focus its
   reply box *)
let reveal = Comments_ops.reveal

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

(* ---- view ---- *)

let editing_sig uuid =
  Signal.map
    (fun e ->
      match e with
      | Some e -> e.S.uuid = uuid
      | None -> false)
    (S.editing_sig ())

(* the shared edit surface — same logseq-editor mount as block rows;
   comment-area titles edit in the main scope *)
let title_editor_el uuid : t = Editor_surface.mount uuid "main"

(* cljs comments-area-title-view: the label swaps for the block editor
   while the area's title is being edited *)
let title_cell uuid (b : Model.block) : t =
 fun ctx parent ->
  (reactive
    (fun editing ->
      if editing then
        box ~key:("cte-" ^ uuid) ~style_class:"ls-comments-title-editor"
          [ title_editor_el uuid ]
      else
        (* data-area-uuid dropped — the direct on_press below covers the
           action; the delegated editor_keys lookup now no-ops *)
        Ui_components.button ~variant:`ghost ~key:("clab-" ^ uuid)
          ~style_class:"ls-comments-label"
          ~label:(U.t "editor/click-to-edit")
          ~text:(S.title_for uuid b.Model.block_title)
          ~on_press:(fun _ ->
            (* cljs edit-comments-area-title! → edit-block! on the area
               block; the standard editor machinery mounts the surface *)
            Editor_actions.enter_edit uuid 0)
          [])
    (Logseq_el.own ctx (editing_sig uuid)))
    ctx parent

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
          Ui_components.button ~key:("crd-" ^ uuid)
            ~style_class:"ls-comment-delete"
            ~variant:`ghost ~size:`icon
            ~label:(U.t "ui/delete")
            ~icon:(`app "trash")
            ~on_press:(fun _ -> Comments_ops.delete uuid)
            []
        ]
    ]

(* cljs comment-box: a bare textarea plus the send-button submit —
   reveal()/submit() still resolve the box by '.ls-comment-add textarea'
   and the textarea kind renders a real <textarea> *)
let add_box_body uuid ~input ~submit : t =
  box ~key:("caa-" ^ uuid) ~style_class:"ls-comment-add"
    [ box ~key:("cab-" ^ uuid) 
        [ box ~key:("cae-" ^ uuid) 
            [input]
        ; box ~key:("cax-" ^ uuid) 
            [ (* data-area-uuid dropped — direct on_press covers the
                 action; the delegated editor_keys lookup now no-ops *)
              Ui_components.button ~key:("cas-" ^ uuid)
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
      ~submit:(fun () -> Comments_ops.submit uuid) context parent
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
