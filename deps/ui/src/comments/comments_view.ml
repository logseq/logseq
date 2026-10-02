(* .ls-comments-area — mirrors components/block/comments.cljs:

   .ls-comments-area
     .ls-comments-header
       button.ls-comments-label[title='Click to edit'] + .ls-comments-count
       + button.ls-comments-targets-toggle ("On those blocks", >1 targets)
     .ls-comments-targets (when expanded)
     .ls-comments-list > .ls-comment-row*
       .ls-comment-main > .ls-comment-meta + .ls-comment-body
         (text | edit textarea) + .ls-block-reactions
       .ls-comment-actions > buttons 'Add reaction'|'Click to edit'|'Delete'
     .ls-comment-add > .ls-comment-box
       (textarea | .ls-comment-reply-placeholder) + .ls-comment-box-actions
       > button.ls-comment-submit

   Draft lives in localStorage "comments-<area-uuid>-draft"; Esc exits the
   box to the placeholder, Enter (no shift) or .ls-comment-submit saves. *)

open Promise_ext
open Lui_elements
module D = struct include Editor_dom include Properties_dom end
module E = Editor_dom
module I = I18n
module Ops = Outliner_ops

let dom = Logseq_dom.dom

type area_st =
  { box_open : bool
  ; targets_open : bool
  ; editing : string option (* comment uuid under edit *)
  }

let draft_key area_uuid = "comments-" ^ area_uuid ^ "-draft"

let load_draft area_uuid =
  Option.value
    (Platform.local_storage_get (draft_key area_uuid))
    ~default:""

let save_draft area_uuid (v : string) =
  Platform.local_storage_set (draft_key area_uuid) v

let clear_draft area_uuid = save_draft area_uuid ""

(* insert-comment! — child block of the area tagged logseq.class/Comment *)
let submit_comment area_uuid (text : string) =
  let title = String.trim text in
  if title <> "" then (
    let uuid = Platform.random_uuid () in
    let block =
      Wire.Map
        [ (Wire.String "block/uuid", Wire.Uuid uuid)
        ; (Wire.String "block/title", Wire.String title)
        ; ( Wire.String "block/tags"
          , Wire.Set [ Wire.Keyword "logseq.class/Comment" ] )
        ]
    in
    clear_draft area_uuid;
    ignore
      (Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks")
         [ Ops.insert_blocks [ block ] area_uuid ~sibling:false ]))

let save_comment cuuid (text : string) =
  ignore
    (let* sop = Ops.save_block_parsed cuuid (String.trim text) in
     Ops.apply_and_refresh [ sop ])

let delete_comment cuuid =
  match !Runtime.current_repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* _ =
          Runtime.invoke2 "thread-api/delete-comment" (Wire.String repo)
            (Wire.Uuid cuuid)
        in
        Ops.refresh_page ())

let toggle_reaction uuid emoji_id =
  ignore
    (Ops.apply_and_refresh
       [ Ops.op "toggle-reaction"
           [ Wire.Uuid uuid; Wire.String emoji_id; Wire.Nil ]
       ])

(* shared reaction chips row — used by both block rows and comment rows *)
let reactions_el uuid (rs : (string * int) list) : t =
  match rs with
  | [] -> Logseq_dom.nothing
  | _ ->
      dom ~key:("rx-" ^ uuid) ~style_class:"ls-block-reactions"
        (List.map
           (fun (emoji_id, count) ->
             dom ~key:("rxb-" ^ uuid ^ "-" ^ emoji_id) ~tag:"button"
               ~style_class:"ls-reaction"
               ~events:"click"
               ~on_dom_event:(fun _ _ -> toggle_reaction uuid emoji_id)
               [ dom ~key:("rxe-" ^ uuid ^ "-" ^ emoji_id) ~tag:"em-emoji"
                   ~attrs:[ ("id", emoji_id) ] []
               ; dom ~key:("rxc-" ^ uuid ^ "-" ^ emoji_id) ~tag:"span"
                   ~text:(string_of_int count) []
               ])
           rs)

let open_reaction_picker uuid (btn_id : string) =
  match D.doc_query ("[id='" ^ btn_id ^ "']") with
  | None -> ()
  | Some anchor ->
      Icon_picker.open_picker ~anchor ~del:false ~on_chosen:(fun c ->
          match c with
          | Icon_picker.Emoji e -> toggle_reaction uuid e
          | _ -> ())

