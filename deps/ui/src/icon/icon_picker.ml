(* Icon picker popup — mirrors cljs icon.cljs icon-search:
   .cp__emoji-icon-picker[data-keep-selection]
     > .hd.bg-popover > .search-input > tabler "search" + input + a.x
     > .bd.bd-scroll.<tab> > .content-pane > (.all-pane | .flex sections)
     > .ft  (icon.css positions it at the top) > tab buttons + color picker
       + del.

   All tab = "Frequently used" (when storage has items) + "Emojis (N)"
   first-32 + "Icons (M)" first-48 pane-sections. Tabler icon names are
   enumerated from the loaded tabler-icons.min.css selectors — the font
   already ships every glyph, so `ti ti-<name>` renders them all. *)

module D = Web_dom

module I = I18n

type choice = Emoji of string | Tabler of (string * string option) | Remove
type tab = Tab_all | Tab_emoji | Tab_icon

let em_emoji_el ?(cls = "") (id : string) : D.el =
  D.mk ~cls ~attrs:[ ("id", id) ] "em-emoji"

(* icon value {type,id} -> display element *)
let icon_el ?(size = 18.) ?(cls = "") (ty, id) : D.el =
  match ty with
  | "emoji" -> em_emoji_el ~cls id
  | _ -> D.icon ~size ~cls id

(* cljs ui__button base + variant/size classes (shui/button) *)
let btn_base = "ui__button"

let btn_ghost_sm = btn_base ^ " as-ghost ls-ep-btn"

let btn_outline_sm = btn_base ^ " as-outline ls-ep-btn"

let tab_item_cls active =
  btn_ghost_sm ^ " tab-item" ^ if active then " active" else ""

let ui_input_cls = "ui__input ls-ep-input"

external el_style : D.el -> Js.Json.t = "style" [@@mel.get]

external style_set : Js.Json.t -> string -> string -> unit = "setProperty"
  [@@mel.send]

(* ---------- tabler icon names ---------- *)

(* cljs get-tabler-icons enumerates @tabler/icons-react exports in order
   and csk-prettifies them into display names ("Abacus Off"); the table
   ships as a lazy chunk (Icon_picker_names) — empty until the first
   picker open resolves it. *)
let icon_items () = Array.to_list !Icon_picker_names.items

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
  match Platform.local_storage_get "ls-icons-used" with
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
  Platform.local_storage_set "ls-icons-used"
    (Edn.to_string
       (Wire.List
          (List.map
             (fun (t, i, n) ->
               Wire.Map
                 [ (Wire.Keyword "type", Wire.Keyword t)
                 ; (Wire.Keyword "id", Wire.String i)
                 ; (Wire.Keyword "name", Wire.String n) ])
             items)))

(* ---------- picker ---------- *)

type picker =
  { del : bool
  ; emoji_only : bool
  ; on_chosen : choice -> unit
  ; mutable q : string
  ; mutable tab : tab
  ; mutable gen : int
  ; mutable input : D.el option
  ; mutable x_btn : D.el option
  ; mutable bd : D.el option
  ; mutable pane : D.el option
  ; mutable root : D.el option
  ; mutable pal_wrap : D.el option
  }

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

let emoji_count () =
  match Js.Json.decodeObject (Lazy.force Emoji_mart.mart_emojis) with
  | Some d -> Array.length (Js.Dict.keys d)
  | None -> 0

let all_emojis () : (string * string) list =
  match Js.Json.decodeObject (Lazy.force Emoji_mart.mart_emojis) with
  | Some d ->
      Array.to_list (Js.Dict.keys d)
      |> List.filter_map (fun id ->
             match Js.Dict.get d id with
             | Some j ->
                 Some
                   ( id
                   , Option.value ~default:id
                       (Js.Json.decodeString (Web_dom.js_get j "name")) )
             | None -> None)
  | None -> []

let close () = Properties_state.pop_overlay ()

let preset_color () = Platform.local_storage_get "ls-icon-color-preset"

