(* View head — .ls-view-head with .views tabs + .view-actions, and the
   .filters-row chips. Mirrors views.cljs view-head / views-tab /
   filters-row. *)

module D = Views_dom
module I = I18n
module V = Views_state
module Wr = Views_wire
module W = Wire
module P = Views_popup

let ghost_btn ?(extra = "") icon_name =
  D.h ~tag:"button"
    ~cls:
      (D.button_cls ~variant:"ghost" ~size:"sm"
         ~cls:("ls-icon-btn" ^ extra) ())
    ~attrs:[ ("type", "button") ] ~children:[ D.icon icon_name ] ()

let count_of inst =
  match inst.V.data with
  | Wr.VFlat { count; _ } -> count
  | Wr.VGrouped gs ->
      List.fold_left (fun a g -> a + List.length g.Wr.grows) 0 gs
  | Wr.VGroupedList gs ->
      List.fold_left
        (fun a g ->
          a + List.fold_left (fun a2 (_, r) -> a2 + List.length r) 0
                g.Wr.glparts)
        0 gs
  | Wr.VEmpty -> 0

let set_filters inst ~refresh fs or_ =
  inst.V.filters <- fs;
  inst.V.filters_or <- or_;
  V.persist_filters inst;
  refresh inst

(* ---------- tabs ---------- *)

(* view-type ident → tabler icon (cljs get-icon-by-view-type via
   built-in-property :logseq.property/icon) *)
let view_type_icon v =
  match v.Wr.vtype with
  | "logseq.property.view/type.list" -> "list"
  | "logseq.property.view/type.gallery" -> "layout-grid"
  | _ -> "table"

(* cljs view-tab-button: icon (ls-icon-color-wrap) + title text + item
   count on the current tab *)
let view_tab inst ~refresh (v : Wr.view_ent) : D.el =
  let is_current = v.Wr.vu = inst.V.view_uuid in
  let count = count_of inst in
  let children =
    [ D.h ~tag:"span" ~cls:"ls-icon-color-wrap"
        ~children:[ D.icon (view_type_icon v) ] ()
    ; Editor_dom.create_text_node (V.display_title v) ]
    @ (if is_current && inst.V.feature <> "query-result" && count > 0
       then
         [ D.h ~tag:"span" ~cls:"ls-count"
             ~text:(string_of_int count) () ]
       else [])
  in
  let b =
    D.h ~tag:"button"
      ~cls:
        (D.button_cls ~variant:"text" ~size:"sm"
           ~cls:
             ("ls-view-tab"
              ^ if is_current then "" else " ls-dim")
           ())
      ~attrs:
        [ ("type", "button"); ("data-view-tab-id", "view-tab-" ^ v.Wr.vu) ]
      ~children ()
  in
  D.el_add_listener b "click" (fun _ ->
      if is_current then
        P.show_menu ~anchor:b
          [ P.MItem
              (I.rename, fun () -> (V.ops ()).o_rename inst v)
          ; P.MItem
              ( I.delete
              , fun () ->
                  Views_db.delete_blocks [ v.Wr.vu ] (fun () ->
                      inst.V.views <-
                        List.filter
                          (fun x -> x.Wr.vu <> v.Wr.vu) inst.V.views;
                      (match inst.V.views with
                       | next :: _ -> V.apply_view_entity inst next
                       | [] -> ());
                      refresh inst) )
          ]
        |> ignore
      else begin
        V.apply_view_entity inst v;
        inst.V.selected <- V.Sset.empty;
        refresh inst
      end);
  b

let tabs_el inst ~refresh ~opacity : D.el * D.el =
  let wrap = D.h ~cls:"views" () in
  List.iter
    (fun v -> D.el_append_child wrap (view_tab inst ~refresh v))
    inst.V.views;
  let add =
    D.h ~tag:"button"
      ~cls:
        (D.button_cls ~variant:"text" ~size:"sm"
           ~cls:("ls-add-view " ^ opacity)
           ())
      ~attrs:[ ("type", "button"); ("title", I.add_new_view) ]
      ~children:[ D.icon "plus" ] ()
  in
  D.el_add_listener add "click" (fun _ -> (V.ops ()).o_create_view inst);
  D.el_append_child wrap add;
  (wrap, add)

