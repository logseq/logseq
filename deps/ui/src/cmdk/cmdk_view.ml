(* Command palette overlay — mirrors components/cmdk/{core,list_item}.cljs.

   DOM contract (e2e):
     .cp__cmdk__modal > .cp__cmdk >
       .cp__cmdk-input-row > input.cp__cmdk-search-input
       .w-full.flex-1.overflow-y-auto (scroller) >
         per group: .border-b.border-gray-06[.pb-1] >
           header (.text-xs... .bg-gray-02.h-8) + .search-results >
             div[data-item-index] > div[data-cmdk-item].transition-colors
             [.cursor-pointer only in mouse mode] [data-highlighted]
             [data-kb-highlighted]
       .hints

   Uses the LUI `dialog` primitive for the modal shell (backdrop,
   Esc-dismiss, focus trap); the inner palette rows are logseq-*
   extension elements because LUI menu primitives render <button>
   items, not the contracted DOM. *)

open Lui_elements

module S = Cmdk_state

let scroller_class =
  "w-full flex-1 overflow-y-auto min-h-[65dvh] max-h-[65dvh] pb-14"

let row_base_class =
  "flex flex-col transition-colors duration-75 ease-in rounded-lg py-1.5 px-3 gap-0.5"

(* -- item row -------------------------------------------------------- *)

(* wrapper attrs: only data-item-index; row attrs: data-cmdk-item etc. *)
let wrapper_attrs it = [ ("data-item-index", string_of_int it.S.idx) ]

let row_class _it v =
  row_base_class ^ if v.S.mouse then " cursor-pointer" else ""

let row_data_attrs (it : S.item) (v : S.view) =
  let hoverable = v.S.mouse in
  let highlighted = v.S.hl = it.S.idx in
  ("data-cmdk-item", "true")
  :: (if hoverable then [ ("data-hoverable", "true") ] else [])
  @ (if highlighted then [ ("data-highlighted", "true") ] else [])
  @ (if highlighted && not hoverable then [ ("data-kb-highlighted", "true") ]
     else [])

let pair_sig (st : S.t) (item_sig : S.item Signal.signal) =
  Signal.map2 (fun (it : S.item) (v : S.view) -> (it, v)) item_sig
    st.S.vs.Signal.state_signal

let item_header (it : S.item) =
  match it.S.header with
  | None -> box ~key:"no-header" []
  | Some h ->
      Logseq_dom.dom ~key:"hdr"
        ~style_class:
          "text-xs pl-8 font-light flex items-center gap-2 overflow-hidden min-w-0 -mt-1"
        ~attrs:
          [ ("style",
             "color: var(--lx-gray-11); white-space: nowrap; text-overflow: ellipsis") ]
        ~text:h []

let item_row (st : S.t) (item_sig : S.item Signal.signal) : t =
  let pair = pair_sig st item_sig in
  Logseq_dom.dom ~key:"item-wrap"
    ~attrs_signal_v:
      (Signal.map
         (fun (it, _) ->
           Lui_protocol.StringValue (Logseq_dom.attrs_json (wrapper_attrs it)))
         pair)
    [ Logseq_dom.dom ~key:"item"
        ~style_class_signal:
          (Signal.map
             (fun (it, v) -> Lui_protocol.StringValue (row_class it v))
             pair)
        ~attrs_signal_v:
          (Signal.map
             (fun (it, v) ->
               Lui_protocol.StringValue
                 (Logseq_dom.attrs_json (row_data_attrs it v)))
             pair)
        [ dyn
            ~equal:(fun (a : S.item) b -> a.S.header = b.S.header)
            (fun it -> item_header it)
            item_sig
        ; Logseq_dom.dom ~key:"main" ~style_class:"flex items-start gap-3"
            [ Logseq_dom.dom ~key:"icon"
                ~style_class:"w-5 h-5 rounded flex items-center justify-center"
                []
            ; Logseq_dom.dom ~key:"txt"
                ~style_class:"flex flex-1 flex-col"
                [ Logseq_dom.dom ~key:"main-text"
                    ~style_class:
                      "cp__cmdk-item-main-text text-sm font-medium text-gray-12 flex items-center gap-2 flex-wrap"
                    [ dyn
                        ~equal:(fun (a : S.item) b -> a.S.ititle = b.S.ititle)
                        (fun (it : S.item) ->
                          Logseq_dom.dom ~key:"label" ~tag:"span"
                            ~attrs:[ ("data-testid", it.S.ititle) ]
                            ~text:it.S.ititle [])
                        item_sig
                    ; dyn
                        ~equal:(fun (a : S.item) b -> a.S.info = b.S.info)
                        (fun (it : S.item) ->
                          match it.S.info with
                          | None -> box ~key:"no-info" []
                          | Some info ->
                              Logseq_dom.dom ~key:"info" ~tag:"span"
                                ~style_class:"text-xs text-gray-11"
                                ~text:(" — " ^ info) [])
                        item_sig
                    ]
                ]
            ]
        ]
    ]

