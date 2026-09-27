(* Public entry points for the properties UI.

   `install ()` must be called once during app startup —
   TODO(app/js_app): add `Properties_view.install ();` to the boot path
   (js_app/main.ml or wherever app modules are wired). Melange
   dead-codes unreferenced modules, so without that single call nothing
   in this directory is bundled into main.js. It sets up:

   - a MutationObserver that mounts .ls-properties-area /
     .ls-bidirectional-properties under .page-inner and
     .ls-block-content-indent inside every .ls-block (DOM-extension
     mount, same pattern as blocks/add_button.ml);
   - document keydown handling: Escape pops overlays, mod+p /
     Ctrl+Alt+P and `;;` open the .ls-property-dialog, `p` then `a`
     toggles hidden properties;
   - the `/` command popover (.ui__popover-content with "Add property"
     / "Set property") and the `#` tag popover inside block editors.
     (TODO(popups): these belong with the command/autocomplete area;
     implemented here to satisfy the property e2e contract.) *)

open Editor_dom
open Properties_dom
module I18n = Properties_i18n
module D = Properties_data
module S = Properties_state
module Sel = Properties_select
module Area = Properties_area
module Dialog = Properties_dialog
module W = Wire

(* ---------- editor popover machinery (`/` and `#`) ---------- *)

type popover =
  { pop_el : Editor_dom.el
  ; pop_input : Editor_dom.el (* the textarea being edited *)
  ; pop_uuid : string
  ; mutable pop_start : int (* offset where the trigger char sits *)
  }

let popover_ref : popover option ref = ref None

let close_popover () =
  (match !popover_ref with
   | Some p ->
       el_remove p.pop_el;
       popover_ref := None;
       el_focus p.pop_input
   | None -> ())

(* substring match, case-insensitive *)
let contains_ci hay needle =
  let ll = String.lowercase_ascii hay in
  let lt = String.lowercase_ascii needle in
  let n = String.length lt and m = String.length ll in
  let rec go i = i + n > m || String.sub ll i n = lt || go (i + 1) in
  n = 0 || go 0

(* last "/cmd" / "#cmd" token ending at the caret *)
let trigger_term el marker =
  let s =
    String.sub (el_value el) 0 (el_selection_start el)
  in
  let n = String.length s in
  let rec find i =
    if i < 0 then None
    else if s.[i] = marker then (
      let term = String.sub s (i + 1) (n - i - 1) in
      if String.contains term ' ' then None else Some (i, term))
    else if s.[i] = ' ' then None
    else find (i - 1)
  in
  find (n - 1)

(* delete the trigger token from the textarea and persist the title *)
let strip_token el uuid start =
  let v = el_value el in
  let caret = el_selection_start el in
  let nv =
    String.sub v 0 start ^ String.sub v caret (String.length v - caret)
  in
  el_set_value el nv;
  el_set_selection_range el start start;
  D.save_block ~uuid ~title:nv |> ignore

let textarea_uuid el =
  let id = el_id el in
  if String.length id > 11 && String.sub id 0 11 = "edit-block-" then
    Some (String.sub id 11 (String.length id - 11))
  else None

let open_popover ~content input uuid start =
  close_popover ();
  let el = mk ~cls:"ui__popover-content" "div" in
  el_append_child el content;
  let x, _y, _r, bottom, _w = el_rect input in
  set_style el
    (Printf.sprintf "position:fixed;z-index:9999;left:%dpx;top:%dpx"
       (int_of_float x) (int_of_float bottom));
  S.push_overlay el ~on_escape:(fun () ->
      popover_ref := None);
  popover_ref := Some { pop_el = el; pop_input = input; pop_uuid = uuid
                      ; pop_start = start }

let mount_select p items =
  el_clear p.pop_el;
  if items = [] then close_popover ()
  else (
    let sel, input =
      Sel.create ~placeholder:"" ~on_escape:close_popover items
    in
    el_append_child p.pop_el sel;
    el_focus input)

let slash_items = [ I18n.t "property/add-new"; I18n.t "property/set-property" ]

