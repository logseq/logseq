(* Table/list/gallery body rendering for views — mirrors
   components/views.cljs + shui table/core.cljc DOM contract.

   Declarative: every producer returns a Lui_elements.t. Rows stream in
   through `keyed`/`Virt_list` item arrays derived from the inst's vstate
   signal; per-row state (selection, hover, collapsed groups) binds via
   reactive props — no imperative rebuilds. Overlay surfaces (menus,
   dialogs) mount imperatively through Views_popup. *)

module D = Logseq_el
module I = I18n
module V = Views_state
module Wr = Views_wire
module W = Wire
module P = Views_popup
module L = Lui_protocol

type t = Lui_elements.t

open Lui_elements

let if_ = Lui_elements.if_
let keyed = Lui_elements.keyed
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  (Signal.value (inst.V.st))
let refresh inst = (V.ops ()).V.o_refresh inst

(* Portable view glyphs retain their semantic ls-icon-* markers. *)
let icon_el ?(cls = "") name : t =
  icon ~name:(Icons.name_ref name) ~point_size:16
    ~style_class:
      ("ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls)
    []

(* icons whose glyph flips with state (sort direction) — a reactive
   prop on one icon node, no remount *)
let icon_dyn (sig_ : string Signal.signal) : t =
  icon ~name:(reactive Icons.name_ref sig_) ~point_size:16 []

(* ---------- columns ---------- *)

let is_page_row blk =
  match W.get blk "block/name" with Some _ -> true | _ -> false

let column_of_property (p : W.t) : V.column option =
  match Wr.ident_of_value (Option.value (W.get p "db/ident") ~default:W.Nil)
  with
  | Some ident -> (
      let ty =
        match
          Wr.ident_of_value
            (Option.value (W.get p "logseq.property/type") ~default:W.Nil)
        with
        | Some t -> t
        | None -> "default"
      in
      let skip =
        List.mem ident
          [ "logseq.property/hide?"; "logseq.property/built-in?"
          ; "logseq.property.class/properties"; "logseq.property.asset/checksum"
          ; "logseq.property/created-from-property"; "block/created-at"
          ; "block/updated-at"; "block/order"; "block/collapsed?" ]
        || ty = "map" || ty = "entity"
      in
      if skip then None
      else
        Some
          { V.c_id = ident
          ; c_name =
              Option.value (W.map_get_string p "block/title") ~default:ident
          ; c_type = ty
          ; c_prop = Some p
          ; c_disable_hide = false
          ; c_many =
              (match
                 Wr.ident_of_value
                   (Option.value (W.get p "db/cardinality") ~default:W.Nil)
               with
               | Some "db.cardinality/many" -> true
               | _ -> false)
          })
  | None -> None

let builtin_column id name ty ?(disable_hide = false) ?(many = false) ()
    : V.column =
  { V.c_id = id; c_name = name; c_type = ty; c_prop = None
  ; c_disable_hide = disable_hide; c_many = many }

let select_column () : V.column =
  builtin_column "select" (I.t "view.table/select-column") "default" ~disable_hide:true ()

(* cljs views.cljs keeps the :id column in `columns` but unconditionally
   hides it in `visible-columns` (assoc :id false) — never added here *)

let title_column () : V.column = builtin_column "block/title" (I.t "view.table/name-column") "node" ()

(* all_pages.cljs uses (t :page/name) — "Page name" — for its title column *)
let page_title_column () : V.column =
  builtin_column "block/title" (I.t "view.table/group-page-name") "string" ()

let tags_column () : V.column =
  builtin_column "block/tags" (I.t "property.built-in/tags") "node" ~many:true ()

(* cljs get-column-size defaults *)
let column_size (c : V.column) =
  match c.V.c_id with
  | "select" -> 32
  | "id" -> 48
  | "logseq.property/query" -> 400
  | "block/title" | "block/name" -> 360
  | "block/created-at" | "block/updated-at" -> 160
  | "add-property" -> 160
  | _ -> 180

let column_width (s : V.vstate) (c : V.column) =
  if c.V.c_id = "id" then 48
  else
    match s.V.table_resize with
    | Some resize when resize.V.resize_view = s.V.view_uuid &&
        resize.V.resize_column = c.V.c_id -> resize.V.resize_preview
    | _ -> Option.value (V.Smap.find_opt c.V.c_id s.V.sized) ~default:(column_size c)

let with_column_width inst c elem =
  Ui_parts.int_prop L.WidthValue
    ~value:(reactive (fun s -> column_width s c) (sig_of inst))
    (Ui_parts.int_prop L.MinWidth
       ~value:(reactive (fun s -> column_width s c) (sig_of inst)) elem)

let inner_cell children =
  Ui_components.with_props [ Ui_components.Prop.overflow `hidden ]
    (row ~cross:`center ~height:32 ~padding_horizontal:8 ~min_width:0 children)

let created_column () : V.column =
  builtin_column "block/created-at" (I.t "page/created-at") "datetime" ()

let updated_column () : V.column =
  builtin_column "block/updated-at" (I.t "page/updated-at") "datetime" ()

let page_column () : V.column = builtin_column "block/page" (I.t "view.table/page") "node" ()

let refs_count_column () : V.column =
  builtin_column "block.temp/refs-count" (I.t "page/backlinks") "number" ()

(* build-columns port *)
let titleize_ident ident =
  let tail =
    match String.rindex_opt ident '/' with
    | Some i -> String.sub ident (i + 1) (String.length ident - i - 1)
    | None -> ident
  in
  String.split_on_char '-' tail
  |> List.map (fun s ->
         if s = "" then s
         else String.make 1 (Char.uppercase_ascii s.[0])
              ^ String.sub s 1 (String.length s - 1))
  |> String.concat " "

(* bare-ident column for query-result `properties` (keyword list) *)
let column_of_ident (s : V.vstate) (ident : string) : V.column option =
  match ident with
  | "block/title" | "block/uuid" | "block/name" | "db/id" | "block/parent"
  | "block/left" | "block/refs" | "block/path-refs" | "block/link"
  | "block/format" | "block/properties" | "block/properties-order"
  | "block/properties-text-values" | "block/pre-block?" | "block/order"
  | "block/collapsed?" | "block/created-at" | "block/updated-at" -> None
  | "block/tags" ->
      Some
        { (builtin_column "block/tags" (I.t "property.built-in/tags") "node" ()) with
          V.c_many = true }
  | "block/page" -> Some (page_column ())
  | "block/journal-day" ->
      Some (builtin_column ident (titleize_ident ident) "datetime" ())
  | _ when
      String.length ident > 7
      && String.sub ident 0 7 = "logseq." -> None
  | _ -> (
      match Hashtbl.find_opt s.V.all_props ident with
      | Some p -> column_of_property p
      | None ->
          Some (builtin_column ident (titleize_ident ident) "default" ()))

let build_columns (inst : V.inst) (properties : W.t list) : V.column list =
  let s = V.get inst in
  let props = List.filter_map column_of_property properties in
  (* cljs (conj properties tags-column) — conj on a list conses, so
     Tags lands BEFORE the property columns, not after *)
  let with_tags =
    if List.exists (fun c -> c.V.c_id = "block/tags") props then props
    else
      { (builtin_column "block/tags" (I.t "property.built-in/tags") "node" ()) with
        V.c_many = true }
      :: props
  in
  match inst.V.kind with
  | V.KAllPages ->
      [ (select_column ()); (page_title_column ()); (refs_count_column ()); (tags_column ())
      ; (created_column ()); (updated_column ()) ]
  | V.KTagPage _ | V.KPropertyPage _ ->
      (* cljs objects.cljs: Asset-class tag pages get a "File" column
         before the logseq property columns *)
      [ (select_column ()); (title_column ()) ]
      @ (if s.V.asset_class
         then
           [ builtin_column "file" (I18n.t "file/label") "default"
               ~disable_hide:true () ]
         else [])
      @ with_tags
      @ [ (created_column ()); (updated_column ()); (page_column ()) ]
  | V.KLinkedRefs | V.KUnlinkedRefs ->
      (* cljs build-columns [] {:add-page-column? true} — the "#" index
         column is a cljs-only display column (visible_columns drops
         "id") *)
      [ (select_column ()); (title_column ()) ] @ with_tags
      @ [ (created_column ()); (updated_column ()); (page_column ()) ]
  | V.KQuery _ ->
      (* cljs get-query-columns: build-columns over view-data :properties
         (idents); created/updated only when pulled for advanced queries *)
      let qcols = List.filter_map (column_of_ident s) s.V.query_idents in
      let tail =
        if s.V.is_advanced then []
        else [ (created_column ()); (updated_column ()) ]
      in
      [ (select_column ()); (title_column ()) ] @ qcols @ tail
      @ (if s.V.is_advanced
         then
           (if List.mem "block/created-at" s.V.query_idents
            then [ (created_column ()) ] else [])
           @ (if List.mem "block/updated-at" s.V.query_idents
              then [ (updated_column ()) ] else [])
         else [])

let visible_columns (s : V.vstate) =
  let cols =
    List.filter
      (fun c ->
        c.V.c_id <> "id" && (not (Ui_services.env_publishing ()) || c.V.c_id <> "select") && not (V.Sset.mem c.V.c_id s.V.hidden))
      s.V.columns
  in
  match s.V.ordered with
  | [] -> cols
  | ord ->
      let firsts =
        List.filter_map
          (fun id -> List.find_opt (fun c -> c.V.c_id = id) cols)
          ord
      in
      firsts
      @ List.filter
          (fun c -> c.V.c_id = "select" || not (List.mem c.V.c_id ord))
          cols

(* ---------- cell values ---------- *)

let pad2 n =
  if n < 10 then "0" ^ string_of_int n else string_of_int n

(* cljs date/int->local-time-2 → "yyyy-MM-dd HH:mm" local *)
let fmt_date ms =
  let d = Js.Date.fromFloat ms in
  Printf.sprintf "%04d-%s-%s %s:%s"
    (int_of_float (Js.Date.getFullYear d))
    (pad2 (int_of_float (Js.Date.getMonth d) + 1))
    (pad2 (int_of_float (Js.Date.getDate d)))
    (pad2 (int_of_float (Js.Date.getHours d)))
    (pad2 (int_of_float (Js.Date.getMinutes d)))

let fmt_cell_value (c : V.column) v =
  match v with
  | W.Int ms ->
      if c.V.c_type = "datetime" then fmt_date (float_of_int ms)
      else Wr.prop_text v
  | W.Int64 ms ->
      if c.V.c_type = "datetime" then fmt_date (Int64.to_float ms)
      else Wr.prop_text v
  | W.Date_ms ms -> fmt_date (Int64.to_float ms)
  | _ -> Wr.prop_text v

let cell_value blk (c : V.column) : W.t =
  match c.V.c_id with
  | "block/title" | "block.temp/refs-count" | "block/created-at"
  | "block/updated-at" | "block/page" | "block/tags" ->
      Option.value (W.get blk c.V.c_id) ~default:W.Nil
  | id -> (
      match W.get blk id with
      | Some v -> v
      | None ->
          Option.value
            (W.get
               (Option.value (W.get blk "block/properties") ~default:W.Nil)
               id)
            ~default:W.Nil)

(* ---------- cells ---------- *)

let all_row_uuids (s : V.vstate) =
  let rows = match s.V.data with
  | Wr.VFlat { rows; _ } -> rows
  | Wr.VGrouped gs -> List.concat_map (fun g -> g.Wr.grows) gs
  | Wr.VGroupedList gs ->
      List.concat_map (fun g -> List.concat_map snd g.Wr.glparts) gs
  | Wr.VEmpty -> []
  in
  let seen = ref V.Sset.empty in
  List.filter (fun uuid ->
      if V.Sset.mem uuid !seen then false
      else (seen := V.Sset.add uuid !seen; true)) rows

let select_row inst ~uuid ~checked ~shift =
  V.update inst (fun state ->
      V.table_select_row state ~rows:(all_row_uuids state) ~uuid ~checked ~shift)

(* The selection target is 32 points; its centered 16-point chrome
   appears while hovered or checked. *)
let checkbox_el ?(mixed = fun _ -> false) inst ~jtrigger ~id ~aria_label ~shown ~on_toggle : t =
  Ui_parts.float_prop L.Opacity
    ~value:(reactive (fun s -> if shown s || mixed s then 1. else 0.) (sig_of inst))
    (Ui_components.with_props
       [Ui_components.Prop.hover_opacity 1.
       ;Ui_components.Prop.indicator_border_color "var(--lx-checkbox-border)"
       ;Ui_components.Prop.checked_indicator_border_color "hsl(var(--border))"]
      (Lui_elements.checkbox ~accessibility_identifier:id ~label:aria_label
        ~width:32 ~height:32 ~main:`center ~cross:`center
        ~border_color:"hsl(var(--primary))"
        ~transition:"opacity 150ms"
        ~style_class:(if jtrigger then "jtrigger" else "")
        ~checked:(reactive shown (sig_of inst))
        ~indeterminate:(reactive mixed (sig_of inst))
        ~on_toggle_detail:(fun ev ->
          match ev with
          | L.ToggleChangedDetail (_, on, modifiers) -> on_toggle on (modifiers land 2 <> 0)
          | _ -> ())
        []))

(* cljs row-checkbox: label.jtrigger > shui checkbox *)
let select_cell inst ~row_uuid ~blk : t =
  let dbid =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  row ~cross:`center
    [ (* cljs label.jtrigger[data-table-row-select] — e2e clicks it
         through row.locator("[data-table-row-select]") *)
      Ui_components.with_props [ Ui_components.Prop.cursor `pointer ]
      (row ~cross:`center ~main:`center ~width:32 ~height:32
        ~min_width:0 ~grow:1.
        ~style_class:"jtrigger"
        ~data_attrs:[ ("data-table-row-select", "true") ]
        [ checkbox_el inst ~jtrigger:true ~id:(dbid ^ "-checkbox")
            ~aria_label:(I.t "view.table/select-row")
            ~shown:(fun (s : V.vstate) -> V.table_row_selected s row_uuid)
            ~on_toggle:(fun checked shift ->
              select_row inst ~uuid:row_uuid ~checked ~shift) ])
    ]

