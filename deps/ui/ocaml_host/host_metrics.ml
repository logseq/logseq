type phase = Events | Mailbox | Patch_apply | Requests | Layout | Scene_build
  | Overlay | Gpu_submit | Gpu_execute | Geometry | Accessibility
  | Active_frame | Loop_interval | Input_latency | Presentation_interval

let phases = [Events, "events"; Mailbox, "mailbox"; Patch_apply, "patch_apply";
  Requests, "requests"; Layout, "layout"; Scene_build, "scene_build";
  Overlay, "overlay"; Gpu_submit, "gpu_submit"; Gpu_execute, "gpu_execute";
  Geometry, "geometry_viewport"; Accessibility, "accessibility";
  Active_frame, "active_frame"; Loop_interval, "loop_interval"; Input_latency, "input_latency";
  Presentation_interval, "presentation_interval"]

type summary = { count : int; p50 : float; p95 : float; maximum : float; mean : float }
type phase_samples = { values : float array; formatted : string option array;
  indices : int array; scratch : int array;
  mutable used : int; mutable next : int; mutable total : int; mutable sum : float;
  mutable total_ms : float;
  mutable summary : summary option; mutable serialized_header : string option }

type process_memory = { footprint_bytes : int; peak_footprint_bytes : int;
  rss_bytes : int; window_visible : bool; width : int; height : int;
  pixel_width : int; pixel_height : int }

type t = {
  mutable process_memory : process_memory option;
  mutable raster_background_domains : int;
  mutable key_downs : int;
  mutable enter_downs : int;
  mutable text_commits : int;
  mutable text_bytes : int;
  mutable presentation_seen : int;
  mutable gpu_submitted : int;
  mutable gpu_busy_skips : int;
  phases : (phase * phase_samples) list;
  export_buffer : Buffer.t;
  samples : float array;
  work_samples : phase_samples;
  mutable work_sorted : bool;
  mutable count : int;
  mutable cursor : int;
  mutable presented : int;
  mutable started : float;
  mutable fps : float;
  mutable frame_ms : float;
  mutable paint_ms : float;
  mutable layout_ms : float;
  mutable render_ms : float;
  mutable gpu_submit_ms : float;
  mutable populate_ms : float;
  mutable event_ms : float;
  mutable input_latency_ms : float;
  mutable missed : int;
  mutable panel_open : bool;
  mutable panel_sample : (int * float * string list) option;
  mutable input_at : float option;
  mutable layout_count : int;
  mutable patch_ops : int;
  mutable event_count : int;
  mutable pump_ms : float;

}
let target_fps = 120.
let frame_budget_ms = 1000. /. target_fps
let next_deadline ~previous ~now = max now (previous +. 1. /. target_fps)
let idle_timeout ~dirty ~now ~last_busy =
  if not dirty && now -. last_busy >= 2. then Some 1000 else None
let sample_history () =
  {values=Array.make 240 0.; formatted=Array.make 240 None;
   indices=Array.make 240 0; scratch=Array.make 240 0;
   used=0; next=0; total=0; sum=0.; total_ms=0.; summary=None; serialized_header=None}
let create ~now =
  let work_samples = sample_history () in
  {process_memory=None; raster_background_domains=0; export_buffer=Buffer.create 4096; key_downs=0; enter_downs=0; text_commits=0; text_bytes=0;
  presentation_seen=0; gpu_submitted=0; gpu_busy_skips=0; phases=List.map (fun (phase, _) -> phase,
  sample_history ()) phases; samples=work_samples.values; work_samples; work_sorted=false; count=0; cursor=0;
  presented=0; started=now; fps=0.; frame_ms=0.; paint_ms=0.; layout_ms=0.;
  render_ms=0.; gpu_submit_ms=0.; populate_ms=0.; event_ms=0.; input_latency_ms=0.; missed=0;
  panel_open=false; panel_sample=None; input_at=None; layout_count=0; patch_ops=0; event_count=0; pump_ms=0.}
let note_key t key =
  t.key_downs <- t.key_downs + 1;
  if key = "Enter" then t.enter_downs <- t.enter_downs + 1
let note_text t text =
  t.text_commits <- t.text_commits + 1;
  t.text_bytes <- t.text_bytes + String.length text