(* ---------- sorting popup ---------- *)

let sorting_popup inst ~refresh anchor =
  let items =
    List.concat_map
      (fun s ->
        match
          List.find_opt (fun c -> c.V.c_id = s.V.s_id) inst.V.columns
        with
        | None -> []
        | Some c ->
            [ P.MCustom
                (D.h ~cls:
                   "ls-view-order-setting"
                   ~children:
                     [ D.h ~cls:"ls-drag-row"
                         ~children:
                           [ D.h ~tag:"i" ~cls:"ti ti-grip-vertical" ()
                           ; D.h ~cls:
                               "ls-col-name"
                               ~text:(c.V.c_name ^ ":") ()
                           ]
                         ()
                     ; D.h ~tag:"span" ~cls:"ls-xs"
                         ~text:
                           (if s.V.s_asc then I.ascending else I.descending)
                         ~on_click:(fun _ ->
                           inst.V.sorting <-
                             List.map
                               (fun x ->
                                 if x.V.s_id = s.V.s_id then
                                   { x with V.s_asc = not x.V.s_asc }
                                 else x)
                               inst.V.sorting;
                           V.persist_sorting inst;
                           P.close_all ();
                           refresh inst)
                         ()
                     ]
                   ()) ])
      inst.V.sorting
  in
  ignore
    (P.show_menu ~anchor ~align_end:true
       (items
        @ [ P.MItem
              ( I.delete_sort
              , fun () ->
                  inst.V.sorting <- [];
                  V.persist_sorting inst;
                  refresh inst ) ]))

(* ---------- filter popup ---------- *)

let filterable_columns inst =
  List.filter
    (fun c ->
      c.V.c_id <> "select" && c.V.c_id <> "id"
      && c.V.c_id <> "block.temp/refs-count")
    inst.V.columns

(* value phase: select of values + Is Empty / Is Not Empty buttons,
   shown in a popup anchored at the filter button *)
let filter_value_phase inst ~refresh ~anchor (c : V.column) =
  let ident = c.V.c_id in
  let prop_w =
    match c.V.c_prop with
    | Some m -> m
    | None -> W.Map [ (W.kw "db/ident", W.Keyword ident) ]
  in
  let opts =
    W.Map
      (match inst.V.view_ent with
       | Some ve -> [ (W.kw "view-id", W.Int ve.Wr.vid) ]
       | None -> [])
  in
  Views_db.get_view_filter_data ~opts prop_w (fun data ->
      let items =
        match W.map_get_string data "value-source" with
        | Some "timestamp" ->
            List.map
              (fun (v, l) -> { P.si_label = l; si_value = v; si_extra = None })
              I.timestamp_options
        | Some "checkbox" ->
            [ { P.si_label = I.true_; si_value = "true"
              ; si_extra = Some (W.Bool true) }
            ; { P.si_label = I.false_; si_value = "false"
              ; si_extra = Some (W.Bool false) } ]
        | _ ->
            List.map
              (fun it ->
                { P.si_label =
                    Option.value (W.map_get_string it "label") ~default:""
                ; si_value =
                    Option.value (W.map_get_string it "label") ~default:""
                ; si_extra = W.get it "value" })
              (Wr.W.elems
                 (Option.value (W.get data "values") ~default:W.Nil))
      in
      let content = D.h ~cls:"ls-vf-col" () in
      let inner = D.h ~cls:"cp__select cp__select-main" () in
      let inp =
        D.h ~tag:"input" ~cls:"cp__select-input"
          ~attrs:[ ("type", "text"); ("placeholder", c.V.c_name) ] ()
      in
      D.el_append_child inner (D.h ~cls:"input-wrap" ~children:[ inp ] ());
      let results = D.h ~cls:"cp__select-results" () in
      D.el_append_child inner
        (D.h ~cls:"item-results-wrap" ~children:[ results ] ());
      let render_items q =
        D.clear results;
        List.iter
          (fun it ->
            if Fuzzy.score q it.P.si_label > 0. then begin
              let a =
                D.h ~tag:"a" ~cls:"menu-link"
                  ~attrs:[ ("tabindex", "0") ]
                  ~children:
                    [ D.h ~tag:"span" ~cls:"menu-item-label" ~text:it.P.si_label () ]
                  ()
              in
              D.el_add_listener a "click" (fun _ ->
                  P.close_all ();
                  set_filters inst ~refresh
                    (inst.V.filters
                     @ [ { V.c_prop = ident; c_op = "is"
                         ; c_val =
                             Some
                               (Option.value it.P.si_extra
                                  ~default:(W.String it.P.si_value)) } ])
                    inst.V.filters_or);
              D.el_append_child results
                (D.h ~cls:"menu-link-wrap" ~children:[ a ] ())
            end)
          items
      in
      render_items "";
      D.el_add_listener inp "input" (fun _ ->
          render_items (Editor_dom.el_value inp));
      D.el_append_child content inner;
      (if ident <> "block/created-at" && ident <> "block/updated-at" then begin
         let mk label op =
           let b =
             D.h ~tag:"button"
               ~cls:"ls-op-btn"
               ~children:
                 [ D.h ~tag:"span"
                     ~cls:"ls-op-label"
                     ~text:label () ]
               ()
           in
           D.el_add_listener b "click" (fun _ ->
               P.close_all ();
               set_filters inst ~refresh
                 (inst.V.filters
                  @ [ { V.c_prop = ident; c_op = op
                      ; c_val = Some (W.Keyword "empty") } ])
                 inst.V.filters_or);
           b
         in
         D.el_append_child content (mk I.is_empty "is");
         D.el_append_child content (mk I.is_not_empty "is-not")
       end);
      let pop =
        D.h ~cls:
          "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
           bg-popover p-1 text-popover-foreground shadow-md" ()
      in
      D.el_append_child pop content;
      D.el_append_child P.document_body pop;
      P.position_content ~anchor ~content:pop ~align_end:true ~submenu:false;
      P.push_popup pop;
      Editor_dom.set_timeout (fun () -> Editor_dom.el_focus inp) 0)

