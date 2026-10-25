(* Resolve the shared CSS palette and application tokens for native paint.
   Custom properties compute before inheritance, as on Web:
   https://www.w3.org/TR/css-variables-1/#cycles *)

module J = Yojson.Safe

let light_vars : (string, string) Hashtbl.t = Hashtbl.create 256
let dark_vars : (string, string) Hashtbl.t = Hashtbl.create 256
let light_overrides : (string, string) Hashtbl.t = Hashtbl.create 256
let dark_overrides : (string, string) Hashtbl.t = Hashtbl.create 256
let mode : Lui_theme.mode ref = ref Lui_theme.Light
let accent = ref "logseq"
let generation = ref 0

let vars_of_mode = function
  | Lui_theme.Dark -> dark_vars
  | Lui_theme.Light -> light_vars

let overrides_of_mode = function
  | Lui_theme.Dark -> dark_overrides
  | Lui_theme.Light -> light_overrides

include Ui_theme_vars

let rebuild mode =
  let palette =
    Ui_theme.css_palette
      (match mode with
      | Lui_theme.Light -> Ui_theme.Light
      | Dark -> Ui_theme.Dark)
      ~accent:!accent
  in
  let overrides = Hashtbl.fold (fun name value values -> (name, value) :: values)
    (overrides_of_mode mode) [] in
  let application = resolve_layers ~root:palette.root ~body:palette.body
    ~application:palette.application ~overrides in
  let table = vars_of_mode mode in
  Hashtbl.reset table;
  Hashtbl.iter (Hashtbl.replace table) application

let set_dark is_dark =
  let next = if is_dark then Lui_theme.Dark else Lui_theme.Light in
  if next <> !mode then incr generation;
  mode := next

let set_accent value =
  if not (List.mem value Ui_theme_css.accents) then
    invalid_arg ("Unknown theme accent: " ^ value);
  if value <> !accent then begin
    accent := value;
    rebuild Lui_theme.Light;
    rebuild Lui_theme.Dark;
    incr generation
  end

let set_var name value =
  if Hashtbl.find_opt (overrides_of_mode !mode) name <> Some value then begin
    Hashtbl.replace (overrides_of_mode !mode) name value;
    rebuild !mode;
    incr generation
  end

let install_snapshot payload =
  let open J.Util in
  let snapshot = J.from_string payload in
  let mode =
    match Ui_theme.mode_of_string (snapshot |> member "mode" |> to_string) with
    | Ui_theme.Light -> Lui_theme.Light
    | Ui_theme.Dark -> Lui_theme.Dark
  in
  let overrides = overrides_of_mode mode in
  Hashtbl.reset overrides;
  snapshot |> member "vars" |> to_assoc
  |> List.iter (fun (name, value) ->
      Hashtbl.replace overrides name (to_string value));
  rebuild mode;
  incr generation

let current_value name = Hashtbl.find_opt (vars_of_mode !mode) name
let resolve_value value = substitute current_value value

let color_of s =
  let spec =
    if s = "scrim" then "hsl(var(--background) / 0.9)"
    else
      match Ui_theme.semantic_color_var s with Some value -> value | None -> s
  in
  Option.bind (resolve_value spec) (fun value ->
      match Lui_window.Theme.color_of_hex value with
      | Some _ as color -> color
      | None -> (
          match Lui_theme.color_of !mode value with
          | Some _ as color -> color
          | None -> Lui_window.Theme.color_of value))

let count_of_mode m = Hashtbl.length (vars_of_mode m)
