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

module Timer_deadlines = Set.Make (struct
  type t = float * int
  let compare (time_a, id_a) (time_b, id_b) =
    let order = Float.compare time_a time_b in
    if order=0 then Int.compare id_a id_b else order
end)

type timer = { deadline : float; callback : unit -> unit }
let timer_next = ref 0
let timers : (int, timer) Hashtbl.t = Hashtbl.create 16
let deadlines = ref Timer_deadlines.empty
let timers_lock = Mutex.create ()
let timer_read, timer_write = Unix.pipe ~cloexec:true ()
let () = Unix.set_nonblock timer_read; Unix.set_nonblock timer_write
let timer_signal = Bytes.make 1 't'
let timer_time () = Int64.to_float (Mtime_clock.elapsed_ns ()) *. 1e-9

let notify_timers () =
  try ignore (Unix.single_write timer_write timer_signal 0 1)
  with Unix.Unix_error ((Unix.EAGAIN | Unix.EWOULDBLOCK), _, _) -> ()

(* Queued tasks retain only the handle. Cancellation releases the callback
   immediately, including when its deadline has passed but the UI is busy. *)
let run_timer id () =
  Mutex.lock timers_lock;
  let timer = Hashtbl.find_opt timers id in
  Hashtbl.remove timers id;
  Mutex.unlock timers_lock;
  Option.iter (fun timer -> timer.callback ()) timer

let set_timeout (f : unit -> unit) (ms : int) : int =
  if ms < 0 then invalid_arg "Native timer delay must be nonnegative";
  let deadline = timer_time () +. float_of_int ms /. 1000. in
  Mutex.lock timers_lock;
  incr timer_next;
  let id = !timer_next in
  Hashtbl.add timers id {deadline; callback=f};
  if ms > 0 then deadlines := Timer_deadlines.add (deadline,id) !deadlines;
  Mutex.unlock timers_lock;
  if ms=0 then enqueue (run_timer id) else notify_timers ();
  id

let clear_timeout id =
  Mutex.lock timers_lock;
  let timer = Hashtbl.find_opt timers id in
  Option.iter (fun timer ->
    Hashtbl.remove timers id;
    deadlines := Timer_deadlines.remove (timer.deadline,id) !deadlines) timer;
  Mutex.unlock timers_lock;
  if Option.is_some timer then notify_timers ()

(* One sleeping worker serves every delayed timer. Its wake pipe interrupts
   the current deadline when a timer is inserted or cancelled. *)
let timer_loop () =
  let signal_buffer = Bytes.create 64 in
  let rec drain_signal () =
    match Unix.read timer_read signal_buffer 0 (Bytes.length signal_buffer) with
    | 0 -> failwith "Native timer wake pipe closed"
    | _ -> drain_signal ()
    | exception Unix.Unix_error ((Unix.EAGAIN | Unix.EWOULDBLOCK), _, _) -> ()
    | exception Unix.Unix_error (Unix.EINTR, _, _) -> drain_signal () in
  while true do
    Mutex.lock timers_lock;
    let now = timer_time () in
    let rec take_due ready =
      match Timer_deadlines.min_elt_opt !deadlines with
      | Some (deadline,id) when deadline <= now ->
        deadlines := Timer_deadlines.remove (deadline,id) !deadlines;
        take_due (id :: ready)
      | next -> List.rev ready, next in
    let ready,next = take_due [] in
    Mutex.unlock timers_lock;
    if ready <> [] then begin
      Mutex.lock lock;
      List.iter (fun id -> Queue.push (run_timer id) queue) ready;
      Mutex.unlock lock;
      !wakeup_cb ()
    end;
    let timeout = match next with
      | None -> -1.
      | Some (deadline,_) -> max 0. (deadline -. timer_time ()) in
    let readable,_,_ =
      try Unix.select [timer_read] [] [] timeout
      with Unix.Unix_error (Unix.EINTR, _, _) -> [],[],[] in
    if readable <> [] then drain_signal ()
  done

let _timer_worker = Thread.create (fun () ->
  try timer_loop () with error ->
    prerr_endline ("Native timer scheduler failed: " ^ Printexc.to_string error);
    exit 2) ()

(* ---------- uuid ---------- *)

let uuid_seeded = ref false

let random_uuid () =
  (* Random starts from a fixed seed without self_init — every run would
     regenerate the same uuid sequence and collide with persisted block
     uuids (e.g. the first split-block after boot reusing the uuid the
     previous boot assigned) *)
  if not !uuid_seeded then (
    Random.self_init ();
    uuid_seeded := true);
  let b = Bytes.create 16 in
  for i = 0 to 15 do
    Bytes.set b i (Char.chr (Random.int 256))
  done;
  Bytes.set b 6 (Char.chr ((Char.code (Bytes.get b 6) land 0x0f) lor 0x40));
  Bytes.set b 8 (Char.chr ((Char.code (Bytes.get b 8) land 0x3f) lor 0x80));
  Printf.sprintf
    "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x"
    (Char.code (Bytes.get b 0)) (Char.code (Bytes.get b 1))
    (Char.code (Bytes.get b 2)) (Char.code (Bytes.get b 3))
    (Char.code (Bytes.get b 4)) (Char.code (Bytes.get b 5))
    (Char.code (Bytes.get b 6)) (Char.code (Bytes.get b 7))
    (Char.code (Bytes.get b 8)) (Char.code (Bytes.get b 9))
    (Char.code (Bytes.get b 10)) (Char.code (Bytes.get b 11))
    (Char.code (Bytes.get b 12)) (Char.code (Bytes.get b 13))
    (Char.code (Bytes.get b 14)) (Char.code (Bytes.get b 15))

(* ---------- host window/appearance state ---------- *)

let width_ref = ref 1440.
let height_ref = ref 900.

let set_window_size w h =
  width_ref := w;
  height_ref := h

let inner_width () = !width_ref
let inner_height () = !height_ref

let titlebar_left = ref 0
let titlebar_listeners : (int, int -> unit) Hashtbl.t = Hashtbl.create 2
let titlebar_listener_id = ref 0

let set_titlebar_left left =
  let left = int_of_float (Float.ceil left) in
  if left <> !titlebar_left then begin
    titlebar_left := left;
    Hashtbl.iter (fun _ notify -> notify left) titlebar_listeners
  end

let titlebar_left_signal ~scheduler ~scope =
  let state = Signal.state scheduler !titlebar_left in
  incr titlebar_listener_id;
  let id = !titlebar_listener_id in
  Hashtbl.add titlebar_listeners id (Signal.set state);
  Signal.on_dispose scope (fun () -> Hashtbl.remove titlebar_listeners id);
  Signal.own_signal scope (Signal.value state)

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
