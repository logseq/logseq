(* In-process bridge endpoints for native_embed.ml's two outbound C
   calls. `wakeup` fires from OCaml worker threads (Host.enqueue)
   whenever the app mailbox needs a pump; `platform_request` carries
   "name\npayload" envelopes the host services (clipboard, open-url,
   dom-ops, theme, icons). Both queue here and are drained by the main
   SDL loop on the entry thread — entries in native_embed serialize on
   its entry_lock, so crossing back from a worker mid-dispatch would
   deadlock if handled synchronously. *)

let pending_wakeup = Atomic.make false
external notify_event_loop : unit -> unit = "logseq_native_notify_event_loop"

let wakeup () =
  if not (Atomic.exchange pending_wakeup true) then notify_event_loop ()

let requests : string Queue.t = Queue.create ()
let requests_lock = Mutex.create ()

let take_requests () =
  Mutex.lock requests_lock;
  let out = Queue.fold (fun acc s -> s :: acc) [] requests |> List.rev in
  Queue.clear requests;
  Mutex.unlock requests_lock;
  out

let () =
  Callback.register "ocaml_host_wakeup" wakeup;
  Callback.register "ocaml_host_platform_request" (fun (s : string) ->
      Mutex.lock requests_lock;
      Queue.add s requests;
      Mutex.unlock requests_lock;
      wakeup ())
