(* Popup surfaces shared by web and native hosts.

   The public API stays imperative — show_menu / show_select /
   show_dialog / show_custom push entries onto the open stack — but
   every entry renders as a LUI popover/dialog through [layer], a view
   the chrome mounts inside .cp__overlays. Retained anchor targets leave
   geometry, collision and scroll tracking to the host. Outside-press
   and Escape dismissal ride the
   platform popup layers via ~on_dismiss (topmost layer only), and MSub
   menus nest a popover under their trigger node so the platform
   resolves the anchor/owner chain itself. *)

module U = Ui_services
module I = I18n
open Lui_elements

type menu_item =
  | MItem of string * (unit -> unit)
  | MCheck of string * bool * (bool -> unit)
  | MSub of string * menu_item list
  | MCustom of Lui_elements.t
  | MSep

type select_item =
  { si_label : string
  ; si_value : string
  ; si_extra : Wire.t option
  }

(* p_key starts as a no-op; each entry's mount installs its document
   keydown through [register_key] so the handler can close over the
   signals the mount created. *)
type popup =
  { p_id : int
  ; p_view : t
  ; p_key : (U.ev -> unit) ref
  }

let open_popups : popup list ref = ref []
let stack_st : popup list Signal.state option ref = ref None
let open_st : bool Signal.state option ref = ref None
let listeners_installed = ref false
let next_id = ref 0
let noop (_ : U.ev) = ()

let publish () =
  (match !open_st with
   | Some st -> Signal.set st (!open_popups <> [])
   | None -> ());
  (match !stack_st with
  | Some st -> Signal.set st !open_popups
  | None -> ());
  Runtime.flush ()

let ensure_open_st sched =
  match !open_st with
  | Some st -> st
  | None ->
      let st = Signal.state sched (!open_popups <> []) in
      open_st := Some st;
      st

let open_signal sched = Signal.value ((ensure_open_st sched))

let close_entry id =
  open_popups := List.filter (fun e -> e.p_id <> id) !open_popups;
  publish ()

let close_top () =
  match List.rev !open_popups with
  | [] -> ()
  | _ :: rest ->
      open_popups := List.rev rest;
      publish ()

let close_all () =
  if !open_popups <> [] then begin
    open_popups := [];
    publish ()
  end

(* capture-phase document keydown feeds only the TOP entry (nested
   submenus delegate inside it). Escape and outside-press are owned by
   each popover's own ~on_dismiss. *)
let on_doc_keydown (ev : U.ev) =
  match List.rev !open_popups with
  | top :: _ -> !(top.p_key) ev
  | [] -> ()

let ensure_listeners () =
  if not !listeners_installed then begin
    listeners_installed := true;
    U.dom_on_document_event ~capture:true "keydown" on_doc_keydown
  end

let push view =
  ensure_listeners ();
  incr next_id;
  let id = !next_id in
  open_popups
    := !open_popups @ [ { p_id = id; p_view = view; p_key = ref noop } ];
  publish ();
  id

let register_key id f =
  match List.find_opt (fun e -> e.p_id = id) !open_popups with
  | Some e -> e.p_key := f
  | None -> ()

(* ---------- retained anchor placement ---------- *)

let anchor_identifier (anchor : U.el) =
  match anchor.U.attr "id" with
  | Some identifier when identifier <> "" -> identifier
  | _ -> invalid_arg "Popup anchors require a retained accessibility identifier"

(* A caller-anchored popover positioned by the host.
   [card] paints the .ui__dropdown-menu-content card chrome as props
   (menu surfaces); select/custom popups keep caller-driven classes. *)
type popup_anchor = Target of string | Rectangle of (float * float * float * float)

let anchored_popover ~key ~id ~anchor ~align_end ~cls ~card ?role ~on_dismiss children : t =
  let anchor_target, anchor_rect, alignment = match anchor with
    | Target target -> Some target, None, (if align_end then `end_ else `start)
    | Rectangle rect -> None, Some rect, `center in
  Ui_components.with_props
    (if card then [ Ui_components.card_shadow ] else [])
    (popover ~key ?role ~accessibility_identifier:id
       ~transition:Ui_components.popover_transition
       ~anchor:`below ?anchor_target ?anchor_rect ~anchor_offset:0.
       ~anchor_alignment:alignment
       ?background:(if card then Some "hsl(var(--popover))" else None)
       ?foreground:(if card then Some "inherit" else None)
       ?border_color:(if card then Some "hsl(var(--border))" else None)
       ?border_width:(if card then Some 1 else None)
       ?corner_radius:(if card then Some 6 else None)
       ?min_width:(if card then Some 128 else None)
       ?padding:(if card then Some 4 else None)
       ~data_attrs:[ ("data-keep-selection", ""); ("tabindex", "-1") ]
       ~style_class:cls ~on_dismiss children)

