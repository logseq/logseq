(* Slash/context command consumer. popups_state dispatches
   `ls:editor-command` CustomEvents with {command, from, to} (the slash
   trigger range inside the editing model) or {command, block, value}
   (context-menu rows on unedited blocks). Side effects beyond a text
   splice live here: property writes (heading/status/priority/
   display-type/order-list), the inline calendar (#date-time-picker,
   cljs components/date-picker), the link/image-link form
   (.ls-editor-link-form, cljs components/link), and the popup key
   router consulted by editor_keys while a popup is open. *)

open Promise_ext
module S = Editor_state
module D = Web_dom
module A = Editor_actions
module Ops = Outliner_ops
module W = Wire

(* ---------- event detail ---------- *)

let detail_json ev name =
  match D.ev_detail ev with
  | Some j -> (
      match Js.Json.decodeObject j with
      | Some o -> Js.Dict.get o name
      | None -> None)
  | None -> None

let detail_str ev name =
  Option.bind (detail_json ev name) Js.Json.decodeString

let detail_int ev name =
  Option.map int_of_float
    (Option.bind (detail_json ev name) Js.Json.decodeNumber)

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
     Ops.apply_and_refresh_deferred (sop :: ops))

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

let month_names =
  [| "January"; "February"; "March"; "April"; "May"; "June"; "July"
   ; "August"; "September"; "October"; "November"; "December" |]

type popup_kind =
  | Cal_insert (* "date picker": Enter writes [[journal]] at the slash range *)
  | Cal_prop of string (* scheduled/deadline: Enter sets a datetime prop *)
  | Link_form of bool (* link/image-link form; bool = image *)

(* cljs repeat-setting panel state — resolved async from the worker and
   rendered as the right column of the date picker for datetime
   properties (scheduled/deadline) *)
type repeat =
  { prop_id : int (* db/id of the Cal_prop property entity *)
  ; mutable repeated : bool
  ; mutable freq : int
  ; mutable unit_id : int (* selected recur-unit choice db/id *)
  ; unit_choices : (int * string * string) list (* db/id, ident, label *)
  ; mutable rtype_id : int
  ; rtype_choices : (int * string * string) list
  ; mutable when_id : int (* selected checked-property entity db/id *)
  ; when_choices : (int * string * string) list (* db/id, label, done label *)
  }

type popup =
  { kind : popup_kind
  ; uuid : string
  ; from : int (* caret position the cleared slash range ended at *)
  ; root : D.el
  ; mutable cy : int
  ; mutable cm : int
  ; mutable cd : int
  ; mutable hour : int (* time-of-day for datetime commits, local time *)
  ; mutable tmin : int
  ; mutable menu : D.el option
  ; mutable rpt : repeat option
  ; link_url : D.el option
  ; link_label : D.el option
  }

let active : popup option ref = ref None

let days_in_month y m =
  int_of_float
    (Js.Date.getDate
       (Js.Date.make ~year:(float_of_int y)
          ~month:(float_of_int m) ~date:0. ()))

(* LOCAL time — cljs merges the time input via .setHours into the
   calendar day before tc/to-long, so the stored ms is the local
   datetime (getTime), never UTC-midnight day math *)
let day_date p =
  Js.Date.make ~year:(float_of_int p.cy)
    ~month:(float_of_int (p.cm - 1)) ~date:(float_of_int p.cd)
    ~hours:(float_of_int p.hour) ~minutes:(float_of_int p.tmin) ()

let focus_day p =
  match D.el_query p.root "td[data-focused='true'] button" with
  | Some b -> D.el_focus b
  | None -> ()

let close_popup ?focus_caret p =
  D.el_remove p.root;
  active := None;
  Runtime.editor_popup_root := None;
  match focus_caret with
  | Some c ->
      Editor_sink.focus_input p.uuid;
      A.set_caret p.uuid c
  | None -> ()

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
        Ops.set_block_property p.uuid ident (W.Float (Js.Date.getTime d))
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
   carries tabindex=0/data-selected, today carries data-today *)
