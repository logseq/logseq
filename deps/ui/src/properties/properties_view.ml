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
open Web_dom
module S = Properties_state
module Dialog = Properties_dialog

(* ---------- global keys ---------- *)

let last_semi = ref 0.0

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
          ev_prevent_default ev;
          ev_stop_propagation ev)
    | "p" when (ev_meta ev || ev_ctrl ev) && ev_alt ev ->
        ev_prevent_default ev;
        Dialog.open_for_current ()
    | "p" when ev_meta ev || ev_ctrl ev ->
        ev_prevent_default ev;
        Dialog.open_for_current ()
    | ";" when is_editable_target (ev_target ev) ->
        let t = Js.Date.now () in
        if t -. !last_semi < 500.0 then (
          last_semi := 0.0;
          ev_prevent_default ev;
          Dialog.open_for_current ())
        else last_semi := t
    (* selection-mode `p <key>` sequences are owned by the chord layer in
       editor_keys (cljs keymap): p d/s/p/t open the named property's
       dedicated picker, p i the icon picker, p r the emoji reaction
       picker, p a toggles hidden — not this generic sheet *)
    | _ -> ()

(* ---------- overlays view ---------- *)

(* mounted inside .cp__overlays: the view-overlay stack (confirm
   dialogs) plus the centered property dialog *)
let overlays : t =
 fun context parent ->
  let vos = S.view_overlays context in
  (* cp__overlay-layer/cp__dialog-shell are inert on web; on gpui the
     registered class dictionary makes the column a window-sized layer
     and centers the abspos overlay views by flex alignment. *)
  (column ~gap:0 ~style_class:"cp__overlay-layer cp__dialog-shell"
     [ reactive
         ~equal:(fun a b ->
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

let installed = State_cell.Once.make ()

let install () =
  State_cell.Once.run installed (fun () ->
    S.chain_worker ();
    add_document_listener "keydown" on_keydown true)

(* Module init runs at bundle load (every module in the lib is linked
   into js_app). *)
let () = install ()
