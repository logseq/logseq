(* Public entry points for the properties UI.

   `install ()` must be called once during app startup. Melange
   dead-codes unreferenced modules, so without that single call nothing
   in this directory is bundled into main.js. It sets up:

   - a MutationObserver that mounts .ls-properties-area /
     .ls-bidirectional-properties under .page-inner and
     .ls-block-content-indent inside every .ls-block (DOM-extension
     mount, same pattern as blocks/add_button.ml);
   - document keydown handling: Escape pops overlays, mod+p /
     Ctrl+Alt+P and `;;` open the .ls-property-dialog, `p` then `a`
         toggles hidden properties.

       The `/` and `#` in-editor popups are owned by popups/popups_state.ml
       (the unified autocomplete); "Add property" there reaches the dialog
       via the ls:editor-command listener in editor/editor_commands.ml. *)

open Web_dom
module S = Properties_state
module Area = Properties_area
module Dialog = Properties_dialog

(* ---------- global keys ---------- *)

let last_semi = ref 0.0

let on_keydown ev =
  if ev_composing ev then ()
  else
    match ev_key ev with
    | "Escape" ->
        if S.handle_escape () then (
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

(* ---------- install ---------- *)

let installed = State_cell.Once.make ()

let install () =
  State_cell.Once.run installed (fun () ->
    S.chain_worker ();
    (* mutations inside our own managed areas are self-inflicted (value
       editors, pill renders); rebuilding on them would wipe a live
       textarea — only structural changes outside need ensure_all *)
    (* closest() only exists on elements — start a #text mutation's walk
       at its parent *)
    let in_managed el =
      match
        if el_node_name el = "#text" then Web_dom.el_parent el
        else Some el
      with
      | Some el ->
          el_closest el
            ".ls-properties-area, .ls-bidirectional-properties"
          <> None
      | None -> false
    in
    register_doc_scan
      ~run_if:(fun recs ->
        Array.fold_left
          (fun acc r -> acc || not (in_managed (rec_target r)))
          false recs)
      Area.ensure_all;
    add_document_listener "keydown" on_keydown true)

(* Module init runs at bundle load (every module in the lib is linked
   into js_app). The observer then keeps the mounts alive across page
   renders — same bootstrap path as blocks/tree.ml's module init for
   Editor_keys + Add_button. *)
let () = install ()

(* Public render entry points other areas can call (e.g. pages could
   mount the page properties section into their own container instead of
   relying on the observer). *)

