(* Behavior regressions for the shared editing pipeline — the same
   source compiles under Melange (test_main.js) and under the gpui
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
  (* two keystrokes inside the window collapse to a single save of the
     latest buffer; the committed base and the display override advance *)
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
  eqs "commit sets title override" "helloxy" (S.title_for "b1" "?");
  check "ops carry the repo" !repo_ok;
  reset_editor ();
  Js.Promise.resolve ()

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
   | Some ("b1", "hellozq") -> check "save queued pending" true
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

let test_queued_input (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  (* input arriving while a structure op holds the gate is queued, then
     replayed in order against the editing session *)
  S.structure_pending := true;
  Editor_keys.apply_input "b1" (EI.Insert "q");
  check "queued input not applied yet" ((editing_now ()).S.buffer = "hello");
  S.structure_pending := false;
  S.drain_edit_actions ();
  check "queued input replays" ((editing_now ()).S.buffer = "helloq");
  let* () = Ops.flush_pending_save () in
  check "replayed input saves" (List.exists (wire_has "helloq") !ops);
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
   | Some (u, 0, _) -> check "enter re-targets focus" (u = e.S.uuid)
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
  Js.Promise.resolve ()

(* synchronous stage: pure-model checks that need no app drain *)
let run (_h : host) =
  test_measure_deferred ();
  test_stale_line_ranges ()

(* async stage: chained into the drive runner's promise drain *)
let async_stage (h : host) : unit Js.Promise.t =
  let saved = h.snapshot () in
  let* () = test_composition h in
  let* () = test_save_debounce h in
  let* () = test_pending_save_order h in
  let* () = test_queued_input h in
  let* () = test_failed_apply_keeps_base h in
  let* () = test_resync_clean_dirty h in
  let* () = test_undo_redo_resync h in
  let* () = test_enter_split h in
  let* () = test_delete_merge_next h in
  let* () = test_continuous_delete_xfail h in
  let* () = test_backspace_merge_prev h in
  let* () = test_indent_outdent h in
  let* () = test_exit_waits_for_save h in
  let* () = test_exit_after_navigation h in
  let* () = test_history_after_navigation h in
  let* () = test_delete_selection_history h in
  h.restore saved;
  Js.Promise.resolve ()
