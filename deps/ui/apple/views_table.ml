(* ported from deps/ui/src/views/views_table.ml — date externals
   swapped for Js.Date; keep in sync upstream *)
(* Table/list/gallery body rendering for views — mirrors
   components/views.cljs + shui table/core.cljc DOM contract.

   Declarative: every producer returns a Lui_elements.t. Rows stream in
   through `keyed`/`Virt_list` item arrays derived from the inst's vstate
   signal; per-row state (selection, hover, collapsed groups) binds via
   reactive props — no imperative rebuilds. Overlay surfaces (menus,
   dialogs) mount imperatively through Views_popup. *)

module D = Logseq_dom
module E = Web_dom
module I = I18n
module V = Views_state
module Wr = Views_wire
module W = Wire
module P = Views_popup
module L = Lui_protocol

type t = Lui_elements.t

open Lui_elements

let dom = D.dom
let if_ = D.if_
let keyed = D.keyed
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

let refresh inst = (V.ops ()).V.o_refresh inst

(* schema icon names -> builtin variants; every other name resolves
   through the app icon registry (tabler svgs + custom paths like
   "caret-right" registered in app_icons) *)
let icon_of (name : string) : icon =
  match name with
  | "alert" -> `alert
  | "archive" -> `archive
  | "arrow-down" -> `arrow_down
  | "arrow-right" -> `arrow_right
  | "arrow-up" -> `arrow_up
  | "check" -> `check
  | "check-circle" -> `check_circle
  | "chevron-down" -> `chevron_down
  | "chevron-left" -> `chevron_left
  | "chevron-right" -> `chevron_right
  | "chevron-up" -> `chevron_up
  | "circle-dot" -> `circle_dot
  | "clock" -> `clock
  | "copy" -> `copy
  | "download" -> `download
  | "edit" -> `edit
  | "ellipsis" | "dots" -> `ellipsis
  | "external-link" -> `external_link
  | "eye" -> `eye
  | "file-text" -> `file_text
  | "folder" -> `folder
  | "folder-open" -> `folder_open
  | "git-branch" -> `git_branch
  | "git-merge" -> `git_merge
  | "git-pull-request" -> `git_pull_request
  | "info" -> `info
  | "menu" -> `menu
  | "mic" -> `mic
  | "moon" -> `moon
  | "music" -> `music
  | "panel-left" -> `panel_left
  | "panel-right" -> `panel_right
  | "pause" -> `pause
  | "play" -> `play
  | "plus" -> `plus
  | "refresh-cw" -> `refresh_cw
  | "repeat" -> `repeat
  | "save" -> `save
  | "search" -> `search
  | "send" -> `send
  | "settings" -> `settings
  | "shuffle" -> `shuffle
  | "skip-back" -> `skip_back
  | "skip-forward" -> `skip_forward
  | "sun" -> `sun
  | "terminal" -> `terminal
  | "trash" -> `trash
  | "volume" -> `volume
  | "wrench" -> `wrench
  | "x" -> `x
  | "x-circle" -> `x_circle
  | n -> `app n

(* component-kind icon carrying the same ls-icon-* marker classes the
   imperative span emitted (ui__icon comes from the kind itself) *)
