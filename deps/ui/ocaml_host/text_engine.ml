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

type flow_piece = { piece_node : int; piece_lo : int; piece_hi : int }
type flow_projection = { flow_lo : int; flow_hi : int; content_lo : int; content_hi : int }
type flow_range = { range_node : int; range_projection : flow_projection; range_visible : bool }
type flow_body = {
  flow_spans : Lui_text.span list;
  flow_ranges : flow_range list;
  flow_range_table : (int, flow_projection) Hashtbl.t;
  flow_pieces : flow_piece array;
}

type flow_surface = {
  surface_layout : Lui_text.layout;
  surface_x : float;
  surface_y : float;
  surface_ranges : (int, flow_projection) Hashtbl.t;
}

type t = {
  scene : unit -> Lui_scene.t;
  scale : unit -> float;
  store : unit -> Lui_store.t;
  slots : (glyph_key, slot option) Hashtbl.t;
  layouts : Lui_text.Cache.t;
  editing_layouts : (int, int * Lui_text.Cache.t) Hashtbl.t;
  mutable layout_revision : int;
  flow_bodies : (int, int * int * flow_body option) Hashtbl.t;
  mutable flow_revision : int;
  mutable input_node : int;
  mutable input_session : int;
  mutable input_caret : int;
  mutable input_anchor : int;
  mutable input_text : string;
  mutable input_ime : Lui_ime.state;
  mutable input_visible : bool;
  mutable input_next : float option;
  mutable input_pan : float;
}

let create ~scene ~scale ~store =
  { scene; scale; store; slots = Hashtbl.create 512; layouts = Lui_text.Cache.create 2048;
    editing_layouts = Hashtbl.create 4; layout_revision = -1;
    flow_bodies = Hashtbl.create 4; flow_revision = -1;
    input_node = 0; input_session = 0; input_caret = 0; input_anchor = 0;
    input_text = ""; input_ime = Lui_ime.initial; input_visible = false;
    input_next = None; input_pan = 0. }

let editable_text store id =
  match Lui_store.kind store id with
  | "input" | "text-field" | "secure-field" | "search-field" | "textarea" | "combobox"
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
      Option.bind (Theme_vars.resolve_value s) parse_len
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
let var_fallback s = Theme_vars.resolve_value s

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
      Option.bind (Theme_vars.resolve_value value) (points node)
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

