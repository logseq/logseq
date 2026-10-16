(* Vendored from lui platform/native/lui_window/lui_window_text.ml @5e63d56
   (private exe module there — replace with a lui.* public lib when one ships).
   Renamed to text_engine for this host.
*)

(* Platform text engine for the window host: turns the paint
   pipeline's text_ops requests into glyph ops on the scene's shared
   atlases and measures leaf text for the layout stub.

   The engine is device-pixel correct: fonts are created at logical
   (point) size, glyph positions are scaled by the backing scale and
   snapped to device pixels, and rasterization happens at the full
   scale so Retina text stays sharp. *)

open Lui_scene

module Lui_text = Host_platform.Text

(* Cache key for one rasterized glyph in an atlas. *)
type glyph_key = {
  gk_font : Lui_text.font;
  gk_id : int;
  gk_sub : int;   (* quantized subpixel origin slot *)
  gk_shade : int; (* quantized ink luminance, 0..8 *)
  gk_scale : int; (* device scale, thousandths *)
}

(* Atlas position plus the bitmap's draw offsets — everything the
   glyph record needs, so a cached glyph never re-rasterizes. *)
type slot = {
  sl_x : int;
  sl_y : int;
  sl_w : int;
  sl_h : int;
  sl_left : int;
  sl_top : int;
  sl_colored : bool;
}

type t = {
  scene : unit -> Lui_scene.t;
  scale : unit -> float;
  store : unit -> Lui_store.t;
  slots : (glyph_key, slot option) Hashtbl.t;
  layouts : Lui_text.Cache.t;
  editing_layouts : (int, int * Lui_text.Cache.t) Hashtbl.t;
  mutable layout_revision : int;
}

let create ~scene ~scale ~store =
  { scene; scale; store; slots = Hashtbl.create 512; layouts = Lui_text.Cache.create 2048;
    editing_layouts = Hashtbl.create 4; layout_revision = -1 }

let editable_text store id =
  match Lui_store.kind store id with
  | "input" | "text-field" | "secure-field" | "search-field" | "textarea"
  | "number-stepper" | "extension:logseq-editor" -> true
  | _ ->
    match Lui_store.string_prop store id "style-class" with
    | Some cls -> String.starts_with ~prefix:"ed-" cls
      || cls = "block-editor" || String.starts_with ~prefix:"block-editor " cls
    | None -> false

(* Editing shapes belong to the current node version, including its caret
   prefixes and wrap offers. Keep them out of the shared caption history. *)
let layout_cache t id =
  let store = t.store () in
  let store_revision = Lui_store.revision store in
  if store_revision <> t.layout_revision then begin
    t.layout_revision <- store_revision;
    Hashtbl.filter_map_inplace (fun node cached ->
      if Lui_store.mem store node && editable_text store node then Some cached else None)
      t.editing_layouts
  end;
  if not (editable_text store id) then t.layouts
  else
    let node_revision = Lui_store.node_revision (Option.get (Lui_store.find_opt store id)) in
    match Hashtbl.find_opt t.editing_layouts id with
    | Some (previous,cache) ->
      if previous <> node_revision then begin
        Lui_text.Cache.clear cache;
        Hashtbl.replace t.editing_layouts id (node_revision,cache)
      end;
      cache
    | None ->
      let cache = Lui_text.Cache.create 32 in
      Hashtbl.add t.editing_layouts id (node_revision,cache);
      cache

(* ---- font + text prop plumbing ---- *)

