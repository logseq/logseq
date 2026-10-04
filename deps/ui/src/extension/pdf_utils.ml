(* pdfjs FFI + position math — ports of extensions/pdf/utils.js +
   utils.cljs. The viewer handle is opaque (Pdf_state.viewer). *)

module D = Web_dom

type viewer = Pdf_state.viewer

(* ---------- pdfjs viewer object ---------- *)

external event_bus : viewer -> Js.Json.t = "eventBus" [@@mel.get]

external viewer_el : viewer -> D.el = "viewer" [@@mel.get]

external container_el : viewer -> D.el = "container" [@@mel.get]

external pdf_document : viewer -> Js.Json.t = "pdfDocument" [@@mel.get]

external current_scale : viewer -> float = "currentScale" [@@mel.get]

external set_current_scale : viewer -> float -> unit = "currentScale"
  [@@mel.set]

external scale_value : viewer -> string option = "currentScaleValue"
  [@@mel.get] [@@mel.return nullable]

external set_scale_value : viewer -> string -> unit = "currentScaleValue"
  [@@mel.set]

external current_page : viewer -> int = "currentPageNumber" [@@mel.get]

external set_current_page : viewer -> int -> unit = "currentPageNumber"
  [@@mel.set]

external pages_count : viewer -> int = "pagesCount" [@@mel.get]

external set_group_identity : viewer -> string -> unit = "$groupIdentity"
  [@@mel.set]

external set_in_system_window : viewer -> bool -> unit = "$inSystemWindow"
  [@@mel.set]

external get_page_view : viewer -> int -> Js.Json.t option = "getPageView"
  [@@mel.send] [@@mel.return nullable]

external scroll_page_into_view : viewer -> Js.Json.t -> unit
  = "scrollPageIntoView" [@@mel.send]

external next_page : viewer -> unit = "nextPage" [@@mel.send]

external previous_page : viewer -> unit = "previousPage" [@@mel.send]

external cleanup : viewer -> unit = "cleanup" [@@mel.send]

external get_metadata : Js.Json.t -> Js.Json.t Js.Promise.t = "getMetadata"
  [@@mel.send]

(* page-view + viewport internals *)
external pv_viewport : Js.Json.t -> Js.Json.t = "viewport" [@@mel.get]

external pv_text_layer : Js.Json.t -> Js.Json.t = "textLayer" [@@mel.get]

external tl_div : Js.Json.t -> D.el = "div" [@@mel.get]

external pv_canvas : Js.Json.t -> D.el = "canvas" [@@mel.get]

external pv_div : Js.Json.t -> D.el = "div" [@@mel.get]

external vp_width : Js.Json.t -> float = "width" [@@mel.get]

external vp_height : Js.Json.t -> float = "height" [@@mel.get]

external vp_scale : Js.Json.t -> float = "scale" [@@mel.get]

external vp_to_pdf_point : Js.Json.t -> float -> float -> float array
  = "convertToPdfPoint" [@@mel.send]

external doc_destroy : Js.Json.t -> unit Js.Promise.t = "destroy"
  [@@mel.send]

(* EventBus *)
external bus_on : Js.Json.t -> string -> (Js.Json.t -> unit) -> unit = "on"
  [@@mel.send]

external bus_dispatch : Js.Json.t -> string -> Js.Json.t -> unit
  = "dispatch" [@@mel.send]

(* window selection / range *)
external get_selection : unit -> Js.Json.t = "getSelection"
  [@@mel.scope "window"]

external sel_is_collapsed : Js.Json.t -> bool = "isCollapsed" [@@mel.get]

external sel_range_at : Js.Json.t -> int -> Js.Json.t = "getRangeAt"
  [@@mel.send]

external sel_remove_all : Js.Json.t -> unit = "removeAllRanges" [@@mel.send]

external sel_to_string : Js.Json.t -> string = "toString" [@@mel.send]

external range_start_container : Js.Json.t -> Js.Json.t option
  = "startContainer" [@@mel.get] [@@mel.return nullable]

