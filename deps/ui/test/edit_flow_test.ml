(* Behavior regressions for the shared editing pipeline — the same
   source compiles under Melange (test_main.js) and under the native
   native test entry. Scenarios drive the REAL call path:

     Editor_keys.apply_input ~-> Edit_input.handle ~-> Edit_model
                                ~-> Edit_input.route ~-> editor_actions
                                ~-> Outliner_ops ~-> worker (faked)

   so the boundary defects the migration targets fail loudly:

   - composition: preedit never reaches the model nor the worker;
     commit schedules exactly one save; cancel/blur keep source+selection
   - save ordering: the 400ms debounce saves the latest buffer only;
     a pending text save flushes BEFORE structural ops and before
     undo/redo; input queued while a structure op is in flight is
     replayed; a failed apply does not advance the committed base
   - dirty-buffer refresh: resync replaces the open buffer only when
     clean; force (undo/redo) resynchronizes to worker truth even over
     typed text; committed-but-unrefreshed titles are not clobbered
   - deferred geometry: measure returns no caret before a reply exists;
     stale/incomplete host line measurements are rejected
     (measured_partitions)
   - structural input: Enter / repeated Enter / Delete merge /
     Backspace merge / indent / outdent preserve ordering, focus,
     caret, and editing session identity

   Per-runtime plumbing is injected through [host]; the test bodies are
   identical. *)

open Test_check
open Promise_ext
module S = Editor_state
module A = Editor_actions
module Ops = Outliner_ops
module EI = Edit_input
module EM = Edit_model
module W = Wire

(* ---------- per-runtime plumbing ---------- *)

type host =
  { repo : string
      (* the repo id every worker-facing call must carry *)
  ; stage : Model.page option -> unit
      (* the drive harness's Runtime.model stub is decoupled from the
         mounted app model: stage the page (plus repo + route) that
         S.find / page_blocks read *)
  ; sync_page : unit -> unit
      (* mirror !Runtime.current_page into the Runtime.model stub *)
  ; wait_ms : int -> unit Js.Promise.t
      (* outlast the 400ms save debounce and 0ms focus timers.
         web: real setTimeout. native: sleep + Host.drain *)
  ; reject_promise : string -> W.t Js.Promise.t
      (* a promise that rejects — for the failed-apply path; the two
         runtimes construct rejections differently *)
  ; base_handler : string -> W.t list -> W.t
      (* the harness's canned worker — calls outside the editing
         surface delegate to it so in-flight suite work keeps
         resolving *)
  ; snapshot : unit -> Model.t
  ; restore : Model.t -> unit
  ; native : bool  (* byte-offset runtime — widget pushback semantics *)
  }

(* poll until no structure op holds the input gate and nothing is
   queued — a prior test's in-flight run_structure otherwise silently
   swallows this test's key events (they queue, never apply) *)
let rec settle (h : host) n : unit Js.Promise.t =
  if
    n <= 0
    || ((not !S.structure_pending)
        && Queue.is_empty S.pending_edit_actions
        && Option.is_none !S.merge_plan_seq)
  then Js.Promise.resolve ()
  else
    let* () = h.wait_ms 25 in
    settle h (n - 1)

(* ---------- model <-> wire fixtures ---------- *)

let rec block_w (b : Model.block) : W.t =
  W.Map
    [ W.Keyword "block/uuid", W.Uuid (Option.get b.Model.block_uuid)
    ; W.Keyword "block/title", W.String b.Model.block_title
    ; W.Keyword "block/children",
      W.List (List.map block_w b.Model.block_children)
    ]

let page_w (p : Model.page) : W.t =
  W.List (List.map block_w p.Model.page_blocks)

(* ---------- fake worker ---------- *)

let calls : string list ref = ref []
let ops : W.t list ref = ref []
let repo_ok = ref true

(* answers every surface the editing paths touch; get-page-blocks-tree
   re-encodes the CURRENT app page so native synchronous resolution and
   web microtask resolution see the same post-op truth *)
(* the fake worker's only truth mutation: save-block retitles by uuid,
   delete-blocks drops rows recursively.  idempotent by uuid — the
   optimistic splice already published the same rows *)
let apply_ops (h : host) (os : W.t list) =
  let get m k =
    match m with
    | W.Map kvs -> (
        match List.assoc_opt (W.Keyword k) kvs with
        | Some v -> Some v
        | None -> List.assoc_opt (W.String k) kvs)
    | _ -> None
  in
  let title_of bm =
    match get bm "block/title" with Some (W.String t) -> t | _ -> ""
  in
  let uuid_of bm =
    match get bm "block/uuid" with
    | Some (W.Uuid u) -> u
    | Some (W.String u) -> u
    | _ -> ""
  in
  let rec rename u t blocks =
    List.map
      (fun (b : Model.block) ->
        let b =
          if b.Model.block_uuid = Some u then
            { b with Model.block_title = t }
          else b
        in
        { b with Model.block_children = rename u t b.Model.block_children })
      blocks
  in
  let rec drop us blocks =
    List.filter_map
      (fun (b : Model.block) ->
        match b.Model.block_uuid with
        | Some u when List.mem u us -> None
        | _ -> Some { b with Model.block_children = drop us b.Model.block_children })
      blocks
  in
  let apply_one blocks = function
    | W.Array [ W.Keyword "save-block"; W.Array (bm :: _) ] ->
        rename (uuid_of bm) (title_of bm) blocks
    | W.Array [ W.Keyword "delete-blocks"; W.Array (W.List us :: _) ] ->
        drop
          (List.filter_map
             (fun w ->
               match w with
               | W.Uuid u -> Some u
               | W.String u -> Some u
               | _ -> None)
             us)
          blocks
    | _ -> blocks
  in
  match !Runtime.current_page with
  | None -> ()
  | Some p ->
      Runtime.current_page :=
        Some
          { p with
            Model.page_blocks = List.fold_left apply_one p.Model.page_blocks os
          };
      h.sync_page ()

let worker_handler (h : host) name args : W.t =
  calls := !calls @ [ name ];
  match name with
  | "thread-api/apply-outliner-ops" -> (
      (match args with
       | [ W.String _repo; W.Array os; _ ] -> ops := !ops @ os
       | _ -> ());
      (match args with
       | [ W.String _repo; W.Array os; _ ] -> apply_ops h os
       | _ -> ());
      W.Map [ W.Keyword "result", W.Nil ])
  | "thread-api/get-page-blocks-tree" -> (
      match !Runtime.current_page with
      | Some p -> page_w p
      | None -> W.List [])
  | "thread-api/get-block-parents" -> W.List []
  | "thread-api/get-render-snapshots" -> W.Map []
  | "thread-api/get-file-content" -> W.String "{}"
  | "thread-api/undo-redo-undo" | "thread-api/undo-redo-redo" -> W.Nil
  | _ -> W.Nil

let owned_call = function
  | "thread-api/apply-outliner-ops" | "thread-api/get-page-blocks-tree"
  | "thread-api/get-block-parents" | "thread-api/get-render-snapshots"
  | "thread-api/get-file-content" | "thread-api/undo-redo-undo"
  | "thread-api/undo-redo-redo" -> true
  | _ -> false

let install_worker ~repo (h : host) =
  calls := [];
  ops := [];
  repo_ok := true;
  ignore
    (Fake_worker.install (fun name args ->
         if name = "thread-api/apply-outliner-ops" then (
           calls := !calls @ [ name ];
           (match args with
            | W.String r :: _ -> if r <> repo then repo_ok := false
            | _ -> repo_ok := false);
           (match args with
            | [ _; W.Array os; _ ] -> ops := !ops @ os; apply_ops h os
            | _ -> ());
           (* record then delegate — the harness handler keeps its own
              op logs (sdk_ops_log etc.) up to date for deferred
              assertions elsewhere in the suite *)
           h.base_handler name args)
         else if owned_call name then worker_handler h name args
         else h.base_handler name args))

let install_rejecting_worker (h : host) =
  calls := [];
  ops := [];
  Runtime.worker :=
    Some
      { Worker_client.invoke_fn =
          (fun name args ->
            calls := !calls @ [ name ];
            if owned_call name then h.reject_promise ("worker rejects: " ^ name)
            else Js.Promise.resolve (h.base_handler name args))
      ; on_message = (fun _ _ -> ())
      ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())
      }

(* ---------- op/call inspection ---------- *)

let op_name (o : W.t) =
  match o with
  | W.Array (W.Array (W.Keyword n :: _) :: _)
  | W.List (W.Array (W.Keyword n :: _) :: _)
  | W.Array (W.Keyword n :: _) -> n
  | _ -> "?"

let op_names () = List.map op_name !ops

let rec wire_has s (w : W.t) =
  match w with
  | W.String t -> t = s
  | W.Array xs | W.List xs | W.Set xs -> List.exists (wire_has s) xs
  | W.Map kvs -> List.exists (fun (k, v) -> wire_has s k || wire_has s v) kvs
  | W.Tagged (_, x) -> wire_has s x
  | _ -> false

let save_ops () = List.filter (fun o -> op_name o = "save-block") !ops

(* ---------- staging ---------- *)

let stage_page (h : host) blocks =
  let p = Test_check.page blocks in
  h.stage (Some p);
  Runtime.send (Action.Page_loaded p)

let editing_now () = Option.get (S.editing ())

let set_editing ~uuid ~buffer ~caret ~base =
  S.set (fun st ->
      { st with
        S.editing =
          Some (S.mk_editing ~caret ~uuid ~buffer ~scope:"main" ~base ())
      })

let titles_of (p : Model.page) =
  List.map (fun (b : Model.block) -> b.Model.block_title) p.Model.page_blocks

let current_titles () =
  match !Runtime.current_page with
  | Some p ->
      List.map
        (fun (b : Model.block) ->
          S.title_for (Option.get b.Model.block_uuid) b.Model.block_title)
        p.Model.page_blocks
  | None -> []

let reset_editor () =
  Ops.cancel_pending_save ();
  S.structure_pending := false;
  Queue.clear S.pending_edit_actions;
  S.pending_focus := None;
  S.set (fun st -> { st with S.editing = None })

(* ---------- composition ---------- *)

let test_composition (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  let m () = (editing_now ()).S.model in
  (* preedit: never reaches the model source, never reaches the worker *)
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_start, ""));
  check "comp start keeps source" ((m ()).EM.source = "hello");
  check "comp start composing" (EM.composing (m ()));
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_update, "zh"));
  check "comp update keeps source" ((m ()).EM.source = "hello");
  check "comp update keeps composing" (EM.composing (m ()));
  check "comp update keeps caret" ((m ()).EM.caret = 5);
  (* flushing during preedit emits no save — preedit is inert *)
  let* () = Ops.flush_pending_save () in
  check "preedit schedules no save" (save_ops () = []);
  (* commit: model gains the text once, and exactly one save is queued *)
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_end, "中"));
  check "comp end commits once" ((m ()).EM.source = "hello中");
  check "comp end clears composing" (not (EM.composing (m ())));
  let* () = Ops.flush_pending_save () in
  (match save_ops () with
   | [ sop ] -> check "commit saves once" (wire_has "hello中" sop)
   | sos ->
       check "commit saves once" false;
       Js.log ("save ops: " ^ string_of_int (List.length sos)));
  (* cancel: source + selection preserved, no save *)
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  ops := [];
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_start, ""));
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_update, "zh"));
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_cancel, ""));
  check "comp cancel keeps source" ((m ()).EM.source = "hello");
  check "comp cancel keeps caret" ((m ()).EM.caret = 5);
  check "comp cancel not composing" (not (EM.composing (m ())));
  let* () = Ops.flush_pending_save () in
  check "comp cancel schedules no save" (save_ops () = []);
  (* blur mid-composition: cancels the composition, keeps source +
     caret, reports the blur *)
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_start, ""));
  Editor_keys.apply_input "b1" (EI.Composition (EI.Comp_update, "zh"));
  Editor_keys.apply_input "b1" EI.Blur;
  check "blur ends composition" (not (EM.composing (m ())));
  check "blur keeps source" ((m ()).EM.source = "hello");
  check "blur keeps caret" ((m ()).EM.caret = 5);
  check "blur routed to focused=false" (!S.focused_block = None);
  let* () = Ops.flush_pending_save () in
  check "blur schedules no save" (save_ops () = []);
  reset_editor ();
  Js.Promise.resolve ()

(* ---------- save ordering ---------- *)

