(* Table/list/gallery body rendering for views — mirrors
   components/views.cljs + shui table/core.cljc DOM contract.

   Declarative: every producer returns a Lui_elements.t. Rows stream in
   through `keyed`/`Virt_list` item arrays derived from the inst's vstate
   signal; per-row state (selection, hover, collapsed groups) binds via
   reactive props — no imperative rebuilds. Overlay surfaces (menus,
   dialogs) mount imperatively through Views_popup. *)

module D = Logseq_dom
module E = Views_el
module Ed = Editor_dom
module I = I18n
module V = Views_state
module Wr = Views_wire
module W = Wire
module P = Views_popup
module L = Lui_protocol

type t = Lui_elements.t

let dom = D.dom
let if_ = D.if_
let keyed = D.keyed
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

let refresh inst = (V.ops ()).V.o_refresh inst

(* <span class="ui__icon ti ls-icon-{name}">…</span> — identical markup
   to the imperative Views_el.icon (tabler svg or font-glyph fallback),
   baked into the node's html prop *)
let icon_el ?(cls = "") name : t =
  let inner = E.el_inner_html (E.icon name) in
  dom ~tag:"span"
    ~style_class:
      ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls)
    ~html:inner []

(* icons whose glyph flips with state (sort direction) — remounts just
   the icon node *)
let icon_dyn (sig_ : string Signal.signal) : t =
  D.dyn ~equal:(=) (fun name -> icon_el name) sig_

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

let size_style c =
  let w = string_of_int (column_size c) in
  "width:" ^ w ^ "px;min-width:" ^ w ^ "px"

let inner_cls ?(select = false) () =
  "flex align-middle w-full overflow-x-clip items-center"
  ^ if select then " px-0" else " border-r px-2"

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

external date_of_ms : float -> Js.Json.t = "Date" [@@mel.new]
external date_year : Js.Json.t -> int = "getFullYear" [@@mel.send]
external date_month : Js.Json.t -> int = "getMonth" [@@mel.send]
external date_day : Js.Json.t -> int = "getDate" [@@mel.send]
external date_hours : Js.Json.t -> int = "getHours" [@@mel.send]
external date_minutes : Js.Json.t -> int = "getMinutes" [@@mel.send]

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

(* cljs shui checkbox renders a styled button[role=checkbox] with a
   plain input[type=checkbox] sibling; the label toggles .peer styles *)
let checkbox_cls ~jtrigger show =
  "ui__checkbox peer h-4 w-4 shrink-0 rounded-sm border border-primary \
   cursor-pointer flex transition-opacity focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring \
   focus-visible:ring-offset-2 ring-offset-background \
   disabled:cursor-not-allowed disabled:opacity-50 \
   data-[checked]:bg-primary data-[checked]:text-primary-foreground"
  ^ (if jtrigger then " jtrigger" else "")
  ^ if show then " opacity-100" else " opacity-0"

(* declarative shui checkbox: `shown` derives the checked bit from the
   vstate; a mount-scoped hover state (label mouseover/out, like the old
   imperative class flip) shows an unchecked box on hover *)
let checkbox_el inst ~jtrigger ~id ~aria_label ~shown ~on_toggle ~hover : t =
  dom ~tag:"button" ~id
    ~style_class_signal:
      (Signal.map2
         (fun (s : V.vstate) h ->
           L.StringValue (checkbox_cls ~jtrigger (h || shown s)))
         inst.V.st.Signal.state_signal hover.Signal.state_signal)
    ~attrs_signal_v:
      (D.attrs_signal inst.V.st.Signal.state_signal (fun s ->
           let on = shown s in
           [ ("type", "button"); ("tabindex", "0"); ("role", "checkbox")
           ; ("aria-label", aria_label)
           ; ("aria-checked", if on then "true" else "false")
           ; ((if on then "data-checked" else "data-unchecked"), "") ]))
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then on_toggle (not (shown (V.get inst))))
    []

(* cljs mounts a visually-hidden native input sibling inside the label
   (1px clipped fixed box); a normal checkbox would overlap the button
   and swallow its clicks *)
let checkbox_hidden_input : t =
  dom ~tag:"input"
    ~attrs:
      [ ("tabindex", "-1"); ("aria-hidden", "true"); ("type", "checkbox")
      ; ( "style"
        , "clip-path: inset(50%); overflow: hidden; white-space: nowrap; \
           border: 0px; padding: 0px; width: 1px; height: 1px; margin: \
           -1px; position: fixed; top: 0px; left: 0px;" ) ]
    []

