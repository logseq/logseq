(* Deterministic orchestration boundaries over the actual native coordinator.
   No daemon, process, graph or native view is created by these cases. *)
let check label condition = if not condition then failwith label

type phase = Open | Sealed | Exited | Restored | Unknown
type pending = { name:string; succeed:unit->unit; reject:unit->unit }
type fixture = {
  gate:Update_admission.t;
  scope:Ui_task.Activity.t;
  owner:Update_preparation.t;
  pending:pending Queue.t;
  log:string list ref;
  responses:(string * bool * string) list ref;
  states:(string * phase ref) list;
  draft:string ref;
  released_draft:string option ref;
}
let delayed pending log name on_success on_failure =
  log := !log @ [name];
  let promise, resolve, reject = Js.Promise.pending () in
  Queue.add {name; succeed=(fun () -> on_success (); resolve ());
    reject=(fun () -> on_failure (); reject (Failure ("fixture failure: " ^ name)))} pending;
  promise
let start ?(defer_capture=false) names =
  let pending=Queue.create () and log=ref [] and responses=ref [] in
  let draft=ref "saved" and released_draft=ref None in
  let states=List.map (fun name -> name, ref Open) names in
  let workers=List.map (fun (name, phase) ->
    let wait action success failure = delayed pending log (action ^ ":" ^ name) success failure in
    let recover () = match !phase with
      | Open | Restored -> Js.Promise.resolve ()
      | Sealed -> wait "abort" (fun () -> phase:=Open) (fun () -> ())
      | Exited -> wait "restore" (fun () -> phase:=Restored) (fun () -> ())
      | Unknown -> wait "prove" (fun () -> phase:=Restored) (fun () -> ()) in
    ({Update_preparation.key=("/fixture", "/fixture/graphs", "/fixture/lifecycle", name);
      seal=(fun () -> wait "seal" (fun () -> phase:=Sealed) (fun () -> ()));
      stop=(fun () -> wait "stop" (fun () -> phase:=Exited) (fun () -> phase:=Unknown));
      recover} : Update_preparation.worker)) states in
  let lifecycle : Update_preparation.workers = {
    capture=(fun ~request_id:_ ->
      log := !log @ ["capture"];
      if defer_capture then begin
        let promise, resolve, reject = Js.Promise.pending () in
        Queue.add {name="capture"; succeed=(fun () -> resolve (List.rev workers));
          reject=(fun () -> reject (Failure "capture refused unknown/shared workers"))} pending;
        promise
      end else Js.Promise.resolve (List.rev workers));
    resume=(fun () -> delayed pending log "resume" (fun () ->
      Host.enqueue (fun () -> Host.enqueue (fun () -> draft:="restored mailbox"))) (fun () -> ())) } in
  let gate=Update_admission.create () and scope=Ui_task.Activity.create () in
  let owner=Update_preparation.start ~workers:lifecycle ~gate ~scope
    ~save:(fun ~current:_ -> Js.Promise.resolve ()) ~flush:(fun () -> ()) ~logical_idle:(fun () -> true)
    ~respond:(fun phase ok error ->
      if phase="released" && ok then released_draft:=Some !draft;
      responses:= !responses @ [phase,ok,error]) "1" in
  Host.drain ();
  {gate;scope;owner;pending;log;responses;states;draft;released_draft}
let next fixture = check "expected a coordinator operation" (not (Queue.is_empty fixture.pending));
  Queue.peek fixture.pending
let complete fixture expected =
  let operation=Queue.take fixture.pending in
  check ("unexpected operation before " ^ expected) (operation.name=expected);
  operation.succeed ();Host.drain ()
let reject fixture expected =
  let operation=Queue.take fixture.pending in
  check ("unexpected rejected operation before " ^ expected) (operation.name=expected);
  operation.reject ();Host.drain ()
let worker_fenced fixture =
  match Update_admission.require_worker fixture.gate "fixture normal invoke" with
  | () -> failwith "Ordinary worker calls escaped the preparation/restoration fence"
  | exception Update_admission.Refused _ -> ()
