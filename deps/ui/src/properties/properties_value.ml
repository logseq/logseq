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

open Promise_ext
open Editor_dom
open Properties_dom
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

(* The row whose inline editor is open and its in-progress buffer.
   Persists across refresh_all re-renders like cljs' edit-block state
   (cljs edits at most one block at a time); cleared on commit/cancel. *)
let active_editor : (string * string * string) option ref = ref None

let row_key ctx row =
  (ctx.block_uuid, D.row_ident row |> Option.value ~default:"")

let add_active_edit ctx row =
  let block_uuid, ident = row_key ctx row in
  active_editor := Some (block_uuid, ident, "")

let clear_active_edit ctx row =
  match !active_editor with
  | Some (buuid, ident, _) when (buuid, ident) = row_key ctx row ->
      active_editor := None
  | _ -> ()

let has_active_edit ctx row =
  match !active_editor with
  | Some (buuid, ident, _) -> (buuid, ident) = row_key ctx row
  | None -> false

let edit_buffer ctx row =
  match !active_editor with
  | Some (buuid, ident, buf) when (buuid, ident) = row_key ctx row -> buf
  | _ -> ""

let set_edit_buffer ctx row buf =
  match !active_editor with
  | Some (buuid, ident, _) when (buuid, ident) = row_key ctx row ->
      active_editor := Some (buuid, ident, buf)
  | _ -> ()

(* commit thunk of the currently open editor — bound inside
   edit_text_cell; editor_actions.enter_edit runs it via
   Editor_state.close_property_editor so a block editor opening commits
   the property editor (cljs single editing block) *)
let close_editor : (unit -> unit) ref = ref (fun () -> ())

let () = Editor_state.close_property_editor := fun () -> !close_editor ()

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

let commit_or_cancel ctx row value =
  let ident = D.row_ident row |> Option.value ~default:"" in
  match D.row_type row with
  | "number" -> (
      match Float.of_string_opt (String.trim value) with
      | Some n -> set_scalar ctx ~ident ~value:(W.Float n)
      | None -> ())
  | "string" | "json" ->
      (* non-ref scalar types: set/remove the raw string — no value
         block (cljs single-string-input) *)
      if String.trim value = "" then (
        D.remove_block_property ~block_uuid:ctx.block_uuid ~ident
        |> ignore;
        S.refresh_all ())
      else set_scalar ctx ~ident ~value:(W.String value)
  | _ -> save_text_value ctx row value;
  ctx.refresh ()

(* [steal] marks user-initiated opens (cell click): entering the
   property editor exits block editing and takes focus, matching cljs'
   single editing surface. Render-path opens (pending_edit after the
   dialog commits, refresh re-renders) must not hijack focus or commit
   the outliner — the value row mounts asynchronously, and the user may
   already be typing elsewhere by the time it lands. *)
(* cljs collapse-arrow svg inside .control-hide > .rotating-arrow *)
let arrow_svg_el () =
  let svg = svg_ns_el "svg" in
  List.iter
    (fun (k, v) -> el_set_attr svg k v)
    [ ("aria-hidden", "true"); ("version", "1.1"); ("viewBox", "0 0 192 512")
    ; ("fill", "currentColor"); ("display", "inline-block")
    ; ("class", "h-4 w-4"); ("style", "margin-left: 2px") ];
  let p = svg_ns_el "path" in
  List.iter
    (fun (k, v) -> el_set_attr p k v)
    [ ( "d"
      , "M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 \
         128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 \
         398.804C21.543 411.404 0 402.48 0 384.662z" )
    ; ("fill-rule", "evenodd") ];
  el_append_child svg p;
  svg

(* cljs mounts the property-value editor as a whole .ls-block skeleton
   (components/property.cljs property-value renders an inline block
   editor): .ls-block.is-blank > .block-main-container >
   .block-control-wrap (arrow + bullet) + .block-main-content >
   .block-content-or-editor-wrap > .block-row > .editor-wrapper *)