let flow_body t id =
  let store = t.store () in
  let revision = Lui_store.layout_rev store in
  if revision <> t.flow_revision then begin
    t.flow_revision <- revision;
    Hashtbl.filter_map_inplace (fun node cached ->
      if Lui_store.string_prop store node "style-class" = Some "ed-line" then Some cached else None)
      t.flow_bodies
  end;
  if Lui_store.string_prop store id "style-class" <> Some "ed-line" then None
  else match Hashtbl.find_opt t.flow_bodies id with
  | Some (previous,theme,body) when previous=revision && theme= !Theme_vars.generation -> body
  | previous ->
    let buffer = Buffer.create 128 and spans = ref [] and ranges = ref [] and pieces = ref [] in
    let supported = ref true in
    let edge_keys = ["margin";"margin-horizontal";
      "margin-vertical";"margin-top";"margin-right";"margin-bottom";"margin-left";
      "width";"height";"gap"] in
    let rec visit visible node =
      let visible = visible && Lui_store.string_prop store node "display" <> Some "none" in
      let start = Buffer.length buffer in
      let padding=Lui_paint.text_placement_of store node in
      let font=font_of store node in
      let object_ width =
        if visible && node<>id && width>0. then begin
          let first=Buffer.length buffer in
          Buffer.add_string buffer "\xef\xbf\xbc";
          spans:=((first,Buffer.length buffer),{Lui_text.default_style with sfont=Some font;
            sobject=Some {Lui_text.object_width=width;object_ascent=0.;object_descent=0.}})::!spans
        end in
      (* Measured U+FFFC objects carry padding; U+2060 keeps each inset attached
         to its content at a wrap boundary. Neither contributes painted ink. *)
      if visible && node<>id && padding.tp_pad_left>0. then begin
        object_ padding.tp_pad_left;Buffer.add_string buffer "\xe2\x81\xa0"
      end;
      let content_start=Buffer.length buffer in
      if visible then begin
        if node<>id && (not (List.mem (Lui_store.kind store node)
          ["text";"row";"column";"stack";"box";"link";"paragraph";"kbd"])
          || List.exists (fun key -> match num_prop store node key with
             | Some value -> value<>0. | None -> false) edge_keys) then supported:=false;
        let pad = match Lui_store.string_prop store node "style-class" with
          | Some value -> List.mem "ed-pad" (String.split_on_char ' ' value) | None -> false in
        (match Lui_store.string_prop store node "text" with
         | Some text when text<>"" && not pad ->
           Buffer.add_string buffer text;
           let stop = Buffer.length buffer in
           spans := ((content_start,stop),{Lui_text.default_style with sfont=Some font;
             skern=Option.value (inherited_num store node "letter-spacing") ~default:0.}) :: !spans;
           pieces := {piece_node=node;piece_lo=content_start;piece_hi=stop} :: !pieces
         | _ -> ())
      end;
      List.iter (visit visible) (Lui_store.child_ids store node);
      let content_stop=Buffer.length buffer in
      if visible && node<>id && padding.tp_pad_right>0. then begin
        Buffer.add_string buffer "\xe2\x81\xa0";object_ padding.tp_pad_right
      end;
      if node<>id then ranges := {range_node=node;range_projection={flow_lo=start;
        flow_hi=Buffer.length buffer;content_lo=content_start;content_hi=content_stop};
        range_visible=visible} :: !ranges
    in
    visit true id;
    let body = if not !supported then None else
      let text = Buffer.contents buffer in
      let ranges=List.rev !ranges in
      let range_table=Hashtbl.create (List.length ranges) in
      List.iter (fun range -> Hashtbl.add range_table range.range_node
        range.range_projection) ranges;
      Some {flow_spans=List.rev_map (fun (range,style) -> {Lui_text.text;range;style}) !spans;
        flow_ranges=ranges;flow_range_table=range_table;
        flow_pieces=Array.of_list (List.rev !pieces)} in
    (match previous,body with
     | Some (_,_,Some old),Some body when old.flow_spans<>body.flow_spans ->
       Lui_text.Cache.clear (layout_cache t id)
     | _ -> ());
    Hashtbl.replace t.flow_bodies id (revision, !Theme_vars.generation,body);
    body

let shaped_flow t id offered =
  Option.map (fun body ->
    let store=t.store () in
    let width=if Float.is_finite offered && offered>0. then offered/.t.scale () else 0. in
    let layout=Lui_text.Cache.layout_spans (layout_cache t id) ~width
      ?line_height:(line_height_of store id) (font_of store id) body.flow_spans in
    body,layout) (flow_body t id)

let flow_span_rects layout first last =
  if first=last then [Lui_text.caret_rect layout first]
  else Lui_text.selection_rects layout (first,last)

let flow_node_rects t layout range =
  let projection=range.range_projection in
  let rects=flow_span_rects layout projection.flow_lo projection.flow_hi in
  if projection.flow_lo=projection.flow_hi then rects else
  let store=t.store () in
  let metrics=Lui_text.metrics (font_of store range.range_node) in
  let padding=Lui_paint.text_placement_of store range.range_node in
  List.map (fun (rect:Lui_text.rect) ->
    let line=Option.get (Array.find_opt (fun (line:Lui_text.line_layout) ->
      abs_float (line.ll_top-.rect.ry)<0.001) layout.Lui_text.lay_lines) in
    {rect with Lui_text.ry=line.ll_baseline-.metrics.ascent-.padding.tp_pad_top;
      rh=metrics.ascent+.metrics.descent+.padding.tp_pad_top+.padding.tp_pad_bottom}) rects

