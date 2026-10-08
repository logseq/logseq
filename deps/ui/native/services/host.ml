(* Host mailbox: cross-thread task delivery onto the app (OCaml UI)
   thread. Native transport threads (HTTP, SSE, daemon spawn) never
   settle promises or touch model state directly — they enqueue a thunk
   here and poke the LUI wakeup; the app's pump drains the queue on the
   main thread. *)

let queue : (unit -> unit) Queue.t = Queue.create ()
let lock = Mutex.create ()

(* set by native_embed to the wakeup closure the host gives us *)
let wakeup_cb : (unit -> unit) ref = ref (fun () -> ())

let set_wakeup f = wakeup_cb := f

let enqueue (fn : unit -> unit) : unit =
  Mutex.lock lock;
  Queue.push fn queue;
  Mutex.unlock lock;
  !wakeup_cb ()

(* run on the app thread from the LUI pump *)
let drain () : unit =
  let rec loop () =
    Mutex.lock lock;
    let next =
      if Queue.is_empty queue then None else Some (Queue.pop queue)
    in
    Mutex.unlock lock;
    match next with
    | Some fn ->
        (try fn ()
         with e ->
           prerr_endline
             ("[host] task raised: " ^ Printexc.to_string e));
        loop ()
    | None -> ()
  in
  loop ()

(* ---------- timers (setTimeout equivalent) ---------- *)

let timer_next = ref 0
let cancelled : (int, unit) Hashtbl.t = Hashtbl.create 8
let timers_lock = Mutex.create ()

let set_timeout (f : unit -> unit) (ms : int) : int =
  Mutex.lock timers_lock;
  incr timer_next;
  let id = !timer_next in
  Mutex.unlock timers_lock;
  ignore
    (Thread.create
       (fun () ->
         Unix.sleepf (float_of_int ms /. 1000.);
         let dead =
           Mutex.lock timers_lock;
           let d = Hashtbl.mem cancelled id in
           Mutex.unlock timers_lock;
           d
         in
         if not dead then enqueue f)
       ());
  id

let clear_timeout (id : int) : unit =
  Mutex.lock timers_lock;
  Hashtbl.replace cancelled id ();
  Mutex.unlock timers_lock

(* ---------- host window/appearance state ---------- *)

let width_ref = ref 1440.
let height_ref = ref 900.

let set_window_size w h =
  width_ref := w;
  height_ref := h

let inner_width () = !width_ref
let inner_height () = !height_ref

(* set by the native host: perform a dom-op / open-url / clipboard *)
let host_op : (string -> string -> unit) ref = ref (fun _ _ -> ())

let set_host_op f = host_op := f
let open_url (u : string) = !host_op "open-url" u
let clipboard_write (s : string) = !host_op "clipboard" s
let clipboard_read () = !host_op "clipboard-read" ""
let dom_op (name : string) (payload : string) = !host_op "dom-op" (name ^ "\n" ^ payload)

(* appearance: Swift pushes it via platform_event "appearance" *)
let dark_ref = ref false

let set_dark d = dark_ref := d
let prefers_dark () = !dark_ref