(* -- comment row ---------------------------------------------------- *)

let comment_actions st (cuuid : string) : t =
  let btn key icon title action =
    dom ~key ~tag:"button"
      ~style_class:"ls-comment-action"
      ~attrs:
        [ ("title", title); ("aria-label", title); ("type", "button")
        ; ("id", key); ("style", "pointer-events:auto") ]
      ~events:"click" ~on_dom_event:(fun _ _ -> action ())
      [ dom ~key:(key ^ "-i") ~tag:"i" ~style_class:("ti ti-" ^ icon) [] ]
  in
  dom ~key:("ca-" ^ cuuid) ~style_class:"ls-comment-actions"
    [ btn ("cr-" ^ cuuid) "mood-smile" (I.t "command.editor/add-reaction")
        (fun () -> open_reaction_picker cuuid ("cr-" ^ cuuid))
    ; btn ("ce-" ^ cuuid) "edit" (I.t "editor/click-to-edit") (fun () ->
          Signal.set st { (Signal.get_state st) with editing = Some cuuid })
    ; btn ("cd-" ^ cuuid) "trash" (I.t "ui/delete") (fun () ->
          delete_comment cuuid)
    ]

let comment_body st (c : Model.block) : t =
  let cuuid = Option.value c.Model.block_uuid ~default:"" in
  let st_v = Signal.get_state st in
  match st_v.editing with
  | Some e when e = cuuid ->
      dom ~key:("cbx-" ^ cuuid) ~style_class:"ls-comment-box-editor"
        [ dom ~key:("cbte-" ^ cuuid) ~tag:"textarea"
            ~attrs:[ ("aria-label", I.t "block.comments/placeholder") ]
            ~text:c.Model.block_title ~events:"keydown"
            ~on_dom_event:(fun _ payload ->
              let key = Platform.payload_str payload "key" in
              let shift = Platform.payload_bool payload "shiftKey" in
              let v = Platform.payload_str payload "value" in
              match key with
              | "Escape" ->
                  Signal.set st
                    { (Signal.get_state st) with editing = None }
              | "Enter" when not shift ->
                  save_comment cuuid v;
                  Signal.set st
                    { (Signal.get_state st) with editing = None }
              | _ -> ())
            []
        ]
  | _ ->
      dom ~key:("cb-" ^ cuuid) ~style_class:"ls-comment-body"
        (Render.title c.Model.block_title @ [ reactions_el cuuid c.block_reactions ])

let comment_row st (c : Model.block) : t =
  let cuuid = Option.value c.Model.block_uuid ~default:"" in
  dom ~key:("row-" ^ cuuid) ~style_class:"ls-comment-row"
    ~attrs:[ ("data-comment-uuid", cuuid) ]
    [ dom ~key:("cm-" ^ cuuid) ~style_class:"ls-comment-main"
        [ dom ~key:("cmx-" ^ cuuid) ~style_class:"ls-comment-meta" []
        ; comment_body st c
        ]
    ; comment_actions st cuuid
    ]

(* -- add-comment box ------------------------------------------------ *)

let add_box st (area_uuid : string) : t =
  let draft = load_draft area_uuid in
  let open_ = (Signal.get_state st).box_open || draft = "" in
  let inner =
    if open_ then
      [ dom ~key:("cbta-" ^ area_uuid) ~tag:"textarea"
          ~attrs:
            [ ("placeholder", I.t "block.comments/placeholder")
            ; ("aria-label", I.t "block.comments/placeholder") ]
          ~text:draft ~events:"input keydown"
          ~on_dom_event:(fun name payload ->
            match name with
            | "input" ->
                save_draft area_uuid (Platform.payload_str payload "value")
            | "keydown" -> (
                let key = Platform.payload_str payload "key" in
                let shift = Platform.payload_bool payload "shiftKey" in
                let v = Platform.payload_str payload "value" in
                match key with
                | "Escape" ->
                    save_draft area_uuid v;
                    Signal.set st
                      { (Signal.get_state st) with box_open = false }
                | "Enter" when not shift -> submit_comment area_uuid v
                | _ -> ())
            | _ -> ())
          []
      ]
    else
      [ dom ~key:("cbrp-" ^ area_uuid)
          ~style_class:"ls-comment-reply-placeholder"
          ~attrs:[ ("role", "button"); ("tabindex", "0") ]
          ~text:draft ~events:"click"
          ~on_dom_event:(fun _ _ ->
            Signal.set st
              { (Signal.get_state st) with box_open = true })
          []
      ]
  in
  dom ~key:("cadd-" ^ area_uuid) ~style_class:"ls-comment-add"
    [ dom ~key:("cbox-" ^ area_uuid) ~style_class:"ls-comment-box"
        ( inner
        @ [ dom ~key:("cbact-" ^ area_uuid)
              ~style_class:"ls-comment-box-actions"
              [ dom ~key:("cbsub-" ^ area_uuid) ~tag:"button"
                  ~style_class:"ls-comment-submit"
                  ~attrs:
                    [ ("title", I.t "ui/submit")
                    ; ("aria-label", I.t "ui/submit")
                    ; ("type", "button") ]
                  ~events:"click"
                  ~on_dom_event:(fun _ _ ->
                    submit_comment area_uuid (load_draft area_uuid))
                  [ dom ~key:("cbsi-" ^ area_uuid) ~tag:"i"
                      ~style_class:"ti ti-send" []
                  ]
              ]
          ] )
    ]