let filter_popup inst ~refresh anchor =
  let items =
    List.map
      (fun c -> { P.si_label = c.V.c_name; si_value = c.V.c_id; si_extra = None })
      (filterable_columns inst)
  in
  ignore
    (P.show_select ~anchor ~items ~placeholder:I.filter
       ~on_chosen:(fun it _ ->
         match
           List.find_opt (fun c -> c.V.c_id = it.P.si_value) inst.V.columns
         with
         | Some c ->
             (* cljs: value-phase select whenever the column resolves a
                property (built-ins like block/title included) or its type
                is not :string; only unresolved :string columns go
                straight to a text-contains filter *)
             (if
                c.V.c_prop <> None || c.V.c_many
                || c.V.c_type <> "string"
              then filter_value_phase inst ~refresh ~anchor c
              else
                set_filters inst ~refresh
                  (inst.V.filters
                   @ [ { V.c_prop = c.V.c_id; c_op = "text-contains"
                       ; c_val = None } ])
                  inst.V.filters_or)
         | None -> ())
       ())

(* ---------- search ---------- *)

(* cljs renders the search icon ALWAYS (click is a no-op while the input
   is open) — e2e clicks it twice, so the button must not disappear *)
let search_el inst ~refresh : D.el =
  let wrap = D.h ~cls:"view-action-search" () in
  let inner = D.h ~cls:"ls-row" () in
  let btn = ghost_btn "search" in
  D.el_add_listener btn "click" (fun _ ->
      if not inst.V.search_open then begin
        inst.V.search_open <- true;
        refresh inst
      end);
  D.el_append_child inner btn;
  if inst.V.search_open then begin
    let inp =
      D.h ~tag:"input"
        ~cls:"ls-search-input"
        ~attrs:
          [ ("type", "text"); ("placeholder", I.type_to_search)
          ; ("data-1p-ignore", "")
          ]
        ()
    in
    D.el_set_attr inp "value" inst.V.input;
    let deb = D.debounce 300 in
    D.el_add_listener inp "input" (fun _ ->
        let v = Editor_dom.el_value inp in
        deb (fun () ->
            inst.V.input <- v;
            refresh inst));
    D.el_add_listener inp "keydown" (fun ev ->
        match Editor_dom.ev_key ev with
        | "Escape" ->
            Editor_dom.stop_propagation ev;
            inst.V.input <- "";
            inst.V.search_open <- false;
            refresh inst
        | _ -> ());
    let xbtn =
      D.h ~tag:"button" ~cls:"ls-icon-btn"
        ~children:[ D.icon "x" ] ()
    in
    D.el_add_listener xbtn "click" (fun _ ->
        inst.V.input <- "";
        inst.V.search_open <- false;
        refresh inst);
    D.el_append_child inner inp;
    D.el_append_child inner xbtn;
    Editor_dom.set_timeout (fun () -> Editor_dom.el_focus inp) 0
  end;
  D.el_append_child wrap inner;
  wrap

