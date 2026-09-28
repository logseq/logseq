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

module D = struct
  include Editor_dom
  include Properties_dom
end

module E = Editor_dom
module I = Ui_strings

type choice = Emoji of string | Tabler of (string * string option) | Remove
type tab = Tab_all | Tab_emoji | Tab_icon

let em_emoji_el ?(cls = "") (id : string) : E.el =
  D.mk ~cls ~attrs:[ ("id", id) ] "em-emoji"

(* icon value {type,id} -> display element *)
let icon_el ?(cls = "") (ty, id) : E.el =
  match ty with
  | "emoji" -> em_emoji_el ~cls id
  | _ ->
      let i = D.mk ~cls:("ti ti-" ^ id) "i" in
      let span =
        D.mk ~cls:("ui__icon ti ls-icon-" ^ id ^ " " ^ cls) "span"
      in
      D.el_append_child span i;
      span

(* ---------- tabler icon names from the icon font stylesheet ---------- *)

external style_sheets : Js.Json.t = "styleSheets" [@@mel.scope "document"]

(* StyleSheetList / CSSRuleList are array-like, not real Arrays — access
   by length + index instead of Js.Json.decodeArray. *)
external list_length : Js.Json.t -> int = "length" [@@mel.get]

external list_item : Js.Json.t -> int -> Js.Json.t = "" [@@mel.get_index]

external el_style : E.el -> Js.Json.t = "style" [@@mel.get]

external style_set : Js.Json.t -> string -> string -> unit = "setProperty"
  [@@mel.send]

let name_of_selector (s : string) : string option =
  (* ".ti-<name>::before" single-selector rules only (the browser
     serializes :before to ::before) *)
  let n = String.length s in
  let pre = 4 + 8 in
  if n > pre && String.sub s 0 4 = ".ti-"
     && String.sub s (n - 8) 8 = "::before"
     && not (String.contains s ',')
  then Some (String.sub s 4 (n - pre))
  else None

let sheet_icon_names (sheet : Js.Json.t) : string list =
  try
    let rules = Platform.json_prop sheet "cssRules" in
    let n = list_length rules in
    let rec go i acc =
      if i >= n then List.rev acc
      else
        go (i + 1)
          (match
             Js.Json.decodeString (Platform.json_prop (list_item rules i) "selectorText")
           with
           | Some s -> (
               match name_of_selector s with
               | Some x -> x :: acc
               | None -> acc)
           | None -> acc)
    in
    go 0 []
  with _ -> [] (* cross-origin sheets throw on cssRules *)

let cached_icon_names : string list option ref = ref None

let icon_names () =
  match !cached_icon_names with
  | Some n -> n
  | None ->
      let n =
        let sheets = style_sheets in
        let total = list_length sheets in
        let rec go i acc =
          if i >= total then acc
          else go (i + 1) (sheet_icon_names (list_item sheets i) :: acc)
        in
        List.concat (List.rev (go 0 []))
      in
      cached_icon_names := Some n;
      n

(* cljs csk display name: "a-b-2" -> "A B 2" *)
let display_name (name : string) =
  String.split_on_char '-' name
  |> List.map (fun w ->
         if w = "" then w
         else
           String.make 1 (Char.uppercase_ascii w.[0])
           ^ String.sub w 1 (String.length w - 1))
  |> String.concat " "

(* cljs icon-cp strips spaces from the display name to form the id:
   "A B 2" -> "AB2". Our ids come straight from the font so they are
   already kebab names. *)
let icon_id name = name

let rec take n xs =
  match n, xs with
  | 0, _ | _, [] -> []
  | n, x :: tl -> x :: take (n - 1) tl

let contains_ci hay needle =
  let h = String.lowercase_ascii hay
  and n = String.lowercase_ascii needle in
  let hl = String.length h and nl = String.length n in
  let rec go i = i + nl <= hl && (String.sub h i nl = n || go (i + 1)) in
  nl = 0 || go 0

