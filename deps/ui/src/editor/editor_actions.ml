(* Block-editor behaviors: enter/exit edit mode, split/merge, indent,
   move, selection, clipboard, undo. All mutations flow through
   Outliner_ops (apply-outliner-ops) followed by a page refresh. *)

module S = Editor_state
module D = Editor_dom
module Ops = Outliner_ops

(* ---- buffer + focus ---- *)

let live_buffer uuid =
  match D.textarea_of uuid with
  | Some el -> D.el_value el
  | None -> (
      match S.editing () with
      | Some e when e.uuid = uuid -> e.buffer
      | _ -> "")

let sync_buffer uuid v =
  S.set_silent (fun st ->
      match st.S.editing with
      | Some e when e.uuid = uuid ->
          { st with S.editing = Some { e with S.buffer = v } }
      | _ -> st)

let apply_focus () =
  match !S.pending_focus with
  | None -> ()
  | Some (uuid, caret) -> (
      match D.textarea_of uuid with
      | Some el ->
          S.pending_focus := None;
          D.el_focus el;
          let len = String.length (D.el_value el) in
          let c = max 0 (min caret len) in
          D.el_set_selection_range el c c
      | None -> ())

let request_focus uuid caret =
  S.pending_focus := Some (uuid, caret);
  D.set_timeout apply_focus 0;
  D.set_timeout apply_focus 120

(* set pending focus, then run [p]; re-apply focus after the flush so a
   remounted textarea still ends up focused *)
let with_focus_after uuid caret p =
  S.pending_focus := Some (uuid, caret);
  ignore
    (p
    |> Js.Promise.then_ (fun () ->
           D.set_timeout apply_focus 0;
           D.set_timeout apply_focus 120;
           Js.Promise.resolve ()))

let model_title uuid =
  match S.find uuid with Some b -> b.Model.block_title | None -> ""

let save_if_dirty uuid =
  let buf = live_buffer uuid in
  if buf <> model_title uuid then
    ignore (Ops.apply_and_refresh [ Ops.save_block uuid buf ])

(* ---- enter / exit ---- *)

let enter_edit uuid caret =
  (match S.editing () with
  | Some e when e.uuid <> uuid -> save_if_dirty e.uuid
  | _ -> ());
  match S.find uuid with
  | Some b ->
      S.set (fun st ->
          { st with
            S.editing = Some { uuid; buffer = b.Model.block_title }
          ; selected = S.String_set.empty
          ; anchor = None
          });
      request_focus uuid caret
  | None -> ()

let commit_buf uuid buf =
  if buf <> model_title uuid then
    ignore (Ops.apply_and_refresh [ Ops.save_block uuid buf ])

let exit_edit ~select =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      S.set (fun st ->
          { st with
            S.editing = None
          ; selected =
              (if select then S.String_set.singleton e.uuid else st.selected)
          ; anchor = (if select then Some e.uuid else st.anchor)
          });
      commit_buf e.uuid buf

(* click outside the editor commits without selecting *)
let blur_commit () =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      S.set (fun st -> { st with S.editing = None });
      commit_buf e.uuid buf

(* ---- structure ops ---- *)

let split_at_cursor uuid =
  match (S.editing (), S.find uuid) with
  | Some e, Some b when e.uuid = uuid ->
      let buf, pos =
        match D.textarea_of uuid with
        | Some el -> (D.el_value el, D.el_selection_start el)
        | None -> (e.buffer, String.length e.buffer)
      in
      let pos = max 0 (min pos (String.length buf)) in
      let before = String.sub buf 0 pos in
      let after = String.sub buf pos (String.length buf - pos) in
      let new_uuid = Platform.random_uuid () in
      let sibling = S.is_collapsed uuid || b.Model.block_children = [] in
      let ops =
        [ Ops.save_block uuid before
        ; Ops.insert_blocks [ Ops.block_map ~title:after new_uuid ] uuid
            ~sibling
        ]
      in
      S.set_silent (fun st ->
          { st with S.editing = Some { uuid = new_uuid; buffer = after } });
      with_focus_after new_uuid 0 (Ops.apply_and_refresh ops)
  | _ -> ()

