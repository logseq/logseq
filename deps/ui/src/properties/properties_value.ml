(* Property value cells — declarative LUI components.

   Each cell is a semantic control per property type (web master's
   cell structure kept where it maps):
   - text/url:    a ghost button showing the display text; press swaps
                  in an inline text_field (Enter commits — the LUI
                  event set has no blur event yet, recorded in NOTES)
   - number:      same, commit parses Float
   - checkbox:    LUI checkbox; toggle writes Bool
   - date/datetime: ghost button opens an anchored popover with
                  a text_field (YYYY-MM-DD → journal-day ref;
                  datetime parses to ms epoch)
   - node/page/class/asset: chips of the current refs + a picker
                  button opening an anchored popover hosting
                  Properties_select.view (initial items + async search
                  + "New option")
   - closed-value: same picker dropdown over the row's closed values
   - logseq.property.class/extends: multi-toggle popover whose
                  menu_items carry ~checked (stays open across picks). Note: a
                  dropdown_menu only accepts menu-item children, so these
                  non-menu pickers use popover ~role:`menu instead

   Writes: create-property-text-block / save-block for text & url,
   set-block-property for scalars and refs, remove-block-property /
   delete-property-value to clear. *)

open Promise_ext
open Lui_elements
module D = Properties_data
module S = Properties_state
module Sel = Properties_select
module W = Wire

(* The owner context a value cell is rendered for. *)
type ctx =
  { owner_key : string
  ; block_uuid : string
  ; block_id : int option
  ; refresh : unit -> unit
  ; is_page : bool
  ; class_schema : bool
  }

(* When the "add property" dialog creates a text/url value block it also
   marks the row for immediate editing — the next render shows the
   editor already open (cljs enters block editing right away). *)
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
   scalar_edit_cell; editor_actions.enter_edit runs it via
   Editor_state.close_property_editor so a block editor opening commits
   the property editor (cljs single editing surface) *)
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
          ~title ~new_block_id:(Ui_services.env_random_uuid ()) ()
        |> ignore;
        S.refresh_all ()

let commit_or_cancel ctx row value =
  let ident = D.row_ident row |> Option.value ~default:"" in
  match D.row_type row with
  | "number" -> (
      match Float.of_string_opt (String.trim value) with
      | Some n -> set_scalar ctx ~ident ~value:(W.Float n)
      | None -> ())
  | _ -> save_text_value ctx row value;
  ctx.refresh ()

(* ---------- date / datetime ---------- *)

(* parses "YYYY-MM-DD" -> journal day int YYYYMMDD *)
let parse_date s =
  match String.split_on_char '-' (String.trim s) with
  | [ y; m; d ]
    when String.length y = 4 && String.length m = 2
         && String.length d = 2 -> (
      try Some (int_of_string (y ^ m ^ d)) with _ -> None)
  | _ -> None

let today_day () =
  let f = Ui_services.time_local_fields (Ui_services.time_now ()) in
  (f.year * 10000) + (f.month * 100) + f.day

let set_date ctx ident day =
  (let* w = D.journal_page_by_day day in
  (match D.geti w "db/id" with
   | Some id -> set_scalar ctx ~ident ~value:(W.Int id)
   | None -> ());
  Js.Promise.resolve ())
  |> ignore

let parse_ms = Dates.parse_local_datetime

let commit_date_text ctx ident ~is_datetime v =
  let v = String.trim v in
  if is_datetime then
    match if v = "" then Some (Ui_services.time_now ()) else parse_ms v with
    | Some ms -> set_scalar ctx ~ident ~value:(W.Float ms)
    | None -> ()
  else
    let day =
      if v = "" then today_day ()
      else Option.value (parse_date v) ~default:(-1)
    in
    if day > 0 then set_date ctx ident day

(* ms epoch -> (y, m, d) *)
let ymd_of_ms ms =
  let f = Ui_services.time_local_fields ms in
  f.year, f.month, f.day

let ms_of_value = function
  | W.Float f -> Some f
  | W.Int64 i -> Some (Int64.to_float i)
  | W.Int i -> Some (float_of_int i)
  | _ -> None

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

let date_display ty value =
  match ty = "datetime", ymd_of_datetime_value value with
  | true, Some (y, m, d) -> Render_inline.date_label y m d
  | _ -> D.value_display value

(* ---------- select pickers (choices / node refs) ---------- *)

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
        Some (Sel.item (D.ref_title v) (fun () -> on_pick id))
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

(* icon id for a closed-choice value — the value's own
   logseq.property/icon map; "line-dashed" for the empty placeholder
   (cljs hardcodes it for empty closed-choice values) *)
let closed_value_icon_id value =
  match
    Option.bind (D.getf (D.untag value) "logseq.property/icon")
      (fun icon -> D.gets (D.untag icon) "id")
  with
  | Some id -> Some id
  | None -> if D.empty_placeholder_p value then Some "line-dashed" else None

(* cljs <create-page-if-not-exists!: class-type and block/tags values
   are classes *)
let new_node ctx row ~close text =
  ignore
    (let* res =
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
     close ();
     Js.Promise.resolve ())

(* ---------- views ---------- *)

(* a picker dropdown anchored under the enclosing stack: fetch-backed
   item source + "New option" *)
let picker_dropdown ~open_ ~placeholder ~new_option ~initial ~on_search
    : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let items_st
      : (Sel.item list * (string -> Sel.item list Js.Promise.t)) option
        Signal.state =
    Signal.state sched None
  in
  ignore
    (let* items = initial in
     Runtime.signal_set items_st (Some (items, on_search));
     Js.Promise.resolve ());
  (popover ~role:`menu ~anchor:`below ~anchor_alignment:`stretch
     ~anchor_offset:4.0 ~min_width:240
     ~transition:Ui_components.popover_transition
     ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
     [ reactive
         ~equal:(fun a b -> Option.is_some a = Option.is_some b)
         (fun m ->
            match m with
        | None -> column ~gap:2 []
            | Some (items, on_search) ->
                Sel.view ~placeholder ?new_option
                  ~on_search:(Some on_search) items)
         (Signal.value items_st)
     ])
    context parent