let record_phase t phase ms =
  if not (Float.is_finite ms) || ms < 0. then invalid_arg "Invalid phase timing";
  let history = List.assoc phase t.phases in
  let replaced = if history.used = Array.length history.values then history.values.(history.next) else 0. in
  history.sum <- history.sum -. replaced +. ms;
  history.values.(history.next) <- ms;
  history.formatted.(history.next) <- None;
  history.next <- (history.next + 1) mod Array.length history.values;
  history.used <- min (history.used + 1) (Array.length history.values);
  history.total <- history.total + 1;
  history.total_ms <- history.total_ms +. ms;
  history.summary <- None;
  history.serialized_header <- None

let record_presentation_samples t ~total values =
  if total < t.presentation_seen then invalid_arg "Presentation counter moved backwards";
  let fresh = min (total - t.presentation_seen) (Array.length values) in
  for index = Array.length values - fresh to Array.length values - 1 do
    record_phase t Presentation_interval values.(index)
  done;
  t.presentation_seen <- total

let sort_indices history =
  (* Merge integer indices in reusable storage to avoid boxed samples and sort scratch allocation. *)
  let count = history.used in
  for index = 0 to count - 1 do history.indices.(index) <- index done;
  let source = ref history.indices and target = ref history.scratch in
  let width = ref 1 in
  while !width < count do
    let start = ref 0 in
    while !start < count do
      let middle = min count (!start + !width) in
      let finish = min count (middle + !width) in
      let left = ref !start and right = ref middle in
      for output = !start to finish - 1 do
        if !right >= finish
           || (!left < middle && history.values.((!source).(!left)) <= history.values.((!source).(!right)))
        then begin
          (!target).(output) <- (!source).(!left);
          incr left
        end else begin
          (!target).(output) <- (!source).(!right);
          incr right
        end
      done;
      start := finish
    done;
    let previous = !source in
    source := !target;
    target := previous;
    width := !width * 2
  done;
  if !source != history.indices then Array.blit !source 0 history.indices 0 count

let phase_summary t phase =
  let history = List.assoc phase t.phases in
  match history.summary with
  | Some summary -> summary
  | None ->
  let count = history.used in
  let summary = if count = 0 then {count; p50=0.; p95=0.; maximum=0.; mean=0.}
  else begin
    sort_indices history;
    let indices = history.indices in
    let at fraction = history.values.(indices.(min (count - 1) (int_of_float (fraction *. float count)))) in
    {count; p50=at 0.5; p95=at 0.95; maximum=history.values.(indices.(count - 1));
     mean=history.sum /. float count}
  end in
  history.summary <- Some summary;
  summary

let json_float value =
  let text = Float.to_string value in
  if text.[String.length text - 1] = '.' then text ^ "0" else text

