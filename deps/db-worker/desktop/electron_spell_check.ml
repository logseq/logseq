(* Port of src/electron/electron/spell_check.cljs — spellcheck
   enablement helpers shared by window creation and runtime toggles. *)

open Electron_bindings
open Datascript

(* cljs (not= false value): only an explicit EDN `false` disables
   spellcheck; a missing (nil) config value counts as enabled. *)
let session_spellcheck_enabled (value : value) : bool =
  match value with Bool false -> false | _ -> true

let startup_spellcheck_states (linux : bool) (enabled : bool) :
    bool * bool =
  ((if linux && enabled then false else enabled), enabled)

let apply_window_spellcheck (win : Browser_window.t) (enabled : bool) :
    Browser_window.t =
  session_set_spell_checker_enabled
    (web_contents_session (Browser_window.web_contents win))
    enabled;
  win
