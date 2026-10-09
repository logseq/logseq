(* ---------------------------------------------------------------------------
   Editor surface hooks, keyed by block id.

   Shared editor code (editor_actions / editor_keys / editor_commands /
   popups_state / page) needs three things from the mounted editor
   surface: the Edit_input conduit, focus control, and popup/measurement
   positions. Each of those is platform-specific — on web they come from
   the `logseq-editor` extension (src/extension/logseq_editor.ml); other
   surfaces register their own implementation of the same shape.

   Keeping the indirection here — instead of letting shared code import
   the web conduit directly — also keeps the module graph acyclic:
   logseq_editor -> web_ext_adapters -> cm_adapter -> code_mirror ->
   editor_actions would close a loop if editor_actions pointed back.

   Defaults are no-ops so a surface that has not registered an
   implementation yet (e.g. a platform still on its legacy editor) fails
   soft rather than crashing shared code.
   --------------------------------------------------------------------------- *)

(* the extension identifier every platform's editor conduit answers to;
   edit_view mounts it via `Lui_ui.extension` *)
let identifier = "logseq-editor"

type impl =
  { conduit : string -> Edit_input.conduit option
  ; focus_input : string -> unit
  ; is_focused : string -> bool
  ; can_focus : string -> bool
  ; popup_pos : string -> (float * float * float) option
  ; container_rect : string -> (float * float * float * float) option
  ; invalidate : string -> unit
  ; select_range : string -> int -> int -> unit
  }

let no_impl =
  { conduit = (fun _ -> None)
  ; focus_input = (fun _ -> ())
  ; is_focused = (fun _ -> false)
  ; can_focus = (fun _ -> true)
  ; popup_pos = (fun _ -> None)
  ; container_rect = (fun _ -> None)
  ; invalidate = (fun _ -> ())
  ; select_range = (fun _ _ _ -> ())
  }

let current = ref no_impl

let register impl = current := impl

let conduit block_id = (!current).conduit block_id

let focus_input block_id = (!current).focus_input block_id

let is_focused block_id = (!current).is_focused block_id

(* can the sink take focus right now? web reports whether the conduit
   input element is mounted; native hosts queue set-input-focus for
   late mounts themselves so they always answer true *)
let can_focus block_id = (!current).can_focus block_id

let popup_pos block_id = (!current).popup_pos block_id

let container_rect block_id = (!current).container_rect block_id

(* bump the block's measurement epoch: replies measured against a
   previous text/layout must not answer queries issued afterwards —
   native surfaces reject them by epoch, synchronous surfaces treat
   it as a no-op *)
let invalidate block_id = (!current).invalidate block_id

(* mirror a model text selection into the host surface's native
   selection so the OS context menu offers real text items (web DOM
   selection; native hosts keep their own surface selection) *)
let select_range block_id lo hi = (!current).select_range block_id lo hi