external range_common_ancestor : Js.Json.t -> Js.Json.t option
  = "commonAncestorContainer" [@@mel.get] [@@mel.return nullable]

external range_client_rects : Js.Json.t -> D.rect array = "getClientRects"
  [@@mel.send]

external el_contains : Js.Json.t -> Js.Json.t -> bool = "contains"
  [@@mel.send]

external parent_element : Js.Json.t -> D.el option = "parentElement"
  [@@mel.get] [@@mel.return nullable]

external dataset_page_number : D.el -> string option = "pageNumber"
  [@@mel.get] [@@mel.scope "dataset"] [@@mel.return nullable]


external set_scroll_left : D.el -> float -> unit = "scrollLeft"
  [@@mel.set]

external win_inner_height : float = "innerHeight" [@@mel.scope "window"]

external win_inner_width : float = "innerWidth" [@@mel.scope "window"]

(* pdfjs loading task + errors *)
external doc_promise : Js.Json.t -> Js.Json.t Js.Promise.t = "promise"
  [@@mel.get]

external err_name : Js.Json.t -> string = "name" [@@mel.get]

external err_message : Js.Json.t -> string = "message" [@@mel.get]

external err_stack : Js.Json.t -> string option = "stack"
  [@@mel.get] [@@mel.return nullable]

(* JSON object field helpers for event payloads *)
let json_f o k =
  match Js.Json.decodeObject o with
  | Some d -> (
      match Js.Dict.get d k with
      | Some v -> Js.Json.decodeNumber v
      | None -> None)
  | None -> None

let json_s o k =
  match Js.Json.decodeObject o with
  | Some d -> (
      match Js.Dict.get d k with
      | Some v -> Js.Json.decodeString v
      | None -> None)
  | None -> None

(* ---------- scaled <-> viewport positions ---------- *)

(* cljs viewportToScaled — input is a vw rect (x1=left y1=top) and the
   page viewport {width,height}; output keeps vw coords + page size *)
let viewport_to_scaled l t w h (vp : Js.Json.t) : Model.hl_rect =
  { Model.hl_x1 = l
  ; hl_y1 = t
  ; hl_x2 = l +. w
  ; hl_y2 = t +. h
  ; hl_w = vp_width vp
  ; hl_h = vp_height vp
  }

(* cljs scaledToViewport — scaled {x1,y1,x2,y2,width,height} -> vw rect
   (x1=left y1=top hl_w/h = pixel size) *)
let scaled_to_viewport (r : Model.hl_rect) (vp : Js.Json.t)
    : Model.hl_rect =
  let w = vp_width vp and h = vp_height vp in
  let x1 = w *. r.hl_x1 /. r.hl_w and y1 = h *. r.hl_y1 /. r.hl_h in
  let x2 = w *. r.hl_x2 /. r.hl_w and y2 = h *. r.hl_y2 /. r.hl_h in
  { Model.hl_x1 = x1
  ; hl_y1 = y1
  ; hl_x2 = x2
  ; hl_y2 = y2
  ; hl_w = x2 -. x1
  ; hl_h = y2 -. y1
  }

let scaled_to_vw_pos (viewer : viewer) (hl : Model.hl) : Model.hl option =
  match get_page_view viewer (hl.hl_page - 1) with
  | Some pv ->
      let vp = pv_viewport pv in
      Some
        { hl with
          hl_bounding = scaled_to_viewport hl.hl_bounding vp
        ; hl_rects = List.map (fun r -> scaled_to_viewport r vp) hl.hl_rects
        }
  | None -> None

(* vw rects -> scaled position (cljs vw-to-scaled-pos) *)
let vw_to_scaled (viewer : viewer) ~page ~bounding ~rects =
  match get_page_view viewer (page - 1) with
  | Some pv ->
      let vp = pv_viewport pv in
      let cnv (r : Model.hl_rect) =
        viewport_to_scaled r.hl_x1 r.hl_y1 r.hl_w r.hl_h vp
      in
      Some (cnv bounding, List.map cnv rects)
  | None -> None

