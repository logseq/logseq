(* pdf toolbar — cljs toolbar.cljs: pager, zoom, outline/highlights
   overlay, finder, settings, docinfo modal, close. Web paths only
   (the system-window button is a no-op). *)

module D = Web_dom
module U = Pdf_utils
module S = Pdf_state
module A = Pdf_assets

let ( let* ) = U.( let* )

(* ---------- cljs components/svg.cljs custom icons (verbatim paths)
   ---------- *)

let ns = "http://www.w3.org/2000/svg"

let svg attrs kids : D.el =
  let s = D.svg_ns_el "svg" in
  List.iter (fun (k, v) -> D.el_set_attr s k v) attrs;
  List.iter (fun k -> D.el_append_child s k) kids;
  s

let node tag attrs : D.el =
  let n = D.svg_ns_el tag in
  List.iter (fun (k, v) -> D.el_set_attr n k v) attrs;
  n

let svg24 ?(size = 16) ?(cls = "") ?(extra = []) kids : D.el =
  svg
    ([ ("viewBox", "0 0 24 24")
     ; ("width", string_of_int size)
     ; ("height", string_of_int size)
     ; ("fill", "none")
     ; ("stroke", "currentColor")
     ; ("class", cls) ]
    @ extra)
    kids

let path24 ?(cls = "") d : D.el =
  node "path"
    ([ ("d", d)
     ; ("stroke-linecap", "round")
     ; ("stroke-linejoin", "round")
     ; ("stroke-width", "2") ]
    @ (if cls = "" then [] else [ ("class", cls) ]))

let svg_adjustments n =
  svg24 ~cls:"icon" ~size:n
    [ path24
        "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 \
         0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 \
         4v2m0-6V4" ]

let svg_icon_area n =
  svg
    [ ("viewBox", "0 0 1024 1024")
    ; ("version", "1.1")
    ; ("width", string_of_int n)
    ; ("height", string_of_int n)
    ; ("stroke", "currentColor") ]
    [ node "path"
        [ ( "d"
          , "M844.992 115.008H179.008c-35.328 0-64 28.672-64 \
             64v665.984c0 35.328 28.672 64 64 64h665.984c35.328 0 \
             64-28.672 64-64V179.008c0-35.328-28.672-64-64-64zM364.672 \
             844.992H217.6L844.992 217.6v147.072l-480.32 480.32z \
             m480.32-401.152v147.2l-254.016 253.952H443.84l401.152-401.152z \
             m-187.648-264.832h147.072l-625.408 625.408V657.28l478.336-478.336zM179.008 \
             578.112V431.04l252.032-252.032h147.136L179.008 578.112z \
             m172.864-399.104l-172.864 172.8v-172.8h172.864z \
             m318.272 665.984l174.848-174.848v174.848h-174.848z" )
        ; ("fill", "currentColor") ] ]

let svg_highlighter n =
  svg24 ~size:n
    [ path24
        "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 \
         3.536L6.5 21.036H3v-3.572L16.732 3.732z" ]

let svg_zoom_out n =
  svg24 ~size:n
    [ path24 "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" ]

let svg_zoom_in n =
  svg24 ~size:n
    [ path24
        "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 \
         0H7" ]

let svg_auto_fit n =
  svg24 ~size:n
    [ path24
        "M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4M10 14l-3-2 3-2m4 4l3-2-3-2" ]

let svg_view_list n =
  svg
    [ ("viewBox", "0 0 1024 1024")
    ; ("width", string_of_int n)
    ; ("height", string_of_int n)
    ; ("fill", "none")
    ; ("stroke", "currentColor")
    ; ("class", "icon") ]
    [ node "path"
        [ ( "d"
          , "M134.976 853.312H89.6c-26.56 0-46.912-20.928-46.912-48.256 \
             0-27.392 20.352-48.32 46.912-48.32h45.376c26.624 0 46.912 \
             20.928 46.912 48.32 0 27.328-20.288 48.256-46.912 \
             48.256zM134.976 560.32H89.6C63.04 560.32 42.688 539.392 \
             42.688 512s20.352-48.32 46.912-48.32h45.376c26.624 0 46.912 \
             20.928 46.912 48.32s-20.288 48.32-46.912 48.32zM134.976 \
             267.264H89.6c-26.56 0-46.912-20.928-46.912-48.32 \
             0-27.328 20.352-48.256 46.912-48.256h45.376c26.624 0 46.912 \
             20.928 46.912 48.256 0 27.392-20.288 48.256-46.912 \
             48.256zM311.744 853.312c-26.56 \
             0-46.912-20.928-46.912-48.256 0-27.392 20.352-48.32 \
             46.912-48.32h622.72c26.56 0 46.848 20.928 46.848 48.32 \
             0 27.328-20.288 48.256-46.912 48.256H311.744c1.6 0 1.6 0 0 \
             0zM311.744 560.32c-26.56 0-46.912-20.928-46.912-48.32 \
             s20.352-48.32 46.912-48.32h622.72c26.56 0 46.848 20.928 \
             46.848 48.32s-20.288 48.32-46.912 \
             48.32H311.744c1.6 0 1.6 0 0 0zM311.744 267.264c-26.56 \
             0-46.912-20.928-46.912-48.32 0-27.328 20.352-48.256 \
             46.912-48.256h622.72c26.56 0 46.848 20.928 46.848 48.256 0 \
             27.392-20.288 48.32-46.912 48.32H311.744c1.6 0 1.6 0 0 0z" )
        ; ("fill", "currentColor") ] ]

let svg_search2 n =
  svg
    [ ("viewBox", "0 0 20 20")
    ; ("width", string_of_int n)
    ; ("height", string_of_int n)
    ; ("fill", "currentColor") ]
    [ node "path"
        [ ( "d"
          , "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 \
             3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 \
             012 8z" )
        ; ("clip-rule", "evenodd")
        ; ("fill-rule", "evenodd") ] ]

