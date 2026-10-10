(* Command palette overlay — mirrors components/cmdk/{core,list_item}.cljs.

   Portable owner for both runtimes: platform access goes through
   Cmdk_state's services record (installed per runtime by cmdk_host.ml)
   and Ui_services.

   DOM contract (e2e):
     .cp__cmdk__modal > .cp__cmdk >
       .cp__cmdk-input-row > input.cp__cmdk-search-input
       .cp__cmdk-scroller >
         per group: .cp__cmdk-group[data-cmdk-group-kind] >
           .cp__cmdk-group-header + .search-results >
             [data-item-index] > [data-cmdk-item][data-highlighted]
             [data-kb-highlighted]
       .hints *)

open Lui_elements

let if_ = Lui_elements.if_
let keyed = Lui_elements.keyed

module S = Cmdk_state
module Svs = Cmdk_services

let scroller_class = "cp__cmdk-scroller"

(* [data-cmdk-item] is the semantic hook; the visuals live in
   lui-overlay.css. cursor comes from data-hoverable, not a class *)

(* -- shui shortcut port (deps/shui/src/logseq/shui/shortcut.cljs) ---- *)

let gph = (fun s -> Ui_services.literal_text s)
let g_cmd () = gph "\xe2\x8c\x98"
let g_win () = gph "\xe2\x8a\x9e"
let g_ret () = gph "\xe2\x8f\x8e"
let g_shift () = gph "\xe2\x87\xa7"
let g_opt () = gph "\xe2\x8c\xa5"
let g_ctrl () = gph "\xe2\x8c\x83"
let g_up () = gph "\xe2\x86\x91"
let g_down () = gph "\xe2\x86\x93"
let g_left () = gph "\xe2\x86\x90"
let g_right () = gph "\xe2\x86\x92"
let g_bs () = gph "\xe2\x8c\xab"
let g_caps () = gph "\xe2\x87\xaa"

(* cljs print-shortcut-key — logical key -> display glyph/text *)
let print_shortcut_key (svs : Svs.t) key =
  let lower = String.lowercase_ascii key in
  let mac = svs.Svs.is_mac () in
  let result =
    if lower = "cmd" || lower = "command" || lower = "mod" || lower = g_cmd ()
    then (if mac then g_cmd () else "Ctrl")
    else if lower = "meta" then (if mac then g_cmd () else g_win ())
    else if lower = "return" || lower = "enter" || lower = g_ret () then g_ret ()
    else if lower = "shift" || lower = g_shift () then g_shift ()
    else if
      lower = "alt" || lower = "option" || lower = "opt" || lower = g_opt ()
    then (if mac then g_opt () else "Alt")
    else if lower = "ctrl" || lower = "control" || lower = g_ctrl ()
    then (if mac then g_ctrl () else "Ctrl")
    else if lower = "backspace" || lower = "delete" then g_bs ()
    else if lower = "up" then g_up ()
    else if lower = "down" then g_down ()
    else if lower = "left" then g_left ()
    else if lower = "right" then g_right ()
    else if lower = "capslock" then g_caps ()
    else if lower = "space" then "Space"
    else if lower = "tab" then "Tab"
    else if lower = "esc" || lower = "escape" then "Esc"
    else if String.length lower = 1 then String.uppercase_ascii lower
    else lower
  in
  result

(* shortcut data: "mod shift+k" -> Sc_combo [mod;shift;k]; "g h" ->
   Sc_single g :: Sc_single h *)
type sc_group = Sc_combo of string list | Sc_single of string

let parse_binding b =
  String.split_on_char ' ' b
  |> List.filter (fun s -> s <> "")
  |> List.map (fun grp ->
         match String.split_on_char '+' grp with
         | [ k ] -> Sc_single k
         | ks -> Sc_combo ks)

(* shui-shortcut: bindings like ["mod+shift+k","g h"]; combos join keys
   with no separator, sequential keys sit apart *)
let is_combo = function Sc_combo _ -> true | Sc_single _ -> false

(* keycap: chrome on a wrapper row (Kbd admits typography only) —
   Ui_components owns the 20px slot / boxed / glow variants *)
let keycap svs key ~boxed ~glow k =
  Ui_components.keycap ~key ~boxed ~glow ~min_slot:20
    ~value:(print_shortcut_key svs k)

