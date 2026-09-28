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
      | _ -> st);
  (* cljs renders the buffer as the textarea's text child; keep
     textContent tracking .value (buffer writes are silent, so the
     text_signal in tree.ml never fires on keystrokes) *)
  match D.textarea_of uuid with
  | Some el -> D.el_set_text_content el v
  | None -> ()

(* retry until the textarea mounts — a slow apply+refresh can take
   longer than the fixed delays the old version used *)
let focus_attempts = ref 0

let rec apply_focus () =
  match !S.pending_focus with
  | None -> ()
  | Some (uuid, caret) -> (
      match D.textarea_of uuid with
      | Some el ->
          S.pending_focus := None;
          focus_attempts := 0;
          D.el_focus el;
          let len = String.length (D.el_value el) in
          let c = max 0 (min caret len) in
          D.el_set_selection_range el c c
      | None ->
          incr focus_attempts;
          if !focus_attempts < 50 then D.set_timeout apply_focus 40
          else (
            S.pending_focus := None;
            focus_attempts := 0))

let request_focus uuid caret =
  S.pending_focus := Some (uuid, caret);
  focus_attempts := 0;
  D.set_timeout apply_focus 0

(* set pending focus, then run [p]; re-apply focus after the flush so a
   remounted textarea still ends up focused *)
let with_focus_after uuid caret p =
  S.pending_focus := Some (uuid, caret);
  focus_attempts := 0;
  ignore
    (p
    |> Js.Promise.then_ (fun () ->
           D.set_timeout apply_focus 0;
           Js.Promise.resolve ()))

(* persisted/worker truth; display_title layers committed-but-unrefreshed
   buffers on top so exit-edit paints the saved text on the first frame *)
let model_title uuid =
  match S.find uuid with Some b -> b.Model.block_title | None -> ""

let display_title uuid = S.title_for uuid (model_title uuid)

let commit uuid buf =
  if buf <> display_title uuid then (
    S.override_title uuid buf;
    ignore (Ops.apply_and_refresh [ Ops.save_block uuid buf ]))

let save_if_dirty uuid = commit uuid (live_buffer uuid)

(* deferred blur: committing synchronously on mousedown re-renders the
   tree between mousedown and mouseup, so the browser retargets the click
   to a common ancestor and enter_edit never runs. Defer one tick; a
   click into another block runs enter_edit first (save_if_dirty commits
   the old buffer) and clears this via clear_pending_blur. *)
let pending_blur_uuid : string option ref = ref None

let clear_pending_blur () = pending_blur_uuid := None

(* ---- enter / exit ---- *)

let enter_edit ?(scope = "main") uuid caret =
  clear_pending_blur ();
  (match S.editing () with
  | Some e when e.uuid <> uuid -> save_if_dirty e.uuid
  | _ -> ());
  match S.find uuid with
      | Some _b ->
          (* stored titles are id-ref form; the edit buffer shows page names
             (cljs id-ref->title-ref) *)
          ignore
            (Ops.title_for_edit (String.trim (display_title uuid))
             |> Js.Promise.then_ (fun buffer ->
                    S.set (fun st ->
                        { st with
                          S.editing = Some { uuid; buffer; scope }
                        ; selected = S.String_set.empty
                        ; anchor = None
                        });
                    request_focus uuid caret;
                    Js.Promise.resolve ()))
  | None -> ()

let exit_edit ~select =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      (* set the override before the state change so the post-edit render
         already paints the committed text *)
      if buf <> model_title e.uuid then S.override_title e.uuid buf;
      S.set (fun st ->
          { st with
            S.editing = None
          ; selected =
              (if select then S.String_set.singleton e.uuid else st.selected)
          ; anchor = (if select then Some e.uuid else st.anchor)
          });
      commit e.uuid buf

(* click outside the editor commits without selecting *)
let blur_commit () =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      if buf <> model_title e.uuid then S.override_title e.uuid buf;
      S.set (fun st -> { st with S.editing = None });
      commit e.uuid buf

(* route change: persist the live buffer without refreshing — the
   navigation itself reloads whatever route is current *)