let svg_annotations n =
  svg
    [ ("viewBox", "0 0 1024 1024")
    ; ("width", string_of_int n)
    ; ("height", string_of_int n)
    ; ("class", "icon") ]
    [ node "path"
        [ ( "d"
          , "M866.368 64 157.632 64C105.984 64 64 105.984 64 \
             157.632l0 522.112c0 51.648 41.984 93.632 93.632 \
             93.632l111.744 0 132.736 174.08C408.192 955.392 417.536 \
             960 427.584 960s19.392-4.608 25.408-12.544l132.736-174.08 \
             280.64 0c51.648 0 93.632-41.984 93.632-93.632L960 \
             157.632C960 105.984 918.016 64 866.368 64zM429.504 234.624 \
             318.72 599.808C313.408 617.536 295.36 627.52 278.528 \
             622.4 261.632 617.344 252.16 598.848 257.472 \
             581.376l110.72-365.312c5.312-17.472 23.36-27.584 \
             40.32-22.464C425.408 198.72 434.816 217.216 429.504 \
             234.624zM827.2 391.04c-3.2 5.504-6.656 9.088-10.176 \
             10.624-33.152 12.992-69.632 22.592-109.376 28.48 7.232 \
             6.592 16.064 15.488 26.624 26.496 10.496 11.136 16.064 \
             17.024 16.512 17.728 3.904 5.376 9.28 12.032 16.192 \
             19.968 6.912 8 11.776 14.208 14.464 18.688 2.688 4.544 \
             4.032 9.92 4.032 16.384 0 8.192-3.072 15.424-9.28 \
             21.568-6.144 6.208-14.144 9.28-23.872 \
             9.28S731.648 552.704 719.36 537.6c-12.16-15.104-27.968-42.368-47.168-81.664C652.672 \
             491.328 639.552 514.752 632.96 526.08 626.24 537.28 619.84 \
             545.792 613.696 551.616c-6.208 5.76-13.184 8.704-21.184 \
             8.704-9.472 0-17.408-3.264-23.744-9.792C562.56 543.936 \
             559.36 536.896 559.36 529.472c0-6.912 1.28-12.16 \
             3.84-15.744 23.616-32.064 48.256-60.032 73.984-83.584C615.616 \
             426.816 596.352 423.04 579.456 419.008 562.496 414.784 \
             544.448 408.896 525.504 400.896c-3.136-1.536-6.144-5.12-9.088-10.624C513.408 \
             384.832 512 379.712 512 375.04c0-8.96 3.264-16.512 \
             9.792-22.528 6.592-6.144 14.08-9.088 22.592-9.088 6.208 \
             0 13.824 1.856 23.104 5.568 9.216 3.776 20.928 9.152 35.2 \
             16.192s30.528 14.912 48.768 23.68c-3.392-16.192-6.144-34.752-8.32-55.616-2.176-20.928-3.264-35.264-3.264-43.008 \
             0-9.472 3.008-17.536 9.024-24.448 6.144-6.784 \
             13.824-10.176 23.296-10.176 9.344 0 16.896 3.392 22.912 \
             10.176 6.08 6.848 9.088 15.872 9.088 27.2 3.072 0-0.512 \
             9.152-1.344 18.304-0.832 9.152-2.176 20.096-3.84 \
             33.088-1.664 12.992-3.584 27.904-5.568 44.48 16.576-7.68 \
             32.64-15.424 47.744-23.04 15.104-7.744 27.264-13.44 \
             36.16-17.024 8.96-3.52 16.128-5.376 21.568-5.376 8.96 0 \
             16.704 2.944 23.232 9.088C828.736 358.592 832 366.144 \
             832 375.04 832 380.16 830.4 385.536 827.2 391.04z" )
        ; ("fill", "currentColor") ] ]

let svg_up_narrow n =
  svg24 ~cls:"icon" ~size:n
    ~extra:
      [ ("stroke-width", "2")
      ; ("stroke-linecap", "round")
      ; ("stroke-linejoin", "round") ]
    [ node "path"
        [ ("stroke", "none"); ("d", "M0 0h24v24H0z"); ("fill", "none") ]
    ; node "line"
        [ ("x1", "12"); ("y1", "5"); ("x2", "12"); ("y2", "19") ]
    ; node "line"
        [ ("x1", "16"); ("y1", "9"); ("x2", "12"); ("y2", "5") ]
    ; node "line"
        [ ("x1", "8"); ("y1", "9"); ("x2", "12"); ("y2", "5") ] ]

let svg_down_narrow n =
  svg24 ~cls:"icon" ~size:n
    ~extra:
      [ ("stroke-width", "2")
      ; ("stroke-linecap", "round")
      ; ("stroke-linejoin", "round") ]
    [ node "path"
        [ ("stroke", "none"); ("d", "M0 0h24v24H0z"); ("fill", "none") ]
    ; node "line"
        [ ("x1", "12"); ("y1", "5"); ("x2", "12"); ("y2", "19") ]
    ; node "line"
        [ ("x1", "16"); ("y1", "15"); ("x2", "12"); ("y2", "19") ]
    ; node "line"
        [ ("x1", "8"); ("y1", "15"); ("x2", "12"); ("y2", "19") ] ]

let svg_check n =
  svg24 ~cls:"icon" ~size:n [ path24 "M5 13l4 4L19 7" ]

let svg_icon_info n =
  svg
    [ ("viewBox", "0 0 1024 1024")
    ; ("width", string_of_int n)
    ; ("height", string_of_int n)
    ; ("stroke", "currentColor") ]
    [ node "path"
        [ ( "d"
          , "M512 981.333333C253.866667 981.333333 42.666667 \
             770.133333 42.666667 512S253.866667 42.666667 512 \
             42.666667s469.333333 211.2 469.333333 469.333333-211.2 \
             469.333333-469.333333 469.333333z m0-844.8c-206.506667 \
             0-375.466667 168.96-375.466667 375.466667 0 206.506667 \
             168.96 375.466667 375.466667 375.466667 206.506667 0 \
             375.466667-168.96 375.466667-375.466667 0-206.506667-168.96-375.466667-375.466667-375.466667z" )
        ; ("fill", "currentColor") ]
    ; node "path"
        [ ( "d"
          , "M512 796.714667a46.08 46.08 0 0 1-46.933333-46.933334v-269.056c0-26.624 \
             20.352-46.933333 46.933333-46.933333 26.581333 0 46.933333 \
             20.309333 46.933333 46.933333v269.056c0 26.624-20.352 \
             46.933333-46.933333 46.933334zM512 364.928a46.08 46.08 0 0 \
             1-46.933333-46.933333V274.218667c0-26.624 \
             20.352-46.933333 46.933333-46.933334 26.581333 0 \
             46.933333 20.309333 46.933333 46.933334v43.776c0 \
             26.624-21.888 46.933333-46.933333 46.933333z" )
        ; ("fill", "currentColor") ] ]

let svg_arrow_right_v2 () =
  svg
    [ ("version", "1.1")
    ; ("view-box", "0 0 128 128")
    ; ("fill", "currentColor")
    ; ("display", "inline-block")
    ; ("class", "h-3 w-3")
    ; ("style", "margin-top:-3px") ]
    [ node "path"
        [ ( "d"
          , "M99.069 64.173c0 2.027-.77 4.054-2.316 5.6l-55.98 \
             55.98a7.92 7.92 0 01-11.196 0c-3.085-3.086-3.092-8.105 \
             0-11.196l50.382-50.382-50.382-50.382a7.92 7.92 0 010-11.195c3.086-3.085 \
             8.104-3.092 11.196 0l55.98 55.98a7.892 7.892 0 012.316 \
             5.595z" ) ] ]

