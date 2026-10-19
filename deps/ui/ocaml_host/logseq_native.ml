(* OCaml native host for the Logseq UI. One OCaml process: the logseq_ui_* app library runs
   inside this binary (native_embed.ml's entries, no caml_startup, no
   patch-callback FFI); the SDL window loop feeds input through
   Lui_window.Ui and returns rendered frames through Lui_host.

   Patch flow: Native_embed entries return typed batches applied directly
   to Lui_host. Cross-language hosts encode JSON at their callback boundary;
   the in-process SDL host shares the original immutable protocol values.

   Outbound flow: Host.enqueue's wakeup lands in Bridge (flag → pump
   next frame) and platform_request envelopes land in Host_requests
   (drained per frame into lui_shell services + the dom-op surface). *)

open Lui_window

module Sdl = Tsdl.Sdl
module Lui_shell = Host_platform.Shell

(* ocaml_host_stubs.c: NSApplication activation for a bare-binary
   launch — see its comment. *)
external native_activate : unit -> unit = "logseq_native_activate"

(* ocaml_host_stubs.c: fullSizeContentView + transparent titlebar so
   cp__header renders where the title bar sits. *)
external native_titlebar_blend : unit -> unit
  = "logseq_native_titlebar_blend"

(* ocaml_host_stubs.c: registers every .ttf/.otf/.ttc in a directory
   with CoreText so named families (Inter, bundled under assets/fonts)
   resolve in Lui_text.create. *)
external native_register_fonts : string -> unit
  = "logseq_native_register_fonts"

external native_menu_theme : bool -> unit = "logseq_native_menu_theme"

(* ocaml_host_stubs.c: installs the real NSMenu main menu. Every item
   carries a command tag forwarded to the "ocaml_host_menu_command"
   named value registered below. *)
external native_install_menus : unit -> unit
  = "logseq_native_install_menus"

(* ocaml_host_stubs.c: AppKit verbs the menu dispatch bounces back
   out — about/hide/hide-others/show-all on NSApp, miniaturize/zoom/
   close/fullscreen on the key window. *)
external native_app_op : int -> unit = "logseq_native_app_op"

let log fmt = Printf.printf (fmt ^^ "\n%!")
let warn fmt = Printf.eprintf (fmt ^^ "\n%!")

