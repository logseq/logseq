(* One native preparation owner over the existing promise/mailbox/worker paths.
   Exact worker capabilities are captured only after the application's save
   barrier. No installer, display frame, global registry or polling lives here. *)
exception Cancelled

type worker = {
  key : string * string * string * string;
  seal : unit -> unit Js.Promise.t;
  stop : unit -> unit Js.Promise.t;
  recover : unit -> unit Js.Promise.t;
}
type workers = {
  capture : request_id:string -> worker list Js.Promise.t;
  resume : unit -> unit Js.Promise.t;
}
type stage = Saving | Quiescing | Holding | Recovering | Restored | Recovery_failed of exn

type t = {
  id : string;
  epoch : int;
  gate : Update_admission.t;
  scope : Ui_task.Activity.t;
  flush : unit -> unit;
  logical_idle : unit -> bool;
  respond : string -> bool -> string -> unit;
  lifecycle : workers option;
  mutable stage : stage;
  mutable pending_recovery : worker list;
  mutable resume_needed : bool;
  mutable retry_recovery : bool;
  mutable released_ack : bool;
  mutable result : (unit, exn) result option;
  mutable prepared_reported : bool;
  mutable logical_reported : bool;
  mutable queued : bool;
  mutable cancel_idle : (unit -> unit) option;
  mutable live : bool;
}

let same_epoch t = Update_admission.epoch t.gate=t.epoch
let current t = t.live && same_epoch t && Update_admission.current t.gate t.id
let cancel_idle t =
  Option.iter (fun cancel -> cancel ()) t.cancel_idle;
  t.cancel_idle <- None
let close t =
  let was_live=t.live in
  t.live <- false;
  cancel_idle t;
  if was_live && same_epoch t && t.gate.Update_admission.workers_changed then
    prerr_endline "Retired update preparation remains fenced: owned worker restoration is unproven"
let cancelled t = Update_admission.aborting t.gate t.id
let check_preparing t =
  if not (current t) || cancelled t then raise Cancelled;
  match t.result with Some (Error error) -> raise error | Some (Ok ()) | None -> ()
let call action = try action () with error -> Js.Promise.reject error
let outcome action =
  Js.Promise.catch (fun error -> Js.Promise.resolve (Error error))
    (Js.Promise.then_ (fun () -> Js.Promise.resolve (Ok ())) (call action))

let rec queue_check t =
  if current t && not t.queued then begin
    t.queued <- true;
    Host.after_drain (fun () -> Ui_task.Activity.without (fun () ->
      t.queued <- false;
      checkpoint t))
  end
and await_idle ?after_epoch t =
  if current t && Option.is_none t.cancel_idle then
    t.cancel_idle <- Some (Ui_task.Activity.without (fun () ->
      Ui_task.Activity.when_idle ?after_epoch t.scope (fun () ->
        t.cancel_idle <- None;
        queue_check t)))
and observe t task completed =
  Ui_task.Activity.without (fun () -> Js.Promise.observe (fun result ->
    if current t then begin completed result; queue_check t end) task)
and prepare_workers t lifecycle =
  t.stage <- Quiescing;
  let task = Ui_task.Activity.within t.scope (fun () ->
    let open Promise_ext in
    let* workers = call (fun () -> lifecycle.capture ~request_id:t.id) in
    check_preparing t;
    let workers = List.sort (fun first second -> Stdlib.compare first.key second.key) workers in
    let rec unique = function
      | first::(second::_ as rest) ->
          if first.key=second.key then invalid_arg "Update snapshot repeats a worker storage identity";
          unique rest
      | [] | [_] -> () in
    unique workers;
    t.pending_recovery <- workers;
    let rec seal = function
      | [] -> stop workers
      | worker::rest ->
          check_preparing t;
          Update_admission.mark_workers_changed t.gate t.id;
          t.resume_needed <- true;
          let* () = call worker.seal in
          seal rest
    and stop = function
      | [] -> Js.Promise.resolve ()
      | worker::rest ->
          check_preparing t;
          let* () = call worker.stop in
          stop rest in
    seal workers) in
  observe t task (fun result ->
    t.stage <- Holding;
    match result with
    | Ok () -> ()
    | Error error -> t.result <- Some (Error error))