let icon_el ?(cls = "") name : t =
  icon ~name:(icon_of name) ~point_size:16
    ~style_class:
      ("ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls)
    []

(* icons whose glyph flips with state (sort direction) — a reactive
   prop on one icon node, no remount *)
let icon_dyn (sig_ : string Signal.signal) : t =
  icon ~name:(reactive icon_of sig_) ~point_size:16 []

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

let select_column : V.column =
  builtin_column "select" I.select_col "default" ~disable_hide:true ()

(* cljs views.cljs keeps the :id column in `columns` but unconditionally
   hides it in `visible-columns` (assoc :id false) — never added here *)

let title_column : V.column = builtin_column "block/title" I.name_ "node" ()

(* all_pages.cljs uses (t :page/name) — "Page name" — for its title column *)
let page_title_column : V.column =
  builtin_column "block/title" I.page_name "node" ()

let tags_column : V.column =
  builtin_column "block/tags" I.filter_tags "node" ~many:true ()

(* cljs get-column-size defaults *)
let column_size (c : V.column) =
  match c.V.c_id with
  | "select" -> 32
  | "logseq.property/query" -> 400
  | "block/title" | "block/name" -> 360
  | "block/created-at" | "block/updated-at" -> 160
  | _ -> 180

let inner_cell children =
  row ~cross:`center ~padding_horizontal:8 children

let created_column : V.column =
  builtin_column "block/created-at" I.created_at "datetime" ()

let updated_column : V.column =
  builtin_column "block/updated-at" I.updated_at "datetime" ()

let page_column : V.column = builtin_column "block/page" I.page_label "node" ()

let refs_count_column : V.column =
  builtin_column "block.temp/refs-count" I.backlinks "number" ()

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
        { (builtin_column "block/tags" I.filter_tags "node" ()) with
          V.c_many = true }
  | "block/page" -> Some page_column
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
  let with_tags =
    if List.exists (fun c -> c.V.c_id = "block/tags") props then props
    else
      props
      @ [ { (builtin_column "block/tags" I.filter_tags "node" ()) with
            V.c_many = true } ]
  in
  match inst.V.kind with
  | V.KAllPages ->
      [ select_column; page_title_column; refs_count_column; tags_column
      ; created_column; updated_column ]
  | V.KTagPage _ | V.KPropertyPage _ ->
      (* cljs objects.cljs: Asset-class tag pages get a "File" column
         before the logseq property columns *)
      [ select_column; title_column ]
      @ (if s.V.asset_class
         then
           [ builtin_column "file" (I18n.t "file/label") "default"
               ~disable_hide:true () ]
         else [])
      @ with_tags
      @ [ created_column; updated_column; page_column ]
  | V.KQuery _ ->
      (* cljs get-query-columns: build-columns over view-data :properties
         (idents); created/updated only when pulled for advanced queries *)
      let qcols = List.filter_map (column_of_ident s) s.V.query_idents in
      let tail =
        if s.V.is_advanced then []
        else [ created_column; updated_column ]
      in
      [ select_column; title_column ] @ qcols @ tail
      @ (if s.V.is_advanced
         then
           (if List.mem "block/created-at" s.V.query_idents
            then [ created_column ] else [])
           @ (if List.mem "block/updated-at" s.V.query_idents
              then [ updated_column ] else [])
         else [])

let visible_columns (s : V.vstate) =
  let cols =
    List.filter
      (fun c ->
        c.V.c_id <> "id" && not (V.Sset.mem c.V.c_id s.V.hidden))
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

(* melange Date externals → Js.Date (epoch-ms float) on the native twin *)
let date_of_ms (ms : float) : Js.Date.t = ms
let date_year d = int_of_float (Js.Date.getFullYear d)
let date_month d = int_of_float (Js.Date.getMonth d)
let date_day d = int_of_float (Js.Date.getDate d)
let date_hours d = int_of_float (Js.Date.getHours d)
let date_minutes d = int_of_float (Js.Date.getMinutes d)

let pad2 n =
  if n < 10 then "0" ^ string_of_int n else string_of_int n

(* cljs date/int->local-time-2 → "yyyy-MM-dd HH:mm" local *)
let fmt_date ms =
  let d = date_of_ms ms in
  Printf.sprintf "%04d-%s-%s %s:%s" (date_year d)
    (pad2 (date_month d + 1))
    (pad2 (date_day d)) (pad2 (date_hours d)) (pad2 (date_minutes d))

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

(* declarative checkbox: `shown` derives the checked bit from the
   vstate. The label-hover reveal (mouseover/mouseout) is DOM-only and
   gone — the box is always visible now *)
let checkbox_el inst ~jtrigger ~id ~aria_label ~shown ~on_toggle : t =
  checkbox ~accessibility_identifier:id ~label:aria_label
    ~style_class:(if jtrigger then "jtrigger" else "")
    ~checked:(reactive shown (sig_of inst))
    ~on_toggle:(fun ev ->
      match ev with
      | L.ToggleChanged (_, on) -> on_toggle on
      | _ -> ())
    []

(* cljs row-checkbox: label.jtrigger > shui checkbox *)
let select_cell inst ~row_uuid ~blk : t =
  let dbid =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  row ~cross:`center
    [ row ~cross:`center ~main:`center ~width:32 ~height:32
        ~style_class:"jtrigger"
        [ checkbox_el inst ~jtrigger:true ~id:(dbid ^ "-checkbox")
            ~aria_label:I.select_row
            ~shown:(fun (s : V.vstate) -> V.Sset.mem row_uuid s.V.selected)
            ~on_toggle:(fun on ->
              V.update inst (fun s ->
                  { s with
                    V.selected =
                      (if on then V.Sset.add row_uuid s.V.selected
                       else V.Sset.remove row_uuid s.V.selected)
                  })) ]
    ]

let open_row_sidebar row_uuid =
  Web_dom.dispatch_custom "ls:open-right-sidebar"
    (Js.Json.object_
       (Js.Dict.fromList [ ("uuid", Js.Json.string row_uuid) ]))

let goto_page name =
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ name))

