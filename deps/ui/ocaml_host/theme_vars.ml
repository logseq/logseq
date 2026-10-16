(* Host-side theme resolution for the paint color_of hook.

   The app pushes one "theme-snapshot" envelope per mode
   ({mode, vars, kit}); `vars` is the CSS custom-property
   table — the same map the host installs through
   style::set_css_var. A later "ui-state" (or the appearance channel)
   picks the active mode. color_of resolves:

     var(--x)            -> active mode's vars table
     var(--x, fallback)  -> vars table, else fallback (recursively)
     bare token names    -> Lui_theme tokens for the active mode
     anything else       -> Lui_window.Theme's built-in palette *)

module J = Yojson.Safe

let light_vars : (string, string) Hashtbl.t = Hashtbl.create 256
let dark_vars : (string, string) Hashtbl.t = Hashtbl.create 256
let mode : Lui_theme.mode ref = ref Lui_theme.Light

(* Bumped whenever resolution can change (mode flip, new snapshot):
   the paint cache holds resolved colors, so the host drops it on a
   bump — otherwise a theme toggle only repainted the window clear and
   left sidebars/text in the previous theme's colors. *)
let generation = ref 0

let set_dark is_dark =
  let m = if is_dark then Lui_theme.Dark else Lui_theme.Light in
  if m <> !mode then incr generation;
  mode := m

let vars_of_mode = function
  | Lui_theme.Dark -> dark_vars
  | Lui_theme.Light -> light_vars

let install_snapshot (payload : string) =
  match J.from_string payload with
  | `Assoc _ as j -> (
      let open J.Util in
      let mode_name =
        j |> member "mode" |> to_string_option |> Option.value
          ~default:"light"
      in
      let table =
        vars_of_mode
          (if mode_name = "dark" then Lui_theme.Dark else Lui_theme.Light)
      in
      Hashtbl.reset table;
      incr generation;
      match j |> member "vars" with
      | `Assoc kvs ->
        List.iter
          (fun (name, v) ->
             match v with
             | `String s -> Hashtbl.replace table name s
             | _ -> ())
          kvs
      | _ -> ())
  | _ -> ()

(* "var(--x)" / "var(--x, <fallback>)" → (name, fallback option). *)
let var_ref (s : string) : (string * string option) option =
  let len = String.length s in
  if len > 5 && String.sub s 0 4 = "var(" && s.[len - 1] = ')' then begin
    let inner = String.sub s 4 (len - 5) in
    (* split on the first top-level comma — the fallback itself may be
       a nested var(--b, #hex), so scan with paren depth. *)
    let depth = ref 0 in
    let cut = ref None in
    String.iteri
      (fun i c ->
         if c = '(' then incr depth
         else if c = ')' then decr depth
         else if c = ',' && !depth = 0 && !cut = None then cut := Some i)
      inner;
    match !cut with
    | Some i ->
      Some
        ( String.trim (String.sub inner 0 i)
        , Some
            (String.trim
               (String.sub inner (i + 1) (String.length inner - i - 1))) )
    | None -> Some (String.trim inner, None)
  end
  else None

let rec resolve_value (s : string) (depth : int) : string option =
  if depth > 8 then None
  else
    let len = String.length s in
    let rec find_var start =
      match String.index_from_opt s start 'v' with
      | Some i when i + 4 <= len ->
          if String.sub s i 4 = "var(" then Some i else find_var (i + 1)
      | _ -> None
    in
    match find_var 0 with
    | None -> Some s
    | Some first ->
        let output = Buffer.create len in
        let rec closing i nesting =
          if i = len then None
          else
            match s.[i] with
            | '(' -> closing (i + 1) (nesting + 1)
            | ')' when nesting = 1 -> Some i
            | ')' -> closing (i + 1) (nesting - 1)
            | _ -> closing (i + 1) nesting
        in
        let rec expand cursor start =
          match closing (start + 4) 1 with
          | None -> None
          | Some stop -> (
              let expression = String.sub s start (stop - start + 1) in
              match var_ref expression with
              | None -> None
              | Some (name, fallback) -> (
                  let value =
                    match Hashtbl.find_opt (vars_of_mode !mode) name with
                    | Some value -> Some value
                    | None -> fallback
                  in
                  match
                    Option.bind value (fun value ->
                        resolve_value value (depth + 1))
                  with
                  | None -> None
                  | Some value -> (
                      Buffer.add_substring output s cursor (start - cursor);
                      Buffer.add_string output value;
                      let cursor = stop + 1 in
                      match find_var cursor with
                      | Some next -> expand cursor next
                      | None ->
                          Buffer.add_substring output s cursor (len - cursor);
                          Some (Buffer.contents output))))
        in
        expand 0 first

let color_of (s : string) : Lui_scene.color option =
  let spec = if s = "scrim" then "hsl(var(--background) / 0.9)" else s in
  Option.bind (resolve_value spec 0) (fun value ->
      match Lui_window.Theme.color_of_hex value with
      | Some _ as color -> color
      | None -> (
          match Lui_theme.color_of !mode value with
          | Some _ as color -> color
          | None -> Lui_window.Theme.color_of value))

let count_of_mode m = Hashtbl.length (vars_of_mode m)
