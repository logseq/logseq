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
module D = Web_dom
module I = I18n
module Ops = Outliner_ops



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
  match (Runtime.model ()).Model.repo with
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
  | [] -> Logseq_el.nothing
  | _ ->
      row ~key:("rx-" ^ uuid) ~style_class:"ls-block-reactions"
        (List.map
           (fun (emoji_id, count) ->
             button ~key:("rxb-" ^ uuid ^ "-" ^ emoji_id) ~label:emoji_id
               ~on_press:(fun _ -> toggle_reaction uuid emoji_id)
               [ Logseq_emoji.el
                   ~key:("rxe-" ^ uuid ^ "-" ^ emoji_id)
                   ~name:emoji_id ()
               ; text ~key:("rxc-" ^ uuid ^ "-" ^ emoji_id)
                   ~value:(string_of_int count) []
               ])
           rs)

let open_reaction_picker uuid (btn_id : string) =
  match D.query_selector ("[id='" ^ btn_id ^ "']") with
  | None -> ()
  | Some anchor ->
      Icon_picker.open_picker ~anchor ~del:false ~on_chosen:(fun c ->
          match c with
          | Icon_picker.Emoji e -> toggle_reaction uuid e
          | _ -> ())

(* -- comment row ---------------------------------------------------- *)

let comment_actions st (cuuid : string) : t =
  let btn key icn title action =
    button ~key
      ~label:title
      ~accessibility_identifier:key
      ~variant:`ghost ~size:`icon ~icon:icn
      ~on_press:(fun _ -> action ())
      []
  in
  row ~key:("ca-" ^ cuuid) ~style_class:"ls-comment-actions"
    [ btn ("cr-" ^ cuuid) (`app "mood-smile")
        (I.t "command.editor/add-reaction")
        (fun () -> open_reaction_picker cuuid ("cr-" ^ cuuid))
    ; btn ("ce-" ^ cuuid) `edit (I.t "editor/click-to-edit") (fun () ->
          Signal.set st { (Signal.get_state st) with editing = Some cuuid })
    ; btn ("cd-" ^ cuuid) `trash (I.t "ui/delete") (fun () ->
          delete_comment cuuid)
    ]

let comment_body st (c : Model.block) : t =
  let cuuid = Option.value c.Model.block_uuid ~default:"" in
  let st_v = Signal.get_state st in
  match st_v.editing with
  | Some e when e = cuuid ->
      (* Escape-cancel has no component equivalent — only Enter saves;
         clicking the edit action of another row exits the editor *)
      let latest = ref c.Model.block_title in
      box ~key:("cbx-" ^ cuuid) 
        [ textarea ~key:("cbte-" ^ cuuid)
            ~label:(I.t "block.comments/placeholder")
            ~text:c.Model.block_title
            ~submit_on_enter:true
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, s) -> latest := s
              | _ -> ())
            ~on_submit:(fun _ ->
              save_comment cuuid !latest;
              Signal.set st
                { (Signal.get_state st) with editing = None })
            []
        ]
  | _ ->
      box ~key:("cb-" ^ cuuid) 
        (Render.title c.Model.block_title @ [ reactions_el cuuid c.block_reactions ])

let comment_row st (c : Model.block) : t =
  let cuuid = Option.value c.Model.block_uuid ~default:"" in
  box ~key:("row-" ^ cuuid) ~style_class:"ls-comment-row"
    ~accessibility_identifier:("comment-" ^ cuuid)
    [ box ~key:("cm-" ^ cuuid) 
        [ box ~key:("cmx-" ^ cuuid)  []
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
      (* Escape-collapse has no component equivalent — the draft still
         persists via on_input so reopening restores it *)
      let latest = ref draft in
      [ textarea ~key:("cbta-" ^ area_uuid)
          ~placeholder:(I.t "block.comments/placeholder")
          ~label:(I.t "block.comments/placeholder")
          ~text:draft ~submit_on_enter:true
          ~on_input:(fun ev ->
            match ev with
            | Lui_protocol.TextChanged (_, s) ->
                latest := s;
                save_draft area_uuid s
            | _ -> ())
          ~on_submit:(fun _ -> submit_comment area_uuid !latest)
          []
      ]
    else
      [ Ui_parts.pressable
          ~on_press:(fun _ ->
            Signal.set st
              { (Signal.get_state st) with box_open = true })
          (box ~key:("cbrp-" ^ area_uuid)
             ~style_class:"ls-comment-reply-placeholder"
             [ text ~key:("cbrpt-" ^ area_uuid) ~value:draft [] ])
      ]
  in
  box ~key:("cadd-" ^ area_uuid) ~style_class:"ls-comment-add"
    [ box ~key:("cbox-" ^ area_uuid) 
        ( inner
        @ [ box ~key:("cbact-" ^ area_uuid)
              [ button ~key:("cbsub-" ^ area_uuid)
                  ~style_class:"ls-comment-submit"
                  ~label:(I.t "ui/submit")
                  ~variant:`ghost ~size:`icon ~icon:`send
                  ~on_press:(fun _ ->
                    submit_comment area_uuid (load_draft area_uuid))
                  []
              ]
          ] )
    ]

(* -- area ----------------------------------------------------------- *)

let header st (area_uuid : string) (count : int) (targets : int) : t =
  row ~key:("ch-" ^ area_uuid) 
    ( [ reactive
          (fun editing ->
            (* cljs comments-area-title-view: the label swaps for the
               standard block editor while the area title is edited —
               the subtree shape changes, so reactive stays *)
            if editing then
              box ~key:("cte-" ^ area_uuid)
                ~style_class:"ls-comments-title-editor"
                [ Comments.title_editor_el area_uuid ]
            else
              button ~key:("cl-" ^ area_uuid)
                ~style_class:"ls-comments-label"
                ~label:(I.t "editor/click-to-edit")
                ~variant:`ghost
                ~on_press:(fun _ ->
                  (* cljs edit-comments-area-title! → edit-block! *)
                  Editor_actions.enter_edit area_uuid 0)
                [ text ~key:("clt-" ^ area_uuid)
                    ~value:(I.t "block.comments/label") [] ])
          (Comments.editing_sig area_uuid)
      ; text ~key:("cc-" ^ area_uuid)
          ~value:(string_of_int count) []
      ]
    @
    if targets > 1 then
      [ button ~key:("ct-" ^ area_uuid)
          ~label:(I.t "block.comments/on-those-blocks")
          ~variant:`ghost
          ~text:(I.t "block.comments/on-those-blocks")
          ~on_press:(fun _ ->
            let v = Signal.get_state st in
            Signal.set st { v with targets_open = not v.targets_open })
          []
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
  (reactive
     (fun _st ->
       column ~key:("area-" ^ area_uuid)
         ~style_class:"ls-comments-area"
         ~accessibility_identifier:("area-" ^ area_uuid)
         [ header st area_uuid (List.length comments)
             b.Model.block_comment_targets
         ; (if (Signal.get_state st).targets_open
               && b.Model.block_comment_targets > 1
            then
              box ~key:("cts-" ^ area_uuid)
                 []
            else box ~key:("cts0-" ^ area_uuid) [])
         ; (match comments with
            | [] -> box ~key:("cl0-" ^ area_uuid) []
            | _ ->
                column ~key:("cl-" ^ area_uuid)
                  ~style_class:"ls-comments-list"
                  (List.map (comment_row st) comments))
         ; add_box st area_uuid
         ])
     (Signal.value st))
    ctx parent