(* ---------- rect math (utils.js) ---------- *)

let vw_rect ~left ~top ~width ~height : Model.hl_rect =
  { Model.hl_x1 = left
  ; hl_y1 = top
  ; hl_x2 = left +. width
  ; hl_y2 = top +. height
  ; hl_w = width
  ; hl_h = height
  }

let get_bounding_rect (rects : Model.hl_rect list) : Model.hl_rect option =
  match rects with
  | [] -> None
  | r0 :: tl ->
      let m =
        List.fold_left
          (fun (acc : Model.hl_rect) (r : Model.hl_rect) ->
            { acc with
              hl_x1 = Float.min acc.hl_x1 r.hl_x1
            ; hl_y1 = Float.min acc.hl_y1 r.hl_y1
            ; hl_x2 = Float.max acc.hl_x2 r.hl_x2
            ; hl_y2 = Float.max acc.hl_y2 r.hl_y2
            })
          r0 tl
      in
      Some
        { m with
          hl_w = m.hl_x2 -. m.hl_x1
        ; hl_h = m.hl_y2 -. m.hl_y1
        }

(* cljs optimizeClientRects: sort top->left, drop strictly contained,
   merge same-line (±5px) overlaps and nextTo (±10px) neighbours, ≤3
   passes *)
let optimize_client_rects (rects : Model.hl_rect list) : Model.hl_rect list =
  let arr =
    Array.of_list
      (List.sort
         (fun (a : Model.hl_rect) b ->
           let top = compare a.hl_y1 b.hl_y1 in
           if top = 0 then compare a.hl_x1 b.hl_x1 else top)
         rects)
  in
  (* first pass: drop rects strictly inside another *)
  let first_pass =
    List.filteri
      (fun i (r : Model.hl_rect) ->
        not
          (Array.exists
             (fun (o : Model.hl_rect) ->
               r.hl_y1 > o.hl_y1 && r.hl_x1 > o.hl_x1
               && r.hl_y2 < o.hl_y2 && r.hl_x2 < o.hl_x2)
             (Array.init (Array.length arr) (fun j ->
                  if j = i then arr.((j + 1) mod Array.length arr)
                  else arr.(j)))))
      (Array.to_list arr)
  in
  let fp = Array.of_list first_pass in
  let removed = Array.make (Array.length fp) false in
  for _pass = 0 to 2 do
    for i = 0 to Array.length fp - 1 do
      for j = 0 to Array.length fp - 1 do
        if i <> j && (not removed.(i)) && not removed.(j) then (
          let a = fp.(i) and b = fp.(j) in
          let same_line =
            Float.abs (a.hl_y1 -. b.hl_y1) < 5.
            && Float.abs (a.hl_h -. b.hl_h) < 5.
          in
          if same_line then (
            let overlaps =
              a.hl_x1 <= b.hl_x1 && b.hl_x1 <= a.hl_x1 +. a.hl_w
            in
            let next_to =
              a.hl_x1 <= b.hl_x1
              && a.hl_x1 +. a.hl_w <= b.hl_x1 +. b.hl_w
              && b.hl_x1 -. (a.hl_x1 +. a.hl_w) <= 10.
            in
            if overlaps || next_to then (
              let right =
                Float.max (a.hl_x1 +. a.hl_w) (b.hl_x1 +. b.hl_w)
              in
              let h = Float.max a.hl_h b.hl_h in
              fp.(i) <-
                { a with
                  hl_x2 = right
                ; hl_w = right -. a.hl_x1
                ; hl_h = h
                ; hl_y2 = a.hl_y1 +. h
                };
              removed.(j) <- true)))
    done
  done
done;
  List.filteri (fun i _ -> not removed.(i)) (Array.to_list fp)

(* ---------- page / selection helpers (utils.cljs) ---------- *)

let clear_all_selection () = sel_remove_all (get_selection ())

