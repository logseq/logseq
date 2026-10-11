(* OCaml native host for the Logseq UI — the in-process twin of the
   Rust host. One OCaml process: the logseq_ui_* app library runs
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

(* ocaml_host_stubs.c: NSApplication activation for a bare-binary
   launch — see its comment. *)
external native_activate : unit -> unit = "logseq_native_activate"

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
    Some (Text_input (Sdl.Event.get e Sdl.Event.text_input_text))
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
  debug := (try Sys.getenv "LOGSEQ_NATIVE_DEBUG" <> "" with _ -> false);
  dump := (try Sys.getenv "LOGSEQ_NATIVE_DUMP" <> "" with _ -> false);
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
  let prefer_metal = not use_cpu && env <> "gl" && env <> "opengl" in
  sdl_ok (Sdl.init Sdl.Init.(video + events));
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
            (flags (not prefer_metal))))
  in
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
  let gctx =
    if Option.is_some metal then None
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
  let drawable () = Sdl.gl_get_drawable_size !win
  in
  let dw, dh = drawable () in
  let scale = Float.max 0.01 (float dw /. float width) in
  let noop_renderer =
    { Lui_host.name = "noop";
      Lui_host.render =
        (fun s ->
           Bytes.create (s.Lui_scene.width * s.Lui_scene.height * 4)) }
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
            warn "lui_blit.create failed: %s" m;
            (noop_renderer, false, None)
          | Ok b -> (cpu_renderer b, false, Some b)
        else
          match gctx with
          | None ->
            warn "no GL context; using no-op loop renderer";
            (noop_renderer, false, None)
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
                warn "lui_gl.init failed: %s; falling back to noop" m;
                (noop_renderer, false, None)))
  in
  let renderer_cell = ref renderer and gl_live_cell = ref gl_live in
  let blit_cell = ref blit and gctx_cell = ref gctx in
  let renderer_live =
    { Lui_host.name = "lui (resilient)";
      Lui_host.render =
        (fun s ->
           try (!renderer_cell).Lui_host.render s
           with _ -> noop_renderer.render s) }
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
  let hooks =
    Lui_paint.
      { color_of = Theme_vars.color_of;
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
               Host_icons.image_of (Lui_host.store h) !scale_cell id r
             | None -> None);
        shadow_of =
          (fun name -> Lui_theme.shadow_of !Theme_vars.mode name) }
  in
  let host =
    Lui_host.create ~hooks ~layout:(module Lui_layout)
      ~measure:(fun id text _w _h ->
        let w, h = Text_engine.measure_text text_engine id text in
        let tp = Lui_paint.text_placement_of (text_engine.store ()) id in
        let s = text_engine.scale () in
        Some
          (w +. (2. *. tp.tp_pad_x *. s), h +. (2. *. tp.tp_pad_y *. s)))
      ~renderer:renderer_live ~width:dw ~height:dh ~scale ()
  in
  host_cell := Some host;
  let store = Lui_host.store host in
  Lui_host.set_hidden host (Some (fun id -> Ui.hidden ui store id));
  Lui_host.set_ctx_anchor host
    (Some (fun () -> Some (Ui.pointer ui)));
  let win_w = ref width and win_h = ref height in
  let apply_patch_json (s : string) =
    if s <> "" then
      List.iter
        (fun b -> ignore (Lui_host.apply_batch host b))
        (Patch_decode.batches_of_string s)
  in
  let populate_rects () =
    Hashtbl.reset rects;
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
         let (sx, sy), clip = walk id ((0., 0.), base) in
         let r =
           { base with
             Lui_scene.x = base.Lui_scene.x -. sx;
             Lui_scene.y = base.Lui_scene.y -. sy }
         in
         Hashtbl.replace rects id (rect_intersect r clip))
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
      (Lui_store.preorder store)
  in
  (* Swift/gpui spine contract stand-in: those hosts fire "lazy-mount"
     on row spacers scrolling into view and "virt-end" when a virt list
     nears its bottom. Here the layout rects already exist, so emit the
     same dom-events for spacers inside the viewport band (overscan
     margin below the edge) — rows mount in place, pagination works. *)
  let lazy_fired : (int, unit) Hashtbl.t = Hashtbl.create 64 in
  let virt_end_fired : (int, float) Hashtbl.t = Hashtbl.create 8 in
  let attrs_has id needle =
    match Lui_store.string_prop store id "attrs" with
    | Some s -> (
        let n = String.length s and m = String.length needle in
        let rec found i =
          i + m > n
          || (String.sub s i m = needle || found (i + 1))
        in
        m = 0 || found 0)
    | None -> false
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
         if !debug && r <> "" then
           warn "  -> %d bytes" (String.length r);
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
  let e = Sdl.Event.create () in
  let drain_events () =
    let go = ref true in
    while !go do
      if Sdl.poll_event (Some e) then begin
        dbg "sdl event type=%d" (Sdl.Event.get e Sdl.Event.typ);
        match input_of_event e with
        | Some (Input.Resize (w, h)) ->
          win_w := w;
          win_h := h;
          apply_actions
            (Ui.handle ui store rects (Input.Resize (w, h)))
        | Some input ->
          apply_actions (Ui.handle ui store rects input)
        | None -> ()
      end
      else go := false
    done
  in
  (* ---- boot the embedded app ---- *)
  Lui_shell.set_app_name "logseq";
  ignore (Lui_shell.set_window_title "logseq");
  (* platform_code 1 = MacOS, host_code 6 = the native host
     profile (drives the app-icons push and host-gated views). *)
  let init_patches = Native_embed.initialize 1 6 "" in
  apply_patch_json init_patches;
  ignore (Lui_host.repaint host);
  populate_rects ();
  Ui.set_measure ui
    (fun _store id s -> Text_engine.measure_text text_engine id s);
  Ui.set_content_rect ui engine_rect;
  let a11y = Lui_a11y.of_store store in
  (* Host_requests env: the dom-op/platform-request sink. *)
  Host_requests.install
    { Host_requests.store;
      ui;
      rects;
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
      repaint = (fun () -> ignore (Lui_host.repaint host)) };
  (* appearance + window-size environment push — the app's
     prefers_dark and inner_width/inner_height resolve against these. *)
  let dark =
    let ic = Unix.open_process_in
             "defaults read -g AppleInterfaceStyle 2>/dev/null" in
    let out = try input_line ic with End_of_file -> "" in
    ignore (Unix.close_process_in ic);
    String.trim out = "Dark"
  in
  Native_embed.platform_event
    (Printf.sprintf "appearance\n{\"dark\":%b}" dark);
  push_window_size ();
  (match
     List.find_opt
       (fun id -> Lui_store.bool_prop store id "autofocus")
       (Lui_store.preorder store)
   with
   | Some id ->
     Ui.set_focused ui store id;
     Sdl.start_text_input ()
   | None -> ());
  log "logseq_native: %dx%d drawable (scale %.2f), renderer=%s, icons=%d"
    dw dh scale (!renderer_cell).Lui_host.name (Host_icons.count ());
  let frame = ref 0 in
  let raises_left = ref 3 in
  while not !quit do
    let t0 = perf_s () in
    (* See the raise_window note above: re-raise briefly after boot so a
       racing frontmost app cannot permanently steal input routing. *)
    if !raises_left > 0 then begin
      decr raises_left;
      Sdl.raise_window !win;
      native_activate ()
    end;
    drain_events ();
    (* LOGSEQ_NATIVE_TREEDUMP=1: SIGUSR1 dumps the retained tree
       (id kind key class rect, indented) to the debug log. *)
    if Atomic.exchange dump_tree_flag false then begin
      let rec out depth id =
        let r = Rects.get rects id in
        dbg "%s%d %s key=%s class=%s %.0f,%.0f %.0fx%.0f"
          (String.make (2 * depth) ' ') id (Lui_store.kind store id)
          (Option.value (Lui_store.string_prop store id "key")
             ~default:"-")
          (Option.value
             (Lui_store.string_prop store id "style-class")
             ~default:"-")
          r.Lui_scene.x r.Lui_scene.y r.Lui_scene.w r.Lui_scene.h;
        List.iter (out (depth + 1)) (Lui_store.child_ids store id)
      in
      List.iter (out 0) (Lui_store.root_ids store)
    end;
    (* OCaml worker threads poke wakeup() when the app mailbox fills —
       pump drains it on this entry thread; returned patches apply. *)
    if Atomic.exchange Bridge.pending_wakeup false then begin
      let r = Native_embed.pump () in
      if !debug then warn "pump -> %d bytes" (String.length r);
      apply_patch_json r
    end;
    (* platform_request envelopes the app emitted are serviced here. *)
    Host_requests.drain ();
    apply_actions (Ui.store_changed ui store);
    if Ui.focused ui <> 0 then
      apply_actions
        (Ui.handle ui store rects (Input.Caret (caret_rect ())));
    let dirty = Ui.want_frame ui host in
    if dirty then begin
      ignore (Lui_host.repaint host);
      populate_rects ();
      fire_viewport_events ();
      ignore (Lui_a11y.sync a11y);
      if !gl_live_cell then Sdl.gl_swap_window !win;
      Ui.frame_done ui;
      incr frame
    end;
    if dirty && not vsync then begin
      let remaining = 16.6 -. ((perf_s () -. t0) *. 1000.) in
      if remaining > 0.5 then
        Sdl.delay (Int32.of_int (int_of_float remaining))
    end
    else if not dirty then Sdl.delay 4l
  done;
  ignore (Native_embed.dispose ());
  (match !gctx_cell with
   | Some c -> Sdl.gl_delete_context c
   | None -> ());
  Sdl.destroy_window !win;
  Sdl.quit ()