let open_row_sidebar row_uuid =
  Ui_services.dom_dispatch_json "ls:open-right-sidebar"
    (Json.Object [ ("uuid", Json.String row_uuid) ])

let title_cell inst ~row_uuid ~blk (c : V.column) : t =
  let title = Wr.prop_text (cell_value blk c) in
  match inst.V.kind, W.get blk "block/name" with
  | V.KAllPages, Some (W.String name) ->
      (* cljs page-title-cell: a.page-ref.truncate — a real anchor so
         the delegated a.page-ref click/hover/context-menu readers pick
         it up; href prefers block/uuid via data-uuid *)
      let page_name =
        if row_uuid <> "" then row_uuid
        else if name <> "" then name
        else title
      in
      inner_cell
        [ row ~cross:`center ~grow:1.
            [ Ui_components.with_props
                [Ui_components.Prop.white_space `nowrap;Ui_components.Prop.text_overflow `ellipsis]
              (link ~style_class:"page-ref" ~text:title
                ~data_attrs:
                  ([ ("data-ref", String.lowercase_ascii page_name)
                   ; ("tabindex", "0"); ("draggable", "true") ]
                   @ if row_uuid <> "" then [ ("data-uuid", row_uuid) ]
                     else [])
                []) ]
        ]
  | _ ->
      fun context parent ->
      let hovered = Signal.state context.Lui_ui.ui_scheduler false in
      let anchor = Printf.sprintf "table-title-%d-%s" inst.V.id row_uuid in
      let hover on = Signal.set hovered on; Runtime.flush () in
      let ghost icon_name title_ on_press =
        Ui_components.button ~variant:`ghost ~size:`icon ~icon:(Icons.name_ref icon_name)
          ~width:24 ~height:24 ~padding:4
          ~foreground:"muted-foreground"
          ~background:"var(--lx-gray-01, var(--ls-primary-background-color))"
          ~label:title_ ~on_press:(fun _ -> on_press ()) []
      in
      (* Actions overlay the title's trailing edge and share its hover owner.
         Their retained nodes remain available for keyboard navigation. *)
      (inner_cell
        [ Ui_components.with_props
            [Ui_components.Prop.position `relative;Ui_components.Prop.overflow `hidden]
              (row ~cross:`center ~grow:1. ~min_width:0 ~height:32
                 ~on_pointer_enter:(fun _ -> hover true)
                 ~on_pointer_leave:(fun _ -> hover false)
                 ~accessibility_identifier:anchor ~data_attrs:["tabindex","0"]
                 ~style_class:"table-block-title"
                 [ (* Keep the caption and overlay actions as sibling hit regions. *)
                   Ui_parts.pressable ~on_press:(fun _ ->
                     Table_title_editor.show ~anchor ~column_width:(column_width (V.get inst) c)
                       {(Decode.block_of_wire blk) with Model.block_uuid=Some row_uuid})
                     (row ~grow:1. ~min_width:0 ~height:32 ~cross:`center
                       [ text ~white_space:"nowrap" (Render_inline.parse ~self:row_uuid title) ])
                 ; Ui_parts.float_prop L.Opacity
                     ~value:(reactive (fun on -> if on then 1. else 0.) (Signal.value hovered))
                     (Ui_components.with_props
                       [Ui_components.Prop.position `absolute;Ui_components.Prop.inset_right (-4.);
                        Ui_components.Prop.inset_top 4.]
                       (row ~cross:`center ~gap:0 ~height:24 ~style_class:"ls-title-ghosts"
                          ~transition:"opacity 100ms cubic-bezier(0.4, 0, 1, 1)"
                          [ ghost "arrow-right" (I.t "ui/open") (fun () ->
                              Runtime.mark_nav ();
                              Platform.set_location_hash
                                ("#/page/" ^ Ui_services.uri_encode_component row_uuid))
                          ; ghost "layout-sidebar-right" (I.t "sidebar.right/open")
                              (fun () -> open_row_sidebar row_uuid) ]))
                 ]) ]) context parent

let prop_cell ~blk (c : V.column) : t =
  match cell_value blk c with
  | W.Map _ as v when Wr.ref_uuid v <> None ->
      let t_ = Option.value (Wr.ref_title v) ~default:"" in
      let href = Option.value (Wr.ref_uuid v) ~default:t_ in
      inner_cell
        [ Ui_components.with_props
            [ Ui_components.Prop.position `relative ]
            (link ~style_class:"page-ref" ~text:t_
               ~data_attrs:
                 [ ("data-uuid", href); ("tabindex", "0")
                 ; ("draggable", "true")
                 ; ("data-ref", String.lowercase_ascii t_) ]
               []) ]
  | W.Array xs when c.V.c_many ->
      (* cljs pv: .property-value-inner > .multi-values > select-items;
         the implicit Page class is hidden *)
      let items =
        List.filter
          (fun x ->
            Wr.prop_text x <> ""
            && (c.V.c_id <> "block/tags"
                || Wr.ident_of_value x <> Some "logseq.class/Page"))
          xs
      in
      let item_els =
        List.concat
          (List.mapi
             (fun i x ->
            let t_ = Wr.prop_text x in
            if c.V.c_id = "block/tags" then
              (* cljs select-item -> page-cp {:tag?}:
                 .block-tag[data-tag-uuid] chip wrapping
                 a.relative.tag[data-ref][data-uuid][draggable] — the
                 delegated context menu reads the chip attrs, click
                 readers the anchor's; siblings join on a
                 span.opacity-50.-ml-1 "," separator *)
              (if i > 0 then
                 [ box ~margin_left:(-8) ~opacity:0.5 [ text ~value:"," [] ] ]
               else [])
              @ [ (let tuuid =
                   Option.value (Wr.ref_uuid x) ~default:""
                 in
                 row ~cross:`center ~gap:4 ~padding_vertical:2
                   ~padding_horizontal:6 ~corner_radius:6
                   ~display:`inline_flex
                   ~style_class:"select-item block-tag"
                   ~data_attrs:
                     ([ ("data-tag-title", t_) ]
                      @ if tuuid <> "" then [ ("data-tag-uuid", tuuid) ]
                        else [])
                   [ Ui_components.with_props
                       [ Ui_components.Prop.position `relative ]
                       (link ~style_class:"tag" ~text:("#" ^ t_)
                       ~data_attrs:
                         ([ ("tabindex", "0"); ("draggable", "true")
                          ; ("data-ref", String.lowercase_ascii t_) ]
                          @ if tuuid <> ""
                            then [ ("data-uuid", tuuid) ]
                            else [])
                       []) ]) ]
            else
              (if i > 0 then [ text ~value:"," [] ] else [])
              @ [ box
                    [ Ui_components.with_props
                        [ Ui_components.Prop.position `relative ]
                        (link ~style_class:"page-ref" ~text:t_
                        ~data_attrs:
                          ([ ("tabindex", "0"); ("draggable", "true")
                           ; ("data-ref", String.lowercase_ascii t_) ]
                           @ (match Wr.ref_uuid x with
                              | Some u -> [ ("data-uuid", u) ]
                              | None -> []))
                        []) ] ])
             items)
      in
      inner_cell
        [ box ~style_class:"property-value-inner" ~min_width:0
            [ Ui_components.with_props
                [ Ui_components.Prop.cursor `pointer ]
                (row ~cross:`center ~grow:1. ~gap:4 ~min_width:0
                   ~style_class:"jtrigger multi-values" item_els) ] ]
  | W.Bool b when c.V.c_type = "checkbox" ->
      inner_cell [ Ui_components.checkbox ~checked:b ~disabled:true [] ]
  | v -> inner_cell [ text ~value:(fmt_cell_value c v) [] ]

let cell_id inst row_uuid column =
  Printf.sprintf "table-%d-cell-%s-%s" inst.V.id row_uuid column

let focus_cell inst row_uuid column =
  V.update inst (fun s -> { s with V.table_cell_focus = Some (row_uuid, column) });
  Option.iter (fun (cell : Ui_services.el) -> cell.focus ())
    (Ui_services.dom_by_id (cell_id inst row_uuid column))

let table_cell_navigation inst ~row_uuid ~column = function
  | L.NavigationKey (_, key, _) when V.table_row_selected (V.get inst) row_uuid ->
      (match key with
       | "ArrowLeft" | "ArrowRight" as arrow ->
           let cells = List.filter (fun c -> c.V.c_id <> "select")
               (visible_columns (V.get inst)) in
           let rec next = function
             | c :: after :: _ when c.V.c_id = column -> Some after.V.c_id
             | _ :: rest -> next rest
             | [] -> None in
           Option.iter (focus_cell inst row_uuid)
             (next (if arrow = "ArrowLeft" then List.rev cells else cells))
       | "Enter" ->
           open_row_sidebar row_uuid;
           V.update inst V.table_clear_selection
       | "Escape" ->
           V.update inst (fun s -> { s with V.table_cell_focus = None });
           Option.iter (fun (row : Ui_services.el) -> row.focus ())
             (Ui_services.dom_by_id ("ls-block-" ^ row_uuid))
       | _ -> ())
  | _ -> ()

let cell_el inst ~row_uuid ~blk (c : V.column) : t =
  with_column_width inst c
  (Ui_components.with_props [ Ui_components.Prop.overflow `hidden ]
  (Ui_parts.class_signal (sig_of inst)
     (fun s -> "ls-table-cell" ^
       if s.V.table_cell_focus = Some (row_uuid, c.V.c_id) then " selected" else "")
  (box ~height:32 ~accessibility_identifier:(cell_id inst row_uuid c.V.c_id)
    ~data_attrs:["tabindex", "-1"]
    ~on_navigation_key:(table_cell_navigation inst ~row_uuid ~column:c.V.c_id)
    [ (match c.V.c_id with
       | "select" -> select_cell inst ~row_uuid ~blk
       | "block/title" -> title_cell inst ~row_uuid ~blk c
       | "file" -> Asset_dom.file_cell_el blk
       | _ -> (
           match c.V.c_prop with
           | Some p ->
               (* cljs table cells are inline value editors — reuse the
                  property-panel cell on a row synthesized from the
                  column's property entity + this row's value *)
               let row =
                 W.Map
                   [ (W.Keyword "property", p)
                   ; (W.Keyword "property-id", W.Keyword c.V.c_id)
                   ; (W.Keyword "value", cell_value blk c) ]
               in
               let pctx : Properties_value.ctx =
                 { owner_key = "view-" ^ string_of_int inst.V.id
                 ; block_uuid = row_uuid
                 ; block_id = Properties_data.entity_id_of blk
                 ; refresh = (fun () -> refresh inst)
                 ; is_page = is_page_row blk
                 ; class_schema = false }
               in
               inner_cell [ Properties_value.view ~table_view:true ~hover:None pctx row ]
           | None -> prop_cell ~blk c)) ])))

(* ---------- header ---------- *)

let selected_row_uuids (s : V.vstate) =
  List.filter (V.table_row_selected s) (all_row_uuids s)

let selected_row_count (s : V.vstate) =
  match s.V.table_select_all, s.V.data with
  | true, Wr.VFlat { count; _ } ->
      max 0 (count - List.length (List.filter
        (fun uuid -> V.Sset.mem uuid s.V.table_excluded) (all_row_uuids s)))
  | _ -> List.length (selected_row_uuids s)

let selected_uuids inst = selected_row_uuids (V.get inst)

let sortable c =
  not
    (List.mem c.V.c_id
       [ "select"; "id"; "block/page"; "block.temp/refs-count" ])

let header_select_cell ?rows inst : t =
  let row_uuids s = Option.value rows ~default:(all_row_uuids s) in
  let shown (s : V.vstate) =
    let uuids = row_uuids s in
    uuids <> [] && List.for_all (V.table_row_selected s) uuids &&
      (match rows, s.V.data with
       | None, Wr.VFlat { count; _ } when count > List.length uuids -> s.V.table_select_all
       | _ -> true)
  in
  let mixed (s : V.vstate) =
    not (shown s) && List.exists (V.table_row_selected s) (row_uuids s)
  in
  row ~cross:`center ~main:`center ~width:32 ~height:32
    [ checkbox_el ~mixed inst ~jtrigger:false ~id:"header-checkbox" ~shown
        ~aria_label:(I.t "view.table/select-all")
        ~on_toggle:(fun on _shift ->
          V.update inst (fun s ->
            match rows with
            | None -> V.table_select_all_rows s on
            | Some rows -> V.table_set_rows s ~rows ~checked:on)) ]

(* cljs header-cp: text-variant button holding the title span and a sort
   arrow for the active sort column — the arrow's presence is
   signal-gated (shape change -> if_), its glyph a reactive prop *)
let header_button inst (c : V.column) : t =
 fun ctx parent ->
  (* sort_sig/arrow derivations ride the mount's scope — the shared
     vstate signal outlives the button otherwise *)
  let sort_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (s : V.vstate) ->
           List.find_opt (fun x -> x.V.s_id = c.V.c_id) s.V.sorting)
         (Signal.value (inst.V.st)))
  in
  Ui_components.button ~variant:`ghost ~size:`sm ~label:c.V.c_name ~grow:1.
    ~foreground:"hsl(var(--muted-foreground))"
    ~main:`start ~height:32 ~padding_horizontal:8
    [ row ~main:`start ~cross:`center ~gap:4
        [ text ~value:c.V.c_name ~white_space:"nowrap" []
        ; if_
            ~test:(Logseq_el.own ctx (Signal.map (fun o -> o <> None) sort_sig))
            (icon_dyn
               (Signal.map
                  (fun o ->
                    match o with
                    | Some x when x.V.s_asc -> "arrow-up"
                    | _ -> "arrow-down")
                  sort_sig)) ] ]
    ctx parent

let set_column_sort inst (c : V.column) asc =
  V.update inst (fun s ->
      { s with V.sorting = [ { V.s_id = c.V.c_id; s_asc = asc } ] });
  V.persist_sorting inst;
  refresh inst

let sort_menu_items inst (c : V.column) =
  [ P.MItem ((I.t "view.table/sort-ascending"), fun () -> set_column_sort inst c true)
  ; P.MItem ((I.t "view.table/sort-descending"), fun () -> set_column_sort inst c false) ]

(* sort options as dropdown menuitems — cljs prepends them as
   more-options before the property configure list, with arrow icons *)
let sort_menuitem_els inst (c : V.column) =
  List.map
    (fun (label, asc) ->
      Properties_menu.menuitem
        ~icon:(if asc then "arrow-up" else "arrow-down")
        label (fun () ->
          Properties_state.close_overlays ();
          set_column_sort inst c asc))
    [ ((I.t "view.table/sort-ascending"), true); ((I.t "view.table/sort-descending"), false) ]

let pinned_columns_ident = "logseq.property.table/pinned-columns"

(* cljs pinned-properties: :select and :id are always prepended; the
   rest are the view entity's pinned-columns property idents *)
let is_pinned (s : V.vstate) (c : V.column) =
  c.V.c_id = "select" || c.V.c_id = "id" || V.Sset.mem c.V.c_id s.V.pinned

(* cljs header-cp pin option: toggles membership in the view entity's
   pinned-columns (values are property db/ids) *)
let toggle_pin inst (c : V.column) (p : W.t) =
  match Properties_data.entity_id_of p with
  | Some pid ->
      let vu = (V.get inst).V.view_uuid in
      if V.Sset.mem c.V.c_id (V.get inst).V.pinned then begin
        V.update inst (fun s ->
            { s with V.pinned = V.Sset.remove c.V.c_id s.V.pinned });
        Properties_data.delete_property_value ~block_uuid:vu
          ~ident:pinned_columns_ident ~value:(W.Int pid)
        |> ignore
      end
      else begin
        V.update inst (fun s ->
            { s with V.pinned = V.Sset.add c.V.c_id s.V.pinned });
        Properties_data.set_block_property ~block_uuid:vu
          ~ident:pinned_columns_ident ~value:(W.Int pid)
        |> ignore
      end;
      refresh inst
  | None -> ()

(* cljs table-options trailing the property dropdown: sort items (when
   sortable) then Pin/Unpin (when the property has a db/id) *)
let column_menuitem_els inst (c : V.column) (p : W.t) =
  let sort = if sortable c then sort_menuitem_els inst c else [] in
  let pin =
    match Properties_data.entity_id_of p with
    | Some _ ->
        [ Properties_menu.menuitem ~icon:"pin"
            (if V.Sset.mem c.V.c_id (V.get inst).V.pinned
             then (I.t "view.table/unpin")
             else (I.t "view.table/pin"))
            (fun () ->
              Properties_state.close_overlays ();
              toggle_pin inst c p) ]
    | None -> []
  in
  sort @ pin

(* cljs header-cp: property columns open one .ls-property-dropdown —
   sort more-options first, then the configure list, no title *)
let open_property_menu inst ~anchor (c : V.column) (p : W.t) =
  let owner_uuid =
    match inst.V.kind with
    | V.KTagPage u | V.KPropertyPage u -> u
    | _ -> ""
  in
  Properties_menu.open_menu ~anchor ~owner_uuid
    ~owner_id:(Properties_data.entity_id_of p)
    ~owner_is_tag:
      (match inst.V.kind with V.KTagPage _ -> true | _ -> false)
    ~owner_title:c.V.c_name
    ~refresh:(fun () -> refresh inst)
    ~more_options:(column_menuitem_els inst c p)
    ~with_title:false
    (W.Map
       [ (W.Keyword "property", p)
       ; (W.Keyword "property-id", W.Keyword c.V.c_id) ])

(* open the column menu with the header cell as anchor — the cell carries
   an id so the click handler can resolve the live element *)
let header_cell_id inst (c : V.column) =
  "vhc-" ^ string_of_int inst.V.id ^ "-" ^ c.V.c_id

let resize_handle inst (c : V.column) : t =
 fun context parent ->
  let finish owner commit =
    match (V.get inst).V.table_resize with
    | Some resize when resize.V.resize_owner = owner ->
        let commit = commit && resize.V.resize_view = (V.get inst).V.view_uuid in
        V.update inst (fun s -> V.finish_table_resize s ~owner ~commit);
        if commit then V.persist_sized inst
    | _ -> ()
  in
  let node =
    Ui_components.with_props
      [Ui_components.Prop.position `absolute
      ;Ui_components.Prop.inset_right 0.; Ui_components.Prop.inset_top 0.
      ;Ui_components.Prop.cursor `pointer
      ;Ui_components.Prop.hover_opacity 1.]
      (box ~style_class:"ls-table-resize-handle" ~width:6 ~height:32
        ~min_width:6 ~opacity:0.5
        ~background:"hsl(var(--border))"
        ~data_attrs:["data-no-dnd", "true"]
        ~pointer_capture:true
        ~on_pointer_down:(function
          | L.PointerDown (owner, detail) when detail.L.button = 0 ->
              V.update inst (fun s -> V.start_table_resize s ~owner
                ~column:c.V.c_id ~x:detail.L.x ~width:(column_width s c))
          | _ -> ())
        ~on_pointer_move:(function
          | L.PointerMove (owner, detail) ->
              V.update inst (fun s -> V.move_table_resize s ~owner ~x:detail.L.x)
          | _ -> ())
        ~on_pointer_up:(function
          | L.PointerUp (owner, detail) ->
              V.update inst (fun s -> V.move_table_resize s ~owner ~x:detail.L.x);
              finish owner true
          | _ -> ())
        ~on_pointer_cancel:(function
          | L.PointerCancel (owner, _) -> finish owner false
          | _ -> ()) []) context parent
  in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
    let s = V.get inst in
    match s.V.table_resize with
    | Some resize when resize.V.resize_owner = node ->
        (* Disposal already runs inside the scheduler flush. *)
        Signal.set inst.V.st (V.finish_table_resize s ~owner:node ~commit:false)
    | _ -> ());
  node

let header_cell ?rows inst (c : V.column) : t =
  with_column_width inst c
  (if Ui_services.env_publishing () then
    box [ text ~value:c.V.c_name [] ]
   else
  let fg = "hsl(var(--muted-foreground))" in
  match c.V.c_id with
  | "select" ->
      Ui_components.with_props
        [ Ui_components.Prop.font_size "0.875rem"
        ; Ui_components.Prop.line_height "1.25rem"
        ; Ui_components.Prop.font_weight 500 ]
        (box ~style_class:"ls-table-header-cell"
           ~foreground:fg
           [ header_select_cell ?rows inst ])
  | _ ->
      let menu () =
        match c.V.c_prop with
        | Some p -> (
            match Ui_services.dom_by_id (header_cell_id inst c) with
            | Some anchor -> open_property_menu inst ~anchor c p
            | None -> ())
        | None ->
            if sortable c then
              match Ui_services.dom_by_id (header_cell_id inst c) with
              | Some anchor ->
                  ignore
                    (P.show_menu ~anchor
                       ~cls_prefix:"ls-property-dropdown "
                       (sort_menu_items inst c))
              | None -> ()
      in
      Ui_parts.pressable ~on_press:(fun _ -> menu ())
        (Ui_components.with_props
           [ Ui_components.Prop.font_size "0.875rem"
           ; Ui_components.Prop.line_height "1.25rem"
           ; Ui_components.Prop.font_weight 500
           ; Ui_components.Prop.cursor `pointer
           ; Ui_components.Prop.position `relative
           ; Ui_components.Prop.padding_right 1
           ; Ui_components.Prop.shadow "inset -1px 0 0 hsl(var(--border))" ]
           (box ~style_class:"ls-table-header-cell"
              ~accessibility_identifier:(header_cell_id inst c)
              ~foreground:fg
              [ Ui_components.with_props
                  [ Ui_components.Prop.overflow `hidden ]
                  (header_button inst c)
              ; resize_handle inst c ])))

(* ---------- action bar ---------- *)

let with_full_selection inst ~scope action =
  let initial = V.get inst in
  if initial.V.table_action_pending = None then begin
    let epoch = initial.V.table_selection_epoch + 1 in
    let gen = !(inst.V.data_gen) in
    let revision = (Runtime.model ()).Model.context_revision in
    let repo = Runtime.repo () and route = Runtime.route () in
    let view = initial.V.view_uuid and context = V.ctx_of inst in
    let live = ref true in
    let current () =
      let s = V.get inst in
      !live && (Runtime.model ()).Model.context_revision = revision &&
      Runtime.repo () = repo && Runtime.route () = route &&
      V.fetch_fresh inst gen && s.V.view_uuid = view && V.ctx_of inst = context &&
      s.V.table_selection_epoch = epoch in
    let finish () =
      if (V.get inst).V.table_action_pending = Some epoch then
        V.update inst (fun s -> { s with V.table_action_pending = None }) in
    let fail () =
      let notify = current () in
      finish ();
      if notify then Toast.error (I.t "view/error") in
    V.update inst (fun s -> { s with V.table_selection_epoch = epoch
      ; table_action_pending = Some epoch });
    Signal.on_dispose scope (fun () ->
      live := false;
      let s = V.get inst in
      if s.V.table_action_pending = Some epoch then
        Signal.set inst.V.st { s with V.table_action_pending = None });
    (V.ops ()).V.o_full_action_rows inst (function
      | Error _ -> fail ()
      | Ok data when current () ->
          let state = { initial with V.data } in
          let uuids = selected_row_uuids state in
          if uuids = [] then finish ()
          else Views_db.get_blocks uuids ~metadata:true ~on_error:fail (fun entities ->
            if current () then begin
              let blocks = Hashtbl.create (List.length uuids) in
              List.iter (fun entity ->
                match Option.bind (W.get entity "block/uuid") W.as_uuid with
                | Some uuid -> Hashtbl.replace blocks uuid entity
                | None -> ()) entities;
              if not (List.for_all (Hashtbl.mem blocks) uuids) then fail ()
              else begin
                finish ();
                if current () then action { state with V.blocks } current
              end
            end else finish ())
      | Ok _ -> finish ())
  end

let page_row_uuids (s : V.vstate) =
  List.filter (fun uuid -> is_page_row (Hashtbl.find s.V.blocks uuid)) (selected_row_uuids s)

let delete_selected inst s current () =
  let prepare owner =
  if current () then begin
    let built_in entity = W.get entity "logseq.property/built-in?" = Some (W.Bool true) in
    let sel = List.filter (fun uuid -> not (built_in (Hashtbl.find s.V.blocks uuid)))
        (selected_row_uuids s) in
    let sel_set = V.Sset.of_list sel in
    let pages = List.filter (fun uuid -> V.Sset.mem uuid sel_set) (page_row_uuids s) in
    let page_set = V.Sset.of_list pages in
    let blocks = List.filter (fun u -> not (V.Sset.mem u page_set)) sel in
    let owner_ident = Option.bind owner (fun entity -> Option.bind (W.get entity "db/ident") Wr.ident_of_value) in
    let need_confirm =
      pages <> [] && (match inst.V.kind with
        | V.KAllPages | V.KQuery _ -> true
        | V.KTagPage _ -> owner_ident <> Some "logseq.class/Page"
        | _ -> false) in
    let keep_selection = match inst.V.kind, owner with
      | V.KPropertyPage _, Some entity -> built_in entity
      | _ -> false in
    let do_delete () = if current () then begin
      let page_operations =
        if need_confirm then
          List.map (fun page -> Outliner_ops.op "delete-page" [W.Uuid page; W.Map []]) pages
        else match inst.V.kind, owner_ident with
          | V.KPropertyPage _, Some ident when not keep_selection ->
              List.map (fun page -> Outliner_ops.remove_block_property page ident) pages
          | _ -> [] in
      let operations = (if blocks = [] then [] else [Outliner_ops.delete_blocks blocks]) @ page_operations in
      if operations = [] then begin
        if not keep_selection then V.update inst V.table_clear_selection
      end else begin
        let open Promise_ext in
        ignore ((let* result = Outliner_ops.apply_result operations in
          (match result with
           | Some _ when current () && not keep_selection ->
               V.update inst V.table_clear_selection;
               refresh inst
           | _ -> ());
          Js.Promise.resolve ()) |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))
      end
    end in
    if need_confirm then
      let names =
        List.filter_map
          (fun u ->
            match Hashtbl.find_opt s.V.blocks u with
            | Some blk -> (
                match Wr.prop_text (cell_value blk (title_column ())) with
                | "" -> None
                | t -> Some t)
            | None -> None)
          pages
      in
      ignore
        (P.show_dialog
           ~headline:(I.t "page.delete/batch-confirm-title")
           ~body:
             [ Ui_components.with_props [Ui_components.Prop.padding_top 16]
                 (scroll ~orientation:`vertical ~max_height:320
                    [ column ~padding:8 ~gap:4
                        (List.mapi (fun index name ->
                          row ~gap:4 [text ~font_size:"14px" ~line_height:"20px"
                            ~value:(string_of_int (index+1) ^ ".") [];
                            text ~font_size:"14px" ~line_height:"20px" ~value:name []]) names) ])
             ; text ~padding_horizontal:8 ~font_size:"12px" ~line_height:"20px"
                 ~foreground:"hsl(var(--muted-foreground))"
                 ~value:(I.total (List.length names)) [] ]
           ~confirm_label:(I.t "ui/yes") ~on_confirm:do_delete ())
    else do_delete ()
  end in
  match inst.V.kind with
  | V.KTagPage uuid | V.KPropertyPage uuid ->
      let open Promise_ext in
      ignore ((let* owner = Properties_data.entity_by_uuid uuid in
        (match Properties_data.untag owner with
         | W.Map _ as owner -> prepare (Some owner)
         | _ -> if current () then Toast.error (I.t "view/error"));
        Js.Promise.resolve ()) |> Js.Promise.catch (fun _ ->
          if current () then Toast.error (I.t "view/error"); Js.Promise.resolve ()))
  | _ -> prepare None

(* cljs selection/action-group on-copy: copy-selection-blocks writes the
   selected rows' titles to the system clipboard and clears selection *)
let copy_selected inst s current () =
  let titles =
    List.filter_map
      (fun u ->
        match Hashtbl.find_opt s.V.blocks u with
        | Some blk -> (
            match Wr.prop_text (cell_value blk (title_column ())) with
            | "" -> None
            | t -> Some t)
        | None -> None)
      (selected_row_uuids s)
  in
  if titles <> [] then begin
    ignore (Ui_task.catch
      (Ui_task.bind (Ui_services.clipboard_write_text (String.concat "\n" titles)) (fun () ->
        if current () then V.update inst V.table_clear_selection;
        Ui_task.resolve ()))
      (fun _ -> if current () then Toast.error (I.t "view/error"); Ui_task.resolve ()))
  end

(* Selected table rows share one property workflow target. *)
let property_target s =
  match selected_row_uuids s with
  | [] -> None
  | u :: _ as us ->
      Some { Properties_dialog.uuid = u; uuids = us; db_id = None; is_tag = false; title = "" }

let set_tags_dlg s current =
  match selected_row_uuids s with
  | [] -> ()
  | u :: _ as us ->
      let open Promise_ext in
      ignore ((let* property = Properties_data.entity
          (W.List [W.Keyword "db/ident"; W.Keyword "block/tags"]) in
        if current () then
          (match Properties_data.untag property with
           | W.Map _ as property ->
               Properties_dialog.open_dialog ~phase:(Properties_dialog.Value_edit property)
                 { Properties_dialog.uuid = u; uuids = us; db_id = None; is_tag = false; title = "" }
           | _ -> Toast.error (I.t "view/error"));
        Js.Promise.resolve ()) |> Js.Promise.catch (fun _ ->
          if current () then Toast.error (I.t "view/error"); Js.Promise.resolve ()))

(* Keep the selection column available while bulk actions cover the header. *)
let action_bar inst : t =
 fun ctx parent ->
  let scope = ctx.Lui_ui.ui_scope in
  let isig = sig_of inst in
  let action ?icon ?text ?width ?(margin_left = -1) ?(corner_radius = 0) ~label
      on_press =
    Ui_components.with_props
      [
        Ui_components.Prop.font_size "12px";
        Ui_components.Prop.line_height "16px";
      ]
      (Ui_components.button ~variant:`outline ?icon ?text ?width ~label ~height:32 ~padding_vertical:0
         ~padding_horizontal:8 ~margin_left ~corner_radius
         ~disabled:(reactive (fun (s : V.vstate) -> s.V.table_action_pending <> None) isig)
         ~on_press:(fun _ -> if (V.get inst).V.table_action_pending = None then on_press ())
         [])
  in
  let property_action ~remove key =
    let label = I.t (if remove then "property/unset-property" else "property/set-property") in
    Properties_dialog.trigger ~key ~margin_left:(-1) ~remove ~target:(fun () -> None)
      (fun _ -> action ~margin_left:0 ~label ~text:label (fun () ->
        match !(Properties_dialog.current) with
        | Some dialog when dialog.Properties_dialog.d_placement = Properties_dialog.Trigger key ->
            Properties_dialog.close ()
        | _ -> with_full_selection inst ~scope (fun state current ->
            match property_target state with
            | Some target when current () ->
                Properties_dialog.open_at ~remove ~phase:Properties_dialog.Prop_select
                  (Properties_dialog.Trigger key) target
            | _ -> ()))) in
  if_
    ~test:(reactive (fun s -> selected_row_count s > 0) isig)
    (box ~key:"tac" ~margin_left:32 ~margin_top:1
       [
         toolbar ~style_class:"table-action-bar" ~orientation:`horizontal
           ~label:(I.t "view.table/selection-actions-label")
           ~gap:0 ~height:32 ~padding:0 ~background:"var(--lx-gray-01)"
           ~border_width:0 ~corner_radius:0
           [
             text ~padding_horizontal:8 ~margin_right:4 ~font_size:"14px"
               ~line_height:"20px"
               ~value:
                 (reactive
                    (fun (s : V.vstate) ->
                      if s.V.table_action_pending <> None then I.t "ui/loading"
                      else I.selected_count (selected_row_count s))
                    isig)
               [];
             action ~label:(I.t "property/set-tags") ~icon:(`app "hash")
               ~width:31 ~margin_left:0 ~corner_radius:6 (fun () ->
                 with_full_selection inst ~scope set_tags_dlg);
             action ~label:(I.t "ui/copy") ~text:(I.t "ui/copy")
               (fun () -> with_full_selection inst ~scope (fun s current -> copy_selected inst s current ()));
             property_action ~remove:false (Printf.sprintf "table-%d-set-property" inst.V.id);
             property_action ~remove:true (Printf.sprintf "table-%d-unset-property" inst.V.id);
             action
               ~label:(I.t "ui/delete")
               ~icon:(`app "trash") ~width:31 ~corner_radius:6
               (fun () -> with_full_selection inst ~scope (fun s current -> delete_selected inst s current ()));
             Ui_components.button ~variant:`outline ~height:32 ~width:31 ~corner_radius:6
               ~label:(I.t "ui/cancel") ~icon:(`app "x")
               ~on_press:(fun _ -> V.update inst V.table_clear_selection) [];
           ];
       ]) ctx parent

(* ---------- table ---------- *)

(* dnd-kit a11y nodes — the screen-reader drag instructions. Hidden
   via the .ls-dnd-a11y / .ls-dnd-live classes (the old inline styles
   moved to lui-overlay.css); imperative lookups key on the
   DndDescribedBy-*/DndLiveRegion-* ids *)
let dnd_described n : t =
  box ~accessibility_identifier:("DndDescribedBy-" ^ n)
    ~style_class:"ls-dnd-a11y" ~display:`none
    [ text
        ~value:
          "To pick up a draggable item, press the space bar. While \
           dragging, use the arrow keys to move the item. Press space \
           again to drop the item in its new position, or press escape \
           to cancel."
        [] ]

let dnd_live n : t =
  box ~accessibility_identifier:("DndLiveRegion-" ^ n)
    ~style_class:"ls-dnd-live" ~display:`none
    ~data_attrs:
      [ ("role", "status"); ("aria-live", "assertive")
      ; ("aria-atomic", "true") ]
    []

(* class-objects tables show the add-property column; matching rows get
   a trailing empty cell *)
let show_add_property inst =
  match inst.V.kind with
  | V.KTagPage _ -> !Runtime.current_page
  | V.KPropertyPage _ | V.KAllPages | V.KQuery _ | V.KLinkedRefs
  | V.KUnlinkedRefs ->
      None

(* rows are (uuid, block) items — the block rides along so a content
   change makes a fresh item value; `keyed` remounts on a key change and
   Virt_list bumps its per-key render version *)
type row_item = string * W.t

let row_item_of s u =
  ( u
  , match Hashtbl.find_opt s.V.blocks u with
    | Some b -> b
    | None -> W.Map [] )

let flat_items (s : V.vstate) = List.map (row_item_of s) (all_row_uuids s)

let keyed_row_key (u, blk) =
  u ^ "|" ^ string_of_int (Hashtbl.hash blk)

let table_row_navigation inst ~row_uuid ~columns = function
  | L.NavigationKey (_, key, _) when V.table_row_selected (V.get inst) row_uuid ->
    (match key with
    | "Enter" ->
        open_row_sidebar row_uuid;
        V.update inst V.table_clear_selection
    | "ArrowLeft" | "ArrowRight" as arrow ->
        let cells = List.filter (fun c -> c.V.c_id <> "select") columns in
        let pick = List.nth_opt (if arrow = "ArrowLeft" then cells else List.rev cells) 0 in
        Option.iter (fun c -> focus_cell inst row_uuid c.V.c_id) pick
    | "Escape" ->
        (* Dev clears block selection, not the checkbox row selection. *)
        ()
    | _ -> ())
  | _ -> ()

(* cljs table-row: .ls-table-row.ls-block[blockid][data-id][tabindex=0]
   — the imperative side still reads `blockid`/data-id off .ls-block
   rows (dnd/block_dnd, editor/block_selection, popups context menu +
   block picker). `blockid` sits outside the ~data_attrs whitelist, so
   the row is a dom div carrying the raw attrs (same channel the
   outline rows use). *)
let row_el inst (cols : V.column list) ~row_uuid ~blk : t =
 fun ctx parent ->
  let cell_wrap c = box ~height:32 [ cell_el inst ~row_uuid ~blk c ] in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  let sel_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (s : V.vstate) -> V.table_row_selected s row_uuid)
         (sig_of inst))
  in
  (Ui_parts.class_signal sel_sig
        (fun sel ->
          "ls-table-row ls-block" ^ if sel then " selected" else "")
        (Ui_parts.prop_signal Lui_protocol.BackgroundValue sel_sig
           (fun sel ->
             if sel then "hsl(var(--muted))" else "transparent")
           (Ui_components.with_props
              [ Ui_components.Prop.overflow `hidden
              ; Ui_components.Prop.padding_bottom 1
              ; Ui_components.Prop.shadow "inset 0 -1px 0 hsl(var(--border))" ]
              (row ~key:("ls-tr-" ^ row_uuid) ~cross:`stretch ~height:33 ~min_height:33
                 ~on_navigation_key:(table_row_navigation inst ~row_uuid ~columns:(pinned @ free))
                 ~max_height:33 ~transition:"background-color 150ms"
                 ~accessibility_identifier:("ls-block-" ^ row_uuid)
                 ~data_attrs:
                   [ ("data-blockid", row_uuid); ("data-id", row_uuid)
                   ; ("tabindex", "0") ]
                 [ (* cljs: .sticky-columns holds pinned cells, sibling
                      row holds the unpinned ones *)
                   Ui_components.with_props
                     [ Ui_components.Prop.position `sticky
                     ; Ui_components.Prop.inset_left 0.
                     ; Ui_components.Prop.z_index 8 ]
                     (row ~style_class:"sticky-columns"
                        ~background:
                          "var(--lx-gray-01, \
                           var(--ls-primary-background-color))"
                        (List.map cell_wrap pinned))
                 ; row
                     (List.map cell_wrap free
                      @ (match (if Ui_services.env_publishing () then None else show_add_property inst) with
                         | Some _ ->
                             [ box
                                 [ box ~style_class:"ls-table-cell"
                                     [ row ~cross:`center ~grow:1. [] ] ] ]
                         | None -> [])) ]))))
    ctx parent

