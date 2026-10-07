(* Command palette overlay — mirrors components/cmdk/{core,list_item}.cljs.

   DOM contract (e2e):
     .cp__cmdk__modal > .cp__cmdk >
       .cp__cmdk-input-row > input.cp__cmdk-search-input
       .w-full.flex-1.overflow-y-auto (scroller) >
         per group: .border-b.border-gray-06[.pb-1] >
           header (.text-xs... .bg-gray-02.h-8) + .search-results >
             div[data-item-index] > div[data-cmdk-item].transition-colors
             [.cursor-pointer only in mouse mode] [data-highlighted]
             [data-kb-highlighted]
       .hints

   Uses the LUI `dialog` primitive for the modal shell (backdrop,
   Esc-dismiss, focus trap); the inner palette rows are logseq-*
   extension elements because LUI menu primitives render <button>
   items, not the contracted DOM. *)

open Lui_elements

let dom = Logseq_dom.dom
let if_ = Logseq_dom.if_
let keyed = Logseq_dom.keyed

module S = Cmdk_state

let scroller_class = "cp__cmdk-scroller"

(* [data-cmdk-item] is the semantic hook; the visuals live in
   lui-overlay.css. cursor comes from data-hoverable, not a class *)

(* -- shui shortcut port (deps/shui/src/logseq/shui/shortcut.cljs) ---- *)

let gph = Platform.utf8
let g_cmd = gph "\xe2\x8c\x98"
let g_win = gph "\xe2\x8a\x9e"
let g_ret = gph "\xe2\x8f\x8e"
let g_shift = gph "\xe2\x87\xa7"
let g_opt = gph "\xe2\x8c\xa5"
let g_ctrl = gph "\xe2\x8c\x83"
let g_up = gph "\xe2\x86\x91"
let g_down = gph "\xe2\x86\x93"
let g_left = gph "\xe2\x86\x90"
let g_right = gph "\xe2\x86\x92"
let g_bs = gph "\xe2\x8c\xab"
let g_caps = gph "\xe2\x87\xaa"

(* cljs print-shortcut-key — logical key -> display glyph/text *)
let print_shortcut_key key =
  let lower = String.lowercase_ascii key in
  let mac = Platform.is_mac () in
  let result =
    if lower = "cmd" || lower = "command" || lower = "mod" || lower = g_cmd
    then (if mac then g_cmd else "Ctrl")
    else if lower = "meta" then (if mac then g_cmd else g_win)
    else if lower = "return" || lower = "enter" || lower = g_ret then g_ret
    else if lower = "shift" || lower = g_shift then g_shift
    else if
      lower = "alt" || lower = "option" || lower = "opt" || lower = g_opt
    then (if mac then g_opt else "Alt")
    else if lower = "ctrl" || lower = "control" || lower = g_ctrl then "Ctrl"
    else if lower = "space" || lower = " " then "Space"
    else if lower = "up" || lower = g_up then g_up
    else if lower = "down" || lower = g_down then g_down
    else if lower = "left" || lower = g_left then g_left
    else if lower = "right" || lower = g_right then g_right
    else if lower = "tab" then "Tab"
    else if lower = "open-square-bracket" then "["
    else if lower = "close-square-bracket" then "]"
    else if lower = "dash" then "-"
    else if lower = "semicolon" then ";"
    else if lower = "equals" then "="
    else if lower = "single-quote" then "'"
    else if lower = "backslash" then "\\"
    else if lower = "comma" then ","
    else if lower = "period" then "."
    else if lower = "slash" then "/"
    else if lower = "grave-accent" then "`"
    else if lower = "page-up" then "PgUp"
    else if lower = "page-down" then "PgDn"
    else if lower = "esc" || lower = "escape" then "Esc"
    else if lower = "backspace" then g_bs
    else if lower = "delete" then "Delete"
    else if lower = "caps-lock" || lower = "capslock" then g_caps
    else key
  in
  if String.length result = 1 then
    if result.[0] >= 'a' && result.[0] <= 'z' then
      String.uppercase_ascii result
    else result
  else String.capitalize_ascii result