let rec cal_cell p d =
  let focused = d = p.cd in
  let is_today =
    p.cy * 10000 + p.cm * 100 + d = Dates.today_journal_day ()
  in
  let btn =
    D.h ~tag:"button" ~cls:"ui__calendar-day"
      ~attrs:
        ([ ("type", "button")
         ; ("aria-label", string_of_int d)
         ; ("tabindex", if focused then "0" else "-1") ]
         @ (if focused then [ ("data-selected", "true") ] else [])
         @ if is_today then [ ("data-today", "true") ] else [])
      ~text:(string_of_int d) ()
  in
  D.el_on btn "click" (fun _ -> pick_day p p.cy p.cm d);
  D.h ~tag:"td" ~cls:"ui__calendar-cell"
    ~attrs:
      ([ ("role", "gridcell") ]
       @ (if focused
          then [ ("data-focused", "true"); ("aria-selected", "true") ]
          else [])
       @ if is_today then [ ("data-today", "true") ] else [])
    ~children:[ btn ] ()

(* dimmed prev/next-month day (cljs DayPicker showOutsideDays); y/m is
   the neighboring month it belongs to *)
and out_cell p y m d =
  let btn =
    D.h ~tag:"button" ~cls:"ui__calendar-day ls-cal-outside"
      ~attrs:
        [ ("type", "button"); ("aria-label", string_of_int d)
        ; ("tabindex", "-1") ]
      ~text:(string_of_int d) ()
  in
  D.el_on btn "click" (fun _ -> pick_day p y m d);
  D.h ~tag:"td" ~cls:"ui__calendar-cell" ~attrs:[ ("role", "gridcell") ]
    ~children:[ btn ] ()

and rebuild_grid p =
  match D.el_query p.root ".ui__calendar tbody" with
  | None -> ()
  | Some tbody ->
      D.el_replace_children tbody;
      let days = days_in_month p.cy p.cm in
      let lead =
        int_of_float
          (Js.Date.getDay
             (Js.Date.make ~year:(float_of_int p.cy)
                ~month:(float_of_int (p.cm - 1)) ~date:1. ()))
      in
      let py, pm =
        if p.cm = 1 then (p.cy - 1, 12) else (p.cy, p.cm - 1)
      in
      let pdays = days_in_month py pm in
      let ny, nm =
        if p.cm = 12 then (p.cy + 1, 1) else (p.cy, p.cm + 1)
      in
      let rows = (lead + days + 6) / 7 in
      for r = 0 to rows - 1 do
        let tr = Web_dom.create_element "tr" in
        for c = 0 to 6 do
          let d = (r * 7) + c + 1 - lead in
          D.el_append_child tr
            (if d < 1 then out_cell p py pm (pdays + d)
             else if d > days then out_cell p ny nm (d - days)
             else cal_cell p d)
        done;
        D.el_append_child tbody tr
      done

and rebuild_cal p =
  (match D.el_query p.root ".ls-date-month-select" with
   | Some sel ->
       D.el_set_text_content sel month_names.(p.cm - 1)
   | None -> ());
  (match D.el_query p.root ".ls-date-year-input" with
   | Some inp -> D.el_set_value inp (string_of_int p.cy)
   | None -> ());
  rebuild_grid p;
  focus_day p

and nav_month p delta =
  let m = p.cm + delta in
  if m < 1 then (p.cm <- 12; p.cy <- p.cy - 1)
  else if m > 12 then (p.cm <- 1; p.cy <- p.cy + 1)
  else p.cm <- m;
  rebuild_cal p

(* click a calendar day: Cal_insert commits; scheduled/deadline keep the
   popup open with the new day focused *)
and pick_day p y m d =
  p.cy <- y;
  p.cm <- m;
  p.cd <- d;
  commit_cal p;
  match p.kind with
  | Cal_prop _ -> rebuild_cal p
  | _ -> ()