let flush_edit () =
  if S.ready () then
    match S.editing () with
    | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      S.set (fun st -> { st with S.editing = None });
      if buf <> model_title e.uuid then
        ignore (Ops.apply [ Ops.save_block e.uuid buf ])

let schedule_blur_commit () =
  match S.editing () with
  | None -> ()
  | Some e ->
      pending_blur_uuid := Some e.uuid;
      ignore
        (Editor_dom.set_timeout_id
          (fun () ->
            match !pending_blur_uuid with
            | Some u ->
                pending_blur_uuid := None;
                (match S.editing () with
                 | Some e' when e'.uuid = u -> blur_commit ()
                 | _ -> ())
            | None -> ())
          0)

(* ---- structure ops ---- *)

(* cljs insert-as-sibling?: every insert on the Library page lands as a
   sibling *page* — library children are always page-typed *)
let library_context () =
  match !Runtime.current_page with
  | Some p -> p.Model.page_is_library
  | None -> false

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
      let library = library_context () in
      let sibling =
        library || S.is_collapsed uuid || b.Model.block_children = []
      in
      let ops =
        [ Ops.save_block uuid before
        ; Ops.insert_blocks
            [ Ops.block_map ~title:after ~page:library new_uuid ]
            uuid ~sibling
        ]
      in
      S.set_silent (fun st ->
          { st with
            S.editing =
              Some { uuid = new_uuid; buffer = after; scope = e.scope }
          });
      with_focus_after new_uuid 0
        (Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks") ops)
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

let same_parent a_uuid b_uuid =
  match (S.find_parent a_uuid, S.find_parent b_uuid) with
  | Some (p1, _), Some (p2, _) -> (
      match (p1, p2) with
      | None, None -> true
      | Some p, Some q -> p.Model.block_uuid = q.Model.block_uuid
      | _ -> false)
  | _ -> false

(* cljs boundary-merge-allowed?: a block with children cannot merge
   across a parent boundary *)
let boundary_merge_allowed source target_uuid =
  source.Model.block_children = [] || same_parent
    (Option.value source.Model.block_uuid ~default:"")
    target_uuid

(* Backspace at caret 0: merge current into previous visible block *)
let merge_prev uuid =
  match (S.editing (), S.find uuid, S.prev_visible uuid) with
  | Some e, Some b, Some prev when e.uuid = uuid -> (
      match prev.Model.block_uuid with
      | None -> ()
      | Some prev_uuid ->
          let buf = live_buffer uuid in
          if not (boundary_merge_allowed b prev_uuid) then ()
          else if
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
            with_focus_after uuid 0
              (Ops.apply_and_refresh ~opts:(Ops.op_opts "delete-blocks") ops))
          else (
            let ops =
              move_children_ops b prev_uuid
              @ [ Ops.delete_blocks [ uuid ]
                ; Ops.save_block prev_uuid (prev.Model.block_title ^ buf)
                ]
            in
            ignore
              (Ops.title_for_edit (String.trim prev.Model.block_title)
               |> Js.Promise.then_ (fun pbuf ->
                      S.set_silent (fun st ->
                          { st with
                            S.editing =
                              Some
                                { uuid = prev_uuid
                                ; buffer = pbuf ^ buf
                                ; scope = e.scope
                                }
                          });
                      with_focus_after prev_uuid
                        (String.length pbuf)
                        (Ops.apply_and_refresh
                           ~opts:(Ops.op_opts "delete-blocks") ops);
                      Js.Promise.resolve ()))))
  | _ -> ()

(* children of b except [except_uuid] -> move under target *)
let move_children_except_ops (b : Model.block) except_uuid target_uuid =
  match
    List.filter_map
      (fun c ->
        if c.Model.block_uuid = Some except_uuid then None
        else c.Model.block_uuid)
      b.Model.block_children
  with
  | [] -> []
  | uuids -> [ Ops.move_blocks uuids target_uuid ~sibling:false ]