let title_cell inst ~row_uuid ~blk (c : V.column) : t =
  let title = Wr.prop_text (cell_value blk c) in
  match inst.V.kind, W.get blk "block/name" with
  | V.KAllPages, Some (W.String name) ->
      (* cljs page-title-cell: div.flex.h-full.min-w-0.items-center >
         a.page-ref.truncate; href prefers block/uuid — the component
         version is a pressable text; `title` (tooltip) has no prop *)
      let page_name =
        if row_uuid <> "" then row_uuid
        else if name <> "" then name
        else title
      in
      inner_cell
        [ row ~cross:`center ~grow:1.
            [ text ~style_class:"page-ref" ~value:title
                ~on_press:(fun _ -> goto_page page_name) [] ]
        ]
  | _ ->
      (* cljs table-block-title: flex row of text + hover "Open" ghost
         buttons (.-right-1.absolute) that open the row in the sidebar —
         the hover-only visibility is DOM-only; the buttons are always
         rendered now *)
      let ghost icon_name title_ =
        button ~variant:`ghost ~size:`icon ~icon:(icon_of icon_name)
          ~style_class:"bg-gray-01 text-muted-foreground" ~label:title_
          ~on_press:(fun _ -> open_row_sidebar row_uuid) []
      in
      inner_cell
        [ Ui_parts.pressable
            ~on_press:(fun _ -> open_row_sidebar row_uuid)
            (row ~cross:`center ~grow:1.
               ~style_class:"table-block-title"
               [ row [ text ~value:title [] ]
               ; row ~cross:`center
                   [ ghost "arrow-right" I.open_
                   ; ghost "layout-sidebar-right" I.open_in_sidebar ]
               ]) ]

let prop_cell ~blk (c : V.column) : t =
  match cell_value blk c with
  | W.Map _ as v when Wr.ref_uuid v <> None ->
      let t_ = Option.value (Wr.ref_title v) ~default:"" in
      let href = Option.value (Wr.ref_uuid v) ~default:t_ in
      inner_cell
        [ text ~style_class:"page-ref" ~value:t_
            ~on_press:(fun _ -> goto_page href) [] ]
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
              (* cljs select-item -> page-cp {:tag?} ->
                 a.relative.tag[data-ref][data-uuid][draggable] > span —
                 the data-*/draggable/tabindex markers are DOM-only and
                 dropped; the tag carries no href so it stays inert *)
              [ box ~style_class:"select-item"
                  [ text ~style_class:"relative tag" ~value:("#" ^ t_) [] ]
              ]
            else
              (if i > 0 then [ text ~value:"," [] ] else [])
              @ [ box
                    [ text ~style_class:"page-ref" ~value:t_
                        ~on_press:(fun _ ->
                          goto_page
                            (Option.value (Wr.ref_uuid x) ~default:t_))
                        [] ] ])
             items)
      in
      inner_cell
        [ box ~style_class:"property-value-inner"
            [ row ~cross:`center ~grow:1. ~gap:4
                ~style_class:"jtrigger multi-values" item_els ] ]
  | W.Bool b when c.V.c_type = "checkbox" ->
      inner_cell [ checkbox ~checked:b ~disabled:true [] ]
  | v -> inner_cell [ text ~value:(fmt_cell_value c v) [] ]

