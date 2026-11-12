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

let test_structure_completion_ownership (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b1" "hello" ];
  set_editing ~uuid:"b1" ~buffer:"hello" ~caret:5 ~base:"hello";
  install_worker ~repo:h.repo h;
  let claim ?current_guard promise finish =
    A.run_structure ?current_guard ~restore:(S.editing ()) promise finish;
    snd (Option.get !A.structure_owner)
  in
  let finished = ref 0 in
  let complete = claim (Js.Promise.resolve ()) (fun () -> incr finished) in
  if h.native then check "an already-resolved native structure releases inline"
    (not !S.structure_pending && !finished=1);
  let* () = complete in
  check "resolved structure settles its stable completion after finish"
    (not !S.structure_pending && !finished=1);
  let refreshed = ref 0 and cleaned = ref 0 in
  let guard : A.structure_guard = {
    structure_current=(fun () -> true);structure_owned=(fun () -> true);
    structure_refresh=(fun () -> incr refreshed;Js.Promise.resolve ());
    structure_finish=(fun () -> incr cleaned) } in
  let rejected = h.reject_promise "expected structure rejection"
    |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) in
  let complete = claim ~current_guard:guard rejected (fun () -> check "failed structure cannot finish successfully" false) in
  let* rejected = (let* () = complete in Js.Promise.resolve false)
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve true) in
  check "immediate rejection recovers and releases the exact owner"
    (rejected && not !S.structure_pending && !refreshed=1 && !cleaned=1);
  let release_old = ref (fun () -> ()) and release_new = ref (fun () -> ()) in
  let old = Js.Promise.make (fun ~resolve ~reject:_ -> release_old := (fun () -> resolve true [@u]))
    |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) in
  let newer = Js.Promise.make (fun ~resolve ~reject:_ -> release_new := (fun () -> resolve true [@u]))
    |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) in
  let old_finished = ref false and new_finished = ref false in
  let old_complete = claim old (fun () -> old_finished:=true) in
  let new_complete = claim newer (fun () -> new_finished:=true) in
  !release_old ();
  let* () = old_complete in
  check "an older completion cannot release or replace a newer structure owner"
    (!S.structure_pending && not !old_finished && not !new_finished
     && snd (Option.get !A.structure_owner) == new_complete);
  !release_new ();
  let* () = new_complete in
  check "the current operation alone releases the gate" (not !S.structure_pending && !new_finished);
  let release_nested = ref (fun () -> ()) in
  let nested = Js.Promise.make (fun ~resolve ~reject:_ -> release_nested := (fun () -> resolve true [@u]))
    |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) in
  let nested_completion = ref None and inline_outer = ref None in
  A.run_structure ~restore:(S.editing ()) (Js.Promise.resolve ()) (fun () ->
    inline_outer := Some (snd (Option.get !A.structure_owner));
    nested_completion := Some (claim nested (fun () -> ())));
  let outer = match !inline_outer with
    | Some completion -> completion
    | None -> snd (Option.get !A.structure_owner) in
  let* () = outer in
  let nested_complete = Option.get !nested_completion in
  check "inline finish can create a new owner without the old tail clobbering it"
    (!S.structure_pending && snd (Option.get !A.structure_owner) == nested_complete);
  !release_nested ();
  let* () = nested_complete in
  check "the nested operation settles without a polling timer" (not !S.structure_pending);
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
    { EI.no_conduit with EI.caret_rect = (fun ~affinity:_ _ -> None) }
  in
  let f = EI.measure conduit m in
  check "pending reply yields no caret" (f.EI.caret = None);
  let conduit =
    { EI.no_conduit with
      EI.caret_rect =
          (fun ~affinity:_ off ->
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

(* The moving edge must survive reversals, while membership and endpoints
   remain scoped to the current visible outliner, including collapsed rows. *)
let test_keyboard_block_selection (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b0" "before";
    Test_check.block ~children:[Test_check.block "b2" "nested"] "b1" "parent";
    Test_check.block "b3" "after"; Test_check.block "b4" "last" ];
  S.set (fun st -> { st with S.editing = None; collapsed = S.String_set.empty;
    collapsed_ui = S.String_set.empty; expanded = S.String_set.empty;
    expanded_ui = S.String_set.empty });
  let* () = h.wait_ms 25 in
  let expect label uuids head =
    check label (A.selected_uuids () = uuids
      && (S.selection_state ()).S.selection_head = Some head) in
  A.select_single "b1";
  A.extend_selection false;
  expect "Shift Down visits the expanded nested row" ["b1";"b2"] "b2";
  A.extend_selection false;
  expect "repeated Shift Down keeps the fixed anchor" ["b1";"b2";"b3"] "b3";
  A.extend_selection true;
  expect "reversing Shift Up shrinks from the moving edge" ["b1";"b2"] "b2";
  A.extend_selection true;
  expect "reversal shrinks back to its anchor" ["b1"] "b1";
  A.extend_selection true;
  expect "Shift Up crosses the original anchor" ["b0";"b1"] "b0";
  A.extend_selection false;
  expect "opposite reversal removes the upper moving edge" ["b1"] "b1";
  A.select_single_in ~scope:"main" "p";
  A.extend_selection true;
  expect "the page-title upper boundary does not move" ["p"] "p";
  A.extend_selection false;
  expect "a title anchor extends into the first visible block" ["p";"b0"] "b0";
  A.extend_selection true;
  expect "reversal restores the title anchor without losing it" ["p"] "p";
  A.select_single "b4";
  A.extend_selection false;
  expect "range extension at the last visible row is bounded" ["b4"] "b4";
  A.select_single "b1";
  S.set_collapsed ~scope:"main" "b1" true;
  let* () = h.wait_ms 25 in
  A.extend_selection false;
  expect "range extension skips collapsed descendants" ["b1";"b3"] "b3";
  A.move_selection_focus false;
  expect "plain Down leaves a range from its lower edge" ["b4"] "b4";
  A.select_single "b3";
  Editor_keys.on_normal_key
    { Ui_services.x=0.; y=0.; shift=false; meta=false; ctrl=false; alt=true;
      composing=false; key=Some "ArrowUp"; key_char=None; buttons=0; button=0;
      repeat=false; movement_x=0.; movement_y=0.; default_prevented=false;
      target=None; touches=[]; detail=(fun _ -> None); detail_json=(fun _ -> None);
      clipboard_get=(fun _ -> ""); clipboard_snapshot=(fun () -> Ui_services.empty_clipboard_snapshot);
      clipboard_set=(fun _ _ -> ()); data_transfer_get=(fun _ -> ""); files=[];
      has_files=false; prevent_default=(fun () -> ()); stop_propagation=(fun () -> ());
      stop_immediate=(fun () -> ()) };
  expect "Alt Up extends the range instead of moving a singleton" ["b1";"b3"] "b1";
  Editor_keys.dispatch_command "editor/escape-editing";
  check "first nonediting Escape dismisses the toolbar without losing the range"
    (not (S.selection_state ()).S.action_bar && A.selected_uuids () = ["b1";"b3"]);
  Editor_keys.dispatch_command "editor/escape-editing";
  check "second nonediting Escape clears both endpoints without entering edit mode"
    (S.String_set.is_empty (S.selected ()) && S.anchor () = None
     && (S.selection_state ()).S.selection_head = None && S.editing () = None);
  A.select_single_in ~scope:"rs-isolated" "b3";
  check "a new outliner selection owns its moving endpoint"
    (S.selection_scope () = "rs-isolated" && (S.selection_state ()).S.selection_head = Some "b3");
  A.clear_selection ~scope:"main" ();
  A.extend_selection false;
  check "cleared selection cannot reuse another outliner's keyboard head"
    (S.String_set.is_empty (S.selected ()) && (S.selection_state ()).S.selection_head = None);
  S.set_collapsed ~scope:"main" "b1" false;
  reset_editor ();
  Js.Promise.resolve ()

let test_delete_selection_history (h : host) =
  let* () = settle h 40 in
  stage_page h [ Test_check.block "b0" "previous";
                 Test_check.block "b1" "first"; Test_check.block "b2" "second" ];
  S.set (fun st -> { st with S.editing = None;
      selected = S.String_set.of_list ["b1"; "b2"]; anchor = Some "b2";
      selection_head = Some "b1" });
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
  check "undo restores both selected range endpoints"
    ((S.selection_state ()).anchor = Some "b2"
     && (S.selection_state ()).selection_head = Some "b1");
  reset_editor ();
  Js.Promise.resolve ()

(* Explicit property commands must publish worker truth while the editor
   remains open, without waiting for a later autosave or broadcast. *)
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

let test_property_remove_batch (h : host) =
  let* () = settle h 40 in
  let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
  and previous_dialog = !Properties_dialog.current
  and previous_signal = !Properties_dialog.current_sig
  and previous_close = !Properties_dialog.current_on_close
  and previous_properties = Runtime.hooks.refresh_property_areas
  and previous_view = Runtime.hooks.refresh_after_ops in
  let origin = { (h.snapshot ()) with Model.repo = Some h.repo } in
  let model = ref origin in
  let requests = ref [] and refreshed = ref [] and closed = ref 0 in
  let rejected = ref false and complete = ref (fun () -> ()) in
  Runtime.read_model := (fun () -> !model);
  Runtime.hooks.refresh_property_areas <- (fun () ->
    refreshed := !refreshed @ ["properties"]; Ui_task.resolve ());
  Runtime.hooks.refresh_after_ops <- (fun () ->
    refreshed := !refreshed @ ["view"]; Ui_task.resolve ());
  Properties_dialog.current_sig := None;
  let prop = W.Map [W.Keyword "db/ident",W.Keyword "fixture/remove"] in
  let dialog uuid uuids : Properties_dialog.dlg_state =
    { d_target={uuid;uuids;db_id=None;is_tag=false;title=""}; d_remove=true;
      d_placement=Properties_dialog.Centered;d_phase=Properties_dialog.Prop_select;d_phase_sig=None } in
  let make_current d =
    Properties_dialog.current := Some d;
    Properties_dialog.current_on_close := (fun () -> incr closed) in
  Runtime.worker := Some { Worker_client.invoke_fn=(fun name args ->
    if name = "thread-api/apply-outliner-ops" then begin
      requests := args :: !requests;
      if !rejected then h.reject_promise "expected batch validation rejection"
      else Js.Promise.make (fun ~resolve ~reject:_ ->
        complete := (fun () -> resolve (W.Map [W.Keyword "result",W.Nil]) [@u]))
    end else Js.Promise.resolve W.Nil);
    on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
  let payload () = match !requests with
    | [[W.String repo;W.Array [W.Array [W.Keyword "batch-remove-property";
        W.Array [W.List [W.Uuid "b1";W.Uuid "b2"];W.Keyword "fixture/remove"]]];W.Map []]] -> repo = h.repo
    | _ -> false in
  let d = dialog "b1" ["b1";"b2"] in
  make_current d;
  let removing = Properties_dialog.remove_property d prop in
  let* () = h.wait_ms 25 in
  check "selected property removal issues one captured two-owner batch request" (payload ());
  check "property removal keeps its dialog until the transaction acknowledges"
    (!closed=0 && !refreshed=[] && !Properties_dialog.current=Some d);
  !complete ();
  let* () = removing in
  check "one successful property transaction refreshes before closing its own dialog"
    (!closed=1 && !refreshed=["properties";"view"] && !Properties_dialog.current=None);
  requests:=[];refreshed:=[];closed:=0;rejected:=true;
  let d = dialog "b1" ["b1";"b2"] in
  make_current d;
  let* failed = Properties_dialog.remove_property d prop
    |> Js.Promise.then_ (fun () -> Js.Promise.resolve false)
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve true) in
  check "batch rejection propagates without partial per-owner fallback"
    (failed && payload () && !closed=0 && !refreshed=[] && !Properties_dialog.current=Some d);
  requests:=[];refreshed:=[];closed:=0;rejected:=false;
  let old = dialog "b1" ["b1";"b2"] in
  make_current old;
  let removing = Properties_dialog.remove_property old prop in
  (* Change graphs before asynchronous request construction resolves. The
     accepted command must retain its captured repo and owner list. *)
  model := {origin with Model.repo=Some "destination-graph";
    context_revision=origin.context_revision+1};
  let newer = dialog "new-owner" [] in
  make_current newer;
  let* () = h.wait_ms 25 in
  check "property removal cannot retarget a captured selection into another graph" (payload ());
  !complete ();
  let* () = removing in
  check "old property completion neither refreshes the destination nor closes a newer dialog"
    (!refreshed=[] && !closed=0 && !Properties_dialog.current=Some newer);
  Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
  Runtime.hooks.refresh_property_areas <- previous_properties;
  Runtime.hooks.refresh_after_ops <- previous_view;
  Properties_dialog.current:=previous_dialog;Properties_dialog.current_sig:=previous_signal;
  Properties_dialog.current_on_close:=previous_close;
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
  let* () = test_embed_persists_erased_buffer h in
  let* () = test_pending_save_order h in
  let* () = test_queued_input h in
  let* () = test_structure_completion_ownership h in
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
  let* () = test_navigation_retires_dirty_editor h in
  let* () = test_history_after_navigation h in
  let* () = test_queued_history_origin h in
  let* () = test_keyboard_block_selection h in
  let* () = test_delete_selection_history h in
  let* () = test_property_command_refresh h in
  let* () = test_property_remove_batch h in
  h.restore saved;
  Js.Promise.resolve ()