let sdl_ok = function
  | Ok v -> v
  | Error (`Msg m) -> failwith ("SDL: " ^ m)

(* Bundle launches have no reachable stderr; mirror diagnostics into a
   file too. *)
let log_oc = ref None
let filelog fmt =
  match !log_oc with
  | None -> Printf.ifprintf stdout fmt
  | Some oc -> Printf.fprintf oc (fmt ^^ "\n%!")

let debug = ref false
let dump = ref false
let dump_tree_flag = Atomic.make false
let dbg fmt =
  if !debug then begin
    Printf.eprintf fmt;
    filelog fmt
  end
  else Printf.ifprintf stderr fmt

let perf_s = Native_window.performance_time

let mods_of_keymod = Native_window.mods_of_keymod


let () =
  (* Keep desktop heap slack small while collecting incrementally. *)
  Gc.set { (Gc.get ()) with space_overhead = 30 };
  let allocation_profile = ref None in
  let allocation_done = ref false in
  let allocation_census = ref None in
  let allocation_samples = Hashtbl.create 32 in
  let allocation_mutex = Mutex.create () in
  let allocation_live = Sys.getenv_opt "LOGSEQ_NATIVE_ALLOC_LIVE" = Some "1" in
  let allocation_path = Sys.getenv_opt "LOGSEQ_NATIVE_ALLOC_PROFILE" in
  let census_path = match Sys.getenv_opt "LOGSEQ_NATIVE_HEAP_CENSUS", allocation_path with
    | Some _, Some _ ->
      invalid_arg "Configure either native heap census or allocation profiling"
    | Some path, None -> Some path
    | None, Some path -> Some (path ^ ".roots.json")
    | None, None -> None in
  let census_done = ref false in
  let forced_major_collections = ref 0 in
  let write_census () =
    match census_path, !allocation_census with
    | Some path, Some census when not !census_done ->
      census_done := true;
      Yojson.Safe.to_file path (census ())
    | _ -> () in
  let allocation_trigger = Sys.getenv_opt "LOGSEQ_NATIVE_ALLOC_TRIGGER" in
  let allocation_delay = match Sys.getenv_opt "LOGSEQ_NATIVE_ALLOC_DELAY" with
    | None -> 20. | Some value -> float_of_string value in
  let allocation_duration = match Sys.getenv_opt "LOGSEQ_NATIVE_ALLOC_DURATION" with
    | None -> 10. | Some value -> float_of_string value in
  if not (Float.is_finite allocation_delay) || allocation_delay < 0.
     || not (Float.is_finite allocation_duration) || allocation_duration <= 0.
  then invalid_arg "Invalid native allocation profiling interval";
  let capture_started = ref 0. in
  let sample_allocation (sample : Gc.Memprof.allocation) =
    let stack = Printexc.raw_backtrace_to_string sample.callstack in
    Mutex.protect allocation_mutex (fun () ->
    let counts = match Hashtbl.find_opt allocation_samples stack with
      | Some counts -> counts
      | None -> let counts = ref 0,ref 0 in
        Hashtbl.add allocation_samples stack counts; counts in
    let allocated,_ = counts in
    allocated := !allocated + sample.n_samples;
    if allocation_live then Some (counts,sample.n_samples) else None)
  in
  let deallocate ((_,released),samples) =
    Mutex.protect allocation_mutex (fun () -> released := !released + samples) in
  let finish_allocation () =
    match allocation_path,!allocation_profile with
    | Some path,Some profile when not !allocation_done ->
      allocation_done := true;
      if allocation_live then begin
        Gc.full_major (); Gc.full_major ();
        forced_major_collections := 2
      end;
      Gc.Memprof.stop ();
      Gc.Memprof.discard profile;
      allocation_profile := None;
      let rows = Mutex.protect allocation_mutex (fun () ->
        let rows = Hashtbl.fold (fun stack (count,released) acc ->
          (!count,!count - !released,stack)::acc) allocation_samples [] in
        Hashtbl.reset allocation_samples;
        rows) in
      Out_channel.with_open_text path (fun channel ->
        List.iter (fun (count,live,stack) ->
          Printf.fprintf channel "Estimated %.0f bytes; alive %.0f bytes\n%s\n"
            (float count *. 80000.) (float live *. 80000.) stack)
          (List.sort (fun (a,al,_) (b,bl,_) ->
            if allocation_live then compare bl al else compare b a) rows));
      write_census ()
    | _ -> () in
  let start_allocation now =
    capture_started := now;
    allocation_profile := Some (Gc.Memprof.start ~sampling_rate:0.0001 ~callstack_size:12
      {Gc.Memprof.alloc_minor=sample_allocation; alloc_major=sample_allocation;
       promote=(fun allocation -> Some allocation);
       dealloc_minor=deallocate; dealloc_major=deallocate}) in
  (* A newly spawned domain inherits its parent's active profile. Starting
     only in the main loop misses application bootstrap and its domain. *)
  (match allocation_path,allocation_trigger with
   | Some _,None when allocation_delay = 0. -> start_allocation (perf_s ())
   | _ -> ());
  let finish_diagnostics () = finish_allocation (); write_census () in
  at_exit finish_diagnostics;
  Daemon_client.boot_mark "main enter";
  debug := (try Sys.getenv "LOGSEQ_NATIVE_DEBUG" <> "" with _ -> false);
  dump := (try Sys.getenv "LOGSEQ_NATIVE_DUMP" <> "" with _ -> false);
  (* AppKit popups are macOS-only. Linux uses the same LUI overlay
     menus as the other non-AppKit hosts. *)
  (match Host_platform.is_macos, Sys.getenv_opt "LOGSEQ_NATIVE_MENUS" with
   | true, None -> Unix.putenv "LOGSEQ_NATIVE_MENUS" "1"
   | false, Some value when value <> "0" ->
     failwith "LOGSEQ_NATIVE_MENUS is only supported on macOS"
   | false, _ -> Unix.putenv "LOGSEQ_NATIVE_MENUS" "0"
   | true, Some _ -> ());
  (try
     if Sys.getenv "LOGSEQ_NATIVE_TREEDUMP" <> "" then
       Sys.set_signal Sys.sigusr1
         (Sys.Signal_handle (fun _ -> Atomic.set dump_tree_flag true))
   with _ -> ());
  if !debug then begin
    match open_out_gen [Open_creat; Open_append] 0o644
            "/tmp/logseq_native_host.log" with
    | oc -> log_oc := Some oc
    | exception _ -> ()
  end;
  let width =
    try int_of_string (Sys.getenv "LOGSEQ_WIDTH") with _ -> 1440
  and height =
    try int_of_string (Sys.getenv "LOGSEQ_HEIGHT") with _ -> 900
  in
  let env = match Sys.getenv_opt "LUI_GPU" with
    | Some value -> value
    | None -> if Host_platform.is_macos then "cocoa" else "" in
  let use_cocoa = env = "cocoa" in
  if use_cocoa && not Host_platform.is_macos then
    failwith "The CoreGraphics renderer requires macOS";
  let memory_replay_duration = Option.map float_of_string
    (Sys.getenv_opt "LOGSEQ_NATIVE_MEMORY_REPLAY") in
  (match memory_replay_duration with
   | Some duration when not (Float.is_finite duration) || duration <= 0. ->
     invalid_arg "Memory replay requires a positive finite duration"
   | _ -> ());
  let memory_replay = Option.is_some memory_replay_duration in
  let replay_mode = Host_interaction.memory_replay_mode ~enabled:memory_replay
    (Sys.getenv_opt "LOGSEQ_NATIVE_MEMORY_REPLAY_MODE") in
  let continuous_replay = replay_mode=Host_interaction.Replay_continuous in
  if memory_replay then Printf.eprintf "native memory replay policy=%s\n%!"
    (if continuous_replay then "continuous" else "changes");
  let raster_workers = match Sys.getenv_opt "LOGSEQ_NATIVE_RASTER_WORKERS" with
    | None -> 4
    | Some value -> int_of_string value in
  if raster_workers < 1 || raster_workers > 8 then
    invalid_arg "Native raster rendering requires between one and eight workers";
  let use_cpu = env = "0" || env = "cpu" in
  let software_window = use_cpu && not Host_platform.is_macos in
  let prefer_metal =
    Host_platform.is_macos && not use_cpu && not use_cocoa && env <> "gl" && env <> "opengl"
  in
  (* The embedded app's bootstrap (~70ms) is pure OCaml work — it
     touches no SDL/Metal state. Run it on a spare domain while this
     thread does window + renderer setup; joined below right before
     the init patches are applied. *)
  let init_d =
    Domain.spawn
      (fun () -> Native_embed.initialize Host_platform.platform_code 0 "")
  in
  sdl_ok (Sdl.init Sdl.Init.(video + events));
  Daemon_client.boot_mark "sdl init";
  sdl_ok (Sdl.gl_set_attribute Sdl.Gl.context_major_version 3);
  sdl_ok (Sdl.gl_set_attribute Sdl.Gl.context_minor_version 3);
  sdl_ok
    (Sdl.gl_set_attribute Sdl.Gl.context_profile_mask
       Sdl.Gl.context_profile_core);
  sdl_ok (Sdl.gl_set_attribute Sdl.Gl.doublebuffer 1);
  let flags gl =
    let base = Sdl.Window.(resizable + allow_highdpi + shown) in
    if gl then Sdl.Window.(base + opengl) else base
  in
  let win =
    ref
      (sdl_ok
         (Sdl.create_window "logseq" ~w:width ~h:height
            (flags (not prefer_metal && not software_window && not use_cocoa))))
  in
  Daemon_client.boot_mark "window created";
  let metal =
    if prefer_metal then
      match Lui_metal.init_window (Sdl.unsafe_ptr_of_window !win) with
      | Ok m -> Some m
      | Error _ ->
        (* Metal needs no GL context; if init failed the window was
           still created without one — retry as GL below. *)
        Sdl.destroy_window !win;
        win :=
          sdl_ok
            (Sdl.create_window "logseq" ~w:width ~h:height (flags true));
        None
    else None
  in
  Daemon_client.boot_mark "window+gpu ctx";
  let gctx =
    if Option.is_some metal || software_window || use_cocoa then None
    else match Sdl.gl_create_context !win with
    | Ok c ->
      sdl_ok (Sdl.gl_make_current !win c);
      Some c
    | Error (`Msg m) -> warn "gl context: %s" m; None
  in
  let vsync =
    match gctx with
    | None -> false
    | Some _ -> (
        match Sdl.gl_set_swap_interval 1 with
        | Ok () -> true
        | Error _ -> false)
  in
  (* A bare-binary launch does not go through LaunchServices, so the
     process can stay behind whatever app was frontmost and the window
     server never routes clicks to it. raise_window re-keys the window;
     a one-shot focus request in the frame loop covers the case where a
     foreign app was still coming to the front while we created it. *)
  Sdl.raise_window !win;
  native_activate ();
  native_titlebar_blend ();
  (* Bundle the Inter family before the first Lui_text.create — the
     app emits font-family:"Inter" (web parity) and the named lookup
     falls back to the system font when the family is unregistered.
     Candidates mirror daemon_bin's: bundled Resources, the in-tree
     dune layout, and a repo-root CWD launch. *)
  let font_dirs =
    let exe_dir = Filename.dirname Sys.executable_name in
    [ Filename.concat exe_dir "../Resources/fonts"
    ; Filename.concat exe_dir "../../../assets/fonts"
    ; Filename.concat (Sys.getcwd ()) "deps/ui/assets/fonts" ]
  in
  List.iter
    (fun d -> if Sys.file_exists d then native_register_fonts d)
    font_dirs;
  if Host_platform.is_macos then native_install_menus ();
  let drawable () =
    if software_window then Sdl.get_window_size !win
    else Sdl.gl_get_drawable_size !win
  in
  let dw, dh = drawable () in
  let scale = Float.max 0.01 (float dw /. float width) in
  let unavailable_renderer message =
    if Host_platform.is_macos then failwith message
    else failwith
        (message ^ "; verify the graphics driver or select LUI_GPU=cpu")
  in
  let cpu_renderer b =
    let rr = Lui_raster.Renderer.create () in
    { Lui_host.name = "lui_raster+blit";
      Lui_host.render =
        (fun s ->
           let dirty = Lui_raster.Renderer.render rr s in
           let img = Lui_raster.Renderer.image rr in
           let stride = img.Lui_raster.Image.stride / 4 in
           if Lui_raster.Renderer.whole rr || dirty = [] then
             ignore
               (Lui_blit.update b ~pix:img.Lui_raster.Image.pix ~stride)
           else
             List.iter
               (fun (r : Lui_scene.irect) ->
                  ignore
                    (Lui_blit.update_region b ~x0:r.x0 ~y0:r.y0
                       ~x1:r.x1 ~y1:r.y1 ~pix:img.Lui_raster.Image.pix
                       ~stride))
               dirty;
           Lui_blit.present b;
           img.Lui_raster.Image.pix) }
  in
  let cocoa_tiles = if use_cocoa then Some (Lui_raster.Tile_renderer.create ()) else None in
  let raster_background_domains () = match cocoa_tiles with
    | Some tiles -> Lui_raster.Tile_renderer.background_domains tiles
    | None -> 0 in
  let metrics = Host_metrics.create ~now:(perf_s ()) in
  let cocoa_renderer tiles =
    let id = Sdl.get_window_id !win in
    { Lui_host.name = "lui_raster+iosurface";
      Lui_host.render = (fun scene ->
        let started = perf_s () in
        let upload_seconds = ref 0. in
        Native_window.software_begin id (scene.Lui_scene.width,scene.height,
          Lui_raster.Tile_renderer.band_height);
        Lui_raster.Tile_renderer.render ~workers:raster_workers tiles scene ~emit:(fun area image ->
          let before_upload = perf_s () in
          Native_window.software_tile id (area.Lui_scene.y0,area.y1-area.y0,
            image.Lui_raster.Image.stride,image.pix);
          upload_seconds := !upload_seconds +. (perf_s () -. before_upload));
        let raster_done = perf_s () in
        Native_window.software_present id;
        let presented = perf_s () in
        Host_metrics.record_phase metrics Raster ((raster_done -. started -. !upload_seconds) *. 1000.);
        Host_metrics.record_phase metrics Surface_upload (!upload_seconds *. 1000.);
        Host_metrics.record_phase metrics Surface_present ((presented -. raster_done) *. 1000.);
        Bytes.empty) } in
  metrics.panel_open <- Sys.getenv_opt "LOGSEQ_NATIVE_METRICS_PANEL" = Some "1";
  let presentation = Host_interaction.presentation () in
  let renderer, gl_live, blit =
    match metal with
    | Some m ->
      log "renderer: lui_metal";
      Lui_metal.set_frame_rate m 120;
      ( { Lui_host.name = "lui_metal";
          Lui_host.render =
            (fun s ->
               let submitted = Host_interaction.present presentation
                 ~ready:(Lui_metal.ready m) ~submit:(fun s ->
                 let completed_ms = Lui_metal.gpu_ms m in
                 if completed_ms > 0. then Host_metrics.record_phase metrics Gpu_execute completed_ms;
                 let started = perf_s () in
                 Lui_metal.render m s;
                 metrics.gpu_submit_ms <- (perf_s () -. started) *. 1000.;
                 Host_metrics.record_phase metrics Gpu_submit metrics.gpu_submit_ms;
                 metrics.gpu_submitted <- metrics.gpu_submitted + 1;
                 Lui_metal.present_async m) s in
               if not submitted then metrics.gpu_busy_skips <- metrics.gpu_busy_skips + 1;
               Bytes.empty) }
      , false, None )
    | None -> (
        if use_cocoa then
          (cocoa_renderer (Option.get cocoa_tiles),false,None)
        else if use_cpu then
          match Lui_blit.create !win ~w:dw ~h:dh with
          | Error m ->
            unavailable_renderer ("lui_blit.create failed: " ^ m)
          | Ok b -> (cpu_renderer b, false, Some b)
        else
          match gctx with
          | None ->
            unavailable_renderer "No OpenGL context"
          | Some _ -> (
              match Lui_gl.init () with
              | Ok gl ->
                log "renderer: Lui_gl";
                ( { Lui_host.name = "lui_gl";
                    Lui_host.render =
                      (fun s ->
                         Lui_gl.render gl s;
                         Bytes.empty) }
                , true, None )
              | Error m ->
                unavailable_renderer ("lui_gl.init failed: " ^ m)))
  in
  Daemon_client.boot_mark "renderer ready";
  let paint_metrics = ref (fun (_ : Lui_scene.t) -> []) in
  let renderer_cell = ref renderer and gl_live_cell = ref gl_live in
  let blit_cell = ref blit and gctx_cell = ref gctx in
  let cached_overlay = ref None in
  let overlay_viewport = ref (fun () -> (0, 0, 1.)) in
  let overlay_generation () =
    if metrics.panel_open then Host_metrics.panel_generation ~now:(perf_s ()) else 0 in
  let renderer_live =
    { Lui_host.name = "lui";
      Lui_host.render =
        (fun s ->
           let retained_ops = s.Lui_scene.ops and retained_glyphs = s.Lui_scene.glyphs in
           let retained_width = s.Lui_scene.width in
           let render_started = perf_s () in
           Fun.protect ~finally:(fun () ->
             s.Lui_scene.ops <- retained_ops;
             s.Lui_scene.glyphs <- retained_glyphs;
             s.Lui_scene.width <- retained_width;
             metrics.render_ms <- (perf_s () -. render_started) *. 1000.)
             (fun () ->
                Host_metrics.render_overlay metrics ~now:perf_s
                  ~prepare:(fun () ->
                    let color =
                      Option.get (Theme_vars.color_of
                        "var(--ls-caret-color, var(--ls-primary-text-color, foreground))")
                    in
                    let caret = Host_requests.editor_caret_ops ~color in
                    let key =
                      (s.Lui_scene.width, s.Lui_scene.height, !overlay_viewport (),
                       metrics.panel_open, overlay_generation (),
                       !Theme_vars.generation, caret)
                    in
                    (match !cached_overlay with
                     | Some (body_ops, body_glyphs, previous, ops, glyphs, width)
                       when body_ops == retained_ops && body_glyphs == retained_glyphs
                            && previous = key ->
                         s.Lui_scene.ops <- ops;
                         s.Lui_scene.glyphs <- glyphs;
                         s.Lui_scene.width <- width
                     | _ ->
                         s.Lui_scene.glyphs <- List.rev retained_glyphs;
                         s.Lui_scene.ops <- s.Lui_scene.ops @ caret @ !paint_metrics s;
                         Host_interaction.seal_overlay s;
                         Lui_scene.touch s;
                         cached_overlay := Some
                           (retained_ops, retained_glyphs, key, s.Lui_scene.ops,
                            s.Lui_scene.glyphs, s.Lui_scene.width)))
                  (fun () -> (!renderer_cell).Lui_host.render s))) }
  in
  let host_cell = ref None in
  let rects = Rects.create () in
  let ui = Ui.create () in
  Ui.set_scale ui scale;
  let scale_cell = ref scale in
  let text_engine =
    Text_engine.create
      ~scene:(fun () -> Lui_host.scene (Option.get !host_cell))
      ~scale:(fun () -> !scale_cell)
      ~store:(fun () -> Lui_host.store (Option.get !host_cell))
  in
  let store_of () = Lui_host.store (Option.get !host_cell) in
  let engine_rect id =
    match !host_cell with
    | Some h ->
      Option.value ~default:Rects.zero (Lui_host.layout_rect h id)
    | None -> Rects.zero
  in
  let scroll_shift_of = Host_interaction.scroll_shifts ~store:store_of
    ~scroll_epoch:(fun () -> Ui.scroll_epoch ui)
    ~scroll_x:(Ui.scroll_offset_x ui) ~scroll_y:(Ui.scroll_offset ui) in
  let shifted_rect id =
    let r = engine_rect id in
    let sx, sy = scroll_shift_of id in
    { r with
      Lui_scene.x = r.Lui_scene.x -. sx;
      Lui_scene.y = r.Lui_scene.y -. sy }
  in
  let content_bounds = Hashtbl.create 16 in
  let bounds_revision = ref (-1, -1) in
  let content_box id =
    let host = Option.get !host_cell in
    let revision = Lui_store.layout_rev (store_of ()), Lui_host.invalidation_count host in
    if !bounds_revision <> revision then begin
      Hashtbl.reset content_bounds; bounds_revision := revision
    end;
    match Hashtbl.find_opt content_bounds id with
    | Some bounds -> bounds
    | None ->
    let bounds = Host_interaction.content_bounds ~store:(store_of ()) ~rect_of:engine_rect id in
    Hashtbl.replace content_bounds id bounds; bounds
  in
  let rec hooks =
    Lui_paint.
      { color_of = Theme_vars.color_of;
        hidden = (fun _ -> false);
        (* Virtual lists publish the mounted window. Every other kind
           returns None and the walk stays the full child list. *)
        mounted_children =
          (fun id ->
             match !host_cell with
             | Some h -> Lui_host.layout_mounted_children h id
             | None -> None);
        layout =
          (fun id -> Lui_paint.placement_of_rect (shifted_rect id));
        state_of =
          (fun id ->
             match !host_cell with
             | Some h -> Ui.state_of ui (Lui_host.store h) id
             | None -> Lui_paint.state_neutral);
        scroll_of =
          (fun id ->
             let cap = Ui.scroll_cap ui id in
             if cap <= 0.001 || not (Ui.scrollbar_visible ui id) then None
             else
               let cr = engine_rect id in
               let _, top, _, bot = content_box id in
               let content = Float.max (bot -. top) 0.001 in
               Some
                 Lui_paint.
                   { sm_offset = Ui.scroll_offset ui id /. cap;
                     sm_extent =
                       Float.min 1. (cr.Lui_scene.h /. content) });
        text_ops =
          (fun id r fg s ->
             let ops = Text_engine.control_text_ops text_engine ~ui
               ~color_of:Theme_vars.color_of
               id r fg s in
             let ops =
               match !host_cell with
               | None -> ops
               | Some h -> (
                 let store = Lui_host.store h in
                 match
                   Text_engine.inherited_str store id "text-decoration"
                 with
                 | None -> ops
                 | Some deco ->
                   let pad =
                     (Lui_paint.text_placement_of store id).tp_pad_left
                     *. !scale_cell
                   in
                   let mw, mh =
                     Text_engine.measure_text text_engine id s
                   in
                   let fill y =
                     Lui_scene.Fill
                       { frect =
                           Lui_scene.rect (r.Lui_scene.x +. pad) y mw 2.;
                         fradii = (0., 0., 0., 0.);
                         fcontinuous = false;
                         fcolor = fg;
                         fpaint = Lui_scene.Solid;
                         fcolor2 = fg;
                         fgradient = (0., 0., 0., 0.);
                         fborder = (0., 0., 0., 0.);
                         fborder_color = Lui_scene.color 0 0 0 0;
                         fdashed = false;
                         fwide = 0;
                         fopacity = 1. }
                   in
                   ops
                   @ (String.split_on_char ' ' deco
                     |> List.filter_map (fun tok ->
                            match String.trim tok with
                            | "underline" ->
                              Some
                                (fill
                                   (r.Lui_scene.y
                                    +. (r.Lui_scene.h +. mh) /. 2.
                                    -. 2.))
                            | "line-through" ->
                              Some
                                (fill
                                   (r.Lui_scene.y
                                    +. (r.Lui_scene.h -. mh) /. 2.
                                    +. mh *. 0.55))
                            | "overline" ->
                              Some
                                (fill
                                   (r.Lui_scene.y
                                    +. (r.Lui_scene.h -. mh) /. 2.))
                            | _ -> None)))
             in
             let marked = Ui.marked ui in
             if Text_engine.ordinary_input (store_of ()) id
                || marked = "" || id <> Ui.focused ui then ops
             else begin
               let caret =
                 min (Ui.caret ui) (String.length (Ui.shadow ui))
               in
               let ops =
                 let has_text =
                   match !host_cell with
                   | Some h -> (
                       match
                         Lui_store.prop (Lui_host.store h) id "text"
                       with
                       | Some (Lui_protocol.StringValue v) -> v <> ""
                       | _ -> false)
                   | None -> false
                 in
                 if has_text then ops else []
               in
               let dx, _ =
                 Text_engine.measure_text text_engine id
                   (String.sub (Ui.shadow ui) 0 caret)
               in
               let mw, mh =
                 Text_engine.measure_text text_engine id marked
               in
               let pad =
                 match !host_cell with
                 | Some h ->
                   (Lui_paint.text_placement_of (Lui_host.store h) id)
                     .tp_pad_left
                   *. !scale_cell
                 | None -> 0.
               in
               let underline =
                 Lui_scene.Fill
                   { frect =
                       Lui_scene.rect
                         (r.Lui_scene.x +. pad +. dx)
                         (r.Lui_scene.y
                          +. (r.Lui_scene.h +. mh) /. 2. -. 2.)
                         mw 2.;
                     fradii = (0., 0., 0., 0.); fcontinuous = false;
                     fcolor = fg; fpaint = Lui_scene.Solid; fcolor2 = fg;
                     fgradient = (0., 0., 0., 0.);
                     fborder = (0., 0., 0., 0.);
                     fborder_color = Lui_scene.color 0 0 0 0;
                     fdashed = false; fwide = 0; fopacity = 1. }
               in
               let mr = { r with Lui_scene.x = r.Lui_scene.x +. dx } in
               ops @ [ underline ]
                 @ Text_engine.text_ops text_engine id mr fg marked
             end);
        image_of =
          (fun id ->
             match !host_cell with
             | Some h ->
               let r = engine_rect id in
               let r =
                 match Lui_store.string_prop (Lui_host.store h) id "icon"
                 with
                 | Some _ ->
                   (* icon-prop slots (button, menu-item…) paint the
                      whole image inside an <=18px slot — rasterizing at
                      the host node's rect stretches the glyph *)
                   let slot =
                     Float.min 18.
                       (Float.min r.Lui_scene.w r.Lui_scene.h)
                   in
                   { r with Lui_scene.w = slot; Lui_scene.h = slot }
                 | None -> r
               in
               Host_icons.image_of ~hooks (Lui_host.store h) !scale_cell id r
             | None -> None);
        image_in =
          (fun id r ->
             match !host_cell with
             | Some h ->
               Host_icons.image_of ~hooks (Lui_host.store h) !scale_cell id r
             | None -> None);
        shadow_of =
          (fun name ->
            (* shadow strings carry raw css vars like --kbd-glow-*;
               the theme-var table resolves them, the token palette
               can't. A spec that is itself a var(--x, fallback) must
               resolve to its spec string before parsing — the
               per-token color resolver can't unwrap the whole layer. *)
            let name =
              match Theme_vars.resolve_value name with
              | Some s -> s
              | None -> name
            in
            Lui_theme.shadow_of
              ~resolve:(fun _mode s -> Theme_vars.color_of s)
              !Theme_vars.mode name) }
  in
  (* logseq-em-emoji is a leaf extension element whose glyph travels in
     its "text" prop (mirrored in the attrs data-emoji for web parity):
     paint it through the text engine so font-size/foreground inherit
     like any label. *)
  Lui_paint.register_extension ~identifier:"logseq-em-emoji"
    { Lui_paint.paint =
        (fun ctx store node r ->
           let id = Lui_store.node_id node in
           match Lui_store.string_prop store id "text" with
           | Some s when s <> "" ->
             let fg = Lui_paint.text_fg ctx store id in
             ctx.Lui_paint.hooks.Lui_paint.text_ops id r fg s
           | _ -> []) };
  let measure_memo : (int * string * float * float, (float * float) option) Hashtbl.t =
    Hashtbl.create 256
  in
  let measure_rev = ref (-1, -1) in
  let layout_capture_path = Sys.getenv_opt "LOGSEQ_NATIVE_LAYOUT_CAPTURE" in
  let layout_trace = Option.map open_out_bin (Sys.getenv_opt "LOGSEQ_NATIVE_LAYOUT_TRACE") in
  let module Timed_layout = struct
    include Lui_layout
    let sync ?scale ?measure ?hidden ?ctx_anchor ?vport ?anchor_shift ~width ~height t store =
      Option.iter (fun channel ->
        let hidden_ids = List.filter
          (fun id -> match hidden with Some predicate -> predicate id | None -> false)
          (Lui_store.preorder store) in
        Marshal.to_channel channel
          (store,width,height,Option.value scale ~default:1.,hidden_ids,ctx_anchor) [];
        flush channel) layout_trace;
      let started = perf_s () and before = stat_syncs t in
      sync ?scale ?measure ?hidden ?ctx_anchor ?vport ?anchor_shift ~width ~height t store;
      metrics.layout_ms <- (perf_s () -. started) *. 1000.;
      let runs = stat_syncs t - before in
      (match layout_capture_path with
       | Some path when runs > 0 && metrics.layout_ms >= 50. ->
         let hidden_ids = List.filter
           (fun id -> match hidden with Some predicate -> predicate id | None -> false)
           (Lui_store.preorder store) in
         Out_channel.with_open_bin path (fun channel -> Marshal.to_channel channel
           (store, width, height, Option.value scale ~default:1., hidden_ids, ctx_anchor) []);
         Printf.eprintf "layout capture: nodes=%d elapsed_ms=%.3f\n%!"
           (Lui_store.node_count store) metrics.layout_ms
       | _ -> ());
      if runs > 0 then Host_metrics.record_phase metrics Layout metrics.layout_ms;
      metrics.layout_count <- metrics.layout_count + runs
  end in
  let host =
    Lui_host.create ~hooks ~layout:(module Timed_layout)
      ~measure:(fun id text w _h ->
        (* Memoized per store revision: nested inline flex rows (a
           linked-reference block's "see [[Alpha]]" runs) re-measure
           the same leaf at the same offered width tens of thousands
           of times per layout pass — ~2.5s frames that held linked
           references on "Loading...". Text shaping is pure in
           (node font, text, width) and node fonts only move with a
           store revision or a layout invalidation. *)
        let store' = text_engine.store () in
        (* a font that finished loading pokes invalidate_layout under
           an unchanged store — that must drop the memo too *)
        let rev =
          ( Lui_store.revision store'
          , match !host_cell with
            | Some h -> Lui_host.invalidation_count h
            | None -> 0 )
        in
        if rev <> !measure_rev then begin
          Hashtbl.reset measure_memo;
          measure_rev := rev
        end;
        let scale_now = text_engine.scale () in
        let w = Host_interaction.measure_width w in
        let key = (id, text, w, scale_now) in
        match Hashtbl.find_opt measure_memo key with
        | Some r -> r
        | None ->
          let mw, mh = Text_engine.measure_text ~width:w text_engine id text in
          let r = Some (Text_engine.pad_size store' id ~scale:scale_now (mw,mh)) in
          Hashtbl.replace measure_memo key r;
          r)
      ~renderer:renderer_live ~width:dw ~height:dh ~scale ()
  in
  host_cell := Some host;
  let store = Lui_host.store host in
  Lui_host.set_anchor_shift host (Ui.anchor_shift ui store);
  Daemon_client.boot_mark "host ready";
  List.iter (fun property ->
    Lui_store.set_extension_prop_mask store ~identifier:"logseq-editor" ~property
      (Lui_store.d_input lor Lui_store.d_paint))
    ["caret"; "composition"; "runs"; "block-id"];

  Lui_host.set_hidden host (Some (fun id -> Ui.hidden ui store id));
  Lui_host.set_ctx_anchor host
    (Some (fun () ->
       Host_interaction.context_anchor store (Ui.open_menu ui) (Ui.pointer ui)));
  let win_w = ref width and win_h = ref height in
  overlay_viewport := (fun () -> (!win_w, !win_h, !scale_cell));
  (* Content-space visible range for virtual-list nodes. Rects are
     published after this callback on the sync that creates the list,
     so a missing rect means "first screen", not "lay out every row". *)
  let vport_of id =
    if Lui_store.kind store id <> "virtual-list" then None
    else
      let er = engine_rect id in
      let sx, sy = scroll_shift_of id in
      let shifted =
        { er with
          Lui_scene.x = er.Lui_scene.x -. sx;
          Lui_scene.y = er.Lui_scene.y -. sy }
      in
      let vw = float !win_w *. !scale_cell in
      let vh = float !win_h *. !scale_cell in
      let frame = Lui_scene.rect 0. 0. vw vh in
      if er.Lui_scene.h < 1. || er.Lui_scene.w < 1. then
        Some (0., vh *. 0.62)
      else
        let clip = Lui_scene.rect_intersect shifted frame in
        Some
          ( Ui.scroll_offset ui id
            +. Float.max 0. (clip.Lui_scene.y -. shifted.Lui_scene.y)
          , Float.max 1. clip.Lui_scene.h )
  in
  Lui_host.set_vport host vport_of;
  let apply_patches ?event batches =
    if batches <> [] then begin
      let started = perf_s () in
      List.iter
        (fun b ->
           metrics.patch_ops <- metrics.patch_ops + List.length b.Lui_protocol.ops;
           ignore (match event with
             | Some event -> Host_interaction.apply_event_batch host event b
             | None -> Lui_host.apply_batch host b))
        batches;
      (* a set-input-focus request may have queued waiting on a sink
         that this batch just mounted *)
      Host_requests.flush_pending_focus ();
      Host_metrics.record_phase metrics Patch_apply ((perf_s () -. started) *. 1000.)
    end
  in
  let content_width () =
    Host_metrics.content_width metrics (float !win_w)
  in
  let resize_metrics_split () =
    Lui_host.resize host ~width:(int_of_float (content_width () *. !scale_cell))
      ~height:(int_of_float (float !win_h *. !scale_cell)) ~scale:!scale_cell;
    Native_embed.platform_event
      (Printf.sprintf "window-size\n{\"width\":%d,\"height\":%d}"
         (int_of_float (content_width ())) !win_h)
  in
  let published_performance = ref None in
  let publish_native_performance () =
    let sample = metrics.fps, metrics.panel_open in
    if !published_performance <> Some sample then begin
      published_performance := Some sample;
      Native_embed.platform_event
        (Printf.sprintf "native-performance\n{\"fps\":%s,\"panel_open\":%b}"
           (match metrics.fps with None -> "null" | Some fps -> Printf.sprintf "%.17g" fps)
           metrics.panel_open)
    end
  in
  let toggle_native_performance () =
    Host_metrics.toggle_panel metrics;
    resize_metrics_split ();
    publish_native_performance ()
  in
  if metrics.panel_open then resize_metrics_split ();
  (* Diagnostic samples have a separate bounded layout cache. Each
     label retains only its latest fragment, including stable glyphs
     when another label changes length or the scene body changes. *)
  let metrics_text_engine = {text_engine with Text_engine.layouts=Host_platform.Text.Cache.create 32} in
  let metrics_labels = Hashtbl.create 24 in
  let draw_metrics (scene : Lui_scene.t) =
    let sc = !scale_cell in
    scene.width <- int_of_float (float !win_w *. sc);
    if not metrics.panel_open then [] else
    let fg = Option.get (Theme_vars.color_of "foreground") in
    let bg = Option.get (Theme_vars.color_of "background") in
    let accent = Option.get (Theme_vars.color_of "accent") in
    let box x y w h color =
      Lui_scene.Fill
        { frect = Lui_scene.rect (x *. sc) (y *. sc) (w *. sc) (h *. sc);
          fradii=(0.,0.,0.,0.); fcontinuous=false; fcolor=color;
          fpaint=Lui_scene.Solid; fcolor2=color; fgradient=(0.,0.,0.,0.);
          fborder=(0.,0.,0.,0.); fborder_color=Lui_scene.color 0 0 0 0;
          fdashed=false; fwide=0; fopacity=1. }
    in
    let label slot x y w value =
      let cache = match Hashtbl.find_opt metrics_labels slot with
        | Some cache -> cache
        | None -> let cache = Host_interaction.overlay_cache () in
          Hashtbl.add metrics_labels slot cache; cache in
      let rect = Lui_scene.rect (x *. sc) (y *. sc) (w *. sc) (28. *. sc) in
      let key = rect,fg,value,sc,!Theme_vars.generation in
      Host_interaction.overlay_cached cache ~key scene (fun () ->
        Text_engine.text_ops metrics_text_engine 0 rect fg value)
    in
      let x = content_width () in
      let width = float !win_w -. x in
      let lines = Host_metrics.sample_panel metrics ~generation:(overlay_generation ()) (fun () ->
        let gc = Gc.quick_stat () in
        [ "Native performance (Dev)"
        ; Printf.sprintf "FPS: %s / %.0f"
            (match metrics.fps with None -> "unavailable" | Some fps -> Printf.sprintf "%.1f" fps)
            Host_metrics.target_fps
        ; Printf.sprintf "Frame budget: %.2f ms" Host_metrics.frame_budget_ms
        ; (let presented = Host_metrics.phase_summary metrics Presentation_interval in
           if presented.count = 0 then "Presented p50 / p95: unavailable"
           else Printf.sprintf "Presented p50 / p95: %.2f / %.2f ms" presented.p50 presented.p95)
        ; Printf.sprintf "Work p50 / p95: %.2f / %.2f ms"
            (Host_metrics.percentile metrics 0.5) (Host_metrics.percentile metrics 0.95)
        ; Printf.sprintf "Interaction p50 / p95: %.2f / %.2f ms"
            (Host_metrics.phase_summary metrics Active_frame).p50
            (Host_metrics.phase_summary metrics Active_frame).p95
        ; Printf.sprintf "Over budget: %d frames" metrics.missed
        ; Printf.sprintf "Input to host frame: %.2f ms" metrics.input_latency_ms
        ; Printf.sprintf "Events: %.2f ms (%d total)" metrics.event_ms metrics.event_count
        ; Printf.sprintf "Mailbox: %.2f ms" metrics.pump_ms
        ; Printf.sprintf "Layout: %.2f ms (%d runs)" metrics.layout_ms metrics.layout_count
        ; Printf.sprintf "Layout p95: %.2f ms" (Host_metrics.phase_summary metrics Layout).p95
        ; Printf.sprintf "Paint + render: %.2f ms" metrics.paint_ms
        ; Printf.sprintf "GPU submit / execute: %.2f / %.2f ms" metrics.gpu_submit_ms
            (match metal with Some m -> Lui_metal.gpu_ms m | None -> 0.)
        ; Printf.sprintf "GPU execute p95: %.2f ms" (Host_metrics.phase_summary metrics Gpu_execute).p95
        ; Printf.sprintf "Hit geometry: %.2f ms" metrics.populate_ms
        ; Printf.sprintf "Nodes: %d / scene ops: %d"
            (Lui_store.node_count store) (List.length scene.ops)
        ; Printf.sprintf "Patch ops: %d" metrics.patch_ops
        ; Printf.sprintf "Heap: %.1f MB" (float gc.Gc.heap_words *. 8. /. 1048576.)
        ; Printf.sprintf "GC minor / major: %d / %d" gc.minor_collections gc.major_collections
        ; "Click dialog again to close this buffer."
        ])
      in
      (box x 48. width (float !win_h -. 48.) bg
        :: box x 48. 1. (float !win_h -. 48.) accent
        :: List.concat (List.mapi (fun i line ->
             label (i+2) (x +. 18.) (64. +. float i *. 31.) (width -. 36.) line) lines)) in
  (* Values are sampled at the panel cadence; label fragments and the complete
     renderer overlay already have their own caches. *)
  paint_metrics := draw_metrics;
  let populate_revision = ref (-1, -1, -1) in
  let hit_cache = Host_interaction.hit_cache () in
  let hit_epoch = ref 0 in
  let populate_rects () =
    let revision = Lui_store.layout_rev store, Lui_host.invalidation_count host,
      Ui.scroll_epoch ui in
    if !populate_revision <> revision then begin
      populate_revision := revision;
      Host_interaction.refresh_rects ~store ~base:engine_rect
        ~scroll_x:(Ui.scroll_offset_x ui) ~scroll_y:(Ui.scroll_offset ui)
        rects;
      incr hit_epoch;
      Lui_store.iter_preorder store (fun id ->
        if Ui.scrollable store id then begin
          let cr = engine_rect id in
          let _, _, right, bottom = content_box id in
          let x,y = Host_interaction.scroll_extent cr ~right ~bottom in
          Ui.set_scroll_cap ui id y;
          Ui.set_scroll_cap_x ui id x
        end);
      Ui.notify_layout ui
      ; Native_window.set_drag_regions (Sdl.get_window_id !win)
          (Native_window.drag_regions ~store ~rect_of:engine_rect ~scale:!scale_cell
             ~blocked:[])
    end
  in
  let spatial_index () = Host_interaction.hit_index hit_cache
    ~store ~rects ~epoch:!hit_epoch in
  let component_input = ref false in
  let on_component_input () = component_input := true in
  let handle_input input =
    match input with
    | Input.Key_down _ when Keyboard_capture.active () -> []
    | Input.Text_input _ when Keyboard_capture.active () ->
        component_input := true; []
    | Input.Move _ | Input.Button_down _ | Input.Button_up _
    | Input.Wheel _ | Input.Wheel_mods _ ->
      Ui.handle ~spatial:(spatial_index ()) ~on_component_input ui store rects input
    | _ -> Ui.handle ~on_component_input ui store rects input
  in
  (* Swift spine contract stand-in: the Swift host fires "lazy-mount"
     on row spacers scrolling into view and "virt-end" when a virt list
     nears its bottom. Here the layout rects already exist, so emit the
     same dom-events for spacers inside the viewport band (overscan
     margin below the edge) — rows mount in place, pagination works. *)
  let lazy_fired : (int, unit) Hashtbl.t = Hashtbl.create 64 in
  let virt_end_fired : (int, float) Hashtbl.t = Hashtbl.create 8 in
  let viewport_cache = Host_interaction.viewport_cache () in
  let emit_dom_event name id =
    if !debug then warn "  dom-event %s id=%d" name id;
    let body = if name="lazy-unmount" then
      Printf.sprintf "{\"nodeId\":%d,\"height\":%.6f}" id
        ((shifted_rect id).Lui_scene.h /. !scale_cell)
      else Printf.sprintf "{\"nodeId\":%d}" id in
    Native_embed.platform_event (name ^ "\n" ^ body)
  in
  let fire_viewport_events () =
    let pinned = Hashtbl.create 16 in
    let rec pin id = if id<>0 then begin
      Hashtbl.replace pinned id ();
      Option.iter pin (Lui_store.parent store id)
    end in
    pin (Ui.focused ui); pin (Ui.pressed ui); pin (Ui.open_menu ui);
    let entering = ref [] in
    Host_interaction.viewport_events ~pinned:(Hashtbl.mem pinned)
      viewport_cache ~store ~rect_of:shifted_rect
      ~height:(float !win_h *. !scale_cell) ~lazy_fired ~virt_end_fired
      ~emit:(fun name id -> if name="lazy-mount" then entering := id :: !entering
        else emit_dom_event name id);
    List.iter (fun (parent,children) ->
      match children with
      | [id] when parent=id -> emit_dom_event "lazy-mount" id
      | _ ->
        let uuids = List.map (fun id ->
          match Yojson.Safe.from_string (Option.get (Lui_store.string_prop store id "attrs")) with
          | `Assoc fields -> (match List.assoc "data-lazy-mount" fields with
            | `String key -> `String key | _ -> invalid_arg "Invalid lazy row key")
          | _ -> invalid_arg "Invalid lazy row attributes") children in
        let body = Yojson.Safe.to_string (`Assoc ["nodeId",`Int parent; "uuids",`List uuids]) in
        Native_embed.platform_event ("lazy-mount\n" ^ body))
      (Host_interaction.lazy_mount_groups store (List.rev !entering))
  in
  (* SDL text input feeds XIM. Leaving it armed on a non-editable
     node makes SDL_PollEvent run XFilterEvent, which blocks the main
     thread for an ibus timeout (~20s) on the following keyup. Arm it
     only while a text-entry node owns focus. *)
  let text_entry kind =
    match kind with
    | "input" | "search-field" | "text-field" | "secure-field"
    | "textarea" | "combobox" | "extension:logseq-editor" -> true
    | _ -> false
  in
  let set_ime_rect (r : Lui_scene.rect) =
    let s = !scale_cell in
    Sdl.set_text_input_rect
      (Some
         (Sdl.Rect.create
            ~x:(int_of_float (r.Lui_scene.x /. s))
            ~y:(int_of_float (r.Lui_scene.y /. s))
            ~w:(max 1 (int_of_float (r.Lui_scene.w /. s)))
            ~h:(max 1 (int_of_float (r.Lui_scene.h /. s)))))
  in
  let caret_rect () =
    let id = Ui.focused ui in
    let r = Rects.get rects id in
    if Lui_scene.rect_empty r then r
    else if Text_engine.ordinary_input store id then
      Text_engine.input_caret_rect text_engine ui id r
    else begin
      let s = !scale_cell in
      let pad =
        (Lui_paint.text_placement_of store id).tp_pad_left *. s
      in
      let text = Ui.shadow ui in
      let prefix =
        String.sub text 0 (min (Ui.caret ui) (String.length text))
      in
      let dx, _ = Text_engine.measure_text text_engine id prefix in
      Lui_scene.rect (r.Lui_scene.x +. pad +. dx) r.Lui_scene.y 2.
        r.Lui_scene.h
    end
  in
  let text_input = Native_window.text_input () in
  let focused_text_input id =
    let editable = id <> 0 && Lui_store.mem store id
                   && text_entry (Lui_store.kind store id) in
    let on = editable || Ui.menu_input_active ui store in
    Native_window.request_text_input text_input on;
    if editable then set_ime_rect (Rects.get rects id)
  in
  let quit = ref false in
  let rec apply_action = function
    | Dispatch ev ->
      let name =
        match ev with
        | Lui_protocol.Press _ -> "Press"
        | LongPress _ -> "LongPress"
        | TextChanged _ -> "TextChanged"
        | Submit _ -> "Submit"
        | NavigatePrevious _ -> "NavigatePrevious"
        | NavigateNext _ -> "NavigateNext"
        | NavigationKey _ -> "NavigationKey"
        | ToggleChanged _ -> "ToggleChanged"
        | Change _ -> "Change"
        | ValueChanged _ -> "ValueChanged"
        | Dismiss _ -> "Dismiss"
        | DoublePress _ -> "DoublePress"
        | Appear _ -> "Appear"
        | ScrollCompleted _ -> "ScrollCompleted"
        | VisibleRange _ -> "VisibleRange"
        | Picked _ -> "Picked"
        | PressModifiers _ -> "PressModifiers"
        | PressDetail _ -> "PressDetail"
        | PointerDown _ -> "PointerDown"
        | PointerUp _ -> "PointerUp"
        | PointerEnter _ -> "PointerEnter"
        | PointerLeave _ -> "PointerLeave"
        | ContextMenuPress _ -> "ContextMenuPress"
        | Load _ -> "Load"
        | ExtensionEvent (_, tag, _, _) -> "ExtensionEvent:" ^ tag
      in
      let node = Lui_protocol.event_node ev in
      (match Lui_store.string_prop store node "style-class" with
       | Some c -> dbg "dispatch %s node=%d class=%s" name node c
       | None -> dbg "dispatch %s node=%d" name node);
      (* Ancestry trace for identifying mystery hit targets: kind and
         style-class up to the root, gated by LOGSEQ_NATIVE_DUMP. *)
      if !dump then begin
        let kids = Lui_store.child_ids store node in
        dbg "  children of %d: %s" node
          (String.concat " " (List.map string_of_int kids));
        List.iter
          (fun k ->
             dbg "  child %d kind=%s key=%s rect=%.0f,%.0f %.0fx%.0f" k
               (Lui_store.kind store k)
               (Option.value
                  (Lui_store.string_prop store k "key") ~default:"-")
               (let r = Rects.get rects k in
                r.Lui_scene.x) (Rects.get rects k).Lui_scene.y
               (Rects.get rects k).Lui_scene.w
               (Rects.get rects k).Lui_scene.h)
          kids;
        let rec walk id =
          let kind = Lui_store.kind store id in
          let cls =
            match Lui_store.string_prop store id "style-class" with
            | Some c -> c
            | None -> ""
          in
          let key =
            match Lui_store.string_prop store id "key" with
            | Some k -> k
            | None -> "-"
          in
          let r = Rects.get rects id in
          dbg "  node %d kind=%s key=%s class=%s rect=%.0f,%.0f %.0fx%.0f"
            id kind key cls r.Lui_scene.x r.Lui_scene.y
            r.Lui_scene.w r.Lui_scene.h;
          match Lui_store.parent store id with
          | Some p when p <> id -> walk p
          | _ -> ()
        in
        walk node
      end;
      (try
         let r = Native_embed.dispatch_lui ev in
         dbg "  dispatch -> %d batches" (List.length r);
         apply_patches ~event:ev r
       with Invalid_argument msg ->
         warn "dispatch rejected event: %s" msg)
    | Clipboard_write s -> ignore (Lui_shell.clipboard_write s)
    | Paste_request ->
      (match Lui_shell.clipboard_read () with
       | Some s ->
         apply_actions (handle_input (Input.Paste s))
       | None -> ())
    | Resize_host _ ->
      let dw, dh = drawable () in
      (match !blit_cell with
       | Some b ->
         (match Lui_blit.resize b ~w:dw ~h:dh with
          | Ok () -> ()
          | Error m -> warn "blit resize: %s" m)
       | None -> ());
      scale_cell := float dw /. float (max 1 !win_w);
      Ui.set_scale ui !scale_cell;
      Lui_host.resize host ~width:(int_of_float (content_width () *. !scale_cell))
        ~height:dh ~scale:!scale_cell;
      push_window_size ()
    | Focus_changed id -> focused_text_input id
    | Ime_rect r -> set_ime_rect r
    | Quit -> quit := true
  and apply_actions acts = List.iter apply_action acts
  and push_window_size () =
    (* Logical viewport size — Web_dom.win_inner_* drives the
       virtualizer and window-edge popup anchoring. *)
    let body =
      Printf.sprintf "{\"width\":%d,\"height\":%d}"
        (int_of_float (content_width ())) !win_h
    in
    Native_embed.platform_event ("window-size\n" ^ body)
  in
  (* ---- DOM document events ------------------------------------------

     The app also registers DOM-style listeners through
     Platform.add_event_listener (cmdk shortcuts, editor keys,
     outside-click dismiss, block dnd, ...). Mirror SDL input into the
     same "name\njson" envelopes the bridge uses — platform_event feeds
     them through emit_event's capture -> bubble -> window fan-out.

     Pointer events resolve their target through the same hit test the
     Input.* dispatch uses (deepest node under the cursor, in device
     px). Key events target the open menu, else the focused node — the
     DOM activeElement — like a native host's focus registry. *)
  let json_escape s =
    let b = Buffer.create (String.length s + 8) in
    String.iter
      (fun c ->
         if c = '"' then Buffer.add_string b "\\\""
         else if c = '\\' then Buffer.add_string b "\\\\"
         else if Char.code c < 0x20 then
           Buffer.add_string b (Printf.sprintf "\\u%04x" (Char.code c))
         else Buffer.add_char b c)
      s;
    Buffer.contents b
  in
  let jstr s = "\"" ^ json_escape s ^ "\"" in
  let jbool b = if b then "true" else "false" in
  let dom_payload node fields =
    let fields =
      if node > 0 then ("nodeId", string_of_int node) :: fields
      else fields
    in
    "{"
      ^ String.concat ","
          (List.map (fun (k, v) -> jstr k ^ ":" ^ v) fields)
      ^ "}"
  in
  let emit_dom name node fields =
    let body = dom_payload node fields in
    dbg "dom %s node=%d %s" name node body;
    Native_embed.platform_event (name ^ "\n" ^ body)
  in
  let dom_root () =
    match Lui_store.root_ids store with
    | id :: _ -> id
    | [] -> 0
  in
  let dom_hit ~x ~y =
    let s = !scale_cell in
    let path = hit_path ~spatial:(spatial_index ()) store rects
      ~x:(x *. s) ~y:(y *. s) in
    match path with
    | id :: _ -> id
    | [] -> dom_root ()
  in
  (* DOM `buttons` bitmask: 1 primary, 2 secondary, 4 auxiliary. SDL
     button numbers are 1 left, 2 middle, 3 right while DOM is 0 left,
     1 middle, 2 right — map through Input.mouse_button. *)
  let input_state = Native_window.input_state ~keymod:(Sdl.get_mod_state ()) in
  let dom_buttons = ref 0 in
  let dom_button_bit (b : Input.mouse_button) =
    match b with
    | Input.Left -> 1
    | Input.Right -> 2
    | Input.Middle -> 4
    | Input.Other n -> 1 lsl (n - 1)
  in
  let dom_down_node = ref 0 in
  let dom_down_clicks = ref 0 in
  (* Same-hit free moves carry no new information — cap them the way
     native hosts do (~25/s); drags emit every move. *)
  let last_move_emit = ref (0, 0.) in
  let mods_fields (m : Input.mods) =
    [ ("shiftKey", jbool m.Input.shift)
    ; ("metaKey", jbool m.Input.meta)
    ; ("ctrlKey", jbool m.Input.ctrl)
    ; ("altKey", jbool m.Input.alt) ]
  in
  let pointer_fields ~x ~y ~button ~buttons ~mods ~extra =
    [ ("clientX", string_of_int x)
    ; ("clientY", string_of_int y)
    ; ("button", string_of_int button)
    ; ("buttons", string_of_int buttons) ]
    @ mods_fields mods @ extra
  in
  let on_dom_button_down ~x ~y ~btn ~clicks ~mods =
    let node = dom_hit ~x:(float x) ~y:(float y) in
    dom_down_node := node;
    dom_down_clicks := clicks;
    dom_buttons := !dom_buttons lor dom_button_bit btn;
    let button = Input.button_to_int btn in
    emit_dom "mousedown" node
      (pointer_fields ~x ~y ~button ~buttons:!dom_buttons ~mods
         ~extra:[ ("detail", string_of_int clicks) ]);
    emit_dom "pointerdown" node
      (pointer_fields ~x ~y ~button ~buttons:!dom_buttons ~mods
         ~extra:[ ("detail", "0") ])
  in
  let on_dom_button_up ~x ~y ~btn ~mods =
    let node = dom_hit ~x:(float x) ~y:(float y) in
    dom_buttons := !dom_buttons land lnot (dom_button_bit btn);
    let button = Input.button_to_int btn in
    let fields ~detail =
      pointer_fields ~x ~y ~button ~buttons:!dom_buttons ~mods
        ~extra:[ ("detail", string_of_int detail) ]
    in
    (* DOM order: mouseup, pointerup, then click *)
    emit_dom "mouseup" node (fields ~detail:1);
    emit_dom "pointerup" node (fields ~detail:0);
    (match btn with
     | Input.Left ->
       if node <> 0 && node = !dom_down_node then begin
         let clicks = max 1 !dom_down_clicks in
         emit_dom "click" node (fields ~detail:clicks);
         if clicks >= 2 then emit_dom "dblclick" node (fields ~detail:clicks)
       end
     | Input.Right ->
       (* contextmenu carries the hit node's live rect so document
          listeners can anchor popups to the event target (element
          center-x / bottom, the web anchor semantic) — element rect
          queries on this host are fire-and-poll and can't answer
          synchronously *)
       let r = Rects.get rects node in
       emit_dom "contextmenu" node
         (pointer_fields ~x ~y ~button ~buttons:!dom_buttons ~mods
            ~extra:
              [ ( "detail"
                , Printf.sprintf
                    "{\"tx\":%.1f,\"ty\":%.1f,\"tw\":%.1f,\"th\":%.1f}"
                    r.Lui_scene.x r.Lui_scene.y r.Lui_scene.w
                    r.Lui_scene.h ) ])
     | _ -> ());
    dom_down_node := 0;
    dom_down_clicks := 0
  in
  (* Mouse cursor: SDL never sets one, so the window inherited the X
     root cursor (a black "X" on bare X servers) and showed no I-beam
     over text or hand over links. Resolve the CSS-ish [cursor] prop
     up the hovered path (editor sinks and text inputs read as text). *)
  let cursor_cache = Hashtbl.create 8 in
  let current_cursor = ref "" in
  let sys_cursor name =
    match Hashtbl.find_opt cursor_cache name with
    | Some c -> Some c
    | None ->
      let kind =
        match name with
        | "pointer" -> Sdl.System_cursor.hand
        | "text" -> Sdl.System_cursor.ibeam
        | "not-allowed" -> Sdl.System_cursor.no
        | "wait" | "progress" -> Sdl.System_cursor.waitarrow
        | "col-resize" | "ew-resize" -> Sdl.System_cursor.size_we
        | "row-resize" | "ns-resize" -> Sdl.System_cursor.size_ns
        | "move" | "grab" | "grabbing" -> Sdl.System_cursor.size_all
        | _ -> Sdl.System_cursor.arrow
      in
      (match Sdl.create_system_cursor kind with
       | Ok c -> Hashtbl.replace cursor_cache name c; Some c
       | Error _ -> None)
  in
  let cursor_for = Host_interaction.pointer_cursor ui store rects in
  let update_cursor node =
    let name = cursor_for node in
    if name <> !current_cursor then begin
      current_cursor := name;
      match sys_cursor name with
      | Some c -> Sdl.set_cursor (Some c)
      | None -> ()
    end
  in
  ignore (sys_cursor "default" |> Option.map (fun c -> Sdl.set_cursor (Some c)));
  (* Cursor changes only on the next motion. A modal (search) that
     closes under a still pointer otherwise leaves the I-beam stuck
     until the mouse moves. Re-hit after each layout. *)
  let last_ptr : (int * int) option ref = ref None in
  let refresh_cursor () =
    match !last_ptr with
    | Some (x, y) -> update_cursor (dom_hit ~x:(float x) ~y:(float y))
    | None -> ()
  in
  let on_dom_motion ~x ~y ~rx ~ry ~mods =
    last_ptr := Some (x, y);
    let node = dom_hit ~x:(float x) ~y:(float y) in
    update_cursor node;
    let now = Unix.gettimeofday () in
    let last_node, last_t = !last_move_emit in
    let skip =
      !dom_buttons = 0 && last_node = node && now -. last_t < 0.04
    in
    if not skip then begin
      last_move_emit := (node, now);
      let fields =
        pointer_fields ~x ~y ~button:0 ~buttons:!dom_buttons ~mods
          ~extra:[ ("movementX", string_of_int rx)
                 ; ("movementY", string_of_int ry) ]
      in
      emit_dom "mousemove" node fields;
      emit_dom "pointermove" node fields
    end
  in
  (* DOM KeyboardEvent.key/code for SDL scancodes. `key` is the
     unshifted name — letters stay lowercase under Shift while the
     produced glyph goes to `keyChar`; `code` is the physical position
     name. Same contract native hosts emit. *)
  let named_dom_key = function
    | 57 -> "CapsLock"
    | n when n >= 58 && n <= 69 -> "F" ^ string_of_int (n - 57)
    | 70 -> "PrintScreen"
    | 71 -> "ScrollLock"
    | 72 -> "Pause"
    | 73 -> "Insert"
    | 83 -> "NumLock"
    | 101 -> "ContextMenu"
    | 102 -> "Power"
    | 224 | 228 -> "Control"
    | 225 | 229 -> "Shift"
    | 226 | 230 -> "Alt"
    | 227 | 231 -> "Meta"
    | n -> Sdl.get_scancode_name n
  in
  (* SDL scancode -> unshifted char for punctuation and keypad keys;
     char_of_scancode only covers letters and top-row digits. *)
  let punct_char = function
    | 45 -> Some '-'
    | 46 -> Some '='
    | 47 -> Some '['
    | 48 -> Some ']'
    | 49 | 100 -> Some '\\'
    | 50 -> Some '#'
    | 51 -> Some ';'
    | 52 -> Some '\''
    | 53 -> Some '`'
    | 54 -> Some ','
    | 55 -> Some '.'
    | 56 | 84 -> Some '/'
    | 85 -> Some '*'
    | 86 -> Some '-'
    | 87 -> Some '+'
    | 99 -> Some '.'
    | n when n >= 89 && n <= 97 ->
      Some (Char.chr (Char.code '1' + n - 89))
    | 98 -> Some '0'
    | _ -> None
  in
  let unshifted_char sc =
    match Input.char_of_scancode sc with
    | Some _ as r -> r
    | None -> punct_char sc
  in
  (* US-layout shift pairs for `keyChar`; non-paired chars return
     themselves. *)
  let shift_glyph = function
    | '1' -> '!' | '2' -> '@' | '3' -> '#' | '4' -> '$' | '5' -> '%'
    | '6' -> '^' | '7' -> '&' | '8' -> '*' | '9' -> '(' | '0' -> ')'
    | '-' -> '_' | '=' -> '+' | '[' -> '{' | ']' -> '}' | '\\' -> '|'
    | ';' -> ':' | '\'' -> '"' | '`' -> '~' | ',' -> '<' | '.' -> '>'
    | '/' -> '?' | '#' -> '~' | c -> c
  in
  let dom_key sc =
    match Input.key_of_sdl_scancode sc with
    | Input.Return -> "Enter"
    | Input.Escape -> "Escape"
    | Input.Backspace -> "Backspace"
    | Input.Delete -> "Delete"
    | Input.Tab -> "Tab"
    | Input.Space -> " "
    | Input.Arrow_left -> "ArrowLeft"
    | Input.Arrow_right -> "ArrowRight"
    | Input.Arrow_up -> "ArrowUp"
    | Input.Arrow_down -> "ArrowDown"
    | Input.Home -> "Home"
    | Input.End -> "End"
    | Input.Page_up -> "PageUp"
    | Input.Page_down -> "PageDown"
    | Input.Other _ -> (
        match unshifted_char sc with
        | Some c -> String.make 1 c
        | None -> named_dom_key sc)
  in
  let dom_code sc =
    match sc with
    | 40 -> "Enter"
    | 88 -> "NumpadEnter"
    | n when n >= 4 && n <= 29 ->
      "Key" ^ String.make 1 (Char.chr (Char.code 'A' + n - 4))
    | n when n >= 30 && n <= 38 ->
      "Digit" ^ String.make 1 (Char.chr (Char.code '1' + n - 30))
    | 39 -> "Digit0"
    | 41 -> "Escape" | 42 -> "Backspace" | 43 -> "Tab" | 44 -> "Space"
    | 45 -> "Minus" | 46 -> "Equal" | 47 -> "BracketLeft"
    | 48 -> "BracketRight" | 49 -> "Backslash" | 50 -> "IntlHash"
    | 51 -> "Semicolon" | 52 -> "Quote" | 53 -> "Backquote"
    | 54 -> "Comma" | 55 -> "Period" | 56 -> "Slash"
    | 57 -> "CapsLock"
    | n when n >= 58 && n <= 69 -> "F" ^ string_of_int (n - 57)
    | 70 -> "PrintScreen" | 71 -> "ScrollLock" | 72 -> "Pause"
    | 73 -> "Insert"
    | 74 -> "Home" | 75 -> "PageUp" | 76 -> "Delete" | 77 -> "End"
    | 78 -> "PageDown"
    | 79 -> "ArrowRight" | 80 -> "ArrowLeft" | 81 -> "ArrowDown"
    | 82 -> "ArrowUp"
    | 83 -> "NumLock"
    | 84 -> "NumpadDivide" | 85 -> "NumpadMultiply"
    | 86 -> "NumpadSubtract" | 87 -> "NumpadAdd" | 99 -> "NumpadDecimal"
    | n when n >= 89 && n <= 98 ->
      "Numpad" ^ string_of_int ((n - 88) mod 10)
    | 100 -> "IntlBackslash" | 101 -> "ContextMenu" | 102 -> "Power"
    | 224 -> "ControlLeft" | 225 -> "ShiftLeft" | 226 -> "AltLeft"
    | 227 -> "MetaLeft"
    | 228 -> "ControlRight" | 229 -> "ShiftRight" | 230 -> "AltRight"
    | 231 -> "MetaRight"
    | n -> Sdl.get_scancode_name n
  in
  let dom_keychar ~shift sc =
    match Input.key_of_sdl_scancode sc with
    | Input.Space -> Some " "
    | Input.Other _ -> (
        match unshifted_char sc with
        | Some c ->
          let c =
            if shift then
              match c with
              | 'a' .. 'z' -> Char.uppercase_ascii c
              | c -> shift_glyph c
            else c
          in
          Some (String.make 1 c)
        | None -> None)
    | _ -> None
  in
  let on_dom_key ~down ~scancode ~keymod ~repeat =
    let recording = Keyboard_capture.active () in
    let mods = mods_of_keymod keymod in
    let target =
      let menu = Ui.open_menu ui in
      if menu <> 0 then menu else Ui.focused ui
    in
    let fields =
      [ ("key", jstr (dom_key scancode))
      ; ("code", jstr (dom_code scancode))
      ; ("repeat", jbool repeat) ]
      @ (match dom_keychar ~shift:mods.Input.shift scancode with
         | Some kc -> [ ("keyChar", jstr kc) ]
         | None -> [])
      @ mods_fields mods
    in
    begin
      if down && not recording && target <> 0
         && Lui_store.kind store target = "extension:logseq-editor"
      then begin
        dbg "editor key %s" (dom_key scancode);
        let values = String.concat ""
          [ "{\"key\":"; jstr (dom_key scancode)
          ; ",\"shift\":"; jbool (mods.Input.shift)
          ; ",\"alt\":"; jbool (mods.Input.alt)
          ; ",\"meta\":"; jbool (mods.Input.meta)
          ; ",\"ctrl\":"; jbool (mods.Input.ctrl)
          ; ",\"repeat\":"; jbool repeat; "}" ] in
        apply_patches
          (Native_embed.keyboard_event target (dom_payload target fields) values)
      end
      else emit_dom (if down then "keydown" else "keyup") target fields;
      (* browsers dispatch copy/cut/paste as their own dom events on
         mod+c/x/v — the document clipboard listeners (on_copy/on_cut/
         on_paste) hang off those, not the keydown; a paste event
         carries the OS clipboard as clipboardData.text like the
         browser's *)
      let primary_shortcut =
        if Host_platform.is_macos then mods.Input.meta && not mods.Input.ctrl
        else mods.Input.ctrl && not mods.Input.meta
      in
      if down && not recording && (not repeat) && primary_shortcut
         && not (mods.Input.alt || mods.Input.shift)
      then
        (match dom_key scancode with
         | "c" -> emit_dom "copy" target []
         | "x" -> emit_dom "cut" target []
         | "v" ->
             let text =
               Option.value (Lui_shell.clipboard_read ()) ~default:""
             in
             emit_dom "paste" target
               [ ("clipboardData", "{\"text\":" ^ jstr text ^ "}") ]
         | _ -> ())
    end
  in
  let emit_dom_event e =
    match Sdl.Event.enum (Sdl.Event.get e Sdl.Event.typ) with
    | `Mouse_button_down ->
      on_dom_button_down
        ~x:(Sdl.Event.get e Sdl.Event.mouse_button_x)
        ~y:(Sdl.Event.get e Sdl.Event.mouse_button_y)
        ~btn:(Input.button_of_sdl
                (Sdl.Event.get e Sdl.Event.mouse_button_button))
        ~clicks:(Sdl.Event.get e Sdl.Event.mouse_button_clicks)
        ~mods:(Native_window.current_modifiers input_state)
    | `Mouse_button_up ->
      on_dom_button_up
        ~x:(Sdl.Event.get e Sdl.Event.mouse_button_x)
        ~y:(Sdl.Event.get e Sdl.Event.mouse_button_y)
        ~btn:(Input.button_of_sdl
                (Sdl.Event.get e Sdl.Event.mouse_button_button))
        ~mods:(Native_window.current_modifiers input_state)
    | `Mouse_motion ->
      on_dom_motion
        ~x:(Sdl.Event.get e Sdl.Event.mouse_motion_x)
        ~y:(Sdl.Event.get e Sdl.Event.mouse_motion_y)
        ~rx:(Sdl.Event.get e Sdl.Event.mouse_motion_xrel)
        ~ry:(Sdl.Event.get e Sdl.Event.mouse_motion_yrel)
        ~mods:(Native_window.current_modifiers input_state)
    | `Key_down ->
      on_dom_key ~down:true
        ~scancode:(Sdl.Event.get e Sdl.Event.keyboard_scancode)
        ~keymod:(Sdl.Event.get e Sdl.Event.keyboard_keymod)
        ~repeat:(Sdl.Event.get e Sdl.Event.keyboard_repeat <> 0)
    | `Key_up ->
      on_dom_key ~down:false
        ~scancode:(Sdl.Event.get e Sdl.Event.keyboard_scancode)
        ~keymod:(Sdl.Event.get e Sdl.Event.keyboard_keymod)
        ~repeat:false
    | _ -> ()
  in
  (* ---- macOS main menu commands -----------------------------------

     ocaml_host_stubs.c installs the NSMenu bar; every item's tag is
     forwarded here through the "ocaml_host_menu_command" named value.
     Direct Edit menu actions become SDL keys; physical key equivalents
     are already owned by SDL and are filtered at the AppKit callback.
     App-level commands reuse the "menu-*" platform_event
     contract Menu_bar.install registers; OS verbs bounce back to the
     AppKit stub (native_app_op). Tags match the kMenu* enum in
     ocaml_host_stubs.c. *)
  let push_menu_key ~down ~scancode ~keymod =
    let ev = Sdl.Event.create () in
    Sdl.Event.set ev Sdl.Event.typ
      (if down then Sdl.Event.key_down else Sdl.Event.key_up);
    Sdl.Event.set ev Sdl.Event.keyboard_window_id
      (Sdl.get_window_id !win);
    Sdl.Event.set ev Sdl.Event.keyboard_state
      (if down then Sdl.pressed else Sdl.released);
    Sdl.Event.set ev Sdl.Event.keyboard_repeat 0;
    Sdl.Event.set ev Sdl.Event.keyboard_scancode scancode;
    Sdl.Event.set ev Sdl.Event.keyboard_keymod keymod;
    ignore (Sdl.push_event ev)
  in
  let menu_key ~scancode ~keymod =
    push_menu_key ~down:true ~scancode ~keymod;
    push_menu_key ~down:false ~scancode ~keymod:(Sdl.get_mod_state ())
  in
  let menu_command tag =
    dbg "menu-command %d" tag;
    match tag with
    | 1 -> native_app_op 0 (* About *)
    | 2 -> native_app_op 1 (* Hide *)
    | 3 -> native_app_op 2 (* Hide Others *)
    | 4 -> native_app_op 3 (* Show All *)
    | 5 -> (* Quit — through SDL so the app's normal exit path runs *)
      let ev = Sdl.Event.create () in
      Sdl.Event.set ev Sdl.Event.typ Sdl.Event.quit;
      ignore (Sdl.push_event ev)
    | 6 -> menu_key ~scancode:Sdl.Scancode.z ~keymod:Sdl.Kmod.gui
    | 7 ->
      menu_key ~scancode:Sdl.Scancode.z
        ~keymod:(Sdl.Kmod.gui lor Sdl.Kmod.shift)
    | 8 -> menu_key ~scancode:Sdl.Scancode.x ~keymod:Sdl.Kmod.gui
    | 9 -> menu_key ~scancode:Sdl.Scancode.c ~keymod:Sdl.Kmod.gui
    | 10 -> menu_key ~scancode:Sdl.Scancode.v ~keymod:Sdl.Kmod.gui
    | 11 -> menu_key ~scancode:Sdl.Scancode.a ~keymod:Sdl.Kmod.gui
    | 12 -> native_app_op 7 (* Toggle Full Screen *)
    | 13 -> Native_embed.platform_event "menu-toggle-left-sidebar\n{}"
    | 14 -> Native_embed.platform_event "menu-reload\n{}"
    | 15 -> native_app_op 4 (* Minimize *)
    | 16 -> native_app_op 5 (* Zoom *)
    | 17 -> native_app_op 6 (* Close *)
    | 18 -> (* Help *)
      ignore
        (Unix.create_process "open"
           [| "open"; "https://docs.logseq.com" |]
           Unix.stdin Unix.stdout Unix.stderr)
    | _ -> ()
  in
  Callback.register "ocaml_host_menu_command" menu_command;
  (* PageUp/PageDown with focus off a list used to no-op (control_key
     ignores them; list_key only pages a pointer-armed list scope) and,
     with text input armed, the keyup blocked in XIM. When nothing
     else scrolled, page the main column. Multiline editors keep the
     key. The id is cached; a remount misses and we scan once. *)
  let main_scroller = ref 0 in
  let main_scroller_id () =
    let id = !main_scroller in
    if
      id <> 0 && Lui_store.mem store id
      && Lui_store.string_prop store id "accessibility-identifier"
         = Some "main-content-container"
    then id
    else
      match
        List.find_opt
          (fun nid ->
            Lui_store.string_prop store nid "accessibility-identifier"
            = Some "main-content-container")
          (Lui_store.preorder store)
      with
      | Some nid ->
        main_scroller := nid;
        nid
      | None ->
        main_scroller := 0;
        0
  in
  let e = Sdl.Event.create () in
  let drain_events () =
    let n = ref 0 in
    let go = ref true in
    while !go do
      if Sdl.poll_event (Some e) then begin
        incr n;
        component_input := false;
        dbg "sdl event type=%d" (Sdl.Event.get e Sdl.Event.typ);
        metrics.event_count <- metrics.event_count + 1;
        let input = Native_window.input_of_event input_state e in
        (match input with
         | Some (Input.Key_down _) ->
           Host_metrics.note_key metrics
             (dom_key (Sdl.Event.get e Sdl.Event.keyboard_scancode))
         | Some (Input.Text_input s) -> Host_metrics.note_text metrics s
         | _ -> ());
        (match input with
         | Some (Input.Button_down (_,_,Input.Left,_,_)) -> Native_window.hold_pointer text_input true
         | Some (Input.Button_up (_,_,Input.Left,_)) -> Native_window.hold_pointer text_input false
         | _ -> ());
        (match input with
         | Some (Input.Key_down _ | Input.Text_input _) when not (Keyboard_capture.active ()) -> Host_requests.ensure_ed_focus ()
         | _ -> ());
        (match input with
         | Some (Input.Button_down _ | Input.Button_up _ | Input.Key_down _
                | Input.Text_input _ | Input.Wheel _ | Input.Wheel_mods _) ->
           let age = Int32.sub (Sdl.get_ticks ()) (Sdl.Event.get e Sdl.Event.timestamp) in
           let at = perf_s () -. Int32.to_float age /. 1000. in
           metrics.input_at <- Some (match metrics.input_at with None -> at | Some old -> min old at)
         | _ -> ());
        (match input with
         | Some (Input.Resize (w, h)) when w <> !win_w || h <> !win_h ->
           win_w := w;
           win_h := h;
           apply_actions
             (handle_input (Input.Resize (w, h)))
         | Some (Input.Resize _) -> ()
         | Some input ->
           let page_dir =
             match input with
             | Input.Key_down (k, mods, _)
               when not
                      (mods.Input.ctrl || mods.Input.shift
                       || mods.Input.alt || mods.Input.meta) ->
               if k = Input.Page_down then 1.
               else if k = Input.Page_up then -1.
               else 0.
             | _ -> 0.
           in
           let epoch0 = Ui.scroll_epoch ui in
           apply_actions (handle_input input);
           if page_dir <> 0. && not !component_input && not (Keyboard_capture.active ())
              && Ui.scroll_epoch ui = epoch0 then begin
             let fid = Ui.focused ui in
             let editor_owns =
               fid <> 0
               &&
               match Lui_store.kind store fid with
               | "textarea" | "extension:logseq-editor" -> true
               | _ -> false
             in
             if not editor_owns then
               let sc = main_scroller_id () in
               if sc <> 0 then begin
                 let h = (Rects.get rects sc).Lui_scene.h in
                 if h > 1. then
                   apply_actions
                     (Ui.scroll_by ui store sc (page_dir *. 0.9 *. h))
               end
           end;
           (match input with
            | Input.Text_input s when not !component_input ->
              (* the editor sink's conduit reads text commits as
                 "insert" — Ui.handle's TextChanged path stays unused
                 because the extension admits no such event *)
              let tgt = Ui.focused ui in
              if tgt <> 0
                 && Lui_store.kind store tgt = "extension:logseq-editor"
              then
                apply_patches
                  (Native_embed.extension_event tgt "logseq-editor" "insert"
                     (Printf.sprintf {|{"text":%s}|} (jstr s)))
            | _ -> ())
         | None -> ());
        if not !component_input then emit_dom_event e
      end
      else go := false
    done;
    !n
  in
  (* ---- boot the embedded app ---- *)
  Lui_shell.set_app_name "Logseq";
  ignore (Lui_shell.set_window_title "Logseq");
  (* The selected platform and generic host profile drive the app's
     shortcuts, app-icons push and host-gated views. *)
  let init_patches = Domain.join init_d in
  Daemon_client.boot_mark "app initialized";
  apply_patches init_patches;
  Daemon_client.boot_mark "init patches applied";
  (* No synchronous first paint: the frame loop repaints once after
     draining the mailbox, so boot pumps are not each gated behind a
     full layout+shaping+render pass. *)
  populate_rects ();
  Text_engine.bind_input text_engine ui;
  Ui.set_content_rect ui engine_rect;
  let a11y = Lui_a11y.of_store store in
  (* Host_requests env: the dom-op/platform-request sink. *)
  let host_req_repaint = ref false in
  native_menu_theme (!Theme_vars.mode = Lui_theme.Dark);
  let theme_gen_seen = ref !Theme_vars.generation in
  Host_requests.install
    { Host_requests.store;
      ui;
      rects;
      rect_of = shifted_rect;
      scale = (fun () -> !scale_cell);
      measure = (fun id s -> Text_engine.measure_text text_engine id s);
      text_layout = (fun id s -> Text_engine.text_layout text_engine id (shifted_rect id) s);
      apply_batch = (fun b -> ignore (Lui_host.apply_batch host b));
      apply_actions;
      set_ime_rect;
      focused_text_input;
      toggle_native_performance;
      (* host requests mark dirty instead of repainting inline: the
         loop already coalesces all pending work into one paint per
         iteration — several boot-time ui-state/theme pushes would
         otherwise each pay a full layout+shape+render. *)
      repaint = (fun () -> host_req_repaint := true) };
  publish_native_performance ();
  Daemon_client.boot_mark "requests installed";
  (* appearance + window-size environment push — the app's
     prefers_dark and inner_width/inner_height resolve against these. *)
  Option.iter
    (fun dark ->
       Native_embed.platform_event
         (Printf.sprintf "appearance\n{\"dark\":%b}" dark))
    (Host_platform.prefers_dark ());
  Daemon_client.boot_mark "appearance pushed";
  push_window_size ();
  Daemon_client.boot_mark "size pushed";
  (match
     List.find_opt
       (fun id -> Lui_store.bool_prop store id "autofocus")
       (Lui_store.preorder store)
   with
   | Some id ->
     Ui.set_focused ui store id;
     focused_text_input id
   | None -> ());
  Daemon_client.boot_mark "autofocus";
  (* app-icons is queued during init, before this thread drains the
     mailbox. Without a drain the startup line always reports icons=0
     and the first frame paints with an empty registry. *)
  Host_requests.drain ();
  Daemon_client.boot_mark "icons drained";
  log "logseq_native: %dx%d drawable (scale %.2f), renderer=%s, icons=%d"
    dw dh scale (!renderer_cell).Lui_host.name (Host_icons.count ());
  let frame = ref 0 in
  let mem_mark = ref 0. in
  (* LOGSEQ_MEM_TRACE=1: periodic GC/node-count line for leak hunts *)
  let mem_trace =
    match Sys.getenv_opt "LOGSEQ_MEM_TRACE" with
    | Some ("" | "0") | None -> false
    | Some _ -> true
  in
  let raises_left = ref 3 in
  (* (focused id, caret, shadow, rect x/y/w) of the last caret push.
     Unchanged frames skip Input.Caret so a focused field does not
     dirty the painter every tick. *)
  let caret_key = ref None in
  (* [last_busy] gates the idle sleep: any activity below refreshes
     it, so the 1ms fast poll persists through bursts (boot, typing)
     and the blocking wait only kicks in after sustained quiet. *)
  let last_rev = ref 0 and last_busy = ref (perf_s ()) in
  let metrics_log = Option.map open_out (Sys.getenv_opt "LOGSEQ_NATIVE_METRICS") in
  let last_metrics_export = ref (perf_s ()) in
  let previous_loop = ref None in
  let frame_deadline = ref (perf_s ()) in
  let last_render = ref (perf_s ()) in
  let memory_replay_started = perf_s () in
  let allocation_started = perf_s () in
  let paint_frame () =
    host_req_repaint := false;
    let paint_started = perf_s () in
    let layout_before = metrics.layout_count in
    Host_interaction.prepare_paint ui host;
    ignore (Lui_host.repaint host);
    metrics.paint_ms <- (perf_s () -. paint_started) *. 1000.;
    let layout_ms = if metrics.layout_count > layout_before then metrics.layout_ms else 0. in
    Host_metrics.record_phase metrics Scene_build
      (max 0. (metrics.paint_ms -. layout_ms -. metrics.render_ms));
    let populate_started = perf_s () in
    populate_rects ();
    fire_viewport_events ();
    refresh_cursor ();
    metrics.populate_ms <- (perf_s () -. populate_started) *. 1000.;
    Host_metrics.record_phase metrics Geometry metrics.populate_ms;
    let a11y_started = perf_s () in
    ignore (Lui_a11y.sync a11y);
    Host_metrics.record_phase metrics Accessibility ((perf_s () -. a11y_started) *. 1000.);
    if !gl_live_cell then Sdl.gl_swap_window !win;
    Ui.frame_done ui;
    Host_requests.flush_pending_focus ();
    incr frame;
    if Daemon_client.boot_trace then
      Native_embed.with_entry_lock (fun () ->
        let model = Lui_app.model (Option.get !Native_embed.current_app) in
        let journals = List.length model.Model.journals in
        let blocks = List.fold_left (fun count page ->
          count + List.length page.Model.page_blocks) 0 model.journals in
        Daemon_client.boot_mark (Printf.sprintf
          "frame presented index=%d ready=%b journals=%d root_blocks=%d scene_ops=%d"
          !frame (model.phase = Model.Ready) journals blocks
          (List.length (Lui_host.scene host).Lui_scene.ops)))
  in
  Native_window.install !win (fun () ->
    let started = perf_s () in
    Host_interaction.advance_frame ui host ~now:started
      ~reduced_motion:(Native_window.reduced_motion ());
    let w,h = Sdl.get_window_size !win in
    if w <> !win_w || h <> !win_h then begin
      win_w := w; win_h := h;
      apply_actions (handle_input (Input.Resize (w,h)))
    end;
    if memory_replay || Native_window.presentable (Sdl.get_window_id !win) then paint_frame ()
    else host_req_repaint := true;
    Host_metrics.record_phase metrics Active_frame ((perf_s () -. started) *. 1000.));
  if Option.is_some census_path then allocation_census := Some (fun () ->
    let scene = Lui_host.scene host in
    let app = Option.get !(Native_embed.current_app) in
    let runtime = Lui_app.runtime app in
    let roots =
      [ "host", Obj.repr host
      ; "store", Obj.repr store
      ; "scene", Obj.repr scene
      ; "scene_atlases", Obj.repr (scene.mask_atlas,scene.color_atlas)
      ; "model", Obj.repr (Lui_app.model app)
      ; "runtime", Obj.repr runtime
      ; "runtime_properties", Obj.repr
          (runtime.runtime_properties,runtime.runtime_extension_properties)
      ; "runtime_handlers", Obj.repr runtime.event_handlers
      ; "shallow_snapshots", Obj.repr Native_embed.shallow_cache
      ; "subtree_snapshots", Obj.repr Native_embed.subtree_cache
      ; "parsed_attributes", Obj.repr Native_embed.attrs_parse_cache
      ; "pending_batches", Obj.repr Native_embed.pending_batches
      ; "caption_layouts", Obj.repr text_engine.Text_engine.layouts
      ; "editing_layouts", Obj.repr text_engine.editing_layouts
      ; "glyph_slots", Obj.repr text_engine.slots
      ; "metric_layouts", Obj.repr metrics_text_engine.layouts
      ; "icon_sources", Obj.repr Host_icons.svgs
      ; "icon_images", Obj.repr Host_icons.cache
      ; "page_payloads", Obj.repr
          (!(Subs_state.current_page),!(Subs_state.current_journals))
      ; "page_signals", Obj.repr
          (Subs_state.page_items,Subs_state.journal_items,Subs_state.journals_items)
      ] in
    let base_roots = roots in
    let roots = roots @
      [ "property_areas", Obj.repr Properties_state.areas
      ; "editor_state", Obj.repr
          (Editor_state.st, Editor_state.field_sigs_opt,
           Editor_state.active_frame, Editor_state.pending_focus_actions,
           Editor_state.pending_edit_actions, Editor_state.optimistic_input_replay)
      ; "split_actions", Obj.repr
          (Editor_actions.split_commits, Editor_actions.split_restore)
      ; "inline_caches", Obj.repr
          (Render_inline.pull_caches, Render_inline.invalidated_gens,
           Render_inline.minted_meta)
      ; "platform_handlers", Obj.repr
          (Platform.dom_handlers, Platform.window_listeners, Platform.capture_listeners)
      ; "dom_overlays", Obj.repr
          (Dom_ext.overlays, Dom_ext.live_fields, Dom_ext.reference_owners,
           Dom_ext.rect_store, Dom_ext.ref_rect_store, Dom_ext.natural_store)
      ; "search_state", Obj.repr
          (Cmdk_state.latest_t, Cmdk_state.latest_st, Cmdk_state.latest_vs,
           Cmdk_state.services_ref)
      ; "worker_reads", Obj.repr Worker_client.inflight_reads
      ; "timers", Mutex.protect Host.timers_lock (fun () ->
          Obj.repr (Hashtbl.fold (fun _ timer acc -> timer :: acc) Host.timers []))
      ] in
    let reachable root = Obj.reachable_words root * (Sys.word_size / 8) in
    let reachable_roots roots =
      reachable (Obj.repr (Array.of_list (List.map snd roots))) in
    let stats = Gc.quick_stat () in
    (* Root graphs overlap. Their union is measured once rather than adding
       individual reachability; native allocations are reported separately. *)
    `Assoc
      [ "allocation_sampler_enabled", `Bool (Option.is_some allocation_path)
      ; "forced_major_collections", `Int !forced_major_collections
      ; "gc_live_bytes", `Int (stats.live_words * (Sys.word_size / 8))
      ; "gc_heap_bytes", `Int (stats.heap_words * (Sys.word_size / 8))
      ; "base_reachable_bytes", `Int (reachable_roots base_roots)
      ; "combined_reachable_bytes", `Int (reachable_roots roots)
      ; "roots", `List (List.map (fun (name,root) ->
          `Assoc ["name",`String name; "reachable_bytes",`Int (reachable root)]) roots)
      ; "counts", `Assoc
          [ "store_nodes",`Int (Lui_store.node_count store)
          ; "shallow_snapshots",`Int (Hashtbl.length Native_embed.shallow_cache)
          ; "subtree_snapshots",`Int (Hashtbl.length Native_embed.subtree_cache)
          ; "caption_layouts",`Int (Host_platform.Text.Cache.length text_engine.layouts)
          ; "editing_nodes",`Int (Hashtbl.length text_engine.editing_layouts)
          ; "page_signals",`Int (Hashtbl.length Subs_state.page_items)
          ; "journal_signals",`Int (Hashtbl.length Subs_state.journal_items)
          ; "property_areas",`Int (Hashtbl.length Properties_state.areas)
          ; "pending_split_actions",`Int (Queue.length Editor_actions.split_commits)
          ; "pending_edit_actions",`Int (Queue.length Editor_state.pending_edit_actions)
          ; "worker_reads",`Int (Hashtbl.length Worker_client.inflight_reads)
          ]
      ; "native_resources", `Assoc
          [ "software_backing_bytes", `Int
              (if use_cocoa then Native_window.software_owned_bytes (Sdl.get_window_id !win) else 0)
          ; "atlas_bytes",`Int (Bytes.length scene.mask_atlas.pix + Bytes.length scene.color_atlas.pix)
          ]
      ]);
  Daemon_client.boot_mark "loop";
  Fun.protect ~finally:finish_diagnostics (fun () ->
  while not !quit do
    let t0 = perf_s () in
    let allocation_requested = match allocation_path,allocation_trigger with
      | None,_ -> false
      | Some _,Some path -> not !allocation_done && Sys.file_exists path
      | Some _,None -> t0 -. allocation_started >= allocation_delay in
    (match allocation_path with
     | Some _ when allocation_requested && not !allocation_done && !allocation_profile = None ->
       start_allocation t0
     | Some _ when !allocation_profile <> None && not !allocation_done
         && (not allocation_requested || t0 -. !capture_started >= allocation_duration) ->
       finish_allocation ()
     | _ -> ());
    (match !previous_loop with
     | Some previous -> Host_metrics.record_phase metrics Loop_interval ((t0 -. previous) *. 1000.)
     | None -> ());
    previous_loop := Some t0;
    Lui_shell.pump ();
    (* See the raise_window note above: re-raise briefly after boot so a
       racing frontmost app cannot permanently steal input routing. *)
    (* First raise_window call blocks ~70ms on macOS; defer the
       boot-time re-raises until the journal frame has painted so
       they run off the critical path. *)
    if !raises_left > 0 && !frame >= 3 then begin
      decr raises_left;
      Daemon_client.boot_mark "raise begin";
      Sdl.raise_window !win;
      Daemon_client.boot_mark "raise win";
      native_activate ();
      Daemon_client.boot_mark "raise end"
    end;
    Host_interaction.advance_frame ui host ~now:(perf_s ())
      ~reduced_motion:(Native_window.reduced_motion ());
    let events_before = metrics.event_count in
    let events_started = perf_s () in
    if drain_events () > 0 then last_busy := t0;
    metrics.event_ms <- (perf_s () -. events_started) *. 1000.;
    let had_events = metrics.event_count > events_before in
    if had_events then Host_metrics.record_phase metrics Events metrics.event_ms;
    if !frame < 3 then Daemon_client.boot_mark "events drained";
    (* LOGSEQ_NATIVE_TREEDUMP=1: SIGUSR1 dumps the retained tree
       (id kind key class rect, indented) to the debug log. *)
    if Atomic.exchange dump_tree_flag false then begin
      Option.iter (fun path ->
        let body = Lui_host.scene host in
        let scene = match !cached_overlay with
          | Some (_,_,_,ops,glyphs,width) -> { body with ops; glyphs; width }
          | None -> body in
        Out_channel.with_open_bin path (fun channel ->
          Marshal.to_channel channel scene []);
        (* Preserve the same frame's inputs for direct-paint comparison.
           A screenshot alone cannot distinguish missing scene operations
           from stale backing pixels or incomplete theme delivery. *)
        let nodes = List.map (fun id ->
          id, hooks.layout id, hooks.state_of id, Ui.hidden ui store id,
          hooks.mounted_children id, hooks.scroll_of id)
          (Lui_store.preorder store) in
        let vars = Hashtbl.fold (fun name value values -> (name,value)::values)
          (Theme_vars.vars_of_mode !Theme_vars.mode) [] in
        Out_channel.with_open_bin (path ^ ".context") (fun channel ->
          Marshal.to_channel channel
            (store,nodes,!scale_cell,!Theme_vars.mode,!Theme_vars.accent,vars,
             !theme_gen_seen,!Theme_vars.generation,
             Native_window.presentable (Sdl.get_window_id !win),
             Lui_host.wants_repaint host,perf_s () -. !last_render) []);
        if use_cocoa then
          Out_channel.with_open_bin (path ^ ".bgra") (fun channel ->
            output_bytes channel (Native_window.software_read (Sdl.get_window_id !win))))
        (Sys.getenv_opt "LOGSEQ_NATIVE_SCENE_CAPTURE");
      dbg "icons=%d" (Host_icons.count ());
      let rec out depth id =
        let r = Rects.get rects id in
        let fprop name =
          match Lui_store.prop store id name with
          | Some (Lui_protocol.FloatValue v) ->
            Printf.sprintf " %s=%.4g" name v
          | Some (Lui_protocol.IntValue v) ->
            Printf.sprintf " %s=%d" name v
          | Some (Lui_protocol.StringValue v) ->
            Printf.sprintf " %s=%S" name v
          | _ -> ""
        in
        let extra =
          fprop "value" ^ fprop "grow" ^ fprop "role" ^ fprop "index"
          ^ fprop "offset" ^ fprop "height" ^ fprop "width"
          ^ fprop "orientation" ^ fprop "flex-wrap"
          ^ fprop "name" ^ fprop "icon" ^ fprop "text" ^ fprop "font-size"
          ^ fprop "font-weight" ^ fprop "opacity" ^ fprop "margin-left"
          ^ fprop "overflow"
          ^ (if Ui.scrollable store id then
               let raw = engine_rect id in
               Printf.sprintf " scroll-offset=%.1f scroll-cap=%.1f layout=%.1f,%.1f %.1fx%.1f"
                 (Ui.scroll_offset ui id) (Ui.scroll_cap ui id)
                 raw.Lui_scene.x raw.y raw.w raw.h
             else "")
          ^ (match Host_icons.resolved_name store id with
             | Some s -> " ires=" ^ s
             | None -> "")
        in
        dbg "%s%d %s key=%s class=%s%s %.0f,%.0f %.0fx%.0f"
          (String.make (2 * depth) ' ') id (Lui_store.kind store id)
          (Option.value (Lui_store.string_prop store id "key")
             ~default:"-")
          (Option.value
             (Lui_store.string_prop store id "style-class")
             ~default:"-")
          extra
          r.Lui_scene.x r.Lui_scene.y r.Lui_scene.w r.Lui_scene.h;
        List.iter (out (depth + 1)) (Lui_store.child_ids store id)
      in
      List.iter (out 0) (Lui_store.root_ids store);
      (* scene ops in the sidebar band — catches paint-time offsets the
         layout rects above cannot show *)
      (match !host_cell with
       | None -> ()
       | Some h ->
         let sc = Lui_host.scene h in
         List.iteri
           (fun i op ->
             let r =
               match op with
               | Lui_scene.Fill f -> Some f.Lui_scene.frect
               | Lui_scene.Push_clip c -> Some c.Lui_scene.crect
               | Lui_scene.Shadow s -> Some s.Lui_scene.srect
               | Lui_scene.Image im -> Some im.Lui_scene.irect2
               | _ -> None
             in
             match r with
             | Some r when r.Lui_scene.x < 420. && r.Lui_scene.w > 0.5 ->
               dbg "scene[%d] %.0f,%.0f %.0fx%.0f" i r.Lui_scene.x
                 r.Lui_scene.y r.Lui_scene.w r.Lui_scene.h
             | _ -> ())
           sc.Lui_scene.ops)
    end;
    (* OCaml worker threads poke wakeup() when the app mailbox fills —
       pump drains it on this entry thread; returned patches apply.
       Burst coalescing: each pump can enqueue more work (promise
       continuations), so keep pumping until the mailbox is quiet
       before paying for a repaint — otherwise every boot patch
       serializes a full paint into the pump path. *)
    let rec pump_all n =
      if n > 0 && Atomic.exchange Bridge.pending_wakeup false then begin
        last_busy := t0;
        let r = Native_embed.pump () in
        if !debug then warn "pump -> %d batches" (List.length r);
        apply_patches r;
        pump_all (n - 1)
      end
    in
    let had_mailbox = Atomic.get Bridge.pending_wakeup in
    let pump_started = perf_s () in
    pump_all 8;
    metrics.pump_ms <- (perf_s () -. pump_started) *. 1000.;
    if had_mailbox then Host_metrics.record_phase metrics Mailbox metrics.pump_ms;
    if !frame < 3 then Daemon_client.boot_mark "pumps drained";
    (* platform_request envelopes the app emitted are serviced here. *)
    let requests_started = perf_s () in
    Host_requests.drain ();
    Host_metrics.record_phase metrics Requests ((perf_s () -. requests_started) *. 1000.);
    let rev_now = Lui_store.revision store in
    if rev_now <> !last_rev then begin
      last_rev := rev_now; last_busy := t0
    end;
    let sync_acts = Ui.store_changed ui store in
    if sync_acts <> [] then last_busy := t0;
    apply_actions sync_acts;
    (* store_changed's dead-focus cleanup may have cleared Ui.focused
       for a remounted ed-sink with no batch pending to re-arm it *)
    if not (Keyboard_capture.active ()) then Host_requests.ensure_ed_focus ();
    let input_change = Text_engine.tick_input text_engine ui ~now:(perf_s ()) in
    (* Caret geometry is text-entry only, and only when the anchor
       moved. A non-editable focus must not run this every frame. *)
    let fid = Ui.focused ui in
    Native_window.request_text_input text_input
      (Ui.menu_input_active ui store
       || (fid <> 0 && text_entry (Lui_store.kind store fid)));
    if fid = 0 || not (text_entry (Lui_store.kind store fid)) then
      caret_key := None
    else begin
      let c = Ui.caret ui in
      let sh = Ui.shadow ui in
      let r = Rects.get rects fid in
      let ime = Ui.ime ui in
      let key = Some (fid, c, sh, ime.Lui_ime.marked_text, ime.cursor, ime.sel_len,
        r, !scale_cell, Lui_store.layout_rev store, Lui_host.invalidation_count host) in
      if key <> !caret_key then begin
        caret_key := key;
        apply_actions
          (handle_input (Input.Caret (caret_rect ())))
      end
    end;
    if !Theme_vars.generation <> !theme_gen_seen then begin
      theme_gen_seen := !Theme_vars.generation;
      native_menu_theme (!Theme_vars.mode = Lui_theme.Dark);
      Lui_host.invalidate_paint host;
      Lui_host.invalidate_layout host;
      host_req_repaint := true
    end;
    let ordinary_dirty = Ui.want_frame ui host || !host_req_repaint in
    (match input_change with
     | Some id -> Lui_host.note_paint host id; host_req_repaint := true
     | None -> ());
    let can_present = Native_window.presentable (Sdl.get_window_id !win) in
    (* Exercise the real embedded app, its layout, and every viewport pixel
       while occluded. Visibility exports remain truthful; this diagnostic
       does not establish visible presentation FPS or input acceptance. *)
    if continuous_replay then Option.iter Lui_raster.Tile_renderer.invalidate cocoa_tiles;
    let dirty = Host_interaction.should_paint ~replay:replay_mode ~visible:can_present
      ~backing:use_cocoa ~dirty:(Ui.want_frame ui host || !host_req_repaint) in
    let retry = presentation.Host_interaction.pending in
    if dirty then begin
      paint_frame ();
      (* A caret blink must not keep the loop in its post-input fast poll. *)
      if ordinary_dirty then last_busy := t0;
      last_render := perf_s ();
      if !debug then
        dbg "frame %d ops=%d" !frame
          (List.length (Lui_host.scene host).Lui_scene.ops);
    end
    else if Host_interaction.can_render ~replay:replay_mode ~visible:can_present
        ~backing:use_cocoa && (Host_interaction.presentation_due presentation
             || Host_metrics.panel_due metrics ~now:(perf_s ()) ~last_render:!last_render)
        && (match metal with Some m -> Lui_metal.ready m | None -> true) then begin
      last_render := perf_s ();
      ignore (renderer_live.Lui_host.render (Lui_host.scene host));
      if !gl_live_cell then Sdl.gl_swap_window !win
    end;
    (match metal with
     | Some m -> Host_metrics.record_display_count metrics ~now:(perf_s ())
         ~presented:(Lui_metal.presented_frames m)
     | None -> ());
    let work_ms = (perf_s () -. t0) *. 1000. in
    if dirty || had_events || had_mailbox || (retry && not presentation.pending)
    then Host_metrics.record_phase metrics Active_frame work_ms;
    Host_metrics.record_present metrics ~now:(perf_s ()) ~work_ms;
    let now = perf_s () in
    (match memory_replay_duration with
     | Some duration when now -. memory_replay_started >= duration -> quit := true
     | _ -> ());
    if now -. !last_metrics_export >= 1. then begin
      last_metrics_export := now;
      publish_native_performance ();
      metrics.raster_background_domains <- raster_background_domains ();
      if Host_platform.is_macos && Option.is_some metrics_log then begin
        let footprint_bytes,rss_bytes,peak_footprint_bytes = Native_window.memory_usage () in
        let pixel_width,pixel_height = drawable () in
        metrics.process_memory <- Some {footprint_bytes; rss_bytes; peak_footprint_bytes;
          window_visible=Native_window.presentable (Sdl.get_window_id !win);
          width= !win_w; height= !win_h; pixel_width; pixel_height}
      end;
      (match metal with
       | Some m ->
           let total, values = Lui_metal.presentation_samples m in
           Host_metrics.record_presentation_samples metrics ~total values
       | None -> ());
      Option.iter (fun channel ->
        Host_metrics.write_snapshot channel metrics ~now;
        output_char channel '\n'; flush channel) metrics_log
    end;
    (let iter_ms = (perf_s () -. t0) *. 1000. in
     if iter_ms > 20. then
       Daemon_client.boot_mark (Printf.sprintf "iter %.0fms" iter_ms));
    (let now = perf_s () in
     if mem_trace && now -. !mem_mark > 2.0 then begin
       mem_mark := now;
       let st = Gc.quick_stat () in
       let scene = Lui_host.scene host in
       let software_bytes = if use_cocoa then
           Native_window.software_owned_bytes (Sdl.get_window_id !win) else 0 in
       Printf.eprintf
         "[mem f=%d live=%dMB heap=%dMB free=%dMB top=%dMB nodes=%d slots=%d layouts=%d edit_layouts=%d edit_nodes=%d metric_layouts=%d metric_labels=%d snapshots=%d subtrees=%d handles=%d raster_background_domains=%d software_bytes=%d atlas_bytes=%d]\n%!"
         !frame
         (st.Gc.live_words * 8 / 1048576)
         (st.Gc.heap_words * 8 / 1048576)
         (st.Gc.free_words * 8 / 1048576)
         (st.Gc.top_heap_words * 8 / 1048576)
         (Lui_store.node_count store)
         (Hashtbl.length text_engine.Text_engine.slots)
         (Host_platform.Text.Cache.length text_engine.layouts)
         (Hashtbl.fold (fun _ (_,cache) total -> total + Host_platform.Text.Cache.length cache)
            text_engine.editing_layouts 0)
         (Hashtbl.length text_engine.editing_layouts)
         (Host_platform.Text.Cache.length metrics_text_engine.layouts)
         (Hashtbl.length metrics_labels)
         (Hashtbl.length Native_embed.shallow_cache)
         (Hashtbl.length Native_embed.subtree_cache)
         (Ui_dom_native.Element_handles.length Ui_dom_native.tokens)
         (raster_background_domains ())
         software_bytes
         (Bytes.length scene.mask_atlas.pix + Bytes.length scene.color_atlas.pix)
     end);
    let now = perf_s () in
    match Host_metrics.idle_timeout ~dirty ~now ~last_busy:!last_busy with
    | Some timeout ->
        if not can_present || not presentation.pending then Option.iter Lui_metal.trim metal;
        (* SDL input and bridge notifications interrupt this wait. Keep the
           Linux shell pump and pending presentations at their existing
           cadence; an open metrics panel refreshes four times a second. *)
        let timeout =
          if not Host_platform.is_macos || (can_present && presentation.pending) then 16
          else if metrics.panel_open then 250
          else timeout in
        let timeout = match Text_engine.input_deadline text_engine with
          | None -> timeout
          | Some deadline -> min timeout
              (max 1 (int_of_float (ceil ((deadline -. now) *. 1000.)))) in
        ignore (Sdl.wait_event_timeout None timeout)
    | None when not vsync ->
        frame_deadline := Host_metrics.next_deadline ~previous:!frame_deadline ~now;
        let remaining = !frame_deadline -. now in
        if remaining > 0. then Thread.delay remaining
    | None when not dirty -> Sdl.delay 1l
    | None -> ()

  done);
  Option.iter close_out metrics_log;
  Native_window.dispose !win;
  Option.iter Lui_raster.Tile_renderer.release cocoa_tiles;
  ignore (Native_embed.dispose ());
  (match !gctx_cell with
   | Some c -> Sdl.gl_delete_context c
   | None -> ());
  Sdl.destroy_window !win;
  Sdl.quit ()
