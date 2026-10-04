(* Block-editor behaviors: enter/exit edit mode, split/merge, indent,
   move, selection, clipboard, undo. All mutations flow through
   Outliner_ops (apply-outliner-ops) followed by a page refresh. *)

module S = Editor_state
module D = Editor_dom
module Ops = Outliner_ops

let ( let* ) p f = Js.Promise.then_ f p

(* ---- buffer + focus ---- *)

let live_buffer uuid =
  (* code-fence blocks edit inside a mounted CodeMirror — its doc, not
     the hidden textarea, holds the live value *)
  match !(S.code_buffer_of) uuid with
  | Some v -> v
  | None -> (
      match D.textarea_of uuid with
      | Some el -> D.el_value el
      | None -> (
          match S.editing () with
          | Some e when e.uuid = uuid -> e.buffer
          | _ -> ""))

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

(* replay keys queued while the textarea was remounting — the refreshed
   model (and the new textarea) exist by the time focus lands *)
let run_pending_focus_actions () =
  (* replay one queued key per focus landing: a replayed nav/structural
     op re-enters edit mode asynchronously (enter_edit awaits the title
     ref before updating S.editing), so running the whole batch at once
     applies follow-up keys against the stale editing block — leave the
     rest for the pending_focus cycle the replay re-arms *)
  match List.rev !S.pending_focus_actions with
  | f :: rest -> S.pending_focus_actions := List.rev rest; f ()
  | [] -> ()

