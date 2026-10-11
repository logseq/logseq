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

let set_dark is_dark =
  mode := (if is_dark then Lui_theme.Dark else Lui_theme.Light)

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

let color_of (s : string) : Lui_scene.color option =
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
          | None -> Lui_window.Theme.color_of v))

let count_of_mode m = Hashtbl.length (vars_of_mode m)