(* split on a literal separator (clojure string/split on string) *)
let split_str sep s =
  let n = String.length s and m = String.length sep in
  let rec go i j acc =
    if j + m > n then List.rev (String.sub s i (n - i) :: acc)
    else if String.sub s j m = sep then
      go (j + m) (j + m) (String.sub s i (j - i) :: acc)
    else go i (j + 1) acc
  in
  go 0 0 []

(* cljs parse-shortcuts: "a+b c" -> [Combo [a;b]; Single c] *)
type sc_group =
  | Sc_single of string
  | Sc_combo of string list

let parse_binding b =
  split_str " " (String.trim b)
  |> List.filter (fun t -> t <> "")
  |> List.map (fun t ->
         if String.index_opt t '+' <> None then
           Sc_combo (split_str "+" t)
         else Sc_single t)

let is_combo = function Sc_combo _ -> true | Sc_single _ -> false

let kbd_el key txt =
  kbd ~key ~style_class:"shui-shortcut-key" ~value:txt []

(* combo: one shared keycap, separator spans between keys *)
let combo_el key keys =
  let sep i =
    box ~key:(Printf.sprintf "sep%d" i)
      ~style_class:"shui-shortcut-separator" []
  in
  row ~key
    ~style_class:"shui-shortcut-combo shui-shortcut-glow"
    (List.concat
       (List.mapi
          (fun i k ->
            (if i > 0 then [ sep i ] else [])
            @ [ kbd_el (Printf.sprintf "k%d" i) (print_shortcut_key k) ])
          keys))

(* separate: sequential keys, 4px gap, no separators *)
let separate_el key keys =
  row ~key
    ~style_class:"shui-shortcut-separate shui-shortcut-glow"
    (List.mapi
       (fun i k ->
         kbd_el (Printf.sprintf "k%d" i) (print_shortcut_key k))
       keys)

(* chord: space-separated groups each rendered as a combo with a
   "then" separator *)
let chord_el key groups =
  let group_el gi grp =
    let keys =
      match grp with Sc_combo ks -> ks | Sc_single k -> [ k ]
    in
    row ~key:(Printf.sprintf "grp%d" gi)
      ~style_class:"shui-shortcut-combo shui-shortcut-glow"
      (List.concat
         (List.mapi
            (fun ki k ->
              (if ki > 0 then
                 [ box ~key:(Printf.sprintf "gs%d" ki)
                     ~style_class:"shui-shortcut-separator" [] ]
               else [])
              @ [ kbd_el (Printf.sprintf "ck%d" ki) (print_shortcut_key k) ])
            keys))
  in
  let then_sep gi =
    text ~key:(Printf.sprintf "then%d" gi)
      ~style_class:"shui-shortcut-chord-sep" ~value:"then" []
  in
  row ~key ~style_class:"shui-shortcut-chord"
    (List.concat
       (List.mapi
          (fun gi grp ->
            (if gi > 0 then [ then_sep gi ] else []) @ [ group_el gi grp ])
          groups))

(* cljs compact: text-only spans for the show-more/less header link *)
let compact_el key keys =
  box ~key ~style_class:"shui-shortcut-compact"
    (List.mapi
       (fun i k ->
         text ~key:(Printf.sprintf "c%d" i)
           ~value:(print_shortcut_key k) [])
       keys)

(* cljs shui/shortcut :auto over a display string: " | " splits multiple
   bindings; each binding renders combo (single token with +), chord
   (multiple combos) or separate (flat tokens) *)