(* Closed values share a searchable property chooser on both hosts. *)
let closed_value_popup ~on_dismiss content =
  Ui_components.with_props
    [Ui_components.card_shadow;Ui_components.Prop.max_width_viewport 1.;
     Ui_components.Prop.max_height_viewport 1.;Ui_components.Prop.overflow `auto]
    (popover ~role:`dialog ~anchor:`below ~anchor_alignment:`start
       ~anchor_offset:(-3.) ~min_width:226 ~padding:0
       ~background:"hsl(var(--popover))" ~foreground:"hsl(var(--popover-foreground))"
       ~border_color:"hsl(var(--border))" ~border_width:1 ~corner_radius:6
       ~style_class:"ui__popover-content ls-property-select-popup"
       ~transition:Ui_components.popover_transition ~on_dismiss [content])

(* helper: ghost-button value cell — [text] = display label.
   .pv-scalar lets the stylesheet collapse the default 36px button
   chrome down to the cljs inline-text metrics (line-height 20px) *)
let value_button ~text ~on_press : t =
  (* an empty value yields text:"" — a button with neither text nor
     accessibility label is rejected by the store and kills the mount
     batch, so keep a label plus the cljs "Empty" placeholder *)
  let text = if text = "" then I18n.t "ui/empty" else text in
  Ui_components.button ~variant:`ghost ~grow:1.0 ~text_alignment:`start ~label:text
    ~text ~style_class:"pv-scalar"
    ~foreground:"var(--ls-primary-text-color)"
    ~data_attrs:
      [ ( "style"
        , "height:auto;min-height:0;padding:0;line-height:20px;\
           justify-content:flex-start" )
      ]
    ~on_press []

(* text/number cell: ghost button <-> autofocused text_field *)
let scalar_edit_cell ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let row' = D.row_with_effective_value row in
  let value = D.row_value row' in
  let is_number = D.row_type row' = "number" in
  let initial =
    if is_number then D.value_display value else D.ref_title value
  in
  let editing =
    Signal.state sched
      ((take_pending_edit ~block_uuid:ctx.block_uuid ~ident
        || has_active_edit ctx row)
       && Editor_state.editing () = None)
  in
  let buffer = Signal.state sched initial in
  let commit save =
    if not (Runtime.signal_get editing) then ()
    else (
      let v = Runtime.signal_get buffer in
      clear_active_edit ctx row;
      Runtime.signal_set editing false;
      if save then commit_or_cancel ctx row v else ctx.refresh ())
  in
  let open_editor ~steal () =
    !close_editor ();
    add_active_edit ctx row;
    set_edit_buffer ctx row (Runtime.signal_get buffer);
    Runtime.signal_set editing true;
    close_editor := (fun () -> commit true);
    if steal then !(Editor_state.close_block_editor) ()
  in
  if Runtime.signal_get editing then (
    add_active_edit ctx row;
    close_editor := (fun () -> commit true));
  (column ~gap:0 ~grow:1.0
     [ if_ ~test:(Logseq_el.own context (Signal.map (fun e -> not e) (Signal.value editing)))
         (value_button ~text:initial ~on_press:(fun _ ->
              open_editor ~steal:true ()))
     ; if_ ~test:(Signal.value editing)
         (* ~text evaluates eagerly when the cell mounts, before
            open_editor registers active_editor — read the local buffer
            (seeded with the current value) instead of edit_buffer *)
         (Ui_components.text_field ~autofocus:true
            ~text:(Runtime.signal_get buffer)
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, t) ->
                  Signal.set buffer t;
                  set_edit_buffer ctx row t
              | _ -> ())
            ~on_submit:(fun _ -> commit true)
            [])
     ])
    context parent

let checkbox_view ctx row : t =
  let value = D.row_value row in
  let checked = match value with W.Bool b -> b | _ -> false in
  checkbox ~checked
    ~on_toggle:(fun ev ->
      match ev with
      | Lui_protocol.ToggleChanged (_, b) ->
          let ident = D.row_ident row |> Option.value ~default:"" in
          set_scalar ctx ~ident ~value:(W.Bool b)
      | _ -> ())
    []