let close_menu p =
  match p.menu with
  | Some m -> D.el_remove m; p.menu <- None
  | None -> ()

(* cljs ui.cljs month select: label + [role=menu] of long month names *)
let toggle_month_menu p =
  match p.menu with
  | Some _ -> close_menu p
  | None ->
      let menu =
        D.h ~cls:"ls-date-month-menu" ~attrs:[ ("role", "menu") ]
          ~children:
            (List.mapi
               (fun i name ->
                 D.h ~cls:"ls-date-month-option" ~text:name
                   ~attrs:[ ("role", "menuitem") ]
                   ~on_click:(fun _ ->
                     p.cm <- i + 1;
                     close_menu p;
                     rebuild_cal p)
                   ())
               (Array.to_list month_names))
          ()
      in
      p.menu <- Some menu;
      D.el_append_child p.root menu

let cal_move p delta =
  p.cd <- p.cd + delta;
  if p.cd < 1 then (
    p.cm <- p.cm - 1;
    if p.cm < 1 then (p.cm <- 12; p.cy <- p.cy - 1);
    p.cd <- p.cd + days_in_month p.cy p.cm)
  else if p.cd > days_in_month p.cy p.cm then (
    p.cd <- p.cd - days_in_month p.cy p.cm;
    p.cm <- p.cm + 1;
    if p.cm > 12 then (p.cm <- 1; p.cy <- p.cy + 1));
  rebuild_cal p

(* cljs nld-parse covers natural language; here a plain JS Date parse
   handles ISO / "Sep 30, 2026" style input, else the warning toast *)
let parse_nlp_date s =
  let d = Js.Date.fromString s in
  if Float.is_nan (Js.Date.getTime d) then None else Some d

let nlp_commit p input =
  let v = String.trim (D.el_value input) in
  if v <> "" then
    match parse_nlp_date v with
    | Some d ->
        p.cy <- int_of_float (Js.Date.getFullYear d);
        p.cm <- int_of_float (Js.Date.getMonth d) + 1;
        p.cd <- int_of_float (Js.Date.getDate d);
        commit_cal p
    | None ->
        Toast.warning (I18n.tf "date/invalid-date-warning" [ v ])

(* cljs open-editor-popup! anchors at the caret mirror span; a popup
   opened on a selected (non-editing) block — the `p d` chord — anchors
   under the block row instead *)
let cal_pos_style ?top uuid =
  match Editor_sink.popup_pos uuid with
  | Some (x, y, _) ->
      Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:900"
        x (Option.value top ~default:y)
  | None -> (
      match D.query_selector (".ls-block[blockid='" ^ uuid ^ "']") with
      | Some blk ->
          let r = D.el_bounding_rect blk in
          Printf.sprintf
            "position:fixed;left:%.0fpx;top:%.0fpx;z-index:900"
            (D.rect_left r +. 24.)
            (Option.value top ~default:(D.rect_bottom r +. 4.))
      | None -> "position:fixed;top:96px;left:240px;z-index:900")

(* (left, top, right, bottom) viewport rect the picker anchors against —
   the editing container while mounted, else the block row *)
let cal_anchor_rect uuid =
  match Editor_sink.container_rect uuid with
  | Some r -> Some r
  | None -> (
      match D.query_selector (".ls-block[blockid='" ^ uuid ^ "']") with
      | Some blk ->
          let r = D.el_bounding_rect blk in
          Some
            ( D.rect_left r
            , D.rect_top r
            , D.rect_right r
            , D.rect_bottom r )
      | None -> None)

(* base-ui avoidCollisions: once mounted, flip the picker above the
   anchor when it overflows the viewport bottom and there is more room
   above; otherwise clamp its top inside the viewport *)