let test_save_debounce (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  (* Two keystrokes collapse to one save of the latest buffer. *)
  Editor_keys.apply_input "b1" (EI.Insert "x");
  Editor_keys.apply_input "b1" (EI.Insert "y");
  check "typing publishes buffer" ((editing_now ()).S.buffer = "helloxy");
  let* () = h.wait_ms 500 in
  (match save_ops () with
   | [ sop ] -> check "debounce saves latest once" (wire_has "helloxy" sop)
   | sos ->
       check "debounce saves latest once" false;
       Js.log ("save ops: " ^ string_of_int (List.length sos)));
  check "commit advances base" ((editing_now ()).S.base = "helloxy");
  check "commit displays saved title" (current_titles () = [ "helloxy" ]);
  check "ops carry the repo" !repo_ok;
  reset_editor ();
  let raw = "[[Reference alias]]" in
  let canonical = "[[11111111-2222-4333-8444-555555555555]]" in
  stage_page h [ Test_check.block "b1" canonical ];
  set_editing ~uuid:"b1" ~buffer:"" ~caret:0 ~base:canonical;
  let revision = ref 0 in
  let canonical_host =
    { h with base_handler = (fun name args ->
        let result = h.base_handler name args in
        if name <> "thread-api/apply-outliner-ops" then result
        else begin
          (* The worker already holds the canonical reference. Alias
             normalization makes this save a no-op, with no touched row. *)
          apply_ops h
            [ Ops.op "save-block"
                [ W.Map
                    [ W.kw "block/uuid", W.Uuid "b1"
                    ; W.kw "block/title", W.String canonical ]
                ; W.Map [] ] ];
          incr revision;
          W.Map
            [ W.kw "result", W.Nil
            ; W.kw "delta", W.Map
                [ W.kw "rev", W.Int !revision
                ; W.kw "blocks", W.Map []
                ; W.kw "deleted", W.Map []
                ; W.kw "children", W.Map [] ] ]
        end) }
  in
  install_worker ~repo:h.repo canonical_host;
  Editor_keys.apply_input "b1" (EI.Insert raw);
  let* () = h.wait_ms 500 in
  check "canonical acknowledgement advances the editable base"
    ((editing_now ()).S.base = raw);
  check "autosave does not mask the canonical reference"
    (current_titles () = [ canonical ]);
  let* () = A.commit_result "b1" raw in
  check "no-op commit does not restore the reference alias"
    (current_titles () = [ canonical ]);
  reset_editor ();
  Js.Promise.resolve ()

let test_acknowledged_save_before_broadcast (h : host) =
  let* () = settle h 40 in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (title, reject_refresh) :: rest ->
        reset_editor ();
        stage_page h [Test_check.block "b1" "old"];
        set_editing ~uuid:"b1" ~buffer:title ~caret:(String.length title) ~base:"old";
        let writes = ref 0 in
        Runtime.worker := Some
          { Worker_client.invoke_fn = (fun name args ->
              if name = "thread-api/apply-outliner-ops" then begin
                incr writes;
                Js.Promise.resolve (W.Map [W.kw "result", W.Nil])
              end else if name = "thread-api/get-page-blocks-tree" then
                if reject_refresh then h.reject_promise "deferred save refresh failed"
                else Js.Promise.resolve (page_w (Test_check.page [Test_check.block "b1" title]))
              else Js.Promise.resolve (h.base_handler name args))
          ; on_message = (fun _ _ -> ())
          ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        Ops.schedule_save "b1" title;
        let* () = Ops.flush_pending_save () in
        check "Acknowledged autosave can precede the throttled page broadcast"
          ((editing_now ()).S.base = title && A.model_title "b1" = "old" && !writes = 1);
        A.blur_commit ();
        let* () = settle h 40 in
        check "Blur does not add a history transaction for an acknowledged buffer"
          (!writes = 1);
        check "A clean blur refreshes deferred truth or retains editing on refresh failure"
          (if reject_refresh then Option.is_some (S.editing ())
           else S.editing () = None && A.model_title "b1" = title);
        stage_page h [Test_check.block "b1" "old"];
        set_editing ~uuid:"b1" ~buffer:title ~caret:0 ~base:title;
        A.flush_edit ();
        let* () = h.wait_ms 25 in
        check "Navigation does not resave an acknowledged buffer before its broadcast"
          (!writes = 1 && S.editing () = None);
        stage_page h [Test_check.block "b1" "old"];
        set_editing ~uuid:"b1" ~buffer:"old" ~caret:3 ~base:title;
        A.flush_edit ();
        let* () = h.wait_ms 25 in
        check "Returning to the stale page title still saves a changed buffer"
          (!writes = 2 && S.editing () = None);
        run rest
  in
  let* () = run ["saved", false; "", false; "saved", true] in
  reset_editor ();
  Js.Promise.resolve ()

let test_embed_persists_erased_buffer (h : host) =
  let* () = settle h 40 in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | prefix :: rest ->
        let query = "Embed destination" in
        let saved_query = prefix ^ query in
        stage_page h [ Test_check.block "b1" saved_query ];
        set_editing ~uuid:"b1" ~buffer:saved_query
          ~caret:(String.length saved_query) ~base:saved_query;
        let inserted_title = ref None in
        let embed_host =
          { h with base_handler = (fun name args ->
              match name, args with
              | "thread-api/get-case-page", _ ->
                  W.Map [ W.kw "db/id", W.Int 197 ]
              | "thread-api/apply-outliner-ops", [ _; W.Array os; _ ] ->
                  if List.exists (fun o -> op_name o = "insert-blocks") os then
                    inserted_title :=
                      Option.map (fun p -> titles_of p) !Runtime.current_page;
                  h.base_handler name args
              | _ -> h.base_handler name args) }
        in
        install_worker ~repo:h.repo embed_host;
        (* Autocomplete erases the query in the live editor, after the
           worker has already persisted it. *)
        A.update_model "b1" (fun m -> EM.set_source m prefix);
        Editor_embed.insert query;
        let rec wait remaining =
          if Option.is_some !inserted_title || remaining = 0 then
            Js.Promise.resolve ()
          else let* () = h.wait_ms 25 in wait (remaining - 1)
        in
        let* () = wait 40 in
        check "embed sees the persisted post-erase buffer, preserving its prefix"
          (!inserted_title = Some [ prefix ]);
        reset_editor ();
        run rest
  in
  run [ ""; "kept prefix " ]

let test_pending_save_order (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "hello"; Test_check.block "b2" "next" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  (* a structural op flushes the pending text save first — typed text
     inside the debounce window is not dropped *)
  Editor_keys.apply_input "b1" (EI.Insert "z");
  check "typed buffer pending" ((editing_now ()).S.buffer = "helloz");
  let* () = Ops.apply [ Ops.create_page "someday" ] in
  (match op_names () with
   | "save-block" :: "create-page" :: _ ->
       check "pending save precedes structural op" true
   | names ->
       check "pending save precedes structural op" false;
       Js.log ("ops: " ^ String.concat "," names));
  check "flush saved the buffer" (List.exists (wire_has "helloz") !ops);
  (* and before undo/redo as well — schedule_save is the public
     entry the input paths call; using it directly keeps the pending
     state deterministic regardless of reveal_dirty gating *)
  ops := [];
  calls := [];
  Ops.schedule_save "b1" "hellozq";
  (match !Ops.pending_save with
   | Some { Ops.uuid = "b1"; title = "hellozq"; _ } -> check "save queued pending" true
   | _ -> check "save queued pending" false);
  let* () = Ops.undo () in
  (match !calls with
   | "thread-api/apply-outliner-ops" :: "thread-api/undo-redo-undo" :: _ ->
       check "pending save precedes undo" true
   | names ->
       check "pending save precedes undo" false;
       Js.log ("calls: " ^ String.concat "," names));
  reset_editor ();
  Js.Promise.resolve ()

let test_suggestion_selection_commits_pending_save (h : host) =
  let* () = settle h 40 in
  let source = "前缀 [图谱别名]([[Project Atlas]])" in
  let target_start = String.length "前缀 [图谱别名](" in
  let target_uuid = "00000001-2026-1116-0000-000000000000" in
  let target_title = "Nov 16th, 2026" in
  let selected_source =
    "前缀 [图谱别名]([[" ^ target_uuid ^ "]])"
  in
  stage_page h [ Test_check.block "b1" source ];
  set_editing ~uuid:"b1" ~buffer:source ~caret:(target_start + 2) ~base:source;
  let target_entity =
    W.Map
      [ W.kw "block/uuid", W.Uuid target_uuid
      ; W.kw "block/title", W.String target_title
      ; W.kw "block/name", W.String "nov 16th, 2026" ]
  in
  let page_host =
    { h with base_handler = (fun name args ->
        match name, args with
        | "thread-api/get-case-page", [ W.String _; W.String title ]
          when title = target_title -> target_entity
        | "thread-api/get-blocks",
          [ W.String _; W.Array [ W.Map query ] ]
          when W.get (W.Map query) "id" = Some (W.Uuid target_uuid) ->
            W.List
              [ W.Map
                  [ W.kw "id", W.Uuid target_uuid
                  ; W.kw "block", target_entity ] ]
        | _ -> h.base_handler name args) }
  in
  install_worker ~repo:h.repo page_host;
  let previous_popup = !Popups_state.active in
  let popup = Popups_state.make (Signal.scheduler ()) in
  Popups_state.open_ac ~tpos:target_start ~autopair:false popup Popups_state.Page_ref;
  Editor_keys.apply_input "b1" (EI.Insert "Nov");
  let* () = h.wait_ms 450 in
  let query_before =
    match !Ops.pending_save with
    | Some save -> W.map_get save.Ops.opts "undo-redo/editor-info"
    | None -> None
  in
  check "autocomplete debounce retains the typed save"
    (match !Ops.pending_save with
     | Some save -> save.Ops.uuid = "b1" && save.title = A.live_buffer "b1"
     | None -> false);
  check "autocomplete debounce waits for its owner to close"
    (Option.is_some !Ops.pending_save_ready);
  check "autocomplete deadline does not persist the intermediate query"
    (save_ops () = []
     && not (List.mem "thread-api/apply-outliner-ops" !calls));
  check "typed query save keeps its original history before"
    (Option.is_some query_before);
  let row =
    W.Map
      [ W.kw "block/uuid", W.Uuid target_uuid
      ; W.kw "block/title", W.String target_title
      ; W.kw "page?", W.Bool true ]
  in
  let item = Popups_state.page_item_of_row 0 row in
  (match (Popups_state.get popup).Popups_state.ac with
   | Some ac ->
       check "page suggestion query tracks typed input" (ac.query = "Nov");
       Popups_state.set_ac popup (Some { ac with items = [ item ]; chosen = 0 });
       let ac = Option.get (Popups_state.get popup).Popups_state.ac in
       Popups_state.apply_item popup ac ~meta:false item
   | None -> check "page suggestion popup opens" false);
  check "page selection preserves the alias wrapper"
    (A.live_buffer "b1" = "前缀 [图谱别名]([[Nov 16th, 2026]])");
  let selected_before =
    match !Ops.pending_save with
    | Some save -> W.map_get save.Ops.opts "undo-redo/editor-info"
    | None -> None
  in
  check "page selection keeps the original history before"
    (Option.is_some query_before && selected_before = query_before);
  check "page selection replaces the deferred query payload"
    (match !Ops.pending_save with
     | Some save -> save.Ops.uuid = "b1" && save.title = A.live_buffer "b1"
     | None -> false);
  let* () = h.wait_ms 450 in
  check "page selection writes one canonical save"
    (match save_ops () with
     | [ sop ] -> wire_has selected_source sop
     | _ -> false);
  check "page selection clears its pending debounce"
    (Option.is_none !Ops.pending_save && Option.is_none !Ops.pending_save_ready);
  let* () = Ops.undo () in
  check "page selection is persisted before undo"
    (let persisted = current_titles () = [ selected_source ] in
     let saved = List.exists (wire_has selected_source) (save_ops ()) in
     if not (persisted && saved) then
       Js.log
         ("autocomplete persisted titles: "
          ^ String.concat " | " (current_titles ())
          ^ "; save ops: " ^ string_of_int (List.length (save_ops ())));
     persisted && saved);
  Popups_state.close_ac popup;
  Popups_state.active := previous_popup;
  reset_editor ();
  Js.Promise.resolve ()

let test_node_reference_suggestions (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "" ];
  install_worker ~repo:h.repo h;
  let previous_popup = !Popups_state.active in
  let popup = Popups_state.make (Signal.scheduler ()) in
  let failed = ref false and searches = ref 0 in
  let target = "00000000-0000-0000-0000-000000000006" in
  let row uuid title page extra = W.Map
    ([W.kw "block/uuid",W.Uuid uuid;W.kw "block/title",W.String title;
      W.kw "page?",W.Bool page] @ extra) in
  let results = [
    row "target-page" "Target Page" true [];
    row "class-page" "Whiteboard" true [W.kw "tag?",W.Bool true];
    row target "Target linked title" false
      [W.kw "block.temp/original-title",W.String "[[raw-reference-uuid]]"];
    row "b1" "Target editing block" false []] in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun name args ->
    match name with
    | "thread-api/get-all-page-titles" ->
        Js.Promise.resolve (W.List [W.String "Tar private property"])
    | "thread-api/q" -> Js.Promise.resolve (W.List [])
    | "thread-api/search-blocks" ->
        incr searches;
        check "node search trims its query without changing the insertion range"
          (match args with [_;W.String query;_] -> query = "Tar" | _ -> false);
        if !failed then h.reject_promise "node search transport"
        else Js.Promise.resolve (W.List results)
    | _ -> Js.Promise.resolve (h.base_handler name args));
    on_message = (fun _ _ -> ());
    dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  let open_query buffer caret query =
    set_editing ~uuid:"b1" ~buffer ~caret ~base:"";
    Popups_state.open_ac ~tpos:0 ~autopair:false popup Popups_state.Page_ref;
    match (Popups_state.get popup).Popups_state.ac with
    | Some ac -> Popups_state.ac_update popup ac query
    | None -> check "node-reference autocomplete opens" false in
  open_query "[[ Tar ]]" 7 " Tar ";
  let* () = h.wait_ms 25 in
  (match (Popups_state.get popup).Popups_state.ac with
   | Some ac ->
       check "node search retains backend nodes and complete NLP suggestions"
         (!searches > 0
          && List.exists (fun item -> item.Popups_state.ai_label = "Whiteboard") ac.items
          && List.for_all (fun term -> List.exists
              (fun item -> item.Popups_state.ai_key = "nlp:" ^ term) ac.items)
            ["Next year";"This year";"Last year";"Last Saturday";"This Saturday";"Next Saturday"]);
       check "node search does not invent private pages or suggest its editing block"
         (not (List.exists (fun item ->
            item.Popups_state.ai_label = "Tar private property"
            || item.ai_label = "Target editing block") ac.items));
       (match List.find_opt (fun item ->
          item.Popups_state.ai_act = Popups_state.Emit ("[[" ^ target ^ "]]",0)) ac.items with
        | Some item ->
            check "node search displays resolved titles rather than raw UUID markup"
              (item.ai_label = "Target linked title");
            Popups_state.apply_item popup ac ~meta:false item;
            check "choosing a resolved block title still inserts its UUID reference"
              (A.live_buffer "b1" = "[[" ^ target ^ "]]")
        | None -> check "node search retains block results below pages and dates" false)
   | None -> check "node search keeps its owning autocomplete" false);
  Ops.cancel_pending_save ();
  Popups_state.close_ac popup;
  let open_slash prefix =
    let source = prefix ^ "/Node reference" in
    set_editing ~uuid:"b1" ~buffer:source ~caret:(String.length source) ~base:prefix;
    Popups_state.open_ac ~tpos:(String.length prefix) ~autopair:false popup Popups_state.Slash;
    let ac = Option.get (Popups_state.get popup).Popups_state.ac in
    let item = Popups_state.mk_item ~key:"node-reference" ~label:"Node reference"
      (Popups_state.Switch Popups_state.Page_ref) in
    Popups_state.apply_item popup ac ~meta:false item in
  let rec slash_cases = function
    | [] -> Js.Promise.resolve ()
    | prefix :: rest ->
        open_slash prefix;
        check "Node reference slash conversion retains its prefix and opens balanced brackets"
          (A.live_buffer "b1"=prefix ^ "[[]]"
           && match (Popups_state.get popup).Popups_state.ac with
              | Some ac -> ac.tpos=String.length prefix && ac.tlen=2 && ac.query=""
                  && List.length ac.items=10
              | None -> false);
        Editor_keys.apply_input "b1" (EI.Insert "Tar");
        let* () = h.wait_ms 25 in
        (match (Popups_state.get popup).Popups_state.ac with
         | Some ac ->
             check "Node reference searches only the post-command term on a nonempty host"
               (ac.query="Tar");
             (match List.find_opt (fun item -> item.Popups_state.ai_act
                =Popups_state.Emit ("[[" ^ target ^ "]]",0)) ac.items with
              | Some item ->
                  Popups_state.apply_item popup ac ~meta:false item;
                  check "Choosing a node preserves the nonempty host and removes the ghost pair"
                    (A.live_buffer "b1"=prefix ^ "[[" ^ target ^ "]]")
              | None -> check "Slash node reference retains existing node choices" false)
         | None -> check "Slash node reference keeps its picker after typing" false);
        Ops.cancel_pending_save ();
        Popups_state.close_ac popup;
        slash_cases rest in
  let* () = slash_cases ["Keep host retake "; ""] in
  failed := true;
  open_query "[[Tar]]" 5 "Tar";
  let* () = h.wait_ms 25 in
  check "failed node search retains the query and local suggestions without cached private pages"
    (match (Popups_state.get popup).Popups_state.ac with
     | Some ac -> ac.query = "Tar"
         && List.exists (fun item -> item.Popups_state.ai_key = "new:Tar") ac.items
         && not (List.exists (fun item -> item.Popups_state.ai_label = "Tar private property") ac.items)
     | None -> false);
  Popups_state.close_ac popup;
  failed := false;
  let before = !searches in
  open_query "[[ ]]" 3 " ";
  let* () = h.wait_ms 25 in
  check "empty node-reference query offers the first 10 NLP dates without a graph search"
    (match (Popups_state.get popup).Popups_state.ac with
     | Some ac -> !searches = before && List.length ac.items = 10
         && List.for_all (fun item -> Str_util.starts_with_ci item.Popups_state.ai_key "nlp:") ac.items
         && List.exists (fun item -> item.Popups_state.ai_key = "nlp:Today") ac.items
         && not (List.exists (fun item -> item.Popups_state.ai_key = "nlp:Last year") ac.items)
     | None -> false);
  Popups_state.close_ac popup;
  Popups_state.active := previous_popup;
  Ops.cancel_pending_save ();
  install_worker ~repo:h.repo h;
  reset_editor ();
  Js.Promise.resolve ()

let test_reference_preview (h : host) =
  let* () = settle h 40 in
  let target = "00000000-0000-0000-0000-000000000001"
  and child = "00000000-0000-0000-0000-000000000002"
  and parent = "00000000-0000-0000-0000-000000000003" in
  let previous_worker = !Runtime.worker in
  let empty = ref false and failed_counts = ref false and failed_tree = ref false in
  let parent_lookups = ref 0 and requested_counts = ref [] in
  let summary uuid title = W.Map
    [W.kw "block/uuid",W.Uuid uuid; W.kw "block/title",W.String title] in
  let body = W.Array [W.Map
    [W.kw "block/uuid",W.Uuid target; W.kw "block/title",W.String "Target block";
     W.kw "block/children",W.Array [summary child "Nested block"]]] in
  Runtime.worker := Some {Worker_client.invoke_fn=(fun name args ->
    match name,args with
    | "thread-api/get-page-route-info",[_;W.Uuid uuid] when uuid=target ->
        Js.Promise.resolve (summary target "Target block")
    | "thread-api/get-page-route-info",_ ->
        Js.Promise.resolve (summary parent "Containing Page")
    | "thread-api/get-block-page-info",_ ->
        incr parent_lookups; Js.Promise.resolve (summary parent "Containing Page")
    | "thread-api/get-blocks",_ ->
        Js.Promise.resolve (W.Array [W.Map [W.kw "block",summary target "Target block";
          W.kw "children",W.Array []]])
    | "thread-api/get-block-parents",_ -> Js.Promise.resolve (W.Array [])
    | "thread-api/get-page-blocks-tree",_ ->
        if !failed_tree then h.reject_promise "preview tree transport"
        else Js.Promise.resolve (if !empty then W.Array [] else body)
    | "thread-api/get-render-snapshots",[_;request] ->
        let keys = Option.value (Option.map W.elems (W.get request "resources")) ~default:[] in
        requested_counts := keys :: !requested_counts;
        if !failed_counts then h.reject_promise "preview count transport"
        else Js.Promise.resolve (W.Map [W.kw "slots",W.Map
          (List.map (fun key -> W.Array [W.kw "resource";key],
            W.Map [W.kw "value",W.Int
              (if key=W.Array [W.kw "block-ref-count";W.Uuid child] then 3 else 0)]) keys)])
    | _ -> Js.Promise.resolve (h.base_handler name args));
    on_message=(fun _ _ -> ()); dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let* preview = Popups_state.fetch_preview h.repo target in
  check "A block preview uses its containing page for the header, not the block's title"
    (preview.Popups_state.pc_title="Containing Page"
     && Option.bind preview.pc_page (fun page -> page.Model.page_uuid)=Some parent);
  check "A block preview retains its target as the insertion root and keeps descendants"
    (preview.pc_root_uuid=Some target
     && List.map (fun block -> block.Model.block_uuid) preview.pc_blocks=[Some target]
     && match preview.pc_blocks with
        | [block] -> List.map (fun child -> child.Model.block_uuid) block.block_children=[Some child]
        | _ -> false);
  check "Preview reference counts include nested blocks and omit zero badges"
    (preview.pc_ref_counts=Some [child,3]
     && match !requested_counts with
        | [keys] -> List.length keys=2
            && List.mem (W.Array [W.kw "block-ref-count";W.Uuid target]) keys
            && List.mem (W.Array [W.kw "block-ref-count";W.Uuid child]) keys
        | _ -> false);
  let lookups = !parent_lookups in
  let* page = Popups_state.fetch_preview h.repo "Containing Page" in
  check "Named page previews retain their own root without looking up a block parent"
    (page.pc_root_uuid=Some parent && page.pc_title="Containing Page"
     && !parent_lookups=lookups);
  let saved_item = { (Option.get (Sidebar_state.static_item
    ("block-ref-" ^ target) "block-ref" "Old title")) with Sidebar_state.uuid=Some target } in
  let* restored = Sidebar_state.refresh_item h.repo saved_item in
  check "Restored block-reference panes retain their kind and their visible target block"
    (restored.kind="block-ref" && restored.title="Target block"
     && restored.key=saved_item.key
     && List.map (fun block -> block.Model.block_uuid) restored.blocks=[Some target]);
  empty := true;
  let batches = List.length !requested_counts in
  let* blank = Popups_state.fetch_preview h.repo "Containing Page" in
  check "Empty previews keep page metadata without requesting any reference counts"
    (blank.pc_blocks=[] && blank.pc_ref_counts=Some []
     && blank.pc_title="Containing Page" && List.length !requested_counts=batches);
  empty := false; failed_counts := true;
  let* partial = Popups_state.fetch_preview h.repo target in
  check "A failed count resource retains the preview body without inventing zero counts"
    (partial.pc_ref_counts=None && partial.pc_blocks<>[] && partial.pc_title="Containing Page");
  failed_tree := true;
  let* rejected =
    (let* _ = Popups_state.fetch_preview h.repo target in Js.Promise.resolve false)
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve true) in
  check "A failed preview tree is rejected instead of displaying an empty valid page" rejected;
  Runtime.worker := previous_worker;
  Js.Promise.resolve ()

let test_autocomplete_dismiss_resumes_pending_save (h : host) =
  let* () = settle h 40 in
  let source = "[[P]]" in
  stage_page h [ Test_check.block "b1" source ];
  set_editing ~uuid:"b1" ~buffer:source ~caret:3 ~base:source;
  install_worker ~repo:h.repo h;
  let previous_popup = !Popups_state.active in
  let popup = Popups_state.make (Signal.scheduler ()) in
  Popups_state.open_ac ~tpos:0 ~autopair:false popup Popups_state.Page_ref;
  Editor_keys.apply_input "b1" (EI.Insert "roject");
  let* () = h.wait_ms 450 in
  check "dismissal test save is retained at the debounce deadline"
    (Option.is_some !Ops.pending_save && Option.is_some !Ops.pending_save_ready);
  check "dismissal test does not save while autocomplete is open"
    (save_ops () = []
     && not (List.mem "thread-api/apply-outliner-ops" !calls));
  Popups_state.close_ac popup;
  let* () = h.wait_ms 25 in
  check "dismissing autocomplete resumes the pending save"
    (match save_ops () with [ _ ] -> true | _ -> false);
  check "dismissal clears the resumed pending save"
    (Option.is_none !Ops.pending_save && Option.is_none !Ops.pending_save_ready);
  Popups_state.active := previous_popup;
  reset_editor ();
  Js.Promise.resolve ()

let test_autocomplete_explicit_flush (h : host) =
  let* () = settle h 40 in
  let source = "[[P]]" in
  stage_page h [ Test_check.block "b1" source ];
  set_editing ~uuid:"b1" ~buffer:source ~caret:3 ~base:source;
  install_worker ~repo:h.repo h;
  let previous_popup = !Popups_state.active in
  let popup = Popups_state.make (Signal.scheduler ()) in
  Popups_state.open_ac ~tpos:0 ~autopair:false popup Popups_state.Page_ref;
  Editor_keys.apply_input "b1" (EI.Insert "roject");
  let* () = h.wait_ms 450 in
  check "flush test save is retained at the debounce deadline"
    (Option.is_some !Ops.pending_save && Option.is_some !Ops.pending_save_ready);
  check "flush test autocomplete remains active"
    (match (Popups_state.get popup).Popups_state.ac with
     | Some ac -> ac.auuid = "b1"
     | None -> false);
  let* () = Ops.flush_pending_save () in
  check "explicit flush persists while autocomplete is open"
    (match save_ops () with [ _ ] -> true | _ -> false);
  check "explicit flush clears pending debounce state"
    (Option.is_none !Ops.pending_save && Option.is_none !Ops.pending_save_ready);
  Popups_state.close_ac popup;
  let* () = h.wait_ms 25 in
  check "autocomplete close does not duplicate the explicit flush"
    (List.length (save_ops ()) = 1);
  Popups_state.active := previous_popup;
  reset_editor ();
  Js.Promise.resolve ()

let test_autocomplete_save_gate_is_block_scoped (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "hello"
    ; Test_check.block "b2" "[[P]]" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b1" (EI.Insert "x");
  set_editing ~uuid:"b2" ~buffer:"[[P]]" ~caret:3 ~base:"[[P]]";
  let previous_popup = !Popups_state.active in
  let popup = Popups_state.make (Signal.scheduler ()) in
  Popups_state.open_ac ~tpos:0 ~autopair:false popup Popups_state.Page_ref;
  let* () = h.wait_ms 450 in
  check "another block's autocomplete does not hold the pending save"
    (match save_ops () with
     | [ sop ] -> wire_has "hellox" sop
     | _ -> false);
  check "different-block save clears its debounce state"
    (Option.is_none !Ops.pending_save && Option.is_none !Ops.pending_save_ready);
  Popups_state.close_ac popup;
  Popups_state.active := previous_popup;
  reset_editor ();
  Js.Promise.resolve ()

let test_queued_input (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  (* text-level input paints live while a structure op holds the gate;
     structural intents still queue and replay in order *)
  S.structure_pending := true;
  Editor_keys.apply_input "b1" (EI.Insert "q");
  check "input paints live" ((editing_now ()).S.buffer = "helloq");
  Editor_keys.apply_input "b1" (EI.Delete EI.Del_backward);
  check "structural op still queued" ((editing_now ()).S.buffer = "helloq");
  S.structure_pending := false;
  S.drain_edit_actions ();
  check "queued op replays" ((editing_now ()).S.buffer = "hello");
  let* () = Ops.flush_pending_save () in
  check "replayed input saves" (List.exists (wire_has "hello") !ops);
  (* A retired sink must be retargeted before shadow bookkeeping, so a
     later session restore receives its first character exactly once. *)
  let restore = editing_now () in
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  S.structure_pending := true;
  Editor_keys.apply_input "retired-sink" (EI.Insert "r");
  check "retired sink input paints live" ((editing_now ()).S.buffer = "hellor");
  S.set (fun st -> { st with S.editing = Some restore });
  S.structure_pending := false;
  S.drain_edit_actions ();
  check "restored session replays retired input once" ((editing_now ()).S.buffer = "hellor");
  check "replay drains real input count" (!S.pending_edit_real = 0);
  reset_editor ();
  Js.Promise.resolve ()

let test_failed_apply_keeps_base (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hellotyped" ~caret:10 ~base:"hello";
  install_rejecting_worker h;
  (* drive the save through apply directly — schedule_save's timer path
     also resolves Title_refs against the worker, and that rejection is
     swallowed by nobody upstream of apply_result's own catch *)
  let sop =
    Ops.op "save-block"
      [ W.Map
          [ W.Keyword "block/uuid", W.Uuid "b1"
          ; W.Keyword "block/title", W.String "hellotyped"
          ]
      ; W.Map []
      ]
  in
  let* () =
    Ops.apply [ sop ]
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
  in
  check "failed commit keeps base" ((editing_now ()).S.base = "hello");
  eqs "failed commit sets no override" "?" (S.title_for "b1" "?");
  check "failed commit saw the save attempt" (!calls <> []);
  reset_editor ();
  Js.Promise.resolve ()

(* ---------- dirty-buffer refresh ---------- *)

let test_resync_clean_dirty (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "remote-v2" ];
  (* clean buffer: remote title replaces both buffer and base *)
  set_editing ~uuid:"b1" ~buffer:"remote-v1" ~caret:0 ~base:"remote-v1";
  let* () = Ops.resync_open_editor () in
  eqs "clean resync buffer" "remote-v2" (editing_now ()).S.buffer;
  eqs "clean resync base" "remote-v2" (editing_now ()).S.base;
  (* dirty buffer: remote title must not clobber typed text *)
  stage_page h [ Test_check.block "b1" "remote-v3" ];
  set_editing ~uuid:"b1" ~buffer:"typed" ~caret:5 ~base:"remote-v2";
  let* () = Ops.resync_open_editor () in
  eqs "dirty resync keeps buffer" "typed" (editing_now ()).S.buffer;
  eqs "dirty resync keeps base" "remote-v2" (editing_now ()).S.base;
  (* force (undo/redo) resynchronizes anyway *)
  let* () = Ops.resync_open_editor ~force:true () in
  eqs "forced resync buffer" "remote-v3" (editing_now ()).S.buffer;
  eqs "forced resync base" "remote-v3" (editing_now ()).S.base;
  (* a committed-but-unrefreshed title (display override) wins over a
     stale store read — resync must not resurrect the old title *)
  stage_page h [ Test_check.block "b1" "stale-store" ];
  set_editing ~uuid:"b1" ~buffer:"committed" ~caret:9 ~base:"committed";
  S.override_title "b1" "committed";
  let* () = Ops.resync_open_editor () in
  eqs "override survives resync" "committed" (editing_now ()).S.buffer;
  S.clear_overrides ();
  stage_page h [ Test_check.block "b1" "HXello" ];
  set_editing ~uuid:"b1" ~buffer:"HXello" ~caret:2 ~base:"HXello";
  let accepted = editing_now () in
  S.override_title "b1" "Hello";
  let* () = Ops.resync_open_editor () in
  let current = editing_now () in
  check "caught-up canonical title keeps accepted source, base and session"
    (current.S.model.EM.source = accepted.S.model.EM.source
     && current.S.buffer = accepted.S.buffer
     && current.S.base = accepted.S.base
     && current.S.epoch == accepted.S.epoch);
  S.clear_overrides ();
  reset_editor ();
  Js.Promise.resolve ()

let test_undo_redo_resync (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "undone-title" ];
  (* the open buffer is dirty — typed text masks the title undo
     restores *)
  set_editing ~uuid:"b1" ~buffer:"typed-over" ~caret:10 ~base:"orig";
  install_worker ~repo:h.repo h;
  let* () = Ops.undo () in
  eqs "undo forces buffer resync" "undone-title" (editing_now ()).S.buffer;
  eqs "undo forces base resync" "undone-title" (editing_now ()).S.base;
  check "undo op reached worker"
    (List.mem "thread-api/undo-redo-undo" !calls);
  (* redo follows the same chain *)
  stage_page h [ Test_check.block "b1" "redone-title" ];
  set_editing ~uuid:"b1" ~buffer:"typed-again" ~caret:11 ~base:"orig";
  let* () = Ops.redo () in
  eqs "redo forces buffer resync" "redone-title" (editing_now ()).S.buffer;
  check "redo op reached worker"
    (List.mem "thread-api/undo-redo-redo" !calls);
  reset_editor ();
  Js.Promise.resolve ()

(* ---------- deferred geometry ---------- *)

(* before a measurement reply exists the frame must carry no caret —
   no fabricated geometry; a partially-answered conduit reports no
   caret either *)
let test_measure_deferred () =
  let m = EM.create "hello" in
  let f = EI.measure EI.no_conduit m in
  check "measure without conduit has no caret" (f.EI.caret = None);
  let conduit =
    { EI.no_conduit with EI.caret_rect = (fun _ -> None) }
  in
  let f = EI.measure conduit m in
  check "pending reply yields no caret" (f.EI.caret = None);
  let conduit =
    { EI.no_conduit with
      EI.caret_rect =
          (fun off ->
            if off = m.EM.caret then Some { EI.x = 4; y = 2; w = 0; h = 8 }
            else None)
    }
  in
  let f = EI.measure conduit m in
  check "arrived reply completes" (f.EI.caret <> None)

(* stale/incomplete host line measurements are rejected before they can
   move the caret table — replies that drop text, skip the start, or
   overreach the source length never become model lines *)
let test_stale_line_ranges () =
  check "full partition accepted"
    (A.measured_partitions "abc def" [ (0, 3); (4, 7) ]);
  check "whitespace gaps allowed"
    (A.measured_partitions "a b c" [ (0, 1); (2, 3); (4, 5) ]);
  check "empty measurement rejected"
    (not (A.measured_partitions "abc" []));
  check "nonzero start rejected"
    (not (A.measured_partitions "abc" [ (1, 3) ]));
  check "dropped text rejected"
    (not (A.measured_partitions "abc" [ (0, 2) ]));
  check "non-whitespace gap rejected"
    (not (A.measured_partitions "abcdef" [ (0, 3); (4, 6) ]));
  check "stale overlong reply rejected"
    (not (A.measured_partitions "abc" [ (0, 3); (3, 9) ]));
  check "unordered reply rejected"
    (not (A.measured_partitions "abc" [ (1, 3); (0, 1) ]))

(* ---------- structural input ---------- *)

let test_enter_split (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "abcd" ];
  set_editing ~uuid:"b1" ~buffer:"abcd" ~caret:2 ~base:"abcd";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev "Enter", false));
  let e = editing_now () in
  check "enter moves editing to new block" (e.S.uuid <> "b1");
  check "enter keeps buffer suffix" (e.S.buffer = "cd");
  check "enter caret at 0" (e.S.model.EM.caret = 0);
  check "enter splits ordering" (current_titles () = [ "ab"; "cd" ]);
  (match !S.pending_focus with
   | Some request when request.S.focus_caret = 0 ->
       check "enter re-targets focus" (request.S.focus_uuid = e.S.uuid)
   | _ -> check "enter re-targets focus" false);
  let* () = settle h 40 in
  check "enter emitted insert-blocks" (List.mem "insert-blocks" (op_names ()));
  h.sync_page ();
  check "enter ordering survives refresh"
    (current_titles () = [ "ab"; "cd" ]);
  check "editing stays on new block" ((editing_now ()).S.uuid = e.S.uuid);
  (* repeated Enter at caret 0 of the new block inserts an empty
     sibling above without losing the suffix *)
  Editor_keys.apply_input e.S.uuid (EI.Key (EM.key_ev "Enter", false));
  let e2 = editing_now () in
  check "second enter makes empty sibling" (e2.S.buffer = "");
  check "second enter ordering" (current_titles () = [ "ab"; ""; "cd" ]);
  let* () = settle h 40 in
  h.sync_page ();
  reset_editor ();
  Js.Promise.resolve ()

let test_delete_merge_next (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "ab"; Test_check.block "b2" "cd" ];
  set_editing ~uuid:"b1" ~buffer:"ab" ~caret:2 ~base:"ab";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev "Delete", false));
  let* () = settle h 40 in
  let e = editing_now () in
  check "delete merges next buffer" (e.S.buffer = "abcd");
  check "delete keeps editing block" (e.S.uuid = "b1");
  check "delete merge caret" (e.S.model.EM.caret = 2);
  let* () = settle h 40 in
  check "delete emitted delete-blocks"
    (List.mem "delete-blocks" (op_names ()));
  check "delete emitted save-block"
    (List.exists (wire_has "abcd") (save_ops ()));
  h.sync_page ();
  reset_editor ();
  Js.Promise.resolve ()

let test_modified_delete_boundary (h : host) =
  let key = EM.key_ev "Delete" in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (name, key) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "ab"; Test_check.block "b2" "cd" ];
        set_editing ~uuid:"b1" ~buffer:"ab" ~caret:2 ~base:"ab";
        install_worker ~repo:h.repo h;
        Editor_keys.apply_input "b1" (EI.Key (key, false));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (name ^ "+Delete preserves the next block")
          ((editing_now ()).S.buffer = "ab"
           && (editing_now ()).S.model.EM.caret = 2
           && Option.is_some (S.find "b2")
           && not (List.mem "delete-blocks" (op_names ())));
        reset_editor ();
        run rest
  in
  run [ "Alt", { key with alt = true }; "Ctrl", { key with ctrl = true };
        "Meta", { key with meta = true }; "Shift", { key with shift = true } ]

(* continuous Delete across block boundaries: the merge is deferred
   until the surface is input-quiet, so a second Delete still in
   flight supersedes it — expected ["first","C","D"], and the
   buggy ["firstC","D"] merge is never emitted. *)
let test_continuous_delete_xfail (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "first"; Test_check.block "b2" "C"
    ; Test_check.block "b3" "D" ];
  set_editing ~uuid:"b1" ~buffer:"first" ~caret:5 ~base:"first";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev "Delete", false));
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev "Delete", false));
  let* () = settle h 40 in
  (* the fake worker never mutates the stored tree, so a merge would
     surface as a delete-blocks op + a merged editing buffer; the
     superseded plan emits neither — the tree stays ["first","C","D"] *)
  check "continuous Delete preserves block boundaries"
    ((not (List.mem "delete-blocks" (op_names ())))
     && (editing_now ()).S.buffer = "first");
  h.sync_page ();
  reset_editor ();
  Js.Promise.resolve ()