(* cljs row-checkbox: label.jtrigger > shui checkbox; opacity flips on
   hover of the label *)
let select_cell inst ~row_uuid ~blk : t =
 fun ctx parent ->
  let hover = Signal.state ctx.Lui_ui.ui_scheduler false in
  let dbid =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  dom ~style_class:(inner_cls ~select:true ())
    [ dom ~tag:"label"
        ~style_class:
          " jtrigger h-8 w-8 flex items-center justify-center \
           cursor-pointer"
        ~attrs:
          [ ("for", dbid ^ "-checkbox"); ("data-table-row-select", "true") ]
        ~events:"mouseover mouseout"
        ~on_dom_event:(fun name _ ->
          Runtime.signal_set hover (name = "mouseover"))
        [ checkbox_el inst ~jtrigger:true ~id:(dbid ^ "-checkbox")
            ~aria_label:I.select_row ~hover
            ~shown:(fun (s : V.vstate) -> V.Sset.mem row_uuid s.V.selected)
            ~on_toggle:(fun on ->
              V.update inst (fun s ->
                  { s with
                    V.selected =
                      (if on then V.Sset.add row_uuid s.V.selected
                       else V.Sset.remove row_uuid s.V.selected)
                  }))
        ; checkbox_hidden_input ]
    ]
    ctx parent

let open_row_sidebar row_uuid =
  Platform.dispatch "ls:open-right-sidebar"
    (Js.Json.object_
       (Js.Dict.fromList [ ("uuid", Js.Json.string row_uuid) ]))

let title_cell inst ~row_uuid ~blk (c : V.column) : t =
  let title = Wr.prop_text (cell_value blk c) in
  match inst.V.kind, W.get blk "block/name" with
  | V.KAllPages, Some (W.String name) ->
      (* cljs page-title-cell: div.flex.h-full.min-w-0.items-center >
         a.page-ref.truncate; href prefers block/uuid *)
      let page_name =
        if row_uuid <> "" then row_uuid
        else if name <> "" then name
        else title
      in
      dom ~style_class:(inner_cls ())
        [ dom ~style_class:"flex h-full min-w-0 items-center"
            [ dom ~tag:"a" ~style_class:"page-ref truncate"
                ~attrs:
                  [ ("href", "#/page/" ^ page_name); ("title", title) ]
                ~text:title [] ]
        ]
  | _ ->
      (* cljs table-block-title: flex row of text + hover "Open" ghost
         buttons (.-right-1.absolute) that open the row in the sidebar *)
      let open_btn_cls =
        E.button_cls ~variant:"ghost"
          ~cls:
            "!p-1 w-6 h-6 bg-gray-01 opacity-0 transition-opacity \
             duration-100 ease-in text-muted-foreground"
          ()
      in
      let ghost icon_name title_ =
        dom ~tag:"button" ~style_class:open_btn_cls
          ~attrs:[ ("type", "button"); ("title", title_) ]
          ~events:"click"
          ~on_dom_event:(fun name _ ->
            if name = "click" then open_row_sidebar row_uuid)
          [ icon_el icon_name ]
      in
      dom ~style_class:(inner_cls ())
        [ dom
            ~style_class:
              "table-block-title relative flex items-center items-center \
               w-full h-full cursor-pointer"
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then open_row_sidebar row_uuid)
            [ dom ~style_class:"flex flex-row" [ dom ~text:title [] ]
            ; dom ~style_class:"-right-1 absolute"
                [ dom ~style_class:"flex flex-row items-center"
                    [ ghost "arrow-right" I.open_
                    ; ghost "layout-sidebar-right" I.open_in_sidebar ] ]
            ]
        ]