(* ---------- menus ---------- *)

let item_rid scope fidx = Printf.sprintf "%s-i%d" scope fidx
let sub_rid scope fidx = Printf.sprintf "%s-s%d" scope fidx

(* one menu level's state — the highlighted focusable row, the open
   sub-trigger, and per-checkbox values. A single state so every row's
   reactive attrs derive from the same source. *)
type menu_state =
  { mf : int
  ; msub : int
  ; sub_focus : bool
  ; mcheck : (int * bool) list
  }

let checked_of (st : menu_state) fidx =
  match List.assoc_opt fidx st.mcheck with
  | Some v -> v
  | None -> false

let is_sub it = match it with MSub _ -> true | _ -> false

(* one menu level — MSub recurses into this for its sub-content. The
   level registers its own keydown handler; while a sub is open the
   parent handler delegates into the sub's (registered under its
   focusable index) so arrows/enter always hit the deepest menu. *)
let rec menu_level_scoped ~scope ~cls ~register ~on_back (items : menu_item list) : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let mst = Signal.state sched { mf = -1; msub = -1; sub_focus = false; mcheck = [] } in
  let msig = (Signal.value (mst)) in
  let sub_keys : (int, U.ev -> unit) Hashtbl.t = Hashtbl.create 4 in
  let counter = ref 0 in
  let entries =
    List.map
      (fun it ->
        match it with
        | MSep | MCustom _ -> (it, -1)
        | _ ->
            let i = !counter in
            incr counter;
            (it, i))
      items
  in
  let nfocus = !counter in
  let upd f = Signal.update mst f in
  let focus_row i =
    upd (fun st -> { st with mf = i });
    match U.dom_by_id (item_rid scope i) with
    | Some el -> el.U.focus ()
    | None -> ()
  in
  let focus_sub i =
    match U.dom_by_id (item_rid (sub_rid scope i) 0) with
    | Some el -> el.U.focus ()
    | None -> ()
  in
  let enter_sub ~focus i =
    let mounted = (Signal.get_state mst).msub = i in
    upd (fun st -> { st with mf = i; msub = i; sub_focus = focus });
    if mounted && focus then focus_sub i
  in
  let key (ev : U.ev) =
    match ev.U.key with
    | Some
        (( "Home" | "End" | "ArrowDown" | "ArrowUp" | "ArrowRight" | "Enter"
         | " " | "ArrowLeft" ) as k) -> (
        let st = Signal.get_state mst in
        match st.msub >= 0 && Hashtbl.mem sub_keys st.msub, ev.U.target with
        | true, _ -> (Hashtbl.find sub_keys st.msub) ev
        | _, Some t when t.U.editable () -> ()
        | _ when nfocus = 0 -> ()
        | _ -> (
            let current = match ev.U.target with
              | Some target -> List.find_map (fun (_, i) ->
                  if i >= 0 && target.U.attr "id" = Some (item_rid scope i)
                  then Some i else None) entries
              | None -> None in
            let focused = match current with Some i -> i | None -> st.mf in
            ev.U.prevent_default ();
            (match k with
            | "Home" -> focus_row 0
            | "End" -> focus_row (nfocus - 1)
            | "ArrowDown" ->
                focus_row (if focused < 0 then 0 else (focused + 1) mod nfocus)
            | "ArrowUp" ->
                focus_row (if focused <= 0 then nfocus - 1 else focused - 1)
            | "ArrowLeft" -> Option.iter (fun back -> back ()) on_back
            | "ArrowRight" ->
                if
                  List.exists (fun (it, i) -> i = focused && is_sub it) entries
                then enter_sub ~focus:true focused
            | _ -> (
                if List.exists (fun (it, i) -> i = focused && is_sub it) entries
                then enter_sub ~focus:true focused
                else match U.dom_by_id (item_rid scope focused) with
                  | Some el -> el.U.click ()
                  | None -> ()));
            Runtime.flush ()))
    | _ -> ()
  in
  register key;
  let row_attrs ~fidx ~role =
    map
      (fun (st : menu_state) ->
        [ ("role", role); ("tabindex", if st.mf = fidx then "0" else "-1") ]
        @ (if st.mf = fidx then [ ("data-highlighted", "") ] else [])
        @ (if st.msub = fidx then [ ("aria-expanded", "true") ] else [])
        @
        (match List.assoc_opt fidx st.mcheck with
         | Some c -> [ ("aria-checked", if c then "true" else "false") ]
         | None -> []))
      msig
  in
  (* hover highlight goes through the same state as keyboard focus so
     both paint data-highlighted/.chosen identically on every host *)
  let cls_of base fidx elem =
    Ui_parts.class_signal msig
      (fun (st : menu_state) ->
        cls ^ base ^ if st.mf = fidx then " chosen" else "")
      (Menu_item.chrome elem)
  in
  let view_of ((it, fidx) : menu_item * int) : t =
    match it with
    | MSep ->
        (* ls-property-dropdown ruleset gives separators 0.5rem 0 instead
           of the dropdown's default 0.25rem -0.25rem *)
        if String.starts_with ~prefix:"ls-property-dropdown" cls then
          Menu_item.separator ~key:(Printf.sprintf "%s-sep-%d" scope fidx)
            ~mv:8 ~mh:0
        else
          Menu_item.separator ~key:(Printf.sprintf "%s-sep-%d" scope fidx)
            ~mv:4 ~mh:(-4)
    | MCustom el -> el
    | MItem (label, on) ->
        cls_of "ui__dropdown-menu-item" fidx
          (menu_item ~key:(item_rid scope fidx)
             ~accessibility_identifier:(item_rid scope fidx)
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitem")
             ~on_press:(fun _ ->
               close_all ();
               on ())
             ~on_pointer_enter:(fun _ -> upd (fun st -> { st with mf = fidx }))
             ~text:label [])
    | MCheck (label, init, on) ->
        upd (fun st -> { st with mcheck = (fidx, init) :: st.mcheck });
        cls_of "ui__dropdown-menu-checkbox-item" fidx
          (menu_item ~key:(item_rid scope fidx)
             ~accessibility_identifier:(item_rid scope fidx)
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitemcheckbox")
             ~selection_placement:`leading ~gap:8
             ~padding_horizontal:8 ~padding_vertical:6 ~corner_radius:4
             ~checked_signal:(map (fun st -> checked_of st fidx) msig)
             ~on_press:(fun _ ->
               let v = not (checked_of (Signal.get_state mst) fidx) in
               upd (fun st ->
                   { st with
                     mcheck =
                       (fidx, v) :: List.remove_assoc fidx st.mcheck
                   });
               on v)
             ~on_pointer_enter:(fun _ -> upd (fun st -> { st with mf = fidx }))
             ~text:label [])
    | MSub (label, children) ->
        cls_of "ui__dropdown-menu-sub-trigger" fidx
          (Ui_components.with_props [Ui_components.Prop.accessibility_label label]
          (menu_item ~key:(item_rid scope fidx)
             ~accessibility_identifier:(item_rid scope fidx)
             ~gap:0
             ~padding_horizontal:8 ~padding_vertical:6 ~corner_radius:4
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitem")
             ~on_press:(fun _ -> enter_sub ~focus:false fidx)
             ~on_pointer_enter:(fun _ -> enter_sub ~focus:false fidx)
             [ Menu_item.submenu_content ~label
             ; if_
                 ~test:(map (fun st -> st.msub = fidx) msig)
                 (Ui_components.with_props [ Ui_components.sub_card_shadow ]
                    (popover ~key:(sub_rid scope fidx)
                       ~transition:Ui_components.popover_transition
                       ~accessibility_identifier:(sub_rid scope fidx)
                       ~on_appear:(fun _ ->
                         let state = Signal.get_state mst in
                         if state.msub = fidx && state.sub_focus then focus_sub fidx)
                       ~anchor:`right ~anchor_alignment:`start
                       ~anchor_offset:(-4.) ~role:`menu ~min_width:128
                       ~padding:4 ~background:"hsl(var(--popover))"
                       ~border_color:"hsl(var(--border))" ~border_width:1
                       ~corner_radius:6
                       ~style_class:(cls ^ "ui__dropdown-menu-sub-content")
                       ~data_attrs:
                         [ ("data-keep-selection", ""); ("tabindex", "-1") ]
                       ~on_dismiss:(fun _ -> upd (fun st -> { st with msub = -1 }))
                       [ menu_level_scoped ~scope:(sub_rid scope fidx) ~cls
                           ~register:(fun h -> Hashtbl.replace sub_keys fidx h)
                           ~on_back:(Some (fun () ->
                             upd (fun st -> { st with msub = -1 });
                             focus_row fidx))
                           children ])) ]))
  in
  box ~key:(scope ^ "-items") (List.map view_of entries)
    context parent