(* -- group ----------------------------------------------------------- *)

let group_wrapper_class (g : S.group) =
  match g.S.gid with
  | S.G_create -> "border-b border-gray-06 last:border-b-0"
  | _ -> "border-b border-gray-06 pb-1 last:border-b-0"

let gid_name = function
  | S.G_create -> "create"
  | S.G_nodes -> "nodes"
  | S.G_commands -> "commands"

let group_header () (g : S.group) : t =
  if g.S.gid = S.G_create then box ~key:"no-gheader" []
  else
    let count = if g.S.gtotal > 99 then "99+" else string_of_int g.S.gtotal in
    let can_toggle = g.S.gtotal > g.S.glimit || g.S.gexpanded in
    let label =
      if g.S.gexpanded then Ui_strings.t "ui/show-less"
      else Ui_strings.t "ui/show-more"
    in
    Logseq_dom.dom ~key:"gheader"
      ~style_class:
        "text-xs py-1.5 px-3 flex justify-between items-center gap-2 text-gray-11 bg-gray-02 h-8"
      [ Logseq_dom.dom ~key:"gtitle"
          ~style_class:"font-bold text-gray-11 pl-0.5 cursor-pointer select-none"
          ~attrs:[ ("data-cmdk-group", gid_name g.S.gid) ]
          ~text:g.S.gtitle []
      ; Logseq_dom.dom ~key:"gcount"
          ~style_class:"pl-1.5 text-gray-12 rounded-full"
          ~attrs:[ ("style", "font-size: 0.7rem") ]
          ~text:count []
      ; Logseq_dom.dom ~key:"gsp" ~style_class:"flex-1" []
      ; if can_toggle then
          Logseq_dom.dom ~key:"gmore" ~tag:"a"
            ~style_class:"text-link select-node opacity-50 hover:opacity-90"
            ~attrs:[ ("data-cmdk-group", gid_name g.S.gid) ]
            ~text:label []
        else box ~key:"gmore-none" []
      ]

let group_el (st : S.t) (group_sig : S.group Signal.signal) : t =
  let items_sig =
    Signal.map (fun (g : S.group) -> g.S.gitems) group_sig
  in
  Logseq_dom.dom ~key:"group"
    ~style_class_signal:
      (Signal.map
         (fun (g : S.group) ->
           Lui_protocol.StringValue (group_wrapper_class g))
         group_sig)
    [ dyn
        ~equal:(fun (a : S.group) (b : S.group) ->
          a.S.gtitle = b.S.gtitle && a.S.gtotal = b.S.gtotal
          && a.S.gexpanded = b.S.gexpanded)
        (fun g -> group_header () g)
        group_sig
    ; Logseq_dom.dom ~key:"results" ~style_class:"search-results"
        [ keyed ~source:items_sig ~key:(fun (it : S.item) -> it.S.ikey)
            ~cmp:Stdlib.compare
            ~mount:(fun item_sig -> item_row st item_sig)
        ]
    ]

(* -- palette body ---------------------------------------------------- *)

let groups_body st : t =
  let groups_sig =
    Signal.map (fun (v : S.view) -> v.S.groups) st.S.vs.Signal.state_signal
  in
  keyed ~source:groups_sig ~key:(fun (g : S.group) -> gid_name g.S.gid)
    ~cmp:Stdlib.compare
    ~mount:(fun group_sig -> group_el st group_sig)