(* rows keyed under a parent — Virt_list for >=64 rows, keyed
   reconciliation below that. The uuid set comes from the body snapshot
   (group membership is fixed per rebuild); the item stream keeps block
   content live from the vstate. [~paginate] forces the virt-end
   listener for a reference window shorter than the 64-row threshold. *)
let row_stream ?(paginate = false) inst cols uuids : t =
 fun ctx parent ->
  let items_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (s : V.vstate) -> List.map (row_item_of s) uuids)
         (Signal.value (inst.V.st)))
  in
  let items = Signal.get items_sig in
  (* a windowed fetch that has more rows server-side still needs the
     virt-end listener even under the 64-row virtualization threshold *)
  let more_rows =
    paginate
    ||
    match (V.get inst).V.data with
    | Wr.VFlat { count; _ } -> List.length items < count
    | _ -> false
  in
  if more_rows || Virt_list.enabled ~virtualize:true (List.length items)
  then
    Virt_list.list ~key_of:fst
      ~data_sig:(fun dctx ->
        Some
          (Signal.map
             (fun (s : V.vstate) ->
               Array.of_list (List.map (row_item_of s) uuids))
             (Signal.value (inst.V.st))
           |> Signal.own_signal dctx.Lui_ui.ui_scope))
      ~on_end:(fun () -> (V.ops ()).V.o_load_more inst)
      ~render:(fun (u, blk) -> row_el inst cols ~row_uuid:u ~blk)
      (Array.of_list items)
      ctx parent
  else
    keyed ~source:items_sig ~key:keyed_row_key ~cmp:String.compare
      ~mount:(fun item_sig ->
        let u, blk = Signal.get item_sig in
        row_el inst cols ~row_uuid:u ~blk)
      ctx parent