let search_icons q =
  icon_names ()
  |> List.filter (fun n -> contains_ci n q || contains_ci (display_name n) q)
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
  ; on_chosen : choice -> unit
  ; mutable q : string
  ; mutable tab : tab
  ; mutable gen : int
  ; mutable input : E.el option
  ; mutable x_btn : E.el option
  ; mutable bd : E.el option
  ; mutable pane : E.el option
  ; mutable root : E.el option
  }

type item =
  | Emoji_item of string * string
  | Tabler_item of string

let tab_name = function
  | Tab_all -> "all"
  | Tab_emoji -> "emoji"
  | Tab_icon -> "icon"

let placeholder_of = function
  | Tab_all -> I.t "icon/search-all"
  | Tab_emoji -> I.t "icon/search-emojis"
  | Tab_icon -> I.t "icon/search-icons"

let emoji_count () =
  match Js.Json.decodeObject Emoji_mart.mart_emojis with
  | Some d -> Array.length (Js.Dict.keys d)
  | None -> 0

let all_emojis () : (string * string) list =
  match Js.Json.decodeObject Emoji_mart.mart_emojis with
  | Some d ->
      Array.to_list (Js.Dict.keys d)
      |> List.filter_map (fun id ->
             match Js.Dict.get d id with
             | Some j ->
                 Some
                   ( id
                   , Option.value ~default:id
                       (Js.Json.decodeString (Platform.json_prop j "name")) )
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
   | Tabler (id, _) -> add_used_item ("tabler-icon", id, display_name id)
   | Remove -> ());
  p.on_chosen c

