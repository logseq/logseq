(* Table/list/gallery body rendering for views — mirrors
   components/views.cljs + shui table/core.cljc DOM contract.
   `refresh : inst -> unit` is threaded through instead of referencing
   Views_view to keep modules acyclic. *)

module D = Views_dom
module I = I18n
module V = Views_state
module Wr = Views_wire
module W = Wire
module P = Views_popup

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
  | "id" -> 48
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
let column_of_ident (inst : V.inst) (ident : string) : V.column option =
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
      match Hashtbl.find_opt inst.V.all_props ident with
      | Some p -> column_of_property p
      | None ->
          Some (builtin_column ident (titleize_ident ident) "default" ()))

let build_columns (inst : V.inst) (properties : W.t list) : V.column list =
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
      @ (if inst.V.asset_class
         then
           [ builtin_column "file" (I18n.t "file/label") "default"
               ~disable_hide:true () ]
         else [])
      @ with_tags
      @ [ created_column; updated_column; page_column ]
  | V.KQuery _ ->
      (* cljs get-query-columns: build-columns over view-data :properties
         (idents); created/updated only when pulled for advanced queries *)
      let qcols =
        List.filter_map (column_of_ident inst) inst.V.query_idents
      in
      let tail =
        if inst.V.is_advanced then []
        else [ created_column; updated_column ]
      in
      [ select_column; title_column ] @ qcols @ tail
      @ (if inst.V.is_advanced
         then
           (if List.mem "block/created-at" inst.V.query_idents
            then [ created_column ] else [])
           @ (if List.mem "block/updated-at" inst.V.query_idents
              then [ updated_column ] else [])
         else [])

let visible_columns inst =
  let cols =
    List.filter
      (fun c ->
        c.V.c_id <> "id" && not (V.Sset.mem c.V.c_id inst.V.hidden))
      inst.V.columns
  in
  match inst.V.ordered with
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
  | W.Int ms -> if c.V.c_type = "datetime" then fmt_date (float_of_int ms) else Wr.prop_text v
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

let checkbox_btn ~jtrigger ~checked ~id ~aria_label ~on_toggle : D.el =
  let btn =
    D.h ~tag:"button" ~cls:(checkbox_cls ~jtrigger checked)
      ~attrs:
        [ ("type", "button"); ("tabindex", "0"); ("role", "checkbox")
        ; ("id", id); ("aria-label", aria_label)
        ; ("aria-checked", if checked then "true" else "false") ]
      ()
  in
  if checked then D.el_set_attr btn "data-checked" ""
  else D.el_set_attr btn "data-unchecked" "";
  D.el_add_listener btn "click" (fun ev ->
      Editor_dom.stop_propagation ev;
      let on = not checked in
      D.el_set_attr btn "aria-checked" (if on then "true" else "false");
      if on then begin
        D.el_set_attr btn "data-checked" "";
        D.el_remove_attr btn "data-unchecked"
      end
      else begin
        D.el_set_attr btn "data-unchecked" "";
        D.el_remove_attr btn "data-checked"
      end;
      on_toggle on);
  btn

(* cljs mounts a visually-hidden native input sibling inside the label
   (1px clipped fixed box); a normal checkbox would overlap the button
   and swallow its clicks *)
let checkbox_hidden_input () : D.el =
  D.h ~tag:"input"
    ~attrs:
      [ ("tabindex", "-1"); ("aria-hidden", "true"); ("type", "checkbox")
      ; ( "style"
        , "clip-path: inset(50%); overflow: hidden; white-space: nowrap; \
           border: 0px; padding: 0px; width: 1px; height: 1px; margin: \
           -1px; position: fixed; top: 0px; left: 0px;" ) ]
    ()

(* cljs row-checkbox: label.jtrigger > shui checkbox; opacity flips on
   hover of the label *)
let select_cell inst ~refresh ~row_uuid ~blk : D.el =
  let inner = D.h ~cls:(inner_cls ~select:true ()) () in
  let dbid =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  let checked () = V.Sset.mem row_uuid inst.V.selected in
  let cb =
    checkbox_btn ~jtrigger:true ~checked:(checked ())
      ~id:(dbid ^ "-checkbox") ~aria_label:I.select_row
      ~on_toggle:(fun on ->
        inst.V.selected <-
          (if on then V.Sset.add row_uuid inst.V.selected
           else V.Sset.remove row_uuid inst.V.selected);
        refresh inst)
  in
  let label =
    D.h ~tag:"label"
      ~cls:" jtrigger h-8 w-8 flex items-center justify-center cursor-pointer"
      ~attrs:
        [ ("for", dbid ^ "-checkbox"); ("data-table-row-select", "true") ]
      ~children:[ cb; checkbox_hidden_input () ] ()
  in
  D.el_add_listener label "mouseover" (fun _ ->
      Editor_dom.el_set_class cb (checkbox_cls ~jtrigger:true true));
  D.el_add_listener label "mouseout" (fun _ ->
      Editor_dom.el_set_class cb (checkbox_cls ~jtrigger:true (checked ())));
  D.el_append_child inner label;
  inner

