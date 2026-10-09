(* Icons — mirrors shui icon v2 (`logseq.shui.icon.v2/root`).

   Icon names resolve through the component `icon` kind's `~name`:
   names in the LUI builtin set emit `~name:`x` directly; every other
   (kebab-cased) name goes through the `app:` icon registry
   (`app_icons ()` below feeds the web renderer's map, built from the
   tabler-children table plus the extension pack). Names found nowhere
   render the host's missing-glyph fallback — the old `ti ti-*`/`tie
   tie-*` font-glyph fallback is gone (font glyphs can't ride the icon
   kind; they'd double-render under its svg mask).

   Platform-owned: the extension pack (the web's `window.tablerIcons`
   react-element bundle — absent on native hosts) is enumerated by the
   runtime's adapter and passed to [app_icons] as `~ext`; the one
   alias the native registry needs (its bundle lacks the extension
   pack's "new-page" glyph) is declared via [set_app_aliases] at
   bootstrap. *)

(* builtin name -> `name (the 45-name builtin set of Lui_elements.icon) *)
let builtin_of_name (name : string) : Lui_elements.icon option =
  match name with
  | "alert" -> Some `alert
  | "archive" -> Some `archive
  | "arrow-down" -> Some `arrow_down
  | "arrow-right" -> Some `arrow_right
  | "arrow-up" -> Some `arrow_up
  | "check" -> Some `check
  | "check-circle" -> Some `check_circle
  | "chevron-down" -> Some `chevron_down
  | "chevron-left" -> Some `chevron_left
  | "chevron-right" -> Some `chevron_right
  | "chevron-up" -> Some `chevron_up
  | "circle-dot" -> Some `circle_dot
  | "clock" -> Some `clock
  | "copy" -> Some `copy
  | "download" -> Some `download
  | "edit" -> Some `edit
  | "ellipsis" -> Some `ellipsis
  | "external-link" -> Some `external_link
  | "eye" -> Some `eye
  | "file-text" -> Some `file_text
  | "folder" -> Some `folder
  | "folder-open" -> Some `folder_open
  | "git-branch" -> Some `git_branch
  | "git-merge" -> Some `git_merge
  | "git-pull-request" -> Some `git_pull_request
  | "info" -> Some `info
  | "menu" -> Some `menu
  | "mic" -> Some `mic
  | "moon" -> Some `moon
  | "music" -> Some `music
  | "panel-left" -> Some `panel_left
  | "panel-right" -> Some `panel_right
  | "pause" -> Some `pause
  | "play" -> Some `play
  | "plus" -> Some `plus
  | "refresh-cw" -> Some `refresh_cw
  | "repeat" -> Some `repeat
  | "save" -> Some `save
  | "search" -> Some `search
  | "send" -> Some `send
  | "settings" -> Some `settings
  | "shuffle" -> Some `shuffle
  | "skip-back" -> Some `skip_back
  | "skip-forward" -> Some `skip_forward
  | "sun" -> Some `sun
  | "terminal" -> Some `terminal
  | "trash" -> Some `trash
  | "volume" -> Some `volume
  | "wrench" -> Some `wrench
  | "x" -> Some `x
  | "x-circle" -> Some `x_circle
  | _ -> None
;;

let kebab name =
  (* csk/->kebab-case: separators and lower->upper boundaries become '-';
     collapsing repeats, no leading dash *)
  let b = Buffer.create (String.length name + 4) in
  let prev_dash = ref true in
  String.iter
    (fun c ->
      if c = ' ' || c = '_' || c = '-' then (
        if not !prev_dash then Buffer.add_char b '-';
        prev_dash := true)
      else (
        (if c >= 'A' && c <= 'Z' then (
           if not !prev_dash then Buffer.add_char b '-';
           Buffer.add_char b (Char.lowercase_ascii c))
         else Buffer.add_char b c);
        prev_dash := false))
    name;
  Buffer.contents b
;;

(* tabler-extension (tie) names resolve through the extension pack on
   the web; a host whose icon registry lacks those entries declares an
   alias to the closest bundled tabler equivalent *)
let app_aliases : (string * string) list ref = ref []

let set_app_aliases aliases = app_aliases := aliases

(* resolve a cljs icon name (camelCase or spaced ok) to an icon value:
   builtin names emit the builtin, everything else the app: registry *)
let name_ref name : Lui_elements.icon =
  let n = kebab name in
  match builtin_of_name n with
  | Some b -> b
  | None -> (
      match List.assoc_opt n !app_aliases with
      | Some a -> `app a
      | None -> `app n)
;;

(* extension-pack icon names — the imperative icon path in web_dom.ml
   still falls back to `tie tie-*` font classes for these *)
let tie_names =
  [ "add-link"; "app-feature"; "block"; "block-search"; "cloud-exclamation"
  ; "connector"; "group"; "h-auto"; "heading-off"; "internal-link"
  ; "link-to-block"; "link-to-page"; "link-to-whiteboard"
  ; "move-to-sidebar-right"; "new-block"; "new-page"; "new-whiteboard"
  ; "new-whiteboard-element"; "object-compact"; "object-expanded"
  ; "open-as-page"; "page"; "page-search"; "references-hide"
  ; "references-show"; "select-cursor"; "text"; "ungroup"; "whiteboard"
  ; "whiteboard-element"; "whiteboard-search" ]
;;

(* @tabler/icons-react svg attrs (size -> width/height) *)
let tabler_svg_attrs ~size ~filled name cls : (string * string) list =
  let base =
    if filled then
      [ ("fill", "currentColor"); ("stroke", "none") ]
    else
      [ ("fill", "none")
      ; ("stroke", "currentColor")
      ; ("stroke-width", "2")
      ; ("stroke-linecap", "round")
      ; ("stroke-linejoin", "round") ]
  in
  [ ("xmlns", "http://www.w3.org/2000/svg")
  ; ("width", Printf.sprintf "%g" size)
  ; ("height", Printf.sprintf "%g" size)
  ; ("viewBox", "0 0 24 24") ]
  @ base
  @ [ ( "class"
      , "tabler-icon tabler-icon-" ^ name
        ^ (if cls = "" then "" else " " ^ cls) ) ]

let is_filled name = String.ends_with ~suffix:"-filled" name

let svg_of_children ~size name kids =
  let attrs =
    List.map
      (fun (k, v) -> Printf.sprintf " %s=\"%s\"" k v)
      (tabler_svg_attrs ~size ~filled:(is_filled name) name "")
  in
  let child_markup =
    List.map
      (fun (tag, attrs) ->
        Printf.sprintf "<%s%s></%s>" tag
          (String.concat ""
             (List.map (fun (k, v) -> Printf.sprintf " %s=\"%s\"" k v) attrs))
          tag)
      kids
  in
  Printf.sprintf "<svg%s>%s</svg>" (String.concat "" attrs)
    (String.concat "" child_markup)
;;

(* encodeURIComponent — the data URIs in app_icons are consumed by the
   icon kind verbatim on both targets, so the escaping must match the
   JS builtin byte for byte: unreserved set is
   A-Z a-z 0-9 - _ . ! ~ * ' ( ), everything else percent-encodes its
   UTF-8 bytes with uppercase hex. *)
let encode_uri_component s =
  let unreserved c =
    match c with
    | 'A' .. 'Z' | 'a' .. 'z' | '0' .. '9'
    | '-' | '_' | '.' | '!' | '~' | '*' | '\'' | '(' | ')' -> true
    | _ -> false
  in
  let hexdig = "0123456789ABCDEF" in
  let b = Buffer.create (String.length s + 16) in
  String.iter
    (fun c ->
      if unreserved c then Buffer.add_char b c
      else begin
        let v = Char.code c in
        Buffer.add_char b '%';
        Buffer.add_char b hexdig.[v lsr 4];
        Buffer.add_char b hexdig.[v land 0xF]
      end)
    s;
  Buffer.contents b
;;

let data_uri_of_svg svg =
  "data:image/svg+xml," ^ encode_uri_component svg
;;

(* custom svgs with no tabler counterpart — registered so `app:`
   icon names resolve (consumed by e.g. Ui_parts.rotating_arrow) *)
let custom_icons : (string * string) list =
  [ ( "rotating-arrow"
    , "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" \
       fill=\"currentColor\"><path fill-rule=\"evenodd\" \
       d=\"M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 \
       128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 \
       0 402.48 0 384.662z\"/></svg>" )
  ; (* tabler "puzzle" — cljs .property-m icon on property key rows *)
    ( "puzzle"
    , "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" \
       fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" \
       stroke-linecap=\"round\" stroke-linejoin=\"round\"><path \
       d=\"M4 7h3a1 1 0 0 0 -1 -1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 \
       1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0 \
       -1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-1a2 2 0 0 0 -4 0v1a1 \
       1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h1a2 2 0 0 0 \
       0 -4h-1a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1\"/></svg>" )
  ; (* cljs video.cljs clock icon, rendered inside a.youtube-timestamp *)
    ( "youtube-timestamp-icon"
    , "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" \
       viewBox=\"0 0 20 20\"><path clip-rule=\"evenodd\" \
       fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 \
       1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 \
       101.415-1.415L11 9.586V6z\"/></svg>" )
  ; (* cljs components/svg.cljs logo — three ellipses, rendered on the
       importer action-input rows *)
    ( "logseq-logo"
    , "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" \
       viewBox=\"0 0 21 21\" height=\"28\" width=\"28\"><ellipse \
       transform=\"matrix(0.987073 0.160274 -0.239143 0.970984 11.7346 \
       2.59206)\" rx=\"3.29236\" ry=\"2.04373\"/><ellipse \
       transform=\"matrix(-0.495846 0.868411 -0.825718 -0.564084 3.97209 \
       5.54515)\" rx=\"2.95326\" ry=\"3.37606\"/><ellipse \
       transform=\"matrix(0.987073 0.160274 -0.239143 0.970984 13.0843 \
       14.72)\" rx=\"7.78547\" ry=\"6.13006\"/></svg>" ) ]
;;

(* Task glyphs are shared with native hosts; cutouts stay transparent when
   the web renderer uses the SVG as an alpha mask. *)
let status_icons =
  let svg body =
    {|<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">|}
    ^ body ^ "</svg>"
  in
  let ring = {|<circle cx="10" cy="10" r="8" stroke-width="2"/>|} in
  let filled_cutout path =
    svg ({|<defs><mask id="cutout"><circle cx="10" cy="10" r="9" fill="white" stroke="none"/><path d="|}
         ^ path ^ {|" stroke="black" stroke-width="1.333"/></mask></defs><circle cx="10" cy="10" r="9" fill="currentColor" stroke="none" mask="url(#cutout)"/>|})
  in
  [ "todo", svg ring
  ; "backlog", svg {|<circle cx="10" cy="10" r="8" stroke-width="2" stroke-dasharray="4 4"/>|}
  ; "cancelled", svg (ring ^ {|<path d="M13 7L7 13M7 7L13 13" stroke-width="1.333"/>|})
  ; "in-progress25", svg (ring ^ {|<path d="M10 5A5 5 0 0 1 15 10H10Z" fill="currentColor" stroke="none"/>|})
  ; "in-progress50", svg (ring ^ {|<path d="M10 5A5 5 0 0 1 10 15Z" fill="currentColor" stroke="none"/>|})
  ; "in-progress75", svg (ring ^ {|<path d="M10 5A5 5 0 1 1 5 10H10Z" fill="currentColor" stroke="none"/>|})
  ; "done", filled_cutout "M6.5 10L9 12.5L14 7.5"
  ; "in-review", filled_cutout "M14 9.5V11C14 11.3978 13.842 11.7794 13.5607 12.0607C13.2794 12.342 12.8978 12.5 12.5 12.5H8L6 14.5V8C6 7.60218 6.15804 7.22064 6.43934 6.93934C6.72064 6.65804 7.10218 6.5 7.5 6.5H11M12.5 6H14.5M14.5 6V8M14.5 6L12 8.5"
  ]
;;

let priority_icons =
  let svg body =
    {|<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">|}
    ^ body ^ "</svg>"
  in
  let bars level =
    List.mapi (fun i (x, y, height) ->
        Printf.sprintf {|<rect x="%d" y="%d" width="4" height="%d" rx="1" opacity="%s"/>|}
          x y height (if i < level then "1" else "0.3"))
      [ 4, 12, 8; 10, 8, 12; 16, 4, 16 ]
    |> String.concat "" |> svg
  in
  [ "priority-lvl-low", bars 1
  ; "priority-lvl-medium", bars 2
  ; "priority-lvl-high", bars 3
  ; "priority-lvl-none", svg {|<path d="M5 12H7M19 12H17M11 12H13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>|}
  ; "priority-lvl-urgent", svg {|<path fill-rule="evenodd" clip-rule="evenodd" d="M6 3C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6ZM13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8V12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12V8ZM13 15.99C13 15.4377 12.5523 14.99 12 14.99C11.4477 14.99 11 15.4377 11 15.99V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V15.99Z"/>|}
  ]
;;

(* `app:` icon registry — name -> data URI of the svg markup. The base
   is the tabler-children table; `~ext` merges the runtime's extension
   pack (the web's window.tablerIcons walked by js_app/icons_ext.ml);
   custom app icons come last. Later entries win on a clash, mirroring
   the web lookup order (ext pack over the table, custom over both). *)
let app_icons ?(ext = []) () : string Lui_protocol.String_map.t =
  let base =
    Icon_tabler_data.tabler_names ()
    |> List.filter_map (fun name ->
           match Icon_tabler_data.tabler_children name with
           | [] -> None
           | kids ->
               Some (name, data_uri_of_svg (svg_of_children ~size:24. name kids)))
  in
  let custom =
    List.map (fun (k, svg) -> (k, data_uri_of_svg svg)) (custom_icons @ status_icons @ priority_icons)
  in
  List.fold_left
    (fun m (k, v) -> Lui_protocol.String_map.add k v m)
    Lui_protocol.String_map.empty (base @ ext @ custom)
;;

let status_color name =
  match kebab name with
  | "backlog" -> Some "#c7c7c7"
  | "todo" -> Some "#858585"
  | "in-progress25" | "in-progress50" | "in-progress75" -> Some "#ebbc00"
  | "in-review" -> Some "#0091ff"
  | "done" -> Some "#5bb98c"
  | "cancelled" -> Some "#eb9091"
  | _ -> None
;;

(* equivalent of (shui/tabler-icon name) *)
let icon ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  let cls = if cls = "" then "" else " " ^ cls in
  let n = kebab name in
  Lui_elements.icon ~name:(name_ref name) ~point_size:(int_of_float size)
    ?foreground:(status_color name) ~style_class:("ui__icon ls-icon-" ^ n ^ cls) []
;;

(* raw icon without the ui__icon span wrapper — cljs renders the
   svg directly where the call site already provides positioning (e.g.
   submenu chevrons) *)
let raw ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  Lui_elements.icon ~name:(name_ref name) ~point_size:(int_of_float size)
    ~style_class:cls []
;;

(* bare glyph without the ui__icon wrapper (existing call sites) — now
   resolves through the icon registry like [raw] *)
let font name = raw name