let test_backspace_merge_prev (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "ab"; Test_check.block "b2" "cd" ];
  set_editing ~uuid:"b2" ~buffer:"cd" ~caret:0 ~base:"cd";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b2" (EI.Key (EM.key_ev "Backspace", false));
  let* () = settle h 40 in
  let e = editing_now () in
  check "merge moves editing to prev" (e.S.uuid = "b1");
  check "merge concatenates" (e.S.buffer = "abcd");
  check "merge caret at joint" (e.S.model.EM.caret = 2);
  check "merge emitted delete-blocks"
    (List.mem "delete-blocks" (op_names ()));
  h.sync_page ();
  reset_editor ();
  Js.Promise.resolve ()

let test_indent_outdent (h : host) =
  let* () = settle h 40 in
  stage_page h
    [ Test_check.block "b1" "ab"; Test_check.block "b2" "cd" ];
  set_editing ~uuid:"b2" ~buffer:"cd" ~caret:1 ~base:"cd";
  install_worker ~repo:h.repo h;
  Editor_keys.apply_input "b2" (EI.Key (EM.key_ev "Tab", false));
  let* () = settle h 40 in
  check "indent emitted op"
    (List.mem "indent-outdent-blocks" (op_names ()));
  check "indent keeps editing" ((editing_now ()).S.uuid = "b2");
  check "indent keeps caret" ((editing_now ()).S.model.EM.caret = 1);
  h.sync_page ();
  ops := [];
  Editor_keys.apply_input "b2"
    (EI.Key (EM.key_ev ~shift:true "Tab", false));
  let* () = settle h 40 in
  check "outdent emitted op"
    (List.mem "indent-outdent-blocks" (op_names ()));
  check "outdent keeps editing" ((editing_now ()).S.uuid = "b2");
  h.sync_page ();
  reset_editor ();
  Js.Promise.resolve ()

let test_indent_undo_key_dispatch (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "b1" "Parent"; Test_check.block "b2" "Indent child"];
  set_editing ~uuid:"b2" ~buffer:"Indent child" ~caret:2 ~base:"Indent child";
  S.clear_editor_start_pos ();
  S.history_input_before := None;
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  let before = !Runtime.current_page in
  let cursor = ref W.Nil and undos = ref 0 and release = ref (fun () -> ()) in
  let acknowledgement = Js.Promise.make (fun ~resolve ~reject:_ ->
    release := (fun () -> resolve W.Nil [@u])) in
  Runtime.worker := Some {worker with Worker_client.invoke_fn=(fun name args ->
    match name,args with
    | "thread-api/apply-outliner-ops",[_;_;opts] ->
        cursor := Option.value (W.get opts "undo-redo/editor-info") ~default:W.Nil;
        let* result = worker.invoke_fn name args in
        let* _ = acknowledgement in
        Js.Promise.resolve result
    | "thread-api/undo-redo-undo",_ ->
        incr undos;
        if !undos = 2 then Js.Promise.resolve (W.Map [])
        else if !undos = 3 then h.reject_promise "undo fixture rejected"
        else begin
        Runtime.current_page := before; h.sync_page ();
        Js.Promise.resolve (W.Map [W.kw "undo?",W.Bool true;
          W.kw "editor-cursors",W.List [!cursor]])
        end
    | _ -> worker.invoke_fn name args)};
  let previous_cmdk = !Cmdk_state.latest_st in
  Option.iter (fun state -> Cmdk_state.latest_st := Some
    {state with Cmdk_state.svs = {state.Cmdk_state.svs with Cmdk_state.Svs.undo=A.undo}}) previous_cmdk;
  Editor_keys.apply_input "b2" (EI.Key (EM.key_ev "Tab",false));
  let* () = h.wait_ms 25 in
  check "Indent is pending when the editing undo shortcut arrives" !S.structure_pending;
  let base = Ui_services.dom_body () in
  let input = {base with Ui_services.editable=(fun () -> true);
    attr=(function "data-block-id" -> Some "b2" | _ -> None)} in
  let target = {input with Ui_services.closest=(function
    | ".ed-input" | ".ed-input, .CodeMirror, .code-editor" | ".editor-wrapper" -> Some input
    | _ -> None)} in
  let prevented = ref false in
  let send_undo () = Editor_keys.on_global_key
    { Ui_services.x=0.;y=0.;shift=false;meta=true;ctrl=false;alt=false;
      composing=false;key=Some "z";key_char=Some "z";buttons=0;button=0;repeat=false;
      movement_x=0.;movement_y=0.;default_prevented=false;target=Some target;touches=[];
      detail=(fun _ -> None);detail_json=(fun _ -> None);clipboard_get=(fun _ -> "");
      clipboard_snapshot=(fun () -> Ui_services.empty_clipboard_snapshot);
      clipboard_set=(fun _ _ -> ());data_transfer_get=(fun _ -> "");files=[];has_files=false;
      prevent_default=(fun () -> prevented:=true);stop_propagation=(fun () -> ());
      stop_immediate=(fun () -> ()) } in
  send_undo ();
  check "Editing Cmd+Z dispatches and waits for the indent acknowledgement"
    (!prevented && !undos=0 && not (Queue.is_empty S.pending_edit_actions));
  !release ();
  let* () = settle h 40 in
  check "Editing Cmd+Z after Tab sends the worker undo call" (!undos=1);
  check "Editing Cmd+Z restores the root parent and the G1 caret"
    (match !Runtime.current_page,S.editing () with
     | Some page,Some e -> List.map (fun b -> b.Model.block_uuid) page.page_blocks
           = [Some "b1";Some "b2"] && e.uuid="b2" && e.model.EM.caret=2
     | _ -> false);
  send_undo ();
  let* () = settle h 40 in
  check "Editing undo with empty history keeps the restored parent and caret"
    (!undos=2 && !Runtime.current_page=before && (editing_now ()).model.EM.caret=2);
  send_undo ();
  let* () = settle h 40 in
  check "Rejected editing undo retains the restored block and caret"
    (!undos=3 && !Runtime.current_page=before && (editing_now ()).model.EM.caret=2);
  Cmdk_state.latest_st := previous_cmdk;
  Runtime.worker := Some worker;
  reset_editor ();
  Js.Promise.resolve ()

let test_indent_type_double_undo_caret (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "b1" "Parent";Test_check.block "b2" "Level two"];
  set_editing ~uuid:"b2" ~buffer:"Level two" ~caret:0 ~base:"Level two";
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  let committed = ref !Runtime.current_page and history = ref [] and undos = ref 0 in
  Runtime.worker := Some {worker with Worker_client.invoke_fn=(fun name args ->
    match name,args with
    | "thread-api/apply-outliner-ops",[_;_;opts] ->
        let before = !committed in
        let* result = worker.invoke_fn name args in
        if before <> !Runtime.current_page then begin
          history := (opts,before) :: !history;
          committed := !Runtime.current_page
        end;
        Js.Promise.resolve result
    | "thread-api/undo-redo-undo",_ ->
        incr undos;
        (match !history with
         | (opts,page) :: rest ->
             history := rest; committed := page;
             Runtime.current_page := page; h.sync_page ();
             let cursors = List.filter_map (W.get opts)
               ["undo-redo/editor-info";"undo-redo/editor-info-after"] in
             Js.Promise.resolve (W.Map [W.kw "undo?",W.Bool true;
               W.kw "editor-cursors",W.List cursors])
         | [] -> Js.Promise.resolve (W.Map []))
    | _ -> worker.invoke_fn name args)};
  Editor_keys.apply_input "b2" (EI.Key (EM.key_ev "Tab",false));
  let* () = settle h 40 in
  Editor_keys.apply_input "b2" (EI.Insert "abc");
  let* () = Ops.flush_pending_save () in
  let* () = settle h 40 in
  check "Indent and subsequent typing record separate before/after cursor pairs"
    (List.length !history=2
     && List.for_all (fun (opts,_) ->
       match W.get opts "undo-redo/editor-info" with
       | Some cursor -> W.get cursor "caret"=Some (W.Int 0)
           && W.get cursor "block-uuid"=Some (W.Uuid "b2")
       | None -> false) !history);
  let rec undo_twice n =
    if n=0 then Js.Promise.resolve () else begin
      A.undo ();
      let* () = h.wait_ms 25 in
      let* () = settle h 40 in
      check "Indent/type undo restores the recorded zero caret rather than the end of the block"
        (S.editing_uuid ()=Some "b2" && (editing_now ()).model.EM.caret=0
         && (editing_now ()).buffer="Level two");
      undo_twice (n-1)
    end in
  let* () = undo_twice 2 in
  check "The double-undo workflow consumes both recorded mutations" (!undos=2 && !history=[]);
  Runtime.worker := Some worker;
  reset_editor ();
  (* G2 undo-typing: master restore-cursor! prefers start-pos on undo. *)
  stage_page h [Test_check.block "b1" "abc"];
  set_editing ~uuid:"b1" ~buffer:"abc" ~caret:3 ~base:"abc";
  check "history_editing records master start-pos/end-pos"
    (match S.history_editing (editing_now ()) with
     | W.Map kvs ->
         W.get (W.Map kvs) "start-pos" = Some (W.Int 0)
         && W.get (W.Map kvs) "end-pos" = Some (W.Int 3)
         && W.get (W.Map kvs) "caret" = Some (W.Int 3)
     | _ -> false);
  let cursor =
    W.Map
      [ W.Keyword "block-uuid", W.Uuid "b1"
      ; W.Keyword "scope", W.String "main"
      ; W.Keyword "start-pos", W.Int 0
      ; W.Keyword "end-pos", W.Int 3
      ; W.Keyword "caret", W.Int 3 ]
  in
  set_editing ~uuid:"b1" ~buffer:"abc" ~caret:3 ~base:"abc";
  let* () = A.restore_history
      (W.Map [ W.Keyword "undo?", W.Bool true;
               W.Keyword "editor-cursors", W.List [cursor] ]) in
  check "Undo restores start-pos rather than the live end caret"
    (S.editing_uuid () = Some "b1" && (editing_now ()).model.EM.caret = 0);
  reset_editor ();
  stage_page h [Test_check.block "b1" "abc"];
  set_editing ~uuid:"b1" ~buffer:"abc" ~caret:0 ~base:"abc";
  let* () = A.restore_history
      (W.Map [ W.Keyword "undo?", W.Bool false;
               W.Keyword "editor-cursors", W.List [cursor] ]) in
  check "Redo restores end-pos / caret"
    (S.editing_uuid () = Some "b1" && (editing_now ()).model.EM.caret = 3);
  reset_editor ();
  Js.Promise.resolve ()