let title_cell inst ~row_uuid ~blk (c : V.column) : D.el =
  let inner = D.h ~cls:(inner_cls ()) () in
  let title = Wr.prop_text (cell_value blk c) in
  (match inst.V.kind, W.get blk "block/name" with
   | V.KAllPages, Some (W.String name) ->
       (* cljs page-title-cell: div.flex.h-full.min-w-0.items-center >
          a.page-ref.truncate; href prefers block/uuid *)
       let page_name =
         if row_uuid <> "" then row_uuid
         else if name <> "" then name
         else title
       in
       D.el_append_child inner
         (D.h ~cls:"flex h-full min-w-0 items-center"
            ~children:
              [ D.h ~tag:"a" ~cls:"page-ref truncate"
                  ~attrs:
                    [ ("href", "#/page/" ^ page_name); ("title", title) ]
                  ~text:title ()
              ]
            ())
   | _ ->
       (* cljs table-block-title: flex row of text + hover "Open" ghost
          button (.-right-1.absolute) that opens the row in the sidebar *)
       let open_sidebar () =
         Platform.dispatch "ls:open-right-sidebar"
           (Js.Json.object_
              (Js.Dict.fromList [ ("uuid", Js.Json.string row_uuid) ]))
       in
       let open_btn_cls =
         D.button_cls ~variant:"ghost"
           ~cls:
             "!p-1 w-6 h-6 bg-gray-01 opacity-0 transition-opacity \
              duration-100 ease-in text-muted-foreground"
           ()
       in
       let open_btn =
         D.h ~tag:"button" ~cls:open_btn_cls
           ~attrs:[ ("type", "button"); ("title", I.open_) ]
           ~children:[ D.icon "arrow-right" ] ()
       in
       D.el_add_listener open_btn "click" (fun ev ->
           Editor_dom.stop_propagation ev;
           open_sidebar ());
       let sidebar_btn =
         D.h ~tag:"button" ~cls:open_btn_cls
           ~attrs:[ ("type", "button"); ("title", I.open_in_sidebar) ]
           ~children:[ D.icon "layout-sidebar-right" ] ()
       in
       D.el_add_listener sidebar_btn "click" (fun ev ->
           Editor_dom.stop_propagation ev;
           open_sidebar ());
       let div =
         D.h
           ~cls:
             "table-block-title relative flex items-center items-center \
              w-full h-full cursor-pointer"
           ~children:
             [ D.h ~cls:"flex flex-row" ~children:[ D.h ~text:title () ] ()
             ; D.h ~cls:"-right-1 absolute"
                 ~children:
                   [ D.h ~cls:"flex flex-row items-center"
                       ~children:[ open_btn; sidebar_btn ] () ]
                 () ]
           ()
       in
       D.el_add_listener div "click" (fun ev ->
           Editor_dom.stop_propagation ev;
           open_sidebar ());
       D.el_append_child inner div);
  inner

let prop_cell ~blk (c : V.column) : D.el =
  let inner = D.h ~cls:(inner_cls ()) () in
  (match cell_value blk c with
   | W.Map _ as v when Wr.ref_uuid v <> None ->
       let t = Option.value (Wr.ref_title v) ~default:"" in
       let href = Option.value (Wr.ref_uuid v) ~default:t in
       D.el_append_child inner
         (D.h ~tag:"a" ~cls:"page-ref" ~attrs:[ ("href", "#/page/" ^ href) ]
            ~text:t ())
   | W.Array xs when c.V.c_many ->
       (* cljs pv: .property-value-inner > .multi-values > select-items;
          the implicit Page class is hidden *)
       let box =
         D.h
           ~cls:
             "flex flex-1 flex-row flex-wrap gap-1 items-center jtrigger \
              min-w-0 multi-values"
           ()
       in
       let pv =
         D.h ~cls:"property-value-inner w-full" ~children:[ box ] ()
       in
       let items =
         List.filter
           (fun x ->
             Wr.prop_text x <> ""
             && (c.V.c_id <> "block/tags"
                 || Wr.ident_of_value x <> Some "logseq.class/Page"))
           xs
       in
       List.iteri
         (fun i x ->
           let t = Wr.prop_text x in
           if c.V.c_id = "block/tags" then begin
             (* cljs select-item -> page-cp {:tag?} ->
                a.relative.tag[data-ref][data-uuid][draggable] > span *)
             let attrs =
               ("data-ref", String.lowercase_ascii t)
               :: (match Wr.ref_uuid x with
                   | Some u -> [ ("data-uuid", u) ]
                   | None -> [])
               @ [ ("draggable", "true"); ("tabindex", "0") ]
             in
             D.el_append_child box
               (D.h ~cls:"select-item cursor-pointer"
                  ~children:
                    [ D.h ~tag:"a" ~cls:"relative tag" ~attrs
                        ~children:
                          [ D.h ~tag:"span" ~text:("#" ^ t) () ]
                        () ]
                  ())
           end
           else begin
             if i > 0 then
               D.el_append_child box (Editor_dom.create_text_node ",");
             let href = Option.value (Wr.ref_uuid x) ~default:t in
             D.el_append_child box
               (D.h
                  ~children:
                    [ D.h ~tag:"a" ~cls:"page-ref"
                        ~attrs:[ ("href", "#/page/" ^ href) ] ~text:t ()
                    ]
                  ())
           end)
         items;
       D.el_append_child inner pv
   | W.Bool b when c.V.c_type = "checkbox" ->
       let cb = D.h ~tag:"input" ~attrs:[ ("type", "checkbox") ] () in
       D.el_set_checked cb b;
       D.el_set_attr cb "disabled" "true";
       D.el_append_child inner cb
   | v ->
       D.el_append_child inner
         (Editor_dom.create_text_node (fmt_cell_value c v)));
  inner

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