and recover_workers t =
  t.stage <- Recovering;
  t.retry_recovery <- false;
  let task = Ui_task.Activity.within t.scope (fun () ->
    let open Promise_ext in
    let check_owner () = if not (current t) then raise Cancelled in
    let rec recover failed errors = function
      | [] ->
          check_owner ();
          t.pending_recovery <- List.rev failed;
          (match errors with
           | _::_ -> Js.Promise.reject (Failure (String.concat "; "
               (List.rev_map Printexc.to_string errors)))
           | [] ->
               let* resumed = if t.resume_needed then
                   (match t.lifecycle with
                    | Some lifecycle -> outcome lifecycle.resume
                    | None -> Js.Promise.reject (Failure "Worker recovery has no captured transport owner"))
                 else Js.Promise.resolve (Ok ()) in
               check_owner ();
               match resumed with
               | Ok () -> t.resume_needed <- false; Js.Promise.resolve ()
               | Error error -> Js.Promise.reject error)
      | worker::rest ->
          check_owner ();
          let* result = outcome worker.recover in
          check_owner ();
          (match result with
           | Ok () -> recover failed errors rest
           | Error error -> recover (worker::failed) (error::errors) rest) in
    recover [] [] t.pending_recovery) in
  observe t task (function
    | Ok () -> t.stage <- Restored
    | Error error -> t.stage <- Recovery_failed error)
and finish_release t =
  if current t && cancelled t then begin
    Update_admission.confirm_workers_restored t.gate t.id;
    if Update_admission.finish_release t.gate t.id then begin
      t.released_ack <- true;
      t.respond "released" true "";
      close t
    end
  end
and report_error t error =
  if not t.prepared_reported && not (cancelled t) then begin
    t.prepared_reported <- true;
    t.respond "prepared" false (Printexc.to_string error)
  end
and checkpoint t =
  cancel_idle t;
  match current t, t.result with
  | false, _ | _, None -> ()
  | true, Some _ ->
      let worker_epoch = Worker_client.activity_epoch ()
      and mailbox_epoch = Host.activity_epoch ()
      and activity_epoch = (Ui_task.Activity.snapshot t.scope).epoch in
      (match Ui_task.Activity.within t.scope t.flush with
       | () -> ()
       | exception error -> t.result <- Some (Error error));
      let activity = Ui_task.Activity.snapshot t.scope in
      if activity.pending <> 0 then await_idle t
      else if not (Worker_client.idle ()) then begin
        let waiting = Ui_task.Activity.within t.scope Worker_client.await_idle in
        Ui_task.Activity.without (fun () -> Js.Promise.observe (fun _ -> queue_check t) waiting)
      end
      else if worker_epoch <> Worker_client.activity_epoch ()
           || mailbox_epoch <> Host.activity_epoch ()
           || activity_epoch <> activity.epoch
      then queue_check t
      else if not (t.logical_idle ()) then begin
        if not t.logical_reported then begin
          t.logical_reported <- true;
          prerr_endline "Update preparation remains fenced: pending logical editor work";
          if not t.prepared_reported then begin
            t.prepared_reported <- true;
            t.respond "prepared" false "Pending logical editor work has not settled"
          end
        end;
        await_idle ~after_epoch:activity.epoch t
      end
      else match t.stage with
      | Saving ->
          (match t.result with
           | Some (Error error) -> report_error t error;
               if cancelled t then finish_release t
           | Some (Ok ()) when cancelled t -> finish_release t
           | Some (Ok ()) ->
               if Update_admission.seal t.gate t.id then
                 (match t.lifecycle with
                  | Some lifecycle -> prepare_workers t lifecycle
                  | None -> t.stage <- Holding; queue_check t)
           | None -> ())
      | Quiescing | Recovering -> ()
      | Holding ->
          (match t.result with
           | Some (Error error) -> report_error t error; recover_workers t
           | Some (Ok ()) when cancelled t -> recover_workers t
           | Some (Ok ()) ->
               if not t.prepared_reported then begin
                 t.prepared_reported <- true;
                 t.respond "prepared" true ""
               end
           | None -> ())
      | Restored -> if cancelled t then finish_release t
      | Recovery_failed error ->
          if t.retry_recovery then recover_workers t
          else if cancelled t then t.respond "released" false (Printexc.to_string error)

let start ?workers ~gate ~scope ~save ~flush ~logical_idle ~respond id =
  Update_admission.begin_prepare gate id;
  let t = { id; epoch=Update_admission.epoch gate; gate; scope; flush; logical_idle; respond;
    lifecycle=workers; stage=Saving; pending_recovery=[]; resume_needed=false;
    retry_recovery=false; released_ack=false; result=None;
    prepared_reported=false; logical_reported=false; queued=false; cancel_idle=None; live=true } in
  Host.enqueue (fun () ->
    if current t then begin
      let saving = Ui_task.Activity.within scope (fun () ->
        if Update_admission.can_save gate id then
          call (fun () -> save ~current:(fun () -> current t && Update_admission.can_save gate id))
        else Js.Promise.reject Cancelled) in
      observe t saving (fun result ->
        t.result <- Some result;
        Update_admission.finish_save gate id)
    end);
  t

let abort t =
  if same_epoch t && (t.live || t.released_ack) then
    match Update_admission.request_abort t.gate t.id with
    | `Pending ->
        (match t.stage with Recovery_failed _ -> t.retry_recovery <- true | _ -> ());
        queue_check t
    | `Released -> if t.released_ack then t.respond "released" true ""
    | `Stale -> t.respond "released" false "Update preparation request is not current"