let cell_el inst ~row_uuid ~blk (c : V.column) : t =
  (* the cljs `title` tooltip and tabindex have no component props *)
  box ~style_class:"ls-table-cell" ~width:(column_size c)
    ~min_width:(column_size c)
    [ (match c.V.c_id with
       | "select" -> select_cell inst ~row_uuid ~blk
       | "block/title" -> title_cell inst ~row_uuid ~blk c
       | "file" -> Asset_dom.file_cell_el blk
       | _ -> prop_cell ~blk c) ]

(* ---------- header ---------- *)

let all_row_uuids (s : V.vstate) =
  match s.V.data with
  | Wr.VFlat { rows; _ } -> rows
  | Wr.VGrouped gs -> List.concat_map (fun g -> g.Wr.grows) gs
  | Wr.VGroupedList gs ->
      List.concat_map (fun g -> List.concat_map snd g.Wr.glparts) gs
  | Wr.VEmpty -> []

let sortable c =
  not
    (List.mem c.V.c_id
       [ "select"; "id"; "block/page"; "block.temp/refs-count" ])

(* cljs header-checkbox: the hover reveal is DOM-only — always
   visible now *)
let header_select_cell inst : t =
  let shown (s : V.vstate) = not (V.Sset.is_empty s.V.selected) in
  row ~cross:`center ~main:`center ~width:32 ~height:32
    [ checkbox_el inst ~jtrigger:false ~id:"header-checkbox" ~shown
        ~aria_label:I.select_all
        ~on_toggle:(fun on ->
          V.update inst (fun s ->
              { s with
                V.selected =
                  (if on then
                     List.fold_left
                       (fun acc u -> V.Sset.add u acc)
                       s.V.selected (all_row_uuids s)
                   else V.Sset.empty)
              })) ]

(* cljs header-cp: text-variant button holding the title span and a sort
   arrow for the active sort column — the arrow's presence is
   signal-gated (shape change -> if_), its glyph a reactive prop *)