(* tabler icon via the editor's icon builder -> Web_dom element *)
let ticon ?(size = 18.) name : D.el =
  (D.icon ~size name)

(* ---------- state ---------- *)

type outline =
  { o_title : string
  ; o_dest : Js.Json.t
  ; mutable o_expanded : bool
  ; o_children : outline list
  }

type finder =
  { wrap : D.el
  ; box : D.el
  ; input : D.el
  ; result_inner : D.el
  ; mutable f_val : string
  ; mutable f_case : bool
  ; mutable f_entered0 : bool
  ; mutable f_entered : bool
  ; mutable f_status : int option (* pdf.js state code *)
  ; mutable f_cur : int
  ; mutable f_total : int
  ; mutable f_query : string
  ; mutable f_go : D.el option
  ; mutable f_case_btn : D.el
  }

type t =
  { viewer : S.viewer
  ; bus : Js.Json.t
  ; header : D.el
  ; mutable page_input : D.el option
  ; mutable total_small : D.el option
  ; mutable page_cur : int
  ; mutable page_total : int
  ; mutable outline_wrap : D.el
  ; mutable panels_el : D.el
  ; mutable tab_contents : D.el
  ; mutable tab_hls : D.el
  ; mutable active_tab : string (* "contents" | "highlights" *)
  ; mutable outlines : outline list
  ; mutable outlines_loaded : bool
  ; mutable hl_active : string option
  ; mutable outline_visible : bool
  ; mutable finder : finder option
  ; mutable finder_visible : bool
  ; mutable settings_el : D.el option
  ; mutable theme : string
  ; mutable doc_listeners : (string * (D.ev -> unit)) list
  ; mutable key_listeners : (D.el * (D.ev -> unit)) list
  }

let cur : t option ref = ref None

let dispatch_extra (t : t) =
  ignore
    (Web_dom.set_timeout_id
       (fun () ->
         U.bus_dispatch t.bus "ls-update-extra-state"
           (Web_dom.json_props
              [ "page", Js.Json.number (float_of_int t.page_cur)
              ; ( "scale"
                , match U.scale_value t.viewer with
                  | Some s -> Js.Json.string s
                  | None -> Js.Json.null ) ]))
       100)

(* document.body-level outside click (cljs resolve-own-container) *)
let on_body_click f = D.add_document_listener "click" f false
let off_body_click f = Web_dom.remove_document_listener "click" f false

let track_click (t : t) f =
  on_body_click f;
  t.doc_listeners <- ("click", f) :: t.doc_listeners

(* ---------- outline / highlights panels ---------- *)

let rec render_outline_items (t : t) (parent : D.el)
    (nodes : outline list) : unit =
  List.iter (fun n -> render_outline_item t parent n) nodes

and render_outline_item (t : t) (parent : D.el) (n : outline) :
    unit =
  let item = Web_dom.create_element "div" in
  let has_child = n.o_children <> [] in
  Web_dom.el_set_class item
    ("extensions__pdf-outline-item"
    ^ (if has_child then " has-children" else "")
    ^ if n.o_expanded then " is-expand" else "");
  let inner = Web_dom.create_element "div" in
  Web_dom.el_set_class inner "inner";
  let a = Web_dom.create_element "a" in
  Web_dom.el_set_attr a "data-dest" (Js.Json.stringify n.o_dest);
  let i = Web_dom.create_element "i" in
  Web_dom.el_set_class i "arrow";
  Web_dom.el_append_child i (svg_arrow_right_v2 ());
  let sp = Web_dom.create_element "span" in
  Web_dom.el_set_text_content sp n.o_title;
  Web_dom.el_append_child a i;
  Web_dom.el_append_child a sp;
  Web_dom.el_on a "click" (fun e ->
      match D.ev_target e with
      | Some target when D.el_closest target "i" <> None ->
          D.ev_prevent_default e;
          n.o_expanded <- not n.o_expanded;
          render_panel t
      | _ ->
          U.go_to_destination (U.link_service t.viewer) n.o_dest);
  Web_dom.el_append_child inner a;
  Web_dom.el_append_child item inner;
  if has_child && n.o_expanded then (
    let ch = Web_dom.create_element "div" in
    Web_dom.el_set_class ch "children";
    render_outline_items t ch n.o_children;
    Web_dom.el_append_child item ch);
  Web_dom.el_append_child parent item

(* cljs pdf-outline content *)
and render_outline_panel (t : t) (host : D.el) : unit =
  let lc = Web_dom.create_element "div" in
  Web_dom.el_set_class lc "extensions__pdf-outline-list-content";
  Web_dom.el_set_attr lc "tabindex" "-1";
  if t.outlines = [] then (
    let sec = Web_dom.create_element "section" in
    Web_dom.el_set_class sec "is-empty";
    Web_dom.el_set_text_content sec (I18n.t "pdf/no-outlines");
    Web_dom.el_append_child lc sec)
  else (
    let sec = Web_dom.create_element "section" in
    render_outline_items t sec t.outlines;
    Web_dom.el_append_child lc sec);
  Web_dom.el_append_child host lc;
  Web_dom.el_focus lc;
  (* Esc closes *)
  let esc e =
    if Web_dom.ev_which e = 27 then toggle_outline t
  in
  t.key_listeners <- (lc, esc) :: t.key_listeners;
  Web_dom.el_on lc "keyup" esc

(* cljs pdf-highlights-list *)
and render_highlights_panel (t : t) (host : D.el) : unit =
  let hls =
    List.sort
      (fun (a : Model.hl) b -> compare a.hl_page b.hl_page)
      !S.hls
  in
  List.iter
    (fun (hl : Model.hl) ->
      let item = Web_dom.create_element "div" in
      Web_dom.el_set_class item
        ("extensions__pdf-highlights-list-item"
        ^
        match hl.hl_id, t.hl_active with
        | Some id, Some a when id = a -> " active"
        | _ -> "");
      let h6 = Web_dom.create_element "h6" in
      Web_dom.el_set_class h6 "flex";
      let sp = Web_dom.create_element "span" in
      Web_dom.el_set_class sp "flex items-center";
      let sm = Web_dom.create_element "small" in
      (match hl.hl_color with
       | Some c -> Web_dom.el_set_attr sm "data-color" c
       | None -> ());
      let st = Web_dom.create_element "strong" in
      Web_dom.el_set_text_content st
        (I18n.sub (I18n.t "pdf/page-label") [ string_of_int hl.hl_page ]);
      Web_dom.el_append_child sp sm;
      Web_dom.el_append_child sp st;
      let btn = Web_dom.create_element "button" in
      Web_dom.el_set_attr btn "title" (I18n.t "pdf/linked-ref");
      Web_dom.el_append_child btn (ticon "external-link");
      let goto () = ignore (A.goto_block_ref hl) in
      Web_dom.el_on btn "click" (fun _ -> goto ());
      Web_dom.el_append_child h6 sp;
      Web_dom.el_append_child h6 btn;
      Web_dom.el_append_child item h6;
      (match hl.hl_image, hl.hl_id with
       | Some _, Some id ->
           let pw = Web_dom.create_element "p" in
           Web_dom.el_set_class pw "area-wrap";
           let img = Web_dom.create_element "img" in
           Web_dom.el_append_child pw img;
           Web_dom.el_append_child item pw;
           ignore
             (let* src = A.hl_list_image_src ~hl_id:id in
              (match src with
               | Some s -> Web_dom.el_set_attr img "src" s
               | None -> ());
              Js.Promise.resolve ())
       | _ ->
           let pw = Web_dom.create_element "p" in
           Web_dom.el_set_class pw "text-wrap";
           Web_dom.el_set_text_content pw hl.hl_text;
           Web_dom.el_append_child item pw);
      Web_dom.el_on item "click" (fun _ ->
          U.scroll_to_highlight t.viewer hl;
          t.hl_active <- hl.hl_id;
          render_panel t);
      Web_dom.el_on item "dblclick" (fun _ -> goto ());
      Web_dom.el_append_child host item)
    hls

and render_panel (t : t) : unit =
  Web_dom.el_set_inner_html t.panels_el "";
  if t.active_tab = "contents" then render_outline_panel t t.panels_el
  else render_highlights_panel t t.panels_el

and toggle_outline (t : t) : unit =
  t.outline_visible <- not t.outline_visible;
  Web_dom.el_class_toggle t.outline_wrap "visible" t.outline_visible;
  if t.outline_visible then (
    t.active_tab <- "contents";
    refresh_tabs t;
    render_panel t;
    if not t.outlines_loaded then (
      t.outlines_loaded <- true;
      load_outlines t))

and refresh_tabs (t : t) : unit =
  Web_dom.el_class_toggle t.tab_contents "active" (t.active_tab = "contents");
  Web_dom.el_class_toggle t.tab_hls "active" (t.active_tab = "highlights")

and set_tab (t : t) (tab : string) : unit =
  t.active_tab <- tab;
  refresh_tabs t;
  render_panel t

and outline_of_json (o : Js.Json.t) : outline =
  let dest = U.json_o o "dest" in
  { o_title = Option.value (U.json_s o "title") ~default:""
  ; o_dest = Option.value dest ~default:Js.Json.null
  ; o_expanded = false
  ; o_children =
      (match U.json_a o "items" with
       | Some a ->
           Array.to_list a |> List.map outline_of_json
       | None -> []) }

and load_outlines (t : t) : unit =
  ignore
    (let* data = U.get_outline (U.pdf_document t.viewer) in
     (match Js.Json.decodeArray data with
      | Some items ->
          t.outlines <-
            Array.to_list items |> List.map outline_of_json
      | None -> ());
     render_panel t;
     Js.Promise.resolve ()
    |> Js.Promise.catch (fun e ->
           Ui_services.log_error ("[Load outline Error]", e);
           Js.Promise.resolve ()))

(* ---------- finder ---------- *)

and find_status_str = function
  | 0 -> Some "found"
  | 1 -> Some "not-found"
  | 2 -> Some "wrapped"
  | 3 -> Some "pending"
  | _ -> None

and reset_finder (f : finder) (t : t) : unit =
  U.bus_dispatch t.bus "findbarclose" Js.Json.null;
  f.f_cur <- 0;
  f.f_total <- 0;
  f.f_status <- None;
  f.f_query <- "";
  f.f_entered <- false;
  f.f_entered0 <- false;
  render_finder_state t f

and close_finder (t : t) : unit =
  (match t.finder with
   | Some f -> reset_finder f t
   | None -> ());
  t.finder_visible <- false;
  render_finder_wrap t

and do_find (t : t) (f : finder) ~type_ ~prev : unit =
  U.bus_dispatch t.bus "find"
    (Web_dom.json_props
       [ "source", Js.Json.null
       ; "type", Js.Json.string type_
       ; "query", Js.Json.string f.f_val
       ; "phraseSearch", Js.Json.boolean true
       ; "caseSensitive", Js.Json.boolean f.f_case
       ; "highlightAll", Js.Json.boolean true
       ; "findPrevious", Js.Json.boolean prev
       ; "matchDiacritics", Js.Json.boolean false ])

(* cljs result-inner *)
and render_finder_state (_t : t) (f : finder) : unit =
  Web_dom.el_set_inner_html f.result_inner "";
  if f.f_entered && String.trim f.f_val <> "" then
    match f.f_status with
    | Some s when s <> 1 ->
        let d = Web_dom.create_element "div" in
        Web_dom.el_set_class d "flex px-3 py-3 text-xs opacity-90";
        let cur' = max f.f_cur f.f_cur in
        let q = if f.f_query = "" then f.f_val else f.f_query in
        Web_dom.el_set_text_content d
          (I18n.sub (I18n.t "pdf/find-results")
             [ string_of_int cur'
             ; string_of_int f.f_total
             ; q ]);
        Web_dom.el_append_child f.result_inner d
    | Some 1 ->
        let d = Web_dom.create_element "div" in
        Web_dom.el_set_class d "px-3 py-3 text-xs opacity-80 text-red-600";
        Web_dom.el_set_text_content d (I18n.t "pdf/not-found");
        Web_dom.el_append_child f.result_inner d
    | _ -> ()

(* shui ghost/xs button + tabler icon (cljs ui/button) *)
and ghost_btn ?(extra = "") ~icon ~title ~onclick () : D.el =
  let b = Web_dom.create_element "button" in
  Web_dom.el_set_class b
    (Ui_parts.ghost_btn_cls ~extra:("h-6 text-xs rounded px-3 " ^ extra)
       ());
  Web_dom.el_set_attr b "type" "button";
  Web_dom.el_set_attr b "title" title;
  Web_dom.el_append_child b (ticon icon);
  Web_dom.el_on b "click" (fun e ->
      D.ev_stop_propagation e;
      onclick ());
  b

(* cljs pdf-finder DOM *)
and mount_finder (t : t) : finder =
  let wrap = Web_dom.create_element "div" in
  Web_dom.el_set_class wrap "extensions__pdf-finder-wrap hls-popup-overlay visible";
  let box = Web_dom.create_element "div" in
  Web_dom.el_set_class box "extensions__pdf-finder hls-popup-box";
  Web_dom.el_set_attr box "tabindex" "-1";
  let inner = Web_dom.create_element "div" in
  Web_dom.el_set_class inner "input-inner flex items-center";
  let iw = Web_dom.create_element "div" in
  Web_dom.el_set_class iw "input-wrap relative";
  let input = Web_dom.create_element "input" in
  Web_dom.el_set_attr input "placeholder" (I18n.t "pdf/search-placeholder");
  Web_dom.el_set_attr input "type" "text";
  Web_dom.el_set_attr input "autofocus" "true";
  Web_dom.el_append_child iw input;
  Web_dom.el_append_child inner iw;
  let result_inner = Web_dom.create_element "div" in
  Web_dom.el_set_class result_inner "result-inner";
  let f =
    { wrap
    ; box
    ; input
    ; result_inner
    ; f_val = ""
    ; f_case = false
    ; f_entered0 = false
    ; f_entered = false
    ; f_status = None
    ; f_cur = 0
    ; f_total = 0
    ; f_query = ""
    ; f_go = None
    ; f_case_btn = D.document_el }
  in
  let case_btn =
    ghost_btn ~icon:"letter-case" ~title:"" ~onclick:(fun () ->
        f.f_case <- not f.f_case;
        Web_dom.el_class_toggle f.f_case_btn "active" f.f_case;
        do_find t f ~type_:"casesensitivitychange" ~prev:false)
      ()
  in
  f.f_case_btn <- case_btn;
  List.iter
    (fun b -> Web_dom.el_append_child inner b)
    [ case_btn
    ; ghost_btn ~icon:"chevron-up" ~title:"" ~onclick:(fun () ->
          do_find t f ~type_:"again" ~prev:true)
        ()
    ; ghost_btn ~icon:"chevron-down" ~title:"" ~onclick:(fun () ->
          do_find t f ~type_:"again" ~prev:false)
        ()
    ; ghost_btn ~icon:"x" ~title:"" ~onclick:(fun () -> close_finder t)
        () ];
  Web_dom.el_on input "input" (fun _ ->
      f.f_val <- Web_dom.el_value input;
      f.f_entered0 <- String.trim f.f_val <> "";
      f.f_entered <- false;
      refresh_go_btn t f iw);
  Web_dom.el_on input "keyup" (fun e ->
      match Web_dom.ev_which e with
      | 13 ->
          let shift = D.ev_shift e in
          do_find t f ~type_:"again" ~prev:shift;
          f.f_entered <- true;
          render_finder_state t f
      | 27 ->
          if String.trim f.f_val = "" then close_finder t
          else (
            reset_finder f t;
            f.f_val <- "";
            Web_dom.el_set_value input "";
            refresh_go_btn t f iw)
      | _ -> ());
  (* click outside (cljs: not in finder, target title != Search) *)
  let outside e =
    if f.f_val = "" then
      match D.ev_target e with
      | Some target ->
          if
            Web_dom.ev_target_title e <> Some "Search"
            && not (Web_dom.el_contains box target)
          then close_finder t
      | None -> ()
  in
  track_click t outside;
  Web_dom.el_append_child box inner;
  Web_dom.el_append_child box result_inner;
  Web_dom.el_append_child wrap box;
  Web_dom.el_append_child t.header wrap;
  Web_dom.el_focus input;
  f

(* icon-enter button appears once input is non-empty *)
and refresh_go_btn (t : t) (f : finder) (iw : D.el) : unit =
  (match f.f_go with
   | Some b -> Web_dom.el_remove b
   | None -> ());
  f.f_go <- None;
  if f.f_entered0 then (
    let b =
      ghost_btn ~extra:"" ~icon:"arrow-back"
        ~title:(I18n.t "pdf/enter-to-search")
        ~onclick:(fun () ->
          do_find t f ~type_:"again" ~prev:false;
          f.f_entered <- true;
          render_finder_state t f)
        ()
    in
    f.f_go <- Some b;
    Web_dom.el_append_child iw b)

and render_finder_wrap (t : t) : unit =
  (match t.finder with
   | Some f -> Web_dom.el_remove f.wrap
   | None -> ());
  t.finder <- None;
  if t.finder_visible then (
    let f = mount_finder t in
    t.finder <- Some f)

and toggle_finder (t : t) : unit =
  t.finder_visible <- not t.finder_visible;
  render_finder_wrap t

(* ---------- settings ---------- *)

(* ui/toggle -> shui Switch sm (same shape as settings_page.switch_el) *)
and switch_el ~on_ ~on_toggle : D.el =
  let chk = if on_ then "checked" else "unchecked" in
  let s = Web_dom.create_element "span" in
  Web_dom.el_set_class s
    "ui__switch peer inline-flex shrink-0 cursor-pointer items-center \
     rounded-full border-2 border-transparent transition-colors \
     focus-visible:outline-none focus-visible:ring-2 \
     focus-visible:ring-ring focus-visible:ring-offset-2 \
     disabled:cursor-not-allowed disabled:opacity-50 \
     data-[checked]:justify-end data-[checked]:bg-primary \
     data-[unchecked]:justify-start data-[unchecked]:bg-input \
     pr-[1px] pl-[1px] h-4.5 w-8";
  Web_dom.el_set_attr s "role" "switch";
  Web_dom.el_set_attr s "aria-checked" (if on_ then "true" else "false");
  Web_dom.el_set_attr s ("data-" ^ chk) "";
  let th = Web_dom.create_element "span" in
  Web_dom.el_set_class th
    "pointer-events-none block rounded-full bg-background shadow-lg \
     ring-0 transition-transform h-3 w-3";
  Web_dom.el_set_attr th ("data-" ^ chk) "";
  Web_dom.el_append_child s th;
  Web_dom.el_on s "click" (fun _ -> on_toggle ());
  s

and set_theme (t : t) (name : string) : unit =
  t.theme <- name;
  S.set_viewer_theme name;
  (match Web_dom.get_element_by_id
           ("pdf-layout-container_"
           ^
           match !S.current with
           | Some a -> a.Model.pdf_identity
           | None -> "")
   with
   | Some el -> Web_dom.el_dataset_set el "theme" name
   | None -> ());
  render_settings t

and toggle_item between ~label ~on_ ~on_toggle : D.el =
  let it = Web_dom.create_element "div" in
  Web_dom.el_set_class it
    ("extensions__pdf-settings-item toggle-input"
    ^ if between then " is-between" else "");
  let l = Web_dom.create_element "label" in
  Web_dom.el_set_text_content l label;
  Web_dom.el_append_child it l;
  Web_dom.el_append_child it (switch_el ~on_ ~on_toggle);
  it

(* cljs pdf-settings overlay *)
and render_settings (t : t) : unit =
  (match t.settings_el with
   | Some el -> Web_dom.el_remove el
   | None -> ());
  let wrap = Web_dom.create_element "div" in
  Web_dom.el_set_class wrap "extensions__pdf-settings hls-popup-overlay visible";
  let box = Web_dom.create_element "div" in
  Web_dom.el_set_class box "extensions__pdf-settings-inner hls-popup-box";
  Web_dom.el_set_attr box "tabindex" "-1";
  let picker = Web_dom.create_element "div" in
  Web_dom.el_set_class picker "extensions__pdf-settings-item theme-picker";
  List.iter
    (fun name ->
      let b = Web_dom.create_element "button" in
      Web_dom.el_set_class b ("flex items-center justify-center " ^ name);
      if name = t.theme then Web_dom.el_append_child b (svg_check 16);
      Web_dom.el_on b "click" (fun _ -> set_theme t name);
      Web_dom.el_append_child picker b)
    [ "light"; "warm"; "dark" ];
  Web_dom.el_append_child box picker;
  Web_dom.el_append_child box
    (toggle_item false
       ~label:(I18n.t "pdf/toggle-dashed")
       ~on_:(S.area_dashed ())
       ~on_toggle:(fun () ->
         let v = not (S.area_dashed ()) in
         S.set_area_dashed v;
         (match
            Web_dom.el_query (U.container_el t.viewer) ".extensions__pdf-viewer"
          with
          | Some vel -> Web_dom.el_class_toggle vel "is-area-dashed" v
          | None -> ());
         render_settings t));
  Web_dom.el_append_child box
    (toggle_item true
       ~label:(I18n.t "pdf/hl-block-colored")
       ~on_:(S.hl_colored ())
       ~on_toggle:(fun () ->
         S.set_hl_colored (not (S.hl_colored ()));
         render_settings t));
  Web_dom.el_append_child box
    (toggle_item true
       ~label:(I18n.t "pdf/auto-open-context-menu")
       ~on_:(S.auto_open_ctx ())
       ~on_toggle:(fun () ->
         S.set_auto_open_ctx (not (S.auto_open_ctx ()));
         render_settings t));
  (* doc metadata *)
  let meta_item = Web_dom.create_element "div" in
  Web_dom.el_set_class meta_item "extensions__pdf-settings-item toggle-input";
  let a = Web_dom.create_element "a" in
  Web_dom.el_set_class a "is-info w-full text-gray-500";
  Web_dom.el_set_attr a "title" (I18n.t "pdf/doc-metadata");
  let sp = Web_dom.create_element "span" in
  Web_dom.el_set_class sp "flex items-center justify-between w-full";
  Web_dom.el_set_text_content sp "";
  let txt = Web_dom.create_element "span" in
  Web_dom.el_set_text_content txt (I18n.t "pdf/doc-metadata");
  Web_dom.el_append_child sp txt;
  Web_dom.el_append_child sp (svg_icon_info 16);
  Web_dom.el_append_child a sp;
  Web_dom.el_on a "click" (fun _ -> open_docinfo t);
  Web_dom.el_append_child meta_item a;
  Web_dom.el_append_child box meta_item;
  Web_dom.el_append_child wrap box;
  Web_dom.el_append_child t.header wrap;
  t.settings_el <- Some wrap;
  Web_dom.el_focus box;
  let esc e = if Web_dom.ev_which e = 27 then close_settings t in
  t.key_listeners <- (box, esc) :: t.key_listeners;
  Web_dom.el_on box "keyup" esc;
  let outside e =
    match D.ev_target e with
    | Some target ->
        if
          (not (Web_dom.el_contains box target))
          && D.el_closest target ".ui__dialog-content" = None
        then close_settings t
    | None -> ()
  in
  track_click t outside

and close_settings (t : t) : unit =
  (match t.settings_el with
   | Some el ->
       Web_dom.el_remove el;
       t.settings_el <- None
   | None -> ())

and toggle_settings (t : t) : unit =
  match t.settings_el with
  | Some _ -> close_settings t
  | None -> render_settings t

(* cljs docinfo-display inside a shui modal — same overlay/content
   classes dialogs_view emits *)
and open_docinfo (t : t) : unit =
  close_settings t;
  ignore
    (let* meta = U.get_metadata (U.pdf_document t.viewer) in
     let info =
       match U.json_o meta "info" with
       | Some o -> o
       | None -> Js.Json.null
     in
     show_docinfo_modal t info;
     Js.Promise.resolve ()
    |> Js.Promise.catch (fun e ->
           Ui_services.log_error ("pdf metadata", e);
           Js.Promise.resolve ()))

and show_docinfo_modal (t : t) (info : Js.Json.t) : unit =
  let ov = Web_dom.create_element "div" in
  Web_dom.el_set_class ov
    "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex \
     justify-center items-center";
  let content = Web_dom.create_element "div" in
  Web_dom.el_set_class content
    "ui__dialog-content fixed left-[50%] top-[50%] z-50 grid w-full \
     max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg bg-background \
     p-6 shadow-lg ui__dialog-zoom-in";
  Web_dom.el_set_attr content "data-state" "open";
  Web_dom.el_set_attr content "role" "dialog";
  Web_dom.el_style_set_property content "transform" "translate(-50%, -50%)";
  let main = Web_dom.create_element "div" in
  Web_dom.el_set_class main "ui__dialog-main-content";
  let docinfo = Web_dom.create_element "div" in
  Web_dom.el_set_attr docinfo "id" "pdf-docinfo";
  Web_dom.el_set_class docinfo "extensions__pdf-doc-info";
  let inner_text = Web_dom.create_element "div" in
  Web_dom.el_set_class inner_text "inner-text";
  (match Js.Json.decodeObject info with
   | Some d ->
       Js.Dict.entries d
       |> Array.iter (fun (k, v) ->
              let p = Web_dom.create_element "p" in
              let st = Web_dom.create_element "strong" in
              Web_dom.el_set_text_content st (k ^ "::");
              Web_dom.el_append_child p st;
              let it = Web_dom.create_element "i" in
              Web_dom.el_set_text_content it (Js.Json.stringify v);
              Web_dom.el_append_child p it;
              Web_dom.el_append_child inner_text p)
   | None -> ());
  Web_dom.el_append_child docinfo inner_text;
  let foot = Web_dom.create_element "div" in
  Web_dom.el_set_class foot "flex items-center justify-center pt-2 pb--2";
  let copy = Web_dom.create_element "button" in
  Web_dom.el_set_class copy
    "ui__button inline-flex cursor-pointer items-center \
     justify-center whitespace-nowrap rounded-md text-sm gap-1 \
     font-medium ring-offset-background transition-colors \
     focus-visible:outline-none focus-visible:ring-2 \
     focus-visible:ring-ring focus-visible:ring-offset-2 \
     disabled:pointer-events-none disabled:opacity-50 select-none \
     bg-primary/90 hover:bg-primary/100 active:opacity-90 \
     text-primary-foreground hover:text-primary-foreground as-solid \
     h-7 rounded px-3 py-1";
  Web_dom.el_set_attr copy "type" "button";
  Web_dom.el_set_text_content copy (I18n.t "ui/copy-all");
  let close_all () = Web_dom.el_remove ov in
  Web_dom.el_on copy "click" (fun _ ->
      Ui_services.clipboard_copy (Web_dom.el_inner_text inner_text);
      Toast.success (I18n.t "notification/copied");
      close_all ());
  Web_dom.el_append_child foot copy;
  Web_dom.el_append_child docinfo foot;
  Web_dom.el_append_child main docinfo;
  Web_dom.el_append_child content main;
  Web_dom.el_append_child ov content;
  Web_dom.el_on ov "click" (fun e ->
      match D.ev_target e with
          | Some target
        when Web_dom.el_contains ov target
             && not (Web_dom.el_contains content target) ->
          close_all ()
      | _ -> ());
  Web_dom.el_append_child t.header ov

(* ---------- toolbar row ---------- *)

and tool_btn (_t : t) ~title ?(is_active = false) icon onclick :
    D.el =
  let a = Web_dom.create_element "a" in
  Web_dom.el_set_class a ("button" ^ if is_active then " is-active" else "");
  Web_dom.el_set_attr a "title" title;
  Web_dom.el_append_child a icon;
  Web_dom.el_on a "click" (fun e ->
      D.ev_stop_propagation e;
      onclick ());
  a

and mount_pager (t : t) (host : D.el) : unit =
  let pager = Web_dom.create_element "div" in
  Web_dom.el_set_class pager "pager flex items-center ml-1";
  let nu = Web_dom.create_element "span" in
  Web_dom.el_set_class nu "nu flex items-center opacity-70";
  let input = Web_dom.create_element "input" in
  Web_dom.el_set_attr input "type" "number";
  Web_dom.el_set_attr input "min" "1";
  Web_dom.el_set_value input "1";
  Web_dom.el_on input "mouseenter" (fun _ -> Web_dom.el_select_text input);
  Web_dom.el_on input "keyup" (fun e ->
      let v = int_of_string_opt (String.trim (Web_dom.el_value input)) in
      (match v with
       | Some n -> (
           t.page_cur <- n;
           Web_dom.el_class_toggle input "is-long" (n > 999);
           if Web_dom.ev_key_code e = 13 && n > 0 then
             U.set_current_page t.viewer (min n t.page_total)
           else ())
       | None -> ());
      ());
  t.page_input <- Some input;
  let small = Web_dom.create_element "small" in
  Web_dom.el_set_text_content small ("/ " ^ string_of_int t.page_total);
  t.total_small <- Some small;
  Web_dom.el_append_child nu input;
  Web_dom.el_append_child nu small;
  Web_dom.el_append_child pager nu;
  let ct = Web_dom.create_element "span" in
  Web_dom.el_set_class ct "ct flex items-center";
  let prev = Web_dom.create_element "a" in
  Web_dom.el_set_class prev "button";
  Web_dom.el_append_child prev (svg_up_narrow 16);
  Web_dom.el_on prev "click" (fun _ -> U.previous_page t.viewer);
  let next = Web_dom.create_element "a" in
  Web_dom.el_set_class next "button";
  Web_dom.el_append_child next (svg_down_narrow 16);
  Web_dom.el_on next "click" (fun _ -> U.next_page t.viewer);
  Web_dom.el_append_child ct prev;
  Web_dom.el_append_child ct next;
  Web_dom.el_append_child pager ct;
  Web_dom.el_append_child host pager

(* cljs pdf-outline-&-highlights wrap (always mounted, .visible gate) *)
and mount_outline_wrap (t : t) : unit =
  let wrap = Web_dom.create_element "div" in
  Web_dom.el_set_class wrap "extensions__pdf-outline-wrap hls-popup-overlay";
  let box = Web_dom.create_element "div" in
  Web_dom.el_set_class box "extensions__pdf-outline hls-popup-box";
  Web_dom.el_set_attr box "tabindex" "-1";
  let tabs = Web_dom.create_element "div" in
  Web_dom.el_set_class tabs "extensions__pdf-outline-tabs";
  let inner = Web_dom.create_element "div" in
  Web_dom.el_set_class inner "inner";
  let bc = Web_dom.create_element "button" in
  Web_dom.el_set_class bc "active";
  Web_dom.el_set_text_content bc (I18n.t "page/contents");
  Web_dom.el_on bc "click" (fun _ -> set_tab t "contents");
  let bh = Web_dom.create_element "button" in
  Web_dom.el_set_text_content bh (I18n.t "pdf/highlights");
  Web_dom.el_on bh "click" (fun _ -> set_tab t "highlights");
  t.tab_contents <- bc;
  t.tab_hls <- bh;
  Web_dom.el_append_child inner bc;
  Web_dom.el_append_child inner bh;
  Web_dom.el_append_child tabs inner;
  let panels = Web_dom.create_element "div" in
  Web_dom.el_set_class panels "extensions__pdf-outline-panels";
  t.panels_el <- panels;
  Web_dom.el_append_child box tabs;
  Web_dom.el_append_child box panels;
  Web_dom.el_append_child wrap box;
  t.outline_wrap <- wrap;
  Web_dom.el_append_child t.header wrap;
  (* cljs outside-click: closes unless target is the Outline button *)
  let outside e =
    if t.outline_visible then
      match D.ev_target e with
      | Some target ->
          if
            Web_dom.ev_target_title e <> Some "Outline"
            && not (Web_dom.el_contains box target)
          then (
            t.outline_visible <- false;
            Web_dom.el_class_remove wrap "visible";
            t.active_tab <- "contents";
            refresh_tabs t;
            render_panel t)
      | None -> ()
  in
  track_click t outside

(* public entry — cljs pdf-toolbar *)
and mount ~(viewer : S.viewer) ~(parent : D.el)
    ~(bus : Js.Json.t) : unit =
  let header = Web_dom.create_element "div" in
  Web_dom.el_set_class header "extensions__pdf-header";
  let tbar = Web_dom.create_element "div" in
  Web_dom.el_set_class tbar "extensions__pdf-toolbar";
  let inner = Web_dom.create_element "div" in
  Web_dom.el_set_class inner "inner";
  let buttons = Web_dom.create_element "div" in
  Web_dom.el_set_class buttons "r flex buttons";
  Web_dom.el_append_child inner buttons;
  Web_dom.el_append_child tbar inner;
  Web_dom.el_append_child header tbar;
  let t =
    { viewer
    ; bus
    ; header
    ; page_input = None
    ; total_small = None
    ; page_cur = 1
    ; page_total = 1
    ; outline_wrap = header
    ; panels_el = header
    ; tab_contents = header
    ; tab_hls = header
    ; active_tab = "contents"
    ; outlines = []
    ; outlines_loaded = false
    ; hl_active = None
    ; outline_visible = false
    ; finder = None
    ; finder_visible = false
    ; settings_el = None
    ; theme = S.viewer_theme ()
    ; doc_listeners = []
    ; key_listeners = [] }
  in
  cur := Some t;
  mount_buttons t buttons;
  mount_pager t buttons;
  let close = Web_dom.create_element "a" in
  Web_dom.el_set_class close "button";
  Web_dom.el_set_text_content close (I18n.t "ui/close");
  Web_dom.el_on close "click" (fun _ -> S.set_current None);
  Web_dom.el_append_child buttons close;
  mount_outline_wrap t;
  wire_bus t;
  t.page_total <- U.num_pages viewer;
  (match t.total_small with
   | Some s -> Web_dom.el_set_text_content s ("/ " ^ string_of_int t.page_total)
   | None -> ());
  t.page_cur <- U.current_page viewer;
  (match t.page_input with
   | Some i ->
       Web_dom.el_set_value i (string_of_int t.page_cur);
       Web_dom.el_class_toggle i "is-long" (t.page_cur > 999)
   | None -> ());
  dispatch_extra t;
  apply_theme t;
  Web_dom.el_append_child parent header

and apply_theme (t : t) : unit =
  match !S.current with
  | Some a -> (
      match Web_dom.get_element_by_id ("pdf-layout-container_" ^ a.Model.pdf_identity) with
      | Some el -> Web_dom.el_dataset_set el "theme" t.theme
      | None -> ())
  | None -> ()

and mount_buttons (t : t) (buttons : D.el) : unit =
  let area_title =
    I18n.sub
      (I18n.t "pdf/area-highlight-shortcut")
      [ if Ui_services.env_is_mac () then "⌘" else "Shift" ]
  in
  let area_btn_ref = ref None in
  let area_btn =
    tool_btn t ~title:area_title ~is_active:!S.area_mode
      (svg_icon_area 18) (fun () ->
        S.area_mode := not !S.area_mode;
        match !area_btn_ref with
        | Some el ->
            Web_dom.el_class_toggle el "is-active" !S.area_mode
        | None -> ())
  in
  area_btn_ref := Some area_btn;
  let hl_btn_ref = ref None in
  let hl_btn =
    tool_btn t ~title:(I18n.t "pdf/highlight-mode")
      ~is_active:!S.highlight_mode (svg_highlighter 16) (fun () ->
        S.highlight_mode := not !S.highlight_mode;
        match !hl_btn_ref with
        | Some el ->
            Web_dom.el_class_toggle el "is-active" !S.highlight_mode
        | None -> ())
  in
  hl_btn_ref := Some hl_btn;
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/more-settings")
       (svg_adjustments 18) (fun () -> toggle_settings t));
  Web_dom.el_append_child buttons area_btn;
  Web_dom.el_append_child buttons hl_btn;
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/zoom-out") (svg_zoom_out 18)
       (fun () ->
         U.zoom_out t.viewer;
         dispatch_extra t));
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/zoom-in") (svg_zoom_in 18)
       (fun () ->
         U.zoom_in t.viewer;
         dispatch_extra t));
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/auto-fit") (svg_auto_fit 18)
       (fun () ->
         U.reset_viewer_auto t.viewer;
         dispatch_extra t));
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/outline") (svg_view_list 16)
       (fun () -> toggle_outline t));
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/search") (svg_search2 19)
       (fun () -> toggle_finder t));
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/annotations-page")
       (svg_annotations 16) (fun () ->
         match !S.current with
         | Some a when a.Model.pdf_block_uuid <> None ->
             A.goto_annotations_page a
         | _ -> ()));
  (* cljs renders the system-window button on web too; the handler is
     Electron-only so it is a no-op here *)
  Web_dom.el_append_child buttons
    (tool_btn t ~title:(I18n.t "pdf/open-in-external-window")
       (ticon "window-maximize") (fun () -> ()))