(* ---------- more actions ---------- *)

let column_visibility_items inst ~refresh =
  List.filter
    (fun c ->
      c.V.c_id <> "select" && c.V.c_id <> "id" && not c.V.c_disable_hide)
    inst.V.columns
  |> List.map (fun c ->
         P.MCheck
           ( c.V.c_name
           , not (V.Sset.mem c.V.c_id inst.V.hidden)
           , fun checked ->
               if checked then
                 inst.V.hidden <- V.Sset.remove c.V.c_id inst.V.hidden
               else inst.V.hidden <- V.Sset.add c.V.c_id inst.V.hidden;
               V.persist_hidden inst;
               refresh inst ))

let groupable_columns inst =
  let cols =
    List.filter
      (fun c ->
        c.V.c_id <> "select" && c.V.c_id <> "id" && c.V.c_id <> "block/title"
        && c.V.c_id <> "block.temp/refs-count"
        && List.mem c.V.c_type
             [ "checkbox"; "class"; "date"; "default"; "node"; "number"
             ; "string"; "url" ])
      inst.V.columns
  in
  if List.exists (fun c -> c.V.c_id = "block/page") inst.V.columns then
    Views_table.page_column :: cols
  else cols

let rec more_actions inst ~refresh : D.el =
  let btn = ghost_btn "dots" in
  D.el_set_attr btn "aria-expanded" "false";
  D.el_add_listener btn "click" (fun _ ->
      let gcs = groupable_columns inst in
      let subs =
        List.concat
          [ (if inst.V.display_type = "table" then
               [ P.MSub (I.columns_visibility, column_visibility_items inst ~refresh) ]
             else [])
          ; (match gcs with
             | [] -> []
             | _ ->
                 [ P.MSub
                     ( I.group_by
                     , List.map
                         (fun c ->
                           P.MCheck
                             ( c.V.c_name
                             , inst.V.group_by = Some c.V.c_id
                             , fun checked ->
                                 inst.V.group_by <-
                                   (if checked then Some c.V.c_id else None);
                                 V.persist_group_by inst;
                                 refresh inst ))
                         gcs ) ])
          ; (* cljs group-by-page?: sort-groups shows whenever block/page is
               a groupable column, regardless of the current group-by *)
            (if List.exists (fun c -> c.V.c_id = "block/page") gcs then
               [ P.MSub
                   ( I.sort_groups_by
                   , [ mk_group_sort inst ~refresh "block/journal-day"
                         I.group_journal_date
                     ; mk_group_sort inst ~refresh "block/title"
                         I.group_page_name
                     ; mk_group_sort inst ~refresh "block/updated-at"
                         I.group_page_updated
                     ; mk_group_sort inst ~refresh "block/created-at"
                         I.group_page_created ] ) ]
             else [])
          ; (if inst.V.group_by <> None then
               let desc =
                 match inst.V.group_desc with
                 | Some d -> d
                 | None -> true
               in
               [ P.MSub
                   ( I.sort_groups_order
                   , [ P.MCheck
                         ( I.descending, desc
                         , fun _ ->
                             V.persist_group_desc inst true;
                             refresh inst )
                     ; P.MCheck
                         ( I.ascending, not desc
                         , fun _ ->
                             V.persist_group_desc inst false;
                             refresh inst ) ] ) ]
             else [])
          ]
      in
      ignore
        (P.show_menu ~anchor:btn ~align_end:true
           (subs @ [ P.MItem (I.export_edn, fun () -> (V.ops ()).o_export inst) ])));
  btn

and mk_group_sort inst ~refresh ident label =
  P.MCheck
    ( label
    , inst.V.group_sort_by = Some ident
    , fun _ ->
        V.persist_group_sort_by_ident inst ident (fun () -> refresh inst) )