let item_btn (p : picker) (it : item) : E.el =
  match it with
  | Emoji_item (id, name) ->
      let b =
        D.mk ~cls:"text-2xl w-9 h-9 transition-opacity"
          ~attrs:[ ("title", name); ("type", "button"); ("tabindex", "0") ]
          "button"
      in
      D.el_append_child b (em_emoji_el id);
      D.on_click b (fun _ -> choose p (Emoji id));
      b
  | Tabler_item name ->
      let b =
        D.mk ~cls:"w-9 h-9 transition-opacity"
          ~attrs:
            [ ("title", icon_id name); ("type", "button"); ("tabindex", "0") ]
          "button"
      in
      D.el_append_child b (icon_el ("tabler-icon", name));
      D.on_click b (fun _ -> choose p (Tabler (name, preset_color ())));
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
    (items : E.el list) : E.el =
  let sec =
    D.mk
      ~cls:
        ("pane-section"
        ^ (if virtual_list then " has-virtual-list" else "")
        ^ if searching then " searching-result" else "")
      "div"
  in
  let hd = D.mk ~cls:"hd px-1 pb-1 leading-none" "div" in
  let strong =
    D.mk ~cls:"text-xs font-medium text-gray-07 dark:opacity-80" "strong"
  in
  D.el_append_child strong (D.create_text_node label);
  D.el_append_child hd strong;
  D.el_append_child sec hd;
  if virtual_list then (
    let wrap = D.mk ~cls:"virtuoso-item-list" "div" in
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
  | Some pane -> D.el_clear pane
  | None -> ()

let used_section_items (p : picker) : E.el list =
  used_items ()
  |> List.map (fun (typ, id, name) ->
         if typ = "emoji" then item_btn p (Emoji_item (id, name))
         else item_btn p (Tabler_item id))

let render_tab (p : picker) =
  clear_pane p;
  match p.pane, p.tab with
  | Some pane, _ ->
      let wrap = D.mk ~cls:"flex flex-1 flex-col gap-1" "div" in
      (match p.tab with
       | Tab_all ->
           D.el_set_class wrap "all-pane pb-10";
           let used = used_section_items p in
           (if used <> [] then
              D.el_append_child wrap
                (pane_section (I.t "ui/frequently-used") used));
           D.el_append_child wrap
             (pane_section
                (I.tf "icon/emojis-count" [ string_of_int (emoji_count ()) ])
                (List.map (fun (id,n) -> item_btn p (Emoji_item (id,n)))
                   (take 32 (all_emojis ()))));
           D.el_append_child wrap
             (pane_section
                (I.tf "icon/icons-count"
                   [ string_of_int (List.length (icon_names ())) ])
                (List.map (fun n -> item_btn p (Tabler_item n))
                   (take 48 (icon_names ()))))
       | Tab_emoji ->
           let used =
             used_items ()
             |> List.filter (fun (t, _, _) -> t = "emoji")
             |> List.map (fun (_, id, name) ->
                    item_btn p (Emoji_item (id, name)))
           in
           (if used <> [] then
              D.el_append_child wrap
                (pane_section (I.t "ui/frequently-used") used));
           D.el_append_child wrap
             (pane_section ~virtual_list:true
                (I.tf "icon/emojis-count" [ string_of_int (emoji_count ()) ])
                (List.map (fun (id,n) -> item_btn p (Emoji_item (id,n)))
                   (all_emojis ())))
       | Tab_icon ->
           D.el_append_child wrap
             (pane_section ~virtual_list:true
                (I.tf "icon/icons-count"
                   [ string_of_int (List.length (icon_names ())) ])
                (List.map (fun n -> item_btn p (Tabler_item n))
                   (icon_names ()))));
      D.el_append_child pane wrap
  | None, _ -> ()

let render_search (p : picker) =
  clear_pane p;
  match p.pane with
  | Some pane ->
      p.gen <- p.gen + 1;
      let gen = p.gen in
      let wrap =
        D.mk ~cls:"flex flex-1 flex-col gap-1 search-result" "div"
      in
      D.el_append_child pane wrap;
      let icons =
        if p.tab = Tab_emoji then []
        else List.map (fun n -> Tabler_item n) (search_icons p.q)
      in
      let fill emojis =
        if gen = p.gen then (
          D.el_clear wrap;
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
       let nl = D.el_query_all root ".tab-item" in
       let n = D.node_list_length nl in
       for i = 0 to n - 1 do
         match D.node_list_item nl i with
         | Some b -> D.el_set_class b "tab-item"
         | None -> ()
       done;
       match
         D.node_list_item nl
           (match t with Tab_all -> 0 | Tab_emoji -> 1 | Tab_icon -> 2)
       with
       | Some b -> D.el_set_class b "tab-item active"
       | None -> ())
   | None -> ());
  (match p.input with
   | Some i -> D.el_set_attr i "placeholder" (placeholder_of t)
   | None -> ());
  reset_q p

(* ---------- color preset popover ---------- *)

let preset_colors =
  [ Some "#6e7b8b"; Some "#5e69d2"; Some "#00b5ed"; Some "#00b55b"
  ; Some "#f2be00"; Some "#e47a00"; Some "#f38e81"; Some "#fb434c"; None ]

let presets_popover (p : picker) (anchor_btn : E.el) : E.el =
  let pop = D.mk ~cls:"color-picker-presets p-2" "div" in
  List.iter
    (fun c ->
      let style, child =
        match c with
        | Some c -> ("background-color:" ^ c, None)
        | None -> ("", Some (icon_el ("tabler-icon", "minus")))
      in
      let b =
        D.mk ~cls:"it" ~attrs:[ ("style", style); ("type", "button") ]
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
  let l, _t, _r, btm, _w = D.el_rect anchor_btn in
  D.set_style pop
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:10000" l
       (btm +. 4.));
  pop

(* ---------- view ---------- *)

