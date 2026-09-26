(* Port of the parts of src/main/logseq/cli/profile.cljs that
   cli_server.ml uses: the session record and time!. cljs sessions are
   {:spans (atom []) :next-span-id (atom n)} — a flat mutable record
   here. *)

module E = Db_worker_effect

type span = {
  stage : string;
  span_id : int;
  started_ms : float;
  ended_ms : float;
  elapsed_ms : float;
}

type session = {
  started_ms : float;
  mutable spans : span list;
  mutable next_span_id : int;
}

(* create-session — nil when disabled. *)
let create_session (enabled : bool) : session option =
  if enabled then
    Some { started_ms = Js.Date.now (); spans = []; next_span_id = 0 }
  else None

let next_span_id (s : session) : int =
  s.next_span_id <- s.next_span_id + 1;
  s.next_span_id

let record_span (s : session) ~stage ~span_id ~started_ms ~ended_ms =
  let elapsed_ms = Float.max 0. (ended_ms -. started_ms) in
  s.spans <- s.spans @ [ { stage; span_id; started_ms; ended_ms; elapsed_ms } ]

(* time! over a task-returning f — records the span when the task
   settles (the cljs thenable branch), on sync throw (records then
   re-raises), and returns the task's own result. *)
let time_task (session : session option) (stage : string) (f : unit -> 'a E.t) :
    'a E.t =
  match session with
  | None -> f ()
  | Some s ->
      let span_id = next_span_id s in
      let started_ms = Js.Date.now () in
      let record () =
        record_span s ~stage ~span_id ~started_ms ~ended_ms:(Js.Date.now ())
      in
      E.finally
        (try f () with e -> E.error e)
        (fun () ->
          record ();
          E.pure ())

(* time! over a synchronous f. *)
let time (session : session option) (stage : string) (f : unit -> 'a) : 'a =
  match session with
  | None -> f ()
  | Some s -> (
      let span_id = next_span_id s in
      let started_ms = Js.Date.now () in
      match f () with
      | result ->
          record_span s ~stage ~span_id ~started_ms ~ended_ms:(Js.Date.now ());
          result
      | exception e ->
          record_span s ~stage ~span_id ~started_ms ~ended_ms:(Js.Date.now ());
          raise e)