let header_button inst (c : V.column) : t =
  let sort_sig =
    Signal.map
      (fun (s : V.vstate) ->
        List.find_opt (fun x -> x.V.s_id = c.V.c_id) s.V.sorting)
      inst.V.st.Signal.state_signal
  in
  button ~variant:`ghost ~size:`sm ~text:c.V.c_name ~grow:1.
    ~main:`start ~height:32 ~padding_horizontal:8
    [ if_ ~test:(Signal.map (fun o -> o <> None) sort_sig)
        (icon_dyn
           (Signal.map
              (fun o ->
                match o with
                | Some x when x.V.s_asc -> "arrow-up"
                | _ -> "arrow-down")
              sort_sig)) ]

let set_column_sort inst (c : V.column) asc =
  V.update inst (fun s ->
      { s with V.sorting = [ { V.s_id = c.V.c_id; s_asc = asc } ] });
  V.persist_sorting inst;
  refresh inst

let sort_menu_items inst (c : V.column) =
  [ P.MItem (I.sort_ascending, fun () -> set_column_sort inst c true)
  ; P.MItem (I.sort_descending, fun () -> set_column_sort inst c false) ]

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
    [ (I.sort_ascending, true); (I.sort_descending, false) ]

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
             then I.unpin
             else I.pin)
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

let header_cell inst (c : V.column) : t =
  let cls =
    "ls-table-header-cell"
    ^ if c.V.c_id = "select" then " !border-0" else ""
  in
  match c.V.c_id with
  | "select" ->
      box ~style_class:cls ~width:(column_size c)
        ~min_width:(column_size c)
        [ header_select_cell inst ]
  | _ ->
      let menu () =
        match E.get_element_by_id (header_cell_id inst c) with
        | Some anchor -> (
            match c.V.c_prop with
            | Some p -> open_property_menu inst ~anchor c p
            | None ->
                if sortable c then
                  ignore
                    (P.show_menu ~anchor
                       ~cls_prefix:"ls-property-dropdown "
                       (sort_menu_items inst c)))
        | None -> ()
      in
      Ui_parts.pressable ~on_press:(fun _ -> menu ())
        (box ~style_class:cls ~accessibility_identifier:(header_cell_id inst c)
           ~width:(column_size c) ~min_width:(column_size c)
           [ header_button inst c
           ; box ~style_class:"ls-table-resize-handle" [] ])

(* ---------- action bar ---------- *)

let page_row_uuids inst =
  let s = V.get inst in
  List.filter
    (fun u ->
      match Hashtbl.find_opt s.V.blocks u with
      | Some blk -> is_page_row blk
      | None -> inst.V.feature = "all-pages")
    (V.Sset.elements s.V.selected)

let delete_selected inst () =
  let s = V.get inst in
  let sel = V.Sset.elements s.V.selected in
  if sel <> [] then begin
    let pages = page_row_uuids inst in
    let blocks = List.filter (fun u -> not (List.mem u pages)) sel in
    let do_delete () =
      Views_db.delete_blocks blocks (fun () ->
          List.iter (fun p -> Views_db.delete_page p (fun () -> ())) pages;
          V.update inst (fun s -> { s with V.selected = V.Sset.empty });
          refresh inst)
    in
    let need_confirm =
      pages <> [] && List.mem inst.V.feature [ "all-pages"; "query-result" ]
    in
    if need_confirm then
      let names =
        List.filter_map
          (fun u ->
            match Hashtbl.find_opt s.V.blocks u with
            | Some blk -> (
                match Wr.prop_text (cell_value blk title_column) with
                | "" -> None
                | t -> Some t)
            | None -> None)
          pages
      in
      ignore
        (P.show_dialog
           ~headline:I.batch_delete_title
           ~body:
             [ E.h ~tag:"ol" ~cls:"p-2 pt-4"
                 ~children:(List.map (fun n -> E.h ~tag:"li" ~text:n ()) names)
                 ()
             ; E.h ~tag:"p" ~cls:"px-2 opacity-50"
                 ~children:
                   [ E.h ~tag:"small" ~text:(I.total (List.length names)) () ]
                 ()
             ]
           ~confirm_label:I.yes ~on_confirm:do_delete ())
    else do_delete ()
  end

let action_bar inst : t =
  let isig = sig_of inst in
  if_ ~test:(Signal.map (fun s -> not (V.Sset.is_empty s.V.selected)) isig)
    (box ~style_class:"table-action-bar absolute top-0 left-8"
       [ row ~gap:4 ~cross:`center ~background:"secondary"
           ~style_class:"ls-table-actions"
           [ text ~style_class:"selection-count" ~padding_horizontal:8
               ~value:
                 (reactive
                    (fun (s : V.vstate) ->
                      I.selected_count (V.Sset.cardinal s.V.selected))
                    isig)
               []
           ; button ~variant:`ghost ~size:`icon ~icon:`trash
               ~on_press:(fun _ -> delete_selected inst ()) []
           ]
       ])

(* ---------- table ---------- *)

(* TODO(component): dnd-kit a11y nodes — display:none inline style,
   role=status + aria-live/aria-atomic, and the DndDescribedBy-*/
   DndLiveRegion-* ids have no component-kind props; kept as minimal
   dom so screen-reader drag instructions survive *)
let dnd_described n : t =
  dom ~id:("DndDescribedBy-" ^ n) ~attrs:[ ("style", "display: none;") ]
    ~text:
      "To pick up a draggable item, press the space bar. While dragging, \
       use the arrow keys to move the item. Press space again to drop the \
       item in its new position, or press escape to cancel."
    []

let dnd_live n : t =
  dom
    ~attrs:
      [ ("role", "status"); ("aria-live", "assertive")
      ; ("aria-atomic", "true")
      ; ( "style"
        , "position: fixed; top: 0px; left: 0px; width: 1px; height: 1px; \
           margin: -1px; border: 0px; padding: 0px; overflow: hidden; \
           clip: rect(0px, 0px, 0px, 0px); clip-path: inset(100%); \
           white-space: nowrap;" ) ]
    ~id:("DndLiveRegion-" ^ n) []

(* class-objects tables show the add-property column; matching rows get
   a trailing empty cell *)
let show_add_property inst =
  match inst.V.kind with
  | V.KTagPage _ -> !Runtime.current_page
  | V.KPropertyPage _ | V.KAllPages | V.KQuery _ -> None

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

(* TODO(component): the imperative side still reads `blockid` /
   data-id off .ls-block rows (dnd/block_dnd, editor/block_selection);
   component kinds can't emit them — the uuid lands on
   ~accessibility_identifier (ls-block-<uuid>) until those readers
   switch to it *)
let row_el inst (cols : V.column list) ~row_uuid ~blk : t =
  let cell_wrap c = box ~height:33 [ cell_el inst ~row_uuid ~blk c ] in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  row ~cross:`stretch
    ~style_class:"ls-table-row ls-block"
    ~accessibility_identifier:("ls-block-" ^ row_uuid)
    [ (* cljs: .sticky-columns holds pinned cells, sibling .flex.flex-row
         holds the unpinned ones — each cell wrapped in .h-full *)
      row ~style_class:"sticky-columns"
        (List.map cell_wrap pinned)
    ; row
        (List.map cell_wrap free
         @ (match show_add_property inst with
            | Some _ ->
                [ box
                    [ box ~style_class:"ls-table-cell"
                        [ row ~cross:`center ~grow:1. [] ] ] ]
            | None -> [])) ]

(* rows keyed under a parent — Virt_list for >=64 rows, keyed
   reconciliation below that. The uuid set comes from the body snapshot
   (group membership is fixed per rebuild); the item stream keeps block
   content live from the vstate. *)
let row_stream inst cols uuids : t =
 fun ctx parent ->
  let items_sig =
    Signal.map
      (fun (s : V.vstate) -> List.map (row_item_of s) uuids)
      inst.V.st.Signal.state_signal
  in
  let items = Signal.get items_sig in
  if Virt_list.enabled ~virtualize:true (List.length items) then
    Virt_list.list ~key_of:fst
      ~data_sig:(fun dctx ->
        Some
          (Signal.map
             (fun (s : V.vstate) ->
               Array.of_list (List.map (row_item_of s) uuids))
             inst.V.st.Signal.state_signal
           |> Signal.own_signal dctx.Lui_ui.ui_scope))
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
let table_header inst cols : t =
  let cell_item c =
    let cell = header_cell inst c in
    if c.V.c_id = "select" then
      box ~accessibility_identifier:"Select" [ cell ]
    else box [ cell ]
  in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  row ~style_class:"ls-table-header"
    [ row ~style_class:"sticky-columns"
        (List.map cell_item pinned @ [ dnd_described "0"; dnd_live "0" ])
    ; row
        (List.map cell_item free
         @ (match show_add_property inst with
            | Some p ->
                (* cljs add-property-button: trailing "New property"
                   header cell on class-objects tables only *)
                [ box ~accessibility_identifier:"add property"
                    [ box ~style_class:"ls-table-header-cell"
                        [ button ~variant:`ghost ~size:`sm ~icon:`plus
                            ~text:I.new_property ~grow:1. ~main:`start
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
         @ [ dnd_described "1"; dnd_live "1" ])
    ; action_bar inst ]

(* footer add-new-row (cljs: property-objects always; class-objects for
   non-private classes; all-pages/query never) *)
let add_row_footer inst : t =
  let has_add_object =
    match inst.V.kind with
    | V.KPropertyPage _ -> true
    | V.KTagPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | V.KAllPages | V.KQuery _ -> false
  in
  if has_add_object then
    box ~style_class:"ls-table-footer"
      [ Ui_parts.pressable
          ~on_press:(fun _ -> (V.ops ()).V.o_add_object inst)
          (row ~gap:4 ~cross:`center ~padding_horizontal:8
             ~padding_vertical:4 ~foreground:"muted-foreground" ~grow:1.
             [ icon_el "plus"; text ~value:I.new_ [] ]) ]
  else spacer ~key:"no-footer" []

(* cljs: shui/table > .ls-table-rows.content.overflow-x-auto
   .force-visible-scrollbar > .relative > [header; body rows] *)
let table_el inst (s : V.vstate) : t =
  let cols = visible_columns s in
  box ~style_class:"ls-table"
    [ scroll ~orientation:`horizontal
        ~style_class:"ls-table-rows content force-visible-scrollbar"
        [ box ~style_class:"relative"
            [ table_header inst cols
            ; (* cljs Virtuoso mounts the rows under
                 [data-testid=virtuoso-item-list] inside two bare wrapper
                 divs; each row sits in a bare item div *)
              box
                [ box
                    [ box
                        ~accessibility_identifier:"virtuoso-item-list"
                        [ row_stream inst cols (all_row_uuids s) ] ] ]
            ; add_row_footer inst ] ] ]

(* cljs renders a full inner view-table per group — its own column
   header row (no action bar) plus the group's rows *)
let grouped_table inst ~rows : t =
 fun ctx parent ->
  let s = V.get inst in
  let cols = visible_columns s in
  box ~style_class:"ls-table"
    [ scroll ~orientation:`horizontal
        ~style_class:"ls-table-rows content force-visible-scrollbar"
        [ box ~style_class:"relative"
            [ table_header inst cols
            ; box ~accessibility_identifier:"virtuoso-item-list"
                [ row_stream inst cols rows ]
            ]
        ]
    ]
    ctx parent

(* ---------- list + gallery ---------- *)

(* TODO(component): blockid attrs dropped like row_el —
   .ls-block[blockid] readers in dnd/block_dnd must move to the
   ls-block-<uuid> accessibility_identifier *)
let list_row_el ~row_uuid ~title : t =
  box ~style_class:"ls-block"
    ~accessibility_identifier:("ls-block-" ^ row_uuid)
    [ row ~gap:4 ~style_class:"block-main-container"
        [ box ~style_class:"block-content"
            ~accessibility_identifier:("block-content-" ^ row_uuid)
            [ text ~style_class:"block-title-wrap" ~value:title [] ] ] ]

let row_title s u =
  match Hashtbl.find_opt s.V.blocks u with
  | Some b -> (
      match W.get b "block/title" with
      | Some t_ -> Wr.prop_text t_
      | None -> "")
  | None -> ""

let gallery_card_el ~title : t =
  box ~style_class:"ls-card-item" [ text ~value:title [] ]

(* ---------- foldable groups ---------- *)

(* cljs ui/foldable: .flex.flex-col > (.ls-foldable-title.content +
   .ls-foldable-content > .ls-foldable-content-inner). The caret toggles
   control-show only while the title is hovered — hover is DOM-only, so
   the caret is always shown; its rotated state rides a reactive
   style_class via Ui_parts.class_signal. caret-right is a custom path
   icon (registered in app_icons). *)
let foldable inst ~key ~title ~(body : t) : t =
  let collapsed_sig =
    Signal.map
      (fun (s : V.vstate) -> V.Sset.mem key s.V.collapsed_groups)
      inst.V.st.Signal.state_signal
  in
  column
    [ row ~style_class:"ls-foldable-title content"
        [ row ~grow:1. ~style_class:"foldable-title"
            [ row ~cross:`center ~gap:4
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
                    (box ~style_class:
                       "ls-foldable-title-control block-control \
                        control-show cursor-pointer"
                       ~width:14 ~height:16
                       [ Ui_parts.class_signal collapsed_sig
                           (fun c ->
                             "rotating-arrow"
                             ^ if c then " collapsed"
                               else " not-collapsed")
                           (box ~key:"caret"
                              [ icon ~name:(`app "caret-right")
                                  ~point_size:16 [] ]) ])
                ; title ] ]
        ]
    ; Ui_parts.class_signal collapsed_sig
        (fun c ->
          "ls-foldable-content" ^ if c then " is-collapsed" else "")
        (box ~key:"content"
           [ box ~style_class:"ls-foldable-content-inner" [ body ] ]) ]

