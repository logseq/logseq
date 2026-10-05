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

open Promise_ext
open Lui_elements

module S = Editor_state

let dom = Logseq_dom.dom

let contains_sub s sub =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then false
    else if String.sub s i m = sub then true
    else go (i + 1)
  in
  go 0

let block_key (b : Model.block) =
  match b.block_uuid with
  | Some u -> u
  | None -> "block-" ^ string_of_int (Option.value b.block_db_id ~default:0)

(* -- per-row signals -- *)

let row_class_str (b : Model.block) uuid (st : S.t) =
  let order_list = b.Model.block_order_list = Some "number" in
  let blank = String.trim b.block_title = "" in
  let embed = b.Model.block_link <> None in
  (* cljs :class order — dynamic flags first, base classes last *)
  (if S.String_set.mem uuid st.selected then "selected " else "")
  ^ (if order_list then "is-order-list " else "")
  ^ (if blank then "is-blank " else "")
  ^ (if embed then "embed-block " else "")
  ^ (if Comments.is_comments_area b then "is-comments-area " else "")
  ^ "ls-block"

let row_class_sig uuid blank embed (b : Model.block) =
  ignore (blank, embed);
  Logseq_dom.class_signal (S.signal ()) (fun (st : S.t) ->
      row_class_str b uuid st)

(* same class signal driven by a per-item block signal — keyed rows get
   fresh block records on republish, so blank/embed/order-list must not
   be captured at mount *)
let row_class_sig_of (bs : Model.block Signal.signal) =
  Logseq_dom.class_signal
    (Signal.map2 (fun a b -> (a, b)) bs (S.signal ()))
    (fun ((b : Model.block), (st : S.t)) ->
      let uuid = Option.value b.block_uuid ~default:"" in
      row_class_str b uuid st)

(* effective collapse for a block: scoped UI overrides, then persisted
   set || view default — Editor_state.effective_collapsed_in on the
   signal value *)
let effective_collapsed_st ~scope uuid default (st : S.t) =
  S.effective_collapsed_in ~scope uuid default st