let rec parse_len s =
  let n = String.length s in
  let stop =
    let rec find i =
      if i >= n then n
      else
        match s.[i] with
        | '0' .. '9' | '.' | '-' | '+' -> find (i + 1)
        | _ -> i
    in
    find 0
  in
  if stop = 0 then
    (* "var(--name, <fallback>)" — the app's declared default is a
       plain number; custom-prop resolution lives in the host's
       color_of hook, so here the fallback is the value *)
    if String.length s > 4 && String.sub s 0 4 = "var(" then
      match String.rindex_opt s ',' with
      | Some comma ->
        let fb =
          String.sub s (comma + 1) (n - comma - 1)
          |> String.trim
          |> fun t ->
            if String.length t > 0 && t.[String.length t - 1] = ')' then
              String.sub t 0 (String.length t - 1)
            else t
        in
        parse_len fb
      | None -> None
    else None
  else
    let unit =
      match String.sub s stop (String.length s - stop) |> String.trim with
      | "rem" | "em" -> 16.
      | _ -> 1.
    in
    (try Some (float_of_string (String.sub s 0 stop) *. unit)
     with _ -> None)

let num_prop store id name =
  match Lui_store.prop store id name with
  | Some (Lui_protocol.FloatValue f) -> Some f
  | Some (IntValue i) -> Some (float i)
  | Some (StringValue s) ->
      Option.bind (Theme_vars.resolve_value s 0) parse_len
  | _ -> None

(* A selected top-strip tab — the bare kind or a direct button child
   of a tabs strip — draws heavier ink. *)
let selected_tab_trigger store id =
  Lui_store.bool_prop store id "selected"
  && (match Lui_store.kind store id with
     | "tab" -> true
     | "button" -> (
       match Lui_store.parent store id with
       | Some pid -> Lui_store.kind store pid = "tabs"
       | None -> false)
     | _ -> false)

(* font-size and font-weight inherit like the CSS they model: a node
   without its own value uses the nearest ancestor's. kbd's smaller
   default still applies before the walk. *)
let inherited_num store id name =
  let rec walk id =
    match num_prop store id name with
    | Some v -> Some v
    | None -> (
      match Lui_store.parent store id with
      | Some pid when pid <> id -> walk pid
      | _ -> None)
  in
  walk id

let inherited_int store id name =
  let rec walk id =
    match Lui_store.int_prop store id name with
    | Some v -> Some v
    | None -> (
      match Lui_store.parent store id with
      | Some pid when pid <> id -> walk pid
      | _ -> None)
  in
  walk id

(* Font family tokens use the same theme snapshot as colors and sizes. *)
let var_fallback s = Theme_vars.resolve_value s 0

let inherited_str store id name =
  let rec walk id =
    match Lui_store.prop store id name with
    | Some (Lui_protocol.StringValue s) -> Some s
    | Some _ -> None
    | None -> (
      match Lui_store.parent store id with
      | Some pid when pid <> id -> walk pid
      | _ -> None)
  in
  walk id

let logged_family = ref false