let test_indent_undo_restores_start_pos (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h
    [ Test_check.block "b1" "alpha"
    ; Test_check.block "b2" "beta"
        ~children:[ Test_check.block "b2a" "beta-1"; Test_check.block "b2b" "beta-2" ]
    ; Test_check.block "b3" "gamma"
    ];
  set_editing ~uuid:"b3" ~buffer:"gamma" ~caret:0 ~base:"gamma";
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  let committed = ref !Runtime.current_page
  and history = ref []
  and redo_stack = ref [] in
  Runtime.worker := Some {worker with Worker_client.invoke_fn=(fun name args ->
    match name,args with
    | "thread-api/apply-outliner-ops",[_;_;opts] ->
        let before = !committed in
        let* result = worker.invoke_fn name args in
        if before <> !Runtime.current_page then begin
          history := (opts,before,!Runtime.current_page) :: !history;
          redo_stack := [];
          committed := !Runtime.current_page
        end;
        Js.Promise.resolve result
    | "thread-api/undo-redo-undo",_ ->
        (match !history with
         | (opts,before,after) :: rest ->
             history := rest;
             redo_stack := (opts,before,after) :: !redo_stack;
             committed := before;
             Runtime.current_page := before; h.sync_page ();
             let cursors = List.filter_map (W.get opts)
               ["undo-redo/editor-info";"undo-redo/editor-info-after"] in
             Js.Promise.resolve (W.Map [W.kw "undo?",W.Bool true;
               W.kw "editor-cursors",W.List cursors])
         | [] -> Js.Promise.resolve (W.Map []))
    | "thread-api/undo-redo-redo",_ ->
        (match !redo_stack with
         | (opts,before,after) :: rest ->
             redo_stack := rest;
             history := (opts,before,after) :: !history;
             committed := after;
             Runtime.current_page := after; h.sync_page ();
             let cursors = List.filter_map (W.get opts)
               ["undo-redo/editor-info";"undo-redo/editor-info-after"] in
             Js.Promise.resolve (W.Map [W.kw "undo?",W.Bool false;
               W.kw "editor-cursors",W.List cursors])
         | [] -> Js.Promise.resolve (W.Map []))
    | _ -> worker.invoke_fn name args)};
  (* End moves caret from 0 -> 5 while recording start-pos = 0 like master *)
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "End",false));
  check "End moves caret to end of gamma" ((editing_now ()).model.EM.caret = 5);
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "Tab",false));
  let* () = settle h 40 in
  A.undo ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Indent undo after End restores start-pos 0 on gamma"
    (S.editing_uuid () = Some "b3" && (editing_now ()).model.EM.caret = 0
     && (editing_now ()).buffer = "gamma");
  A.redo ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Indent redo restores end-pos 5 on gamma"
    (S.editing_uuid () = Some "b3" && (editing_now ()).model.EM.caret = 5);
  (* Undo again, then plain ArrowRight x2 + Tab should keep caret at 2 on undo *)
  A.undo ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "ArrowRight",false));
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "ArrowRight",false));
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "Tab",false));
  let* () = settle h 40 in
  A.undo ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Plain Arrow motion before indent keeps current caret on undo"
    (S.editing_uuid () = Some "b3" && (editing_now ()).model.EM.caret = 2);
  (* After autosave clears start-pos, End from a nonzero caret must
     capture that caret — not default 0 — as indent undo start-pos. *)
  S.clear_editor_start_pos ();
  S.history_input_before := None;
  set_editing ~uuid:"b3" ~buffer:"gamma" ~caret:2 ~base:"gamma";
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "End",false));
  check "End from mid-block after autosave moves caret to end"
    ((editing_now ()).model.EM.caret = 5);
  Editor_keys.apply_input "b3" (EI.Key (EM.key_ev "Tab",false));
  let* () = settle h 40 in
  A.undo ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Indent undo after End from mid-block restores pre-End caret 2"
    (S.editing_uuid () = Some "b3" && (editing_now ()).model.EM.caret = 2
     && (editing_now ()).buffer = "gamma");
  Runtime.worker := Some worker;
  reset_editor ();
  Js.Promise.resolve ()

(* ---------- run ---------- *)

let test_exit_waits_for_save (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "old" ];
  set_editing ~uuid:"b1" ~buffer:"saved before exit" ~caret:17 ~base:"old";
  let complete = ref (fun () -> ()) in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name args ->
        if name = "thread-api/apply-outliner-ops" then
          Js.Promise.make (fun ~resolve ~reject:_ ->
              complete := (fun () ->
                  (match args with
                   | [ _; W.Array os; _ ] -> apply_ops h os
                   | _ -> ());
                  resolve (W.Map [ W.Keyword "result", W.Nil ]) [@u]))
        else Js.Promise.resolve (worker_handler h name args))
    ; on_message = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  A.exit_edit ~select:true;
  let* () = h.wait_ms 25 in
  check "editing remains mounted until the save succeeds" (S.editing_uuid () = Some "b1");
  !complete ();
  let* () = settle h 40 in
  check "successful save exits editing" (S.editing () = None);
  check "saved text survives exit" (current_titles () = [ "saved before exit" ]);
  reset_editor ();
  Js.Promise.resolve ()

let test_modifier_select_preserves_sidebar_scope (h : host) =
  let module E = Editor_state in
  let prev_last = !A.last_edit_uuid in
  let scope = "sidebar-scope" in
  let unregister =
    E.register_block_source ~scope ~kind:E.Outliner (fun () ->
        [ block "side-only" "side" ])
  in
  let pointer_ev =
    { Ui_services.x = 0.
    ; y = 0.
    ; shift = false
    ; meta = false
    ; ctrl = true
    ; alt = false
    ; composing = false
    ; key = None
    ; key_char = None
    ; buttons = 1
    ; button = 0
    ; repeat = false
    ; movement_x = 0.
    ; movement_y = 0.
    ; default_prevented = false
    ; target = None
    ; touches = []
    ; detail = (fun _ -> None)
    ; detail_json = (fun _ -> None)
    ; clipboard_get = (fun _ -> "")
    ; clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot)
    ; clipboard_set = (fun _ _ -> ())
    ; data_transfer_get = (fun _ -> "")
    ; files = []
    ; has_files = false
    ; prevent_default = (fun () -> ())
    ; stop_propagation = (fun () -> ())
    ; stop_immediate = (fun () -> ())
    }
  in
  let run ~dirty label =
    let* () = settle h 40 in
    reset_editor ();
    stage_page h [ block "main-a" "main"; block "main-b" "b" ];
    install_worker ~repo:h.repo h;
    set_editing ~uuid:"main-a" ~buffer:(if dirty then "main dirty" else "main")
      ~caret:0 ~base:"main";
    E.set (fun st ->
        { st with
          E.selection_scope = scope
        ; selected = E.String_set.empty
        ; anchor = None
        ; action_bar = false
        });
    A.last_edit_uuid := None;
    check (label ^ " is a modifier gesture")
      (Block_selection.modifier_select pointer_ev "side-only");
    check (label ^ " routes exit_edit")
      (!A.last_edit_uuid = Some "main-a");
    if dirty then
      check (label ^ " keeps sidebar scope and selected UUID while save pending")
        (E.selection_scope () = scope
         && E.String_set.equal (E.selected ())
              (E.String_set.singleton "side-only")
         && E.editing_uuid () = Some "main-a");
    let* () = settle h 40 in
    if dirty then
      check (label ^ " saves the dirty block through the worker")
        (List.exists (wire_has "main dirty") (save_ops ()));
    check (label ^ " keeps sidebar scope and selected UUID")
      (E.selection_scope () = scope
       && E.String_set.equal (E.selected ())
            (E.String_set.singleton "side-only")
       && E.editing () = None);
    check (label ^ " resolves selected UUID in the preserved scope")
      (List.exists
         (fun b -> b.Model.block_uuid = Some "side-only")
         (A.selection_forest ()));
    reset_editor ();
    Js.Promise.resolve ()
  in
  let* () = run ~dirty:false "clean exit" in
  let* () = run ~dirty:true "save exit" in
  unregister ();
  A.last_edit_uuid := prev_last;
  Js.Promise.resolve ()

let test_sidebar_escape_selection (h : host) =
  let scope = "escape-sidebar" in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | dirty :: rest ->
        let* () = settle h 40 in
        stage_page h [ block "b1" "side" ];
        install_worker ~repo:h.repo h;
        let unregister =
          S.register_block_source ~scope ~kind:S.Outliner (fun () ->
              (Option.get !Runtime.current_page).Model.page_blocks)
        in
        set_editing ~uuid:"b1" ~buffer:(if dirty then "side dirty" else "side")
          ~caret:0 ~base:"side";
        S.set (fun st ->
            { st with
              S.editing = Some { (editing_now ()) with S.scope }
            ; selection_scope = scope
            ; selected = S.String_set.empty
            });
        A.exit_edit ~select:true;
        let* () = settle h 40 in
        check "Escape selects the edited sidebar block in its own scope"
          (S.editing () = None && S.selection_scope () = scope
           && S.String_set.equal (S.selected ()) (S.String_set.singleton "b1"));
        check "Escape retains the sidebar block source"
          (List.exists (fun b -> b.Model.block_uuid = Some "b1")
             (A.selection_forest ()));
        unregister ();
        reset_editor ();
        run rest
  in
  run [ false; true ]

let test_select_all_exit (h : host) =
  let* () = settle h 40 in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | rejected :: rest ->
        reset_editor ();
        stage_page h [ Test_check.block "b1" "old"; Test_check.block "b2" "second" ];
        A.clear_selection ();
        set_editing ~uuid:"b1" ~buffer:"saved before selection" ~caret:22 ~base:"old";
        install_worker ~repo:h.repo h;
        let worker = Option.get !Runtime.worker in
        let attempted = ref false in
        Runtime.worker := Some { worker with Worker_client.invoke_fn =
          (fun name args ->
            if name = "thread-api/apply-outliner-ops" then begin
              attempted := true;
              if rejected then h.reject_promise "select-all save rejected"
              else worker.Worker_client.invoke_fn name args
            end else worker.Worker_client.invoke_fn name args) };
        Editor_keys.apply_input "b1"
          (EI.Key (EM.key_ev ~meta:true ~shift:true "A", false));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check "Select-all commits its edited block before retiring the input" !attempted;
        if rejected then
          check "A rejected select-all save retains the dirty editor"
            (S.editing_uuid () = Some "b1"
             && A.live_buffer "b1" = "saved before selection")
        else begin
          check "Select-all exits editing and preserves the outline selection"
            (S.editing () = None
             && S.String_set.equal (S.selected ()) (S.String_set.of_list ["b1"; "b2"])
             && S.selection_scope () = "main" && S.anchor () = Some "b1");
          check "Select-all saves the complete buffer"
            (current_titles () = ["saved before selection"; "second"])
        end;
        Runtime.worker := Some worker;
        run rest
  in
  let* () = run [false; true] in
  reset_editor ();
  stage_page h [];
  A.clear_selection ();
  A.select_all ();
  check "Select-all on an empty outline leaves no editor or selection"
    (S.editing () = None && S.String_set.is_empty (S.selected ()));
  Js.Promise.resolve ()

let test_enter_edit_origin (h : host) =
  let saved = h.snapshot () in
  let generation = !Runtime.load_gen in
  let rec run index = function
    | [] -> Js.Promise.resolve ()
    | (name, change_origin, accept) :: rest ->
        reset_editor ();
        install_worker ~repo:h.repo h;
        let ref_uuid = Printf.sprintf "cf8930ea-8c00-40d0-a000-%012d" index in
        let requested = ref false in
        let release = ref (fun () -> ()) in
        let metadata = Js.Promise.make (fun ~resolve ~reject:_ ->
            release := (fun () -> resolve (W.Map
                [ W.Keyword "block/title", W.String "Converted Target"
                ; W.Keyword "block/name", W.String "converted-target" ]) [@u])) in
        let worker = Option.get !Runtime.worker in
        Runtime.worker := Some { worker with Worker_client.invoke_fn =
          (fun method_name args ->
            match method_name, args with
            | "thread-api/pull",
              [ _; _; W.Array [ W.Keyword "block/uuid"; W.Uuid uuid ] ]
              when uuid = ref_uuid -> requested := true; metadata
            | _ -> worker.Worker_client.invoke_fn method_name args) };
        stage_page h [ Test_check.block "entry-block" ("[[" ^ ref_uuid ^ "]]") ];
        A.enter_edit ~scope:"main" "entry-block" (-1);
        let* () = h.wait_ms 25 in
        check ("edit entry awaits title conversion: " ^ name)
          (!requested && S.editing () = None);
        change_origin ();
        !release ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("edit entry publishes only to its originating load: " ^ name)
          (if accept then match S.editing () with
            | Some e -> e.S.uuid = "entry-block" && e.S.scope = "main"
                && e.S.model.EM.source = "[[Converted Target]]"
                && e.S.model.EM.caret = String.length "[[Converted Target]]"
            | None -> false
           else S.editing () = None && !S.pending_focus = None);
        reset_editor ();
        Runtime.load_gen := generation;
        h.restore saved;
        run (index + 1) rest
  in
  run 0
    [ "current", (fun () -> ()), true
    ; "route round trip", (fun () ->
          let current = h.snapshot () in
          h.restore { current with Model.route = Model.Page "other-entry-page" };
          h.restore current), false
    ; "same-route reload", (fun () -> incr Runtime.load_gen), false ]

let test_exit_after_navigation (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "saved" ];
  set_editing ~uuid:"b1" ~buffer:"saved" ~caret:5 ~base:"saved";
  install_worker ~repo:h.repo h;
  A.exit_edit ~select:false;
  h.restore { (h.snapshot ()) with Model.route = Model.Page "other-page" };
  let* () = settle h 40 in
  check "navigation does not skip completed edit exit" (S.editing () = None);
  reset_editor ();
  Js.Promise.resolve ()

let test_navigation_retires_dirty_editor (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "old" ];
  set_editing ~uuid:"b1" ~buffer:"saved on navigation" ~caret:19 ~base:"old";
  let hash = Ui_services.nav_hash () in
  let complete = ref (fun () -> ()) in
  let saved = ref W.Nil in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name args ->
        if name = "thread-api/apply-outliner-ops" then
          Js.Promise.make (fun ~resolve ~reject:_ ->
              complete := (fun () ->
                  saved := W.Array args;
                  resolve (W.Map [ W.Keyword "result", W.Nil ]) [@u]))
        else if name = "thread-api/get-latest-journals" then Js.Promise.resolve (W.List [])
        else Js.Promise.resolve
          (if owned_call name then worker_handler h name args else h.base_handler name args))
    ; on_message = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  Ui_services.nav_set_hash "#/page/navigation-target";
  Router.resolve ();
  check "navigation begins with a legitimately empty destination page store"
    ((Runtime.model ()).Model.route = Model.Page "navigation-target"
     && (Runtime.model ()).Model.route_page = None);
  check "navigation retires the source editor before its save resolves"
    (S.editing () = None);
  h.restore { (h.snapshot ()) with Model.repo = Some "navigation-other-graph";
    route = Model.Page "other-page"; route_page = None };
  let* () = h.wait_ms 25 in
  !complete ();
  let* () = settle h 40 in
  check "navigation persists the captured source buffer in its original graph"
    (match !saved with
     | W.Array [ W.String repo; W.Array [ W.Array [ W.Keyword "save-block"; W.Array (bm :: _) ] ]; _ ] ->
         repo = h.repo && W.get bm "block/title" = Some (W.String "saved on navigation")
     | _ -> false);
  Ui_services.nav_set_hash hash;
  reset_editor ();
  let rec switch = function
    | [] -> Js.Promise.resolve ()
    | reject_save :: rest ->
        stage_page h [ Test_check.block "b1" "hello" ];
        set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
        let release = ref (fun () -> ()) in
        let structure = Js.Promise.make (fun ~resolve ~reject:_ ->
            release := (fun () -> resolve W.Nil [@u]))
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) in
        A.run_structure ~restore:(S.editing ()) structure (fun () -> ());
        Editor_keys.apply_input "b1" (EI.Delete EI.Del_backward);
        Editor_keys.apply_input "b1" (EI.Insert "q");
        S.pending_focus_actions := [ (fun () -> Editor_keys.apply_input "b1" (EI.Insert "x")) ];
        let saved = ref W.Nil and complete = ref (fun () -> ()) in
        Runtime.worker := Some
          { Worker_client.invoke_fn = (fun name args ->
              if name = "thread-api/apply-outliner-ops" then begin
                saved := W.Array args;
                Js.Promise.make (fun ~resolve ~reject:_ ->
                    complete := (fun () -> resolve W.Nil [@u]))
                |> Js.Promise.then_ (fun _ ->
                    if reject_save then h.reject_promise "navigation save rejected"
                    else Js.Promise.resolve (W.Map [ W.Keyword "result", W.Nil ]))
              end else if name = "thread-api/get-journal-page-by-day" then
                Js.Promise.resolve (W.Map [])
              else if name = "thread-api/get-latest-journals" then
                Js.Promise.resolve (W.List [])
              else Js.Promise.resolve
                (if owned_call name then worker_handler h name args else h.base_handler name args))
          ; on_message = (fun _ _ -> ())
          ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        let failed = ref false in
        let navigation = Graphs_ops.navigate_journal "navigation-other-graph"
          |> Js.Promise.catch (fun _ -> failed := true; Js.Promise.resolve ()) in
        let* () = h.wait_ms 25 in
        check "graph switch keeps A while accepted input is queued"
          (Runtime.repo () = h.repo && (editing_now ()).S.buffer = "hello");
        !release ();
        let* () = h.wait_ms 25 in
        check "graph switch saves queued structural then text input in A"
          (match !saved with
           | W.Array [ W.String repo; W.Array [ W.Array [ W.Keyword "save-block"; W.Array (bm :: _) ] ]; _ ] ->
               repo = h.repo && W.get bm "block/title" = Some (W.String "hellqx")
           | _ -> false);
        check "graph switch waits for the accepted text save"
          (Runtime.repo () = h.repo && (editing_now ()).S.buffer = "hellqx");
        !complete ();
        let* () = navigation in
        check "only a successful save permits leaving A"
          (if reject_save then
             !failed && Runtime.repo () = h.repo
             && (editing_now ()).S.buffer = "hellqx" && (editing_now ()).S.base = "hello"
           else not !failed && Runtime.repo () = "navigation-other-graph" && S.editing () = None);
        reset_editor ();
        switch rest
  in
  switch [ false; true ]

let test_navigation_history (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "b1" "history source"];
  let source = h.snapshot () in
  let original_hash = Ui_services.nav_hash () in
  let target = Model.Page "History Target" in
  set_editing ~uuid:"b1" ~buffer:"history saved" ~caret:13 ~base:"history source";
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  let events = ref [] and payloads = ref [] and fail_record = ref false in
  let release = ref (fun () -> ()) in
  Runtime.worker := Some {worker with Worker_client.invoke_fn = (fun name args ->
    if name = "thread-api/apply-outliner-ops" then begin
      events := !events @ ["save"];
      let* _ = Js.Promise.make (fun ~resolve ~reject:_ ->
        release := (fun () -> resolve W.Nil [@u])) in
      worker.Worker_client.invoke_fn name args
    end else if name = "thread-api/undo-redo-record-ui-state" then begin
      events := !events @ ["record"];
      match args with
      | [W.String repo; W.String payload] ->
          check "Route history remains bound to its initiating graph" (repo = h.repo);
          if !fail_record then h.reject_promise "history record fixture rejected"
          else (payloads := !payloads @ [payload]; Js.Promise.resolve W.Nil)
      | _ -> invalid_arg "history record fixture protocol"
    end else if name = "thread-api/undo-redo-undo" then begin
      events := !events @ ["undo"];
      Js.Promise.resolve (W.Map [W.kw "undo?", W.Bool true;
        W.kw "ui-state-str", W.String (List.hd !payloads)])
    end else if name = "thread-api/get-page-route-info" then Js.Promise.resolve W.Nil
    else worker.Worker_client.invoke_fn name args) };
  Ui_services.nav_set_hash (Runtime.nav_hash "#/page/History%20Target");
  Router.resolve ();
  let* () = h.wait_ms 25 in
  check "Navigation cannot precede its accepted text save in undo history"
    (!events = ["save"] && !payloads = []);
  h.restore {source with Model.route = target; route_page = None};
  let history = Ops.undo () in
  let* () = h.wait_ms 25 in
  check "Undo waits for a save already detached by route navigation" (!events = ["save"]);
  !release ();
  let* () = history in
  check "Accepted text, navigation state and undo dispatch retain their order"
    (!events = ["save";"record";"undo"]);
  let payload = List.hd !payloads in
  let states = Transit.of_string payload in
  check "Undo of navigation restores its prior page hash"
    (Ui_services.nav_hash () = Runtime.nav_hash
       (Option.get (A.History_ui.href (Option.get (W.get states "old-state")))));
  Router.resolve ();
  h.restore source;
  let* () = h.wait_ms 25 in
  check "Restoring navigation does not create another undo entry" (List.length !payloads = 1);
  let* () = A.restore_history (W.Map [W.kw "undo?", W.Bool false;
    W.kw "ui-state-str", W.String payload]) in
  check "Redo restores the destination rather than the editing source page"
    (Ui_services.nav_hash () = Runtime.nav_hash "#/page/History%20Target");
  Router.resolve ();
  h.restore {source with Model.route = target; route_page = None};
  let* () = h.wait_ms 25 in
  check "Redo also suppresses recording its own navigation" (List.length !payloads = 1);
  A.History_ui.record_navigation ~before:target ~after:target;
  h.restore {source with Model.repo = None};
  A.History_ui.record_navigation ~before:source.Model.route ~after:target;
  check "Unchanged routes and sessions without a graph add no history" (List.length !payloads = 1);
  check "A result without UI history is left to editor-cursor restoration"
    (not (A.History_ui.restore W.Nil));
  check "Invalid internal UI history payloads are rejected"
    (try ignore (A.History_ui.restore (W.Map [W.kw "ui-state-str", W.Int 1])); false
     with Invalid_argument _ -> true);
  h.restore source;
  fail_record := true;
  A.History_ui.record_navigation ~before:source.Model.route ~after:target;
  let* () = h.wait_ms 25 in
  check "A failed history write neither invents an entry nor changes the active route"
    (List.length !payloads = 1 && Runtime.route () = source.Model.route);
  Runtime.worker := Some worker;
  A.History_ui.restoring := None;
  Ui_services.nav_replace_hash original_hash;
  reset_editor ();
  Js.Promise.resolve ()

let test_history_after_navigation (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "first"; Test_check.block "b2" "second" ];
  set_editing ~uuid:"b1" ~buffer:"first" ~caret:2 ~base:"first";
  let cursor = S.history_cursor () in
  let complete = ref (fun () -> ()) in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name args ->
        if name = "thread-api/undo-redo-undo" then
          Js.Promise.make (fun ~resolve ~reject:_ ->
            complete := (fun () -> resolve
              (W.Map [ W.Keyword "undo?", W.Bool true;
                       W.Keyword "editor-cursors", W.List [cursor] ]) [@u]))
        else Js.Promise.resolve (worker_handler h name args))
    ; on_message = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  A.undo ();
  let* () = h.wait_ms 25 in
  h.restore { (h.snapshot ()) with Model.route = Model.Page "other-page" };
  set_editing ~uuid:"b2" ~buffer:"second" ~caret:6 ~base:"second";
  !complete ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "delayed history leaves the destination editor intact" (S.editing_uuid () = Some "b2");
  reset_editor ();
  Js.Promise.resolve ()

