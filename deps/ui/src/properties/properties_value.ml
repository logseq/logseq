(* Property value cells + editors.

   Rendering contract (property.cljs value.cljs):
   - container: .property-value.property-value-panel-inner.flex.flex-1
   - text/url:  .property-block-container.content.w-full.jtrigger
                  > .block-title-wrap (empty value -> .ls-empty-text-property)
   - number:    .ls-number.flex.flex-1.jtrigger
   - checkbox:  button[role=checkbox][aria-checked][data-checked?]
   - date/datetime: .jtrigger text; click opens
                  .ls-property-date-picker.flex.flex-row.gap-2
   - node/closed-value: .jtrigger (with .block-title-wrap for refs);
                  click opens a .cp__select popup

   Writes: create-property-text-block / save-block for text & url,
   set-block-property for scalars and refs, remove-block-property /
   delete-property-value to clear. *)

open Editor_dom
open Properties_dom
module I18n = Properties_i18n
module D = Properties_data
module S = Properties_state
module W = Wire

(* The owner context a value cell is rendered for. *)
type ctx =
  { block_uuid : string
  ; block_id : int option
  ; refresh : unit -> unit
  ; is_page : bool
  ; class_schema : bool
  }

(* When the "add property" dialog creates a text/url value block it also
   marks the row for immediate editing — the next render shows the
   textarea already open (cljs enters block editing right away). *)
let pending_edit : (string * string) option ref = ref None

let set_pending_edit ~block_uuid ~ident =
  pending_edit := Some (block_uuid, ident)

let take_pending_edit ~block_uuid ~ident =
  match !pending_edit with
  | Some (u, i) when u = block_uuid && i = ident ->
      pending_edit := None;
      true
  | _ -> false

(* ---------- writes ---------- *)

let set_scalar ctx ~ident ~value =
  D.set_block_property ~block_uuid:ctx.block_uuid ~ident ~value
  |> ignore;
  S.refresh_all ()

(* text/url: create a value block (or update the existing one) *)
let save_text_value ctx row new_title =
  let ident = D.row_ident row |> Option.value ~default:"" in
  let value = D.row_value row in
  let title = String.trim new_title in
  if title = "" then (
    match D.ref_uuid value with
    | Some uuid ->
        D.delete_property_value ~block_uuid:ctx.block_uuid ~ident
          ~value:(W.Uuid uuid)
        |> ignore
    | None ->
        D.remove_block_property ~block_uuid:ctx.block_uuid ~ident
        |> ignore;
        S.refresh_all ())
  else
    match D.ref_uuid value with
    | Some uuid ->
        D.save_block ~uuid ~title |> ignore
    | None ->
        D.create_property_text_block ~block_uuid:ctx.block_uuid ~ident
          ~title ~new_block_id:(Platform.random_uuid ()) ()
        |> ignore;
        S.refresh_all ()

(* ---------- inline text/number editors ---------- *)

let commit_or_cancel ctx row input =
  let ident = D.row_ident row |> Option.value ~default:"" in
  match D.row_type row with
  | "number" -> (
      match Float.of_string_opt (String.trim (el_value input)) with
      | Some n -> set_scalar ctx ~ident ~value:(W.Float n)
      | None -> ())
  | _ -> save_text_value ctx row (el_value input);
  ctx.refresh ()

let edit_text_cell ctx row cell initial =
  el_clear cell;
  let wrap = mk ~cls:"editor-wrapper" "div" in
  let inner = mk ~cls:"editor-inner flex flex-1 block-editor" "div" in
  let ta = mk "textarea" in
  el_append_child inner ta;
  el_append_child wrap inner;
  el_append_child cell wrap;
  el_set_value ta initial;
  focus_end ta;
  let committed = ref false in
  let done_ save =
    if !committed then ()
    else (
      committed := true;
      if save then commit_or_cancel ctx row ta else ctx.refresh ())
  in
  el_listen ta "keydown"
    (fun ev ->
      match ev_key ev with
      | "Enter" ->
          prevent_default ev;
          stop_propagation ev;
          done_ true
      | "Escape" ->
          prevent_default ev;
          stop_propagation ev;
          done_ false
      | _ -> ())
    true;
  el_listen ta "blur" (fun _ -> done_ true) true

