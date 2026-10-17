let check message condition = if not condition then failwith message
let contains text fragment =
  let rec search index =
    index + String.length fragment <= String.length text
    && (String.sub text index (String.length fragment) = fragment || search (index + 1))
  in
  search 0

let () =
  let metrics = Host_metrics.create ~now:0. in
  check "An unobserved display rate must not be reported as zero FPS"
    (contains (Host_metrics.snapshot metrics ~now:2.) "\"fps\":null");
  for frame = 1 to 120 do
    Host_metrics.record_present metrics ~now:(float frame /. 120.) ~work_ms:2.
  done;
  check "Rendering work cannot establish a display rate"
    (contains (Host_metrics.snapshot metrics ~now:2.) "\"fps\":null");
  Host_metrics.record_display_count metrics ~now:0.5 ~presented:30;
  check "An incomplete display interval must remain unmeasured"
    (contains (Host_metrics.snapshot metrics ~now:0.5) "\"fps\":null");
  Host_metrics.record_display_count metrics ~now:1. ~presented:60;
  check "Observed display frames must establish the measured rate"
    (contains (Host_metrics.snapshot metrics ~now:1.) "\"fps\":60.00,");
  Host_metrics.record_display_count metrics ~now:2. ~presented:60;
  check "A measured interval without new frames must report zero FPS"
    (contains (Host_metrics.snapshot metrics ~now:2.) "\"fps\":0.00,");
  print_endline "native measured and unavailable display rates: OK"

let () =
  List.iter (fun renderer_fails ->
    let metrics = Host_metrics.create ~now:0. and clock = ref 0. in
    let result = Bytes.of_string "rendered frame" in
    let failed = try
      let rendered = Host_metrics.render_overlay metrics ~now:(fun () -> !clock)
        ~prepare:(fun () -> clock := !clock +. 0.002)
        (fun () ->
          clock := !clock +. 0.075;
          if renderer_fails then failwith "renderer failure";
          result) in
      check "Overlay measurement changed the rendered result" (rendered == result);
      false
    with Failure message when message = "renderer failure" -> true in
    check "Overlay measurement hid a renderer failure" (failed = renderer_fails);
    let sample = Host_metrics.phase_summary metrics Overlay in
    check "Overlay timing includes downstream rasterization or surface submission"
      (sample.count = 1 && abs_float (sample.mean -. 2.) < 0.00001)) [false;true];
  let metrics = Host_metrics.create ~now:0. and clock = ref 0. in
  let rendered = ref false in
  let failed = try
    Host_metrics.render_overlay metrics ~now:(fun () -> !clock)
      ~prepare:(fun () -> clock := 0.003; failwith "overlay failure")
      (fun () -> rendered := true);
    false
  with Failure message when message = "overlay failure" -> true in
  check "A failed overlay still submitted a frame" (failed && not !rendered);
  check "A failed overlay lost its measured work"
    (abs_float ((Host_metrics.phase_summary metrics Overlay).mean -. 3.) < 0.00001);
  print_endline "native exclusive overlay timing: OK"

let () =
  let metrics = Host_metrics.create ~now:0. in
  metrics.panel_open <- true;
  let last_render = ref 0. and refreshes = ref 0 and generations = ref 0 in
  let previous = ref (Host_metrics.panel_generation ~now:0.) in
  for tick = 1 to 1200 do
    let now = float tick /. Host_metrics.target_fps in
    if Host_metrics.panel_due metrics ~now ~last_render:!last_render then begin
      incr refreshes;
      last_render := now
    end;
    let generation = Host_metrics.panel_generation ~now in
    if generation <> !previous then begin incr generations; previous := generation end
  done;
  Printf.printf "Quiet panel over 10 seconds: %d refreshes, %d samples\n%!"
    !refreshes !generations;
  check "Diagnostic repaint runs more often than its one-second sampling interval"
    (!refreshes = 10 && !generations = 10);
  check "Panel sampling skips the next deadline"
    (Host_metrics.panel_due metrics ~now:11. ~last_render:10.);
  check "Panel sampling redraws before the next deadline"
    (not (Host_metrics.panel_due metrics ~now:10.999 ~last_render:10.));
  check "Panel sampling queues missed diagnostic frames"
    (Host_metrics.panel_due metrics ~now:50. ~last_render:2.
     && not (Host_metrics.panel_due metrics ~now:50. ~last_render:50.));
  metrics.panel_open <- false;
  check "A closed panel schedules diagnostic redraws"
    (not (Host_metrics.panel_due metrics ~now:100. ~last_render:0.))