let get_page_from_el (el : D.el) =
  match D.el_closest el ".page" with
  | Some page_el -> (
      match dataset_page_number page_el with
      | Some n -> (try Some (int_of_string n, page_el) with _ -> None)
      | None -> None)
  | None -> None

let get_page_from_range (r : Js.Json.t) =
  match range_start_container r with
  | Some c -> (
      match parent_element c with
      | Some el -> get_page_from_el el
      | None -> None)
  | None -> None

let get_range_rects (r : Js.Json.t) (page_cnt : D.el)
    : Model.hl_rect list =
  let cnt = D.el_bounding_rect page_cnt in
  let st = D.el_scroll_top page_cnt in
  let sl = Web_dom.el_scroll_left page_cnt in
  range_client_rects r
  |> Array.to_list
  |> List.filter_map (fun rect ->
         let w = D.rect_width rect and h = D.rect_height rect in
         if w <> 0. && h <> 0. then
           Some
             (vw_rect
                ~left:
                  (D.rect_left rect +. sl -. D.rect_left cnt)
                ~top:(D.rect_top rect +. st -. D.rect_top cnt)
                ~width:w ~height:h)
         else None)
  |> optimize_client_rects

(* cljs fix-selection-text-breakline *)
let fix_selection_text_breakline (text : string) =
  if String.trim text = "" then ""
  else
    let sp = "|#|" in
    let s = text in
    let b = Buffer.create (String.length s) in
    (* [\r\n]+ -> "|#|" *)
    let i = ref 0 in
    while !i < String.length s do
      let c = s.[!i] in
      if c = '\r' || c = '\n' then (
        while !i < String.length s && (s.[!i] = '\r' || s.[!i] = '\n') do
          incr i
        done;
        Buffer.add_string b sp)
      else (
        Buffer.add_char b c;
        incr i)
    done;
    let s = Buffer.contents b in
    (* "-|#|" -> "" (hyphen line-wrap) *)
    let s =
      let b = Buffer.create (String.length s) in
      let rec go i =
        if i < String.length s then
          if
            s.[i] = '-'
            && i + 3 < String.length s
            && String.sub s (i + 1) 3 = sp
          then go (i + 4)
          else (
            Buffer.add_char b s.[i];
            go (i + 1))
      in
      go 0;
      Buffer.contents b
    in
    (* "|#|([a-zA-Z_])" -> " $1"; remaining "|#|" -> "" *)
    let b = Buffer.create (String.length s) in
    let rec go i =
      if i + 3 <= String.length s && String.sub s i 3 = sp then
        if i + 3 < String.length s then (
          let c = s.[i + 3] in
          if
            (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c = '_'
          then Buffer.add_string b (" " ^ String.make 1 c)
          else Buffer.add_char b c;
          go (i + 4))
        else go (i + 3)
      else if i < String.length s then (
        Buffer.add_char b s.[i];
        go (i + 1))
    in
    go 0;
    Buffer.contents b

(* cljs scrollToHighlight — scroll the page + flash the hl element *)


let scroll_to_highlight (viewer : viewer) (hl : Model.hl) =
  match get_page_view viewer (hl.hl_page - 1) with
  | None -> ()
  | Some pv ->
      let vp = pv_viewport pv in
      let bvw = scaled_to_viewport hl.hl_bounding vp in
      let container = container_el viewer in
      let pts =
        vp_to_pdf_point vp (Web_dom.el_scroll_left container) (bvw.hl_y1 -. 200.)
      in
      let get i =
        if i < Array.length pts then pts.(i) else 0.
      in
      let opts = Js.Dict.empty () in
      Js.Dict.set opts "pageNumber"
        (Js.Json.number (float hl.hl_page));
      let named = Js.Dict.empty () in
      Js.Dict.set named "name" (Js.Json.string "XYZ");
      Js.Dict.set opts "destArray"
        (Js.Json.array
           [| Js.Json.null
            ; Js.Json.object_ named
            ; Js.Json.number (get 0)
            ; Js.Json.number (get 1)
            ; Js.Json.number (current_scale viewer)
           |]);
      Js.Dict.set opts "ignoreDestinationZoom" (Js.Json.boolean true);
      scroll_page_into_view viewer (Js.Json.object_ opts);
      let id = Option.value hl.hl_id ~default:"" in
      ignore
        (Web_dom.set_timeout_id
           (fun () ->
             match Web_dom.get_element_by_id ("hl_" ^ id) with
             | Some el ->
                 let r = D.el_bounding_rect el in
                 let in_vp =
                   D.rect_bottom r >= 0.
                   && D.rect_top r <= win_inner_height
                   && D.rect_right r >= 0.
                   && D.rect_left r <= win_inner_width
                 in
                 if not in_vp then (
                   let o = Js.Dict.empty () in
                   Js.Dict.set o "block" (Js.Json.string "center");
                   Js.Dict.set o "inline" (Js.Json.string "nearest");
                   Web_dom.el_scroll_into_view_opts el (Js.Json.object_ o));
                 Web_dom.el_class_add el "hl-flash";
                 ignore
                   (Web_dom.set_timeout_id
                      (fun () -> Web_dom.el_class_remove el "hl-flash")
                      1200)
             | None -> ())
           200)

(* cljs zoom-in-viewer / zoom-out-viewer *)
let max_scale = 5.0

let min_scale = 0.25

let delta_scale = 1.05

(* cljs: toFixed(cur * delta, 2) then ceil(x10)/10, clamped to
   [0.25, 5.0] *)
let zoom_in (viewer : viewer) =
  let cur = current_scale viewer in
  if cur < max_scale then (
    let s = Float.round (cur *. delta_scale *. 100.) /. 100. in
    let s = Float.ceil (s *. 10.) /. 10. in
    set_current_scale viewer (Float.min max_scale s))

let zoom_out (viewer : viewer) =
  let cur = current_scale viewer in
  if cur > min_scale then (
    let s = Float.round (cur /. delta_scale *. 100.) /. 100. in
    let s = Float.floor (s *. 10.) /. 10. in
    set_current_scale viewer (Float.max min_scale s))

(* cljs adjust-viewer-size! — dispatch "resizing" so pdf.js reflows *)
let adjust_viewer_size (viewer : viewer) =
  bus_dispatch (event_bus viewer) "resizing" Js.Json.null

let reset_viewer_auto (viewer : viewer) = set_scale_value viewer "auto"

(* cljs calc-delta-rect-offset — clamp popup into scroller *)
let calc_delta_rect_offset (target : D.rect) (scroller : D.el)
    : float * float =
  let cr = D.el_bounding_rect scroller in
  let dy = D.rect_bottom cr -. D.rect_bottom target in
  let dx = D.rect_right cr -. D.rect_right target in
  ( (if dx < 0. then dx +. 5. else 0.)
  , if dy < 0. then dy +. 5. else 0. )

(* gen-uuid *)
let gen_uuid () = Platform.random_uuid ()

(* ---------- imperative element helpers (Js.Json.t based) ---------- *)


let active_keystroke_raw : unit -> string Js.Undefined.t =
  [%mel.raw
    "function () { return document.body.dataset.activeKeystroke }"]

let active_keystroke () : string option =
  Js.Undefined.toOption (active_keystroke_raw ())


(* cljs resolve-hls-layer! — create/get the hl layer inside a textLayer
   div *)
let resolve_hls_layer (viewer : viewer) page : D.el option =
  match get_page_view viewer (page - 1) with
  | Some pv -> (
      let tl = pv_text_layer pv in
      match Js.Json.decodeObject tl with
      | Some _ -> (
          let cnt = tl_div tl in
          match Web_dom.el_query cnt ".extensions__pdf-hls-layer" with
          | Some l -> Some l
          | None ->
              let layer = Web_dom.create_element "div" in
              Web_dom.el_set_class layer "extensions__pdf-hls-layer";
              Web_dom.el_append_child cnt layer;
              Some layer)
      | None -> None)
  | None -> None

(* ---------- interact.js (vendored interact.min.js -> window.interact)
   ---------- *)

(* resizable for .extensions__pdf-hls-area-region; draggable for the
   resizer handle — one %mel.raw per interactable setup keeps the
   listeners wired like cljs interact(.resizable/.draggable). *)
external interact_unset : Js.Json.t -> unit = "unset" [@@mel.send]

let float_attr el name =
  match Web_dom.el_get_attr el name with
  | Some s -> (try Some (float_of_string s) with _ -> None)
  | None -> None

let interact_resizable ~(el : D.el) ~(on_start : unit -> unit)
    ~(on_move : D.el -> float -> float -> float -> float -> unit)
    ~(on_end : unit -> unit) : Js.Json.t option =
  let f : D.el -> (unit -> unit)
      -> (D.el -> float -> float -> float -> float -> unit)
      -> (unit -> unit) -> Js.Json.t Js.Undefined.t =
    [%mel.raw
      "function (el, onStart, onMove, onEnd) {
         if (!window.interact) return undefined;
         var page = el.closest('.page');
         return window.interact(el).resizable({
           edges: {left: true, right: true, top: true, bottom: true},
           listeners: {
             start: function () { onStart() },
             move: function (e) {
               var t = e.target;
               var x = parseFloat(t.getAttribute('data-x')) || 0;
               var y = parseFloat(t.getAttribute('data-y')) || 0;
               t.style.width = e.rect.width + 'px';
               t.style.height = e.rect.height + 'px';
               var ax = x + e.deltaRect.left, ay = y + e.deltaRect.top;
               t.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
               t.setAttribute('data-x', ax);
               t.setAttribute('data-y', ay);
               onMove(t, e.rect.width, e.rect.height, ax, ay);
             },
             end: function () { onEnd() }
           },
           modifiers: [window.interact.modifiers.restrict({restriction: page})],
           inertia: true
         })
       }"]
  in
  Js.Undefined.toOption (f el on_start on_move on_end)

let interact_draggable_resizer ~(el : D.el)
    ~(on_move : float -> unit) ~(on_start : unit -> unit)
    ~(on_end : unit -> unit) : Js.Json.t option =
  let f : D.el -> (float -> unit) -> (unit -> unit)
      -> (unit -> unit) -> Js.Json.t Js.Undefined.t =
    [%mel.raw
      "function (el, onMove, onStart, onEnd) {
         if (!window.interact) return undefined;
         return window.interact(el).draggable({
           listeners: {
             move: function (e) { onMove(e.rect.left) }
           }
         }).styleCursor(false)
           .on('dragstart', function () { onStart() })
           .on('dragend', function () { onEnd() })
       }"]
  in
  Js.Undefined.toOption (f el on_move on_start on_end)

(* body.classList toggles used by cljs playground-effects *)


(* document listener removal (dom_ext only ships the add side) *)

(* ---------- toolbar/linkService/outline externals ---------- *)

external num_pages : viewer -> int = "numPages"
  [@@mel.get] [@@mel.scope "pdfDocument"]

external link_service : viewer -> Js.Json.t = "linkService" [@@mel.get]

external get_destination_hash : Js.Json.t -> Js.Json.t -> string
  = "getDestinationHash" [@@mel.send]

external go_to_destination : Js.Json.t -> Js.Json.t -> unit
  = "goToDestination" [@@mel.send]

external get_outline : Js.Json.t -> Js.Json.t Js.Promise.t
  = "getOutline" [@@mel.send]

external bus_off : Js.Json.t -> string -> (Js.Json.t -> unit) -> unit
  = "off" [@@mel.send]

(* Js.Promise monadic bind for let* (project style directive) *)
let ( let* ) p f = Js.Promise.then_ f p

(* JSON array field helper *)
let json_a o k =
  match Js.Json.decodeObject o with
  | Some d -> (
      match Js.Dict.get d k with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some a -> Some a
          | None -> None)
      | None -> None)
  | None -> None

let json_o o k =
  match Js.Json.decodeObject o with
  | Some d -> Js.Dict.get d k
  | None -> None
