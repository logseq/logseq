(* pdf highlights overlay — cljs pdf-highlights +
   pdf-highlight-area-selection + pdf-highlights-ctx-menu +
   *-region. Imperative: layers live inside each page's textLayer div,
   the ctx menu renders into .pp-holder. *)

module D = Web_dom
module U = Pdf_utils
module S = Pdf_state
module A = Pdf_assets

let ( let* ) = U.( let* )

type ctx =
  { mk_hl : unit -> Model.hl option (* cljs highlight may be a thunk *)
  ; sel : Js.Json.t option (* live Selection object *)
  ; point : float * float (* clientX/Y *)
  ; reset_fn : (unit -> unit) option
  }

type t =
  { viewer : S.viewer
  ; el : D.el (* .extensions__pdf-viewer (viewer.container) *)
  ; holder : D.el (* .pp-holder *)
  ; mutable ctx : ctx option
  ; mutable ctx_el : D.el option
  ; mutable ctx_doc_click : (D.ev -> unit) option
  ; (* area selection state (cljs pdf-highlight-area-selection refs) *)
    mutable a_start_el : D.el option
  ; mutable a_page_el : D.el option
  ; mutable a_page_rect : D.rect option
  ; mutable a_cnt_rect : D.rect option
  ; mutable a_start_xy : (float * float) option
  ; mutable a_start : (float * float) option
  ; mutable a_end : (float * float) option
  ; a_sel_el : D.el (* .extensions__pdf-area-selection *)
  ; mutable a_shadow : D.el option
  ; mutable a_listening : bool
  ; mutable win_resize : (D.ev -> unit) option
  }

let cur : t option ref = ref None

let cnt_el t = U.container_el t.viewer

let colors = [ "yellow"; "red"; "green"; "blue"; "purple" ]

let menu_li cls action text =
  let li = Web_dom.create_element "li" in
  Web_dom.el_set_class li cls;
  Web_dom.el_set_attr li "data-action" action;
  Web_dom.el_set_text_content li text;
  li

external dt_set_data : D.ev -> string -> string -> unit = "setData"
  [@@mel.send] [@@mel.scope "dataTransfer"]

let rec clear_ctx_menu (t : t) =
  let reset =
    match t.ctx with
    | Some c -> c.reset_fn
    | None -> None
  in
  t.ctx <- None;
  (match t.ctx_el with
   | Some e -> Web_dom.el_remove e
   | None -> ());
  t.ctx_el <- None;
  (match t.ctx_doc_click with
   | Some f ->
       Web_dom.remove_document_listener "click" f false;
       t.ctx_doc_click <- None
   | None -> ());
  match reset with
  | Some f -> f ()
  | None -> ()