let () =
  let deadline = Host_metrics.next_deadline ~previous:1. ~now:1.001 in
  check "Scheduler accumulates sleep overshoot every frame"
    (abs_float (deadline -. (1. +. 1. /. 120.)) < 0.000001);
  check "Scheduler queues obsolete frames after a long reflow"
    (Host_metrics.next_deadline ~previous:1. ~now:1.1 >= 1.1);
  check "Quiet native loops must wait for an event independent of repaint count"
    (Host_metrics.idle_timeout ~dirty:false ~now:10. ~last_busy:0. = Some 1000);
  check "Recent activity must keep mailbox chains responsive"
    (Host_metrics.idle_timeout ~dirty:false ~now:1. ~last_busy:0. = None);
  check "A dirty frame must not wait for an event"
    (Host_metrics.idle_timeout ~dirty:true ~now:10. ~last_busy:0. = None);
  let metrics = Host_metrics.create ~now:0. in
  for frame = 1 to 120 do
    Host_metrics.record_present metrics ~now:(float frame /. 120.) ~work_ms:2.;
    Host_metrics.record_display_count metrics ~now:(float frame /. 120.) ~presented:(frame / 2)
  done;
  check "FPS counts render attempts instead of displayed frames"
    (match metrics.fps with Some fps -> abs_float (fps -. 60.) < 0.1 | None -> false);
  check "Frame work percentile is incorrect" (Host_metrics.percentile metrics 0.95 = 2.);
  Host_metrics.record_present metrics ~now:1.1 ~work_ms:20.;
  check "An over-budget frame was not counted" (metrics.missed = 1);
  for frame = 1 to 300 do
    Host_metrics.record_present metrics ~now:(1.1 +. float frame /. 120.) ~work_ms:3.
  done;
  check "Sample history grows without bound" (metrics.count = 240);
  check "Old outliers never leave the live window" (Host_metrics.percentile metrics 0.95 = 3.);
  let before = Gc.allocated_bytes () in
  for sample=1 to 100 do
    Host_metrics.record_present metrics ~now:(float sample) ~work_ms:(float (sample mod 7));
    ignore (Host_metrics.percentile metrics 0.5);
    ignore (Host_metrics.percentile metrics 0.95)
  done;
  let percentile_bytes = (Gc.allocated_bytes () -. before) /. 100. in
  Printf.printf "native work percentiles allocated %.0f bytes/update\n%!" percentile_bytes;
  check "Metrics work percentiles allocate boxed float sorting intermediates"
    (percentile_bytes <= 8192.);
  Host_metrics.toggle_panel metrics;
  check "Metrics split buffer did not open" metrics.panel_open;
  Host_metrics.toggle_panel metrics;
  check "Metrics split buffer did not close" (not metrics.panel_open);
  let active = Host_metrics.create ~now:0. in
  Host_metrics.record_phase active Active_frame 50.;
  for index = 1 to 100 do
    Host_metrics.record_present active ~now:(float index) ~work_ms:0.5
  done;
  let summary = Host_metrics.phase_summary active Active_frame in
  check "Idle frames diluted interaction p95" (summary.p95 = 50. && summary.count = 1);
  Host_metrics.record_phase active Layout 25.;
  check "Phase timings contaminated one another"
    ((Host_metrics.phase_summary active Active_frame).mean = 50.);
  for _ = 1 to 300 do Host_metrics.record_phase active Layout 2. done;
  let layout = Host_metrics.phase_summary active Layout in
  check "Phase history is unbounded or retains old outliers"
    (layout.count = 240 && layout.maximum = 2. && layout.mean = 2.);
  check "Phase export must retain lifetime work after the timing ring wraps"
    (contains (Host_metrics.snapshot active ~now:2.)
      "\"layout\":{\"count\":240,\"total\":301,\"total_ms\":625.0,");
  check "An unmeasured phase must export zero lifetime work"
    (contains (Host_metrics.snapshot active ~now:2.)
      "\"gpu_execute\":{\"count\":0,\"total\":0,\"total_ms\":0.0,");
  check "Unsampled phase reports fictitious work"
    ((Host_metrics.phase_summary active Gpu_execute).count = 0);
  Host_metrics.record_presentation_samples active ~total:3 [|10.; 20.; 30.|];
  check "Actual presentation intervals were not collected"
    ((Host_metrics.phase_summary active Presentation_interval).count = 3);
  Host_metrics.record_presentation_samples active ~total:3 [|10.; 20.; 30.|];
  check "Polling duplicated presented intervals"
    ((Host_metrics.phase_summary active Presentation_interval).count = 3);
  Host_metrics.record_presentation_samples active ~total:5 [|30.; 40.; 50.|];
  check "New presentation suffix was lost or duplicated"
    ((Host_metrics.phase_summary active Presentation_interval).count = 5 &&
     (Host_metrics.phase_summary active Presentation_interval).mean = 30.);
  Host_metrics.record_presentation_samples active ~total:400 (Array.make 240 12.);
  check "Overrun presentation ring retained stale frames"
    ((Host_metrics.phase_summary active Presentation_interval).count = 240 &&
     (Host_metrics.phase_summary active Presentation_interval).mean = 12.);
  ignore (Host_metrics.phase_summary active Presentation_interval);
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _ = 1 to 100 do ignore (Host_metrics.phase_summary active Presentation_interval) done;
  check "Idle metrics repeatedly sort unchanged frame histories"
    ((Gc.quick_stat ()).Gc.minor_words -. before < 10000.);
  Host_metrics.record_phase active Presentation_interval 100.;
  check "Cached metrics hide a newly recorded maximum"
    ((Host_metrics.phase_summary active Presentation_interval).maximum = 100.);
  ignore (Host_metrics.snapshot active ~now:10.);
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _ = 1 to 100 do ignore (Host_metrics.snapshot active ~now:10.) done;
  check "Idle export reformats unchanged phase histories"
    ((Gc.quick_stat ()).Gc.minor_words -. before < 250000.);
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _ = 1 to 100 do
    Host_metrics.record_phase active Presentation_interval 12.;
    ignore (Host_metrics.phase_summary active Presentation_interval)
  done;

  check "Live metrics sorting exceeds its allocation budget"
    ((Gc.quick_stat ()).Gc.minor_words -. before < 625000.);
  let exported = Host_metrics.create ~now:0. in
  for _ = 1 to 240 do
    List.iter (fun phase -> Host_metrics.record_phase exported phase 1.25)
      [Host_metrics.Loop_interval; Host_metrics.Requests; Host_metrics.Presentation_interval]
  done;
  let before = Gc.allocated_bytes () in
  for tick = 1 to 100 do
    List.iter (fun phase -> Host_metrics.record_phase exported phase 1.25)
      [Host_metrics.Loop_interval; Host_metrics.Requests; Host_metrics.Presentation_interval];
    ignore (Host_metrics.snapshot exported ~now:(float tick))
  done;
  let allocated = Gc.allocated_bytes () -. before in
  check (Printf.sprintf "Live metrics exports allocate %.0f bytes per snapshot" (allocated /. 100.))
    (allocated < 16000000.);
  let rolling = Host_metrics.create ~now:0. in
  for sample = 1 to 240 do
    Host_metrics.record_phase rolling Events (float sample +. 0.125)
  done;
  ignore (Host_metrics.snapshot rolling ~now:0.);
  for sample = 241 to 245 do
    Host_metrics.record_phase rolling Events (float sample +. 0.125)
  done;
  let expected = List.init 240 (fun index -> Printf.sprintf "%.3f" (float (index + 6) +. 0.125)) in
  check "Live export must retain chronological samples after its ring wraps"
    (contains (Host_metrics.snapshot rolling ~now:1.)
       ("\"samples_ms\":[" ^ String.concat "," expected ^ "]"));
  let before = Gc.allocated_bytes () in
  for tick = 1 to 30 do
    for sample = 1 to 120 do
      List.iter (fun phase -> Host_metrics.record_phase exported phase (float sample /. 8.))
        [Host_metrics.Loop_interval; Host_metrics.Requests]
    done;
    ignore (Host_metrics.snapshot exported ~now:(float tick))
  done;
  let allocated = (Gc.allocated_bytes () -. before) /. 30. in
  check (Printf.sprintf "120 Hz live export allocates %.0f bytes per snapshot" allocated)
    (allocated < 120000.);
  let sampled = Host_metrics.create ~now:0. in
  let allocation_field = "\"host_allocated_bytes\":" in
  let allocated_from_snapshot text =
    let field = List.find (String.starts_with ~prefix:allocation_field)
      (String.split_on_char ',' text) in
    float_of_string (String.sub field (String.length allocation_field)
      (String.length field - String.length allocation_field))
  in
  Gc.minor ();
  let collections = (Gc.quick_stat ()).minor_collections in
  let before = allocated_from_snapshot (Host_metrics.snapshot sampled ~now:0.) in
  let allocation = Sys.opaque_identity (List.init 2000 Fun.id) in
  let after = allocated_from_snapshot (Host_metrics.snapshot sampled ~now:1.) in
  ignore (Sys.opaque_identity allocation);
  check "The allocation observation must not require a GC"
    ((Gc.quick_stat ()).minor_collections = collections);
  check "Live allocation counters must include allocations made since the last GC"
    (after -. before >= 48000.);
  let memory_snapshot = Host_metrics.snapshot sampled ~now:2. in
  check "Unavailable process memory is not marked in the recording"
    (contains memory_snapshot "\"process_memory\":null");
  check "Memory metrics must distinguish heap capacity from cumulative allocation"
    (contains memory_snapshot "\"heap_bytes\":" && contains memory_snapshot "\"live_bytes\":"
     && contains memory_snapshot "\"top_heap_bytes\":");
  let full = Host_metrics.create ~now:0. in
  full.process_memory <- Some {footprint_bytes=40_000_000; peak_footprint_bytes=50_000_000;
    rss_bytes=120_000_000; window_visible=false; width=1440; height=900;
    pixel_width=2880; pixel_height=1800};
  let process_snapshot = Host_metrics.snapshot full ~now:0. in
  check "Process memory recording drops physical memory or window visibility"
    (contains process_snapshot "\"footprint_bytes\":40000000"
     && contains process_snapshot "\"peak_footprint_bytes\":50000000"
     && contains process_snapshot "\"rss_bytes\":120000000"
     && contains process_snapshot "\"window_visible\":false"
     && contains process_snapshot "\"pixel_width\":2880");
  for sample = 1 to 240 do
    List.iter (fun (phase, _) -> Host_metrics.record_phase full phase (float sample /. 1234567.))
      Host_metrics.phases
  done;
  ignore (Host_metrics.snapshot full ~now:0.);
  let before = Gc.allocated_bytes () in
  for tick = 1 to 30 do
    List.iter (fun (phase, _) -> Host_metrics.record_phase full phase (float tick /. 1234567.))
      Host_metrics.phases;
    for sample = 1 to 120 do
      List.iter (fun phase -> Host_metrics.record_phase full phase (float sample /. 1234567.))
        [Host_metrics.Loop_interval; Host_metrics.Requests]
    done;
    ignore (Host_metrics.snapshot full ~now:(float tick))
  done;
  let allocated = (Gc.allocated_bytes () -. before) /. 30. in
  check (Printf.sprintf "Full live histories allocate %.0f bytes per snapshot" allocated)
    (allocated < 160000.);
  let streaming = Host_metrics.create ~now:0. in
  for sample=1 to 240 do
    List.iter (fun (phase,_) ->
      Host_metrics.record_phase streaming phase (float sample /. 1234567.)) Host_metrics.phases
  done;
  let expected = Host_metrics.snapshot streaming ~now:0. in
  let phase_suffix value =
    let marker = ",\"phases\":" in
    let rec find index =
      if index + String.length marker > String.length value then
        failwith "Metrics export lost its phase histories"
      else if String.sub value index (String.length marker) = marker then index
      else find (index+1) in
    let index = find 0 in
    String.sub value index (String.length value-index) in
  let path = Filename.temp_file "native-metrics-" ".jsonl" in
  Fun.protect ~finally:(fun () -> Sys.remove path) (fun () ->
    let allocated = Out_channel.with_open_bin path (fun channel ->
      Host_metrics.write_snapshot channel streaming ~now:0.; output_char channel '\n';
      let before = Gc.allocated_bytes () in
      for tick=1 to 30 do
        Host_metrics.record_phase streaming Loop_interval (float tick);
        Host_metrics.write_snapshot channel streaming ~now:(float tick);
        output_char channel '\n'
      done;
      (Gc.allocated_bytes () -. before) /. 30.) in
    let lines = In_channel.with_open_bin path In_channel.input_lines in
    check "Streaming metrics lost or joined recording boundaries" (List.length lines=31);
    check "Streaming metrics changed complete timing histories"
      (phase_suffix (List.hd lines) = phase_suffix expected);
    check "Streaming metrics exported a stale timestamp"
      (contains (List.hd (List.rev lines)) "\"time_s\":30.000");
    Printf.printf "streaming full metrics histories allocated %.0f bytes/export\n%!" allocated;
    check "Metrics export copies the complete serialized history on every tick"
      (allocated < 8192.));
  let rolling = Host_metrics.create ~now:0. in
  let expected = ref [] in
  for sample = 1 to 300 do
    let value = float ((sample * 37) mod 29) /. 4. in
    Host_metrics.record_phase rolling Events value;
    expected := value :: !expected;
    let window = List.filteri (fun index _ -> index < 240) !expected in
    let sorted = List.sort Float.compare window in
    let count = List.length sorted in
    let at fraction = List.nth sorted (min (count - 1) (int_of_float (fraction *. float count))) in
    let summary = Host_metrics.phase_summary rolling Events in
    check "Rolling summaries must preserve quantiles for partial, tied, and wrapped histories"
      (summary.count = count && summary.p50 = at 0.5 && summary.p95 = at 0.95
       && summary.maximum = List.nth sorted (count - 1)
       && abs_float (summary.mean -. List.fold_left (+.) 0. window /. float count) < 0.000000001)
  done;
  Host_metrics.note_key active "Enter";
  Host_metrics.note_key active "a";
  Host_metrics.note_text active "中abc";
  check "Input counters must retain every key and text commit"
    (active.key_downs = 2 && active.enter_downs = 1
     && active.text_commits = 1 && active.text_bytes = 6);
  print_endline "native metrics: OK"