let cal_clamp_in_view uuid root =
  match cal_anchor_rect uuid with
  | Some (_, tr_top, _, tr_bottom) ->
      let h = D.rect_height (D.el_bounding_rect root) in
      let vh = D.win_inner_height in
      let below = vh -. tr_bottom -. 4. in
      let above = tr_top -. 4. in
      if h > below then (
        let top =
          if above > below then tr_top -. 4. -. h
          else Float.max 4.0 (vh -. 4. -. h)
        in
        D.el_set_attr root "style" (cal_pos_style ~top uuid))
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

(* a button + anchored [role=menu] like the month select, reused for the
   repeat selects (unit / repeat-type / when) *)
let open_choice_menu p anchor items =
  close_menu p;
  let ar = D.el_bounding_rect anchor and rr = D.el_bounding_rect p.root in
  let menu =
    D.h ~cls:"ls-date-month-menu ls-repeat-choice-menu"
      ~attrs:[ ("role", "menu") ]
      ~children:
        (List.map
           (fun (label, pick) ->
             D.h ~cls:"ls-date-month-option" ~text:label
               ~attrs:[ ("role", "menuitem") ]
               ~on_click:(fun _ ->
                 close_menu p;
                 pick ())
               ())
           items)
      ()
  in
  D.el_set_attr menu "style"
    (Printf.sprintf "position:absolute;left:%.0fpx;top:%.0fpx"
       (D.rect_left ar -. D.rect_left rr)
       (D.rect_bottom ar -. D.rect_top rr));
  p.menu <- Some menu;
  D.el_append_child p.root menu

(* select widget: a ghost button whose label is the current choice;
   picking a menu item updates the label and runs on_pick *)
let repeat_select p ~current ~options ~on_pick =
  let lbl = D.h ~tag:"span" ~text:current () in
  let btn =
    D.h ~tag:"button" ~cls:"ls-repeat-select"
      ~attrs:[ ("type", "button") ]
      ~children:[ lbl; D.icon "chevron-down" ] ()
  in
  D.el_on btn "click" (fun _ ->
      open_choice_menu p btn
        (List.map
           (fun (id, label) ->
             ( label
             , fun () ->
                 D.el_set_text_content lbl label;
                 on_pick id label ))
           options));
  btn

let done_label_of (r : repeat) =
  match
    List.find_map
      (fun (id, _label, done_label) ->
        if id = r.when_id then Some done_label else None)
      r.when_choices
  with
  | Some l -> l
  | None -> ""