(* drain the queue at keypress cadence instead of waiting for DOM
   landings: a queued op doesn't need the landed textarea — it reads
   S.editing/model state — and deferring its outliner op until a landing
   lets same-task readers (e2e asserts, plugin api calls) query the
   worker before the op even reaches it. Chained ops still can't run
   synchronously back-to-back (a replayed nav re-enters edit mode
   asynchronously), so after popping one, schedule the next for the
   first moment the editing uuid has moved — polling briefly so a
   same-uuid op (indent) doesn't stall the rest of the queue *)
let rec drain_pending_focus_actions attempts =
  match !S.pending_focus_actions with
  | [] -> ()
  | _ -> (
      let before = S.editing_uuid () in
      run_pending_focus_actions ();
      match !S.pending_focus_actions with
      | [] -> ()
      | _ ->
          ignore
            (let* () = Js.Promise.resolve () in
             if S.editing_uuid () <> before then
               drain_pending_focus_actions 0
             else if attempts < 20 then
               D.set_timeout
                 (fun () -> drain_pending_focus_actions (attempts + 1))
                 10;
             Js.Promise.resolve ()))

(* the dom id of the el el_focus was last sent for — re-emitting the op
   every retry saturates the host's op queue while the focus event still
   hasn't had a turn, which is exactly what keeps ae from resolving *)
let last_focus_emitted : string option ref = ref None

let rec apply_focus () =
  (* a stale retry timer can fire after its arm was consumed or replaced;
     queued keys belong to the next landing, not the void — replay them
     against the live editing state instead of dropping the presses *)
  match !S.pending_focus with
  | None -> drain_pending_focus_actions 0
  | Some (uuid, caret, armed_ms) -> (
      if !(S.code_focus) ~caret uuid then (
        (* CodeMirror-backed code block: cm.focus() + setCursor landed *)
        S.pending_focus := None;
        focus_attempts := 0;
        last_focus_emitted := None;
        drain_pending_focus_actions 0)
      else
      match D.textarea_of uuid with
      | Some el -> (
          D.autosize_textarea el;
          (* emit the focus op once per target: the host applies it when
             the element materializes, so re-emitting just floods the
             main-thread queue — each op costs a render invalidation *)
          let key = D.el_dom_id el in
          if key <> !last_focus_emitted then begin
            D.el_focus el;
            last_focus_emitted := key
          end;
          (* a pending apply+refresh can still replace this node after
             landing — only consume the pending state once the element
             really holds focus; otherwise keep retrying so the remounted
             editor gets it *)
          match D.active_element () with
          | Some ae when ae == el ->
              S.pending_focus := None;
              focus_attempts := 0;
              last_focus_emitted := None;
              (* a landing that ran late (remount during a remote-tx
                 refresh) must not stomp the caret: if the user typed
                 since this focus was requested, the stored caret is
                 stale — keep where the DOM put it *)
              if !S.last_edit_input_ms <= armed_ms then (
                let len = String.length (D.el_value el) in
                let c = max 0 (min caret len) in
                D.el_set_selection_range el c c);
              drain_pending_focus_actions 0
          | ae ->
              prerr_endline
                ("PERF focus-retry t="
                 ^ string_of_float (Platform.date_now_ms () /. 1000.)
                 ^ " uuid=" ^ uuid ^ " ae="
                 ^ (match ae with
                    | Some _ -> "some(other)"
                    | None -> "none"));
              flush stderr;
              retry_focus ())
      | None -> retry_focus ())

and retry_focus () =
  incr focus_attempts;
  if !focus_attempts < 50 then begin
    (* the editing row can sit outside the virtual window — a scroll
       jump (Home/End, a remount, an insert below the viewport edge)
       unmounts it and focus retries would spin forever on a textarea
       that can't render. Pulling its item key back into the rendered
       range remounts the row so focus can land *)
    if !focus_attempts = 1 || !focus_attempts mod 10 = 5 then
      (match !S.pending_focus with
       | Some (u, _, _) ->
           !(S.scroll_key_into_view) (S.top_level_uuid u)
       | None -> ());
    D.set_timeout apply_focus 40
  end
  else (
    S.pending_focus := None;
    focus_attempts := 0;
    last_focus_emitted := None;
    drain_pending_focus_actions 0)

let request_focus uuid caret =
  S.pending_focus := Some (uuid, caret, !S.last_edit_input_ms);
  (* pending_focus_actions intentionally kept: keys queued during the
     remount window belong to the next focus landing as well *)
  focus_attempts := 0;
  D.set_timeout apply_focus 0

(* set pending focus, then run [p]; re-apply focus after the flush so a
   remounted textarea still ends up focused *)
let with_focus_after uuid caret p =
  S.pending_focus := Some (uuid, caret, !S.last_edit_input_ms);
  focus_attempts := 0;
  (* start polling now — the refreshed row can mount before [p] fully
     resolves (property-area and refs refetches trail the repaint), and
     apply_focus is idempotent until the textarea exists *)
  D.set_timeout apply_focus 0;
  ignore
    (let* () = p in
    D.set_timeout apply_focus 0;
    Js.Promise.resolve ())

(* persisted/worker truth; display_title layers committed-but-unrefreshed
   buffers on top so exit-edit paints the saved text on the first frame *)
let model_title uuid =
  match S.find uuid with Some b -> b.Model.block_title | None -> ""

let display_title uuid = S.title_for uuid (model_title uuid)

let commit uuid buf =
  (* compare against the persisted title, not display_title — the
     override may already hold buf (exit_edit sets it first) and
     normalization (heading strip, ref rewrite) can make the saved
     title differ from the buffer *)
  if buf <> model_title uuid then (
    S.override_title uuid (Ops.normalized_title uuid buf);
    ignore
      (let* sops = Ops.save_block_parsed uuid buf in
      let* _ = Ops.apply_and_refresh sops in
      (* the buffer is now persisted — advance base so the undo
                resync gate treats it as clean and can restore reverted
                titles instead of masking them with the pre-undo text *)
      S.set_silent (fun st ->
          match st.S.editing with
          | Some e when e.S.uuid = uuid && e.S.buffer = buf ->
              { st with
                S.editing = Some { e with S.base = buf } }
          | _ -> st);
      Js.Promise.resolve ()))

let save_if_dirty uuid = commit uuid (live_buffer uuid)

(* deferred blur: committing synchronously on mousedown re-renders the
   tree between mousedown and mouseup, so the browser retargets the click
   to a common ancestor and enter_edit never runs. Defer one tick; a
   click into another block runs enter_edit first (save_if_dirty commits
   the old buffer) and clears this via clear_pending_blur. *)
let pending_blur_uuid : string option ref = ref None

let clear_pending_blur () = pending_blur_uuid := None

(* the marked container region ([data-cid]) containing an element —
   "main" when the target isn't inside one (page blocks are the default
   surface); scope keys the per-container editing entry *)
let scope_of_el el =
  match D.closest_sel "[data-cid]" (Some el) with
  | Some host -> (
      match D.el_get_attr host "data-cid" with
      | Some c -> c
      | None -> "main")
  | None -> "main"

let scope_of_uuid uuid =
  match D.get_element_by_id ("ls-block-" ^ uuid) with
  | Some el -> scope_of_el el
  | None -> "main"

let enter_edit ?scope uuid caret =
  let scope =
    match scope with Some sc -> sc | None -> scope_of_uuid uuid
  in
  clear_pending_blur ();
  (* single editing surface (cljs): a block editor opening commits any
     open property-value editor first *)
  !(S.close_property_editor) ();
  (match S.editing () with
  | Some e when e.uuid <> uuid -> save_if_dirty e.uuid
  | _ -> ());
  match S.find uuid with
      | Some _b ->
          (* stored titles are id-ref form; the edit buffer shows page names
             (cljs id-ref->title-ref) *)
          ignore
            (let* buffer = Ops.title_for_edit (String.trim (display_title uuid)) in
            S.set (fun st ->
                { st with
                  S.editing = Some { uuid; buffer; scope; base = buffer }
                ; selected = S.String_set.empty
                ; anchor = None
                ; action_bar = false
                });
            request_focus uuid caret;
            Js.Promise.resolve ())

  | None -> ()

(* block that was under edit most recently — cljs keeps state/editing
   until another edit starts; our mousedown-blur commits earlier, so
   context commands (e.g. Add comment via cmdk) still need the block *)
let last_edit_uuid : string option ref = ref None

(* leaving edit mode cancels both a pending refocus and the editing
   keys queued behind it *)
let cancel_pending_focus () =
  S.pending_focus := None;
  S.pending_focus_actions := []

let exit_edit ~select =
  if S.ready () then
    match S.editing () with
    | None -> ()
    | Some e ->
        last_edit_uuid := Some e.uuid;
        cancel_pending_focus ();
      let buf = live_buffer e.uuid in
      (* set the override before the state change so the post-edit render
         already paints the committed text *)
      if buf <> model_title e.uuid then
        S.override_title e.uuid (Ops.normalized_title e.uuid buf);
      S.set (fun st ->
          { st with
            S.editing = None
          ; selected =
              (if select then S.String_set.singleton e.uuid else st.selected)
          ; anchor = (if select then Some e.uuid else st.anchor)
            (* cljs: Escape selects the block but does not raise the
               selection action bar — only a pointerup / shift-arrow does *)
          ; action_bar = false
          });
      commit e.uuid buf

(* click outside the editor commits without selecting *)
let blur_commit () =
  match S.editing () with
  | None -> ()
  | Some e ->
      last_edit_uuid := Some e.uuid;
      cancel_pending_focus ();
      let buf = live_buffer e.uuid in
      if buf <> model_title e.uuid then
        S.override_title e.uuid (Ops.normalized_title e.uuid buf);
      S.set (fun st -> { st with S.editing = None });
      commit e.uuid buf

(* route change: persist the live buffer without refreshing — the
   navigation itself reloads whatever route is current *)
let flush_edit () =
  if S.ready () then
    match S.editing () with
    | None -> ()
  | Some e ->
      cancel_pending_focus ();
      let buf = live_buffer e.uuid in
      S.set (fun st -> { st with S.editing = None });
      if buf <> model_title e.uuid then
        ignore
          (let* sops = Ops.save_block_parsed e.uuid buf in
           Ops.apply sops)

(* property value cells open their own inline editor — entering one
   exits block editing just like a click into another block *)
let () = S.close_block_editor := blur_commit

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

(* Enter on an empty ordered-list block just removes its list marker
   (cljs remove-block-own-order-list-type!); the block keeps editing *)
let drop_own_order_list uuid buf parent_ordered =
  String.trim buf = "" && not parent_ordered
  && (match S.find uuid with
      | Some b -> b.Model.block_order_list <> None
      | None -> false)

(* cljs insert-as-sibling?: every insert on the Library page lands as a
   sibling *page* — library children are always page-typed *)
let library_context () =
  match !Runtime.current_page with
  | Some p -> p.Model.page_is_library
  | None -> false

(* cljs keydown-new-block: Enter on an empty last child outdents it
   instead of inserting a sibling (when no right sibling exists) *)
let outdent_empty_last_child uuid e b =
  let _ = (e, b) in
  if String.trim (live_buffer uuid) <> "" then false
  else
    match S.find_parent uuid with
    | Some (Some parent, idx) ->
        let last = List.length parent.Model.block_children - 1 in
        if idx < last then false
        else (
          ignore (Ops.apply_and_refresh [ Ops.indent_outdent [ uuid ] false ]);
          true)
    | _ -> false
let split_at_cursor uuid =
  match (S.editing (), S.find uuid) with
  | Some e, Some b when e.uuid = uuid && outdent_empty_last_child uuid e b ->
      ()
  | Some e, Some b when e.uuid = uuid ->
      let buf, pos =
        match D.textarea_of uuid with
        | Some el -> (D.el_value el, D.el_selection_start el)
        | None -> (e.buffer, String.length e.buffer)
      in
      let parent_ordered =
        match S.find_parent uuid with
        | Some (Some p, _) -> p.Model.block_order_list <> None
        | _ -> false
      in
      if drop_own_order_list uuid buf parent_ordered then (
        ignore
          (Ops.apply_and_refresh
             [ Ops.remove_block_property uuid
                 "logseq.property/order-list-type" ]);
        request_focus uuid 0)
      else
        let pos = max 0 (min pos (String.length buf)) in
        let before = String.sub buf 0 pos in
        let after = String.sub buf pos (String.length buf - pos) in
        let new_uuid = Platform.random_uuid () in
        let library = library_context () in
        let sibling =
          library || S.is_collapsed_in ~scope:e.S.scope uuid
          || b.Model.block_children = []
        in
        let p =
          (let* a =
            Js.Promise.all
              [| Ops.block_map_parsed uuid before
               ; Ops.block_map_parsed ~page:library new_uuid after |]
          in
          Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks")
            [ Ops.op "save-block" [ a.(0); Wire.Map [] ]
            ; Ops.insert_blocks [ a.(1) ] uuid ~sibling ])
        in
        (* optimistic insert: mount the new row and retitle the split
           block synchronously — the worker delta splices the real
           record over the placeholder when it lands *)
        (match !Runtime.current_page with
         | Some page -> (
             match
               Model.split_insert page ~uuid ~before
                 ~new_block:
                   (Model.empty_block ~uuid:new_uuid ~title:after
                      ~is_page:library)
                 ~sibling
             with
             | Some page' ->
                 Page_delta.mark_own_commit page';
                 Runtime.push_page_items page';
                 Runtime.send (Action.Page_loaded page')
             | None -> ())
         | None -> ());
        (* the exit-edit repaint lands before the worker delta — pin the
           saved title so the row doesn't flash the pre-split text *)
        S.override_title uuid (Ops.normalized_title uuid before);
        (* S.set (not silent): the old textarea must unmount before the
           next keypress, or keystrokes keep landing in the stale editor *)
        S.set (fun st ->
            { st with
              S.editing =
                Some { uuid = new_uuid; buffer = after; scope = e.scope; base = after } });
        with_focus_after new_uuid 0 p
  | _ -> ()

(* shift+Enter on a code surface (or any non-splitting editor) appends a
   fresh sibling after the block — cljs insert-new-block! *)
let insert_sibling_after uuid =
  match (S.editing (), S.find uuid) with
  | Some e, Some b when e.uuid = uuid ->
      let buf = live_buffer uuid in
      let new_uuid = Platform.random_uuid () in
      let library = library_context () in
      let sibling =
        library || S.is_collapsed_in ~scope:e.S.scope uuid
        || b.Model.block_children = []
      in
      let p =
        (let* m = Ops.block_map_parsed uuid buf in
        Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks")
          [ Ops.op "save-block" [ m; Wire.Map [] ]
          ; Ops.insert_blocks
              [ Ops.block_map ~title:"" ~page:library new_uuid ]
              uuid ~sibling ])
      in
      (match !Runtime.current_page with
       | Some page -> (
           match
             Model.split_insert page ~uuid ~before:buf
               ~new_block:
                 (Model.empty_block ~uuid:new_uuid ~title:""
                    ~is_page:library)
               ~sibling
           with
           | Some page' ->
               Page_delta.mark_own_commit page';
               Runtime.push_page_items page';
               Runtime.send (Action.Page_loaded page')
           | None -> ())
       | None -> ());
      (* the exit-edit repaint lands before the worker delta — pin the
         saved title so the row doesn't flash the stale title *)
      S.override_title uuid (Ops.normalized_title uuid buf);
      (* S.set (not silent): the old textarea must unmount before the
         next keypress, or keystrokes keep landing in the stale editor *)
      S.set (fun st ->
          { st with
            S.editing =
              Some { uuid = new_uuid; buffer = ""; scope = e.scope; base = "" }
          });
      with_focus_after new_uuid 0 p  | _ -> ()

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
  match
    ( S.editing ()
    , S.find uuid
    , S.prev_visible ~scope:(match S.editing () with Some e -> e.scope | None -> "main") uuid )
  with
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
            S.set (fun st ->
                { st with S.editing = Some { e with S.buffer = buf } });
            with_focus_after uuid 0
              (Ops.apply_and_refresh ~opts:(Ops.op_opts "delete-blocks") ops))
          else (
            (* title_for (override ?? model): prev's commit may still be
               in flight — the debounced save's delta only lands with
               this op, and the model title would drop typed text *)
            let ptitle = S.title_for prev_uuid prev.Model.block_title in
            (* the merged-away row repaints before the delete lands — pin
               its live buffer so it doesn't flash the stale title *)
            S.override_title uuid (Ops.normalized_title uuid buf);
            ignore
              (let* sops =
                 Ops.save_block_parsed prev_uuid (ptitle ^ buf)
               in
               let ops =
                 move_children_ops b prev_uuid
                 @ (Ops.delete_blocks [ uuid ] :: sops)
               in
               let* pbuf = Ops.title_for_edit (String.trim ptitle) in
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        { uuid = prev_uuid
                        ; buffer = pbuf ^ buf
                        ; scope = e.scope
                        ; base = pbuf ^ buf
                        }
                  });
              with_focus_after prev_uuid
                (String.length pbuf)
                (Ops.apply_and_refresh
                   ~opts:(Ops.op_opts "delete-blocks") ops);
              Js.Promise.resolve ())))
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
  match
    ( S.editing ()
    , S.find uuid
    , S.next_visible ~scope:(match S.editing () with Some e -> e.scope | None -> "main") uuid )
  with
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
            (* the row repaints before the delete lands — pin its live
               (empty) buffer so it doesn't flash the stale title *)
            S.override_title uuid (Ops.normalized_title uuid buf);
            ignore
              (let* nbuf =
                 Ops.title_for_edit
                   (String.trim
                      (S.title_for next_uuid next.Model.block_title))
               in
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        { uuid = next_uuid
                        ; buffer = nbuf
                        ; scope = e.scope
                        ; base = nbuf
                        }
                  });
              with_focus_after next_uuid 0
                (Ops.apply_and_refresh
                   ~opts:(Ops.op_opts "delete-blocks") ops);
              Js.Promise.resolve ()))          else (
            let ops =
              move_children_ops next uuid @ [ Ops.delete_blocks [ next_uuid ] ]

            in
            ignore
              (let* nbuf =
                 Ops.title_for_edit
                   (String.trim
                      (S.title_for next_uuid next.Model.block_title))
               in
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        { e with
                          S.buffer = buf ^ nbuf
                        ; base = buf ^ nbuf
                        }
                  });
              with_focus_after uuid (String.length buf)
                (Ops.apply_parsed_and_refresh
                   ~opts:(Ops.op_opts "delete-blocks") ~rest:ops
                   [ (uuid, buf ^ nbuf) ]);
              Js.Promise.resolve ())))  | _ -> ()

