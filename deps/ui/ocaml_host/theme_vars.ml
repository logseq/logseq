(* Host-side theme resolution for the paint color_of hook.

   The app pushes one "theme-snapshot" envelope per mode
   ({mode, vars, kit}); `vars` is the resolved CSS custom-property
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
    match var_ref s with
    | Some (name, fallback) -> (
        match Hashtbl.find_opt (vars_of_mode !mode) name with
        | Some v -> resolve_value v (depth + 1)
        | None -> (
            match fallback with
            | Some f -> resolve_value f (depth + 1)
            | None -> None))
    | None -> Some s

(* "fn(var(--x) [/ a])" — hsl()/rgb() functional notation wrapped
   around a var(). The vars table stores resolved colors, never
   channel triples, so the inner token name resolves against the same
   chain; [alpha] scales the resolved color's alpha. *)
let fn_var_ref (s : string) : (string * float option) option =
  let len = String.length s in
  match String.index_opt s '(' with
  | Some i when len > i + 2 && s.[len - 1] = ')' -> (
    let inner = String.sub s (i + 1) (len - i - 2) in
    match String.split_on_char '/' inner with
    | [ head ] -> (
      match var_ref (String.trim head) with
      | Some (name, _fallback) -> Some (name, None)
      | None -> None)
    | [ head; a ] -> (
      match var_ref (String.trim head) with
      | Some (name, _fallback) -> (
        let a = String.trim a in
        let pct =
          String.length a > 0 && a.[String.length a - 1] = '%'
        in
        match
          float_of_string_opt
            (if pct then String.sub a 0 (String.length a - 1) else a)
        with
        | Some v ->
          Some (name, Some (if pct then v /. 100. else v))
        | None -> Some (name, None))
      | None -> None)
    | _ -> None)
  | _ -> None

let rec color_of (s : string) : Lui_scene.color option =
  let v =
    match var_ref s with
    | Some _ -> resolve_value s 0
    | None -> Some s
  in
  match v with
  | None -> None
  | Some v -> (
      (* var() resolution may land on another token name, a hex
         literal, or a var-free CSS color — try each resolver. *)
      match Lui_window.Theme.color_of_hex v with
      | Some _ as c -> c
      | None -> (
          match Lui_theme.color_of !mode v with
          | Some _ as c -> c
          | None -> (
              match Lui_window.Theme.color_of v with
              | Some _ as c -> c
              | None -> (
                  match fn_var_ref v with
                  | None -> None
                  | Some (name, alpha) -> (
                      let tok =
                        if
                          String.length name > 2
                          && String.sub name 0 2 = "--"
                        then String.sub name 2 (String.length name - 2)
                        else name
                      in
                      match color_of ("var(--" ^ tok ^ ")") with
                      | Some _ as c -> c
                      | None -> (
                          let tok =
                            (* --x-foreground slots alias onto the plain
                               foreground rather than per-surface text
                               entries *)
                            if
                              String.ends_with ~suffix:"-foreground" tok
                              && Lui_theme.color_of !mode tok = None
                            then "foreground"
                            else tok
                          in
                          match Lui_theme.color_of !mode tok with
                          | Some c ->
                            Some
                              (match alpha with
                               | None -> c
                               | Some a ->
                                 { c with Lui_scene.a =
                                     int_of_float
                                       (Float.round
                                          (a *. float c.Lui_scene.a)) })
                          | None -> None))))))

let count_of_mode m = Hashtbl.length (vars_of_mode m)