let block_editor_frame u cell wrap =
  let blk =
    mk ~cls:"is-blank ls-block swipe-item" "div"
      ~attrs:
        [ ("data-block-title", ""); ("haschild", "false")
        ; ("data-comment-item", "false"); ("data-comments-area", "false")
        ; ("level", "0"); ("blockid", u); ("data-collapsed", "false")
        ; ("id", "ls-block-" ^ u); ("containerid", "4")
        ; ("data-db-collapsable", "false")
        ; ("data-block-format", "markdown") ]
  in
  let main = mk ~cls:"block-main-container flex flex-row gap-1" "div" in
  let ctrl =
    mk ~cls:"block-control-wrap flex flex-row items-center h-6" "div"
      ~attrs:[ ("data-has-children", "false") ]
  in
  let ctrl_a =
    mk ~cls:"block-control" "a" ~attrs:[ ("id", "control-" ^ u) ]
  in
  let hide = mk ~cls:"control-hide" "span" in
  let arrow = mk ~cls:"rotating-arrow not-collapsed" "span" in
  el_append_child arrow (arrow_svg_el ());
  el_append_child hide arrow;
  el_append_child ctrl_a hide;
  el_append_child ctrl ctrl_a;
  let blw = mk ~cls:"bullet-link-wrap" "a" in
  let dot =
    mk ~cls:"bullet-container cursor" "span"
      ~attrs:
        [ ("id", "dot-" ^ u); ("blockid", u); ("draggable", "true") ]
  in
  el_append_child dot (mk ~cls:"bullet" "span" ~attrs:[ ("blockid", u) ]);
  el_append_child blw dot;
  el_append_child ctrl blw;
  el_append_child main ctrl;
  let col1 = mk ~cls:"flex flex-col w-full" "div" in
  let col2 = mk ~cls:"flex flex-col w-full" "div" in
  let bmc = mk ~cls:"block-main-content flex flex-row gap-2" "div" in
  let col3 = mk ~cls:"flex flex-col w-full" "div" in
  let boew = mk ~cls:"block-content-or-editor-wrap" "div" in
  let boei = mk ~cls:"block-content-or-editor-inner" "div" in
  let brow =
    mk ~cls:"block-row flex flex-1 flex-row gap-1 items-center" "div"
  in
  el_append_child brow wrap;
  let right =
    mk ~cls:"ls-block-right"
      "div"
  in
  el_append_child right (mk ~cls:"ls-hover-lit" "div");
  el_append_child brow right;
  el_append_child boei brow;
  el_append_child boew boei;
  el_append_child col3 boew;
  el_append_child bmc col3;
  el_append_child col2 bmc;
  el_append_child col1 col2;
  el_append_child main col1;
  el_append_child blk main;
  el_append_child blk (mk ~cls:"ls-block-content-indent" "div");
  el_append_child cell blk

