(* Edit_input — conduit events -> Edit_model updates.

   The platform conduit (extension/logseq_editor.ml on web) decodes its
   host listeners into the [event] vocabulary below; [handle] applies it
   to the model and fires [route] callbacks for the intents the buffer
   cannot resolve locally (block split/merge/indent, menu commands).
   The input layer never touches js_app/db code — callers wire [route]
   to their state layer.

   Measurement flows back the other way: [conduit] ops are host calls
   implemented over the rendered run text nodes; [measure] folds them
   into a [frame] for the view's overlay. *)

open Lui_protocol

type rect =
  { x : int
  ; y : int
  ; w : int
  ; h : int
  } (* px, block-editor relative *)

type frame =
  { caret : rect option
  ; selection : rect list (* one rect per selected visual line *)
  }

let empty_frame = { caret = None; selection = [] }

(* host surface: everything the view/input needs that OCaml cannot
   compute — all positions in px, all offsets in model bytes *)
type conduit =
  { caret_rect : int -> rect option (* byte off -> caret rect *)
  ; offset_at : x:int -> y:int -> int option (* px -> byte off *)
  ; line_ranges : unit -> (int * int) list (* visual lines as [lo, hi) *)
  ; set_input_focus : bool -> unit
  }

let no_conduit =
  { caret_rect = (fun _ -> None)
  ; offset_at = (fun ~x:_ ~y:_ -> None)
  ; line_ranges = (fun () -> [])
  ; set_input_focus = (fun _ -> ())
  }

type route =
  { split_block : unit -> unit
  ; merge_prev : unit -> unit
  ; indent : unit -> unit
  ; outdent : unit -> unit
  ; cancel : unit -> unit
  ; focused : bool -> unit (* gained/lost — callers blink the caret *)
  ; menu : string -> unit (* context-menu / palette intents *)
  }

let no_route =
  { split_block = ignore
  ; merge_prev = ignore
  ; indent = ignore
  ; outdent = ignore
  ; cancel = ignore
  ; focused = ignore
  ; menu = ignore
  }

type comp_state =
  | Comp_start
  | Comp_update
  | Comp_end
  | Comp_cancel

(* the DOM beforeinput delete family is directional; the model's
   delete_kind names the same operations without the direction split *)
type delete_kind =
  | Del_backward
  | Del_forward
  | Del_word_backward
  | Del_word_forward
  | Del_line_backward
  | Del_line_forward
  | Del_selection

type event =
  | Key of Edit_model.key_event * bool (* repeat *)
  | Insert of string
  | Delete of delete_kind
  | Composition of comp_state * string (* state, marked/committed text *)
  | Focus
  | Blur
  | Pointer of int * bool (* byte off hit-tested host-side, extend *)
  | Menu of string

let delete_kind_of_string = function
  | "backward" -> Some Del_backward
  | "forward" -> Some Del_forward
  | "word-backward" -> Some Del_word_backward
  | "word-forward" -> Some Del_word_forward
  | "line-backward" -> Some Del_line_backward
  | "line-forward" -> Some Del_line_forward
  | "selection" -> Some Del_selection
  | _ -> None

(* --- wire decoding --------------------------------------------------------------
   Extension event name + fields -> event; mirrors the emit side in
   logseq_editor.ml. Unknown names/kinds decode to None — host event
   vocabularies grow forward. *)

let str_field fields k =
  match String_map.find_opt k fields with
  | Some (StringValue s) -> Some s
  | _ -> None

let bool_field fields k =
  match String_map.find_opt k fields with
  | Some (BoolValue b) -> b
  | _ -> false

let int_field fields k =
  match String_map.find_opt k fields with
  | Some (IntValue n) -> Some n
  | _ -> None

let decode name fields : event option =
  match name with
  | "key" -> (
      match str_field fields "key" with
      | Some key ->
          let kev =
            { Edit_model.key
            ; shift = bool_field fields "shift"
            ; alt = bool_field fields "alt"
            ; meta = bool_field fields "meta"
            ; ctrl = bool_field fields "ctrl"
            }
          in
          Some (Key (kev, bool_field fields "repeat"))
      | None -> None)
  | "insert" -> Option.map (fun t -> Insert t) (str_field fields "text")
  | "delete" -> (
      match str_field fields "kind" with
      | Some k -> Option.map (fun k -> Delete k) (delete_kind_of_string k)
      | None -> None)
  | "composition" -> (
      match str_field fields "state" with
      | Some "start" -> Some (Composition (Comp_start, ""))
      | Some "update" ->
          Some
            (Composition
               (Comp_update, Option.value (str_field fields "text") ~default:""))
      | Some "end" ->
          Some
            (Composition
               (Comp_end, Option.value (str_field fields "text") ~default:""))
      | Some "cancel" -> Some (Composition (Comp_cancel, ""))
      | _ -> None)
  | "focus" -> Some Focus
  | "blur" -> Some Blur
  | "pointer" -> (
      match int_field fields "offset" with
      | Some off -> Some (Pointer (off, bool_field fields "extend"))
      | None -> None)
  | "menu" -> Option.map (fun n -> Menu n) (str_field fields "name")
  | _ -> None

(* --- mapping ------------------------------------------------------------------ *)

let delete m = function
  | Del_backward -> Edit_model.delete_backward m
  | Del_forward -> Edit_model.delete_forward m
  | Del_word_backward -> Edit_model.delete_word_backward m
  | Del_word_forward -> Edit_model.delete_word_forward m
  | Del_line_backward ->
      (* DOM soft/hard-line backward deletes to the visual line start *)
      let lo, _ = Edit_model.line_bounds m in
      Edit_model.splice m lo m.Edit_model.caret ""
  | Del_line_forward ->
      let _, hi = Edit_model.line_bounds m in
      Edit_model.splice m m.Edit_model.caret hi ""
  | Del_selection -> (
      match Edit_model.selection_range m with
      | Some (lo, hi) -> Edit_model.splice m lo hi ""
      | None -> m)

(* vertical arrows resolve through the conduit: locate the caret's
   visual line in line_ranges, then offset_at the midpoint of the
   adjacent line (measured from that line's own first offset — the
   caret bar is inset inside its line box, so a bare `r.y - 1` /
   `r.y + r.h` still lands inside the current row and never moves).
   No goal-column memory yet — one hop per keypress from the live
   caret. *)
let vertical ~conduit ~extend m d =
  match conduit.caret_rect m.Edit_model.caret with
  | None -> m
  | Some r -> (
      (* same line table the boundary checks in edit_arrows use *)
      let ranges = m.Edit_model.lines in
      let caret_line = Edit_model.caret_line m in
      let target =
        match d with
        | Edit_model.Up when caret_line > 0 ->
            List.nth_opt ranges (caret_line - 1)
        | Edit_model.Down when caret_line < List.length ranges - 1 ->
            List.nth_opt ranges (caret_line + 1)
        | _ -> None
      in
      match target with
      | None -> m
      | Some (lo, _) -> (
          match conduit.caret_rect lo with
          | None -> m
          | Some tr -> (
              match conduit.offset_at ~x:r.x ~y:(tr.y + (tr.h / 2)) with
              | None -> m
              | Some off ->
                  let anchor =
                    if extend then Option.value m.anchor ~default:m.caret
                    else off
                  in
                  Edit_model.select m ~anchor ~focus:off)))

(* routed intents + host-resolved moves; every other action already ran
   through Edit_model.apply inside handle_key *)
let apply_action ~route ~conduit m (a : Edit_model.edit_action) =
  match a with
  | Edit_model.SplitBlock -> route.split_block (); m
  | Edit_model.Merge_prev -> route.merge_prev (); m
  | Edit_model.Indent -> route.indent (); m
  | Edit_model.Outdent -> route.outdent (); m
  | Edit_model.Cancel -> route.cancel (); m
  | Edit_model.Caret_move (Edit_model.Up | Edit_model.Down as d) ->
      vertical ~conduit ~extend:false m d
  | Edit_model.Select_move (Edit_model.Up | Edit_model.Down as d) ->
      vertical ~conduit ~extend:true m d
  | _ -> m

let handle ~route ~conduit m (ev : event) : Edit_model.t =
  match ev with
  | Key (kev, _repeat) ->
      let m', a = Edit_model.handle_key m kev in
      apply_action ~route ~conduit m' a
  | Insert text -> Edit_model.insert_text m text
  | Delete k -> delete m k
  | Composition (Comp_start, _) ->
      Edit_model.composition_begin m m.Edit_model.caret
  | Composition (Comp_update, text) ->
      Edit_model.composition_update m ~len:(String.length text)
  | Composition (Comp_end, text) -> Edit_model.composition_commit m text
  | Composition (Comp_cancel, _) -> Edit_model.composition_cancel m
  | Focus -> route.focused true; m
  | Blur -> route.focused false; Edit_model.composition_cancel m
  | Pointer (off, extend) ->
      let anchor =
        if extend then Option.value m.Edit_model.anchor ~default:m.caret
        else off
      in
      Edit_model.select m ~anchor ~focus:off
  | Menu name -> route.menu name; m

(* fold the conduit's measurements into the frame the overlay draws:
   the caret bar plus one selection rect per selected visual line *)
let measure conduit (m : Edit_model.t) : frame =
  let caret = conduit.caret_rect m.Edit_model.caret in
  let selection =
    match Edit_model.selection_range m with
    | None -> []
    | Some (sel_lo, sel_hi) ->
        List.filter_map
          (fun (lo, hi) ->
            let a = max lo sel_lo and b = min hi sel_hi in
            if a >= b then None
            else
              match conduit.caret_rect a, conduit.caret_rect b with
              | Some ra, Some rb when rb.y = ra.y ->
                  Some { x = ra.x; y = ra.y; w = rb.x - ra.x; h = ra.h }
              | _ -> None)
          (conduit.line_ranges ())
  in
  { caret; selection }