let refresh_slash p term =
  let its =
    List.map
      (fun label ->
        Sel.item label (fun () ->
            match !popover_ref with
            | Some p ->
                strip_token p.pop_input p.pop_uuid p.pop_start;
                let uuid = p.pop_uuid in
                close_popover ();
                Dialog.open_for_block uuid
            | None -> ()))
      (List.filter (fun l -> contains_ci l term) slash_items)
  in
  mount_select p its

(* `#tag` -> block/tags write + .block-tag pill on the block.
   TODO(blocks): .block-tag pills belong to the block renderer; render
   them from block/tags at render time. *)
let choose_tag p class_ent =
  match D.entity_id_of class_ent with
  | None -> ()
  | Some id ->
      let title =
        D.entity_title_of class_ent |> Option.value ~default:"" in
      strip_token p.pop_input p.pop_uuid p.pop_start;
      let uuid = p.pop_uuid in
      close_popover ();
      ignore
        (D.set_block_property ~block_uuid:uuid ~ident:"block/tags"
           ~value:(W.Int id));
      (match get_element_by_id ("ls-block-" ^ uuid) with
       | Some block_el -> (
           match el_query block_el ".block-main-content" with
           | Some content ->
               let tag = mk "a" ~cls:"block-tag" in
               el_set_text tag ("#" ^ title);
               el_append_child content tag
           | None -> ())
       | None -> ())

let refresh_tag _p term =
  D.all_classes ()
  |> Js.Promise.then_ (fun w ->
         let its =
           List.filter_map
             (fun c ->
               let title =
                 D.entity_title_of c |> Option.value ~default:"" in
               if title = "" || not (contains_ci title term) then None
               else
                 Some
                   (Sel.item title (fun () ->
                        match !popover_ref with
                        | Some p -> choose_tag p c
                        | None -> ())))
             (D.elems w)
         in
         (match !popover_ref with
          | Some p -> mount_select p its
          | None -> ());
         Js.Promise.resolve ())
  |> ignore

(* `input` events on editor textareas: open/refresh/close popovers *)
let on_input ev =
  match ev_target ev with
  | Some el
    when el_tag el = "TEXTAREA" && Option.is_some (textarea_uuid el) -> (
      let uuid = Option.get (textarea_uuid el) in
      match !popover_ref with
      | Some p when p.pop_input != el -> close_popover ()
      | _ -> (
          let open_for marker refresh =
            match trigger_term el marker with
            | Some (start, term) -> (
                (match !popover_ref with
                 | Some p ->
                     p.pop_start <- start;
                     refresh p term
                 | None ->
                     let content = mk "div" in
                     open_popover ~content el uuid start;
                     (match !popover_ref with
                      | Some p -> refresh p term
                      | None -> ()));
                true)
            | None -> false
          in
          if open_for '/' refresh_slash then ()
          else if open_for '#' refresh_tag then ()
          else close_popover ()))
  | _ -> ()

(* ---------- global keys ---------- *)

let last_semi = ref 0.0
let last_p = ref 0.0

let on_keydown ev =
  if ev_composing ev then ()
  else
    match ev_key ev with
    | "Escape" ->
        if S.handle_escape () then (
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

(* ---------- install ---------- *)

let installed = ref false

let install () =
  if !installed then ()
  else (
    installed := true;
    S.chain_worker ();
    Area.ensure_all ();
    let obs = new_observer (fun () -> Area.ensure_all ()) in
    observe obs document_element (observe_opts ~childList:true ~subtree:true);
    document_add_listener "keydown" on_keydown true;
    document_add_listener "input" on_input true)

(* Module init runs at bundle load (every module in the lib is linked
   into js_app). The observer then keeps the mounts alive across page
   renders — same bootstrap path as blocks/tree.ml's module init for
   Editor_keys + Add_button. *)
let () = install ()

(* Public render entry points other areas can call (e.g. pages could
   mount the page properties section into their own container instead of
   relying on the observer). *)

let mount_page_properties page_inner = Area.mount_page_area page_inner

let mount_block_properties ls_block_el uuid =
  Area.mount_block_area ls_block_el uuid

let open_property_dialog = Dialog.open_for_current