let reset_refused fixture =
  match Update_admission.reset fixture.gate with
  | () -> failwith "Reset reopened an unproven owned-worker reservation"
  | exception Invalid_argument _ -> ()
let released fixture = List.exists (fun (phase,ok,_) -> phase="released" && ok) !(fixture.responses)
let prepared fixture = List.exists (fun (phase,ok,_) -> phase="prepared" && ok) !(fixture.responses)
let cleanup fixture = Update_preparation.close fixture.owner;Ui_task.Activity.close fixture.scope
let finish_recovery fixture =
  let rec finish remaining =
    check "recovery must converge without polling or duplicate actions" (remaining>0);
    if not (Queue.is_empty fixture.pending) then begin
      let name=(next fixture).name in
      check "Cancellation dispatched more seal/stop work"
        (not (String.starts_with ~prefix:"seal:" name || String.starts_with ~prefix:"stop:" name));
      complete fixture name;finish (remaining-1)
    end in
  finish 20;
  check "recovered owner releases only after the final barrier" (released fixture);
  check "released gate admits ordinary worker calls"
    (try Update_admission.require_worker fixture.gate "after release";true with _ -> false)
let advance fixture target =
  let rec go remaining =
    check "target coordinator boundary did not become reachable" (remaining>0);
    let current=(next fixture).name in
    if current<>target then (complete fixture current;go (remaining-1)) in
  go 20
let fully_prepared fixture =
  List.iter (complete fixture) ["seal:a";"seal:b";"stop:a";"stop:b"];
  check "all workers stop before Prepared succeeds" (prepared fixture)

let all_sealed_before_any_stop () =
  let fixture=start ["b";"a"] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    check "unordered captures are sorted deterministically" ((next fixture).name="seal:a");
    complete fixture "seal:a";
    check "the first seal cannot dispatch stop before the last seal"
      (not (List.exists (String.starts_with ~prefix:"stop:") !(fixture.log)));
    complete fixture "seal:b";complete fixture "stop:a";complete fixture "stop:b";
    check "Prepared is the all-worker stop boundary" (prepared fixture);
    worker_fenced fixture;
    Update_preparation.abort fixture.owner;Host.drain ();
    worker_fenced fixture;reset_refused fixture;
    check "abort cannot acknowledge release before restoration" (not (released fixture));
    complete fixture "restore:a";complete fixture "restore:b";
    check "transport readiness precedes release" (not (released fixture));
    complete fixture "resume";
    check "nested restoration mailbox writes settle before release"
      (!(fixture.released_draft)=Some "restored mailbox");
    check "complete restoration releases the worker fence" (released fixture);
    let before=List.length !(fixture.responses) in
    Update_preparation.abort fixture.owner;
    check "matching released acknowledgement remains idempotent"
      (List.length !(fixture.responses)=before+1))
let zero_workers () =
  let fixture=start [] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    check "empty owned snapshot still has a valid application barrier" (prepared fixture);
    Update_preparation.abort fixture.owner;Host.drain ();
    check "empty snapshot releases without fictitious transport work"
      (released fixture && !(fixture.log)=["capture"]))
let cancellation_boundaries () =
  List.iter (fun boundary ->
    let fixture=start ~defer_capture:(boundary="capture") ["a";"b"] in
    Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
      advance fixture boundary;
      Update_preparation.abort fixture.owner;Host.drain ();
      check "abort waits for the operation already in flight" (not (released fixture));
      worker_fenced fixture;
      complete fixture boundary;
      finish_recovery fixture;
      check "cancelled preparation never reports a successful Prepared" (not (prepared fixture))))
    ["capture";"seal:a";"seal:b";"stop:a";"stop:b"];
  List.iter (fun boundary ->
    let fixture=start ["a";"b"] in
    Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
      fully_prepared fixture;Update_preparation.abort fixture.owner;Host.drain ();
      advance fixture boundary;
      Update_preparation.abort fixture.owner;Host.drain ();
      check "repeated abort cannot release the in-flight restore/probe" (not (released fixture));
      complete fixture boundary;finish_recovery fixture;
      List.iter (fun name -> check "successful restoration is not replayed by repeated abort"
        (List.length (List.filter ((=) name) !(fixture.log))=1)) ["restore:a";"restore:b";"resume"]))
    ["restore:a";"restore:b";"resume"]