let move_children_ops (b : Model.block) target_uuid =
  match
    List.filter_map (fun c -> c.Model.block_uuid) b.Model.block_children
  with
  | [] -> []
  | uuids -> [ Ops.move_blocks uuids target_uuid ~sibling:false ]

let is_parent_of (parent : Model.block) uuid =
  List.exists
    (fun c -> c.Model.block_uuid = Some uuid)
    parent.Model.block_children

(* Backspace at caret 0: merge current into previous visible block *)
let merge_prev uuid =
  match (S.editing (), S.find uuid, S.prev_visible uuid) with
  | Some e, Some b, Some prev when e.uuid = uuid -> (
      match prev.Model.block_uuid with
      | None -> ()
      | Some prev_uuid ->
          let buf = live_buffer uuid in
          if
            String.trim prev.Model.block_title = ""
            && not (is_parent_of prev uuid)
          then (
            (* empty prev: current moves after it, prev dies *)
            let ops =
              [ Ops.move_blocks [ uuid ] prev_uuid ~sibling:true
              ; Ops.delete_blocks [ prev_uuid ]
              ]
            in
            S.set_silent (fun st ->
                { st with S.editing = Some { e with S.buffer = buf } });
            with_focus_after uuid 0 (Ops.apply_and_refresh ops))
          else (
            let ops =
              move_children_ops b prev_uuid
              @ [ Ops.delete_blocks [ uuid ]
                ; Ops.save_block prev_uuid (prev.Model.block_title ^ buf)
                ]
            in
            S.set_silent (fun st ->
                { st with
                  S.editing =
                    Some
                      { uuid = prev_uuid
                      ; buffer = prev.Model.block_title ^ buf
                      }
                });
            with_focus_after prev_uuid
              (String.length prev.Model.block_title)
              (Ops.apply_and_refresh ops)))
  | _ -> ()

(* Delete at end: merge next visible block into current *)
let merge_next uuid =
  match (S.editing (), S.find uuid, S.next_visible uuid) with
  | Some e, Some _b, Some next when e.uuid = uuid -> (
      match next.Model.block_uuid with
      | None -> ()
      | Some next_uuid ->
          let buf = live_buffer uuid in
          let ops =
            (match
               List.filter_map
                 (fun c -> c.Model.block_uuid)
                 next.Model.block_children
             with
            | [] -> []
            | uuids -> [ Ops.move_blocks uuids uuid ~sibling:false ])
            @ [ Ops.delete_blocks [ next_uuid ]
              ; Ops.save_block uuid (buf ^ next.Model.block_title)
              ]
          in
          S.set_silent (fun st ->
              { st with
                S.editing =
                  Some { e with S.buffer = buf ^ next.Model.block_title }
              });
          with_focus_after uuid (String.length buf)
            (Ops.apply_and_refresh ops))
  | _ -> ()

(* ---- selection ---- *)

let selected_uuids () = S.String_set.elements (S.selected ())

let flat_uuids () =
  List.filter_map
    (fun b -> b.Model.block_uuid)
    (S.flat_visible ())

let index_of lst u =
  let rec go i = function
    | x :: _ when x = u -> i
    | _ :: rest -> go (i + 1) rest
    | [] -> -1
  in
  go 0 lst

(* range anchor..head (inclusive) in visible order *)
let range_between anchor head =
  let uuids = flat_uuids () in
  let ia = index_of uuids anchor and ih = index_of uuids head in
  let lo, hi = (min ia ih, max ia ih) in
  List.filter (fun u -> index_of uuids u >= lo && index_of uuids u <= hi)
    uuids