let menu_level ~pid ~cls ~register items =
  menu_level_scoped ~scope:(Printf.sprintf "vp%d" pid) ~cls ~register ~on_back:None items

let show_menu ~(anchor : U.el) ?(align_end = false) ?(cls_prefix = "")
    items =
  let anchor_target = anchor_identifier anchor in
  close_all ();
  let id = !next_id + 1 in
  ignore
    (push
       (fun context parent ->
         anchored_popover ~key:(Printf.sprintf "vp-menu-%d" id) ~role:`menu
           ~id:(Printf.sprintf "vp-menu-%d" id) ~anchor:(Target anchor_target) ~align_end ~card:true
           ~cls:(cls_prefix ^ "ui__dropdown-menu-content")
           ~on_dismiss:(fun _ -> close_entry id)
           [ menu_level ~pid:id ~cls:cls_prefix
               ~register:(register_key id) items ]
           context parent))

(* ---------- select-style search popup ---------- *)

let fixed_items items context =
  Signal.constant context.Lui_ui.ui_scheduler items

let show_custom_rect ~rect ~cls content =
  close_all ();
  let id = !next_id + 1 in
  ignore (push (anchored_popover ~key:(Printf.sprintf "vp-c-%d" id)
    ~id:(Printf.sprintf "vp-c-%d" id) ~anchor:(Rectangle rect)
    ~align_end:false ~cls ~card:true ~on_dismiss:(fun _ -> close_entry id) [content]))

let show_select ~(anchor : U.el) ~items ~placeholder ?(multiple = false)
    ?(selected_values = [])
    ?(input_padding_horizontal = 8)
    ?on_apply ?(extra : (unit -> t option) option)
    ?(wrap_cls = "") ?(align_end = false) ?(footer = [])
    ?(custom_content = fun _ -> None) ~on_chosen () =
  let anchor_target = anchor_identifier anchor in
  close_all ();
  let id = !next_id + 1 in
  let view context parent =
    let sched = context.Lui_ui.ui_scheduler in
    let source = items context in
    let query = Signal.state sched "" in
    let chosen = Signal.state sched 0 in
    let sel_values = Signal.state sched selected_values in
    let qsig = Signal.value (query)
    and csig = Signal.value (chosen)
    and ssig = (Signal.value (sel_values)) in
    let filter q choices =
      if q = "" then choices
      else List.filter (fun it -> Fuzzy.score q it.si_label > 0.) choices
    in
    let filtered = Logseq_el.own context (Signal.map2 filter qsig source) in
    let bounded count picked = max 0 (min picked (count - 1)) in
    let measurement = Ui_effect.request () in
    let content_id i = Printf.sprintf "ac-content-%d-%d" id i in
    let input_id = Printf.sprintf "vpsel-i%d" id in
    let choose i it =
      let ticket = Ui_effect.issue measurement in
      if multiple then begin
        let sel = Signal.get_state sel_values in
        let now = List.mem it.si_value sel in
        let selected=if now then List.filter (fun v -> v <> it.si_value) sel
          else it.si_value :: sel in
        Signal.set sel_values selected;
        on_chosen it (not now)
          (List.filter (fun choice -> List.mem choice.si_value selected) (Signal.get source));
        if List.exists (fun popup -> popup.p_id=id) !open_popups then
          Option.iter (fun input -> input.U.focus ()) (U.dom_by_id input_id)
      end
      else match custom_content it with
      | None -> close_all (); on_chosen it true [it]
      | Some (cls, content) ->
          Ui_effect.task ~scope:context.Lui_ui.ui_scope (U.dom_measure_rect (content_id i))
            ~ok:(fun rect ->
              if Ui_effect.is_current measurement ticket
                 && List.exists (fun popup -> popup.p_id=id) !open_popups then
                show_custom_rect ~rect ~cls content)
            ~error:raise
    in
    let navigate direction =
      let count = List.length (Signal.get filtered) in
      if count > 0 then
        Signal.set chosen (bounded count (bounded count (Signal.get_state chosen) + direction))
    in
    let submit () =
      let visible = Signal.get filtered in
      let i = bounded (List.length visible) (Signal.get_state chosen) in
      match List.nth_opt visible i with
      | Some it -> choose i it
      | None -> ()
    in
    let row count i (it : select_item) =
      Ui_components.with_props
        [ Ui_components.Prop.font_size "14px"
        ; Ui_components.Prop.line_height "20px"
        ; Ui_components.Prop.hover_background "var(--lx-select-active-bg)"
        ; Ui_components.Prop.selected_background "var(--lx-select-active-bg)" ]
        (Ui_parts.string_prop Lui_protocol.AccessibilityLabel ~value:it.si_label
        (list_item ~key:("ac-" ^ string_of_int i)
           ~accessibility_identifier:("ac-" ^ string_of_int i)
           ~style_class:"ls-view-select-option"
           ~height:32 ~min_height:32 ~padding_vertical:6 ~padding_horizontal:8
           ~corner_radius:4
           ~foreground:(reactive (fun picked ->
             if i = bounded count picked then "var(--ls-secondary-text-color)"
             else "hsl(var(--popover-foreground) / 0.75)") csig)
           ~selected:(reactive (fun picked -> i = bounded count picked) csig)
           ~on_pointer_enter:(fun _ -> Signal.set chosen i)
           ~on_press:(fun _ -> choose i it)
           [ row ~accessibility_identifier:(content_id i) ~gap:4 ~cross:`center ~grow:1. ~min_width:0
             ((if multiple then
               [ Ui_components.checkbox ~key:"checked" ~width:16 ~height:16 ~label:it.si_label
                   ~checked:(reactive (fun sel -> List.mem it.si_value sel) ssig)
                   ~on_toggle:(fun _ -> choose i it) [] ]
             else [])
            @ [ text ~key:"label" ~value:it.si_label ~grow:1. ~min_width:0 [] ]) ]))
    in
    let results =
      reactive (fun visible ->
        if visible = [] then
          if multiple then spacer ~height:0 []
          else text ~style_class:"ls-ac-empty" ~value:(I.t "search/no-result")
            ~padding_vertical:6 ~padding_horizontal:8 []
        else
          list ~accessibility_identifier:"ui__ac-inner"
            ~style_class:"cp__select-results"
            ~height:(min 280 (32 * List.length visible))
            ~scroll_target:(reactive (fun picked ->
              "ac-" ^ string_of_int (bounded (List.length visible) picked)) csig)
            ~scroll_token_signal:csig ~scroll_anchor:`nearest
            (List.mapi (row (List.length visible)) visible)) filtered
    in
    let select_col =
      Ui_components.with_props
        [ Ui_components.Prop.max_height_viewport 0.75
        ; Ui_components.Prop.font_size "14px"
        ; Ui_components.Prop.line_height "20px" ]
        (column ~key:("vpsel-" ^ string_of_int id)
           ~style_class:"cp__select cp__select-main" ~width:224 ~cross:`stretch
           ([ Ui_components.with_props
                [ Ui_components.Prop.font_size "16px"
                ; Ui_components.Prop.line_height "24px"
                ; Ui_components.Prop.focus_shadow "none" ]
                (Ui_components.input ~key:input_id ~accessibility_identifier:input_id
                   ~style_class:"cp__select-input" ~placeholder
                   ~text:(reactive Fun.id qsig)
                   ~autofocus:true ~height:32
                   ~padding_horizontal:input_padding_horizontal ~padding_vertical:4
                   ~background:"transparent" ~border_width:0 ~corner_radius:0
                   ~foreground:"var(--ls-secondary-text-color)"
                   ~on_input:(function
                     | Lui_protocol.TextChanged (_, v) ->
                         Signal.set query v;
                         Signal.set chosen 0
                     | _ -> ())
                   ~on_navigate:(function
                     | Lui_protocol.NavigatePrevious _ -> navigate (-1)
                     | Lui_protocol.NavigateNext _ -> navigate 1
                     | _ -> ())
                   ~on_submit:(fun _ -> submit ()) [])
            ; column ~padding_vertical:4 ~cross:`stretch [ results ] ]
            @ (match multiple,on_apply with
              | true,Some apply ->
              [ column ~style_class:"cp__select-apply" ~padding:16
                  [ Ui_components.button ~variant:`outline
                      ~key:("vpsel-a-" ^ string_of_int id) ~text:(I.t "ui/apply")
                      ~padding_vertical:8 ~padding_horizontal:16
                      ~on_press:(fun _ ->
                        close_all ();
                        apply (Signal.get_state sel_values)) [] ] ]
              | _ -> [])
            @ (if footer=[] then [] else [column ~gap:4 ~margin_top:4 footer])))
    in
    let wrap =
      if wrap_cls = "" then select_col
      else
        column ~key:("vpsel-w" ^ string_of_int id) ~style_class:wrap_cls
          ((match extra with
            | Some f -> (match f () with Some e -> [ e ] | None -> [])
            | None -> [])
           @ [ select_col ])
    in
    anchored_popover ~key:("vpsel-p" ^ string_of_int id) ~role:`menu
      ~id:("vpsel-p" ^ string_of_int id) ~anchor:(Target anchor_target) ~align_end ~card:true
      ~cls:("ui__dropdown-menu-content " ^ wrap_cls)
      ~on_dismiss:(fun _ -> close_entry id)
      [ wrap ] context parent
  in
  ignore (push view)

(* ---------- confirm dialog ---------- *)

let show_dialog ~headline ~(body : t list) ~on_confirm ?(confirm_label = (I.t "ui/yes"))
    () =
  let id = !next_id + 1 in
  let view context parent =
    let compact =
      Ui_components.with_props
        [
          Ui_components.Prop.height 28;
          Ui_components.Prop.padding_vertical 4;
          Ui_components.Prop.padding_horizontal 12;
        ]
    in
    dialog
      ~key:(Printf.sprintf "vp-dlg-%d" id)
      ~accessibility_identifier:(Printf.sprintf "vp-dlg-%d" id)
      ~style_class:"ls-dialog-generic" ~max_width:768 ~padding:24
      ~data_attrs:[ ("role", "dialog"); ("aria-modal", "true") ]
      ~on_dismiss:(fun _ -> close_entry id)
      [
        column ~gap:0
          ([
             row ~key:"head" ~style_class:"ls-dialog-head" ~cross:`center
               ~gap:16
               [
                 row ~style_class:"ls-dialog-head-icon" ~cross:`center
                   ~main:`center ~width:40 ~height:40 ~corner_radius:9999
                   ~background:"var(--lx-red-03, rgb(220 60 70 / 0.15))"
                   [
                     icon ~key:"ic" ~name:(`app "alert-triangle") ~point_size:18
                       ~foreground:"var(--lx-red-10, hsl(var(--destructive)))"
                       [];
                   ];
                 heading ~level:3 ~accessibility_identifier:"modal-headline"
                   ~style_class:"ls-dialog-headline" ~grow:1. ~min_width:0
                   ~font_size:"18px" ~font_weight:500 ~line_height:"24px"
                   ~white_space:"normal" ~value:headline [];
               ];
           ]
          @ body
          @ [
              row ~key:"footer" ~style_class:"ls-dialog-footer" ~main:`end_
                ~gap:16 ~margin_top:24
                [
                  compact
                    (Ui_components.button ~key:"cancel" ~size:`sm
                       ~variant:`outline ~text:(I.t "ui/cancel") ~on_press:(fun _ ->
                         close_entry id) []);
                  compact
                    (Ui_components.button ~key:"confirm" ~size:`sm
                       ~variant:`primary ~text:confirm_label
                       ~on_press:(fun _ ->
                         close_entry id;
                         on_confirm ()) []);
                ];
            ]);
        Ui_components.dialog_close ~key:"close" ~label:(I.t "ui/close")
          ~on_press:(fun _ -> close_entry id);
      ]
      context parent
  in
  push view

