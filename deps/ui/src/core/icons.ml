(* Icons — mirrors shui icon v2 (`logseq.shui.icon.v2/root`).

   Icon names resolve through the component `icon` kind's `~name`:
   names in the LUI builtin set emit `~name:`x` directly; every other
   (kebab-cased) name goes through the `app:` icon registry
   (`app_icons ()` below feeds the web renderer's map, built from the
   tabler-children table plus the `window.tablerIcons` extension pack).
   Names found nowhere render the host's missing-glyph fallback —
   the old `ti ti-*`/`tie tie-*` font-glyph fallback is gone (font
   glyphs can't ride the icon kind; they'd double-render under its
   svg mask). *)

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

(* resolve a cljs icon name (camelCase or spaced ok) to an icon value:
   builtin names emit the builtin, everything else the app: registry *)
let name_ref name : Lui_elements.icon =
  let n = kebab name in
  match builtin_of_name n with
  | Some b -> b
  | None -> `app n
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

external tabler_icons_u : (Js.Json.t -> Js.Json.t) Js.Dict.t Js.Undefined.t
  = "tablerIcons"
  [@@mel.scope "window"]

let tabler_icons () =
  Js.Undefined.toOption tabler_icons_u
;;

let string_of_prop v =
  match Js.Json.decodeString v with
  | Some s -> Some s
  | None -> (
      match Js.Json.decodeNumber v with
      | Some n -> Some (Printf.sprintf "%g" n)
      | None -> None)
;;

let attr_of (k, v) =
  if k = "children" || k = "key" || k = "ref" then None
  else
    (* SVG attrs are case-sensitive: viewBox stays verbatim *)
    let name =
      match k with
      | "className" -> "class"
      | "viewBox" -> "viewBox"
      | _ -> kebab k
    in
    Option.map (fun s -> (name, s)) (string_of_prop v)
;;

let icon_props size =
  let d = Js.Dict.empty () in
  Js.Dict.set d "size" (Js.Json.number size);
  Js.Json.object_ d
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
  @ base @ [ ("class", "tabler-icon tabler-icon-" ^ name ^ cls) ]

let is_filled name = String.ends_with ~suffix:"-filled" name

(* `app:` icon registry for the web `icon` kind — name -> data URI of the
   svg markup. Merges the tabler-children table with the custom
   `window.tablerIcons` extension pack, mirroring `icon`'s lookup order
   (ext pack wins on a name clash). *)
external encode_uri_component : string -> string = "encodeURIComponent"
[@@mel.scope "window"]

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

let data_uri_of_svg svg =
  "data:image/svg+xml," ^ encode_uri_component svg
;;

(* Serialize a `window.tablerIcons` react-element tree back to svg
   markup — same walk as `els_of_react` but producing a string. *)
let rec markup_of_react (v : Js.Json.t) : string =
  match Js.Json.decodeObject v with
  | Some obj -> element_markup obj
  | None -> (
      match Js.Json.decodeArray v with
      | Some arr -> String.concat "" (List.map markup_of_react (Array.to_list arr))
      | None -> (
          match Js.Json.decodeString v with
          | Some s -> s
          | None -> ""))

and element_markup obj : string =
  let tag =
    match Option.bind (Js.Dict.get obj "type") Js.Json.decodeString with
    | Some t -> t
    | None -> ""
  in
  let props =
    match Option.bind (Js.Dict.get obj "props") Js.Json.decodeObject with
    | Some p -> p
    | None -> Js.Dict.empty ()
  in
  let attrs =
    List.filter_map attr_of (Array.to_list (Js.Dict.entries props))
    |> List.map (fun (k, v) -> Printf.sprintf " %s=\"%s\"" k v)
    |> String.concat ""
  in
  let children =
    match Js.Dict.get props "children" with
    | Some c -> markup_of_react c
    | None -> ""
  in
  if tag = "" then children
  else Printf.sprintf "<%s%s>%s</%s>" tag attrs children tag
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

let app_icons () : string Lui_protocol.String_map.t =
  let base =
    Icon_tabler_data.tabler_names ()
    |> List.filter_map (fun name ->
           match Icon_tabler_data.tabler_children name with
           | [] -> None
           | kids ->
               Some (name, data_uri_of_svg (svg_of_children ~size:24. name kids)))
  in
  let ext =
    match tabler_icons () with
    | None -> []
    | Some dict ->
        Array.to_list (Js.Dict.keys dict)
        |> List.filter_map (fun key ->
               if String.starts_with ~prefix:"Icon" key then
                 match Js.Dict.get dict key with
                 | Some f ->
                     let name = kebab (String.sub key 4 (String.length key - 4)) in
                     Some (name, data_uri_of_svg (markup_of_react (f (icon_props 24.))))
                 | None -> None
               else None)
  in
  let custom =
    List.map (fun (k, svg) -> (k, data_uri_of_svg svg)) custom_icons
  in
  (* later entries win on a clash: ext pack over the tabler table,
     custom app icons over both *)
  List.fold_left
    (fun m (k, v) -> Lui_protocol.String_map.add k v m)
    Lui_protocol.String_map.empty (base @ ext @ custom)
;;

(* equivalent of (shui/tabler-icon name) *)
let icon ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  let cls = if cls = "" then "" else " " ^ cls in
  let n = kebab name in
  Lui_elements.icon ~name:(name_ref name) ~point_size:(int_of_float size)
    ~style_class:("ui__icon ls-icon-" ^ n ^ cls) []
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