(* -- area ----------------------------------------------------------- *)

let header st (area_uuid : string) (count : int) (targets : int) : t =
  dom ~key:("ch-" ^ area_uuid) ~style_class:"ls-comments-header"
    ( [ dyn
          ~equal:(fun a b -> a = b)
          (fun editing ->
            (* cljs comments-area-title-view: the label swaps for the
               standard block editor while the area title is edited *)
            if editing then
              dom ~key:("cte-" ^ area_uuid)
                ~style_class:"ls-comments-title-editor"
                [ Comments.title_editor_el area_uuid ]
            else
              dom ~key:("cl-" ^ area_uuid) ~tag:"button"
                ~style_class:"ls-comments-label"
                ~attrs:
                  [ ("title", I.t "editor/click-to-edit")
                  ; ("aria-label", I.t "editor/click-to-edit")
                  ; ("type", "button") ]
                ~events:"click"
                ~on_dom_event:(fun _ _ ->
                  (* cljs edit-comments-area-title! → edit-block! *)
                  Editor_actions.enter_edit area_uuid 0)
                ~text:(I.t "block.comments/label") [])
          (Comments.editing_sig area_uuid)
      ; dom ~key:("cc-" ^ area_uuid) ~tag:"span"
          ~style_class:"ls-comments-count"
          ~text:(string_of_int count) []
      ]
    @
    if targets > 1 then
      [ dom ~key:("ct-" ^ area_uuid) ~tag:"button"
          ~style_class:"ls-comments-targets-toggle"
          ~attrs:[ ("type", "button") ] ~events:"click"
          ~on_dom_event:(fun _ _ ->
            let v = Signal.get_state st in
            Signal.set st { v with targets_open = not v.targets_open })
          ~text:(I.t "block.comments/on-those-blocks") []
      ]
    else [] )

let area_el (b : Model.block) : t =
 fun ctx parent ->
  let st =
    Signal.state ctx.Lui_ui.ui_scheduler
      { box_open = true; targets_open = false; editing = None }
  in
  let area_uuid = Option.value b.Model.block_uuid ~default:"" in
  let comments =
    List.filter (fun c -> c.Model.block_is_comment) b.Model.block_children
  in
  (dyn ~equal:(fun (a : area_st) b -> a = b)
     (fun _st ->
       dom ~key:("area-" ^ area_uuid)
         ~style_class:"ls-comments-area"
         ~attrs:[ ("data-area-uuid", area_uuid) ]
         [ header st area_uuid (List.length comments)
             b.Model.block_comment_targets
         ; (if (Signal.get_state st).targets_open
               && b.Model.block_comment_targets > 1
            then
              dom ~key:("cts-" ^ area_uuid)
                ~style_class:"ls-comments-targets" []
            else box ~key:("cts0-" ^ area_uuid) [])
         ; (match comments with
            | [] -> box ~key:("cl0-" ^ area_uuid) []
            | _ ->
                dom ~key:("cl-" ^ area_uuid)
                  ~style_class:"ls-comments-list"
                  (List.map (comment_row st) comments))
         ; add_box st area_uuid
         ])
     (Signal.value st))
    ctx parent