(* ---------- repeat column (cljs repeat-setting) ----------

   The right column of the date popover: persisted as hidden
   logseq.property.repeat/* properties on the block — repeated? bool,
   recur-frequency int, recur-unit / repeat-type / checked-property
   refs to closed-value or property entities, temporal-property ref
   to this date property's entity while repeating is on. *)
type rep_choice =
  { c_id : int; c_title : string; c_ident : string; c_done_title : string option }

type rep =
  { repeated : bool
  ; freq : int
  ; unit_id : int
  ; type_id : int
  ; when_id : int
  ; prop_dbid : int
  ; units : rep_choice list
  ; types : rep_choice list
  ; whens : rep_choice list
  ; done_title : string
  ; status_done_title : string
  }

let repeat_choice_title ident title =
  let translated prefix namespace =
    let suffix=String.sub ident (String.length prefix) (String.length ident-String.length prefix) in
    I18n.t (namespace ^ suffix)
  in
  if String.starts_with ~prefix:"logseq.property.repeat/recur-unit." ident then
    translated "logseq.property.repeat/recur-unit." "property.repeat-recur-unit/"
  else if String.starts_with ~prefix:"logseq.property.repeat/repeat-type." ident then
    translated "logseq.property.repeat/repeat-type." "property.repeat-repeat-type/"
  else if ident="logseq.property/status.done" then I18n.t "property.status/done"
  else title

let repeat_done_title values =
  List.find_map (fun value ->
    let value=D.untag value in
    if D.getb value "logseq.property/choice-checkbox-state" then
      Option.map (repeat_choice_title (Option.value (D.getk value "db/ident") ~default:""))
        (D.entity_title_of value)
    else None) values

let choice_of_w wire =
  let value=D.untag wire in
  let ident=Option.value (D.getk value "db/ident") ~default:"" in
  Option.map (fun id ->
    let title=Option.value (D.entity_title_of value) ~default:ident in
    {c_id=id;c_title=repeat_choice_title ident title;c_ident=ident;
     c_done_title=Option.bind (D.getf value "property/closed-values")
       (fun values -> repeat_done_title (W.elems values))}) (D.entity_id_of value)

let builtin_prop_p ident =
  String.length ident > 7 && String.sub ident 0 7 = "logseq."

let rep_set ctx ~ident ~value =
  D.set_block_property ~block_uuid:ctx.block_uuid ~ident ~value |> ignore;
  S.refresh_all ()

let fetch_repeat ctx ~ident ~is_datetime (k : rep -> unit) =
  let arr_p =
    Js.Promise.all
      [| Sdk_util.get_by_id (W.Uuid ctx.block_uuid)
       ; D.closed_values (W.Keyword "logseq.property.repeat/recur-unit")
       ; D.closed_values (W.Keyword "logseq.property.repeat/repeat-type")
       ; D.closed_values (W.Keyword "logseq.property/status")
       ; D.entity (W.List [ W.Keyword "db/ident"; W.Keyword ident ])
       ; D.entity
           (W.List [ W.Keyword "db/ident"
                   ; W.Keyword "logseq.property/status" ])
       ; D.all_properties (D.uuid_ref ctx.block_uuid) |]
  in
  ignore
    (let* arr = arr_p in
     let blk = arr.(0) in
     (* The block endpoint resolves property refs to display summaries;
        numeric and checkbox scalars live inside their value entities. *)
     let scalar key = Option.map (fun value ->
       Option.value (D.getf value "logseq.property/value") ~default:value)
       (D.getf blk key) in
     let ref_id key =
       match D.getf blk key with
       | Some value when not (D.value_empty_p value) ->
           Option.value (D.entity_id_of value) ~default:0
       | _ -> 0 in
     let current_unit=ref_id "logseq.property.repeat/recur-unit" in
     let units_all = List.filter_map choice_of_w (W.elems arr.(1)) in
     let units =
       (* :date props drop the sub-day units (cljs removes
          minute/hour unless one is already picked) *)
       if is_datetime then units_all
       else
         List.filter
           (fun c ->
             c.c_id=current_unit || (c.c_ident <> "logseq.property.repeat/recur-unit.minute"
             && c.c_ident <> "logseq.property.repeat/recur-unit.hour"))
           units_all
     in
     let types = List.filter_map choice_of_w (W.elems arr.(2)) in
     let prop_dbid = Option.value (D.entity_id_of arr.(4)) ~default:0 in
     let status_id = Option.value (D.entity_id_of arr.(5)) ~default:0 in
     (* "When" options: the status property plus every non-built-in
        property carrying at least two closed values *)
     let whens =
       List.filter_map
         (fun pe ->
           match choice_of_w pe with
           | None -> None
           | Some c ->
               let n_closed =
                 match D.getf pe "property/closed-values" with
                 | Some cv -> List.length (W.elems cv)
                 | None -> 0
               in
               if c.c_ident = "logseq.property/status"
                  || (n_closed >= 2 && not (builtin_prop_p c.c_ident))
               then Some c
               else None)
         (W.elems arr.(6))
     in
     let whens =
       if List.exists (fun c -> c.c_id = status_id) whens then whens
       else
         (match choice_of_w arr.(5) with
          | Some c -> c :: whens
          | None -> whens)
     in
     let find_ident suffix cs =
       match List.find_opt (fun c -> c.c_ident = suffix) cs with
       | Some c -> c.c_id
       | None -> ( match cs with c :: _ -> c.c_id | [] -> 0 )
     in
     let freq =
       match scalar "logseq.property.repeat/recur-frequency" with
       | Some w -> (
           match w with
           | W.Float f -> int_of_float f
           | _ -> Option.value (W.as_int w) ~default:1)
       | None -> 1
     in
     let status_done_title=Option.value (repeat_done_title (W.elems arr.(3)))
       ~default:(I18n.t "property.status/done") in
     let when_id=let selected=ref_id "logseq.property.repeat/checked-property" in
       if selected=0 then status_id else selected in
     let done_title=List.find_map (fun choice ->
       if choice.c_id=when_id then choice.c_done_title else None) whens
       |> Option.value ~default:status_done_title in
     k
       { repeated =
           (match scalar "logseq.property.repeat/repeated?" with
            | Some w -> Option.value (W.as_bool w) ~default:false
            | None -> false)
       ; freq
       ; unit_id =
           (let u = ref_id "logseq.property.repeat/recur-unit" in
            if u <> 0 then u
            else find_ident "logseq.property.repeat/recur-unit.day" units)
       ; type_id = ref_id "logseq.property.repeat/repeat-type"
       ; when_id
       ; prop_dbid
       ; units
       ; types
       ; whens
       ; done_title;status_done_title };
     Js.Promise.resolve ())

(* Repeat controls use the same bounded menu recipe as other application selects. *)
let rep_select ~key ~label ~selected_signal ~options ~on_pick : t =
 fun context parent ->
  let open_ = Signal.state context.Lui_ui.ui_scheduler false in
  let title id = if id=0 then I18n.t "ui/empty" else List.assoc id options in
  (column ~key ~style_class:"ls-select-wrap ls-rep-wrap" ~grow:1. ~min_width:0
    [Ui_components.with_props
       [Ui_components.Prop.font_size "0.875rem";Ui_components.Prop.line_height "1.25rem"]
       (select ~key:(key ^ "-trigger") ~label ~text:(reactive title selected_signal)
         ~container_relative_frame:`horizontal ~min_width:0 ~height:32
         ~padding_horizontal:8 ~padding_vertical:0 ~corner_radius:6
         ~background:"hsl(var(--background))" ~border_width:1
         ~border_color:"hsl(var(--border))" ~style_class:"ls-select-trigger ls-rep-trigger"
         ~on_press:(fun _ -> Runtime.signal_set open_ (not (Signal.get_state open_))) []);
     if_ ~test:(Signal.value open_)
       (Ui_components.menu_card ~key:(key ^ "-options") ~max_height:288
          ~cls:"ls-select-content ls-rep-menu" ~anchor:`below ~anchor_alignment:`start
          ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
          (List.map (fun (id,title) ->
            Ui_components.menu_item_chrome
              (menu_item ~key:(string_of_int id) ~text:title ~selection_placement:`leading
                 ~selected:(reactive ((=) id) selected_signal) ~min_height:32
                 ~padding_horizontal:8 ~padding_vertical:6 ~gap:8 ~corner_radius:4
                 ~on_press:(fun _ -> on_pick id;Runtime.signal_set open_ false) [])) options))]) context parent

let repeat_type_picker ~selected_signal ~options ~on_pick ~on_clear : t =
 fun context parent ->
  let open_ = Signal.state context.Lui_ui.ui_scheduler false in
  let close () = Runtime.signal_set open_ false in
  let title id = if id=0 then I18n.t "ui/empty" else List.assoc id options in
  (column ~grow:1. ~min_width:0 ~gap:0
    [Ui_components.with_props
       [Ui_components.Prop.white_space `normal;Ui_components.Prop.font_weight 400;
        Ui_components.Prop.font_size "0.875rem";Ui_components.Prop.line_height "1.375";
        Ui_components.Prop.cursor `pointer]
       (button ~key:"repeat-type-trigger" ~variant:`ghost ~label:(I18n.t "property.repeat/next-date")
          ~text:(reactive title selected_signal) ~grow:1. ~min_width:0 ~min_height:0
          ~padding_horizontal:8 ~padding_vertical:4 ~main:`start ~text_alignment:`start
          ~background:"transparent" ~foreground:"hsl(var(--foreground))"
          ~border_width:1 ~border_color:"hsl(var(--border))" ~corner_radius:4
          ~style_class:"ls-rep-trigger"
          ~on_press:(fun _ -> Runtime.signal_set open_ (not (Signal.get_state open_))) []);
     if_ ~test:(Signal.value open_)
       (reactive (fun selected ->
         let items=List.map (fun (id,title) ->
           Sel.item ~checked:(id=selected) title (fun () -> on_pick id;close ())) options in
         let items=if selected=0 then items else items @
           [Sel.item ~icon:"x" (I18n.t "property/clear-value") (fun () -> on_clear ();close ())] in
         closed_value_popup ~on_dismiss:(fun _ -> close ())
           (Sel.view ~compact:true ~show_empty_result:false
              ~placeholder:(I18n.t1 "property/set-placeholder"
                (I18n.t "property.built-in/repeat-repeat-type")) items)) selected_signal)]) context parent

let repeat_column ctx ~ident ~is_datetime ~rep : t =
  reactive ~equal:(fun before after -> Option.is_some before=Option.is_some after)
    (function
      | None -> box ~key:"rep-x" []
      | Some initial -> fun context parent ->
          let buffer=Signal.state context.Lui_ui.ui_scheduler (string_of_int initial.freq) in
          let current ()=Option.get (Signal.get_state rep) in
          let update change=Signal.set rep (Some (change (current ()))) in
          let save property value=rep_set ctx ~ident:property ~value in
          let commit_frequency ()=
            let raw=String.trim (Signal.get_state buffer) in
            let digits=String.length raw>0 && String.for_all (fun c -> c>='0' && c<='9') raw in
            let parsed=if digits then int_of_string_opt raw else None in
            match parsed with
            | Some frequency when frequency>0 ->
                Signal.set buffer (string_of_int frequency);
                if frequency<>(current ()).freq then (
                  update (fun value -> {value with freq=frequency});
                  save "logseq.property.repeat/recur-frequency" (W.Int frequency))
            | _ -> Signal.set buffer (string_of_int (current ()).freq)
          in
          let choices values=List.map (fun value -> value.c_id,value.c_title) values in
          let when_changed id =
            let selected=List.find (fun choice -> choice.c_id=id) initial.whens in
            update (fun value -> {value with when_id=id;
              done_title=Option.value selected.c_done_title ~default:value.status_done_title});
            save "logseq.property.repeat/checked-property" (W.Int id)
          in
          (Ui_components.with_props
             [Ui_components.Prop.font_size "0.875rem";Ui_components.Prop.line_height "1.25rem"]
             (column ~key:"rep" ~style_class:"ls-repeat-col" ~gap:16 ~padding:16 ~width:256
               [row ~key:"rpt" ~cross:`center ~gap:4 ~margin_bottom:16
                  [checkbox ~key:"repeat" ~width:16 ~min_width:16 ~height:16
                     ~style_class:"ls-rep-cb" ~label:(I18n.t
                       (if List.mem ident ["logseq.property/deadline";"logseq.property/scheduled"] then "property.repeat/task"
                        else if is_datetime then "property.repeat/datetime" else "property.repeat/date"))
                     ~checked:(reactive (fun value -> (Option.get value).repeated) (Signal.value rep))
                     ~on_toggle:(function
                       | Lui_protocol.ToggleChanged (_,checked) ->
                           update (fun value -> {value with repeated=checked});
                           save "logseq.property.repeat/repeated?" (W.Bool checked);
                           if checked then save "logseq.property.repeat/temporal-property" (W.Int initial.prop_dbid)
                           else (D.remove_block_property ~block_uuid:ctx.block_uuid
                             ~ident:"logseq.property.repeat/temporal-property" |> ignore;S.refresh_all ())
                       | _ -> ()) [];
                   text ~value:(I18n.t
                     (if List.mem ident ["logseq.property/deadline";"logseq.property/scheduled"] then "property.repeat/task"
                      else if is_datetime then "property.repeat/datetime" else "property.repeat/date")) []];
                row ~key:"every" ~cross:`center ~gap:8
                  [text ~foreground:"hsl(var(--muted-foreground))" ~value:(I18n.t "property.repeat/every") [];
                   Ui_components.text_field ~key:"frequency" ~width:56 ~min_width:56 ~height:32
                     ~padding_horizontal:8 ~padding_vertical:0 ~style_class:"ls-rep-num"
                     ~label:(I18n.t "property.repeat/every") ~submit_on_blur:true
                     ~text:(reactive Fun.id (Signal.value buffer))
                     ~on_input:(function Lui_protocol.TextChanged (_,value) -> Signal.set buffer value | _ -> ())
                     ~on_submit:(fun _ -> commit_frequency ()) [];
                   rep_select ~key:"repeat-unit" ~label:(I18n.t "property.repeat/every")
                     ~selected:(reactive (fun value -> (Option.get value).unit_id) (Signal.value rep))
                     ~options:(choices initial.units) ~on_pick:(fun id ->
                       update (fun value -> {value with unit_id=id});
                       save "logseq.property.repeat/recur-unit" (W.Int id))];
                column ~key:"next" ~gap:4
                  [text ~foreground:"hsl(var(--muted-foreground))" ~value:(I18n.t "property.repeat/next-date") [];
                   repeat_type_picker
                     ~selected:(reactive (fun value -> (Option.get value).type_id) (Signal.value rep))
                     ~options:(choices initial.types) ~on_pick:(fun id ->
                       update (fun value -> {value with type_id=id});
                       save "logseq.property.repeat/repeat-type" (W.Int id))
                     ~on_clear:(fun () ->
                       update (fun value -> {value with type_id=0});
                       D.remove_block_property ~block_uuid:ctx.block_uuid
                         ~ident:"logseq.property.repeat/repeat-type" |> ignore;
                       S.refresh_all ())];
                column ~key:"when" ~gap:8
                  [text ~foreground:"hsl(var(--muted-foreground))" ~value:(I18n.t "property.repeat/when") [];
                   rep_select ~key:"repeat-when" ~label:(I18n.t "property.repeat/when")
                     ~selected:(reactive (fun value -> (Option.get value).when_id) (Signal.value rep))
                     ~options:(choices initial.whens) ~on_pick:when_changed;
                   row ~key:"is" ~gap:4
                     [text ~foreground:"hsl(var(--muted-foreground))" ~value:(I18n.t "property.repeat/is-label") [];
                      text ~value:(reactive (fun value -> (Option.get value).done_title) (Signal.value rep)) []]]])) context parent)
    (Signal.value rep)

(* Property entry points share the same calendar, time input and commit rules. *)
let date_picker_content ctx ~ident ~is_datetime ~value ~on_value ~on_clear ~on_dismiss : t =
 fun context parent ->
  let alive = ref true in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> alive:=false);
  let rep = Signal.state context.Lui_ui.ui_scheduler None in
  fetch_repeat ctx ~ident ~is_datetime (fun value ->
    if !alive then Runtime.signal_set rep (Some value));
  let initial =
    match is_datetime,ms_of_value value,ymd_of_datetime_value value with
    | true,Some ms,_ -> ms
    | _,_,Some (year,month,day) -> Dates.make ~year ~month ~day ()
    | _ -> let now=Dates.fields (Dates.date_now ()) in
        Dates.make ~year:now.year ~month:now.month ~day:now.day ()
  in
  let pick ms =
    if is_datetime then on_value (W.Float ms)
    else ignore (let* page=D.journal_page_by_day (Dates.journal_day_of ms) in
      if !alive then (
        let id=Option.get (D.entity_id_of page) in
        on_value (W.Int id);on_dismiss ());
      Js.Promise.resolve ())
  in
  (row ~key:"property-date-content" ~width:556 ~gap:0 ~cross:`start
     ~style_class:"ls-property-date-picker"
     [ Ui_components.calendar ~week_starts_on:(Sdk_config.calendar_week_starts_on ()) ~month_label:I18n.calendar_month_label ~day_label:I18n.calendar_day_label ~initial ~datetime:is_datetime ~initial_focus_day:true
         ~translate:I18n.t ~on_pick:pick
         ?on_clear:(if D.value_empty_p value then None else Some on_clear) ();
       repeat_column ctx ~ident ~is_datetime ~rep ]) context parent

let date_picker_pop ~anchor_target ctx ~ident ~is_datetime ~value ~on_dismiss : t =
  Ui_components.with_props [Ui_components.Prop.overflow `auto;Ui_components.card_shadow]
  (popover ~anchor:`below ~anchor_target ~anchor_alignment:`start ~anchor_offset:4.
    ~max_height:(max 0 (int_of_float (Ui_services.dom_viewport_height ())-16))
    ~background:"hsl(var(--popover))"
    ~foreground:"hsl(var(--popover-foreground))" ~border_width:1
    ~border_color:"hsl(var(--border))" ~corner_radius:6
    ~transition:Ui_components.popover_transition
    ~on_dismiss:(fun _ -> on_dismiss ())
    [date_picker_content ctx ~ident ~is_datetime ~value
       ~on_value:(fun value -> set_scalar ctx ~ident ~value)
       ~on_clear:(fun () ->
         D.remove_block_property ~block_uuid:ctx.block_uuid ~ident |> ignore;
         on_dismiss ();S.refresh_all ()) ~on_dismiss])

let date_view ~(hover : bool Signal.state option) ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in

  let value = D.row_value row in
  let is_datetime = D.row_type row = "datetime" in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let anchor_id = "property-date-" ^ ctx.owner_key ^ "-" ^ ctx.block_uuid ^ "-" ^ ident in
  let key = "date-picker-" ^ anchor_id in
  let dismiss () = S.remove_view_overlay key in
  let open_picker () =
    S.push_view_overlay context ~key
      ~view:(date_picker_pop ~anchor_target:anchor_id ctx ~ident ~is_datetime ~value
        ~on_dismiss:dismiss) ~on_escape:(fun () -> ());
    Runtime.flush ()
  in
  (* cljs reveals .property-panel-edit-btn while the pointer is over
     the property-pair; without a row-supplied signal fall back to
     hover on the value cell itself *)
  let hover =
    match hover with Some h -> h | None -> Signal.state sched false
  in
  (Lui_elements.row ~gap:4 ~cross:`center ~grow:1.0 ~accessibility_identifier:anchor_id
     ~style_class:"ls-datetime"
     ~on_pointer_enter:(fun _ ->
       Signal.set hover true;
       Runtime.flush ())
     ~on_pointer_leave:(fun _ ->
       if Runtime.signal_get hover then (
         Signal.set hover false;
         Runtime.flush ()))
     [ (if D.value_empty_p value then
          (* empty date has no journal link — keep the ghost button so
             a click opens the picker *)
          value_button ~text:""
            ~on_press:(fun _ -> open_picker ())
        else
          (match ymd_of_datetime_value value with
           | Some (y, m, d) ->
               (* cljs datetime-value renders the journal page-ref —
                  the text navigates, the pencil opens the picker *)
               link ~style_class:"page-ref"
                 ~url:
                   ("#/page/"
                   ^ Ui_services.uri_encode_component
                       (Dates.journal_title_ymd ~y ~m ~d))
                 ~target:`self_
                 ~text:(date_display (D.row_type row) value) []
           | None ->
               value_button
                 ~text:(date_display (D.row_type row) value)
                 ~on_press:(fun _ -> open_picker ())))
     ; (if D.value_empty_p value then Logseq_el.nothing
        else
          (* cljs .property-panel-edit-btn is hover-only inside the
             property panel (block-below pills keep it always visible) —
             the row's pointer enter/leave drives the opacity *)
          box ~opacity:(reactive
                          (fun h -> if h then 1. else 0.)
                          (Signal.value hover))
            [ Ui_components.button ~variant:`ghost ~size:`icon ~icon:(`app "edit")
                ~style_class:"prop-edit-ico"
                ~width:18 ~height:18
                ~data_attrs:[ ("style", "min-width:0;padding:0") ]
                ~label:(I18n.t "ui/edit")
                ~on_press:(fun _ -> open_picker ()) [] ])

     ])
    context parent

(* chips of the current refs — click navigates to the page *)
let ref_chips row : t list =
  let value = D.row_value row in
  List.filter_map
    (fun r ->
      let title = D.ref_title r in
      if title = "" then None
      else
        let class_p = D.ref_is_class r in
        Some
          (Ui_components.button ~variant:`secondary ~size:`sm
             ~text:((if class_p then "#" else "") ^ title)
             ~on_press:(fun _ ->
               match D.ref_uuid r with
               | Some u ->
                   Runtime.send
                     (Action.Navigate_to (Model.Page u))
               | None -> ())
             []))
    (D.value_elems value)

(* multi-toggle extends picker — stays open across picks *)
let extends_view ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let open_ = Signal.state sched false in
  let ident = D.row_ident row |> Option.value ~default:"" in
  (* (option wire value, selected bool) — rebuilt on each toggle *)
  let picker_st =
    Signal.state sched
      (None
        : (W.t list * int list) option)
  in
  let load () =
    match D.entity_id_of (D.row_prop row) with
    | None -> ()
    | Some property_id ->
        ignore
          (let* data =
             D.node_selector_data ~property_id
               ~block:(D.uuid_ref ctx.block_uuid)
           in
           let selected =
             List.filter_map D.entity_id_of
               (D.value_elems (D.row_value row))
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
                 List.concat_map (fun pid -> ids_of m pid) selected
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
           Runtime.signal_set picker_st (Some (options, selected));
           Js.Promise.resolve ())
  in
  let toggle id =
    match Runtime.signal_get picker_st with
    | None -> ()
    | Some (options, selected) ->
        let selected' =
          if List.mem id selected then (
            ignore
              (D.delete_property_value ~block_uuid:ctx.block_uuid ~ident
                 ~value:(W.Int id));
            List.filter (fun x -> x <> id) selected)
          else (
            ignore
              (D.set_block_property ~block_uuid:ctx.block_uuid ~ident
                 ~value:(W.Int id));
            id :: selected)
        in
        S.refresh_all ();
        Runtime.signal_set picker_st (Some (options, selected'))
  in
  let chips = ref_chips row in
  (column ~gap:2 ~grow:1.0
     [ Lui_elements.row ~gap:4 ~cross:`center
         (chips
         @ [ Ui_components.button ~variant:`ghost ~icon:(`app "plus") ~text:""
               ~label:(I18n.t "property/select-property-placeholder")
               ~on_press:(fun _ ->
                 load ();
                 Runtime.signal_set open_ true)
               []
           ])
     ; if_ ~test:(Signal.value open_)
         (popover ~role:`menu ~anchor:`below ~anchor_alignment:`start
            ~anchor_offset:4.0 ~min_width:220
            ~transition:Ui_components.popover_transition
            ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
            [ reactive
                ~equal:(fun a b ->
                  match a, b with
                  | None, None -> true
                  | Some (_, s1), Some (_, s2) -> s1 = s2
                  | _ -> false)
                (fun m ->
                   match m with
                   | None -> column []
                   | Some (options, selected) ->
                       column
                         (List.filter_map
                            (fun o ->
                              match D.entity_id_of o with
                              | None -> None
                              | Some id ->
                                  Some
                                    (menu_item ~text:(D.ref_title o)
                                       ~checked:(List.mem id selected)
                                       ~on_press:(fun _ -> toggle id)
                                       []))
                            options))
                (Signal.value picker_st)
            ])
     ])
    context parent

let closed_value_view ~positioned ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let open_ = Signal.state sched false in
  let value = D.row_value row in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let items_st : Sel.item list option Signal.state =
    Signal.state sched None
  in
  let close () = Runtime.signal_set open_ false in
  let display =
    let txt = D.value_display value in
    if txt = "logseq.property/empty-placeholder" then "" else txt
  in
  let icon_id = closed_value_icon_id value in
  let label = if display = "" then I18n.t "ui/empty" else display in
  let show_text = not (positioned && ident = "logseq.property/status" && Option.is_some icon_id) in
  (column ~gap:0 ~grow:1.0
     [ Ui_components.with_props
         [ Ui_components.Prop.hover_background "var(--lx-gray-03)"
         ; Ui_components.Prop.hover_foreground "inherit" ]
         (Ui_components.button ~variant:`ghost ~label ~height:24 ~min_height:24
            ~padding_horizontal:0 ~padding_vertical:0 ~main:`start
            ~style_class:"pv-closed-value"
         ~on_press:(fun _ ->
           if Runtime.signal_get open_ then close ()
           else (
             Runtime.signal_set items_st None;
             Runtime.signal_set open_ true;
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
                                   (Sel.item ?icon:(closed_value_icon_id c) ~checked:(D.entity_id_of value = Some id) title (fun () ->
                                        set_scalar ctx ~ident
                                          ~value:(W.Int id);
                                        close ()))
                             | None -> None))
                       (D.row_closed_values row)
                   in
                   let items = if D.value_empty_p value then items else items @ [ Sel.item ~icon:"x" (I18n.t "property/clear-value")
                       (fun () ->
                          ignore (let* _ = D.remove_block_property ~block_uuid:ctx.block_uuid ~ident in
                                  S.refresh_all ();
                                  Js.Promise.resolve ());
                          close ()) ] in
                   if Runtime.signal_get open_ then
                     Runtime.signal_set items_st (Some items)))))
         [ Lui_elements.row ~gap:4 ~cross:`center
             ((match icon_id with None -> [] | Some id -> [ Icons.icon id ])
              @ if show_text then [ text ~value:label [] ] else []) ])
     ; if_ ~test:(Signal.value open_)
         (closed_value_popup ~on_dismiss:(fun _ -> close ())
            (reactive
                ~equal:(fun a b -> Option.is_some a = Option.is_some b)
                (fun m ->
                   match m with
               | None -> column ~gap:2 []
                   | Some items ->
                       Sel.view ~compact:true ~show_empty_result:false
                         ~placeholder:
                           (I18n.t1 "property/set-placeholder"
                              (D.row_title row)) items)
                (Signal.value items_st)))
     ])
    context parent

(* node/page/class/asset: ref chips + picker button *)
let node_view ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let open_ = Signal.state sched false in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let close () = Runtime.signal_set open_ false in
  let chips = ref_chips row in
  (column ~gap:2 ~grow:1.0
     [ Lui_elements.row ~gap:4 ~cross:`center
         (chips
         @ [ Ui_components.button ~variant:`ghost ~icon:(`app "plus") ~text:""
               ~label:(I18n.t "property/select-property-placeholder")
               ~on_press:(fun _ -> Runtime.signal_set open_ true)
               []
           ])
     ; if_ ~test:(Signal.value open_)
         (fun context' parent' ->
           let block = D.uuid_ref ctx.block_uuid in
           let prop = D.row_prop row in
           let on_pick id =
             let existing =
               List.filter_map D.entity_id_of
                 (D.value_elems (D.row_value row))
             in
             if List.mem id existing then (
               D.delete_property_value ~block_uuid:ctx.block_uuid ~ident
                 ~value:(W.Int id)
               |> ignore;
               S.refresh_all ())
             else set_scalar ctx ~ident ~value:(W.Int id);
             close ()
           in
           let initial, on_search =
             node_items_source ~block ~prop ~on_pick
           in
           (picker_dropdown ~open_
              ~placeholder:
                (I18n.t1 "property/set-placeholder" (D.row_title row))
              ~new_option:(Some (new_node ctx row ~close))
              ~initial ~on_search)
             context' parent')
     ])
    context parent

(* ---------- dispatch ---------- *)

(* [view ctx row] renders the cell's value control inside the row's
   value column. [hover] (when the row supplies one) reflects pointer
   hover over the whole property-pair so hover-only affordances like
   the date edit pencil match the cljs row-hover rule. *)
let rec view ?(positioned = false) ~(hover : bool Signal.state option)
    ctx row : t =
  let row' = D.row_with_effective_value row in
  let ty = D.row_type row' in
  let ident = D.row_ident row' |> Option.value ~default:"" in
  if Ui_services.env_publishing () then
    let rec display value =
      match value with
      | W.Set values | W.List values | W.Array values ->
          Lui_elements.row ~gap:6 (List.map display values)
      | W.Map _ -> (match D.ref_uuid value with
          | Some uuid -> link ~url:("#/page/" ^ uuid) ~target:`self_
              ~text:(D.ref_title value) []
          | None -> Logseq_el.fragment (Render_inline.parse (D.value_display value)))
      | _ -> Logseq_el.fragment (Render_inline.parse (D.value_display value))
    in
    display (D.row_effective_value row')
  else if ident = "logseq.property/icon" then icon_view ctx row'
  else if D.row_closed_values row' <> [] then closed_value_view ~positioned ctx row'
  else
    match ty with
    | "checkbox" -> checkbox_view ctx row'
    | "number" -> scalar_edit_cell ctx row'
    | "date" | "datetime" -> date_view ~hover ctx row'
    | "url" -> url_view ctx row'
    | "node" | "asset" | "page" | "class" | "property" ->
        if ident = "logseq.property.class/extends" then
          extends_view ctx row'
        else node_view ctx row'
    | _ ->
        let cell = scalar_edit_cell ctx row' in
        (* cljs embeds every non-closed scalar value in a
           .property-block-container .ls-block row — control-wrap bullet
           + content; empty values show only .property-panel-bullet *)
        if ty = "default" && D.ref_title (D.row_value row') <> ""
        then block_value_wrap cell
        else cell

(* :logseq.property/icon's editing cell is the icon picker, not a
   text/closed-value editor — the {:type :id} map value can't be
   produced by the generic write paths. The cell shows the current
   icon (or Empty) and pressing it opens the picker anchored on
   itself; choices write the map the icon schema requires. *)
and icon_view ctx row : t =
 fun context parent ->
  let anchor_id = "pv-icon-" ^ ctx.block_uuid in
  let icon =
    match D.row_value row with
    | W.Map _ as m -> (
        match (Wire.get m "type", Wire.get m "id") with
        | Some (W.Keyword ty), Some (W.String id) -> Some (ty, id)
        | Some (W.String ty), Some (W.String id) -> Some (ty, id)
        | _ -> None)
    | _ -> None
  in
  (Lui_elements.row ~gap:0 ~grow:1.0
     [ Ui_components.button ~variant:`ghost ~grow:1.0 ~text_alignment:`start
         ~accessibility_identifier:anchor_id ~style_class:"pv-scalar"
         ~label:"Icon"
         ~foreground:"var(--ls-primary-text-color)"
         ~text:(match icon with Some _ -> "" | None -> I18n.t "ui/empty")
         ~data_attrs:
           [ ( "style"
             , "height:auto;min-height:0;padding:0;line-height:20px;\
                justify-content:flex-start" ) ]
         ~on_press:(fun _ ->
           match Ui_services.dom_query ("#" ^ anchor_id) with
           | Some anchor ->
               Icon_picker.open_picker ~anchor ~del:(icon <> None)
                 ~on_chosen:(fun c ->
                   (match c with
                    | Icon_picker.Remove ->
                        D.remove_block_property ~block_uuid:ctx.block_uuid
                          ~ident:"logseq.property/icon"
                    | Icon_picker.Emoji id ->
                        D.set_block_property ~block_uuid:ctx.block_uuid
                          ~ident:"logseq.property/icon"
                          ~value:
                            (W.Map
                               [ (W.Keyword "type", W.Keyword "emoji")
                               ; (W.Keyword "id", W.String id) ])
                    | Icon_picker.Tabler (id, color) ->
                        D.set_block_property ~block_uuid:ctx.block_uuid
                          ~ident:"logseq.property/icon"
                          ~value:
                            (W.Map
                               ([ (W.Keyword "type", W.Keyword "tabler-icon")
                                ; (W.Keyword "id", W.String id) ]
                                @
                                match color with
                                | Some c -> [ (W.Keyword "color", W.String c) ]
                                | None -> [])))
                   |> ignore;
                   S.refresh_all ())
           | None -> ())
         (match icon with
          | Some (ty, id) -> [ Icon_picker.icon_el (ty, id) ]
          | None -> []) ])
    context parent

(* cljs embeds non-closed values in
   .property-block-container > .ls-block > .block-main-container —
   control-wrap (hidden fold arrow + bullet) + a non-flex content wrap
   so inline values (links) keep inline layout and line-box height *)
and block_value_wrap (inner : t) : t =
  Lui_elements.box ~style_class:"property-block-container content"
    ~data_attrs:[ ("style", "width:100%") ]
    [ Lui_elements.box ~style_class:"ls-block"
        ~transition:Ui_components.block_transition
        [ Lui_elements.row ~gap:4 ~cross:`start ~grow:1.0
            ~style_class:"block-main-container"
            [ Lui_elements.row ~gap:0 ~cross:`center
                ~style_class:"block-control-wrap"
                ~data_attrs:[ ("style", "display:flex;flex-direction:row;\
                  align-items:center") ]
                [ Ui_components.with_props
                    [ Ui_components.Prop.pressed_opacity 0.3 ]
                    (box ~style_class:"block-control"
                       ~min_width:22 ~min_height:22 ~opacity:0.4
                       ~data_attrs:
                         [ ( "style"
                           , "font-size:0.875rem;line-height:1.42857;\
                              margin-top:1px;padding:0.125rem;\
                              user-select:none;cursor:default;\
                              text-decoration:none" ) ]
                       [])
                ; box ~style_class:"bullet-container"
                    [ box ~style_class:"bullet" [] ] ]
            ; Lui_elements.box ~grow:1.0
                [ inner ] ] ] ]

(* cljs url values render the external-link inline inside the plain
   property-value cell (no .property-block-container / .ls-block wrap);
   click navigates (target=_blank), editing goes through the property
   menu. empty values keep the press-to-edit affordance *)
and url_view ctx row : t =
  let value = D.row_value row in
  let url = String.trim (D.value_display value) in
  if url = "" then scalar_edit_cell ctx row
  else
    (Ui_components.with_props
         [ Ui_components.Prop.text_decoration "none" ]
         (link ~url ~target:`blank ~style_class:"external-link"
         ~data_attrs:
           [ ("data-type", "url")
           ; ( "style"
             , "border-bottom:1px solid;\
                overflow-wrap:anywhere;word-break:break-word;\
                white-space:normal;min-width:0;max-width:100%" )
           ]
         ~text:url []))