(* Delete at end: merge next visible block into current *)
let merge_next uuid =
  match (S.editing (), S.find uuid, S.next_visible uuid) with
  | Some e, Some b, Some next when e.uuid = uuid -> (
      match next.Model.block_uuid with
      | None -> ()
      | Some next_uuid ->
          let buf = live_buffer uuid in
          (* cljs boundary-merge-allowed?(next-block, current-block): a
             next-block with children cannot merge/delete across a parent
             boundary — gates both the empty-delete and the merge path *)
          if not (boundary_merge_allowed next uuid) then ()
          else if String.trim buf = "" then (
            (* cljs input-empty + delete-concat: the empty current block
               is deleted, its children reparented to next, next is
               edited at caret 0 *)
            let ops =
              move_children_except_ops b next_uuid next_uuid
              @ (if is_parent_of b next_uuid then
                   [ Ops.move_blocks [ next_uuid ] uuid ~sibling:true ]
                 else [])
              @ [ Ops.delete_blocks [ uuid ] ]
            in
            ignore
              (Ops.title_for_edit (String.trim next.Model.block_title)
               |> Js.Promise.then_ (fun nbuf ->
                      S.set_silent (fun st ->
                          { st with
                            S.editing =
                              Some
                                { uuid = next_uuid
                                ; buffer = nbuf
                                ; scope = e.scope
                                }
                          });
                      with_focus_after next_uuid 0
                        (Ops.apply_and_refresh
                           ~opts:(Ops.op_opts "delete-blocks") ops);
                      Js.Promise.resolve ())))
          else (
            let ops =
              move_children_ops next uuid
              @ [ Ops.delete_blocks [ next_uuid ]
                ; Ops.save_block uuid (buf ^ next.Model.block_title)
                ]
            in
            ignore
              (Ops.title_for_edit (String.trim next.Model.block_title)
               |> Js.Promise.then_ (fun nbuf ->
                      S.set_silent (fun st ->
                          { st with
                            S.editing =
                              Some { e with S.buffer = buf ^ nbuf }
                          });
                      with_focus_after uuid (String.length buf)
                        (Ops.apply_and_refresh
                           ~opts:(Ops.op_opts "delete-blocks") ops);
                      Js.Promise.resolve ()))))
  | _ -> ()

(* ---- selection ---- *)

let flat_uuids () =
  List.filter_map
    (fun b -> b.Model.block_uuid)
    (S.flat_visible ())

(* cljs sends selected blocks to move/delete ops in document order;
   String_set.elements is uuid-sorted, which corrupts worker ordering *)
let selected_uuids () =
  let sel = S.selected () in
  List.filter (fun u -> S.String_set.mem u sel) (flat_uuids ())

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
    | Some u when S.String_set.mem u sel -> selected_uuids ()
    | Some u -> [ u ]
    | None -> selected_uuids ()
  in
  match uuids with
  | [] -> ()
  | focus :: _ ->
      (* cljs expand-collapsed-indent-target!: indenting under a
         collapsed sibling expands it — clear the local collapsed
         override so the indented block stays visible *)
      if indent then
        List.iter
          (fun u ->
            match S.prev_sibling u with
            | Some s -> (
                match s.Model.block_uuid with
                | Some su ->
                    S.set_silent (fun st ->
                        { st with
                          S.collapsed = S.String_set.remove su st.S.collapsed
                        })
                | None -> ())
            | None -> ())
          uuids;
      (* outdent of a block rendered inside a page embed must move it next
         to the embed block, not inside the linked page — cljs
         get-first-block-original reads originalblockid off the ancestor
         .ls-block; the model parent is the embed block *)
      let parent_original =
        match S.find_parent focus with
        | Some (Some p, _) when p.Model.block_link <> None ->
            p.Model.block_uuid
        | _ -> None
      in
      with_focus_after focus
        (String.length (live_buffer focus))
        (Ops.apply_and_refresh
           [ Ops.indent_outdent ?parent_original uuids indent ])

