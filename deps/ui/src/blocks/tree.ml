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
               .block-content#block-content-<uuid>  |  .editor-wrapper .block-editor
     .block-children-container
       .block-children-left-border
       .block-children > .ls-block*

   Reactivity (view runs once): the editing/selected/collapsed sets live in
   Editor_state's signal; each row derives its class/attrs/branch from it via
   style_class_signal, attrs_signal_v, reactive and if_. *)

open Promise_ext
open Lui_elements

module S = Editor_state


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

(* drag affordance classes come from the native bullet-drag gesture —
   S.drag_sig stays None on web, so the classes never appear there *)
let row_class_str (b : Model.block) uuid (selected : S.String_set.t)
    (drag : (string * string * string) option) =
  let order_list = b.Model.block_order_list = Some "number" in
  let blank = String.trim b.block_title = "" in
  let embed = b.Model.block_link <> None in
  (* cljs :class order — dynamic flags first, base classes last *)
  (if S.String_set.mem uuid selected then "selected " else "")
  ^ (match drag with
     | Some (src, _, _) when src = uuid -> "block-dragging "
     | Some (_, tgt, move_to) when tgt = uuid ->
         "block-drag-over block-drag-over-" ^ move_to ^ " "
     | _ -> "")
  ^ (if order_list then "is-order-list " else "")
  ^ (if blank then "is-blank " else "")
  ^ (if embed then "embed-block " else "")
  ^ (if Comments.is_comments_area b then "is-comments-area " else "")
  ^ "ls-block swipe-item"

let row_class_sig uuid blank embed (b : Model.block) =
  ignore (blank, embed);
  Signal.map2
    (fun selected drag -> row_class_str b uuid selected drag)
    (S.selected_sig ()) (S.drag_sig ())

(* same class signal driven by a per-item block signal — keyed rows get
   fresh block records on republish, so blank/embed/order-list must not
   be captured at mount. Fused into one map2: a map over a map leaks the
   inner derivation's upstream subscription — the outer's owner can't
   reach it *)
let row_class_sig_of (bs : Model.block Signal.signal) =
  Signal.map2
    (fun ((b : Model.block), selected) drag ->
      let uuid = Option.value b.block_uuid ~default:"" in
      row_class_str b uuid selected drag)
    (Signal.map2 (fun b selected -> (b, selected)) bs (S.selected_sig ()))
    (S.drag_sig ())

(* effective collapse for a block: scoped UI overrides, then persisted
   set || view default — projected on the [collapse_view] carried by
   [collapse_sig] *)
let effective_collapsed_cv ~scope uuid default (v : S.collapse_view) =
  S.effective_collapsed_in_view ~scope uuid default v