(* ---------- display type ---------- *)

let display_type_el inst ~refresh : D.el =
  let wrap = D.h ~cls:"view-action-type ls-dim" () in
  let icon_name =
    match inst.V.display_type with
    | "list" -> "list"
    | "gallery" -> "layout-grid"
    | _ -> "table"
  in
  let inner =
    D.h ~cls:"property-value-inner"
      ~children:
        [ D.h ~cls:"jtrigger"
            ~attrs:[ ("id", "trigger-" ^ Platform.random_uuid ()) ]
            ~children:
              [ D.h ~cls:"select-item"
                  ~children:
                    [ D.h ~tag:"span"
                        ~cls:"ls-icon-color-wrap"
                        ~children:[ D.icon icon_name ] () ]
                  () ]
            () ]
      ()
  in
  D.el_add_listener inner "click" (fun _ ->
      let set dt =
        inst.V.display_type <- dt;
        V.persist_display_type inst;
        refresh inst
      in
      ignore
        (P.show_menu ~anchor:wrap ~align_end:true
           [ P.MItem (I.table_view, fun () -> set "table")
           ; P.MItem (I.list_view, fun () -> set "list")
           ; P.MItem (I.gallery_view, fun () -> set "gallery") ]));
  D.el_append_child wrap inner;
  wrap

(* ---------- filters row ---------- *)

let filter_value_label inst f =
  match f.V.c_val with
  | Some (W.Keyword "empty") -> I.empty_label
  | Some v -> (
      match v with
      | W.Map _ -> Option.value (Wr.ref_title v) ~default:""
      | W.Uuid u -> (V.ops ()).o_title_of_uuid inst u
      | W.Array xs | W.Set xs | W.List xs ->
          String.concat ", "
            (List.map
               (fun x ->
                 match x with
                 | W.Map _ -> Option.value (Wr.ref_title x) ~default:""
                 | _ -> Wr.prop_text x)
               xs)
      | _ -> Wr.prop_text v)
  | None -> I.all

let filter_chip inst ~refresh idx (f : V.filter_clause) : D.el =
  let chip =
    D.h ~cls:"ls-vf-chip" ()
  in
  let prop_title =
    match List.find_opt (fun c -> c.V.c_id = f.V.c_prop) inst.V.columns with
    | Some c -> c.V.c_name
    | None -> f.V.c_prop
  in
  D.el_append_child chip
    (D.h ~tag:"button" ~cls:"ls-vf-chip-prop"
       ~attrs:[ ("disabled", "true") ]
       ~children:[ D.h ~tag:"span" ~cls:"ls-xs" ~text:prop_title () ] ());
  let op_btn =
    D.h ~tag:"button" ~cls:"ls-vf-chip-op"
      ~children:
        [ D.h ~tag:"span" ~cls:"ls-xs" ~text:(I.operator_text f.V.c_op) () ]
      ()
  in
  D.el_add_listener op_btn "click" (fun _ ->
      let prop =
        match
          List.find_opt (fun c -> c.V.c_id = f.V.c_prop) inst.V.columns
        with
        | Some { V.c_prop = Some m; _ } -> m
        | _ -> W.Map [ (W.kw "db/ident", W.Keyword f.V.c_prop) ]
      in
      Views_db.get_view_filter_data prop (fun data ->
          let ops =
            Wr.W.elems
              (Option.value (W.get data "operators") ~default:W.Nil)
            |> List.filter_map W.as_keyword
          in
          ignore
            (P.show_menu ~anchor:op_btn
               (List.map
                  (fun op ->
                    P.MItem
                      ( I.operator_text op
                      , fun () ->
                          inst.V.filters <-
                            List.mapi
                              (fun i x ->
                                if i = idx then { x with V.c_op = op } else x)
                              inst.V.filters;
                          V.persist_filters inst;
                          refresh inst ))
                  ops))));
  D.el_append_child chip op_btn;
  let val_el =
    D.h ~cls:
      "ls-view-filter-value"
      ~children:
        [ D.h ~cls:"ls-view-filter-value-item"
            ~text:(filter_value_label inst f) () ]
      ()
  in
  D.el_append_child chip
    (D.h ~tag:"button"
       ~cls:"ls-vf-chip-val"
       ~children:[ val_el ] ());
  let x =
    D.h ~tag:"button" ~cls:"ls-vf-chip-x"
      ~children:[ D.icon "x" ] ()
  in
  D.el_add_listener x "click" (fun _ ->
      inst.V.filters <-
        List.filteri (fun i _ -> i <> idx) inst.V.filters;
      V.persist_filters inst;
      refresh inst);
  D.el_append_child chip x;
  chip