let move_blocks_up_down up =
  match selected_uuids () with
  | [] -> ()
  | uuids ->
      (match !Runtime.current_page with
       | Some page ->
           let page' = Model.move_selected_top_blocks page uuids up in
           Runtime.send (Action.Page_loaded page')
       | None -> ());
      ignore (Ops.apply_and_refresh [ Ops.move_up_down uuids up ])

let delete_selection () =
  let uuids = selected_uuids () in
  match uuids with
  | [] -> ()
  | _ ->
      (* first selected in flat visible order — String_set.elements is
         sorted by uuid, not position *)
      let sel = S.selected () in
      let first =
        match
          List.find_opt (fun u -> S.String_set.mem u sel) (flat_uuids ())
        with
        | Some u -> u
        | None -> List.hd uuids
      in
      let prev =
        match S.prev_visible first with
        | Some p -> p.Model.block_uuid
        | None -> None
      in
      (* cljs enters edit mode on the previous block, caret at end *)
      (match prev with
       | Some pu -> (
           match S.find pu with
           | Some b ->
               S.set_silent (fun st ->
                   { st with
                     S.editing =
                       Some
                         { uuid = pu
                         ; buffer = String.trim b.Model.block_title
                         ; scope = "main"
                         }
                   ; selected = S.String_set.empty
                   ; anchor = None
                   });
               with_focus_after pu
                 (String.length b.Model.block_title)
                 (Ops.apply_and_refresh [ Ops.delete_blocks uuids ])
           | None ->
               ignore (Ops.apply_and_refresh [ Ops.delete_blocks uuids ]))
       | None ->
           S.set_silent (fun st ->
               { st with
                 S.selected = S.String_set.empty
               ; anchor = None
               });
           ignore (Ops.apply_and_refresh [ Ops.delete_blocks uuids ]))

(* ---- drag & drop ---- *)

(* is [uuid] nested inside [ancestor]? (walks the parent chain) *)
let rec is_descendant uuid ancestor =
  match S.find_parent uuid with
  | Some (Some p, _) -> (
      match p.Model.block_uuid with
      | Some pu -> pu = ancestor || is_descendant pu ancestor
      | None -> false)
  | _ -> false

(* cljs dnd/move-blocks: :top -> first child of the target's parent (page
   when top-level); :nested -> last child of target; :sibling -> after
   target *)
let drop_dragged_block src tgt move_to =
  if src = tgt || is_descendant tgt src then ()
  else
    match move_to with
    | "top" -> (
        let parent_uuid =
          match S.find_parent tgt with
          | Some (Some p, _) -> p.Model.block_uuid
          | _ -> (
              match !Runtime.current_page with
              | Some page -> page.Model.page_uuid
              | None -> None)
        in
        match parent_uuid with
        | Some pu ->
            ignore
              (Ops.apply_and_refresh [ Ops.move_blocks_top [ src ] pu ])
        | None -> ())
    | "nested" ->
        ignore
          (Ops.apply_and_refresh [ Ops.move_blocks [ src ] tgt ~sibling:false ])
    | _ ->
        ignore
          (Ops.apply_and_refresh [ Ops.move_blocks [ src ] tgt ~sibling:true ])

(* ---- clipboard ---- *)

let rec has_selected_ancestor sel uuid =
  match S.find_parent uuid with
  | Some (Some p, _) -> (
      match p.Model.block_uuid with
      | Some pu -> S.String_set.mem pu sel || has_selected_ancestor sel pu
      | None -> false)
  | _ -> false

let copy_selection ev =
  let sel = S.selected () in
  match selected_uuids () with
  | [] -> ()
  | uuids -> (
      match D.ev_clipboard ev with
      | Some clip ->
          (* keep only topmost selected roots — a parent tree already
             carries its children; copying child rows too would emit
             duplicate maps on paste *)
          let roots =
            List.filter
              (fun u -> not (has_selected_ancestor sel u))
              uuids
          in
          let blocks = List.filter_map S.find roots in
          S.clipboard := blocks;
          D.clipboard_set_text clip "text/plain"
            (String.concat "\n"
               (List.map (fun b -> b.Model.block_title) blocks));
          D.prevent_default ev
      | None -> ())

let cut_selection ev =
  copy_selection ev;
  delete_selection ()

let paste_trees trees target_uuid ~replace_empty =
  Ops.apply_and_refresh ~opts:(Ops.op_opts "paste")
    [ Ops.paste_trees trees target_uuid ~replace_empty ]

