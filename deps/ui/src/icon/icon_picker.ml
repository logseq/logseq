(* Icon picker popup — mirrors cljs icon.cljs icon-search:
   .cp__emoji-icon-picker[data-keep-selection]
     > .hd.bg-popover > .search-input > tabler "search" + input + a.x
     > .bd.bd-scroll.<tab> > .content-pane > (.all-pane | .flex sections)
     > .ft  (icon.css positions it at the top) > tab buttons + color picker
       + del.

   All tab = "Frequently used" (when storage has items) + "Emojis (N)"
   first-32 + "Icons (M)" first-48 pane-sections. Tabler icon names are
   enumerated from the loaded tabler-icons.min.css selectors — the font
   already ships every glyph, so `ti ti-<name>` renders them all.

   Rendering is a LUI view; the imperative `open_picker*` entries keep
   their signatures — they measure the anchor element's rect, push a
   positioned `popover` onto Properties_state's view-overlay stack (the
   layer registration declarative overlays share) and return a close
   handle. *)

open Lui_elements
module P = Lui_protocol
module I = I18n
module S = Properties_state

type choice = Emoji of string | Tabler of (string * string option) | Remove
type tab = Tab_all | Tab_emoji | Tab_icon

(* icon value {type,id} -> display element *)
let icon_el ?(size = 18.) ?(cls = "") (ty, id) : t =
  match ty with
  | "emoji" -> Logseq_emoji.el ~name:id ()
  | _ -> Icons.icon ~size ~cls id

(* cljs ui__button base + variant classes (shui/button); the small
   28px outline-button chrome rides the typed props *)
let btn_base = "ui__button"

let btn_outline_sm = btn_base ^ " as-outline"

(* ---------- tabler icon names ---------- *)

(* cljs get-tabler-icons enumerates @tabler/icons-react exports in order
   and csk-prettifies them into display names ("Abacus Off"); the table
   is generated once into the shared library. *)
let icon_items () = Array.to_list Icon_picker_names.items

(* cljs icon-cp strips spaces from the display name to form the id/title:
   "A B 2" -> "AB2" *)
let icon_id display =
  String.concat "" (String.split_on_char ' ' display)

let rec take n xs =
  match n, xs with
  | 0, _ | _, [] -> []
  | n, x :: tl -> x :: take (n - 1) tl

let search_icons q =
  icon_items ()
  |> List.filter (fun (display, kebab) ->
         I18n.contains_ci display q || I18n.contains_ci kebab q)
  |> take 100

(* ---------- frequently used (storage :ui/ls-icons-used) ---------- *)

let used_items () : (string * string * string) list =
  (* (type, id, name) *)
  match Ui_services.storage_get "ls-icons-used" with
  | None -> []
  | Some s -> (
      try
        match Edn.parse s with
        | Wire.List xs | Wire.Array xs | Wire.Set xs ->
            List.filter_map
              (fun w ->
                match w with
                | Wire.Map kvs ->
                    let get kw =
                      List.find_map
                        (fun (k, v) ->
                          match k with
                          | Wire.Keyword k' | Wire.String k' when k' = kw ->
                              Some v
                          | _ -> None)
                        kvs
                    in
                    (match get "type", get "id" with
                     | Some t, Some i -> (
                         match Wire.as_keyword t, Wire.as_string i with
                         | Some t', Some i' ->
                             Some
                               ( t', i'
                               , Option.value ~default:i'
                                   (Option.bind (get "name") Wire.as_string) )
                         | _ -> None)
                     | _ -> None)
                | _ -> None)
              xs
        | _ -> []
      with _ -> [])

let add_used_item (typ, id, name) =
  let items =
    (typ, id, name)
    :: take 24
         (List.filter (fun (t, i, _) -> not (t = typ && i = id)) (used_items ()))
  in
  Ui_services.storage_set "ls-icons-used"
    (Edn.to_string
       (Wire.List
          (List.map
             (fun (t, i, n) ->
               Wire.Map
                 [ (Wire.Keyword "type", Wire.Keyword t)
                 ; (Wire.Keyword "id", Wire.String i)
                 ; (Wire.Keyword "name", Wire.String n) ])
             items)))

let preset_color () = Ui_services.storage_get "ls-icon-color-preset"

(* ---------- picker ---------- *)

type item =
  | Emoji_item of string * string
  | Tabler_item of string * string (* display name, kebab svg name *)