let group_title s gv =
  match gv with
  | W.Map _ -> (
      match Wr.ref_title gv with
      | Some t when t <> "" -> t
      | _ -> I.no_group_value (Option.value s.V.group_by ~default:""))
  | W.Nil ->
      if s.V.group_by = Some "block/page" then I.pages
      else I.no_group_value (Option.value s.V.group_by ~default:"")
  | v -> Wr.prop_text v

(* ---------- body dispatch ---------- *)

(* rows for the list display: same (uuid, blk) stream, ls-block markup *)
let list_stream inst uuids : t =
 fun ctx parent ->
  let items_sig =
    Signal.map
      (fun (s : V.vstate) -> List.map (row_item_of s) uuids)
      inst.V.st.Signal.state_signal
  in
  let items = Signal.get items_sig in
  let title_of s (_, blk) =
    match W.get blk "block/title" with
    | Some t_ -> Wr.prop_text t_
    | None -> row_title s ""
  in
  if Virt_list.enabled ~virtualize:true (List.length items) then
    Virt_list.list ~key_of:fst
      ~data_sig:(fun dctx ->
        Some
          (Signal.map
             (fun (s : V.vstate) ->
               Array.of_list (List.map (row_item_of s) uuids))
             inst.V.st.Signal.state_signal
           |> Signal.own_signal dctx.Lui_ui.ui_scope))
      ~render:(fun (u, blk) ->
        list_row_el ~row_uuid:u ~title:(title_of (V.get inst) (u, blk)))
      (Array.of_list items)
      ctx parent
  else
    keyed ~source:items_sig ~key:keyed_row_key ~cmp:String.compare
      ~mount:(fun item_sig ->
        let u, blk = Signal.get item_sig in
        list_row_el ~row_uuid:u ~title:(title_of (V.get inst) (u, blk)))
      ctx parent