let partial_failure_and_retry () =
  let fixture=start ["a";"b"] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    advance fixture "stop:b";reject fixture "stop:b";
    check "stop failure reports unsuccessful Prepared"
      (List.exists (fun (phase,ok,_) -> phase="prepared" && not ok) !(fixture.responses));
    Update_preparation.abort fixture.owner;Host.drain ();
    complete fixture "restore:a";reject fixture "prove:b";reject fixture "resume";
    check "unknown stop/failed probe never reports release success" (not (released fixture));
    worker_fenced fixture;reset_refused fixture;
    Update_preparation.abort fixture.owner;Host.drain ();
    complete fixture "prove:b";complete fixture "resume";
    check "explicit retry recovers only the failed handle/probe" (released fixture);
    check "successful exited-worker restoration is retained across retry"
      (List.length (List.filter ((=) "restore:a") !(fixture.log))=1))
let capture_and_seal_refusal () =
  let fixture=start ~defer_capture:true ["a";"b"] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    reject fixture "capture";
    Update_preparation.abort fixture.owner;Host.drain ();
    check "unknown/shared snapshot refusal cannot seal or stop any worker"
      (released fixture && !(fixture.log)=["capture"]));
  let fixture=start ["a";"b"] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    complete fixture "seal:a";reject fixture "seal:b";
    Update_preparation.abort fixture.owner;Host.drain ();
    finish_recovery fixture;
    check "a refused later seal aborts earlier seals without stopping any worker"
      (not (List.exists (String.starts_with ~prefix:"stop:") !(fixture.log))))
let owner_retirement () =
  List.iter (fun boundary ->
    let fixture=start ["a";"b"] in
    Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
      if String.starts_with ~prefix:"restore:" boundary || boundary="resume" then begin
        fully_prepared fixture;Update_preparation.abort fixture.owner;Host.drain ()
      end;
      advance fixture boundary;
      let log= !(fixture.log) and responses= !(fixture.responses) in
      Update_preparation.close fixture.owner;reset_refused fixture;
      complete fixture boundary;
      check "retired owner never dispatches more protocol work" (!(fixture.log)=log);
      check "retired owner never acknowledges a successful newer reservation"
        (!(fixture.responses)=responses)))
    ["seal:a";"seal:b";"stop:a";"stop:b";"restore:a";"restore:b";"resume"];
  let fixture=start ~defer_capture:true ["a"] in
  Fun.protect ~finally:(fun () -> cleanup fixture) (fun () ->
    Update_preparation.close fixture.owner;
    Update_admission.reset fixture.gate;
    let responses=ref [] in
    let newer=Update_preparation.start ~gate:fixture.gate ~scope:fixture.scope
      ~save:(fun ~current:_ -> Js.Promise.resolve ()) ~flush:(fun () -> ()) ~logical_idle:(fun () -> true)
      ~respond:(fun phase ok _ -> responses:= !responses @ [phase,ok]) "1" in
    Host.drain ();
    complete fixture "capture";
    Update_preparation.abort fixture.owner;Host.drain ();
    check "same-ID stale callbacks cannot seal/stop/release a newer epoch"
      (!(fixture.log)=["capture"] && !responses=["prepared",true]);
    Update_preparation.abort newer;Host.drain ();
    check "new reservation retains its independent release owner"
      (!responses=["prepared",true;"released",true]))

let run () =
  all_sealed_before_any_stop ();zero_workers ();cancellation_boundaries ();
  partial_failure_and_retry ();capture_and_seal_refusal ();owner_retirement ();
  print_endline "PASS native all-worker preparation ordering, rollback, retry and retired-owner fencing"