(* ---- selection ---- *)

let flat_uuids () =
  List.filter_map
    (fun b -> b.Model.block_uuid)
    (S.flat_visible ~scope:"main" ())

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

(* the page-title row is a selectable .ls-block that sits above every
   block without being part of the flat list — a selection anchored on
   it extends down into the blocks *)
let anchor_is_page_title anchor =
  match
    D.query_selector (".ls-page-title .ls-block[blockid='" ^ anchor ^ "']")
  with
  | Some _ -> true
  | None -> false

(* range anchor..head (inclusive) in visible order; [] when either
   endpoint isn't a visible block (e.g. a journal row's page uuid from a
   co-mounted virt list extending on the same scroller) *)
let range_between anchor head =
  let uuids = flat_uuids () in
  let ia = index_of uuids anchor and ih = index_of uuids head in
  if ia >= 0 && ih >= 0 then
    let lo, hi = (min ia ih, max ia ih) in
    List.filteri (fun i _ -> i >= lo && i <= hi) uuids
  else if ia < 0 && ih >= 0 && anchor_is_page_title anchor then
    anchor :: List.filteri (fun i _ -> i <= ih) uuids
  else []

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
      | None -> (
          (* only the title row selected: ArrowDown enters the block
             list from the top *)
          match (up, uuids) with
          | false, first :: _ when anchor_is_page_title anchor ->
              let range = range_between anchor first in
              S.set (fun st ->
                  { st with
                    S.selected = S.String_set.of_list range
                  ; anchor = Some anchor
                  ; action_bar = true
                  })
          | _ -> ())
      | Some h -> (
          let nbr =
            (if up
             then S.prev_visible ~scope:"main"
             else S.next_visible ~scope:"main")
              h
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
                      ; action_bar = true
                      }))))

