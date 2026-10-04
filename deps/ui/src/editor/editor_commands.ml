(* Slash/context command consumer. popups_state dispatches
   `ls:editor-command` CustomEvents with {command, from, to} (the slash
   trigger range inside the editing textarea) or {command, block, value}
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
module V = Web_dom
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

(* splice [text] into the editing textarea over [from, to); returns the
   new buffer and the caret position after the inserted text *)
let replace_range uuid from to_ text =
  match D.textarea_of uuid with
  | Some el ->
      let v = D.el_value el in
      let n = String.length v in
      let f = max 0 (min from n) in
      let t = max f (min to_ n) in
      let nv =
        String.sub v 0 f ^ text ^ String.sub v t (n - t)
      in
      let caret = f + String.length text in
      D.el_set_value el nv;
      D.el_set_text_content el nv;
      D.el_set_selection_range el caret caret;
      A.sync_buffer uuid nv;
      (nv, caret)
  | None -> (A.live_buffer uuid, 0)

let clear_range uuid from to_ = snd (replace_range uuid from to_ "")

(* ---------- property batches ---------- *)

(* save the live buffer together with property writes, keeping the block
   in edit mode and the caret at [caret] after the refresh *)
let prop_batch ~caret uuid ops =
  let buf = A.live_buffer uuid in
  A.with_focus_after uuid caret
    (let* sop = Ops.save_block_parsed uuid buf in
     Ops.apply_and_refresh_deferred (sop :: ops))

(* same, but drop edit mode first (cljs :editor/exit — code blocks leave
   the textarea while the view re-renders the code surface), then focus
   the mounted CodeMirror via the pending-focus machinery (code_focus
   short-circuits the textarea path) *)
let exit_to_props uuid ops =
  let buf = A.live_buffer uuid in
  S.set (fun st -> { st with S.editing = None });
  A.with_focus_after uuid 0
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

type popup =
  { kind : popup_kind
  ; uuid : string
  ; from : int (* caret position the cleared slash range ended at *)
  ; root : D.el
  ; mutable cy : int
  ; mutable cm : int
  ; mutable cd : int
  ; mutable menu : D.el option
  ; link_url : D.el option
  ; link_label : D.el option
  }

let active : popup option ref = ref None

let days_in_month y m =
  int_of_float
    (Js.Date.getDate
       (Js.Date.make ~year:(float_of_int y)
          ~month:(float_of_int m) ~date:0. ()))

let day_date p =
  Js.Date.make ~year:(float_of_int p.cy)
    ~month:(float_of_int (p.cm - 1)) ~date:(float_of_int p.cd) ()

let focus_day p =
  match V.el_query p.root "td[data-focused='true'] button" with
  | Some b -> V.el_focus b
  | None -> ()

let close_popup ?focus_caret p =
  V.el_remove p.root;
  active := None;
  match focus_caret with
  | Some c -> (
      match D.textarea_of p.uuid with
      | Some el ->
          D.el_focus el;
          D.el_set_selection_range el c c
      | None -> ())
  | None -> ()

(* cljs Enter handler: "date picker" closes the popup and inserts
   [[journal]]; scheduled/deadline set the datetime property and keep
   the calendar open (still editing) *)
(* cljs commands/insert! — the trigger text stays in the buffer while
   the popup is open and the commit replaces the last "/" through the
   caret with the output ([[journal]] for date-picker, [l](u) for link) *)
let insert_at_trigger p text =
  let to_ =
    match D.textarea_of p.uuid with
    | Some el -> D.el_selection_start el
    | None -> p.from
  in
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
      prop_batch ~caret:p.from p.uuid
        [ Ops.set_block_property p.uuid ident
            (W.Float (Js.Date.getTime d)) ]
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
    V.h ~tag:"button" ~cls:"ui__calendar-day"
      ~attrs:
        ([ ("type", "button")
         ; ("aria-label", string_of_int d)
         ; ("tabindex", if focused then "0" else "-1") ]
         @ (if focused then [ ("data-selected", "true") ] else [])
         @ if is_today then [ ("data-today", "true") ] else [])
      ~text:(string_of_int d) ()
  in
  V.el_on btn "click" (fun _ -> pick_day p p.cy p.cm d);
  V.h ~tag:"td" ~cls:"ui__calendar-cell"
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
    V.h ~tag:"button" ~cls:"ui__calendar-day ls-cal-outside"
      ~attrs:
        [ ("type", "button"); ("aria-label", string_of_int d)
        ; ("tabindex", "-1") ]
      ~text:(string_of_int d) ()
  in
  V.el_on btn "click" (fun _ -> pick_day p y m d);
  V.h ~tag:"td" ~cls:"ui__calendar-cell" ~attrs:[ ("role", "gridcell") ]
    ~children:[ btn ] ()

and rebuild_grid p =
  match V.el_query p.root ".ui__calendar tbody" with
  | None -> ()
  | Some tbody ->
      V.el_replace_children tbody;
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
  (match V.el_query p.root ".ls-date-month-select" with
   | Some sel ->
       V.el_set_text_content sel month_names.(p.cm - 1)
   | None -> ());
  (match V.el_query p.root ".ls-date-year-input" with
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
  | Some m -> V.el_remove m; p.menu <- None
  | None -> ()

(* cljs ui.cljs month select: label + [role=menu] of long month names *)
let toggle_month_menu p =
  match p.menu with
  | Some _ -> close_menu p
  | None ->
      let menu =
        V.h ~cls:"ls-date-month-menu" ~attrs:[ ("role", "menu") ]
          ~children:
            (List.mapi
               (fun i name ->
                 V.h ~cls:"ls-date-month-option" ~text:name
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

(* cljs open-editor-popup! anchors at the caret mirror span *)
let cal_pos_style ?top uuid =
  match D.textarea_of uuid with
  | Some el ->
      let x, y, _ = Web_dom.caret_popup_pos (el) in
      Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:900"
        x (Option.value top ~default:y)
  | None -> "position:fixed;top:96px;left:240px;z-index:900"

(* base-ui avoidCollisions: once mounted, flip the picker above the
   anchor when it overflows the viewport bottom and there is more room
   above; otherwise clamp its top inside the viewport *)
let cal_clamp_in_view uuid root =
  match D.textarea_of uuid with
  | Some el ->
      let tr = V.el_bounding_rect el in
      let h = V.rect_height (V.el_bounding_rect root) in
      let vh = V.win_inner_height in
      let below = vh -. V.rect_bottom tr -. 4. in
      let above = V.rect_top tr -. 4. in
      if h > below then (
        let top =
          if above > below then V.rect_top tr -. 4. -. h
          else Float.max 4.0 (vh -. 4. -. h)
        in
        V.el_set_attr root "style" (cal_pos_style ~top uuid))
  | None -> ()
let open_cal kind uuid from =
  let today = Dates.date_now () in
  let cy = int_of_float (Js.Date.getFullYear today)
  and cm = int_of_float (Js.Date.getMonth today) + 1
  and cd = int_of_float (Js.Date.getDate today) in
  let tbody = V.h ~tag:"tbody" () in
  let sel =
    V.h ~tag:"button" ~cls:"ls-date-month-select"
      ~attrs:[ ("type", "button") ]
      ~text:month_names.(cm - 1) ()
  in
  let year_inp =
    V.h ~tag:"input" ~cls:"ls-date-year-input"
      ~attrs:
        [ ("type", "number"); ("min", "1"); ("max", "9999")
        ; ("value", string_of_int cy) ]
      ()
  in
  let nlp_inp =
    V.h ~tag:"input" ~cls:"ls-date-nlp"
      ~attrs:
        [ ("type", "text")
        ; ("placeholder", I18n.t "ui/date-natural-language-placeholder")
        ; ("tabindex", "-1") ]
      ()
  in
  let root =
    V.h ~cls:"ls-editor-date-picker"
      ~attrs:
        [ ("id", "date-time-picker"); ("style", cal_pos_style uuid) ]
      ~children:
        [ V.h ~cls:"ls-nlp-calendar"
            ~children:
              [ V.h ~cls:"ui__calendar"
                  ~children:
                    [ V.h ~cls:"ls-cal-head"
                        ~children:
                          [ V.h ~cls:"ls-cal-selects"
                              ~children:[ sel; year_inp ] ()
                          ; V.h ~cls:"ls-cal-nav"
                              ~children:
                                [ V.h ~tag:"button" ~cls:"ls-cal-nav-btn"
                                    ~attrs:
                                      [ ("type", "button")
                                      ; ("aria-label", "Previous month") ]
                                    ~children:[ V.icon "chevron-left" ] ()
                                ; V.h ~tag:"button" ~cls:"ls-cal-nav-btn"
                                    ~attrs:
                                      [ ("type", "button")
                                      ; ("aria-label", "Next month") ]
                                    ~children:[ V.icon "chevron-right" ] ()
                                ]
                              () ]
                        ()
                    ; V.h ~tag:"table" ~attrs:[ ("role", "grid") ]
                        ~children:[ tbody ] () ]
                  ()
              ; nlp_inp ]
            () ]
      ()
  in
  let p =
    { kind; uuid; from; root; cy; cm; cd; menu = None
    ; link_url = None; link_label = None }
  in
  V.el_on sel "click" (fun _ -> toggle_month_menu p);
  V.el_on year_inp "input" (fun _ ->
      match int_of_string_opt (D.el_value year_inp) with
      | Some y when y >= 1000 && y <= 9999 -> p.cy <- y; rebuild_cal p
      | _ -> ());
  V.el_on nlp_inp "keydown" (fun ev ->
      if D.ev_key ev = "Enter" then (
        D.ev_prevent_default ev;
        nlp_commit p nlp_inp));
  (match V.el_query root "button[aria-label='Previous month']" with
   | Some b -> V.el_on b "click" (fun _ -> nav_month p (-1))
   | None -> ());
  (match V.el_query root "button[aria-label='Next month']" with
   | Some b -> V.el_on b "click" (fun _ -> nav_month p 1)
   | None -> ());
  D.el_append_child V.document_body root;
  active := Some p;
  rebuild_grid p;
  cal_clamp_in_view uuid root;
  focus_day p

(* ---------- link / image-link form ---------- *)

let open_link_form image uuid from =
  let url_inp =
    V.h ~tag:"input" ~cls:"ls-link-url"
      ~attrs:
        [ ("type", "text")
        ; ("placeholder", I18n.t "editor/link-url-placeholder") ]
      ()
  in
  let label_inp =
    V.h ~tag:"input" ~cls:"ls-link-text"
      ~attrs:[ ("type", "text"); ("placeholder", I18n.t "editor/link-label-placeholder") ] ()
  in
  let root =
    V.h ~cls:"ls-editor-link-form"
      ~attrs:
        [ ("style"
          , cal_pos_style uuid
            ^ ";display:flex;flex-direction:column;gap:4px;padding:8px;\
               background:var(--lx-popover-bg,#fff)") ]
      ~children:[ url_inp; label_inp ] ()
  in
  let p =
    { kind = Link_form image; uuid; from; root; cy = 0; cm = 0; cd = 0
    ; menu = None; link_url = Some url_inp; link_label = Some label_inp }
  in
  D.el_append_child V.document_body root;
  active := Some p;
  D.el_focus url_inp

let submit_link p =
  let url =
    match p.link_url with
    | Some i -> String.trim (V.el_value i)
    | None -> ""
  in
  let label =
    match p.link_label with
    | Some i -> String.trim (V.el_value i)
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
  match !Runtime.current_repo with
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
  match !Runtime.current_repo with
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
          A.with_focus_after uuid caret
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
      if Str_util.starts_with command "heading:" then
        match
          int_of_string_opt
            (String.sub command 8 (String.length command - 8))
        with
        | Some n when n >= 1 && n <= 6 ->
            set_props ~caret uuid "logseq.property/heading" (W.Int n)
        | _ -> ()
      else if Str_util.starts_with command "status:" then
        set_closed_prop ~caret uuid "logseq.property/status"
          (String.sub command 7 (String.length command - 7))
      else if Str_util.starts_with command "priority:" then (
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
        | Some _ ->
            (* context-menu commands target a block by uuid — Editor_cmds
               owns them *)
            Editor_cmds.run ~command ~block:(detail_str ev "block")
              ~value:(detail_str ev "value")
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

let installed = State_cell.Once.make ()

let install () =
  State_cell.Once.run installed (fun () ->
      D.add_document_listener "ls:editor-command" on_command true;
      Code_mirror.install ())
