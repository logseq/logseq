let check message condition = if not condition then failwith message
let contains text fragment =
  let rec search index =
    index + String.length fragment <= String.length text
    && (String.sub text index (String.length fragment) = fragment || search (index + 1))
  in
  search 0
let () =
  let deadline = Host_metrics.next_deadline ~previous:1. ~now:1.001 in
  check "Scheduler accumulates sleep overshoot every frame"
    (abs_float (deadline -. (1. +. 1. /. 120.)) < 0.000001);
  check "Scheduler queues obsolete frames after a long reflow"
    (Host_metrics.next_deadline ~previous:1. ~now:1.1 >= 1.1);
  check "Quiet native loops must wait for an event independent of repaint count"
    (Host_metrics.idle_timeout ~dirty:false ~now:10. ~last_busy:0. = Some 16);
  check "Recent activity must keep mailbox chains responsive"
    (Host_metrics.idle_timeout ~dirty:false ~now:1. ~last_busy:0. = None);
  check "A dirty frame must not wait for an event"
    (Host_metrics.idle_timeout ~dirty:true ~now:10. ~last_busy:0. = None);
  let metrics = Host_metrics.create ~now:0. in
  for frame = 1 to 120 do
    Host_metrics.record_present metrics ~now:(float frame /. 120.) ~work_ms:2.;
    Host_metrics.record_display_count metrics ~now:(float frame /. 120.) ~presented:(frame / 2)
  done;
  check "FPS counts render attempts instead of displayed frames" (abs_float (metrics.fps -. 60.) < 0.1);
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