let () =
  let metrics = Host_metrics.create ~now:0. in
  Host_metrics.toggle_panel metrics;
  let samples = ref 0 in
  let build () = incr samples; [Printf.sprintf "Sample %d" !samples; String.make 512 'x'] in
  let first = Host_metrics.sample_panel metrics ~generation:10 build in
  let before = Gc.allocated_bytes () in
  for _=1 to 1000 do ignore (Host_metrics.sample_panel metrics ~generation:10 build) done;
  let allocated = (Gc.allocated_bytes () -. before) /. 1000. in
  Printf.printf "native metrics sampled values allocated %.0f bytes/read\n%!" allocated;
  check "Painting an unchanged metrics sample rebuilt formatted values" (!samples=1);
  check "An unchanged panel sample lost its identity"
    (Host_metrics.sample_panel metrics ~generation:10 build == first);
  check "Reading sampled metrics allocates new formatted strings" (allocated <= 128.);
  ignore (Host_metrics.sample_panel metrics ~generation:11 build);
  check "A new sampling interval retained stale values" (!samples=2);
  metrics.fps <- Some 120.;
  ignore (Host_metrics.sample_panel metrics ~generation:11 build);
  check "A new FPS reading retained stale panel values" (!samples=3);
  Host_metrics.toggle_panel metrics;
  let rejected = try ignore (Host_metrics.sample_panel metrics ~generation:11 build); false
    with Invalid_argument _ -> true in
  check "Sampling a closed panel did not reject its caller" rejected;
  Host_metrics.toggle_panel metrics;
  ignore (Host_metrics.sample_panel metrics ~generation:11 build);
  check "Reopening a panel in the same interval reused a closed sample" (!samples=4);
  let failed = try ignore (Host_metrics.sample_panel metrics ~generation:12 (fun () ->
    failwith "sample failure")); false with Failure _ -> true in
  check "A sample-builder exception was hidden" failed;
  ignore (Host_metrics.sample_panel metrics ~generation:12 build);
  check "A failed sample was cached instead of retried" (!samples=5);
  let previous = Weak.create 1 in
  let remember () =
    let value = Host_metrics.sample_panel metrics ~generation:13 build in
    Weak.set previous 0 (Some value) in
  remember ();
  ignore (Host_metrics.sample_panel metrics ~generation:14 build);
  Gc.full_major ();
  check "Panel sampling retained a superseded value list" (Weak.get previous 0=None);
  print_endline "native metrics sampling lifetime: OK"