let rec render_repeat p (r : repeat) =
  let mark =
    D.h ~tag:"span" 
      ~text:(if r.repeated then "✓" else "")
      ()
  in
  let box =
    D.h ~tag:"button" ~cls:"jtrigger ls-repeat-checkbox"
      ~attrs:
        [ ("type", "button"); ("role", "checkbox")
        ; ("aria-checked", string_of_bool r.repeated)
        ; ("aria-label", I18n.t "property.built-in/repeat-repeated") ]
      ~children:[ mark ] ()
  in
  if r.repeated then D.el_set_attr box "data-checked" "true";
  D.el_on box "click" (fun _ ->
      let on = not r.repeated in
      r.repeated <- on;
      D.el_set_attr box "aria-checked" (string_of_bool on);
      D.el_set_text_content mark (if on then "✓" else "");
      if on then D.el_set_attr box "data-checked" "true"
      else D.el_remove_attr box "data-checked";
      apply_props p
        ([ Ops.set_block_property p.uuid
             "logseq.property.repeat/repeated?" (W.Bool on) ]
         @
         if on then
           [ Ops.set_block_property p.uuid
               "logseq.property.repeat/temporal-property"
               (W.Int r.prop_id) ]
         else
           [ Ops.remove_block_property p.uuid
               "logseq.property.repeat/temporal-property" ]));
  let freq_inp =
    D.h ~tag:"input" ~cls:"ls-repeat-frequency-input"
      ~attrs:
        [ ("type", "number"); ("min", "1"); ("step", "1")
        ; ("value", string_of_int r.freq) ]
      ()
  in
  let commit_freq () =
    match int_of_string_opt (D.el_value freq_inp) with
    | Some n when n > 0 ->
        if n <> r.freq then (
          r.freq <- n;
          apply_props p
            [ Ops.set_block_property p.uuid
                "logseq.property.repeat/recur-frequency" (W.Int n) ])
    | _ -> D.el_set_value freq_inp (string_of_int r.freq)
  in
  D.el_on freq_inp "blur" (fun _ -> commit_freq ());
  D.el_on freq_inp "keydown" (fun ev ->
      if D.ev_key ev = "Enter" then (
        D.ev_prevent_default ev;
        D.el_blur freq_inp));
  let label_of choices id =
    match
      List.find_map
        (fun (cid, _i, l) -> if cid = id then Some l else None)
        choices
    with
    | Some l -> l
    | None -> ""
  in
  let unit_btn =
    repeat_select p ~current:(label_of r.unit_choices r.unit_id)
      ~options:(List.map (fun (id, _i, l) -> (id, l)) r.unit_choices)
      ~on_pick:(fun id _label ->
        if id <> r.unit_id then (
          r.unit_id <- id;
          apply_props p
            [ Ops.set_block_property p.uuid
                "logseq.property.repeat/recur-unit" (W.Int id) ]))
  in
  let rtype_btn =
    repeat_select p ~current:(label_of r.rtype_choices r.rtype_id)
      ~options:(List.map (fun (id, _i, l) -> (id, l)) r.rtype_choices)
      ~on_pick:(fun id _label ->
        if id <> r.rtype_id then (
          r.rtype_id <- id;
          apply_props p
            [ Ops.set_block_property p.uuid
                "logseq.property.repeat/repeat-type" (W.Int id) ]))
  in
  let done_lbl = D.h ~tag:"span" ~text:(done_label_of r) () in
  let when_btn =
    repeat_select p
      ~current:
        (match
           List.find_map
             (fun (id, l, _d) -> if id = r.when_id then Some l else None)
             r.when_choices
         with
         | Some l -> l
         | None -> "")
      ~options:(List.map (fun (id, l, _d) -> (id, l)) r.when_choices)
      ~on_pick:(fun id _label ->
        if id <> r.when_id then (
          r.when_id <- id;
          D.el_set_text_content done_lbl (done_label_of r);
          apply_props p
            [ Ops.set_block_property p.uuid
                "logseq.property.repeat/checked-property" (W.Int id) ]))
  in
  let panel =
    D.h ~cls:"ls-repeat-panel"
      ~children:
        [ D.h ~cls:"ls-repeat-head"
            ~children:
              [ box
              ; D.h ~tag:"span"
                  ~text:(I18n.t "property.repeat/task")
                  () ]
            ()
        ; D.h ~cls:"ls-repeat-frequency"
            ~children:
              [ D.h ~tag:"label" ~cls:"ls-repeat-label"
                  ~text:(I18n.t "property.repeat/every") ()
              ; freq_inp; unit_btn ]
            ()
        ; D.h ~cls:"ls-repeat-next"
            ~children:
              [ D.h ~tag:"div" ~cls:"ls-repeat-label"
                  ~text:(I18n.t "property.repeat/next-date") ()
              ; rtype_btn ]
            ()
        ; D.h ~cls:"ls-repeat-when"
            ~children:
              [ D.h ~tag:"div" ~cls:"ls-repeat-label"
                  ~text:(I18n.t "property.repeat/when") ()
              ; when_btn
              ; D.h ~cls:"ls-repeat-is"
                  ~children:
                    [ D.h ~tag:"span" ~cls:"ls-repeat-label"
                        ~text:(I18n.t "property.repeat/is-label") ()
                    ; done_lbl ]
                  () ]
            () ]
      ()
  in
  match D.el_query p.root ".ls-property-date-picker" with
  | Some wrap ->
      D.el_append_child wrap panel;
      cal_clamp_in_view p.uuid p.root;
      cal_clamp_x p
  | None -> ()

