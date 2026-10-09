(* Popup surfaces shared by web and native hosts.

   The public API stays imperative — show_menu / show_select /
   show_dialog / show_custom push entries onto the open stack — but
   every entry renders as a LUI popover/dialog through [layer], a view
   the chrome mounts inside .cp__overlays. Anchor placement computes the
   same below-or-above/align-end point the DOM twin did (the popover
   kind takes ~at points; the flip/end alignment ride a translate in a
   style data-attr), outside-press and Escape dismissal ride the
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
  match !stack_st with
  | Some st -> Signal.set st !open_popups
  | None -> ()

let ensure_open_st sched =
  match !open_st with
  | Some st -> st
  | None ->
      let st = Signal.state sched (!open_popups <> []) in
      open_st := Some st;
      st

let open_signal sched = (ensure_open_st sched).Signal.state_signal

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

(* ---------- anchored placement ----------

   The DOM twin measured anchor rects and wrote fixed left/top itself;
   the popover kind takes an ~at point instead, so the same math now
   produces a point plus a translate style for the open-above /
   align-end flips. Native rects resolve asynchronously (the host
   measure can still read 0 when the popup mounts), so placement is a
   signal with the same 32ms x4 retry the twin had. *)

type placement =
  { px : float
  ; py : float
  ; p_above : bool
  ; p_end : bool
  }

let placement_state sched (anchor : U.el) ~align_end =
  let st =
    Signal.state sched { px = 0.; py = 0.; p_above = false; p_end = false }
  in
  let rec place n =
    let x, y, w, h = anchor.U.rect () in
    if x = 0. && y = 0. && w = 0. && h = 0. then begin
      if n > 0 then U.timers_later ~ms:32 (fun () -> place (n - 1))
    end
    else begin
      let vh = U.dom_viewport_height () in
      let below = vh -. (y +. h) in
      let open_above = below < 280. && y > below in
      Signal.set st
        { px = (if align_end then x +. w else x)
        ; py = (if open_above then y -. 4. else y +. h +. 4.)
        ; p_above = open_above
        ; p_end = align_end
        }
    end
  in
  place 4;
  st

let placement_style pl =
  match pl.p_above, pl.p_end with
  | true, true -> "transform:translate(-100%,-100%)"
  | true, false -> "transform:translateY(-100%)"
  | false, true -> "transform:translateX(-100%)"
  | false, false -> ""

(* a caller-anchored popover positioned by the placement signal *)
let anchored_popover ~key ~id ~place ~cls ~on_dismiss children : t =
  popover ~key ~role:`menu ~accessibility_identifier:id
    ~at_signal:
      (map (fun (pl : placement) -> (pl.px, pl.py))
         place.Signal.state_signal)
    ~data_attrs_signal:
      (map
         (fun (pl : placement) ->
           (if placement_style pl = "" then []
            else [ ("style", placement_style pl) ])
           @ [ ("data-keep-selection", ""); ("tabindex", "-1") ])
         place.Signal.state_signal)
    ~style_class:cls ~on_dismiss children

(* ---------- menus ---------- *)

let item_rid pid fidx = Printf.sprintf "vp%d-i%d" pid fidx
let sub_rid pid fidx = Printf.sprintf "vp%d-s%d" pid fidx

(* one menu level's state — the highlighted focusable row, the open
   sub-trigger, and per-checkbox values. A single state so every row's
   reactive attrs derive from the same source. *)
type menu_state =
  { mf : int
  ; msub : int
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
let rec menu_level ~pid ~cls ~register (items : menu_item list) : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let mst = Signal.state sched { mf = 0; msub = -1; mcheck = [] } in
  let msig = mst.Signal.state_signal in
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
    match U.dom_by_id (item_rid pid i) with
    | Some el -> el.U.focus ()
    | None -> ()
  in
  let enter_sub i =
    upd (fun st -> { st with mf = i; msub = i });
    (* the sub popover mounts this tick — focus its first item once the
       platform has rendered it *)
    U.timers_later ~ms:32 (fun () ->
        match U.dom_query ("#" ^ sub_rid pid i ^ " [role=menuitem]") with
        | Some el -> el.U.focus ()
        | None -> ())
  in
  let key (ev : U.ev) =
    match ev.U.key with
    | Some
        (( "Home" | "End" | "ArrowDown" | "ArrowUp" | "ArrowRight" | "Enter"
         | " " | "ArrowLeft" ) as k) -> (
        let st = Signal.get_state mst in
        match st.msub >= 0 && Hashtbl.mem sub_keys st.msub, ev.U.target with
        | true, _ when k = "ArrowLeft" ->
            ev.U.prevent_default ();
            let trigger = st.msub in
            upd (fun st -> { st with msub = -1 });
            focus_row trigger
        | true, _ -> (Hashtbl.find sub_keys st.msub) ev
        | _, Some t when t.U.editable () -> ()
        | _ when nfocus = 0 -> ()
        | _ -> (
            ev.U.prevent_default ();
            match k with
            | "Home" -> focus_row 0
            | "End" -> focus_row (nfocus - 1)
            | "ArrowDown" ->
                focus_row (if st.mf < 0 then 0 else (st.mf + 1) mod nfocus)
            | "ArrowUp" ->
                focus_row (if st.mf <= 0 then nfocus - 1 else st.mf - 1)
            | "ArrowLeft" -> ()
            | "ArrowRight" ->
                if
                  List.exists (fun (it, i) -> i = st.mf && is_sub it) entries
                then enter_sub st.mf
            | _ -> (
                match U.dom_by_id (item_rid pid st.mf) with
                | Some el -> el.U.click ()
                | None -> ())))
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
      elem
  in
  let view_of ((it, fidx) : menu_item * int) : t =
    match it with
    | MSep -> Menu_item.separator ~key:(Printf.sprintf "vp%d-sep-%d" pid fidx)
    | MCustom el -> el
    | MItem (label, on) ->
        cls_of "ui__dropdown-menu-item" fidx
          (menu_item ~key:(item_rid pid fidx)
             ~accessibility_identifier:(item_rid pid fidx)
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitem")
             ~on_press:(fun _ ->
               close_all ();
               on ())
             ~on_pointer_enter:(fun _ -> upd (fun st -> { st with mf = fidx }))
             ~text:label [])
    | MCheck (label, init, on) ->
        upd (fun st -> { st with mcheck = (fidx, init) :: st.mcheck });
        cls_of "ui__dropdown-menu-checkbox-item" fidx
          (menu_item ~key:(item_rid pid fidx)
             ~accessibility_identifier:(item_rid pid fidx)
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitemcheckbox")
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
          (menu_item ~key:(item_rid pid fidx)
             ~accessibility_identifier:(item_rid pid fidx)
             ~data_attrs_signal:(row_attrs ~fidx ~role:"menuitem")
             ~on_press:(fun _ -> enter_sub fidx)
             ~on_pointer_enter:(fun _ -> enter_sub fidx)
             ~text:label
             [ icon ~key:"chev" ~name:`chevron_right []
             ; if_
                 ~test:(map (fun st -> st.msub = fidx) msig)
                 (popover ~key:(sub_rid pid fidx)
                    ~accessibility_identifier:(sub_rid pid fidx)
                    ~anchor:`right ~anchor_alignment:`start
                    ~anchor_offset:(-4.) ~role:`menu
                    ~style_class:(cls ^ "ui__dropdown-menu-sub-content")
                    ~data_attrs:
                      [ ("data-keep-selection", ""); ("tabindex", "-1") ]
                    ~on_dismiss:(fun _ -> upd (fun st -> { st with msub = -1 }))
                    [ menu_level ~pid ~cls
                        ~register:(fun h -> Hashtbl.replace sub_keys fidx h)
                        children ]) ])
  in
  box ~key:(Printf.sprintf "vp%d-items" pid) (List.map view_of entries)
    context parent

let show_menu ~(anchor : U.el) ?(align_end = false) ?(cls_prefix = "")
    items =
  close_all ();
  let id = !next_id + 1 in
  ignore
    (push
       (fun context parent ->
         let place = placement_state context.Lui_ui.ui_scheduler anchor
             ~align_end in
         anchored_popover ~key:(Printf.sprintf "vp-menu-%d" id)
           ~id:(Printf.sprintf "vp-menu-%d" id) ~place
           ~cls:(cls_prefix ^ "ui__dropdown-menu-content")
           ~on_dismiss:(fun _ -> close_entry id)
           [ menu_level ~pid:id ~cls:cls_prefix
               ~register:(register_key id) items ]
           context parent))

(* ---------- select-style search popup ---------- *)

let show_select ~(anchor : U.el) ~items ~placeholder ?(multiple = false)
    ?(on_apply = fun _ -> ()) ?(extra : (unit -> t option) option)
    ?(wrap_cls = "") ?(align_end = false) ~on_chosen () =
  close_all ();
  let id = !next_id + 1 in
  let view context parent =
    let sched = context.Lui_ui.ui_scheduler in
    let place = placement_state sched anchor ~align_end in
    let query = Signal.state sched "" in
    let chosen = Signal.state sched 0 in
    let sel_values = Signal.state sched [] in
    let qsig = query.Signal.state_signal
    and csig = chosen.Signal.state_signal
    and ssig = sel_values.Signal.state_signal in
    let filtered q =
      if q = "" then items
      else List.filter (fun it -> Fuzzy.score q it.si_label > 0.) items
    in
    let choose it =
      if multiple then begin
        let sel = Signal.get_state sel_values in
        let now = List.mem it.si_value sel in
        Signal.set sel_values
          (if now then List.filter (fun v -> v <> it.si_value) sel
           else it.si_value :: sel);
        on_chosen it (not now)
      end
      else begin
        close_all ();
        on_chosen it true
      end
    in
    register_key id (fun (ev : U.ev) ->
        match ev.U.key with
        | Some "ArrowDown" ->
            ev.U.prevent_default ();
            let n = List.length (filtered (Signal.get_state query)) in
            Signal.set chosen (min (Signal.get_state chosen + 1) (n - 1))
        | Some "ArrowUp" ->
            ev.U.prevent_default ();
            Signal.set chosen (max (Signal.get_state chosen - 1) 0)
        | Some "Enter" ->
            ev.U.prevent_default ();
            (match
               List.nth_opt (filtered (Signal.get_state query))
                 (Signal.get_state chosen)
             with
             | Some it -> choose it
             | None -> ())
        | _ -> ());
    (* verbatim <a class="menu-link"> rows — the e2e/cljs contract wants
       the anchor tag, ac-N ids and the chosen class *)
    let row i (it : select_item) picked sel =
      Logseq_el.el ~key:("acw-" ^ string_of_int i)
        ~attrs:[ ("class", "menu-link-wrap") ]
        [ Logseq_el.el ~tag:"a" ~id:("ac-" ^ string_of_int i)
            ~attrs:
              [ ("class", if i = picked then "menu-link chosen" else "menu-link")
              ; ("tabindex", "0") ]
            ~events:"click" ~on_dom_event:(fun _ _ -> choose it)
            [ Logseq_el.el ~tag:"span"
                [ Logseq_el.el
                    ~attrs:[ ("class", "select-item-row") ]
                    [ Logseq_el.el
                        ~attrs:[ ("class", "select-item-left") ]
                        ((if multiple then
                            [ Logseq_el.el ~tag:"input"
                                ~attrs:
                                  ([ ("type", "checkbox") ]
                                   @
                                   if List.mem it.si_value sel then
                                     [ ("checked", "") ]
                                   else [])
                                []
                            ]
                          else [])
                        @ [ Logseq_el.el ~tag:"span" ~text:it.si_label [] ])
                    ]
                ]
            ]
        ]
    in
    let combined =
      Signal.map2
        (fun q (picked, sel) -> (q, picked, sel))
        qsig
        (Signal.map2 (fun picked sel -> (picked, sel)) csig ssig)
    in
    let results =
      Logseq_el.el ~id:"ui__ac" ~attrs:[ ("class", "cp__select-results") ]
        [ reactive
            (fun (q, picked, sel) ->
              match filtered q with
              | [] ->
                  if multiple then Logseq_el.nothing
                  else
                    Logseq_el.el ~attrs:[ ("class", "ls-ac-empty") ]
                      ~text:I.no_matched_result []
              | its ->
                  Logseq_el.el ~id:"ui__ac-inner"
                    ~attrs:[ ("class", "hide-scrollbar") ]
                    (List.mapi (fun i it -> row i it picked sel) its))
            combined ]
    in
    let select_col =
      column ~key:("vpsel-" ^ string_of_int id)
        ~style_class:"cp__select cp__select-main"
        ([ Logseq_el.el ~attrs:[ ("class", "input-wrap") ]
             [ input ~key:("vpsel-i" ^ string_of_int id)
                 ~style_class:"cp__select-input" ~placeholder ~autofocus:true
                 ~on_input:(function
                   | Lui_protocol.TextChanged (_, v) ->
                       Signal.set query v;
                       Signal.set chosen 0
                   | _ -> ())
                 [] ]
         ; Logseq_el.el ~attrs:[ ("class", "item-results-wrap") ] [ results ] ]
         @
         if multiple then
           [ Logseq_el.el ~attrs:[ ("class", "cp__select-apply") ]
               [ button ~key:("vpsel-a" ^ string_of_int id)
                   ~style_class:"ui__button ls-btn-outline" ~text:I.apply
                   ~on_press:(fun _ ->
                     close_all ();
                     on_apply (Signal.get_state sel_values))
                   [] ]
           ]
         else [])
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
    anchored_popover ~key:("vpsel-p" ^ string_of_int id)
      ~id:("vpsel-p" ^ string_of_int id) ~place ~cls:wrap_cls
      ~on_dismiss:(fun _ -> close_entry id)
      [ wrap ] context parent
  in
  ignore (push view)

(* ---------- confirm dialog ---------- *)

let show_dialog ~headline ~body:(body : t list) ~on_confirm
    ?(confirm_label = I.yes) () =
  let id = !next_id + 1 in
  let view context parent =
    (* the dialog kind renders the blocking backdrop itself; clicks on
       it do not dismiss (matches the old overlay semantics) *)
    dialog ~key:(Printf.sprintf "vp-dlg-%d" id)
      ~accessibility_identifier:(Printf.sprintf "vp-dlg-%d" id)
      ~style_class:"ui__dialog-content"
      ~data_attrs:[ ("role", "dialog"); ("aria-modal", "true") ]
      ~on_dismiss:(fun _ -> close_entry id)
      ([ row ~key:"head" ~style_class:"ls-dialog-head"
           [ box ~style_class:"ls-dialog-head-icon"
               [ box ~style_class:"ls-dialog-error"
                   [ icon ~key:"ic" ~name:(`app "alert-triangle") [] ] ]
           ; box ~style_class:"ls-dialog-head-text"
               [ Logseq_el.el ~tag:"h3" ~id:"modal-headline"
                   ~attrs:[ ("class", "ls-dialog-headline") ]
                   ~text:headline [] ]
           ]
       ]
       @ body
       @ [ row ~key:"footer" ~style_class:"ls-dialog-footer"
             [ button ~key:"cancel" ~style_class:"ui__button ls-btn-outline"
                 ~text:I.cancel
                 ~on_press:(fun _ -> close_entry id) []
             ; button ~key:"confirm" ~style_class:"ui__button ls-btn-primary"
                 ~text:confirm_label
                 ~on_press:(fun _ ->
                   close_entry id;
                   on_confirm ())
                 [] ]
         ])
      context parent
  in
  push view

(* ---------- custom caller-supplied content ---------- *)

(* escape hatch for callers that own their own content (filter pickers,
   rename boxes): renders [content] inside a caller-anchored popover so
   placement/dismissal stay consistent with the menu path. *)
let show_custom ~(anchor : U.el) ?(align_end = false) ~cls (content : t) =
  close_all ();
  let id = !next_id + 1 in
  ignore
    (push
       (fun context parent ->
         let place = placement_state context.Lui_ui.ui_scheduler anchor
             ~align_end in
         anchored_popover ~key:(Printf.sprintf "vp-c-%d" id)
           ~id:(Printf.sprintf "vp-c-%d" id) ~place ~cls
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
  keyed ~source:st.Signal.state_signal ~key:(fun p -> p.p_id)
    ~cmp:Int.compare ~mount:(fun p_s -> (get p_s).p_view)
    context parent