let render_list inst s : t =
  match s.V.data with
  | Wr.VGrouped gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.gv) [])
               ~body:(list_stream inst g.Wr.grows))
           gs)
  | Wr.VGroupedList gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.glv) [])
               ~body:
                 (D.fragment
                    (List.mapi
                       (fun j (buuid, rows) ->
                         foldable inst
                           ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                           ~title:(text ~value:(row_title s buuid) [])
                           ~body:(list_stream inst rows))
                       g.Wr.glparts)))
           gs)
  | _ -> list_stream inst (all_row_uuids s)

let render_gallery inst s : t =
  row ~gap:8 ~padding:8 ~columns:4
    [ keyed
        ~source:
          (Signal.map
             (fun (s' : V.vstate) -> flat_items s')
             inst.V.st.Signal.state_signal)
        ~key:keyed_row_key ~cmp:String.compare
        ~mount:(fun item_sig ->
          let u, blk = Signal.get item_sig in
          gallery_card_el
            ~title:
              (match W.get blk "block/title" with
               | Some t_ -> Wr.prop_text t_
               | None -> row_title s u)) ]

let render_table inst s : t =
  match s.V.data with
  | Wr.VGrouped gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.gv) [])
               ~body:(grouped_table inst ~rows:g.Wr.grows))
           gs)
  | Wr.VGroupedList gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(text ~value:(group_title s g.Wr.glv) [])
               ~body:
                 (D.fragment
                    (List.mapi
                       (fun j (buuid, rows) ->
                         foldable inst
                           ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                           ~title:(text ~value:(row_title s buuid) [])
                           ~body:(grouped_table inst ~rows))
                       g.Wr.glparts)))
           gs)
  | _ ->
      (* cljs view-table wraps the table in a random-uuid div *)
      box ~accessibility_identifier:(Platform.random_uuid ())
        [ table_el inst s ]

let body_el inst (s : V.vstate) ~(filters : t) : t =
  column ~gap:8 ~style_class:"ls-view-body"
    [ filters
    ; (if s.V.loading then
         text ~value:I.loading_ ~padding:8 ~foreground:"muted-foreground"
           []
       else
         D.fragment
           [ (match s.V.display_type with
              | "list" -> render_list inst s
              | "gallery" -> render_gallery inst s
              | _ -> render_table inst s)
           ; (match s.V.data with
              | Wr.VFlat { rows = []; _ } ->
                  text ~value:I.no_matched_result ~padding:8
                    ~foreground:"muted-foreground" []
              | _ -> spacer ~key:"no-empty-notice" [])
           ])
    ]