(* resolve the block's repeat props + choice lists, then append the
   repeat panel. Writes happen lazily on toggle, mirroring cljs *)
and load_repeat p ident =
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
      | Some ap when ap == p && ap.rpt = None ->
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
                   let d = Js.Date.fromFloat ms in
                   p.hour <- int_of_float (Js.Date.getHours d);
                   p.tmin <- int_of_float (Js.Date.getMinutes d);
                   (match D.el_query p.root "input[type='time']"
                    with
                    | Some inp ->
                        D.el_set_value inp
                          (Printf.sprintf "%02d:%02d" p.hour p.tmin)
                    | None -> ())
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
          p.rpt <- Some r;
          render_repeat p r;
          Js.Promise.resolve ()
      | _ -> Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("load_repeat failed", e);
            Js.Promise.resolve ()))

(* cljs base-ui avoidCollisions for the horizontal axis too: the
   two-column picker can overflow the right edge — shift it left
   inside the viewport *)
and cal_clamp_x p =
  let r = D.el_bounding_rect p.root in
  let vw = D.win_inner_width in
  if D.rect_left r +. D.rect_width r > vw -. 8. then (
    let left = Float.max 8. (vw -. 8. -. D.rect_width r) in
    let top = D.rect_top r in
    let styled = cal_pos_style ~top p.uuid in
    let parts = String.split_on_char ';' styled in
    let parts =
      List.map
        (fun kv ->
          if String.starts_with ~prefix:"left:" kv then
            Printf.sprintf "left:%.0fpx" left
          else kv)
        parts
    in
    D.el_set_attr p.root "style" (String.concat ";" parts))