let row_attrs_of ~scope ~depth uuid (b : Model.block) (st : S.t) =
  let has_children = S.children_of b <> [] in
  let embed = b.Model.block_link <> None in
  [ ("id", "ls-block-" ^ uuid)
  ; ("blockid", uuid)
  ; ("containerid", uuid)
  ; ("data-block-title", b.block_title)
  ; ("data-comment-item", string_of_bool b.Model.block_is_comment)
  ; ("data-block-format", "markdown")
  ; ("haschild", string_of_bool has_children)
  ; ( "data-collapsed"
    , string_of_bool
        (has_children
         && effective_collapsed_st ~scope uuid b.block_default_collapsed
              st) )
  ; ("data-db-collapsable", string_of_bool b.Model.block_db_collapsable)
  ; (* cljs level = render depth (config :level, 0 at page root), not the
       db block/level *)
    ("level", string_of_int depth)
  ]
  @ (if Comments.is_comments_area b then
       [ ("data-comments-area", "true") ]
     else [])
  (* cljs sets blockid to the linked entity's uuid and
     originalblockid to the linking block's — we keep blockid as the
     embed block's own uuid so delegated editing/ops resolve it *)
  @ (if embed then [ ("originalblockid", uuid); ("data-embed", "true") ]
     else [])

let row_attrs_sig ~scope ~depth uuid (b : Model.block) =
  Logseq_dom.attrs_signal (S.signal ()) (fun (st : S.t) ->
      row_attrs_of ~scope ~depth uuid b st)

let row_attrs_sig_of ~scope ~depth (bs : Model.block Signal.signal) =
  Logseq_dom.attrs_signal
    (Signal.map2 (fun a b -> (a, b)) bs (S.signal ()))
    (fun ((b : Model.block), (st : S.t)) ->
      let uuid = Option.value b.block_uuid ~default:"" in
      row_attrs_of ~scope ~depth uuid b st)
let collapsed_sig ~scope (b : Model.block) =
  let uuid = Option.value b.block_uuid ~default:"" in
  Signal.map
    (effective_collapsed_st ~scope uuid b.block_default_collapsed)
    (S.signal ())

(* cljs data-has-heading on .block-main-container: block.css shifts the
   control wrap down so the bullet tracks the heading's first line *)
let heading_attrs (b : Model.block) =
  match b.block_heading with
  | Some n when n >= 1 && n <= 6 ->
      [ ("data-has-heading", string_of_int n) ]
  | _ -> []

(* -- control wrap: collapse arrow + bullet -- *)

(* icon.cljs get-node-icon: own icon wins, then first tag icon, then the
   node-type default ("file" for Page-tagged blocks, "hash" for Tag,
   "letter-p" for Property). block-control-with-icon? keeps the plain
   bullet unless the node has an explicit icon or is a non-library
   page — in Library the default page icon stays a bullet. *)
let node_icon ~(library : bool) (b : Model.block) : Model.icon option =
  let cls s = List.mem ("logseq.class/" ^ s) b.block_tag_idents in
  let default_id =
    if cls "Tag" then "hash"
    else if cls "Property" then "letter-p"
    else if cls "Page" || cls "Journal" then "file"
    else ""
  in
  (* cljs icon.cljs get-node-icon: pdf asset blocks get the "book"
     tabler icon ahead of any tag icon *)
  let icon =
    match b.block_icon with
    | Some _ -> b.block_icon
    | None -> (
        match b.block_asset_type with
        | Some "pdf" ->
            Some { Model.icon_kind = "tabler-icon"; icon_id = "book" }
        | _ -> (
            match b.block_tag_icons with
            | i :: _ -> Some i
            | [] -> (
                match default_id with
                | "" -> None
                | id ->
                    Some
                      { Model.icon_kind = "tabler-icon"; icon_id = id })))
  in
  match icon with
  | Some i
    when b.block_icon <> None
         || b.block_tag_icons <> []
         || b.block_asset_type = Some "pdf"
         || (default_id <> "" && not library) ->
      Some i
  | _ -> None

let icon_el uuid (icon : Model.icon) : t =
  if icon.icon_kind = "emoji" then
    dom ~key:("ic-" ^ uuid) ~tag:"span" ~style_class:"ui__icon"
      [ dom ~key:("ice-" ^ uuid) ~tag:"em-emoji"
          ~attrs:
            [ ("id", icon.icon_id)
            ; ( "data-emoji"
              , Option.value ~default:""
                  (Emoji_mart.emoji_char icon.icon_id) ) ]
          []
      ]
  else
    dom ~key:("ic-" ^ uuid) ~tag:"span"
      ~style_class:("ui__icon ti ls-icon-" ^ icon.icon_id)
      [ dom ~key:("ici-" ^ uuid) ~tag:"i"
          ~style_class:("ti ti-" ^ icon.icon_id) []
      ]



(* cljs ldb/private-tags: built-in classes hidden/locked for direct use;
   internal idents are already filtered out upstream *)
let private_tag_ident (ident : string) : bool =
  List.mem ident
    [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
      "logseq.class/Asset"; "logseq.class/Journal";
      "logseq.class/Whiteboard"; "logseq.class/Pdf-annotation" ]

(* cljs block-control-icon-size: heading chrome sizes differ, collapsed
   bullets shrink *)
let control_wrap ~scope ~library uuid (b : Model.block) : t =
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
  (* one derived signal for all collapse-driven classes in this row —
     a fresh map per class_signal triples the subscriptions on every
     S.set publish *)
  let cs = collapsed_sig ~scope b in
  dom ~key:("ctrlw-" ^ uuid)
    ~style_class:"block-control-wrap flex flex-row items-center h-6"
    ~attrs:heading_attrs
    [ dom ~key:("ctrl-" ^ uuid) ~tag:"a" ~style_class:"block-control"
        ~id:("control-" ^ uuid)
        [ dom ~key:("ctrlspan-" ^ uuid) ~tag:"span"
            ~id:("ctrlspan-" ^ scope ^ "-" ^ uuid)
            ~style_class_signal:
              (Logseq_dom.class_signal cs
                 (fun c -> if c then "control-show" else "control-hide"))
            [ dom ~key:("ra-" ^ uuid) ~tag:"span"
                ~style_class_signal:
                  (Logseq_dom.class_signal cs
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
              (Logseq_dom.class_signal cs (fun c ->
                   bullet_cls ^ if c then " bullet-closed" else ""))
            [ (match node_icon ~library b with
               | Some icon -> icon_el uuid icon
               | None ->
                   dom ~key:("b-" ^ uuid) ~tag:"span"
                     ~style_class_signal:
                       (Logseq_dom.class_signal (S.signal ()) (fun (st : S.t) ->
                            if S.String_set.mem uuid st.selected then
                              "selected bullet"
                            else "bullet"))
                     ~attrs:[ ("blockid", uuid) ]
                     (match b.Model.block_order_index with
                      | Some idx when order_list ->
                          [ dom ~key:("ol-" ^ uuid) ~tag:"label"
                              ~text:(string_of_int idx ^ ".") [] ]
                      | _ -> []))
            ]
        ]
    ]

(* cljs *control-show? (block-mouse-over/-leave on the main container):
   the fold caret shows only while hovering a collapsable-or-collapsed
   block. cljs collapsable? = children | db-collapsable | (title-collapse
   config && block-with-title?) — the first two cover it here. *)
let arrow_hover ~scope ~uuid ~(b : Model.block) name _payload =
  let collapsable =
    S.children_of b <> [] || b.Model.block_db_collapsable
  in
  let collapsed =
    effective_collapsed_st ~scope uuid b.Model.block_default_collapsed
      (S.value ())
  in
  if not (collapsable || collapsed) then ()
  else
    match Browser_ui.qs ("#ctrlspan-" ^ scope ^ "-" ^ uuid) with
    | None -> ()
    | Some el -> (
        match name with
        | "mouseenter" ->
            Browser_ui.rm_class el "control-hide";
            Browser_ui.add_class el "control-show";
            Browser_ui.add_class el "cursor-pointer"
        | "mouseleave" ->
            Browser_ui.add_class el "control-hide";
            Browser_ui.rm_class el "control-show";
            Browser_ui.rm_class el "cursor-pointer"
        | _ -> ())

(* -- content vs editor -- *)

let content_el uuid (b : Model.block) : t =
  (* style width:100% — cljs parity (block.cljs): gives the inline element a
     nonzero box so empty blocks stay clickable *)
  dom ~key:("content-" ^ uuid) ~style_class:"block-content inline"
    ~id:("block-content-" ^ uuid)
    ~attrs:
      ([ ("blockid", uuid); ("containerid", uuid); ("style", "width:100%")
       ; ( "data-type"
         , Option.value b.Model.block_ls_type ~default:"default" ) ]
       @
       match b.Model.block_hl_color with
       | Some c -> [ ("data-hl-color", c) ]
       | None -> [])
    [ dom ~key:("bci-" ^ uuid)
        ~style_class:"block-content-inner flex flex-row justify-between"
        [ dom ~key:("bh-" ^ uuid) ~style_class:"block-head-wrap"
            (if b.Model.block_is_query then [ Query_builder.block_el uuid b ]
             else
               [ dom ~key:("bt-" ^ uuid) ~style_class:"inline w-full"
                   (Render.title_block ~self:uuid
                      ~annot:true
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

let content_wrapper uuid (b : Model.block) : t =
  (* cljs puts .block-content-wrapper only around display content;
     the editor replaces it directly under .block-row *)
  dom ~key:("cw-" ^ uuid)
    ~style_class:"block-content-wrapper flex flex-1 w-full"
    ~attrs:[ ("style", "display: flex;") ]
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
      | None -> (
          match b.Model.block_display_type with
          | Some "code" ->
              (* fenced-code blocks keep their rendered surface while
                 editing — the mounted CodeMirror IS the editor, so the
                 DOM must not swap or the instance is destroyed *)
              content_wrapper uuid b
          | _ ->
              if editing && editable then editor_el uuid scope
              else content_wrapper uuid b))
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
  let quads =
    try List.map2
          (fun (tag, (tuuid, ident)) dbid -> (tag, tuuid, ident, dbid))
          (List.combine b.block_tags
             (List.combine b.block_tag_uuids b.block_tag_idents))
          b.block_tag_db_ids
    with Invalid_argument _ ->
        List.map (fun t -> (t, "", "", 0)) b.block_tags
  in
  let visible =
    List.filter_map
      (fun (tag, tuuid, ident, dbid) ->
        (* cljs inline-tag? drops tags that already appear inline in the
           raw title, as "#name" or "#[[uuid]]" *)
        let inline =
          I18n.contains b.block_title ("#" ^ tag)
          || (tuuid <> "" && I18n.contains b.block_title tuuid)
        in
        if inline then None else Some (tag, tuuid, ident, dbid))
      quads
  in
  match visible with
  | [] -> Logseq_dom.nothing
  | tags ->
      dom ~key:("tags-" ^ uuid) ~style_class:"block-tags gap-1"
        (List.mapi
           (fun i (tag, tuuid, ident, dbid) ->
             (* cljs block-tag: .block-tag > .flex.items-center >
                a.hash-symbol("#") + a.tag[data-ref] *)
             let priv = private_tag_ident ident in
             dom ~key:("tag-" ^ uuid ^ "-" ^ string_of_int i)
               ~style_class:
                 ("block-tag" ^ if priv then " private-tag" else "")
               (* cljs keeps the tag entity in the chip's click closure;
                  the delegated context-menu handler reads it off data
                  attrs instead *)
               ~attrs:
                 [ ("data-tag-uuid", tuuid)
                 ; ("data-tag-id", string_of_int dbid)
                 ; ("data-tag-title", tag)
                 ; ("data-tag-priv", if priv then "true" else "false") ]
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

let rec block_row
    ?(depth = 0) ?(scope = "main") ?(editable = true) ?(library = false)
    ?(virtualize = false) (b : Model.block) : t =

 fun ctx parent ->
  S.ensure ctx;
  (row_el ~depth ~editable ~library ~virtualize scope b) ctx parent


(* the .block-main-container subtree — everything inside .ls-block
   except the children container *)
and row_main ~editable ~library scope (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  dom ~key:("main-" ^ key)
      ~style_class:"block-main-container flex flex-row gap-1"
        ~attrs:
          (match b.block_heading with
           | Some lvl -> [ ("data-has-heading", string_of_int lvl) ]
           | None -> [])
        ~events:"mouseenter mouseleave"
        ~on_dom_event:(arrow_hover ~scope ~uuid ~b)
        [ control_wrap ~scope ~library uuid b
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
                                    [ (if Comments.is_comments_area b then
                                         Comments.area_view uuid b
                                       else
                                         content_or_editor ~editable uuid
                                           scope b)
                                    ; dom ~key:("br-" ^ key)
                                        ~style_class:
                                          "flex flex-row gap-1 \
                                           items-center ls-block-right \
                                           self-start"
                                        [ dom ~key:("bg-" ^ key)
                                            ~style_class:
                                              "hover:opacity-100 opacity-70"
                                            []
                                        ; (* a comments area's tag chips stay
                                             hidden — the area view already
                                             announces itself *)
                                          if Comments.is_comments_area b then
                                            box ~key:("tags-" ^ uuid) []
                                          else tags_el uuid b
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ; (* .positioned-properties.block-left chips render
                         inline at the end of .block-main-content *)
                      Properties_area.block_left_chips ~uuid
                    ]
                ]
            ; Comments_view.reactions_el uuid b.Model.block_reactions
            ]
        ]

and row_el ~depth ~editable ~virtualize scope ~(library : bool)
    (b : Model.block) : t =

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
    ~style_class_signal:(row_class_sig uuid blank embed b)
    ~attrs_signal_v:(row_attrs_sig ~scope ~depth uuid b)
    [ row_main ~editable ~library scope b
    ; (* .ls-block-content-indent: block properties area + block-below
         pills, sibling of .block-main-container *)
      Properties_area.block_area ~uuid
    ; (if has_children && not (Comments.is_comments_area b) then
         children_el ~depth ~editable ~library ~virtualize uuid scope b
       else Logseq_dom.nothing)
    ]

(* keyed-row variant of row_el: the .ls-block shell is a stable node
   (keyed reconcile needs a node per item) and the content inside it is
   rebuilt only when the row's own block record changes *)
and row_sig ~depth ~editable ~library ~virtualize scope
    (bs : Model.block Signal.signal) : t =
  let b0 = Signal.get bs in
  let key = block_key b0 in
  (* the record isn't the only input to row_main: Render resolves
     [[uuid]]/((uuid))/#[[uuid]] refs through Render_inline's pull cache
     at mount, and an untouched record keeps its mount on every
     publish. Pair the invalidation gens in and remount only when a uuid
     this row mentions was invalidated since it last painted *)
  (* remount iff a uuid the row renders was (re)invalidated since the
     last paint — per-uuid gens compare [ia]@[ib] so re-touching a
     previously invalidated entity still remounts *)
  let gen_bumped (b : Model.block) ia ib =
    let uuid = Option.value b.Model.block_uuid ~default:"" in
    (* the painted title — committed-buffer overrides paint before the
       worker's canon row lands, so the stored block_title can be "" *)
    let title = S.title_for uuid b.Model.block_title in
    Render_inline.Uuid_gens.exists
      (fun u g ->
        match Render_inline.Uuid_gens.find_opt u ia with
        | Some g' when g' = g -> false
        | _ ->
            List.mem u b.Model.block_tag_uuids
            || contains_sub title ("[[" ^ u ^ "]]")
            || contains_sub title ("((" ^ u ^ "))"))
      ib
  in
  dom ~key:("ls-" ^ scope ^ "-" ^ key)
    ~style_class_signal:(row_class_sig_of bs)
    ~attrs_signal_v:(row_attrs_sig_of ~scope ~depth bs)
    [ Logseq_dom.dyn
        ~equal:
          (fun ((a : Model.block), ga, ia) ((b : Model.block), gb, ib) ->
          a == b && ga = gb && not (gen_bumped a ia ib))
        (fun ((b : Model.block), _g, _i) ->
          row_main ~editable ~library scope b)
        (Signal.map2
           (fun (b : Model.block) (_st : S.t) ->
             let g, i = Render_inline.invalidation () in
             (b, g, i))
           bs (S.signal ()))
    ; Properties_area.block_area
        ~uuid:(Option.value b0.Model.block_uuid ~default:"")
    ; row_children ~depth ~editable ~library ~virtualize scope bs
    ]

and row_children ~depth ~editable ~library ~virtualize scope
    (bs : Model.block Signal.signal) : t =
  (* gate only on show/hide: children membership changes go through the
     keyed list inside children_dom — remounting the whole subtree on
     every splice (indent/outdent/collapse-adjacent edits) rebuilt
     ~110 nodes per op *)
  let show_sig =
    Signal.map2
      (fun (b : Model.block) (st : S.t) ->
        let uuid = Option.value b.block_uuid ~default:"" in
        not
          (effective_collapsed_st ~scope uuid b.block_default_collapsed
              st
          || Comments.is_comments_area b
          || S.children_of b = []))
      bs (S.signal ())
  in
  Logseq_dom.dyn ~equal:(fun (a : bool) (b : bool) -> a = b)
    (fun show ->
      if not show then Logseq_dom.nothing
      else
        let b = Signal.get bs in
        let uuid = Option.value b.block_uuid ~default:"" in
        children_dom ~depth ~editable ~library ~virtualize uuid scope
          bs)
    show_sig

and block_row_sig
    ?(depth = 0) ?(scope = "main") ?(editable = true) ?(library = false)
    ?(virtualize = false) (bs : Model.block Signal.signal) : t =
 fun ctx parent ->
  S.ensure ctx;
  let b0 = Signal.get bs in
  (if b0.Model.block_is_comments_area then Comments_view.area_el b0
   else row_sig ~depth ~editable ~library ~virtualize scope bs)
    ctx parent

(* rough rendered height of an unmounted subtree — cljs
   estimate-children-height: a fixed 32px row height per descendant,
   counting through loaded children slots up to depth 8 *)
and estimate_children_height (b : Model.block) : float =
  let rec count depth acc (bs : Model.block list) =
    if depth >= 8 then acc + List.length bs
    else
      List.fold_left
        (fun a c -> count (depth + 1) (a + 1) (S.children_of c))
        acc bs
  in
  float_of_int (count 0 0 (S.children_of b)) *. 32.

(* the content of .block-children: cljs virtualizable-block-list is the
   render-children at every nesting level — a sibling list of >=64 gets
   its own windowed list inside .blocks-list-wrap *)
and child_list ~depth ~editable ~library ~virtualize uuid scope
    (bs : Model.block Signal.signal) : t =
  let kids = S.children_of (Signal.get bs) in
  dom ~key:("blw-" ^ uuid) ~style_class:"blocks-list-wrap"
    ~attrs:
      (("data-level", string_of_int (depth + 1))
       :: (if List.length kids >= 64 then [ ("data-virtuoso-scroller", "true") ]
           else []))
    (if virtualize && List.length kids >= 64 then
       [ Virt_list.list ~key_of:block_key ~estimate_size:(fun _ -> 32.)
           ~initial_rows:48
           ~render:(block_row ~scope ~editable ~depth:(depth + 1) ~library
                      ~virtualize)
           (Array.of_list kids) ]
     else
       (* keyed like the top-level list: indent/outdent/move splices a
          row in or out and only that row's node moves — siblings keep
          their DOM identity instead of the whole subtree remounting *)
       [ Logseq_dom.keyed ~source:(Signal.map S.children_of bs)
           ~key:block_key ~cmp:String.compare
           ~mount:(block_row_sig ~depth:(depth + 1) ~scope ~editable
                     ~library ~virtualize) ])

and children_dom ~depth ~editable ~library ~virtualize uuid scope
    (bs : Model.block Signal.signal) : t =
  let b = Signal.get bs in
  dom ~key:("children-" ^ uuid)
    ~style_class:"block-children-container flex"
    [ dom ~key:("border-" ^ uuid)
        ~style_class:"block-children-left-border"
        ~attrs:[ ("blockid", uuid) ] []
    ; (* cljs lazy-block-children: inside :virtualize? pages the
         .block-children div is a lazy mount boundary — an
         estimated-height placeholder until it nears the viewport *)
      (if virtualize then
         Lazy_children.lazy_children ~key:("clist-" ^ uuid) ~uuid
           ~min_height:(estimate_children_height b)
           ~render:(fun () ->
             child_list ~depth ~editable ~library ~virtualize uuid scope
               bs)
       else
         dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
           [ child_list ~depth ~editable ~library ~virtualize uuid scope
               bs
           ])
    ]

and children_el ~depth ~editable ~library ~virtualize uuid scope
    (b : Model.block) : t =
 fun ctx parent ->
  let bs = Signal.constant ctx.Lui_ui.ui_scheduler b in
  if_
    ~test:(Signal.map (fun c -> not c) (collapsed_sig ~scope b))
    (children_dom ~depth ~editable ~library ~virtualize uuid scope bs)
    ctx parent

(* Read-only row for linked-reference lists: same shell as row_el but the
   content never swaps to editor_el — a block shown in .references can
   simultaneously be under edit in its own page, and a second
   #edit-block-<uuid> textarea breaks locators. The rfs- reload key also
   keeps the row from claiming the live row's DOM node on reconciliation —
   both are keyed ls-…/rfs-… on the same uuid but are distinct logical
   nodes. *)
and block_row_static ?(depth = 0) ?(library = false) (b : Model.block) : t =
 fun ctx parent ->
  (* references rows can be the first block render on a page (journals
     refresh mounts ref rows before any editable row) — the state must
     exist before the per-row signals below *)
  S.ensure ctx;
  (let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = b.block_children <> [] in
  let blank = String.trim b.block_title = "" in
  dom ~key:("rfs-" ^ key)
    ~style_class_signal:(row_class_sig uuid blank embed b)
    ~attrs_signal_v:(row_attrs_sig ~scope:"ref" ~depth uuid b)
    [ dom ~key:("main-" ^ key)
        ~style_class:"block-main-container flex flex-row gap-1"
        ~attrs:(heading_attrs b)
        ~events:"mouseenter mouseleave"
        ~on_dom_event:(arrow_hover ~scope:"ref" ~uuid ~b)
        [ control_wrap ~scope:"ref" ~library uuid b
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
                    ; Properties_area.block_left_chips ~uuid
                    ]
                ]
            ; Comments_view.reactions_el uuid b.Model.block_reactions
            ]
        ]
    ; Properties_area.block_area ~uuid
    ; (if has_children then children_static_el ~depth ~library uuid b
       else Logseq_dom.nothing)
    ])
  ctx parent

and children_static_el ~depth ~library uuid (b : Model.block) : t =
  dom ~key:("children-" ^ uuid)
    ~style_class:"block-children-container flex"
    [ dom ~key:("border-" ^ uuid)
        ~style_class:"block-children-left-border"
        ~attrs:[ ("blockid", uuid) ] []
    ; dom ~key:("clist-" ^ uuid) ~style_class:"block-children w-full"
        (List.map (block_row_static ~depth:(depth + 1) ~library)
           b.block_children)
    ]


(* -- {{embed [[page]]}}: live page block tree inside .embed-block --

   render_inline cannot import this module (tree -> render), so the embed
   view registers itself into Render_state and render_inline calls the
   hook. Each mounted embed refetches on "sync-db-changes" so edits show up
   without remounting (cljs embeds are datascript subscriptions). *)

let embed_refreshes : (int, unit -> unit) Hashtbl.t = Hashtbl.create 8
let embed_refresh_seq = ref 0
let embed_chained = ref false

(* a broadcast can arrive per applied op — coalesce embed refetches into
   one fan-out per burst so N embeds issue N fetches, not N x ops *)
let debounced_embed_refresh = Editor_dom.debounce 150

let chain_embed_worker () =
  if not !embed_chained then begin
    embed_chained := true;
    Runtime.on_sync (fun () ->
        debounced_embed_refresh (fun () ->
            Hashtbl.iter
              (fun _ f ->
                try f ()
                with e ->
                  Platform.console_error ("embed refresh failed", e))
              embed_refreshes))
  end

let fetch_embed_blocks name st =
  Render_state.with_repo (fun repo ->
      ignore
        ((let* w =
           Runtime.invoke3 "thread-api/get-page-blocks-tree"
             (Wire.String repo) (Wire.String name) Wire.Nil
         in
         let* blocks = Outliner_ops.resolve_block_tags (Decode.blocks_of_wire w) in
         Signal.set st blocks;
         Js.Promise.resolve ())
         |> Js.Promise.catch (fun e ->
                Platform.console_error ("embed blocks fetch failed", e);
                Js.Promise.resolve ())))

(* cheap dyn equality for fetched trees: uuid + title covers structure
   and content edits; a full structural compare walks every field of a
   rebuilt-per-fetch tree on each publish *)
let rec same_blocks a b =
  match a, b with
  | [], [] -> true
  | x :: xs, y :: ys ->
      x.Model.block_uuid = y.Model.block_uuid
      && x.Model.block_title = y.Model.block_title
      && same_blocks x.Model.block_children y.Model.block_children
      && same_blocks xs ys
  | _ -> false

(* embed block cap: an embed renders at most this many blocks; a larger
   node opens through the click-through row instead of inflating the
   embed *)
let embed_block_cap = 50

(* prune a fetched tree to the first [cap] blocks in depth-first order;
   returns the pruned tree and whether anything was dropped *)
let cap_embed_blocks cap blocks =
  let n = ref 0 and dropped = ref false in
  let rec go_list = function
    | [] -> []
    | bs when !n >= cap ->
        dropped := true;
        ignore bs;
        []
    | b :: rest ->
        incr n;
        let b' =
          { b with
            Model.block_children = go_list b.Model.block_children
          ; block_embed_children = go_list b.Model.block_embed_children
          }
        in
        b' :: go_list rest
  in
  let out = go_list blocks in
  (out, !dropped)

(* the overflow row — clicking it navigates to the embedded node's own
   detail page *)
let embed_more_el (name : string) : t =
  dom ~key:"embed-more" ~tag:"div"
    ~style_class:"embed-more ls-block cursor-pointer text-sm opacity-70"
    ~attrs:[ ("tabindex", "0") ]
    ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then
        Runtime.send (Action.Navigate_to (Model.Page name)))
    [ dom ~key:"embed-more-t" ~tag:"span" ~text:(I18n.t "ui/show-more")
        [] ]

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
  (dyn ~equal:same_blocks
     (fun blocks ->
       let shown, capped = cap_embed_blocks embed_block_cap blocks in
       (* embed copies render read-only — the same uuid can exist in the
          sidebar/main tree, and only that instance should own the textarea *)
       dom ~key:"embed-page" ~tag:"div" ~style_class:"embed-page"
         (List.map (block_row ~scope:"embed" ~editable:false) shown
          @ (if capped then [ embed_more_el name ] else [])))
     (Signal.value st))
    ctx parent

let () = Render_state.page_embed := page_embed
