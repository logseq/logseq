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

let var_ref s =
  let len = String.length s in
  if len <= 5 || String.sub s 0 4 <> "var(" || s.[len - 1] <> ')' then None
  else
    let inner = String.sub s 4 (len - 5) in
    let depth = ref 0 and cut = ref None in
    String.iteri
      (fun i c ->
        if c = '(' then incr depth
        else if c = ')' then decr depth
        else if c = ',' && !depth = 0 && !cut = None then cut := Some i)
      inner;
    let name, fallback =
      match !cut with
      | None -> (String.trim inner, None)
      | Some i ->
          ( String.trim (String.sub inner 0 i),
            Some
              (String.trim
                 (String.sub inner (i + 1) (String.length inner - i - 1))) )
    in
    if String.length name > 2 && String.starts_with ~prefix:"--" name then
      Some (name, fallback)
    else None

let scan_var s cursor =
  let len = String.length s in
  let rec find i =
    if i + 4 > len then Ok None
    else if
      s.[i] <> 'v' || s.[i + 1] <> 'a' || s.[i + 2] <> 'r' || s.[i + 3] <> '('
    then find (i + 1)
    else
      let rec closing j depth =
        if j = len then Error ()
        else
          match s.[j] with
          | '(' -> closing (j + 1) (depth + 1)
          | ')' when depth = 1 -> (
              match var_ref (String.sub s i (j - i + 1)) with
              | None -> Error ()
              | Some (name, fallback) -> Ok (Some (i, j + 1, name, fallback)))
          | ')' -> closing (j + 1) (depth - 1)
          | _ -> closing (j + 1) depth
      in
      closing (i + 4) 1
  in
  find cursor

let rec substitute lookup s =
  match scan_var s 0 with
  | Error () -> None
  | Ok None -> Some s
  | first ->
      let output = Buffer.create (String.length s) in
      let rec expand cursor = function
        | Error () -> None
        | Ok None ->
            Buffer.add_substring output s cursor (String.length s - cursor);
            Some (Buffer.contents output)
        | Ok (Some (start, stop, name, fallback)) -> (
            let value =
              match lookup name with
              | Some _ as value -> value
              | None -> Option.bind fallback (substitute lookup)
            in
            match value with
            | None -> None
            | Some value ->
                Buffer.add_substring output s cursor (start - cursor);
                Buffer.add_string output value;
                expand stop (scan_var s stop))
      in
      expand 0 first

(* Dependencies include references in unused fallbacks, as required for cycles. *)
let references s =
  let rec collect cursor names =
    match scan_var s cursor with
    | Error () | Ok None -> names
    | Ok (Some (start, _, name, _)) -> collect (start + 4) (name :: names)
  in
  collect 0 []

type resolution = Visiting | Resolved of string option

let compute ~parent declarations =
  let raw = Hashtbl.create (List.length declarations) in
  List.iter (fun (name, value) -> Hashtbl.replace raw name value) declarations;
  let states = Hashtbl.create (Hashtbl.length raw)
  and cyclic = Hashtbl.create 8
  and stack = ref [] in
  let rec lookup name =
    match Hashtbl.find_opt raw name with
    | None -> Hashtbl.find_opt parent name
    | Some value -> (
        match Hashtbl.find_opt states name with
        | Some (Resolved result) -> result
        | Some Visiting ->
            let rec mark = function
              | [] -> ()
              | node :: rest ->
                  Hashtbl.replace cyclic node ();
                  if node <> name then mark rest
            in
            mark !stack;
            None
        | None ->
            Hashtbl.replace states name Visiting;
            stack := name :: !stack;
            List.iter
              (fun dependency -> ignore (lookup dependency))
              (references value);
            let result =
              if Hashtbl.mem cyclic name then None
              else
                match substitute lookup value with
                | None -> None
                | Some value -> (
                    match String.lowercase_ascii (String.trim value) with
                    | "initial" -> None
                    | "inherit" | "unset" -> Hashtbl.find_opt parent name
                    | _ -> Some value)
            in
            stack := List.tl !stack;
            Hashtbl.replace states name (Resolved result);
            result)
  in
  let result = Hashtbl.copy parent in
  Hashtbl.iter
    (fun name _ ->
      match lookup name with
      | None -> Hashtbl.remove result name
      | Some value -> Hashtbl.replace result name value)
    raw;
  result

let rebuild mode =
  let palette =
    Ui_theme.css_palette
      (match mode with
      | Lui_theme.Light -> Ui_theme.Light
      | Dark -> Ui_theme.Dark)
      ~accent:!accent
  in
  let root = compute ~parent:(Hashtbl.create 0) palette.root in
  let body =
    compute ~parent:root
      (palette.body
      @ Hashtbl.fold
          (fun name value values -> (name, value) :: values)
          (overrides_of_mode mode) [])
  in
  let table = vars_of_mode mode in
  Hashtbl.reset table;
  Hashtbl.iter (Hashtbl.replace table) body

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
