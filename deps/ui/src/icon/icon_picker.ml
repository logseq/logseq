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

let icon_el ?key ?(size = 18.) ?(cls = "") (value : Node_icon.t) : t =
  let element = match value.icon_kind with
    | "emoji" ->
        Ui_components.with_props
          [Ui_components.Prop.font_size (Printf.sprintf "%gpx" size);Ui_components.Prop.line_height "1"]
          (row ?key ~width:(int_of_float size) ~height:(int_of_float size)
             ~cross:`center ~main:`center ~style_class:cls [Logseq_emoji.el ~name:value.icon_id ()])
    | "tabler-icon" -> Icons.icon ?key ~size ~cls value.icon_id
    | kind -> invalid_arg ("Unsupported icon type: " ^ kind) in
  match value.icon_color with
  | None -> element
  | Some color -> Ui_components.with_props [Ui_components.Prop.foreground color] element

let page_icon_el ?(size = 16.) page =
  let value = Option.value (Model.page_node_icon page) ~default:(Node_icon.tabler "file") in
  Ui_components.with_props [Ui_components.Prop.margin_right 0] (icon_el ~size value)

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

(* cljs search-tabler-icons: fuzzy-search over the display names *)
let search_icons q = Fuzzy.fuzzy_search ~extract:fst ~limit:100 (icon_items ()) q

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
  let alive = ref true in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> alive := false; incr gen);
  let get () = Runtime.signal_get st in
  let update f = Runtime.signal_set st (f (get ())) in

  let chosen = ref false in
  let choose c =
    if not !alive || !chosen then () else (
    chosen := true;
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
    on_chosen c)
  in

  let item_btn (it : item) : t =
    (* ls-emoji-cell is the regression test's icon-button locator; the
       .its/.icons-row button chrome moved to the typed props *)
    let cell ?font_size ?fg ?ff ~cls ~key ~label ~tooltip ~on_press child : t =
      Ui_components.with_props
        ([ ( Ui_components.Prop.hover_background
               "var(--lx-gray-03, var(--ls-menu-hover-color, \
                  hsl(var(--muted))))" )
         ]
         @ (match fg with
            | Some c -> [ Ui_components.Prop.foreground c ]
            | None -> [])
         @ (match ff with
            | Some f -> [ Ui_components.Prop.font_family f ]
            | None -> [])
         @ (match font_size with
            | Some fz -> [ Ui_components.Prop.font_size fz ]
            | None -> []))
        (Ui_components.button ~text:"" ~key ~style_class:cls ~variant:`ghost ~width:36 ~height:36
           ~padding:0 ~corner_radius:9999 ~label ~tooltip ~on_press
           ~transition:"opacity 150ms"
           [ child ])
    in
    match it with
    | Emoji_item (id, name) ->
        cell ~font_size:"1.5rem" ~cls:"ls-emoji-preview" ~key:("e-" ^ id)
          ~label:name ~tooltip:name
          (* emoji keep their own color glyphs: the color preset only
             tints tabler icons, and the platform color-emoji font keeps
             them from rasterizing as tinted monochrome shapes *)
          ~ff:"Apple Color Emoji, Noto Color Emoji, Segoe UI Emoji"
          ~on_press:(fun _ -> choose (Emoji id))
          (Logseq_emoji.el ~name:id ())
    | Tabler_item (display, kebab) ->
        cell ~cls:"ls-emoji-cell" ~key:("t-" ^ icon_id display) ~label:display
          ~fg:(Option.value (get ()).preset ~default:"inherit")
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

  (* Keep item data in the source, and construct cells only for the live
     viewport. Leaving rows release their scopes, tooltips and DOM nodes. *)
  let section label items =
    [label, chunks 9 items]
  in
  let used_item_data () =
    used_items ()
    |> List.map (fun (typ, id, name) ->
      if typ = "emoji" then Emoji_item (id, name)
      else match List.find_opt (fun (display, _) -> icon_id display = id) (icon_items ()) with
      | Some (display, name) -> Tabler_item (display, name)
      | None -> Tabler_item (name, Icons.kebab name))
  in
  let emoji_items entries = List.map (fun (id, name) -> Emoji_item (id, name)) entries in
  let tabler_items entries = List.map (fun (display, name) -> Tabler_item (display, name)) entries in
  let used_section items =
    if items = [] then [] else section (I.t "ui/frequently-used") items
  in
  let render_row = function
    | `Heading label ->
      Ui_components.with_props
        [Ui_components.Prop.line_height "16px"; Ui_components.Prop.padding_bottom 4]
      (box ~height:22 ~min_height:22 ~margin_left:8 ~padding_horizontal:4 ~style_class:"hd"
        [text ~as_:`Strong ~style_class:"ls-ep-section-title" ~value:label
          ~font_size:"0.75rem" ~line_height:"16px" ~font_weight:500
          ~foreground:"var(--lx-gray-07, var(--ls-quaternary-background-color, var(--rx-gray-07)))" []])
    | `Cells items ->
      row ~gap:4 ~height:36 ~min_width:0
        ~padding_horizontal:8 (List.map item_btn items)
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
          if !alive && g = !gen then
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
       | None -> [ icon_el ~cls:"ls-icon-mini" (Node_icon.tabler "minus") ])
  in

  let content_view (s : pstate) : t =
    let rows =
      if String.trim s.q = "" then
        match s.tab with
        | Tab_all ->
          used_section (used_item_data ())
          @ section (I.tf "icon/emojis-count" [string_of_int (Emoji_mart.emoji_count ())])
              (emoji_items (take 32 (Emoji_mart.all_emojis ())))
          @ section (I.tf "icon/icons-count" [string_of_int Icon_picker_names.inventory_count])
              (tabler_items (take 48 (icon_items ())))
        | Tab_emoji ->
          (if emoji_only then
             used_section (List.filter (function Emoji_item _ -> true | _ -> false) (used_item_data ()))
           else [])
          @ section (I.tf "icon/emojis-count" [string_of_int (Emoji_mart.emoji_count ())])
              (emoji_items (Emoji_mart.all_emojis ()))
        | Tab_icon ->
          section (I.tf "icon/icons-count" [string_of_int Icon_picker_names.inventory_count])
            (tabler_items (icon_items ()))
      else
        let icons = if s.tab = Tab_emoji then [] else tabler_items (search_icons s.q) in
        let items = emoji_items s.emoji_results @ icons in
        if items = [] then []
        else section (I.tf "icon/matched-count" [string_of_int (List.length items)]) items
    in
    let static_section (label, rows) =
      [render_row (`Heading label);
       column ~gap:4 ~padding_vertical:4
         (List.map (fun items -> render_row (`Cells items)) rows)]
    in
    let content =
      if s.tab = Tab_all && String.trim s.q = "" then
        scroll ~grow:1. ~min_height:0 ~padding:0
          [column ~gap:0 (List.concat_map static_section rows)]
      else
        match List.rev rows with
        | [] -> column ~grow:1. []
        | (label, items) :: prefix ->
            let source = Signal.constant sched (List.mapi (fun index row -> index, row) items) in
            column ~grow:1. ~min_height:0 ~gap:0
              (List.concat_map (fun section -> static_section section @ [box ~height:4 []]) (List.rev prefix)
               @ [render_row (`Heading label);
                  virtual_list ~key:("items-" ^ tab_name s.tab ^ "-" ^ s.q)
                    ~grow:1. ~min_height:0 ~padding:0 ~gap:0 ~item_extent:44. ~overscan:2
                    [virtual_rows ~source ~key:fst ~cmp:Int.compare
                      ~mount:(fun row -> box ~height:44 ~padding_vertical:4
                        [reactive (fun (_, items) -> render_row (`Cells items)) row]) ()]])
    in
    Ui_components.with_props
      [Ui_components.Prop.padding_top 96; Ui_components.Prop.padding_bottom 4;
       Ui_components.Prop.padding_horizontal 0]
      (column ~key:("bd-" ^ tab_name s.tab ^ "-" ^ s.q)
         ~style_class:("bd " ^ tab_name s.tab) ~grow:1. ~min_height:0
         ~background:"transparent"
         [content])
  in

  (* cljs a.x: link-colored anchor filling the input height, 50% opacity *)
  let clear_search =
    if_ ~test:(reactive (fun s -> s.q <> "") sv)
      (Ui_components.with_props
         [ Ui_components.Prop.position `absolute
         ; Ui_components.Prop.inset_right 0.
         ; Ui_components.Prop.inset_top 0.
         ; Ui_components.Prop.opacity 0.5
         ; Ui_components.Prop.hover_opacity 0.8
         ; Ui_components.Prop.hover_foreground
             "var(--lx-accent-12, var(--ls-link-text-hover-color, hsl(var(--primary))))"
         ; Ui_components.Prop.cursor `pointer ]
         (button ~text:"" ~key:"clear" ~variant:`ghost ~height:32 ~min_width:0 ~min_height:0
            ~padding_horizontal:8 ~padding_vertical:0 ~cross:`center ~border_width:0
            ~background:"transparent"
            ~foreground:"var(--lx-accent-11, var(--ls-link-text-color))"
            ~label:(I.t "icon/clear-search")
            ~on_press:(fun _ ->
              on_input "";
              Option.iter (fun input -> input.Ui_services.focus ())
                (Ui_services.dom_query ".cp__emoji-icon-picker input"))
            [ Icons.icon ~size:14. "x" ]))
  in

  let tabs =
    if emoji_only then [ (Tab_emoji, I.t "icon/tab-emojis") ]
    else
      [ (Tab_all, I.t "icon/tab-all"); (Tab_emoji, I.t "icon/tab-emojis")
      ; (Tab_icon, I.t "icon/tab-icons") ]
  in

  (Ui_parts.int_prop Lui_protocol.HeightValue
     ~value:(reactive (fun s -> if s.tab = Tab_all || emoji_only then 408 else 400) sv)
   (Ui_components.with_props
     [ Ui_components.Prop.position `relative
     ; Ui_components.Prop.max_width_viewport 1.
     ; Ui_components.Prop.max_height_viewport 1.
     ; Ui_components.Prop.overflow `hidden ]
    (column ~style_class:"cp__emoji-icon-picker"
        ~width:380
        ~data_attrs:[ ("data-keep-selection", "true") ]
        [ Ui_components.with_props
            [Ui_components.Prop.position `absolute; Ui_components.Prop.inset_top (-1.);
             Ui_components.Prop.inset_left 0.; Ui_components.Prop.inset_right 0.]
          (row ~key:"ft" ~cross:`center ~padding:12 ~height:40
            ~background:
              "var(--lx-gray-02, var(--ls-secondary-background-color, \
                var(--rx-gray-02)))"
            ~data_attrs:
              [ ( "style"
                , "box-sizing: border-box; border-top: 1px solid \
                   var(--lx-gray-05, var(--ls-border-color, \
                   hsl(var(--border))))" ) ]
            ([ row ~key:"tabs" ~grow:1. ~cross:`center ~gap:8
                        (List.map
                           (fun (t, label) ->
                             Ui_parts.class_signal sv (fun s ->
                               if s.tab = t then "active tab-item" else "tab-item")
                               (Ui_components.with_props
                                  [ Ui_components.Prop.opacity 1.
                                  ; Ui_components.Prop.hover_background "hsl(var(--secondary) / 0.7)"
                                  ; Ui_components.Prop.hover_foreground "hsl(var(--secondary-foreground))" ]
                                  (Ui_components.button ~key:("tab-" ^ tab_name t)
                                     ~variant:`ghost ~size:`sm ~corner_radius:4
                                     ~text:label ~label ~on_press:(fun _ -> set_tab t) [])))
                           tabs) ]
          (* cljs hides the color picker on the emoji tab *)
          @
          [ if_
              ~test:(reactive (fun s -> s.tab <> Tab_emoji) sv)
              (box ~key:"pal"
                 [ Ui_components.with_props
                     [ Ui_components.Prop.position `relative
                     ; Ui_components.Prop.overflow `hidden ]
                     (Ui_components.icon_button ~variant:`outline ~style_class:(btn_outline_sm ^ " color-picker")
                        ~height:24 ~width:24 ~min_width:0 ~min_height:0
                        ~padding:0 ~main:`center ~cross:`center ~corner_radius:6
                        ~label:(I.t "icon/select-color") ~icon:(`app "palette")
                     ~foreground:(reactive (fun s ->
                       Option.value s.preset ~default:"inherit") sv)
                        ~on_press:(fun _ ->
                          update (fun s -> { s with pal_open = not s.pal_open }))
                        [])
                 ; if_ ~test:(reactive (fun s -> s.pal_open) sv)
                     (popover ~transition:Ui_components.popover_transition ~key:"pal-pop" ~target:(Anchor { side = `below; source = Parent;
                                                                                            align = `start; offset = 4.; align_offset = 0. })
                        ~on_dismiss:(fun _ ->
                          update (fun s -> { s with pal_open = false }))
                        [ row ~style_class:"color-picker-presets" ~gap:2
                            (List.map preset_btn preset_colors) ])
                 ]) ]
          @
          (if del then
             [ Ui_components.button ~text:"" ~variant:`outline ~key:"del" ~style_class:btn_outline_sm ~height:28
                 ~padding_vertical:4 ~padding_horizontal:12 ~corner_radius:4
                 ~data_attrs:[ ("data-action", "del") ]
                 ~tooltip:(I.t "ui/delete")
                 ~label:(I.t "ui/delete")
                 ~on_press:(fun _ -> choose Remove)
                 [ icon_el ~size:17. (Node_icon.tabler "trash") ] ]
           else [])))
     ; Ui_components.with_props
         [Ui_components.Prop.position `absolute; Ui_components.Prop.inset_top 38.;
          Ui_components.Prop.inset_left 0.; Ui_components.Prop.inset_right 0.;
          Ui_components.Prop.padding_top 10]
       (box ~key:"hd" ~background:"hsl(var(--popover))"
         ~padding_horizontal:12 ~padding_vertical:4
         [ reactive
             ~equal:(fun (a : pstate) b ->
                a.tab = b.tab && a.reset = b.reset)
             (fun s ->
                Ui_components.search_row
                  ~key:
                    ("sr-" ^ tab_name s.tab ^ "-" ^ string_of_int s.reset)
                  ~height:32 ~font_size:"14px" ~line_height:"1" ~pad_left:32 ~borderless:true ~autofocus:true
                  ~on_appear:(fun _ ->
                    ignore (Ui_services.timers_timeout (fun () ->
                      if !alive && (get ()).reset = s.reset then
                        Option.iter (fun input -> input.Ui_services.focus ())
                          (Ui_services.dom_query ".cp__emoji-icon-picker input")) 0))
                  ~background:
                    "var(--lx-gray-03, var(--ls-tertiary-background-color, var(--rx-gray-03)))"
                  ~focus_background:
                    "var(--lx-gray-02, var(--ls-secondary-background-color, var(--rx-gray-02)))"
                  ~focus_shadow:"0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))"
                  ~placeholder:(placeholder_of s.tab)
                  ~text_signal:(reactive (fun s -> s.q) sv)
                  ~on_text:on_input
                  ~trailing:[ clear_search ]
                  ())
             sv ])
     ; reactive
         ~equal:(fun (a : pstate) b ->
           a.q = b.q && a.tab = b.tab && a.preset = b.preset
           && a.emoji_results = b.emoji_results)
         content_view sv ])))
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
      Properties_popup.open_anchored_right ~cls:pop_cls ~padding:0 anchor content
    else Properties_popup.open_anchored ~cls:pop_cls ~padding:0 anchor content
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