let test_queued_history_origin (h : host) =
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (label, operation, changed) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "latest" ];
        set_editing ~uuid:"b1" ~buffer:"latest" ~caret:6 ~base:"latest";
        let page = Option.get !Runtime.current_page in
        let source = ref [ "previous"; "earlier" ] in
        let source_title = ref "latest" and destination_title = ref "destination" in
        let first = ref true and complete = ref (fun () -> ()) in
        let signal = ref (fun () -> ()) in
        let started = Js.Promise.make (fun ~resolve ~reject:_ ->
            signal := (fun () -> resolve true [@u])) in
        let page_for repo =
          { page with Model.page_blocks =
              [ Test_check.block "b1"
                  (if repo = h.repo then !source_title else !destination_title) ] }
        in
        Runtime.worker := Some
          { Worker_client.invoke_fn = (fun name args ->
              match name, args with
              | ("thread-api/undo-redo-undo" | "thread-api/undo-redo-redo"), W.String repo :: _ ->
                  if repo = h.repo then begin
                    match !source with
                    | title :: remaining -> source_title := title; source := remaining
                    | [] -> ()
                  end else destination_title := "destination history moved";
                  if !first then begin
                    first := false;
                    Js.Promise.make (fun ~resolve ~reject:_ ->
                        complete := (fun () -> resolve W.Nil [@u]);
                        !signal ())
                  end else Js.Promise.resolve W.Nil
              | "thread-api/get-page-blocks-tree", W.String repo :: _ ->
                  Js.Promise.resolve (page_w (page_for repo))
              | _ -> Js.Promise.resolve (worker_handler h name args))
          ; on_message = (fun _ _ -> ())
          ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        operation ();
        let* _ = started in
        operation ();
        if changed then begin
          let destination = page_for "other-graph" in
          h.restore { (h.snapshot ()) with Model.repo = Some "other-graph";
            route = Model.Page "destination"; route_page = Some destination };
          set_editing ~uuid:"b1" ~buffer:"destination" ~caret:11 ~base:"destination"
        end;
        !complete ();
        let* () = settle h 40 in
        let expected = if changed then "destination" else "earlier" in
        check label
          (current_titles () = [ expected ]
           && (editing_now ()).S.buffer = expected
           && (editing_now ()).S.base = expected
           && !destination_title = "destination");
        reset_editor ();
        run rest
  in
  run [ "queued undo follows its own refresh", A.undo, false;
        "queued undo never acquires the destination graph", A.undo, true;
        "queued redo follows its own refresh", A.redo, false;
        "queued redo never acquires the destination graph", A.redo, true ]

let test_delete_selection_history (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b0" "previous";
                 Test_check.block "b1" "first"; Test_check.block "b2" "second" ];
  S.set (fun st -> { st with S.editing = None;
      selected = S.String_set.of_list ["b1"; "b2"]; anchor = Some "b2" });
  let expected = S.history_cursor () in
  check "selection history records the range anchor"
    (W.map_get_uuid expected "selection-anchor" = Some "b2");
  let options = ref W.Nil in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name args ->
        if name = "thread-api/apply-outliner-ops" then
          (match args with [_; _; opts] -> options := opts | _ -> ());
        Js.Promise.resolve (worker_handler h name args))
    ; on_message = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  A.delete_selection ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "delete history keeps the selection before entering the previous block"
    (W.map_get !options "undo-redo/editor-info" = Some expected);
  let* () = A.restore_history
      (W.Map [ W.Keyword "undo?", W.Bool true;
               W.Keyword "editor-cursors", W.List [expected] ]) in
  check "undo restores the selected range anchor" ((S.read ()).anchor = Some "b2");
  reset_editor ();
  let rec first_block = function
    | [] -> Js.Promise.resolve ()
    | (name, selected, reject, title_focus) :: rest ->
        stage_page h [Test_check.block "b1" "first"];
        Runtime.send Action.Title_edit_done;
        S.set (fun st -> {st with S.selection_scope = "main";
          selected = S.String_set.of_list selected; anchor = List.nth_opt selected 0});
        options := W.Nil;
        if reject then install_rejecting_worker h
        else Runtime.worker := Some
          { Worker_client.invoke_fn = (fun name args ->
              if name = "thread-api/apply-outliner-ops" then
                (match args with [_; _; opts] -> options := opts | _ -> ());
              Js.Promise.resolve (worker_handler h name args))
          ; on_message = (fun _ _ -> ())
          ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        A.delete_selection ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("first-block deletion retains the correct focus: " ^ name)
          ((h.snapshot ()).Model.editing_title = title_focus
           && S.editing () = None
           && (not reject || S.String_set.mem "b1" (S.selected ())));
        let* () = if title_focus then begin
          let after = Option.get (W.map_get !options "undo-redo/editor-info-after") in
          Runtime.send Action.Title_edit_done;
          A.restore_history (W.Map [ W.Keyword "undo?", W.Bool false;
            W.Keyword "editor-cursors", W.List [after] ])
        end else Js.Promise.resolve () in
        check ("first-block redo retains the correct focus: " ^ name)
          ((h.snapshot ()).Model.editing_title = title_focus);
        Runtime.send Action.Title_edit_done;
        reset_editor ();
        first_block rest
  in
  let* () = first_block
      ["selected", ["b1"], false, true;
       "empty selection", [], false, false;
       "rejected deletion", ["b1"], true, false] in
  Js.Promise.resolve ()

(* Explicit property commands must publish worker truth while the editor
   remains open, without waiting for a later autosave or broadcast. *)
let test_task_cycle (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "b1" "task fixture"];
  set_editing ~uuid:"b1" ~buffer:"task fixture" ~caret:4 ~base:"task fixture";
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  let status = ref None and available = ref true and reads = ref 0 and writes = ref [] in
  let rows = List.mapi (fun index name ->
    W.Map [W.kw "db/id", W.Int (index + 31);
           W.kw "db/ident", W.Keyword ("logseq.property/status." ^ name)])
    ["todo"; "doing"; "done"] in
  Runtime.worker := Some { worker with Worker_client.invoke_fn = (fun name args ->
    if name = "thread-api/get-blocks" then begin
      incr reads;
      Js.Promise.resolve (W.List [W.Map [W.kw "block",
        W.Map (match !status with None -> [] | Some id ->
          [W.kw "logseq.property/status", W.Map [W.kw "db/id", W.Int id]])]])
    end else if name = "thread-api/get-property-closed-values" then
      Js.Promise.resolve (if !available then W.List rows
        else W.Map [W.kw "error", W.String "status fixture unavailable"])
    else begin
      if name = "thread-api/apply-outliner-ops" then
        (match args with
         | [_; W.Array mutations; _] -> List.iter (function
             | W.Array [W.Keyword "batch-set-property";
                        W.Array [_; W.Keyword "logseq.property/status"; W.Int id; _]] ->
                 status := Some id; writes := !writes @ [!status]
             | W.Array [W.Keyword "remove-block-property";
                        W.Array [_; W.Keyword "logseq.property/status"]] ->
                 status := None; writes := !writes @ [None]
             | _ -> ()) mutations
         | _ -> ());
      worker.Worker_client.invoke_fn name args
    end) };
  let rec cycle = function
    | [] -> Js.Promise.resolve ()
    | (meta, expected) :: rest ->
        Editor_keys.apply_input "b1"
          (EI.Key (EM.key_ev ~meta ~ctrl:(not meta) "Enter", false));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check "Modified Enter cycles the latest task status without splitting or exiting"
          (!status = expected && S.editing_uuid () = Some "b1"
           && current_titles () = ["task fixture"]
           && (editing_now ()).S.model.EM.caret = 4);
        cycle rest in
  let* () = cycle [true,Some 31; false,Some 32; true,Some 33; false,None] in
  check "Task cycling reads authoritative properties for every step"
    (!reads = 4 && !writes = [Some 31;Some 32;Some 33;None]);
  available := false;
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev ~meta:true "Enter", false));
  let* () = h.wait_ms 25 in
  check "Unavailable task values never dispatch a guessed property mutation"
    (!writes = [Some 31;Some 32;Some 33;None] && S.editing_uuid () = Some "b1");
  reset_editor ();
  stage_page h [];
  let before = !reads in
  Editor_keys.apply_input "b1" (EI.Key (EM.key_ev ~meta:true "Enter", false));
  let* () = h.wait_ms 25 in
  check "An empty editor does not create a task or a content block"
    (!reads = before && current_titles () = []);
  let services = Cmdk_host.services () in
  let shortcut_cycle uuids =
    check "The shortcut host uses an implemented task dispatch"
      (try services.Cmdk_services.cycle_todo uuids; true
       with Invalid_argument _ -> false)
  in
  shortcut_cycle [];
  check "The shortcut host does not invent a task target" (!reads = before);
  stage_page h [Test_check.block "b1" "task fixture"];
  set_editing ~uuid:"b1" ~buffer:"task fixture" ~caret:4 ~base:"task fixture";
  available := true;
  shortcut_cycle ["b1"];
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "The capture-phase shortcut host cycles the editing target without splitting"
    (!status = Some 31 && S.editing_uuid () = Some "b1"
     && current_titles () = ["task fixture"]
     && !writes = [Some 31;Some 32;Some 33;None;Some 31]);
  available := false;
  shortcut_cycle ["b1"];
  let* () = h.wait_ms 25 in
  check "The shortcut host rejects unavailable task values without writing"
    (!writes = [Some 31;Some 32;Some 33;None;Some 31]);
  Runtime.worker := Some worker;
  Js.Promise.resolve ()

let test_code_conversion_focus (h : host) =
  let previous_focus = !S.code_focus in
  let mounted = ref false and focused = ref [] in
  S.code_focus := (fun ~caret uuid ->
    if !mounted then (focused := (uuid,caret) :: !focused; true) else false);
  let convert () =
    stage_page h [Test_check.block "b1" ""];
    set_editing ~uuid:"b1" ~buffer:"/Code block" ~caret:11 ~base:"";
    Editor_commands.run_editor_cmd "b1" "code-block" 0 11
  in
  let* () = settle h 40 in
  install_worker ~repo:h.repo h;
  convert ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Code conversion waits for its widget without reopening the text editor"
    (S.editing () = None && !S.pending_focus <> None && !focused = []);
  mounted := true;
  A.focus_pending ();
  check "A mounted code widget receives conversion focus after text editing exits"
    (!focused = ["b1",0] && !S.pending_focus = None && S.editing () = None);
  reset_editor ();
  mounted := false;
  focused := [];
  let handler = worker_handler h in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun name args ->
    if name = "thread-api/apply-outliner-ops" then h.reject_promise "code conversion failed"
    else Js.Promise.resolve (handler name args));
    on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  convert ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "A failed code conversion restores editing without focusing a nonexistent widget"
    (S.editing_uuid () = Some "b1" && !focused = []);
  S.code_focus := previous_focus;
  reset_editor ();
  install_worker ~repo:h.repo h;
  let rec math = function
    | [] -> Js.Promise.resolve ()
    | (title,rejected)::rest ->
        stage_page h [Test_check.block "b1" title];
        set_editing ~uuid:"b1" ~buffer:(title ^ "/Math")
          ~caret:(String.length title+5) ~base:title;
        install_worker ~repo:h.repo h;
        if rejected then install_rejecting_worker h;
        Editor_commands.run_editor_cmd "b1" "math-block"
          (String.length title) (String.length title+5);
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check "Math converts the current block without inserting a sibling"
          (not (List.mem "insert-blocks" (op_names ()))
           && List.map String.trim (current_titles ())=[String.trim title]);
        if not rejected then
          check "Math writes the display type on the original block"
            (List.exists (function
              | W.Array [W.Keyword "set-block-property";
                  W.Array [W.Uuid "b1";W.Keyword "logseq.property.node/display-type";W.Keyword "math"]] -> true
              | _ -> false) !ops);
        reset_editor ();
        math rest
  in
  let* () = math ["",false;"Existing content ",false;"Existing content ",true] in
  let services = Ui_services.get () and previous_popup = !Popups_state.active in
  let off_insert = services.dom.subscribe_document_event ~capture:true
    "ls:editor-insert" Editor_keys.on_editor_insert in
  let off_command = services.dom.subscribe_document_event ~capture:true
    "ls:editor-command" Editor_commands.on_command in
  let rec slash = function
    | [] ->
        off_insert (); off_command (); Popups_state.active:=previous_popup;
        reset_editor (); install_worker ~repo:h.repo h; Js.Promise.resolve ()
    | (command,title,query,typed,sibling)::rest ->
        reset_editor ();
        (* Clear heading is gated like master — only listed when the block
           already has a heading. normal-text is not a slash label (master
           exposes Clear heading); keep query empty so filter does not close. *)
        let block =
          let b = {(Test_check.block "b1" title) with Model.block_display_type=typed} in
          if command = "clear-heading" then { b with Model.block_heading = Some 2 }
          else b in
        stage_page h [block];
        let source = title ^ "/" ^ query in
        set_editing ~uuid:"b1" ~buffer:source ~caret:(String.length source) ~base:title;
        install_worker ~repo:h.repo h;
        let popup = Option.get previous_popup in
        Popups_state.open_ac ~tpos:(String.length title) ~autopair:false popup Popups_state.Slash;
        let ac = Option.get (Popups_state.get popup).ac in
        Popups_state.ac_update popup ac query;
        let ac = Option.get (Popups_state.get popup).ac in
        Ops.schedule_save "b1" source;
        A.update_model "b1" (fun model -> EM.select model ~anchor:0 ~focus:0);
        Popups_state.apply_item popup ac ~meta:false
          (Popups_state.mk_item ~key:"conversion" ~label:"Conversion" (Popups_state.Editor_cmd command));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("Slash " ^ command ^ " removes its recorded trigger even after the caret moves")
          (List.map String.trim (current_titles ())=
            (if sibling then [String.trim title;""] else [String.trim title]));
        check ("Slash " ^ command ^ " follows Master's in-place versus sibling rule")
          (List.mem "insert-blocks" (op_names ())=sibling);
        if command="code-block" || command="math-block" || command="quote" then
          check ("Slash " ^ command ^ " writes display type to its intended block")
            (List.exists (function
              | W.Array [W.Keyword "set-block-property";
                  W.Array [W.Uuid target;W.Keyword "logseq.property.node/display-type";_]] ->
                    if sibling then target<>"b1" else target="b1"
              | _ -> false) !ops);
        slash rest
  in
  slash ["code-block","","",None,false;"code-block","","Code",None,false;
    "code-block","Existing ","Code",None,true;"code-block","","Code",Some "math",true;
    "calculator","","Calc",None,false;"quote","Existing ","Quote",None,false;
    "quote","Existing ","Quote",Some "math",false;"math-block","Existing ","Math",None,false;
    "heading:2","Existing ","Heading",None,false;"clear-heading","Existing ","Clear",None,false;
    "normal-text","Existing ","",None,false;"number-list","Existing ","Number",None,false]

