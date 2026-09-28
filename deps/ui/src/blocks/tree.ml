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

(* effective collapse for a block: persisted set || view default, minus
   the explicit user-expand override — same rule as Editor_state's
   effective_collapsed, expressed on the signal value *)
let effective_collapsed_st uuid default (st : S.t) =
  if S.String_set.mem uuid st.expanded then false
  else S.String_set.mem uuid st.collapsed || default

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
        , string_of_bool
            (effective_collapsed_st uuid b.block_default_collapsed st) )
      ; ("level", string_of_int b.block_level)
      ]
      (* cljs sets blockid to the linked entity's uuid and
         originalblockid to the linking block's — we keep blockid as the
         embed block's own uuid so delegated editing/ops resolve it *)
      @ if embed then
          [ ("originalblockid", uuid); ("data-embed", "true") ]
        else [])

let collapsed_sig (b : Model.block) =
  let uuid = Option.value b.block_uuid ~default:"" in
  Signal.map (effective_collapsed_st uuid b.block_default_collapsed)
    (S.signal ())

(* -- control wrap: collapse arrow + bullet -- *)

(* cljs block-control-icon-size: heading chrome sizes differ, collapsed
   bullets shrink *)
let control_wrap uuid (b : Model.block) : t =
  let heading_attrs =
    ( "data-has-children"
    , string_of_bool (b.block_children <> []) )
    ::
    (match b.block_heading with
    | Some lvl ->
        let size =
          match lvl with 1 -> 28 | 2 -> 24 | 3 -> 20 | 4 -> 16
          | 5 -> 13 | 6 -> 12 | _ -> 14
        in
        [ ("data-heading", string_of_int lvl)
        ; ("style", "--ls-block-icon-size:" ^ string_of_int size ^ "px") ]
    | None -> [])
  in
  dom ~key:("ctrlw-" ^ uuid)
    ~style_class:"block-control-wrap flex flex-row items-center h-6"
    ~attrs:heading_attrs
    [ dom ~key:("ctrl-" ^ uuid) ~tag:"a" ~style_class:"block-control"
        ~id:("control-" ^ uuid)
        [ dom ~key:("ctrlspan-" ^ uuid) ~tag:"span"
            ~style_class_signal:
              (Logseq_dom.class_signal (collapsed_sig b)
                 (fun c -> if c then "control-show" else "control-hide"))
            []
        ]
    ; dom ~key:("blw-" ^ uuid) ~tag:"a" ~style_class:"bullet-link-wrap"
        [ dom ~key:("dotw-" ^ uuid) ~tag:"span"
            ~id:("dot-" ^ uuid)
            ~attrs:[ ("blockid", uuid); ("draggable", "true") ]
            ~style_class_signal:
              (Logseq_dom.class_signal (collapsed_sig b) (fun c ->
                   "bullet-container cursor-pointer"
                   ^ if c then " bullet-closed" else ""))
            [ dom ~key:("b-" ^ uuid) ~tag:"span" ~style_class:"bullet"
                ~attrs:[ ("blockid", uuid) ] []
            ]
        ]
    ]

(* -- content vs editor -- *)

let content_el uuid (b : Model.block) : t =
  (* style width:100% — cljs parity (block.cljs): gives the inline element a
     nonzero box so empty blocks stay clickable *)
  dom ~key:("content-" ^ uuid) ~style_class:"block-content inline"
    ~id:("block-content-" ^ uuid)
    ~attrs:
      [ ("blockid", uuid); ("containerid", uuid); ("style", "width:100%") ]
    [ dom ~key:("bci-" ^ uuid)
        ~style_class:"block-content-inner flex flex-row justify-between"
        [ dom ~key:("bh-" ^ uuid) ~style_class:"block-head-wrap"
            (Render.title ?heading:b.block_heading ~self:uuid
               (S.title_for uuid b.block_title))
        ]
    ]

let editor_el uuid scope : t =
  let buffer =
    match S.editing () with
    | Some e when e.uuid = uuid && e.scope = scope -> e.buffer
    | _ -> ""
  in
  (* textarea text must track the buffer: e2e asserts
     .editor-wrapper textarea :has-text, which reads textContent *)
  let buffer_sig =
    Signal.map
      (fun (st : S.t) ->
        match st.S.editing with
        | Some e when e.uuid = uuid && e.scope = scope ->
            Lui_protocol.StringValue e.buffer
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
        ; (* cljs mock-textarea: hidden caret mirror for popup placement *)
          dom ~key:("mt-" ^ uuid) ~style_class:"mock-text"
            ~attrs:
              [ ( "style"
                , "width:100%;height:100%;position:absolute;visibility:hidden;top:0;left:0" )
              ]
            []
        ]
    ; Asset_dom.upload_input ("up-" ^ uuid)
    ]