let open_cal kind uuid from =
  let today = Dates.date_now () in
  let cy = int_of_float (Js.Date.getFullYear today)
  and cm = int_of_float (Js.Date.getMonth today) + 1
  and cd = int_of_float (Js.Date.getDate today) in
  let tbody = D.h ~tag:"tbody" () in
  let sel =
    D.h ~tag:"button" ~cls:"ls-date-month-select"
      ~attrs:[ ("type", "button") ]
      ~text:month_names.(cm - 1) ()
  in
  let year_inp =
    D.h ~tag:"input" ~cls:"ls-date-year-input"
      ~attrs:
        [ ("type", "number"); ("min", "1"); ("max", "9999")
        ; ("value", string_of_int cy) ]
      ()
  in
  let nlp_inp =
    D.h ~tag:"input" ~cls:"ls-date-nlp"
      ~attrs:
        [ ("type", "text")
        ; ("placeholder", I18n.t "ui/date-natural-language-placeholder")
        ; ("tabindex", "-1") ]
      ()
  in
  (* cljs nlp-calendar datetime? branch: time-picker input + ghost
     "Use current time" button between the calendar and the NLP input *)
  let time_inp, time_row =
    match kind with
    | Cal_prop _ ->
        let inp =
          D.h ~tag:"input" ~cls:"ls-time-input"
            ~attrs:
              [ ("type", "time"); ("id", "time-picker")
              ; ("value", "00:00") ]
            ()
        in
        let now_btn =
          D.h ~tag:"button" ~cls:"ls-time-now"
            ~attrs:[ ("type", "button") ]
            ~text:(I18n.t "ui/use-current-time") ()
        in
        ( Some inp
        , Some
            (D.h ~cls:"ls-time-picker" ~children:[ inp; now_btn ] ()) )
    | _ -> (None, None)
  in
  let root =
    D.h
      ~cls:
        ("ls-editor-date-picker"
         ^ (match kind with
            | Cal_prop _ -> " ls-cal-prop"
            | _ -> ""))
      ~attrs:
        [ ("id", "date-time-picker"); ("style", cal_pos_style uuid) ]
      ~children:
        [ D.h ~cls:"ls-property-date-picker"
            ~children:
              [ D.h 
                  ~children:
                    ([ D.h ~cls:"ui__calendar"
                        ~children:
                          [ D.h ~cls:"ls-cal-head"
                              ~children:
                                [ D.h ~cls:"ls-cal-selects"
                                    ~children:[ sel; year_inp ] ()
                                ; D.h ~cls:"ls-cal-nav"
                                    ~children:
                                      [ D.h ~tag:"button"
                                          ~cls:"ls-cal-nav-btn"
                                          ~attrs:
                                            [ ("type", "button")
                                            ; ( "aria-label"
                                              , "Previous month" ) ]
                                          ~children:
                                            [ D.icon "chevron-left" ]
                                          ()
                                      ; D.h ~tag:"button"
                                          ~cls:"ls-cal-nav-btn"
                                          ~attrs:
                                            [ ("type", "button")
                                            ; ( "aria-label"
                                              , "Next month" ) ]
                                          ~children:
                                            [ D.icon "chevron-right" ]
                                          () ]
                                    () ]
                              ()
                          ; D.h ~tag:"table" ~attrs:[ ("role", "grid") ]
                              ~children:[ tbody ] () ]
                        ()
                     ]
                     @ (match time_row with
                        | Some t -> [ t ]
                        | None -> [])
                     @ [ nlp_inp ])
                  () ]
            () ]
      ()
  in
  let p =
    { kind; uuid; from; root; cy; cm; cd; hour = 0; tmin = 0
    ; menu = None; rpt = None; link_url = None; link_label = None }
  in
  (match time_inp with
   | Some inp ->
       let commit_time () =
         match String.split_on_char ':' (D.el_value inp) with
         | [ h; m ] -> (
             match (int_of_string_opt h, int_of_string_opt m) with
             | Some h, Some m when h >= 0 && h < 24 && m >= 0 && m < 60 ->
                 p.hour <- h;
                 p.tmin <- m;
                 commit_cal p
             | _ -> ())
         | _ -> ()
       in
       D.el_on inp "change" (fun _ -> commit_time ());
       D.el_on inp "blur" (fun _ -> commit_time ());
       let now_btn =
         D.el_query root ".ls-time-now"
       in
       (match now_btn with
        | Some b ->
            D.el_on b "click" (fun _ ->
                let now = Dates.date_now () in
                p.hour <- int_of_float (Js.Date.getHours now);
                p.tmin <- int_of_float (Js.Date.getMinutes now);
                D.el_set_value inp
                  (Printf.sprintf "%02d:%02d" p.hour p.tmin);
                commit_cal p)
        | None -> ())
   | None -> ());
  D.el_on sel "click" (fun _ -> toggle_month_menu p);
  D.el_on year_inp "input" (fun _ ->
      match int_of_string_opt (D.el_value year_inp) with
      | Some y when y >= 1000 && y <= 9999 -> p.cy <- y; rebuild_cal p
      | _ -> ());
  D.el_on nlp_inp "keydown" (fun ev ->
      if D.ev_key ev = "Enter" then (
        D.ev_prevent_default ev;
        nlp_commit p nlp_inp));
  (match D.el_query root "button[aria-label='Previous month']" with
   | Some b -> D.el_on b "click" (fun _ -> nav_month p (-1))
   | None -> ());
  (match D.el_query root "button[aria-label='Next month']" with
   | Some b -> D.el_on b "click" (fun _ -> nav_month p 1)
   | None -> ());
  D.el_append_child D.document_body root;
  active := Some p;
  Runtime.editor_popup_root := Some p.root;
  rebuild_grid p;
  cal_clamp_in_view uuid root;
  (match kind with
   | Cal_prop ident -> load_repeat p ident
   | _ -> ());
  focus_day p

(* ---------- link / image-link form ---------- *)