let snapshot_buffer t ~now =
  let gc = Gc.quick_stat () in
  let buffer = t.export_buffer in
  Buffer.clear buffer;
  Printf.bprintf buffer "{\"time_s\":%.3f,\"fps\":%.2f,\"target_fps\":%.0f,\"layout_count\":%d,\"event_count\":%d,\"gpu_submitted\":%d,\"gpu_busy_skips\":%d,\"key_downs\":%d,\"enter_downs\":%d,\"text_commits\":%d,\"text_bytes\":%d,\"gc\":{\"allocated_bytes\":%.0f,\"host_allocated_bytes\":%.0f,\"minor_collections\":%d,\"major_collections\":%d,\"heap_bytes\":%d,\"live_bytes\":%d,\"top_heap_bytes\":%d}"
    now t.fps target_fps t.layout_count t.event_count t.gpu_submitted t.gpu_busy_skips t.key_downs t.enter_downs t.text_commits t.text_bytes
    ((gc.minor_words +. gc.major_words -. gc.promoted_words) *. float (Sys.word_size / 8))
    (Gc.allocated_bytes ())
    gc.minor_collections gc.major_collections
    (gc.heap_words * (Sys.word_size / 8)) (gc.live_words * (Sys.word_size / 8)) (gc.top_heap_words * (Sys.word_size / 8));
  Printf.bprintf buffer ",\"minor_allocated_bytes\":%.0f,\"promoted_bytes\":%.0f,\"minor_heap_bytes_per_domain\":%d"
    (gc.minor_words *. float (Sys.word_size / 8))
    (gc.promoted_words *. float (Sys.word_size / 8))
    ((Gc.get ()).minor_heap_size * (Sys.word_size / 8));
  Printf.bprintf buffer ",\"raster_background_domains\":%d" t.raster_background_domains;
  (match t.process_memory with
   | None -> Buffer.add_string buffer ",\"process_memory\":null"
   | Some memory ->
       Printf.bprintf buffer ",\"process_memory\":{\"footprint_bytes\":%d,\"peak_footprint_bytes\":%d,\"rss_bytes\":%d,\"window_visible\":%b,\"width\":%d,\"height\":%d,\"pixel_width\":%d,\"pixel_height\":%d}"
         memory.footprint_bytes memory.peak_footprint_bytes memory.rss_bytes
         memory.window_visible memory.width memory.height memory.pixel_width memory.pixel_height);
  Buffer.add_string buffer ",\"phases\":{";
  List.iteri (fun phase_index (phase, name) ->
    if phase_index > 0 then Buffer.add_char buffer ',';
    let history = List.assoc phase t.phases in
    let header = match history.serialized_header with
      | Some header -> header
      | None ->
        let summary = phase_summary t phase in
        let prefix = Buffer.create 256 in
        Printf.bprintf prefix "\"%s\":{\"count\":%d,\"total\":%d,\"total_ms\":"
          name summary.count history.total;
        Buffer.add_string prefix (json_float history.total_ms);
        Buffer.add_string prefix ",\"p50_ms\":";
        Buffer.add_string prefix (json_float summary.p50);
        Buffer.add_string prefix ",\"p95_ms\":";
        Buffer.add_string prefix (json_float summary.p95);
        Buffer.add_string prefix ",\"max_ms\":";
        Buffer.add_string prefix (json_float summary.maximum);
        Buffer.add_string prefix ",\"mean_ms\":";
        Buffer.add_string prefix (json_float summary.mean);
        Buffer.add_string prefix ",\"samples_ms\":[";
        let header = Buffer.contents prefix in
        history.serialized_header <- Some header;
        header
    in
    Buffer.add_string buffer header;
    let length = Array.length history.values in
    let oldest = (history.next - history.used + length) mod length in
    for index = 0 to history.used - 1 do
      if index > 0 then Buffer.add_char buffer ',';
      let slot = (oldest + index) mod length in
      let sample = match history.formatted.(slot) with
        | Some sample -> sample
        | None ->
          let sample = json_float history.values.(slot) in
          history.formatted.(slot) <- Some sample;
          sample
      in
      Buffer.add_string buffer sample
    done;
    Buffer.add_string buffer "]}") phases;
  Buffer.add_string buffer "}}";
  buffer

let snapshot t ~now = Buffer.contents (snapshot_buffer t ~now)
let write_snapshot channel t ~now = Buffer.output_buffer channel (snapshot_buffer t ~now)

let record_present t ~now ~work_ms =
  (match t.input_at with
   | None -> ()
   | Some at -> t.input_latency_ms <- (now -. at) *. 1000.;
     record_phase t Input_latency t.input_latency_ms; t.input_at <- None);
  t.samples.(t.cursor) <- work_ms;
  t.cursor <- (t.cursor + 1) mod Array.length t.samples;
  t.count <- min (t.count + 1) (Array.length t.samples);
  t.work_sorted <- false;
  t.frame_ms <- work_ms;
  if work_ms > frame_budget_ms then t.missed <- t.missed + 1
let percentile t fraction =
  if t.count = 0 then 0.
  else begin
    if not t.work_sorted then begin
      t.work_samples.used <- t.count;
      sort_indices t.work_samples;
      t.work_sorted <- true
    end;
    t.samples.(t.work_samples.indices.(min (t.count - 1)
      (int_of_float (fraction *. float t.count))))
  end
let sample_panel t ~generation build =
  if not t.panel_open then invalid_arg "Cannot sample a closed metrics panel";
  match t.panel_sample with
  | Some (previous,fps,values) when previous=generation && fps=t.fps -> values
  | _ ->
      let values = build () in
      t.panel_sample <- Some (generation,t.fps,values);
      values

let toggle_panel t =
  t.panel_sample <- None;
  t.panel_open <- not t.panel_open

let panel_width t width = if t.panel_open then min 440. (width *. 0.35) else 0.
let content_width t width = width -. panel_width t width
let dialog_rect t width =
  let available = content_width t width in
  Lui_scene.rect (max 280. (available *. 0.5)) 7. 80. 32.
let contains (r : Lui_scene.rect) x y =
  x >= r.x && x < r.x +. r.w && y >= r.y && y < r.y +. r.h

let record_display_count t ~now ~presented =
  let elapsed = now -. t.started in
  if elapsed >= 1. then begin
    t.fps <- float (presented - t.presented) /. elapsed;
    t.presented <- presented;
    t.started <- now
  end