(* extend selection one visible step from the current head *)
let extend_selection up =
  let sel = S.selected () in
  match S.anchor () with
  | None -> ()
  | Some anchor -> (
      let uuids = flat_uuids () in
      let ordered = List.filter (fun u -> S.String_set.mem u sel) uuids in
      let head =
        match (up, ordered) with
        | true, h :: _ -> Some h
        | false, _ :: _ -> Some (List.nth ordered (List.length ordered - 1))
        | _ -> None
      in
      match head with
      | None -> ()
      | Some h -> (
          let nbr =
            (if up then S.prev_visible else S.next_visible) h
          in
          match nbr with
          | None -> ()
          | Some nb -> (
              match nb.Model.block_uuid with
              | None -> ()
              | Some nu ->
                  let range = range_between anchor nu in
                  S.set (fun st ->
                      { st with
                        S.selected = S.String_set.of_list range
                      ; anchor = Some anchor
                      }))))

let select_single uuid =
  S.set (fun st ->
      { st with
        S.selected = S.String_set.singleton uuid
      ; anchor = Some uuid
      })

let select_all () =
  match flat_uuids () with
  | [] -> ()
  | first :: _ ->
      S.set (fun st ->
          { st with
            S.selected = S.String_set.of_list (flat_uuids ())
          ; anchor = Some first
          })

let clear_selection () =
  S.set (fun st ->
      { st with S.selected = S.String_set.empty; anchor = None })

(* move selection up/down one block (single-block arrow nav in normal
   mode, plain move for shift-extend callers) *)
let move_selection_focus up =
  match S.selected () |> S.String_set.elements with
  | [ cur ] -> (
      let nb =
        (if up then S.prev_visible else S.next_visible) cur
      in
      match nb with
      | Some b -> (
          match b.Model.block_uuid with
          | Some u -> select_single u
          | None -> ())
      | None -> ())
  | _ -> ()

(* ---- block structure ops ---- *)

let indent_or_outdent ~indent =
  let sel = S.selected () in
  let uuids =
    match S.editing_uuid () with
    | Some u when S.String_set.mem u sel -> S.String_set.elements sel
    | Some u -> [ u ]
    | None -> S.String_set.elements sel
  in
  match uuids with
  | [] -> ()
  | focus :: _ ->
      with_focus_after focus
        (String.length (live_buffer focus))
        (Ops.apply_and_refresh [ Ops.indent_outdent uuids indent ])

let move_blocks_up_down up =
  match selected_uuids () with
  | [] -> ()
  | uuids -> ignore (Ops.apply_and_refresh [ Ops.move_up_down uuids up ])

let delete_selection () =
  let uuids = selected_uuids () in
  match uuids with
  | [] -> ()
  | first :: _ ->
      let prev =
        match S.prev_visible first with
        | Some p -> p.Model.block_uuid
        | None -> None
      in
      S.set_silent (fun st ->
          { st with
            S.selected =
              (match prev with
              | Some u -> S.String_set.singleton u
              | None -> S.String_set.empty)
          ; anchor = prev
          });
      ignore (Ops.apply_and_refresh [ Ops.delete_blocks uuids ])

(* ---- clipboard ---- *)

let copy_selection ev =
  match selected_uuids () with
  | [] -> ()
  | uuids -> (
      match D.ev_clipboard ev with
      | Some clip ->
          let titles =
            uuids
            |> List.filter_map S.find
            |> List.map (fun b -> b.Model.block_title)
          in
          S.clipboard := titles;
          D.clipboard_set_text clip "text/plain" (String.concat "\n" titles);
          D.prevent_default ev
      | None -> ())

let cut_selection ev =
  copy_selection ev;
  delete_selection ()

let paste_lines lines =
  let blocks =
    List.map (fun l -> Ops.block_map ~title:l (Platform.random_uuid ()))
      lines
  in
  match selected_uuids () with
  | [] -> (
      (* nothing selected: append at page end *)
      match !Runtime.current_page with
      | Some p -> (
          match p.Model.page_uuid with
          | None -> ()
          | Some pu -> (
              match List.rev (S.page_blocks ()) with
              | last :: _ -> (
                  match last.Model.block_uuid with
                  | Some u ->
                      ignore
                        (Ops.apply_and_refresh
                           [ Ops.insert_blocks blocks u ~sibling:true ])
                  | None -> ())
              | [] ->
                  ignore
                    (Ops.apply_and_refresh
                       [ Ops.insert_blocks blocks pu ~sibling:false ])))
      | None -> ())
  | sel ->
      let last = List.nth sel (List.length sel - 1) in
      ignore
        (Ops.apply_and_refresh
           [ Ops.insert_blocks blocks last ~sibling:true ])