(* cljs pdf-highlights-ctx-menu — ul.extensions__pdf-hls-ctx-menu *)
and render_ctx_menu (t : t) (c : ctx) : unit =
  clear_ctx_menu t;
  t.ctx <- Some c;
  let hl_opt = c.mk_hl () in
  let is_new =
    match hl_opt with
    | Some hl -> hl.hl_id = None
    | None -> false
  in
  let area =
    match hl_opt with
    | Some hl -> hl.hl_image <> None
    | None -> false
  in
  if !S.highlight_mode && is_new then
    (* cljs new-&-highlight-mode: wait for the selection to clear, then
       apply the last color *)
    ignore
      (Web_dom.set_timeout_id
         (fun () -> action_fn t c ~action:!S.last_color ~clear:true)
         300)
  else (
    let show =
      match c.sel with
      | None -> true
      | Some _ -> S.auto_open_ctx () || U.active_keystroke () = Some "Alt"
    in
    let cnt = cnt_el t in
    let x, y = c.point in
    let ul = Web_dom.create_element "ul" in
    Web_dom.el_set_class ul "extensions__pdf-hls-ctx-menu";
    Web_dom.el_style_set_property ul "top"
      (Printf.sprintf "%gpx" (y +. D.el_scroll_top cnt));
    Web_dom.el_style_set_property ul "left"
      (Printf.sprintf "%gpx" (x +. Web_dom.el_scroll_left cnt));
    Web_dom.el_style_set_property ul "visibility" (if show then "visible" else "hidden");
    let li_colors = Web_dom.create_element "li" in
    Web_dom.el_set_class li_colors "item-colors";
    List.iter
      (fun cl ->
        let a = Web_dom.create_element "a" in
        Web_dom.el_set_attr a "data-color" cl;
        Web_dom.el_set_attr a "data-action" cl;
        Web_dom.el_set_text_content a cl;
        Web_dom.el_append_child li_colors a)
      colors;
    Web_dom.el_append_child ul li_colors;
    if not is_new then
      Web_dom.el_append_child ul (menu_li "item" "ref" (I18n.t "pdf/copy-ref"));
    if not area then
      Web_dom.el_append_child ul (menu_li "item" "copy" (I18n.t "pdf/copy-text"));
    if not is_new then (
      Web_dom.el_append_child ul (menu_li "item" "link" (I18n.t "pdf/linked-ref"));
      Web_dom.el_append_child ul (menu_li "item" "del" (I18n.t "ui/delete")));
    Web_dom.el_on ul "click" (fun e ->
        D.ev_stop_propagation e;
        match D.ev_target e with
        | Some target -> (
            match D.el_get_attr target "data-action" with
            | Some action -> action_fn t c ~action ~clear:true
            | None -> ())
        | None -> ());
    Web_dom.el_append_child t.holder ul;
    t.ctx_el <- Some ul;
    (* cljs util/calc-delta-rect-offset — clamp inside the scroller *)
    (match D.el_closest ul ".extensions__pdf-viewer" with
     | Some scroller ->
         let dx, dy =
           U.calc_delta_rect_offset (D.el_bounding_rect ul) scroller
         in
         if dx <> 0. || dy <> 0. then
           Web_dom.el_style_set_property ul "transform"
             (Printf.sprintf "translate3d(%gpx,%gpx,0)" dx dy)
     | None -> ());
    (* cljs: a document click clears the menu (deferred so the click
       that opened it doesn't immediately close it) *)
    let doc_click _ = clear_ctx_menu t in
    t.ctx_doc_click <- Some doc_click;
    ignore
      (Web_dom.set_timeout_id
         (fun () -> D.add_document_listener "click" doc_click false)
         0))

(* cljs action-fn! *)
and action_fn (t : t) (c : ctx) ~(action : string) ~(clear : bool) :
    unit =
  (match c.mk_hl () with
   | None -> ()
   | Some hl -> (
       match action with
       | "ref" -> A.copy_hl_ref hl
       | "copy" ->
           let text =
             if hl.hl_text <> "" then hl.hl_text
             else
               match c.sel with
               | Some s ->
                   U.fix_selection_text_breakline (U.sel_to_string s)
               | None -> hl.hl_text
           in
           Ui_services.clipboard_copy text;
           U.clear_all_selection ()
       | "link" -> ignore (A.goto_block_ref hl)
       | "del" -> (
           del_hl t hl;
           match hl.hl_id with
           | Some _ -> A.del_ref_block hl
           | None -> ())
       | color when List.mem color colors -> (
           match hl.hl_id with
           | None ->
               let hl =
                 { hl with
                   hl_id = Some (U.gen_uuid ())
                 ; hl_color = Some color }
               in
               ignore
                 ((let* hl' = add_hl t hl in
                   U.clear_all_selection ();
                   A.copy_hl_ref hl';
                   Js.Promise.resolve ())
                  |> Js.Promise.catch (fun e ->
                         Ui_services.log_error ("pdf hl add failed", e);
                         Js.Promise.resolve ()))
           | Some _ -> upd_hl t { hl with hl_color = Some color });
           S.last_color := color
       | _ -> ()));
  if clear then
    ignore (Web_dom.set_timeout_id (fun () -> clear_ctx_menu t) 68)

(* cljs add-hl! — conj + area highlights persist the cropped png.
   Resolves the hl once hl_image holds the asset db/id (or on failure
   the original), so callers can chain ensure-ref-block! like cljs *)
and add_hl (t : t) (hl : Model.hl) : Model.hl Js.Promise.t =
  S.hls := hl :: !S.hls;
  rerender_hl t hl;
  match hl.hl_image with
  | Some _ -> (
      match U.scaled_to_vw_pos t.viewer hl with
      | Some vw ->
          (let* dbid =
             A.persist_hl_area_image ~viewer:t.viewer ~new_hl:hl
               ~region:vw.hl_bounding
           in
           (match dbid with
            | Some id ->
                let hl' = { hl with hl_image = Some id } in
                S.hls :=
                  List.map
                    (fun (h : Model.hl) ->
                      if h.hl_id = hl'.hl_id then hl' else h)
                    !S.hls;
                Js.Promise.resolve hl'
            | None -> Js.Promise.resolve hl))
          |> Js.Promise.catch (fun e ->
                 Ui_services.log_error ("pdf hl persist failed", e);
                 Js.Promise.resolve hl)
      | None -> Js.Promise.resolve hl)
  | None -> Js.Promise.resolve hl

(* cljs upd-hl! *)
and upd_hl (t : t) (hl : Model.hl) : unit =
  S.hls :=
    List.map (fun (h : Model.hl) -> if h.hl_id = hl.hl_id then hl else h)
      !S.hls;
  rerender_hl t hl;
  ignore (A.update_hl_block hl)

(* cljs del-hl! *)
and del_hl (t : t) (hl : Model.hl) : unit =
  S.hls :=
    List.filter
      (fun (h : Model.hl) -> h.hl_id <> hl.hl_id)
      !S.hls;
  rerender_hl t hl

(* re-render the page layer containing hl *)
and rerender_hl (t : t) (hl : Model.hl) : unit =
  match U.resolve_hls_layer t.viewer hl.hl_page with
  | Some layer -> render_region_container t layer hl.hl_page
  | None -> ()

(* cljs pdf-highlights-region-container — one .hls-region-container per
   page layer *)
and render_region_container (t : t) (layer : D.el) (page : int) :
    unit =
  let box =
    match Web_dom.el_query layer ".hls-region-container" with
    | Some b -> b
    | None ->
        let b = Web_dom.create_element "div" in
        Web_dom.el_set_class b "hls-region-container";
        Web_dom.el_append_child layer b;
        b
  in
  Web_dom.el_set_inner_html box "";
  List.iter
    (fun (hl : Model.hl) ->
      if hl.hl_page = page then
        match U.scaled_to_vw_pos t.viewer hl with
        | Some vw -> (
            match hl.hl_image with
            | Some _ -> render_area_region t box vw hl
            | None -> render_text_region t box vw hl)
        | None -> ())
    !S.hls

(* cljs pdf-highlights-text-region *)
and render_text_region (t : t) (box : D.el) (vw : Model.hl)
    (hl : Model.hl) : unit =
  let region = Web_dom.create_element "div" in
  Web_dom.el_set_class region "extensions__pdf-hls-text-region";
  (match hl.hl_id with
   | Some id -> Web_dom.el_set_attr region "id" ("hl_" ^ id)
   | None -> ());
  let open_ctx e =
    D.ev_prevent_default e;
    render_ctx_menu t
      { mk_hl = (fun () -> Some hl)
      ; sel = None
      ; point = D.ev_client_x e, D.ev_client_y e
      ; reset_fn = None }
  in
  Web_dom.el_on region "click" open_ctx;
  Web_dom.el_on region "contextmenu" open_ctx;
  List.iter
    (fun (r : Model.hl_rect) ->
      let it = Web_dom.create_element "div" in
      Web_dom.el_set_class it "hls-text-region-item";
      Web_dom.el_style_set_property it "left" (Printf.sprintf "%gpx" r.hl_x1);
      Web_dom.el_style_set_property it "top" (Printf.sprintf "%gpx" r.hl_y1);
      Web_dom.el_style_set_property it "width" (Printf.sprintf "%gpx" r.hl_w);
      Web_dom.el_style_set_property it "height" (Printf.sprintf "%gpx" r.hl_h);
      Web_dom.el_set_attr it "draggable" "true";
      (match hl.hl_color with
       | Some cl -> Web_dom.el_set_attr it "data-color" cl
       | None -> ());
      Web_dom.el_on it "dragstart" (fun e ->
          match hl.hl_id with
          | Some id -> (
              dt_set_data e "text/plain" ("[[" ^ id ^ "]]");
              match !S.current with
              | Some a -> ignore (A.ensure_ref_block a hl)
              | None -> ())
          | None -> ());
      Web_dom.el_append_child region it)
    vw.hl_rects;
  Web_dom.el_append_child box region

(* cljs pdf-highlight-area-region — style = vw bounding rect;
   interact.js resizable; drag-end persists the crop + updates the hl *)
and render_area_region (t : t) (box : D.el) (vw : Model.hl)
    (hl : Model.hl) : unit =
  let b = vw.hl_bounding in
  let region = Web_dom.create_element "div" in
  Web_dom.el_set_class region "extensions__pdf-hls-area-region";
  (match hl.hl_id with
   | Some id -> Web_dom.el_set_attr region "id" ("hl_" ^ id)
   | None -> ());
  Web_dom.el_style_set_property region "left" (Printf.sprintf "%gpx" b.hl_x1);
  Web_dom.el_style_set_property region "top" (Printf.sprintf "%gpx" b.hl_y1);
  Web_dom.el_style_set_property region "width" (Printf.sprintf "%gpx" b.hl_w);
  Web_dom.el_style_set_property region "height" (Printf.sprintf "%gpx" b.hl_h);
  (match hl.hl_color with
   | Some cl -> Web_dom.el_set_attr region "data-color" cl
   | None -> ());
  Web_dom.el_set_attr region "draggable" "true";
  let dirty = ref false in
  let open_ctx e =
    D.ev_prevent_default e;
    if not !dirty then
      render_ctx_menu t
        { mk_hl = (fun () -> Some hl)
        ; sel = None
        ; point = D.ev_client_x e, D.ev_client_y e
        ; reset_fn = None }
  in
  Web_dom.el_append_child box region;
  Web_dom.el_on region "click" open_ctx;
  Web_dom.el_on region "contextmenu" open_ctx;
  Web_dom.el_on region "dragstart" (fun e ->
      match hl.hl_id with
      | Some id -> dt_set_data e "text/plain" ("[[" ^ id ^ "]]")
      | None -> ());
  let on_move (_t : D.el) (_w : float) (_h : float) (_ax : float)
      (_ay : float) : unit =
    ()
  in
  let on_end () =
    let dx = Option.value (U.float_attr region "data-x") ~default:0. in
    let dy = Option.value (U.float_attr region "data-y") ~default:0. in
    let r = D.el_bounding_rect region in
    let to_vw =
      { Model.hl_x1 = b.hl_x1 +. dx
      ; hl_y1 = b.hl_y1 +. dy
      ; hl_x2 = b.hl_x1 +. dx +. D.rect_width r
      ; hl_y2 = b.hl_y1 +. dy +. D.rect_height r
      ; hl_w = D.rect_width r
      ; hl_h = D.rect_height r }
    in
    (match
       U.vw_to_scaled t.viewer ~page:hl.hl_page ~bounding:to_vw
         ~rects:[]
     with
     | Some (bounding, rects) ->
         let hl' =
           { hl with
             hl_bounding = bounding
           ; hl_rects = rects
           ; hl_image = Some (Int64.of_float (Js.Date.now ())) }
         in
         ignore
           (let* dbid =
              A.persist_hl_area_image ~viewer:t.viewer ~new_hl:hl'
                ~region:to_vw
            in
            ignore
              (Web_dom.set_timeout_id
                 (fun () ->
                   Web_dom.el_style_set_property region "transform" "translate(0, 0)";
                   Web_dom.el_remove_attr region "data-x";
                   Web_dom.el_remove_attr region "data-y";
                   upd_hl t
                     (match dbid with
                      | Some id -> { hl' with hl_image = Some id }
                      | None -> hl'))
                 200);
            Js.Promise.resolve ())
     | None -> ());
    ignore (Web_dom.set_timeout_id (fun () -> dirty := false) 50)
  in
  match
    U.interact_resizable ~el:region ~on_start:(fun () -> dirty := true)
      ~on_move ~on_end
  with
  | Some it -> S.hls_interactables := it :: !S.hls_interactables
  | None -> ()

(* public: render the hls layer for a page once its text layer is up
   (cljs render-hls effect on textlayerrendered) *)
let render_page ~(viewer : S.viewer) ~(page : int) : unit =
  match !cur with
  | Some t -> (
      match U.resolve_hls_layer viewer page with
      | Some layer -> render_region_container t layer page
      | None -> ())
  | None -> ()

(* ---------- selection -> ctx menu (cljs fn-selection chain)
   ---------- *)

let show_ctx_sel (t : t) (range : Js.Json.t) (sel : Js.Json.t)
    (point : float * float) : unit =
  let mk_hl () =
    match U.get_page_from_range range with
    | Some (page, page_el) -> (
        match U.get_range_rects range page_el with
        | [] -> None
        | rects -> (
            match U.get_bounding_rect rects with
            | Some bounding -> (
                match
                  U.vw_to_scaled t.viewer ~page ~bounding ~rects
                with
                | Some (bounding, rects) ->
                    Some
                      { Model.hl_id = None
                      ; hl_page = page
                      ; hl_bounding = bounding
                      ; hl_rects = rects
                      ; hl_text =
                          U.fix_selection_text_breakline
                            (U.sel_to_string sel)
                      ; hl_image = None
                      ; hl_color = None }
                | None -> None)
            | None -> None))
    | None -> None
  in
  render_ctx_menu t
    { mk_hl; sel = Some sel; point; reset_fn = None }

let sel_ok (t : t) (e : D.ev) : unit =
  let sel = U.get_selection () in
  if U.sel_is_collapsed sel then ()
  else
    let range = U.sel_range_at sel 0 in
    match U.range_common_ancestor range with
    | Some anc when U.el_contains t.el anc ->
        (* cljs defers the ctx-menu open by a tick *)
        ignore
          (Web_dom.set_timeout_id
             (fun () ->
               show_ctx_sel t range sel (D.ev_client_x e, D.ev_client_y e))
             0)
    | _ -> ()

(* ---------- area selection (cljs pdf-highlight-area-selection)
   ---------- *)

let el_in_page target = D.el_closest target ".page"

let area_should_start (_t : t) (e : D.ev) : bool =
  match D.ev_target e with
  | Some target ->
      not
        (Web_dom.el_class_contains target "extensions__pdf-hls-area-region")
      && el_in_page target <> None
      && (D.ev_meta e || D.ev_shift e || !S.area_mode)
  | None -> false

(* cljs calc-coords! — clamp pageX/Y into the page rect, then offset
   by the container scroll *)
let calc_coords (t : t) (page_x : float) (page_y : float) :
    float * float =
  let cnt = cnt_el t in
  (match t.a_cnt_rect with
   | Some _ -> ()
   | None -> t.a_cnt_rect <- Some (D.el_bounding_rect cnt));
  let x', y' =
    match t.a_page_rect, t.a_start_xy with
    | Some pr, Some (sx, sy) ->
        ( (if sx > page_x then Float.max page_x (D.rect_left pr)
           else Float.min page_x (D.rect_right pr))
        , if sy > page_y then Float.max page_y (D.rect_top pr)
          else Float.min page_y (D.rect_bottom pr) )
    | _ -> page_x, page_y
  in
  (x' +. Web_dom.el_scroll_left cnt, y' +. D.el_scroll_top cnt)

(* cljs disable-text-selection! — toggles on viewer.viewer (.pdfViewer) *)
let disable_text_selection (t : t) (on_ : bool) : unit =
  Web_dom.el_class_toggle (U.viewer_el t.viewer) "disabled-text-selection" on_

let draw_shadow (t : t) : unit =
  match t.a_start, t.a_end with
  | Some (sx, sy), Some (ex, ey) ->
      let r =
        U.vw_rect
          ~left:(Float.min sx ex)
          ~top:(Float.min sy ey)
          ~width:(Float.abs (ex -. sx))
          ~height:(Float.abs (ey -. sy))
      in
      let sh =
        match t.a_shadow with
        | Some s -> s
        | None ->
            let s = Web_dom.create_element "div" in
            Web_dom.el_set_class s "shadow-rect";
            Web_dom.el_append_child t.a_sel_el s;
            t.a_shadow <- Some s;
            s
      in
      Web_dom.el_style_set_property sh "left" (Printf.sprintf "%gpx" r.hl_x1);
      Web_dom.el_style_set_property sh "top" (Printf.sprintf "%gpx" r.hl_y1);
      Web_dom.el_style_set_property sh "width" (Printf.sprintf "%gpx" r.hl_w);
      Web_dom.el_style_set_property sh "height" (Printf.sprintf "%gpx" r.hl_h)
  | _ -> ()

let area_move (e : D.ev) : unit =
  match !cur with
  | Some t -> (
      match t.a_start_xy with
      | Some _ ->
          t.a_end <-
            Some (calc_coords t (Web_dom.ev_page_x e) (Web_dom.ev_page_y e));
          draw_shadow t
      | None -> ())
  | None -> ()

let area_reset (t : t) : unit =
  t.a_start_el <- None;
  t.a_page_el <- None;
  t.a_page_rect <- None;
  t.a_cnt_rect <- None;
  t.a_start_xy <- None;
  t.a_start <- None;
  t.a_end <- None;
  (match t.a_shadow with
   | Some s ->
       Web_dom.el_remove s;
       t.a_shadow <- None
   | None -> ());
  if t.a_listening then (
    Web_dom.remove_document_listener "mousemove" area_move false;
    t.a_listening <- false)

let area_end (e : D.ev) : unit =
  match !cur with
  | Some t -> (
      match t.a_start_el, t.a_start with
      | Some start_el, Some start ->
          let end_ =
            calc_coords t (Web_dom.ev_page_x e) (Web_dom.ev_page_y e)
          in
          let w = Float.abs (fst end_ -. fst start) in
          let h = Float.abs (snd end_ -. snd start) in
          if w > 10. && h > 10. then
            match el_in_page start_el with
            | Some page_el -> (
                match U.dataset_page_number page_el with
                | Some pn -> (
                    match int_of_string_opt pn with
                    | Some page ->
                        let rect =
                          U.vw_rect
                            ~left:(Float.min (fst start) (fst end_))
                            ~top:(Float.min (snd start) (snd end_))
                            ~width:w ~height:h
                        in
                        let page_pos =
                          { rect with
                            hl_y1 = rect.hl_y1 -. Web_dom.el_offset_top page_el
                          ; hl_x1 =
                              rect.hl_x1 -. Web_dom.el_offset_left page_el }
                        in
                        (match
                           U.vw_to_scaled t.viewer ~page
                             ~bounding:page_pos ~rects:[]
                         with
                         | Some (bounding, rects) ->
                             let hl =
                               { Model.hl_id = None
                               ; hl_page = page
                               ; hl_bounding = bounding
                               ; hl_rects = rects
                               ; hl_text = ""
                               ; hl_image =
                                   Some
                                     (Int64.of_float (Js.Date.now ()))
                               ; hl_color = None }
                             in
                             render_ctx_menu t
                               { mk_hl = (fun () -> Some hl)
                               ; sel = None
                               ; point =
                                   D.ev_client_x e, D.ev_client_y e
                               ; reset_fn =
                                   Some (fun () -> area_reset t) }
                         | None -> ());
                        S.area_mode := false
                    | None -> ())
                | None -> ())
            | None -> ()
          else area_reset t;
          disable_text_selection t false
      | _ -> ());
      area_reset t
  | None -> ()

(* cljs install: listeners on the viewer element (selection tracking +
   wheel zoom) + container (area selection) + window resize *)
let install ~(viewer : S.viewer) ~(el : D.el)
    ~(holder : D.el) : unit =
  let a_sel_el = Web_dom.create_element "div" in
  Web_dom.el_set_class a_sel_el "extensions__pdf-area-selection";
  let hls_cnt = Web_dom.create_element "div" in
  Web_dom.el_set_class hls_cnt "extensions__pdf-highlights-cnt";
  Web_dom.el_append_child hls_cnt a_sel_el;
  Web_dom.el_append_child el hls_cnt;
  let t =
    { viewer
    ; el
    ; holder
    ; ctx = None
    ; ctx_el = None
    ; ctx_doc_click = None
    ; a_start_el = None
    ; a_page_el = None
    ; a_page_rect = None
    ; a_cnt_rect = None
    ; a_start_xy = None
    ; a_start = None
    ; a_end = None
    ; a_sel_el
    ; a_shadow = None
    ; a_listening = false
    ; win_resize = None }
  in
  cur := Some t;
  (* cljs fn-selection: mousedown arms a dirty tracker; the one-shot
     document mouseup turns a dirty selection into sel-state *)
  Web_dom.el_on el "mousedown" (fun _ ->
      let dirty = ref false in
      let fn_dirty _ = dirty := true in
      D.add_document_listener "selectionchange" fn_dirty false;
      Web_dom.el_on_once D.document_el "mouseup" (fun e ->
          if !dirty then sel_ok t e;
          Web_dom.remove_document_listener "selectionchange" fn_dirty false));
  (* cljs fn-wheel: ctrl/meta wheel zooms around the cursor *)
  Web_dom.el_on el "wheel" (fun e ->
      if D.ev_ctrl e || D.ev_meta e then (
        let cnt = cnt_el t in
        let rect = D.el_bounding_rect cnt in
        let mx = D.ev_client_x e -. D.rect_left rect in
        let my = D.ev_client_y e -. D.rect_top rect in
        let xr = (Web_dom.el_scroll_left cnt +. mx) /. Web_dom.el_scroll_width cnt in
        let yr = (D.el_scroll_top cnt +. my) /. Web_dom.el_scroll_height cnt in
        let cur_scale = U.current_scale viewer in
        let s =
          if Web_dom.ev_delta_y e < 0. then cur_scale *. 1.05
          else cur_scale /. 1.05
        in
        D.ev_prevent_default e;
        U.bus_dispatch (U.event_bus viewer) "scaleChanging"
          (Web_dom.json_props
             [ "source", Js.Json.string "wheel"
             ; "scale", Js.Json.number s ]);
        Web_dom.request_animation_frame (fun () ->
            U.set_scroll_left cnt (Web_dom.el_scroll_width cnt *. xr -. mx);
            D.el_set_scroll_top cnt (Web_dom.el_scroll_height cnt *. yr -. my))));
  (* cljs fn-resize: window resize re-adjusts the viewer *)
  let on_resize _ = U.adjust_viewer_size viewer in
  t.win_resize <- Some on_resize;
  Web_dom.add_window_listener "resize" on_resize;
  (* cljs pdf-page-finder: :restore-last-page restores the saved page *)
  U.bus_on (U.event_bus viewer) "restore-last-page" (fun ev ->
      let page =
        match U.json_f ev "detail" with
        | Some p -> Some (int_of_float p)
        | None -> (
            match Js.Json.decodeString ev with
            | Some s -> int_of_string_opt s
            | None -> (
                match Js.Json.decodeNumber ev with
                | Some n -> Some (int_of_float n)
                | None -> None))
      in
      match page with
      | Some p -> U.set_current_page viewer p
      | None -> ());
  (* area selection: mousedown on the container starts it *)
  Web_dom.el_on (cnt_el t) "mousedown" (fun e ->
      if area_should_start t e then (
        match D.ev_target e with
        | Some target -> (
            match el_in_page target with
            | Some page_el ->
                let x = Web_dom.ev_page_x e and y = Web_dom.ev_page_y e in
                t.a_start_el <- Some target;
                t.a_start_xy <- Some (x, y);
                t.a_page_el <- Some page_el;
                t.a_page_rect <- Some (D.el_bounding_rect page_el);
                t.a_start <- Some (calc_coords t x y);
                disable_text_selection t true;
                if not t.a_listening then (
                  D.add_document_listener "mousemove" area_move false;
                  t.a_listening <- true)
            | None -> ())
        | None -> ())
      else (
        area_reset t;
        disable_text_selection t false));
  Web_dom.el_on (cnt_el t) "mouseup" area_end

(* teardown — drop listeners that live outside the removed container *)
let uninstall () : unit =
  (match !cur with
   | Some t ->
       (match t.ctx_doc_click with
        | Some f -> Web_dom.remove_document_listener "click" f false
        | None -> ());
       if t.a_listening then
         Web_dom.remove_document_listener "mousemove" area_move false;
       (match t.win_resize with
        | Some f -> Web_dom.remove_window_listener "resize" f
        | None -> ());
       cur := None
   | None -> ());
  S.hls := []