(* the header — one static mount per body snapshot; sort arrow is a
   reactive prop off the inst signal *)
let table_header ?rows inst cols : t =
  let cell_item c =
    let cell = header_cell ?rows inst c in
    if c.V.c_id = "select" then
      box ~accessibility_identifier:"Select" [ cell ]
    else box [ cell ]
  in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  Ui_components.with_props
    [ Ui_components.Prop.padding_top 1
    ; Ui_components.Prop.padding_bottom 1
    ; Ui_components.Prop.shadow
        "inset 0 1px 0 hsl(var(--border)), inset 0 -1px 0 hsl(var(--border))" ]
  (row ~style_class:"ls-table-header" ~cross:`center ~height:34
    ~background:"var(--lx-gray-01, var(--ls-primary-background-color))"
    [ Ui_components.with_props
        [ Ui_components.Prop.position `sticky
        ; Ui_components.Prop.inset_left 0.
        ; Ui_components.Prop.z_index 8 ]
        (row ~style_class:"sticky-columns"
           ~background:
             "var(--lx-gray-01, var(--ls-primary-background-color))"
           (List.map cell_item pinned @ [ dnd_described "0"; dnd_live "0" ]))
    ; row
        (List.map cell_item free
         @ (match (if Ui_services.env_publishing () then None else show_add_property inst) with
            | Some p ->
                (* cljs add-property-button: trailing "New property"
                   header cell on class-objects tables only *)
                [ box ~accessibility_identifier:"add property"
                    [ box ~style_class:"ls-table-header-cell"
                        [ Ui_components.button ~variant:`ghost ~size:`sm ~icon:(`app "plus")
                            ~text:(I.t "view/new-property") ~grow:1. ~main:`start
                            ~height:32 ~padding_horizontal:8
                            ~on_press:(fun _ ->
                              match p.Model.page_uuid with
                              | Some uuid ->
                                  Properties_dialog.open_dialog
                                    { Properties_dialog.uuid
                                    ; uuids = []
                                    ; db_id = p.Model.page_db_id
                                    ; is_tag = true
                                    ; title = p.Model.page_title
                                    }
                              | None -> ())
                            [] ] ] ]
            | None -> [])
         @ [ dnd_described "1"; dnd_live "1" ]) ])

