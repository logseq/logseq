(* Comment thread areas — cljs components/block/comments.cljs +
   handler/comments.cljs.

   A block tagged logseq.class/Comments renders .ls-comments-area in place
   of the normal content row; its child blocks render as .ls-comment-row
   inside .ls-comments-list. Title editing reuses the standard
   editor surface so the delegated key/input/save machinery in
   Editor_keys/Editor_actions applies unchanged. *)

open Promise_ext
open Lui_elements

module S = Editor_state
module D = Web_dom
module W = Wire
module U = I18n

let comments_area_ident = "logseq.class/Comments"

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
               block; the standard editor machinery mounts the surface *)
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
            ~icon:`trash
            ~on_press:(fun _ -> Comments_ops.delete uuid)
            []
        ]
    ]

(* cljs comment-box: a bare textarea plus the send-button submit —
   reveal()/submit() still resolve the box by '.ls-comment-add textarea'
   and the textarea kind renders a real <textarea> *)
let add_box uuid : t =
  box ~key:("caa-" ^ uuid) ~style_class:"ls-comment-add"
    [ box ~key:("cab-" ^ uuid) 
        [ box ~key:("cae-" ^ uuid) 
            [ (* rows=1 dropped — no rows prop on the textarea kind *)
              textarea ~key:("cat-" ^ uuid)
                ~placeholder:(U.t "block.comments/placeholder")
                []
            ]
        ; box ~key:("cax-" ^ uuid) 
            [ (* data-area-uuid dropped — direct on_press covers the
                 action; the delegated editor_keys lookup now no-ops *)
              button ~key:("cas-" ^ uuid)
                ~style_class:"ls-comment-submit"
                ~variant:`ghost ~size:`icon
                ~label:(U.t "ui/submit")
                ~icon:`send
                ~on_press:(fun _ -> Comments_ops.submit uuid)
                []
            ]
        ]
    ]

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
