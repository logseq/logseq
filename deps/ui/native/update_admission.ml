(* Application-local update admission. This never owns or stops a daemon. *)
type phase = Open | Preparing of string | Held of string | Aborting of string

type t = {
  mutable phase : phase;
  mutable released : string option;
  mutable latest : string option;
  mutable save_finished : bool;
  mutable epoch : int;
  mutable workers_held : bool;
  mutable workers_changed : bool;
}

type refusal = { operation : string; request_id : string }
exception Refused of refusal

let create () = { phase=Open; released=None; latest=None; save_finished=false;
  epoch=0; workers_held=false; workers_changed=false }
let application = create ()
let next_epoch t =
  if t.epoch=max_int then invalid_arg "Update preparation epochs exhausted";
  t.epoch <- t.epoch+1
let epoch t = t.epoch
let reset t =
  if t.workers_changed then
    invalid_arg "Cannot reset application admission while owned worker restoration is unproven";
  next_epoch t;
  t.phase <- Open; t.released <- None; t.latest <- None; t.save_finished <- false;
  t.workers_held <- false

let validate_id id =
  if String.length id = 0 || String.length id > 20 || id.[0] = '0'
     || not (String.for_all (fun c -> c >= '0' && c <= '9') id)
  then invalid_arg "Invalid update preparation request id"

let begin_prepare t id =
  validate_id id;
  match t.phase with
  | Open ->
      let newer previous =
        String.length id > String.length previous
        || (String.length id = String.length previous && String.compare id previous > 0)
      in
      if not (Option.fold ~none:true ~some:newer t.latest)
      then invalid_arg "Update preparation request id is stale";
      next_epoch t;
      t.latest <- Some id;
      t.save_finished <- false;
      t.workers_held <- false;
      t.workers_changed <- false;
      t.phase <- Preparing id
  | Preparing _ | Held _ | Aborting _ -> invalid_arg "Update preparation is already active"

let current t id = match t.phase with
  | Preparing current | Held current | Aborting current -> String.equal current id
  | Open -> false
let can_save t id = match t.phase with
  | Preparing current -> String.equal current id
  | Open | Held _ | Aborting _ -> false
let aborting t id = match t.phase with
  | Aborting current -> String.equal current id
  | Open | Preparing _ | Held _ -> false
let finish_save t id =
  if current t id then t.save_finished <- true
let seal t id = match t.phase with
  | Preparing current when String.equal current id && t.save_finished ->
      t.phase <- Held id; t.workers_held <- true; true
  | Open | Preparing _ | Held _ | Aborting _ -> false

(* Abort is an intent, never proof that accepted save callbacks have stopped. *)
let request_abort t id =
  validate_id id;
  match t.phase with
  | Preparing current | Held current | Aborting current when String.equal current id ->
      t.phase <- Aborting id;
      `Pending
  | Open when t.released = Some id -> `Released
  | Open | Preparing _ | Held _ | Aborting _ -> `Stale

(* Only the coordinator calls this after its chain AND observed descendants
   have settled and the application mailbox/reactive work has drained. *)
let mark_workers_changed t id = match t.phase with
  | Held current when current=id -> t.workers_changed <- true
  | Open | Preparing _ | Held _ | Aborting _ -> invalid_arg "Worker sealing requires current held application admission"

(* Only the coordinator calls this after exact recovery/probe and the same
   activity/mailbox barrier used for save; retirement never confirms it. *)
let confirm_workers_restored t id =
  if current t id then t.workers_changed <- false
  else invalid_arg "Worker restoration belongs to a retired application reservation"

let finish_release t id = match t.phase with
  | Aborting current when String.equal current id && t.save_finished && not t.workers_changed ->
      t.phase <- Open;
      t.workers_held <- false;
      t.released <- Some id;
      true
  | Open | Preparing _ | Held _ | Aborting _ -> false

let require_input t operation = match t.phase with
  | Open -> ()
  | Preparing request_id | Held request_id | Aborting request_id ->
      raise (Refused { operation; request_id })
let require_worker t operation = match t.phase with
  | Held request_id -> raise (Refused { operation; request_id })
  | Aborting request_id when t.workers_held -> raise (Refused {operation; request_id})
  | Open | Preparing _ | Aborting _ -> ()