let prop_cell ~blk (c : V.column) : t =
  match cell_value blk c with
  | W.Map _ as v when Wr.ref_uuid v <> None ->
      let t_ = Option.value (Wr.ref_title v) ~default:"" in
      let href = Option.value (Wr.ref_uuid v) ~default:t_ in
      dom ~style_class:(inner_cls ())
        [ dom ~tag:"a" ~style_class:"page-ref"
            ~attrs:[ ("href", "#/page/" ^ href) ] ~text:t_ [] ]
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
                 a.relative.tag[data-ref][data-uuid][draggable] > span *)
              let attrs =
                ("data-ref", String.lowercase_ascii t_)
                :: (match Wr.ref_uuid x with
                    | Some u -> [ ("data-uuid", u) ]
                    | None -> [])
                @ [ ("draggable", "true"); ("tabindex", "0") ]
              in
              [ dom ~style_class:"select-item cursor-pointer"
                  [ dom ~tag:"a" ~style_class:"relative tag" ~attrs
                      [ dom ~tag:"span" ~text:("#" ^ t_) [] ] ] ]
            else
              (if i > 0
               then
                 [ dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", ",") ] [] ]
               else [])
              @ [ dom
                    [ dom ~tag:"a" ~style_class:"page-ref"
                        ~attrs:
                          [ ( "href"
                            , "#/page/"
                              ^ Option.value (Wr.ref_uuid x) ~default:t_ )
                          ]
                        ~text:t_ [] ] ])
             items)
      in
      dom ~style_class:(inner_cls ())
        [ dom ~style_class:"property-value-inner w-full"
            [ dom
                ~style_class:
                  "flex flex-1 flex-row flex-wrap gap-1 items-center \
                   jtrigger min-w-0 multi-values"
                item_els ] ]
  | W.Bool b when c.V.c_type = "checkbox" ->
      dom ~style_class:(inner_cls ())
        [ dom ~tag:"input"
            ~attrs:
              ([ ("type", "checkbox"); ("disabled", "true") ]
               @ if b then [ ("checked", "checked") ] else [])
            [] ]
  | v ->
      dom ~style_class:(inner_cls ())
        [ dom ~text:(fmt_cell_value c v) [] ]

(* cljs title attr on cells = the string cell value only — numeric and
   datetime cells render none *)
let cell_title blk (c : V.column) =
  match c.V.c_id with
  | "select" | "id" -> None
  | _ -> (
      match cell_value blk c with
      | W.Int _ | W.Int64 _ | W.Date_ms _ -> None
      | v -> (
          match fmt_cell_value c v with
          | "" -> None
          | t -> Some t))

let cell_el inst ~row_uuid ~blk (c : V.column) : t =
  let title_attr =
    match cell_title blk c with Some t -> [ ("title", t) ] | None -> []
  in
  dom ~style_class:"ls-table-cell flex relative h-full"
    ~attrs:([ ("style", size_style c); ("tabindex", "0") ] @ title_attr)
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

(* cljs header-checkbox: opacity-100 while hovered or any selection *)
let header_select_cell inst : t =
 fun ctx parent ->
  let hover = Signal.state ctx.Lui_ui.ui_scheduler false in
  let shown (s : V.vstate) = not (V.Sset.is_empty s.V.selected) in
  dom ~tag:"label"
    ~style_class:"h-8 w-8 flex items-center justify-center cursor-pointer"
    ~attrs:[ ("for", "header-checkbox") ]
    ~events:"mouseover mouseout"
    ~on_dom_event:(fun name _ ->
      Runtime.signal_set hover (name = "mouseover"))
    [ checkbox_el inst ~jtrigger:false ~id:"header-checkbox" ~hover ~shown
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
              }))
    ; checkbox_hidden_input ]
    ctx parent

(* cljs header-cp: text-variant button holding the title span and a sort
   arrow for the active sort column *)
let header_button inst (c : V.column) : t =
  dom ~tag:"button"
    ~style_class:
      (E.button_cls ~variant:"text"
         ~cls:
           "inline-flex items-center h-8 !pl-2 !px-2 !py-0 \
            hover:text-foreground w-full justify-start"
         ())
    ~attrs:[ ("type", "button") ]
    [ dom ~tag:"span"
        ~style_class:"max-w-full overflow-hidden text-ellipsis"
        ~attrs:[ ("title", c.V.c_name) ] ~text:c.V.c_name []
    ; (let sort_sig =
         Signal.map
           (fun (s : V.vstate) ->
             List.find_opt (fun x -> x.V.s_id = c.V.c_id) s.V.sorting)
           inst.V.st.Signal.state_signal
       in
       if_ ~test:(Signal.map (fun o -> o <> None) sort_sig)
         (icon_dyn
            (Signal.map
               (fun o ->
                 match o with
                 | Some x when x.V.s_asc -> "arrow-up"
                 | _ -> "arrow-down")
               sort_sig))) ]

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
      dom ~style_class:cls ~attrs:[ ("style", size_style c) ]
        [ header_select_cell inst ]
  | _ -> (
      let menu () =
        match Ed.get_element_by_id (header_cell_id inst c) with
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
      dom ~style_class:cls ~id:(header_cell_id inst c)
        ~attrs:[ ("style", size_style c) ]
        ~events:"click"
        ~on_dom_event:(fun name _ -> if name = "click" then menu ())
        [ header_button inst c
        ; dom ~tag:"a" ~style_class:"ls-table-resize-handle" [] ])

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
    (dom ~style_class:"table-action-bar absolute top-0 left-8"
       [ dom
           ~style_class:
             "ls-table-actions flex flex-row items-center gap-1 bg-gray-01"
           ~attrs:[ ("style", "z-index:101") ]
           [ dom ~style_class:"selection-count px-2"
               ~text_signal:
                 (D.reactive_text
                    (fun (s : V.vstate) ->
                      I.selected_count (V.Sset.cardinal s.V.selected))
                    isig)
               []
           ; dom ~tag:"button"
               ~style_class:
                 "inline-flex items-center justify-center whitespace-nowrap \
                  rounded-md text-sm font-medium transition-colors h-8 w-8"
               ~events:"click"
               ~on_dom_event:(fun name _ ->
                 if name = "click" then delete_selected inst ())
               [ icon_el "trash" ]
           ]
       ])

