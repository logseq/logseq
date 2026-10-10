(* Slash/context command consumer. popups_state dispatches
   `ls:editor-command` CustomEvents with {command, from, to} (the slash
   trigger range inside the editing model) or {command, block, value}
   (context-menu rows on unedited blocks). Side effects beyond a text
   splice live here: property writes (heading/status/priority/
   display-type/order-list), the inline calendar (#date-time-picker,
   cljs components/date-picker), the link/image-link form
   (.ls-editor-link-form, cljs components/link), and the popup key
   router consulted by editor_keys while a popup is open.

   The popup view is LUI: [popup_view] mounts a [popover] in the
   overlay layer (Popups_view.render) and renders from the imperative
   [active] record republished through one shared [popup option]
   signal. The public entries ([install], [popup_key], [click_guard],
   [run_editor_cmd], [on_command]) keep their imperative signatures —
   callers open the popup exactly as before; only the view layer is
   declarative. The pre-LUI DOM contract is kept verbatim:
   .ls-editor-date-picker / .ui__calendar-cell / .ui__calendar-day /
   .ls-cal-outside classes, role=grid/gridcell/menu/menuitem
   attributes, and the [role=checkbox] repeat panel. *)

open Promise_ext
open Lui_elements
module S = Editor_state
module A = Editor_actions
module Ops = Outliner_ops
module W = Wire

(* ---------- event detail ---------- *)

let detail_str (ev : Ui_services.ev) name = ev.Ui_services.detail name

let detail_int (ev : Ui_services.ev) name =
  match ev.Ui_services.detail_json name with
  | Some (Json.Number n) -> Some (int_of_float n)
  | _ -> None

(* ---------- buffer splice ---------- *)

(* splice [text] into the editing model over [from, to); returns the
   new buffer and the caret position after the inserted text *)
