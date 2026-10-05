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
module D = Web_dom
module W = Wire
module U = I18n

let dom = Logseq_dom.dom

let comments_area_ident = "logseq.class/Comments"
let comment_ident = "logseq.class/Comment"

let is_comments_area (b : Model.block) =
  List.mem comments_area_ident b.Model.block_tag_idents

external el_scroll_into_view : D.el -> unit = "scrollIntoView" [@@mel.send]

(* ---- write paths ---- *)

(* cljs reveal-comments-area!: scroll the area into view and focus its
   reply box *)
let reveal uuid =
  match D.get_element_by_id ("ls-block-" ^ uuid) with
  | Some blk -> (
      el_scroll_into_view blk;
      match
        Web_dom.query_selector
          ("#ls-block-" ^ uuid ^ " .ls-comment-add textarea")
      with
      | Some el -> D.el_focus el
      | None -> ())
  | None -> ()

(* cljs add-comment-to-blocks! → ensure-comments-area-for-blocks then
   reveal; the endpoint inserts the area child when it does not exist yet *)
let ensure_for uuids =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* area =
          Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
            (W.String repo)
            (W.List (List.map (fun u -> W.String u) uuids))
        in
        let* () = Outliner_ops.refresh_page () in
        (match W.map_get_uuid area "block/uuid" with
         | Some u -> reveal u
         | None -> ());
        Js.Promise.resolve ())

(* cljs add-comment-to-current-context!: an editing blank block becomes
   the comments area itself; otherwise ensure an area for the editing
   block or the current selection *)
let add_comment () =
  match S.editing () with
  | Some e when String.trim e.S.buffer = "" ->
      ignore
        (Outliner_ops.apply_and_refresh
           [ Outliner_ops.set_block_property e.S.uuid "block/tags"
               (W.Set [ W.Keyword comments_area_ident ])
           ])
  | _ -> (
      Editor_actions.exit_edit ~select:false;
      let uuids =
        match S.editing_uuid () with
        | Some u -> [ u ]
        | None -> (
            match Editor_actions.selected_uuids () with
            | [] -> (
                (* cmdk opens after the editor already blur-committed;
                   cljs still sees the edit block as the context *)
                match !(Editor_actions.last_edit_uuid) with
                | Some u -> [ u ]
                | None -> [])
            | sel -> sel)
      in
      match uuids with [] -> () | _ -> ensure_for uuids)

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
        [ dom ~key:("ctet-" ^ uuid) ~tag:"textarea"
            ~id:("edit-block-" ^ uuid) ~text:buffer [] ] ]

(* cljs comments-area-title-view: the label swaps for the block editor
   while the area's title is being edited *)
let title_cell uuid (b : Model.block) : t =
  dyn
    ~equal:(fun a b -> a = b)
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
    [ box ~key:("crm-" ^ uuid) ~style_class:"ls-comment-main"
        [ box ~key:("crmeta-" ^ uuid) ~style_class:"ls-comment-meta" []
        ; box ~key:("crb-" ^ uuid) ~style_class:"ls-comment-body"
            (Render.title (S.title_for uuid b.Model.block_title))
        ]
    ; box ~key:("cra-" ^ uuid) ~style_class:"ls-comment-actions"
        [ (* data-comment-uuid dropped — direct on_press covers the
             action; the delegated editor_keys lookup now no-ops *)
          button ~key:("crd-" ^ uuid)
            ~style_class:"ls-comment-action ls-comment-delete"
            ~variant:`ghost ~size:`icon
            ~label:(U.t "ui/delete")
            ~icon:`trash
            ~on_press:(fun _ -> delete uuid)
            []
        ]
    ]

(* cljs comment-box: a bare textarea plus the send-button submit —
   reveal()/submit() still resolve the box by '.ls-comment-add textarea'
   and the textarea kind renders a real <textarea> *)
let add_box uuid : t =
  box ~key:("caa-" ^ uuid) ~style_class:"ls-comment-add"
    [ box ~key:("cab-" ^ uuid) ~style_class:"ls-comment-box"
        [ box ~key:("cae-" ^ uuid) ~style_class:"ls-comment-box-editor"
            [ (* rows=1 dropped — no rows prop on the textarea kind *)
              textarea ~key:("cat-" ^ uuid)
                ~placeholder:(U.t "block.comments/placeholder")
                []
            ]
        ; box ~key:("cax-" ^ uuid) ~style_class:"ls-comment-box-actions"
            [ (* data-area-uuid dropped — direct on_press covers the
                 action; the delegated editor_keys lookup now no-ops *)
              button ~key:("cas-" ^ uuid)
                ~style_class:"ls-comment-submit"
                ~variant:`ghost ~size:`icon
                ~label:(U.t "ui/submit")
                ~icon:`send
                ~on_press:(fun _ -> submit uuid)
                []
            ]
        ]
    ]

(* cljs comments-area-view (expanded branch) *)
let area_view uuid (b : Model.block) : t =
  box ~key:("cav-" ^ uuid) ~style_class:"ls-comments-area"
    [ box ~key:("cah-" ^ uuid) ~style_class:"ls-comments-header"
        [ title_cell uuid b
        ; text ~key:("cac-" ^ uuid)
            ~style_class:"ls-comments-count"
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