let shui_shortcut display =
  let bindings =
    split_str " | " display
    |> List.map String.trim
    |> List.filter (fun b -> b <> "")
  in
  List.concat
    (List.mapi
       (fun bi b ->
         let groups = parse_binding b in
         let body =
           if List.length groups > 1 && List.for_all is_combo groups then
             [ chord_el "chord" groups ]
           else
             let keys =
               List.concat_map
                 (fun g ->
                   match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
                 groups
             in
             (match groups with
              | Sc_combo _ :: _ -> [ combo_el "combo" keys ]
              | _ -> [ separate_el "sep" keys ])
         in
         [ row ~key:(Printf.sprintf "b%d" bi)
             ~style_class:"shui-shortcut-b"
             ((if bi > 0 then
                 [ text ~key:"bsep"
                     ~style_class:"shui-shortcut-bsep"
                     ~value:"|" [] ]
               else [])
              @ body) ]
         )
       bindings)

(* cljs hint-button shortcut pick: :combo when len>1 and any modifier,
   else :auto *)
let hint_shortcut keys =
  let modifiers =
    [ "shift"; "ctrl"; "alt"; "cmd"; "mod"; g_cmd; g_opt; g_ctrl ]
  in
  let has_mod =
    List.exists
      (fun k ->
        List.mem (String.lowercase_ascii k) modifiers)
      keys
  in
  if List.length keys > 1 && has_mod then combo_el "hc" keys
  else separate_el "hs" keys

(* cljs group-header link: (shui/shortcut "mod down" {:style :compact}) *)
let compact_shortcut s =
  let groups = parse_binding s in
  let keys =
    List.concat_map
      (fun g -> match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
      groups
  in
  compact_el "cmp" keys

(* -- query highlight (list_item.cljs highlight-query) ----------------- *)

external str_normalize : string -> string = "normalize" [@@mel.send]

(* case-insensitive index of `sub` in `low` from `start`; -1 if none *)
let find_sub_ci sub low start =
  let n = String.length low and m = String.length sub in
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
       rather than the normalized form (which can change byte lengths) *)
    let low = String.lowercase_ascii text in
    let terms =
      String.split_on_char ' '
        (String.lowercase_ascii (str_normalize query))
      |> List.filter (fun t -> t <> "")
    in
    if terms = [] then [ (false, text) ]
    else
      let match_at pos =
        terms
        |> List.filter_map (fun t ->
               let i = find_sub_ci t low pos in
               if i < 0 then None else Some (i, t))
        |> List.fold_left
             (fun best (i, t) ->
               match best with
               | None -> Some (i, t)
               | Some (bi, _) when i < bi -> Some (i, t)
               | _ -> best)
             None
      in
      let rec go pos acc =
        match match_at pos with
        | None ->
            List.rev
              ((false, String.sub text pos (String.length text - pos))
               :: acc)
        | Some (i, t) ->
            go (i + String.length t)
              ((true, String.sub text i (String.length t))
               :: (false, String.sub text pos (i - pos)) :: acc)
      in
      go 0 []

(* cljs [:span {:data-testid text} seg/span ... seg/mark] — mark gets
   padding 0 border-radius 0; data-testid is the original (unmarked)
   title *)
let hl_span key (item_sig : S.item Signal.signal)
    (title_of : S.item -> string) : t =
  text ~key
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
              if hl then text ~key:"hl" ~as_:`Mark ~value:txt []
              else text ~key:"tx" ~value:txt [])
            seg)
    ]

let badge_el key =
  text ~key ~style_class:"cp__cmdk-current-page-badge"
    ~value:(I18n.t "cmdk.group/current-page") []

(* -- item row -------------------------------------------------------- *)

(* wrapper attrs: data-item-index for highlight; data-item-key gives a
   stable identity — idx is -1 on the optimistically-inserted create row
   until renumbering lands, so click dispatch resolves by key *)
let wrapper_attrs it =
  [ ("data-item-index", string_of_int it.S.idx)
  ; ("data-item-key", it.S.ikey)
  ]

let row_data_attrs (it : S.item) =
  let hoverable = it.S.imouse in
  let highlighted = it.S.ihl in
  ("data-cmdk-item", "true")
  :: (if hoverable then [ ("data-hoverable", "true") ] else [])
  @ (if highlighted then [ ("data-highlighted", "true") ] else [])
  @ (if highlighted && not hoverable then [ ("data-kb-highlighted", "true") ]
     else [])

(* isc parses to kbd cells inside a reactive slot remounting only on
   isc change *)
let shortcut_slot (item_sig : S.item Signal.signal) : t =
  if_
    ~test:(Signal.map (fun (it : S.item) -> it.S.isc <> "") item_sig)
    (box ~key:"sc-row" ~style_class:"shui-shortcut-row"
       ~opacity:
         (reactive
            (fun (it : S.item) -> if it.S.ihl then 1. else 0.9)
            item_sig)
       [ reactive
           ~equal:(fun (a : S.item) b -> a.S.isc = b.S.isc)
           (fun it -> box ~key:"sc-cells" (shui_shortcut it.S.isc))
           item_sig
       ])

(* data-item-index / data-item-key drive the delegated click +
   mousemove dispatch; [data-cmdk-item][data-hoverable][data-highlighted]
   [data-kb-highlighted] is the lui-overlay.css row contract (and the
   e2e locator) *)
let item_row (_st : S.t) (item_sig : S.item Signal.signal) : t =
  box ~key:"item-wrap"
    ~data_attrs:(reactive (fun it -> wrapper_attrs it) item_sig)
    [ box ~key:"item"
        ~data_attrs:(reactive (fun it -> row_data_attrs it) item_sig)
        [ if_
            ~test:
              (Signal.map (fun (it : S.item) -> it.S.header <> None)
                 item_sig)
            (row ~key:"hdr" ~style_class:"breadcrumb cmdk-item-header"
               ~cross:`center
               [ hl_span "hdr-hl" item_sig
                   (fun it -> Option.value ~default:"" it.S.header)
               ; if_
                   ~test:
                     (Signal.map
                        (fun (it : S.item) ->
                          it.S.ibadge = S.Header_badge)
                        item_sig)
                   (badge_el "hb")
               ])
        ; row ~key:"main" ~style_class:"cmdk-item-main" ~cross:`start
            [ box ~key:"icon" ~style_class:"cmdk-item-icon"
                [ if_
                    ~test:
                      (Signal.map
                         (fun (it : S.item) -> it.S.iicon <> "")
                         item_sig)
                    ((* cljs icon-component/get-node-icon-cp wraps the
                        glyph in .icon-cp-container *)
                     box ~key:"iccp"
                       ~style_class:"icon-cp-container"
                       [ icon ~name:(reactive (fun it -> `app it.S.iicon) item_sig)
                           ~point_size:14 [] ])
                ]
            ; column ~key:"txt" ~style_class:"cmdk-item-body"
                [ row ~key:"main-text"
                    ~style_class:"cp__cmdk-item-main-text"
                    [ hl_span "label" item_sig (fun it -> it.S.ititle)
                    ; if_
                        ~test:
                          (Signal.map
                             (fun (it : S.item) ->
                               it.S.ibadge = S.Text_badge)
                             item_sig)
                        (badge_el "tb")
                    ; if_
                        ~test:
                          (Signal.map
                             (fun (it : S.item) -> it.S.info <> None)
                             item_sig)
                        (text ~key:"info"
                           ~style_class:"cp__cmdk-item-info"
                           [ text ~key:"dash"
                               ~value:(Platform.utf8 " — ") []
                           ; hl_span "info-hl" item_sig
                               (fun it ->
                                 Option.value ~default:"" it.S.info)
                           ])
                    ]
                ]
            ; shortcut_slot item_sig
            ]
        ]
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