(* combo: one shared glowing container, separator strips between keys *)
let combo_el svs key keys =
  Ui_components.shortcut_combo ~key ~glow:true
    (List.concat
       (List.mapi
          (fun i k ->
            (if i > 0 then
               [ Ui_components.keycap_separator
                   ~key:(Printf.sprintf "sep%d" i) ]
             else [])
            @ [ keycap svs ~boxed:false ~glow:false (Printf.sprintf "k%d" i) k ])
          keys))

(* separate: sequential boxed glowing keycaps, 4px gap, no separators *)
let separate_el svs key keys =
  Ui_components.shortcut_separate ~key ~glow:false
    (List.mapi
       (fun i k ->
         keycap svs ~boxed:true ~glow:true (Printf.sprintf "k%d" i) k)
       keys)

(* chord: space-separated groups each rendered as a combo with a
   "then" separator *)
let chord_el svs key groups =
  let group_el gi grp =
    let keys =
      match grp with Sc_combo ks -> ks | Sc_single k -> [ k ]
    in
    Ui_components.shortcut_combo ~key:(Printf.sprintf "g%d" gi) ~glow:true
      (List.concat
         (List.mapi
            (fun ki k ->
              (if ki > 0 then
                 [ Ui_components.keycap_separator
                     ~key:(Printf.sprintf "gs%d" ki) ]
               else [])
              @ [ keycap svs ~boxed:false ~glow:false (Printf.sprintf "ck%d" ki) k ])
            keys))
  in
  Ui_components.shortcut_chord ~key
    (List.concat
       (List.mapi
          (fun gi grp ->
            (if gi > 0 then
               [ Ui_components.chord_separator
                   ~key:(Printf.sprintf "then%d" gi) ]
             else [])
            @ [ group_el gi grp ])
          groups))

(* cljs compact: text-only spans for the show-more/less header link *)
let compact_el svs key keys =
  Ui_components.shortcut_compact ~key
    (List.mapi
       (fun i k ->
         Ui_components.compact_key ~key:(Printf.sprintf "c%d" i)
           ~value:(print_shortcut_key svs k))
       keys)

