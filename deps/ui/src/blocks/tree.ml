(* Block tree rendering — mirrors components/block.cljs outline structure:

   .ls-block [id=ls-block-<uuid> blockid containerid data-block-title
              data-block-format haschild data-collapsed level]
     .block-main-container
       .block-control-wrap
         a.block-control#control-<uuid> > span.control-show|control-hide
         a.bullet-link-wrap > span.bullet-container#dot-<uuid>[.bullet-closed]
           > span.bullet
       .block-content-or-editor-wrap
         .block-content-or-editor-inner
           .block-row
             .block-content-wrapper
               .block-content#block-content-<uuid>  |  .editor-wrapper textarea
     .block-children-container
       .block-children-left-border
       .block-children > .ls-block*

   Reactivity (view runs once): the editing/selected/collapsed sets live in
   Editor_state's signal; each row derives its class/attrs/branch from it via
   style_class_signal, attrs_signal_v, dyn and if_. *)

open Lui_elements

module S = Editor_state

let dom = Logseq_dom.dom

let block_key (b : Model.block) =
  match b.block_uuid with
  | Some u -> u
  | None -> "block-" ^ string_of_int (Option.value b.block_db_id ~default:0)

(* -- per-row signals -- *)

let row_class_sig uuid blank embed =
  Logseq_dom.class_signal (S.signal ()) (fun (st : S.t) ->
      "ls-block swipe-item"
      ^ (if S.String_set.mem uuid st.selected then " selected" else "")
      ^ (if embed then " embed-block" else "")
      ^ if blank then " is-blank" else "")