let text_cell ctx row =
  let value = D.row_value row in
  let cell =
    mk ~cls:"property-block-container content w-full jtrigger" "div"
      ~attrs:[ ("tabindex", "-1") ]
  in
  if not (D.value_empty_p value) then
    ignore (child_text "span" "block-title-wrap" (D.ref_title value) cell);
  on_click cell (fun _ ->
      edit_text_cell ctx row cell (D.ref_title value));
  cell

(* ---------- number ---------- *)

let number_cell ctx row =
  let value = D.row_value row in
  let cell = mk ~cls:"ls-number flex flex-1 jtrigger" "div" in
  if not (D.value_empty_p value) then
    el_set_text cell (D.value_display value);
  on_click cell (fun _ ->
      el_clear cell;
      let input =
        mk ~cls:"ls-number-input" "input" ~attrs:[ ("type", "number") ]
      in
      el_set_value input (D.value_display value);
      el_append_child cell input;
      focus_end input;
      let committed = ref false in
      let done_ save =
        if !committed then ()
        else (
          committed := true;
          if save then (
            let ident = D.row_ident row |> Option.value ~default:"" in
            match Float.of_string_opt (String.trim (el_value input)) with
            | Some n -> set_scalar ctx ~ident ~value:(W.Float n)
            | None -> ());
          ctx.refresh ())
      in
      el_listen input "keydown"
        (fun ev ->
          match ev_key ev with
          | "Enter" ->
              prevent_default ev;
              stop_propagation ev;
              done_ true
          | "Escape" ->
              prevent_default ev;
              stop_propagation ev;
              done_ false
          | _ -> ())
        true;
      el_listen input "blur" (fun _ -> done_ true) true);
  cell

(* ---------- checkbox ---------- *)

let checkbox_cell ctx row =
  let value = D.row_value row in
  let checked = match value with W.Bool b -> b | _ -> false in
  let btn =
    mk "button"
      ~attrs:
        [ ("role", "checkbox")
        ; ("aria-checked", string_of_bool checked)
        ; ("type", "button")
        ]
      ~cls:"jtrigger"
  in
  if checked then el_set_attr btn "data-checked" "true";
  on_click btn (fun _ ->
      let ident = D.row_ident row |> Option.value ~default:"" in
      set_scalar ctx ~ident ~value:(W.Bool (not checked)));
  btn

(* ---------- date / datetime ---------- *)

(* parses "YYYY-MM-DD" -> journal day int YYYYMMDD *)
let parse_date s =
  match String.split_on_char '-' (String.trim s) with
  | [ y; m; d ]
    when String.length y = 4 && String.length m = 2
         && String.length d = 2 -> (
      try Some (int_of_string (y ^ m ^ d)) with _ -> None)
  | _ -> None

external now_ms : unit -> float = "now" [@@mel.scope "Date"]
external parse_ms : string -> float = "parse" [@@mel.scope "Date"]

let today_day () =
  let d = Js.Date.make () in
  (int_of_float (Js.Date.getFullYear d) * 10000)
  + ((int_of_float (Js.Date.getMonth d) + 1) * 100)
  + int_of_float (Js.Date.getDate d)

let set_date ctx ident day =
  D.journal_page_by_day day
  |> Js.Promise.then_ (fun w ->
         (match D.geti w "db/id" with
          | Some id -> set_scalar ctx ~ident ~value:(W.Int id)
          | None -> ());
         Js.Promise.resolve ())
  |> ignore