let cell_el inst ~refresh ~row_uuid ~blk ~idx (c : V.column) : D.el =
  let title_attr =
    match cell_title blk c with Some t -> [ ("title", t) ] | None -> []
  in
  let cell =
    D.h ~cls:"ls-table-cell flex relative h-full"
      ~attrs:
        ([ ("style", size_style c); ("tabindex", "0") ] @ title_attr)
      ()
  in

  (match c.V.c_id with
   | "select" -> D.el_append_child cell (select_cell inst ~refresh ~row_uuid ~blk)
   | "id" ->
       let inner = D.h ~cls:(inner_cls ()) () in
       D.el_append_child inner
         (D.h ~tag:"label" ~cls:"flex items-center" ~text:(string_of_int idx)
            ());
       D.el_append_child cell inner
   | "block/title" ->
       D.el_append_child cell (title_cell inst ~row_uuid ~blk c)
   | "file" -> D.el_append_child cell (Asset_dom.file_cell blk)
   | _ -> D.el_append_child cell (prop_cell ~blk c));
  cell

(* ---------- header ---------- *)

let all_row_uuids inst =
  match inst.V.data with
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
let header_select_cell inst ~refresh cell =
  let checked () = not (V.Sset.is_empty inst.V.selected) in
  let cb =
    checkbox_btn ~jtrigger:false ~checked:(checked ()) ~id:"header-checkbox"
      ~aria_label:I.select_all
      ~on_toggle:(fun on ->
        inst.V.selected <-
          (if on then
             List.fold_left
               (fun s u -> V.Sset.add u s)
               inst.V.selected (all_row_uuids inst)
           else V.Sset.empty);
        refresh inst)
  in
  let label =
    D.h ~tag:"label"
      ~cls:"h-8 w-8 flex items-center justify-center cursor-pointer"
      ~attrs:[ ("for", "header-checkbox") ]
      ~children:[ cb; checkbox_hidden_input () ] ()
  in
  D.el_add_listener label "mouseover" (fun _ ->
      Editor_dom.el_set_class cb (checkbox_cls ~jtrigger:false true));
  D.el_add_listener label "mouseout" (fun _ ->
      Editor_dom.el_set_class cb (checkbox_cls ~jtrigger:false (checked ())));
  D.el_append_child cell label

(* cljs header-cp: text-variant button holding the title span and a sort
   arrow for the active sort column *)
let header_button inst (c : V.column) : D.el =
  let sort =
    List.find_opt (fun s -> s.V.s_id = c.V.c_id) inst.V.sorting
  in
  let arrow =
    match sort with
    | Some s -> Some (D.icon (if s.V.s_asc then "arrow-up" else "arrow-down"))
    | None -> None
  in
  let children =
    D.h ~tag:"span" ~cls:"max-w-full overflow-hidden text-ellipsis"
      ~attrs:[ ("title", c.V.c_name) ] ~text:c.V.c_name ()
    :: (match arrow with Some a -> [ a ] | None -> [])
  in
  D.h ~tag:"button"
    ~cls:
      (D.button_cls ~variant:"text"
         ~cls:"h-8 !pl-2 !px-2 !py-0 hover:text-foreground w-full \
               justify-start"
         ())
    ~attrs:[ ("type", "button") ]
    ~children ()

let set_column_sort inst ~refresh (c : V.column) asc =
  inst.V.sorting <- [ { V.s_id = c.V.c_id; s_asc = asc } ];
  V.persist_sorting inst;
  refresh inst

