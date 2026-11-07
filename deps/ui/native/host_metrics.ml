open Lui_elements

type host_sample = {
  build_ms : float option;
  heap_bytes : float;
  runtime_bytes : float;
  gc_cycles : float;
}

type sample = {
  panel_open : bool;
  host : host_sample option;
  heap_words : int;
  minor_collections : int;
  major_collections : int;
}

let current = ref { panel_open = false; host = None; heap_words = 0;
                    minor_collections = 0; major_collections = 0 }
let observer : (sample -> unit) option ref = ref None

let publish () =
  let gc = Gc.quick_stat () in
  current := { !current with heap_words = gc.heap_words;
    minor_collections = gc.minor_collections;
    major_collections = gc.major_collections };
  Option.iter (fun notify -> notify !current) !observer

let toggle () =
  current := { !current with panel_open = not !current.panel_open };
  Platform.update_native_performance
    { Ui_services.fps = None; panel_open = !current.panel_open };
  publish ()

let note_host (json : Js.Json.t) =
  let fields = match json with
    | Js.Json.JObject fields -> fields
    | _ -> invalid_arg "Invalid MyGo performance sample" in
  let number field =
    match Js.Json.decodeNumber (List.assoc field fields) with
    | Some value when Float.is_finite value && value >= 0. -> value
    | _ -> invalid_arg ("Invalid MyGo metric: " ^ field) in
  let build_ms = match List.assoc "host_build_ms" fields with
    | Js.Json.JNull -> None
    | _ -> Some (number "host_build_ms") in
  current := { !current with host = Some { build_ms;
    heap_bytes = number "go_heap_bytes";
    runtime_bytes = number "go_runtime_bytes";
    gc_cycles = number "go_gc_cycles" } };
  if !current.panel_open then publish ()

let panel () : t = fun context parent ->
  let state = Signal.state context.Lui_ui.ui_scheduler !current in
  let notify value = Signal.set state value in
  observer := Some notify;
  Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
    match !observer with
    | Some active when active == notify -> observer := None
    | _ -> ());
  let metric key value = text ~key ~font_size:"0.75rem" ~value [] in
  box ~key:"metrics-root" ~display:`contents [ reactive (fun sample ->
    if not sample.panel_open then box ~key:"metrics-closed" ~display:`contents []
    else column ~key:"metrics-panel" ~width:320 ~min_width:320 ~padding:12 ~gap:8
      ~accessibility_identifier:"native-performance-panel"
      ~background:"var(--ls-secondary-background-color)"
      [ text ~key:"title" ~value:(I18n.t "profiler.native/metrics-dialog-label") []
      ; metric "scope" "(Dev) MyGo / OCaml — no presentation telemetry"
      ; metric "ocaml-heap" (Printf.sprintf "(Dev) OCaml heap: %.2f MiB"
          (float_of_int sample.heap_words *. float_of_int (Sys.word_size / 8) /. 1048576.))
      ; metric "ocaml-gc" (Printf.sprintf "(Dev) OCaml GC: minor %d / major %d"
          sample.minor_collections sample.major_collections)
      ; (match sample.host with
         | None -> metric "host-pending" "(Dev) MyGo sample pending"
         | Some host -> column ~key:"host" ~gap:8
             [ metric "build" (match host.build_ms with
                 | None -> "(Dev) Host build: unavailable"
                 | Some ms -> Printf.sprintf "(Dev) Host build: %.2f ms (excludes layout/paint/present)" ms)
             ; metric "go-heap" (Printf.sprintf "(Dev) Go heap: %.2f MiB" (host.heap_bytes /. 1048576.))
             ; metric "go-runtime" (Printf.sprintf "(Dev) Go runtime total: %.2f MiB" (host.runtime_bytes /. 1048576.))
             ; metric "go-gc" (Printf.sprintf "(Dev) Go GC cycles: %.0f" host.gc_cycles) ]) ])
    (Signal.value state) ] context parent
