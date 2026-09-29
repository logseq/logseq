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


(* cljs ldb/private-tags: built-in classes hidden/locked for direct use;
   internal idents are already filtered out upstream *)
let private_tag_ident (ident : string) : bool =
  List.mem ident
    [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
      "logseq.class/Asset"; "logseq.class/Journal";
      "logseq.class/Whiteboard"; "logseq.class/Pdf-annotation" ]

(* cljs block-control-icon-size: heading chrome sizes differ, collapsed
   bullets shrink *)
let control_wrap uuid (b : Model.block) : t =
  let order_list = b.Model.block_order_list = Some "number" in
  let bullet_cls =
    "bullet-container cursor"
    ^ if order_list then " as-order-list typed-list" else ""
  in
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
            [ dom ~key:("ra-" ^ uuid) ~tag:"span"
                ~style_class_signal:
                  (Logseq_dom.class_signal (collapsed_sig b)
                     (fun c ->
                       "rotating-arrow"
                       ^ if c then " collapsed" else " not-collapsed"))
                [ Ui_parts.rotating_arrow ("arw-" ^ uuid) ]
            ]
        ]
    ; dom ~key:("blw-" ^ uuid) ~tag:"a" ~style_class:"bullet-link-wrap"
        [ dom ~key:("dotw-" ^ uuid) ~tag:"span"
            ~id:("dot-" ^ uuid)
            ~attrs:[ ("blockid", uuid); ("draggable", "true") ]
            ~style_class_signal:
              (Logseq_dom.class_signal (collapsed_sig b) (fun c ->
                   bullet_cls ^ if c then " bullet-closed" else ""))
            [ dom ~key:("b-" ^ uuid) ~tag:"span" ~style_class:"bullet"
                ~attrs:[ ("blockid", uuid) ]
                (match b.Model.block_order_index with
                 | Some idx when order_list ->
                     [ dom ~key:("ol-" ^ uuid) ~tag:"label"
                         ~text:(string_of_int idx ^ ".") [] ]
                 | _ -> [])
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
            (if b.Model.block_is_query then [ Query_builder.block_el uuid b ]
             else
               [ dom ~key:("bt-" ^ uuid) ~style_class:"inline w-full"
                   (Render.title_block ~self:uuid
                      ~resolved:(S.title_for uuid b.block_title)
                      b)
               ])
        ]
    ]

let editor_el uuid scope : t =
 fun ctx parent ->
  let buffer =
    match S.editing () with
    | Some e when e.uuid = uuid && e.scope = scope -> e.buffer
    | _ -> ""
  in
  (* textarea text must track the buffer: e2e asserts
     .editor-wrapper textarea :has-text, which reads textContent *)
  let buffer_sig =
    (* cutoff: typed text only lives in the DOM (live_buffer reads .value on
       commit); without dedup every unrelated S.set publish would re-emit
       the stale buffer and overwrite in-progress typing *)
    Signal.cutoff ( = )
      (Signal.map
         (fun (st : S.t) ->
           match st.S.editing with
           | Some e when e.uuid = uuid && e.scope = scope ->
               Lui_protocol.StringValue e.buffer
           | _ -> Lui_protocol.StringValue "")
         (S.signal ()))
  in
    (Ui_parts.editor_wrapper ~key:("ew-" ^ uuid)
    ~id:("editor-edit-block-" ^ uuid)
    [ Ui_parts.editor_inner ~key:("ei-" ^ uuid)
        [ dom ~key:("ta-" ^ uuid) ~tag:"textarea"
            ~id:("edit-block-" ^ uuid)
            ~style_class:"normal-block uniline-block"
            ~attrs:
              [ ("data-testid", "block editor")
              ; (* focus must land at mount: press-seq resolves *:focus
                   before the 40ms pending-focus retry runs *)
                ("autofocus", "")
              ]
            ~text:buffer ~text_signal:buffer_sig []
        ; Ui_parts.mock_text ~key:("mt-" ^ uuid)
        ]
    ; Asset_dom.upload_input ("up-" ^ uuid)
    ])
    ctx parent

