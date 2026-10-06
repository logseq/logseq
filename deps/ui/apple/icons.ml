(* ported from deps/ui/src/core/icons.ml *)
(* Icons — mirrors shui icon v2 (`logseq.shui.icon.v2/root`).

   Component migration: every entry point now resolves through the LUI
   `icon` kind's `app:` name channel instead of hand-building
   logseq-svg trees. The custom `window.tablerIcons` extension pack is
   a JS bundle — absent on native hosts — so native names resolve
   against the shared tabler registry (GPUI ships the same
   tabler-children.json; SwiftUI the same tabler resources). `tie`
   (tabler-extension) names have no registry entry on native either —
   they rendered as empty font-glyph spans before, they resolve to
   nothing now. *)

(* shui v2 tabler-extension-icon-names *)
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

(* custom svgs with no tabler counterpart — registered so `app:`
   icon names resolve (consumed by e.g. Ui_parts.rotating_arrow). The
   native backends mirror these via their own registries (gpui
   logseq_ext custom_svg; apple LogseqAppIcons SF-symbol sources). *)
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

let encode_uri_component s = Uri.pct_encode ~component:`Query_value s

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

(* `app:` icon registry — name -> data URI of the svg markup. Mirrors
   the web app_icons () minus the `window.tablerIcons` extension pack
   (a JS bundle; absent on native hosts). *)
let app_icons () : string Lui_protocol.String_map.t =
  let base =
    Icon_tabler_data.tabler_names ()
    |> List.filter_map (fun name ->
           match Icon_tabler_data.tabler_children name with
           | [] -> None
           | kids ->
               Some (name, data_uri_of_svg (svg_of_children ~size:24. name kids)))
  in
  let custom =
    List.map (fun (k, svg) -> (k, data_uri_of_svg svg)) custom_icons
  in
  (* later entries win on a clash: custom app icons over the tabler table *)
  List.fold_left
    (fun m (k, v) -> Lui_protocol.String_map.add k v m)
    Lui_protocol.String_map.empty (base @ custom)
;;

(* equivalent of (shui/tabler-icon name) — the `ui__icon` +
   `ls-icon-<name>` classes stay for web-parity marking; the old `ti`
   font class is dropped (the icon kind renders its own svg) *)
let icon ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  let cls = if cls = "" then "" else " " ^ cls in
  Lui_elements.icon
    ~name:(name_ref name)
    ~point_size:(int_of_float size)
    ~style_class:("ui__icon ls-icon-" ^ name ^ cls)
    []
;;

(* raw icon without the ui__icon wrapper class — cljs renders the
   svg directly where the call site already provides positioning
   (e.g. submenu chevrons) *)
let raw ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  Lui_elements.icon
    ~name:(name_ref name)
    ~point_size:(int_of_float size)
    ~style_class:cls
    []
;;

(* bare font glyph without the ui__icon wrapper (existing call sites) — now
   resolves through the icon registry like [raw] *)
let font name = raw name
