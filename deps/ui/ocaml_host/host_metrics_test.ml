let check message condition = if not condition then failwith message
let () =
  let deadline = Host_metrics.next_deadline ~previous:1. ~now:1.001 in
  check "Scheduler accumulates sleep overshoot every frame"
    (abs_float (deadline -. (1. +. 1. /. 120.)) < 0.000001);
  check "Scheduler queues obsolete frames after a long reflow"
    (Host_metrics.next_deadline ~previous:1. ~now:1.1 >= 1.1);
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
  Host_metrics.note_key active "Enter";
  Host_metrics.note_key active "a";
  Host_metrics.note_text active "中abc";
  check "Input counters must retain every key and text commit"
    (active.key_downs = 2 && active.enter_downs = 1
     && active.text_commits = 1 && active.text_bytes = 6);
  print_endline "native metrics: OK"