let commit_date_input ctx ident ~is_datetime input =
  let v = String.trim (el_value input) in
  if is_datetime then
    let ms =
      if v = "" then now_ms () else parse_ms v
    in
    (* NaN parse -> no write *)
    if ms = ms then set_scalar ctx ~ident ~value:(W.Float ms)
  else
    let day = if v = "" then today_day () else Option.value (parse_date v) ~default:(-1) in
    if day > 0 then set_date ctx ident day

let date_picker ctx row anchor =
  let ident = D.row_ident row |> Option.value ~default:"" in
  let is_datetime = D.row_type row = "datetime" in
  let picker =
    mk ~cls:"ls-property-date-picker flex flex-row gap-2" "div"
  in
  let input =
    mk "input"
      ~attrs:[ ("type", if is_datetime then "datetime-local" else "date") ]
  in
  el_append_child picker input;
  (* prefill today like cljs initial-day so Enter commits immediately *)
  let day = today_day () in
  if not is_datetime then
    el_set_value input
      (Printf.sprintf "%04d-%02d-%02d"
         (day / 10000)
         (day mod 10000 / 100)
         (day mod 100));
  ignore
    (Properties_popup.open_anchored ~cls:"ui__popover-content" anchor
       picker);
  el_focus input;
  el_listen input "keydown"
    (fun ev ->
      match ev_key ev with
      | "Enter" ->
          prevent_default ev;
          commit_date_input ctx ident ~is_datetime input;
          S.pop_overlay ()
      | "Escape" ->
          prevent_default ev;
          stop_propagation ev;
          S.pop_overlay ()
      | _ -> ())
    true

(* ms epoch -> (y, m, d) *)
let ymd_of_ms ms =
  let d = Js.Date.fromFloat ms in
  ( int_of_float (Js.Date.getFullYear d)
  , int_of_float (Js.Date.getMonth d) + 1
  , int_of_float (Js.Date.getDate d) )

let ms_of_value = function
  | W.Float f -> Some f
  | W.Int64 i -> Some (Int64.to_float i)
  | W.Int i -> Some (float_of_int i)
  | _ -> None

(* datetime cell: .ls-datetime > span.inline-flex > a.page-ref "Today" —
   cljs datetime-value markup *)
let datetime_content cell ms =
  let y, m, d = ymd_of_ms ms in
  let title =
    Dates.journal_title_of
      (Js.Date.fromFloat
         (Js.Date.utc ~year:(float y) ~month:(float (m - 1))
            ~date:(float d) ()))
  in
  let wrap = mk ~cls:"ls-datetime flex flex-row gap-1 items-center" "div" in
  let inner = mk ~cls:"inline-flex" "span" in
  let a =
    mk ~cls:"page-ref" "a"
      ~attrs:
        [ ("data-ref", String.lowercase_ascii title); ("tabindex", "0") ]
  in
  el_set_text a (Render_inline.date_label y m d);
  el_append_child inner a;
  el_append_child wrap inner;
  el_append_child cell wrap

(* datetime values arrive as journal-page ref summaries — the day is
   block/journal-day (yyyymmdd); fall back to a raw ms number *)
let ms_of_datetime_value (v : W.t) : float option =
  match ms_of_value v with
  | Some ms -> Some ms
  | None -> (
      match W.get v "block/journal-day" with
      | Some (W.Int d) ->
          let y = d / 10000 and m = d mod 10000 / 100 and dd = d mod 100 in
          Some
            (Js.Date.utc ~year:(float y) ~month:(float (m - 1))
               ~date:(float dd) ())
      | _ -> None)

let date_cell ctx row =
  let value = D.row_value row in
  let cell = mk ~cls:"jtrigger flex flex-1" "div" in
  if not (D.value_empty_p value) then
    (match D.row_type row = "datetime", ms_of_datetime_value value with
     | true, Some ms -> datetime_content cell ms
     | _ -> el_set_text cell (D.value_display value));
  on_click cell (fun _ -> date_picker ctx row cell);
  cell

(* ---------- select popups (choices / node refs) ---------- *)