let gid_label = function
  | S.G_nodes -> I18n.t "cmdk.group/nodes"
  | S.G_commands -> I18n.t "cmdk.group/commands"
  | S.G_filters -> I18n.t "cmdk.group/filters"
  | S.G_create -> I18n.t "cmdk.group/create"
  | S.G_current_page -> I18n.t "cmdk.group/current-page"
  | S.G_recently_updated -> I18n.t "cmdk.group/recently-updated"
  | S.G_files -> I18n.t "cmdk.group/files"
  | S.G_codes -> I18n.t "cmdk.group/codes"
  | S.G_themes -> I18n.t "cmdk.group/themes"

(* cljs group header: title click toggles more/less; the trailing link
   (hidden while a filter is active) shows a compact mod+down/up hint *)
let group_header (st : S.t) (g : S.group) : t =
  let toggle _ =
    S.toggle_expand st g.S.gid (not g.S.gexpanded)
  in
  row ~key:"gheader"
    ~style_class:"cp__cmdk-group-header" ~cross:`center
    ~main:`space_between
    [ text ~key:"gtitle"
        ~style_class:"cp__cmdk-group-title"
        ~value:g.S.gtitle
        ~on_press:toggle []
    ; text ~key:"gcount"
        ~style_class:"cp__cmdk-group-count"
        ~value:
          (if g.S.gtotal >= 99 then "99+"
           else string_of_int g.S.gtotal)
        []
    ; spacer ~key:"gsp" ~style_class:"cp__cmdk-group-spacer" []
    ; (if (g.S.gtotal > g.S.glimit || g.S.gexpanded)
          && not g.S.gfilter_active
       then
         Ui_parts.pressable ~on_press:toggle
           (row ~key:"gmore"
              ~style_class:"cp__cmdk-group-more"
              [ row ~key:"gmore-i"
                  ~style_class:"cp__cmdk-group-more-inner"
                  [ text ~key:"lbl"
                      ~value:
                        (if g.S.gexpanded then I18n.t "ui/show-less"
                         else I18n.t "ui/show-more")
                      []
                  ; compact_shortcut
                      (if g.S.gexpanded then "mod up" else "mod down")
                  ]
              ])
       else spacer ~key:"gmore" [])
    ]