let edit_text_cell ?(steal = false) ctx row cell initial =
  el_clear cell;
  let u = ctx.block_uuid in
  (* the editor edits the value block, so its edit-block ids must resolve
     to the value block's uuid — carrying the owner's makes document-level
     editor dispatch (on_input's schedule_save, exit_edit's live_buffer)
     commit this buffer onto the owner's title *)
  let vu = Option.value ~default:u (D.ref_uuid (D.row_value row)) in
  let wrap =
    mk ~cls:"editor-wrapper" "div"
      ~attrs:[ ("id", "editor-edit-block-" ^ vu) ]
  in
  let inner = mk ~cls:"editor-inner block-editor" "div" in
  let ta =
    mk ~cls:"uniline-block normal-block" "textarea"
      ~attrs:
        [ ("autocapitalize", "off"); ("autocorrect", "false")
        ; ("data-testid", "block editor"); ("id", "edit-block-" ^ vu)
        ; ("style", "field-sizing: content; min-height: 1lh;") ]
  in
  let mt = mk ~cls:"mock-text" "div" in
  el_set_attr mt "style" Ui_parts.mock_text_style;
  let uploader = mk ~cls:"image-uploader" "div" in
  let file_in =
    mk "input"
      ~attrs:[ ("id", "upload-file"); ("hidden", ""); ("type", "file") ]
  in
  el_append_child uploader file_in;
  el_append_child inner ta;
  el_append_child inner mt;
  el_append_child inner uploader;
  el_append_child wrap inner;
  block_editor_frame vu cell wrap;
  el_set_value ta initial;
  (* single editing surface: commit the property editor still open
     elsewhere before this one registers — the previous commit's row
     re-renders and must not see this row's pending active record *)
  !close_editor ();
  add_active_edit ctx row;
  set_edit_buffer ctx row initial;
  if steal then !(Editor_state.close_block_editor) ();
  (* the cell is still detached while render builds it — focus once it
     lands in the document, unless focus already sits in another
     editable surface *)
  set_timeout
    (fun () ->
      if el_is_connected ta && (steal || not (is_editable_target active_element))
      then focus_end ta)
    0;
  let committed = ref false in
  let done_ save =
    if !committed then ()
    else (
      committed := true;
      clear_active_edit ctx row;
      (* a refresh may have already detached the textarea — committing
         a stale element would write the old value back over the fresh
         render *)
      if not (el_is_connected ta) then ()
      else (
        (* detach the editor DOM synchronously: the row only re-renders
           after a worker round-trip, and leaving .editor-wrapper
           textarea in the document lets it coexist with a block editor
           (cljs keeps a single editing surface) *)
        let value = el_value ta in
        let h = el_client_height cell in
        el_clear cell;
        (* repaint the committed value now and pin the row's geometry —
           an empty/shrinking cell shifts the layout and a click already
           in flight (blur -> commit between mousedown and mouseup)
           retargets onto whatever moved under the pointer *)
        if h > 0 then
          set_style cell ("min-height:" ^ string_of_int h ^ "px");
        ignore (child_text "span" "block-title-wrap" value cell);
        if save then commit_or_cancel ctx row value else ctx.refresh ()))
  in
  close_editor := (fun () -> done_ true);
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
          (* cljs exit-edit saves — Escape commits like Enter *)
          done_ true
      | _ -> ())
    true;
  (* a refresh re-render detaches a focused textarea and the removal
     fires blur synchronously, before the node reports disconnected —
     that blur is not a user exit; defer the commit one tick so a
     detached editor is skipped while a real user blur still commits *)
  el_listen ta "blur"
    (fun _ ->
      set_timeout (fun () -> if el_is_connected ta then done_ true) 0)
    true;
  el_listen ta "input" (fun _ -> set_edit_buffer ctx row (el_value ta))
    true

let text_cell ctx row =
  let value = D.row_value row in
  let cell =
    mk ~cls:"property-block-container content jtrigger" "div"
      ~attrs:[ ("tabindex", "-1") ]
  in
  if not (D.value_empty_p value) then
    List.iter
      (fun v ->
        ignore
          (child_text "span" "block-title-wrap"
             (match v with
              | W.String s -> s
              | other -> D.ref_title other)
             cell))
      (D.value_elems value);
  on_click cell (fun _ ->
      edit_text_cell ~steal:true ctx row cell (D.value_display value));
  cell

(* ---------- number ---------- *)

let number_cell ctx row =
  let value = D.row_value row in
  let cell = mk ~cls:"ls-number jtrigger" "div" in
  if not (D.value_empty_p value) then
    el_set_text cell (D.value_display value);
  on_click cell (fun _ ->
      edit_text_cell ~steal:true ctx row cell (D.value_display value));
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
        ; ( "style"
          , "width:16px;height:16px;border:1px solid \
             var(--border-color,#888);border-radius:3px" )
        ]
      ~cls:"jtrigger"
  in
  if checked then el_set_text btn "✓";
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
  (let* w = D.journal_page_by_day day in
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
    mk ~cls:"ls-property-date-picker" "div"
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
let datetime_content cell ~y ~m ~d =
  let title = Dates.journal_title_ymd ~y ~m ~d in
  let wrap = mk ~cls:"ls-datetime" "div" in
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
   block/journal-day (yyyymmdd); fall back to a raw ms number. The
   journal day must render as-is: routing it through a UTC-ms epoch
   and local getters would shift the day in timezones behind UTC *)
let ymd_of_datetime_value (v : W.t) : (int * int * int) option =
  match ms_of_value v with
  | Some ms -> Some (ymd_of_ms ms)
  | None -> (
      match W.get v "block/journal-day" with
      | Some (W.Int d) -> Some (d / 10000, d mod 10000 / 100, d mod 100)
      | _ -> None)