let choose (p : picker) (c : choice) =
  close ();
  (match c with
   | Emoji id ->
       add_used_item
         ( "emoji", id
         , match List.assoc_opt id (all_emojis ()) with
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
  p.on_chosen c

let item_btn (p : picker) (it : item) : D.el =
  match it with
  | Emoji_item (id, name) ->
      let b =
        D.mk ~cls:"ls-emoji-preview"
          ~attrs:[ ("title", name); ("tabindex", "0") ]
          "button"
      in
      D.el_append_child b (em_emoji_el id);
      D.on_click b (fun _ -> choose p (Emoji id));
      b
  | Tabler_item (display, kebab) ->
      let b =
        D.mk ~cls:"ls-emoji-cell"
          ~attrs:[ ("title", icon_id display); ("tabindex", "0") ]
          "button"
      in
      (* cljs ui/icon called with the display name: the ls-icon class
         keeps the spaces verbatim, the svg uses the kebab name *)
      let span =
        D.mk ~cls:("ui__icon ti ls-icon-" ^ display) "span"
      in
      (match D.tabler_svg_el ~size:24. kebab with
       | Some svg -> D.el_append_child span svg
       | None -> ());
      D.el_append_child b span;
      D.on_click b (fun _ -> choose p (Tabler (icon_id display, preset_color ())));
      b

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

let pane_section ?(virtual_list = false) ?(searching = false) label
    (items : D.el list) : D.el =
  let sec =
    D.mk
      ~cls:
        ("pane-section"
        ^ if searching then "" else "")
      "div"
  in
  let hd = D.mk ~cls:"hd" "div" in
  let strong =
    D.mk ~cls:"ls-ep-section-title" "strong"
  in
  D.el_append_child strong (D.create_text_node label);
  D.el_append_child hd strong;
  D.el_append_child sec hd;
  if virtual_list then (
    let wrap = D.mk "div" in
    List.iter
      (fun row ->
        let r = D.mk ~cls:"its icons-row" "div" in
        List.iter (fun b -> D.el_append_child r b) row;
        D.el_append_child wrap r)
      (chunks 9 items);
    D.el_append_child sec wrap)
  else (
    let its = D.mk ~cls:"its" "div" in
    List.iter (fun b -> D.el_append_child its b) items;
    D.el_append_child sec its);
  sec

(* ---------- tab/search rendering ---------- *)

let clear_pane (p : picker) =
  match p.pane with
  | Some pane -> D.el_replace_children pane
  | None -> ()

let used_section_items (p : picker) : D.el list =
  used_items ()
  |> List.map (fun (typ, id, name) ->
         if typ = "emoji" then item_btn p (Emoji_item (id, name))
         else
           match
             List.find_opt
               (fun (d, _) -> icon_id d = id)
               (icon_items ())
           with
           | Some (d, k) -> item_btn p (Tabler_item (d, k))
           | None -> item_btn p (Tabler_item (name, Icons.kebab name)))

let render_tab (p : picker) =
  clear_pane p;
  match p.pane, p.tab with
  | Some pane, _ ->
      let wrap = D.mk ~cls:"ls-ep-col" "div" in
      (match p.tab with
       | Tab_all ->
           let inner = D.mk ~cls:"all-pane" "div" in
           let used = used_section_items p in
           (if used <> [] then
              D.el_append_child inner
                (pane_section (I.t "ui/frequently-used") used));
           D.el_append_child inner
             (pane_section
                (I.tf "icon/emojis-count" [ string_of_int (emoji_count ()) ])
                (List.map (fun (id,n) -> item_btn p (Emoji_item (id,n)))
                   (take 32 (all_emojis ()))));
           D.el_append_child inner
             (pane_section
                (I.tf "icon/icons-count"
                   [ string_of_int (List.length (icon_items ())) ])
                (List.map (fun (d, k) -> item_btn p (Tabler_item (d, k)))
                   (take 48 (icon_items ()))));
           D.el_append_child wrap inner
       | Tab_emoji ->
           (* cljs emojis-cp renders its own flex-1 flex-col gap-1 div
              inside the outer one *)
           let inner = D.mk ~cls:"ls-ep-col" "div" in
           let used =
             used_items ()
             |> List.filter (fun (t, _, _) -> t = "emoji")
             |> List.map (fun (_, id, name) ->
                    item_btn p (Emoji_item (id, name)))
           in
           (if used <> [] then
              D.el_append_child inner
                (pane_section (I.t "ui/frequently-used") used));
           D.el_append_child inner
             (pane_section ~virtual_list:true
                (I.tf "icon/emojis-count" [ string_of_int (emoji_count ()) ])
                (List.map (fun (id,n) -> item_btn p (Emoji_item (id,n)))
                   (all_emojis ())));
           D.el_append_child wrap inner
       | Tab_icon ->
           D.el_append_child wrap
             (pane_section ~virtual_list:true
                (I.tf "icon/icons-count"
                   [ string_of_int (List.length (icon_items ())) ])
                (List.map (fun (d, k) -> item_btn p (Tabler_item (d, k)))
                   (icon_items ()))));
      D.el_append_child pane wrap
  | None, _ -> ()

let render_search (p : picker) =
  clear_pane p;
  match p.pane with
  | Some pane ->
      p.gen <- p.gen + 1;
      let gen = p.gen in
      let wrap =
        D.mk ~cls:"ls-ep-col search-result" "div"
      in
      D.el_append_child pane wrap;
      let icons =
        if p.tab = Tab_emoji then []
        else List.map (fun (d, k) -> Tabler_item (d, k)) (search_icons p.q)
      in
      let fill emojis =
        if gen = p.gen then (
          D.el_replace_children wrap;
          let items =
            List.map (fun (id, name) -> Emoji_item (id, name)) emojis
            @ icons
          in
          if items <> [] then
            D.el_append_child wrap
              (pane_section ~virtual_list:true ~searching:true
                 (I.tf "icon/matched-count"
                    [ string_of_int (List.length items) ])
                 (List.map (item_btn p) items)))
      in
      if p.tab = Tab_icon then fill []
      else Emoji_mart.search p.q (fun entries -> fill entries)
  | None -> ()

let refresh (p : picker) =
  if String.trim p.q = "" then render_tab p else render_search p

let reset_q (p : picker) =
  p.q <- "";
  (match p.input with
   | Some i -> D.el_set_value i ""
   | None -> ());
  render_tab p

let set_tab (p : picker) (t : tab) =
  p.tab <- t;
  (match p.bd with
   | Some bd ->
       D.el_set_class bd ("bd bd-scroll " ^ tab_name t)
   | None -> ());
  (match p.root with
   | Some root -> (
       (* the cljs class token is ",tab-item" / "active,tab-item" (comma
          joined) so ".tab-item" never matches; use the substring form *)
       let nl = D.el_query_all root "[class*='tab-item']" in
       let n = D.nl_length nl in
       for i = 0 to n - 1 do
         match D.nl_item nl i with
         | Some b -> D.el_set_class b (tab_item_cls false)
         | None -> ()
       done;
       match
         D.nl_item nl
           (match t with Tab_all -> 0 | Tab_emoji -> 1 | Tab_icon -> 2)
       with
       | Some b -> D.el_set_class b (tab_item_cls true)
       | None -> ())
   | None -> ());
  (* cljs hides the color picker on the emoji tab *)
  (match p.pal_wrap, p.root with
   | Some pal_wrap, Some root -> (
       match D.el_parent pal_wrap with
       | Some _ -> if t = Tab_emoji then D.el_remove pal_wrap
       | None ->
           if t <> Tab_emoji then (
             match D.el_query root ".ft" with
             | Some ft -> (
                 (* keep the cljs order: tabs, color picker, del *)
                 match D.el_query ft "button[data-action='del']" with
                 | Some del -> D.el_insert_before ft pal_wrap (Some del)
                 | None -> D.el_append_child ft pal_wrap)
             | None -> ()))
   | _ -> ());
  (match p.input with
   | Some i -> D.el_set_attr i "placeholder" (placeholder_of t)
   | None -> ());
  reset_q p

(* ---------- color preset popover ---------- *)

let preset_colors =
  [ Some "#6e7b8b"; Some "#5e69d2"; Some "#00b5ed"; Some "#00b55b"
  ; Some "#f2be00"; Some "#e47a00"; Some "#f38e81"; Some "#fb434c"; None ]

let presets_popover (p : picker) (anchor_btn : D.el) : D.el =
  let pop = D.mk ~cls:"color-picker-presets" "div" in
  List.iter
    (fun c ->
      let style, child =
        match c with
        | Some c -> ("background-color:" ^ c, None)
        | None ->
            ("", Some (icon_el ~cls:"ls-icon-mini"
                         ("tabler-icon", "minus")))
      in
      let b =
        D.mk ~cls:(btn_outline_sm ^ " it")
          ~attrs:[ ("style", style); ("type", "button") ]
          "button"
      in
      (match child with Some el -> D.el_append_child b el | None -> ());
      D.on_click b (fun _ ->
          (match p.root with
           | Some root ->
               style_set (el_style root) "--ls-color-icon-preset"
                 (Option.value c ~default:"inherit")
           | None -> ());
          (match c with
           | Some c -> Platform.local_storage_set "ls-icon-color-preset" c
           | None -> Platform.local_storage_remove "ls-icon-color-preset");
          D.el_remove pop);
      D.el_append_child pop b)
    preset_colors;
  let l, _t, _r, btm, _w = D.bounding_rect_fields anchor_btn in
  D.set_style pop
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:10000" l
       (btm +. 4.));
  pop

(* ---------- view ---------- *)

let view (p : picker) : D.el =
  let root = D.mk ~cls:"cp__emoji-icon-picker" "div" in
  D.el_set_attr root "data-keep-selection" "true";
  D.el_listen root "keydown"
    (fun ev ->
      match D.ev_key ev with
      | "ArrowLeft" | "ArrowRight" -> D.ev_stop_propagation ev
      | _ -> ())
    true;
  let hd = D.mk ~cls:"hd" "div" in
  let si = D.mk ~cls:"search-input" "div" in
  D.el_append_child si (icon_el ~size:16. ("tabler-icon", "search"));
  let input =
    D.mk ~cls:ui_input_cls
      ~attrs:
        [ ("placeholder", placeholder_of p.tab); ("auto-focus", "true") ]
      "input"
  in
  D.el_append_child si input;
  let rebuild_x () =
    (match p.x_btn with Some x -> D.el_remove x | None -> ());
    p.x_btn <- None;
    if p.q <> "" then (
      let x = D.mk ~cls:"x" "a" in
      D.el_append_child x (icon_el ~size:14. ("tabler-icon", "x"));
      D.on_click x (fun _ -> reset_q p);
      D.el_append_child si x;
      p.x_btn <- Some x)
  in
  D.el_listen input "input"
    (fun _ ->
      p.q <- String.trim (D.el_value input);
      rebuild_x ();
      refresh p)
    true;
  D.el_listen input "keydown"
    (fun ev ->
      match D.ev_key ev with
      | "Escape" ->
          D.ev_prevent_default ev;
          if p.q = "" then close () else reset_q p
      | _ -> ())
    true;
  D.el_append_child hd si;
  D.el_append_child root hd;
  let bd = D.mk ~cls:("bd " ^ tab_name p.tab) "div" in
  let pane = D.mk ~cls:"content-pane" "div" in
  D.el_append_child bd pane;
  D.el_append_child root bd;
  let ft = D.mk ~cls:"ft" "div" in
  let tabs_row = D.mk ~cls:"ls-ep-tabs" "div" in
  List.iter
    (fun (t, label) ->
      let b =
        D.mk ~cls:(tab_item_cls (t = p.tab))
          ~attrs:[ ("type", "button") ]
          "button"
      in
      D.el_append_child b (D.create_text_node label);
      D.on_click b (fun _ -> set_tab p t);
      D.el_append_child tabs_row b)
    (if p.emoji_only then [ (Tab_emoji, I.t "icon/tab-emojis") ]
     else
       [ (Tab_all, I.t "icon/tab-all"); (Tab_emoji, I.t "icon/tab-emojis")
       ; (Tab_icon, I.t "icon/tab-icons") ]);
  D.el_append_child ft tabs_row;
  (* cljs shui/popover-trigger renders a bare button wrapper with
     aria-expanded around the color-picker button *)
  let pal_wrap =
    D.mk ~attrs:[ ("type", "button"); ("aria-expanded", "false") ] "button"
  in
  let pal =
    D.mk ~cls:(btn_outline_sm ^ " color-picker")
      ~attrs:[ ("type", "button") ] "button"
  in
  let pal_strong = D.mk "strong" in
  (match preset_color () with
   | Some c -> D.el_set_attr pal_strong "style" ("color:" ^ c)
   | None -> ());
  D.el_append_child pal_strong (icon_el ("tabler-icon", "palette"));
  D.el_append_child pal pal_strong;
  D.el_append_child pal_wrap pal;
  let pop_ref : D.el option ref = ref None in
  D.on_click pal (fun _ ->
      match !pop_ref with
      | Some pop -> D.el_remove pop; pop_ref := None
      | None ->
          let pop = presets_popover p pal_wrap in
          pop_ref := Some pop;
          (match D.query_selector "body" with
           | Some body -> D.el_append_child body pop
           | None -> ()));
  (match p.tab with
   | Tab_emoji -> ()
   | _ -> D.el_append_child ft pal_wrap);
  (if p.del then (
     let d =
       D.mk ~cls:btn_outline_sm
         ~attrs:
           [ ("data-action", "del"); ("type", "button")
           ; ("title", I.t "ui/delete") ]
         "button"
     in
     D.el_append_child d (icon_el ~size:17. ("tabler-icon", "trash"));
     D.on_click d (fun _ -> choose p Remove);
     D.el_append_child ft d));
  D.el_append_child root ft;
  p.input <- Some input;
  p.bd <- Some bd;
  p.pane <- Some pane;
  p.root <- Some root;
  p.pal_wrap <- Some pal_wrap;
  render_tab p;
  root

(* `sub` positions the picker as a submenu (right edge of anchor);
   `emoji_only` restricts it to the Emojis tab (reaction picker) *)
type picker_opts = { emoji_only : bool; sub : bool }

let open_picker_with_opts ~(anchor : D.el) ~(del : bool)
    ~(opts : picker_opts) ~(on_chosen : choice -> unit) : D.el =
  let emoji_only = opts.emoji_only in
  Emoji_mart.install ();
  let p =
    { del; emoji_only; on_chosen; q = ""
    ; tab = (if emoji_only then Tab_emoji else Tab_all); gen = 0
    ; input = None
    ; x_btn = None; bd = None; pane = None; root = None; pal_wrap = None }
  in
  let root = view p in
  (* icon names load lazily — re-render the pane once the chunk lands *)
  ignore
    (Lazy.force Icon_picker_names.load
     |> Js.Promise.then_ (fun () ->
            refresh p;
            Js.Promise.resolve ()));
  (* cljs chrome: ui__popover-content > ls-property-dialog >
     ls-property-input > ls-property-add > .flex-row >
     property-value-inner > picker *)
  let dlg = D.mk ~cls:"ls-property-dialog" "div" in
  let lpi =
    D.mk ~cls:"ls-property-input flex flex-1 flex-row items-center flex-wrap gap-1" "div"
  in
  let lpa =
    D.mk ~cls:"ls-property-add ls-pa-row"
      "div"
  in
  let row = D.mk ~cls:"ls-ep-row" "div" in
  let pvi = D.mk ~cls:"property-value-inner" "div" in
  D.el_append_child dlg lpi;
  D.el_append_child lpi lpa;
  D.el_append_child lpa row;
  D.el_append_child row pvi;
  D.el_append_child pvi root;

  let open_popup =
    if opts.sub then Properties_popup.open_anchored_right
    else Properties_popup.open_anchored
  in
  let pop =
    open_popup
      ~cls:"ui__popover-content ls-icon-picker rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 focus:outline-none focus-visible:outline-none z-50"
      anchor dlg
  in
  (match p.input with
   | Some i -> D.el_focus i
   | None -> ());
  pop
;;

let open_picker ~(anchor : D.el) ~(del : bool)
    ~(on_chosen : choice -> unit) : unit =
  ignore
    (open_picker_with_opts ~anchor ~del
       ~opts:{ emoji_only = false; sub = false }
       ~on_chosen)
;;

