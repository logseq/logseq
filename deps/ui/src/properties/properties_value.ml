(* Property value cells — declarative LUI components.

   Each cell is a semantic control per property type (web master's
   cell structure kept where it maps):
   - text/url:    a ghost button showing the display text; press swaps
                  in an inline text_field (Enter commits — the LUI
                  event set has no blur event yet, recorded in NOTES)
   - number:      same, commit parses Float
   - checkbox:    LUI checkbox; toggle writes Bool
   - date/datetime: ghost button opens an anchored dropdown_menu with
                  a text_field (YYYY-MM-DD → journal-day ref;
                  datetime parses to ms epoch)
   - node/page/class/asset: chips of the current refs + a picker
                  button opening an anchored dropdown_menu hosting
                  Properties_select.view (initial items + async search
                  + "New option")
   - closed-value: same picker dropdown over the row's closed values
   - logseq.property.class/extends: multi-toggle dropdown_menu whose
                  menu_items carry ~checked (stays open across picks)

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
  { block_uuid : string
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
          ~title ~new_block_id:(Platform.random_uuid ()) ()
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

(* "YYYY-MM-DD", "YYYY-MM-DD HH:MM[:SS[.fff]]", same with a T —
   the datetime subset users type (JS Date.parse parity); returns
   None on malformed input like Date.parse's NaN *)
let parse_ms (s : string) : float option =
  let num i n =
    if i + n > String.length s then None
    else
      let ok = ref true in
      for j = i to i + n - 1 do
        match s.[j] with '0' .. '9' -> () | _ -> ok := false
      done;
      if !ok then Some (int_of_string (String.sub s i n)) else None
  in
  match num 0 4, num 5 2, num 8 2 with
  | Some y, Some m, Some d
    when String.length s >= 10 && s.[4] = '-' && s.[7] = '-' ->
      let hh, mm, ss =
        if String.length s >= 16 && (s.[10] = 'T' || s.[10] = ' ')
           && s.[13] = ':'
        then
          match num 11 2, num 14 2 with
          | Some hh, Some mm ->
              let ss =
                if String.length s >= 19 && s.[16] = ':' then
                  Option.value (num 17 2) ~default:0
                else 0
              in
              (hh, mm, ss)
          | _ -> (0, 0, 0)
        else (0, 0, 0)
      in
      Some
        (Js.Date.valueOf
           (Js.Date.make ~year:(float y) ~month:(float (m - 1))
              ~date:(float d) ~hours:(float hh) ~minutes:(float mm)
              ~seconds:(float ss) ()))
  | _ -> None

let commit_date_text ctx ident ~is_datetime v =
  let v = String.trim v in
  if is_datetime then
    match if v = "" then Some (Js.Date.now ()) else parse_ms v with
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
  let d = Js.Date.fromFloat ms in
  ( int_of_float (Js.Date.getFullYear d)
  , int_of_float (Js.Date.getMonth d) + 1
  , int_of_float (Js.Date.getDate d) )

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

let new_choice ctx row ~close text =
  let ident = D.row_ident row |> Option.value ~default:"" in
  (let* res = D.upsert_closed_value ~ident ~value:text () in
  (match D.geti res "db/id" with
   | Some id -> set_scalar ctx ~ident ~value:(W.Int id)
   | None -> ());
  close ();
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
  (dropdown_menu ~anchor:`below ~anchor_alignment:`stretch
     ~anchor_offset:4.0 ~min_width:240
     ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
     [ dyn ~equal:(fun a b -> Option.is_some a = Option.is_some b)
         (fun m ->
            match m with
        | None -> column ~gap:2 []
            | Some (items, on_search) ->
                Sel.view ~placeholder ?new_option
                  ~on_search:(Some on_search) items)
         (Signal.value items_st)
     ])
    context parent

(* helper: ghost-button value cell — [text] = display label *)
let value_button ~text ~on_press : t =
  button ~variant:`ghost ~grow:1.0 ~text_alignment:`start ~text
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
    if not (Signal.get_state editing) then ()
    else (
      let v = Signal.get_state buffer in
      clear_active_edit ctx row;
      Runtime.signal_set editing false;
      if save then commit_or_cancel ctx row v else ctx.refresh ())
  in
  let open_editor ~steal () =
    !close_editor ();
    add_active_edit ctx row;
    set_edit_buffer ctx row (Signal.get_state buffer);
    Runtime.signal_set editing true;
    close_editor := (fun () -> commit true);
    if steal then !(Editor_state.close_block_editor) ()
  in
  if Signal.get_state editing then (
    add_active_edit ctx row;
    close_editor := (fun () -> commit true));
  (column ~gap:0 ~grow:1.0
     [ if_ ~test_signal:(Signal.map (fun e -> not e) (Signal.value editing))
         (value_button ~text:initial ~on_press:(fun _ ->
              open_editor ~steal:true ()))
     ; if_ ~test_signal:(Signal.value editing)
         (text_field ~autofocus:true ?submit_on_enter:Sel.submit_on_enter_opt
            ~text:(edit_buffer ctx row)
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

let date_view ctx row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let open_ = Signal.state sched false in
  let value = D.row_value row in
  let is_datetime = D.row_type row = "datetime" in
  let day = today_day () in
  let ident = D.row_ident row |> Option.value ~default:"" in
  let buffer =
    Signal.state sched
      (if is_datetime then ""
       else
         Printf.sprintf "%04d-%02d-%02d"
           (day / 10000)
           (day mod 10000 / 100)
           (day mod 100))
  in
  (column ~gap:0 ~grow:1.0
     [ value_button
         ~text:
           (if D.value_empty_p value then ""
            else date_display (D.row_type row) value)
         ~on_press:(fun _ -> Runtime.signal_set open_ true)
     ; if_ ~test_signal:(Signal.value open_)
         (dropdown_menu ~anchor:`below ~anchor_alignment:`start
            ~anchor_offset:4.0 ~min_width:220
            ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
            [ text_field ~autofocus:true ?submit_on_enter:Sel.submit_on_enter_opt
                ~text:(Signal.get_state buffer)
                ~on_input:(fun ev ->
                  match ev with
                  | Lui_protocol.TextChanged (_, t) ->
                      Signal.set buffer t
                  | _ -> ())
                ~on_submit:(fun _ ->
                  commit_date_text ctx ident ~is_datetime
                    (Signal.get_state buffer);
                  Runtime.signal_set open_ false)
                []
            ])
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
          (button ~variant:`secondary ~size:`sm
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
    match Signal.get_state picker_st with
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
         @ [ button ~variant:`ghost ~icon:`plus ~text:""
               ~on_press:(fun _ ->
                 load ();
                 Runtime.signal_set open_ true)
               []
           ])
     ; if_ ~test_signal:(Signal.value open_)
         (dropdown_menu ~anchor:`below ~anchor_alignment:`start
            ~anchor_offset:4.0 ~min_width:220
            ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
            [ dyn
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

let closed_value_view ctx row : t =
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
  (column ~gap:0 ~grow:1.0
     [ value_button ~text:display
         ~on_press:(fun _ ->
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
                                   (Sel.item title (fun () ->
                                        set_scalar ctx ~ident
                                          ~value:(W.Int id);
                                        close ()))
                             | None -> None))
                       (D.row_closed_values row)
                   in
                   Runtime.signal_set items_st (Some items);
                   Runtime.signal_set open_ true)))
     ; if_ ~test_signal:(Signal.value open_)
         (dropdown_menu ~anchor:`below ~anchor_alignment:`stretch
            ~anchor_offset:4.0 ~min_width:220
            ~on_dismiss:(fun _ -> close ())
            [ dyn ~equal:(fun a b -> Option.is_some a = Option.is_some b)
                (fun m ->
                   match m with
               | None -> column ~gap:2 []
                   | Some items ->
                       Sel.view
                         ~placeholder:
                           (I18n.t1 "property/set-placeholder"
                              (D.row_title row))
                         ~new_option:(fun text ->
                           new_choice ctx row ~close text)
                         items)
                (Signal.value items_st)
            ])
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
         @ [ button ~variant:`ghost ~icon:`plus ~text:""
               ~on_press:(fun _ -> Runtime.signal_set open_ true)
               []
           ])
     ; if_ ~test_signal:(Signal.value open_)
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
   value column. *)
let view ctx row : t =
  let row' = D.row_with_effective_value row in
  let ty = D.row_type row' in
  let ident = D.row_ident row' |> Option.value ~default:"" in
  if D.row_closed_values row' <> [] then closed_value_view ctx row'
  else
    match ty with
    | "checkbox" -> checkbox_view ctx row'
    | "number" -> scalar_edit_cell ctx row'
    | "date" | "datetime" -> date_view ctx row'
    | "node" | "asset" | "page" | "class" | "property" ->
        if ident = "logseq.property.class/extends" then
          extends_view ctx row'
        else node_view ctx row'
    | _ -> scalar_edit_cell ctx row'