(* footer add-new-row (cljs: property-objects always; class-objects for
   non-private classes; all-pages/query never) *)
let add_row_footer inst : t =
  if Ui_services.env_publishing () then Logseq_el.nothing else
  let has_add_object =
    match inst.V.kind with
    | V.KPropertyPage _ -> true
    | V.KTagPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | V.KAllPages | V.KQuery _ | V.KLinkedRefs | V.KUnlinkedRefs -> false
  in
  if has_add_object then
    (* The positioned strip occupies the shared table body's reserved space. *)
    Ui_components.with_props
      [ Ui_components.Prop.position `absolute
      ; Ui_components.Prop.inset_left 0.
      ; Ui_components.Prop.inset_right 0.
      ; Ui_components.Prop.inset_bottom 8. ]
      (box
      [ Ui_parts.pressable
          ~on_press:(fun _ -> (V.ops ()).V.o_add_object inst)
          (Ui_components.with_props
            [ Ui_components.Prop.padding_bottom 5
            ; Ui_components.Prop.shadow "inset 0 -1px 0 hsl(var(--border))" ]
          (row ~gap:4 ~cross:`center ~padding_horizontal:8
             ~padding_vertical:4 ~foreground:"muted-foreground" ~grow:1.
             [ icon ~name:(Icons.name_ref "plus") ~point_size:14 []
             ; text ~value:(I.t "view/new") [] ])) ])
  else spacer ~key:"no-footer" []

