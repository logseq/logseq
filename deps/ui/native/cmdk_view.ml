(* ported from deps/ui/src/cmdk/cmdk_view.ml — see the src/ original *)
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

(* cljs normalize-binding on a key token: lowercase + mod/meta/⌥
   canonicalization *)
let norm_binding s =
  let mac = Platform.is_mac () in
  String.lowercase_ascii (String.trim s)
  |> (fun x -> I18n.replace_all x "mod" (if mac then "meta" else "ctrl"))
  |> (fun x -> I18n.replace_all x "command" "meta")
  |> (fun x -> I18n.replace_all x "cmd" "meta")
  |> (fun x ->
       I18n.replace_all x "option" "alt"
       |> fun y -> I18n.replace_all y "opt" "alt")
  |> fun y -> I18n.replace_all y g_opt "alt"

(* cljs normalize-binding operates on the parsed structure, not the
   display string: a group joins its keys with "+" and groups join with
   " ". A flat sequence of single keys ([g, n] in cljs shorthand data)
   is one coll group, so "g n" normalizes to "g+n" *)
let norm_sc_groups (groups : sc_group list) =
  let single = function Sc_single _ -> true | Sc_combo _ -> false in
  if List.for_all single groups then
    String.concat "+"
      (List.map
         (function Sc_single k -> norm_binding k | Sc_combo _ -> "")
         groups)
  else
    String.concat " "
      (List.map
         (function
           | Sc_single k -> norm_binding k
           | Sc_combo ks -> String.concat "+" (List.map norm_binding ks))
         groups)

let kbd_el key txt =
  kbd ~key ~style_class:"shui-shortcut-key" ~value:txt []

(* combo: one shared keycap, separator spans between keys *)
let combo_el key keys binding =
  let sep i =
    text ~key:(Printf.sprintf "sep%d" i)
      ~style_class:"shui-shortcut-separator" ~value:"" []
  in
  row ~key
    ~style_class:"shui-shortcut-combo shui-shortcut-glow"
    ~accessibility_identifier:binding
    (List.concat
       (List.mapi
          (fun i k ->
            (if i > 0 then [ sep i ] else [])
            @ [ kbd_el (Printf.sprintf "k%d" i) (print_shortcut_key k) ])
          keys))

(* separate: sequential keys, 4px gap, no separators *)
let separate_el key keys binding =
  row ~key
    ~style_class:"shui-shortcut-separate shui-shortcut-glow"
    ~accessibility_identifier:binding
    (List.mapi
       (fun i k ->
         kbd_el (Printf.sprintf "k%d" i) (print_shortcut_key k))
       keys)

(* chord: space-separated groups each rendered as a combo with a
   "then" separator *)
let chord_el key groups binding =
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
                 [ text ~key:(Printf.sprintf "gs%d" ki)
                     ~style_class:"shui-shortcut-separator" ~value:"" [] ]
               else [])
              @ [ kbd_el (Printf.sprintf "ck%d" ki) (print_shortcut_key k) ])
            keys))
  in
  let then_sep gi =
    text ~key:(Printf.sprintf "then%d" gi)
      ~style_class:"shui-shortcut-chord-sep" ~value:"then" []
  in
  row ~key ~style_class:"shui-shortcut-chord"
    ~accessibility_identifier:binding
    (List.concat
       (List.mapi
          (fun gi grp ->
            (if gi > 0 then [ then_sep gi ] else []) @ [ group_el gi grp ])
          groups))

