(* Classic installed-themes picker — cljs plugins.cljs installed-themes
   opened by :ui/select-theme-color via show-themes-modal! true /
   open-select-theme!. Lists the default theme plus installed plugin
   themes for the current mode. *)

open Lui_elements

let t = I18n.t
let tf = I18n.tf

(* Host wires select + the installed/selected snapshot at open time. *)
let on_select : (Wire.t -> unit) ref = ref (fun _ -> ())
let selected_url : string option ref = ref None
let installed_themes : Wire.t list ref = ref []

let mode_of_ui () =
  match Ui_services.theme_mode () with
  | "system" -> if Ui_services.theme_prefers_dark () then "dark" else "light"
  | mode -> mode

let theme_name theme =
  Option.value (Wire.map_get_string theme "name") ~default:""

let theme_mode theme = Wire.map_get_string theme "mode"

let theme_url theme = Wire.map_get_string theme "url"

let theme_pid theme = Wire.map_get_string theme "pid"

let choose theme =
  !on_select theme;
  Dialogs_state.close_named "themes-select"

let row ~key ~selected ~label ~prefix ~on_press : t =
  let cls =
    "it flex px-3 py-1.5 rounded-sm justify-between"
    ^ if selected then " is-selected is-active" else ""
  in
  Ui_parts.pressable ~on_press:(fun _ -> on_press ())
    (row ~key ~style_class:cls ~main:`space_between ~cross:`center
       ~padding_horizontal:12 ~padding_vertical:6 ~height:36
       [ row ~key:(key ^ "-lab") ~gap:4 ~cross:`center ~grow:1.
           [ text ~key:(key ^ "-pre") ~font_size:"0.75rem"
               ~style_class:"opacity-60" ~value:(prefix ^ " •") []
           ; text ~key:(key ^ "-name") ~font_size:"0.75rem" ~value:label [] ]
       ; (if selected then
            icon ~key:(key ^ "-chk") ~name:(Icons.name_ref "check")
              ~point_size:14 ~style_class:"ui__icon opacity-60" []
          else box ~key:(key ^ "-sp") []) ])

let body (_ms : Model.t Signal.signal) : t =
  let mode = mode_of_ui () in
  let mode_title =
    t
      (if mode = "dark" then "settings.general/theme-dark"
       else "settings.general/theme-light")
  in
  let selected = !selected_url in
  let matching =
    List.filter
      (fun theme ->
        match theme_mode theme with
        | Some m -> m = mode
        | None -> true)
      !installed_themes
  in
  let default_label =
    let named = tf "plugin.themes/default-name" [ String.capitalize_ascii mode_title ] in
    if named = "" || named = "plugin.themes/default-name" then
      t "theme/logseq-default" ^ " — " ^ mode
    else named
  in
  let default_theme =
    Wire.Map
      [ Wire.kw "name", Wire.String default_label
      ; Wire.kw "url", Wire.Nil
      ; Wire.kw "mode", Wire.String mode
      ; Wire.kw "pid", Wire.String "logseq" ]
  in
  let default =
    row ~key:"th-default" ~selected:(selected = None) ~label:default_label
      ~prefix:"Logseq"
      ~on_press:(fun () -> choose default_theme)
  in
  let rows =
    List.mapi
      (fun idx theme ->
        let name = theme_name theme in
        let url = theme_url theme in
        let pid = Option.value (theme_pid theme) ~default:"Logseq" in
        let is_sel =
          match selected, url with
          | Some s, Some u -> s = u
          | _ -> false
        in
        row ~key:("th-" ^ string_of_int idx) ~selected:is_sel ~label:name
          ~prefix:pid
          ~on_press:(fun () -> choose theme))
      matching
  in
  column ~key:"themes-select" ~style_class:"cp__themes-installed"
    ~gap:8 ~padding:16 ~cross:`stretch
    [ heading ~key:"th-title" ~level:`h1 ~font_size:"1.5rem"
        ~font_weight:600 ~value:(t "nav/themes")
        ~style_class:"mb-4 text-2xl p-1" []
    ; column ~key:"th-list" ~gap:2 ~cross:`stretch (default :: rows) ]

let open_ ~select ~selected ~themes () =
  on_select := select;
  selected_url := selected;
  installed_themes := themes;
  Dialogs_state.open_ "themes-select"