(* cljs: shui/table > .ls-table-rows.content.overflow-x-auto
   .force-visible-scrollbar > .relative > [header; body rows] *)
let table_el ?(paginate = false) inst (s : V.vstate) : t =
  let cols = visible_columns s in
  box ~style_class:"ls-table" ~grow:1.
    [ (* .ls-table-rows font sweep migrated to props *)
      Ui_components.with_props
        [ Ui_components.Prop.font_size "0.875rem"
        ; Ui_components.Prop.line_height "1.25rem" ]
        (scroll ~orientation:`horizontal ~grow:1.
        ~style_class:"ls-table-rows content"
        [ Ui_components.with_props
            [ Ui_components.Prop.position `relative
            ; Ui_components.Prop.padding_bottom 38 ]
            (box
            [ (* cljs .table-action-bar.absolute.top-0.left-8 floats over
                 the header inside the same relative box — overlay carries
                 the placement (style_class utility tokens are pruned) *)
              overlay
                [ table_header inst cols
                ; align `top_leading (action_bar inst) ]
            ; (* cljs Virtuoso mounts the rows under
                 [data-testid=virtuoso-item-list] inside two bare wrapper
                 divs; each row sits in a bare item div *)
              box
                [ box
                    [ box
                        ~accessibility_identifier:"virtuoso-item-list"
                        ~data_attrs:
                          [ ("data-testid", "virtuoso-item-list") ]
                        [ row_stream ~paginate inst cols (all_row_uuids s) ] ] ]
            ; add_row_footer inst ]) ]) ]

(* cljs renders a full inner view-table per group — its own column
   header row plus the group's rows *)
let grouped_table ?(paginate = false) inst ~rows : t =
 fun ctx parent ->
  let s = V.get inst in
  let cols = visible_columns s in
  box ~style_class:"ls-table"
    [ Ui_components.with_props
        [ Ui_components.Prop.font_size "0.875rem"
        ; Ui_components.Prop.line_height "1.25rem" ]
        (scroll ~orientation:`horizontal
        ~style_class:"ls-table-rows content"
        [ Ui_components.with_props
            [ Ui_components.Prop.position `relative ]
            (box
            [ overlay
                [ table_header ~rows inst cols
                ; align `top_leading (action_bar inst) ]
            ; box ~accessibility_identifier:"virtuoso-item-list"
                ~data_attrs:[ ("data-testid", "virtuoso-item-list") ]
                [ row_stream ~paginate inst cols rows ]
            ])
        ]
    )]
    ctx parent

(* ---------- list + gallery ---------- *)

(* same .ls-block[blockid] contract as row_el: the context-menu, block
   picker and dnd readers resolve list rows by blockid/data-id *)
(* cljs list-view rows are full block-container renders — the same
   shell as linked-reference rows (bullet/control, title with resolved
   refs, tag chips, positioned pills + properties panel, children).
   The row's preview W.t decodes through the standard block decoder;
   property/pill areas self-resolve live by uuid. *)
let list_row_el ~row_uuid ~blk : t =
  let b = Decode.block_of_wire blk in
  let b =
    match b.Model.block_uuid with
    | Some _ -> b
    | None -> { b with Model.block_uuid = Some row_uuid }
  in
  !Render_state.block_row_static b

let row_title s u =
  match Hashtbl.find_opt s.V.blocks u with
  | Some b -> (
      match W.get b "block/title" with
      | Some t_ -> Wr.prop_text t_
      | None -> "")
  | None -> ""

(* the keyed mount decodes the item snapshot — content edits
   republish under a new keyed_row_key and remount the row *)
let list_row_el_sig inst ~row_uuid (item_sig : row_item Signal.signal) : t =
  let _inst = inst in
  let _, blk = Signal.get item_sig in
  list_row_el ~row_uuid ~blk

(* ---------- foldable groups ---------- *)

(* cljs ui/foldable: .flex.flex-col > (.ls-foldable-title.content +
   .ls-foldable-content > .ls-foldable-content-inner). The caret toggles
   control-show only while the title is hovered — hover is DOM-only, so
   the caret is always shown; its rotated state rides a reactive
   style_class via Ui_parts.class_signal. caret-right is a custom path
   icon (registered in app_icons). *)
