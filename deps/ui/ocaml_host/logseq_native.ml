(* OCaml native host for the Logseq UI. One OCaml process: the logseq_ui_* app library runs
   inside this binary (native_embed.ml's entries, no caml_startup, no
   patch-callback FFI); the SDL window loop feeds input through
   Lui_window.Ui and returns rendered frames through Lui_host.

   Patch flow: every Native_embed entry (initialize/dispatch/pump)
   returns the joined "[batch, ...]" wire JSON; Patch_decode turns it
   back into patch_batch values applied to Lui_host — the same
   contract lui_ocaml_* exports use, minus the string copies on the
   outbound direction.

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

(* ocaml_host_stubs.c: an NSVisualEffectView with the .sidebar material
   ordered below the content view in the window's frame view, tracking
   the left sidebar column. x/y/w/h are window points in frame-view
   coordinates (origin bottom-left, y already flipped); visible=false
   hides it. *)
external sidebar_vibrancy :
  float -> float -> float -> float -> bool -> unit
  = "logseq_native_sidebar_vibrancy"

(* App theme → material appearance: the SDL window doesn't track the
   app's own light/dark switch, so the host pushes it each frame. *)
external sidebar_theme : bool -> unit = "logseq_native_sidebar_theme"

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

let perf_s () =
  Int64.to_float (Sdl.get_performance_counter ())
  /. Int64.to_float (Sdl.get_performance_frequency ())

let mods_of_keymod km =
  Input.
    { ctrl = km land Sdl.Kmod.ctrl <> 0;
      shift = km land Sdl.Kmod.shift <> 0;
      alt = km land Sdl.Kmod.alt <> 0;
      meta = km land Sdl.Kmod.gui <> 0 }

let input_of_event e =
  let open Input in
  match Sdl.Event.enum (Sdl.Event.get e Sdl.Event.typ) with
  | `Window_event -> (
      match
        Sdl.Event.window_event_enum
          (Sdl.Event.get e Sdl.Event.window_event_id)
      with
      | `Resized | `Size_changed ->
        Some
          (Resize
             ( Int32.to_int (Sdl.Event.get e Sdl.Event.window_data1)
             , Int32.to_int (Sdl.Event.get e Sdl.Event.window_data2) ))
      | `Close -> Some Quit_input
      | _ -> None)
  | `Key_down ->
    Some
      (Key_down
         ( Input.key_of_sdl_scancode
             (Sdl.Event.get e Sdl.Event.keyboard_scancode)
         , mods_of_keymod (Sdl.Event.get e Sdl.Event.keyboard_keymod)
         , Sdl.Event.get e Sdl.Event.keyboard_repeat <> 0 ))
  | `Text_input ->
    (* SDL on X11 still commits TEXTINPUT for Ctrl/Super chords whose
       keysym is not a letter (Ctrl+, Ctrl+. Ctrl+/ ...), so a shortcut
       also typed its punctuation into the focused editor. Browsers never
       insert text for a Ctrl/Meta chord; drop it here. Ctrl+Alt stays
       (Windows AltGr layouts report it). *)
    let m = mods_of_keymod (Sdl.get_mod_state ()) in
    if (m.Input.ctrl && not m.Input.alt) || m.Input.meta then None
    else Some (Text_input (Sdl.Event.get e Sdl.Event.text_input_text))
  | `Text_editing ->
    Some
      (Text_editing
         ( Sdl.Event.get e Sdl.Event.text_editing_text
         , Sdl.Event.get e Sdl.Event.text_editing_start
         , Sdl.Event.get e Sdl.Event.text_editing_length ))
  | `Mouse_motion ->
    Some
      (Move
         ( float (Sdl.Event.get e Sdl.Event.mouse_motion_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_motion_y) ))
  | `Mouse_button_down ->
    Some
      (Button_down
         ( float (Sdl.Event.get e Sdl.Event.mouse_button_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_button_y)
         , Input.button_of_sdl
             (Sdl.Event.get e Sdl.Event.mouse_button_button)
         , Sdl.Event.get e Sdl.Event.mouse_button_clicks
         , mods_of_keymod (Sdl.get_mod_state ()) ))
  | `Mouse_button_up ->
    Some
      (Button_up
         ( float (Sdl.Event.get e Sdl.Event.mouse_button_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_button_y)
         , Input.button_of_sdl
             (Sdl.Event.get e Sdl.Event.mouse_button_button)
         , mods_of_keymod (Sdl.get_mod_state ()) ))
  | `Mouse_wheel ->
    Some
      (Wheel_mods
         ( float (Sdl.Event.get e Sdl.Event.mouse_wheel_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_wheel_y)
         , mods_of_keymod (Sdl.get_mod_state ()) ))
  | `Drop_file ->
    let s = Sdl.Event.drop_file_file e in
    Sdl.Event.drop_file_free e;
    (match s with Some f -> Some (Drop_file f) | None -> None)
  | `Drop_text ->
    let s = Sdl.Event.drop_file_file e in
    Sdl.Event.drop_file_free e;
    (match s with Some t -> Some (Drop_text t) | None -> None)
  | `Drop_begin | `Drop_complete -> None
  | `Quit -> Some Quit_input
  | _ -> None



let () =
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
  let env = try Sys.getenv "LUI_GPU" with Not_found -> "" in
  let use_cpu = env = "0" || env = "cpu" in
  let software_window = use_cpu && not Host_platform.is_macos in
  let prefer_metal =
    Host_platform.is_macos && not use_cpu && env <> "gl" && env <> "opengl"
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
            (flags (not prefer_metal && not software_window))))
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
    if Option.is_some metal || software_window then None
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
  let noop_renderer =
    { Lui_host.name = "noop";
      Lui_host.render =
        (fun s ->
           Bytes.create (s.Lui_scene.width * s.Lui_scene.height * 4)) }
  in
  let unavailable_renderer message =
    if Host_platform.is_macos then begin
      warn "%s" message;
      (noop_renderer, false, None)
    end
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
  let renderer, gl_live, blit =
    match metal with
    | Some m ->
      log "renderer: lui_metal";
      ( { Lui_host.name = "lui_metal";
          Lui_host.render =
            (fun s ->
               Lui_metal.render m s;
               Lui_metal.present m;
               Bytes.empty) }
      , false, None )
    | None -> (
        if use_cpu then
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
  let renderer_cell = ref renderer and gl_live_cell = ref gl_live in
  let blit_cell = ref blit and gctx_cell = ref gctx in
  (* Runs between the scene's seal and the active renderer, for
     host-side display-list surgery — the sidebar vibrancy hook
     installed further down is its only user. *)
  let pre_render = ref (fun (_ : Lui_scene.t) -> ()) in
  let renderer_live =
    { Lui_host.name = "lui (resilient)";
      Lui_host.render =
        (fun s ->
           !pre_render s;
           if Host_platform.is_macos then
             try (!renderer_cell).Lui_host.render s
             with _ -> noop_renderer.render s
           else (!renderer_cell).Lui_host.render s) }
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
  let scroll_shift_of id =
    let rec sum aid (sx, sy) =
      match Lui_store.parent (store_of ()) aid with
      | Some p ->
        sum p
          (sx +. Ui.scroll_offset_x ui p, sy +. Ui.scroll_offset ui p)
      | None -> (sx, sy)
    in
    sum id (0., 0.)
  in
  let shifted_rect id =
    let r = engine_rect id in
    let sx, sy = scroll_shift_of id in
    { r with
      Lui_scene.x = r.Lui_scene.x -. sx;
      Lui_scene.y = r.Lui_scene.y -. sy }
  in
  let content_box id =
    List.fold_left
      (fun (l, t, rgt, b) d ->
         if d = id then (l, t, rgt, b)
         else
           let r = engine_rect d in
           ( Float.min l r.Lui_scene.x
           , Float.min t r.Lui_scene.y
           , Float.max rgt (r.Lui_scene.x +. r.Lui_scene.w)
           , Float.max b (r.Lui_scene.y +. r.Lui_scene.h) ))
      ( Float.max_float
      , Float.max_float
      , Float.min_float
      , Float.min_float )
      (Lui_store.preorder ~root:id (store_of ()))
  in
  let rect_intersect a b =
    let x = Float.max a.Lui_scene.x b.Lui_scene.x
    and y = Float.max a.Lui_scene.y b.Lui_scene.y in
    Lui_scene.rect x y
      (Float.max 0.
         (Float.min (a.Lui_scene.x +. a.Lui_scene.w)
            (b.Lui_scene.x +. b.Lui_scene.w)
          -. x))
      (Float.max 0.
         (Float.min (a.Lui_scene.y +. a.Lui_scene.h)
            (b.Lui_scene.y +. b.Lui_scene.h)
          -. y))
  in
  let unclipped = Lui_scene.rect (-1.e9) (-1.e9) 2.e9 2.e9 in
  let hooks =
    Lui_paint.
      { color_of = Theme_vars.color_of;
        (* Lui_host replaces this with the visibility predicate installed
           by set_hidden before painting the app. *)
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
             if cap <= 0.001 then None
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
             let ops = Text_engine.text_ops text_engine id r fg s in
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
                     (Lui_paint.text_placement_of store id).tp_pad_x
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
             if marked = "" || id <> Ui.focused ui then ops
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
                     .tp_pad_x
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
               Host_icons.image_of (Lui_host.store h) !scale_cell id r
             | None -> None);
        image_in =
          (fun id r ->
             match !host_cell with
             | Some h ->
               Host_icons.image_of (Lui_host.store h) !scale_cell id r
             | None -> None);
        shadow_of =
          (fun name ->
            (* shadow strings carry raw css vars like --kbd-glow-*;
               the theme-var table resolves them, the token palette
               can't. A spec that is itself a var(--x, fallback) must
               resolve to its spec string before parsing — the
               per-token color resolver can't unwrap the whole layer. *)
            let name =
              match Theme_vars.resolve_value name 0 with
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
             let fg =
               match Host_icons.effective_fg_css store id with
               | Some css -> (
                 match Theme_vars.color_of css with
                 | Some c -> c
                 | None -> Lui_scene.color 0 0 0 255)
               | None -> Lui_scene.color 0 0 0 255
             in
             ctx.Lui_paint.hooks.Lui_paint.text_ops id r fg s
           | _ -> []) };
  let measure_memo : (int * string * float * float, (float * float) option) Hashtbl.t =
    Hashtbl.create 256
  in
  let measure_rev = ref (-1, -1) in
  let host =
    Lui_host.create ~hooks ~layout:(module Lui_layout)
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
        let key = (id, text, w, scale_now) in
        match Hashtbl.find_opt measure_memo key with
        | Some r -> r
        | None ->
          let mw, mh = Text_engine.measure_text ~width:w text_engine id text in
          let tp = Lui_paint.text_placement_of store' id in
          let r =
            Some
              ( mw +. (2. *. tp.tp_pad_x *. scale_now)
              , mh +. (2. *. tp.tp_pad_y *. scale_now) )
          in
          Hashtbl.replace measure_memo key r;
          r)
      ~renderer:renderer_live ~width:dw ~height:dh ~scale ()
  in
  host_cell := Some host;
  let store = Lui_host.store host in
  Daemon_client.boot_mark "host ready";
  Lui_host.set_hidden host (Some (fun id -> Ui.hidden ui store id));
  Lui_host.set_ctx_anchor host
    (Some (fun () -> Some (Ui.pointer ui)));
  let win_w = ref width and win_h = ref height in
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
        let clip = rect_intersect shifted frame in
        Some
          ( Ui.scroll_offset ui id
            +. Float.max 0. (clip.Lui_scene.y -. shifted.Lui_scene.y)
          , Float.max 1. clip.Lui_scene.h )
  in
  Lui_host.set_vport host vport_of;
  let apply_patch_json (s : string) =
    if s <> "" then begin
      List.iter
        (fun b -> ignore (Lui_host.apply_batch host b))
        (Patch_decode.batches_of_string s);
      (* a set-input-focus request may have queued waiting on a sink
         that this batch just mounted *)
      Host_requests.flush_pending_focus ()
    end
  in
  (* on-demand rect with the same shift+clip math populate_rects bakes
     into the cache — for measure-node replies that arrive between
     repaints, when the cached entry is absent or stale *)
  let rec live_rect id =
    let base = engine_rect id in
    let rec walk aid ((sx, sy), clip) =
      match Lui_store.parent store aid with
      | None -> ((sx, sy), clip)
      | Some p ->
        let clip =
          if Ui.scrollable store p then
            let pr = live_rect p in
            if not (Lui_scene.rect_empty pr) then rect_intersect clip pr
            else clip
          else clip
        in
        walk p
          ((sx +. Ui.scroll_offset_x ui p, sy +. Ui.scroll_offset ui p), clip)
    in
    (* the seed clip is unbounded: clipping to the node's own unshifted
       base would cancel the scroll offset back out (r ∩ base = base) *)
    let (sx, sy), clip = walk id ((0., 0.), unclipped) in
    rect_intersect
      { base with
        Lui_scene.x = base.Lui_scene.x -. sx;
        Lui_scene.y = base.Lui_scene.y -. sy }
      clip
  in
  (* macOS sidebar vibrancy: the left sidebar column is the node
     classed cp__sidebar-left-layout; populate_rects records its id so
     the render hook below can keep an NSVisualEffectView under the
     content view glued to its rect and punch a transparent Hole over
     it in the display list. *)
  let sidebar_id_cell = ref (-1) in
  let class_has cls tok =
    List.exists (fun t -> t = tok) (String.split_on_char ' ' cls)
  in
  (* Splice a Hole covering [r] into the display list, right after the
     last fill that backdrops the column (a fill inside [r] covering
     most of it). The hole batch writes alpha 0 through everything
     painted earlier, exposing the effect view below the content view;
     ops after it — the sidebar's own content — repaint opaque on top.
     With no backdrop found the hole goes first, which at least clears
     the window background under the column. *)
  let sidebar_hole (r : Lui_scene.rect) ops =
    let covers (f : Lui_scene.fill_op) =
      let a = f.Lui_scene.frect in
      a.Lui_scene.x >= r.Lui_scene.x -. 2.
      && a.Lui_scene.y >= r.Lui_scene.y -. 2.
      && a.Lui_scene.x +. a.Lui_scene.w
         <= r.Lui_scene.x +. r.Lui_scene.w +. 2.
      && a.Lui_scene.y +. a.Lui_scene.h
         <= r.Lui_scene.y +. r.Lui_scene.h +. 2.
      && a.Lui_scene.w *. a.Lui_scene.h
         >= 0.7 *. r.Lui_scene.w *. r.Lui_scene.h
    in
    let hole =
      Lui_scene.Hole
        { hrect = r;
          hradii = (0., 0., 0., 0.);
          hcontinuous = false;
          hopacity = 1. }
    in
    let rec last_backdrop i acc = function
      | [] -> acc
      | Lui_scene.Fill f :: tl ->
        last_backdrop (i + 1) (if covers f then i else acc) tl
      | _ :: tl -> last_backdrop (i + 1) acc tl
    in
    let cut = last_backdrop 0 (-1) ops + 1 in
    let rec splice i = function
      | [] -> [ hole ]
      | op :: tl ->
        if i = cut then hole :: op :: tl else op :: splice (i + 1) tl
    in
    splice 0 ops
  in
  let populate_rects () =
    Hashtbl.reset rects;
    sidebar_id_cell := -1;
    List.iter
      (fun id ->
         let base = engine_rect id in
         let rec walk aid ((sx, sy), clip) =
           match Lui_store.parent store aid with
           | None -> ((sx, sy), clip)
           | Some p ->
             let clip =
               if Ui.scrollable store p then
                 match Hashtbl.find_opt rects p with
                 | Some pr when not (Lui_scene.rect_empty pr) ->
                   rect_intersect clip pr
                 | _ -> clip
               else clip
             in
             walk p
               ((sx +. Ui.scroll_offset_x ui p,
                 sy +. Ui.scroll_offset ui p), clip)
         in
         let (sx, sy), clip = walk id ((0., 0.), unclipped) in
         let r =
           { base with
             Lui_scene.x = base.Lui_scene.x -. sx;
             Lui_scene.y = base.Lui_scene.y -. sy }
         in
         Hashtbl.replace rects id (rect_intersect r clip);
         if !sidebar_id_cell < 0 then
           match Lui_store.string_prop store id "style-class" with
           | Some c when class_has c "cp__sidebar-left-layout" ->
             sidebar_id_cell := id
           | _ -> ())
      (Lui_store.preorder store);
    List.iter
      (fun id ->
         if Ui.scrollable store id then
           let cr = engine_rect id in
           let l, t, rgt, b = content_box id in
           Ui.set_scroll_cap ui id
             (Float.max 0. (b -. t -. cr.Lui_scene.h));
           Ui.set_scroll_cap_x ui id
             (Float.max 0. (rgt -. l -. cr.Lui_scene.w)))
      (Lui_store.preorder store);
    Ui.notify_layout ui
  in
  (* Metal + macOS only: keep the .sidebar NSVisualEffectView frame
     glued to the sidebar column and splice the hole into the display
     list each render. engine_rect reads the layout just computed by
     the repaint this render belongs to, so the frame never lags. *)
  let () =
    if Option.is_some metal then
      pre_render :=
        (fun (s : Lui_scene.t) ->
         match !host_cell with
         | None -> ()
         | Some _ -> (
           let id = !sidebar_id_cell in
           let cls =
             if id < 0 then ""
             else
               Option.value ~default:""
                 (Lui_store.string_prop (store_of ()) id "style-class")
           in
           let r =
             if id < 0 then Lui_scene.rect 0. 0. 0. 0.
             else engine_rect id
           in
           if
             id >= 0 && class_has cls "is-open"
             && r.Lui_scene.w >= 4. && r.Lui_scene.h >= 4.
           then begin
             s.Lui_scene.ops <- sidebar_hole r s.Lui_scene.ops;
             let sc = !scale_cell in
             sidebar_theme (!Theme_vars.mode = Lui_theme.Dark);
             sidebar_vibrancy
               (r.Lui_scene.x /. sc)
               (float !win_h -. (r.Lui_scene.y +. r.Lui_scene.h) /. sc)
               (r.Lui_scene.w /. sc)
               (r.Lui_scene.h /. sc)
               true
           end
           else sidebar_vibrancy 0. 0. 0. 0. false))
  in
  (* Swift spine contract stand-in: the Swift host fires "lazy-mount"
     on row spacers scrolling into view and "virt-end" when a virt list
     nears its bottom. Here the layout rects already exist, so emit the
     same dom-events for spacers inside the viewport band (overscan
     margin below the edge) — rows mount in place, pagination works. *)
  let lazy_fired : (int, unit) Hashtbl.t = Hashtbl.create 64 in
  let virt_end_fired : (int, float) Hashtbl.t = Hashtbl.create 8 in
  let prop_has id prop needle =
    match Lui_store.string_prop store id prop with
    | Some s -> (
        let n = String.length s and m = String.length needle in
        let rec found i =
          i + m > n
          || (String.sub s i m = needle || found (i + 1))
        in
        m = 0 || found 0)
    | None -> false
  in
  let attrs_has id needle =
    prop_has id "attrs" needle || prop_has id "data-attrs" needle
  in
  let emit_dom_event name id =
    if !debug then warn "  dom-event %s id=%d" name id;
    Native_embed.platform_event
      (Printf.sprintf "%s\n{\"nodeId\":%d}" name id)
  in
  let fire_viewport_events () =
    let vh = float_of_int !win_h *. !scale_cell in
    let edge = vh +. 768. in
    List.iter
      (fun id ->
         let r = Rects.get rects id in
         if attrs_has id "data-lazy-mount" then
           if
             (not (Hashtbl.mem lazy_fired id))
             && r.Lui_scene.y < edge
             && r.Lui_scene.y +. r.Lui_scene.h > -256.
           then begin
             Hashtbl.replace lazy_fired id ();
             emit_dom_event "lazy-mount" id
           end
         else if attrs_has id "data-virt-count" then begin
           let bottom = r.Lui_scene.y +. r.Lui_scene.h in
           (* fire when the list's tail is within the band; refire only
              after the tail advanced (pagination grew the list) *)
           let prev =
             Option.value (Hashtbl.find_opt virt_end_fired id)
               ~default:(-1.)
           in
           if bottom < edge && bottom > prev then begin
             Hashtbl.replace virt_end_fired id bottom;
             emit_dom_event "virt-end" id
           end
         end)
      (Lui_store.preorder store)
  in
  (* SDL_SetTextInputRect works in window (logical) pixels. *)
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
    else begin
      let s = !scale_cell in
      let pad =
        (Lui_paint.text_placement_of store id).tp_pad_x *. s
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
  let quit = ref false in
  let rec apply_actions acts = List.iter (function
    | Dispatch ev ->
      let name =
        match ev with
        | Lui_protocol.Press _ -> "Press"
        | LongPress _ -> "LongPress"
        | TextChanged _ -> "TextChanged"
        | Submit _ -> "Submit"
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
         dbg "  dispatch -> %d bytes" (String.length r);
         apply_patch_json r
       with Invalid_argument msg ->
         warn "dispatch rejected event: %s" msg)
    | Clipboard_write s -> ignore (Lui_shell.clipboard_write s)
    | Paste_request ->
      (match Lui_shell.clipboard_read () with
       | Some s ->
         apply_actions (Ui.handle ui store rects (Input.Paste s))
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
      Lui_host.resize host ~width:dw ~height:dh ~scale:!scale_cell;
      push_window_size ()
    | Focus_changed id ->
      if id = 0 then Sdl.stop_text_input ()
      else begin
        Sdl.start_text_input ();
        set_ime_rect (Rects.get rects id)
      end
    | Ime_rect r -> set_ime_rect r
    | Quit -> quit := true)
    acts
  and push_window_size () =
    (* Logical viewport size — Web_dom.win_inner_* drives the
       virtualizer and window-edge popup anchoring. *)
    let body =
      Printf.sprintf "{\"width\":%d,\"height\":%d}" !win_w !win_h
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
  let emit_dom name node fields =
    let fields =
      if node > 0 then ("nodeId", string_of_int node) :: fields
      else fields
    in
    let body =
      "{"
      ^ String.concat ","
          (List.map (fun (k, v) -> jstr k ^ ":" ^ v) fields)
      ^ "}"
    in
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
    let path = hit_path store rects ~x:(x *. s) ~y:(y *. s) in
    match path with
    | id :: _ -> id
    | [] -> dom_root ()
  in
  (* DOM `buttons` bitmask: 1 primary, 2 secondary, 4 auxiliary. SDL
     button numbers are 1 left, 2 middle, 3 right while DOM is 0 left,
     1 middle, 2 right — map through Input.mouse_button. *)
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
  let last_dom_key = ref None in
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
  let cursor_for node =
    let rec up id depth =
      if id <= 0 || depth > 64 then "default"
      else
        let kind = Lui_store.kind store id in
        match Lui_store.string_prop store id "cursor" with
        | Some c when c <> "" && c <> "auto" && c <> "inherit" -> c
        | _ ->
          if kind = "extension:logseq-editor" || kind = "text-field"
             || kind = "textarea" || kind = "input"
             || kind = "search-field" || kind = "secure-field"
          then "text"
          else if kind = "link" || kind = "button" || kind = "menu-item"
                  || kind = "toggle" || kind = "checkbox"
          then "pointer"
          else
            match Lui_store.parent store id with
            | Some p -> up p (depth + 1)
            | None -> "default"
    in
    up node 0
  in
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
    (* macOS routes menu keyEquivalents (Edit-menu tags 6-11:
       z/x/c/v/a with gui or gui+shift) to both SDL and the menu
       callback, which re-injects the key — one physical press arrives
       as two keydown/keyup pairs ~1ms apart. Browsers dispatch each
       key once, and a doubled mod+a exits editing to block selection
       on the second dispatch, so drop an identical
       (scancode, shift, down) meta event inside a short window. *)
    let dupe =
      if Host_platform.is_macos && mods.Input.meta
         && not (mods.Input.ctrl || mods.Input.alt)
      then
        let now = Unix.gettimeofday () in
        let dupe =
          match !last_dom_key with
          | Some (sc', sh', dn', t) ->
              sc' = scancode && sh' = mods.Input.shift && dn' = down
              && now -. t < 0.08
          | None -> false
        in
        if dupe then true
        else begin
          last_dom_key := Some (scancode, mods.Input.shift, down, now);
          false
        end
      else false
    in
    if dupe then ()
    else begin
      emit_dom (if down then "keydown" else "keyup") target fields;
      (* browsers dispatch copy/cut/paste as their own dom events on
         mod+c/x/v — the document clipboard listeners (on_copy/on_cut/
         on_paste) hang off those, not the keydown; a paste event
         carries the OS clipboard as clipboardData.text like the
         browser's *)
      let primary_shortcut =
        if Host_platform.is_macos then mods.Input.meta && not mods.Input.ctrl
        else mods.Input.ctrl && not mods.Input.meta
      in
      if down && (not repeat) && primary_shortcut
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
         | _ -> ());
      (* on web the hidden textarea's own keydown listener emits the
         conduit "key" event alongside the document dispatch — give the
         focused logseq-editor sink the same feed; typed text arrives
         separately as Text_input -> "insert" *)
      if down && target <> 0
         && Lui_store.kind store target = "extension:logseq-editor"
      then begin
        dbg "editor key %s" (dom_key scancode);
        (* the document keydown above is only enqueued; the sink event
           below dispatches synchronously. Drain the document listener
           first so it sees the pre-key editing state, as the browser's
           single dispatch does — otherwise an Enter that the sink
           already split reaches the document handler with editing on
           the new block and pending focus armed, and is replayed into
           it as a second split (an extra empty block per Enter). *)
        apply_patch_json (Native_embed.pump ());
        apply_patch_json
          (Native_embed.extension_event target "logseq-editor" "key"
             (String.concat ""
                [ "{\"key\":"; jstr (dom_key scancode)
                ; ",\"shift\":"; jbool (mods.Input.shift)
                ; ",\"alt\":"; jbool (mods.Input.alt)
                ; ",\"meta\":"; jbool (mods.Input.meta)
                ; ",\"ctrl\":"; jbool (mods.Input.ctrl)
                ; ",\"repeat\":"; jbool (repeat)
                ; "}" ]))
      end
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
        ~mods:(mods_of_keymod (Sdl.get_mod_state ()))
    | `Mouse_button_up ->
      on_dom_button_up
        ~x:(Sdl.Event.get e Sdl.Event.mouse_button_x)
        ~y:(Sdl.Event.get e Sdl.Event.mouse_button_y)
        ~btn:(Input.button_of_sdl
                (Sdl.Event.get e Sdl.Event.mouse_button_button))
        ~mods:(mods_of_keymod (Sdl.get_mod_state ()))
    | `Mouse_motion ->
      on_dom_motion
        ~x:(Sdl.Event.get e Sdl.Event.mouse_motion_x)
        ~y:(Sdl.Event.get e Sdl.Event.mouse_motion_y)
        ~rx:(Sdl.Event.get e Sdl.Event.mouse_motion_xrel)
        ~ry:(Sdl.Event.get e Sdl.Event.mouse_motion_yrel)
        ~mods:(mods_of_keymod (Sdl.get_mod_state ()))
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
     One dispatch path: Edit commands are re-injected as real SDL key
     events so the app's keymap sees exactly what a keyboard press
     produces (the item's keyEquivalent fires the same action, so
     Cmd+Z from the keyboard is routed here instead of being
     swallowed); app-level commands reuse the "menu-*" platform_event
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
    push_menu_key ~down:false ~scancode ~keymod
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
  let e = Sdl.Event.create () in
  let drain_events () =
    let n = ref 0 in
    let go = ref true in
    while !go do
      if Sdl.poll_event (Some e) then begin
        incr n;
        dbg "sdl event type=%d" (Sdl.Event.get e Sdl.Event.typ);
        (match input_of_event e with
         | Some (Input.Resize (w, h)) ->
           win_w := w;
           win_h := h;
           apply_actions
             (Ui.handle ui store rects (Input.Resize (w, h)))
         | Some input ->
           apply_actions (Ui.handle ui store rects input);
           (match input with
            | Input.Text_input s ->
              (* the editor sink's conduit reads text commits as
                 "insert" — Ui.handle's TextChanged path stays unused
                 because the extension admits no such event *)
              let tgt = Ui.focused ui in
              if tgt <> 0
                 && Lui_store.kind store tgt = "extension:logseq-editor"
              then
                apply_patch_json
                  (Native_embed.extension_event tgt "logseq-editor" "insert"
                     (Printf.sprintf {|{"text":%s}|} (jstr s)))
            | _ -> ())
         | None -> ());
        emit_dom_event e
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
  apply_patch_json init_patches;
  Daemon_client.boot_mark "init patches applied";
  (* No synchronous first paint: the frame loop repaints once after
     draining the mailbox, so boot pumps are not each gated behind a
     full layout+shaping+render pass. *)
  populate_rects ();
  Ui.set_measure ui
    (fun _store id s -> Text_engine.measure_text text_engine id s);
  Ui.set_content_rect ui engine_rect;
  let a11y = Lui_a11y.of_store store in
  (* Host_requests env: the dom-op/platform-request sink. *)
  let host_req_repaint = ref false in
  let theme_gen_seen = ref !Theme_vars.generation in
  Host_requests.install
    { Host_requests.store;
      ui;
      rects;
      rect_of = live_rect;
      scale = (fun () -> !scale_cell);
      measure = (fun id s -> Text_engine.measure_text text_engine id s);
      apply_batch = (fun b -> ignore (Lui_host.apply_batch host b));
      apply_actions;
      set_ime_rect;
      focused_text_input =
        (fun id ->
           if id = 0 then Sdl.stop_text_input ()
           else begin
             Sdl.start_text_input ();
             set_ime_rect (Rects.get rects id)
           end);
      (* host requests mark dirty instead of repainting inline: the
         loop already coalesces all pending work into one paint per
         iteration — several boot-time ui-state/theme pushes would
         otherwise each pay a full layout+shape+render. *)
      repaint = (fun () -> host_req_repaint := true) };
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
     Sdl.start_text_input ()
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
  (* Retained fragments bake the scroll-shifted rects the paint hook
     returns. Lui_window.Assembly.repaint feeds Ui.paint_hints into
     the cache; this loop owns the frame itself and never did, so a
     set-scroll-top after the nodes were planned (journals restored
     under a parked scroller, then reset to 0) replays the
     off-screen fragments and the main column stays white while hit
     testing still finds the text. *)
  let scroll_epoch_seen = ref (-1) in
  let scroll_off : (int, float * float) Hashtbl.t = Hashtbl.create 4 in
  let sync_scroll_paint () =
    let epoch = Ui.scroll_epoch ui in
    if epoch <> !scroll_epoch_seen then begin
      scroll_epoch_seen := epoch;
      List.iter
        (fun id ->
          if Ui.scrollable store id then
            let xy = (Ui.scroll_offset_x ui id, Ui.scroll_offset ui id) in
            match Hashtbl.find_opt scroll_off id with
            | Some prev when prev = xy -> ()
            | _ ->
              Hashtbl.replace scroll_off id xy;
              (* Thumb metrics are not a translation of the scroller
                 box; descendants only shift. *)
              Lui_host.note_paint host id;
              Lui_host.note_moveds host
                (List.filter (( <> ) id)
                   (Lui_store.preorder ~root:id store)))
        (Lui_store.preorder store)
    end
  in
  Daemon_client.boot_mark "loop";
  (* [last_busy] gates the idle sleep: any activity below refreshes
     it, so the 1ms fast poll persists through bursts (boot, typing)
     and the blocking wait only kicks in after sustained quiet. *)
  let last_rev = ref 0 and last_busy = ref (perf_s ()) in
  while not !quit do
    let t0 = perf_s () in
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
    if drain_events () > 0 then last_busy := t0;
    if !frame < 3 then Daemon_client.boot_mark "events drained";
    (* LOGSEQ_NATIVE_TREEDUMP=1: SIGUSR1 dumps the retained tree
       (id kind key class rect, indented) to the debug log. *)
    if Atomic.exchange dump_tree_flag false then begin
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
        if !debug then warn "pump -> %d bytes" (String.length r);
        apply_patch_json r;
        pump_all (n - 1)
      end
    in
    pump_all 8;
    if !frame < 3 then Daemon_client.boot_mark "pumps drained";
    (* platform_request envelopes the app emitted are serviced here. *)
    Host_requests.drain ();
    let rev_now = Lui_store.revision store in
    if rev_now <> !last_rev then begin
      last_rev := rev_now; last_busy := t0
    end;
    let sync_acts = Ui.store_changed ui store in
    if sync_acts <> [] then last_busy := t0;
    apply_actions sync_acts;
    (* store_changed's dead-focus cleanup may have cleared Ui.focused
       for a remounted ed-sink with no batch pending to re-arm it *)
    Host_requests.ensure_ed_focus ();
    if Ui.focused ui <> 0 then
      apply_actions
        (Ui.handle ui store rects (Input.Caret (caret_rect ())));
    if !Theme_vars.generation <> !theme_gen_seen then begin
      theme_gen_seen := !Theme_vars.generation;
      Lui_host.invalidate_paint host;
      Lui_host.invalidate_layout host;
      host_req_repaint := true
    end;
    let dirty = Ui.want_frame ui host || !host_req_repaint in
    if dirty then begin
      host_req_repaint := false;
      sync_scroll_paint ();
      Daemon_client.boot_mark "paint begin";
      ignore (Lui_host.repaint host);
      Daemon_client.boot_mark "paint done";
      if !debug then
        dbg "frame %d ops=%d" !frame
          (List.length (Lui_host.scene host).Lui_scene.ops);
      populate_rects ();
      fire_viewport_events ();
      refresh_cursor ();
      Daemon_client.boot_mark "viewport";
      ignore (Lui_a11y.sync a11y);
      Daemon_client.boot_mark "a11y sync";
      if !gl_live_cell then Sdl.gl_swap_window !win;
      Ui.frame_done ui;
      last_busy := t0;
      incr frame
    end;
    (let iter_ms = (perf_s () -. t0) *. 1000. in
     if iter_ms > 20. then
       Daemon_client.boot_mark (Printf.sprintf "iter %.0fms" iter_ms));
    (let now = perf_s () in
     if mem_trace && now -. !mem_mark > 2.0 then begin
       mem_mark := now;
       let st = Gc.quick_stat () in
       Printf.eprintf
         "[mem f=%d live=%dMB heap=%dMB free=%dMB top=%dMB nodes=%d]\n%!"
         !frame
         (st.Gc.live_words * 8 / 1048576)
         (st.Gc.heap_words * 8 / 1048576)
         (st.Gc.free_words * 8 / 1048576)
         (st.Gc.top_heap_words * 8 / 1048576)
         (Lui_store.node_count store)
     end);
    if dirty && not vsync then begin
      (* Boot frames pace at ~2ms, not vsync: pacing sleeps delay the
         wakeup-driven boot pumps behind every repaint. *)
      let cap = if !frame < 60 then 2. else 16.6 in
      let remaining = cap -. ((perf_s () -. t0) *. 1000.) in
      if remaining > 0.5 then
        Sdl.delay (Int32.of_int (int_of_float remaining))
    end
    else if not dirty then
      (* Busy (recent event/wakeup/paint): 1ms — wakeup-driven pump
         chains otherwise pay a sleep per hop across the serialized
         invoke chain. Quiet for >2s: block in SDL_WaitEventTimeout —
         input wakes immediately while the pump/sync poll cadence
         drops from ~500Hz to ~60Hz. NULL event: the waking event
         stays queued for drain_events. The old [!frame < 60] gate
         never escaped because [frame] counts repaints, which stop
         entirely once idle. *)
      if perf_s () -. !last_busy < 2. then Sdl.delay 1l
      else ignore (Sdl.wait_event_timeout None 16)
  done;
  ignore (Native_embed.dispose ());
  (match !gctx_cell with
   | Some c -> Sdl.gl_delete_context c
   | None -> ());
  Sdl.destroy_window !win;
  Sdl.quit ()