let font_of store id =
  let size =
    match inherited_num store id "font-size" with
    | Some v -> v
    | None -> (
      (* Keycaps set smaller type than the surrounding copy. *)
      match Lui_store.kind store id with
      | "kbd" -> 11.
      | _ -> 14.)
  in
  let weight =
    match inherited_int store id "font-weight" with
    | Some w -> min 900 (max 100 w)
    | None ->
      (match Lui_store.kind store id with
       | "heading" -> 700
       | "tab" | "button" when selected_tab_trigger store id -> 600
       | "dialog" | "sheet" -> 600
       | _ -> 400)
  in
  (* The app declares font-family:"Inter" on the root (ui_theme.ml) and
     var(--ls-font-family-code, monospace) on code surfaces. Unresolved
     family → Inter, matching the web default; Lui_text.create expands
     "monospace" to the system mono and falls back to the system font
     for families CoreText can't match (i.e. Inter unregistered). *)
  let families =
    match inherited_str store id "font-family" with
    | Some s -> (match var_fallback s with
        | Some value -> String.split_on_char ',' value |> List.map String.trim
        | None -> ["Inter"])
    | None -> ["Inter"]
  in
  let italic =
    match inherited_str store id "font-style" with
    | Some "italic" | Some "oblique" -> true
    | _ -> false
  in
  let f = Lui_text.create ~families ~weight ~italic ~size () in
  (match Sys.getenv_opt "LOGSEQ_NATIVE_DEBUG", !logged_family with
   | Some _, false ->
     logged_family := true;
     Printf.eprintf "font_of: families=[%s] resolved=%s size=%g weight=%d\n%!"
       (String.concat "," families)
       (Lui_text.family f) size weight
   | _ -> ());
  f

(* Unitless CSS line heights inherit as multipliers; lengths and percentages
   inherit the value computed at the declaring node. Numeric wire values are
   already resolved point lengths. *)
let line_height_of store id =
  let rec owner node =
    match Lui_store.prop store node "line-height" with
    | Some value -> Some (node, value)
    | None -> Option.bind (Lui_store.parent store node) owner
  in
  let points owner spec =
    let s = String.trim spec in
    let length suffix factor =
      let raw =
        String.sub s 0 (String.length s - String.length suffix) |> String.trim
      in
      match float_of_string_opt raw with
      | Some value -> Some (factor *. value)
      | None -> invalid_arg ("Invalid native line height: " ^ s)
    in
    if s = "normal" then None
    else
      match float_of_string_opt s with
      | Some ratio -> Some (ratio *. Lui_text.size (font_of store id))
      | None ->
          if String.ends_with ~suffix:"rem" s then length "rem" 16.
          else if String.ends_with ~suffix:"em" s then
            length "em" (Lui_text.size (font_of store owner))
          else if String.ends_with ~suffix:"px" s then length "px" 1.
          else if String.ends_with ~suffix:"%" s then
            length "%" (Lui_text.size (font_of store owner) /. 100.)
          else invalid_arg ("Unsupported native line height: " ^ s)
  in
  match owner id with
  | None -> None
  | Some (_, Lui_protocol.FloatValue value) -> Some value
  | Some (_, IntValue value) -> Some (float value)
  | Some (node, StringValue value) ->
      Option.bind (Theme_vars.resolve_value value 0) (points node)
  | Some _ -> invalid_arg "Invalid native line-height property"

(* ---- atlas upload ---- *)

(* Quantized ink luminance the engine thickens dark-on-light stems
   with (0 black .. 8 white). *)
let shade_of (c : color) =
  let lum =
    (0.2126 *. float c.r +. 0.7152 *. float c.g +. 0.0722 *. float c.b)
    /. 255.
  in
  min 8 (max 0 (int_of_float (lum *. 8. +. 0.5)))

let atlas_put ~colored atlas b =
  let rec try_alloc () =
    match Atlas.alloc_last atlas b.Lui_text.w b.Lui_text.h with
    | Some pos -> Some pos
    | None ->
      (* Atlas full: grow moves no lasting rects, so cached slots
         stay valid; then retry. *)
      if Atlas.grow atlas then try_alloc () else None
  in
  match try_alloc () with
  | None -> None
  | Some (x, y) ->
    Atlas.put atlas ~x ~y ~w:b.Lui_text.w ~h:b.Lui_text.h
      ~src:b.Lui_text.pixels
      ~stride:(b.Lui_text.w * (if colored then 4 else 1));
    Some (x, y)

(* Rasterize + upload a glyph, memoized so each unique (font, glyph,
   subpixel origin, ink shade, scale) rasterizes once. *)
let slot_of t run_font gid sub shade scale scene =
  let key =
    { gk_font = run_font; gk_id = gid; gk_sub = sub;
      gk_shade = shade; gk_scale = int_of_float (scale *. 1024.) }
  in
  match Hashtbl.find_opt t.slots key with
  | Some s -> s
  | None ->
    let n = Lui_text.subpixel_positions ~scale run_font in
    let dx = if n <= 1 then 0. else float sub /. float n in
    let slot =
      match
        Lui_text.rasterize ~scale ~dx
          ~shade:(float shade /. 8.) run_font gid
      with
      | Some b when b.Lui_text.w > 0 && b.Lui_text.h > 0 ->
        let colored = b.Lui_text.color in
        let atlas =
          if colored then scene.color_atlas else scene.mask_atlas
        in
        (match atlas_put ~colored atlas b with
         | Some (x, y) ->
           Some
             { sl_x = x; sl_y = y; sl_w = b.w; sl_h = b.h;
               sl_left = b.left; sl_top = b.top; sl_colored = colored }
         | None -> None)
      | _ -> None
    in
    Hashtbl.replace t.slots key slot;
    slot

(* ---- paint hook ---- *)

(* Emit one positioned glyph; appends to [scene.glyphs] and returns
   whether one was added. *)
let emit_glyph t scene ~scale ~pen ~baseline ~font ~gid ~g_y ~fg =
  let ix = Float.floor pen in
  let n = Lui_text.subpixel_positions ~scale font in
  let sub =
    if n <= 1 then 0
    else min (n - 1) (int_of_float ((pen -. ix) *. float n +. 0.5))
  in
  match slot_of t font gid sub (shade_of fg) scale scene with
  | None -> false
  | Some s ->
    let gl =
      { gx = ix +. float s.sl_left;
        gy = baseline +. g_y *. scale +. float s.sl_top;
        gw = float s.sl_w; gh = float s.sl_h;
        gu = s.sl_x; gv = s.sl_y;
        guw = s.sl_w; gvh = s.sl_h;
        gcolor = fg; gwide = 0;
        gcolored = s.sl_colored;
        gsubpixel = false; gthin = false }
    in
    (* Lui_paint seals the frame by reversing this accumulator. *)
    scene.glyphs <- gl :: scene.glyphs;
    true

let text_layout t id (r : Lui_scene.rect) s =
  let scale = t.scale () in
  let store = t.store () in
  let font = font_of store id in
  (* Horizontal placement: the shared placement table decides the kind's
     alignment and content inset; props win over it. *)
  let tp = Lui_paint.text_placement_of store id in
  let pad = tp.tp_pad_left *. scale in
  let x0 = r.x +. pad in
  let w' = Float.max 0. (r.w -. ((tp.tp_pad_left +. tp.tp_pad_right) *. scale)) in
  (* Flowing text wraps at its padded width so a long line never spills
     into the node's inset; labeled controls keep a single line. *)
  let wrap_w =
    if r.w <= 0. || Lui_store.string_prop store id "white-space" = Some "nowrap" then 0.
    else match Lui_store.kind store id with
    | "text" | "paragraph" | "heading" | "dialog" | "sheet" | "drawer"
    | "popover" | "alert" ->
      (* LUI's pixel-snapping contract edge-rounds every exported rect,
         which can trim up to 1 device px off a box layout sized to its
         fractional intrinsic width (0.5 px per edge). Wrapping at the
         snapped width then broke shrink-wrapped single lines ("Oct
         13th, / 2026", "Secon-d"). Give the wrap that 1 px back. *)
      (w' +. 1.) /. scale
    | _ -> 0.
  in
  let layout = Lui_text.Cache.layout (layout_cache t id) font s ~width:wrap_w
    ?line_height:(line_height_of store id) in
  (* Vertical centering inside the node's rect, device pixels. *)
  let text_h = layout.lay_height *. scale in
  let y0 =
    if tp.tp_top then r.y +. (tp.tp_pad_top *. scale)
    else r.y +. Float.max 0. ((r.h -. text_h +. (tp.tp_pad_top -. tp.tp_pad_bottom) *. scale) /. 2.)
  in
  (layout, x0, y0)

let text_ops t id r fg s =
  let scene = t.scene () in
  let scale = t.scale () in
  let store = t.store () in
  let tp = Lui_paint.text_placement_of store id in
  let layout, x0, y0 = text_layout t id r s in
  let w' = Float.max 0. (r.w -. ((tp.tp_pad_left +. tp.tp_pad_right) *. scale)) in
  let lines =
    if Lui_store.string_prop store id "text-overflow" = Some "ellipsis"
       && layout.lay_width *. scale > w' then
      match Lui_text.truncate ~width:(w' /. scale) layout.lay_base s with
      | Some line -> [|line,layout.lay_lines.(0).ll_baseline|]
      | None -> [||]
    else Array.map (fun (l : Lui_text.line_layout) -> l.ll_line,l.ll_baseline) layout.lay_lines
  in
  let gstart = List.length scene.glyphs in
  Array.iter
    (fun ((l : Lui_text.line),line_baseline) ->
       let baseline = Lui_text.baseline (y0 +. line_baseline *. scale) in
       let lx =
         match tp.tp_align with
         | Lui_paint.Ta_start -> x0
         | Ta_center -> x0 +. Float.max 0. ((w' -. l.width *. scale) /. 2.)
         | Ta_end -> x0 +. Float.max 0. (w' -. l.width *. scale)
       in
       Array.iter
         (fun (run : Lui_text.run) ->
            Array.iter
              (fun (g : Lui_text.glyph) ->
                 ignore
                   (emit_glyph t scene ~scale
                      ~pen:(lx +. g.x *. scale)
                      ~baseline ~font:run.font ~gid:g.id ~g_y:g.y ~fg))
              run.glyphs)
         l.runs)
    lines;
  let gend = List.length scene.glyphs in
  if gend = gstart then []
  else
    [ Glyphs
        { gstart; gend; gpaint = Solid;
          gcolor = fg; gcolor2 = fg; ggradient = (0., 0., 0., 0.);
          gwide2 = 0; gopacity = 1. } ]

(* ---- layout measure ---- *)

(* Kinds whose intrinsic size is their text; everything else falls
   back to the layout stub's fixed extents. *)
let textish = function
  | "text" | "heading" | "paragraph" | "label" | "kbd" | "link"
  | "button" | "toggle-button" | "text-field" | "secure-field"
  | "input" | "search-field" | "textarea" | "list-item" | "menu-item"
  | "select" | "combobox" | "checkbox" | "radio" | "switch" -> true
  | _ -> false

let pad_size store id ~scale (width, height) =
  let placement = Lui_paint.text_measure_placement_of store id in
  ( width +. ((placement.tp_pad_left +. placement.tp_pad_right) *. scale),
    height +. ((placement.tp_pad_top +. placement.tp_pad_bottom) *. scale) )

let measure store id ~scale =
  if not (textish (Lui_store.kind store id)) then (0., 0.)
  else
    let text =
      match Lui_store.string_prop store id "text" with
      | Some s when s <> "" -> s
      | _ ->
        (match Lui_store.string_prop store id "placeholder" with
         | Some s -> s
         | None -> "")
    in
    if text = "" then (0., 0.)
    else
      let layout = Lui_text.layout ?line_height:(line_height_of store id) (font_of store id) text in
      let w,h=layout.lay_width,layout.lay_height in
      pad_size store id ~scale (w *. scale, h *. scale)

(* Device-pixel (w, h) of an arbitrary string in node [id]'s font —
   the caret offset and the composition overlay measure through this
   so they stay consistent with what [text_ops] paints. [width] is an
   offered wrap width in device px (0/non-finite = no wrap, the
   single-line measure the caret paths rely on). *)
let measure_text ?(width = 0.) t id s =
  if s = "" then (0., 0.)
  else
    let scale = t.scale () in
    let width =
      if Lui_store.string_prop (t.store ()) id "white-space" = Some "nowrap" then 0.
      else if Float.is_finite width && width > 0. then width /. scale else 0.
    in
    let store=t.store () in
    let w, h = Lui_text.Cache.measure (layout_cache t id) ~width
      ?line_height:(line_height_of store id) (font_of store id) s in
    (w *. scale, h *. scale)