let filters_row inst ~refresh : D.el option =
  match inst.V.filters with
  | [] -> None
  | fs ->
      let row =
        D.h ~cls:
          "filters-row" ()
      in
      let chips =
        D.h ~cls:
          "ls-vf-chips"
          ()
      in
      List.iteri
        (fun i f -> D.el_append_child chips (filter_chip inst ~refresh i f))
        fs;
      D.el_append_child row chips;
      (if List.length fs > 1 then
         let sel =
           D.h ~tag:"select"
             ~cls:"ls-vf-logic" ()
         in
         List.iter
           (fun (v, l) ->
             D.el_append_child sel
               (D.h ~tag:"option" ~attrs:[ ("value", v) ] ~text:l ()))
           [ ("and", I.match_all); ("or", I.match_any) ];
         D.el_set_attr sel "value"
           (if inst.V.filters_or then "or" else "and");
         D.el_add_listener sel "change" (fun _ ->
             inst.V.filters_or <- Editor_dom.el_value sel = "or";
             V.persist_filters inst;
             refresh inst);
         D.el_append_child row (D.h ~children:[ sel ] ()));
      Some row

(* ---------- head ---------- *)

let render_head inst ~refresh : D.el =
  let head =
    D.h ~cls:
      "ls-view-head" ()
  in
  (* cljs view-head fades actions/tabs to opacity-75, full on hover *)
  let fade_targets = ref [] in
  let set_opacity shown =
    List.iter
      (fun el ->
        if shown then begin
          D.el_class_remove el "ls-dim";
          D.el_class_add el "ls-lit"
        end
        else begin
          D.el_class_remove el "ls-lit";
          D.el_class_add el "ls-dim"
        end)
      !fade_targets
  in
  D.el_add_listener head "mouseover" (fun _ -> set_opacity true);
  D.el_add_listener head "mouseout" (fun _ ->
      if !P.open_popups = [] then set_opacity false);
  let left = D.h ~cls:"ls-view-head-left" () in
  (match inst.V.kind with
   | V.KQuery _ ->
       D.el_append_child left
         (D.h ~cls:"ls-query-count"
            ~text:(I.live_query (count_of inst)) ())
   | _ ->
       let tabs, add = tabs_el inst ~refresh ~opacity:"ls-dim" in
       fade_targets := add :: !fade_targets;
       D.el_append_child left tabs);
  let actions =
    D.h
      ~cls:
        "view-actions ls-dim"
      ()
  in
  fade_targets := actions :: !fade_targets;
  (if inst.V.sorting <> [] then begin
     let sbtn = ghost_btn "arrows-up-down" in
     D.el_add_listener sbtn "click" (fun _ ->
         sorting_popup inst ~refresh sbtn);
     D.el_append_child actions sbtn
   end);
  let fbtn = ghost_btn "filter" in
  D.el_add_listener fbtn "click" (fun _ -> filter_popup inst ~refresh fbtn);
  D.el_append_child actions fbtn;
  D.el_append_child actions (search_el inst ~refresh);
  D.el_append_child actions (display_type_el inst ~refresh);
  D.el_append_child actions (more_actions inst ~refresh);
  (match inst.V.kind with
   | V.KTagPage _ | V.KPropertyPage _ -> (
       (* cljs objects.cljs: no "new object" for private class idents
          (worker sends add-object? in route-info) *)
       match !Runtime.current_page with
       | Some p when p.Model.page_add_object ->
           let plus = ghost_btn "plus" in
           Editor_dom.el_set_attr plus "title" I.new_node;
           D.el_add_listener plus "click" (fun _ ->
               (V.ops ()).o_add_object inst);
           D.el_append_child actions plus
       | _ -> ())
   | _ -> ());
  D.el_append_child head left;
  D.el_append_child head actions;
  head
