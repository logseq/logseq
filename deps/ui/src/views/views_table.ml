(* Table/list/gallery body rendering for views — mirrors
   components/views.cljs + shui table/core.cljc DOM contract.
   `refresh : inst -> unit` is threaded through instead of referencing
   Views_view to keep modules acyclic. *)

module D = Views_dom
module I = Views_i18n
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

let builtin_column id name ty ?(disable_hide = false) () : V.column =
  { V.c_id = id; c_name = name; c_type = ty; c_prop = None
  ; c_disable_hide = disable_hide; c_many = false }

let select_column : V.column =
  builtin_column "select" I.select_col "default" ~disable_hide:true ()

let id_column : V.column = builtin_column "id" "#" "default" ()

let title_column : V.column = builtin_column "block/title" I.name_ "node" ()

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
  | "block/tags" -> Some (builtin_column "block/tags" I.filter_tags "node" ())
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
    else props @ [ builtin_column "block/tags" I.filter_tags "node" () ]
  in
  match inst.V.kind with
  | V.KAllPages ->
      [ select_column; title_column; refs_count_column; created_column
      ; updated_column ]
  | V.KTagPage _ ->
      (* cljs objects.cljs: Asset-class tag pages get a "File" column
         before the logseq property columns *)
      [ select_column; id_column; title_column ]
      @ (if inst.V.asset_class
         then [ builtin_column "file" "File" "default" ~disable_hide:true () ]
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
      [ select_column; id_column; title_column ] @ qcols @ tail
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
      (fun c -> not (V.Sset.mem c.V.c_id inst.V.hidden))
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

let month_names =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"; "Oct"
   ; "Nov"; "Dec" |]

let fmt_date ms =
  let d = date_of_ms ms in
  Printf.sprintf "%s %d, %d" month_names.(date_month d) (date_day d)
    (date_year d)

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

let select_cell inst ~refresh ~row_uuid ~blk : D.el =
  let inner =
    D.h ~cls:"flex align-middle w-full items-center px-0" ()
  in
  let dbid =
    match W.map_get_int blk "db/id" with
    | Some n -> string_of_int n
    | None -> row_uuid
  in
  let cb =
    D.h ~tag:"input"
      ~cls:
        ("jtrigger flex transition-opacity "
         ^ if V.Sset.mem row_uuid inst.V.selected then "opacity-100"
           else "opacity-0")
      ~attrs:[ ("type", "checkbox"); ("id", dbid ^ "-checkbox") ] ()
  in
  D.el_set_checked cb (V.Sset.mem row_uuid inst.V.selected);
  let label =
    D.h ~tag:"label"
      ~cls:"jtrigger h-8 w-8 flex items-center justify-center cursor-pointer"
      ~attrs:[ ("for", dbid ^ "-checkbox"); ("data-table-row-select", "") ]
      ~children:[ cb ] ()
  in
  (* native label[for] dispatches the click on the input *)
  D.el_add_listener cb "click" (fun ev ->
      Editor_dom.stop_propagation ev;
      inst.V.selected <-
        (if D.el_checked cb then V.Sset.add row_uuid inst.V.selected
         else V.Sset.remove row_uuid inst.V.selected);
      refresh inst);
  D.el_append_child inner label;
  inner

let title_cell inst ~row_uuid ~blk (c : V.column) : D.el =
  let inner =
    D.h ~cls:"flex align-middle w-full overflow-x-clip items-center border-r px-2" ()
  in
  let title = Wr.prop_text (cell_value blk c) in
  (match inst.V.kind, W.get blk "block/name" with
   | V.KAllPages, Some (W.String name) ->
       D.el_append_child inner
         (D.h ~tag:"a" ~cls:"page-ref truncate"
            ~attrs:[ ("href", "#/page/" ^ name) ] ~text:title ())
   | _ ->
       let div =
         D.h ~cls:
           "table-block-title relative flex items-center w-full h-full \
            cursor-pointer"
           ~text:title ()
       in
       D.el_add_listener div "click" (fun ev ->
           Editor_dom.stop_propagation ev;
           Platform.dispatch "ls:open-right-sidebar"
             (Js.Json.object_
                (Js.Dict.fromList [ ("uuid", Js.Json.string row_uuid) ])));
       D.el_append_child inner div);
  inner

