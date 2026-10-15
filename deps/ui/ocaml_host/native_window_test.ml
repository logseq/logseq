open Lui_protocol

let check message condition = if not condition then failwith message
external blend_titlebar : unit -> unit = "logseq_native_titlebar_blend"
external input_chain : int -> bool = "logseq_native_input_chain"
let physical_footprint () =
  let footprint,rss,peak = Native_window.memory_usage () in
  check "Native SDK memory sample has invalid physical, resident, or peak bytes"
    (footprint > 0 && rss > 0 && peak >= footprint);
  footprint

external sidebar_vibrancy : float -> float -> float -> float -> bool -> unit = "logseq_native_sidebar_vibrancy"
external sidebar_hit : int -> bool = "logseq_native_sidebar_hit"
external window_opaque : int -> bool = "logseq_native_window_opaque"
external has_sidebar_material : int -> bool = "logseq_native_has_sidebar_material"

let software_memory_regression () =
  let sdl_ok = function Ok x -> x | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window = sdl_ok (Tsdl.Sdl.create_window "Native software memory regression"
    ~w:1440 ~h:900 Tsdl.Sdl.Window.allow_highdpi) in
  let id = Tsdl.Sdl.get_window_id window in
  Native_window.software_begin id (2880,1800,64);
  let band = Bytes.make (2880*64*4) '\255' in
  let event = Tsdl.Sdl.Event.create () in
  let peak = ref 0 in
  for frame=0 to 119 do
    for index=0 to 28 do
      let y=index*64 in
      Native_window.software_tile id (y,min 64 (1800-y),2880*4,band)
    done;
    Native_window.software_present id;
    while Tsdl.Sdl.poll_event (Some event) do () done;
    let footprint,rss,lifetime_peak = Native_window.memory_usage () in
    peak := Int.max !peak lifetime_peak;
    check "Software presentation exceeded the external 200 MB safety limit"
      (footprint <= 200_000_000 && rss <= 200_000_000);
    Unix.sleepf (1. /. 120.)
  done;
  Printf.printf "Full-size software presentation peak: %d bytes\n%!" !peak;
  Native_window.software_dispose id;
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ();
  check "Software presentation exceeded its 100 MB isolation budget"
    (!peak <= 100_000_000)

