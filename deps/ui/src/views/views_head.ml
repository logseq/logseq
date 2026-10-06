(* View chrome: tabs, sort/filter/search actions, filter chips — mirrors
   views.cljs view-head + filters UI.

   Declarative: the head renders through the Lui_elements tree; tabs and
   chip rows reconcile via `keyed`, counts/dimmed state via reactive
   props. Ephemeral surfaces (view-tab menu, column/filter pickers) mount
   imperatively via Views_popup with an id-addressable node as anchor. *)

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

let if_ = D.if_
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

let refresh inst = (V.ops ()).V.o_refresh inst
let icon_el = Views_table.icon_el

(* `title` (tooltip) has no component prop — it lands on ~label
   (aria-label), which an icon-only button wants anyway *)
let ghost_btn ?(extra = "") ?(title_ = "") icon_name ~on_click : t =
  let mk label =
    button ~variant:`ghost ~size:`sm ~icon:(Views_table.icon_of icon_name)
      ?label ~style_class:("ls-icon-btn" ^ extra)
      ~on_press:(fun _ -> on_click ()) []
  in
  mk (if title_ = "" then None else Some title_)

let count_of (s : V.vstate) =
  match s.V.data with
  | Wr.VFlat { rows; _ } -> List.length rows
  | Wr.VGrouped gs ->
      List.fold_left (fun acc g -> acc + List.length g.Wr.grows) 0 gs
  | Wr.VGroupedList gs ->
      List.fold_left
        (fun acc g ->
          acc
          + List.fold_left
              (fun acc2 (_, rows) -> acc2 + List.length rows)
              0 g.Wr.glparts)
        0 gs
  | Wr.VEmpty -> 0

let set_filters inst fs or_ =
  V.update inst (fun s -> { s with V.filters = fs; filters_or = or_ });
  V.persist_filters inst;
  refresh inst

(* view-type ident -> tabler icon (cljs get-icon-by-view-type via
   built-in-property :logseq.property/icon) *)
let view_type_icon v =
  match v.Wr.vtype with
  | "logseq.property.view/type.list" -> "list"
  | "logseq.property.view/type.gallery" -> "layout-grid"
  | _ -> "table"

(* ---------- tabs ---------- *)

(* cljs view-tab-button: icon (ls-icon-color-wrap) + title text + item
   count on the current tab *)
let view_tab_anchor_id inst (v : Wr.view_ent) =
  "view-tab-" ^ string_of_int inst.V.id ^ "-" ^ v.Wr.vu

