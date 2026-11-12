(* Application-local update admission. This never owns or stops a daemon. *)
type phase = Open | Preparing of string | Held of string | Aborting of string

type t = {
  mutable phase : phase;
  mutable released : string option;
  mutable latest : string option;
  mutable save_finished : bool;
}

type refusal = { operation : string; request_id : string }
exception Refused of refusal

let create () = { phase = Open; released = None; latest = None; save_finished = false }
let application = create ()
let reset t =
  t.phase <- Open; t.released <- None; t.latest <- None; t.save_finished <- false

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
      t.latest <- Some id;
      t.save_finished <- false;
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
  | Preparing current when String.equal current id && t.save_finished -> t.phase <- Held id; true
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
let finish_release t id = match t.phase with
  | Aborting current when String.equal current id && t.save_finished ->
      t.phase <- Open;
      t.released <- Some id;
      true
  | Open | Preparing _ | Held _ | Aborting _ -> false

let require_input t operation = match t.phase with
  | Open -> ()
  | Preparing request_id | Held request_id | Aborting request_id ->
      raise (Refused { operation; request_id })
let require_worker t operation = match t.phase with
  | Open | Preparing _ | Aborting _ -> ()
  | Held request_id -> raise (Refused { operation; request_id })
