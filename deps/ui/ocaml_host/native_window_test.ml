open Lui_protocol

let check message condition = if not condition then failwith message
external blend_titlebar : unit -> unit = "logseq_native_titlebar_blend"
external input_chain : int -> bool = "logseq_native_input_chain"
external expose_unlocked : int -> unit = "logseq_native_test_expose_unlocked"
external install_menus : unit -> unit = "logseq_native_install_menus"
external menu_action : int -> bool -> unit = "logseq_native_test_menu_action"

let menu_runtime_regression () =
  if Host_platform.is_macos then begin
    let calls = ref [] in
    Callback.register "ocaml_host_menu_command" (fun tag ->
      ignore (Sys.opaque_identity (Bytes.make 4096 'x'));
      Gc.minor ();
      calls := tag :: !calls;
      if tag = 101 then menu_action 102 false);
    install_menus ();
    menu_action 101 false;
    check "Nested menu dispatch lost its runtime lock" (!calls = [102;101]);
    menu_action 103 true;
    check "An idle menu action did not reacquire the runtime" (!calls = [103;102;101]);
    menu_action 104 false;
    Gc.minor ();
    check "Idle menu dispatch left the runtime in the wrong state" (!calls = [104;103;102;101]);
    print_endline "native menu runtime boundary: OK"
  end
let physical_footprint () =
  let footprint,rss,peak = Native_window.memory_usage () in
  check "Native SDK memory sample has invalid physical, resident, or peak bytes"
    (footprint > 0 && rss > 0 && peak >= footprint);
  footprint

external sidebar_vibrancy : float -> float -> float -> float -> bool -> unit = "logseq_native_sidebar_vibrancy"
external sidebar_hit : int -> bool = "logseq_native_sidebar_hit"
external window_opaque : int -> bool = "logseq_native_window_opaque"
external software_composite : int -> bytes = "logseq_native_software_composite"
external software_image_ids : int -> int array = "logseq_native_software_image_ids"
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