let paste_lines lines =
  let library = library_context () in
  let blocks =
    List.map
      (fun l -> Ops.block_map ~title:l ~page:library (Platform.random_uuid ()))
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

(* in-editor paste of copied/cut block trees: insert after the current
   block, replacing it when it is empty (cljs :replace-empty-target?) —
   undo restores the empty block via the inverse ops *)
let paste_into_editor ev =
  match (S.editing (), !(S.clipboard)) with
  | Some e, (_ :: _ as trees) -> (
      match S.find e.uuid with
      | Some b ->
          D.prevent_default ev;
          let replace_empty =
            String.trim b.Model.block_title = ""
            && String.trim e.S.buffer = ""
          in
          ignore
            (paste_trees trees e.uuid ~replace_empty
            |> Js.Promise.then_ (fun () ->
                   (* replace-empty swaps the editing block's entity
                      in place (same uuid, new title) — resync the live
                      textarea buffer so it doesn't mask the pasted
                      content *)
                   if replace_empty then Ops.resync_open_editor ();
                   Js.Promise.resolve ()))
      | None -> ())
  | _ -> ()

let paste_blocks ev =
  match S.editing () with
  | Some _ -> paste_into_editor ev
  | None -> (
      match !(S.clipboard) with
      | _ :: _ as trees -> (
          match selected_uuids () with
          | _ :: _ as sel ->
              ignore
                (paste_trees trees
                   (List.nth sel (List.length sel - 1))
                   ~replace_empty:false)
          | [] -> ())
      | [] -> (
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
          | None -> ()))

(* ---- misc ---- *)

let toggle_collapse uuid =
  match S.find uuid with
  | Some b when S.children_of b <> [] ->
      if b.Model.block_default_collapsed && not (S.is_collapsed uuid) then
        (* view-default collapse (page child on a non-Library page): a
           click expands it locally without persisting — cljs
           temp-collapsed? takes precedence over the default *)
        S.set (fun st ->
            { st with
              S.expanded = S.String_set.add uuid st.expanded
            })
      else
        let now = not (S.effective_collapsed b) in
        S.set (fun st ->
            { st with
              S.collapsed =
                (if now then S.String_set.add uuid st.collapsed
                 else S.String_set.remove uuid st.collapsed)
            ; S.expanded = S.String_set.remove uuid st.expanded
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
      D.el_set_text_content el nv;
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

(* append a fresh block at the bottom of the current page — or, on
   journals, at the bottom of the journal item the add-button lives in
   (its parentblockid attr carries the page uuid) *)
let append_block ?for_page () =
  let page =
    match for_page with
    | Some u -> (
        match !Runtime.current_journals with
        | js ->
            List.find_opt
              (fun (p : Model.page) -> p.Model.page_uuid = Some u)
              js)
    | None -> !Runtime.current_page
  in
  let page =
    match page, !Runtime.current_page with
    | Some _ as p, _ -> p
    | None, p -> p
  in
  match page with
  | None -> ()
  | Some p -> (
      match p.Model.page_uuid with
      | None -> ()
      | Some puuid ->
          let new_uuid = Platform.random_uuid () in
          let target, sibling =
            match List.rev p.Model.page_blocks with
            | last :: _ -> (
                match last.Model.block_uuid with
                | Some u -> (u, true)
                | None -> (puuid, false))
            | [] -> (puuid, false)
          in
          let stage st =
            { st with
              S.editing =
                Some { uuid = new_uuid; buffer = ""; scope = "main" }
            }
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
                   [ Ops.block_map ~title:"" ~page:p.Model.page_is_library
                       new_uuid
                   ]
                   target ~sibling
               ]))

(* Meta+e quick-add: stub *)
let quick_add () = ()

(* Meta+Shift+. zoom: cljs keeps the zoomed block in edit mode across the
   redirect (state/set-editing-block-id! before redirect-to-page!) *)
let pending_zoom : string option ref = ref None

let zoom_to uuid =
  pending_zoom := Some uuid;
  Platform.set_location_hash (Runtime.nav_hash ("#/block/" ^ uuid))

let consume_pending_zoom () =
  let z = !pending_zoom in
  pending_zoom := None;
  z
