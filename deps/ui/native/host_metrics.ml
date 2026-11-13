open Lui_elements

type sample = {
  panel_open : bool;
  heap_words : int;
  minor_collections : int;
  major_collections : int;
}

let current = ref { panel_open = false; heap_words = 0;
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
      ; metric "scope" "(Dev) OCaml — no presentation telemetry"
      ; metric "ocaml-heap" (Printf.sprintf "(Dev) OCaml heap: %.2f MiB"
          (float_of_int sample.heap_words *. float_of_int (Sys.word_size / 8) /. 1048576.))
      ; metric "ocaml-gc" (Printf.sprintf "(Dev) OCaml GC: minor %d / major %d"
          sample.minor_collections sample.major_collections) ])
    (Signal.value state) ] context parent