let content_or_editor uuid scope (b : Model.block) : t =
  (* cljs unmounts .block-content while editing and removes the editor
     entirely in normal mode — .block-title-wrap must be absent for the
     edited block or e2e counts a stale title *)
  dyn ~equal:(fun a b -> a = b)
    (fun editing ->
      match b.Model.block_asset_type with
      | Some _ ->
          (* asset blocks keep the media visible while the block is being
             edited (cljs renders content + editor inside the same wrap) *)
          if editing then
            dom ~key:("ae-" ^ uuid) ~style_class:"flex flex-col w-full"
              [ Asset_dom.block_view uuid b; editor_el uuid scope ]
          else Asset_dom.block_view uuid b
      | None -> if editing then editor_el uuid scope else content_el uuid b)
    (Signal.map
       (fun (st : S.t) ->
         match st.editing with
         | Some e -> e.uuid = uuid && e.scope = scope
         | None -> false)
       (S.signal ()))

(* -- tags chips (components/block.cljs tags-cp): sibling of the content
   wrapper so they stay visible while the block is being edited. Tags that
   still appear inline in the title ("#tag") are skipped — they render in
   the title itself. -- *)

let contains_sub hay needle =
  let n = String.length hay and m = String.length needle in
  let rec go i =
    i + m <= n && (String.sub hay i m = needle || go (i + 1))
  in
  go 0

let tags_el uuid (b : Model.block) : t =
  let pairs =
    try List.combine b.block_tags b.block_tag_uuids
    with Invalid_argument _ -> List.map (fun t -> (t, "")) b.block_tags
  in
  let visible =
    List.filter_map
      (fun (tag, tuuid) ->
        (* cljs inline-tag? drops tags that already appear inline in the
           raw title, as "#name" or "#[[uuid]]" *)
        let inline =
          contains_sub b.block_title ("#" ^ tag)
          || (tuuid <> "" && contains_sub b.block_title tuuid)
        in
        if inline then None else Some tag)
      pairs
  in
  match visible with
  | [] -> box ~key:("tags-" ^ uuid) []
  | tags ->
      dom ~key:("tags-" ^ uuid) ~style_class:"block-tags gap-1"
        (List.mapi
           (fun i tag ->
             dom ~key:("tag-" ^ uuid ^ "-" ^ string_of_int i)
               ~style_class:"block-tag"
               [ dom ~key:("ta-" ^ uuid ^ "-" ^ string_of_int i) ~tag:"a"
                   ~style_class:"tag" ~text:tag []
               ])
           tags)

(* -- row -- *)

(* module init runs at app load (page.ml references block_row): install
   the document listeners and the add-button observer even for pages with
   zero blocks, where block_row is never mounted *)
let () =
  Editor_keys.install_once ();
  Add_button.install ();
  Asset_dom.install ()

let rec block_row ?(scope = "main") (b : Model.block) : t =
 fun ctx parent ->
  S.ensure ctx;
  (row_el scope b) ctx parent

and row_el scope (b : Model.block) : t =
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
        ~attrs:
          (match b.block_heading with
           | Some lvl -> [ ("data-has-heading", string_of_int lvl) ]
           | None -> [])
        [ control_wrap uuid b
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
                                [ content_or_editor uuid scope b ]
                            ; tags_el uuid b
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ; (if has_children then children_el uuid scope b else box ~key:("nc-" ^ key) [])
    ]

and children_el uuid scope (b : Model.block) : t =
  if_
    ~test:(Signal.map (fun c -> not c) (collapsed_sig b))
    (dom ~key:("children-" ^ uuid)
       ~style_class:"block-children-container flex"
       [ dom ~key:("border-" ^ uuid)
           ~style_class:"block-children-left-border"
           ~attrs:[ ("blockid", uuid) ] []
       ; dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
           (List.map (block_row ~scope) (S.children_of b))
       ])

(* Read-only row for linked-reference lists: same shell as row_el but the
   content never swaps to editor_el — a block shown in .references can
   simultaneously be under edit in its own page, and a second
   #edit-block-<uuid> textarea breaks locators. *)
and block_row_static (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = b.block_children <> [] in
  let blank = String.trim b.block_title = "" in
  dom ~key:("ls-" ^ key)
    ~style_class_signal:(row_class_sig uuid blank embed)
    ~attrs_signal_v:(row_attrs_sig uuid b)
    [ dom ~key:("main-" ^ key)
        ~style_class:"block-main-container flex flex-row gap-1"
        [ control_wrap uuid b
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
                                [ content_el uuid b ]
                            ; tags_el uuid b
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ; (if has_children then children_static_el uuid b
       else box ~key:("nc-" ^ key) [])
    ]

and children_static_el uuid (b : Model.block) : t =
  dom ~key:("children-" ^ uuid)
    ~style_class:"block-children-container flex"
    [ dom ~key:("border-" ^ uuid)
        ~style_class:"block-children-left-border"
        ~attrs:[ ("blockid", uuid) ] []
    ; dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
        (List.map block_row_static b.block_children)
    ]