let sort_menu_items inst ~refresh (c : V.column) =
  [ P.MItem
      (I.sort_ascending, fun () -> set_column_sort inst ~refresh c true)
  ; P.MItem
      (I.sort_descending, fun () -> set_column_sort inst ~refresh c false)
  ]

(* sort options as dropdown menuitems — cljs prepends them as
   more-options before the property configure list, with arrow icons *)
let sort_menuitem_els inst ~refresh (c : V.column) =
  List.map
    (fun (label, asc) ->
      Properties_menu.menuitem
        ~icon:(if asc then "arrow-up" else "arrow-down")
        label (fun () ->
          Properties_state.close_overlays ();
          set_column_sort inst ~refresh c asc))
    [ (I.sort_ascending, true); (I.sort_descending, false) ]

let pinned_columns_ident = "logseq.property.table/pinned-columns"

(* cljs pinned-properties: :select and :id are always prepended; the
   rest are the view entity's pinned-columns property idents *)
let is_pinned inst (c : V.column) =
  c.V.c_id = "select" || c.V.c_id = "id"
  || V.Sset.mem c.V.c_id inst.V.pinned

(* cljs header-cp pin option: toggles membership in the view entity's
   pinned-columns (values are property db/ids) *)
let toggle_pin inst ~refresh (c : V.column) (p : W.t) =
  match Properties_data.entity_id_of p with
  | Some pid ->
      if V.Sset.mem c.V.c_id inst.V.pinned then begin
        inst.V.pinned <- V.Sset.remove c.V.c_id inst.V.pinned;
        Properties_data.delete_property_value ~block_uuid:inst.V.view_uuid
          ~ident:pinned_columns_ident ~value:(W.Int pid)
        |> ignore
      end
      else begin
        inst.V.pinned <- V.Sset.add c.V.c_id inst.V.pinned;
        Properties_data.set_block_property ~block_uuid:inst.V.view_uuid
          ~ident:pinned_columns_ident ~value:(W.Int pid)
        |> ignore
      end;
      refresh inst
  | None -> ()

(* cljs table-options trailing the property dropdown: sort items (when
   sortable) then Pin/Unpin (when the property has a db/id) *)
let column_menuitem_els inst ~refresh (c : V.column) (p : W.t) =
  let sort = if sortable c then sort_menuitem_els inst ~refresh c else [] in
  let pin =
    match Properties_data.entity_id_of p with
    | Some _ ->
        [ Properties_menu.menuitem ~icon:"pin"
            (if V.Sset.mem c.V.c_id inst.V.pinned then I.unpin else I.pin)
            (fun () ->
              Properties_state.close_overlays ();
              toggle_pin inst ~refresh c p) ]
    | None -> []
  in
  sort @ pin

(* cljs header-cp: property columns open one .ls-property-dropdown —
   sort more-options first, then the configure list, no title *)
let open_property_menu inst ~refresh ~anchor (c : V.column) (p : W.t) =
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
    ~more_options:(column_menuitem_els inst ~refresh c p)
    ~with_title:false
    (W.Map
       [ (W.Keyword "property", p)
       ; (W.Keyword "property-id", W.Keyword c.V.c_id) ])

let header_cell inst ~refresh (c : V.column) : D.el =
  let cell =
    D.h
      ~cls:
        ("ls-table-header-cell"
         ^ if c.V.c_id = "select" then " !border-0" else "")
      ~attrs:[ ("style", size_style c) ] ()

  in
  (match c.V.c_id with
   | "select" -> header_select_cell inst ~refresh cell
   | "id" ->
       D.el_append_child cell
         (D.h ~tag:"label"
            ~cls:"h-8 w-6 flex items-center justify-center"
            ~attrs:[ ("for", "header-index"); ("title", I.row_number) ]
            ~text:"#" ())
   | _ ->
       D.el_append_child cell (header_button inst c);
       (match c.V.c_prop, sortable c with
        | Some p, _ ->
            D.el_add_listener cell "click" (fun _ ->
                open_property_menu inst ~refresh ~anchor:cell c p)
        | None, true ->
            (* built-in columns get only the sort options, still inside
               .ls-property-dropdown *)
            D.el_add_listener cell "click" (fun _ ->
                ignore
                  (P.show_menu ~anchor:cell
                     ~cls_prefix:"ls-property-dropdown "
                     (sort_menu_items inst ~refresh c)))
        | None, false -> ()));
  cell

(* ---------- action bar ---------- *)

let page_row_uuids inst =
  List.filter
    (fun u ->
      match Hashtbl.find_opt inst.V.blocks u with
      | Some blk -> is_page_row blk
      | None -> inst.V.feature = "all-pages")
    (V.Sset.elements inst.V.selected)

let delete_selected inst ~refresh () =
  let sel = V.Sset.elements inst.V.selected in
  if sel <> [] then begin
    let pages = page_row_uuids inst in
    let blocks = List.filter (fun u -> not (List.mem u pages)) sel in
    let do_delete () =
      Views_db.delete_blocks blocks (fun () ->
          List.iter (fun p -> Views_db.delete_page p (fun () -> ())) pages;
          inst.V.selected <- V.Sset.empty;
          refresh inst)
    in
    let need_confirm =
      pages <> [] && List.mem inst.V.feature [ "all-pages"; "query-result" ]
    in
    if need_confirm then
      let names =
        List.filter_map
          (fun u ->
            match Hashtbl.find_opt inst.V.blocks u with
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
             [ D.h ~tag:"ol" ~cls:"p-2 pt-4"
                 ~children:(List.map (fun n -> D.h ~tag:"li" ~text:n ()) names)
                 ()
             ; D.h ~tag:"p" ~cls:"px-2 opacity-50"
                 ~children:
                   [ D.h ~tag:"small" ~text:(I.total (List.length names)) () ]
                 ()
             ]
           ~confirm_label:I.yes ~on_confirm:do_delete ())
    else do_delete ()
  end

let action_bar inst ~refresh : D.el option =
  let n = V.Sset.cardinal inst.V.selected in
  if n = 0 then None
  else
    let bar = D.h ~cls:"table-action-bar absolute top-0 left-8" () in
    let actions =
      D.h ~cls:"ls-table-actions flex flex-row items-center gap-1 bg-gray-01"
        ~attrs:[ ("style", "z-index:101") ] ()
    in
    D.el_append_child actions
      (D.h ~cls:"selection-count px-2" ~text:(I.selected_count n) ());
    let del =
      D.h ~tag:"button"
        ~cls:
          "inline-flex items-center justify-center whitespace-nowrap \
           rounded-md text-sm font-medium transition-colors h-8 w-8"
        ~children:[ D.icon "trash" ] ()
    in
    D.el_add_listener del "click" (fun _ -> delete_selected inst ~refresh ());
    D.el_append_child actions del;
    D.el_append_child bar actions;
    Some bar

(* ---------- table ---------- *)

(* dnd-kit mounts these a11y nodes inside each DndContext; cljs hides
   both inline (the described node is display:none, the live region a
   clipped 1px fixed box) *)
let dnd_described n =
  D.h
    ~attrs:[ ("id", "DndDescribedBy-" ^ n); ("style", "display: none;") ]
    ~text:
      "To pick up a draggable item, press the space bar. While dragging, \
       use the arrow keys to move the item. Press space again to drop the \
       item in its new position, or press escape to cancel."
    ()

let dnd_live n =
  D.h
    ~attrs:
      [ ("id", "DndLiveRegion-" ^ n); ("role", "status")
      ; ("aria-live", "assertive"); ("aria-atomic", "true")
      ; ( "style"
        , "position: fixed; top: 0px; left: 0px; width: 1px; height: 1px; \
           margin: -1px; border: 0px; padding: 0px; overflow: hidden; \
           clip: rect(0px, 0px, 0px, 0px); clip-path: inset(100%); \
           white-space: nowrap;" ) ]
    ()

(* class-objects tables show the add-property column; matching rows get
   a trailing empty cell *)
let show_add_property inst =
  match inst.V.kind with
  | V.KTagPage _ -> !Runtime.current_page
  | V.KPropertyPage _ | V.KAllPages | V.KQuery _ -> None

let row_el inst ~refresh ~idx ~row_uuid (cols : V.column list) : D.el =
  let blk =
    match Hashtbl.find_opt inst.V.blocks row_uuid with
    | Some b -> b
    | None -> W.Map []
  in
  let data_id =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  let row =
    D.h ~cls:
      "ls-table-row ls-block flex flex-row items-center border-b \
       transition-colors hover:bg-muted/50 \
       data-[state=selected]:bg-muted bg-gray-01 items-stretch"
      ~attrs:
        [ ("data-id", data_id); ("blockid", row_uuid); ("tabIndex", "0") ]
      ()
  in
  (* cljs: .sticky-columns holds pinned cells, sibling .flex.flex-row
     holds the unpinned ones — each cell wrapped in .h-full *)
  let sticky = D.h ~cls:"flex flex-row sticky-columns" () in
  let row2 = D.h ~cls:"flex flex-row" () in
  List.iter
    (fun c ->
      let cell = cell_el inst ~refresh ~row_uuid ~blk ~idx c in
      let wrap = D.h ~cls:"h-full" ~children:[ cell ] () in
      if is_pinned inst c then D.el_append_child sticky wrap
      else D.el_append_child row2 wrap)
    cols;
  (match show_add_property inst with
   | Some _ ->
       D.el_append_child row2
         (D.h ~cls:"h-full"
            ~children:
              [ D.h ~cls:"ls-table-cell flex relative h-full"
                  ~children:
                    [ D.h
                        ~cls:
                          "align-middle flex items-center overflow-x-clip \
                           w-full"
                        () ]
                  () ]
            ())
   | None -> ());
  D.el_append_child row sticky;
  D.el_append_child row row2;
  row

(* cljs: shui/table > .ls-table-rows.content.overflow-x-auto
   .force-visible-scrollbar > .relative > [header; body rows] *)
let table_el inst ~refresh : D.el =
  let tbl = D.h ~cls:"ls-table w-full caption-bottom text-sm table-fixed" () in
  let cols = visible_columns inst in
  let scroller =
    D.h ~cls:"ls-table-rows content overflow-x-auto force-visible-scrollbar"
      ()
  in
  let rel = D.h ~cls:"relative" () in

  let header =
    D.h ~cls:"ls-table-header border-y transition-colors bg-gray-01"
      ~attrs:[ ("style", "z-index:9") ] ()
  in
  (* cljs header: .sticky-columns > pinned header cells (#Select > select
     cell, div[role=button] > cell for pinned props); sibling
     .flex.flex-row > unpinned (div[role=button] > cell)* > #add property] *)
  let sticky = D.h ~cls:"flex flex-row sticky-columns" () in
  let header_row = D.h ~cls:"flex flex-row" () in
  List.iter
    (fun c ->
      let cell = header_cell inst ~refresh c in
      if c.V.c_id = "select" then
        D.el_append_child sticky
          (D.h ~attrs:[ ("id", "Select") ] ~children:[ cell ] ())
      else (
        D.el_append_child cell
          (D.h ~tag:"a" ~cls:"ls-table-resize-handle" ());
        let item = D.h ~attrs:[ ("role", "button") ] ~children:[ cell ] () in
        if is_pinned inst c then D.el_append_child sticky item
        else D.el_append_child header_row item))
    cols;
  D.el_append_child sticky (dnd_described "0");
  D.el_append_child sticky (dnd_live "0");
  (* cljs add-property-button: trailing "New property" header cell on
     class-objects tables only (property-objects/all-pages set
     show-add-property? false) *)
  (match show_add_property inst with
   | Some p -> (
           let cell = D.h ~cls:"ls-table-header-cell !border-0" () in
           let btn =
             D.h ~tag:"button"
               ~cls:
                 (D.button_cls ~variant:"text"
                    ~cls:"h-8 !pl-2 !px-2 !py-0 hover:text-foreground \
                          w-full justify-start"
                    ())
               ~attrs:[ ("type", "button") ]
               ~children:[ D.icon "plus" ] ()
           in
           D.el_append_child btn
             (Editor_dom.create_text_node I.new_property);
           (match p.Model.page_uuid with
            | Some uuid ->
                D.el_add_listener btn "click" (fun _ ->
                    let r = D.el_rect cell in
                    ignore
                      (Properties_dialog.open_dialog
                         ~anchor:(D.rect_left r, D.rect_bottom r +. 4.)
                         { Properties_dialog.uuid
                         ; uuids = []
                         ; db_id = p.Model.page_db_id
                         ; is_tag = true
                         ; title = p.Model.page_title
                         }))
            | None -> ());
           D.el_append_child cell btn;
           D.el_append_child header_row
             (D.h ~attrs:[ ("id", "add property") ] ~children:[ cell ] ()))
   | None -> ());
  D.el_append_child header_row (dnd_described "1");
  D.el_append_child header_row (dnd_live "1");
  D.el_append_child header sticky;
  D.el_append_child header header_row;
  (match action_bar inst ~refresh with
   | Some bar -> D.el_append_child header bar
   | None -> ());
  D.el_append_child rel header;
  (* cljs Virtuoso mounts the rows under [data-testid=virtuoso-item-list]
     inside two bare wrapper divs; each row sits in a bare item div *)
  let vlist = D.h ~attrs:[ ("data-testid", "virtuoso-item-list") ] () in
  let uuids = Array.of_list (all_row_uuids inst) in
  if Virt_list.enabled ~virtualize:true (Array.length uuids) then
    D.el_append_child vlist
      (Views_virt.rows ~key_of:Fun.id
         ~render_el:(fun i u -> row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u cols)
         uuids)
  else
    Array.iteri
      (fun i u ->
        D.el_append_child vlist
          (D.h ~children:[ row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u cols ]
             ()))
      uuids;
  D.el_append_child rel
    (D.h ~children:[ D.h ~children:[ vlist ] () ] ());
  (* cljs add-new-row footer when data-fns has add-new-object!:
     property-objects always; class-objects only for non-private
     classes (route-info add-object?); all-pages/query never *)
  let has_add_object =
    match inst.V.kind with
    | V.KPropertyPage _ -> true
    | V.KTagPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | V.KAllPages | V.KQuery _ -> false
  in
  (match has_add_object with
   | true ->
       let footer = D.h ~cls:"ls-table-footer fade-in faster" () in
       let row =
         D.h
           ~cls:
             "py-1 px-2 cursor-pointer flex flex-row items-center gap-1 \
              text-muted-foreground hover:text-foreground w-full text-sm \
              border-b"
           ~children:[ D.icon "plus"; D.h ~text:I.new_ () ]
           ()
       in
       D.el_add_listener row "click" (fun _ ->
           (V.ops ()).V.o_add_object inst);
       D.el_append_child footer row;
       D.el_append_child rel footer
   | false -> ());
  D.el_append_child scroller rel;
  D.el_append_child tbl scroller;

  tbl

(* grouped rows render without the header (group table per cljs) *)
let grouped_table inst ~refresh ~rows () =
  let tbl = D.h ~cls:"ls-table w-full caption-bottom text-sm table-fixed" () in
  let rows_el =
    D.h
      ~cls:"ls-table-rows content overflow-x-auto force-visible-scrollbar"
      ()
  in
  let uuids = Array.of_list rows in
  let cols = visible_columns inst in
  if Virt_list.enabled ~virtualize:true (Array.length uuids) then
    D.el_append_child rows_el
      (Views_virt.rows ~key_of:Fun.id
         ~render_el:(fun i u -> row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u cols)
         uuids)
  else
    Array.iteri
      (fun i u ->
        D.el_append_child rows_el
          (row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u cols))
      uuids;
  D.el_append_child tbl rows_el;
  tbl

(* ---------- list + gallery ---------- *)

let list_row_el ~row_uuid ~title : D.el =
  D.h ~cls:"ls-block"
    ~attrs:[ ("blockid", row_uuid); ("id", "ls-block-" ^ row_uuid) ]
    ~children:
      [ D.h ~cls:"block-main-container flex flex-row gap-1"
          ~children:
            [ D.h ~cls:"block-content inline" ~attrs:[ ("blockid", row_uuid) ]
                ~children:
                  [ D.h ~tag:"span" ~cls:"block-title-wrap" ~text:title () ]
                ()
            ]
          ()
      ]
    ()

let row_title inst u =
  match Hashtbl.find_opt inst.V.blocks u with
  | Some b -> (
      match W.get b "block/title" with
      | Some t -> Wr.prop_text t
      | None -> "")
  | None -> ""

let gallery_card_el ~title : D.el = D.h ~cls:"ls-card-item" ~text:title ()

(* ---------- foldable groups ---------- *)

(* cljs svg/caret-right inside .rotating-arrow *)
let caret_arrow ~collapsed : D.el =
  let arrow =
    D.h ~tag:"span"
      ~cls:("rotating-arrow" ^ if collapsed then " collapsed" else " not-collapsed")
      ()
  in
  D.el_inner_html_set arrow
    "<svg class=\"h-4 w-4\" aria-hidden=\"true\" version=\"1.1\" \
     viewBox=\"0 0 192 512\" fill=\"currentColor\" \
     display=\"inline-block\" style=\"margin-left: \
     2px\"><path d=\"M0 384.662V127.338c0-17.818 21.543-26.741 \
     34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 \
     28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z\" \
     fill-rule=\"evenodd\"/></svg>";
  arrow

(* cljs ui/foldable: .flex.flex-col > (.ls-foldable-title.content +
   .ls-foldable-content > .ls-foldable-content-inner). The caret toggles
   control-show only while the title is hovered (or while collapsed). *)
let foldable inst ~refresh ~key ~title_el ~(body : unit -> D.el) : D.el =
  let collapsed = V.Sset.mem key inst.V.collapsed_groups in
  let ctrl_wrap =
    D.h ~tag:"span"
      ~cls:(if collapsed then "control-show cursor-pointer" else "control-hide")
      ~children:[ caret_arrow ~collapsed ] ()
  in
  let ctrl =
    D.h ~tag:"a"
      ~cls:"ls-foldable-title-control block-control opacity-50 hover:opacity-100"
      ~attrs:[ ("style", "width:14px;height:16px") ]
      ~children:[ ctrl_wrap ] ()
  in
  D.el_add_listener ctrl "pointerdown" (fun ev ->
      Editor_dom.stop_propagation ev;
      if collapsed then
        inst.V.collapsed_groups <- V.Sset.remove key inst.V.collapsed_groups
      else
        inst.V.collapsed_groups <- V.Sset.add key inst.V.collapsed_groups;
      refresh inst);
  let fold_title =
    D.h ~cls:"flex-1 flex-row foldable-title"
      ~children:
        [ D.h ~cls:"flex flex-row items-center ls-foldable-header gap-1"
            ~children:[ ctrl; title_el ] () ]
      ()
  in
  D.el_add_listener fold_title "mouseover" (fun _ ->
      if not collapsed then begin
        D.el_class_remove ctrl_wrap "control-hide";
        D.el_class_add ctrl_wrap "control-show";
        D.el_class_add ctrl_wrap "cursor-pointer"
      end);
  D.el_add_listener fold_title "mouseout" (fun _ ->
      if not collapsed then begin
        D.el_class_remove ctrl_wrap "control-show";
        D.el_class_remove ctrl_wrap "cursor-pointer";
        D.el_class_add ctrl_wrap "control-hide"
      end);
  let title =
    D.h ~cls:"ls-foldable-title content" ~children:[ fold_title ] ()
  in
  let content =
    D.h
      ~cls:("ls-foldable-content" ^ if collapsed then " is-collapsed" else "")
      ~attrs:[ ("aria-hidden", string_of_bool collapsed) ]
      ~children:[ D.h ~cls:"ls-foldable-content-inner" ~children:[ body () ] () ]
      ()
  in
  D.h ~cls:"flex flex-col" ~children:[ title; content ] ()

let group_title inst gv =
  match gv with
  | W.Map _ -> (
      match Wr.ref_title gv with
      | Some t when t <> "" -> t
      | _ -> I.no_group_value (Option.value inst.V.group_by ~default:""))
  | W.Nil ->
      if inst.V.group_by = Some "block/page" then I.pages
      else I.no_group_value (Option.value inst.V.group_by ~default:"")
  | v -> Wr.prop_text v

(* ---------- body dispatch ---------- *)

let mount_list_rows inst (w : D.el) (rows : string list) =
  let data = Array.of_list rows in
  let render _i u = list_row_el ~row_uuid:u ~title:(row_title inst u) in
  if Virt_list.enabled ~virtualize:true (Array.length data) then
    D.el_append_child w (Views_virt.rows ~key_of:Fun.id ~render_el:render data)
  else Array.iter (fun u -> D.el_append_child w (render 0 u)) data

let render_list inst ~refresh body =
  match inst.V.data with
  | Wr.VGrouped gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_el:(D.h ~text:(group_title inst g.Wr.gv) ())
               ~body:(fun () ->
                 let w = D.h () in
                 mount_list_rows inst w g.Wr.grows;
                 w)))
        gs
  | Wr.VGroupedList gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_el:(D.h ~text:(group_title inst g.Wr.glv) ())
               ~body:(fun () ->
                 let w = D.h () in
                 List.iteri
                   (fun j (buuid, rows) ->
                     D.el_append_child w
                       (foldable inst ~refresh
                          ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                          ~title_el:(D.h ~text:(row_title inst buuid) ())
                          ~body:(fun () ->
                            let w2 = D.h () in
                            mount_list_rows inst w2 rows;
                            w2)))
                   g.Wr.glparts;
                 w)))
        gs
  | _ -> mount_list_rows inst body (all_row_uuids inst)

