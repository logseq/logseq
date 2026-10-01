(* Autocomplete + context-menu overlays — mirrors editor.cljs
   auto-complete (.ui__popover-content > #ui__ac > #ui__ac-inner >
   [.ui__ac-group-name] .menu-link-wrap > a#ac-<i>.menu-link[.chosen])
   and content.cljs custom context menus (.ls-context-menu-content).

   Popups are positioned with fixed coordinates and dismissed on outside
   click / Escape; they sit directly under .cp__overlays (not portaled)
   since positioning is computed in viewport coords. *)

open Promise_ext
open Lui_elements

module S = Popups_state
module U = I18n

(* -- autocomplete item ----------------------------------------------- *)

(* cljs svg/help-circle used inside the Query item's doc tooltip *)
let help_circle_svg : t =
  Logseq_dom.dom ~key:"hc" ~tag:"svg"
    ~attrs:
      [ ("width", "16"); ("height", "16"); ("viewBox", "0 0 24 24")
      ; ("stroke-width", "2"); ("stroke", "currentColor"); ("fill", "none")
      ; ("stroke-linecap", "round"); ("stroke-linejoin", "round")
      ; ("class", "icon") ]
    [ Logseq_dom.dom ~key:"p0" ~tag:"path"
        ~attrs:[ ("stroke", "none"); ("d", "M0 0h24v24H0z")
               ; ("fill", "none") ] []
    ; Logseq_dom.dom ~key:"c" ~tag:"circle"
        ~attrs:[ ("cx", "12"); ("cy", "12"); ("r", "9") ] []
    ; Logseq_dom.dom ~key:"l" ~tag:"line"
        ~attrs:[ ("x1", "12"); ("y1", "17"); ("x2", "12"); ("y2", "17.01") ]
        []
    ; Logseq_dom.dom ~key:"p1" ~tag:"path"
        ~attrs:[ ("d", "M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4") ]
        [] ]
;;

(* cljs search-handler/highlight-exact-query: a whole-word hit is
   wrapped in mark{padding:0;border-radius:0} inside a span *)
let mark_el ~key s =
  Logseq_dom.dom ~key ~tag:"mark"
    ~attrs:[ ("style", "padding: 0; border-radius: 0") ]
    ~text:s []
;;

let text_span ~key s = Logseq_dom.dom ~key ~tag:"span" ~text:s [];;

(* cljs hiccup renders plain strings as bare DOM text nodes; LUI mounts
   only elements, so a <raw-text> placeholder marks the exact position
   and the MutationObserver in Editor_dom swaps it for a text node *)
let bare_text (s : string) : t =
 fun context parent ->
  Editor_dom.ensure_raw_text_observer ();
  Logseq_dom.dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", s) ] []
    context parent
;;

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
    Logseq_dom.dom ~key ~tag:"span" (loop 0 words label []))
  else
    match I18n.index_ci label query with
    | Some i ->
        let before = String.sub label 0 i in
        let hit = String.sub label i (String.length query) in
        let after =
          String.sub label (i + String.length query)
            (String.length label - i - String.length query)
        in
        Logseq_dom.dom ~key ~tag:"span"
          ((if before = "" then [] else [ text_span ~key:"b" before ])
          @ [ mark_el ~key:"m" hit ]
          @ if after = "" then [] else [ text_span ~key:"a" after ])
    (* cljs falls through to the multi-word branch on no match, so the
       label lands in a span inside a span.m-0 wrapper *)
    | None ->
        Logseq_dom.dom ~key ~tag:"span"
          [ text_span ~key:"x" label ]
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
      Logseq_dom.dom ~key ~style_class:"icon-cp-container"
        [ Icons.icon ~size:14. ic; hl ]
  | None -> hl
;;

(* cljs node-render icon slot: the h-5 wrap is always present for
   non-db-tag popups, empty when the node has no icon *)
let node_icon_slot ~key (it : S.ac_item) : t =
  Logseq_dom.dom ~key ~style_class:"ls-ac-node-icon"
    (match it.S.ai_node_icon with
     | Some (icn, true) ->
         [ Logseq_dom.dom ~key:"cp"
             ~style_class:"icon-cp-container"
             ~attrs:[ ("style", "color: inherit") ]
             [ Icons.icon ~size:14. icn ] ]
     | Some (icn, false) -> [ Icons.icon ~size:14. icn ]
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
  Logseq_dom.dom ~key:"node" ~style_class:"ls-ac-node"
    ((match it.S.ai_breadcrumb with
      | Some bc when bc <> "" ->
          [ Logseq_dom.dom ~key:"bc" ~style_class:"ls-ac-bc"
              [ Logseq_dom.dom ~key:"b"
                  ~style_class:"breadcrumb block-parents breadcrumb--search-result"
                  ~text:bc [] ] ]
      | _ -> [])
    @ [ Logseq_dom.dom ~key:"row" ~style_class:"ls-ac-node-row"
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
  Logseq_dom.dom ~key:"lbl" ~tag:"div"
    ~style_class:(if it.S.ai_help then "has-help" else "")
    (* no-icon commands render the label as a raw text node *)
    ~text:(match it.S.ai_icon with None -> txt | Some _ -> "")
    ~attrs:
      (match it.S.ai_title with
       | Some t -> [ ("title", t) ]
       | None -> [])
    ((match it.S.ai_icon with
      | Some ic ->
          [ Logseq_dom.dom ~key:"ic" ~tag:"span"
              ~style_class:"ls-ac-ic"
              [ Icons.icon ic
              ; Logseq_dom.dom ~key:"s" ~tag:"strong" ~text:txt [] ] ]
      | None -> [])
    @ if it.S.ai_help then
        [ Logseq_dom.dom ~key:"help" ~tag:"small"
            ~attrs:[ ("data-base-ui-tooltip-trigger", "") ]
            [ help_circle_svg ] ]
      else [])
;;

let ac_item_el ~key (st : S.t) (item_sig : S.ac_item Signal.signal) : t =
  let pair =
    Signal.map2
      (fun (it : S.ac_item) (v : S.view) -> (it, v))
      item_sig st.S.vs.Signal.state_signal
  in
  Logseq_dom.dom ~key ~style_class:"menu-link-wrap"
    [ Logseq_dom.dom ~key:"lnk" ~tag:"a"
            ~style_class:
              (reactive
                 (fun (it, v) ->
                   let chosen =
                     match v.S.ac with
                     | Some ac -> ac.S.chosen = it.S.ai_idx
                     | None -> false
                   in
                   (if chosen then "chosen " else " ") ^ "menu-link")
                 pair)
            ~attrs:
              (reactive
                 (fun (it, _) ->
                   [ ("id", "ac-" ^ string_of_int it.S.ai_idx)
                   ; ("tabindex", "0") ])
                 pair)
            [ Logseq_dom.dom ~key:"flex1" ~tag:"span"
                [ dyn
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
;;

let ac_empty_placeholder (v : S.view) : t =
  let text =
    match v.S.ac with
    | Some { kind = S.Page_ref | S.Embed_ref | S.Page_embed; _ } ->
        U.t "editor/search-for-node"
    | Some { kind = S.Tag_search; _ } -> U.t "editor/search-for-tag"
    | _ -> U.t "editor/block-search"
  in
  Logseq_dom.dom ~key:"ac-empty"
    ~style_class:"ls-ac-empty" ~text []
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
  (* the empty state is a sentinel keyed item *)
  let units_sig =
    Signal.map
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
      st.S.vs.Signal.state_signal
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
  Logseq_dom.dom ~key:"ac-inner" ~id:"ui__ac-inner"
    ~style_class:"hide-scrollbar"
    [ keyed ~source:units_sig ~key:unit_key ~cmp:Stdlib.compare
        ~mount:(fun u_sig ->
          (* the key fingerprints the unit fully, so sampling once is
             stable *)
          match Signal.sample u_sig with
          | AItem it -> row it
          | AGroup g ->
              Logseq_dom.dom ~key:("grp" ^ g.g_key)
                (Logseq_dom.dom ~key:"ghdr"
                   ~style_class:"ui__ac-group-name"
                   ~text:(Option.value ~default:"" g.g_hdr)
                   []
                 :: List.map row g.g_items)) ]
;;

(* cljs base-ui anchors the popup at a 1x1 rect at the caret point, so
   side=bottom lands its top edge at anchor.bottom = y+1 *)
let popup_anchor_dy = 1.

(* cljs shui composed-popup bakes popup-transition-class into the
   PopoverContent classes; LUI authors them as rules on
   .ui__popover-content et al. (lui-overlay.css), so the emit side only
   carries the semantic class. The cljs positioner sets
   --available-height on a wrapper — LUI positions the popup itself, so
   the var is bound inline. `flip` = (top, avail) when the popup
   measured too tall for the space below and moved above the caret
   (base-ui avoidCollisions; positioner flips data-side to top) *)
let popover_style ~x ~y ~flip =
  let top, avail =
    match flip with
    | Some (top', avail') -> (top', Printf.sprintf "%.0fpx" avail')
    | None ->
        (y +. popup_anchor_dy, Printf.sprintf "calc(100vh - %.0fpx)" (y +. 8.))
  in
  Printf.sprintf
    "position: fixed; left: %.0fpx; top: %.0fpx; z-index: 99999; \
     --available-height: %s"
    x top avail
;;

let ac_popover (st : S.t) : t =
  (* signals are built inside the mount closure: if_ unmounts dispose any
     derived signal bound under that scope, so an eagerly-created map would
     throw "cannot observe a disposed signal" on the next mount *)
 fun context parent ->
  (* cljs PopoverContent: ui__popover-content + card + transition classes *)
  (Logseq_dom.dom ~key:"ac-pop"
    ~style_class:"ui__popover-content"
    ~attrs:
      (reactive
         (fun (v : S.view) ->
           match v.S.ac with
           | Some a ->
               [ ("style", popover_style ~x:a.S.x ~y:a.S.y ~flip:a.S.flip)
               ; ("data-open", "")
               ; ( "data-side"
                 , (match a.S.flip with Some _ -> "top" | None -> "bottom") )
               ; ("data-align", "start")
               ; ("tabindex", "-1")
               ; ("data-base-ui-focusable", "")
               ; ("role", "dialog")
               ; ("data-state", "open")
               ; ( "data-editor-popup-ref"
                 , S.popup_ref_of_kind a.S.kind ) ]
           | None -> [])
         st.S.vs.Signal.state_signal)
    [ Logseq_dom.dom ~key:"ac" ~id:"ui__ac"
        ~style_class:
          (reactive
             (fun (v : S.view) ->
               match v.S.ac with
               | Some a -> S.ac_class_of_kind a.S.kind
               | None -> "")
             st.S.vs.Signal.state_signal)
        [ ac_inner st ]
    ; (* cljs page-search-aux: mod+enter hint under the tag list *)
      if_
        ~test:
          (Signal.map
             (fun (v : S.view) ->
               match v.S.ac with
               | Some a ->
                   a.S.kind = S.Tag_search && a.S.query <> ""
                   && String.lowercase_ascii a.S.query <> "page"
               | None -> false)
             st.S.vs.Signal.state_signal)
        (Logseq_dom.dom ~key:"ac-hint" ~tag:"p"
           ~style_class:"ls-tag-search-hint"
           [ (* shui/shortcut "mod+enter" → combo glow container inside a
                span *)
             Logseq_dom.dom ~key:"scw" ~tag:"span"
               [ Logseq_dom.dom ~key:"sc" ~tag:"div"
               ~style_class:"shui-shortcut-combo shui-shortcut-glow"
               ~attrs:
                 [ ("data-shortcut-binding", "mod+enter")
                 ; ("style", "white-space: nowrap") ]
               [ Logseq_dom.dom ~key:"k0" ~tag:"kbd"
                   ~style_class:"shui-shortcut-key"
                   ~text:(Platform.utf8 "\xe2\x8c\x98") []
               ; Logseq_dom.dom ~key:"sep1" ~tag:"span"
                   ~style_class:"shui-shortcut-separator" []
               ; Logseq_dom.dom ~key:"k1" ~tag:"kbd"
                   ~style_class:"shui-shortcut-key"
                   ~text:(Platform.utf8 "\xe2\x8f\x8e") [] ] ]
           ; Logseq_dom.dom ~key:"ht" ~tag:"span"
               ~text:(U.t "editor/display-tag-inline-hint") [] ])
    ])
    context parent
;;

(* -- context menu ---------------------------------------------------- *)

let cm_color_row () : t =
  let swatch c =
    Logseq_dom.dom ~key:("color-" ^ c) ~tag:"a"
      ~style_class:"ls-cm-swatch"
      ~attrs:
        [ ("title", U.t ("color/" ^ c)); ("data-cm-color", c) ]
      [ Logseq_dom.dom ~key:"bg" ~style_class:"heading-bg"
          ~attrs:
            [ ( "style"
              , "background-color: var(--color-" ^ c ^ "-500)" ) ]
            [] ]
  in
  let remove =
    Logseq_dom.dom ~key:"color-rm" ~tag:"a"
      ~style_class:"ls-cm-swatch"
      ~attrs:
        [ ("title", U.t "ui/remove-background"); ("data-cm-color", "") ]
      [ Logseq_dom.dom ~key:"bg" ~style_class:"heading-bg remove" ~text:"-" [] ]
  in
  Logseq_dom.dom ~key:"colors"
    ~style_class:"ls-cm-colors"
    [ Logseq_dom.dom ~key:"colors-row"
        ~style_class:"ls-cm-colors-row"
        (List.map swatch S.colors @ [ remove ]) ]
;;

(* shui button :ghost :icon + to-heading-button; the ghost/size styles
   live in lui-overlay.css (to-heading-button). cljs menu-heading joins
   the class list with "," — every button except the last carries a
   literal trailing comma *)
let cm_heading_btn ?(comma = true) key title value icon : t =
  Logseq_dom.dom ~key ~tag:"button"
    ~style_class:
      ("ui__button as-ghost to-heading-button ls-cm-heading-btn"
      ^ if comma then "," else "")
    ~attrs:
      [ ("type", "button"); ("title", title); ("data-cm-heading", value) ]
    [ icon ]
;;

(* ui.cljs menu-heading: h-1..h-6 font icons, h-auto/heading-off ext icons *)
let cm_heading_row () : t =
  let hs =
    List.init 6 (fun i ->
        let n = string_of_int (i + 1) in
        cm_heading_btn ("h-" ^ n) (U.tf "editor/heading" [ n ]) n
          (* cljs menu-heading uses the ti font glyph for h1-h6 *)
          (Logseq_dom.dom ~key:"ic" ~tag:"span"
             ~style_class:("ti ti-h-" ^ n ^ " ui__icon") []))
  in
  Logseq_dom.dom ~key:"headings"
    ~style_class:"ls-cm-headings"
    [ Logseq_dom.dom ~key:"headings-row"
        ~style_class:"ls-cm-headings-row"
        (hs
        @ [ cm_heading_btn "h-auto" (U.t "editor/auto-heading") "auto"
              (Icons.icon "h-auto")
          ; cm_heading_btn ~comma:false "h-rm" (U.t "editor/remove-heading")
              "none" (Icons.icon "heading-off") ]) ]
;;

(* shui/shortcut root for :combo (binding has "+") and :separate styles *)
let cm_shortcut_el (binding, caps) : t =
  let combo = String.contains binding '+' in
  let kbd i cap =
    Logseq_dom.dom ~key:("k" ^ string_of_int i) ~tag:"kbd"
      ~style_class:"shui-shortcut-key" ~text:(Platform.utf8 cap) []
  in
  let children =
    List.concat
      (List.mapi
         (fun i cap ->
           let sep =
             if combo && i > 0 then
               [ Logseq_dom.dom ~key:("sep" ^ string_of_int i) ~tag:"span"
                   ~style_class:"shui-shortcut-separator" [] ]
             else []
           in
           sep @ [ kbd i cap ])
         caps)
  in
  Logseq_dom.dom ~key:"sc" ~tag:"span" ~style_class:"ls-cm-sc"
    [ Logseq_dom.dom ~key:"sc-wrap" ~tag:"span"
        [ Logseq_dom.dom ~key:"sc-box" ~tag:"div"
            ~style_class:
              (if combo then "shui-shortcut-combo shui-shortcut-glow"
               else "shui-shortcut-separate shui-shortcut-glow")
            ~attrs:
              [ ("data-shortcut-binding", binding)
              ; ( "style"
                , if combo then "white-space: nowrap"
                  else "white-space: nowrap; gap: 4px" ) ]
            children
        ]
    ]

let cm_item_cls = "ui__dropdown-menu-item"
;;

let cm_item_el (entry_sig : (int * S.cm_item) Signal.signal) : t =
  let idx = Signal.get (Signal.map fst entry_sig) in
  (* keyed mounts run with parent=None, so the entry point must be a real
     node — wrap the dynamic branch in a box *)
  box ~key:"cm-entry"
    [ dyn
      ~equal:(fun (a : S.cm_item) b -> a = b)
      (function
      | S.Ci_sep ->
          Logseq_dom.dom ~key:"sep" ~attrs:[ ("role", "separator") ]
            ~style_class:"ui__dropdown-menu-separator" []
      | S.Ci_colors -> cm_color_row ()
      | S.Ci_headings -> cm_heading_row ()
      | S.Ci_sub (label, _sub) ->
          Logseq_dom.dom ~key:"sub"
            ~style_class:"ui__dropdown-menu-sub-trigger"
            ~attrs:
              [ ("role", "menuitem"); ("aria-haspopup", "menu")
              ; ("tabindex", "-1"); ("data-cm-sub", string_of_int idx) ]
            [ Logseq_dom.dom ~key:"lbl" ~tag:"span" ~text:label []
            ; Icons.icon ~cls:"ls-menu-chevron" "chevron-right" ]
      | S.Ci_item (label, scut, cmd) ->
          Logseq_dom.dom ~key:"item" ~style_class:cm_item_cls
            ~attrs:
              [ ("role", "menuitem"); ("tabindex", "-1")
              ; ("data-cm-item", cmd) ]
            (Logseq_dom.dom ~key:"lbl" ~tag:"span" ~text:label []
             :: (match scut with
                 | Some s -> [ cm_shortcut_el s ]
                 | None -> [])))
        (Signal.map snd entry_sig) ]
;;

let cm_sub_item_el (it : S.cm_item) : t =
  match it with
  | S.Ci_item (label, scut, cmd) ->
      Logseq_dom.dom ~key:"sub-item" ~style_class:cm_item_cls
        ~attrs:
          [ ("role", "menuitem"); ("tabindex", "-1")
          ; ("data-cm-item", cmd) ]
        (Logseq_dom.dom ~key:"lbl" ~tag:"span" ~text:label []
         :: (match scut with
             | Some s -> [ cm_shortcut_el s ]
             | None -> []))
  | _ -> Logseq_dom.dom ~key:"x" []
;;

(* dropdown-menu-sub-content for Sub_menu entries — positioned at the
   trigger's right edge (coords stored on hover in cm.sub_xy) *)
let cm_sub_el (x : float) (y : float) (items : S.cm_item list) : t =
  Logseq_dom.dom ~key:"cm-sub"
    ~style_class:"ui__dropdown-menu-sub-content"
    ~attrs:
      [ ("role", "menu"); ("tabindex", "-1")
      ; ( "style"
        , Printf.sprintf
            "position:fixed;left:%.0fpx;top:%.0fpx;z-index:1000;\
             --available-height:calc(100vh - %.0fpx)"
            x y (y +. 8.) ) ]
    [ Logseq_dom.dom ~key:"w"
        ~attrs:[ ("data-keep-selection", "") ]
        (List.map cm_sub_item_el items) ]
;;

(* (idx, x, y, items) while a Sub_menu is open; None otherwise — the
   tuple feeds dyn so the submenu mounts lazily with live coords *)
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
    Signal.map
      (fun (v : S.view) ->
        match v.S.cm with
        | Some m -> List.mapi (fun i e -> (i, e)) m.S.entries
        | None -> [])
      st.S.vs.Signal.state_signal
  in
  (* cljs as-dropdown? context menu: dropdown-menu-content merged with
     the content-props class (280px ls-context-menu-content); the items
     sit in a flat div[data-keep-selection], not a second card *)
  Logseq_dom.dom ~key:"cm"
    ~style_class:"ui__dropdown-menu-content ls-context-menu-content"
    ~attrs:
      (reactive
         (fun (v : S.view) ->
           match v.S.cm with
           | Some m ->
               [ ( "style"
                 , Printf.sprintf
                     "position: fixed; left: %.0fpx; top: %.0fpx; \
                      z-index: 999; --available-height: calc(100vh - %.0fpx)"
                     (* cljs anchors a 1px point at the click and the
                        base-ui dropdown centers the 280px content on it *)
                     (Float.max 8.
                        (Float.min (m.S.cx -. 140.)
                           (Dom_ext.window_inner_width -. 288.)))
                     m.S.cy (m.S.cy +. 8.) )
               ; ("role", "menu") ]
           | None -> [])
         st.S.vs.Signal.state_signal)
    [ Logseq_dom.dom ~key:"cm-wrap"
        ~attrs:[ ("data-keep-selection", "") ]
        [ keyed ~source:entries_sig ~key:(fun ((i, _) : int * S.cm_item) -> i)
            ~cmp:Stdlib.compare
            ~mount:(fun entry_sig -> cm_item_el entry_sig) ]
    ; dyn ~equal:Stdlib.( = )
        (fun sub ->
          match sub with
          | Some (_, x, y, items) -> cm_sub_el x y items
          | None -> Logseq_dom.nothing)
        (cm_sub_state st)
    ]
    context parent
;;

(* -- delegated listeners --------------------------------------------- *)

let in_popups el =
  Dom_ext.closest el
    ".ui__popover-content, .ls-context-menu-content, .ls-preview-popup"
  <> None
;;

(* the icon/emoji picker mounts as an overlay outside the menu DOM —
   track it so closing the sub or the whole menu removes it like the
   base-ui sub-content *)
let cm_picker_el : Editor_dom.el option ref = ref None

let close_cm_picker () =
  match !cm_picker_el with
  | Some el ->
      cm_picker_el := None;
      Properties_state.remove_overlay_el el
  | None -> ()

(* base-ui sets data-highlighted on the hovered item (bg-muted) *)
let cm_hi_el : Editor_dom.el option ref = ref None

let cm_highlight (el : Dom_ext.element) =
  (match !cm_hi_el with
   | Some e -> Editor_dom.el_remove_attr e "data-highlighted"
   | None -> ());
  cm_hi_el :=
    (match Dom_ext.closest el "[role=menuitem]" with
     | Some it when
         Dom_ext.closest it
           ".ls-context-menu-content, .ui__dropdown-menu-sub-content"
         <> None ->
         let e = Editor_dom.el_of_json it in
         Editor_dom.el_set_attr e "data-highlighted" "";
         Some e
     | _ -> None)

let close_cm st =
  cm_hi_el := None;
  close_cm_picker ();
  S.close_cm st

let run_cm_item st l = close_cm_picker (); S.run_cm_item st l
let run_cm_color st l = close_cm_picker (); S.run_cm_color st l
let run_cm_heading st l = close_cm_picker (); S.run_cm_heading st l
;;

(* ---- page-ref hover preview ----
   cljs popup-preview-impl: mousemove on .preview-ref-link arms a 1000ms
   show timer; leaving the link/popup starts a 300/500ms hide timer *)

let pv_show_id : int option ref = ref None
let pv_hide_id : int option ref = ref None
let pv_pending : Dom_ext.element option ref = ref None

let pv_cancel_show () =
  (match !pv_show_id with
   | Some id -> Dom_ext.clear_timeout id
   | None -> ());
  pv_show_id := None;
  pv_pending := None

let pv_cancel_hide () =
  match !pv_hide_id with
  | Some id ->
      Dom_ext.clear_timeout id;
      pv_hide_id := None
  | None -> ()

let pv_open st (wrap : Dom_ext.element) =
  pv_pending := Some wrap;
  match
    Option.bind
      (Dom_ext.query_selector wrap "a[data-ref]")
      (fun a -> Dom_ext.get_attribute a "data-ref")
  with
  | None -> ()
  | Some name ->
      let r = Dom_ext.bounding_rect wrap in
      let x = Dom_ext.rect_left r and y = Dom_ext.rect_bottom r +. 8.0 in
      ignore
        (let* (title, blocks) = S.fetch_preview (Router.repo ()) name in
        (match !pv_pending with
         | Some el when el == wrap ->
             S.set_pv st
               (Some
                  { S.pv_x = x
                  ; S.pv_y = y
                  ; S.pv_title = title
                  ; S.pv_blocks = blocks
                  })
         | _ -> ());
        Js.Promise.resolve ())

let pv_track st el =
  if Dom_ext.closest el ".ls-preview-popup" <> None then (
    pv_cancel_show ();
    pv_cancel_hide ())
  else
    match Dom_ext.closest el ".preview-ref-link" with
    | Some wrap -> (
        pv_cancel_hide ();
        match !pv_pending with
        | Some p when p == wrap -> ()
        | _ ->
            pv_cancel_show ();
            pv_pending := Some wrap;
            pv_show_id :=
              Some
                (Dom_ext.set_timeout_id (fun () -> pv_open st wrap) 1000))
    | None -> (
        pv_cancel_show ();
        match (S.get st).S.pv, !pv_hide_id with
        | Some _, None ->
            pv_hide_id :=
              Some
                (Dom_ext.set_timeout_id (fun () -> S.close_pv st) 400)
        | _ -> ())

let pv_popover (p : S.pv) : t =
  (* cljs popup-show! content = PopoverContent card classes +
     ls-preview-popup (page.css: pl-6, .tippy-wrapper paddings) *)
  Logseq_dom.dom ~key:"pv-pop"
    ~style_class:"ui__popover-content ls-preview-popup"
    ~attrs:
      [ ( "style"
        , Printf.sprintf
            "position: fixed; left: %.0fpx; top: %.0fpx; z-index: 999"
            p.S.pv_x p.S.pv_y ) ]
    [ Logseq_dom.dom ~key:"pvw" ~style_class:"tippy-wrapper as-page"
        ~attrs:
          [ ("tabindex", "-1")
          ; ( "style"
            , "width: 600px; text-align: left; font-weight: 500; \
               padding-bottom: 64px" )
          ]
        [ Logseq_dom.dom ~key:"pvp" ~style_class:"page"
            [ Logseq_dom.dom ~key:"pvt"
                ~style_class:"ls-page-title content title"
                ~attrs:[ ("data-testid", "page title") ]
                [ Logseq_dom.dom ~key:"pvtw" ~style_class:"block-title-wrap"
                    ~text:p.S.pv_title [] ]
            ; Logseq_dom.dom ~key:"pvb" ~style_class:"ls-page-blocks"
                [ Logseq_dom.dom ~key:"pvbi"
                    ~style_class:"page-blocks-inner"
                    (List.map
                       (Tree.block_row ~scope:"preview" ~editable:false)
                       p.S.pv_blocks)
                ]
            ]
        ]
    ]

let pv_dyn (st : S.t) : t =
  (* see ac_popover: signals must be built per mount *)
 fun context parent ->
  (dyn
     ~equal:(fun a b -> a == b)
     (fun pv ->
       match pv with
       | None -> Logseq_dom.nothing
       | Some p -> pv_popover p)
     (Signal.map (fun (v : S.view) -> v.S.pv)
        st.S.vs.Signal.state_signal))
    context parent

let handle_input st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el -> (
      match Dom_ext.closest el ".editor-wrapper textarea" with
      | Some ta ->
          (* the page-title editor is not an outliner block editor: cljs
             never opens /, [[, (( or # autocompletes there *)
          if Dom_ext.closest el "#page-title" = None then
            S.on_editor_input st ta ev
      | None -> ())
  | None -> ()
;;

let handle_keydown st (ev : Dom_ext.event) =
  if S.ac_keydown st ev then (
    Dom_ext.prevent_default ev;
    (* stopImmediate: same-target listeners registered later (the editor's
       own keydown) must not also react to the key the popup consumed *)
    Dom_ext.stop_immediate_propagation ev)
  else
    match Dom_ext.key_ ev with
    | Some "Escape" when (S.get st).S.cm <> None -> close_cm st
    | _ -> ()
;;

let handle_contextmenu st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el -> (
      match Dom_ext.closest el ".block-tag[data-tag-uuid]" with
      | Some chip -> (
          (* cljs block-tag popup: its own menu, not the block/page menu *)
          match
            ( Dom_ext.get_attribute chip "data-tag-uuid"
            , Option.bind
                (Dom_ext.get_attribute chip "data-tag-id")
                int_of_string_opt
            , Dom_ext.get_attribute chip "data-tag-priv"
            , Dom_ext.closest el
                ".bullet-container[blockid], .ls-block[blockid]" )
          with
          | Some tuuid, Some tid, priv, Some blk
            when tuuid <> "" -> (
              match Dom_ext.get_attribute blk "blockid" with
              | Some bid ->
                  Dom_ext.prevent_default ev;
                  Dom_ext.stop_propagation ev;
                  close_cm_picker ();
                  let title =
                    match Dom_ext.get_attribute chip "data-tag-title" with
                    | Some r -> r
                    | None -> tuuid
                  in
                  S.open_cm_tag st ~x:(Dom_ext.client_x ev)
                    ~y:(Dom_ext.client_y ev) ~block_id:bid
                    ~tag_uuid:tuuid ~tag_id:tid ~tag_title:title
                    ~priv:(priv = Some "true")
              | None -> ())
          | _ -> ())
      | None ->
      if Dom_ext.closest el ".ls-page-title" <> None then ()
      else
      match
        Dom_ext.closest el ".bullet-container[blockid], .ls-block[blockid]"
      with
      | Some blk -> (
          match Dom_ext.get_attribute blk "blockid" with
          | Some id ->
              Dom_ext.prevent_default ev;
              Dom_ext.stop_propagation ev;
              (* cljs block-content contextmenu selects the block it
                 opened on, unless it is already in a multi-selection *)
              if not (Editor_state.is_selected id) then
                Editor_actions.select_single id;
              close_cm_picker ();
              S.open_cm st ~x:(Dom_ext.client_x ev)
                ~y:(Dom_ext.client_y ev) ~block_id:id
                ~multi:(List.length (Platform.selected_block_uuids ()) >= 2)
          | None -> ())
      | None -> ())
;;

(* run f with the value of attr on the closest matching ancestor *)
let with_data_attr el attr f =
  match Dom_ext.closest el ("[" ^ attr ^ "]") with
  | Some el2 ->
      Option.iter f (Dom_ext.get_attribute el2 attr)
  | None -> ()
;;

let ac_index_of_id id =
  if String.length id > 3 && String.sub id 0 3 = "ac-" then
    int_of_string_opt (String.sub id 3 (String.length id - 3))
  else None
;;

let handle_click st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el ->
      if not (in_popups el) then (S.close_ac st; close_cm st; S.close_pv st)
      else (
        Dom_ext.prevent_default ev;
        if Dom_ext.closest el "[data-cm-color]" <> None then
          with_data_attr el "data-cm-color" (run_cm_color st)
        else if Dom_ext.closest el "[data-cm-heading]" <> None then
          with_data_attr el "data-cm-heading" (run_cm_heading st)
        else if Dom_ext.closest el "[data-cm-item]" <> None then
          with_data_attr el "data-cm-item" (run_cm_item st)
        else
          match Dom_ext.closest el "#ui__ac-inner a.menu-link" with
          | Some lnk ->
              Option.iter
                (fun i -> S.apply_index st i)
                (Option.bind
                   (Dom_ext.get_attribute lnk "id")
                   ac_index_of_id)
          | None -> ())
;;

(* Set icon / Add reaction sub-triggers open the icon picker to the
   right of the menu (base-ui inline-end placement); the choice applies
   to every selected block for the multi-select menu *)
let open_cm_picker (st : S.t) (pk : S.cm_picker)
    (anchor : Dom_ext.element) (cm : S.cm) =
  let uuids =
    if cm.S.multi && Platform.selected_block_uuids () <> [] then
      Platform.selected_block_uuids ()
    else [ cm.S.block_id ]
  in
  let anchor = Editor_dom.el_of_json anchor in
  close_cm_picker ();
  match pk with
  | S.Picker_icon ->
      cm_picker_el :=
        Some
          (Icon_picker.open_picker_with_opts ~anchor ~del:false
             ~opts:{ Icon_picker.emoji_only = false; sub = true }
             ~on_chosen:(fun c ->
               List.iter (fun u -> Page.set_icon u c) uuids;
               close_cm st))
  | S.Picker_emoji ->
      cm_picker_el :=
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

let cm_hover st el =
  match Dom_ext.closest el "[data-cm-sub]" with
  | Some trg -> (
      match Dom_ext.get_attribute trg "data-cm-sub" with
      | Some s -> (
          match int_of_string_opt s, (S.get st).S.cm with
          | Some idx, Some cm when cm.S.sub_open <> idx -> (
              close_cm_picker ();
              match S.cm_sub_at st idx with
              | Some (S.Sub_menu _) ->
                  let r = Dom_ext.bounding_rect trg in
                  S.open_cm_sub st ~index:idx
                    ~x:(Dom_ext.rect_right r -. 4.)
                    ~y:(Dom_ext.rect_top r -. 4.)
              | Some (S.Sub_picker pk) ->
                  S.open_cm_sub st ~index:idx ~x:0. ~y:0.;
                  open_cm_picker st pk trg cm
              | None -> ())
          | _ -> ())
      | None -> ())
  | None ->
      (* hovering a regular item inside the menu closes the open submenu *)
      if (S.get st).S.cm <> None
         && Dom_ext.closest el ".ls-context-menu-content" <> None
         && Dom_ext.closest el ".ui__dropdown-menu-sub-content" = None then (
        S.close_cm_sub st;
        close_cm_picker ())
;;

let handle_mousemove st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el -> (
      cm_hover st el;
      cm_highlight el;
      (match Dom_ext.closest el ".menu-link-wrap" with
       | Some wrap -> (
           match Dom_ext.query_selector wrap "a.menu-link" with
           | Some lnk -> S.ac_mousemove st lnk
           | None -> ())
       | None -> ());
      pv_track st el)
  | None -> ()
;;

(* preventDefault on popup mousedown so clicking a menu item never
   steals focus from the editor textarea (cljs behaves this way — the
   editor keeps focus while the autocomplete/page-ref popup is open) *)
let handle_mousedown _st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el when in_popups el -> Dom_ext.prevent_default ev
  | _ -> ()

let install_listeners st =
  Dom_ext.add_document_listener "input" (handle_input st) true;
  Dom_ext.add_document_listener "keydown" (handle_keydown st) true;
  Dom_ext.add_document_listener "contextmenu" (handle_contextmenu st) true;
  Dom_ext.add_document_listener "click" (handle_click st) true;
  Dom_ext.add_document_listener "mousedown" (handle_mousedown st) true;
  Dom_ext.add_document_listener "mousemove" (handle_mousemove st) false;
  (* the preview survives its trigger element (popup lives in the overlay
     layer); navigation must drop it like cljs' tippy instance dying with
     the reference node *)
  Platform.on_hash_change (fun () -> S.close_pv st)
;;

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler in
  install_listeners st;
  let ac_open =
    Signal.map (fun (v : S.view) -> v.S.ac <> None)
      st.S.vs.Signal.state_signal
  in
  let cm_open =
    Signal.map (fun (v : S.view) -> v.S.cm <> None)
      st.S.vs.Signal.state_signal
  in
  let body =
    Logseq_dom.fragment
      [ if_ ~test:ac_open (ac_popover st)
      ; if_ ~test:cm_open (cm_popover st)
      ; pv_dyn st ]
  in
  body context parent