let paste_blocks ev =
  match S.editing () with
  | Some _ -> () (* textarea: default text paste, input event syncs *)
  | None -> (
      match D.ev_clipboard ev with
      | Some clip -> (
          let text = D.clipboard_get_text clip "text/plain" in
          let lines =
            String.split_on_char '\n' text
            |> List.filter (fun l -> String.trim l <> "")
          in
          match lines with
          | [] -> ()
          | _ ->
              D.prevent_default ev;
              paste_lines lines)
      | None -> ())

(* ---- misc ---- *)

let toggle_collapse uuid =
  match S.find uuid with
  | Some b when b.Model.block_children <> [] ->
      let now = not (S.is_collapsed uuid) in
      S.set (fun st ->
          { st with
            S.collapsed =
              (if now then S.String_set.add uuid st.collapsed
               else S.String_set.remove uuid st.collapsed)
          });
      ignore (Ops.apply [ Ops.collapse_expand [ (uuid, now) ] ])
  | _ -> ()

let undo () = ignore (Ops.undo ())
let redo () = ignore (Ops.redo ())

(* wrap textarea selection with a markdown marker pair *)
let wrap_selection uuid marker =
  match D.textarea_of uuid with
  | Some el ->
      let v = D.el_value el in
      let s = min (D.el_selection_start el) (D.el_selection_end el) in
      let e = max (D.el_selection_start el) (D.el_selection_end el) in
      let n = String.length v in
      let s = min s n and e = min e n in
      let nv =
        String.sub v 0 s ^ marker ^ String.sub v s (e - s) ^ marker
        ^ String.sub v e (n - e)
      in
      D.el_set_value el nv;
      D.el_set_selection_range el (s + String.length marker)
        (e + String.length marker);
      sync_buffer uuid nv
  | None -> ()

(* arrow up/down inside editor -> move edit focus to neighbor block *)
let arrow_nav uuid up =
  let nb = (if up then S.prev_visible else S.next_visible) uuid in
  match nb with
  | Some b -> (
      match b.Model.block_uuid with
      | Some nu ->
          save_if_dirty uuid;
          let caret =
            match D.textarea_of uuid with
            | Some el -> D.el_selection_start el
            | None -> 0
          in
          enter_edit nu caret
      | None -> ())
  | None -> ()

(* append a fresh block at the bottom of the current page *)
let append_block () =
  match !Runtime.current_page with
  | None -> ()
  | Some p -> (
      match p.Model.page_uuid with
      | None -> ()
      | Some puuid ->
          let new_uuid = Platform.random_uuid () in
          let target, sibling =
            match List.rev (S.page_blocks ()) with
            | last :: _ -> (
                match last.Model.block_uuid with
                | Some u -> (u, true)
                | None -> (puuid, false))
            | [] -> (puuid, false)
          in
          let stage st =
            { st with S.editing = Some { uuid = new_uuid; buffer = "" } }
          in
          (* empty page: editor state is created at the first block_row
             mount, which happens inside this op's refresh — defer the
             edit-mode entry into the initial state so the row mounts
             straight into the editor *)
          if S.ready () then S.set stage
          else S.defer_init stage;
          with_focus_after new_uuid 0
            (Ops.apply_and_refresh
               [ Ops.insert_blocks
                   [ Ops.block_map ~title:"" new_uuid ]
                   target ~sibling
               ]))

(* Meta+e quick-add: stub *)
let quick_add () = ()

(* Meta+Shift+. zoom: set the hash; router session owns navigation *)
let zoom_to uuid = Platform.set_location_hash ("#/block/" ^ uuid)