let test_calculator_exit_structure (h : host) =
  let previous_buffer = !S.code_buffer_of in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (source, fail_save) :: rest ->
        let* () = settle h 40 in
        reset_editor ();
        stage_page h [{(Test_check.block "b1" "1+2") with Model.block_display_type=Some "code"}];
        set_editing ~uuid:"b1" ~buffer:"1+2" ~caret:3 ~base:"1+2";
        S.code_buffer_of := (fun uuid -> if uuid="b1" then Some source else previous_buffer uuid);
        install_worker ~repo:h.repo h;
        if fail_save then Runtime.worker := Some
          {Worker_client.invoke_fn=(fun name args ->
             if name="thread-api/apply-outliner-ops" then h.reject_promise "calculator save failed"
             else Js.Promise.resolve (worker_handler h name args));
           on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
        A.sync_buffer "b1" source;
        Ops.schedule_save "b1" source;
        if h.native then Code_mirror.on_native_event "b1"
          ~name:"key" ~value:(Some source) ~key:(Some "Escape")
        else A.exit_edit ~select:true;
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check "Calculator newline/empty input and Escape never append an outline root, including save failure"
          (List.length (current_titles ())=1
           && not (List.exists (fun op -> op_name op="insert-blocks") !ops)
           && (if fail_save then S.editing_uuid ()=Some "b1" && A.live_buffer "b1"=source
               else S.editing ()=None && current_titles ()=[source]));
        run rest in
  let* () = run ["1+2\n1+3",false; "",false; "1+2\nbad",true] in
  reset_editor ();
  stage_page h [{(Test_check.block "b1" "1+2") with Model.block_display_type=Some "code"}];
  set_editing ~uuid:"b1" ~buffer:"1+2" ~caret:3 ~base:"1+2";
  S.code_buffer_of := (fun uuid -> if uuid="b1" then Some "1+2" else previous_buffer uuid);
  install_worker ~repo:h.repo h;
  A.insert_sibling_after "b1";
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "The calculator Shift-Enter action explicitly appends exactly one empty sibling"
    (current_titles ()=["1+2";""] && List.exists (fun op -> op_name op="insert-blocks") !ops);
  S.code_buffer_of := previous_buffer;
  reset_editor ();
  install_worker ~repo:h.repo h;
  Js.Promise.resolve ()

let test_query_selection_conversion (h : host) =
  let previous_popup = !Popups_state.active in
  let popup = Option.get previous_popup in
  let rec run = function
    | [] -> Popups_state.active := previous_popup;
        reset_editor (); install_worker ~repo:h.repo h; Js.Promise.resolve ()
    | (title, edited, advanced, rejected, replace) :: rest ->
        let* () = settle h 40 in
        reset_editor ();
        Popups_state.close_ac popup;
        stage_page h [Test_check.block "b1" title];
        (* Append and selection-replacement slash input share the saved block. *)
        if replace then begin
          set_editing ~uuid:"b1" ~buffer:edited ~caret:(String.length edited) ~base:title;
          A.update_model "b1" Edit_model.select_all;
          Editor_keys.apply_input "b1" (EI.Insert "/");
          Editor_keys.apply_input "b1" (EI.Insert "Query")
        end else begin
          let source = edited ^ "/Query" in
          set_editing ~uuid:"b1" ~buffer:source ~caret:(String.length source) ~base:title;
          Popups_state.open_ac ~tpos:(String.length edited) ~autopair:false popup Popups_state.Slash
        end;
        let source = (editing_now ()).buffer in
        install_worker ~repo:h.repo h;
        let* () =
          if replace && title <> "" && rejected = 0 then begin
            Outliner_ops.schedule_save "b1" source;
            Outliner_ops.flush_pending_save ()
          end else Js.Promise.resolve () in
        let attempts = ref [] and committed = ref [] in
        Runtime.worker := Some {Worker_client.invoke_fn = (fun name args ->
          if name="thread-api/apply-outliner-ops" then begin
            (match args with [_;W.Array batch;_] -> attempts := batch :: !attempts | _ -> ());
            if rejected > 0 && List.length !attempts = rejected then
              h.reject_promise "query conversion rejected"
            else begin
              committed := List.hd !attempts :: !committed;
              Js.Promise.resolve (worker_handler h name args)
            end
          end else if name="thread-api/get-blocks"
            && (match args with [_;W.Array [request]] ->
                  W.get request "id"=Some (W.Uuid "b1") | _ -> false) then
            Js.Promise.resolve (W.Array [W.Map [W.Keyword "block", W.Map
              [W.Keyword "block/uuid", W.Uuid "b1";
               W.Keyword "logseq.property/query", W.Uuid "query-source"]]])
          else Js.Promise.resolve
            (if owned_call name then worker_handler h name args else h.base_handler name args));
          on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
        Popups_state.run_query popup (Option.get (Popups_state.get popup).Popups_state.ac) ~advanced;
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        let batch = List.concat !committed in
        let saves uuid source = List.exists (function
          | W.Array [W.Keyword "save-block";W.Array [block;_]] ->
              W.get block "block/uuid"=Some (W.Uuid uuid)
              && W.get block "block/title"=Some (W.String source)
          | _ -> false) batch in
        check "Query conversion matches master Query vs Advanced Query steps"
          (if rejected > 0 then not (saves "query-source" edited)
           else if advanced then
             (* advanced-query-steps: keep host title, empty code query child *)
             saves "b1" edited && saves "query-source" ""
             && List.mem (Ops.set_block_property "b1" "block/tags"
                  (W.Keyword "logseq.class/Query")) batch
             && List.mem (Ops.set_block_property "query-source"
                  "logseq.property.node/display-type" (W.Keyword "code")) batch
             && List.mem (Ops.set_block_property "query-source"
                  "logseq.property.code/lang" (W.String "clojure")) batch
           else
             saves "query-source" edited && saves "b1" ""
             && List.mem (Ops.set_block_property "b1" "block/tags"
                  (W.Keyword "logseq.class/Query")) batch);
        check "Query conversion does not leave a slash-trigger autosave pending"
          (rejected > 0 || !Ops.pending_save=None);
        check "Rejected query conversion never publishes a query title"
          (rejected = 0 || not (saves "query-source" edited));
        check "Rejected query conversion retains the live buffer and autosave"
          (rejected = 0 || (
            Option.fold ~none:false ~some:(fun e -> e.S.uuid="b1" && e.buffer=source)
                 (S.editing ()) && Option.is_some !Ops.pending_save));
        check "Successful query conversion exits only after its writes complete"
          (rejected > 0 || S.editing ()=None);
        run rest in
  run ["Search seed parity","Search seed parity",false,0,false;
       "Saved seed","Saved seed with unsaved edits ",false,0,false;
       "", "",false,0,false;
       "Advanced seed","Advanced seed",true,0,false;
       "Retain on rejection","Retain on rejection",false,1,false;
       "Saved seed","Unsaved edit on rejection ",false,1,false;
       "Saved seed","Unsaved edit on final rejection ",false,2,false;
       "Advanced seed","Unsaved advanced on rejection ",true,2,false;
       "G5RegressionToken","G5RegressionToken",false,0,true;
       "Saved seed","Unsaved replaced seed",false,0,true;
       "", "",false,0,true;
       "Retain replaced query on rejection","Retain replaced query on rejection",false,1,true]

let test_property_command_refresh (h : host) =
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (command, title) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" title ];
        set_editing ~uuid:"b1" ~buffer:title ~caret:(String.length title)
          ~base:title;
        calls := [];
        ops := [];
        Runtime.worker := Some
          { Worker_client.invoke_fn = (fun name args ->
              Js.Promise.resolve
                (if name = "thread-api/get-property-closed-values" then
                   W.List [ W.Map [ W.Keyword "db/id", W.Int 17;
                                    W.Keyword "block/title", W.String "Todo" ] ]
                 else worker_handler h name args))
          ; on_message = (fun _ _ -> ())
          ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        Editor_commands.run_editor_cmd "b1" command 0 5;
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (command ^ " publishes before any broadcast or autosave")
          (List.mem "thread-api/get-page-blocks-tree" !calls);
        check (command ^ " keeps the live buffer and caret")
          ((editing_now ()).S.model.EM.source = String.sub title 5 (String.length title - 5)
           && (editing_now ()).S.model.EM.caret = 0);
        check (command ^ " commits the property with the buffer")
          (List.mem (if command = "status:Todo" then "batch-set-property"
                     else "set-block-property") (op_names ()));
        reset_editor ();
        run rest
  in
  run [ "status:Todo", "/todo keep typing";
        "heading:2", "/head keep typing" ]

let test_youtube_timestamp_selection (h : host) =
  let previous = !Runtime.video_timestamp in
  let popup = Option.get !Popups_state.active in
  let rec run = function
    | [] -> Runtime.video_timestamp := previous; reset_editor (); Js.Promise.resolve ()
    | (prefix, playback, expected) :: rest ->
        let* () = settle h 40 in
        reset_editor ();
        stage_page h [Test_check.block "b1" (String.trim prefix)];
        install_worker ~repo:h.repo h;
        let source = prefix ^ "/Timestamp" in
        set_editing ~uuid:"b1" ~buffer:source ~caret:(String.length source) ~base:prefix;
        Popups_state.open_ac ~tpos:(String.length prefix) ~autopair:false popup Popups_state.Slash;
        Runtime.video_timestamp := (fun () -> playback);
        let ac = Option.get (Popups_state.get popup).Popups_state.ac in
        Popups_state.apply_item popup ac ~meta:false
          (Popups_state.mk_item ~key:"timestamp" ~label:"" (Editor_cmd "youtube-timestamp"));
        check "YouTube timestamp selection matches the available player state"
          (A.live_buffer "b1" = expected);
        let* () = Ops.flush_pending_save () in
        let* () = settle h 40 in
        check "YouTube timestamp selection persists the resulting host text"
          (current_titles () = [String.trim expected]);
        run rest in
  run ["Host ", Runtime.No_video, ""; "", Runtime.No_video, "";
       "Host ", Runtime.Playback_time 12, "Host {{youtube-timestamp 12}}";
       "Host ", Runtime.Player_pending, "Host "]
  |> Js.Promise.catch (fun _ -> Runtime.video_timestamp := previous;
    failwith "YouTube timestamp selection test failed")

let test_quick_add_opening (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "b1" "Host"];
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  Runtime.worker := Some {worker with Worker_client.invoke_fn = (fun name args ->
    match name, args with
    | "thread-api/get-case-page", [_;W.String "Quick add"] ->
        Js.Promise.resolve (W.Map [W.kw "block/uuid", W.Uuid "quick-page";
          W.kw "block/title", W.String "Quick add"])
    | "thread-api/get-page-blocks-tree", [_;W.Uuid "quick-page";_] ->
        Js.Promise.resolve (W.List [W.Map [W.kw "block/uuid", W.Uuid "quick-note";
          W.kw "block/title", W.String "Note"]])
    | _ -> worker.Worker_client.invoke_fn name args)};
  A.open_quick_add ();
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Quick Add opens its dialog and edits its last existing note"
    (Dialogs_state.is_open "quick-add" && S.editing_uuid () = Some "quick-note");
  Dialogs_state.close_named "quick-add";
  Runtime.worker := Some worker;
  reset_editor ();
  Js.Promise.resolve ()

let test_page_icon_refresh (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [];
  let previous_worker = !Runtime.worker in
  let response = ref (Ok (Some (W.Map
    [W.String "type", W.String "emoji"; W.String "id", W.String "100"]))) in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name args ->
        if name="thread-api/get-case-page" then
          match !response with
          | Error () -> h.reject_promise "page icon read failed"
          | Ok icon -> Js.Promise.resolve (W.Map
              ([W.kw "block/uuid",W.Uuid "p"; W.kw "block/title",W.String "p"]
               @ Option.to_list (Option.map (fun icon -> W.kw "logseq.property/icon",icon) icon)))
        else Js.Promise.resolve (if owned_call name then worker_handler h name args
                                 else h.base_handler name args))
    ; on_message=(fun _ _ -> ())
    ; dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  let rec run = function
    | [] -> Runtime.worker := previous_worker; Js.Promise.resolve ()
    | (value, expected) :: rest ->
        response := value;
        let* () = Ops.refresh_page () in
        check "Page refresh publishes authoritative own icons and preserves them on failed reads"
          (Option.bind (h.snapshot ()).Model.route_page (fun p -> p.Model.page_icon)=expected);
        run rest in
  run [!response, Some (Node_icon.emoji "100");
       Error (), Some (Node_icon.emoji "100"); Ok None, None]

let test_selection_direction (h : host) =
  stage_page h
    [ Test_check.block "b1" "first"; Test_check.block "b2" "anchor";
      Test_check.block "b3" "third" ];
  reset_editor ();
  A.select_single_in ~scope:"main" "b2";
  List.iter
    (fun (up, expected) ->
      A.extend_selection up;
      check "reversing selection contracts toward its anchor"
        (S.String_set.equal (S.selected ()) (S.String_set.of_list expected)
         && S.anchor () = Some "b2"))
    [ false, [ "b2"; "b3" ]; true, [ "b2" ];
      true, [ "b1"; "b2" ]; false, [ "b2" ] ];
  reset_editor ()

let test_selected_open (h : host) =
  let scope = "selected-open-sidebar" in
  let blocks = [ Test_check.block "b1" "first"; Test_check.block "b2" "last" ] in
  let release = S.register_block_source ~scope ~kind:S.Outliner (fun () -> blocks) in
  let enter =
    { Ui_services.x = 0.; y = 0.; shift = false; meta = false; ctrl = false;
      alt = false; composing = false; key = Some "Enter"; key_char = None;
      buttons = 0; button = 0; repeat = false; movement_x = 0.; movement_y = 0.;
      default_prevented = false; target = None; touches = [];
      detail = (fun _ -> None); detail_json = (fun _ -> None);
      clipboard_get = (fun _ -> "");
      clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot);
      clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
      files = []; has_files = false; prevent_default = (fun () -> ());
      stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) }
  in
  let rec run = function
    | [] -> release (); Js.Promise.resolve ()
    | (name, open_selection, uuid, caret) :: rest ->
        let* () = settle h 40 in
        stage_page h blocks;
        install_worker ~repo:h.repo h;
        reset_editor ();
        S.set (fun st -> { st with S.selection_scope = scope;
          selected = S.String_set.of_list [ "b1"; "b2" ]; anchor = Some "b1" });
        open_selection ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (name ^ " opens the selected endpoint in its scope")
          (match S.editing () with
           | Some e -> e.S.uuid = uuid && e.scope = scope && e.model.EM.caret = caret
           | None -> false);
        reset_editor ();
        run rest
  in
  let* () = run [ "Enter", (fun () -> Editor_keys.on_normal_key enter), "b2", 4;
        "Left", (fun () -> Editor_keys.dispatch_command "editor/left"), "b1", 0;
        "Right", (fun () -> Editor_keys.dispatch_command "editor/right"), "b2", 4 ] in
  stage_page h [];
  reset_editor ();
  Runtime.send Action.Title_edit_done;
  let page = Option.get (h.snapshot ()).Model.route_page in
  let uuid = Option.get page.Model.page_uuid in
  A.select_single_in ~scope:"main" uuid;
  Editor_keys.on_normal_key enter;
  check "Enter on a selected page title resumes title editing, not block editing"
    ((h.snapshot ()).Model.editing_title && S.editing () = None);
  Runtime.send Action.Title_edit_done;
  reset_editor ();
  Editor_keys.on_normal_key enter;
  check "Enter without selection does not start title editing"
    (not (h.snapshot ()).Model.editing_title);
  let journal = {page with Model.page_journal_day = Some 20260101} in
  h.stage (Some journal);
  Runtime.send (Action.Page_loaded journal);
  A.select_single_in ~scope:"main" uuid;
  Editor_keys.on_normal_key enter;
  check "Protected journal titles do not enter title editing"
    (not (h.snapshot ()).Model.editing_title);
  reset_editor ();
  Js.Promise.resolve ()

let test_scoped_collapse_commands (h : host) =
  let scope = "collapse-sidebar" in
  let uuid = "collapse-target" in
  let other = "collapse-other" in
  let projected = List.map (fun id ->
      let block = Test_check.block
          ~children:[ Test_check.block (id ^ "-child") "child" ] id id in
      { block with Model.block_default_collapsed = true })
      [ uuid; other ] in
  let unregister = S.register_block_source ~scope ~kind:S.Outliner (fun () -> projected) in
  let rec run = function
    | [] ->
        unregister ();
        reset_editor ();
        Js.Promise.resolve ()
    | (name, command, editing, before, want, db_before) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block uuid uuid; Test_check.block other other ];
        reset_editor ();
        install_worker ~repo:h.repo h;
        let complete_read = ref (fun () -> ()) in
        Option.iter (fun collapsed ->
          S.set (fun st -> { st with S.collapsed =
            (if collapsed = Some true then S.String_set.empty else S.String_set.singleton uuid) });
          let worker = Option.get !Runtime.worker in
          let selector = ref "" in
          let pending = Js.Promise.make (fun ~resolve ~reject:_ ->
            complete_read := (fun () -> resolve
              (match collapsed with
               | Some collapsed -> W.Map [W.Keyword "block/collapsed?", W.Bool collapsed]
               | None when !selector = "[:block/collapsed?]" -> W.Nil
               | None -> W.Map [W.Keyword "db/id", W.Int 1]) [@u])) in
          Runtime.worker := Some { worker with Worker_client.invoke_fn =
            (fun name args ->
              match name, args with
              | "thread-api/pull",
                [W.String repo; W.String selected; W.Array [W.Keyword "block/uuid"; W.Uuid id]]
                when repo = h.repo && id = uuid -> selector := selected; pending
              | _ -> worker.Worker_client.invoke_fn name args) }) db_before;
        List.iter (fun id ->
          S.set_collapsed ~scope:"main" id (not before);
          S.set_collapsed ~scope id (if id = uuid then before else want)) [ uuid; other ];
        A.select_single_in ~scope uuid;
        if editing then
          S.set (fun st -> { st with S.editing = Some
            (S.mk_editing ~uuid ~buffer:uuid ~base:uuid ~scope ()) })
        else
          S.set (fun st -> { st with S.selected = S.String_set.of_list [ uuid; other ] });
        (if command = "Meta+;" then
           Editor_keys.apply_input uuid
             (EI.Key ({ (EM.key_ev ";") with meta = true }, false))
         else Editor_keys.dispatch_command command);
        let* () = match db_before with
          | None -> Js.Promise.resolve ()
          | Some _ ->
              let* () = h.wait_ms 25 in
              check (name ^ " waits for persisted state before writing") (!ops = []);
              !complete_read ();
              Js.Promise.resolve ()
        in
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (name ^ " applies to its projection without changing the main override")
          (S.is_collapsed_in ~scope uuid = want
           && S.is_collapsed_in ~scope other = want
           && S.is_collapsed_in ~scope:"main" uuid = not before
           && S.is_collapsed_in ~scope:"main" other = not before);
        check (name ^ " preserves the entity collapse persistence intent")
          (List.for_all (fun id -> List.mem (Ops.collapse_expand [ id, want ]) !ops)
             (if editing then [uuid] else [uuid; other]));
        reset_editor ();
        run rest
  in
  run [ "selected toggle", "editor/toggle-block-children", false, false, false, Some (Some true);
        "editing toggle", "editor/toggle-block-children", true, true, true, Some (Some false);
        "editing Meta+;", "Meta+;", true, false, true, Some (Some false);
        "editing absent collapse flag", "Meta+;", true, false, true, Some None;
        "selected collapse", "editor/collapse-block-children", false, false, true, None;
        "selected expand", "editor/expand-block-children", false, true, false, None ]

let test_scoped_indent_target (h : host) =
  let* () = settle h 40 in
  let main = Test_check.block "main-parent" "main" in
  let target = Test_check.block "local-parent" "local" in
  let current = Test_check.block "local-child" "current" in
  stage_page h [ main; Test_check.block "main-other" "other" ];
  install_worker ~repo:h.repo h;
  reset_editor ();
  let release =
    S.register_block_source ~scope:"indent-test" ~kind:S.Outliner (fun () -> [ target; current ])
  in
  S.set_collapsed ~scope:"indent-test" "main-parent" true;
  S.set_collapsed ~scope:"indent-test" "local-parent" true;
  A.select_single_in ~scope:"indent-test" "local-child";
  A.indent_or_outdent ~indent:true;
  check "indent reveals its scoped target and preserves unrelated collapse"
    (not (S.is_collapsed_in ~scope:"indent-test" "local-parent")
     && S.is_collapsed_in ~scope:"indent-test" "main-parent");
  let* () = settle h 40 in
  release ();
  S.set_collapsed ~scope:"indent-test" "main-parent" false;
  S.set_collapsed ~scope:"indent-test" "local-parent" false;
  reset_editor ();
  Js.Promise.resolve ()

let test_move_block_chord (h : host) =
  let mac = Ui_services.env_is_mac () in
  let cases = List.concat_map (fun (meta, alt, moves) ->
      List.concat_map (fun editing -> List.map (fun up ->
          meta, alt, moves, editing, up) [ true; false ]) [ true; false ])
      [ true, false, mac; false, true, not mac;
        true, true, false; false, false, false ] in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (meta, alt, moves, editing, up) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "first";
                      Test_check.block "b2" "middle"; Test_check.block "b3" "last" ];
        reset_editor ();
        install_worker ~repo:h.repo h;
        let key = if up then "ArrowUp" else "ArrowDown" in
        if editing then (
          set_editing ~uuid:"b2" ~buffer:"middle" ~caret:3 ~base:"middle";
          Editor_keys.apply_input "b2" (EI.Key
            ({ (EM.key_ev key) with shift = true; meta; alt }, false)))
        else (
          A.select_single_in ~scope:"main" "b2";
          Editor_keys.on_normal_key
            { Ui_services.x = 0.; y = 0.; shift = true; meta; ctrl = false; alt;
              composing = false; key = Some key; key_char = None;
              buttons = 0; button = 0; repeat = false; movement_x = 0.; movement_y = 0.;
              default_prevented = false; target = None; touches = [];
              detail = (fun _ -> None); detail_json = (fun _ -> None);
              clipboard_get = (fun _ -> "");
              clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot);
              clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
              files = []; has_files = false; prevent_default = (fun () -> ());
              stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) });
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (Printf.sprintf "move chord mac=%b meta=%b alt=%b editing=%b up=%b"
            mac meta alt editing up)
          (List.mem (Ops.move_up_down [ "b2" ] up) !ops = moves);
        reset_editor ();
        run rest
  in run cases

let test_platform_delete (h : host) =
  let mac = Ui_services.env_is_mac () in
  let primary = EM.key_ev ~meta:mac ~ctrl:(not mac) "Backspace" in
  let source = "one two" in
  let cases =
    [ "primary", primary, 7, None, false,
        (if mac then "" else "one "), (if mac then 0 else 4);
      "visual line", primary, 7, None, true, "one ", 4;
      "selection", primary, 6, Some 1, false, "oo", 1;
      "primary at start", primary, 0, None, false, source, 0;
      "shift at start", EM.key_ev ~shift:true "Backspace", 0, None, false, source, 0;
      "alternate at start", EM.key_ev ~ctrl:mac ~meta:(not mac) "Backspace",
        0, None, false, source, 0 ]
    @ (if mac then [] else
        [ "forward word", EM.key_ev ~ctrl:true "Delete", 0, None, false, " two", 0 ])
  in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (name, key, caret, anchor, wrapped, expected, expected_caret) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "previous";
          Test_check.block "b2" source; Test_check.block "b3" "next" ];
        set_editing ~uuid:"b2" ~buffer:source ~caret ~base:source;
        S.set (fun st -> { st with S.editing = Option.map (fun e ->
          let model = match anchor with None -> e.S.model
            | Some anchor -> EM.select e.S.model ~anchor ~focus:caret in
          let model = if wrapped then EM.set_lines model [ 0, 4; 4, 7 ] else model in
          { e with S.model }) st.S.editing });
        install_worker ~repo:h.repo h;
        Editor_keys.apply_input "b2" (EI.Key (key, false));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("platform deletion: " ^ name)
          ((match S.editing () with
            | Some e -> e.S.uuid = "b2" && e.S.buffer = expected
                && e.S.model.EM.caret = expected_caret
                && not (EM.has_selection e.S.model)
            | None -> false)
           && Option.is_some (S.find "b1") && Option.is_some (S.find "b3")
           && not (List.mem "delete-blocks" (op_names ())));
        reset_editor ();
        run rest
  in run cases