(* ---------- table ---------- *)

(* dnd-kit mounts these a11y nodes inside each DndContext; cljs hides
   both inline (the described node is display:none, the live region a
   clipped 1px fixed box) *)
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

let row_el inst (cols : V.column list) ~row_uuid ~blk : t =
  let data_id =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  let cell_wrap c = dom ~style_class:"h-full" [ cell_el inst ~row_uuid ~blk c ] in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  dom
    ~style_class:
      "ls-table-row ls-block flex flex-row items-center border-b \
       transition-colors hover:bg-muted/50 \
       data-[state=selected]:bg-muted bg-gray-01 items-stretch"
    ~attrs:
      [ ("data-id", data_id); ("blockid", row_uuid); ("tabIndex", "0") ]
    [ (* cljs: .sticky-columns holds pinned cells, sibling .flex.flex-row
         holds the unpinned ones — each cell wrapped in .h-full *)
      dom ~style_class:"flex flex-row sticky-columns"
        (List.map cell_wrap pinned)
    ; dom ~style_class:"flex flex-row"
        (List.map cell_wrap free
         @ (match show_add_property inst with
            | Some _ ->
                [ dom ~style_class:"h-full"
                    [ dom ~style_class:"ls-table-cell flex relative h-full"
                        [ dom
                            ~style_class:
                              "align-middle flex items-center \
                               overflow-x-clip w-full"
                            [] ] ] ]
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
        dom [ row_el inst cols ~row_uuid:u ~blk ])
      ctx parent

(* the header — one static mount per body snapshot; sort arrow is a
   reactive prop off the inst signal *)
let table_header inst cols : t =
  let cell_item c =
    let cell = header_cell inst c in
    if c.V.c_id = "select" then dom ~id:"Select" [ cell ]
    else dom ~attrs:[ ("role", "button") ] [ cell ]
  in
  let pinned, free =
    List.partition (fun c -> is_pinned (V.get inst) c) cols
  in
  dom ~style_class:"ls-table-header border-y transition-colors bg-gray-01"
    ~attrs:[ ("style", "z-index:9") ]
    [ dom ~style_class:"flex flex-row sticky-columns"
        (List.map cell_item pinned @ [ dnd_described "0"; dnd_live "0" ])
    ; dom ~style_class:"flex flex-row"
        (List.map cell_item free
         @ (match show_add_property inst with
            | Some p ->
                (* cljs add-property-button: trailing "New property"
                   header cell on class-objects tables only *)
                [ dom ~id:"add property"
                    [ dom ~style_class:"ls-table-header-cell !border-0"
                        [ dom ~tag:"button"
                            ~style_class:
                              (E.button_cls ~variant:"text"
                                 ~cls:
                                   "h-8 !pl-2 !px-2 !py-0 \
                                    hover:text-foreground w-full \
                                    justify-start"
                                 ())
                            ~attrs:[ ("type", "button") ]
                            ~events:"click"
                            ~on_dom_event:(fun name _ ->
                              if name = "click" then
                                match p.Model.page_uuid with
                                | Some uuid -> (
                                    match
                                      Ed.get_element_by_id "add property"
                                    with
                                    | Some cell ->
                                        let r = E.el_rect cell in
                                        Properties_dialog.open_dialog
                                          ~anchor:
                                            ( E.rect_left r
                                            , E.rect_bottom r +. 4. )
                                          { Properties_dialog.uuid
                                          ; uuids = []
                                          ; db_id = p.Model.page_db_id
                                          ; is_tag = true
                                          ; title = p.Model.page_title
                                          }
                                    | None -> ())
                                | None -> ())
                            [ icon_el "plus"
                            ; dom ~tag:"raw-text"
                                ~attrs:[ ("data-raw-text", I.new_property) ]
                                [] ] ] ] ]
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
    dom ~style_class:"ls-table-footer fade-in faster"
      [ dom
          ~style_class:
            "py-1 px-2 cursor-pointer flex flex-row items-center gap-1 \
             text-muted-foreground hover:text-foreground w-full text-sm \
             border-b"
          ~events:"click"
          ~on_dom_event:(fun name _ ->
            if name = "click" then (V.ops ()).V.o_add_object inst)
          [ icon_el "plus"; dom ~text:I.new_ [] ] ]
  else D.nothing

(* cljs: shui/table > .ls-table-rows.content.overflow-x-auto
   .force-visible-scrollbar > .relative > [header; body rows] *)
let table_el inst (s : V.vstate) : t =
  let cols = visible_columns s in
  dom ~style_class:"ls-table w-full caption-bottom text-sm table-fixed"
    [ dom
        ~style_class:
          "ls-table-rows content overflow-x-auto force-visible-scrollbar"
        [ dom ~style_class:"relative"
            [ table_header inst cols
            ; (* cljs Virtuoso mounts the rows under
                 [data-testid=virtuoso-item-list] inside two bare wrapper
                 divs; each row sits in a bare item div *)
              dom
                [ dom
                    [ dom ~attrs:[ ("data-testid", "virtuoso-item-list") ]
                        [ row_stream inst cols (all_row_uuids s) ] ] ]
            ; add_row_footer inst ] ] ]

(* cljs renders a full inner view-table per group — its own column
   header row (no action bar) plus the group's rows *)
let grouped_table inst ~rows : t =
 fun ctx parent ->
  let s = V.get inst in
  let cols = visible_columns s in
  dom ~style_class:"ls-table w-full caption-bottom text-sm table-fixed"
    [ dom
        ~style_class:
          "ls-table-rows content overflow-x-auto force-visible-scrollbar"
        [ dom ~style_class:"relative"
            [ table_header inst cols
            ; dom
                ~attrs:[ ("data-testid", "virtuoso-item-list") ]
                [ row_stream inst cols rows ]
            ]
        ]
    ]
    ctx parent

(* ---------- list + gallery ---------- *)

let list_row_el ~row_uuid ~title : t =
  dom ~style_class:"ls-block"
    ~attrs:[ ("blockid", row_uuid); ("id", "ls-block-" ^ row_uuid) ]
    [ dom ~style_class:"block-main-container flex flex-row gap-1"
        [ dom ~style_class:"block-content inline"
            ~attrs:[ ("blockid", row_uuid) ]
            [ dom ~tag:"span" ~style_class:"block-title-wrap" ~text:title []
            ] ] ]

let row_title s u =
  match Hashtbl.find_opt s.V.blocks u with
  | Some b -> (
      match W.get b "block/title" with
      | Some t_ -> Wr.prop_text t_
      | None -> "")
  | None -> ""

let gallery_card_el ~title : t = dom ~style_class:"ls-card-item" ~text:title []

(* ---------- foldable groups ---------- *)

(* cljs svg/caret-right inside .rotating-arrow *)
let caret_svg =
  "<svg class=\"h-4 w-4\" aria-hidden=\"true\" version=\"1.1\" \
   viewBox=\"0 0 192 512\" fill=\"currentColor\" display=\"inline-block\" \
   style=\"margin-left: 2px\"><path d=\"M0 384.662V127.338c0-17.818 \
   21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 \
   28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z\" \
   fill-rule=\"evenodd\"/></svg>"

(* cljs ui/foldable: .flex.flex-col > (.ls-foldable-title.content +
   .ls-foldable-content > .ls-foldable-content-inner). The caret toggles
   control-show only while the title is hovered (or while collapsed). *)
let foldable inst ~key ~title ~(body : t) : t =
 fun ctx parent ->
  let hover = Signal.state ctx.Lui_ui.ui_scheduler false in
  let collapsed_sig =
    Signal.map
      (fun (s : V.vstate) -> V.Sset.mem key s.V.collapsed_groups)
      inst.V.st.Signal.state_signal
  in
  dom ~style_class:"flex flex-col"
    [ dom ~style_class:"ls-foldable-title content"
        ~events:"mouseover mouseout"
        ~on_dom_event:(fun name _ ->
          Runtime.signal_set hover (name = "mouseover"))
        [ dom ~style_class:"flex-1 flex-row foldable-title"
            [ dom
                ~style_class:
                  "flex flex-row items-center ls-foldable-header gap-1"
                [ dom ~tag:"a"
                    ~style_class:
                      "ls-foldable-title-control block-control opacity-50 \
                       hover:opacity-100"
                    ~attrs:[ ("style", "width:14px;height:16px") ]
                    ~events:"pointerdown"
                    ~on_dom_event:(fun name _ ->
                      if name = "pointerdown" then
                        V.update inst (fun s ->
                            { s with
                              V.collapsed_groups =
                                (if V.Sset.mem key s.V.collapsed_groups
                                 then V.Sset.remove key s.V.collapsed_groups
                                 else V.Sset.add key s.V.collapsed_groups)
                            }))
                    [ dom ~tag:"span"
                        ~style_class_signal:
                          (Signal.map2
                             (fun c h ->
                               L.StringValue
                                 (if c || h then "control-show cursor-pointer"
                                  else "control-hide"))
                             collapsed_sig hover.Signal.state_signal)
                        [ dom ~tag:"span"
                            ~style_class_signal:
                              (D.class_signal collapsed_sig (fun c ->
                                   "rotating-arrow"
                                   ^ if c then " collapsed"
                                     else " not-collapsed"))
                            ~html:caret_svg [] ] ]
                ; title ] ]
        ]
    ; dom
        ~style_class_signal:
          (D.class_signal collapsed_sig (fun c ->
               "ls-foldable-content" ^ if c then " is-collapsed" else ""))
        ~attrs_signal_v:
          (D.attrs_signal collapsed_sig (fun c ->
               [ ("aria-hidden", string_of_bool c) ]))
        [ dom ~style_class:"ls-foldable-content-inner" [ body ] ]
    ]
    ctx parent

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
               ~title:(dom ~text:(group_title s g.Wr.gv) [])
               ~body:(list_stream inst g.Wr.grows))
           gs)
  | Wr.VGroupedList gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(dom ~text:(group_title s g.Wr.glv) [])
               ~body:
                 (D.fragment
                    (List.mapi
                       (fun j (buuid, rows) ->
                         foldable inst
                           ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                           ~title:(dom ~text:(row_title s buuid) [])
                           ~body:(list_stream inst rows))
                       g.Wr.glparts)))
           gs)
  | _ -> list_stream inst (all_row_uuids s)

let render_gallery inst s : t =
  dom ~style_class:"flex flex-row flex-wrap gap-2 p-2"
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
               ~title:(dom ~text:(group_title s g.Wr.gv) [])
               ~body:(grouped_table inst ~rows:g.Wr.grows))
           gs)
  | Wr.VGroupedList gs ->
      D.fragment
        (List.mapi
           (fun i g ->
             foldable inst ~key:("g" ^ string_of_int i)
               ~title:(dom ~text:(group_title s g.Wr.glv) [])
               ~body:
                 (D.fragment
                    (List.mapi
                       (fun j (buuid, rows) ->
                         foldable inst
                           ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                           ~title:(dom ~text:(row_title s buuid) [])
                           ~body:(grouped_table inst ~rows))
                       g.Wr.glparts)))
           gs)
  | _ ->
      (* cljs view-table wraps the table in a random-uuid div *)
      dom ~id:(Platform.random_uuid ()) [ table_el inst s ]

let body_el inst (s : V.vstate) ~(filters : t) : t =
  dom ~style_class:"ls-view-body flex flex-col gap-2 grid mt-1"
    [ filters
    ; (if s.V.loading then
         dom ~style_class:"p-2 text-sm opacity-50" ~text:I.loading_ []
       else
         D.fragment
           [ (match s.V.display_type with
              | "list" -> render_list inst s
              | "gallery" -> render_gallery inst s
              | _ -> render_table inst s)
           ; (match s.V.data with
              | Wr.VFlat { rows = []; _ } ->
                  dom ~style_class:"p-2 text-sm opacity-50"
                    ~text:I.no_matched_result []
              | _ -> D.nothing)
           ])
    ]
