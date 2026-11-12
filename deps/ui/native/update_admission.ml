(* Application-local update admission. This never owns or stops a daemon. *)
type phase = Open | Preparing of string | Held of string

type t = {
  mutable phase : phase;
  mutable released : string option;
  mutable latest : string option;
}

type refusal = { operation : string; request_id : string }
exception Refused of refusal

let create () = { phase = Open; released = None; latest = None }
let application = create ()
let reset t = t.phase <- Open; t.released <- None; t.latest <- None

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
      t.phase <- Preparing id
  | Preparing _ | Held _ -> invalid_arg "Update preparation is already active"

let current t id =
  match t.phase with
  | Preparing current | Held current -> String.equal current id
  | Open -> false

let seal t id =
  match t.phase with
  | Preparing current when String.equal current id -> t.phase <- Held id; true
  | Open | Preparing _ | Held _ -> false

let release t id =
  validate_id id;
  match t.phase with
  | Preparing current | Held current when String.equal current id ->
      t.phase <- Open;
      t.released <- Some id;
      true
  | Open -> t.released = Some id
  | Preparing _ | Held _ -> false

let require_input t operation =
  match t.phase with
  | Open -> ()
  | Preparing request_id | Held request_id -> raise (Refused { operation; request_id })

let require_worker t operation =
  match t.phase with
  | Open | Preparing _ -> ()
  | Held request_id -> raise (Refused { operation; request_id })