let foldable inst ~key ~title ~(body : t) : t =
 fun ctx parent ->
  let collapsed_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (s : V.vstate) -> V.Sset.mem key s.V.collapsed_groups)
         (Signal.value (inst.V.st)))
  in
  (column ~grow:1.
    [ row ~style_class:"ls-foldable-title content"
        [ row ~grow:1. ~style_class:"foldable-title"
            [ (* grow so .ls-view-head's justify-content:space-between
                 has room — cljs .foldable-title > * stretches *)
              row ~grow:1. ~cross:`center ~gap:4
                ~style_class:"ls-foldable-header"
                [ Ui_parts.pressable
                    ~on_press:(fun _ ->
                      V.update inst (fun s ->
                          { s with
                            V.collapsed_groups =
                              (if V.Sset.mem key s.V.collapsed_groups
                               then V.Sset.remove key s.V.collapsed_groups
                               else V.Sset.add key s.V.collapsed_groups)
                          }))
                    (Ui_components.with_props
                       [ Ui_components.Prop.cursor `pointer
                       ; Ui_components.Prop.opacity 0.5
                       ; Ui_components.Prop.hover_opacity 1. ]
                       (Ui_components.foldable_control
                       [ (* cljs foldable-caret: span.control-show only
                            while the title is hovered or the group is
                            collapsed — control-hide otherwise *)
                          Ui_parts.class_signal collapsed_sig
                           (fun c -> if c then "" else "control-hide")
                           (box ~key:"ctrlh"
                              [ Ui_parts.class_signal collapsed_sig
                                  (fun c ->
                                    "rotating-arrow"
                                    ^ if c then " collapsed"
                                      else " not-collapsed")
                                  (box ~key:"caret"
                                     [ icon ~name:(`app "caret-right")
                                         ~point_size:16
                                         ~transition:
                                           "transform 100ms ease-in" [] ]) ]) ]))
                ; title ] ]
        ]
    ; Ui_parts.class_signal collapsed_sig
        (fun c ->
          "ls-foldable-content" ^ if c then " is-collapsed" else "")
        (box ~key:"content" ~grow:1.
           ~transition:"grid-template-rows 0.2s ease-in-out"
           [ box ~style_class:"ls-foldable-content-inner" ~grow:1.
               ~transition:
                 "opacity 0.2s ease-in-out, transform 0.2s ease-in-out"
               [ body ] ]) ])
    ctx parent

let group_title s gv =
  match gv with
  | W.Map _ -> (
      match Wr.ref_title gv with
      | Some t when t <> "" -> t
      | _ -> I.no_group_value (Option.value s.V.group_by ~default:""))
  | W.Nil ->
      if s.V.group_by = Some "block/page" then (I.t "view.table/pages")
      else I.no_group_value (Option.value s.V.group_by ~default:"")
  | v -> Wr.prop_text v

(* ---------- body dispatch ---------- *)

let ref_view inst =
  match inst.V.kind with
  | V.KLinkedRefs | V.KUnlinkedRefs -> true
  | _ -> false

(* Mount only the materialized prefix. The header reads the unwindowed
   vstate, so the count stays the full decoded total. *)
let windowed inst (s : V.vstate) =
  if ref_view inst then
    { s with V.data = Wr.slice_view_data s.V.data s.V.fetch_limit }
  else s

(* Decoded rows are a prefix when the worker windowed the query.
   [items_count] is the index total in that case. *)
let ref_total (s : V.vstate) =
  let decoded = Wr.row_count s.V.data in
  if s.V.items_count > decoded then s.V.items_count else decoded

let more_ref_rows inst (s : V.vstate) =
  ref_view inst && s.V.fetch_limit > 0 && s.V.fetch_limit < ref_total s

(* rows for the list display: same (uuid, blk) stream, ls-block markup.
   [~paginate] is set only on the tail list of a reference window so
   earlier groups, whose bottoms sit inside the viewport, do not each
   fire virt-end and walk the rest of the result. *)
let list_stream ?(paginate = false) inst uuids : t =
 fun ctx parent ->
  let items_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (s : V.vstate) -> List.map (row_item_of s) uuids)
         (Signal.value (inst.V.st)))
  in
  let items = Signal.get items_sig in
  let title_of s (_, blk) =
    match W.get blk "block/title" with
    | Some t_ -> Wr.prop_text t_
    | None -> row_title s ""
  in
  let _ = title_of in
  let more_rows =
    paginate
    ||
    match (V.get inst).V.data with
    | Wr.VFlat { count; _ } -> List.length items < count
    | _ -> false
  in
  if more_rows || Virt_list.enabled ~virtualize:true (List.length items)
  then
    Virt_list.list ~key_of:fst
      ~data_sig:(fun dctx ->
        Some
          (Signal.map
             (fun (s : V.vstate) ->
               Array.of_list (List.map (row_item_of s) uuids))
             (Signal.value (inst.V.st))
           |> Signal.own_signal dctx.Lui_ui.ui_scope))
      ~on_end:(fun () -> (V.ops ()).V.o_load_more inst)
      ~render:(fun (u, blk) -> list_row_el ~row_uuid:u ~blk)
      (Array.of_list items)
      ctx parent
  else
    keyed ~source:items_sig ~key:keyed_row_key ~cmp:String.compare
      ~mount:(fun item_sig ->
        let u, _ = Signal.get item_sig in
        list_row_el_sig inst ~row_uuid:u item_sig)
      ctx parent

(* Reference rows are full block trees. Laying every fetched row out in
   one flex pass is what made Hub's first screen take ~9s. A virtual-list
   keeps every fetched row in the store (the header count stays exact)
   but the host only builds flex trees for the visible window. *)
let ref_vlist inst ~paginate ~item_extent (rows : t list) : t =
 fun ctx parent ->
  let node =
    virtual_list ~key:"ref-window" ~grow:1. ~gap:4 ~item_extent
      ~overscan:1
      ~data_attrs:
        (( "style"
         , "border-top:1px solid hsl(var(--border));padding-top:8px" )
         ::
         (if paginate then
            [ ("data-virt-count", string_of_int (List.length rows)) ]
          else []))
      rows ctx parent
  in
  if paginate then
    Platform.register_dom_handler node ~events:"virt-end" (fun _ _ ->
        (V.ops ()).V.o_load_more inst);
  node

let block_line (s : V.vstate) u : t =
  match Hashtbl.find_opt s.V.blocks u with
  | Some blk -> list_row_el ~row_uuid:u ~blk
  | None -> box ~key:("miss-" ^ u) []

let ref_header inst ~key ~title : t =
  let collapsed = V.Sset.mem key (V.get inst).V.collapsed_groups in
  row ~key:("h-" ^ key) ~cross:`center ~gap:4
    ~style_class:"ls-foldable-header"
    [ Ui_parts.pressable
        ~on_press:(fun _ ->
          V.update inst (fun st ->
              { st with
                V.collapsed_groups =
                  (if V.Sset.mem key st.V.collapsed_groups then
                     V.Sset.remove key st.V.collapsed_groups
                   else V.Sset.add key st.V.collapsed_groups)
              }))
        (box ~width:14 ~height:16
           [ icon ~name:(`app "caret-right") ~point_size:16
               ~style_class:
                 ("rotating-arrow "
                  ^ if collapsed then "collapsed" else "not-collapsed")
               [] ])
    ; title ]

(* One virtual row per header and per block, so a collapsed group drops
   its blocks and an off-screen group is not laid out. *)
let ref_grouped_lines inst (s : V.vstate) (gs : Wr.vrow_group list) : t list =
  List.concat
    (List.mapi
       (fun i g ->
         let key = "g" ^ string_of_int i in
         let header =
           ref_header inst ~key
             ~title:(text ~value:(group_title s g.Wr.gv) [])
         in
         if V.Sset.mem key s.V.collapsed_groups then [ header ]
         else header :: List.map (block_line s) g.Wr.grows)
       gs)

let ref_grouped_list_lines inst (s : V.vstate)
    (gs : Wr.vrow_group_list list) : t list =
  List.concat
    (List.mapi
       (fun i g ->
         List.concat
           (List.mapi
              (fun j (buuid, rows) ->
                let key =
                  "g" ^ string_of_int i ^ "-" ^ string_of_int j
                in
                let pname =
                  match rows with
                  | u :: _ -> (
                      match Hashtbl.find_opt s.V.blocks u with
                      | Some blk ->
                          Option.value
                            (Decode.block_of_wire blk).Model.block_page_name
                            ~default:(row_title s buuid)
                      | None -> row_title s buuid)
                  | [] -> row_title s buuid
                in
                let header =
                  ref_header inst ~key
                    ~title:
                      (link
                         ~url:
                           ("#/page/"
                            ^ Ui_services.uri_encode_component pname)
                         ~target:`self_ ~style_class:"page-ref" ~text:pname
                         [])
                in
                if V.Sset.mem key s.V.collapsed_groups then [ header ]
                else header :: List.map (block_line s) rows)
              g.Wr.glparts))
       gs)

let render_list inst s : t =
  let more = more_ref_rows inst s in
  let s = windowed inst s in
  match s.V.data with
  | Wr.VGrouped gs when ref_view inst ->
      ref_vlist inst ~paginate:more ~item_extent:44.
        (ref_grouped_lines inst s gs)
  | Wr.VGrouped gs ->
      (* cljs grouped list: .flex.flex-col.border-t.pt-2.gap-2 wrapper +
         .group-list-view; each group body sits in div.-ml-2 (list rows
         hang 8px left of the group title). virt-end rides the last
         group only — every earlier group's tail is inside the viewport
         and would otherwise page through the whole result. *)
      let last = List.length gs - 1 in
      column ~gap:8
        ~data_attrs:[ ("style", "border-top:1px solid hsl(var(--border));padding-top:8px") ]
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.gv) [])
               ~body:
                 (box ~margin_left:(-8) ~margin_top:4
                    [ list_stream ~paginate:(more && i = last) inst g.Wr.grows ]))
           gs)
  | Wr.VGroupedList gs when ref_view inst ->
      ref_vlist inst ~paginate:more ~item_extent:44.
        (ref_grouped_list_lines inst s gs)
  | Wr.VGroupedList gs ->
      (* cljs renders each partition as a foldable whose title carries
         the page-ref link (caret + page name); the groups wrapper draws
         master's .border-t.pt-2.gap-2 above the partition list *)
      let last_i = List.length gs - 1 in
      column ~gap:8
        ~data_attrs:[ ("style", "border-top:1px solid hsl(var(--border));padding-top:8px") ]
        (List.concat
           (List.mapi
              (fun i g ->
                let last_j = List.length g.Wr.glparts - 1 in
                List.mapi
                  (fun j (buuid, rows) ->
                    (* partition header = breadcrumb of the first row
                       block with show-page? false — the parent chain
                       minus the block itself, i.e. its containing page
                       name *)
                    let pname =
                      match rows with
                      | u :: _ -> (
                          match Hashtbl.find_opt s.V.blocks u with
                          | Some blk ->
                              Option.value
                                (Decode.block_of_wire blk).Model.block_page_name
                                ~default:(row_title s buuid)
                          | None -> row_title s buuid)
                      | [] -> row_title s buuid
                    in
                    foldable inst
                      ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                      ~title:
                        (link
                           ~url:
                             ("#/page/"
                              ^ Ui_services.uri_encode_component pname)
                           ~target:`self_ ~style_class:"page-ref"
                           ~text:pname [])
                      ~body:
                        (box ~margin_left:(-8) ~margin_top:4
                           [ list_stream
                               ~paginate:(more && i = last_i && j = last_j)
                               inst rows ]))
                  g.Wr.glparts)
              gs))
  | _ when ref_view inst ->
      ref_vlist inst ~paginate:more ~item_extent:36.
        (List.map (block_line s) (all_row_uuids s))
  | _ -> list_stream ~paginate:more inst (all_row_uuids s)

let gallery_configuration inst (s : V.vstate) =
  let cover_columns = List.filter
    (fun c -> List.mem c.V.c_type ["asset"; "url"]) s.V.columns in
  let cover = Wr.gallery_asset_ident ~asset_class:s.V.asset_class
    ~infer:(List.mem inst.V.feature ["class-objects"; "query-result"])
    ~cover_idents:(List.map (fun c -> c.V.c_id) cover_columns) s.V.view_ent in
  let display = Wr.gallery_display_idents
    ~column_idents:(List.map (fun c -> c.V.c_id) s.V.columns)
    ~asset_ident:cover s.V.view_ent in
  cover, display

let gallery_remote_url value =
  let values = match value with W.Array values | W.Set values -> values | _ -> [value] in
  List.find_map (fun value ->
    let value = match value with
      | W.Map _ -> Option.value (W.get value "logseq.property/value") ~default:W.Nil
      | value -> value in
    match W.as_string value with
    | Some url ->
        let url = String.trim url in
        if Str_util.starts_with "https://" url || Str_util.starts_with "http://" url
        then Some url else None
    | None -> None) values

let gallery_asset_cover inst ~width ~height value : t =
 fun context parent ->
  let candidates = match value with W.Array xs | W.Set xs -> xs | _ -> [value] in
  let asset = List.find_opt (fun value -> Wr.ref_uuid value <> None) candidates in
  match asset with
  | None -> spacer [] context parent
  | Some entity when W.get entity "logseq.property.asset/type" <> None ->
      Asset_dom.gallery_cover ~width ~height entity context parent
  | Some entity ->
      let uuid = Option.get (Wr.ref_uuid entity) in
      let resolved = Signal.state context.Lui_ui.ui_scheduler W.Nil in
      let generation = !(inst.V.data_gen) in
      let revision = (Runtime.model ()).Model.context_revision in
      let repo = Runtime.repo () and view = (V.get inst).V.view_uuid in
      let live = ref true in
      Signal.on_dispose context.Lui_ui.ui_scope (fun () -> live := false);
      Views_db.get_blocks [uuid] ~metadata:true (fun entities ->
        if !live && Runtime.repo () = repo && V.fetch_fresh inst generation &&
           (Runtime.model ()).Model.context_revision = revision &&
           (V.get inst).V.view_uuid = view then
          match List.find_opt (fun entity -> Wr.ref_uuid entity = Some uuid) entities with
          | Some entity -> Runtime.signal_set resolved entity
          | None -> ());
      (box ~width ~height [reactive (fun entity ->
        Asset_dom.gallery_cover ~width ~height entity) (Signal.value resolved)]) context parent

let gallery_card inst (row_uuid, blk) : t =
  let dimensions (s : V.vstate) = Wr.gallery_dimensions s.V.view_ent in
  let selected (s : V.vstate) = V.table_row_selected s row_uuid in
  let config_equal (a : V.vstate) (b : V.vstate) =
    a.V.view_ent = b.V.view_ent && a.V.columns = b.V.columns &&
    a.V.asset_class = b.V.asset_class in
  Ui_parts.int_prop L.WidthValue
    ~value:(reactive (fun s -> fst (dimensions s)) (sig_of inst))
  (Ui_parts.int_prop L.HeightValue
    ~value:(reactive (fun s -> snd (dimensions s)) (sig_of inst))
  (Ui_parts.string_prop L.BorderColorValue
    ~value:(reactive (fun s -> if selected s then "hsl(var(--primary))"
      else "hsl(var(--border))") (sig_of inst))
  (Ui_parts.string_prop L.StyleClass
    ~value:(reactive (fun s -> "ls-card-item content" ^
      if selected s then " is-selected" else "") (sig_of inst))
  (column ~key:row_uuid ~accessibility_identifier:("gallery-card-" ^ row_uuid)
    ~corner_radius:6 ~border_width:1
    [ row ~cross:`center ~height:32 [select_cell inst ~row_uuid ~blk]
    ; reactive ~equal:config_equal (fun s ->
        let cover, display = gallery_configuration inst s in
        let width, height = dimensions s in
        let media = match cover with
          | Some ident ->
              (match List.find_opt (fun c -> c.V.c_id = ident && c.V.c_type = "url") s.V.columns with
               | Some column ->
                   (match gallery_remote_url (cell_value blk column) with
                    | Some url -> [image ~url ~alt:"" ~width
                        ~height:(max 32 (height * 3 / 5))
                        ~loading:`lazy_ ~referrer_policy:`no_referrer []]
                    | None -> [])
               | None ->
                   let value = if ident = "block/uuid" then blk
                     else match List.find_opt (fun c -> c.V.c_id = ident) s.V.columns with
                       | Some column -> cell_value blk column
                       | None -> W.Nil in
                   [gallery_asset_cover inst ~width ~height:(max 32 (height * 3 / 5)) value])
          | None -> [] in
        column ~grow:1. ~min_height:0
          (media @ [column ~padding:8 ~gap:4 ~min_width:0
            (List.filter_map (fun ident ->
              if ident = "block/title" then
                let title = Wr.prop_text (cell_value blk (title_column ())) in
                Some (Ui_parts.pressable
                  ~on_press:(fun _ -> Runtime.mark_nav ();
                    Platform.set_location_hash
                      ("#/page/" ^ Ui_services.uri_encode_component row_uuid))
                  (text ~style_class:"ls-gallery-card-title" ~value:title []))
              else match List.find_opt (fun c -> c.V.c_id = ident) s.V.columns with
                | Some ({ V.c_prop = Some property; _ } as column) ->
                    let value = cell_value blk column in
                    if value = W.Nil then None
                    else
                      let row = W.Map
                        [W.Keyword "property", property;
                         W.Keyword "property-id", W.Keyword ident;
                         W.Keyword "value", value] in
                      let pctx : Properties_value.ctx =
                        { owner_key = "view-" ^ string_of_int inst.V.id
                        ; block_uuid = row_uuid; block_id = Properties_data.entity_id_of blk
                        ; refresh = (fun () -> refresh inst); is_page = is_page_row blk
                        ; class_schema = false } in
                      Some (box ~style_class:"ls-gallery-card-property"
                        [Properties_value.view ~table_view:true ~hover:None pctx row])
                | _ -> None) display)])) (sig_of inst) ]))))

(* Chunking bounds each virtual item while FlexWrap adapts the cards to
   the available width. The virtualizer measures each chunk's real height. *)
let render_gallery inst (s : V.vstate) : t =
 fun ctx parent ->
  let rec rows acc cur k = function
    | [] ->
        let acc = if cur = [] then acc else List.rev cur :: acc in
        List.rev acc
    | x :: xs when k = 4 -> rows (List.rev cur :: acc) [ x ] 1 xs
    | x :: xs -> rows acc (x :: cur) (k + 1) xs
  in
  let shown = flat_items (windowed inst s) in
  let row_els =
    List.mapi
      (fun i cards ->
        row ~key:("gr" ^ string_of_int i) ~gap:8 ~flex_wrap:`wrap
          (List.map (gallery_card inst) cards))
      (rows [] [] 0 shown)
  in
  let paginate = more_ref_rows inst s in
  let body ctx parent =
    let node = virtual_list ~key:"gal-window" ~grow:1. ~gap:8
      ~item_extent:(float_of_int (snd (Wr.gallery_dimensions s.V.view_ent) + 8))
      ~overscan:1
      ~data_attrs:
        (if paginate then
           [ ("data-virt-count", string_of_int (List.length row_els)) ]
         else [])
      row_els ctx parent in
    if paginate then
      Platform.register_dom_handler node ~events:"virt-end" (fun _ _ ->
          (V.ops ()).V.o_load_more inst);
    node in
  column ~gap:8 ~min_width:0 ~min_height:0 ~grow:1.
    [action_bar inst; body] ctx parent

let render_table inst s : t =
  let more = more_ref_rows inst s in
  let s = windowed inst s in
  match s.V.data with
  | Wr.VGrouped gs ->
      (* cljs grouped tables share the .flex.flex-col.border-t.pt-2.gap-2
         partition wrapper (no .group-list-view — that's list display) *)
      let last = List.length gs - 1 in
      column ~gap:8
        ~data_attrs:[ ("style", "border-top:1px solid hsl(var(--border));padding-top:8px") ]
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.gv) [])
               ~body:
                 (grouped_table ~paginate:(more && i = last) inst
                    ~rows:g.Wr.grows))
           gs)
  | Wr.VGroupedList gs ->
      let last_i = List.length gs - 1 in
      column ~gap:8
        ~data_attrs:[ ("style", "border-top:1px solid hsl(var(--border));padding-top:8px") ]
        (List.mapi
           (fun i g ->
             let last_j = List.length g.Wr.glparts - 1 in
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.glv) [])
               ~body:
                 (Logseq_el.fragment
                    (List.mapi
                       (fun j (buuid, rows) ->
                         foldable inst
                           ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                           ~title:(text ~value:(row_title s buuid) [])
                           ~body:
                             (grouped_table
                                ~paginate:(more && i = last_i && j = last_j)
                                inst ~rows))
                       g.Wr.glparts)))
           gs)
  | _ ->
      (* cljs view-table wraps the table in a random-uuid div *)
      box ~grow:1. ~accessibility_identifier:(Ui_services.env_random_uuid ())
        [ table_el ~paginate:more inst s ]

let error_el ~title ~content : t =
  column ~padding:4 ~margin_top:4 ~gap:4 ~border_width:1
    ~border_color:"hsl(var(--border))" ~style_class:"block-content-fallback-ui"
    [ text ~value:title ~foreground:"hsl(var(--destructive))" []
    ; text ~value:content [] ]

let result_el inst (s : V.vstate) : t =
  let refs =
    match inst.V.kind with
    | V.KLinkedRefs | V.KUnlinkedRefs -> true
    | _ -> false
  in
  (* A refetch keeps existing rows on screen. References never show the
     placeholder: their head and count already identify the pending section. *)
  let has_data = s.V.data <> Wr.VEmpty in
  if s.V.view_error <> None then
    error_el ~title:(I.t "view/error") ~content:(Option.get s.V.view_error)
  else if s.V.loading && refs && not has_data then box ~key:"ls-view-pending" []
  else if s.V.loading && not has_data then
    text ~value:(I.t "ui/loading") ~padding:8 ~foreground:"muted-foreground" []
  else
    (* master renders no empty-state copy under an empty table *)
    match s.V.display_type with
    | "list" -> render_list inst s
    | "gallery" -> render_gallery inst s
    | _ -> render_table inst s
