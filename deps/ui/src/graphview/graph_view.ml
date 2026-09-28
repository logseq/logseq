(* Global graph view (#/graph) — mirrors components/graph.cljs chrome:
   #global-graph.graph-root > .graph-canvas[role=application] +
   .graph-bottom-toolbar (settings panel + time-travel control).
   The canvas body stays empty: cljs renders nodes via pixi/WebGL, so
   no .graph-node DOM exists upstream either. *)

open Lui_elements
open Logseq_dom

let settings_toggle open_ =
  dom ~key:"gs-toggle" ~tag:"button"
    ~style_class:"graph-settings-toggle graph-toolbar-button"
    ~attrs:
      [ ("aria-label", Strings.graph_settings)
      ; ("title", Strings.graph_settings)
      ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then (
        Runtime.send Action.Graph_toggle_settings;
        Runtime.flush ()))
    [ Icons.icon (if open_ then "chevron-down" else "settings") ]

let mode_tab (m : Model.t) mode label =
  dom ~key:("gmt-" ^ mode) ~tag:"button"
    ~style_class:"graph-mode-tab"
    ~attrs:
      [ ("role", "tab")
      ; ( "aria-selected"
        , if m.gv.gv_mode = mode then "true" else "false" )
      ; ( "data-state"
        , if m.gv.gv_mode = mode then "active" else "inactive" )
      ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then (
        Runtime.send (Action.Graph_set_mode mode);
        Runtime.flush ()))
    [ dom ~key:("gmtl-" ^ mode) ~style_class:"graph-mode-tab-label"
        [ dom ~key:("gmts-" ^ mode) ~tag:"span" ~text:label [] ]
    ]

let settings_panel (m : Model.t) =
  dom ~key:"gs-panel" ~style_class:"graph-settings-panel"
    [ dom ~key:"gs-head" ~style_class:"graph-settings-panel-header"
        [ dom ~key:"gs-tt"
            [ dom ~key:"gs-title" ~style_class:"graph-settings-title"
                ~text:Strings.graph_settings []
            ; dom ~key:"gs-sub"
                ~style_class:"graph-settings-subtitle"
                ~text:Strings.graph_settings_saved_per_graph []
            ]
        ; dom ~key:"gs-close" ~tag:"button"
            ~style_class:"graph-settings-close"
            ~attrs:[ ("aria-label", Strings.ui_close) ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then (
                Runtime.send Action.Graph_toggle_settings;
                Runtime.flush ()))
            [ Icons.icon "x" ]
        ]
    ; dom ~key:"gs-group" ~tag:"section"
        ~style_class:"graph-settings-group is-open"
        [ dom ~key:"gs-gh" ~tag:"button"
            ~style_class:"graph-settings-group-header"
            ~attrs:[ ("aria-expanded", "true") ]
            [ dom ~key:"gs-gt" ~style_class:"graph-settings-group-title"
                [ dom ~key:"gs-gc"
                    ~style_class:"graph-settings-group-chevron"
                    [ Icons.icon "chevron-right" ]
                ; dom ~key:"gs-gl" ~tag:"span"
                    ~text:Strings.graph_view_mode []
                ]
            ]
        ; dom ~key:"gs-gb" ~style_class:"graph-settings-group-body"
            [ dom ~key:"gs-gbi"
                ~style_class:"graph-settings-group-body-inner"
                [ dom ~key:"gm-tabs" ~style_class:"graph-mode-tabs"
                    ~attrs:[ ("role", "tablist") ]
                    [ dom ~key:"gm-list"
                        ~style_class:"graph-mode-tabs-list"
                        [ mode_tab m "tags-and-objects"
                            Strings.graph_view_mode_tags
                        ; mode_tab m "all-pages"
                            Strings.graph_view_mode_all_pages
                        ]
                    ]
                ]
            ]
        ]
    ]

let tt_label (m : Model.t) =
  let duration = m.gv.gv_max -. m.gv.gv_min in
  let at_now, shown =
    match m.gv.gv_tt_value with
    | None -> (true, duration)
    | Some v -> (v >= duration, v)
  in
  let text =
    if at_now then Strings.graph_time_travel_now
    else Dates.short_date_of_ts (m.gv.gv_min +. shown)
  in
  dom ~key:"tt-label" ~style_class:"graph-time-travel-label"
    [ dom ~key:"ttl-s" ~tag:"span" ~text:Strings.graph_time_travel []
    ; dom ~key:"ttl-strong" ~tag:"strong" ~text []
    ]

let time_travel (m : Model.t) =
  let duration = m.gv.gv_max -. m.gv.gv_min in
  let value = Option.value m.gv.gv_tt_value ~default:duration in
  let open_ = m.gv.gv_tt_open in
  dom ~key:"tt"
    ~style_class:("graph-time-travel" ^ if open_ then " is-open" else "")
    [ dom ~key:"tt-toggle" ~tag:"button"
        ~style_class:"graph-time-travel-toggle graph-toolbar-button"
        ~attrs:
          [ ("aria-label", Strings.graph_time_travel)
          ; ("title", Strings.graph_time_travel)
          ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then (
            Runtime.send Action.Graph_toggle_tt;
            Runtime.flush ()))
        [ Icons.icon (if open_ then "chevron-down" else "history") ]
    ; dom ~key:"tt-panel" ~style_class:"graph-time-travel-panel"
        ~attrs:[ ("aria-hidden", if open_ then "false" else "true") ]
        [ dom ~key:"tt-reset" ~tag:"button"
            ~style_class:"graph-time-travel-reset"
            ~attrs:
              [ ("aria-label", Strings.graph_time_travel_now)
              ; ("title", Strings.graph_time_travel_now)
              ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then (
                Runtime.send Action.Graph_tt_reset;
                Runtime.flush ()))
            [ Icons.icon "player-play" ]
        ; dom ~key:"tt-body" ~style_class:"graph-time-travel-body"
            [ tt_label m
            ; dom ~key:"tt-slider" ~tag:"input"
                ~style_class:"graph-time-travel-slider"
                ~attrs:
                  [ ("type", "range")
                  ; ("min", "0")
                  ; ( "max"
                    , Printf.sprintf "%.0f" duration )
                  ; ( "step"
                    , Printf.sprintf "%d"
                        (max 1 (int_of_float (duration /. 240.))) )
                  ; ("value", Printf.sprintf "%.0f" value)
                  ; ("aria-label", Strings.graph_time_travel)
                  ]
                ~events:"input change"
                ~on_dom_event:(fun _name payload ->
                  match payload with
                  | Some p ->
                      let v = Platform.payload_str p "value" in
                      (try
                         Runtime.send
                           (Action.Graph_set_tt (Float.of_string v));
                         Runtime.flush ()
                       with _ -> ())
                  | None -> ())
                []
            ; dom ~key:"tt-ticks"
                ~style_class:"graph-time-travel-ticks"
                [ dom ~key:"ttt-min" ~tag:"span"
                    ~text:(Dates.short_date_of_ts m.gv.gv_min) []
                ; dom ~key:"ttt-max" ~tag:"span"
                    ~text:(Dates.short_date_of_ts m.gv.gv_max) []
                ]
            ]
        ]
    ]

let canvas =
  dom ~key:"graph-canvas" ~tag:"canvas" ~style_class:"graph-canvas"
    ~attrs:
      [ ("role", "application")
      ; ("tabindex", "0")
      ; ("aria-label", Strings.graph_canvas_label)
      ]
    []

let view (m : Model.t) : t =
  dom ~key:"global-graph" ~id:"global-graph" ~style_class:"graph-root"
    [ (if m.gv.gv_loaded then canvas
       else
         dom ~key:"graph-loading" ~style_class:"graph-loading"
           ~text:Strings.graph_preparing [])
    ; dom ~key:"gbt" ~style_class:"graph-bottom-toolbar"
        [ dom ~key:"gs"
            ~style_class:
              ("graph-settings"
               ^ if m.gv.gv_settings_open then " is-open" else "")
            [ settings_toggle m.gv.gv_settings_open
            ; (if m.gv.gv_settings_open then settings_panel m
               else box ~key:"gs-none" [])
            ]
        ; (if m.gv.gv_loaded then time_travel m
           else box ~key:"tt-none" [])
        ]
    ]