let render_gallery inst body =
  let wrap = D.h ~cls:"flex flex-row flex-wrap gap-2 p-2" () in
  List.iter
    (fun u ->
      D.el_append_child wrap (gallery_card_el ~title:(row_title inst u)))
    (all_row_uuids inst);
  D.el_append_child body wrap

let render_table inst ~refresh body =
  match inst.V.data with
  | Wr.VGrouped gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_el:(D.h ~text:(group_title inst g.Wr.gv) ())
               ~body:(grouped_table inst ~refresh ~rows:g.Wr.grows)))
        gs
  | Wr.VGroupedList gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_el:(D.h ~text:(group_title inst g.Wr.glv) ())
               ~body:(fun () ->
                 let w = D.h () in
                 List.iteri
                   (fun j (buuid, rows) ->
                     D.el_append_child w
                       (foldable inst ~refresh
                          ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                          ~title_el:(D.h ~text:(row_title inst buuid) ())
                          ~body:(grouped_table inst ~refresh ~rows)))
                   g.Wr.glparts;
                 w)))
        gs
  | _ ->
      (* cljs view-table wraps the table in a random-uuid div *)
      D.el_append_child body
        (D.h
           ~attrs:[ ("id", Platform.random_uuid ()) ]
           ~children:[ table_el inst ~refresh ] ())

let render_body inst ~refresh ?(filters = None) () : D.el =
  let body = D.h ~cls:"ls-view-body flex flex-col gap-2 grid mt-1" () in
  (match filters with
   | Some f -> D.el_append_child body f
   | None -> ());
  (if inst.V.loading then
     D.el_append_child body
       (D.h ~cls:"p-2 text-sm opacity-50" ~text:I.loading_ ())
   else (
     (match inst.V.display_type with
      | "list" -> render_list inst ~refresh body
      | "gallery" -> render_gallery inst body
      | _ -> render_table inst ~refresh body);
     match inst.V.data with
     | Wr.VFlat { rows = []; _ } ->
         D.el_append_child body
           (D.h ~cls:"p-2 text-sm opacity-50" ~text:I.no_matched_result ())
     | _ -> ()));
  body