let software_scene_replay ~tiled path duration =
  let scene : Lui_scene.t = In_channel.with_open_bin path Marshal.from_channel in
  let sdl_ok = function Ok x -> x | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window = sdl_ok (Tsdl.Sdl.create_window "Native scene replay"
    ~w:1440 ~h:900 Tsdl.Sdl.Window.allow_highdpi) in
  let id = Tsdl.Sdl.get_window_id window in
  let rows = if tiled then Lui_raster.Tile_renderer.band_height else scene.height in
  Native_window.software_begin id (scene.width,scene.height,rows);
  let upload_seconds = ref 0. in
  let upload y height (image : Lui_raster.Image.t) =
    let before = Unix.gettimeofday () in
    Native_window.software_tile id (y,height,image.stride,image.pix);
    upload_seconds := !upload_seconds +. (Unix.gettimeofday () -. before) in
  let draw,release =
    if tiled then begin
      let renderer = Lui_raster.Tile_renderer.create () in
      ((fun () -> Lui_raster.Tile_renderer.render ~workers:4 renderer scene
          ~emit:(fun area image -> upload area.Lui_scene.y0 (area.y1-area.y0) image)),
       (fun () -> Lui_raster.Tile_renderer.release renderer))
    end else begin
      let renderer = Lui_raster.Renderer.create () in
      ((fun () ->
          ignore (Lui_raster.Renderer.render ~workers:4 renderer scene);
          upload 0 scene.height (Lui_raster.Renderer.image renderer)),
       (fun () -> Lui_raster.Renderer.release renderer))
    end in
  let glyphs = scene.glyphs in
  let event = Tsdl.Sdl.Event.create () in
  let started = Unix.gettimeofday () in
  let capacity = int_of_float (Float.ceil (duration *. 120.)) + 1 in
  let samples = Array.make capacity 0.
  and draw_samples = Array.make capacity 0.
  and present_samples = Array.make capacity 0. in
  let frame = ref 0 and peak = ref 0 in
  while Unix.gettimeofday () -. started < duration do
    scene.glyphs <- List.map (fun (glyph : Lui_scene.glyph) ->
      {glyph with gy=glyph.gy -. float (!frame mod 10)}) glyphs;
    Lui_scene.touch scene;
    let before = Unix.gettimeofday () in
    upload_seconds := 0.;
    draw ();
    let drawn = Unix.gettimeofday () in
    Native_window.software_present id;
    let presented = Unix.gettimeofday () in
    check "Scene replay exceeded its paced sample capacity" (!frame < capacity);
    samples.(!frame) <- (presented -. before) *. 1000.;
    draw_samples.(!frame) <- (drawn -. before -. !upload_seconds) *. 1000.;
    present_samples.(!frame) <- (presented -. drawn +. !upload_seconds) *. 1000.;
    while Tsdl.Sdl.poll_event (Some event) do () done;
    let footprint,rss,lifetime_peak = Native_window.memory_usage () in
    peak := Int.max !peak lifetime_peak;
    check "Scene replay exceeded the external 200 MB safety limit"
      (footprint <= 200_000_000 && rss <= 200_000_000);
    incr frame;
    let remaining = 1. /. 120. -. (Unix.gettimeofday () -. before) in
    if remaining > 0. then Unix.sleepf remaining
  done;
  let percentile p values =
    let values = Array.sub values 0 !frame in
    Array.sort Float.compare values;
    values.(int_of_float (p *. float (Array.length values-1))) in
  Printf.printf "Native OCaml %s %dx%d replay tiled=%b frames=%d seconds=%.3f physical_peak=%d visible=%b\n\
                 total p50=%.3f p95=%.3f p99=%.3f draw_p95=%.3f present_p95=%.3f\n%!"
    Sys.ocaml_version scene.width scene.height tiled !frame (Unix.gettimeofday () -. started) !peak
    (Native_window.presentable id) (percentile 0.5 samples) (percentile 0.95 samples)
    (percentile 0.99 samples) (percentile 0.95 draw_samples) (percentile 0.95 present_samples);
  Native_window.software_dispose id;
  release ();
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ()

let () =
  if Array.length Sys.argv = 4 &&
    (Sys.argv.(1) = "--software-replay" || Sys.argv.(1) = "--software-tile-replay") then begin
    software_scene_replay ~tiled:(Sys.argv.(1) = "--software-tile-replay")
      Sys.argv.(2) (float_of_string Sys.argv.(3));
    exit 0
  end

let () =
  if Array.length Sys.argv = 2 && Sys.argv.(1) = "--software-memory" then begin
    software_memory_regression ();
    exit 0
  end