and wire_bus (t : t) : unit =
  U.bus_on t.bus "pagechanging" (fun ev ->
      match U.json_f ev "pageNumber" with
      | Some n ->
          let n = int_of_float n in
          t.page_cur <- n;
          (match t.page_input with
           | Some i ->
               Web_dom.el_set_value i (string_of_int n);
               Web_dom.el_class_toggle i "is-long" (n > 999)
           | None -> ());
          dispatch_extra t
      | None -> ());
  (* cljs pdf-finder bus events *)
  U.bus_on t.bus "updatefindmatchescount" (fun ev ->
      match t.finder with
      | Some f -> (
          match U.json_o ev "matchesCount" with
          | Some m ->
              f.f_cur <- Option.value (U.json_f m "current") ~default:0.
                         |> int_of_float;
              f.f_total <- Option.value (U.json_f m "total") ~default:0.
                           |> int_of_float;
              render_finder_state t f
          | None -> ())
      | None -> ());
  U.bus_on t.bus "updatefindcontrolstate" (fun ev ->
      match t.finder with
      | Some f -> (
          f.f_status <-
            (match U.json_f ev "state" with
             | Some s -> Some (int_of_float s)
             | None -> None);
          f.f_query <- Option.value (U.json_s ev "rawQuery") ~default:"";
          match U.json_o ev "matchesCount" with
          | Some m ->
              f.f_cur <- Option.value (U.json_f m "current") ~default:0.
                         |> int_of_float;
              f.f_total <- Option.value (U.json_f m "total") ~default:0.
                           |> int_of_float
          | None -> ())
      | None -> ())

(* teardown — document-level listeners die with the viewer *)
let uninstall () : unit =
  match !cur with
  | Some t ->
      List.iter (fun (_, f) -> off_body_click f) t.doc_listeners;
      t.doc_listeners <- [];
      cur := None
  | None -> ()