let scroller st : t =
  let has_items_sig =
    Signal.map
      (fun (v : S.view) ->
        v.S.groups <> []
        && List.exists (fun (g : S.group) -> g.S.gitems <> []) v.S.groups)
      st.S.vs.Signal.state_signal
  in
  let input_sig =
    Signal.map (fun (v : S.view) -> v.S.input) st.S.vs.Signal.state_signal
  in
  Logseq_dom.dom ~key:"scroller" ~style_class:scroller_class
    ~attrs:
      [ ("style",
         "background: var(--lx-gray-02); scroll-padding-block: 32px") ]
    [ groups_body st
    ; dyn
        ~equal:(fun (a : string * bool) b -> a = b)
        (fun (q, has) ->
          if not has && q <> "" then
            Logseq_dom.dom ~key:"empty"
              ~style_class:"flex flex-col p-4 opacity-50"
              ~text:(Ui_strings.t "search/no-result") []
          else box ~key:"empty-none" [])
        (Signal.map2 (fun q has -> (q, has)) input_sig has_items_sig)
    ]

let input_row st : t =
  Logseq_dom.dom ~key:"input-row"
    ~style_class:"cp__cmdk-input-row bg-gray-02 border-b border-1 border-gray-07"
    [ Logseq_dom.dom ~key:"input" ~tag:"input"
        ~style_class:
          "cp__cmdk-search-input text-xl bg-transparent !border-none w-full !outline-none !shadow-none px-3 py-3"
        ~attrs_signal_v:
          (Signal.map
             (fun (v : S.view) ->
               Lui_protocol.StringValue
                 (Logseq_dom.attrs_json
                    [ ( "placeholder"
                      , if v.S.move_mode then
                          Ui_strings.t "cmdk.input/move-blocks-placeholder"
                        else Ui_strings.t "cmdk.input/default-placeholder" )
                    ; ("autocomplete", "off"); ("autocapitalize", "off") ]))
             st.S.vs.Signal.state_signal)
        ~events:"input"
        ~on_dom_event:(fun name payload ->
          Platform.console_log ("DBG dom-ev " ^ name);
          if name = "input" then (
            let q =
              Option.value
                (Option.bind payload (fun p ->
                     Dom_ext.payload_string p "value"))
                ~default:""
            in
            S.on_input st q))
        []
    ]

let hints : t =
  Logseq_dom.dom ~key:"hints" ~style_class:"hints"
    [ Logseq_dom.dom ~key:"hints-inner"
        ~style_class:"text-sm leading-6"
        [ Logseq_dom.dom ~key:"hints-row"
            ~style_class:"flex flex-row gap-1 items-center"
            [ Logseq_dom.dom ~key:"hint-label" ~tag:"span"
                ~style_class:"font-medium text-gray-12"
                ~text:(Ui_strings.t "cmdk.tip/label") []
            ]
        ]
    ]

let palette st : t =
  Logseq_dom.dom ~key:"cmdk"
    ~style_class:"cp__cmdk w-full h-full relative flex flex-col justify-start rounded-lg"
    ~attrs:[ ("data-keep-selection", "true") ]
    [ input_row st; scroller st; hints ]

(* -- delegated event listeners (installed once per mount) ------------ *)

let int_of_string_opt s =
  try Some (int_of_string s) with _ -> None

let handle_keydown st (ev : Dom_ext.event) =
  let v = S.get st in
  if v.S.open_ then
    match Dom_ext.key_ ev with
    | Some "Escape" ->
        if S.clear_or_close st then (
          Dom_ext.prevent_default ev;
          Dom_ext.stop_propagation ev)
    | Some "ArrowDown" ->
        Dom_ext.prevent_default ev;
        if Dom_ext.meta_key ev || Dom_ext.ctrl_key ev then
          Option.iter (fun gid -> S.toggle_expand st gid true) (S.hl_group st)
        else S.move_hl st 1
    | Some "ArrowUp" ->
        Dom_ext.prevent_default ev;
        if Dom_ext.meta_key ev || Dom_ext.ctrl_key ev then
          Option.iter (fun gid -> S.toggle_expand st gid false) (S.hl_group st)
        else S.move_hl st (-1)
    | Some "n" when Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        S.move_hl st 1
    | Some "p" when Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        S.move_hl st (-1)
    | Some "Enter" ->
        Dom_ext.prevent_default ev;
        Dom_ext.stop_propagation ev;
        S.run_highlighted st
    | Some "k" when Dom_ext.meta_key ev || Dom_ext.ctrl_key ev ->
        Dom_ext.prevent_default ev;
        Platform.console_log "DBG cmdk-close";
        S.close st
    | _ -> ()
  else
    match Dom_ext.key_ ev with
    | Some "k"
      when (Dom_ext.meta_key ev || Dom_ext.ctrl_key ev)
           && not (Dom_ext.shift_key ev || Dom_ext.alt_key ev) ->
        Dom_ext.prevent_default ev;
        Platform.console_log "DBG cmdk-open-key";
        S.open_palette st
    | _ -> ()