let () =
  if Host_platform.is_macos then begin
    let status = Unix.system (Filename.quote Sys.executable_name ^ " --software-memory") in
    check "Cold full-size software presentation memory regression"
      (status = Unix.WEXITED 0)
  end;
  let store = Lui_store.create () in
  List.iter (Lui_store.apply_op store)
    [CreateNode (1, Row); SetProp (1, DataAttrs, StringValue {|{"data-window-titlebar":"true"}|});
     CreateNode (2, Button); InsertChild (1,2,0)];
  let rect_of = function
    | 1 -> Lui_scene.rect 0. 0. 800. 96.
    | _ -> Lui_scene.rect 16. 16. 64. 64. in
  let regions = Native_window.drag_regions ~store ~rect_of ~scale:2. ~blocked:[] in
  let draggable x y =
    let rec find i =
      if i = Array.length regions then false
      else if x >= regions.(i+1) && y >= regions.(i+2)
        && x < regions.(i+1) +. regions.(i+3)
        && y < regions.(i+2) +. regions.(i+4) then regions.(i)=1.
      else find (i+5) in find 0 in
  check "Header button became a window drag area" (not (draggable 20. 20.));
  check "Header blank space cannot drag the window" (draggable 200. 20.);
  check "Document content became a window drag area" (not (draggable 200. 100.));
  let sdl_ok = function Ok x -> x | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window = sdl_ok (Tsdl.Sdl.create_window "Native window regression"
      ~w:400 ~h:300 Tsdl.Sdl.Window.hidden) in
  check "An invisible window is eligible for rendering"
    (not (Native_window.presentable (Tsdl.Sdl.get_window_id window)));
  if Host_platform.is_macos then begin
    check "SDL listener is missing before titlebar customization"
      (input_chain (Tsdl.Sdl.get_window_id window));
    blend_titlebar ();
    check "Titlebar customization detached SDL's mouse event responder"
      (input_chain (Tsdl.Sdl.get_window_id window));
    let window_id = Tsdl.Sdl.get_window_id window in
    sidebar_vibrancy 0. 0. 0. 300. false;
    check "Collapsed startup created an unused sidebar material"
      (not (has_sidebar_material window_id));
    check "Collapsed startup enabled transparent window composition" (window_opaque window_id);
    sidebar_vibrancy 0. 0. 100. 300. true;
    check "Opening the sidebar did not create its material" (has_sidebar_material window_id);
    check "Visible sidebar lost transparent material composition" (not (window_opaque window_id));
    check "Decorative sidebar material intercepts mouse gestures"
      (not (sidebar_hit (Tsdl.Sdl.get_window_id window)));
    sidebar_vibrancy 0. 0. 0. 300. false;
    check "Closing the sidebar left the complete window transparent" (window_opaque window_id);
    check "Closing the sidebar retained unused material resources"
      (not (has_sidebar_material window_id));
    sidebar_vibrancy 0. 0. 100. 300. true;
    check "Reopening the sidebar did not restore transparent composition"
      (not (window_opaque window_id));
    Native_window.software_begin window_id (17,131,64);
    let band = Bytes.make (17 * 64 * 4) '\255' in
    List.iter (fun y ->
      Native_window.software_tile window_id (y,min 64 (131-y),17*4,band)) [0;64;128];
    check "Software window did not own its complete pixel snapshot"
      (let owned = Native_window.software_owned_bytes window_id in
       owned >= 17 * 131 * 4 && owned <= 3 * 16384);
    Bytes.fill band 0 (Bytes.length band) '\000';
    Gc.full_major ();
    check "Software image still references the caller's reusable band"
      (Bytes.get (Native_window.software_read window_id) 0 = '\255');
    Native_window.software_present window_id;
    check "Software view detached SDL's input responder" (input_chain window_id);
    check "Software view intercepts native mouse gestures"
      (not (Native_window.software_hit window_id));
    Native_window.software_begin window_id (9,73,64);
    check "Software resize retained old full-size images"
      (Native_window.software_owned_bytes window_id = 0);
    let resized = Bytes.make (9 * 64 * 4) '\128' in
    List.iter (fun y ->
      Native_window.software_tile window_id (y,min 64 (73-y),9*4,resized)) [0;64];
    check "Software resize has incomplete pixels"
      (Native_window.software_read window_id = Bytes.make (9*73*4) '\128');
    Native_window.software_present window_id;
    let update = Bytes.init (9*64*4) (fun i -> Char.chr ((i*13+7) land 255)) in
    Native_window.software_tile window_id (64,9,9*4,update);
    let expected = Bytes.make (9*73*4) '\128' in
    Bytes.blit update 0 expected (9*64*4) (9*9*4);
    Bytes.fill update 0 (Bytes.length update) '\000';
    Native_window.software_present window_id;
    check "Partial software update lost unchanged bands or borrowed mutable bytes"
      (Native_window.software_read window_id = expected);
    Native_window.software_begin window_id (9,73,64);
    Native_window.software_present window_id;
    check "An unchanged software frame lost its retained pixels"
      (Native_window.software_read window_id = expected);
    Native_window.software_dispose window_id;
    check "Software disposal retained pixel ownership"
      (Native_window.software_owned_bytes window_id = 0);
    let width,height = Tsdl.Sdl.gl_get_drawable_size window in
    let before_metal = physical_footprint () in
    let renderer = match Lui_metal.init_window (Tsdl.Sdl.unsafe_ptr_of_window window) with
      | Ok renderer -> renderer | Error message -> failwith message in
    let errors = ref [] in
    let verify message condition = if not condition then errors := message :: !errors in
    let cold_peak = ref (physical_footprint ()) in
    for _ = 1 to 5 do
      Unix.sleepf 0.1;
      cold_peak := Int.max !cold_peak (physical_footprint ())
    done;
    Printf.printf "Invisible Metal initialization added %d physical bytes\n%!"
      (!cold_peak - before_metal);
    verify "Invisible Metal initialization exceeds its 20 MB memory budget"
      (!cold_peak - before_metal <= 20_000_000);
    verify "Native window retains a third drawable"
      (Lui_metal.drawable_count renderer = 2);
    verify "Window initialization allocates a duplicate frame target"
      (Lui_metal.owned_target_bytes renderer = 0);
    verify "Window initialization reserves full-sized drawables before its first frame"
      (Lui_metal.drawable_size renderer = Some (1,1));
    let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:8 ~h:8)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:8 ~h:8) in
    scene.width <- width; scene.height <- height;
    scene.clear <- Lui_scene.color 255 0 0 255;
    Lui_metal.render renderer scene;
    let before = Lui_metal.read_frame renderer ~w:width ~h:height in
    verify "Window rendering retains a duplicate frame target"
      (Lui_metal.owned_target_bytes renderer = 0);
    Lui_metal.trim renderer;
    Lui_metal.trim renderer;
    verify "Idle window retains full-sized spare drawables"
      (Lui_metal.drawable_size renderer = Some (1,1));
    verify "Trimming discarded the rendered frame"
      (Lui_metal.read_frame renderer ~w:width ~h:height = before);
    scene.clear <- Lui_scene.color 0 255 0 255;
    Lui_metal.render renderer scene;
    verify "Rendering after idle did not restore the original drawable size"
      (Lui_metal.drawable_size renderer = Some (width,height));
    let restored = Lui_metal.read_frame renderer ~w:width ~h:height in
    verify "Rendering after idle did not update the complete frame"
      (Bytes.get restored 1 = '\255' && Bytes.get restored (Bytes.length restored - 3) = '\255');
    Lui_metal.trim renderer;
    scene.width <- width / 2; scene.height <- height / 2;
    Lui_metal.render renderer scene;
    verify "Resize after idle retained old drawable dimensions"
      (Lui_metal.drawable_size renderer = Some (scene.width,scene.height));
    ignore (Lui_metal.read_frame renderer ~w:scene.width ~h:scene.height);
    verify "Window resize allocates a duplicate frame target"
      (Lui_metal.owned_target_bytes renderer = 0);
    Lui_metal.release renderer;
    List.iter prerr_endline (List.rev !errors);
    check "Native drawable memory regression" (!errors = [])
  end;
  Tsdl.Sdl.start_text_input ();
  let input = Native_window.text_input () in
  Native_window.hold_pointer input true;
  Native_window.request_text_input input false;
  check "Focus loss changes the AppKit responder between mouse down and up"
    (Tsdl.Sdl.is_text_input_active ());
  Native_window.hold_pointer input false;
  check "Text input remains active after the pointer gesture finishes"
    (not (Tsdl.Sdl.is_text_input_active ()));
  Native_window.hold_pointer input true;
  Native_window.request_text_input input true;
  Native_window.request_text_input input false;
  Native_window.hold_pointer input false;
  check "A cancelled focus transition starts stale text input"
    (not (Tsdl.Sdl.is_text_input_active ()));
  let repaints = ref 0 in
  Native_window.install window (fun () -> incr repaints);
  let event = Tsdl.Sdl.Event.create () in
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.typ Tsdl.Sdl.Event.window_event;
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.window_window_id (Tsdl.Sdl.get_window_id window);
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.window_event_id Tsdl.Sdl.Event.window_event_exposed;
  ignore (sdl_ok (Tsdl.Sdl.push_event event));
  check "Live resize waits for the blocked polling loop before painting" (!repaints=1);
  Native_window.dispose window;
  ignore (sdl_ok (Tsdl.Sdl.push_event event));
  check "Disposed window retained its live resize callback" (!repaints=1);
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ();
  print_endline "native window drag and live resize: OK"