let test_text_selection_arrows (h : host) =
  let cases = List.concat_map (fun source ->
    List.concat_map (fun up -> List.map (fun reverse -> source, up, reverse)
        [ false; true ]) [ true; false ]) [ "abcd"; "ab\ncd\nef" ] in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (source, up, reverse) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "previous";
          Test_check.block "b2" source; Test_check.block "b3" "next" ];
        let lo, hi = if source = "abcd" then 1, 3 else 3, 4 in
        let anchor, caret = if reverse then hi, lo else lo, hi in
        set_editing ~uuid:"b2" ~buffer:source ~caret ~base:source;
        S.set (fun st -> { st with S.editing = Option.map (fun e ->
          { e with S.model = EM.select e.S.model ~anchor ~focus:caret }) st.S.editing });
        install_worker ~repo:h.repo h;
        Editor_keys.apply_input "b2"
          (EI.Key (EM.key_ev (if up then "ArrowUp" else "ArrowDown"), false));
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (Printf.sprintf "text selection collapses before navigation up=%b reverse=%b" up reverse)
          (match S.editing () with
           | Some e -> e.S.uuid = "b2" && e.S.scope = "main" && e.S.buffer = source
               && e.S.model.EM.caret = (if up then lo else hi)
               && not (EM.has_selection e.S.model)
           | None -> false);
        reset_editor ();
        run rest
  in
  let* () = run cases in
  let source = "Selected café — 東京 reference text." in
  let uuid = "a0b9c507-0ce3-406f-9631-624eb81c3e56" in
  let reference_body = "[[" ^ uuid in
  let expected = reference_body ^ "]]" in
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" source ];
  set_editing ~uuid:"b1" ~buffer:source ~caret:(String.length source) ~base:source;
  S.set (fun st ->
      { st with S.editing = Option.map (fun e ->
          { e with S.model = EM.select e.S.model ~anchor:0
              ~focus:(String.length source) }) st.S.editing });
  install_worker ~repo:h.repo h;
  String.iter
    (fun c -> Editor_keys.apply_input "b1" (EI.Insert (String.make 1 c)))
    reference_body;
  let active = (editing_now ()).S.model in
  check "typing canonical block ref replaces selected text"
    ((editing_now ()).S.buffer = expected);
  check "caret remains inside the completed block ref"
    (active.EM.caret = String.length reference_body);
  check "active block ref renders as raw source"
    (List.exists (EM.atomic_expanded active) active.EM.runs);
  check "active block ref supports raw in-place insertion"
    (let edited = EM.insert_text active "x" in
     edited.EM.source = reference_body ^ "x]]"
     && edited.EM.caret = String.length reference_body + 1);
  check "external source replacement restores atomic caret snapping"
    ((EM.set_source active expected).EM.caret = String.length expected);
  check "active block ref caret can move within the raw source"
    ((EM.move active EM.Left ~extend:false).EM.caret
     = String.length reference_body - 1);
  Editor_keys.apply_input "b1" (EI.Insert "]");
  let after_one_close = (editing_now ()).S.model in
  check "first typed closer overtakes the existing pair"
    (after_one_close.EM.source = expected
     && after_one_close.EM.caret = String.length expected - 1);
  Editor_keys.apply_input "b1" (EI.Insert "]");
  let after_close_pair = (editing_now ()).S.model in
  check "second typed closer completes the existing pair"
    (after_close_pair.EM.source = expected
     && after_close_pair.EM.caret = String.length expected);
  check "caret at block-ref edge restores collapsed display"
    (not (List.exists (EM.atomic_expanded after_close_pair)
            after_close_pair.EM.runs));
  check "navigation from the block-ref edge remains atomic"
    ((EM.move after_close_pair EM.Left ~extend:false).EM.caret = 0);
  check "deletion from the block-ref edge remains atomic"
    ((EM.delete_backward after_close_pair).EM.source = "");
  let loaded = EM.create expected in
  check "loaded block ref remains collapsed"
    (not (List.exists (EM.atomic_expanded loaded) loaded.EM.runs));
  check "loaded block ref navigation remains atomic"
    ((EM.move loaded EM.Right ~extend:false).EM.caret = String.length expected);
  check "loaded block ref deletion remains atomic"
    ((EM.delete_forward loaded).EM.source = "");
  Editor_keys.apply_input "b1" (EI.Insert "]");
  check "later closing bracket remains literal"
    ((editing_now ()).S.buffer = expected ^ "]");
  reset_editor ();
  Js.Promise.resolve ()

let test_multi_selection_arrows (h : host) =
  let scope = "multi-selection-sidebar" in
  let blocks = List.map (fun u -> Test_check.block u u)
      [ "before"; "z-first"; "a-last"; "after" ] in
  stage_page h (List.rev blocks);
  reset_editor ();
  let release = S.register_block_source ~scope ~kind:S.Outliner (fun () -> blocks) in
  List.iter (fun (up, anchor) ->
    S.set (fun st -> { st with S.selection_scope = scope;
      selected = S.String_set.of_list [ "z-first"; "a-last" ]; anchor = Some anchor });
    A.move_selection_focus up;
    let expected = if up then "before" else "after" in
    check (Printf.sprintf "multi-selection navigation uses scoped endpoint up=%b anchor=%s" up anchor)
      (S.selected () = S.String_set.singleton expected
       && S.anchor () = Some expected && S.selection_scope () = scope))
    [ true, "z-first"; true, "a-last"; false, "z-first"; false, "a-last" ];
  A.clear_selection ();
  release ()

let test_zoom_structure_boundary (h : host) =
  let saved = h.snapshot () in
  let stage uuid =
    let child = Test_check.block "zoom-child" "" in
    let root = Test_check.block ~children:[ child ] "zoom-root" "root" in
    stage_page h [ root ];
    h.restore { (h.snapshot ()) with Model.route = Model.Block_zoom "zoom-root" };
    reset_editor ();
    install_worker ~repo:h.repo h;
    let buffer = if uuid = "zoom-root" then "root" else "" in
    S.set (fun st -> { st with S.editing = Some
      (S.mk_editing ~uuid ~buffer ~scope:"zoom-zoom-root" ~base:buffer ()) })
  in
  let rec blocked = function
    | [] -> Js.Promise.resolve ()
    | (name, uuid, action) :: rest ->
        stage uuid;
        action ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("zoom boundary blocks " ^ name) (!ops = []);
        reset_editor ();
        blocked rest
  in
  let* () = blocked
    [ "root indent", "zoom-root", (fun () -> A.indent_or_outdent ~indent:true);
      "root outdent", "zoom-root", (fun () -> A.indent_or_outdent ~indent:false);
      "child outdent", "zoom-child", (fun () -> A.indent_or_outdent ~indent:false);
      "root move", "zoom-root", (fun () -> A.move_blocks_up_down ~uuid:"zoom-root" true) ]
  in
  stage "zoom-child";
  A.split_at_cursor "zoom-child";
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "Enter on an empty zoom child inserts inside the focused root"
    (List.mem "insert-blocks" (op_names ())
     && not (List.mem "indent-outdent-blocks" (op_names ())));
  reset_editor ();
  h.restore saved;
  Js.Promise.resolve ()

(* Native closest returns a shallow row. Only the original hit retains
   the outer container, so asking that row for data-cid loses its scope. *)
let native_drag_event ~scope ~uuid ~pending ~buttons ~x ~y =
  let base = Ui_services.dom_body () in
  let container = { base with Ui_services.attr =
      (fun name -> if name = "data-cid" then Some scope else None) } in
  let row = { base with Ui_services.closest = (fun _ -> None);
    attr = (function "data-blockid" -> Some uuid | "data-editable" -> Some "true" | _ -> None);
    rect = (fun () -> if !pending then 0., 0., 0., 0. else 0., 0., 200., 24.);
    rect_pending = (fun () -> !pending) } in
  let hit = { base with Ui_services.closest = (function
      | ".ls-block" | ".bullet-container" -> Some row
      | "[data-cid]" -> Some container
      | _ -> None) } in
  { Ui_services.x; y; shift = false; meta = false; ctrl = false;
    alt = false; composing = false; key = None; key_char = None;
    buttons; button = 0; repeat = false; movement_x = 0.; movement_y = 0.;
    default_prevented = false; target = Some hit; touches = [];
    detail = (fun _ -> None); detail_json = (fun _ -> None);
    clipboard_get = (fun _ -> "");
    clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot);
    clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
    files = []; has_files = false; prevent_default = (fun () -> ());
    stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) }

let test_native_drag_rect_reply (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "rect-target" "target";
                 Test_check.block "rect-source" "source" ];
  reset_editor ();
  Editor_keys.drag_reset ();
  A.select_single_in ~scope:"main" "rect-source";
  Editor_keys.arm_drag (native_drag_event ~scope:"main" ~uuid:"rect-source"
    ~pending:(ref false) ~buttons:1 ~x:0. ~y:0.);
  let pending = ref true in
  Editor_keys.on_native_pointermove (native_drag_event ~scope:"main" ~uuid:"rect-target"
    ~pending ~buttons:1 ~x:20. ~y:6.);
  check "active drag has no target while row measurement is pending"
    (match S.drag () with Some drag -> drag.S.target = None | None -> false);
  pending := false;
  Editor_keys.on_native_node_rect ();
  check "node-rect reply completes the active preview without another move"
    (match S.drag () with
     | Some { S.target = Some (target, Block_drag.Top); _ } ->
         target.S.scope = "main" && target.S.uuid = "rect-target"
     | _ -> false);
  Editor_keys.drag_cancel ();
  Editor_keys.on_native_node_rect ();
  check "node-rect reply cannot revive a cancelled drag" (S.drag () = None);
  Editor_keys.drag_reset ();
  Js.Promise.resolve ()

let test_native_drag_scoped_drop (h : host) =
  let* () = settle h 40 in
  let target = Test_check.block "scoped-target" "target" in
  let source = Test_check.block ~children:[Test_check.block "scoped-child" "child"]
      "scoped-source" "source" in
  stage_page h [ Test_check.block "scoped-first" "first"; target;
                 Test_check.block "scoped-next" "next"; source ];
  reset_editor ();
  Editor_keys.drag_reset ();
  let unregister = S.register_block_source ~scope:"sidebar" ~kind:S.Outliner
      (fun () -> [ target; source ]) in
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker in
  Runtime.worker := Some { worker with Worker_client.invoke_fn =
      (fun name args -> if name = "thread-api/get-block-parent" then
          Js.Promise.resolve (W.Map [W.Keyword "block/uuid", W.Uuid "target-page"])
        else worker.Worker_client.invoke_fn name args) };
  A.select_single_in ~scope:"main" "scoped-source";
  Editor_keys.arm_drag (native_drag_event ~scope:"main" ~uuid:"scoped-source"
    ~pending:(ref false) ~buttons:1 ~x:0. ~y:0.);
  let move = native_drag_event ~scope:"sidebar" ~uuid:"scoped-target"
      ~pending:(ref false) ~buttons:1 ~x:20. ~y:6. in
  Editor_keys.on_native_pointermove move;
  check "duplicate UUID target keeps the sidebar owner and its first-row Top zone"
    (match S.drag () with
     | Some { S.target = Some (owner, Block_drag.Top); _ } ->
         owner.S.scope = "sidebar" && owner.S.uuid = "scoped-target"
     | _ -> false);
  Editor_keys.on_native_pointerup { move with Ui_services.buttons = 0 };
  let* () = h.wait_ms 25 in
  let* () = settle h 40 in
  check "scoped release emits the existing Top mutation for the target's parent"
    (!ops = [ Ops.move_blocks_top [ "scoped-source" ] "target-page" ]);
  unregister ();
  Editor_keys.drag_reset ();
  reset_editor ();
  Js.Promise.resolve ()

let test_drag_selection_state (h : host) =
  let saved = h.snapshot () in
  reset_editor ();
  stage_page h
    [Test_check.block ~children:[Test_check.block "drag-child" "child"] "drag-parent" "parent";
     Test_check.block "drag-other" "other"; Test_check.block "drag-target" "target"];
  A.select_single_in ~scope:"main" "drag-parent";
  S.set (fun st -> {st with S.selected = S.String_set.of_list
    ["drag-parent";"drag-child";"drag-other"]});
  A.begin_block_drag ~scope:"main" "drag-parent";
  check "Dragging captures selected roots without keeping a selection toolbar"
    (A.dragged_block_uuids "drag-parent" = ["drag-parent";"drag-other"]
     && S.String_set.is_empty (S.selected ()));
  check "Captured drag selection still rejects members and their descendants"
    (not (A.can_drop_dragged_block "drag-parent" "drag-other")
     && not (A.can_drop_dragged_block "drag-parent" "drag-child")
     && A.can_drop_dragged_block "drag-parent" "drag-target");
  A.end_block_drag ();
  A.begin_block_drag ~scope:"main" "missing-drag-source";
  check "A missing drag source cannot fabricate a move or selection"
    (A.dragged_block_uuids "missing-drag-source" = []
     && not (A.can_drop_dragged_block "missing-drag-source" "drag-target")
     && S.String_set.is_empty (S.selected ()));
  A.end_block_drag ();
  reset_editor ();
  h.restore saved;
  Js.Promise.resolve ()

let test_drop_top_owner (h : host) =
  let saved = h.snapshot () in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (name, change_origin, accept) :: rest ->
        reset_editor ();
        stage_page h [ Test_check.block "main-only" "unrelated" ];
        let scope = "drop-owner-test" in
        let blocks =
            [ Test_check.block "drop-source" "source";
              Test_check.block "drop-target" "target" ] in
        let unregister = S.register_block_source ~scope ~kind:S.Outliner (fun () -> blocks) in
        A.begin_block_drag ~scope "drop-source";
        check ("Drag ownership does not create a block selection: " ^ name)
          (S.String_set.is_empty (S.selected ())
           && A.dragged_block_uuids "drop-source" = ["drop-source"]);
        install_worker ~repo:h.repo h;
        let release = ref (fun () -> ()) in
        let parent = Js.Promise.make (fun ~resolve ~reject:_ ->
            release := (fun () -> resolve
                (W.Map [ W.Keyword "block/uuid", W.Uuid "sidebar-owner" ]) [@u])) in
        let worker = Option.get !Runtime.worker in
        Runtime.worker := Some { worker with Worker_client.invoke_fn =
          (fun method_name args ->
            if method_name = "thread-api/get-block-parent" then parent
            else worker.Worker_client.invoke_fn method_name args) };
        A.drop_dragged_block ~alt:false ~scope "drop-source" "drop-target" "top";
        let* () = h.wait_ms 25 in
        check ("top drop awaits its target parent: " ^ name) (!ops = []);
        change_origin ();
        !release ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check ("top drop preserves target owner and origin: " ^ name)
          (!ops = (if accept then
              [ Ops.move_blocks_top [ "drop-source" ] "sidebar-owner" ] else []));
        A.end_block_drag ();
        check ("Completed or canceled drops leave no source selection: " ^ name)
          (S.String_set.is_empty (S.selected ()));
        unregister ();
        reset_editor ();
        h.restore saved;
        run rest
  in
  run
    [ "current", (fun () -> ()), true;
      "route changed", (fun () ->
          h.restore { (h.snapshot ()) with Model.route = Model.Block_zoom "elsewhere" }), false;
      "graph changed", (fun () ->
          h.restore { (h.snapshot ()) with Model.repo = Some "different-graph" }), false ]

let test_zoom_out_origin (h : host) =
  let saved = h.snapshot () in
  let saved_hash = Ui_services.nav_hash () in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (name, change_origin, accept) :: rest ->
        reset_editor ();
        ignore (A.consume_pending_zoom ());
        let child = Test_check.block "zoom-child" "child" in
        stage_page h [ Test_check.block ~children:[ child ] "zoom-root" "root" ];
        h.restore { (h.snapshot ()) with Model.route = Model.Block_zoom "zoom-root" };
        S.set (fun st -> { st with S.editing = Some
          (S.mk_editing ~uuid:"zoom-child" ~buffer:"child" ~scope:"zoom-zoom-root"
             ~base:"child" ()) });
        Ui_services.nav_replace_hash (Runtime.nav_hash "#/page/zoom-root");
        let initial_hash = Ui_services.nav_hash () in
        let parent_hash = Runtime.nav_hash "#/page/zoom-parent" in
        install_worker ~repo:h.repo h;
        let release = ref (fun () -> ()) in
        let parent = Js.Promise.make (fun ~resolve ~reject:_ ->
            release := (fun () -> resolve
                (W.Map [ W.Keyword "block/uuid", W.Uuid "zoom-parent" ]) [@u])) in
        let worker = Option.get !Runtime.worker in
        Runtime.worker := Some { worker with Worker_client.invoke_fn =
          (fun method_name args ->
            if method_name = "thread-api/get-block-parent" then parent
            else worker.Worker_client.invoke_fn method_name args) };
        A.zoom_out ();
        let* () = h.wait_ms 25 in
        check ("zoom-out waits for its parent: " ^ name)
          (Ui_services.nav_hash () = initial_hash);
        change_origin ();
        let retained_hash = Ui_services.nav_hash () in
        !release ();
        let* () = h.wait_ms 25 in
        check ("zoom-out reply belongs to its origin: " ^ name)
          (if accept then Ui_services.nav_hash () = parent_hash
           else Ui_services.nav_hash () = retained_hash
                && A.consume_pending_zoom () = None);
        ignore (A.consume_pending_zoom ());
        reset_editor ();
        Ui_services.nav_replace_hash saved_hash;
        h.restore saved;
        run rest
  in
  run
    [ "current", (fun () -> ()), true;
      "route changed", (fun () ->
          h.restore { (h.snapshot ()) with Model.route = Model.Page "elsewhere" };
          Ui_services.nav_replace_hash (Runtime.nav_hash "#/page/elsewhere")), false;
      "graph changed", (fun () ->
          h.restore { (h.snapshot ()) with Model.repo = Some "different-graph" };
          Ui_services.nav_replace_hash "#/page/different-graph-destination"), false ]

let test_asset_insert_placement (h : host) =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [ block "asset-target" "Existing"; block "asset-empty" "" ];
  let asset = W.Map [W.kw "block/uuid", W.Uuid "inserted-asset";
    W.kw "block/title", W.String "![asset](assets/image.png)"] in
  let run drop_target sibling bottom replace_empty =
    install_worker ~repo:h.repo h;
    let upload = Option.get (A.capture_asset_upload ?drop_target ()) in
    let* () = A.commit_uploaded_assets upload [asset] in
    check "Asset insertion distinguishes siblings, empty replacements and page children"
      (List.exists (function
         | W.Array [W.Keyword "insert-blocks"; W.Array [_; _; opts]] ->
             W.map_get opts "sibling?" = Some (W.Bool sibling)
             && W.map_get opts "bottom?" = Some (W.Bool bottom)
             && W.map_get opts "replace-empty-target?" =
                (if replace_empty then Some (W.Bool true) else None)
         | _ -> false) !ops);
    Js.Promise.resolve ()
  in
  let* () = run (Some "asset-target") true false false in
  let* () = run (Some "asset-empty") true false true in
  let* () = run None false true false in
  stage_page h [block "asset-before" "Before"; block "asset-target" "Existing";
                block "asset-after" "After"];
  set_editing ~uuid:"asset-target" ~buffer:"Existing" ~caret:8 ~base:"Existing";
  let upload = Option.get (A.capture_asset_upload ()) in
  check "Slash upload captures the editing middle block, not its following sibling"
    (upload.A.upload_target = "asset-target");
  let* () = run None true false false in
  reset_editor ();
  install_worker ~repo:h.repo h;
  let upload = Option.get (A.capture_asset_upload ~drop_target:"asset-target" ()) in
  let* () = A.commit_uploaded_assets upload [] in
  check "An empty asset upload does not insert blocks" (!ops = []);
  let before = h.snapshot () in
  h.restore {before with Model.route = Model.Settings};
  let* () = A.commit_uploaded_assets upload [asset] in
  check "A stale asset upload does not mutate the newly navigated context" (!ops = []);
  h.restore before;
  Js.Promise.resolve ()