let prop_cell ~blk (c : V.column) : D.el =
  let inner =
    D.h ~cls:"flex align-middle w-full overflow-x-clip items-center border-r px-2" ()
  in
  (match cell_value blk c with
   | W.Map _ as v when Wr.ref_uuid v <> None ->
       let t = Option.value (Wr.ref_title v) ~default:"" in
       D.el_append_child inner
         (D.h ~tag:"a" ~cls:"page-ref" ~attrs:[ ("href", "#/page/" ^ t) ]
            ~text:t ())
   | W.Array xs when c.V.c_many ->
       List.iter
         (fun x ->
           let t = Wr.prop_text x in
           if t <> "" then
             D.el_append_child inner
               (D.h ~tag:"a" ~cls:"page-ref mr-1"
                  ~attrs:[ ("href", "#/page/" ^ t) ] ~text:t ()))
         xs
   | W.Bool b when c.V.c_type = "checkbox" ->
       let cb = D.h ~tag:"input" ~attrs:[ ("type", "checkbox") ] () in
       D.el_set_checked cb b;
       D.el_set_attr cb "disabled" "true";
       D.el_append_child inner cb
   | v ->
       D.el_append_child inner
         (D.h ~tag:"span" ~cls:"truncate" ~text:(fmt_cell_value c v) ()));
  inner