(* code/calc blocks edit through a contenteditable pre.CodeMirror-line —
   no textarea (cljs parity: CodeMirror owns the surface) *)
let code_editor_el uuid (b : Model.block) : t =
  let buffer =
    match S.editing () with
    | Some e when e.uuid = uuid -> e.buffer
    | _ -> ""
  in
  let lang = Option.value b.Model.block_code_lang ~default:"" in
  dom ~key:("ew-" ^ uuid) ~style_class:"extensions__code w-full"
    ~id:("editor-edit-block-" ^ uuid)
    [ dom ~key:("cm-" ^ uuid) ~style_class:"CodeMirror"
        ~attrs:[ ("data-lang", lang) ]
        [ dom ~key:("cp-" ^ uuid) ~tag:"pre"
            ~style_class:"CodeMirror-line"
            ~attrs:
              [ ("contenteditable", "true")
              ; ("spellcheck", "false")
              ; ("data-code-uuid", uuid) ]
            ~text:buffer []
        ]
    ; dom ~key:("cr-" ^ uuid) ~style_class:"extensions__code-calc-results"
        []
    ]

let content_wrapper uuid (b : Model.block) : t =
  (* cljs puts .block-content-wrapper only around display content;
     the editor replaces it directly under .block-row *)
  dom ~key:("cw-" ^ uuid)
    ~style_class:"block-content-wrapper flex flex-1 w-full"
    [ content_el uuid b
    ; dom ~key:("bic-" ^ uuid)
        ~style_class:"flex flex-row items-center" []
    ]

let content_or_editor ~editable uuid scope (b : Model.block) : t =
  (* cljs unmounts .block-content while editing and removes the editor
     entirely in normal mode — .block-title-wrap must be absent for the
     edited block or e2e counts a stale title *)
  dyn ~equal:(fun a b -> a = b)
    (fun editing ->
      match b.Model.block_asset_type with
      | Some _ ->
          (* asset blocks keep the media visible while the block is being
             edited (cljs renders content + editor inside the same wrap) *)
          if editing && editable then
            dom ~key:("ae-" ^ uuid) ~style_class:"flex flex-col w-full"
              [ Asset_dom.block_view uuid b; editor_el uuid scope ]
          else Asset_dom.block_view uuid b
      | None ->
          if editing && editable then
            match b.Model.block_display_type with
            | Some "code" -> code_editor_el uuid b
            | _ -> editor_el uuid scope
          else content_wrapper uuid b)
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

let tags_el uuid (b : Model.block) : t =
  let triples =
    try List.combine b.block_tags
           (List.combine b.block_tag_uuids b.block_tag_idents)
    with Invalid_argument _ ->
        List.map (fun t -> (t, ("", ""))) b.block_tags
  in
  let visible =
    List.filter_map
      (fun (tag, (tuuid, ident)) ->
        (* cljs inline-tag? drops tags that already appear inline in the
           raw title, as "#name" or "#[[uuid]]" *)
        let inline =
          I18n.contains b.block_title ("#" ^ tag)
          || (tuuid <> "" && I18n.contains b.block_title tuuid)
        in
        if inline then None else Some (tag, ident))
      triples
  in
  match visible with
  | [] -> Logseq_dom.nothing
  | tags ->
      dom ~key:("tags-" ^ uuid) ~style_class:"block-tags gap-1"
        (List.mapi
           (fun i (tag, ident) ->
             (* cljs block-tag: .block-tag > .flex.items-center >
                a.hash-symbol("#") + a.tag[data-ref] *)
             dom ~key:("tag-" ^ uuid ^ "-" ^ string_of_int i)
               ~style_class:
                 ("block-tag"
                 ^ if private_tag_ident ident then " private-tag" else "")
               [ dom ~key:("tc-" ^ uuid ^ "-" ^ string_of_int i)
                   ~style_class:"flex items-center"
                   [ dom ~key:("th-" ^ uuid ^ "-" ^ string_of_int i) ~tag:"a"
                       ~style_class:"hash-symbol select-none flex" ~text:"#" []
                   ; dom ~key:("ta-" ^ uuid ^ "-" ^ string_of_int i) ~tag:"a"
                       ~style_class:"tag relative"
                       ~attrs:
                         [ ("tabindex", "0"); ("draggable", "true")
                         ; ("data-ref", String.lowercase_ascii tag) ]
                       [ dom ~key:"ts" ~tag:"span" ~text:tag [] ]
                   ]
               ])
           tags)

