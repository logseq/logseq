(* One native preparation owner over the existing promise/mailbox/worker paths.
   No installer, daemon lifecycle, display frame or polling timer lives here. *)
exception Cancelled

type t = {
  id : string;
  gate : Update_admission.t;
  scope : Ui_task.Activity.t;
  flush : unit -> unit;
  logical_idle : unit -> bool;
  respond : string -> bool -> string -> unit;
  mutable result : (unit, exn) result option;
  mutable prepared_reported : bool;
  mutable logical_reported : bool;
  mutable queued : bool;
  mutable cancel_idle : (unit -> unit) option;
  mutable live : bool;
}

let cancel_idle t =
  Option.iter (fun cancel -> cancel ()) t.cancel_idle;
  t.cancel_idle <- None
let close t = t.live <- false; cancel_idle t
let current t = t.live && Update_admission.current t.gate t.id

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
        (* An accepted worker call can reject before a sibling completes.
           Observe its completion without creating another bookkeeping chain. *)
        let waiting = Ui_task.Activity.within t.scope Worker_client.await_idle in
        Ui_task.Activity.without (fun () ->
          Js.Promise.observe (fun _ -> queue_check t) waiting)
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
        (* There is no safe release proof. Wait for real observed activity,
           never resubscribe to the same zero count or invent a polling timer. *)
        await_idle ~after_epoch:activity.epoch t
      end
      else if Update_admission.aborting t.gate t.id then begin
        if Update_admission.finish_release t.gate t.id then begin
          t.respond "released" true "";
          close t
        end
      end else if not t.prepared_reported then begin
        t.prepared_reported <- true;
        match t.result with
        | Some (Ok ()) ->
            if Update_admission.seal t.gate t.id then t.respond "prepared" true ""
        | Some (Error error) -> t.respond "prepared" false (Printexc.to_string error)
        | None -> ()
      end

let start ~gate ~scope ~save ~flush ~logical_idle ~respond id =
  Update_admission.begin_prepare gate id;
  let t = { id; gate; scope; flush; logical_idle; respond; result = None;
    prepared_reported = false; logical_reported = false; queued = false;
    cancel_idle = None; live = true } in
  Host.enqueue (fun () ->
    if current t then begin
      (* Actual saves and all continuations are observed. Only this direct
         observer's bookkeeping is excluded; no output promise counts itself. *)
      let saving = Ui_task.Activity.within scope (fun () ->
        if Update_admission.can_save gate id then
          try save ~current:(fun () -> current t && Update_admission.can_save gate id)
          with error -> Js.Promise.reject error
        else Js.Promise.reject Cancelled) in
      Ui_task.Activity.without (fun () ->
        Js.Promise.observe (fun result ->
          if current t then begin
            t.result <- Some result;
            Update_admission.finish_save gate id;
            queue_check t
          end) saving)
    end);
  t

let abort t =
  match Update_admission.request_abort t.gate t.id with
  | `Pending -> queue_check t
  | `Released -> t.respond "released" true ""
  | `Stale -> t.respond "released" false "Update preparation request is not current"