(* cljs compact: text-only spans for the show-more/less header link *)
let compact_el key keys binding =
  row ~key ~style_class:"shui-shortcut-compact"
    ~accessibility_identifier:binding
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
         let nb = norm_sc_groups groups in
         let body =
           if List.length groups > 1 && List.for_all is_combo groups then
             [ chord_el "chord" groups nb ]
           else
             let keys =
               List.concat_map
                 (fun g ->
                   match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
                 groups
             in
             (match groups with
              | Sc_combo _ :: _ -> [ combo_el "combo" keys nb ]
              | _ -> [ separate_el "sep" keys nb ])
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
  let norm = norm_binding (String.concat "+" keys) in
  if List.length keys > 1 && has_mod then combo_el "hc" keys norm
  else separate_el "hs" keys norm

(* cljs group-header link: (shui/shortcut "mod down" {:style :compact}) *)
let compact_shortcut s =
  let groups = parse_binding s in
  let keys =
    List.concat_map
      (fun g -> match g with Sc_combo ks -> ks | Sc_single k -> [ k ])
      groups
  in
  compact_el "cmp" keys (norm_sc_groups groups)

(* -- query highlight (list_item.cljs highlight-query) ----------------- *)

(* NFC normalize: identity on native (no ICU); document in NOTES *)
let str_normalize (s : string) = s

(* case-insensitive index of `sub` in `low` from `start`; -1 if none *)
let find_sub_ci sub low start =
  let n = String.length low and m = String.length sub in
  let rec go i =
    if i + m > n then -1
    else if String.sub low i m = sub then i
    else go (i + 1)
  in
  go start

(* leftmost match across query terms (whitespace-split); ties keep the
   earliest term like a JS "a|b" alternation *)
let hl_segments ~query ~text : (bool * string) list =
  if String.trim query = "" || text = "" then [ (false, text) ]
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
   padding 0 border-radius 0 *)
let highlight_el key query text_ =
  row ~key ~accessibility_identifier:text_
    (List.mapi
       (fun i (_hl, seg) ->
         (* cljs uses <mark> for the highlighted segment — no mark kind;
            the native surface has no css highlight channel *)
         Lui_elements.text ~key:(Printf.sprintf "tx%d" i) ~value:seg [])
       (List.filter (fun (_, s) -> s <> "") (hl_segments ~query ~text:text_)))

let badge_el key =
  text ~key
    ~style_class:"cp__cmdk-current-page-badge"
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

let item_header (it : S.item) q =
  match it.S.header with
  | None -> spacer ~key:"hdr-none" []
  | Some h ->
      row ~key:"hdr" ~style_class:"breadcrumb cmdk-item-header"
        [ highlight_el "hdr-hl" q h
        ; (match it.S.ibadge with
           | S.Header_badge -> badge_el "hb"
           | _ -> spacer ~key:"hb-none" [])
        ]

let shortcut_row key it =
  if it.S.isc = "" then spacer ~key:(key ^ "-none") []
  else
    row ~key ~style_class:"shui-shortcut-row"
      ~opacity:(if it.S.ihl then 1. else 0.9)
      (shui_shortcut it.S.isc)

(* data-item-index / data-item-key drive the delegated click +
   mousemove dispatch; the Dom_ext query layer sees ~data_attrs on
   kind nodes the same way it saw dom attrs *)
let item_row (_st : S.t) (item_sig : S.item Signal.signal) : t =
  box ~key:"item-wrap"
    ~data_attrs:(reactive (fun it -> wrapper_attrs it) item_sig)
    [ box ~key:"item"
        ~data_attrs:(reactive (fun it -> row_data_attrs it) item_sig)
        [ reactive ~equal:(fun (a : S.item) b -> a = b) (fun (it : S.item) -> item_header it it.S.iq) item_sig
        ; row ~key:"main" ~style_class:"cmdk-item-main"
            [ box ~key:"icon" ~style_class:"cmdk-item-icon"
                [ reactive ~equal:(fun (a : S.item) b -> a.S.iicon = b.S.iicon) (fun (it : S.item) ->
                      if it.S.iicon = "" then spacer ~key:"iccp-none" []
                      else
                        (* cljs icon-component/get-node-icon-cp wraps the
                           glyph in .icon-cp-container *)
                        box ~key:"iccp"
                          ~style_class:"icon-cp-container"
                          [ Icons.icon ~size:14. it.S.iicon ]) item_sig
                ]
            ; box ~key:"txt" ~style_class:"cmdk-item-body"
                [ row ~key:"main-text"
                    ~style_class:"cp__cmdk-item-main-text"
                    [ reactive ~equal:(fun (a : S.item) b -> a = b) (fun (it : S.item) ->
                          highlight_el "label" it.S.iq it.S.ititle) item_sig
                    ; reactive ~equal:(fun (a : S.item) b ->
                          a.S.ibadge = b.S.ibadge) (fun (it : S.item) ->
                          match it.S.ibadge with
                          | S.Text_badge -> badge_el "tb"
                          | _ -> spacer ~key:"tb-none" []) item_sig
                    ; reactive ~equal:(fun (a : S.item) b -> a = b) (fun (it : S.item) ->
                          match it.S.info with
                          | None -> spacer ~key:"info-none" []
                          | Some info ->
                              row ~key:"info"
                                ~style_class:"cp__cmdk-item-info"
                                [ text ~key:"dash"
                                    ~value:(Platform.utf8 " — ") []
                                ; highlight_el "info-hl" it.S.iq info ]) item_sig
                    ]
                ]
            ; reactive ~equal:(fun (a : S.item) (b : S.item) ->
                  a.S.isc = b.S.isc && a.S.idx = b.S.idx
                  && a.S.ihl = b.S.ihl) (fun it -> shortcut_row "sc-row" it) item_sig
            ]
        ]
    ]