(* -- row -- *)

(* module init runs at app load (page.ml references block_row): install
   the document listeners and the add-button observer even for pages with
   zero blocks, where block_row is never mounted *)
let () =
  Editor_keys.install_once ();
  Add_button.install ();
  Asset_dom.install ();
  Editor_dom.ensure_raw_text_observer ()

let rec block_row ?(scope = "main") ?(editable = true) (b : Model.block) : t =
 fun ctx parent ->
  S.ensure ctx;
  (row_el ~editable scope b) ctx parent

and row_el ~editable scope (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  if b.Model.block_is_comments_area then Comments_view.area_el b
  else
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = S.children_of b <> [] in
  let blank = String.trim b.block_title = "" in
  (* the reload key is scope-namespaced: the same block uuid renders in the
     main list, sidebars, previews and embeds simultaneously, and a bare
     ls-<uuid> key makes those distinct rows claim each other's DOM node *)
  dom ~key:("ls-" ^ scope ^ "-" ^ key)
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
            [ dom ~key:("col2-" ^ key) ~style_class:"flex flex-col w-full"
                [ dom ~key:("bmc-" ^ key)
                    ~style_class:"block-main-content flex flex-row gap-2"
                    [ dom ~key:("col3-" ^ key)
                        ~style_class:"flex flex-col w-full"
                        [ dom ~key:("cew-" ^ key)
                            ~style_class:"block-content-or-editor-wrap"
                            ~attrs:
                              (match b.Model.block_display_type with
                               | Some dt -> [ ("data-node-type", dt) ]
                               | None -> [])
                            [ dom ~key:("cei-" ^ key)
                                ~style_class:"block-content-or-editor-inner"
                                [ dom ~key:("row-" ^ key)
                                    ~style_class:
                                      "block-row flex flex-1 flex-row gap-1 \
                                       items-center"
                                    [ content_or_editor ~editable uuid scope
                                        b
                                    ; dom ~key:("br-" ^ key)
                                        ~style_class:
                                          "flex flex-row gap-1 \
                                           items-center ls-block-right \
                                           self-start"
                                        [ dom ~key:("bg-" ^ key)
                                            ~style_class:
                                              "hover:opacity-100 opacity-70"
                                            []
                                        ; tags_el uuid b
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ; Comments_view.reactions_el uuid b.Model.block_reactions
            ]
        ]
    ; dom ~key:("bci2-" ^ key)
        ~style_class:"ls-block-content-indent" []
    ; (if has_children then children_el ~editable uuid scope b
       else Logseq_dom.nothing)
    ]

and children_el ~editable uuid scope (b : Model.block) : t =
  if_
    ~test:(Signal.map (fun c -> not c) (collapsed_sig b))
    (dom ~key:("children-" ^ uuid)
       ~style_class:"block-children-container flex"
       [ dom ~key:("border-" ^ uuid)
           ~style_class:"block-children-left-border"
           ~attrs:[ ("blockid", uuid) ] []
       ; dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
           (List.map (block_row ~scope ~editable) (S.children_of b))
       ])

(* Read-only row for linked-reference lists: same shell as row_el but the
   content never swaps to editor_el — a block shown in .references can
   simultaneously be under edit in its own page, and a second
   #edit-block-<uuid> textarea breaks locators. The rfs- reload key also
   keeps the row from claiming the live row's DOM node on reconciliation —
   both are keyed ls-…/rfs-… on the same uuid but are distinct logical
   nodes. *)
and block_row_static (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = b.block_children <> [] in
  let blank = String.trim b.block_title = "" in
  dom ~key:("rfs-" ^ key)
    ~style_class_signal:(row_class_sig uuid blank embed)
    ~attrs_signal_v:(row_attrs_sig uuid b)
    [ dom ~key:("main-" ^ key)
        ~style_class:"block-main-container flex flex-row gap-1"
        [ control_wrap uuid b
        ; dom ~key:("col-" ^ key) ~style_class:"flex flex-col w-full"
            [ dom ~key:("col2-" ^ key) ~style_class:"flex flex-col w-full"
                [ dom ~key:("bmc-" ^ key)
                    ~style_class:"block-main-content flex flex-row gap-2"
                    [ dom ~key:("col3-" ^ key)
                        ~style_class:"flex flex-col w-full"
                        [ dom ~key:("cew-" ^ key)
                            ~style_class:"block-content-or-editor-wrap"
                            [ dom ~key:("cei-" ^ key)
                                ~style_class:"block-content-or-editor-inner"
                                [ dom ~key:("row-" ^ key)
                                    ~style_class:
                                      "block-row flex flex-1 flex-row gap-1 \
                                       items-center"
                                    [ content_wrapper uuid b
                                    ; dom ~key:("br-" ^ key)
                                        ~style_class:
                                          "flex flex-row gap-1 \
                                           items-center ls-block-right \
                                           self-start"
                                        [ dom ~key:("bg-" ^ key)
                                            ~style_class:
                                              "hover:opacity-100 opacity-70"
                                            []
                                        ; tags_el uuid b
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ; Comments_view.reactions_el uuid b.Model.block_reactions
            ]
        ]
    ; dom ~key:("bci2-" ^ key)
        ~style_class:"ls-block-content-indent" []
    ; (if has_children then children_static_el uuid b
       else Logseq_dom.nothing)
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


(* -- {{embed [[page]]}}: live page block tree inside .embed-block --

   render_inline cannot import this module (tree -> render), so the embed
   view registers itself into Render_state and render_inline calls the
   hook. Each mounted embed refetches on "sync-db-changes" so edits show up
   without remounting (cljs embeds are datascript subscriptions). *)

let embed_refreshes : (int, unit -> unit) Hashtbl.t = Hashtbl.create 8
let embed_refresh_seq = ref 0
let embed_chained = ref false

let chain_embed_worker () =
  if not !embed_chained then begin
    embed_chained := true;
    Runtime.on_sync (fun () ->
        Hashtbl.iter
          (fun _ f ->
            try f ()
            with e ->
              Platform.console_error ("embed refresh failed", e))
          embed_refreshes)
  end

let fetch_embed_blocks name st =
  Render_state.with_repo (fun repo ->
      ignore
        (Runtime.invoke3 "thread-api/get-page-blocks-tree"
           (Wire.String repo) (Wire.String name) Wire.Nil
         |> Js.Promise.then_ (fun w ->
                Outliner_ops.resolve_block_tags (Decode.blocks_of_wire w)
                |> Js.Promise.then_ (fun blocks ->
                       Signal.set st blocks;
                       Js.Promise.resolve ()))
         |> Js.Promise.catch (fun e ->
                Platform.console_error ("embed blocks fetch failed", e);
                Js.Promise.resolve ())))

let page_embed (name : string) : t =
 fun ctx parent ->
  chain_embed_worker ();
  let st =
    Signal.state ctx.Lui_ui.ui_scheduler ([] : Model.block list)
  in
  let id = !embed_refresh_seq in
  embed_refresh_seq := id + 1;
  let load () = fetch_embed_blocks name st in
  load ();
  Hashtbl.replace embed_refreshes id load;
  (* a destroyed embed must stop refetching on every tx broadcast *)
  Signal.on_dispose ctx.ui_scope (fun () ->
      Hashtbl.remove embed_refreshes id);
  (dyn ~equal:(=)
     (fun blocks ->
       (* embed copies render read-only — the same uuid can exist in the
          sidebar/main tree, and only that instance should own the textarea *)
       dom ~key:"embed-page" ~tag:"div" ~style_class:"embed-page"
         (List.map (block_row ~scope:"embed" ~editable:false) blocks))
     (Signal.value st))
    ctx parent

let () = Render_state.page_embed := page_embed