let view_tab inst (v_sig : Wr.view_ent Signal.signal) : t =
 fun ctx parent ->
  (* icon/title/count ride v_sig — a rename or retype republishes the
     same keyed item, and a mount-time snapshot froze the tab until the
     next remount *)
  let v0 = Signal.get v_sig in
  let isig = sig_of inst in
  let current_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (s : V.vstate) -> s.V.view_uuid = v0.Wr.vu) isig)
  in
  (* data-view-tab-id is a DOM marker with no component prop —
     accessibility_identifier carries the stable anchor *)
  Ui_parts.class_signal current_sig
    (fun cur -> "ls-view-tab" ^ if cur then "" else " ls-dim")
    (button ~variant:`ghost ~size:`sm
       ~accessibility_identifier:(view_tab_anchor_id inst v0)
       ~on_press:(fun _ ->
         let v = Signal.get v_sig in
         if (V.get inst).V.view_uuid = v.Wr.vu then
           match E.get_element_by_id (view_tab_anchor_id inst v) with
           | Some b ->
               ignore
                 (P.show_menu ~anchor:b
                    [ P.MItem (I.rename, fun () -> (V.ops ()).V.o_rename inst v)
                    ; P.MItem
                        ( I.delete
                        , fun () ->
                            Views_db.delete_blocks [ v.Wr.vu ] (fun () ->
                                let next =
                                  List.filter
                                    (fun x -> x.Wr.vu <> v.Wr.vu)
                                    (V.get inst).V.views
                                in
                                V.update inst (fun s ->
                                    let s = { s with V.views = next } in
                                    match next with
                                    | n :: _ -> V.apply_view_entity s n
                                    | [] -> s);
                                refresh inst) ) ])
           | None -> ()
         else begin
           V.update inst (fun s ->
               let s' = V.apply_view_entity s v in
               { s' with V.selected = V.Sset.empty });
           refresh inst
         end)
       [ box ~style_class:"ls-icon-color-wrap"
           [ icon ~point_size:16
               ~style_class:("ls-icon-" ^ view_type_icon v0)
               ~name_signal:
                 (Logseq_dom.own ctx
                    (Signal.map
                       (fun (v : Wr.view_ent) ->
                         Views_table.icon_of (view_type_icon v))
                       v_sig))
               [] ]
       ; text
           ~value:(reactive (fun (v : Wr.view_ent) -> V.display_title v) v_sig)
           []
       ; if_
           ~test:
             (Logseq_dom.own ctx
                (Signal.map
                   (fun (s : V.vstate) ->
                     s.V.view_uuid = v0.Wr.vu
                     && inst.V.feature <> "query-result"
                     && count_of s > 0)
                   isig))
           (text ~style_class:"ls-count"
              ~value_signal:
                (Logseq_dom.own ctx
                   (Signal.map
                      (fun s -> string_of_int (count_of s)) isig))
              []) ])
    ctx parent

(* .views > tabs + .ls-add-view (a fade target along with .view-actions) *)
let tabs_el inst ~dim : t =
 fun ctx parent ->
  row ~style_class:"views"
    [ D.keyed
        ~source:
          (Logseq_dom.own ctx
             (Signal.map (fun (s : V.vstate) -> s.V.views) (sig_of inst)))
        ~key:(fun (v : Wr.view_ent) -> v.Wr.vu)
        ~cmp:String.compare
        ~mount:(view_tab inst)
    ; Ui_parts.class_signal dim
        (fun d -> "ls-add-view " ^ if d then "ls-dim" else "ls-lit")
        (button ~variant:`ghost ~size:`sm ~icon:`plus
           ~label:I.add_new_view
           ~on_press:(fun _ -> (V.ops ()).V.o_create_view inst) []) ]
    ctx parent

(* ---------- sorting popup ---------- *)

let sorting_popup inst anchor =
  let s = V.get inst in
  let set_asc so asc =
    V.update inst (fun s ->
        { s with
          V.sorting =
            List.map
              (fun x ->
                if x.V.s_id = so.V.s_id then { x with V.s_asc = asc }
                else x)
              s.V.sorting
        });
    V.persist_sorting inst;
    P.close_all ();
    refresh inst
  in
  let remove_sort so =
    V.update inst (fun s ->
        { s with
          V.sorting =
            List.filter (fun x -> x.V.s_id <> so.V.s_id) s.V.sorting
        });
    V.persist_sorting inst;
    P.close_all ();
    refresh inst
  in
  let items =
    List.concat_map
      (fun so ->
        match List.find_opt (fun c -> c.V.c_id = so.V.s_id) s.V.columns with
        | None -> []
        | Some c ->
            let order_btn =
              (* cljs shui/select trigger: order-button !px-2 !py-0 !h-8 *)
              E.h ~tag:"button" ~cls:"ls-sort-order"
                ~children:
                  [ E.h ~tag:"span"
                      ~text:(if so.V.s_asc then I.ascending else I.descending)
                      ()
                  ; E.icon "chevron-down" ]
                ()
            in
            (* one click flips asc/desc (same outcome as the cljs select,
               minus a nested popup that would detach this menu) *)
            E.el_on order_btn "click" (fun ev ->
                E.ev_stop_propagation ev;
                set_asc so (not so.V.s_asc));
            let remove_btn = E.h ~tag:"button" ~cls:"ls-sort-x" () in
            E.el_append_child remove_btn (E.icon "x");
            E.el_on remove_btn "click" (fun ev ->
                E.ev_stop_propagation ev;
                remove_sort so);
            [ P.MCustom
                (E.h ~cls:"ls-view-order-setting"
                   ~children:
                     [ E.h ~cls:"ls-drag-row"
                         ~children:
                           [ E.h ~tag:"i" ~cls:"ti ti-grip-vertical" ()
                           ; E.h ~cls:"ls-col-name" ~text:(c.V.c_name ^ ":")
                               () ]
                         ()
                     ; E.h ~cls:"ls-sort-right"
                         ~children:[ order_btn; remove_btn ]
                         ()
                     ]
                   ()) ])
      s.V.sorting
  in
  ignore
    (P.show_menu ~anchor ~align_end:true
       (items
        @ [ P.MCustom
              ((* cljs: ghost button, muted, pl-3, trash icon + label *)
               let btn =
                 E.h ~tag:"button" ~cls:"ls-sort-delete"
                   ~children:
                     [ E.icon "trash"
                     ; E.h ~tag:"span" ~cls:"menu-item-label"
                         ~text:I.delete_sort ()
                     ]
                   ()
               in
               E.el_on btn "click" (fun _ ->
                   V.update inst (fun s -> { s with V.sorting = [] });
                   V.persist_sorting inst;
                   P.close_all ();
                   refresh inst);
               btn) ] ))

(* ---------- filter popup ---------- *)

let filterable_columns (s : V.vstate) =
  List.filter
    (fun c ->
      c.V.c_id <> "select" && c.V.c_id <> "id"
      && c.V.c_id <> "block.temp/refs-count")
    s.V.columns

(* value phase: select of values + Is Empty / Is Not Empty buttons,
   shown in a popup anchored at the filter button — overlay surface, so
   it stays imperative inside Views_popup *)
let filter_value_phase inst ~anchor (c : V.column) =
  let ident = c.V.c_id in
  let prop_w =
    match c.V.c_prop with
    | Some m -> m
    | None -> W.Map [ (W.kw "db/ident", W.Keyword ident) ]
  in
  let opts =
    W.Map
      (match (V.get inst).V.view_ent with
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
      let content = E.h ~cls:"ls-vf-col" () in
      let inner = E.h ~cls:"cp__select cp__select-main" () in
      let inp =
        E.h ~tag:"input" ~cls:"cp__select-input"
          ~attrs:[ ("type", "text"); ("placeholder", c.V.c_name) ] ()
      in
      E.el_append_child inner (E.h ~cls:"input-wrap" ~children:[ inp ] ());
      let results = E.h ~cls:"cp__select-results" () in
      E.el_append_child inner
        (E.h ~cls:"item-results-wrap" ~children:[ results ] ());
      let render_items q =
        E.el_replace_children results;
        List.iter
          (fun it ->
            if Fuzzy.score q it.P.si_label > 0. then begin
              let a =
                E.h ~tag:"a" ~cls:"menu-link"
                  ~attrs:[ ("tabindex", "0") ]
                  ~children:
                    [ E.h ~tag:"span" ~cls:"menu-item-label"
                        ~text:it.P.si_label () ]
                  ()
              in
              E.el_on a "click" (fun _ ->
                  P.close_all ();
                  set_filters inst
                    ((V.get inst).V.filters
                     @ [ { V.c_prop = ident; c_op = "is"
                         ; c_val =
                             Some
                               (Option.value it.P.si_extra
                                  ~default:(W.String it.P.si_value)) } ])
                    (V.get inst).V.filters_or);
              E.el_append_child results
                (E.h ~cls:"menu-link-wrap" ~children:[ a ] ())
            end)
          items
      in
      render_items "";
      E.el_on inp "input" (fun _ ->
          render_items (Web_dom.el_value inp));
      E.el_append_child content inner;
      (if ident <> "block/created-at" && ident <> "block/updated-at" then begin
         let mk label op =
           let b =
             E.h ~tag:"button" ~cls:"ls-op-btn"
               ~children:
                 [ E.h ~tag:"span" ~cls:"ls-op-label" ~text:label () ]
               ()
           in
           E.el_on b "click" (fun _ ->
               P.close_all ();
               set_filters inst
                 ((V.get inst).V.filters
                  @ [ { V.c_prop = ident; c_op = op
                      ; c_val = Some (W.Keyword "empty") } ])
                 (V.get inst).V.filters_or);
           b
         in
         E.el_append_child content (mk I.is_empty "is");
         E.el_append_child content (mk I.is_not_empty "is-not")
       end);
      let pop =
        E.h
          ~cls:
            "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md \
             border bg-popover p-1 text-popover-foreground shadow-md" ()
      in
      E.el_append_child pop content;
      E.el_append_child P.document_body pop;
      P.position_content ~anchor ~content:pop ~align_end:true ~submenu:false;
      P.push_popup pop;
      E.set_timeout (fun () -> E.el_focus inp) 0)

let filter_popup inst anchor =
  let s = V.get inst in
  let items =
    List.map
      (fun c ->
        { P.si_label = c.V.c_name; si_value = c.V.c_id; si_extra = None })
      (filterable_columns s)
  in
  ignore
    (P.show_select ~anchor ~items ~placeholder:I.filter
       ~on_chosen:(fun it _ ->
         match
           List.find_opt (fun c -> c.V.c_id = it.P.si_value) s.V.columns
         with
         | Some c ->
             (* cljs: value-phase select whenever the column resolves a
                property (built-ins like block/title included) or its type
                is not :string; only unresolved :string columns go
                straight to a text-contains filter *)
             (if c.V.c_prop <> None || c.V.c_many || c.V.c_type <> "string"
              then filter_value_phase inst ~anchor c
              else
                set_filters inst
                  (s.V.filters
                   @ [ { V.c_prop = c.V.c_id; c_op = "text-contains"
                       ; c_val = None } ])
                  s.V.filters_or)
         | None -> ())
       ())

(* ---------- more actions ---------- *)

let column_visibility_items inst =
  let s = V.get inst in
  List.filter
    (fun c ->
      c.V.c_id <> "select" && c.V.c_id <> "id" && not c.V.c_disable_hide)
    s.V.columns
  |> List.map (fun c ->
         P.MCheck
           ( c.V.c_name
           , not (V.Sset.mem c.V.c_id s.V.hidden)
           , fun checked ->
               V.update inst (fun s ->
                   { s with
                     V.hidden =
                       (if checked then V.Sset.remove c.V.c_id s.V.hidden
                        else V.Sset.add c.V.c_id s.V.hidden)
                   });
               V.persist_hidden inst;
               refresh inst ))

let groupable_columns inst =
  let s = V.get inst in
  let cols =
    List.filter
      (fun c ->
        c.V.c_id <> "select" && c.V.c_id <> "id" && c.V.c_id <> "block/title"
        && c.V.c_id <> "block.temp/refs-count"
        && List.mem c.V.c_type
             [ "checkbox"; "class"; "date"; "default"; "node"; "number"
             ; "string"; "url" ])
      s.V.columns
  in
  if List.exists (fun c -> c.V.c_id = "block/page") s.V.columns then
    Views_table.page_column :: cols
  else cols

let rec show_more_menu inst =
  match E.get_element_by_id ("vmore-" ^ string_of_int inst.V.id) with
  | None -> ()
  | Some anchor ->
          let s = V.get inst in
          let gcs = groupable_columns inst in
          let subs =
            List.concat
              [ (if s.V.display_type = "table" then
                   [ P.MSub (I.columns_visibility, column_visibility_items inst) ]
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
                                 , s.V.group_by = Some c.V.c_id
                                 , fun checked ->
                                     V.update inst (fun s ->
                                         { s with
                                           V.group_by =
                                             (if checked then Some c.V.c_id
                                              else None)
                                         });
                                     V.persist_group_by inst;
                                     refresh inst ))
                             gcs ) ])
              ; (* cljs group-by-page?: sort-groups shows whenever
                   block/page is a groupable column, regardless of the
                   current group-by *)
                (if List.exists (fun c -> c.V.c_id = "block/page") gcs then
                   [ P.MSub
                       ( I.sort_groups_by
                       , [ mk_group_sort inst "block/journal-day"
                             I.group_journal_date
                         ; mk_group_sort inst "block/title" I.group_page_name
                         ; mk_group_sort inst "block/updated-at"
                             I.group_page_updated
                         ; mk_group_sort inst "block/created-at"
                             I.group_page_created ] ) ]
                 else [])
              ; (if s.V.group_by <> None then
                   let desc =
                     match s.V.group_desc with
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
            (P.show_menu ~anchor ~align_end:true
               (subs
                @ [ P.MItem (I.export_edn, fun () -> (V.ops ()).V.o_export inst)
                  ]))

and mk_group_sort inst ident label =
  P.MCheck
    ( label
    , (V.get inst).V.group_sort_by = Some ident
    , fun _ ->
        V.persist_group_sort_by_ident inst ident (fun () -> refresh inst) )

let more_actions_el inst : t =
  button ~variant:`ghost ~size:`sm ~icon:`ellipsis
    ~style_class:"ls-icon-btn"
    ~accessibility_identifier:("vmore-" ^ string_of_int inst.V.id)
    ~on_press:(fun _ -> show_more_menu inst) []

(* ---------- display type ---------- *)

let display_type_el inst : t =
 fun ctx parent ->
  let wrap_id = "vtype-" ^ string_of_int inst.V.id in
  Ui_parts.pressable
    ~on_press:(fun _ ->
      match E.get_element_by_id wrap_id with
      | Some anchor ->
          let set dt =
            V.update inst (fun s -> { s with V.display_type = dt });
            V.persist_display_type inst;
            refresh inst
          in
          ignore
            (P.show_menu ~anchor ~align_end:true
               [ P.MItem (I.table_view, fun () -> set "table")
               ; P.MItem (I.list_view, fun () -> set "list")
               ; P.MItem (I.gallery_view, fun () -> set "gallery") ])
      | None -> ())
    (box ~style_class:"view-action-type ls-dim"
       ~accessibility_identifier:wrap_id
       [ box ~style_class:"property-value-inner"
           [ box ~style_class:"jtrigger"
               ~accessibility_identifier:
                 ("trigger-" ^ Platform.random_uuid ())
               [ box ~style_class:"select-item"
                   [ box ~style_class:"ls-icon-color-wrap"
                       [ Views_table.icon_dyn
                           (Logseq_dom.own ctx
                              (Signal.map
                                 (fun (s : V.vstate) ->
                                   match s.V.display_type with
                                   | "list" -> "list"
                                   | "gallery" -> "layout-grid"
                                   | _ -> "table")
                                 (sig_of inst))) ] ] ] ] ])
    ctx parent

(* ---------- search ---------- *)

(* cljs renders the search icon ALWAYS (click is a no-op while the input
   is open) — e2e clicks it twice, so the button must not disappear *)
let search_el inst : t =
 fun ctx parent ->
  let deb = E.debounce 300 in
  let input_id = "vsearch-" ^ string_of_int inst.V.id in
  let open_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (s : V.vstate) -> s.V.search_open) (sig_of inst))
  in
  (* DOM-only keydown lost its Escape-closes-search path — no component
     event maps it *)
  box ~style_class:"view-action-search"
    [ row ~style_class:"ls-row"
        [ ghost_btn "search" ~on_click:(fun () ->
              if not (V.get inst).V.search_open then begin
                V.update inst (fun s -> { s with V.search_open = true });
                E.set_timeout
                  (fun () ->
                    match E.get_element_by_id input_id with
                    | Some el -> E.el_focus el
                    | None -> ())
                  0
              end)
        ; if_ ~test:open_sig
            (row
               [ search_field ~style_class:"ls-search-input"
                   ~accessibility_identifier:input_id
                   ~placeholder:I.type_to_search
                   ~text:(V.get inst).V.input
                   ~on_input:(fun ev ->
                     match ev with
                     | L.TextChanged (_, v) ->
                         deb (fun () ->
                             V.update inst (fun s -> { s with V.input = v });
                             refresh inst)
                     | _ -> ())
                   []
               ; ghost_btn "x" ~on_click:(fun () ->
                     V.update inst (fun s ->
                         { s with V.input = ""; search_open = false });
                     refresh inst) ]) ]
    ]
    ctx parent

(* ---------- filters row ---------- *)

let filter_value_label inst (f : V.filter_clause) =
  match f.V.c_val with
  | Some (W.Keyword "empty") -> I.empty_label
  | Some v -> (
      match v with
      | W.Map _ -> Option.value (Wr.ref_title v) ~default:""
      | W.Uuid u -> (V.ops ()).V.o_title_of_uuid inst u
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

let filter_chip inst idx (f : V.filter_clause) : t =
  let s = V.get inst in
  let prop_title =
    match List.find_opt (fun c -> c.V.c_id = f.V.c_prop) s.V.columns with
    | Some c -> c.V.c_name
    | None -> f.V.c_prop
  in
  let op_btn_id =
    "vchip-op-" ^ string_of_int inst.V.id ^ "-" ^ string_of_int idx
  in
  row ~cross:`center ~style_class:"ls-vf-chip"
    [ button ~style_class:"ls-vf-chip-prop ls-xs" ~text:prop_title
        ~disabled:true []
    ; button ~style_class:"ls-vf-chip-op ls-xs"
        ~accessibility_identifier:op_btn_id
        ~text:(I.operator_text f.V.c_op)
        ~on_press:(fun _ ->
            match E.get_element_by_id op_btn_id with
            | None -> ()
            | Some anchor ->
                let prop =
                  match
                    List.find_opt (fun c -> c.V.c_id = f.V.c_prop) s.V.columns
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
                      (P.show_menu ~anchor
                         (List.map
                            (fun op ->
                              P.MItem
                                ( I.operator_text op
                                , fun () ->
                                    V.update inst (fun s ->
                                        { s with
                                          V.filters =
                                            List.mapi
                                              (fun i x ->
                                                if i = idx then
                                                  { x with V.c_op = op }
                                                else x)
                                              s.V.filters
                                        });
                                    V.persist_filters inst;
                                    refresh inst ))
                            ops))))
        []
    ; box ~style_class:"ls-vf-chip-val"
        [ box ~style_class:"ls-view-filter-value"
            [ box ~style_class:"ls-view-filter-value-item"
                [ text ~value:(filter_value_label inst f) [] ] ] ]
    ; button ~variant:`ghost ~size:`icon ~icon:`x
        ~style_class:"ls-vf-chip-x"
        ~on_press:(fun _ ->
          V.update inst (fun s ->
              { s with
                V.filters =
                  List.filteri (fun i _ -> i <> idx) s.V.filters
              });
          V.persist_filters inst;
          refresh inst)
        [] ]

(* chips come off the live filters signal — if_ ~test:(filters <> [])
   alone rebuilt only on the empty/nonempty boundary, so add/edit/remove
   inside a nonempty set never repainted *)
let filters_row inst : t =
 fun ctx parent ->
  (reactive
     ~equal:
       (fun (a : V.vstate) (b : V.vstate) ->
         a.V.filters == b.V.filters && a.V.filters_or = b.V.filters_or)
     (fun (s : V.vstate) ->
       if s.V.filters = [] then Logseq_dom.nothing
       else
         let chips =
           List.mapi (fun i f -> filter_chip inst i f) s.V.filters
         in
         row ~style_class:"filters-row"
           [ row ~style_class:"ls-vf-chips" chips
           ; (if List.length s.V.filters > 1 then
                select ~style_class:"ls-vf-logic"
                  ~text:(if s.V.filters_or then I.match_any else I.match_all)
                  [ menu_item ~text:I.match_all ~selected:(not s.V.filters_or)
                      ~on_press:(fun _ ->
                        V.update inst (fun s ->
                            { s with V.filters_or = false });
                        V.persist_filters inst;
                        refresh inst)
                      []
                  ; menu_item ~text:I.match_any ~selected:s.V.filters_or
                      ~on_press:(fun _ ->
                        V.update inst (fun s ->
                            { s with V.filters_or = true });
                        V.persist_filters inst;
                        refresh inst)
                      [] ]
              else spacer ~key:"no-logic" [])
           ])
     (sig_of inst))
    ctx parent

(* ---------- head ---------- *)

(* cljs view-head fades actions/tabs to opacity-75, lit on hover —
   mouseover/mouseout are DOM-only, so lit now follows "a popup is
   open" alone *)
let render_head inst : t =
 fun ctx parent ->
  let sched = ctx.Lui_ui.ui_scheduler in
  let dim = Signal.map (fun open_ -> not open_) (P.open_signal sched) in
  let s0 = V.get inst in
  let has_add_object =
    match inst.V.kind with
    | V.KTagPage _ | V.KPropertyPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | _ -> false
  in
  row ~style_class:"ls-view-head"
    [ row ~style_class:"ls-view-head-left"
        [ (match inst.V.kind with
           | V.KQuery _ ->
               text ~style_class:"ls-query-count"
                 ~value_signal:
                   (Logseq_dom.own ctx
                      (Signal.map
                         (fun (s : V.vstate) -> I.live_query (count_of s))
                         (sig_of inst)))
                 []
           | _ -> tabs_el inst ~dim) ]
    ; Ui_parts.class_signal dim
        (fun d -> "view-actions" ^ if d then " ls-dim" else " ls-lit")
        (row ~key:"actions"
           [ (if s0.V.sorting <> [] then
                button ~variant:`ghost ~size:`sm
                  ~icon:(Views_table.icon_of "arrows-up-down")
                  ~style_class:"ls-icon-btn"
                  ~accessibility_identifier:
                    ("vsort-" ^ string_of_int inst.V.id)
                  ~on_press:(fun _ ->
                    match
                      E.get_element_by_id
                        ("vsort-" ^ string_of_int inst.V.id)
                    with
                    | Some a -> sorting_popup inst a
                    | None -> ())
                  []
              else spacer ~key:"no-sort" [])
           ; button ~variant:`ghost ~size:`sm
               ~icon:(Views_table.icon_of "filter")
               ~style_class:"ls-icon-btn"
               ~accessibility_identifier:
                 ("vfilter-" ^ string_of_int inst.V.id)
               ~on_press:(fun _ ->
                 match
                   E.get_element_by_id
                     ("vfilter-" ^ string_of_int inst.V.id)
                 with
                 | Some a -> filter_popup inst a
                 | None -> ())
               []
           ; search_el inst
           ; display_type_el inst
           ; more_actions_el inst
           ; (if has_add_object then
                ghost_btn "plus" ~title_:I.new_node
                  ~on_click:(fun () -> (V.ops ()).V.o_add_object inst)
              else spacer ~key:"no-add" [])
           ]) ]
    ctx parent