let open_link_form image uuid from =
  let url_inp =
    D.h ~tag:"input" 
      ~attrs:
        [ ("type", "text")
        ; ("placeholder", I18n.t "ui/link") ]
      ()
  in
  let label_inp =
    D.h ~tag:"input" 
      ~attrs:[ ("type", "text"); ("placeholder", I18n.t "ui/label") ] ()
  in
  let root =
    D.h ~cls:"ls-editor-link-form"
      ~attrs:
        [ ("style"
          , cal_pos_style uuid
            ^ ";display:flex;flex-direction:column;gap:4px;padding:8px;\
               background:var(--lx-popover-bg,#fff)") ]
      ~children:[ url_inp; label_inp ] ()
  in
  let p =
    { kind = Link_form image; uuid; from; root; cy = 0; cm = 0; cd = 0
    ; hour = 0; tmin = 0; menu = None; rpt = None
    ; link_url = Some url_inp; link_label = Some label_inp }
  in
  D.el_append_child D.document_body root;
  active := Some p;
  Runtime.editor_popup_root := Some p.root;
  D.el_focus url_inp

let submit_link p =
  let url =
    match p.link_url with
    | Some i -> String.trim (D.el_value i)
    | None -> ""
  in
  let label =
    match p.link_label with
    | Some i -> String.trim (D.el_value i)
    | None -> ""
  in
  let label = if label = "" then url else label in
  let bang = (match p.kind with Link_form true -> "!" | _ -> "") in
  let nv, caret =
    insert_at_trigger p
      (bang ^ "[" ^ label ^ "](" ^ url ^ ")")
  in
  Ops.schedule_save p.uuid nv;
  close_popup p ~focus_caret:caret

(* ---------- popup key router (runs before editor_keys) ---------- *)

let popup_key ev =
  match !active with
  | None -> false
  | Some p -> (
      match (p.kind, D.ev_key ev) with
      | (Cal_insert | Cal_prop _), "ArrowRight" -> cal_move p 1; true
      | (Cal_insert | Cal_prop _), "ArrowLeft" -> cal_move p (-1); true
      | (Cal_insert | Cal_prop _), "ArrowDown" -> cal_move p 7; true
      | (Cal_insert | Cal_prop _), "ArrowUp" -> cal_move p (-7); true
      | (Cal_insert | Cal_prop _), "Enter" ->
          D.ev_prevent_default ev;
          commit_cal p; true
      | Link_form _, "Enter" ->
          D.ev_prevent_default ev;
          submit_link p; true
      | _, "Escape" ->
          D.ev_prevent_default ev;
          close_popup p ~focus_caret:p.from; true
      | Link_form _, _ -> false (* inputs handle their own keys *)
      | (Cal_insert | Cal_prop _), _ -> (
          (* swallow keys aimed at the calendar so e.g. typing does not
             reach the textarea while a day button is focused *)
          match D.closest_sel "#date-time-picker" (D.ev_target ev) with
          | Some _ -> D.ev_prevent_default ev; true
          | None -> false))

(* click_guard: true -> mousedown inside a popup, suppress blur-commit.
   A click outside closes the popup; the normal blur-commit still runs *)
let click_guard target =
  match !active with
  | None -> false
  | Some p -> (
      match
        D.closest_sel "#date-time-picker, .ls-editor-link-form" target
      with
      | Some _ -> true
      | None -> close_popup p; false)



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
          Platform.console_error
            ("no closed value for", title));
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("closed-prop failed", e);
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
      else Editor_cmds.run ~command ~block:None ~value:None

let on_command ev =
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
                Web_dom.dispatch_custom "ls:block-picker"
                  (Js.Json.object_
                     (Js.Dict.fromList
                        [ "block", Js.Json.string uuid
                        ; ( "kind"
                          , Js.Json.string
                              (if command = "add-reaction" then "emoji"
                               else "icon") ) ]))
            | _ ->
                Editor_cmds.run ~command ~block:(Some uuid)
                  ~value:(detail_str ev "value"))
        | None -> (
            match S.editing () with
            | None -> Editor_cmds.run ~command ~block:None
                        ~value:(detail_str ev "value")
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
    D.add_document_listener "ls:editor-command" on_command true;
    Code_mirror.install ()
  end