let select_single uuid =
  S.set (fun st ->
      { st with
        S.selected = S.String_set.singleton uuid
      ; anchor = Some uuid
      ; action_bar = false
      })

(* shift+click: select the flat-order range from the current anchor
   (or the editing block, committed) through the clicked block *)
let select_range_to uuid =
  (match S.editing () with
   | Some _ -> exit_edit ~select:true
   | None -> ());
  match S.anchor () with
  | Some anchor -> (
      match range_between anchor uuid with
      | [] -> ()
      | range ->
          S.set (fun st ->
              { st with
                S.selected = S.String_set.of_list range
              ; anchor = Some anchor
              ; action_bar = true
              }))
  | None -> select_single uuid

let select_all () =
  match flat_uuids () with
  | [] -> ()
  | first :: _ ->
      S.set (fun st ->
          { st with
            S.selected = S.String_set.of_list (flat_uuids ())
          ; anchor = Some first
          ; action_bar = false
          })

let clear_selection () =
  S.set (fun st ->
      { st with
        S.selected = S.String_set.empty
      ; anchor = None
      ; action_bar = false
      })

(* cljs editor-handler/show-action-bar!: pointer gestures and
   shift+arrow selection raise the popover; bare selection changes
   (Escape, mod+a, click-clear) leave it hidden *)
let show_action_bar () =
  S.set (fun st -> { st with S.action_bar = true })

let hide_action_bar () =
  S.set (fun st -> { st with S.action_bar = false })

(* shift+arrow arriving during the pending-focus window replays here once
   focus lands: exit edit into selection, then extend one visible step *)
let shift_arrow_select up =
  match S.editing () with
  | Some _ ->
      exit_edit ~select:true;
      show_action_bar ()
  | None -> extend_selection up

(* cljs editor/select-parent: with a selection, move it to the first
   block's parent (all blocks when the parent is the page); without one,
   select all blocks *)
let select_parent () =
  match selected_uuids () with
  | u :: _ -> (
      match S.find_parent u with
      | Some (Some p, _) -> (
          match p.Model.block_uuid with
          | Some pu -> select_single pu
          | None -> select_all ())
      | _ -> select_all ())
  | [] -> select_all ()
(* move selection up/down one block (single-block arrow nav in normal
   mode, plain move for shift-extend callers) *)