let software_band_compression_regression id =
  let width=2048 and height=131 and rows=64 in
  let budget_errors=ref [] in
  let budget message condition = if not condition then budget_errors := message :: !budget_errors in
  Native_window.software_begin id (width,height,rows);
  let pixel buffer at (b,g,r,a) =
    List.iteri (fun channel value -> Bytes.set buffer (at+channel) (Char.chr value)) [b;g;r;a] in
  let fill color =
    let result=Bytes.create (width*height*4) in
    for i=0 to width*height-1 do pixel result (i*4) color done;
    result in
  let upload expected =
    for index=0 to (height+rows-1)/rows-1 do
      let y=index*rows and count=min rows (height-index*rows) in
      Native_window.software_tile id (y,count,width*4,
        Bytes.sub expected (y*width*4) (count*width*4))
    done;
    Native_window.software_present id;
    Gc.full_major ();
    check "Compressed bands changed retained pixels"
      (Native_window.software_read id = expected);
    let actual=software_composite id in
    if actual <> expected then begin
      let first=ref 0 in
      while !first < Bytes.length expected && Bytes.get expected !first = Bytes.get actual !first do incr first done;
      Printf.eprintf "Composited band mismatch at byte %d: expected=%d actual=%d\n%!"
        !first (Char.code (Bytes.get expected !first)) (Char.code (Bytes.get actual !first));
      failwith "Compressed Core Animation layers changed displayed pixels"
    end in
  List.iter (fun color ->
    let expected=fill color in
    upload expected;
    let owned=Native_window.software_owned_bytes id in
    Printf.printf "Uniform band snapshot owned %d bytes\n%!" owned;
    budget "Uniform backgrounds allocate image backing storage" (owned = 0)
  ) [255,255,255,255;0,0,0,0;31,47,63,128;37,99,235,255;1,0,1,1;254,127,63,254];
  List.iter (fun (left,right) ->
    let expected=fill (31,47,63,128) in
    for y=0 to height-1 do
      for x=left to right-1 do
        pixel expected ((y*width+x)*4)
          (if y mod 3=0 then (0,0,0,0) else (7,y mod 97,19,128))
      done
    done;
    upload expected;
    let owned=Native_window.software_owned_bytes id in
    Printf.printf "Sparse band snapshot [%d,%d) owned %d bytes\n%!" left right owned;
    budget "Sparse band ownership includes uniform margins" (owned <= 131_072)
  ) [700,720;0,20;width-20,width];
  List.iter (fun (first,last,limit) ->
    let expected=fill (31,47,63,128) in
    for y=0 to height-1 do
      List.iter (fun left ->
        for x=left to left+19 do
          pixel expected ((y*width+x)*4)
            (if y mod 3=0 then (0,0,0,0) else (7,y mod 97,19,128))
        done
      ) [first;last]
    done;
    upload expected;
    let owned=Native_window.software_owned_bytes id in
    Printf.printf "Separated band snapshots [%d,%d] owned %d bytes\n%!" first last owned;
    budget "Separated content retains its empty horizontal gap" (owned <= limit)
  ) [0,width-20,131_072;100,width-120,147_456];
  List.iter (fun (outside,inside,opposite) ->
    List.iter (fun textured ->
      let expected=fill outside in
      for y=0 to height-1 do
        for x=600 to width-601 do
          pixel expected ((y*width+x)*4) inside
        done;
        for x=width-600 to width-1 do
          pixel expected ((y*width+x)*4) opposite
        done;
        if textured then List.iter (fun left ->
          for x=left to left+19 do
            pixel expected ((y*width+x)*4)
              (if y mod 3=0 then (0,0,0,0) else (7,y mod 97,19,128))
          done) [600;width-620]
      done;
      upload expected;
      let owned=Native_window.software_owned_bytes id in
      Printf.printf "Multicolor band textured=%b owned %d bytes\n%!" textured owned;
      budget "Different solid colors are retained as pixel images"
        (owned <= if textured then 147_456 else 0);
      let identities=software_image_ids id in
      upload expected;
      budget "Unchanged multicolor bands replace presentation resources"
        (software_image_ids id=identities);
      pixel expected ((65*width+width/2)*4) opposite;
      upload expected
    ) [false;true]
  ) [(127,127,127,255),(255,255,255,255),(127,127,127,255);
     (127,127,127,255),(255,255,255,255),(37,99,235,255);
     (31,47,63,128),(7,19,31,64),(0,0,0,0)];
  let stripes=Bytes.init (width*height*4) (fun i ->
    let x=(i/4) mod width in
    if i mod 4=3 then '\255' else Char.chr ((x*13+i mod 4*17) land 255)) in
  upload stripes;
  let dense=Bytes.init (width*height*4) (fun i ->
    if i mod 4=3 then '\255' else Char.chr ((i*13+i/width) land 255)) in
  upload dense;
  upload (fill (0,0,0,0));
  budget "Uniform replacement retains the previous dense images"
    (Native_window.software_owned_bytes id = 0);
  Native_window.software_dispose id;
  List.iter prerr_endline (List.rev !budget_errors);
  check "Software band memory regression" (!budget_errors = [])