(* db/ids of the owner block's tags *)
let block_tag_ids ctx f =
  D.entity_by_uuid ctx.block_uuid
  |> Js.Promise.then_ (fun ent ->
         let tags =
           match D.getf (D.untag ent) "block/tags" with
           | Some w -> List.filter_map D.entity_id_of (D.elems w)
           | None -> []
         in
         f tags |> Js.Promise.resolve)
  |> ignore

(* choice db/ids excluded by any of the owner's tags *)
let gather_exclusions tag_ids f =
  let acc = ref [] in
  let rec go = function
    | [] -> f !acc
    | id :: rest ->
        D.entity (W.Int id)
        |> Js.Promise.then_ (fun ent ->
               (match D.getf (D.untag ent) "logseq.property/choice-exclusions" with
                | Some xs ->
                    acc :=
                      !acc @ List.filter_map D.entity_id_of (D.elems xs)
                | None -> ());
               go rest;
               Js.Promise.resolve ())
        |> ignore
  in
  go tag_ids

(* choice shown for owner? — scoped choices need a tag intersection;
   choices excluded on any of the owner's tags are hidden *)
let choice_visible choice tag_ids exclusions =
  let cid = D.entity_id_of choice in
  let scoped =
    match D.getf choice "logseq.property/choice-classes" with
    | Some w -> List.filter_map D.entity_id_of (D.elems w)
    | None -> []
  in
  let scoped_ok =
    scoped = [] || List.exists (fun t -> List.mem t tag_ids) scoped
  in
  let excluded =
    match cid with Some c -> List.mem c exclusions | None -> false
  in
  scoped_ok && not excluded

let open_select_popup _row items ~placeholder anchor
    ~(on_new : (string -> unit) option) =
  let sel, input =
    Properties_select.create ~placeholder ~new_option:on_new
      ~on_escape:(fun () -> S.pop_overlay ())
      items
  in
  ignore (Properties_popup.open_anchored anchor sel);
  el_focus input

let new_choice ctx row text =
  let ident = D.row_ident row |> Option.value ~default:"" in
  D.upsert_closed_value ~ident ~value:text ()
  |> Js.Promise.then_ (fun res ->
         (match D.geti res "db/id" with
          | Some id -> set_scalar ctx ~ident ~value:(W.Int id)
          | None -> ());
         S.pop_overlay ();
         Js.Promise.resolve ())
  |> ignore

(* icon id for a closed-choice value — the value's own
   logseq.property/icon map; "line-dashed" for the empty placeholder
   (cljs hardcodes it for empty closed-choice values) *)
let closed_value_icon_id value =
  match
    Option.bind (D.getf (D.untag value) "logseq.property/icon")
      (fun icon -> D.gets (D.untag icon) "id")
  with
  | Some id -> Some id
  | None -> (
      let is_empty_placeholder =
        match D.getk (D.untag value) "db/ident" with
        | Some "logseq.property/empty-placeholder" -> true
        | _ -> (
            match value with
            | W.Keyword "logseq.property/empty-placeholder" -> true
            | _ -> false)
      in
      if is_empty_placeholder then Some "line-dashed" else None)

let closed_value_cell ctx row anchor =
  let value = D.row_value row in
  let cell = mk ~cls:"jtrigger flex flex-1 w-full" "div" in
  (match closed_value_icon_id value with
   | Some id -> el_append_child cell (Views_dom.icon id)
   | None -> ());
  let txt = D.value_display value in
  let txt =
    if txt = "logseq.property/empty-placeholder" then "" else txt
  in
  if txt <> "" then ignore (child_text "span" "" txt cell);
  on_click cell (fun _ ->
      block_tag_ids ctx (fun tag_ids ->
          gather_exclusions tag_ids (fun exclusions ->
              let items =
                List.filter_map
                  (fun c ->
                    match choice_visible c tag_ids exclusions with
                    | false -> None
                    | true -> (
                        let title = D.ref_title c in
                        match D.entity_id_of c with
                        | Some id ->
                            Some
                              (Properties_select.item title (fun () ->
                                   let ident =
                                     D.row_ident row
                                     |> Option.value ~default:""
                                   in
                                   set_scalar ctx ~ident
                                     ~value:(W.Int id);
                                   S.pop_overlay ()))
                        | None -> None))
                  (D.row_closed_values row)
              in
              open_select_popup row items
                ~placeholder:
                  (I18n.t1 "property/set-placeholder" (D.row_title row))
                ~on_new:(Some (fun text -> new_choice ctx row text))
                anchor)));
  cell

let node_cell ctx row =
  let value = D.row_value row in
  let cell =
    mk
      ~cls:
        ("jtrigger flex flex-1"
        ^ if D.row_many row then " multi-values" else "")
      "div"
  in
  el_set_attr cell "tabindex" "0";
  List.iter
    (fun r ->
      ignore (child_text "span" "block-title-wrap" (D.ref_title r) cell))
    (D.value_elems value);
  let rec open_values () =
    D.property_values
      ~property_ident:(D.row_ident row |> Option.value ~default:"")
      ~block:(D.uuid_ref ctx.block_uuid)
    |> Js.Promise.then_ (fun w ->
           let items =
             List.filter_map
               (fun v ->
                 match D.entity_id_of v with
                 | Some id ->
                     Some
                       (Properties_select.item (D.ref_title v) (fun () ->
                            let ident =
                              D.row_ident row |> Option.value ~default:""
                            in
                            set_scalar ctx ~ident ~value:(W.Int id);
                            S.pop_overlay ()))
                 | None -> None)
               (D.elems w)
           in
           open_select_popup row items
             ~placeholder:
               (I18n.t1 "property/set-placeholder" (D.row_title row))
             ~on_new:(Some (new_node ctx row)) cell;
           Js.Promise.resolve ())
    |> ignore
  and new_node ctx row text =
    D.create_page text
    |> Js.Promise.then_ (fun res ->
           (match D.geti res "db/id" with
            | Some id ->
                let ident = D.row_ident row |> Option.value ~default:"" in
                set_scalar ctx ~ident ~value:(W.Int id)
            | None -> ());
           S.pop_overlay ();
           Js.Promise.resolve ())
    |> ignore
  in
  on_click cell (fun _ -> open_values ());
  el_listen cell "keydown"
    (fun ev ->
      match ev_key ev with
      | "Enter" ->
          prevent_default ev;
          open_values ()
      | _ -> ())
    true;
  cell

(* ---------- dispatch ---------- *)

let editing_cell ctx row inner =
  let cell =
    mk ~cls:"property-block-container content w-full" "div"
      ~attrs:[ ("tabindex", "-1") ]
  in
  el_append_child inner cell;
  edit_text_cell ctx row cell ""

let render ctx row =
  let inner =
    mk ~cls:"property-value property-value-panel-inner flex flex-1" "div"
  in
  let ident = D.row_ident row |> Option.value ~default:"" in
  if take_pending_edit ~block_uuid:ctx.block_uuid ~ident then
    editing_cell ctx row inner
  else (
    let value = D.row_value row in
    let ty = D.row_type row in
    let cell =
      if D.row_closed_values row <> [] then
        closed_value_cell ctx row inner
      else
        match ty with
        | "checkbox" -> checkbox_cell ctx row
        | "number" -> number_cell ctx row
        | "date" | "datetime" -> date_cell ctx row
        | "node" | "asset" -> node_cell ctx row
        | _ ->
            if D.value_empty_p value then (
              let empty =
                mk "div"
                  ~cls:
                    "w-full h-full jtrigger ls-empty-text-property \
                     text-muted-foreground"
                  ~attrs:[ ("tabindex", "0") ]
              in
              on_click empty (fun _ ->
                  let cell = text_cell ctx row in
                  el_clear inner;
                  el_append_child inner cell;
                  el_click cell);
              empty)
            else text_cell ctx row
    in
    el_append_child inner cell);
  inner