let move_selection_focus up =
  match S.selected () |> S.String_set.elements with
  | [ cur ] -> (
      let nb =
        (if up
         then S.prev_visible ~scope:"main"
         else S.next_visible ~scope:"main")
          cur
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
                        S.collapsed_ui_transform ~scope:"main" su
                          false
                          { st with
                            S.collapsed =
                              S.String_set.remove su st.S.collapsed
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
      (* optimistic local reparent: the DOM moves in this task instead of
         remounting when the async worker refresh lands (e2e boundingBox
         races that remount). Worker refresh stays authoritative. *)
      (match !Runtime.current_page, parent_original with
       | Some page, None -> (
           match
             (if indent then Model.indent_blocks else Model.outdent_blocks)
               page uuids
           with
           | Some page' ->
               Page_delta.mark_own_commit page';
               Runtime.push_page_items page';
               Runtime.send (Action.Page_loaded page')
           | None -> ())
       | _ -> ());
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
           Page_delta.mark_own_commit page';
           Runtime.push_page_items page';
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
        match S.prev_visible ~scope:"main" first with
        | Some p -> p.Model.block_uuid
        | None -> None
      in
      (* cljs enters edit mode on the previous block, caret at end *)
      (match prev with
       | Some pu -> (
           match S.find pu with
           | Some b ->
               (* stored titles are id-ref form — go through the same
                  title_for_edit rewrite as enter_edit *)
               ignore
                 (let* buffer = Ops.title_for_edit (String.trim b.Model.block_title) in
                 S.set_silent (fun st ->
                     { st with
                       S.editing =
                         Some
                           { uuid = pu; buffer; scope = "main"
                           ; base = buffer
                           }
                     ; selected = S.String_set.empty
                     ; anchor = None
                     ; action_bar = false
                     });
                 with_focus_after pu
                   (String.length buffer)
                   (Ops.apply_and_refresh
                      [ Ops.delete_blocks uuids ]);
                 Js.Promise.resolve ())
           | None ->
               ignore (Ops.apply_and_refresh [ Ops.delete_blocks uuids ]))
       | None ->
           S.set_silent (fun st ->
               { st with
                 S.selected = S.String_set.empty
               ; anchor = None
               ; action_bar = false
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
          | Some (None, _) -> (
              (* top-level block: the parent is the containing page —
                 journals views keep their pages in current_journals
                 instead of current_page *)
              match !Runtime.current_page with
              | Some page -> page.Model.page_uuid
              | None ->
                  List.find_map
                    (fun (p : Model.page) ->
                      if
                        List.exists
                          (fun (b : Model.block) ->
                            b.Model.block_uuid = Some tgt)
                          p.Model.page_blocks
                      then p.Model.page_uuid
                      else None)
                    !Runtime.current_journals)
          | None -> None
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

(* export-blocks-as-markdown shape: every title of every selected root
   tree, children flattened with two-space indentation *)
let export_titles blocks =
  let buf = Buffer.create 256 in
  let rec go depth (b : Model.block) =
    for _ = 1 to depth do
      Buffer.add_string buf "  "
    done;
    Buffer.add_string buf "- ";
    Buffer.add_string buf b.Model.block_title;
    Buffer.add_string buf "\n";
    List.iter (go (depth + 1)) b.Model.block_children
  in
  List.iter (go 0) blocks;
  Buffer.contents buf

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
          S.clipboard_text := export_titles blocks;
          D.clipboard_set_text clip "text/plain" !(S.clipboard_text);
          D.prevent_default ev
      | None -> ())

let cut_selection ev =
  copy_selection ev;
  delete_selection ()

(* palette-invoked copy: no copy event, so write the system clipboard
   directly; same topmost-roots reduction as copy_selection *)
let copy_selection_text () =
  let sel = S.selected () in
  match selected_uuids () with
  | [] -> ()
  | uuids ->
      let roots =
        List.filter (fun u -> not (has_selected_ancestor sel u)) uuids
      in
      let blocks = List.filter_map S.find roots in
      S.clipboard := blocks;
      Platform.copy_to_clipboard
        (String.concat "\n"
           (List.map (fun b -> b.Model.block_title) blocks))

(* ---- external paste (handler.paste.cljs/paste-copied-text) ----

   text/html runs through the html->markdown port (Html_to_md, the DOM
   equivalent of extensions/html-parser); the resulting text wins over
   plain text. A bare pasted url wraps into {{video}}/{{twitter}}.
   Block-structured text extracts into blocks worker-side; text split
   by blank lines becomes one block per paragraph; anything else is a
   plain text insert. *)

let ltrim s =
  let n = String.length s in
  let rec go i =
    if i < n && (s.[i] = ' ' || s.[i] = '\t' || s.[i] = '\r') then
      go (i + 1)
    else i
  in
  String.sub s (go 0) (n - go 0)

let starts_with s prefix =
  let lp = String.length prefix in
  String.length s >= lp && String.sub s 0 lp = prefix

let is_url s =
  let t = String.trim s in
  starts_with t "http://" || starts_with t "https://"

(* extensions/video.cljs's host set — the regexes also pin the path
   shape, but for macro-wrapping a url the host check is what matters *)
let is_video_url url =
  let s = String.lowercase_ascii (String.trim url) in
  let host =
    let s =
      if starts_with s "http://" then String.sub s 7 (String.length s - 7)
      else if starts_with s "https://" then
        String.sub s 8 (String.length s - 8)
      else s
    in
    match String.index_opt s '/' with
    | Some i -> String.sub s 0 i
    | None -> s
  in
  let host =
    List.fold_left
      (fun h p -> if starts_with h p then String.sub h (String.length p) (String.length h - String.length p) else h)
      host [ "www."; "m."; "player." ]
  in
  List.mem host
    [ "youtube.com"; "youtu.be"; "y2u.be"; "youtube-nocookie.com"
    ; "bilibili.com"; "vimeo.com" ]

let wrap_macro_url url =
  if is_video_url url then Some ("{{video " ^ url ^ "}}")
  else if starts_with url "https://twitter.com" || starts_with url "https://x.com"
  then Some ("{{twitter " ^ url ^ "}}")
  else None

(* cljs markdown-blocks?: "(^|\n)\s*(?:[-+*]|#+)\s+", a ``` fence line,
   or a $$ line makes the clipboard block-structured *)
let markdown_blocks text =
  let marker t =
    match String.length t with
    | 0 -> false
    | n -> (
        match t.[0] with
        | '-' | '+' | '*' -> n >= 2 && (t.[1] = ' ' || t.[1] = '\t')
        | '#' ->
            let hashes i = i < n && t.[i] = '#' in
            let rec count i = if hashes i then count (i + 1) else i in
            let h = count 0 in
            h >= 1 && h < n && (t.[h] = ' ' || t.[h] = '\t')
        | _ -> false)
  in
  String.split_on_char '\n' text
  |> List.exists (fun l ->
      let t = ltrim l in
      marker t || starts_with t "```" || t = "$$")

let contains_sub hay needle =
  let n = String.length hay and m = String.length needle in
  if m = 0 then true
  else
    let rec go i = i + m <= n && (String.sub hay i m = needle || go (i + 1)) in
    go 0

(* "(?:\r?\n){2,}" — a blank-line run separates pasted paragraphs *)
let has_paragraph_break text = contains_sub text "\n\n"

(* paste-segmented-text — one "- " block per paragraph *)
let segmented_markdown text =
  let acc, last =
    List.fold_left
      (fun (acc, cur) l ->
        if String.trim l = "" then
          (match cur with
           | [] -> (acc, [])
           | _ -> (List.rev cur :: acc, []))
        else (acc, l :: cur))
      ([], [])
      (String.split_on_char '\n' text)
  in
  let paragraphs =
    List.rev (match last with [] -> acc | _ -> List.rev last :: acc)
  in
  paragraphs
  |> List.filter_map (fun p ->
      let p = String.trim (String.concat "\n" p) in
      if p = "" then None
      else
        let t = ltrim p in
        if
          starts_with t "-" && String.length t >= 2
          && (t.[1] = ' ' || t.[1] = '\t')
        then Some p
        else Some ("- " ^ p))
  |> String.concat "\n"

(* the paste payload: html-converted markdown when it yields text, else
   a macro-wrapped url, else the plain text *)
let paste_source_text ~text ~html =
  (* cljs string/replace "\r\n" "\n" for Windows clipboards *)
  let text = String.concat "" (String.split_on_char '\r' text) in
  let html_md =
    match String.trim html with
    | "" -> None
    | _ -> (try Html_to_md.convert html with _ -> None)
  in
  match html_md with
  | Some s when String.trim s <> "" -> s
  | _ -> (
      if is_url text then
        match wrap_macro_url text with
        | Some m -> m
        | None -> text
      else text)

(* cljs edit-last-block-after-inserted! — after a paste, editing moves to
   the last inserted block so sequential pastes append in order *)
let edit_last_inserted resp =
  match Ops.last_inserted_uuid resp with
  | Some u -> enter_edit u (String.length (model_title u))
  | None -> ()

let paste_trees trees target_uuid ~replace_empty =
  Ops.apply_and_refresh_result ~opts:(Ops.op_opts "paste")
    [ Ops.paste_trees trees target_uuid ~replace_empty ]

(* thread-api/paste-extract-blocks + insert-blocks — the worker turns
   markdown clipboard text into preorder block maps which insert-blocks
   places after [uuid] (cljs keep-uuid? + :outliner-real-op
   :paste-text under :outliner-op :paste) *)
let paste_markdown_blocks uuid text ~replace_empty ~sibling =
  let* w =
    Runtime.invoke3 "thread-api/paste-extract-blocks"
      (Wire.String (Runtime.repo ()))
      (Wire.String text)
      (Wire.String uuid)
  in
  match w with
  | Wire.Array (_ :: _ as maps) -> (
      let* resp =
        Ops.apply_and_refresh_result ~opts:(Ops.op_opts "paste")
          [ Ops.op "insert-blocks"
              [ Wire.Array maps
              ; Wire.Uuid uuid
              ; Wire.Map
                  [ Ops.kw "sibling?" (Wire.Bool sibling)
                  ; Ops.kw "keep-uuid?" (Wire.Bool true)
                  ; Ops.kw "replace-empty-target?"
                      (Wire.Bool replace_empty)
                  ; Ops.kw "outliner-op" (Wire.Keyword "paste")
                  ; Ops.kw "outliner-real-op"
                      (Wire.Keyword "paste-text") ] ] ]
      in
      (* replace-empty swaps the editing block's entity in place — resync
         the live buffer first so edit_last_inserted's save_if_dirty
         can't commit the stale "" over the pasted title *)
      let* () =
        if replace_empty then Ops.resync_open_editor ()
        else Js.Promise.resolve ()
      in
      edit_last_inserted resp;
      Js.Promise.resolve ())
  | _ -> Js.Promise.resolve ()

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

(* splice external clipboard text into the live textarea at the cursor,
   keeping buffer, textContent (innerText/`:has-text`) and the debounced
   save in sync like on_input does *)
let splice_clipboard_text uuid el text =
  let start = D.el_selection_start el in
  let fin = max start (D.el_selection_end el) in
  let v = D.el_value el in
  let before = String.sub v 0 start in
  let after = String.sub v fin (String.length v - fin) in
  let v' = before ^ text ^ after in
  D.el_set_value el v';
  D.el_set_text_content el v';
  D.el_set_selection_range el (start + String.length text)
    (start + String.length text);
  sync_buffer uuid v';
  Ops.schedule_save uuid v'

(* in-editor paste: when the event text matches what our copy/cut wrote,
   paste the stored trees (cljs internal paste); otherwise the external
   branch — html→markdown wins over plain text, block-shaped text
   extracts into blocks, blank-line text into one block per paragraph,
   and anything else splices at the cursor *)
let paste_into_editor ev =
  let clip_text, clip_html =
    match D.ev_clipboard ev with
    | Some clip ->
        ( D.clipboard_get_text clip "text/plain"
        , D.clipboard_get_text clip "text/html" )
    | None -> ("", "")
  in
  match (S.editing (), !(S.clipboard)) with
  | Some e, (_ :: _ as trees) when clip_text = !(S.clipboard_text) -> (
      match S.find e.uuid with
      | Some b ->
          D.prevent_default ev;
          let replace_empty =
            String.trim b.Model.block_title = ""
            && String.trim e.S.buffer = ""
          in
          ignore
            (let* resp = paste_trees trees e.uuid ~replace_empty in
            (* replace-empty swaps the editing block's entity
                      in place (same uuid, new title) — resync the live
                      textarea buffer first, else edit_last_inserted's
                      save_if_dirty reads the stale "" and commits it
                      over the pasted title *)
            let* () =
              (if replace_empty then Ops.resync_open_editor ()
               else Js.Promise.resolve ())
            in
            edit_last_inserted resp;
            Js.Promise.resolve ())
      | None -> ())
  | Some e, _ -> (
      (* external paste while editing (no stored trees, or the event
         text differs from what our copy wrote) *)
      match D.textarea_of e.uuid with
      | Some el ->
          let text = paste_source_text ~text:clip_text ~html:clip_html in
          if String.trim text <> "" then (
            D.prevent_default ev;
            let text =
              if markdown_blocks text then text
              else if has_paragraph_break text then
                segmented_markdown text
              else text
            in
            if markdown_blocks text then
              let replace_empty =
                String.trim e.S.buffer = ""
                &&
                match S.find e.uuid with
                | Some b -> String.trim b.Model.block_title = ""
                | None -> false
              in
              ignore
                (paste_markdown_blocks e.uuid text ~replace_empty
                   ~sibling:true)
            else splice_clipboard_text e.uuid el text)
      | None -> ())
  | None, _ -> ()

(* text or html → the extracted-block paste path when the clipboard is
   block-shaped, else the flat per-line insert *)
let paste_external ev ~text ~html =
  let text = paste_source_text ~text ~html in
  if markdown_blocks text || has_paragraph_break text then (
    let text =
      if markdown_blocks text then text else segmented_markdown text
    in
    D.prevent_default ev;
    match selected_uuids () with
    | _ :: _ as sel ->
        ignore
          (paste_markdown_blocks
             (List.nth sel (List.length sel - 1))
             text ~replace_empty:false ~sibling:true)
    | [] -> (
        (* nothing selected: append at page end *)
        match !Runtime.current_page with
        | Some p -> (
            match List.rev (S.page_blocks ()) with
            | last :: _ -> (
                match last.Model.block_uuid with
                | Some u ->
                    ignore
                      (paste_markdown_blocks u text ~replace_empty:false
                         ~sibling:true)
                | None -> ())
            | [] -> (
                match p.Model.page_uuid with
                | Some pu ->
                    ignore
                      (paste_markdown_blocks pu text ~replace_empty:false
                         ~sibling:false)
                | None -> ()))
        | None -> ()))
  else
    let lines =
      String.split_on_char '\n' text
      |> List.filter (fun l -> String.trim l <> "")
    in
    match lines with
    | [] -> ()
    | _ ->
        D.prevent_default ev;
        paste_lines lines

let paste_blocks ev =
  match S.editing () with
  | Some _ -> paste_into_editor ev
  | None -> (
      match !(S.clipboard) with
      | _ :: _ as trees -> (
          match selected_uuids () with
          | _ :: _ as sel ->
              ignore
                (let* resp =
                  paste_trees trees
                    (List.nth sel (List.length sel - 1))
                    ~replace_empty:false
                in
                edit_last_inserted resp;
                Js.Promise.resolve ())
          | [] -> ())
      | [] -> (
          match D.ev_clipboard ev with
          | Some clip ->
              paste_external ev
                ~text:(D.clipboard_get_text clip "text/plain")
                ~html:(D.clipboard_get_text clip "text/html")
          | None -> ()))

(* ---- misc ---- *)

let toggle_collapse ?(scope = "main") uuid =
  match S.find uuid with
  | Some b when S.children_of b <> [] ->
      if b.Model.block_default_collapsed
         && not (S.is_collapsed_in ~scope uuid)
      then
        (* view-default collapse (page child on a non-Library page): a
           click expands it locally without persisting — cljs
           temp-collapsed? takes precedence over the default *)
        S.set (fun st ->
            { st with
              S.expanded_ui =
                S.String_set.add (S.collapse_key scope uuid)
                  st.S.expanded_ui
            })
      else
        let now = not (S.effective_collapsed ~scope b) in
        S.set_collapsed ~scope uuid now;
        ignore (Ops.apply [ Ops.collapse_expand [ (uuid, now) ] ])
  | _ -> ()

let set_collapsed ?(scope = "main") uuid collapsed =
  match S.find uuid with
  | Some b when S.children_of b <> [] ->
      S.set_collapsed ~scope uuid collapsed;
      ignore (Ops.apply [ Ops.collapse_expand [ (uuid, collapsed) ] ])
  | _ -> ()

(* cljs editor/expand! / collapse!: edit mode toggles the open block,
   selection toggles every selected block, and with neither it moves one
   outline level (expand = shallowest collapsed level, collapse =
   deepest expandable level) *)
let collapse_expand ~collapse () =
  let set u want =
    match S.find u with
    | Some b
      when S.children_of b <> [] && S.effective_collapsed b <> want ->
        toggle_collapse u
    | _ -> ()
  in
  match S.editing_uuid () with
  | Some u -> set u collapse
  | None -> (
      match selected_uuids () with
      | _ :: _ as us -> List.iter (fun u -> set u collapse) us
      | [] ->
          let blocks = S.flat_all () in
          let lvl (b : Model.block) = b.Model.block_level in
          if collapse then (
            let deepest =
              List.fold_left
                (fun acc b ->
                  if S.children_of b <> [] && not (S.effective_collapsed b)
                  then max acc (lvl b)
                  else acc)
                0 blocks
            in
            List.iter
              (fun (b : Model.block) ->
                if lvl b = deepest && S.children_of b <> []
                   && not (S.effective_collapsed b)
                then
                  match b.Model.block_uuid with
                  | Some u -> toggle_collapse u
                  | None -> ())
              blocks)
          else
            let shallowest =
              List.fold_left
                (fun acc b ->
                  if S.effective_collapsed b then min acc (lvl b)
                  else acc)
                max_int blocks
            in
            List.iter
              (fun (b : Model.block) ->
                if lvl b = shallowest && S.effective_collapsed b then
                  match b.Model.block_uuid with
                  | Some u -> toggle_collapse u
                  | None -> ())
              blocks)

(* cljs editor/toggle-collapse!: edit mode toggles the open block,
   selection toggles all selected by the first block's state, otherwise
   no-op *)
let toggle_children_collapse () =
  let cur =
    match S.editing_uuid () with
    | Some u -> [ u ]
    | None -> selected_uuids ()
  in
  match cur with
  | u :: us -> (
      match S.find u with
      | Some b ->
          let want = not (S.effective_collapsed b) in
          List.iter
            (fun u ->
              match S.find u with
              | Some b
                when S.children_of b <> []
                     && S.effective_collapsed b <> want ->
                  toggle_collapse u
              | _ -> ())
            (u :: us)
      | None -> ())
  | [] -> ()

(* cljs editor/toggle-open-blocks: any collapsed block -> expand all,
   else collapse all collapsible blocks *)
let toggle_open_blocks () =
  let expandable =
    List.filter
      (fun (b : Model.block) ->
        S.children_of b <> [] || S.effective_collapsed b)
      (S.flat_all ())
  in
  let collapsed = not (List.exists S.effective_collapsed expandable) in
  let pairs =
    List.filter_map
      (fun (b : Model.block) ->
        match b.Model.block_uuid with
        | Some u when S.effective_collapsed b <> collapsed ->
            Some (u, collapsed)
        | _ -> None)
      expandable
  in
  S.set (fun st ->
      { st with
        S.collapsed =
          (if collapsed then
             List.fold_left
               (fun acc (u, _) -> S.String_set.add u acc)
               st.S.collapsed pairs
           else S.String_set.empty)
      ; S.expanded = S.String_set.empty
      });
  if pairs <> [] then ignore (Ops.apply [ Ops.collapse_expand pairs ])

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
(* ArrowUp past the first block lands in the page title — cljs
   move-cross-boundary-up-down treats .ls-page-title as a block *)
let focus_page_title () =
  match D.query_selector ".ls-page-title" with
  | None -> ()
  | Some _ -> (
      Runtime.send Action.Title_edit_start;
      Runtime.flush ();
      match D.query_selector ".ls-page-title textarea" with
      | Some ta ->
          D.el_focus ta;
          let len = String.length (D.el_value ta) in
          D.el_set_selection_range ta len len
      | None -> ())

let arrow_nav uuid up =
  let scope =
    match S.editing () with Some e -> e.scope | None -> "main"
  in
  let nb =
    (if up
     then S.prev_visible ~scope
     else S.next_visible ~scope)
      uuid
  in
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
  | None -> if up then (exit_edit ~select:false; focus_page_title ())

(* append a fresh block at the bottom of the current page — or, on
   journals, at the bottom of the journal item the add-button lives in
   (its parentblockid attr carries the page uuid) *)
let append_block ?for_page ?(scope = "main") () =
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
                Some { uuid = new_uuid; buffer = ""; scope; base = "" }
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

(* ---------- quick add (Meta+e, components/quick_add.cljs) ---------- *)

let quick_add_page_title = "Quick add"

let fetch_qa_blocks repo puuid =
  let* w =
    Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
      (Wire.Uuid puuid) Wire.Nil
  in
  Js.Promise.resolve (Decode.blocks_of_wire w)

(* dialog mounted + blocks loaded: open the last block for editing *)
let quick_add_open_dialog puuid blocks =
  Quick_add_state.set (fun _ ->
      { Quick_add_state.page_uuid = Some puuid; blocks });
  Dialogs_state.open_ "quick-add";
  match List.rev blocks with
  | last :: _ -> (
      match last.Model.block_uuid with
      | Some u ->
          let caret = String.length (String.trim last.Model.block_title) in
          if S.ready () then enter_edit ~scope:"quick-add" u caret
          else (
            S.defer_init (fun st ->
                { st with
                  S.editing =
                    Some
                      { uuid = u
                      ; buffer = String.trim last.Model.block_title
                      ; scope = "quick-add"
                      ; base = String.trim last.Model.block_title
                      }
                });
            S.pending_focus := Some (u, caret, !S.last_edit_input_ms))
      | None -> ())
  | [] -> ()

(* cljs show-quick-add: ensure an empty block exists on the "Quick add"
   page, then open the dialog *)
let open_quick_add () =
  match !Runtime.current_repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* page_w =
          Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
            (Wire.String quick_add_page_title)
        in
        match Decode.page_of_summary page_w with
        | None -> Js.Promise.resolve ()
        | Some page -> (
            match page.Model.page_uuid with
            | None -> Js.Promise.resolve ()
            | Some puuid ->
                (let* blocks = fetch_qa_blocks repo puuid in
                match blocks with
                | _ :: _ ->
                    quick_add_open_dialog puuid blocks;
                    Js.Promise.resolve ()
                | [] ->
                    let nu = Platform.random_uuid () in
                    let* () =
                      Ops.apply
                        ~opts:(Ops.op_opts "insert-blocks")
                        [ Ops.insert_blocks
                            [ Ops.block_map ~title:"" nu ]
                            puuid ~sibling:false ]
                    in
                    let* blocks = fetch_qa_blocks repo puuid in
                    quick_add_open_dialog
                      puuid blocks;
                    Js.Promise.resolve ())))

(* move every "Quick add" child to the end of today's journal *)
let move_qa_blocks_to_today repo uuids =
  let day = Dates.today_journal_day () in
  let* page_w =
    Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
      (Wire.Int day)
  in
  let* tuuid_opt =
    match Decode.page_of_summary page_w with
    | Some p -> (
        match p.Model.page_uuid with
        | Some tuuid -> Js.Promise.resolve (Some tuuid)
        | None -> Js.Promise.resolve None)
    | None -> Js.Promise.resolve None
  in
  match tuuid_opt with
  | None -> Js.Promise.resolve ()
  | Some tuuid ->
      let* today_blocks = fetch_qa_blocks repo tuuid in
      let last_uuid =
        match List.rev today_blocks with
        | b :: _ -> b.Model.block_uuid
        | [] -> None
      in
      let move_op =
        match last_uuid with
        | Some l -> Ops.move_blocks uuids l ~sibling:true
        | None -> Ops.move_blocks uuids tuuid ~sibling:false
      in
      let* () = Ops.apply_and_refresh [ move_op ] in
      Dialogs_state.close_named "quick-add";
      Quick_add_state.reset ();
      Toast.success
        (I18n.t "journal/add-blocks-to-today-success");
      Js.Promise.resolve ()

(* cljs quick-add-blocks!: save the live edit, then move everything *)
let quick_add_blocks_to_today () =
  match !Runtime.current_repo with
  | None -> ()
  | Some repo ->
      blur_commit ();
      let uuids =
        List.filter_map
          (fun b -> b.Model.block_uuid)
          (Quick_add_state.value ()).Quick_add_state.blocks
      in
      match uuids with
      | [] ->
          Dialogs_state.close_named "quick-add";
          Quick_add_state.reset ()
      | _ -> ignore (move_qa_blocks_to_today repo uuids)

let quick_add () =
  if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
    quick_add_blocks_to_today ()
  else open_quick_add ()

(* Meta+Shift+. zoom: cljs keeps the zoomed block in edit mode across the
   redirect (state/set-editing-block-id! before redirect-to-page!) *)
let pending_zoom : string option ref = ref None

let zoom_container uuid = "zoom-" ^ uuid

let zoom_to uuid =
  (* cljs keeps the zoomed block in edit mode only when the zoom was
     invoked while that block was being edited (zoom-in!'s editing?
     branch); a plain bullet click never re-enters the editor *)
  pending_zoom :=
    (match S.editing () with
     | Some e when e.uuid = uuid -> Some uuid
     | _ -> None);
  (* the zoomed block is the zoom container's root — it expands there
     while its page-level collapse stays *)
  S.expand_root ~scope:(zoom_container uuid) uuid;
  Platform.set_location_hash (Runtime.nav_hash ("#/block/" ^ uuid))

let consume_pending_zoom () =
  let z = !pending_zoom in
  pending_zoom := None;
  z

(* cljs editor/zoom-out!: editing on a block-zoom route navigates to the
   parent (block zoom or its page) while keeping the block in edit mode;
   editing on a plain page is a no-op; otherwise history.back *)
let zoom_out () =
  match S.editing_uuid () with
  | Some edit_u -> (
      match !Runtime.current_route with
      | Some (Model.Block_zoom uuid) ->
          pending_zoom := Some edit_u;
          ignore
            (let* p =
              Runtime.invoke2 "thread-api/get-block-parent"
                (Wire.String
                   (Option.value !Runtime.current_repo ~default:""))
                (Wire.Uuid uuid)
            in
            (match Wire.map_get_uuid p "block/uuid" with
             | Some pu ->
                 let seg =
                   match Wire.map_get_string p "block/name" with
                   | Some _ -> "page"
                   | None -> "block"
                 in
                 Platform.set_location_hash
                   (Runtime.nav_hash ("#/" ^ seg ^ "/" ^ pu))
             | None -> ());
            Js.Promise.resolve ())
      | _ -> ())
  | None -> Platform.history_back ()

(* -- /query (cljs commands.cljs db-based-query -> editor.cljs
   run-query-command!): create the logseq.property/query value block
   (its title is the pre-slash buffer), tag the block Query, empty its
   title, and exit editing — one transact! batch. -- *)
let run_query_command ~advanced =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      (* the query command empties this block's title in the same tx —
         pin it so the exit-edit repaint doesn't flash the old title *)
      S.override_title e.uuid "";
      S.set (fun st -> { st with S.editing = None });
      let quuid = Platform.random_uuid () in
      let extra =
        (* advanced-query-steps: display-type :code + code/lang clojure
           on the query value block (pre-named via new-block-id) *)
        if advanced then
          [ Ops.set_block_property quuid "logseq.property.node/display-type"
              (Wire.Keyword "code")
          ; Ops.set_block_property quuid "logseq.property.code/lang"
              (Wire.String "clojure")
          ]
        else []
      in
      let _ = () in
      ignore
        (let* sops = Ops.save_block_parsed e.uuid "" in
        let* () =
          Ops.apply_and_refresh
            ([ Ops.op "create-property-text-block"
                 [ Wire.Uuid e.uuid
                 ; Wire.Keyword "logseq.property/query"
                 ; Wire.String buf
                 ; Wire.Map
                     [ Ops.kw "set-block-property?" (Wire.Bool true)
                     ; Ops.kw "new-block-id" (Wire.Uuid quuid)
                     ]
                 ]
             ; Ops.set_block_property e.uuid "block/tags"
                 (Wire.Keyword "logseq.class/Query")
             ]
            @ sops @ extra)
        in
        Js.Promise.resolve ())

(* -- upload asset (cljs handler/editor/assets.cljs
   db-based-save-assets!): write each file to pfs
   /<graph>/assets/<uuid>.<ext>, then insert-blocks an Asset-tagged
   block below the editing block. An empty target reuses its uuid and
   is replaced in place. -- *)
let trigger_asset_upload () =
  match Properties_dom.doc_query "input#upload-file" with
  | Some el -> Properties_dom.el_click el
  | None -> ()

let file_ext name =
  match String.rindex_opt name '.' with
  | Some i when i + 1 < String.length name ->
      String.lowercase_ascii
        (String.sub name (i + 1) (String.length name - i - 1))
  | _ -> ""

let file_title name =
  match String.rindex_opt name '.' with
  | Some 0 | None -> name
  | Some i -> String.sub name 0 i

let asset_block_map ~uuid ~title ~ext ~size ~checksum =
  Wire.Map
    [ Ops.str "block/uuid" (Wire.Uuid uuid)
    ; Ops.str "block/title" (Wire.String title)
    ; Ops.str "logseq.property.asset/type" (Wire.String ext)
    ; Ops.str "logseq.property.asset/size" (Wire.Int size)
    ; Ops.str "logseq.property.asset/checksum" (Wire.String checksum)
    ; ( Wire.Keyword "block/tags"
      , Wire.Set [ Wire.Keyword "logseq.class/Asset" ] )
    ]

let save_one_asset repo pfs target_uuid ~empty_target ~first
    (f : Js.Json.t) =
  let name = Browser_ui.file_name f in
  let ext = file_ext name in
  let size = int_of_float (Browser_ui.file_size f) in
  let uuid =
    match (first, empty_target) with
    | true, true -> target_uuid
    | _ -> Platform.random_uuid ()
  in
  ignore
    (let* buf = Browser_ui.file_buffer f in
    let u8 = Js.Typed_array.Uint8Array.fromBuffer buf () in
    let* checksum = Platform.sha256_hex u8 in
    let dir =
      "/" ^ Platform.strip_db_prefix repo ^ "/assets"
    in
    let* () = Platform.pfs_ensure_dir pfs dir in
    let* () =
      Platform.pfs_write_file pfs
        (dir ^ "/" ^ uuid ^ "." ^ ext)
        u8
    in
    let* () =
      Ops.apply_and_refresh
        [ Ops.insert_blocks ~bottom:true
            ~replace_empty_target:true
            [ asset_block_map ~uuid
                ~title:(file_title name) ~ext
                ~size ~checksum ]
            target_uuid ~sibling:true ]
    in
    Js.Promise.resolve ())

let save_uploaded_files (input : Editor_dom.el) =
  match (!Runtime.current_repo, S.editing ()) with
  | Some repo, Some e -> (
      match Platform.pfs_handle () with
      | Some pfs ->
          let buffer = live_buffer e.uuid in
          let empty_target = String.trim buffer = "" in
          (* cljs db-based-save-assets! persists the unsaved edit content
             before inserting — otherwise the worker sees a blank target
             and replace-empty-target? swaps it for the asset block while
             it is still being edited *)
          let pre =
            if empty_target then Js.Promise.resolve ()
            else
              let* sops = Ops.save_block_parsed e.uuid buffer in
              Ops.apply sops
          in
          ignore
            (let* () = pre in
            Array.iteri
              (fun i f ->
                save_one_asset repo pfs e.uuid ~empty_target
                  ~first:(i = 0) f)
              (Browser_ui.files_of input);
            Js.Promise.resolve ())
      | None -> ())
  | _ -> ()
