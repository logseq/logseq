(* Public entry points for the properties UI.

   `install ()` must be called once during app startup. Melange
   dead-codes unreferenced modules, so without that single call nothing
   in this directory is bundled into main.js. It sets up:

   - document keydown handling: Escape pops overlays (view overlays,
     then the property dialog, then imperative popups), mod+p /
     Ctrl+Alt+P and `;;` open the .ls-property-dialog, `p` then `a`
         toggles hidden properties.

   [overlays] mounts inside .cp__overlays — it renders the declarative
   view-overlay stack (confirm dialogs pushed via S.push_view_overlay)
   and the property dialog card.

       The `/` and `#` in-editor popups are owned by popups/popups_state.ml
       (the unified autocomplete); "Add property" there reaches the dialog
       via the ls:editor-command listener in editor/editor_commands.ml. *)

open Lui_elements
open Editor_dom
module S = Properties_state
module Dialog = Properties_dialog

(* ---------- global keys ---------- *)

let last_semi = ref 0.0
let last_p = ref 0.0

let on_keydown ev =
  if ev_composing ev then ()
  else
    match ev_key ev with
    | "Escape" ->
        if
          S.handle_view_escape ()
          || Dialog.handle_escape ()
          || S.handle_escape ()
        then (
          prevent_default ev;
          stop_propagation ev)
    | "p" when (ev_meta ev || ev_ctrl ev) && ev_alt ev ->
        prevent_default ev;
        Dialog.open_for_current ()
    | "p" when ev_meta ev || ev_ctrl ev ->
        prevent_default ev;
        Dialog.open_for_current ()
    | ";" when is_editable_target (ev_target ev) ->
        let t = Js.Date.now () in
        if t -. !last_semi < 500.0 then (
          last_semi := 0.0;
          prevent_default ev;
          Dialog.open_for_current ())
        else last_semi := t
    | "p" when not (is_editable_target (ev_target ev)) ->
        last_p := Js.Date.now ()
    | "a" when not (is_editable_target (ev_target ev)) ->
        if Js.Date.now () -. !last_p < 800.0 then (
          last_p := 0.0;
          S.toggle_hidden ();
          S.refresh_all ())
    | _ -> ()

(* ---------- overlays view ---------- *)

(* mounted inside .cp__overlays: the view-overlay stack (confirm
   dialogs) plus the centered property dialog *)
let overlays : t =
 fun context parent ->
  let vos = S.view_overlays context in
  (column ~gap:0
     [ dyn ~equal:(fun a b ->
            List.map (fun (v : S.view_overlay) -> v.vo_key) a
            = List.map (fun (v : S.view_overlay) -> v.vo_key) b)
         (fun vos ->
            column ~gap:0
              (List.map (fun (v : S.view_overlay) -> v.vo_view) vos))
         vos
     ; Dialog.view
     ])
    context parent

(* ---------- install ---------- *)

let installed = ref false

let install () =
  if !installed then ()
  else (
    installed := true;
    S.chain_worker ();
    document_add_listener "keydown" on_keydown true)

(* Module init runs at bundle load (every module in the lib is linked
   into js_app). *)
let () = install ()