(* -- group ----------------------------------------------------------- *)

let group_wrapper_class (_g : S.group) = "cp__cmdk-group"

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

let gid_of_name = function
  | "current-page" -> Some S.G_current_page
  | "nodes" -> Some S.G_nodes
  | "recently-updated" -> Some S.G_recently_updated
  | "commands" -> Some S.G_commands
  | "files" -> Some S.G_files
  | "filters" -> Some S.G_filters
  | "codes" -> Some S.G_codes
  | "themes" -> Some S.G_themes
  | _ -> None

(* cljs group header: title click toggles more/less; the trailing link
   (hidden while a filter is active) shows a compact mod+down/up hint *)
let group_header (st : S.t) (g : S.group) : t =
  if g.S.gid = S.G_create then spacer ~key:"gh-none" []
  else
    let count = if g.S.gtotal >= 99 then "99+" else string_of_int g.S.gtotal in
    let can_toggle = g.S.gtotal > g.S.glimit || g.S.gexpanded in
    let label, sc =
      if g.S.gexpanded then (I18n.t "ui/show-less", "mod up")
      else (I18n.t "ui/show-more", "mod down")
    in
    let toggle _ = S.toggle_expand st g.S.gid (not g.S.gexpanded) in
    row ~key:"gheader" ~style_class:"cp__cmdk-group-header"
      [ text ~key:"gtitle" ~style_class:"cp__cmdk-group-title"
          ~value:g.S.gtitle ~on_press:toggle []
      ; text ~key:"gcount" ~style_class:"cp__cmdk-group-count"
          ~value:count []
      ; spacer ~key:"gsp" ~style_class:"cp__cmdk-group-spacer" []
      ; if can_toggle && not g.S.gfilter_active then
          Ui_parts.pressable ~on_press:toggle
            (row ~key:"gmore" ~style_class:"cp__cmdk-group-more"
               [ row ~key:"gmore-i" ~style_class:"cp__cmdk-group-more-inner"
                   [ text ~key:"lbl" ~value:label []; compact_shortcut sc ]
               ])
        else spacer ~key:"gmore-none" []
      ]

let group_el (st : S.t) (group_sig : S.group Signal.signal) : t =
 fun ctx parent ->
  let items_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (g : S.group) -> g.S.gitems) group_sig)
  in
  (column ~key:"group" ~style_class:(group_wrapper_class (Signal.get group_sig))
    [ reactive ~equal:(fun (a : S.group) (b : S.group) ->
          a.S.gtitle = b.S.gtitle && a.S.gtotal = b.S.gtotal
          && a.S.gexpanded = b.S.gexpanded
          && a.S.gfilter_active = b.S.gfilter_active) (fun g -> group_header st g) group_sig
    ; column ~key:"results" ~style_class:"search-results"
        [ keyed ~source:items_sig ~key:S.item_dom_key
            ~cmp:Stdlib.compare
            ~mount:(fun item_sig -> item_row st item_sig)
        ]
    ])
    ctx parent

(* -- palette body ---------------------------------------------------- *)

