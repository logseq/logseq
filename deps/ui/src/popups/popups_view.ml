(* Autocomplete + context-menu overlays — mirrors editor.cljs
   auto-complete (.ui__popover-content > #ui__ac > #ui__ac-inner >
   [.ui__ac-group-name] .menu-link-wrap > a#ac-<i>.menu-link[.chosen])
   and content.cljs custom context menus (.ls-context-menu-content).

   The shells are popover nodes: ~at:(x,y) positions the positioner in
   viewport coords and the node mounts under the renderer's body-level
   .lui-popup-portal (hit-tested by Popups_state.inside); they are
   dismissed on outside click / Escape. *)

open Promise_ext
open Lui_elements

module S = Popups_state
module U = I18n

(* -- autocomplete item ----------------------------------------------- *)

(* cljs svg/help-circle used inside the Query item's doc tooltip *)
let help_circle_svg : t =
  icon ~key:"hc" ~name:(Icons.name_ref "help-circle") ~point_size:16
    ~style_class:"icon" []
;;

(* cljs search-handler/highlight-exact-query: a whole-word hit renders
   as <mark> — a text kind carrying the same --ls-page-mark colors *)
let mark_el ~key s =
  text ~key ~value:s
    ~background:"var(--ls-page-mark-bg-color, #fef3ac)"
    ~foreground:"var(--ls-page-mark-color, #262626)" []
;;

let text_span ~key s = text ~key ~value:s [];;

(* cljs hiccup renders plain strings as bare DOM text nodes — the text
   kind is the component equivalent *)
let bare_text (s : string) : t = text ~value:s [];;

let highlight_el ~key ~query label : t =
  if label = "" || query = "" then bare_text label
  else if String.contains query ' ' then (
    let words =
      List.filter (fun w -> w <> "") (String.split_on_char ' ' query)
    in
    let rec loop i words rest acc =
      match words with
      | [] -> List.rev (text_span ~key:("r" ^ string_of_int i) rest :: acc)
      | w :: ws -> (
          match I18n.index_ci rest w with
          | Some j ->
              let hit_len = String.length w in
              let rest' =
                String.sub rest (j + hit_len)
                  (String.length rest - j - hit_len)
              in
              loop (i + 2) ws rest'
                (mark_el ~key:("m" ^ string_of_int (i + 1))
                   (String.sub rest j hit_len)
                 :: text_span ~key:("b" ^ string_of_int i)
                      (String.sub rest 0 j)
                 :: acc)
          | None -> List.rev (text_span ~key:"x" rest :: acc))
    in
    text ~key (loop 0 words label []))
  else
    match I18n.index_ci label query with
    | Some i ->
        let before = String.sub label 0 i in
        let hit = String.sub label i (String.length query) in
        let after =
          String.sub label (i + String.length query)
            (String.length label - i - String.length query)
        in
        text ~key
          ((if before = "" then [] else [ text_span ~key:"b" before ])
          @ [ mark_el ~key:"m" hit ]
          @ if after = "" then [] else [ text_span ~key:"a" after ])
    (* cljs falls through to the multi-word branch on no match, so the
       label lands in a span inside a span.m-0 wrapper *)
    | None -> text ~key [ text_span ~key:"x" label ]
;;

(* cljs block-title-with-icon: an entity icon wraps the (highlighted)
   title in a gap-1 row; the icon renders at size 14 like ui/icon.
   New-tag/new-page rows render the raw title (cljs skips highlight
   for the New-* prefix) *)
let node_title_el ~key ~query (it : S.ac_item) : t =
  let hl =
    if String.length it.S.ai_key >= 4
       && String.sub it.S.ai_key 0 4 = "new:"
    then bare_text it.S.ai_label
    else highlight_el ~key:"hl" ~query it.S.ai_label
  in
  match it.S.ai_title_icon with
  | Some ic ->
      row ~key ~style_class:"icon-cp-container" ~gap:4
        [ icon ~key:"ti" ~name:(Icons.name_ref ic) ~point_size:14
            ~style_class:"ui__icon" []
        ; hl ]
  | None -> hl
;;

(* cljs node-render icon slot: the h-5 wrap is always present for
   non-db-tag popups, empty when the node has no icon *)
let node_icon_slot ~key (it : S.ac_item) : t =
  box ~key ~style_class:"ls-ac-node-icon"
    (match it.S.ai_node_icon with
     | Some (icn, true) ->
         [ box ~key:"cp" ~style_class:"icon-cp-container"
             ~foreground:"inherit"
             [ icon ~key:"ni" ~name:(Icons.name_ref icn) ~point_size:14
                 ~style_class:"ui__icon" [] ] ]
     | Some (icn, false) ->
         [ icon ~key:"ni" ~name:(Icons.name_ref icn) ~point_size:14
             ~style_class:"ui__icon" [] ]
     | None -> [])
;;

(* cljs node-render: div.flex.flex-col > [.text-xs.opacity-70.mb-1
   breadcrumb] + div.flex.flex-row.items-start > [icon-slot] + title *)
let ac_node_label_el (v : S.view) (it : S.ac_item) : t =
  let db_tag =
    match v.S.ac with
    | Some a -> a.S.kind = S.Tag_search
    | None -> false
  in
  let query =
    match v.S.ac with
    | Some a -> a.S.query
    | None -> ""
  in
  column ~key:"node" ~style_class:"ls-ac-node"
    ((* cljs node-render mounts the .text-xs.opacity-70.mb-1 breadcrumb
        div whenever the entity qualifies (Some _ here; "" renders the
        empty div — its content height plus mb-1 is what pushes tag
        items to 36px) *)
      (match it.S.ai_breadcrumb with
       | Some "" ->
           [ box ~key:"bc" ~style_class:"ls-ac-bc" [] ]
       | Some bc ->
           [ box ~key:"bc" ~style_class:"ls-ac-bc"
               [ text ~key:"b"
                   ~style_class:
                     "breadcrumb block-parents \
                      breadcrumb--search-result"
                   ~value:bc [] ] ]
       | None -> [])
    @ [ row ~key:"row" ~style_class:"ls-ac-node-row"
          ((if db_tag then [] else [ node_icon_slot ~key:"ic" it ])
          @ [ node_title_el ~key:"ti" ~query it ]) ])
;;

(* cljs item-render: div[title?|has-help] > (icon+strong.font-normal |
   bare text) [+ small>help-circle tooltip trigger] *)
let ac_label_el (v : S.view) (it : S.ac_item) : t =
  if it.S.ai_node then ac_node_label_el v it
  else
  let txt =
    match it.S.ai_info with
    | Some info -> it.S.ai_label ^ " — " ^ info
    | None -> it.S.ai_label
  in
  box ~key:"lbl"
    ((match it.S.ai_icon with
      | Some ic ->
          [ text ~key:"ic" ~style_class:"ls-ac-ic"
              [ icon ~key:"icn" ~name:(Icons.name_ref ic) ~style_class:"ui__icon" []
              ; text ~key:"s" ~value:txt [] ] ]
      (* no-icon commands render the label as a bare text node *)
      | None -> [ text ~key:"t" ~value:txt [] ])
    @ if it.S.ai_help then
        [ text ~key:"help" [ help_circle_svg ] ]
      else [])
;;

let ac_item_el ~key (st : S.t) (item_sig : S.ac_item Signal.signal) : t =
 fun context parent ->
  (* own the derivation: unowned map2 leaves a live subscriber on the
     shared view signal after the item unmounts *)
  let pair =
    Logseq_el.own context
      (Signal.map2
         (fun (it : S.ac_item) (v : S.view) -> (it, v))
         item_sig st.S.vs.Signal.state_signal)
  in
  box ~key ~style_class:"menu-link-wrap"
    [ (* cljs/e2e contract: a.menu-link[#ac-<idx>].chosen — a real
         anchor (menu_item kind emits a non-anchor node); .chosen and
         the click ride the dom event/style-class channel *)
      Logseq_el.el ~key:"lnk" ~tag:"a"
        ~id:("ac-" ^ string_of_int (Signal.get item_sig).S.ai_idx)
        ~style_class_signal:
          (Logseq_el.class_signal pair (fun (it, v) ->
               "menu-link"
               ^ (match v.S.ac with
                   | Some ac when ac.S.chosen = it.S.ai_idx -> " chosen"
                   | _ -> "")))
        ~attrs:[ ("tabindex", "0") ]
        ~events:"click"
        ~on_dom_event:(fun name _payload ->
          if name = "click" then
            S.apply_index st (Signal.get item_sig).S.ai_idx)
        [ box ~key:"flex1"
            [ reactive
                ~equal:(fun (a : S.ac_item * S.view) (b : S.ac_item * S.view) ->
                  let ai, av = a and bi, bv = b in
                  ai.S.ai_label = bi.S.ai_label
                  && ai.S.ai_info = bi.S.ai_info
                  && ai.S.ai_title = bi.S.ai_title
                  && ai.S.ai_help = bi.S.ai_help
                  && ai.S.ai_icon = bi.S.ai_icon
                  && ai.S.ai_node = bi.S.ai_node
                  && ai.S.ai_node_icon = bi.S.ai_node_icon
                  && ai.S.ai_title_icon = bi.S.ai_title_icon
                  && ai.S.ai_breadcrumb = bi.S.ai_breadcrumb
                  && (match av.S.ac, bv.S.ac with
                      | Some x, Some y ->
                          x.S.kind = y.S.kind && x.S.query = y.S.query
                      | None, None -> true
                      | _ -> false))
                (fun (it, v) -> ac_label_el v it)
                pair
            ]
        ]
    ]
    context parent
;;

let ac_empty_placeholder (v : S.view) : t =
  let label =
    match v.S.ac with
    | Some { kind = S.Page_ref | S.Embed_ref | S.Page_embed; _ } ->
        U.t "editor/search-for-node"
    | Some { kind = S.Tag_search; _ } -> U.t "editor/search-for-tag"
    | _ -> U.t "editor/block-search"
  in
  text ~key:"ac-empty" ~style_class:"ls-ac-empty" ~value:label []
;;

(* cljs ui/auto-complete groups slash items by :group — each group is a
   bare <div> wrapping its .ui__ac-group-name header plus all its items;
   a leading group-less run (and non-grouped popups) stay unwrapped *)
type ac_group = {
  g_key : string;
  g_hdr : string option;
  g_items : S.ac_item list;
}

let ac_groups items =
  let flush acc hdr xs =
    if xs = [] then acc else (hdr, List.rev xs) :: acc
  in
  let rec go acc hdr xs items =
    match items with
    | [] -> List.rev (flush acc hdr xs)
    | it :: rest -> (
        match it.S.ai_hdr with
        | Some _ -> go (flush acc hdr xs) it.S.ai_hdr [ it ] rest
        | None -> go acc hdr (it :: xs) rest)
  in
  List.map
    (fun (hdr, xs) ->
      { g_key = (match hdr with Some h -> "g:" ^ h | None -> "g:lead")
      ; g_hdr = hdr
      ; g_items = xs })
    (go [] None [] items)
;;


(* Every rendered field of an item feeds the group key, so a content
   change remounts the whole group (rows stay static; chosen/highlight
   still update live through the per-item view signals). Nested keyed
   inside a keyed mount raced the DOM batch ("unknown DOM node"). *)
let ac_item_fp (it : S.ac_item) =
  let o = Option.value ~default:"-" in
  Printf.sprintf "%s|%s|%d|%b|%b|%s|%s|%s|%s" it.S.ai_key it.S.ai_label
    it.S.ai_idx it.S.ai_help it.S.ai_node
    (o it.S.ai_icon) (o it.S.ai_title) (o it.S.ai_breadcrumb)
    (o it.S.ai_info)

let ac_item_static (st : S.t) (it : S.ac_item) : t =
 fun context parent ->
  let item_sig = Signal.constant context.Lui_ui.ui_scheduler it in
  ac_item_el ~key:("ai-" ^ it.S.ai_key) st item_sig context parent

(* cljs mounts ungrouped items directly under #ui__ac-inner and wraps a
   headed group (header + items) in one bare <div>; keyed units mirror
   that — one keyed node per bare item or per group *)
type ac_unit =
  | AItem of S.ac_item
  | AGroup of ac_group

let ac_inner (st : S.t) : t =
 fun context parent ->
  (* the empty state is a sentinel keyed item *)
  let units_sig =
    Logseq_el.own context
      (Signal.map
         (fun (v : S.view) ->
           match v.S.ac with
           | Some a -> (
               match a.S.items with
               | [] -> [ AItem S.empty_item ]
               | xs ->
                   List.concat_map
                     (fun g ->
                       match g.g_hdr with
                       | Some _ -> [ AGroup g ]
                       | None -> List.map (fun it -> AItem it) g.g_items)
                     (ac_groups xs))
           | None -> [])
         st.S.vs.Signal.state_signal)
  in
  let unit_key u =
    match u with
    | AItem it -> "i:" ^ ac_item_fp it
    | AGroup g ->
        "g:" ^ g.g_key ^ "|"
        ^ String.concat "," (List.map ac_item_fp g.g_items)
  in
  let row (it : S.ac_item) =
    if it.S.ai_key = S.empty_key then ac_empty_placeholder (S.get st)
    else ac_item_static st it
  in
  scroll ~key:"ac-inner" ~accessibility_identifier:"ui__ac-inner"
    ~style_class:"hide-scrollbar"
    [ column ~key:"ac-col"
        [ keyed ~source:units_sig ~key:unit_key ~cmp:Stdlib.compare
            ~mount:(fun u_sig ->
          (* the key fingerprints the unit fully, so sampling once is
             stable *)
          match Signal.sample u_sig with
          | AItem it -> row it
          | AGroup g ->
              box ~key:("grp" ^ g.g_key)
                (text ~key:"ghdr"
                   ~style_class:"ui__ac-group-name"
                   ~value:(Option.value ~default:"" g.g_hdr)
                   []
                 :: List.map row g.g_items)) ] ]
    context parent
;;

(* cljs base-ui anchors the popup at a 1x1 rect at the caret point, so
   side=bottom lands its top edge at anchor.bottom = y+1 *)
let popup_anchor_dy = 1.

(* cljs shui composed-popup bakes popup-transition-class into the
   PopoverContent classes; LUI authors them as rules on
   .ui__popover-content et al. (lui-overlay.css), so the emit side only
   carries the semantic class. `flip` = (top, avail) when the popup
   measured too tall for the space below and moved above the caret
   (base-ui avoidCollisions; positioner flips data-side to top) *)

let ac_popover (st : S.t) : t =
  (* signals are built inside the mount closure: if_ unmounts dispose any
     derived signal bound under that scope, so an eagerly-created map would
     throw "cannot observe a disposed signal" on the next mount *)
 fun context parent ->
  let vs = st.S.vs.Signal.state_signal in
  (* cljs PopoverContent: ui__popover-content + card + transition
     classes. #ui__ac (imperative queries) sits on the positioner via
     ~accessibility_identifier; the .ui__popover-content content node is
     an inner box because the overlay CSS keys
     [data-editor-popup-ref]/[data-side] on that class, and ~data_attrs
     land on the positioner *)
  (popover ~key:"ac-pop" ~accessibility_identifier:"ui__ac"
     ~at_signal:
       (Logseq_el.own context
          (Signal.map
             (fun (v : S.view) ->
               match v.S.ac with
               | Some a ->
                   ( Option.value a.S.flipx ~default:a.S.x
                   , (match a.S.flip with
                      | Some (top', _) -> top'
                      | None -> a.S.y +. popup_anchor_dy) )
               | None -> (0., 0.))
             vs))
     ~available_height_signal:
       (Logseq_el.own context
          (Signal.map
             (fun (v : S.view) ->
               match v.S.ac with
               | Some a -> (
                   match a.S.flip with
                   | Some (_, avail') -> avail'
                   | None ->
                       Ui_services.dom_viewport_height () -. a.S.y -. 5.)
               | None -> 0.)
             vs))
     ~on_dismiss:(fun _ -> S.close_ac st)
     [ Ui_parts.class_signal vs
         (fun (v : S.view) ->
           "ui__popover-content "
           ^ (match v.S.ac with
              | Some a -> S.ac_class_of_kind a.S.kind
              | None -> ""))
         (box ~key:"ac-c"
            ~data_attrs_signal:
              (Logseq_el.own context
                 (Signal.map
                    (fun (v : S.view) ->
                      match v.S.ac with
                      | Some a ->
                          [ ("data-open", "")
                          ; ( "data-side"
                            , (match a.S.flip with
                               | Some _ -> "top"
                               | None -> "bottom") )
                          ; ( "data-align"
                            , (match a.S.flipx with
                               | Some _ -> "end"
                               | None -> "start") )
                          ; ("tabindex", "-1")
                          ; ("data-base-ui-focusable", "")
                          ; ("role", "dialog")
                          ; ("data-state", "open")
                          ; ( "data-editor-popup-ref"
                            , S.popup_ref_of_kind a.S.kind ) ]
                      | None -> [])
                    vs))
            [ ac_inner st
            ; (* cljs page-search-aux: mod+enter hint under the tag list *)
              if_
                ~test:
                  (Logseq_el.own context
                     (Signal.map
                        (fun (v : S.view) ->
                          match v.S.ac with
                          | Some a ->
                              a.S.kind = S.Tag_search && a.S.query <> ""
                              && String.lowercase_ascii a.S.query <> "page"
                          | None -> false)
                        vs))
                (text ~key:"ac-hint" ~style_class:"ls-tag-search-hint"
                   [ (* shui/shortcut "mod+enter" → combo glow container
                        inside a span *)
                     text ~key:"scw"
                       [ box ~key:"sc"
                           ~style_class:"shui-shortcut-combo shui-shortcut-glow"
                           [ kbd ~key:"k0" ~style_class:"shui-shortcut-key"
                               ~value:(Ui_services.literal_text "\xe2\x8c\x98") []
                           ; text ~key:"sep1"
                               ~style_class:"shui-shortcut-separator" []
                           ; kbd ~key:"k1" ~style_class:"shui-shortcut-key"
                               ~value:(Ui_services.literal_text "\xe2\x8f\x8e") [] ] ]
                   ; text ~key:"ht"
                       ~value:(U.t "editor/display-tag-inline-hint") [] ])
            ])
     ])
    context parent
;;

(* -- context menu ---------------------------------------------------- *)

(* run_* + close_cm_picker live before the menu rows so item on_press
   handlers can call them *)

(* the icon/emoji picker mounts as an overlay outside the menu DOM —
   track its view-overlay key so closing the sub or the whole menu
   removes it like the base-ui sub-content *)
let cm_picker_key : string option ref = ref None

let close_cm_picker () =
  match !cm_picker_key with
  | Some key ->
      cm_picker_key := None;
      Properties_state.remove_view_overlay key
  | None -> ()

let run_cm_item st l = close_cm_picker (); S.run_cm_item st l
let run_cm_color st l = close_cm_picker (); S.run_cm_color st l
let run_cm_heading st l = close_cm_picker (); S.run_cm_heading st l
;;

(* base-ui sets data-highlighted on the hovered item (bg-muted) *)
let cm_hi_el : Ui_services.el option ref = ref None

let close_cm st =
  cm_hi_el := None;
  close_cm_picker ();
  S.close_cm st

let cm_color_row (st : S.t) : t =
  let swatch c =
    button ~key:("color-" ^ c) ~variant:`ghost
      ~style_class:"ls-cm-swatch"
      ~label:(U.t ("color/" ^ c))
      ~on_press:(fun _ -> run_cm_color st c)
      [ box ~key:"bg" ~style_class:"heading-bg"
          ~background:("var(--color-" ^ c ^ "-500)") [] ]
  in
  let remove =
    button ~key:"color-rm" ~variant:`ghost
      ~style_class:"ls-cm-swatch"
      ~label:(U.t "ui/remove-background")
      ~on_press:(fun _ -> run_cm_color st "")
      [ box ~key:"bg" ~style_class:"heading-bg remove"
          [ text ~key:"t" ~value:"-" [] ] ]
  in
  box ~key:"colors" ~style_class:"ls-cm-colors"
    [ row ~key:"colors-row" ~style_class:"ls-cm-colors-row"
        (List.map swatch S.colors @ [ remove ]) ]
;;

(* shui button :ghost :icon + to-heading-button; the ghost/size styles
   live in lui-overlay.css (to-heading-button). The cljs menu-heading
   literal-comma class quirk is dropped — it is unreachable CSS *)
let cm_heading_btn (st : S.t) key title value icn : t =
  button ~key ~variant:`ghost ~size:`icon
    ~style_class:"to-heading-button ls-cm-heading-btn"
    ~label:title
    ~on_press:(fun _ -> run_cm_heading st value)
    [ icn ]
;;

(* ui.cljs menu-heading: h-1..h-6 font icons, h-auto/heading-off ext icons *)
let cm_heading_row (st : S.t) : t =
  let hs =
    List.init 6 (fun i ->
        let n = string_of_int (i + 1) in
        cm_heading_btn st ("h-" ^ n) (U.tf "editor/heading" [ n ]) n
          (icon ~key:"ic" ~name:(Icons.name_ref ("h-" ^ n)) ~style_class:"ui__icon"
             []))
  in
  box ~key:"headings" ~style_class:"ls-cm-headings"
    [ row ~key:"headings-row" ~style_class:"ls-cm-headings-row"
        (hs
        @ [ cm_heading_btn st "h-auto" (U.t "editor/auto-heading") "auto"
              (icon ~key:"ic" ~name:(Icons.name_ref "h-auto")
                 ~style_class:"ui__icon" [])
          ; cm_heading_btn st "h-rm" (U.t "editor/remove-heading")
              "none"
              (icon ~key:"ic" ~name:(Icons.name_ref "heading-off")
                 ~style_class:"ui__icon" []) ]) ]
;;

(* shui/shortcut root for :combo (binding has "+") and :separate styles *)
let cm_shortcut_el (binding, caps) : t =
  let combo = String.contains binding '+' in
  let kbd_el i cap =
    kbd ~key:("k" ^ string_of_int i)
      ~style_class:
        (if combo then "shui-shortcut-key"
         else "shui-shortcut-key shui-key-boxed")
      ~value:(Ui_services.literal_text cap) []
  in
  let children =
    List.concat
      (List.mapi
         (fun i cap ->
           let sep =
             if combo && i > 0 then
               [ text ~key:("sep" ^ string_of_int i)
                   ~style_class:"shui-shortcut-separator" ~value:"" [] ]
             else []
           in
           sep @ [ kbd_el i cap ])
         caps)
  in
  text ~key:"sc" ~style_class:"ls-cm-sc"
    [ text ~key:"sc-wrap"
        [ box ~key:"sc-box"
            ~style_class:
              (if combo then "shui-shortcut-combo shui-shortcut-glow"
               else "shui-shortcut-separate shui-shortcut-glow")
            ~gap:(if combo then 0 else 4)
            children
        ]
    ]

let cm_item_cls = "ui__dropdown-menu-item"
;;

let cm_item_el (st : S.t) (entry_sig : (int * S.cm_item) Signal.signal) : t =
 fun context parent ->
  let idx = fst (Signal.get entry_sig) in
  (* keyed mounts run with parent=None, so the entry point must be a real
     node — wrap the dynamic branch in a box *)
  box ~key:"cm-entry"
    [ reactive
      (function
      | S.Ci_sep ->
          divider ~key:"sep"
            ~style_class:"ui__dropdown-menu-separator" []
      | S.Ci_colors -> cm_color_row st
      | S.Ci_headings -> cm_heading_row st
      | S.Ci_sub (label, _sub) ->
          (* opens on hover — cm_hover finds it by the cm-sub-<i> id;
             role=menuitem rides data_attrs (the kind's ~role variant
             list doesn't cover it) *)
          menu_item ~key:"sub"
            ~style_class:"ui__dropdown-menu-sub-trigger"
            ~accessibility_identifier:("cm-sub-" ^ string_of_int idx)
            ~data_attrs:[ ("role", "menuitem") ]
            ~text:label
            [ icon ~key:"chev" ~name:`chevron_right
                ~style_class:"ls-menu-chevron" [] ]
      | S.Ci_item (label, scut, cmd) ->
          menu_item ~key:"item" ~style_class:cm_item_cls
            ~data_attrs:[ ("role", "menuitem") ]
            ~on_press:(fun _ -> run_cm_item st cmd)
            ~text:label
            (match scut with
             | Some s -> [ cm_shortcut_el s ]
             | None -> []))
        (Logseq_el.own context (Signal.map snd entry_sig)) ]
    context parent
;;

let cm_sub_item_el (st : S.t) (it : S.cm_item) : t =
  match it with
  | S.Ci_item (label, scut, cmd) ->
      menu_item ~key:"sub-item" ~style_class:cm_item_cls
        ~data_attrs:[ ("role", "menuitem") ]
        ~on_press:(fun _ -> run_cm_item st cmd)
        ~text:label
        (match scut with
         | Some s -> [ cm_shortcut_el s ]
         | None -> [])
  | _ -> spacer ~key:"x" []
;;

(* dropdown-menu-sub-content for Sub_menu entries — popover ~at the
   trigger's right edge (coords stored on hover in cm.sub_xy); nested
   popovers layer above their parent popup automatically *)
let cm_sub_el (st : S.t) (x : float) (y : float) (items : S.cm_item list)
    : t =
  popover ~key:"cm-sub" ~at:(x, y) ~role:`menu
    ~available_height:(Ui_services.dom_viewport_height () -. y -. 5.)
    ~style_class:"ui__dropdown-menu-sub-content"
    ~data_attrs:[ ("tabindex", "-1"); ("data-keep-selection", "") ]
    ~on_dismiss:(fun _ -> close_cm st)
    [ box ~key:"w" (List.map (cm_sub_item_el st) items) ]
;;

(* (idx, x, y, items) while a Sub_menu is open; None otherwise — the
   tuple feeds reactive so the submenu mounts lazily with live coords *)
let cm_sub_state (st : S.t)
    : (int * float * float * S.cm_item list) option Signal.signal =
  Signal.map
    (fun (v : S.view) ->
      match v.S.cm with
      | Some m when m.S.sub_open >= 0 -> (
          let x, y = m.S.sub_xy in
          match List.nth_opt m.S.entries m.S.sub_open with
          | Some (S.Ci_sub (_, S.Sub_menu items)) ->
              Some (m.S.sub_open, x, y, items)
          | _ -> None)
      | _ -> None)
    st.S.vs.Signal.state_signal
;;

let cm_popover (st : S.t) : t =
  (* see ac_popover: signals must be built per mount *)
 fun context parent ->
  let entries_sig =
    Logseq_el.own context
      (Signal.map
         (fun (v : S.view) ->
           match v.S.cm with
           | Some m -> List.mapi (fun i e -> (i, e)) m.S.entries
           | None -> [])
         st.S.vs.Signal.state_signal)
  in
  (* cljs as-dropdown? context menu: dropdown-menu-content merged with
     the content-props class (280px ls-context-menu-content, 240px
     ls-tag-menu for block-tag popups); the items sit in a flat
     div[data-keep-selection], not a second card *)
  let vs = st.S.vs.Signal.state_signal in
  (Ui_parts.class_signal vs
     (fun (v : S.view) ->
       "ui__dropdown-menu-content ls-context-menu-content ls-anchor-cx"
       ^
       (match v.S.cm with
        | Some m ->
            (if m.S.tag <> None then " ls-tag-menu" else "")
            ^ (if m.S.flip then " ls-anchor-top" else "")
        | _ -> ""))
     (popover ~key:"cm" ~role:`menu
        ~at_signal:
          (Logseq_el.own context
             (Signal.map
                (fun (v : S.view) ->
                  match v.S.cm with
                  | Some m ->
                      (* the positioner translates back half its width
                         (ls-anchor-cx): clamp the anchor center so the
                         menu stays inside the viewport *)
                      let w = if m.S.tag <> None then 240. else 280. in
                      ( Float.max ((w /. 2.) +. 5.)
                          (Float.min m.S.cx
                             (Ui_services.dom_viewport_width ()
                              -. (w /. 2.) -. 5.))
                      , m.S.cy )
                  | None -> (0., 0.))
                vs))
        ~available_height_signal:
          (Logseq_el.own context
             (Signal.map
                (fun (v : S.view) ->
                  match v.S.cm with
                  | Some m ->
                      (* a flipped menu grows upward from the anchor's
                         top edge; a below menu fills down to the
                         viewport edge *)
                      if m.S.flip then m.S.atop -. 5.
                      else
                        Ui_services.dom_viewport_height () -. m.S.cy -. 5.
                  | None -> 0.)
                vs))
        ~data_attrs:[ ("data-keep-selection", "") ]
        ~on_dismiss:(fun _ -> close_cm st)
        [ box ~key:"cm-wrap"
            [ keyed ~source:entries_sig
                ~key:(fun ((i, _) : int * S.cm_item) -> i)
                ~cmp:Stdlib.compare
                ~mount:(fun entry_sig -> cm_item_el st entry_sig) ]
        ; (* popover children must be standard kinds — the empty branch's
             display:contents anchor has to sit inside a box *)
          box ~key:"cm-sub-wrap"
            [ reactive
                (fun sub ->
                  match sub with
                  | Some (_, x, y, items) -> cm_sub_el st x y items
                  | None -> Logseq_el.nothing)
                (Logseq_el.own context (cm_sub_state st)) ]
        ]))
    context parent
;;

(* -- delegated listeners --------------------------------------------- *)

let in_popups el = S.inside el;;

let cm_highlight (el : Ui_services.el) =
  (match !cm_hi_el with
   | Some e -> e.Ui_services.rm_attr "data-highlighted"
   | None -> ());
  cm_hi_el :=
    (match
       el.Ui_services.closest
         ".ui__dropdown-menu-item, .ui__dropdown-menu-sub-trigger"
     with
     | Some it when
         it.Ui_services.closest
           ".ls-context-menu-content, .ui__dropdown-menu-sub-content"
         <> None ->
         it.Ui_services.set_attr "data-highlighted" "";
         Some it
     | _ -> None)

(* ---- page-ref hover preview ----
   cljs popup-preview-impl: mousemove on .preview-ref-link arms a 1000ms
   show timer; leaving the link/popup starts a 300/500ms hide timer *)

let pv_show_id : int option ref = ref None
let pv_hide_id : int option ref = ref None
let pv_pending : Ui_services.el option ref = ref None

let pv_cancel_show () =
  (match !pv_show_id with
   | Some id -> Ui_services.timers_clear_timeout id
   | None -> ());
  pv_show_id := None;
  pv_pending := None

let pv_cancel_hide () =
  match !pv_hide_id with
  | Some id ->
      Ui_services.timers_clear_timeout id;
      pv_hide_id := None
  | None -> ()

let pv_open st (wrap : Ui_services.el) =
  pv_pending := Some wrap;
  match
    Option.bind
      (if wrap.Ui_services.connected () then
         wrap.Ui_services.query "a[data-ref]"
       else None)
      (fun a -> a.Ui_services.attr "data-ref")
  with
  | None -> ()
  | Some name ->
      let rx, ry, rw, rh = wrap.Ui_services.rect () in
      (* cljs popover anchors align=center at the trigger: the 610px card
         centers under the ref link, opening at its bottom edge *)
      let x = rx +. (rw /. 2.0) -. 305.0
      and y = ry +. rh in
      ignore
        (let* (title, page, blocks) =
            S.fetch_preview (Router.repo ()) name
        in
        (match !pv_pending with
         | Some el
           when Properties_state.same_el el wrap
                && wrap.Ui_services.connected () ->
             S.set_pv st
               (Some
                  { S.pv_x = x
                  ; S.pv_y = y
                  ; S.pv_title = title
                  ; S.pv_page = page
                  ; S.pv_blocks = blocks
                  });
         | _ -> ());
        Js.Promise.resolve ())

let pv_track st (el : Ui_services.el) =
  if el.Ui_services.closest ".ls-preview-popup" <> None then (
    pv_cancel_show ();
    pv_cancel_hide ())
  else
    match el.Ui_services.closest ".preview-ref-link" with
    | Some wrap -> (
        pv_cancel_hide ();
        match !pv_pending with
        | Some p when Properties_state.same_el p wrap -> ()
        | _ ->
            pv_cancel_show ();
            pv_pending := Some wrap;
            pv_show_id :=
              Some
                (Ui_services.timers_timeout
                   (fun () -> pv_open st wrap) 1000))
    | None -> (
        pv_cancel_show ();
        match (S.get st).S.pv, !pv_hide_id with
        | Some _, None ->
            pv_hide_id :=
              Some
                (Ui_services.timers_timeout
                   (fun () -> S.close_pv st) 400)
        | _ -> ())

(* cljs popup-show! content = PopoverContent card classes +
   ls-preview-popup (page.css: pl-6); the tippy wrapper's remaining
   inline styles live in lui-overlay.css *)
let pv_popover (st : S.t) (p : S.pv) : t =
 fun context parent ->
  (* same hover-reveal contract as the page title: actions only show
     while the pointer is over the title's content wrapper *)
  let hover = Signal.state context.Lui_ui.ui_scheduler false in
  (popover ~key:"pv-pop" ~at:(p.S.pv_x, p.S.pv_y)
    ~available_height:(Ui_services.dom_viewport_height () -. p.S.pv_y -. 5.)
    ~style_class:"ui__popover-content ls-preview-popup"
    ~on_dismiss:(fun _ -> S.close_pv st)
    [ box ~key:"pvw" ~style_class:"tippy-wrapper as-page" ~width:600
        ~data_attrs:[ ("tabindex", "-1") ]
        [ box ~key:"pvp" ~style_class:"page"
            [ box ~key:"pvt"
                ~style_class:"ls-page-title content title"
                ~accessibility_identifier:"page title"
                [ box ~key:"pvtc"
                    ~style_class:"ls-page-title-container"
                    [ box ~key:"pvtcw"
                        ~style_class:"block-content-wrapper relative"
                        ~on_pointer_enter:(fun _ ->
                          Signal.set hover true;
                          Runtime.flush ())
                        ~on_pointer_leave:(fun _ ->
                          if Runtime.signal_get hover then (
                            Signal.set hover false;
                            Runtime.flush ()))
                        ([ text ~key:"pvtw"
                             ~style_class:"block-title-wrap"
                             ~value:p.S.pv_title [] ]
                         @ (match p.S.pv_page with
                            | Some page ->
                                [ Properties_area.title_actions ~hover page ]
                            | None -> []))
                    ]
                ]
            ; box ~key:"pvb" ~style_class:"ls-page-blocks"
                [ column ~key:"pvbi"
                    ~style_class:"page-blocks-inner"
                    (List.map
                       (Tree.block_row ~scope:"preview" ~editable:false)
                       p.S.pv_blocks
                     @ [ (* cljs page-preview-content mounts the real
                            page-cp, which carries add-button *)
                         Add_button.el
                           ?puuid:
                             (match p.S.pv_page with
                              | Some pg -> pg.Model.page_uuid
                              | None -> None)
                           ~flags:(fun ctx ->
                             Signal.constant ctx.Lui_ui.ui_scheduler
                               (p.S.pv_blocks <> [], false))
                       ])
                ]
            ]
        ]
    ])
    context parent

let pv_dyn (st : S.t) : t =
  (* see ac_popover: signals must be built per mount *)
 fun context parent ->
  (reactive
     ~equal:( == )
     (fun pv ->
       match pv with
       | None -> Logseq_el.nothing
       | Some p -> pv_popover st p)
     (Logseq_el.own context
        (Signal.map (fun (v : S.view) -> v.S.pv)
           st.S.vs.Signal.state_signal)))
    context parent

(* base-ui dropdown-menu roving focus: ArrowUp/Down (and Home/End) move
   data-highlighted + DOM focus across the enabled menuitems of the
   topmost visible menu, looping; Enter selects the highlighted item.
   Hover shares the same data-highlighted marker via cm_highlight. *)
let menu_keydown (ev : Ui_services.ev) =
  let menus = Ui_services.dom_query_all ".ui__dropdown-menu-content" in
  let menu =
    menus
    |> List.filter (fun m ->
           let _, _, w, _ = m.Ui_services.rect () in
           w > 0.)
    |> List.rev
    |> (fun l -> List.nth_opt l 0)
  in
  match menu with
  | None -> false
  | Some m -> (
      let items =
        m.Ui_services.query_all
          ".ui__dropdown-menu-item:not([data-disabled]):not([aria-disabled='true']), .ui__dropdown-menu-sub-trigger:not([data-disabled])"
      in
      match (ev.Ui_services.key, items) with
      | Some (("ArrowDown" | "ArrowUp" | "Home" | "End") as k), _ :: _ ->
          let cur =
            match
              List.find_index
                (fun it ->
                  it.Ui_services.attr "data-highlighted" <> None)
                items
            with
            | Some i -> i
            | None -> -1
          in
          let n = List.length items in
          let i =
            match k with
            | "ArrowDown" -> if cur < 0 then 0 else (cur + 1) mod n
            | "ArrowUp" -> if cur < 0 then n - 1 else (cur + n - 1) mod n
            | "Home" -> 0
            | _ -> n - 1
          in
          let it = List.nth items i in
          List.iter
            (fun e ->
              e.Ui_services.rm_attr "data-highlighted";
              (* base-ui roving tabindex: only the active item is 0 *)
              e.Ui_services.set_attr "tabindex" "-1")
            items;
          it.Ui_services.set_attr "data-highlighted" "";
          it.Ui_services.set_attr "tabindex" "0";
          cm_hi_el := Some it;
          it.Ui_services.focus ();
          it.Ui_services.scroll_into_view_nearest ();
          true
      | Some "Enter", _ :: _ -> (
          match !cm_hi_el with
          | Some e -> e.Ui_services.click (); true
          | None -> true)
      | _ -> false)
;;

let handle_keydown st (ev : Ui_services.ev) =
  if S.ac_keydown st ev then (
    ev.Ui_services.prevent_default ();
    (* stopImmediate: same-target listeners registered later (the editor's
       own keydown) must not also react to the key the popup consumed *)
    ev.Ui_services.stop_immediate ())
  else if menu_keydown ev then (
    ev.Ui_services.prevent_default ();
    ev.Ui_services.stop_immediate ())
  else
    match ev.Ui_services.key with
    | Some "Escape" when (S.get st).S.cm <> None -> close_cm st
    | _ -> ()
;;

let handle_contextmenu st (ev : Ui_services.ev) =
  match ev.Ui_services.target with
  | None -> ()
  | Some el -> (
      match el.Ui_services.closest ".block-tag[data-tag-uuid]" with
      | Some chip -> (
          (* cljs block-tag popup: its own menu, not the block/page menu *)
          match
            ( chip.Ui_services.attr "data-tag-uuid"
            , Option.bind
                (chip.Ui_services.attr "data-tag-id")
                int_of_string_opt
            , chip.Ui_services.attr "data-tag-priv"
            , el.Ui_services.closest
                ".bullet-container[data-blockid], .ls-block[data-blockid]" )
          with
          | Some tuuid, Some tid, priv, Some blk
            when tuuid <> "" -> (
              match blk.Ui_services.attr "data-blockid" with
              | Some bid ->
                  ev.Ui_services.prevent_default ();
                  ev.Ui_services.stop_propagation ();
                  close_cm_picker ();
                  let title =
                    match chip.Ui_services.attr "data-tag-title" with
                    | Some r -> r
                    | None -> tuuid
                  in
                  let ax, atop, abot = S.anchor_of_el el in
                  S.open_cm_tag st ~ax ~atop ~abot ~block_id:bid
                    ~tag_uuid:tuuid ~tag_id:tid ~tag_title:title
                    ~priv:(priv = Some "true")
              | None -> ())
          | _ -> ())
      | None ->
      if el.Ui_services.closest ".ls-page-title" <> None then ()
      else
      (* cljs app-context-menu-observer: the block menu only opens from
         .bullet-container[data-blockid] (or a :block/link row's
         .ls-block[data-originalblockid]); right-click on block text is left to
         the native menu unless it lands inside an existing selection *)
      match
        el.Ui_services.closest
          ".bullet-container[data-blockid], .ls-block[data-originalblockid]"
      with
      | Some blk -> (
          let id =
            match blk.Ui_services.attr "data-originalblockid" with
            | Some oid -> Some oid
            | None -> blk.Ui_services.attr "data-blockid"
          in
          match id with
          | Some id ->
              ev.Ui_services.prevent_default ();
              ev.Ui_services.stop_propagation ();
              (* cljs block-content contextmenu selects the block it
                 opened on, unless it is already in a multi-selection *)
              if not (Editor_state.is_selected id) then
                Editor_actions.select_single id;
              close_cm_picker ();
              (* cljs popup-show! re-anchors the menu to the event
                 target element (centered, dropping from its bottom
                 edge), not the raw pointer *)
              let ax, atop, abot = S.anchor_of_el el in
              S.open_cm st ~ax ~atop ~abot ~block_id:id
                ~multi:
                  (List.length (Ui_services.dom_selected_block_uuids ())
                   >= 2)
          | None -> ())
      | None -> (
          (* cljs: right-click inside a selection shows the selection menu;
             a single selected block gets its own block menu. On hosts with
             no native context menu (gpui), any right-click inside a block
             row that isn't on an editable target opens the block menu —
             .bullet-container's hit area is too small to be the only entry *)
          match el.Ui_services.closest ".ls-block[data-blockid]" with
          | Some blk -> (
              match
                (blk.Ui_services.attr "data-blockid"
                , Ui_services.dom_selected_block_uuids ())
              with
              | Some id, _
                when el.Ui_services.closest ".block-editor" <> None
                     && (match Editor_actions.edit_model id with
                         | Some m -> Edit_model.has_selection m
                         | None -> false) ->
                  (* right-click on selected text inside the editing
                     surface: one LUI edit menu on every host — the
                     browser's native menu differs per engine and would
                     not target our model selection anyway *)
                  ev.Ui_services.prevent_default ();
                  ev.Ui_services.stop_propagation ();
                  close_cm_picker ();
                  let ax, atop, abot = S.anchor_at_point ~x:ev.Ui_services.x ~y:ev.Ui_services.y in
                  S.open_cm_edit st ~ax ~atop ~abot ~block_id:id
              | Some id, (first :: _ as sel)
                when List.exists (fun u -> u = id) sel ->
                  ev.Ui_services.prevent_default ();
                  ev.Ui_services.stop_propagation ();
                  close_cm_picker ();
                  let ax, atop, abot = S.anchor_of_el el in
                  S.open_cm st ~ax ~atop ~abot ~block_id:first
                    ~multi:(List.length sel >= 2)
              | Some id, _
                when Ui_services.env_native_block_controls ()
                     && el.Ui_services.closest ".block-editor" <> None ->
                  (* gpui right-click inside the editing surface: the LUI
                     menu is the native-menu equivalent — open it without
                     marking the block selected (a text selection may be
                     live, and a block select would hide it) *)
                  ev.Ui_services.prevent_default ();
                  ev.Ui_services.stop_propagation ();
                  close_cm_picker ();
                  let ax, atop, abot = S.anchor_of_el el in
                  S.open_cm st ~ax ~atop ~abot ~block_id:id ~multi:false
              | Some id, _
                when Ui_services.env_native_block_controls ()
                     && not (el.Ui_services.editable ()) ->
                  ev.Ui_services.prevent_default ();
                  ev.Ui_services.stop_propagation ();
                  if not (Editor_state.is_selected id) then
                    Editor_actions.select_single id;
                  close_cm_picker ();
                  let ax, atop, abot = S.anchor_of_el el in
                  S.open_cm st ~ax ~atop ~abot ~block_id:id ~multi:false
              | _ -> ())
          | None -> ()))
;;

let handle_click st (ev : Ui_services.ev) =
  (* Item activations belong to the typed control. Canceling their click
     would suppress checkbox changes and other browser default actions. *)
  match ev.Ui_services.target with
  | None -> ()
  | Some el ->
      if not (in_popups el) then (S.close_ac st; close_cm st; S.close_pv st)
;;

(* `ls:block-picker` {block, kind:"icon"|"emoji"} — the `p i`/`p r`
   selection chords open the same pickers anchored under the block row
   (the commands route through ls:editor-command, which only popups can
   service: icon_picker pulls in pages/comments that would cycle back
   into editor_keys) *)
let open_block_picker uuid emoji_only =
  match
    Ui_services.dom_query (".ls-block[data-blockid='" ^ uuid ^ "']")
  with
  | Some anchor ->
      let uuids =
        match Ui_services.dom_selected_block_uuids () with
        | [] -> [ uuid ]
        | sel -> sel
      in
      if emoji_only then
        ignore
          (Icon_picker.open_picker_with_opts ~anchor ~del:false
             ~opts:{ Icon_picker.emoji_only = true; sub = false }
             ~on_chosen:(fun c ->
               match c with
               | Icon_picker.Emoji id ->
                   List.iter
                     (fun u -> Comments_view.toggle_reaction u id)
                     uuids
               | _ -> ()))
      else
        ignore
          (Icon_picker.open_picker_with_opts ~anchor ~del:false
             ~opts:{ Icon_picker.emoji_only = false; sub = false }
             ~on_chosen:(fun c ->
               List.iter (fun u -> Page.set_icon u c) uuids))
  | None -> ()

let handle_block_picker _st (ev : Ui_services.ev) =
  match ev.Ui_services.detail "block" with
  | Some uuid ->
      open_block_picker uuid (ev.Ui_services.detail "kind" = Some "emoji")
  | None -> ()

(* Set icon / Add reaction sub-triggers open the icon picker to the
   right of the menu (base-ui inline-end placement); the choice applies
   to every selected block for the multi-select menu *)
let open_cm_picker (st : S.t) (pk : S.cm_picker)
    (anchor : Ui_services.el) (cm : S.cm) =
  let uuids =
    if cm.S.multi && Ui_services.dom_selected_block_uuids () <> [] then
      Ui_services.dom_selected_block_uuids ()
    else [ cm.S.block_id ]
  in
  close_cm_picker ();
  match pk with
  | S.Picker_icon ->
      cm_picker_key :=
        Some
          (Icon_picker.open_picker_with_opts ~anchor ~del:false
             ~opts:{ Icon_picker.emoji_only = false; sub = true }
             ~on_chosen:(fun c ->
               List.iter (fun u -> Page.set_icon u c) uuids;
               close_cm st))
  | S.Picker_emoji ->
      cm_picker_key :=
        Some
          (Icon_picker.open_picker_with_opts ~anchor ~del:false
             ~opts:{ Icon_picker.emoji_only = true; sub = true }
             ~on_chosen:(fun c ->
               (match c with
                | Icon_picker.Emoji id ->
                    List.iter
                      (fun u -> Comments_view.toggle_reaction u id)
                      uuids
                | _ -> ());
               close_cm st))
;;

let cm_hover st (el : Ui_services.el) =
  (match el.Ui_services.closest "[id^='cm-sub-']" with
  | Some trg -> (
      match trg.Ui_services.attr "id" with
      | Some s -> (
          let s = String.sub s 7 (String.length s - 7) in
          match int_of_string_opt s, (S.get st).S.cm with
          | Some idx, Some cm when cm.S.sub_open <> idx -> (
              close_cm_picker ();
              match S.cm_sub_at st idx with
              | Some (S.Sub_menu _) ->
                  let tx, ty, tw, _th = trg.Ui_services.rect () in
                  S.open_cm_sub st ~index:idx
                    ~x:(tx +. tw -. 4.)
                    ~y:(ty -. 4.)
              | Some (S.Sub_picker pk) ->
                  S.open_cm_sub st ~index:idx ~x:0. ~y:0.;
                  open_cm_picker st pk trg cm
              | None -> ())
          | Some _, _ | None, _ -> ())
      | None -> ())
  | None ->
      (* hovering a regular item inside the menu closes the open submenu *)
      if (S.get st).S.cm <> None
         && el.Ui_services.closest ".ls-context-menu-content" <> None
         && el.Ui_services.closest ".ui__dropdown-menu-sub-content" = None then (
        S.close_cm_sub st;
        close_cm_picker ()))
;;

let handle_mousemove st (ev : Ui_services.ev) =
  match ev.Ui_services.target with
  | Some el -> (
      cm_hover st el;
      cm_highlight el;
      (match el.Ui_services.closest ".menu-link-wrap" with
       | Some wrap -> (
           match wrap.Ui_services.query ".menu-link" with
           | Some lnk -> S.ac_mousemove st lnk
           | None -> ())
       | None -> ());
      pv_track st el)
  | None -> ()
;;

(* preventDefault on popup mousedown so clicking a menu item never
   steals focus from the editor textarea (cljs behaves this way — the
   editor keeps focus while the autocomplete/page-ref popup is open) *)
let handle_mousedown _st (ev : Ui_services.ev) =
  match ev.Ui_services.target with
  | Some el when el.Ui_services.closest "#ui__ac" <> None
                 && el.Ui_services.closest "input, textarea, select, button" = None ->
      ev.Ui_services.prevent_default ()
  | _ -> ()

let install_listeners context st =
  Ui_services.dom_on_document_event ~capture:true "keydown"
    (handle_keydown st);
  Ui_services.dom_on_document_event ~capture:true "contextmenu"
    (handle_contextmenu st);
  Ui_services.dom_on_document_event ~capture:true "click"
    (handle_click st);
  Ui_services.dom_on_document_event ~capture:true "mousedown"
    (handle_mousedown st);
  Ui_services.dom_on_document_event "mousemove" (handle_mousemove st);
  Ui_services.dom_on_document_event ~capture:true "ls:block-picker"
    (handle_block_picker st);
  (* the preview survives its trigger element (popup lives in the overlay
     layer); navigation must drop it like cljs' tippy instance dying with
     the reference node *)
  Ui_services.nav_on_change (fun () -> S.close_pv st);
  Tooltip.install ~scheduler:context.Lui_ui.ui_scheduler
;;

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler in
  install_listeners context st;
  let ac_open =
    Logseq_el.own context
      (Signal.map (fun (v : S.view) -> v.S.ac <> None)
         st.S.vs.Signal.state_signal)
  in
  let cm_open =
    Logseq_el.own context
      (Signal.map (fun (v : S.view) -> v.S.cm <> None)
         st.S.vs.Signal.state_signal)
  in
  let body =
    Logseq_el.fragment
      [ if_ ~test:ac_open (ac_popover st)
      ; if_ ~test:cm_open (cm_popover st)
      ; pv_dyn st
      ; Tooltip.el
      ; Editor_commands.popup_view ]
  in
  body context parent