let replace_range uuid from to_ text =
  match A.edit_model uuid with
  | Some m ->
      let n = String.length m.Edit_model.source in
      let f = max 0 (min from n) in
      let t = max f (min to_ n) in
      let caret = f + String.length text in
      let m' =
        Edit_model.select
          (Edit_model.splice m f t text)
          ~anchor:caret ~focus:caret
      in
      A.update_model uuid (fun _ -> m');
      (m'.Edit_model.source, caret)
  | None -> (A.live_buffer uuid, 0)

let clear_range uuid from to_ = snd (replace_range uuid from to_ "")

(* ---------- property batches ---------- *)

(* save the live buffer together with property writes, keeping the block
   in edit mode and the caret at [caret] after the refresh *)
let prop_batch ~caret uuid ops =
  let buf = A.live_buffer uuid in
  A.with_focus_after ~restore:(S.editing ()) uuid caret
    (let* sop = Ops.save_block_parsed uuid buf in
     let* () = Ops.apply_and_refresh (sop :: ops) in
     (* Publish this block's chips as soon as its command commits. *)
     Properties_state.refresh_entity uuid;
     Js.Promise.resolve ())

(* same, but drop edit mode first (cljs :editor/exit — code blocks leave
   edit mode while the view re-renders the code surface), then focus
   the mounted CodeMirror via the pending-focus machinery (code_focus
   short-circuits the hidden-input path) *)
let exit_to_props uuid ops =
  let buf = A.live_buffer uuid in
  let restore = S.editing () in
  S.set (fun st -> { st with S.editing = None });
  A.with_focus_after ~restore uuid 0
    (let* sop = Ops.save_block_parsed uuid buf in
     Ops.apply_and_refresh (sop :: ops))

(* ---------- calendar ---------- *)

let month_names () =
  Array.map I18n.t
    [| "format.month/january"; "format.month/february"; "format.month/march"
     ; "format.month/april"; "format.month/may"; "format.month/june"
     ; "format.month/july"; "format.month/august"; "format.month/september"
     ; "format.month/october"; "format.month/november"; "format.month/december" |]

type popup_kind =
  | Cal_insert (* "date picker": Enter writes [[journal]] at the slash range *)
  | Cal_prop of string (* scheduled/deadline: Enter sets a datetime prop *)
  | Link_form of bool (* link/image-link form; bool = image *)

(* cljs repeat-setting panel state — resolved async from the worker and
   rendered as the right column of the date picker for datetime
   properties (scheduled/deadline) *)
type repeat =
  { prop_id : int (* db/id of the Cal_prop property entity *)
  ; repeated : bool
  ; freq : int
  ; unit_id : int (* selected recur-unit choice db/id *)
  ; unit_choices : (int * string * string) list (* db/id, ident, label *)
  ; rtype_id : int
  ; rtype_choices : (int * string * string) list
  ; when_id : int (* selected checked-property entity db/id *)
  ; when_choices : (int * string * string) list (* db/id, label, done label *)
  }

(* an anchored [role=menu] overlay inside the popup — mx/my are offsets
   from the popup's own top-left, the same frame the pre-LUI absolute
   positioning used *)
type popup_menu =
  { mx : float
  ; my : float
  ; mclass : string
  ; mitems : (string * (unit -> unit)) list
  }

type popup =
  { kind : popup_kind
  ; uuid : string
  ; from : int (* caret position the cleared slash range ended at *)
  ; cy : int
  ; cm : int
  ; cd : int
  ; hour : int (* time-of-day for datetime commits, local time *)
  ; tmin : int
  ; x : float (* viewport position of the popover's top-left *)
  ; y : float
  ; menu : popup_menu option
  ; rpt : repeat option
  }

(* imperative truth the imperative entries own; the signal is created
   lazily at overlay mount so [open_cal] never needs a ui_context.
   [update_p] publishes a fresh record — the previous published value
   then stays a real snapshot for the reactive ~equal comparators *)
let active : popup option ref = ref None

let popup_vs : popup option Signal.state option ref = ref None

let popup_vs_of context =
  match !popup_vs with
  | Some vs -> vs
  | None ->
      let vs = Signal.state context.Lui_ui.ui_scheduler !active in
      popup_vs := Some vs;
      vs

let publish () =
  match !popup_vs with
  | Some vs -> Runtime.signal_set vs !active
  | None -> ()

let update_p f =
  (match !active with
   | Some p -> active := Some (f p)
   | None -> ());
  publish ()

let update_rpt f =
  update_p (fun p -> { p with rpt = Option.map f p.rpt })

let with_p f = match !active with Some p -> f p | None -> ()

let cur_rpt () = match !active with Some p -> p.rpt | None -> None

let days_in_month y m = Dates.days_in_month ~y ~m

(* LOCAL time — cljs merges the time input via .setHours into the
   calendar day before tc/to-long, so the stored ms is the local
   datetime (getTime), never UTC-midnight day math *)
let day_date p =
  Dates.make ~year:p.cy ~month:p.cm ~day:p.cd ~hours:p.hour
    ~minutes:p.tmin ()

let focus_day () =
  match
    Ui_services.dom_query "#date-time-picker td[data-focused='true'] button"
  with
  | Some b -> b.Ui_services.focus ()
  | None -> ()

let close_popup ?focus_caret p =
  active := None;
  Runtime.editor_popup_open := false;
  publish ();
  match focus_caret with
  | Some c ->
      Editor_sink.focus_input p.uuid;
      A.set_caret p.uuid c
  | None -> ()

let () = S.on_edit_exit (fun uuid ->
    match !active with
    | Some p when p.uuid = uuid -> close_popup p
    | _ -> ())

(* cljs Enter handler: "date picker" closes the popup and inserts
   [[journal]]; scheduled/deadline set the datetime property and keep
   the calendar open (still editing) *)
(* cljs commands/insert! — the trigger text stays in the buffer while
   the popup is open and the commit replaces the last "/" through the
   caret with the output ([[journal]] for date-picker, [l](u) for link) *)
let insert_at_trigger p text =
  let to_ = fst (A.sel_span p.uuid) in
  replace_range p.uuid p.from to_ text

let commit_cal p =
  let d = day_date p in
  match p.kind with
  | Cal_insert ->
      let nv, caret =
        insert_at_trigger p ("[[" ^ Dates.journal_title_of d ^ "]]")
      in
      Ops.schedule_save p.uuid nv;
      close_popup p ~focus_caret:caret
  | Cal_prop ident ->
      let op =
        Ops.set_block_property p.uuid ident (W.Float (Dates.to_ms d))
      in
      (match A.edit_model p.uuid with
       | Some _ -> prop_batch ~caret:p.from p.uuid [ op ]
       | None ->
           (* selected (non-editing) block via `p d` — no buffer to save
              and no caret to restore; just apply the property *)
           ignore (Ops.apply_and_refresh [ op ]))
      (* popup deliberately stays open — cljs datepicker stays up for
         scheduled/deadline so the user can keep adjusting *)
  | Link_form _ -> ()

(* one td[role=gridcell] > button.ui__calendar-day; the focused day
   carries tabindex=0/data-selected/data-focused, today carries
   data-today. The table kind emits table/tr/td plus role=grid/row/
   gridcell itself — the attrs here are the app contract on top *)
let rec cal_cell today p d =
  let focused = d = p.cd in
  let is_today =
    p.cy * 10000 + p.cm * 100 + d = today
  in
  table_cell ~key:(Printf.sprintf "%04d-%02d-%02d" p.cy p.cm d)
    ~style_class:"ui__calendar-cell"
    ~data_attrs:
      ((if focused
        then [ ("data-focused", "true"); ("aria-selected", "true") ]
        else [])
       @ if is_today then [ ("data-today", "true") ] else [])
    [ button ~style_class:"ui__calendar-day"
        ~text:(string_of_int d)
        ~label:(string_of_int d)
        ~autofocus:focused
        ~data_attrs:
          ([ ("tabindex", if focused then "0" else "-1") ]
           @ (if focused then [ ("data-selected", "true") ] else [])
           @ if is_today then [ ("data-today", "true") ] else [])
        ~on_press:(fun _ -> pick_day p.cy p.cm d)
        [] ]

(* dimmed prev/next-month day (cljs DayPicker showOutsideDays); y/m is
   the neighboring month it belongs to *)
and out_cell y m d =
  table_cell ~key:(Printf.sprintf "%04d-%02d-%02d" y m d)
    ~style_class:"ui__calendar-cell"
    [ button ~style_class:"ui__calendar-day ls-cal-outside"
        ~text:(string_of_int d)
        ~label:(string_of_int d)
        ~data_attrs:[ ("tabindex", "-1") ]
        ~on_press:(fun _ -> pick_day y m d)
        [] ]

(* the day grid — remounts whole on a cy/cm/cd change, which is what
   re-fires the focused day's autofocus *)
and cal_table (p : popup) : t =
  let today = Dates.today_journal_day () in
  let days = days_in_month p.cy p.cm in
  let lead =
    (let f = Dates.fields (Dates.make ~year:p.cy ~month:p.cm ~day:1 ()) in
     f.Dates.wday)
  in
  let py, pm =
    if p.cm = 1 then (p.cy - 1, 12) else (p.cy, p.cm - 1)
  in
  let pdays = days_in_month py pm in
  let ny, nm =
    if p.cm = 12 then (p.cy + 1, 1) else (p.cy, p.cm + 1)
  in
  let rows = (lead + days + 6) / 7 in
  table ~key:"grid"
    (List.init rows (fun r ->
       table_row ~key:(string_of_int r)
         (List.init 7 (fun c ->
            let d = (r * 7) + c + 1 - lead in
            if d < 1 then out_cell py pm (pdays + d)
            else if d > days then out_cell ny nm (d - days)
            else cal_cell today p d))))

and nav_month delta =
  update_p (fun p ->
      let m = p.cm + delta in
      if m < 1 then { p with cm = 12; cy = p.cy - 1 }
      else if m > 12 then { p with cm = 1; cy = p.cy + 1 }
      else { p with cm = m })

(* click a calendar day: Cal_insert commits; scheduled/deadline keep the
   popup open with the new day focused *)
and pick_day y m d =
  update_p (fun p -> { p with cy = y; cm = m; cd = d });
  with_p commit_cal

let close_menu () =
  with_p (fun p ->
      if p.menu <> None then
        update_p (fun q -> { q with menu = None }))

(* (mx, my) the menu anchors at — anchor's bottom-left corner in the
   popup's own coordinate frame *)
let menu_offsets sel =
  match Ui_services.dom_by_id "date-time-picker" with
  | None -> None
  | Some root -> (
      match Ui_services.dom_query ("#date-time-picker " ^ sel) with
      | Some anchor ->
          let ax, ay, _aw, ah = anchor.Ui_services.rect () in
          let rx, ry, _rw, _rh = root.Ui_services.rect () in
          Some (ax -. rx, ay +. ah -. ry)
      | None -> None)

(* cljs ui.cljs month select: label + [role=menu] of long month names *)
let toggle_month_menu () =
  with_p (fun p ->
      match p.menu with
      | Some _ -> update_p (fun q -> { q with menu = None })
      | None -> (
          match menu_offsets ".ls-date-month-select" with
          | Some (mx, my) ->
              update_p (fun q ->
                  { q with
                    menu =
                      Some
                        { mx; my; mclass = "ls-date-month-menu"
                        ; mitems =
                            List.mapi
                              (fun i name ->
                                ( name
                                , fun () ->
                                    update_p (fun r ->
                                        { r with cm = i + 1
                                               ; menu = None }) ))
                              (Array.to_list (month_names ()))
                        } })
          | None -> ()))

(* a button + anchored [role=menu] like the month select, reused for the
   repeat selects (unit / repeat-type / when) *)
let open_choice_menu sel items =
  match menu_offsets sel with
  | Some (mx, my) ->
      update_p (fun p ->
          { p with
            menu =
              Some
                { mx; my
                ; mclass = "ls-date-month-menu ls-repeat-choice-menu"
                ; mitems =
                    List.map
                      (fun (label, pick) ->
                        ( label
                        , fun () ->
                            update_p (fun r -> { r with menu = None });
                            pick () ))
                      items
                } })
  | None -> ()

let cal_move delta =
  update_p (fun p ->
      let cd = p.cd + delta in
      let cy, cm, cd =
        if cd < 1 then (
          let cm, cy =
            if p.cm - 1 < 1 then (12, p.cy - 1) else (p.cm - 1, p.cy)
          in
          (cy, cm, cd + days_in_month cy cm))
        else if cd > days_in_month p.cy p.cm then (
          let cm, cy =
            if p.cm + 1 > 12 then (1, p.cy + 1) else (p.cm + 1, p.cy)
          in
          (cy, cm, cd - days_in_month p.cy p.cm))
        else (p.cy, p.cm, cd)
      in
      { p with cy; cm; cd })

(* cljs nld-parse covers natural language; here a plain JS Date parse
   handles ISO / "Sep 30, 2026" style input, else the warning toast *)
let parse_nlp_date s = Dates.parse s

let nlp_commit () =
  match Ui_services.dom_query "#date-time-picker .ls-date-nlp" with
  | Some input -> (
      let v = String.trim (input.Ui_services.value ()) in
      if v <> "" then
        match parse_nlp_date v with
        | Some d ->
            let f = Dates.fields d in
            update_p (fun p ->
                { p with cy = f.Dates.year; cm = f.Dates.month
                       ; cd = f.Dates.day });
            with_p commit_cal
        | None ->
            Toast.warning (I18n.tf "date/invalid-date-warning" [ v ]))
  | None -> ()

(* cljs open-editor-popup! anchors at the caret mirror span; a popup
   opened on a selected (non-editing) block — the `p d` chord — anchors
   under the block row instead. The popover's own viewport clamp and
   anchor flip replace the old cal_clamp_in_view *)
let cal_pos uuid =
  match Editor_sink.popup_pos uuid with
  | Some (x, y, _) -> (x, y)
  | None -> (
      match Ui_services.dom_query (".ls-block[blockid='" ^ uuid ^ "']")
      with
      | Some blk ->
          let rx, ry, _rw, rh = blk.Ui_services.rect () in
          (rx +. 24., ry +. rh +. 4.)
      | None -> (240., 96.))

(* cljs base-ui avoidCollisions for the horizontal axis too: the
   two-column picker can overflow the right edge — shift it left
   inside the viewport *)
let clamp_x () =
  match Ui_services.dom_by_id "date-time-picker" with
  | Some root -> (
      let rx, _ry, rw, _rh = root.Ui_services.rect () in
      let vw = Ui_services.dom_viewport_width () in
      if rx +. rw > vw -. 8. then
        update_p (fun q ->
            { q with x = Float.max 8. (vw -. 8. -. rw) }))
  | None -> ()

(* ---------- repeat panel (cljs property/value.cljs repeat-setting) -- *)

(* property writes for a popup-targeted block — same editing/non-editing
   split as commit_cal: the editing path saves the live buffer first so
   typed-but-unsaved text survives the refresh *)
let apply_props p ops =
  match A.edit_model p.uuid with
  | Some _ -> prop_batch ~caret:p.from p.uuid ops
  | None -> ignore (Ops.apply_and_refresh ops)

(* scalar property attrs on the block are refs to value entities
   {logseq.property/value: v}; closed-value/ref attrs point straight at
   the choice/property entity. Worker returns Tagged entity maps —
   untag first *)
let unwrap_value w =
  match Properties_data.untag w with
  | W.Map _ as m ->
      Option.value ~default:m
        (Properties_data.getf m "logseq.property/value")
  | _ -> w

let int_of_wire = function
  | W.Int n -> Some n
  | W.Int64 n -> Some (Int64.to_int n)
  | W.Float f -> Some (int_of_float f)
  | _ -> None

let ms_of_wire = function
  | W.Int n -> Some (float_of_int n)
  | W.Int64 n -> Some (Int64.to_float n)
  | W.Float f -> Some f
  | W.Date_ms n -> Some (Int64.to_float n)
  | _ -> None

let done_label_of (r : repeat) =
  match
    List.find_map
      (fun (id, _label, done_label) ->
        if id = r.when_id then Some done_label else None)
      r.when_choices
  with
  | Some l -> l
  | None -> ""

let choice_label_of choices id =
  match
    List.find_map
      (fun (cid, _i, l) -> if cid = id then Some l else None)
      choices
  with
  | Some l -> l
  | None -> ""

let rpt_of po = match po with Some { rpt; _ } -> rpt | None -> None

let toggle_repeated () =
  match cur_rpt () with
  | Some r ->
      let on = not r.repeated in
      update_rpt (fun r -> { r with repeated = on });
      with_p (fun p ->
          apply_props p
            ([ Ops.set_block_property p.uuid
                 "logseq.property.repeat/repeated?" (W.Bool on) ]
             @ if on then
                 [ Ops.set_block_property p.uuid
                     "logseq.property.repeat/temporal-property"
                     (W.Int r.prop_id) ]
               else
                 [ Ops.remove_block_property p.uuid
                     "logseq.property.repeat/temporal-property" ]))
  | None -> ()

let commit_freq v =
  match cur_rpt () with
  | None -> ()
  | Some r -> (
      match int_of_string_opt v with
      | Some n when n > 0 ->
          if n <> r.freq then (
            update_rpt (fun r -> { r with freq = n });
            with_p (fun p ->
                apply_props p
                  [ Ops.set_block_property p.uuid
                      "logseq.property.repeat/recur-frequency" (W.Int n) ]))
      | _ -> (
          match
            Ui_services.dom_query
              "#date-time-picker .ls-repeat-frequency-input"
          with
          | Some inp -> inp.Ui_services.set_value (string_of_int r.freq)
          | None -> ()))

let commit_time v =
  match String.split_on_char ':' v with
  | [ h; m ] -> (
      match (int_of_string_opt h, int_of_string_opt m) with
      | Some h, Some m when h >= 0 && h < 24 && m >= 0 && m < 60 ->
          update_p (fun q -> { q with hour = h; tmin = m });
          with_p commit_cal
      | _ -> ())
  | _ -> ()

(* select widget: a ghost button whose label is the current choice;
   pressing it anchors a [role=menu] under the button *)
let repeat_select ps ~sel ~label ~label_of ~options_of ~on_pick : t =
  button ~style_class:"ls-repeat-select"
    ~label
    ~data_attrs:[ ("data-sel", sel) ]
    ~on_press:(fun _ ->
      open_choice_menu
        (Printf.sprintf "[data-sel='%s']" sel)
        (List.map
           (fun (id, label) -> (label, fun () -> on_pick id label))
           (options_of ())))
    [ text
        ~value:(reactive
                  (fun po ->
                    match rpt_of po with
                    | Some r -> label_of r
                    | None -> "")
                  ps)
        []
    ; Icons.icon "chevron-down" ]

(* the raw-input bridge — LUI input only emits text/color kinds and
   carries no blur/value-attr plumbing, so number/time inputs ride
   Logseq_el with real attrs + dom events *)
let freq_input ps : t =
  Logseq_el.el ~key:"finp" ~tag:"input"
    ~style_class:"ls-repeat-frequency-input" ~events:"blur keydown"
    ~attrs_signal_v:
      (Logseq_el.attrs_signal ps (fun po ->
           [ ("type", "number"); ("min", "1"); ("step", "1")
           ; ( "value"
             , match rpt_of po with
               | Some r -> string_of_int r.freq
               | None -> "1" ) ]))
    ~on_dom_event:(fun name payload ->
      match name with
      | "keydown" ->
          if Json_payload.str payload "key" = "Enter" then (
            commit_freq (Json_payload.str payload "value");
            (* blur commits in the original; focusing the grid day
               blurs this input the same way *)
            focus_day ())
      | "blur" -> commit_freq (Json_payload.str payload "value")
      | _ -> ())
    []

let year_input ps : t =
  Logseq_el.el ~key:"yin" ~tag:"input" ~style_class:"ls-date-year-input"
    ~events:"input"
    ~attrs_signal_v:
      (Logseq_el.attrs_signal ps (fun po ->
           [ ("type", "number"); ("min", "1"); ("max", "9999")
           ; ( "value"
             , match po with Some q -> string_of_int q.cy | None -> "" )
           ]))
    ~on_dom_event:(fun name payload ->
      if name = "input" then
        match int_of_string_opt (Json_payload.str payload "value") with
        | Some y when y >= 1000 && y <= 9999 ->
            update_p (fun q -> { q with cy = y })
        | _ -> ())
    []

let time_input ps : t =
  Logseq_el.el ~key:"tinp" ~tag:"input" ~id:"time-picker"
    ~style_class:"ls-time-input" ~events:"change blur"
    ~attrs_signal_v:
      (Logseq_el.attrs_signal ps (fun po ->
           [ ("type", "time")
           ; ( "value"
             , match po with
               | Some q -> Printf.sprintf "%02d:%02d" q.hour q.tmin
               | None -> "00:00" ) ]))
    ~on_dom_event:(fun name payload ->
      match name with
      | "change" | "blur" ->
          commit_time (Json_payload.str payload "value")
      | _ -> ())
    []

let time_row ps : t =
  box ~key:"time" ~style_class:"ls-time-picker"
    [ time_input ps
    ; button ~key:"now" ~style_class:"ls-time-now"
        ~text:(I18n.t "ui/use-current-time")
        ~on_press:(fun _ ->
          let now = Dates.fields (Dates.date_now ()) in
          update_p (fun q ->
              { q with hour = now.Dates.hours; tmin = now.Dates.minutes });
          with_p commit_cal)
        [] ]

let menu_view (m : popup_menu) : t =
  box ~key:"menu" ~style_class:m.mclass
    ~data_attrs:
      [ ("role", "menu")
      ; ( "style"
        , Printf.sprintf "position:absolute;left:%.0fpx;top:%.0fpx"
            m.mx m.my ) ]
    (List.mapi
       (fun i (label, pick) ->
         menu_item ~key:(string_of_int i)
           ~style_class:"ls-date-month-option"
           ~data_attrs:[ ("role", "menuitem") ]
           ~text:label ~on_press:(fun _ -> pick ()) [])
       m.mitems)

let repeat_panel ps : t =
  let opt3 f po =
    match rpt_of po with Some r -> f r | None -> ""
  in
  let repeat_sel label_of options_of on_pick sel label_key =
    repeat_select ps ~sel ~label:(I18n.t label_key) ~label_of ~options_of ~on_pick
  in
  let on_unit id _label =
    match cur_rpt () with
    | Some r when id <> r.unit_id ->
        update_rpt (fun r -> { r with unit_id = id });
        with_p (fun p ->
            apply_props p
              [ Ops.set_block_property p.uuid
                  "logseq.property.repeat/recur-unit" (W.Int id) ])
    | _ -> ()
  in
  let on_rtype id _label =
    match cur_rpt () with
    | Some r when id <> r.rtype_id ->
        update_rpt (fun r -> { r with rtype_id = id });
        with_p (fun p ->
            apply_props p
              [ Ops.set_block_property p.uuid
                  "logseq.property.repeat/repeat-type" (W.Int id) ])
    | _ -> ()
  in
  let on_when id _label =
    match cur_rpt () with
    | Some r when id <> r.when_id ->
        update_rpt (fun r -> { r with when_id = id });
        with_p (fun p ->
            apply_props p
              [ Ops.set_block_property p.uuid
                  "logseq.property.repeat/checked-property" (W.Int id) ])
    | _ -> ()
  in
  box ~key:"rpt" ~style_class:"ls-repeat-panel"
    [ box ~key:"head" ~style_class:"ls-repeat-head"
        [ button ~key:"cb" ~style_class:"jtrigger ls-repeat-checkbox"
            ~label:(I18n.t "property.built-in/repeat-repeated")
            ~data_attrs:(reactive
                           (fun po ->
                             [ ("role", "checkbox")
                             ; ( "aria-checked"
                               , string_of_bool
                                   (match rpt_of po with
                                    | Some r -> r.repeated
                                    | None -> false) ) ]
                             @ (match rpt_of po with
                                | Some { repeated = true; _ } ->
                                    [ ("data-checked", "true") ]
                                | _ -> []))
                           ps)
            ~on_press:(fun _ -> toggle_repeated ())
            [ text
                ~value:(reactive
                          (fun po ->
                            match rpt_of po with
                            | Some { repeated = true; _ } -> "✓"
                            | _ -> "")
                          ps)
                [] ]
        ; text ~key:"rt" ~value:(I18n.t "property.repeat/task") [] ]
    ; box ~key:"freq" ~style_class:"ls-repeat-frequency"
        [ label ~key:"fl" ~style_class:"ls-repeat-label"
            ~value:(I18n.t "property.repeat/every") []
        ; freq_input ps
        ; repeat_sel (fun r -> choice_label_of r.unit_choices r.unit_id)
            (fun () ->
              match cur_rpt () with
              | Some r ->
                  List.map (fun (id, _i, l) -> (id, l)) r.unit_choices
              | None -> [])
            on_unit "unit" "property.built-in/repeat-recur-unit" ]
    ; box ~key:"next" ~style_class:"ls-repeat-next"
        [ text ~key:"nl" ~style_class:"ls-repeat-label"
            ~value:(I18n.t "property.repeat/next-date") []
        ; repeat_sel (fun r -> choice_label_of r.rtype_choices r.rtype_id)
            (fun () ->
              match cur_rpt () with
              | Some r ->
                  List.map (fun (id, _i, l) -> (id, l)) r.rtype_choices
              | None -> [])
            on_rtype "rtype" "property.built-in/repeat-repeat-type" ]
    ; box ~key:"when" ~style_class:"ls-repeat-when"
        [ text ~key:"wl" ~style_class:"ls-repeat-label"
            ~value:(I18n.t "property.repeat/when") []
        ; repeat_sel
            (fun r ->
              match
                List.find_map
                  (fun (id, l, _d) -> if id = r.when_id then Some l else None)
                  r.when_choices
              with
              | Some l -> l
              | None -> "")
            (fun () ->
              match cur_rpt () with
              | Some r ->
                  List.map (fun (id, l, _d) -> (id, l)) r.when_choices
              | None -> [])
            on_when "when" "property.repeat/when"
        ; box ~key:"is" ~style_class:"ls-repeat-is"
            [ text ~key:"il" ~style_class:"ls-repeat-label"
                ~value:(I18n.t "property.repeat/is-label") []
            ; text ~key:"dl"
                ~value:(reactive (opt3 done_label_of) ps) [] ] ] ]

let cal_head ps : t =
  box ~key:"head" ~style_class:"ls-cal-head"
    [ box ~key:"selects" ~style_class:"ls-cal-selects"
        [ button ~key:"msel" ~style_class:"ls-date-month-select"
            ~text:(reactive
                     (fun po ->
                       match po with
                       | Some q -> (month_names ()).(q.cm - 1)
                       | None -> "")
                     ps)
            ~on_press:(fun _ -> toggle_month_menu ())
            []
        ; year_input ps ]
    ; box ~key:"nav" ~style_class:"ls-cal-nav"
        [ button ~key:"prev" ~style_class:"ls-cal-nav-btn"
            ~label:(I18n.t "editor.date-picker/previous-month")
            ~on_press:(fun _ -> nav_month (-1))
            [ Icons.icon "chevron-left" ]
        ; button ~key:"next" ~style_class:"ls-cal-nav-btn"
            ~label:(I18n.t "editor.date-picker/next-month")
            ~on_press:(fun _ -> nav_month 1)
            [ Icons.icon "chevron-right" ] ] ]

(* comparators: never structural — the record carries closures
   (menu.mitems), so [equal] spells out the fields that drive each
   remount *)
let opt_eq f a b =
  match a, b with
  | Some a, Some b -> f a b
  | None, None -> true
  | _ -> false

let kind_eq = opt_eq (fun a b -> a.kind = b.kind)

let cal_eq =
  opt_eq (fun a b -> a.cy = b.cy && a.cm = b.cm && a.cd = b.cd)

let menu_eq =
  opt_eq (fun a b ->
      match a.menu, b.menu with
      | None, None -> true
      | Some m, Some n ->
          m.mx = n.mx && m.my = n.my && m.mclass = n.mclass
          && List.map fst m.mitems = List.map fst n.mitems
      | _ -> false)

let rpt_open po =
  match po with Some { rpt = Some _; _ } -> true | _ -> false

let cal_body ps (p : popup) : t =
  box ~key:"cal"
    ~style_class:
      ("ls-editor-date-picker"
       ^ (match p.kind with Cal_prop _ -> " ls-cal-prop" | _ -> ""))
    ~accessibility_identifier:"date-time-picker"
    [ box ~key:"wrap" ~style_class:"ls-property-date-picker"
        [ box ~key:"left"
            [ box ~key:"cal-box" ~style_class:"ui__calendar"
                [ cal_head ps
                ; reactive ~equal:cal_eq
                    (fun po ->
                      match po with
                      | Some q -> cal_table q
                      | None -> Logseq_el.nothing)
                    ps ]
            ; (match p.kind with
               | Cal_prop _ -> time_row ps
               | _ -> Logseq_el.nothing)
            ; input ~key:"nlp" ~style_class:"ls-date-nlp"
                ~placeholder:(I18n.t "ui/date-natural-language-placeholder")
                ~data_attrs:[ ("tabindex", "-1") ]
                ~on_submit:(fun _ -> nlp_commit ())
                [] ]
        ; if_ ~test:(reactive rpt_open ps) (repeat_panel ps) ]
    ; reactive ~equal:menu_eq
        (fun po ->
          match po with
          | Some { menu = Some m; _ } -> menu_view m
          | _ -> Logseq_el.nothing)
        ps ]

(* cljs link form: popover-content (w-72 + p-1.5) wrapping a
   p-2/gap-2 column — one column at 15px inset (7+8) reproduces the
   same content box: 288 wide, 258-wide inputs, Submit button below *)
let submit_link p =
  let url, label =
    match Ui_services.dom_query_all ".ls-editor-link-form input" with
    | [ u; l ] ->
        ( String.trim (u.Ui_services.value ())
        , String.trim (l.Ui_services.value ()) )
    | _ -> ("", "")
  in
  let label = if label = "" then url else label in
  let bang = (match p.kind with Link_form true -> "!" | _ -> "") in
  let nv, caret =
    insert_at_trigger p
      (bang ^ "[" ^ label ^ "](" ^ url ^ ")")
  in
  Ops.schedule_save p.uuid nv;
  close_popup p ~focus_caret:caret

let link_form_body p : t =
  column ~key:"link" ~style_class:"ls-editor-link-form" ~gap:8
    ~padding:15 ~width:288
    [ input ~key:"url" ~placeholder:(I18n.t "ui/link") ~autofocus:true
        []
    ; input ~key:"label" ~placeholder:(I18n.t "ui/label") []
    ; button ~key:"submit" ~variant:`primary ~size:`sm ~width:258
        ~height:28 ~min_height:28 ~text:I18n.submit
        ~on_press:(fun _ -> submit_link p) [] ]

let popup_body ps (p : popup) : t =
  match p.kind with
  | Link_form _ -> link_form_body p
  | Cal_insert | Cal_prop _ -> cal_body ps p

let popup_popover context ps : t =
  popover ~key:"editor-popup"
    ~at_signal:
      (Logseq_el.own context
         (Signal.map
            (fun po -> match po with Some p -> (p.x, p.y) | None -> (0., 0.))
            ps))
    ~on_dismiss:(fun _ -> with_p (fun p -> close_popup p))
    [ reactive ~equal:kind_eq
        (fun po ->
          match po with
          | Some p -> popup_body ps p
          | None -> Logseq_el.nothing)
        ps ]

(* mounted once in Popups_view's overlay fragment; lazily creates the
   popup signal the imperative entries publish into *)
let popup_view context parent =
  let vs = popup_vs_of context in
  let ps = vs.Signal.state_signal in
  let open_s =
    Logseq_el.own context (Signal.map (fun po -> po <> None) ps)
  in
  (if_ ~test:open_s (popup_popover context ps)) context parent

(* ---------- repeat panel data ---------- *)

(* resolve the block's repeat props + choice lists, then mount the
   repeat panel. Writes happen lazily on toggle, mirroring cljs *)
let load_repeat p ident =
  ignore
    (let* wires =
       Js.Promise.all
         [| Properties_data.entity_by_uuid p.uuid
          ; Properties_data.entity (W.Keyword ident)
          ; Properties_data.closed_values
              (W.Keyword "logseq.property.repeat/recur-unit")
          ; Properties_data.closed_values
              (W.Keyword "logseq.property.repeat/repeat-type")
          ; Properties_data.entity (W.Keyword "logseq.property/status")
          ; Properties_data.closed_values
              (W.Keyword "logseq.property/status")
          ; Properties_data.display_props ~show_hidden:false
              (Properties_data.uuid_ref p.uuid) |]
     in
     (* the popup may have closed while fetching *)
     (match !active with
      | Some ap when ap.uuid = p.uuid && ap.rpt = None ->
          let block = Properties_data.untag wires.(0)
          and prop_w = Properties_data.untag wires.(1)
          and units = W.elems wires.(2)
          and rtypes = W.elems wires.(3)
          and status_ent = Properties_data.untag wires.(4)
          and status_choices = W.elems wires.(5)
          and disp_w = wires.(6) in
          (* populate the time input from the stored datetime value —
             local hours/minutes of the epoch ms *)
          (match Properties_data.getf block ident with
           | Some v -> (
               match ms_of_wire (unwrap_value v) with
               | Some ms ->
                   let f = Dates.fields (Dates.of_ms ms) in
                   update_p (fun q ->
                       { q with hour = f.Dates.hours
                              ; tmin = f.Dates.minutes })
               | None -> ())
           | None -> ());
          let prop_type =
            Option.value ~default:""
              (Properties_data.getk prop_w "logseq.property/type")
          in
          let cid_and_ident w =
            match Properties_data.entity_id_of w with
            | Some id ->
                Some
                  ( id
                  , Option.value ~default:""
                      (Properties_data.getk (Properties_data.untag w)
                         "db/ident") )
            | None -> None
          in
          let suffix ident =
            match String.rindex_opt ident '.' with
            | Some i ->
                String.sub ident (i + 1) (String.length ident - i - 1)
            | None -> ident
          in
          let unit_choices =
            List.filter_map
              (fun w ->
                match cid_and_ident w with
                | Some (id, i) ->
                    (* minute/hour are datetime-only per cljs
                       repeat-unit-choices *)
                    if prop_type <> "datetime"
                       && (i = "logseq.property.repeat/recur-unit.minute"
                           || i = "logseq.property.repeat/recur-unit.hour")
                    then None
                    else
                      Some
                        ( id, i
                        , I18n.t
                            ("property.repeat-recur-unit/" ^ suffix i) )
                | None -> None)
              units
          and rtype_choices =
            List.filter_map
              (fun w ->
                match cid_and_ident w with
                | Some (id, i) ->
                    Some
                      ( id, i
                      , I18n.t
                          ("property.repeat-repeat-type/" ^ suffix i) )
                | None -> None)
              rtypes
          in
          (* done label of a property = its closed value whose
             choice-checkbox-state is true; falls back to the first
             choice's title (cljs falls back to status-done) *)
          let done_of choices =
            match
              List.find_map
                (fun c ->
                  match
                    Properties_data.getf (Properties_data.untag c)
                      "logseq.property/choice-checkbox-state"
                  with
                  | Some (W.Bool true) ->
                      Some (Properties_data.ref_title c)
                  | _ -> None)
                choices
            with
            | Some l -> l
            | None ->
                Option.value ~default:""
                  (Option.map Properties_data.ref_title
                     (List.nth_opt choices 0))
          in
          (* when options: status + this block's non-built-in properties
             with >=2 closed values (cljs full-properties filter) *)
          let status_id =
            Option.value ~default:0
              (Properties_data.entity_id_of status_ent)
          in
          let rows, _hidden = Properties_data.split_display disp_w in
          let when_choices =
            [ (status_id, I18n.t "property.built-in/status", done_of status_choices) ]
            @ List.filter_map
                (fun row ->
                  let prop = Properties_data.row_prop row in
                  match
                    ( Properties_data.entity_id_of prop
                    , Properties_data.getk prop "db/ident" )
                  with
                  | Some id, Some ident'
                    when not
                           (String.starts_with ~prefix:"logseq." ident') -> (
                      match
                        Properties_data.getf prop
                          "property/closed-values"
                      with
                      | Some cvs when List.length (W.elems cvs) >= 2 ->
                          Some
                            ( id
                            , Properties_data.ref_title prop
                            , done_of (W.elems cvs) )
                      | _ -> None)
                  | _ -> None)
                rows
          in
          let ref_id key =
            match Properties_data.getf block key with
            | Some v ->
                Properties_data.entity_id_of
                  (unwrap_value v)
            | None -> None
          in
          let r =
            { prop_id =
                Option.value ~default:0
                  (Properties_data.entity_id_of prop_w)
            ; repeated =
                (match
                   Option.bind
                     (Properties_data.getf block
                        "logseq.property.repeat/repeated?")
                     (fun v -> W.as_bool (unwrap_value v))
                 with
                 | Some b -> b
                 | None -> false)
            ; freq =
                (match
                   Option.bind
                     (Properties_data.getf block
                        "logseq.property.repeat/recur-frequency")
                     (fun v -> int_of_wire (unwrap_value v))
                 with
                 | Some n -> n
                 | None -> 1)
            ; unit_id =
                (match
                   ref_id "logseq.property.repeat/recur-unit"
                 with
                 | Some id -> id
                 | None ->
                     Option.value ~default:0
                       (List.find_map
                          (fun (id, i, _l) ->
                            if i = "logseq.property.repeat/recur-unit.day"
                            then Some id
                            else None)
                          unit_choices))
            ; unit_choices
            ; rtype_id =
                (match
                   ref_id "logseq.property.repeat/repeat-type"
                 with
                 | Some id -> id
                 | None ->
                     Option.value ~default:0
                       (List.find_map
                          (fun (id, i, _l) ->
                            if i
                               = "logseq.property.repeat/repeat-type.double-plus"
                            then Some id
                            else None)
                          rtype_choices))
            ; rtype_choices
            ; when_id =
                (match
                   ref_id "logseq.property.repeat/checked-property"
                 with
                 | Some id -> id
                 | None -> status_id)
            ; when_choices
            }
          in
          update_p (fun q -> { q with rpt = Some r });
          (* the panel widened the picker — keep it inside the viewport *)
          clamp_x ();
          Js.Promise.resolve ()
      | _ -> Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("load_repeat failed", e);
            Js.Promise.resolve ()))

(* ---------- popup entries ---------- *)

let open_cal kind uuid from =
  let today = Dates.fields (Dates.date_now ()) in
  let x, y = cal_pos uuid in
  let p =
    { kind; uuid; from
    ; cy = today.Dates.year; cm = today.Dates.month; cd = today.Dates.day
    ; hour = 0; tmin = 0; x; y; menu = None; rpt = None }
  in
  active := Some p;
  Runtime.editor_popup_open := true;
  publish ();
  (match kind with
   | Cal_prop ident -> load_repeat p ident
   | _ -> ())

(* ---------- link / image-link form ---------- *)

let open_link_form image uuid from =
  let x, y = cal_pos uuid in
  let p =
    { kind = Link_form image; uuid; from; cy = 0; cm = 0; cd = 0
    ; hour = 0; tmin = 0; x; y; menu = None; rpt = None }
  in
  active := Some p;
  Runtime.editor_popup_open := true;
  publish ()

(* ---------- popup key router (runs before editor_keys) ---------- *)

(* editor_keys hands over the decoded fields — Web_dom ev values cannot
   cross this module boundary now that the module is portable *)
let popup_key ~key ~inside ~prevent_default =
  match !active with
  | None -> false
  | Some p -> (
      match (p.kind, key) with
      | (Cal_insert | Cal_prop _), "ArrowRight" -> cal_move 1; true
      | (Cal_insert | Cal_prop _), "ArrowLeft" -> cal_move (-1); true
      | (Cal_insert | Cal_prop _), "ArrowDown" -> cal_move 7; true
      | (Cal_insert | Cal_prop _), "ArrowUp" -> cal_move (-7); true
      | (Cal_insert | Cal_prop _), "Enter" ->
          prevent_default ();
          commit_cal p;
          true
      | Link_form _, "Enter" ->
          prevent_default ();
          submit_link p;
          true
      | _, "Escape" ->
          prevent_default ();
          (match S.editing () with
           | Some _ -> A.exit_edit ~select:true
           | None -> close_popup p);
          true
      | Link_form _, _ -> false (* inputs handle their own keys *)
      | (Cal_insert | Cal_prop _), _ ->
          (* swallow keys aimed at the calendar so e.g. typing does not
             reach the textarea while a day button is focused *)
          if inside () then (prevent_default (); true) else false)

(* click_guard: the popup is a LUI popover layer, so clicks inside it
   never reach this point — editor_keys' Popups_state.inside target check
   runs first. A click outside closes the popup; the normal blur-commit
   still runs *)
let click_guard () =
  match !active with
  | None -> false
  | Some p -> close_popup p; false

(* ---------- command dispatch ---------- *)

let starts s prefix =
  let n = String.length prefix in
  String.length s >= n && String.sub s 0 n = prefix

let set_props ~caret uuid ident v =
  prop_batch ~caret uuid [ Ops.set_block_property uuid ident v ]

(* cljs batch-set-property-closed-value!: resolve the closed-value entity
   by db-property/closed-value-content (block/title else
   logseq.property/value), then batch-set-property {:entity-id? true} *)
let set_closed_prop ~caret uuid ident title =
  ignore
    ((let* w = Properties_data.closed_values (W.Keyword ident) in
     let rows =
       match w with
       | W.Array xs | W.List xs | W.Set xs -> xs
       | _ -> []
     in
     let id =
       List.find_map
         (fun e ->
           let e = Properties_data.untag e in
           let content =
             match Properties_data.gets e "block/title" with
             | Some t -> Some t
             | None -> Properties_data.gets e "logseq.property/value"
           in
           match content with
           | Some t
             when String.lowercase_ascii t
                  = String.lowercase_ascii title ->
               Properties_data.geti e "db/id"
           | _ -> None)
         rows
     in
     (match id with
      | Some id ->
          prop_batch ~caret uuid
            [ Ops.batch_set_property [ uuid ] ident (W.Int id)
                ~entity_id:true ]
      | None ->
          Ui_services.log_error
            ("no closed value for", title));
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("closed-prop failed", e);
            Js.Promise.resolve ()))

(* cljs editor/cycle-todo!: the status closed value cycles by db/ident
   todo -> doing -> done -> cleared -> todo. Editing buffer is
   untouched — the property write goes through apply_and_refresh and the
   open editor resync keeps typed-but-unsaved text. *)
let cycle_todo uuid =
  let next_ident = function
    | "logseq.property/status.todo" -> Some "logseq.property/status.doing"
    | "logseq.property/status.doing" -> Some "logseq.property/status.done"
    | "logseq.property/status.done" -> None
    | _ -> Some "logseq.property/status.todo"
  in
  let row_ident e =
    Properties_data.getk (Properties_data.untag e) "db/ident"
  in
  let row_id e =
    Properties_data.geti (Properties_data.untag e) "db/id"
  in
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* w =
          Runtime.invoke2 "thread-api/get-blocks" (W.String repo)
            (W.Array
               [ W.Map
                   [ (W.String "id", W.Uuid uuid)
                   ; ( W.String "opts"
                     , W.Map [ (W.Keyword "children?", W.Bool false) ] )
                   ]
               ])
        in
        let blk =
          match Wire.elems w with
          | [ pair ] -> (
              match W.get pair "block" with
              | Some b -> b
              | None -> (
                  match Wire.elems pair with
                  | [ _; b ] -> b
                  | _ -> W.Nil))
          | _ -> W.Nil
        in
        let cur_id =
          match W.get blk "logseq.property/status" with
          | Some v -> Properties_data.entity_id_of v
          | None -> None
        in
        let* rows_w =
          Properties_data.closed_values
            (W.Keyword "logseq.property/status")
        in
        let rows = Wire.elems rows_w in
        let ident_of id =
          List.find_map
            (fun e ->
              if row_id e = Some id then row_ident e
              else None)
            rows
        and id_of ident =
          List.find_map
            (fun e ->
              if row_ident e = Some ident then row_id e
              else None)
            rows
        in
        (match next_ident
                 (Option.value
                    (Option.bind cur_id ident_of)
                    ~default:"")
         with
         | Some ni -> (
             match id_of ni with
             | Some id ->
                 ignore
                   (Ops.apply_and_refresh
                      [ Ops.batch_set_property [ uuid ]
                          "logseq.property/status"
                          (W.Int id) ~entity_id:true ])
             | None -> ())
         | None ->
             ignore
               (Ops.apply_and_refresh
                  [ Ops.remove_block_property uuid
                      "logseq.property/status" ]));
        Js.Promise.resolve ())

(* toggle this block's own logseq.property/order-list-type *)
let toggle_own_list uuid caret =
  let has =
    match S.find uuid with
    | Some b -> b.Model.block_order_list <> None
    | None -> false
  in
  prop_batch ~caret uuid
    [ (if has
       then Ops.remove_block_property uuid "logseq.property/order-list-type"
       else Ops.set_block_property uuid "logseq.property/order-list-type"
              (W.String "number")) ]

(* cljs toggle-blocks-as-own-order-list!: any child ordered -> remove all,
   else set all children. Children are read fresh from the worker — the
   model tree can lag a just-applied indent. *)
let toggle_children_list uuid caret =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* kids = Sdk_write.children_of repo uuid in
        let ordered u =
          match W.get u "logseq.property/order-list-type" with
          | Some (W.Nil | W.Bool false) | None -> false
          | Some _ -> true
        in
        let has_ordered = List.exists ordered kids in
        let ops =
          List.filter_map
            (fun k ->
              Option.map
                (fun u ->
                  if has_ordered
                  then
                    Ops.remove_block_property u
                      "logseq.property/order-list-type"
                  else
                    Ops.set_block_property u
                      "logseq.property/order-list-type"
                      (W.String "number"))
                (W.map_get_uuid k "block/uuid"))
            kids
        in
        (* ordering children is a user command, not an RTC-flood
           cosmetic write — refresh inline so the numbered bullets
           repaint now (the deferred path waits ~8s while editing) *)
        if ops <> [] then
          A.with_focus_after ~restore:(S.editing ()) uuid caret
            (let* sop =
               Ops.save_block_parsed uuid (A.live_buffer uuid)
             in
             Ops.apply_and_refresh (sop :: ops));
        Js.Promise.resolve ())

let run_editor_cmd uuid command from to_ =
  (* date-picker/link/image-link keep the trigger text while the popup
     is open — [from] anchors it for the commit replace *)
  match command with
  | "date-picker" -> open_cal Cal_insert uuid from
  | "link" -> open_link_form false uuid from
  | "image-link" -> open_link_form true uuid from
  | _ ->
  let caret = clear_range uuid from to_ in
  match command with
  | "scheduled" ->
      open_cal (Cal_prop "logseq.property/scheduled") uuid caret
  | "deadline" ->
      open_cal (Cal_prop "logseq.property/deadline") uuid caret
  | "quote" ->
      set_props ~caret uuid "logseq.property.node/display-type"
        (W.Keyword "quote")
  | "math-block" ->
      set_props ~caret uuid "logseq.property.node/display-type"
        (W.Keyword "math")
  | "code-block" ->
      exit_to_props uuid
        [ Ops.set_block_property uuid "logseq.property.node/display-type"
            (W.Keyword "code") ]
  | "calculator" ->
      prop_batch ~caret uuid
        [ Ops.set_block_property uuid "logseq.property.node/display-type"
            (W.Keyword "code")
        ; Ops.set_block_property uuid "logseq.property.code/lang"
            (W.String "calc") ]
  | "normal-text" | "clear-heading" ->
      prop_batch ~caret uuid
        [ Ops.remove_block_property uuid "logseq.property/heading" ]
  | "number-list" -> toggle_own_list uuid caret
  | "number-children" -> toggle_children_list uuid caret
  | "query" | "advanced-query" ->
      (* cljs run-query-command! tags the block Query + opens the query
         view; a {{query }} title produces the same surface *)
      let nv, _ =
        replace_range uuid caret caret "{{query }}"
      in
      Ops.schedule_save uuid nv;
      A.exit_edit ~select:false
  | "add-property" -> Properties_dialog.open_for_block uuid
  | _ ->
      if starts command "heading:" then
        match
          int_of_string_opt
            (String.sub command 8 (String.length command - 8))
        with
        | Some n when n >= 1 && n <= 6 ->
            set_props ~caret uuid "logseq.property/heading" (W.Int n)
        | _ -> ()
      else if starts command "status:" then
        set_closed_prop ~caret uuid "logseq.property/status"
          (String.sub command 7 (String.length command - 7))
      else if starts command "priority:" then (
        let s = String.sub command 9 (String.length command - 9) in
        if s = "" then
          set_props ~caret uuid "logseq.property/priority"
            (W.Keyword "logseq.property/empty-placeholder")
        else
          set_closed_prop ~caret uuid "logseq.property/priority" s)
      else ignore (Editor_cmds.run ~command ~block:None ~value:None)

let on_command (ev : Ui_services.ev) =
  if S.ready () then
    match detail_str ev "command" with
    | None -> ()
    | Some command -> (
        match detail_str ev "block" with
        | Some uuid -> (
            (* deadline/scheduled on a non-editing block (the `p d`
               chord) open the calendar anchored at the block row;
               everything else is a context-menu command Editor_cmds
               owns *)
            match command with
            | "deadline" ->
                open_cal (Cal_prop "logseq.property/deadline") uuid 0
            | "scheduled" ->
                open_cal (Cal_prop "logseq.property/scheduled") uuid 0
            (* cljs :editor/new-property {:property-key k} — p s/p p/p t
               land in that property's value editor *)
            | "add-property" ->
                Properties_dialog.open_for_block uuid
            | "add-property-status" ->
                Properties_dialog.open_for_block_with_property
                  ~uuids:[ uuid ] uuid
                  ~ident:"logseq.property/status"
            | "add-property-priority" ->
                Properties_dialog.open_for_block_with_property
                  ~uuids:[ uuid ] uuid
                  ~ident:"logseq.property/priority"
            | "set-tags" ->
                Properties_dialog.open_for_block_with_property
                  ~uuids:[ uuid ] uuid ~ident:"block/tags"
            | "set-icon" | "add-reaction" ->
                (* the pickers live in the popups layer — editor modules
                   cannot reach icon_picker without a module cycle *)
                Ui_services.dom_dispatch_json "ls:block-picker"
                  (Json.Object
                     [ "block", Json.String uuid
                     ; ( "kind"
                       , Json.String
                           (if command = "add-reaction" then "emoji"
                            else "icon") ) ])
            | _ ->
                ignore
                  (Editor_cmds.run ~command ~block:(Some uuid)
                     ~value:(detail_str ev "value")))
        | None -> (
            match S.editing () with
            | None ->
                ignore
                  (Editor_cmds.run ~command ~block:None
                     ~value:(detail_str ev "value"))
            | Some e ->
                let from =
                  Option.value (detail_int ev "from") ~default:0
                in
                let to_ = Option.value (detail_int ev "to") ~default:from in
                run_editor_cmd e.uuid command from to_))

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    (* the host adapter supplies clipboard, dispatch, file-pick and
       plugin capabilities — installed once with the dispatcher *)
    Editor_cmds.install_host (Editor_cmds_host.host ());
    Ui_services.dom_on_document_event ~capture:true "ls:editor-command"
      on_command;
    Code_mirror.install ()
  end