let date_cell ctx row =
  let value = D.row_value row in
  let cell = mk ~cls:"jtrigger" "div" in
  if not (D.value_empty_p value) then
    (match D.row_type row = "datetime", ymd_of_datetime_value value with
     | true, Some (y, m, d) -> datetime_content cell ~y ~m ~d
     | _ -> el_set_text cell (D.value_display value));
  on_click cell (fun _ -> date_picker ctx row cell);
  cell

(* ---------- select popups (choices / node refs) ---------- *)

(* db/ids of the owner block's tags — the bare entity endpoint omits
   block/tags, so pull it explicitly like sidebar_state/pull_entity *)
let block_tag_ids ctx f =
  (let* w =
    Runtime.invoke3 "thread-api/pull" (D.repo ())
      (W.String "[:block/uuid {:block/tags [:db/id]}]")
      (W.Array [ W.Keyword "block/uuid"; W.Uuid ctx.block_uuid ])
  in
  let tags =
    match D.getf w "block/tags" with
    | Some xs -> List.filter_map D.entity_id_of (W.elems xs)
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
        (let* ent =
          Runtime.invoke3 "thread-api/pull" (D.repo ())
            (W.String "[:db/id {:logseq.property/choice-exclusions [:db/id]}]")
            (W.Int id)
        in
        (match D.getf (D.untag ent) "logseq.property/choice-exclusions" with
         | Some xs ->
             acc :=
               !acc @ List.filter_map D.entity_id_of (W.elems xs)
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
    | Some w -> List.filter_map D.entity_id_of (W.elems w)
    | None -> []
  in
  let scoped_ok =
    scoped = [] || List.exists (fun t -> List.mem t tag_ids) scoped
  in
  let excluded =
    match cid with Some c -> List.mem c exclusions | None -> false
  in
  scoped_ok && not excluded

(* node-type value pickers: initial items come from
   get-property-node-selector-data, filtering re-queries the worker via
   search-blocks (cljs property-value-select-node). on_pick gets the
   chosen entity's db/id. *)
let node_items_source ~block ~prop ~on_pick =
  let to_item v =
    match D.entity_id_of v with
    | Some id ->
        Some (Properties_select.item (D.ref_title v) (fun () -> on_pick id))
    | None -> None
  in
  let items_of w = List.filter_map to_item (W.elems w) in
  let initial =
    (match D.entity_id_of prop with
     | Some property_id ->
         let* w = D.node_selector_data ~property_id ~block in
         Js.Promise.resolve
           (match D.getf w "initial-choices" with
            | Some v -> items_of v
            | None -> [])
     | None -> Js.Promise.resolve [])
  in
  let sub_of needle hay =
    let nl = String.length needle and hl = String.length hay in
    let rec go i =
      i + nl <= hl && (String.sub hay i nl = needle || go (i + 1))
    in
    nl <= hl && go 0
  in
  let on_search q =
    let q' = String.trim q in
    if q' = "" then initial
    else
      let searched =
        (let* w = D.search_blocks q in
        Js.Promise.resolve (items_of w))
      in
      (* cljs re-adds the built-in Page class for block/tags — block-search
         filters built-ins out *)
      let is_tags =
        D.getk prop "db/ident" = Some "block/tags"
        && sub_of (String.lowercase_ascii q') "page"
      in
      if is_tags then
        let* items = searched in
        let* e =
          D.entity
            (W.List [ W.Keyword "db/ident"; W.Keyword "logseq.class/Page" ])
        in
        Js.Promise.resolve
          (match to_item e with
           | Some it -> items @ [ it ]
           | None -> items)
      else searched
  in
  (initial, on_search)

let open_select_popup _row items ~placeholder anchor
    ~(on_new : (string -> unit) option) =
  let sel, input =
    Properties_select.create ~placeholder ~new_option:on_new
      ~on_escape:(fun () -> S.pop_overlay ())
      items
  in
  let wrap = mk ~cls:"property-select" "div" in
  el_append_child wrap sel;
  ignore (Properties_popup.open_anchored anchor wrap);
  el_focus input

let open_node_select_popup ~placeholder anchor ~block ~prop ~on_pick
    ~on_new =
  let initial, on_search = node_items_source ~block ~prop ~on_pick in
  (let* items = initial in
  let sel, input =
    Properties_select.create ~placeholder ~new_option:on_new
      ~on_search:(Some on_search)
      ~on_escape:(fun () -> S.pop_overlay ())
      items
  in
  let wrap = mk ~cls:"property-select" "div" in
  el_append_child wrap sel;
  ignore (Properties_popup.open_anchored anchor wrap);
  el_focus input;
  Js.Promise.resolve ())
  |> ignore

let new_choice ctx row text =
  let ident = D.row_ident row |> Option.value ~default:"" in
  (let* res = D.upsert_closed_value ~ident ~value:text () in
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

let closed_value_cell ?(icon_only = false) ctx row anchor =
  let value = D.row_value row in
  let cell = mk ~cls:"jtrigger" "div" in
  (* cljs select-item: an empty closed value renders .select-item >
     .empty-btn with the line-dashed icon — keeps the jtrigger
     visible/clickable *)
  let icon_only_chip =
    (* cljs closed-value-item {:icon? true} at positioned spots: the
       chip renders the icon alone, wrapped in .ls-icon-color-wrap —
       no text label *)
    match closed_value_icon_id value with
    | Some id when icon_only && id <> "line-dashed" -> (
        let item = mk ~cls:"select-item cursor-pointer shrink-0" "div" in
        let wrap =
          mk ~cls:"inline-flex items-center ls-icon-color-wrap" "span"
        in
        let color =
          Option.bind
            (D.getf (D.untag value) "logseq.property/icon")
            (fun icon -> D.gets (D.untag icon) "color")
        in
        el_set_attr wrap "style"
          ("color:" ^ Option.value color ~default:"inherit");
        el_append_child wrap (Views_dom.icon id);
        el_append_child item wrap;
        el_append_child cell item;
        Some ())
    | _ -> None
  in
  (match icon_only_chip with
   | Some () -> ()
   | None -> (
       (match closed_value_icon_id value with
        | Some id ->
            let item = mk ~cls:"select-item" "div" in
            el_append_child item (Views_dom.icon id);
            el_append_child cell item
        | None ->
            if D.value_empty_p value then (
              let item = mk ~cls:"select-item" "div" in
              let btn =
                mk ~cls:"empty-btn" "button"
                  ~attrs:[ ("type", "button") ]
              in
              el_append_child btn (Views_dom.icon "line-dashed");
              el_append_child item btn;
              el_append_child cell item));
       let txt = D.value_display value in
       let txt =
         if txt = "logseq.property/empty-placeholder" then "" else txt
       in
       if txt <> "" then ignore (child_text "span" "" txt cell)));
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
  (* cljs: .property-value-inner[data-type] > .multi-values.jtrigger >
     .select-item.cursor-pointer > a.page-ref.relative[data-uuid][data-ref]
     — refs render as clickable links, not bare text *)
  let wrap =
    mk ~cls:"property-value-inner"
      ~attrs:[ ("data-type", D.row_type row) ]
      "div"
  in
  let cell =
    mk
      ~cls:
        ("flex flex-1 min-w-0 flex-row items-center gap-1 flex-wrap \
          jtrigger"
        ^ if D.row_many row then " multi-values" else "")
      "div"
  in
  el_set_attr cell "tabindex" "0";
  List.iter
    (fun r ->
      let item = mk ~cls:"select-item" "div" in
      let t = D.ref_title r in
      let a =
        mk "a" ~cls:"page-ref relative"
          ~attrs:
            (("data-ref", String.lowercase_ascii t)
            :: ("draggable", "true") :: ("tabindex", "0")
            :: (match D.ref_uuid r with
                | Some u -> [ ("data-uuid", u) ]
                | None -> []))
      in
      (* the ref is a real link — don't let the cell's click open the
         value editor *)
      el_listen a "click" (fun ev -> stop_propagation ev) true;
      ignore (child_text "span" "" t a);
      el_append_child item a;
      el_append_child cell item)
    (D.value_elems value);
  let rec open_values () =
    let ident = D.row_ident row |> Option.value ~default:"" in
    open_node_select_popup
      ~placeholder:(I18n.t1 "property/set-placeholder" (D.row_title row))
      cell ~block:(D.uuid_ref ctx.block_uuid) ~prop:(D.row_prop row)
      ~on_pick:(fun id ->
        let existing =
          List.filter_map D.entity_id_of (D.value_elems value)
        in
        if List.mem id existing then (
          D.delete_property_value ~block_uuid:ctx.block_uuid ~ident
            ~value:(W.Int id)
          |> ignore;
          S.refresh_all ())
        else set_scalar ctx ~ident ~value:(W.Int id);
        S.pop_overlay ())
      ~on_new:(Some (new_node ctx row))
  and new_node ctx row text =
    ignore
      (let* res =
         (* cljs <create-page-if-not-exists!: class-type and block/tags
            values are classes *)
         if D.row_type row = "class" || D.row_ident row = Some "block/tags"
         then D.create_class text
         else D.create_page text
       in
       let* () =
         match D.create_result_uuid res with
         | Some uuid -> (
             let* id = D.db_id_of_uuid uuid in
             match id with
             | Some id ->
                 let ident =
                   D.row_ident row |> Option.value ~default:"" in
                 set_scalar ctx ~ident ~value:(W.Int id);
                 Js.Promise.resolve ()
             | None -> Js.Promise.resolve ())
         | None -> Js.Promise.resolve ()
       in
       S.pop_overlay ();
       Js.Promise.resolve ())
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
  el_append_child wrap cell;
  wrap

(* While an inline value editor (textarea / number input) is open inside
   `container`, a mousedown anywhere in the value cell must keep focus in
   the editor — the tabindex=-1 wrapper would otherwise take focus and the
   textarea's blur handler would commit. cljs keeps the caret inside the
   editing block the same way. *)
(* cljs value cells fill the whole .ls-block row — a click anywhere on
   the container activates the cell. Forward clicks that miss every
   interactive descendant to the cell; while the inline editor is open
   do nothing (the mousedown guard already keeps the caret). *)
(* cljs select-node for :logseq.property.class/extends — a multi-toggle
   picker inside .ui__dropdown-menu-content that stays open across picks.
   Options: extends-class-options minus self, the class's structured
   children, and each current extends' own parents (cycle prevention —
   value.cljs exclude-ids). Toggle: an already-selected class is removed
   via delete-property-value, otherwise set-block-property adds it to the
   set (a scalar on a many-cardinality ref property appends). *)
let open_extends_menu ctx ~ident row anchor =
  match D.entity_id_of (D.row_prop row) with
  | None -> ()
  | Some property_id ->
      ignore
        (let* data = D.node_selector_data ~property_id ~block:(D.uuid_ref ctx.block_uuid) in
        let selected =
          ref
            (List.filter_map D.entity_id_of
               (D.value_elems (D.row_value row)))
        in
        let ids_of m id =
          match D.int_map_get m id with
          | Some w -> List.filter_map D.entity_id_of (W.elems w)
          | None -> []
        in
        let children =
          match
            ( ctx.block_id
            , D.getf data "structured-children-by-class-id" )
          with
          | Some id, Some m -> (
              match D.int_map_get m id with
              | Some w ->
                  List.filter_map (fun v -> W.as_int v) (W.elems w)
              | None -> [])
          | _ -> []
        and grandparents =
          match D.getf data "extends-by-class-id" with
          | Some m ->
              List.concat_map (fun pid -> ids_of m pid) !selected
          | None -> []
        in
        let excluded =
          (match ctx.block_id with Some id -> [ id ] | None -> [])
          @ children @ grandparents
        in
        let options =
          (match D.getf data "extends-class-options" with
           | Some w -> W.elems w
           | None -> [])
          |> List.filter (fun o ->
                 match D.entity_id_of o with
                 | Some id -> not (List.mem id excluded)
                 | None -> false)
        in
        let menu = mk ~cls:"ui__dropdown-menu" "div" in
        let rec rebuild () =
          el_clear menu;
          List.iter
            (fun o ->
              match D.entity_id_of o with
              | None -> ()
              | Some id ->
                  let a =
                    mk ~cls:"menu-link" "a"
                      ~attrs:[ ("tabindex", "0") ]
                  in
                  ignore
                    (child_text "span" "flex-1" (D.ref_title o) a);
                  (if List.mem id !selected then
                     ignore
                       (el_append_child a
                          (mk ~cls:"ui__icon ti ti-check" "i")));
                  on_click a (fun _ ->
                      (if List.mem id !selected then (
                         selected :=
                           List.filter (fun x -> x <> id) !selected;
                         ignore
                           (D.delete_property_value
                              ~block_uuid:ctx.block_uuid ~ident
                              ~value:(W.Int id)))
                       else (
                         selected := id :: !selected;
                         ignore
                           (D.set_block_property
                              ~block_uuid:ctx.block_uuid ~ident
                              ~value:(W.Int id))));
                      rebuild ();
                      S.refresh_all ());
                  el_append_child menu a)
            options
        in
        rebuild ();
        ignore
          (Properties_popup.open_anchored
             ~cls:"ui__dropdown-menu-content" anchor menu);
        Js.Promise.resolve ())

let extends_cell ctx row =
  let value = D.row_value row in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let cell = mk ~cls:"jtrigger multi-values" "div" in
  el_set_attr cell "tabindex" "0";
  (* cljs property-block-value -> page-cp: page entities render as
     a.relative.tag / a.relative.page-ref, not .block-title-wrap *)
  List.iter
    (fun r ->
      let class_p = D.ref_is_class r in
      let a =
        mk "a"
          ~cls:("relative " ^ if class_p then "tag" else "page-ref")
          ~attrs:
            [ ("tabindex", "0")
            ; ("data-ref", String.lowercase_ascii (D.ref_title r))
            ; ("data-uuid", Option.value ~default:"" (D.ref_uuid r))
            ; ("draggable", "true")
            ]
      in
      ignore
        (child_text "span" ""
           ((if class_p then "#" else "") ^ D.ref_title r)
           a);
      el_append_child cell a)
    (D.value_elems value);
  on_click cell (fun _ -> open_extends_menu ctx ~ident row cell);
  cell

(* ---------- dispatch ---------- *)

let editing_cell ctx row inner =
  let cell =
    mk ~cls:"property-block-container content" "div"
      ~attrs:[ ("tabindex", "-1") ]
  in
  (* keep the inline editor focused when the click lands on the cell
     chrome around the textarea — the container itself is focusable
     and would otherwise steal focus and blur-commit the edit *)
  el_listen cell "mousedown"
    (fun ev ->
      match ev_target ev with
      | Some target -> (
          match el_closest target "textarea, input, a, button" with
          | Some _ -> ()
          | None -> prevent_default ev)
      | None -> ())
    true;
  el_append_child inner cell;
  edit_text_cell ctx row cell (edit_buffer ctx row)

(* icon_only = cljs :icon? — positioned rows (block-left chips,
   block-below pills) show the closed-value icon without its label *)
let render ?(icon_only = false) ctx row =
  let inner =
    mk ~cls:"property-value property-value-panel-inner" "div"
  in
  let ident = D.row_ident row |> Option.value ~default:"" in
  (* cljs keeps a single editing surface: while a block is open in the
     outliner editor a pending/stale value editor must not mount —
     two .editor-wrapper textareas would coexist *)
  if
    (take_pending_edit ~block_uuid:ctx.block_uuid ~ident
     || has_active_edit ctx row)
    && Editor_state.editing () = None
  then editing_cell ctx row inner
  else (
    let row = D.row_with_effective_value row in
    let value = D.row_value row in
    let ty = D.row_type row in
    let cell =
      if D.row_closed_values row <> [] then
        closed_value_cell ~icon_only ctx row inner
      else
        match ty with
        | "checkbox" -> checkbox_cell ctx row
        | "number" -> number_cell ctx row
        | "date" | "datetime" -> date_cell ctx row
        | "node" | "asset" | "page" | "class" | "property" ->
            if ident = "logseq.property.class/extends" then
              extends_cell ctx row
            else node_cell ctx row
        | _ ->
            if D.value_empty_p value then (
              let empty =
                mk "div"
                  ~cls:
                    "w-full h-full jtrigger ls-empty-text-property \
                     text-muted-foreground"
                  ~attrs:
                    [ ("tabindex", "0")
                    ; ("style", "min-height:20px;margin-left:3px") ]
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