let tab_name = function
  | Tab_all -> "all"
  | Tab_emoji -> "emoji"
  | Tab_icon -> "icon"

let placeholder_of = function
  | Tab_all -> I.t "icon/search-all"
  | Tab_emoji -> I.t "icon/search-emojis"
  | Tab_icon -> I.t "icon/search-icons"

(* the picker's own state in one signal — q, tab, the async emoji search
   fill, the color preset and its popover, and a reset counter that
   remounts the search input to clear it *)
type pstate =
  { q : string
  ; tab : tab
  ; emoji_results : (string * string) list
  ; reset : int
  ; pal_open : bool
  ; preset : string option
  }

let preset_colors =
  [ Some "#6e7b8b"; Some "#5e69d2"; Some "#00b5ed"; Some "#00b55b"
  ; Some "#f2be00"; Some "#e47a00"; Some "#f38e81"; Some "#fb434c"; None ]

let picker_view ~(del : bool) ~(emoji_only : bool)
    ~(on_chosen : choice -> unit) ~(close : unit -> unit) : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let st =
    Signal.state sched
      { q = ""
      ; tab = (if emoji_only then Tab_emoji else Tab_all)
      ; emoji_results = []
      ; reset = 0
      ; pal_open = false
      ; preset = preset_color ()
      }
  in
  let sv = (Signal.value st) in
  (* async emoji search token — a stale fill must not clobber a newer
     query's results *)
  let gen = ref 0 in
  let get () = Runtime.signal_get st in
  let update f = Runtime.signal_set st (f (get ())) in

  let choose c =
    close ();
    (match c with
     | Emoji id ->
         add_used_item
           ( "emoji", id
           , match List.assoc_opt id (Emoji_mart.all_emojis ()) with
             | Some n -> n
             | None -> id )
     | Tabler (id, _) ->
         let display =
           match
             List.find_opt
               (fun (d, _) -> icon_id d = id)
               (icon_items ())
           with
           | Some (d, _) -> d
           | None -> id
         in
         add_used_item ("tabler-icon", id, display)
     | Remove -> ());
    on_chosen c
  in

  let item_btn (it : item) : t =
    (* ls-emoji-cell is the regression test's icon-button locator; the
       .its/.icons-row button chrome moved to the typed props *)
    let cell ?font_size ~cls ~key ~label ~tooltip ~on_press child : t =
      Ui_components.with_props
        ([ ( P.HoverBackground
           , P.StringValue
               "var(--lx-gray-03, var(--ls-menu-hover-color, \
                  hsl(var(--muted))))" )
         ]
         @ (match font_size with
            | Some fz -> [ P.FontSize, P.StringValue fz ]
            | None -> []))
        (button ~key ~style_class:cls ~variant:`ghost ~width:36 ~height:36
           ~padding:0 ~corner_radius:9999 ~label ~tooltip ~on_press
           [ child ])
    in
    match it with
    | Emoji_item (id, name) ->
        cell ~font_size:"1.5rem" ~cls:"ls-emoji-preview" ~key:("e-" ^ id)
          ~label:name ~tooltip:name
          ~on_press:(fun _ -> choose (Emoji id))
          (Logseq_emoji.el ~name:id ())
    | Tabler_item (display, kebab) ->
        cell ~cls:"ls-emoji-cell" ~key:("t-" ^ icon_id display) ~label:display
          ~tooltip:(icon_id display)
          ~on_press:(fun _ ->
            choose (Tabler (icon_id display, (get ()).preset)))
          (* cljs ui/icon called with the display name: the ls-icon class
             keeps the spaces verbatim, the svg uses the kebab name *)
          (icon ~name:(Icons.name_ref kebab) ~point_size:24
             ~style_class:("ui__icon ti ls-icon-" ^ display) [])
  in

  let rec chunks n xs =
    match xs with
    | [] -> []
    | _ -> (
        let rec split acc i rest =
          match i, rest with
          | 0, _ | _, [] -> (List.rev acc, rest)
          | _, x :: tl -> split (x :: acc) (i - 1) tl
        in
        match split [] n xs with
        | row, rest -> row :: chunks n rest)
  in

  let pane_section ~virtual_list label (items : t list) : t =
    Ui_components.with_props [ P.Overflow, P.StringValue "auto" ]
      (column ~grow:1.
         ~foreground:(reactive (fun (s : pstate) ->
             Option.value s.preset ~default:"inherit") sv)
         ~data_attrs:[ ("style", "padding-left: 0.5rem") ]
         (box ~style_class:"hd"
            [ text ~as_:`Strong ~style_class:"ls-ep-section-title" ~value:label
                ~font_size:"0.75rem" ~font_weight:500
                ~foreground:"var(--lx-gray-07, var(--muted-foreground))"
                [] ]
          ::
          (if virtual_list then
             [ column ~gap:0
                 (List.map
                    (fun row_items ->
                      row ~gap:4 ~padding_vertical:4 row_items)
                    (chunks 9 items)) ]
           else
             [ row ~gap:4 ~padding_vertical:4
                 ~data_attrs:[ ("style", "flex-wrap: wrap") ] items ])))
  in

  let used_item_btns () : t list =
    used_items ()
    |> List.map (fun (typ, id, name) ->
           if typ = "emoji" then item_btn (Emoji_item (id, name))
           else
             match
               List.find_opt
                 (fun (d, _) -> icon_id d = id)
                 (icon_items ())
             with
             | Some (d, k) -> item_btn (Tabler_item (d, k))
             | None -> item_btn (Tabler_item (name, Icons.kebab name)))
  in

  let reset_q () =
    gen := !gen + 1;
    update (fun s -> { s with q = ""; emoji_results = []; reset = s.reset + 1 })
  in

  let set_tab t =
    gen := !gen + 1;
    update (fun s ->
        { s with tab = t; q = ""; emoji_results = []; reset = s.reset + 1
        ; pal_open = false })
  in

  let on_input v =
    let v = String.trim v in
    gen := !gen + 1;
    let g = !gen in
    update (fun s -> { s with q = v });
    if v = "" || (get ()).tab = Tab_icon then
      update (fun s -> { s with emoji_results = [] })
    else
      Emoji_mart.search v (fun entries ->
          if g = !gen then
            update (fun s -> { s with emoji_results = entries }))
  in

  let set_preset c =
    update (fun s -> { s with preset = c; pal_open = false });
    (match c with
     | Some c -> Ui_services.storage_set "ls-icon-color-preset" c
     | None -> Ui_services.storage_remove "ls-icon-color-preset")
  in

  let preset_btn c =
    Ui_components.color_swatch ~key:(match c with
                                     | Some c -> "p-" ^ c
                                     | None -> "p-none")
      ~size:18 ~style_class:"as-outline it"
      ~background:(match c with Some c -> c | None -> "transparent")
      ~label:(match c with
        | Some color -> I.tf "icon/color-value" [ color ]
        | None -> I.t "icon/reset-color")
      ~border_color:
        "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
      ~on_press:(fun _ -> set_preset c)
      (match c with
       | Some _ -> []
       | None -> [ icon_el ~cls:"ls-icon-mini" ("tabler-icon", "minus") ])
  in

  let content_view (s : pstate) : t =
    if String.trim s.q = "" then (
      match s.tab with
      | Tab_all ->
          let used = used_item_btns () in
          column ~gap:4 ~grow:1.
            [ column ~data_attrs:[ ("style", "padding-bottom: 2.5rem") ]
                ((if used = [] then []
                  else
                    [ pane_section ~virtual_list:false
                        (I.t "ui/frequently-used") used ])
                @ [ pane_section ~virtual_list:false
                      (I.tf "icon/emojis-count"
                         [ string_of_int (Emoji_mart.emoji_count ()) ])
                      (List.map
                         (fun (id, n) -> item_btn (Emoji_item (id, n)))
                         (take 32 (Emoji_mart.all_emojis ())))
                  ; pane_section ~virtual_list:false
                      (I.tf "icon/icons-count"
                         [ string_of_int (List.length (icon_items ())) ])
                      (List.map
                         (fun (d, k) -> item_btn (Tabler_item (d, k)))
                         (take 48 (icon_items ()))) ]) ]
      | Tab_emoji ->
          (* cljs emojis-cp renders its own flex-1 flex-col gap-1 div
             inside the outer one *)
          let used =
            used_items ()
            |> List.filter (fun (t, _, _) -> t = "emoji")
            |> List.map (fun (_, id, name) -> item_btn (Emoji_item (id, name)))
          in
          column ~gap:4 ~grow:1.
            [ column ~gap:4 ~grow:1.
                ((if used = [] then []
                  else
                    [ pane_section ~virtual_list:false
                        (I.t "ui/frequently-used") used ])
                @ [ pane_section ~virtual_list:true
                      (I.tf "icon/emojis-count"
                         [ string_of_int (Emoji_mart.emoji_count ()) ])
                      (List.map
                         (fun (id, n) -> item_btn (Emoji_item (id, n)))
                         (Emoji_mart.all_emojis ())) ]) ]
      | Tab_icon ->
          column ~gap:4 ~grow:1.
            [ pane_section ~virtual_list:true
                (I.tf "icon/icons-count"
                   [ string_of_int (List.length (icon_items ())) ])
                (List.map
                   (fun (d, k) -> item_btn (Tabler_item (d, k)))
                   (icon_items ())) ])
    else
      let icons =
        if s.tab = Tab_emoji then []
        else List.map (fun (d, k) -> Tabler_item (d, k)) (search_icons s.q)
      in
      let items =
        List.map (fun (id, name) -> Emoji_item (id, name)) s.emoji_results
        @ icons
      in
      column ~gap:4 ~grow:1.
        (if items = [] then []
         else
           [ pane_section ~virtual_list:true
               (I.tf "icon/matched-count" [ string_of_int (List.length items) ])
               (List.map item_btn items) ])
  in

  let tabs =
    if emoji_only then [ (Tab_emoji, I.t "icon/tab-emojis") ]
    else
      [ (Tab_all, I.t "icon/tab-all"); (Tab_emoji, I.t "icon/tab-emojis")
      ; (Tab_icon, I.t "icon/tab-icons") ]
  in

  (Ui_components.with_props
     [ P.Position, P.StringValue "relative"
     ; P.Overflow, P.StringValue "hidden" ]
     (column ~style_class:"cp__emoji-icon-picker"
        ~width:380 ~max_height:408
        ~data_attrs:
          [ ("data-keep-selection", "true")
          ; ("style", "max-width: calc(100vw - 16px)") ]
        [ Ui_components.with_props
            [ P.Position, P.StringValue "absolute"
            ; P.InsetTop, P.FloatValue 38.
            ; P.InsetLeft, P.FloatValue 0. ]
            (box ~key:"hd" ~container_relative_frame:`horizontal
               ~background:"hsl(var(--popover))"
               ~data_attrs:
                 [ ( "style"
                   , "box-sizing: border-box; padding: 0.625rem 0.75rem \
                      0.25rem" ) ]
         [ reactive
             ~equal:(fun (a : pstate) b ->
                a.tab = b.tab && a.reset = b.reset)
             (fun s ->
                Ui_components.search_row
                  ~key:
                    ("sr-" ^ tab_name s.tab ^ "-" ^ string_of_int s.reset)
                  ~height:32 ~pad_left:32 ~borderless:true ~autofocus:true
                  ~background:
                    "var(--lx-gray-03, var(--ls-tertiary-background-color, \
                     hsl(var(--muted))))"
                  ~placeholder:(placeholder_of s.tab)
                  ~text_signal:(Signal.map (fun s -> s.q) sv)
                  ~on_input:(fun ev ->
                    match ev with
                    | Lui_protocol.TextChanged (_, v) -> on_input v
                    | _ -> ())
                  ~trailing:
                    [ if_
                        ~test:(reactive (fun s -> s.q <> "") sv)
                        (Ui_components.with_props
                           [ Lui_protocol.Opacity
                           , Lui_protocol.FloatValue 0.5 ]
                           (button ~key:"x" ~variant:`ghost ~padding:8
                              ~on_press:(fun _ -> reset_q ())
                              [ Icons.icon ~size:14. "x" ]))
                    ]
                  ())
             sv ])
     ; Ui_parts.class_signal sv
         (fun s -> "bd " ^ tab_name s.tab)
         (scroll ~key:"bd" ~orientation:`vertical ~grow:1.
            ~data_attrs:
              [ ( "style"
                , "padding: 96px 0.25rem 0.25rem; box-sizing: \
                   border-box" ) ]
            [ box
                [ reactive
                    ~equal:(fun (a : pstate) b ->
                       a.q = b.q && a.tab = b.tab
                       && a.emoji_results = b.emoji_results)
                    content_view sv ] ])
     ; Ui_components.with_props
         [ P.Position, P.StringValue "absolute"
         ; P.InsetTop, P.FloatValue (-1.)
         ; P.InsetLeft, P.FloatValue 0. ]
         (row ~key:"ft" ~cross:`center ~padding:12 ~height:40
            ~container_relative_frame:`horizontal
            ~background:
              "var(--lx-gray-02, var(--ls-secondary-background-color, \
                hsl(var(--popover))))"
            ~data_attrs:
              [ ( "style"
                , "box-sizing: border-box; border-top: 1px solid \
                   var(--lx-gray-05, var(--ls-border-color, \
                   hsl(var(--border))))" ) ]
            ([ toggle_group ~key:"tabs" ~gap:8 ~grow:1. ~cross:`center
              (List.map
                 (fun (t, label) ->
                   Ui_components.chip_toggle ~key:("tab-" ^ tab_name t)
                     ~radius:4 ~pad_v:4 ~pad_h:8 ~font_size:"0.8125rem"
                     ~off_opacity:0.5 ~text:label
                     ~checked_signal:(Signal.map (fun s -> s.tab = t) sv)
                     ~on_toggle:(fun _ -> set_tab t) ())
                 tabs) ]
          (* cljs hides the color picker on the emoji tab *)
          @
          [ if_
              ~test:(reactive (fun s -> s.tab <> Tab_emoji) sv)
              (box ~key:"pal"
                 [ Ui_components.with_props
                     [ P.Position, P.StringValue "relative"
                     ; P.Overflow, P.StringValue "hidden" ]
                     (button ~style_class:(btn_outline_sm ^ " color-picker")
                        ~height:28 ~width:24 ~padding_vertical:4
                        ~padding_horizontal:12 ~corner_radius:4
                        ~label:(I.t "icon/select-color") ~icon:(`app "palette")
                     ~foreground:(reactive (fun s ->
                       Option.value s.preset ~default:"inherit") sv)
                        ~on_press:(fun _ ->
                          update (fun s -> { s with pal_open = not s.pal_open }))
                        [])
                 ; if_ ~test:(reactive (fun s -> s.pal_open) sv)
                     (popover ~key:"pal-pop" ~anchor:`below
                        ~anchor_alignment:`start ~anchor_offset:4.
                        ~on_dismiss:(fun _ ->
                          update (fun s -> { s with pal_open = false }))
                        [ row ~style_class:"color-picker-presets" ~gap:2
                            (List.map preset_btn preset_colors) ])
                 ]) ]
          @
          (if del then
             [ button ~key:"del" ~style_class:btn_outline_sm ~height:28
                 ~padding_vertical:4 ~padding_horizontal:12 ~corner_radius:4
                 ~data_attrs:[ ("data-action", "del") ]
                 ~tooltip:(I.t "ui/delete")
                 ~label:(I.t "ui/delete")
                 ~on_press:(fun _ -> choose Remove)
                 [ icon_el ~size:17. ("tabler-icon", "trash") ] ]
           else []))) ]))
    context parent
;;

(* `sub` positions the picker as a submenu (right edge of anchor);
   `emoji_only` restricts it to the Emojis tab (reaction picker) *)
type picker_opts = { emoji_only : bool; sub : bool }

let pop_cls =
  "ui__popover-content ls-icon-picker rounded-md border bg-popover \
   text-popover-foreground shadow-md outline-none animate-in \
   data-[side=bottom]:slide-in-from-top-2 \
   data-[side=left]:slide-in-from-right-2 \
   data-[side=right]:slide-in-from-left-2 \
   data-[side=top]:slide-in-from-bottom-2 focus:outline-none \
   focus-visible:outline-none z-50"

(* imperative entry: mount the picker view under the anchor through the
   shared popup layer; returns the view-overlay key the caller stores as
   its close handle *)
let open_picker_with_opts ~(anchor : Ui_services.el) ~(del : bool)
    ~(opts : picker_opts) ~(on_chosen : choice -> unit) : string =
  Emoji_mart.install ();
  let key_ref = ref "" in
  let content =
    picker_view ~del ~emoji_only:opts.emoji_only ~on_chosen
      ~close:(fun () -> S.remove_view_overlay !key_ref)
  in
  let key =
    if opts.sub then
      Properties_popup.open_anchored_right ~cls:pop_cls anchor content
    else Properties_popup.open_anchored ~cls:pop_cls anchor content
  in
  key_ref := key;
  key
;;

let open_picker ~(anchor : Ui_services.el) ~(del : bool)
    ~(on_chosen : choice -> unit) : unit =
  ignore
    (open_picker_with_opts ~anchor ~del
       ~opts:{ emoji_only = false; sub = false }
       ~on_chosen)
;;