let row_attrs_of ~scope ~depth uuid (b : Model.block)
    (v : S.collapse_view) =
  let has_children = S.children_of b <> [] in
  let embed = b.Model.block_link <> None in
  (* the row's DOM id is the kind's accessibility-identifier — it stays
     out of data_attrs so the id prop owns it *)
  [ ("data-blockid", uuid)
  ; ("data-containerid", uuid)
  ; ("data-block-title", b.block_title)
  ; ("data-comment-item", string_of_bool b.Model.block_is_comment)
  ; ("data-comments-area"
    , string_of_bool (Comments.is_comments_area b))
  ; ("data-block-format", "markdown")
  ; ("data-haschild", string_of_bool has_children)
  ; ( "data-collapsed"
    , string_of_bool
        (has_children
         && effective_collapsed_cv ~scope uuid b.block_default_collapsed v) )
  ; ("data-db-collapsable", string_of_bool b.Model.block_db_collapsable)
  ; (* cljs level = render depth (config :level, 0 at page root), not the
       db block/level *)
    ("data-level", string_of_int depth)
  ]
  (* cljs sets blockid to the linked entity's uuid and
     originalblockid to the linking block's — we keep blockid as the
     embed block's own uuid so delegated editing/ops resolve it *)
  @ (if embed then [ ("data-originalblockid", uuid); ("data-embed", "true") ]
     else [])

let row_attrs_sig ~scope ~depth uuid (b : Model.block) =
  Signal.map
    (fun v -> row_attrs_of ~scope ~depth uuid b v)
    (S.collapse_sig ())

let row_attrs_sig_of ~scope ~depth (bs : Model.block Signal.signal) =
  Signal.map2
    (fun (b : Model.block) (v : S.collapse_view) ->
      let uuid = Option.value b.block_uuid ~default:"" in
      row_attrs_of ~scope ~depth uuid b v)
    bs (S.collapse_sig ())
let collapsed_sig ~scope (b : Model.block) =
  let uuid = Option.value b.block_uuid ~default:"" in
  Signal.map
    (effective_collapsed_cv ~scope uuid b.block_default_collapsed)
    (S.collapse_sig ())

(* cljs data-has-heading on .block-main-container: block.css shifts the
   control wrap down so the bullet tracks the heading's first line *)
(* #..###### markdown prefix on the raw title is the heading too — the
   model only carries block_heading when the property normalized (e.g.
   fixtures that store the literal "# " prefix keep block_heading=None)
   so fall back to Render.heading_level like the title renderer does *)
let block_heading_lvl (b : Model.block) =
  match b.block_heading with
  | Some n when n >= 1 && n <= 6 -> Some n
  | _ -> (
      match Render.heading_level b.block_title with
      | Some (lvl, _) -> Some lvl
      | None -> None)

let heading_attrs (b : Model.block) =
  match block_heading_lvl b with
  | Some n -> [ ("data-has-heading", string_of_int n) ]
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
    box ~key:("ic-" ^ uuid) ~style_class:"ui__icon"
      [ Logseq_emoji.el ~key:("ice-" ^ uuid) ~name:icon.icon_id () ]
  else
    (* tabler icon via the app registry — the icon kind renders its own
       svg/mask; the ti/ti-* font classes would double-render *)
    Lui_elements.icon ~key:("ic-" ^ uuid) ~name:(`app icon.icon_id)
      ~style_class:("ui__icon ls-icon-" ^ icon.icon_id)
      []



(* cljs ldb/private-tags: built-in classes hidden/locked for direct use *)
let private_tag_ident (ident : string) : bool =
  List.mem ident
    [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
      "logseq.class/Asset"; "logseq.class/Journal";
      "logseq.class/Whiteboard"; "logseq.class/Pdf-annotation" ]

(* cljs tags-cp hidden idents: ldb/internal-tags (Page/Property/Tag/
   Root/Asset) plus classes carrying :logseq.property.class/hide-from-node;
   private built-ins (Journal, Whiteboard) never render as chips either *)
let hidden_tag_ident (ident : string) : bool =
  private_tag_ident ident
  || List.mem ident
       [ "logseq.class/Root"; "logseq.class/Comments"
       ; "logseq.class/Comment"; "logseq.class/Code-block"
       ; "logseq.class/Quote-block"; "logseq.class/Math-block" ]

(* cljs block-control-icon-size: heading chrome sizes differ, collapsed
   bullets shrink *)
let control_wrap ~scope ~library uuid (b : Model.block) : t =
 fun ctx parent ->
  let order_list = b.Model.block_order_list = Some "number" in
  let bullet_cls =
    "bullet-container cursor"
    ^ if order_list then " as-order-list typed-list" else ""
  in
  let heading_attrs =
    ( "data-has-children"
    , string_of_bool (b.block_children <> []) )
    ::
    (match block_heading_lvl b with
    | Some lvl -> [ ("data-heading", string_of_int lvl) ]
    | None -> [])
  in
  (* one derived signal for all collapse-driven classes in this row —
     a fresh map per class_signal triples the subscriptions on every
     S.set publish. Owned into the row's scope so the collapse_sig
     subscription dies on unmount *)
  let cs = Logseq_el.own ctx (collapsed_sig ~scope b) in
  let has_children = b.Model.block_children <> [] in
  (* the web reveals the fold caret only on row hover (the lui-core.css
     [data-has-children] rule); hover-less backends keep it visible at
     rest whenever the block can fold *)
  let caret_shown c =
    c || (Ui_services.env_native_block_controls () && has_children)
  in
  (* #dot-<uuid> + data-blockid/draggable on the bullet ride data_attrs
     and accessibility-identifier on the box (e2e target + imperative
     dnd contract); the classes go through Ui_parts.class_signal —
     --ls-block-icon-size lives in the lui-core.css [data-heading]
     rules *)

  box ~key:("ctrlw-" ^ uuid)
    ~style_class:"block-control-wrap flex flex-row items-center h-6"
    ~data_attrs:heading_attrs
    [ link ~key:("ctrl-" ^ uuid) ~style_class:"block-control"
        ~url:"#" ~target:`self_
        ~accessibility_identifier:("control-" ^ uuid)
        [ Ui_parts.class_signal cs
            (fun c ->
              if caret_shown c then "control-show" else "control-hide")
            (box ~key:("ctrlspan-" ^ uuid)
               (* control-hide is a stylesheet display:none — the opacity
                  signal carries the same hide to style-less backends *)
               ~opacity_signal:
                 (Signal.map
                    (fun c ->
                      if c then 1.0
                      else if caret_shown c then 0.4
                      else 0.0)
                    cs)
            [ Ui_parts.class_signal cs
                (fun c ->
                  "rotating-arrow"
                  ^ if c then " collapsed" else " not-collapsed")
                (box ~key:("ra-" ^ uuid)
                   [ (* the web rotates .not-collapsed 90° — style-less
                        backends have no element transform, so they swap
                        in the pre-rotated svg *)
                     reactive
                       (fun c ->
                         if c || not (Ui_services.env_native_block_controls ())
                         then Ui_parts.rotating_arrow ("arw-" ^ uuid)
                         else
                           icon ~key:("arw-" ^ uuid)
                             ~name:(`app "rotating-arrow-down")
                             ~point_size:13 [])
                       cs ])
            ])
        ]
    ; box ~key:("blw-" ^ uuid) ~style_class:"bullet-link-wrap"
        [ Ui_parts.class_signal cs
            (fun c -> bullet_cls ^ if c then " bullet-closed" else "")
            (box ~key:("dotw-" ^ uuid)
               ~accessibility_identifier:("dot-" ^ uuid)
               ~data_attrs:
                 ([ ("data-blockid", uuid); ("draggable", string_of_bool (not (Ui_services.env_publishing ()))) ]
                 @ (if Ui_services.env_native_block_controls () then
                      (* the lui-core.css circle is backend styling;
                         native backends get no stylesheet, so the
                         container's intrinsic box + centering is
                         emitted inline. On web the stylesheet's
                         .bullet-container (var --ls-block-icon-size)
                         sizes it — inline sizing overrode it and
                         shifted every block row's text 2px left *)
                      [ ( "style"
                        , "display:inline-flex;align-items:center;justify-content:center;height:16px;border-radius:50%"
                        ^ if order_list then
                            ";width:1.4em;min-width:1.4em;white-space:nowrap;padding-left:3px"
                          else ";width:16px;min-width:16px"
                        )
                      ]
                    else []))
               [ (match node_icon ~library b with
                  | Some icon -> icon_el uuid icon
                  | None ->
                      Ui_parts.class_signal (S.selected_sig ())
                        (fun selected ->
                          if S.String_set.mem uuid selected then
                            "selected bullet"
                          else "bullet")
                        (box ~key:("b-" ^ uuid)
                           ~data_attrs:
                             [ ("data-blockid", uuid)
                             ; (* see the container note above — the dot
                                  is intrinsic geometry, not a class
                                  lookup *)
                               ( "style"
                               , "width:6px;height:6px;flex-shrink:0;border-radius:999px;opacity:0.8;background:var(--lx-gray-08, var(--ls-block-bullet-color))"
                               )
                             ]
                     (match b.Model.block_order_index with
                      | Some idx when order_list ->
                          [ label ~key:("ol-" ^ uuid)
                              ~value:(string_of_int idx ^ ".") [] ]
                      | _ -> [])))
            ])
        ]
    ]
    ctx parent

(* cljs *control-show? (block-mouse-over/-leave on the main container):
   the fold caret shows only while hovering a collapsable-or-collapsed
   block — the hover half lives in lui-core.css as a
   .block-main-container:hover > .block-control-wrap[data-has-children]
   reveal; control-show/hide still follows the collapsed signal, which
   keeps the caret visible on collapsed blocks. *)

(* -- content vs editor -- *)

let content_el uuid (b : Model.block) : t =
  (* style width:100% — cljs parity (block.cljs): gives the inline element a
     nonzero box so empty blocks stay clickable *)
  box ~key:("content-" ^ uuid) ~style_class:"block-content inline"
    ~accessibility_identifier:("block-content-" ^ uuid)
    ~data_attrs:
      ([ ("data-blockid", uuid); ("data-containerid", uuid); ("style", "width:100%")
       ; ( "data-type"
         , Option.value b.Model.block_ls_type ~default:"default" ) ]
       @
       match b.Model.block_hl_color with
       | Some c -> [ ("data-hl-color", c) ]
       | None -> [])
    [ row ~key:("bci-" ^ uuid)
         ~main:`space_between
        [ box ~key:("bh-" ^ uuid) ~style_class:"block-head-wrap"
            (if b.Model.block_is_query && not (Ui_services.env_publishing ()) then [ Query_builder.block_el uuid b ]
             else
               match Render.title_outer_class b with
               | Some cls ->
                   [ box ~key:("bt-" ^ uuid) ~style_class:cls
                       (Render.title_block ~self:uuid ~annot:true
                          ~resolved:(S.title_for uuid b.block_title)
                          b)
                   ]
               | None ->
                   Render.title_block ~self:uuid ~annot:true
                     ~resolved:(S.title_for uuid b.block_title)
                     b)        ]
    ]

let editor_el ?(cls = "") uuid scope : t = Editor_surface.mount ~cls uuid scope

let content_wrapper uuid (b : Model.block) : t =
  (* cljs puts .block-content-wrapper only around display content;
     the editor replaces it directly under .block-row *)
  row ~key:("cw-" ^ uuid)
    ~style_class:"block-content-wrapper" ~grow:1.
    [ content_el uuid b
    ; row ~key:("bic-" ^ uuid) ~cross:`center []
    ]

let content_or_editor ~editable uuid scope (b : Model.block) : t =
 fun ctx parent ->
  (* cljs unmounts .block-content while editing and removes the editor
     entirely in normal mode — .block-title-wrap must be absent for the
     edited block or e2e counts a stale title *)

  (reactive
    (fun editing ->
      match b.Model.block_asset_type with
      | Some _ ->
          (* asset blocks keep the media visible while the block is being
             edited (cljs renders content + editor inside the same wrap) *)
          if editing && editable then
            column ~key:("ae-" ^ uuid) ~grow:1.
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
              if editing && editable then
                (* cljs styles the editor textarea uniline-block.hN —
                   carry the heading level so the edit surface keeps the
                   read-mode geometry instead of collapsing to 16/24 *)
                let cls =
                  match
                    Render.heading_level (S.title_for uuid b.block_title)
                  with
                  | Some (lvl, _) ->
                      " uniline-block h" ^ string_of_int lvl
                  | None -> ""
                in
                editor_el ~cls uuid scope
              else content_wrapper uuid b))
    (* the derivation outlives the mount unless it's owned into the
       row's scope — editing_sig is shared *)
    (Logseq_el.own ctx
       (Signal.map
          (fun e ->
            match e with
            | Some e -> e.S.uuid = uuid && e.S.scope = scope

            | None -> false)
          (S.editing_sig ()))))
    ctx parent

(* -- tags chips (components/block.cljs tags-cp): sibling of the content
   wrapper so they stay visible while the block is being edited. Tags that
   still appear inline in the title ("#tag") are skipped — they render in
   the title itself. -- *)

(* cljs block-tag: hovering the chip swaps the leading # for an x that
   removes the tag value off the owner entity (block or page). Private
   tags never show the x. The mouseenter/mouseleave swap has no
   component-level equivalent — the x stays .hidden (a real rule) until
   a css :hover or a platform hover prop replaces it. *)
let tag_chip ~key ~owner_uuid ~tag ~tuuid ~ident ~dbid : t =
  let priv = private_tag_ident ident in
  (* the delegated context-menu handler reads data-tag-uuid/id/title/
     priv off the chip root — they ride ~data_attrs *)
  box ~key:("tag-" ^ key)
    ~style_class:"block-tag"
    ~data_attrs:
      [ ("data-tag-uuid", tuuid)
      ; ("data-tag-id", string_of_int dbid)
      ; ("data-tag-title", tag)
      ; ("data-tag-priv", if priv then "true" else "false") ]
    [ row ~key:("tc-" ^ key) ~cross:`center
        [ (* the link kind renders a real <a> so a.hash-symbol css keeps
             matching; href="#" is the cljs decorative-anchor convention *)
          link ~key:("th-" ^ key)
            ~url:"#" ~target:`self_
            ~style_class:"hash-symbol select-none" ~text:"#" []
        ; (if priv || Ui_services.env_publishing () then Logseq_el.nothing
           else
             (* the 'x' press needs a pressable kind — link is not one,
                so it renders as text; .block-tag:hover reveals it *)
             Ui_parts.pressable
               ~on_press:(fun _ ->
                 ignore
                   (Outliner_ops.apply_and_refresh
                      [ Outliner_ops.op "delete-property-value"
                          [ Wire.Uuid owner_uuid
                          ; Wire.Keyword "block/tags"
                          ; Wire.Int dbid ] ]))
               (text ~key:("tx-" ^ key)
                  ~style_class:"tag-x cursor-pointer select-none"
                  ~data_attrs:
                    [ ("aria-label", I18n.t "block/remove-this-tag") ]
                  ~value:"x" []))
        ; (* delegated click/context-menu paths read data-uuid/data-ref
             off the anchor; a.tag css keeps matching the link's <a> *)
          link ~key:("ta-" ^ key)
            ~url:"#" ~target:`self_
            ~style_class:"tag relative"
            ~data_attrs:
              [ ("tabindex", "0"); ("draggable", string_of_bool (not (Ui_services.env_publishing ())))
              ; ("data-uuid", tuuid)
              ; ("data-ref", String.lowercase_ascii tag) ]
            [ text ~key:"ts" ~value:tag [] ]
        ] ]

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
        (* cljs inline-tag? drops a tag only when the raw title carries it
           as a #[[uuid]] ref (titles are normalized to uuid form). LUI
           titles keep the written form, so #name and #[[name]] count as
           inline too — but [#A] priority syntax is NOT inline: cljs
           renders it as literal text and keeps the tag chip *)
        let inline =
          (tuuid <> "" && I18n.contains b.block_title ("#[[" ^ tuuid ^ "]]"))
          || I18n.contains b.block_title ("#[[" ^ tag ^ "]]")
          || (I18n.contains b.block_title ("#" ^ tag)
              && not (I18n.contains b.block_title ("[#" ^ tag ^ "]")))
        in
        if inline || hidden_tag_ident ident then None
        else Some (tag, tuuid, ident, dbid))
      quads
  in
  match visible with
  | [] -> Logseq_el.nothing
  | tags ->
      row ~key:("tags-" ^ uuid) ~gap:4 ~style_class:"block-tags"
        (List.mapi
           (fun i (tag, tuuid, ident, dbid) ->
             tag_chip ~key:(uuid ^ "-" ^ string_of_int i) ~owner_uuid:uuid
               ~tag ~tuuid ~ident ~dbid)
           tags)



(* -- row -- *)

(* module init runs at app load (page.ml references block_row): install
   the document listeners and the add-button observer even for pages with
   zero blocks, where block_row is never mounted *)
let () =
  Editor_keys.install_once ();
  (* module init — before services install; raw host facts *)
  if not (Platform.publishing ()) then Add_button.install ();
  Asset_dom.install ()

let rec block_row
    ?(depth = 0) ?(scope = "main") ?(editable = true) ?(library = false)
    ?(virtualize = false) (b : Model.block) : t =

 fun ctx parent ->
  S.ensure ctx;
  (* host fixups (stripped lui-node ids) — registered at first mount;
     module init runs before Ui_services.install so it can't live there *)
  Ui_services.dom_ensure_fixups ();
  (row_el ~depth ~editable:(editable && not (Ui_services.env_publishing ())) ~library ~virtualize scope b) ctx parent


(* the .block-main-container subtree — everything inside .ls-block
   except the children container *)
and row_main ~editable ~library scope (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  (* data-has-heading feeds block.css selectors — rides ~data_attrs *)
  box ~key:("main-" ^ key)
      ~style_class:"block-main-container flex flex-row gap-1"
        ~data_attrs:
          (match block_heading_lvl b with
           | Some lvl -> [ ("data-has-heading", string_of_int lvl) ]
           | None -> [])
        [ control_wrap ~scope ~library uuid b
        ; column ~key:("col-" ^ key) ~grow:1.
            [ column ~key:("col2-" ^ key)
                [ row ~key:("bmc-" ^ key)
                     ~gap:8
                    [ column ~key:("col3-" ^ key) ~grow:1.
                        [ box ~key:("cew-" ^ key)
                            ~style_class:"block-content-or-editor-wrap"
                            ~data_attrs:
                              (match b.Model.block_display_type with
                               | Some dt -> [ ("data-node-type", dt) ]
                               | None -> [])
                            [ box ~key:("cei-" ^ key)
                                ~style_class:"block-content-or-editor-inner"
                                [ row ~key:("row-" ^ key)
                                    ~style_class:"block-row"
                                    ~grow:1. ~gap:4 ~cross:`center
                                    [ (if Comments.is_comments_area b then
                                         Comments.area_view uuid b
                                       else
                                         content_or_editor ~editable uuid
                                           scope b)
                                    ; row ~key:("br-" ^ key)
                                        ~style_class:"ls-block-right self-start"
                                        ~gap:4 ~cross:`center
                                        [ spacer ~key:("bg-" ^ key) []
                                        ; (* cljs .ls-block-right order:
                                             positioned-properties
                                             :block-right (priority pill)
                                             then tag chips *)
                                          Properties_area.block_right_chips
                                            ~uuid
                                        ; (* a comments area's tag chips stay
                                             hidden — the area view already
                                             announces itself *)
                                          if Comments.is_comments_area b then
                                            spacer ~key:("tags-" ^ uuid) []
                                          else tags_el uuid b
                                        ]
                                    ]
                                ]
                            ]
                        ; (* cljs .flex.flex-col.w-full inner column:
                             .positioned-properties.block-below pills sit
                             below the content-or-editor cell, before the
                             reactions and the .ls-block-content-indent
                             properties area *)
                          Properties_area.block_below_pills ~uuid
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
  if b.Model.block_is_comments_area then Comments_view.area_el_static b
  else
  let key = block_key b in
  let embed = b.block_link <> None in
  let has_children = S.children_of b <> [] in
  let blank = String.trim b.block_title = "" in
  (* the reload key is scope-namespaced: the same block uuid renders in the
     main list, sidebars, previews and embeds simultaneously, and a bare
     ls-<uuid> key makes those distinct rows claim each other's DOM node *)
  Ui_parts.class_signal (row_class_sig uuid blank embed b) Fun.id
    (column ~key:("ls-" ^ scope ^ "-" ^ key)
       ~accessibility_identifier:("ls-block-" ^ key)
       ~data_attrs_signal:(row_attrs_sig ~scope ~depth uuid b)
    [ row_main ~editable ~library scope b
    ; (* .ls-block-content-indent: block properties area + block-below
         pills, sibling of .block-main-container *)
      Properties_area.block_area ~uuid
    ; (* cljs custom-query* — the live query shell sits below
         .block-main-container, not inside the title row *)
      (if Render.is_query_block b then Render.query_below_el uuid
       else if Render.is_cards_block b then
         (* class-Cards blocks get the same results shell *)
         Render.query_below_el uuid
       else Logseq_el.nothing)
    ; (if has_children && not (Comments.is_comments_area b) then
         children_el ~depth ~editable ~library ~virtualize uuid scope b
       else Logseq_el.nothing)
    ])

(* keyed-row variant of row_el: the .ls-block shell is a stable node
   (keyed reconcile needs a node per item) and the content inside it is
   rebuilt only when the row's own block record changes *)
and row_sig ~depth ~editable ~library ~virtualize scope
    (bs : Model.block Signal.signal) : t =
 fun ctx parent ->
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
  (Ui_parts.class_signal (row_class_sig_of bs) Fun.id
    (column ~key:("ls-" ^ scope ^ "-" ^ key)
       ~accessibility_identifier:("ls-block-" ^ key)
       ~data_attrs_signal:(row_attrs_sig_of ~scope ~depth bs)
    [ reactive
        ~equal:
          (fun ((a : Model.block), ga, ia) ((b : Model.block), gb, ib) ->
          a == b && ga = gb && not (gen_bumped a ia ib))
        (fun ((b : Model.block), _g, _i) ->
          row_main ~editable ~library scope b)
        (Logseq_el.own ctx
           (Signal.map2
              (fun (b : Model.block) (_tick : int) ->
                let g, i = Render_inline.invalidation () in
                (b, g, i))
              bs (S.invalidation_sig ())))
    ; Properties_area.block_area
        ~uuid:(Option.value b0.Model.block_uuid ~default:"")
    ; (* the query/cards shell keys off the live block record — a block
         that becomes a query/cards block after mount (title or property
         edit) republishes bs and mounts the section instead of keeping
         the mount-time b0 snapshot *)
      Lui_elements.if_
        ~test:
          (Logseq_el.own ctx
             (Signal.map
                (fun (b : Model.block) ->
                  Render.is_query_block b || Render.is_cards_block b)
                bs))
        (Render.query_below_el
           (Option.value b0.Model.block_uuid ~default:""))
    ; row_children ~depth ~editable ~library ~virtualize scope bs
    ]))
    ctx parent

and row_children ~depth ~editable ~library ~virtualize scope
    (bs : Model.block Signal.signal) : t =
 fun ctx parent ->
  (* gate only on show/hide: children membership changes go through the
     keyed list inside children_dom — remounting the whole subtree on
     every splice (indent/outdent/collapse-adjacent edits) rebuilt
     ~110 nodes per op. Owned into the row's scope so the map2's
     subscription on the shared collapse_sig dies with the row *)
  let show_sig =
    Logseq_el.own ctx
      (Signal.map2
         (fun (b : Model.block) (v : S.collapse_view) ->
           let uuid = Option.value b.block_uuid ~default:"" in
           not
             (effective_collapsed_cv ~scope uuid b.block_default_collapsed v
             || Comments.is_comments_area b
             || S.children_of b = []))
         bs (S.collapse_sig ()))
  in
  let b = Signal.get bs in
  let uuid = Option.value b.block_uuid ~default:"" in
  if_ ~test:show_sig
    (children_dom ~depth ~editable ~library ~virtualize uuid scope bs)
    ctx parent

and block_row_sig
    ?(depth = 0) ?(scope = "main") ?(editable = true) ?(library = false)
    ?(virtualize = false) (bs : Model.block Signal.signal) : t =
 fun ctx parent ->
  S.ensure ctx;
  let b0 = Signal.get bs in
  (if b0.Model.block_is_comments_area then Comments_view.area_el bs
   else row_sig ~depth ~editable:(editable && not (Ui_services.env_publishing ())) ~library ~virtualize scope bs)
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
 fun ctx parent ->
  let kids = S.children_of (Signal.get bs) in
  (box ~key:("blw-" ^ uuid) ~style_class:"blocks-list-wrap"
    ~data_attrs:
      (("data-level", string_of_int (depth + 1))
       :: (if List.length kids >= 64 then
             [ ("data-virtuoso-scroller", "true") ]
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
       [ Lui_elements.keyed
           ~source:(Logseq_el.own ctx (Signal.map S.children_of bs))
           ~key:block_key ~cmp:String.compare
           ~mount:(block_row_sig ~depth:(depth + 1) ~scope ~editable
                     ~library ~virtualize) ]))
    ctx parent

and children_dom ~depth ~editable ~library ~virtualize uuid scope
    (bs : Model.block Signal.signal) : t =
  let b = Signal.get bs in
  row ~key:("children-" ^ uuid)
    ~style_class:"block-children-container"
    ~data_attrs:
      [ (* lui-core.css margin-left:29px on .block-children-container is
           stylesheet geometry — native backends see it via the style
           data attr; the web DOM ignores data-style *)
        ("data-style", "position:relative;margin-left:29px;padding-top:2px")
      ]
    [ box ~key:("border-" ^ uuid)
        ~style_class:"block-children-left-border"
        ~data_attrs:
          [ ("data-blockid", uuid)
          ; (* hover-stripped pill from .block-children-left-border —
               intrinsic geometry for style-less backends *)
            ( "style"
            , "position:absolute;left:-1px;top:0;bottom:0;width:4px;border-radius:2px;opacity:0.6"
            )
          ]
        []
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
         column ~key:("clist-" ^ uuid) ~style_class:"block-children"
           ~data_attrs:
             [ (* .block-children's 1px indent-guide rule; stylesheet
                  on web, inline on native *)
               ( "data-style"
               , "border-left:1px solid var(--lx-gray-04-alpha, var(--ls-guideline-color))"
               )
             ]
           ~grow:1.
           [ child_list ~depth ~editable ~library ~virtualize uuid scope
               bs
           ])
    ]

and children_el ~depth ~editable ~library ~virtualize uuid scope
    (b : Model.block) : t =
 fun ctx parent ->
  let bs = Signal.constant ctx.Lui_ui.ui_scheduler b in
  if_
    ~test:
      (Logseq_el.own ctx
         (Signal.map
            (fun v ->
              not
                (effective_collapsed_cv ~scope uuid
                   b.block_default_collapsed v))
            (S.collapse_sig ())))
    (children_dom ~depth ~editable ~library ~virtualize uuid scope bs)
    ctx parent

(* Read-only row for linked-reference lists: same shell as row_el but the
   content never swaps to editor_el — a block shown in .references can
   simultaneously be under edit in its own page, and a second
   logseq-editor sink for it breaks locators. The rfs- reload key also
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
  Ui_parts.class_signal (row_class_sig uuid blank embed b) Fun.id
    (column ~key:("rfs-" ^ key)
       ~accessibility_identifier:("ls-block-" ^ key)
       ~data_attrs_signal:(row_attrs_sig ~scope:"ref" ~depth uuid b)
    [ box ~key:("main-" ^ key)
        ~style_class:"block-main-container flex flex-row gap-1"
        ~data_attrs:(heading_attrs b)
        [ control_wrap ~scope:"ref" ~library uuid b
        ; column ~key:("col-" ^ key) ~grow:1.
            [ column ~key:("col2-" ^ key)
                [ row ~key:("bmc-" ^ key)
                     ~gap:8
                    [ column ~key:("col3-" ^ key) ~grow:1.
                        [ box ~key:("cew-" ^ key)
                            ~style_class:"block-content-or-editor-wrap"
                            [ box ~key:("cei-" ^ key)
                                ~style_class:"block-content-or-editor-inner"
                                [ row ~key:("row-" ^ key)
                                    ~style_class:"block-row"
                                    ~grow:1. ~gap:4 ~cross:`center
                                    [ content_wrapper uuid b
                                    ; row ~key:("br-" ^ key)
                                        ~style_class:"ls-block-right self-start"
                                        ~gap:4 ~cross:`center
                                        [ spacer ~key:("bg-" ^ key) []
                                        ; (* cljs .ls-block-right order:
                                             positioned-properties
                                             :block-right then tag chips *)
                                          Properties_area.block_right_chips
                                            ~uuid
                                        ; tags_el uuid b
                                        ]
                                    ]
                                ]
                            ]
                        ; (* same as row_main: block-below pills under
                             the content cell — list-view rows render
                             these (Rating/Published/Finished) *)
                          Properties_area.block_below_pills ~uuid
                        ]
                    ; Properties_area.block_left_chips ~uuid
                    ]
                ]
            ; Comments_view.reactions_el uuid b.Model.block_reactions
            ]
        ]
    ; Properties_area.block_area ~uuid
    ; (if has_children then children_static_el ~depth ~library uuid b
       else Logseq_el.nothing)
    ]))
  ctx parent

and children_static_el ~depth ~library uuid (b : Model.block) : t =
  row ~key:("children-" ^ uuid)
    ~style_class:"block-children-container"
    ~data_attrs:
      [ ("data-style", "position:relative;margin-left:29px;padding-top:2px") ]
    [ box ~key:("border-" ^ uuid)
        ~style_class:"block-children-left-border"
        ~data_attrs:
          [ ("data-blockid", uuid)
          ; ( "style"
            , "position:absolute;left:-1px;top:0;bottom:0;width:4px;border-radius:2px;opacity:0.6"
            )
          ]
        []
    ; column ~key:("clist-" ^ uuid) ~style_class:"block-children"
        ~data_attrs:
          [ ( "data-style"
            , "border-left:1px solid var(--lx-gray-04-alpha, var(--ls-guideline-color))"
            )
          ]
        ~grow:1.
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
(* created at first use (post-install) — a top-level timers_debounce
   call would hit Ui_services.get during module init, before install *)
let embed_refresh_debouncer = ref None

let debounced_embed_refresh f =
  match !embed_refresh_debouncer with
  | Some d -> d f
  | None ->
      let d = Ui_services.timers_debounce 150 in
      embed_refresh_debouncer := Some d;
      d f

let chain_embed_worker () =
  if not !embed_chained then begin
    embed_chained := true;
    (* embeds fetch whole page trees by name — their content can change
       under affected-keys we don't know the uuids for, so they keep
       the watch-all default *)
    ignore
      (Runtime.on_sync (fun _affected ->
           debounced_embed_refresh (fun () ->
               Hashtbl.iter
                 (fun _ f ->
                   try f ()
                   with e ->
                     Ui_services.log_error ("embed refresh failed", e))
                 embed_refreshes)))
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
                Ui_services.log_error ("embed blocks fetch failed", e);
                Js.Promise.resolve ())))

(* cheap reactive equality for fetched trees: uuid + title covers structure
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
  Ui_parts.pressable
    ~on_press:(fun _ ->
      Runtime.send (Action.Navigate_to (Model.Page name)))
    (row ~key:"embed-more"
       ~style_class:"ls-block cursor-pointer"
       [ text ~key:"embed-more-t" ~value:(I18n.t "ui/show-more") [] ])

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
  (reactive ~equal:same_blocks
     (fun blocks ->
       let shown, capped = cap_embed_blocks embed_block_cap blocks in
       (* embed copies render read-only — the same uuid can exist in the
          sidebar/main tree, and only that instance should own the editor *)
       box ~key:"embed-page" ~style_class:"embed-page"
         (List.map (block_row ~scope:"embed" ~editable:false) shown
          @ (if capped then [ embed_more_el name ] else [])))
     (Signal.value st))
    ctx parent

let () = Render_state.page_embed := page_embed

(* views_table renders list rows through this hook — it cannot import
   the blocks layer directly (cycle via comments -> render -> views) *)
let () =
  Render_state.block_row_static :=
    (fun b -> block_row_static b)