let row_attrs_sig uuid (b : Model.block) =
  let has_children = S.children_of b <> [] in
  let embed = b.Model.block_link <> None in
  Logseq_dom.attrs_signal (S.signal ()) (fun (st : S.t) ->
      [ ("id", "ls-block-" ^ uuid)
      ; ("blockid", uuid)
      ; ("containerid", uuid)
      ; ("data-block-title", b.block_title)
      ; ("data-block-format", "markdown")
      ; ("haschild", string_of_bool has_children)
      ; ( "data-collapsed"
        , string_of_bool (S.String_set.mem uuid st.collapsed) )
      ; ("level", string_of_int b.block_level)
      ]
      (* cljs sets blockid to the linked entity's uuid and
         originalblockid to the linking block's — we keep blockid as the
         embed block's own uuid so delegated editing/ops resolve it *)
      @ if embed then
          [ ("originalblockid", uuid); ("data-embed", "true") ]
        else [])

let collapsed_sig uuid =
  Signal.map
    (fun (st : S.t) -> S.String_set.mem uuid st.collapsed)
    (S.signal ())

(* -- control wrap: collapse arrow + bullet -- *)

let control_wrap uuid : t =
  dom ~key:("ctrlw-" ^ uuid)
    ~style_class:"block-control-wrap flex flex-row items-center h-6"
    [ dom ~key:("ctrl-" ^ uuid) ~tag:"a" ~style_class:"block-control"
        ~id:("control-" ^ uuid)
        [ dom ~key:("ctrlspan-" ^ uuid) ~tag:"span"
            ~style_class_signal:
              (Logseq_dom.class_signal (collapsed_sig uuid)
                 (fun c -> if c then "control-show" else "control-hide"))
            []
        ]
    ; dom ~key:("blw-" ^ uuid) ~tag:"a" ~style_class:"bullet-link-wrap"
        [ dom ~key:("dotw-" ^ uuid) ~tag:"span"
            ~id:("dot-" ^ uuid)
            ~attrs:[ ("blockid", uuid) ]
            ~style_class_signal:
              (Logseq_dom.class_signal (collapsed_sig uuid) (fun c ->
                   "bullet-container cursor-pointer"
                   ^ if c then " bullet-closed" else ""))
            [ dom ~key:("b-" ^ uuid) ~tag:"span" ~style_class:"bullet"
                ~attrs:[ ("blockid", uuid) ] []
            ]
        ]
    ]

(* -- content vs editor -- *)

let editing_sig uuid =
  Signal.map
    (fun (st : S.t) ->
      match st.editing with
      | Some e -> e.uuid = uuid
      | None -> false)
    (S.signal ())

let content_el uuid (b : Model.block) : t =
  dom ~key:("content-" ^ uuid) ~style_class:"block-content inline"
    ~style_class_signal:
      (Logseq_dom.class_signal
         (editing_sig uuid)
         (fun editing ->
           (* cljs keeps .block-content mounted (hidden) while editing, so
              e2e's .block-title-wrap contents still read the title *)
           "block-content inline" ^ if editing then " hidden" else ""))
    ~id:("block-content-" ^ uuid)
    ~attrs:[ ("blockid", uuid); ("containerid", uuid) ]
    [ dom ~key:("bci-" ^ uuid)
        ~style_class:"block-content-inner flex flex-row justify-between"
        [ dom ~key:("bh-" ^ uuid) ~style_class:"block-head-wrap"
            (Render.title b.block_title)
        ]
    ]

let editor_el uuid : t =
  let buffer =
    match S.editing () with
    | Some e when e.uuid = uuid -> e.buffer
    | _ -> ""
  in
  (* textarea text must track the buffer: e2e asserts
     .editor-wrapper textarea :has-text, which reads textContent *)
  let buffer_sig =
    Signal.map
      (fun (st : S.t) ->
        match st.S.editing with
        | Some e when e.uuid = uuid -> Lui_protocol.StringValue e.buffer
        | _ -> Lui_protocol.StringValue "")
      (S.signal ())
  in
  dom ~key:("ew-" ^ uuid) ~style_class:"editor-wrapper flex flex-1 w-full"
    ~id:("editor-edit-block-" ^ uuid)
    [ dom ~key:("ei-" ^ uuid)
        ~style_class:"editor-inner flex flex-1 block-editor"
        [ dom ~key:("ta-" ^ uuid) ~tag:"textarea"
            ~id:("edit-block-" ^ uuid)
            ~attrs:[ ("data-testid", "block editor") ]
            ~text:buffer ~text_signal:buffer_sig []
        ]
    ]

let content_or_editor uuid (b : Model.block) : t =
 fun context parent ->
  let node = (content_el uuid b) context parent in
  (* cljs removes the editor entirely in normal mode (e2e asserts the
     textarea is absent) but keeps .block-content mounted hidden *)
  ignore ((if_ ~test:(editing_sig uuid) (editor_el uuid)) context parent);
  node

(* -- row -- *)

(* module init runs at app load (page.ml references block_row): install
   the document listeners and the add-button observer even for pages with
   zero blocks, where block_row is never mounted *)
let () =
  Editor_keys.install_once ();
  Add_button.install ()

let rec block_row (b : Model.block) : t =
 fun ctx parent ->
  S.ensure ctx;
  (row_el b) ctx parent

and row_el (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = S.children_of b <> [] in
  let blank = String.trim b.block_title = "" in
  dom ~key:("ls-" ^ key)
    ~style_class_signal:(row_class_sig uuid blank embed)
    ~attrs_signal_v:(row_attrs_sig uuid b)
    [ dom ~key:("main-" ^ key)
        ~style_class:"block-main-container flex flex-row gap-1"
        [ control_wrap uuid
        ; dom ~key:("col-" ^ key) ~style_class:"flex flex-col w-full"
            [ dom ~key:("bmc-" ^ key)
                ~style_class:"block-main-content flex flex-row gap-2"
                [ dom ~key:("cew-" ^ key)
                    ~style_class:"block-content-or-editor-wrap flex flex-1"
                    [ dom ~key:("cei-" ^ key)
                        ~style_class:"block-content-or-editor-inner"
                        [ dom ~key:("row-" ^ key)
                            ~style_class:
                              "block-row flex flex-1 flex-row gap-1 \
                               items-center"
                            [ dom ~key:("cw-" ^ key)
                                ~style_class:
                                  "block-content-wrapper flex flex-1 w-full"
                                [ content_or_editor uuid b ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ; (if has_children then children_el uuid b else box ~key:("nc-" ^ key) [])
    ]

and children_el uuid (b : Model.block) : t =
  if_
    ~test:(Signal.map (fun c -> not c) (collapsed_sig uuid))
    (dom ~key:("children-" ^ uuid)
       ~style_class:"block-children-container flex"
       [ dom ~key:("border-" ^ uuid)
           ~style_class:"block-children-left-border"
           ~attrs:[ ("blockid", uuid) ] []
       ; dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
           (List.map block_row (S.children_of b))
       ])
