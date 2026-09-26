(* Native equivalent of the JS console/stdio tap: log/warn/error are
   the daemon's console writes, so taps fire from here. There is no
   stdout.write interception — [Worker_log] entries all route through
   these three functions. *)

let taps : (source:string -> text:string -> unit) list ref = ref []
let taps_mu = Mutex.create ()

let fire source text =
  let current = Mutex.protect taps_mu (fun () -> !taps) in
  List.iter
    (fun tap ->
       try tap ~source ~text with _ -> ())
    current

let log s =
  fire "console.log" s;
  print_endline s

let warn s =
  fire "console.warn" s;
  Printf.eprintf "%s\n%!" s

let error s =
  fire "console.error" s;
  Printf.eprintf "%s\n%!" s

let tap_stdio tap =
  Mutex.protect taps_mu (fun () -> taps := tap :: !taps);
  fun () ->
    Mutex.protect taps_mu (fun () ->
        taps := List.filter (fun existing -> existing != tap) !taps)