let software_upload_budget () =
  let sdl_ok = function
    | Ok value -> value
    | Error (`Msg message) -> failwith message
  in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window =
    sdl_ok
      (Tsdl.Sdl.create_window "Native software upload budget" ~w:1440 ~h:932
         Tsdl.Sdl.Window.hidden)
  in
  Fun.protect
    ~finally:(fun () ->
      Tsdl.Sdl.destroy_window window;
      Tsdl.Sdl.quit ())
    (fun () ->
      let id = Tsdl.Sdl.get_window_id window in
      let width = 2880 and height = 1864 and rows = 64 in
      Native_window.software_begin id (width, height, rows);
      Fun.protect
        ~finally:(fun () -> Native_window.software_dispose id)
        (fun () ->
          let within_budget = ref true in
          let measure label ~dense ~flat budget_ms =
            let tiles =
              Array.init 2 (fun frame ->
                  Bytes.init
                    (width * rows * 4)
                    (fun offset ->
                      let channel = offset mod 4 in
                      let x = offset / 4 mod width
                      and y = offset / (width * 4) in
                      let ink =
                        dense
                        || (not flat)
                           && ((x >= 200 && x < 224) || (x >= 2656 && x < 2680))
                      in
                      Char.chr
                        (if channel = 3 then 255
                         else if ink then
                           ((y * 13) + (channel * 17) + frame) land 127
                         else if x >= 224 && x < 2656 then 254 - frame
                         else 126 + frame)))
            in
            let samples = Array.make 40 0. in
            for frame = 0 to 43 do
              let tile = tiles.(frame mod 2) in
              let before = Unix.gettimeofday () in
              for band = 0 to ((height + rows - 1) / rows) - 1 do
                let y = band * rows in
                Native_window.software_tile id
                  (y, min rows (height - y), width * 4, tile)
              done;
              let elapsed = (Unix.gettimeofday () -. before) *. 1000. in
              Native_window.software_present id;
              if frame >= 4 then samples.(frame - 4) <- elapsed
            done;
            let pixels = Native_window.software_read id in
            check "Upload budget fixture changed the retained image size"
              (Bytes.length pixels = width * height * 4);
            for band = 0 to ((height + rows - 1) / rows) - 1 do
              let y = band * rows
              and count = min rows (height - (band * rows)) in
              check "Upload budget fixture changed retained pixels"
                (Bytes.sub pixels (y * width * 4) (count * width * 4)
                = Bytes.sub tiles.(1) 0 (count * width * 4))
            done;
            Array.sort Float.compare samples;
            let p95 = samples.(37) in
            Printf.printf
              "Native full-window %s upload p50=%.3f p95=%.3f ms (budget %.1f)\n\
               %!"
              label samples.(19) p95 budget_ms;
            within_budget := !within_budget && p95 <= budget_ms
          in
          (* Upload budgets reserve the rest of the 8.33 ms frame for rendering.
             Dense pixels also require immutable full-width surface copies. *)
          measure "sparse" ~dense:false ~flat:false 2.;
          measure "dense" ~dense:true ~flat:false 3.;
          measure "flat" ~dense:false ~flat:true 1.;
          check "Native band upload exceeds its frame-budget share"
            !within_budget;
          check "Native upload fixture exceeded the physical-memory guard"
            (physical_footprint () <= 200_000_000)))

let software_band_reuse_regression id =
  let width=2048 and height=131 and rows=64 in
  let errors=ref [] in
  let verify message condition = if not condition then errors := message :: !errors in
  Native_window.software_begin id (width,height,rows);
  let upload bytes =
    for index=0 to (height+rows-1)/rows-1 do
      let y=index*rows and count=min rows (height-index*rows) in
      Native_window.software_tile id (y,count,width*4,
        Bytes.sub bytes (y*width*4) (count*width*4))
    done in
  List.iter (fun pattern ->
    let expected=Bytes.init (width*height*4) (fun index ->
      let channel=index mod 4 and x=(index/4) mod width and y=index/(width*4) in
      let colored=pattern=2 || (pattern=1 && (x<20 || x>=width-20)) in
      Char.chr (if channel=3 then 128 else if colored then (x+y+channel*17) mod 128 else 31)) in
    upload expected;
    let ids=software_image_ids id in
    check "Software identity fixture did not allocate its snapshot" (Array.exists ((<>) 0) ids);
    for _=1 to 4 do
      upload expected;
      verify "Identical band replaced an immutable presentation image"
        (software_image_ids id=ids)
    done;
    Native_window.software_present id;
    check "Repeated uploads before presentation changed displayed pixels"
      (software_composite id=expected);
    check "Repeated uploads changed retained pixels" (Native_window.software_read id=expected);
    upload expected;
    verify "Identical presented bands replaced their resources" (software_image_ids id=ids);
    let before_update=software_image_ids id in
    (* Change the last pixel in the short final band, then upload it twice
       before presenting: an equal upload must preserve pending changes. *)
    Bytes.set expected (Bytes.length expected-4) '\007';
    let last_y=128 in
    let last=Bytes.sub expected (last_y*width*4) ((height-last_y)*width*4) in
    Native_window.software_tile id (last_y,height-last_y,width*4,last);
    let changed=software_image_ids id in
    check "Changed pixels retained every previous image identity" (changed<>before_update);
    Native_window.software_tile id (last_y,height-last_y,width*4,last);
    verify "A repeated pending update replaced its resources" (software_image_ids id=changed);
    for i=0 to 9 do
      verify "Updating the last band replaced an unrelated band" (changed.(i)=before_update.(i))
    done;
    Native_window.software_present id;
    check "A repeated pending update lost the changed final pixel"
      (software_composite id=expected && Native_window.software_read id=expected);
    let before_background=software_image_ids id in
    let at=(65*width+width/2)*4+1 in
    Bytes.set expected at (Char.chr ((Char.code (Bytes.get expected at)+1) mod 128));
    let middle=Bytes.sub expected (64*width*4) (64*width*4) in
    Native_window.software_tile id (64,64,width*4,middle);
    let changed_background=software_image_ids id in
    check "Changed background pixels retained every previous identity"
      (changed_background<>before_background);
    Native_window.software_tile id (64,64,width*4,middle);
    verify "A repeated background update replaced its resources"
      (software_image_ids id=changed_background);
    Native_window.software_present id;
    check "A repeated background update lost its changed pixel"
      (software_composite id=expected && Native_window.software_read id=expected)
  ) [0;1;2];
  List.iter prerr_endline (List.rev !errors);
  check "Immutable software band reuse failed" (!errors=[]);
  print_endline "native immutable software band reuse: OK"

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

let expose_notification_child () =
  let sdl_ok = function Ok value -> value | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window=sdl_ok (Tsdl.Sdl.create_window "Native expose notification regression"
    ~w:64 ~h:64 Tsdl.Sdl.Window.hidden) in
  let ready=Atomic.make 0 in
  Native_window.install window (fun () ->
    Atomic.incr ready;
    Thread.delay 0.002);
  let notifier=Thread.create (fun () ->
    for turn=1 to 20 do
      while Atomic.get ready < turn do Thread.yield () done;
      Bridge.notify_event_loop ()
    done) () in
  for _=1 to 20 do expose_unlocked (Tsdl.Sdl.get_window_id window) done;
  Thread.join notifier;
  check "Expose notifications lost a repaint" (Atomic.get ready=20);
  Native_window.dispose window;
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ()

let expose_notification_regression () =
  let child=Unix.create_process Sys.executable_name
    [|Sys.executable_name;"--expose-notification"|] Unix.stdin Unix.stdout Unix.stderr in
  let deadline=Unix.gettimeofday () +. 5. in
  let rec wait () =
    match Unix.waitpid [Unix.WNOHANG] child with
    | 0,_ when Unix.gettimeofday () < deadline -> Unix.sleepf 0.01; wait ()
    | 0,_ ->
      Unix.kill child Sys.sigkill;
      ignore (Unix.waitpid [] child);
      failwith "Native expose and mailbox notification deadlocked"
    | _,status -> check "Native expose notification child failed" (status=Unix.WEXITED 0)
  in
  wait ();
  print_endline "native expose and mailbox lock ordering: OK"

let () =
  if Array.length Sys.argv=2 && Sys.argv.(1)="--expose-notification" then begin
    expose_notification_child ();
    exit 0
  end

let () =
  if Array.length Sys.argv = 4 &&
    (Sys.argv.(1) = "--software-replay" || Sys.argv.(1) = "--software-tile-replay") then begin
    software_scene_replay ~tiled:(Sys.argv.(1) = "--software-tile-replay")
      Sys.argv.(2) (float_of_string Sys.argv.(3));
    exit 0
  end

let () =
  if Array.length Sys.argv = 2 && Sys.argv.(1) = "--software-upload-budget" then begin
    software_upload_budget ();
    exit 0
  end

let () =
  if Array.length Sys.argv = 2 && Sys.argv.(1) = "--software-memory" then begin
    software_memory_regression ();
    exit 0
  end

let () =
  if Host_platform.is_macos then begin
    expose_notification_regression ();
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
    software_band_compression_regression window_id;
    software_band_reuse_regression window_id;
    Native_window.software_begin window_id (17,131,64);
    let band = Bytes.make (17 * 64 * 4) '\255' in
    List.iter (fun y ->
      Native_window.software_tile window_id (y,min 64 (131-y),17*4,band)) [0;64;128];
    check "Uniform pixel snapshots allocate IOSurface storage"
      (Native_window.software_owned_bytes window_id = 0);
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
  let foreign = Thread.create (fun () -> ignore (sdl_ok (Tsdl.Sdl.push_event event))) () in
  Thread.join foreign;
  check "A foreign SDL thread entered the window repaint callback" (!repaints=1);
  expose_unlocked (Tsdl.Sdl.get_window_id window);
  check "An idle expose failed to reacquire the runtime before repainting" (!repaints=2);
  Native_window.install window (fun () ->
    incr repaints;
    ignore (Sys.opaque_identity (Bytes.make 128 'x'));
    ignore (sdl_ok (Tsdl.Sdl.push_event event)));
  expose_unlocked (Tsdl.Sdl.get_window_id window);
  check "A nested expose reentered the current repaint" (!repaints=3);
  Gc.minor ();
  Native_window.dispose window;
  ignore (sdl_ok (Tsdl.Sdl.push_event event));
  expose_unlocked (Tsdl.Sdl.get_window_id window);
  check "Disposed window retained its live resize callback" (!repaints=3);
  menu_runtime_regression ();
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ();
  print_endline "native window drag and live resize: OK"