let handle_click st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el ->
      (match Dom_ext.closest el "#search-button" with
       | Some _ ->
           Platform.console_log "DBG cmdk-open-btn";
           S.open_palette st
       | None ->
           (* outside click closes: the (unstyled) LUI backdrop does not
              cover the page, so dismiss here too *)
           if (S.get st).S.open_
              && Dom_ext.closest el ".cp__cmdk__modal" = None
           then (
             Platform.console_log "DBG close-outside-click";
             S.close st));
      (match
         Dom_ext.closest el ".cp__cmdk [data-cmdk-group]"
       with
       | Some g -> (
           Dom_ext.prevent_default ev;
           match Dom_ext.get_attribute g "data-cmdk-group" with
           | Some "nodes" ->
               let v = S.get st in
               S.toggle_expand st S.G_nodes
                 (not (List.mem S.G_nodes v.S.expanded))
           | Some "commands" ->
               let v = S.get st in
               S.toggle_expand st S.G_commands
                 (not (List.mem S.G_commands v.S.expanded))
           | _ -> ())
       | None ->
           match Dom_ext.closest el ".cp__cmdk [data-item-index]" with
           | Some wrap -> (
               match
                 Option.bind
                   (Dom_ext.get_attribute wrap "data-item-index")
                   int_of_string_opt
               with
               | Some idx ->
                   (match S.item_at (S.get st) idx with
                    | Some it -> S.run_item st it
                    | None -> ())
               | None -> ())
           | None -> ())

let handle_mousemove st (ev : Dom_ext.event) =
  let v = S.get st in
  if v.S.open_ && (Dom_ext.movement_x ev <> 0.0 || Dom_ext.movement_y ev <> 0.0)
  then
    match Dom_ext.target ev with
    | Some el -> (
        match Dom_ext.closest el ".cp__cmdk" with
        | Some _ -> (
            let idx =
              Option.bind
                (Dom_ext.closest el ".cp__cmdk [data-item-index]")
                (fun wrap ->
                  Option.bind
                    (Dom_ext.get_attribute wrap "data-item-index")
                    int_of_string_opt)
            in
            match idx with
            | Some i when i <> v.S.hl -> S.set_hl st i true
            | Some _ -> S.set_hl st v.S.hl true
            | None -> ())
        | None -> ())
    | None -> ()

let install_count = ref 0

let install_listeners st =
  incr install_count;
  Platform.console_log ("DBG cmdk-install #" ^ string_of_int !install_count);
  Dom_ext.add_document_listener "keydown" (handle_keydown st) true;
  Dom_ext.add_document_listener "click" (handle_click st) true;
  Dom_ext.add_document_listener "mousemove" (handle_mousemove st) true

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler in
  install_listeners st;
  let open_sig =
    Signal.map (fun (v : S.view) -> v.S.open_) st.S.vs.Signal.state_signal
  in
  let body =
    box ~key:"cmdk_view"
      [ if_ ~test:open_sig
          (dialog ~key:"cmdk-dialog"
             ~text:(Ui_strings.t "cmdk.action/search")
             ~style_class:
               "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl fixed left-0 right-0 top-10 mx-auto overflow-hidden"
             ~on_dismiss:(fun _ ->
               Platform.console_log
                 ("DBG close-dismiss " ^ Dom_ext.debug_stack ());
               S.close st)
             [ palette st ])
      ]
  in
  body context parent