let shui_shortcut svs (binding : string) =
  let bindings =
    String.split_on_char ',' binding
    |> List.map String.trim
    |> List.filter (fun b -> b <> "")
  in
  column ~key:"sc" ~style_class:"shui-shortcut"
    (List.concat
       (List.mapi
          (fun bi b ->
            let groups = parse_binding b in
            let body =
              if List.length groups > 1 && List.for_all is_combo groups then
                [ chord_el svs "chord" groups ]
              else
                let keys =
                  List.concat_map
                    (fun g ->
                      match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
                    groups
                in
                (match groups with
                 | Sc_combo _ :: _ -> [ combo_el svs "combo" keys ]
                 | _ -> [ separate_el svs "sep" keys ])
            in
            [ row ~key:(Printf.sprintf "b%d" bi)
                ~style_class:"shui-shortcut-b"
                body ])
          bindings))

(* hints render every binding as boxed separate keycaps (cljs styles the
   hints combo identically — separate is the same visual) *)
let hint_shortcut svs keys = separate_el svs "hs" keys

(* cljs group-header link: (shui/shortcut "mod down" {:style :compact}) *)
let compact_shortcut svs s =
  let groups = parse_binding s in
  let keys =
    List.concat_map
      (fun g -> match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
      groups
  in
  compact_el svs "cmp" keys

(* -- query highlight (list_item.cljs highlight-query) ----------------- *)

let str_normalize svs (s : string) = svs.Svs.normalize s

(* case-insensitive index of `sub` in `low` from `start`; -1 if none *)
let find_sub_ci sub low start =
  let m = String.length sub and n = String.length low in
  let rec go i =
    if i + m > n then -1
    else if String.sub low i m = sub then i
    else go (i + 1)
  in
  go start

(* cljs cmdk/highlight-content-query parses the worker's pfts markers
   into span/mark segments via text-util/cut-by *)
let pfts_segments text : (bool * string) list =
  let n = String.length text in
  let lo = String.length S.pfts_open and lc = String.length S.pfts_close in
  let rec go pos acc =
    let i = S.find_sub S.pfts_open text pos in
    if i < 0 then List.rev ((false, String.sub text pos (n - pos)) :: acc)
    else
      let j = S.find_sub S.pfts_close text (i + lo) in
      if j < 0 then List.rev ((false, String.sub text pos (n - pos)) :: acc)
      else
        go (j + lc)
          ((true, String.sub text (i + lo) (j - i - lo))
           :: (false, String.sub text pos (i - pos)) :: acc)
  in
  go 0 []

(* leftmost match across query terms (whitespace-split); ties keep the
   earliest term like a JS "a|b" alternation *)
let hl_segments ~query ~text : (bool * string) list =
  if S.find_sub S.pfts_open text 0 >= 0 then pfts_segments text
  else if String.trim query = "" || text = "" then [ (false, text) ]
  else
    (* indices must stay byte-aligned with [text]: cljs highlights via a
       case-insensitive regex on the raw title, so lowercase the original
       and compare normalized low with a normalized query *)
    let low = String.lowercase_ascii text in
    let terms =
      String.split_on_char ' ' (String.trim (String.lowercase_ascii query))
      |> List.filter (fun s -> s <> "")
    in
    let matches =
      List.filter_map
        (fun t ->
          let i = find_sub_ci t low 0 in
          if i < 0 then None else Some (i, i + String.length t))
        terms
    in
    if matches = [] then [ (false, text) ]
    else
      (* merge overlapping match ranges, keep leftmost-first *)
      let ranges =
        List.sort (fun (a, _) (b, _) -> compare a b) matches
        |> List.fold_left
             (fun acc (s, e) ->
               match acc with
               | (s', e') :: tl when s <= e' ->
                   (s', max e e') :: tl
               | _ -> (s, e) :: acc)
             []
        |> List.rev
      in
      let rec emit pos = function
        | [] ->
            if pos < String.length text then [ (false, String.sub text pos (String.length text - pos)) ]
            else []
        | (s, e) :: tl ->
            (if s > pos then [ (false, String.sub text pos (s - pos)) ] else [])
            @ (true, String.sub text s (e - s)) :: emit e tl
      in
      emit 0 ranges

(* cljs [:span {:data-testid text} seg/span ... seg/mark] — mark gets
   padding 0 border-radius 0; data-testid is the original (unmarked)
   title *)
let hl_span key (item_sig : S.item Signal.signal)
    (title_of : S.item -> string) : t =
  text ~key ~as_:`Span
    ~data_attrs:
      (reactive
         (fun it ->
           let plain =
             String.concat ""
               (List.map snd
                  (hl_segments ~query:it.S.iq ~text:(title_of it)))
           in
           [ ("data-testid", plain) ])
         item_sig)
    [ keyed
        ~source:
          (Signal.map
             (fun it ->
               hl_segments ~query:it.S.iq ~text:(title_of it)
               |> List.filter (fun (_, s) -> s <> "")
               |> List.mapi (fun i (hl, s) -> (i, hl, s)))
             item_sig)
        ~key:(fun (i, _, _) -> i)
        ~cmp:Stdlib.compare
        ~mount:(fun seg ->
          reactive
            (fun (_, hl, txt) ->
              if hl then
                text ~key:"hl" ~as_:`Mark ~padding:0 ~corner_radius:0
                  ~value:txt []
              else text ~key:"tx" ~as_:`Span ~value:txt [])
            seg)
    ]

let badge_el svs key =
  Ui_components.cmdk_badge ~key
    ~value:(svs.Svs.i18n "cmdk.group/current-page")

(* -- item row -------------------------------------------------------- *)

let wrapper_attrs (it : S.item) =
  [ ("data-item-index", string_of_int it.S.idx)
  ; ("data-item-key", it.S.ikey) ]

let row_data_attrs (it : S.item) =
  [ ("data-cmdk-item", "true")
  ; ("data-item-index", string_of_int it.S.idx)
  ; ("data-item-key", it.S.ikey)
  ; ( "data-highlighted"
    , (if it.S.ihl && not it.S.imouse then "true" else "false") ) ]
  @ (if it.S.imouse then [ ("data-hoverable", "true") ] else [])
  @ (if it.S.ihl && not it.S.imouse then [ ("data-kb-highlighted", "true") ]
     else [])

(* isc parses to kbd cells inside a reactive slot remounting only on
   isc change *)
let shortcut_slot svs (item_sig : S.item Signal.signal) : t =
  if_
    ~test:(Signal.map (fun (it : S.item) -> it.S.isc <> "") item_sig)
    (Ui_components.shortcut_slot ~key:"sc-row"
       ~opacity:
         (Signal.map
            (fun (it : S.item) -> if it.S.ihl then 1. else 0.9)
            item_sig)
       [ reactive
           ~equal:(fun (a : S.item) b -> a.S.isc = b.S.isc)
           (fun it -> shui_shortcut svs it.S.isc)
           item_sig
       ])

(* data-item-index / data-item-key drive the delegated click +
   mousemove dispatch; [data-cmdk-item][data-hoverable][data-highlighted]
   [data-kb-highlighted] is the lui-overlay.css row contract (and the
   e2e locator) *)
(* state-channel signals bound on the item column: kb highlight paints
   the chosen-row tokens; a mouse hover paints the same bg plus the
   light ring (cleared in dark via the --lx-cmdk-* tokens) *)
let item_bg item_sig =
  Signal.map
    (fun (it : S.item) ->
      if it.S.ihl && not it.S.imouse then
        "var(--lx-gray-03, var(--lx-cmdk-chosen-bg))"
      else "transparent")
    item_sig

let item_shadow item_sig =
  Signal.map
    (fun (it : S.item) ->
      if it.S.ihl && not it.S.imouse then "var(--lx-cmdk-kb-shadow)"
      else "none")
    item_sig

let item_hover_bg item_sig =
  Signal.map
    (fun (it : S.item) ->
      if it.S.imouse then "var(--lx-gray-03, var(--lx-cmdk-chosen-bg))"
      else "transparent")
    item_sig

let item_hover_ring item_sig =
  Signal.map
    (fun (it : S.item) ->
      if it.S.imouse then
        if it.S.ihl then "var(--lx-cmdk-hover-ring-hl)"
        else "var(--lx-cmdk-hover-ring)"
      else "none")
    item_sig

let item_cursor item_sig =
  Signal.map
    (fun (it : S.item) -> if it.S.imouse then "pointer" else "default")
    item_sig

let item_row svs (st : S.t) (item_sig : S.item Signal.signal) : t =
  (* header presence is fixed per item (baked at item build); the
     one-time read picks the 2px top spacer vs the 6px pad *)
  let header =
    match (Signal.get item_sig).S.header with
    | Some _ ->
        Some
          (Ui_components.cmdk_item_header ~key:"hdr"
             [ hl_span "hdr-hl" item_sig
                 (fun it -> Option.value ~default:"" it.S.header)
             ; if_
                 ~test:
                   (Signal.map
                      (fun (it : S.item) -> it.S.ibadge = S.Header_badge)
                      item_sig)
                 (badge_el svs "hb")
             ])
    | None -> None
  in
  box ~key:"item-wrap" ~padding_horizontal:2
    ~data_attrs:(reactive (fun it -> wrapper_attrs it) item_sig)
    [ (* pressable: the delegated document click can't see inside the
         native tree — on_press routes row clicks to the item directly *)
      Ui_parts.pressable
        ~on_press:(fun _ -> S.run_item st (Signal.get item_sig))
        (Ui_components.cmdk_item_row ~key:"item"
           ~data_attrs:(Signal.map row_data_attrs item_sig)
           ~background:(item_bg item_sig)
           ~shadow:(item_shadow item_sig)
           ~hover_background:(item_hover_bg item_sig)
           ~hover_ring:(item_hover_ring item_sig)
           ~cursor:(item_cursor item_sig)
           ~header
           ~main:
             (Ui_components.cmdk_item_main ~key:"main"
                [ Ui_components.cmdk_icon_chip ~key:"icon"
                    [ if_
                        ~test:
                          (Signal.map
                             (fun (it : S.item) -> it.S.iicon <> "")
                             item_sig)
                        ((* cljs icon-component/get-node-icon-cp wraps
                            the glyph in .icon-cp-container *)
                         box ~key:"iccp"
                           ~style_class:"icon-cp-container"
                           [ icon
                               ~name:
                                 (reactive
                                    (fun it -> `app it.S.iicon)
                                    item_sig)
                               ~point_size:14 [] ])
                    ]
                ; Ui_components.cmdk_item_body ~key:"txt"
                    [ Ui_components.cmdk_main_text ~key:"main-text"
                        [ hl_span "label" item_sig (fun it -> it.S.ititle)
                        ; if_
                            ~test:
                              (Signal.map
                                 (fun (it : S.item) ->
                                   it.S.ibadge = S.Text_badge)
                                 item_sig)
                            (badge_el svs "tb")
                        ; if_
                            ~test:
                              (Signal.map
                                 (fun (it : S.item) -> it.S.info <> None)
                                 item_sig)
                            (Ui_components.cmdk_info_text ~key:"info"
                               [ text ~key:"dash" ~as_:`Span
                                   ~value:(gph " — ") []
                               ; hl_span "info-hl" item_sig
                                   (fun it ->
                                     Option.value ~default:"" it.S.info)
                               ])
                        ]
                    ]
                ; shortcut_slot svs item_sig
                ]))
    ]

(* -- group ----------------------------------------------------------- *)

let gid_name = function
  | S.G_create -> "create"
  | S.G_current_page -> "current-page"
  | S.G_nodes -> "nodes"
  | S.G_recently_updated -> "recently-updated"
  | S.G_commands -> "commands"
  | S.G_files -> "files"
  | S.G_filters -> "filters"
  | S.G_codes -> "codes"
  | S.G_themes -> "themes"

let gid_label svs = function
  | S.G_create -> svs.Svs.i18n "cmdk.group/create"
  | S.G_current_page -> svs.Svs.i18n "cmdk.group/current-page"
  | S.G_nodes -> svs.Svs.i18n "cmdk.group/nodes"
  | S.G_recently_updated -> svs.Svs.i18n "cmdk.group/recents"
  | S.G_commands -> svs.Svs.i18n "cmdk.group/commands"
  | S.G_files -> svs.Svs.i18n "cmdk.group/files"
  | S.G_filters -> svs.Svs.i18n "cmdk.group/filters"
  | S.G_codes -> svs.Svs.i18n "cmdk.group/codes"
  | S.G_themes -> svs.Svs.i18n "cmdk.group/themes"

(* cljs group header: title click toggles more/less; the trailing link
   (hidden while a filter is active) shows a compact mod+down/up hint *)
let group_header svs (st : S.t) (g : S.group) : t =
  let toggle _ =
    S.toggle_expand st g.S.gid (not g.S.gexpanded)
  in
  Ui_components.cmdk_group_header ~key:"gheader"
    [ Ui_components.cmdk_group_title ~key:"gtitle" ~value:g.S.gtitle
        ~on_press:toggle
    ; Ui_components.cmdk_group_count ~key:"gcount"
        ~value:
          (if g.S.gtotal >= 99 then "99+"
           else string_of_int g.S.gtotal)
    ; spacer ~key:"gsp" ~grow:1. ~style_class:"cp__cmdk-group-spacer" []
    ; (if (g.S.gtotal > g.S.glimit || g.S.gexpanded)
          && not g.S.gfilter_active
          && not (S.get st).S.sidebar
       then
         Ui_components.cmdk_group_more ~key:"gmore" ~on_press:toggle
           [ text ~key:"lbl"
               ~value:
                 (if g.S.gexpanded then svs.Svs.i18n "ui/show-less"
                  else svs.Svs.i18n "ui/show-more")
               []
           ; compact_shortcut svs
               (if g.S.gexpanded then "mod up" else "mod down")
           ]
       else spacer ~key:"gmore" [])
    ]

let group_el svs (st : S.t) (group_sig : S.group Signal.signal) : t =
  let items_sig =
    Signal.map (fun (g : S.group) -> g.S.gitems) group_sig
  in
  (* the bottom hairline mirrors :last-child's missing border — a group
     is last when its gid closes the view's group list *)
  let last_sig =
    Signal.map2
      (fun (v : S.view) (g : S.group) ->
        match List.rev v.S.groups with
        | last :: _ -> last.S.gid = g.S.gid
        | [] -> true)
      st.S.vs.Signal.state_signal group_sig
  in
  Ui_components.cmdk_group ~key:"group"
    ~kind:(gid_name (Signal.get group_sig).S.gid)
    ~last:last_sig
    ~pad:(if (Signal.get group_sig).S.gid = S.G_create then 0 else 4)
    [ reactive
        ~equal:(fun (a : S.group) b ->
          (a.S.gid = S.G_create) = (b.S.gid = S.G_create)
          && a.S.gtitle = b.S.gtitle
          && a.S.gtotal = b.S.gtotal
          && a.S.glimit = b.S.glimit
          && a.S.gexpanded = b.S.gexpanded
          && a.S.gfilter_active = b.S.gfilter_active)
        (fun g ->
          if g.S.gid = S.G_create then spacer ~key:"gheader" []
          else group_header svs st g)
        group_sig
    ; column ~key:"results" ~style_class:"search-results"
        ~padding_horizontal:2
        [ keyed ~source:items_sig ~key:S.item_dom_key
            ~cmp:Stdlib.compare
            ~mount:(fun item_sig -> item_row svs st item_sig)
        ]
    ]

(* -- palette body ---------------------------------------------------- *)

let groups_body svs st : t =
 fun ctx parent ->
  let groups_sig =
    Signal.map (fun (v : S.view) -> v.S.groups)
      st.S.vs.Signal.state_signal
  in
  (keyed ~source:groups_sig ~key:(fun (g : S.group) -> gid_name g.S.gid)
     ~cmp:Stdlib.compare
     ~mount:(fun g -> group_el svs st g))
    ctx parent

let search_only_chip svs st (gid : S.group_id) =
  Ui_components.cmdk_search_only ~key:"search-only"
    [ Ui_components.cmdk_search_only_row ~key:"row"
        [ text ~key:"lbl"
            ~value:(svs.Svs.i18n "cmdk.filter/only-label") []
        ; Ui_components.cmdk_search_only_name ~key:"grp"
            ~value:(gid_label svs gid)
        ; Ui_components.cmdk_search_only_clear ~key:"clr"
            ~label:(svs.Svs.i18n "ui/close")
            ~on_press:(fun _ -> S.clear_filter st)
        ]
    ]

let scroller svs st : t =
 fun ctx parent ->
  let has_items_sig =
    Signal.map
      (fun (v : S.view) ->
        v.S.groups <> []
        && List.exists (fun (g : S.group) -> g.S.gitems <> []) v.S.groups)
      st.S.vs.Signal.state_signal
  in
  let input_sig =
    Signal.map (fun (v : S.view) -> v.S.input) st.S.vs.Signal.state_signal
  in
  (* scroll children overlay each other (lui-scroll > * is grid 1/1) —
     the results stack inside a single column instead *)
  (Ui_components.cmdk_scroller ~key:"scroller"
    [ column ~key:"scroller-body" ~grow:1.
        [ reactive
            (fun (v : S.view) ->
              match v.S.filter with
              | Some gid -> search_only_chip svs st gid
              | None -> spacer ~key:"chip" [])
            st.S.vs.Signal.state_signal
        ; groups_body svs st
        ; if_
            ~test:
              (Signal.map2
                 (fun (q : string) has -> q <> "" && not has)
                 input_sig has_items_sig)
            (Ui_components.cmdk_empty ~key:"empty"
               [ text ~key:"empty-t"
                   ~value:(svs.Svs.i18n "search/no-result") [] ])
        ; spacer ~key:"scpad"
            ~height:(if (S.get st).S.sidebar then 0 else 56) []
        ]
    ])
    ctx parent

(* -- input row -------------------------------------------------------- *)

let input_row svs st : t =
  let move_sig =
    Signal.map (fun (v : S.view) -> v.S.move_mode)
      st.S.vs.Signal.state_signal
  in
  Ui_components.cmdk_input_row ~key:"input-row"
    [ (* move_mode can flip while the palette stays open (move-blocks
         command); no placeholder_signal exists, so a keyed remount
         swaps the placeholder — the caller re-focuses the input right
         after the state publish *)
      reactive
        (fun move_mode ->
          (* sidebar blocks mount seeded with the query; the modal is
             always "" so this is a no-op there *)
          Ui_components.cmdk_search_input ~key:"input"
            ~text:(S.get st).S.input
            ~placeholder:
              (if move_mode then
                 svs.Svs.i18n "cmdk.input/move-blocks-placeholder"
               else svs.Svs.i18n "cmdk.input/default-placeholder")
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, q) -> S.on_input st q
              | _ -> ())
            ())
        move_sig
    ]

(* -- hints ------------------------------------------------------------- *)

let hint_button svs label keys =
  Ui_components.cmdk_hint_button ~key:("hb-" ^ label) ~label
    ~on_press:(fun _ -> ())
    [ text ~key:"t" ~style_class:"cp__cmdk-hint-label" ~value:label []
    ; hint_shortcut svs keys ]

(* cljs tip: random per mount between "Press / to filter search
   results" and "Press ⌘⏎ to open search in the sidebar"; clear-filter
   tip while a filter is active. The {1} slot renders as a kbd
   shortcut. *)
let tip_el svs (filtered, tip) =
  let key, keys, combo =
    if filtered then ("cmdk.tip/clear-filter", [ "esc" ], false)
    else if tip = 0 then ("cmdk.tip/filter-results", [ "/" ], false)
    else ("cmdk.tip/open-sidebar", [ "mod"; "return" ], true)
  in
  let text_ = svs.Svs.i18n key in
  let parts = String.split_on_char '{' text_ in
  let pre, post =
    match parts with
    | [ a; b ] ->
        ( a
        , (match String.split_on_char '}' b with
           | [ _; c ] -> c
           | _ -> "") )
    | _ -> (parts |> String.concat "{", "")
  in
  Ui_components.cmdk_tip ~key:"tip"
    [ text ~key:"pre" ~value:pre []
    ; (if combo then combo_el svs "tipsc" keys
       else separate_el svs "tipsc" keys)
    ; text ~key:"post" ~value:post [] ]

let hint_action_of (it : S.item) =
  match it.S.act with
  | S.Create_page _ | S.Create_tag _ -> (`create, false)
  | S.Set_filter _ -> (`filter, false)
  | S.Run _ -> (`trigger, false)
  | S.Open_page _ -> (`open_, false)
  | S.Open_block _ -> (`open_, true)
  | S.Open_file _ -> (`open_, false)

let hint_variant (it : S.item option) : int =
  match it with
  | None -> 0
  | Some it -> (
      match hint_action_of it with
      | `open_, has_block -> if has_block then 1 else 2
      | `create, _ -> 3
      | `filter, _ -> 4
      | `trigger, _ -> 5)

let action_hints svs (it : S.item option) =
  match it with
  | None -> spacer ~key:"actions" []
  | Some it ->
      let btns =
        match hint_action_of it with
        | `open_, has_block ->
            [ hint_button svs (svs.Svs.i18n "cmdk.action/open") [ "return" ]
            ; hint_button svs
                (svs.Svs.i18n "cmdk.action/open-in-sidebar")
                [ "shift"; "return" ]
            ]
            @ (if has_block then
                 [ hint_button svs (svs.Svs.i18n "cmdk.action/copy-ref")
                     [ "cmd"; "c" ] ]
               else [])
        | `create, _ ->
            [ hint_button svs (svs.Svs.i18n "cmdk.action/create") [ "return" ] ]
        | `filter, _ ->
            [ hint_button svs (svs.Svs.i18n "cmdk.action/filter") [ "return" ] ]
        | `trigger, _ ->
            [ hint_button svs (svs.Svs.i18n "cmdk.action/trigger") [ "return" ] ]
      in
      Ui_components.cmdk_hints_group ~key:"actions" btns

let hints svs st : t =
 fun ctx parent ->
  (Ui_components.cmdk_hints_bar ~key:"hints"
    [ Ui_components.cmdk_hints_inner ~key:"hints-inner"
        [ Ui_components.cmdk_hints_row ~key:"hints-row"
            [ Ui_components.cmdk_hints_label ~key:"hint-label"
                ~value:(svs.Svs.i18n "cmdk.tip/label")
            ; reactive (tip_el svs)
                (Signal.map
                   (fun (v : S.view) -> (v.S.filter <> None, v.S.tip))
                   st.S.vs.Signal.state_signal)
            ]
        ]
    ; (* the hint bar's shape is the action variant, not the item's
         identity — remount only when the variant flips *)
      reactive
        ~equal:(fun (a : S.item option) b ->
          hint_variant a = hint_variant b)
        (action_hints svs)
        (Signal.map
           (fun (v : S.view) -> S.item_at v v.S.hl)
           st.S.vs.Signal.state_signal)
    ])
    ctx parent

let palette svs st : t =
  Ui_components.cmdk_palette ~key:"cmdk" ~sidebar:false
    [ input_row svs st; scroller svs st; hints svs st ]

(* cljs cmdk-block: the :sidebar? variant renders the same cp__cmdk body
   inside .cp__cmdk__block, without the modal shell and without the hints
   row ((when-not sidebar? (hints))) *)
let sidebar ~(services : Svs.t) ~query : t =
 fun ctx parent ->
  let st = S.make_sidebar ctx.Lui_ui.ui_scheduler services query in
  (Ui_components.cmdk_palette ~key:("cmdk-sb-" ^ query) ~sidebar:true
     [ input_row services st; scroller services st ])
    ctx parent

(* -- delegated event handlers -------------------------------------------- *)

let handle_keydown st (ev : Svs.key_ev) : Svs.key_answer =
  let v = S.get st in
  let no = { Svs.prevent = false; stop = false } in
  if v.S.open_ then
    match ev.Svs.key with
    | "Escape" ->
        if S.clear_or_close st then { Svs.prevent = true; stop = true }
        else no
    | "ArrowDown" ->
        if ev.Svs.meta || ev.Svs.ctrl then
          Option.iter (fun gid -> S.toggle_expand st gid true) (S.hl_group st)
        else S.move_hl st 1;
        { Svs.prevent = true; stop = false }
    | "ArrowUp" ->
        if ev.Svs.meta || ev.Svs.ctrl then
          Option.iter (fun gid -> S.toggle_expand st gid false) (S.hl_group st)
        else S.move_hl st (-1);
        { Svs.prevent = true; stop = false }
    | "n" when ev.Svs.ctrl ->
        S.move_hl st 1;
        { Svs.prevent = true; stop = false }
    | "p" when ev.Svs.ctrl ->
        S.move_hl st (-1);
        { Svs.prevent = true; stop = false }
    | "Enter" ->
        (* cljs consume-open-search-sidebar-keydown! binds mod+enter
           before the highlighted-item action *)
        if ev.Svs.meta || ev.Svs.ctrl then
          S.open_search_sidebar st
        else if ev.Svs.shift then S.run_highlighted_sidebar st
        else S.run_highlighted st;
        { Svs.prevent = true; stop = true }
    | "k" when ev.Svs.meta || ev.Svs.ctrl ->
        S.close st;
        { Svs.prevent = true; stop = false }
    | _ -> no
  else
    match ev.Svs.key with
    | "k"
      when (ev.Svs.meta || ev.Svs.ctrl)
           && not (ev.Svs.shift || ev.Svs.alt) ->
        S.open_palette st;
        { Svs.prevent = true; stop = false }
    | "m"
      when (ev.Svs.meta || ev.Svs.ctrl)
           && ev.Svs.shift ->
        (* cljs mod+shift+m -> editor/move-blocks -> cmdk move mode *)
        S.open_palette ~move:true st;
        { Svs.prevent = true; stop = false }
    | _ -> no

let handle_click st (ev : Svs.click_ev) =
  (* The retained search button owns its press. Opening here as well
     would make the button's toggle close the same click again. *)
  if ev.Svs.search_button then ()
  else (
    (* outside click closes: the (unstyled) LUI backdrop does not
       cover the page, so dismiss here too *)
    if (S.get st).S.open_ && not ev.Svs.inside_modal then S.close st;
    match ev.Svs.item_key with
    | Some key ->
        let v = S.get st in
        (match
           List.find_opt
             (fun (it : S.item) -> it.S.ikey = key)
             (Array.to_list (S.flat_items v))
         with
         | Some it -> S.run_item st it
         | None -> ())
    | None -> ())

let handle_mousemove st (ev : Svs.move_ev) =
  let v = S.get st in
  if v.S.open_ && ev.Svs.moved && ev.Svs.inside_cmdk then
    match ev.Svs.item_index with
    | Some i when i <> v.S.hl -> S.set_hl st i true
    | Some _ -> S.set_hl st v.S.hl true
    | None -> ()

(* The host owns modal placement, focus trapping, and dismissal. *)
let modal_shell svs st =
  let width = int_of_float (Float.min 896. (Ui_services.dom_viewport_width () *. 0.9)) in
  dialog ~key:"cmdk-shell" ~width ~padding:0 ~style_class:"ls-dialog-cmdk"
    ~on_dismiss:(fun _ -> S.close st)
    [ Ui_components.cmdk_modal ~key:"modal" [ palette svs st ] ]

let render ~(services : Svs.t) (_ms : 'a Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler services in
  services.Svs.install_listeners
    { Svs.key = handle_keydown st
    ; click = handle_click st
    ; mousemove = handle_mousemove st };
  let open_sig =
    Signal.map (fun (v : S.view) -> v.S.open_) st.S.vs.Signal.state_signal
  in
  (* The keyed box gives the conditional its own reconcile-stable parent:
     spliced directly under #app-container its dynamic segment goes stale
     after navigation and later mounts emit an inconsistent op batch *)
  box ~key:"cmdk_view"
    [ if_ ~test:open_sig (modal_shell services st) ]
    context parent