let text_flow t id offered =
  Option.map (fun (body,layout) ->
    let scale=t.scale () in
    let rects=List.filter_map (fun range ->
      if not range.range_visible then None else
      let rects=flow_node_rects t layout range in
      let x,y,right,bottom=List.fold_left (fun (x,y,right,bottom) (r:Lui_text.rect) ->
        min x r.rx,min y r.ry,max right (r.rx+.r.rw),max bottom (r.ry+.r.rh))
        (infinity,infinity,neg_infinity,neg_infinity) rects in
      if rects=[] then None else Some (range.range_node,
        {Lui_scene.x=x*.scale;y=y*.scale;w=(right-.x)*.scale;h=(bottom-.y)*.scale})) body.flow_ranges in
    {Lui_paint.flow_width=layout.lay_width*.scale;flow_height=layout.lay_height*.scale;
      flow_rects=rects}) (shaped_flow t id offered)

let shaped_flow_in_rect t id rect =
  Option.bind (flow_body t id) (fun _ ->
    let rect=Lui_paint.text_flow_content_rect ~scale:(t.scale ()) (t.store ()) id rect in
    Option.map (fun (body,layout) -> body,layout,rect) (shaped_flow t id rect.w))

let flow_surface t id rect =
  Option.map (fun (body,layout,(rect:Lui_scene.rect)) ->
    {surface_layout=layout;surface_x=rect.x;surface_y=rect.y;
     surface_ranges=body.flow_range_table})
    (shaped_flow_in_rect t id rect)

let text_layout t id (r : Lui_scene.rect) s =
  match flow_surface t id r with
  | Some surface -> surface.surface_layout,surface.surface_x,surface.surface_y
  | None ->
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
    if r.w <= 0. || inherited_str store id "white-space" = Some "nowrap" then 0.
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