let cell_el inst ~refresh ~row_uuid ~blk ~idx (c : V.column) : D.el =
  let cell = D.h ~cls:"ls-table-cell flex relative h-full" () in
  (match c.V.c_id with
   | "select" -> D.el_append_child cell (select_cell inst ~refresh ~row_uuid ~blk)
   | "id" ->
       let inner =
         D.h ~cls:"flex align-middle w-full items-center border-r px-2" ()
       in
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

let header_cell inst ~refresh (c : V.column) : D.el =
  let cell =
    D.h ~cls:"ls-table-header-cell"
      ~attrs:[ ("style", "width:auto;min-width:60px") ] ()
  in
  (match c.V.c_id with
   | "select" ->
       Editor_dom.el_set_class cell "ls-table-header-cell !border-0";
       let cb =
         D.h ~tag:"input"
           ~attrs:[ ("type", "checkbox"); ("id", "header-checkbox") ] ()
       in
       let label =
         D.h ~tag:"label"
           ~cls:"jtrigger h-8 w-8 flex items-center justify-center cursor-pointer"
           ~attrs:[ ("for", "header-checkbox") ] ~children:[ cb ] ()
       in
       D.el_add_listener cb "click" (fun ev ->
           Editor_dom.stop_propagation ev;
           inst.V.selected <-
             (if D.el_checked cb then
                List.fold_left
                  (fun s u -> V.Sset.add u s)
                  inst.V.selected (all_row_uuids inst)
              else V.Sset.empty);
           refresh inst);
       D.el_append_child cell label
   | "id" ->
       D.el_append_child cell
         (D.h ~tag:"label" ~cls:"flex items-center justify-center" ~text:"#" ())
   | _ ->
       D.el_append_child cell
         (D.h ~tag:"span" ~cls:"truncate" ~text:c.V.c_name ());
       if sortable c then
         D.el_add_listener cell "click" (fun _ ->
             P.show_menu ~anchor:cell
               [ P.MItem
                   ( I.sort_ascending
                   , fun () ->
                       inst.V.sorting <- [ { V.s_id = c.V.c_id; s_asc = true } ];
                       V.persist_sorting inst;
                       refresh inst )
               ; P.MItem
                   ( I.sort_descending
                   , fun () ->
                       inst.V.sorting <-
                         [ { V.s_id = c.V.c_id; s_asc = false } ];
                       V.persist_sorting inst;
                       refresh inst )
               ]));
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

let row_el inst ~refresh ~idx ~row_uuid (cols : V.column list) : D.el =
  let blk =
    match Hashtbl.find_opt inst.V.blocks row_uuid with
    | Some b -> b
    | None -> W.Map []
  in
  let row =
    D.h ~cls:
      "ls-table-row ls-block flex flex-row items-center border-b \
       transition-colors hover:bg-muted/50 \
       data-[state=selected]:bg-muted bg-gray-01 items-stretch"
      ~attrs:
        [ ("data-id", row_uuid); ("blockid", row_uuid); ("tabIndex", "0") ]
      ()
  in
  let wrap = D.h ~cls:"flex flex-row" () in
  List.iter
    (fun c ->
      D.el_append_child wrap (cell_el inst ~refresh ~row_uuid ~blk ~idx c))
    cols;
  D.el_append_child row wrap;
  row

let table_el inst ~refresh : D.el =
  let tbl = D.h ~cls:"ls-table w-full caption-bottom text-sm table-fixed" () in
  let cols = visible_columns inst in
  let header =
    D.h ~cls:"ls-table-header border-y transition-colors bg-gray-01"
      ~attrs:[ ("style", "z-index:9") ] ()
  in
  let header_row = D.h ~cls:"flex flex-row" () in
  List.iter
    (fun c -> D.el_append_child header_row (header_cell inst ~refresh c))
    cols;
  D.el_append_child header header_row;
  (match action_bar inst ~refresh with
   | Some bar -> D.el_append_child header bar
   | None -> ());
  D.el_append_child tbl header;
  let rows_el = D.h ~cls:"ls-table-rows" () in
  List.iteri
    (fun i u ->
      D.el_append_child rows_el
        (row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u cols))
    (all_row_uuids inst);
  D.el_append_child tbl rows_el;
  tbl

(* grouped rows render without the header (group table per cljs) *)
let grouped_table inst ~refresh ~rows () =
  let tbl = D.h ~cls:"ls-table w-full caption-bottom text-sm table-fixed" () in
  let rows_el = D.h ~cls:"ls-table-rows" () in
  List.iteri
    (fun i u ->
      D.el_append_child rows_el
        (row_el inst ~refresh ~idx:(i + 1) ~row_uuid:u
           (visible_columns inst)))
    rows;
  D.el_append_child tbl rows_el;
  tbl

(* ---------- list + gallery ---------- *)

let list_row_el ~row_uuid ~title : D.el =
  D.h ~cls:"ls-block swipe-item"
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

let foldable inst ~refresh ~key ~title_text ~(body : unit -> D.el) : D.el =
  let collapsed = V.Sset.mem key inst.V.collapsed_groups in
  let arrow =
    D.h ~tag:"span"
      ~cls:(if collapsed then "control-show cursor-pointer" else "control-hide")
      ~children:
        [ D.h ~tag:"i"
            ~cls:("ti ti-chevron-" ^ if collapsed then "right" else "down")
            () ]
      ()
  in
  let ctrl =
    D.h ~tag:"a"
      ~cls:"ls-foldable-title-control block-control opacity-50 hover:opacity-100"
      ~attrs:[ ("style", "width:14px;height:16px") ] ~children:[ arrow ] ()
  in
  D.el_add_listener ctrl "pointerdown" (fun ev ->
      Editor_dom.stop_propagation ev;
      if collapsed then
        inst.V.collapsed_groups <- V.Sset.remove key inst.V.collapsed_groups
      else
        inst.V.collapsed_groups <- V.Sset.add key inst.V.collapsed_groups;
      refresh inst);
  let header =
    D.h ~cls:"flex flex-row items-center ls-foldable-header gap-1"
      ~children:[ ctrl; D.h ~text:title_text () ]
      ()
  in
  let title_el =
    D.h ~cls:"ls-foldable-title content"
      ~children:[ D.h ~cls:"flex-1 flex-row foldable-title" ~children:[ header ] () ]
      ()
  in
  let content =
    D.h
      ~cls:("ls-foldable-content" ^ if collapsed then " is-collapsed" else "")
      ~attrs:[ ("aria-hidden", string_of_bool collapsed) ]
      ~children:[ D.h ~cls:"ls-foldable-content-inner" ~children:[ body () ] () ]
      ()
  in
  D.h ~cls:"flex flex-col" ~children:[ title_el; content ] ()

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

let render_list inst ~refresh body =
  match inst.V.data with
  | Wr.VGrouped gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_text:(group_title inst g.Wr.gv)
               ~body:(fun () ->
                 let w = D.h () in
                 List.iter
                   (fun u ->
                     D.el_append_child w
                       (list_row_el ~row_uuid:u ~title:(row_title inst u)))
                   g.Wr.grows;
                 w)))
        gs
  | Wr.VGroupedList gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_text:(group_title inst g.Wr.glv)
               ~body:(fun () ->
                 let w = D.h () in
                 List.iteri
                   (fun j (buuid, rows) ->
                     D.el_append_child w
                       (foldable inst ~refresh
                          ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                          ~title_text:(row_title inst buuid)
                          ~body:(fun () ->
                            let w2 = D.h () in
                            List.iter
                              (fun u ->
                                D.el_append_child w2
                                  (list_row_el ~row_uuid:u
                                     ~title:(row_title inst u)))
                              rows;
                            w2)))
                   g.Wr.glparts;
                 w)))
        gs
  | _ ->
      List.iter
        (fun u ->
          D.el_append_child body
            (list_row_el ~row_uuid:u ~title:(row_title inst u)))
        (all_row_uuids inst)

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
               ~title_text:(group_title inst g.Wr.gv)
               ~body:(grouped_table inst ~refresh ~rows:g.Wr.grows)))
        gs
  | Wr.VGroupedList gs ->
      List.iteri
        (fun i g ->
          D.el_append_child body
            (foldable inst ~refresh ~key:("g" ^ string_of_int i)
               ~title_text:(group_title inst g.Wr.glv)
               ~body:(fun () ->
                 let w = D.h () in
                 List.iteri
                   (fun j (buuid, rows) ->
                     D.el_append_child w
                       (foldable inst ~refresh
                          ~key:("g" ^ string_of_int i ^ "-" ^ string_of_int j)
                          ~title_text:(row_title inst buuid)
                          ~body:(grouped_table inst ~refresh ~rows)))
                   g.Wr.glparts;
                 w)))
        gs
  | _ -> D.el_append_child body (table_el inst ~refresh)

let render_body inst ~refresh : D.el =
  let body = D.h ~cls:"ls-view-body" () in
  (if inst.V.loading then
     D.el_append_child body
       (D.h ~cls:"p-2 text-sm opacity-50" ~text:I.loading ())
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