let group_el (st : S.t) (group_sig : S.group Signal.signal) : t =
  let items_sig =
    Signal.map (fun (g : S.group) -> g.S.gitems) group_sig
  in
  column ~key:"group" ~style_class:"cp__cmdk-group"
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
          else group_header st g)
        group_sig
    ; column ~key:"results" ~style_class:"search-results"
        [ keyed ~source:items_sig ~key:S.item_dom_key
            ~cmp:Stdlib.compare
            ~mount:(fun item_sig -> item_row st item_sig)
        ]
    ]

(* -- palette body ---------------------------------------------------- *)

let groups_body st : t =
 fun ctx parent ->
  let groups_sig =
    Signal.map (fun (v : S.view) -> v.S.groups) st.S.vs.Signal.state_signal
  in
  (keyed ~source:groups_sig ~key:(fun (g : S.group) -> gid_name g.S.gid)
     ~cmp:Stdlib.compare
     ~mount:(fun group_sig -> group_el st group_sig))
    ctx parent

let search_only_chip st (gid : S.group_id) =
  column ~key:"search-only" ~style_class:"cp__cmdk-search-only"
    [ row ~key:"row" ~style_class:"cp__cmdk-search-only-row"
        ~cross:`center
        [ text ~key:"lbl"
            ~value:(I18n.t "cmdk.filter/only-label") []
        ; text ~key:"grp"
            ~style_class:"cp__cmdk-search-only-name"
            ~value:(gid_label gid) []
        ; button ~key:"clr" ~icon:`x ~size:`icon
            ~label:(I18n.t "ui/delete")
            ~style_class:"cp__cmdk-search-only-clear"
            ~on_press:(fun _ -> S.clear_filter st)
            []
        ]
    ]

let scroller st : t =
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
  scroll ~key:"scroller" ~orientation:`vertical
    ~style_class:scroller_class
    [ column ~key:"scroller-body" ~grow:1.
        [ reactive
            (fun (v : S.view) ->
              match v.S.filter with
              | Some gid -> search_only_chip st gid
              | None -> spacer ~key:"chip" [])
            st.S.vs.Signal.state_signal
        ; groups_body st
        ; if_
            ~test:
              (Signal.map2
                 (fun (q : string) has -> q <> "" && not has)
                 input_sig has_items_sig)
            (box ~key:"empty" ~style_class:"cp__cmdk-empty"
               [ text ~key:"empty-t" ~value:(I18n.t "search/no-result") [] ])
        ]
    ]
    ctx parent

let input_row st : t =
 fun ctx parent ->
  let move_sig =
    Signal.map (fun (v : S.view) -> v.S.move_mode)
      st.S.vs.Signal.state_signal
  in
  row ~key:"input-row"
    ~style_class:"cp__cmdk-input-row" ~cross:`center
    [ (* move_mode can flip while the palette stays open (move-blocks
         command); no placeholder_signal exists, so a keyed remount
         swaps the placeholder — the caller re-focuses the input right
         after the state publish *)
      reactive
        (fun move_mode ->
          input ~key:"input" ~style_class:"cp__cmdk-search-input"
            ~grow:1.
            ~placeholder:
              (if move_mode then
                 I18n.t "cmdk.input/move-blocks-placeholder"
               else I18n.t "cmdk.input/default-placeholder")
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, q) -> S.on_input st q
              | _ -> ())
            [])
        move_sig
    ]
    ctx parent

(* shui shortcut: combo container + kbd.shui-shortcut-key cells *)
let key_glyph = function
  | "return" | "enter" -> Platform.utf8 "\xe2\x8f\x8e"
  | "shift" -> Platform.utf8 "\xe2\x87\xa7"
  | "cmd" | "mod" -> Platform.utf8 "\xe2\x8c\x98"
  | "esc" -> "Esc"
  | s -> s

let shortcut_el keys =
  let kids =
    List.mapi
      (fun i k ->
        kbd ~key:(Printf.sprintf "k%d" i)
          ~style_class:"shui-shortcut-key" ~value:(key_glyph k) [])
      keys
  in
  let rec interleave = function
    | [] -> []
    | [ x ] -> [ x ]
    | x :: tl ->
        x
        :: box ~key:("sep" ^ string_of_int (List.length tl))
             ~style_class:"shui-shortcut-separator" []
        :: interleave tl
  in
  row ~key:"sc" ~style_class:"shui-shortcut-combo"
    (interleave kids)

let hint_button label keys =
  button ~key:("hb-" ^ label) ~label
    ~style_class:"cp__cmdk-hint"
    [ text ~key:"t" ~style_class:"cp__cmdk-hint-label" ~value:label []
    ; hint_shortcut keys ]

(* cljs tip: random per mount between "Press / to filter search
   results" and "Press ⌘⏎ to open search in the sidebar"; clear-filter
   tip while a filter is active. The {1} slot renders as a kbd
   shortcut. *)
let tip_el (filtered, tip) =
  let key, keys, combo =
    if filtered then ("cmdk.tip/clear-filter", [ "esc" ], false)
    else if tip = 1 then
      ("cmdk.tip/open-sidebar", [ "mod"; "enter" ], true)
    else ("cmdk.tip/filter-results", [ "/" ], false)
  in
  let parts =
    I18n.replace_all (I18n.t key) "{1}" "\x00"
  in
  let pre, post =
    match String.split_on_char '\x00' parts with
    | [ a; b ] -> (a, b)
    | _ -> (parts, "")
  in
  row ~key:"tip" ~style_class:"cp__cmdk-tip" ~cross:`center
    [ text ~key:"pre" ~value:pre []
    ; (if combo then combo_el "tipsc" keys
       else separate_el "tipsc" keys)
    ; text ~key:"post" ~value:post [] ]

let hint_action_of (it : S.item) =
  match it.S.act with
  | S.Create_page _ | S.Create_tag _ -> (`create, false)
  | S.Set_filter _ -> (`filter, false)
  | S.Run _ -> (`trigger, false)
  | S.Open_page _ -> (`open_, true)
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

let action_hints (it : S.item option) =
  match it with
  | None -> spacer ~key:"actions" []
  | Some it ->
      let btns =
        match hint_action_of it with
        | `open_, has_block ->
            [ hint_button (I18n.t "cmdk.action/open") [ "return" ]
            ; hint_button
                (I18n.t "cmdk.action/open-in-sidebar")
                [ "shift"; "return" ]
            ]
            @ (if has_block then
                 [ hint_button (I18n.t "cmdk.action/copy-ref")
                     [ "cmd"; "c" ] ]
               else [])
        | `create, _ ->
            [ hint_button (I18n.t "cmdk.action/create") [ "return" ] ]
        | `filter, _ ->
            [ hint_button (I18n.t "cmdk.action/filter") [ "return" ] ]
        | `trigger, _ ->
            [ hint_button (I18n.t "cmdk.action/trigger") [ "return" ] ]
      in
      row ~key:"actions" ~style_class:"cp__cmdk-hints" ~cross:`center
        btns

let hints st : t =
 fun ctx parent ->
  (row ~key:"hints" ~style_class:"hints" ~main:`space_between
    [ box ~key:"hints-inner" ~style_class:"cp__cmdk-hints-inner"
        [ row ~key:"hints-row"
            ~style_class:"cp__cmdk-hints-row" ~cross:`center
            [ text ~key:"hint-label"
                ~style_class:"cp__cmdk-hints-label"
                ~value:(I18n.t "cmdk.tip/label") []
            ; reactive tip_el
                (Logseq_dom.own ctx
                   (Signal.map
                      (fun (v : S.view) -> (v.S.filter <> None, v.S.tip))
                      st.S.vs.Signal.state_signal))
            ]
        ]
    ; (* the hint bar's shape is the action variant, not the item's
         identity — remount only when the variant flips *)
      reactive
        ~equal:(fun (a : S.item option) b ->
          hint_variant a = hint_variant b)
        action_hints
        (Logseq_dom.own ctx
           (Signal.map
              (fun (v : S.view) -> S.item_at v v.S.hl)
              st.S.vs.Signal.state_signal))
    ])
    ctx parent

let palette st : t =
  (* data-keep-selection is a closest() contract (container.cljs +
     selection_bar.ml) *)
  box ~key:"cmdk"
    ~style_class:"cp__cmdk"
    ~data_attrs:[ ("data-keep-selection", "true") ]
    [ input_row st; scroller st; hints st ]

(* -- delegated event listeners (installed once per mount) ------------ *)

let int_of_string_opt s =
  try Some (int_of_string s) with _ -> None

let handle_keydown st (ev : Web_dom.ev) =
  let v = S.get st in
  if v.S.open_ then
    match Web_dom.ev_key ev with
    | "Escape" ->
        if S.clear_or_close st then (
          Web_dom.ev_prevent_default ev;
          Web_dom.ev_stop_propagation ev)
    | "ArrowDown" ->
        Web_dom.ev_prevent_default ev;
        if Web_dom.ev_meta ev || Web_dom.ev_ctrl ev then
          Option.iter (fun gid -> S.toggle_expand st gid true) (S.hl_group st)
        else S.move_hl st 1
    | "ArrowUp" ->
        Web_dom.ev_prevent_default ev;
        if Web_dom.ev_meta ev || Web_dom.ev_ctrl ev then
          Option.iter (fun gid -> S.toggle_expand st gid false) (S.hl_group st)
        else S.move_hl st (-1)
    | "n" when Web_dom.ev_ctrl ev ->
        Web_dom.ev_prevent_default ev;
        S.move_hl st 1
    | "p" when Web_dom.ev_ctrl ev ->
        Web_dom.ev_prevent_default ev;
        S.move_hl st (-1)
    | "Enter" ->
        Web_dom.ev_prevent_default ev;
        Web_dom.ev_stop_propagation ev;
        if Web_dom.ev_shift ev then S.run_highlighted_sidebar st
        else S.run_highlighted st
    | "k" when Web_dom.ev_meta ev || Web_dom.ev_ctrl ev ->
        Web_dom.ev_prevent_default ev;
        S.close st
    | _ -> ()
  else
    match Web_dom.ev_key ev with
    | "k"
      when (Web_dom.ev_meta ev || Web_dom.ev_ctrl ev)
           && not (Web_dom.ev_shift ev || Web_dom.ev_alt ev) ->
        Web_dom.ev_prevent_default ev;
        S.open_palette st
    | "m"
      when (Web_dom.ev_meta ev || Web_dom.ev_ctrl ev)
           && Web_dom.ev_shift ev ->
        (* cljs mod+shift+m -> editor/move-blocks -> cmdk move mode *)
        Web_dom.ev_prevent_default ev;
        S.open_palette ~move:true st
    | _ -> ()

let handle_click st (ev : Web_dom.ev) =
  match Web_dom.ev_target ev with
  | None -> ()
  | Some el ->
      (match Web_dom.el_closest el "#search-button" with
       | Some _ -> S.open_palette st
       | None ->
           (* outside click closes: the (unstyled) LUI backdrop does not
              cover the page, so dismiss here too *)
           if (S.get st).S.open_
              && Web_dom.el_closest el ".cp__cmdk__modal" = None
           then S.close st);
      (match Web_dom.el_closest el ".cp__cmdk [data-item-key]" with
       | Some wrap -> (
           match Web_dom.el_get_attr wrap "data-item-key" with
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
       | None -> ())

let handle_mousemove st (ev : Web_dom.ev) =
  let v = S.get st in
  if v.S.open_ && (Web_dom.ev_movement_x ev <> 0.0 || Web_dom.ev_movement_y ev <> 0.0)
  then
    match Web_dom.ev_target ev with
    | Some el -> (
        match Web_dom.el_closest el ".cp__cmdk" with
        | Some _ -> (
            let idx =
              Option.bind
                (Web_dom.el_closest el ".cp__cmdk [data-item-index]")
                (fun wrap ->
                  Option.bind
                    (Web_dom.el_get_attr wrap "data-item-index")
                    int_of_string_opt)
            in
            match idx with
            | Some i when i <> v.S.hl -> S.set_hl st i true
            | Some _ -> S.set_hl st v.S.hl true
            | None -> ())
        | None -> ())
    | None -> ()

let install_listeners st =
  Web_dom.add_document_listener "keydown" (handle_keydown st) true;
  Web_dom.add_document_listener "click" (handle_click st) true;
  Web_dom.add_document_listener "mousemove" (handle_mousemove st) true

(* modal shell mirrors shui dialog markup: overlay + centered
   .ui__dialog-content > .ui__dialog-main-content > .cp__cmdk__modal *)
let modal_shell st =
  box ~key:"cmdk-shell"
    [ box ~key:"dismiss"
        ~style_class:"cp__cmdk-dismiss"
        []
    ; box ~key:"ov"
        ~style_class:"ui__dialog-overlay"
        []
    ; (* --nested-dialogs lives in the .ls-dialog-cmdk CSS rule now *)
      box ~key:"content"
        ~style_class:"ui__dialog-content ls-dialog-cmdk"
        ~data_attrs:[ ("role", "dialog"); ("data-state", "open") ]
        [ heading ~key:"title" ~level:2
            ~style_class:"ui__dialog-title hidden" ~value:"" []
        ; box ~key:"main" ~style_class:"ui__dialog-main-content"
            [ column ~key:"modal"
                ~style_class:"cp__cmdk__modal"
                [ palette st ]
            ]
        ]
    ]

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler in
  install_listeners st;
  let open_sig =
    Signal.map (fun (v : S.view) -> v.S.open_) st.S.vs.Signal.state_signal
  in
  (* The keyed box gives the conditional its own reconcile-stable parent:
     spliced directly under #app-container its dynamic segment goes stale
     after navigation and later mounts emit an inconsistent op batch *)
  box ~key:"cmdk_view" [ if_ ~test:open_sig (modal_shell st) ] context parent