let text_flow_ops t ctx id (rect:Lui_scene.rect) fg =
  Option.map (fun (body,layout,(rect:Lui_scene.rect)) ->
    let scene=t.scene () and scale=t.scale () and store=t.store () in
    let piece_color cluster =
      let pieces=body.flow_pieces in
      let rec find lo hi =
        if lo>hi then None else
        let mid=lo+(hi-lo)/2 in
        let piece=pieces.(mid) in
        if cluster<piece.piece_lo then find lo (mid-1)
        else if cluster>=piece.piece_hi then find (mid+1) hi
        else Some (Lui_paint.text_fg ctx store piece.piece_node) in
      find 0 (Array.length pieces-1) in
    let backgrounds=List.concat_map (fun range ->
      if not range.range_visible || range.range_projection.flow_lo=range.range_projection.flow_hi then [] else
      let state=Lui_paint.effective_state ctx.Lui_paint.hooks store range.range_node in
      let style=Lui_paint.resolve_style store range.range_node state in
      List.concat_map (fun (r:Lui_text.rect) ->
        Lui_paint.box_ops ctx store range.range_node style
          {Lui_scene.x=rect.x+.r.rx*.scale;y=rect.y+.r.ry*.scale;
           w=r.rw*.scale;h=r.rh*.scale} 1.)
        (flow_node_rects t layout range)) body.flow_ranges in
    let first=List.length scene.glyphs in
    Array.iter (fun (line:Lui_text.line_layout) ->
      let baseline=Lui_text.baseline (rect.y+.line.ll_baseline*.scale) in
      Array.iter (fun (run:Lui_text.run) -> if not run.rinline then
        Array.iter (fun (glyph:Lui_text.glyph) ->
          Option.iter (fun fg -> ignore (emit_glyph t scene ~scale ~pen:(rect.x+.glyph.x*.scale) ~baseline
            ~font:run.font ~gid:glyph.id ~g_y:glyph.y ~fg)) (piece_color glyph.cluster)) run.glyphs)
        line.ll_line.runs) layout.lay_lines;
    let last=List.length scene.glyphs in
    if first=last then backgrounds else backgrounds @
      [Glyphs {gstart=first;gend=last;gpaint=Solid;gcolor=fg;gcolor2=fg;
        ggradient=(0.,0.,0.,0.);gwide2=0;gopacity=1.}]) (shaped_flow_in_rect t id rect)

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
         (fun (run : Lui_text.run) -> if not run.rinline then
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
      if inherited_str (t.store ()) id "white-space" = Some "nowrap" then 0.
      else if Float.is_finite width && width > 0. then width /. scale else 0.
    in
    let store=t.store () in
    let w, h = Lui_text.Cache.measure (layout_cache t id) ~width
      ?line_height:(line_height_of store id) (font_of store id) s in
    (w *. scale, h *. scale)

(* Native input and paint use the same shaped text, including password masks. *)
let ordinary_input store id =
  Lui_store.is_editable_text_kind (Lui_store.kind store id)
  || Lui_store.kind store id = "combobox"

let active_input store ui id =
  id <> 0 && ordinary_input store id
  && Lui_window.Ui.focused ui = id
  && Lui_store.prop store id "enabled" <> Some (Lui_protocol.BoolValue false)
  && not (Lui_store.inert_in_chain store id)

type input_layout = {
  shaped : Lui_text.layout;
  origin_x : float;
  origin_y : float;
  inner : Lui_scene.rect;
  alignment : Lui_paint.text_align;
  to_shown : int -> int;
  from_shown : int -> int;
}

let input_layout t id r text =
  let store = t.store () and scale = t.scale () in
  let secure = Lui_store.kind store id = "secure-field" in
  let shown = if secure then Lui_paint.secure_mask text else text in
  let shaped, origin_x, origin_y = text_layout t id r shown in
  let p = Lui_paint.text_placement_of store id in
  let inner =
    rect
      (r.x +. (p.tp_pad_left *. scale))
      (r.y +. (p.tp_pad_top *. scale))
      (Float.max 0. (r.w -. ((p.tp_pad_left +. p.tp_pad_right) *. scale)))
      (Float.max 0. (r.h -. ((p.tp_pad_top +. p.tp_pad_bottom) *. scale)))
  in
  {
    shaped;
    origin_x;
    origin_y;
    inner;
    alignment = p.tp_align;
    to_shown = (if secure then Lui_paint.secure_masked_of_byte text else Fun.id);
    from_shown =
      (if secure then Lui_paint.secure_byte_of_masked text else Fun.id);
  }

let input_line_offset g y scale =
  let lines = g.shaped.Lui_text.lay_lines in
  let rec find k =
    if k >= Array.length lines - 1 then max 0 k
    else if y < lines.(k + 1).Lui_text.ll_top then k
    else find (k + 1)
  in
  if Array.length lines = 0 then 0.
  else
    let width = lines.(find 0).Lui_text.ll_line.width *. scale in
    match g.alignment with
    | Lui_paint.Ta_start -> 0.
    | Ta_center -> Float.max 0. ((g.inner.w -. width) /. 2.)
    | Ta_end -> Float.max 0. (g.inner.w -. width)

let input_rect t g (r : Lui_text.rect) =
  let scale = t.scale () in
  rect
    (g.origin_x +. input_line_offset g r.ry scale +. (r.rx *. scale))
    (g.origin_y +. (r.ry *. scale))
    (r.rw *. scale) (r.rh *. scale)

let input_caret t g offset =
  input_rect t g (Lui_text.caret_rect g.shaped (g.to_shown offset))

let input_selection t g first last =
  List.map (input_rect t g)
    (Lui_text.selection_rects g.shaped (g.to_shown first, g.to_shown last))

let input_offset t id = if t.input_node = id then t.input_pan else 0.

let bind_input t ui =
  Lui_window.Ui.set_measure ui (fun store id text ->
      let text =
        if Lui_store.kind store id = "secure-field" then
          Lui_paint.secure_mask text
        else text
      in
      measure_text t id text);
  Lui_window.Ui.set_caret_ops ui (fun _store id text ~lw ~lh ->
      let g = input_layout t id (rect 0. 0. lw lh) text in
      let map move offset = g.from_shown (move g.shaped (g.to_shown offset)) in
      {
        Lui_window.Ui.c_before = map Lui_text.caret_before;
        c_after = map Lui_text.caret_after;
        c_up = map Lui_text.caret_up;
        c_down = map Lui_text.caret_down;
        c_rect =
          (fun offset ->
            let r = input_caret t g offset in
            (r.x -. input_offset t id, r.y, r.h));
      });
  Lui_window.Ui.set_hit_text ui (fun _store id text ~lx ~ly ~lw ~lh ->
      let g = input_layout t id (rect 0. 0. lw lh) text in
      let scale = t.scale () in
      let y = (ly -. g.origin_y) /. scale in
      let x =
        (lx -. g.origin_x +. input_offset t id -. input_line_offset g y scale)
        /. scale
      in
      g.from_shown (Lui_text.hit_test g.shaped (x, y)))

let tick_input t ui ~now =
  let id = Lui_window.Ui.focused ui in
  if not (active_input (t.store ()) ui id) then begin
    let old = t.input_node in
    t.input_node <- 0;
    t.input_next <- None;
    t.input_visible <- false;
    t.input_text <- "";
    t.input_ime <- Lui_ime.initial;
    t.input_pan <- 0.;
    if old = 0 then None else Some old
  end
  else
    let session, _, _ = Lui_window.Ui.text_revisions ui in
    let caret = Lui_window.Ui.caret ui
    and anchor = Lui_window.Ui.sel_anchor ui
    and text = Lui_window.Ui.shadow ui
    and ime = Lui_window.Ui.ime ui in
    let marked = ime.Lui_ime.marked_text in
    let composition_changed =
      marked != t.input_ime.marked_text
      || ime.cursor <> t.input_ime.cursor
      || ime.sel_len <> t.input_ime.sel_len
      || ime.active <> t.input_ime.active
    in
    if
      id <> t.input_node || session <> t.input_session || caret <> t.input_caret
      || anchor <> t.input_anchor || text != t.input_text || composition_changed
    then begin
      if id <> t.input_node || session <> t.input_session then t.input_pan <- 0.;
      t.input_node <- id;
      t.input_session <- session;
      t.input_caret <- caret;
      t.input_anchor <- anchor;
      t.input_text <- text;
      t.input_ime <- ime;
      t.input_visible <- caret = anchor || marked <> "";
      t.input_next <-
        (if caret = anchor && marked = "" then Some (now +. 0.5) else None);
      Some id
    end
    else
      match t.input_next with
      | Some next when now >= next ->
          let periods = 1 + int_of_float (floor ((now -. next) /. 0.5)) in
          if periods mod 2 = 1 then t.input_visible <- not t.input_visible;
          t.input_next <- Some (next +. (float periods *. 0.5));
          Some id
      | _ -> None

let input_deadline t = t.input_next

let utf8_cursor text count =
  let rec loop offset remaining =
    if remaining <= 0 || offset >= String.length text then offset
    else loop (Lui_query.utf8_next text offset) (remaining - 1)
  in
  loop 0 count

let input_display ui =
  let text = Lui_window.Ui.shadow ui in
  let caret = Lui_window.Ui.caret ui and anchor = Lui_window.Ui.sel_anchor ui in
  let first = min caret anchor and last = max caret anchor in
  let marked = Lui_window.Ui.marked ui in
  if marked = "" then (text, caret, first, last, None)
  else
    let display =
      String.sub text 0 first ^ marked
      ^ String.sub text last (String.length text - last)
    in
    let ime = Lui_window.Ui.ime ui in
    let offset = first + utf8_cursor marked ime.Lui_ime.cursor in
    let stop = first + utf8_cursor marked (ime.cursor + ime.sel_len) in
    (display, offset, offset, stop, Some (first, first + String.length marked))

let pan_input t g caret =
  let scale = t.scale () in
  let maximum =
    Float.max 0. ((g.shaped.lay_width *. scale) +. scale -. g.inner.w)
  in
  let pan = Float.min maximum t.input_pan in
  let pan =
    if caret.x -. pan < g.inner.x then caret.x -. g.inner.x
    else if caret.x +. scale -. pan > g.inner.x +. g.inner.w then
      caret.x +. scale -. g.inner.x -. g.inner.w
    else pan
  in
  t.input_pan <- Float.max 0. (Float.min maximum pan)

let input_caret_rect t ui id r =
  let text, offset, _, _, _ = input_display ui in
  let g = input_layout t id r text in
  let caret = input_caret t g offset in
  pan_input t g caret;
  { caret with x = caret.x -. t.input_pan; w = t.scale () }

let input_fill color region =
  Fill
    {
      frect = region;
      fradii = (0., 0., 0., 0.);
      fcontinuous = false;
      fcolor = color;
      fpaint = Solid;
      fcolor2 = color;
      fgradient = (0., 0., 0., 0.);
      fborder = (0., 0., 0., 0.);
      fborder_color = Lui_scene.color 0 0 0 0;
      fdashed = false;
      fwide = 0;
      fopacity = 1.;
    }

let control_text_ops t ~ui ~color_of id region foreground text =
  if not (active_input (t.store ()) ui id) then
    text_ops t id region foreground text
  else
    let store = t.store () in
    let hooks =
      {
        Lui_paint.default_hooks with
        color_of;
        state_of = Lui_window.Ui.state_of ui store;
      }
    in
    let caret_color =
      match Lui_paint.declared_foreground hooks store id with
      | Some color -> color
      | None -> Option.get (color_of "foreground")
    in
    let selection_foreground =
      Option.get (color_of "var(--ls-primary-text-color)")
    and selection_color =
      Option.get (color_of "var(--ls-selection-background-color)")
    in
    let display, offset, first, last, marked = input_display ui in
    let g = input_layout t id region display in
    let caret = input_caret t g offset in
    pan_input t g caret;
    let shift (r : Lui_scene.rect) = { r with x = r.x -. t.input_pan } in
    let clip =
      rect_intersect g.inner
        (rect 0. 0. (float (t.scene ()).width) (float (t.scene ()).height))
    in
    let selected_regions =
      List.filter_map
        (fun r ->
          let r = rect_intersect (shift r) clip in
          if rect_empty r then None else Some r)
        (input_selection t g first last)
    in
    let selected = List.map (input_fill selection_color) selected_regions in
    let ink =
      if display = "" && marked = None then text
      else if Lui_store.kind (t.store ()) id = "secure-field" then
        Lui_paint.secure_mask display
      else display
    in
    let glyphs =
      text_ops t id { region with x = region.x -. t.input_pan } foreground ink
    in
    (* Reuse glyph masks with constant selection ink. Clipping preserves
       partial ligatures and bidi gaps without reshaping the selected text. *)
    let selected_glyphs =
      List.map
        (function
          | Glyphs op ->
              Glyphs
                {
                  op with
                  gpaint = Linear;
                  gcolor = selection_foreground;
                  gcolor2 = selection_foreground;
                  ggradient = (0., 0., 1., 0.);
                }
          | op -> op)
        glyphs
    in
    let selection_ink =
      List.concat_map
        (fun region ->
          Push_clip
            { crect = region; cradii = (0., 0., 0., 0.); ccontinuous = false }
          :: (selected_glyphs @ [ Pop_clip ]))
        selected_regions
    in
    let underline =
      match marked with
      | None -> []
      | Some (start, stop) ->
          List.map
            (fun r ->
              let r = shift r in
              input_fill caret_color
                (rect r.x (r.y +. r.h -. t.scale ()) r.w (t.scale ())))
            (input_selection t g start stop)
    in
    let cursor =
      if t.input_visible && first = last then
        [ input_fill caret_color { (shift caret) with w = t.scale () } ]
      else []
    in
    Push_clip
      { crect = g.inner; cradii = (0., 0., 0., 0.); ccontinuous = false }
    :: (selected @ glyphs @ selection_ink @ underline @ cursor @ [ Pop_clip ])
