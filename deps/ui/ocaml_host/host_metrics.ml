type phase = Events | Mailbox | Patch_apply | Requests | Layout | Scene_build
  | Overlay | Gpu_submit | Gpu_execute | Geometry | Accessibility
  | Active_frame | Loop_interval | Input_latency | Presentation_interval

let phases = [Events, "events"; Mailbox, "mailbox"; Patch_apply, "patch_apply";
  Requests, "requests"; Layout, "layout"; Scene_build, "scene_build";
  Overlay, "overlay"; Gpu_submit, "gpu_submit"; Gpu_execute, "gpu_execute";
  Geometry, "geometry_viewport"; Accessibility, "accessibility";
  Active_frame, "active_frame"; Loop_interval, "loop_interval"; Input_latency, "input_latency";
  Presentation_interval, "presentation_interval"]

type phase_samples = { values : float array; mutable used : int; mutable next : int; mutable total : int }
type summary = { count : int; p50 : float; p95 : float; maximum : float; mean : float }

type t = {
  mutable key_downs : int;
  mutable enter_downs : int;
  mutable text_commits : int;
  mutable text_bytes : int;
  mutable presentation_seen : int;
  mutable gpu_submitted : int;
  mutable gpu_busy_skips : int;
  phases : (phase * phase_samples) list;
  samples : float array;
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
  mutable input_at : float option;
  mutable layout_count : int;
  mutable patch_ops : int;
  mutable event_count : int;
  mutable pump_ms : float;

}
let target_fps = 120.
let frame_budget_ms = 1000. /. target_fps
let next_deadline ~previous ~now = max now (previous +. 1. /. target_fps)
let create ~now = {key_downs=0; enter_downs=0; text_commits=0; text_bytes=0;
  presentation_seen=0; gpu_submitted=0; gpu_busy_skips=0; phases=List.map (fun (phase, _) -> phase,
  {values=Array.make 240 0.; used=0; next=0; total=0}) phases; samples=Array.make 240 0.; count=0; cursor=0;
  presented=0; started=now; fps=0.; frame_ms=0.; paint_ms=0.; layout_ms=0.;
  render_ms=0.; gpu_submit_ms=0.; populate_ms=0.; event_ms=0.; input_latency_ms=0.; missed=0;
  panel_open=false; input_at=None; layout_count=0; patch_ops=0; event_count=0; pump_ms=0.}
let note_key t key =
  t.key_downs <- t.key_downs + 1;
  if key = "Enter" then t.enter_downs <- t.enter_downs + 1
let note_text t text =
  t.text_commits <- t.text_commits + 1;
  t.text_bytes <- t.text_bytes + String.length text
let record_phase t phase ms =
  if not (Float.is_finite ms) || ms < 0. then invalid_arg "Invalid phase timing";
  let history = List.assoc phase t.phases in
  history.values.(history.next) <- ms;
  history.next <- (history.next + 1) mod Array.length history.values;
  history.used <- min (history.used + 1) (Array.length history.values);
  history.total <- history.total + 1

let record_presentation_samples t ~total values =
  if total < t.presentation_seen then invalid_arg "Presentation counter moved backwards";
  let fresh = min (total - t.presentation_seen) (Array.length values) in
  for index = Array.length values - fresh to Array.length values - 1 do
    record_phase t Presentation_interval values.(index)
  done;
  t.presentation_seen <- total

let chronological_samples history =
  let oldest = (history.next - history.used + Array.length history.values) mod Array.length history.values in
  Array.init history.used (fun index -> history.values.((oldest + index) mod Array.length history.values))

let phase_summary t phase =
  let history = List.assoc phase t.phases in
  let count = history.used in
  if count = 0 then {count; p50=0.; p95=0.; maximum=0.; mean=0.}
  else
    let values = Array.sub history.values 0 count in
    Array.sort Float.compare values;
    let at fraction = values.(min (count - 1) (int_of_float (fraction *. float count))) in
    {count; p50=at 0.5; p95=at 0.95; maximum=values.(count - 1);
     mean=Array.fold_left (+.) 0. values /. float count}

let snapshot t ~now =
  let rows = List.map (fun (phase, name) ->
    let s = phase_summary t phase in
    let history = List.assoc phase t.phases in
    let samples = chronological_samples history |> Array.to_list |> List.map (Printf.sprintf "%.3f") in
    Printf.sprintf "\"%s\":{\"count\":%d,\"total\":%d,\"p50_ms\":%.3f,\"p95_ms\":%.3f,\"max_ms\":%.3f,\"mean_ms\":%.3f,\"samples_ms\":[%s]}"
      name s.count history.total s.p50 s.p95 s.maximum s.mean (String.concat "," samples)) phases in
  Printf.sprintf "{\"time_s\":%.3f,\"fps\":%.2f,\"target_fps\":%.0f,\"layout_count\":%d,\"event_count\":%d,\"gpu_submitted\":%d,\"gpu_busy_skips\":%d,\"key_downs\":%d,\"enter_downs\":%d,\"text_commits\":%d,\"text_bytes\":%d,\"phases\":{%s}}"
    now t.fps target_fps t.layout_count t.event_count t.gpu_submitted t.gpu_busy_skips t.key_downs t.enter_downs t.text_commits t.text_bytes (String.concat "," rows)

let record_present t ~now ~work_ms =
  (match t.input_at with
   | None -> ()
   | Some at -> t.input_latency_ms <- (now -. at) *. 1000.;
     record_phase t Input_latency t.input_latency_ms; t.input_at <- None);
  t.samples.(t.cursor) <- work_ms;
  t.cursor <- (t.cursor + 1) mod Array.length t.samples;
  t.count <- min (t.count + 1) (Array.length t.samples);
  t.frame_ms <- work_ms;
  if work_ms > frame_budget_ms then t.missed <- t.missed + 1
let percentile t fraction =
  if t.count = 0 then 0.
  else
    let samples = Array.sub t.samples 0 t.count in
    Array.sort Float.compare samples;
    samples.(min (t.count - 1) (int_of_float (fraction *. float t.count)))
let toggle_panel t = t.panel_open <- not t.panel_open

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