let test_breadcrumb_parent_loading (h : host) =
  let previous = !Runtime.worker in
  let worker = Option.get previous in
  let mode = ref `Parents in
  let titles = ["P14088 Editor"; "Alpha first"; "Long parent"; "Nearest parent"] in
  Runtime.worker := Some {worker with Worker_client.invoke_fn = (fun name args ->
    if name <> "thread-api/get-block-parents" then worker.Worker_client.invoke_fn name args
    else match !mode with
      | `Reject -> h.reject_promise "parent load rejected"
      | `Empty -> Js.Promise.resolve (W.List [])
      | `Parents ->
          let depth = match args with [_;_;W.Int depth] -> depth | _ -> 3 in
          let visible = List.filteri (fun i _ -> i >= List.length titles - depth) titles in
          Js.Promise.resolve (W.List (List.mapi (fun i title -> W.Map
            [W.kw "block/title", W.String title;
             W.kw "block/uuid", W.Uuid ("parent-" ^ string_of_int i)]) visible)))};
  let task =
    let* parents = Ops.fetch_page_parents h.repo "zoomed-leaf" in
    check "Zoom breadcrumb loading includes the containing page above three block ancestors"
      (List.map (fun b -> b.Model.block_title) parents = titles);
    mode := `Empty;
    let* parents = Ops.fetch_page_parents h.repo "root-page" in
    check "Root pages have no placeholder breadcrumb parents" (parents = []);
    mode := `Reject;
    let* rejected = Ops.fetch_page_parents h.repo "zoomed-leaf"
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve false)
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve true) in
    check "Breadcrumb parent failures propagate to the route loader" rejected;
    Runtime.worker := previous;
    Js.Promise.resolve () in
  task |> Js.Promise.catch (fun _ -> Runtime.worker := previous;
    failwith "Breadcrumb parent test failed")

let test_append_owner (h : host) =
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (scope, owner) :: rest ->
        let* () = settle h 40 in
        stage_page h [ Test_check.block "b1" "main page block" ];
        install_worker ~repo:h.repo h;
        S.set (fun st ->
            { st with S.selection_scope = "main";
              selected = S.String_set.singleton "b1";
              anchor = Some "b1"; action_bar = true });
        A.append_block ~for_page:owner ~scope ();
        let* () = h.wait_ms 25 in
        let* () = settle h 40 in
        check (scope ^ " append belongs to its owner, not the main route")
          (List.exists (function
             | W.Array [ W.Keyword "insert-blocks";
                         W.Array [ _; W.Uuid target; opts ] ] ->
                 target = owner
                 && W.map_get opts "sibling?" = Some (W.Bool false)
                 && W.map_get opts "bottom?" = Some (W.Bool true)
             | _ -> false) !ops);
        check (scope ^ " append transfers exclusive editing to its container")
          (match S.editing () with
           | Some e -> e.S.scope = scope && e.S.model.EM.source = ""
               && S.String_set.is_empty (S.selected ())
               && S.anchor () = None && not (S.value ()).S.action_bar
               && S.selection_scope () = scope
           | None -> false);
        reset_editor ();
        run rest
  in
  run [ "sidebar", "sidebar-owner"; "quick-add", "quick-add-owner";
        "zoom-root", "zoom-owner"; "preview", "preview-owner" ]

(* synchronous stage: pure-model checks that need no app drain *)
let test_authoritative_route_miss (h : host) =
  let old_read = !Runtime.read_model and old_send = !Runtime.app_send
  and old_worker = !Runtime.worker and old_loaded = !Router.loaded_route
  and old_gen = !Runtime.load_gen in
  let route = Model.Page "renamed-route" in
  let model = ref { (h.snapshot ()) with Model.route; page_missing = false } in
  let replies = ref [] in
  Runtime.read_model := (fun () -> !model);
  Runtime.app_send := (fun action -> model := Update.update !model action; true);
  Router.loaded_route := Some route;
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun name _ ->
        if name = "thread-api/get-page-route-info" then
          Js.Promise.make (fun ~resolve ~reject:_ ->
            replies := !replies @ [(fun () -> resolve W.Nil [@u])])
        else Js.Promise.resolve W.Nil)
    ; on_message = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  let restore () =
    Runtime.read_model := old_read; Runtime.app_send := old_send;
    Runtime.worker := old_worker; Router.loaded_route := old_loaded;
    Runtime.load_gen := old_gen in
  let task =
    let forced = Router.load_page_ref ~accept_missing:true route (W.String "renamed-route") in
    let ordinary = Router.load_page_ref route (W.String "renamed-route") in
    List.iter (fun reply -> reply ()) !replies;
    let* () = forced in
    let* () = ordinary in
    check "An authoritative route miss survives an overlapping sync refresh"
      (!model).Model.page_missing;
    restore ();
    Js.Promise.resolve ()
  in
  task |> Js.Promise.catch (fun error ->
    restore ();
    Ui_services.log_error ("Authoritative route miss test failed", error);
    failwith "Authoritative route miss test failed")

let paste_history_cursors_case (h : host) ~title ~caret ~history_caret =
  let* () = settle h 40 in
  reset_editor ();
  stage_page h [Test_check.block "paste-origin" title];
  set_editing ~uuid:"paste-origin" ~buffer:title ~caret:history_caret ~base:title;
  S.note_editor_start_pos_from_arrow history_caret;
  S.record_history_start ~force:true (editing_now ());
  A.update_model "paste-origin" (fun m -> EM.select m ~anchor:caret ~focus:caret);
  install_worker ~repo:h.repo h;
  let worker = Option.get !Runtime.worker and options = ref W.Nil in
  let inserted = W.Map [W.kw "block/uuid", W.Uuid "paste-result";
    W.kw "block/title", W.String "Clipboard parent"] in
  Runtime.worker := Some {worker with Worker_client.invoke_fn=(fun name args ->
    if name <> "thread-api/apply-outliner-ops" then worker.Worker_client.invoke_fn name args
    else begin
      (match args with [_;_;opts] -> options:=opts | _ -> ());
      Runtime.current_page := Option.map (fun page -> {page with Model.page_blocks =
        [Test_check.block "paste-origin" title;
         Test_check.block "paste-result" "Clipboard parent"]}) !Runtime.current_page;
      h.sync_page ();
      Js.Promise.resolve (W.Map [W.kw "result",W.Map [W.kw "blocks",W.Array [inserted]]])
    end)};
  let* _ = A.paste_copied_blocks (false,[inserted]) "paste-origin"
      ~sibling:true ~replace_empty:false in
  let before = Option.get (W.get !options "undo-redo/editor-info")
  and after = Option.get (W.get !options "undo-redo/editor-info-after") in
  check "Structured paste captures the pre-paste caret rather than stale navigation history"
    (W.map_get_uuid before "block-uuid"=Some "paste-origin"
     && W.map_get_string before "scope"=Some "main"
     && W.get before "caret"=Some (W.Int caret)
     && W.get before "start-pos"=Some (W.Int caret));
  check "Structured paste records the last inserted block at end as its after-cursor"
    (W.get after "block-uuid"=Some (W.Keyword "last-inserted-block")
     && W.map_get_string after "scope"=Some "main"
     && W.get after "caret"=Some (W.Keyword "end"));
  let after = match after with
    | W.Map kvs -> W.Map (List.map (fun (key,value) ->
        key,(if key=W.kw "block-uuid" then W.Uuid "paste-result" else value)) kvs)
    | _ -> failwith "Paste after-cursor must be a map" in
  let restore undo = A.restore_history (W.Map [W.kw "undo?",W.Bool undo;
    W.kw "editor-cursors",W.List [before;after]]) in
  let* () = restore true in
  check "Structured paste undo restores the captured origin caret"
    (Option.map (fun e -> e.S.uuid,e.S.model.EM.caret) (S.editing ())
     =Some ("paste-origin",caret));
  let* () = restore false in
  check "Structured paste redo restores the last inserted block at end"
    (Option.map (fun e -> e.S.uuid,e.S.model.EM.caret) (S.editing ())
     =Some ("paste-result",String.length "Clipboard parent"));
  reset_editor ();
  Js.Promise.resolve ()

let test_paste_history_cursors (h : host) =
  let* () = paste_history_cursors_case h ~title:"Original" ~caret:2 ~history_caret:2 in
  paste_history_cursors_case h ~title:"Nonempty destination" ~caret:4 ~history_caret:20

let test_structured_paste_completion (h : host) =
  let* () = test_paste_history_cursors h in
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | outcome :: rest ->
        let* () = settle h 40 in
        reset_editor ();
        stage_page h [Test_check.block "paste-target" ""; Test_check.block "other" "other"];
        set_editing ~uuid:"paste-target" ~buffer:"" ~caret:0 ~base:"";
        install_worker ~repo:h.repo h;
        let worker = Option.get !Runtime.worker in
        let release = ref (fun () -> ()) and after = ref None in
        let gate = Js.Promise.make (fun ~resolve ~reject:_ ->
            release := (fun () -> resolve true [@u])) in
        let inserted = W.Map [W.kw "block/uuid", W.Uuid "paste-target";
          W.kw "block/title", W.String "Clipboard parent"] in
        Runtime.worker := Some {worker with Worker_client.invoke_fn = (fun name args ->
          if name <> "thread-api/apply-outliner-ops" then worker.Worker_client.invoke_fn name args
          else begin
            (match args with [_;_;opts] -> after := W.get opts "undo-redo/editor-info-after" | _ -> ());
            let* _ = gate in
            if outcome = "rejected" then h.reject_promise "paste rejected"
            else if outcome = "empty" then Js.Promise.resolve (W.Map [W.kw "result", W.Nil])
            else begin
              Runtime.current_page := Option.map (fun page -> {page with Model.page_blocks =
                [Test_check.block "paste-target" "Clipboard parent"; Test_check.block "other" "other"]}) !Runtime.current_page;
              h.sync_page ();
              Js.Promise.resolve (W.Map [W.kw "result", W.Map [W.kw "blocks", W.Array [inserted]]])
            end
          end)};
        let failed = ref false in
        let operation = A.paste_copied_blocks (false, [inserted]) "paste-target"
            ~sibling:true ~replace_empty:true
          |> Js.Promise.catch (fun _ -> failed := true; Js.Promise.resolve None) in
        let* () = h.wait_ms 10 in
        if outcome = "newer editor" then set_editing ~uuid:"other" ~buffer:"other" ~caret:5 ~base:"other";
        !release ();
        let* _ = operation in
        let* () = h.wait_ms 10 in
        check ("Structured paste keeps editing the last insert: " ^ outcome)
          (Option.map (fun e -> e.S.uuid) (S.editing ()) =
             Some (if outcome = "newer editor" then "other" else "paste-target"));
        check ("Structured paste retains failure state: " ^ outcome) (!failed = (outcome = "rejected"));
        if outcome = "saved" then
          check "Structured paste redo restores the last inserted editor"
            (match !after with
             | Some (W.Map kvs) ->
                 List.assoc_opt (W.Keyword "block-uuid") kvs
                   = Some (W.Keyword "last-inserted-block")
                 && List.assoc_opt (W.Keyword "caret") kvs = Some (W.Keyword "end")
             | _ -> false);
        reset_editor ();
        run rest
  in
  run ["saved"; "empty"; "rejected"; "newer editor"]

let test_numbering_preserves_unedited_title (h : host) =
  let* () = settle h 40 in
  stage_page h [Test_check.block "b1" "Plain second block"];
  reset_editor ();
  install_worker ~repo:h.repo h;
  A.select_single_in ~scope:"main" "b1";
  Editor_commands.toggle_own_list "b1" 0;
  let* () = settle h 40 in
  check "Numbering an unedited block preserves its stored title"
    (Option.bind !Runtime.current_page (fun page ->
       Option.map (fun (b : Model.block) -> b.Model.block_title)
         (S.find_in page.Model.page_blocks "b1")) = Some "Plain second block");
  Js.Promise.resolve ()

let test_template_does_not_save_search_title (h : host) =
  let* () = settle h 40 in
  stage_page h [Test_check.block "b1" ""];
  reset_editor ();
  install_worker ~repo:h.repo h;
  set_editing ~uuid:"b1" ~buffer:"Audit Template" ~caret:14 ~base:"";
  let ac : Popups_state.ac =
    { kind = Template_search; x = 0.; y = 0.; cy = 0.; pos_pending = false
    ; flip = None; flipx = None; query = "Audit Template"; tpos = 0; tlen = 14
    ; items = []; chosen = 0; auuid = "b1"; editor = None; replaced_source = None } in
  Popups_state.apply_template (Option.get !Popups_state.active) ac "template";
  let* () = h.wait_ms 20 in
  check "Template search text is not persisted as a content block"
    (Option.bind !Runtime.current_page (fun page ->
       Option.map (fun (b : Model.block) -> b.Model.block_title)
         (S.find_in page.Model.page_blocks "b1")) = Some "");
  let rec run = function
    | [] -> Js.Promise.resolve ()
    | (base, outcome) :: rest ->
        let* () = settle h 40 in
        stage_page h [Test_check.block "b1" base];
        reset_editor ();
        install_worker ~repo:h.repo h;
        set_editing ~uuid:"b1" ~buffer:"/" ~caret:1 ~base;
        let worker = Option.get !Runtime.worker in
        Runtime.worker := Some {worker with Worker_client.invoke_fn = (fun name args ->
          let template_op = name="thread-api/apply-outliner-ops" &&
            match args with _ :: W.Array os :: _ ->
              List.exists (fun op -> op_name op="apply-template") os | _ -> false in
          if template_op && outcome="rejected" then h.reject_promise "template rejected"
          else
            let* response = worker.invoke_fn name args in
            if template_op && (outcome="inserted" || outcome="typed") then begin
              Runtime.current_page := Option.map (fun p -> {p with Model.page_blocks =
                [Test_check.block "b1" "T83 Template inserted child"]}) !Runtime.current_page;
              h.sync_page ();
              if outcome="typed" then A.sync_buffer "b1" "new input";
              Js.Promise.resolve (W.Map [W.Keyword "result", W.Map
                [W.Keyword "blocks", W.Array [W.Map [W.Keyword "block/uuid",W.Uuid "b1"]]]])
            end else Js.Promise.resolve response) };
        let ac = {ac with tlen=1; query=""} in
        Popups_state.apply_template (Option.get !Popups_state.active) ac "template";
        let* () = h.wait_ms 30 in
        if outcome="inserted" then begin
          check "Template replacement refreshes the reused target editor"
            (A.live_buffer "b1"="T83 Template inserted child"
             && (editing_now ()).S.base="T83 Template inserted child");
          A.save_if_dirty "b1"
        end else if outcome="typed" then
          check "Template completion preserves newer editor input"
            (A.live_buffer "b1"="new input")
        else
          check "Empty and rejected templates do not replace the live editor"
            (A.live_buffer "b1"="");
        let* () = h.wait_ms 430 in
        if outcome="inserted" then
          check "Template content survives a later editor commit"
            (Option.bind !Runtime.current_page (fun page ->
              Option.map (fun (b : Model.block) -> b.Model.block_title)
                (S.find_in page.Model.page_blocks "b1"))=Some "T83 Template inserted child");
        Runtime.worker := Some worker;
        run rest
  in
  run ["","inserted"; "/","inserted"; "/","typed"; "/","empty"; "/","rejected"]

let test_slash_cancellation_titles (h : host) =
  let rec next = function
    | [] -> Js.Promise.resolve ()
    | (image, prefix) :: rest ->
        let* () = settle h 40 in
        stage_page h [Test_check.block "b1" prefix];
        reset_editor ();
        install_worker ~repo:h.repo h;
        let typed = prefix ^ (if image then "/Image link" else "/Template") in
        set_editing ~uuid:"b1" ~buffer:typed ~caret:(String.length typed) ~base:prefix;
        let popup = Option.get !Popups_state.active in
        let ac : Popups_state.ac =
          { kind = Slash; x = 0.; y = 0.; cy = 0.; pos_pending = false;
            flip = None; flipx = None; query = ""; tpos = String.length prefix;
            tlen = 1; items = []; chosen = 0; auuid = "b1"; editor = None; replaced_source = None } in
        Popups_state.set_ac popup (Some ac);
        Popups_state.apply_item popup ac ~meta:false
          (Popups_state.mk_item ~key:"cancel-command" ~label:""
            (if image then Editor_cmd "image-link" else Switch Template_search));
        let expected = prefix ^ (if image then "/link" else "/") in
        check "Slash secondary commands retain Master's cancellation text"
          (A.live_buffer "b1" = expected);
        if image then begin
          Editor_commands.open_link_form true "b1" (String.length prefix);
          ignore (Editor_commands.popup_key ~key:"Escape"
            ~inside:(fun () -> true) ~prevent_default:(fun () -> ()))
        end else begin
          Popups_state.close_ac popup;
          A.exit_edit ~select:false
        end;
        let* () = h.wait_ms 450 in
        check "Cancelled slash command text survives its save"
          (Option.bind !Runtime.current_page (fun page ->
             Option.map (fun (b : Model.block) -> b.block_title)
               (S.find_in page.page_blocks "b1")) = Some expected);
        next rest
  in
  next [true,""; false,""; true,"prefix "; false,"prefix "]

let run (_h : host) =
  test_measure_deferred ();
  test_stale_line_ranges ()

(* async stage: chained into the drive runner's promise drain *)
let async_stage (h : host) : unit Js.Promise.t =
  let saved = h.snapshot () in
  let* () = test_structured_paste_completion h in
  let* () = test_numbering_preserves_unedited_title h in
  let* () = test_code_conversion_focus h in
  let* () = test_calculator_exit_structure h in
  let* () = test_template_does_not_save_search_title h in
  let* () = test_slash_cancellation_titles h in
  let* () = test_authoritative_route_miss h in
  let* () = test_composition h in
  let* () = test_save_debounce h in
  let* () = test_acknowledged_save_before_broadcast h in
  let* () = test_embed_persists_erased_buffer h in
  let* () = test_pending_save_order h in
  let* () = test_suggestion_selection_commits_pending_save h in
  let* () = test_node_reference_suggestions h in
  let* () = test_query_selection_conversion h in
  let* () = test_youtube_timestamp_selection h in
  let* () = test_quick_add_opening h in
  let* () = test_reference_preview h in
  let* () = test_autocomplete_dismiss_resumes_pending_save h in
  let* () = test_autocomplete_explicit_flush h in
  let* () = test_autocomplete_save_gate_is_block_scoped h in
  let* () = test_queued_input h in
  let* () = test_failed_apply_keeps_base h in
  let* () = test_resync_clean_dirty h in
  let* () = test_undo_redo_resync h in
  let* () = test_enter_split h in
  let* () = test_delete_merge_next h in
  let* () = test_modified_delete_boundary h in
  let* () = test_continuous_delete_xfail h in
  let* () = test_backspace_merge_prev h in
  let* () = test_indent_outdent h in
  let* () = test_indent_undo_key_dispatch h in
  let* () = test_indent_type_double_undo_caret h in
  let* () = test_indent_undo_restores_start_pos h in
  let* () = test_exit_waits_for_save h in
  let* () = test_modifier_select_preserves_sidebar_scope h in
  let* () = test_sidebar_escape_selection h in
  let* () = test_select_all_exit h in
  let* () = test_task_cycle h in
  let* () = test_enter_edit_origin h in
  let* () = test_exit_after_navigation h in
  let* () = test_navigation_retires_dirty_editor h in
  let* () = test_history_after_navigation h in
  let* () = test_navigation_history h in
  let* () = test_queued_history_origin h in
  let* () = test_delete_selection_history h in
  let* () = test_property_command_refresh h in
  let* () = test_page_icon_refresh h in
  test_selection_direction h;
  let* () = test_selected_open h in
  let* () = test_scoped_collapse_commands h in
  let* () = test_scoped_indent_target h in
  let* () = test_move_block_chord h in
  let* () = test_platform_delete h in
  let* () = test_text_selection_arrows h in
  test_multi_selection_arrows h;
  let* () = test_zoom_structure_boundary h in
  let* () = test_native_drag_rect_reply h in
  let* () = test_native_drag_scoped_drop h in
  let* () = test_drag_selection_state h in
  let* () = test_drop_top_owner h in
  let* () = test_zoom_out_origin h in
  let* () = test_append_owner h in
  let* () = test_asset_insert_placement h in
  let* () = test_breadcrumb_parent_loading h in
  h.restore saved;
  Js.Promise.resolve ()