(* ---------- custom caller-supplied content ---------- *)

(* escape hatch for callers that own their own content (filter pickers,
   rename boxes): renders [content] inside a caller-anchored popover so
   placement/dismissal stay consistent with the menu path. *)
let show_custom ~(anchor : U.el) ?(align_end = false) ~cls (content : t) =
  let anchor_target = anchor_identifier anchor in
  close_all ();
  let id = !next_id + 1 in
  ignore
    (push
       (fun context parent ->
         anchored_popover ~key:(Printf.sprintf "vp-c-%d" id)
           ~id:(Printf.sprintf "vp-c-%d" id) ~anchor:(Target anchor_target) ~align_end ~cls ~card:true
           ~on_dismiss:(fun _ -> close_entry id)
           [ content ] context parent))

(* ---------- the mounted stack ----------

   Mounted inside .cp__overlays by both chromes; renders each open
   entry's view. keyed keeps one stable subtree per popup id so a
   sibling opening/closing never remounts an open menu's state. *)
let layer : t =
 fun context parent ->
  let st =
    match !stack_st with
    | Some s -> s
    | None ->
        let s = Signal.state context.Lui_ui.ui_scheduler !open_popups in
        stack_st := Some s;
        s
  in
  keyed ~source:(Signal.value (st)) ~key:(fun p -> p.p_id)
    ~cmp:Int.compare ~mount:(fun p_s -> (get p_s).p_view)
    context parent