let view (p : picker) : E.el =
  let root = D.mk ~cls:"cp__emoji-icon-picker" "div" in
  D.el_set_attr root "data-keep-selection" "true";
  D.el_listen root "keydown"
    (fun ev ->
      match D.ev_key ev with
      | "ArrowLeft" | "ArrowRight" -> D.stop_propagation ev
      | _ -> ())
    true;
  let hd = D.mk ~cls:"hd bg-popover" "div" in
  let si = D.mk ~cls:"search-input" "div" in
  D.el_append_child si (icon_el ("tabler-icon", "search"));
  let input =
    D.mk
      ~cls:"ui__input"
      ~attrs:
        [ ("placeholder", placeholder_of p.tab); ("type", "text")
        ; ("auto-focus", "true") ]
      "input"
  in
  D.el_append_child si input;
  let rebuild_x () =
    (match p.x_btn with Some x -> D.el_remove x | None -> ());
    p.x_btn <- None;
    if p.q <> "" then (
      let x = D.mk ~cls:"x" "a" in
      D.el_append_child x (icon_el ("tabler-icon", "x"));
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
          D.prevent_default ev;
          if p.q = "" then close () else reset_q p
      | _ -> ())
    true;
  D.el_append_child hd si;
  D.el_append_child root hd;
  let bd = D.mk ~cls:("bd bd-scroll " ^ tab_name p.tab) "div" in
  let pane = D.mk ~cls:"content-pane" "div" in
  D.el_append_child bd pane;
  D.el_append_child root bd;
  let ft = D.mk ~cls:"ft" "div" in
  let tabs_row = D.mk ~cls:"flex flex-1 flex-row items-center gap-2" "div" in
  List.iter
    (fun (t, label) ->
      let b =
        D.mk
          ~cls:("tab-item" ^ if t = p.tab then " active" else "")
          ~attrs:[ ("type", "button") ]
          "button"
      in
      D.el_append_child b (D.create_text_node label);
      D.on_click b (fun _ -> set_tab p t);
      D.el_append_child tabs_row b)
    [ (Tab_all, I.t "icon/tab-all"); (Tab_emoji, I.t "icon/tab-emojis")
    ; (Tab_icon, I.t "icon/tab-icons") ];
  D.el_append_child ft tabs_row;
  (* color preset button — hidden on the emoji tab like cljs *)
  let pal =
    D.mk ~cls:"color-picker ui__button"
      ~attrs:[ ("type", "button"); ("title", "Color") ] "button"
  in
  let pal_strong = D.mk ~cls:"flex items-center gap-1" "strong" in
  (match preset_color () with
   | Some c -> D.el_set_attr pal_strong "style" ("color:" ^ c)
   | None -> ());
  D.el_append_child pal_strong (icon_el ("tabler-icon", "palette"));
  D.el_append_child pal pal_strong;
  let pop_ref : E.el option ref = ref None in
  D.on_click pal (fun _ ->
      match !pop_ref with
      | Some pop -> D.el_remove pop; pop_ref := None
      | None ->
          let pop = presets_popover p pal in
          pop_ref := Some pop;
          (match D.doc_query "body" with
           | Some body -> D.el_append_child body pop
           | None -> ()));
  D.el_append_child ft pal;
  (if p.del then (
     let d =
       D.mk ~cls:"ui__button"
         ~attrs:
           [ ("data-action", "del"); ("type", "button")
           ; ("title", I.t "ui/delete") ]
         "button"
     in
     D.el_append_child d (icon_el ("tabler-icon", "trash"));
     D.on_click d (fun _ -> choose p Remove);
     D.el_append_child ft d));
  D.el_append_child root ft;
  p.input <- Some input;
  p.bd <- Some bd;
  p.pane <- Some pane;
  p.root <- Some root;
  render_tab p;
  root

let open_picker ~(anchor : E.el) ~(del : bool)
    ~(on_chosen : choice -> unit) : unit =
  Emoji_mart.install ();
  let p =
    { del; on_chosen; q = ""; tab = Tab_all; gen = 0; input = None
    ; x_btn = None; bd = None; pane = None; root = None }
  in
  let root = view p in
  ignore
    (Properties_popup.open_anchored
       ~cls:
         "ls-icon-picker rounded-md border bg-popover           text-popover-foreground shadow-md" anchor root);
  match p.input with
  | Some i -> D.el_focus i
  | None -> ()