let groups_body st : t =
 fun ctx parent ->
  let groups_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (v : S.view) -> v.S.groups)
         st.S.vs.Signal.state_signal)
  in
  (keyed ~source:groups_sig ~key:(fun (g : S.group) -> gid_name g.S.gid)
     ~cmp:Stdlib.compare
     ~mount:(fun group_sig -> group_el st group_sig))
    ctx parent

let search_only_chip st (gid : S.group_id) =
  column ~key:"search-only" ~style_class:"cp__cmdk-search-only"
    [ row ~key:"row" ~style_class:"cp__cmdk-search-only-row"
        [ text ~key:"lbl" ~value:(I18n.t "cmdk.filter/only-label") []
        ; text ~key:"grp" ~style_class:"cp__cmdk-search-only-name"
            ~value:(gid_label gid) []
        ; button ~key:"clr" ~icon:`x ~size:`icon
            ~style_class:"cp__cmdk-search-only-clear"
            ~on_press:(fun _ -> S.clear_filter st) []
        ]
    ]

let scroller st : t =
 fun ctx parent ->
  let has_items_sig =
    Logseq_dom.own ctx
      (Signal.map
         (fun (v : S.view) ->
           v.S.groups <> []
           && List.exists
                (fun (g : S.group) -> g.S.gitems <> [])
                v.S.groups)
         st.S.vs.Signal.state_signal)
  in
  let input_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (v : S.view) -> v.S.input)
         st.S.vs.Signal.state_signal)
  in
  (* .cp__cmdk-scroller is queried by cmdk_state (scroll-into-view) —
     the class anchor is unchanged *)
  scroll ~key:"scroller" ~orientation:`vertical
    ~style_class:scroller_class ~accessibility_identifier:"cmdk-scroller"
    [ reactive ~equal:(fun (a : S.group_id option) b -> a = b) (fun f ->
          match f with
          | None -> spacer ~key:"flt-none" []
          | Some gid -> search_only_chip st gid)
        (Logseq_dom.own ctx
           (Signal.map (fun (v : S.view) -> v.S.filter)
              st.S.vs.Signal.state_signal))
    ; groups_body st
    ; reactive ~equal:(fun (a : string * bool) b -> a = b) (fun (q, has) ->
          if not has && q <> "" then
            text ~key:"empty" ~style_class:"cp__cmdk-empty"
              ~value:(I18n.t "search/no-result") []
          else spacer ~key:"empty-none" [])
        (Logseq_dom.own ctx
           (Signal.map2 (fun q has -> (q, has)) input_sig has_items_sig))
    ]
    ctx parent

let input_row st : t =
 fun ctx parent ->
  row ~key:"input-row" ~style_class:"cp__cmdk-input-row"
    [ (* .cp__cmdk-search-input is queried/focused by cmdk_state —
         the class anchor is unchanged; no placeholder_signal exists,
         so the move_mode reactive remounts the input *)
      reactive
        (fun (v : S.view) ->
          input ~key:"input" ~style_class:"cp__cmdk-search-input"
              ~accessibility_identifier:"cmdk-input"
            ~grow:1.
            ~placeholder:
              (if v.S.move_mode then
                 I18n.t "cmdk.input/move-blocks-placeholder"
               else I18n.t "cmdk.input/default-placeholder")
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, q) -> S.on_input st q
              | _ -> ())
            [])
        st.S.vs.Signal.state_signal
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
        :: spacer ~key:("sep" ^ string_of_int (List.length tl))
             ~style_class:"shui-shortcut-separator" []
        :: interleave tl
  in
  row ~key:"sc" ~style_class:"shui-shortcut-combo" (interleave kids)

(* data-hint dropped — inert markup, no imperative reader *)
let hint_button label keys =
  button ~key:("hb-" ^ label) ~style_class:"cp__cmdk-hint"
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
  row ~key:"tip" ~style_class:"cp__cmdk-tip"
    [ text ~key:"pre" ~value:pre []
    ; (let nb = norm_binding (String.concat "+" keys) in
       if combo then combo_el "tipsc" keys nb
       else separate_el "tipsc" keys nb)
    ; text ~key:"post" ~value:post [] ]

let hint_action_of (it : S.item) =
  match it.S.act with
  | S.Create_page _ | S.Create_tag _ -> (`create, false)
  | S.Set_filter _ -> (`filter, false)
  | S.Run _ -> (`trigger, false)
  | S.Open_page _ -> (`open_, true)
  | S.Open_block _ -> (`open_, true)
  | S.Open_file _ -> (`open_, false)

let action_hints (it : S.item option) =
  match it with
  | None -> spacer ~key:"hint-none" []
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
      row ~key:"actions" ~style_class:"cp__cmdk-hints" btns

let hints st : t =
 fun ctx parent ->
  (column ~key:"hints" ~style_class:"hints"
    [ box ~key:"hints-inner" ~style_class:"cp__cmdk-hints-inner"
        [ row ~key:"hints-row" ~style_class:"cp__cmdk-hints-row"
            [ text ~key:"hint-label" ~style_class:"cp__cmdk-hints-label"
                ~value:(I18n.t "cmdk.tip/label") []
            ; reactive ~equal:(fun (a : bool * int) b -> a = b) tip_el
                (Logseq_dom.own ctx
                   (Signal.map
                      (fun (v : S.view) -> (v.S.filter <> None, v.S.tip))
                      st.S.vs.Signal.state_signal))
            ]
        ]
    ; reactive ~equal:(fun (a : S.item option) b -> a = b) action_hints
        (Logseq_dom.own ctx
           (Signal.map
              (fun (v : S.view) -> S.item_at v v.S.hl)
              st.S.vs.Signal.state_signal))
    ])
    ctx parent

let palette st : t =
  (* .cp__cmdk is the delegated-event scope for outside-click and
     hover-highlight closest checks — the class anchor is unchanged;
     data-keep-selection rides ~data_attrs *)
  box ~key:"cmdk"
    ~style_class:"cp__cmdk"
    ~data_attrs:[ ("data-keep-selection", "true") ]
    [ input_row st; scroller st; hints st ]

(* -- delegated event listeners (installed once per mount) ------------ *)

let int_of_string_opt s =
  try Some (int_of_string s) with _ -> None

let handle_keydown st (ev : Dom_ext.event) =
  let v = S.get st in
  if v.S.open_ then
    match Dom_ext.key_ ev with
    | Some "Escape" ->
        if S.clear_or_close st then (
          Dom_ext.prevent_default ev;
          Dom_ext.stop_propagation ev)
    | Some "ArrowDown" ->
        Dom_ext.prevent_default ev;
        if Dom_ext.meta_key ev || Dom_ext.ctrl_key ev then
          Option.iter (fun gid -> S.toggle_expand st gid true) (S.hl_group st)
        else S.move_hl st 1
    | Some "ArrowUp" ->
        Dom_ext.prevent_default ev;
        if Dom_ext.meta_key ev || Dom_ext.ctrl_key ev then
          Option.iter (fun gid -> S.toggle_expand st gid false) (S.hl_group st)
        else S.move_hl st (-1)
    | Some "n" when Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        S.move_hl st 1
    | Some "p" when Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        S.move_hl st (-1)
    | Some "Enter" ->
        Dom_ext.prevent_default ev;
        Dom_ext.stop_propagation ev;
        if Dom_ext.shift_key ev then S.run_highlighted_sidebar st
        else S.run_highlighted st
    | Some "k" when Dom_ext.meta_key ev || Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        S.close st
    | _ -> ()
  else
    match Dom_ext.key_ ev with
    | Some "k"
      when (Dom_ext.meta_key ev || Dom_ext.ctrl_key ev)
           && not (Dom_ext.shift_key ev || Dom_ext.alt_key ev) ->
        Dom_ext.prevent_default ev;
        S.open_palette st
    | Some "m"
      when (Dom_ext.meta_key ev || Dom_ext.ctrl_key ev)
           && Dom_ext.shift_key ev ->
        (* cljs mod+shift+m -> editor/move-blocks -> cmdk move mode *)
        Dom_ext.prevent_default ev;
        S.open_palette ~move:true st
    | _ -> ()

let handle_click st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el ->
      (match Dom_ext.closest el "#search-button" with
       | Some _ -> S.open_palette st
       | None ->
           (* outside click closes: the (unstyled) LUI backdrop does not
              cover the page, so dismiss here too *)
           if (S.get st).S.open_
              && Dom_ext.closest el ".cp__cmdk__modal" = None
           then S.close st);
      (match Dom_ext.closest el ".cp__cmdk [data-cmdk-clear-filter]" with
       | Some _ ->
           Dom_ext.prevent_default ev;
           S.clear_filter st
       | None -> ());
      (match
         Dom_ext.closest el ".cp__cmdk [data-cmdk-group]"
       with
       | Some g -> (
           Dom_ext.prevent_default ev;
           match
             Option.bind
               (Dom_ext.get_attribute g "data-cmdk-group") gid_of_name
           with
           | Some gid ->
               let v = S.get st in
               S.toggle_expand st gid (not (List.mem gid v.S.expanded))
           | None -> ())
       | None ->
           match Dom_ext.closest el ".cp__cmdk [data-item-key]" with
           | Some wrap -> (
               match Dom_ext.get_attribute wrap "data-item-key" with
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

let handle_mousemove st (ev : Dom_ext.event) =
  let v = S.get st in
  if v.S.open_ && (Dom_ext.movement_x ev <> 0.0 || Dom_ext.movement_y ev <> 0.0)
  then
    match Dom_ext.target ev with
    | Some el -> (
        match Dom_ext.closest el ".cp__cmdk" with
        | Some _ -> (
            let idx =
              Option.bind
                (Dom_ext.closest el ".cp__cmdk [data-item-index]")
                (fun wrap ->
                  Option.bind
                    (Dom_ext.get_attribute wrap "data-item-index")
                    int_of_string_opt)
            in
            match idx with
            | Some i when i <> v.S.hl -> S.set_hl st i true
            | Some _ -> S.set_hl st v.S.hl true
            | None -> ())
        | None -> ())
    | None -> ()

(* render() mounts a fresh state per call (S.make bumps latest_t), so
   capture the live state at dispatch time — registering per render would
   stack a duplicate listener (on dead state) per mount *)
let listeners_installed = ref false

let install_listeners () =
  if not !listeners_installed then (
    listeners_installed := true;
    let with_latest f ev =
      match !S.latest_t with Some st -> f st ev | None -> ()
    in
    Dom_ext.add_document_listener "keydown" (with_latest handle_keydown) true;
    Dom_ext.add_document_listener "click" (with_latest handle_click) true;
    Dom_ext.add_document_listener "mousemove" (with_latest handle_mousemove)
      true)

(* modal shell mirrors shui dialog markup: overlay + centered
   .ui__dialog-content > .ui__dialog-main-content > .cp__cmdk__modal *)
let modal_shell st =
  (* LUI dialog primitive: native hosts render it as a deferred
     window-layer overlay (backdrop + centered card); box markup never
     leaves the document flow there, so the palette mounted off-screen *)
  dialog ~key:"cmdk-dialog" ~style_class:"ui__dialog-content ls-dialog-cmdk"
    ~width:896 ~on_dismiss:(fun _ -> S.close st)
    [ (* .cp__cmdk__modal bounds outside-click dismissal (closest) — the
         class anchor is unchanged *)
      column ~key:"modal" ~style_class:"cp__cmdk__modal w-full" [ palette st ]
    ]

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  (* the palette is a singleton: re-running render (parent re-renders
     after model/route publishes) must not swap in a fresh state — the
     mounted view keeps binding the first st's signals while event
     dispatch goes through latest_t to the newest, orphaned one *)
  let st =
    match !S.latest_t with
    | Some st -> st
    | None -> S.make context.Lui_ui.ui_scheduler
  in
  (* empty-conditional slots render as <raw-text> placeholders; the
     observer swap must be armed before cmdk mounts on a fresh page *)
  Editor_dom.ensure_raw_text_observer ();
  install_listeners ();
  let open_sig =
    Logseq_dom.own context
      (Signal.map (fun (v : S.view) -> v.S.open_)
         st.S.vs.Signal.state_signal)
  in
  (* The keyed box gives the conditional its own reconcile-stable parent:
     spliced directly under #app-container its dynamic segment goes stale
     after navigation and later mounts emit an inconsistent op batch *)
  box ~key:"cmdk_view" [ if_ ~test:open_sig (modal_shell st) ] context parent
