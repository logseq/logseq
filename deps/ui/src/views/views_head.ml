(* View chrome: tabs, sort/filter/search actions, filter chips — mirrors
   views.cljs view-head + filters UI.

   Declarative: the head renders through the Lui_elements tree; tabs and
   chip rows reconcile via `keyed`, counts/dimmed state via reactive
   props. Ephemeral surfaces (view-tab menu, column/filter pickers) mount
   imperatively via Views_popup with an id-addressable node as anchor. *)

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
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

let refresh inst = (V.ops ()).V.o_refresh inst
let icon_el = Views_table.icon_el

let ghost_btn ?(extra = "") ?(title_ = "") icon_name ~on_click : t =
  dom ~tag:"button"
    ~style_class:
      (E.button_cls ~variant:"ghost" ~size:"sm" ~cls:("ls-icon-btn" ^ extra)
         ())
    ~attrs:
      ([ ("type", "button") ]
       @ if title_ = "" then [] else [ ("title", title_) ])
    ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then on_click ())
    [ icon_el icon_name ]

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

let view_tab inst (v : Wr.view_ent) : t =
  let isig = sig_of inst in
  let current_sig =
    Signal.map (fun (s : V.vstate) -> s.V.view_uuid = v.Wr.vu) isig
  in
  dom ~tag:"button" ~id:(view_tab_anchor_id inst v)
    ~attrs:[ ("type", "button"); ("data-view-tab-id", "view-tab-" ^ v.Wr.vu) ]
    ~style_class_signal:
      (D.class_signal current_sig (fun cur ->
           E.button_cls ~variant:"text" ~size:"sm"
             ~cls:("ls-view-tab" ^ if cur then "" else " ls-dim")
             ()))
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then
        if (V.get inst).V.view_uuid = v.Wr.vu then
          match Ed.get_element_by_id (view_tab_anchor_id inst v) with
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
    [ dom ~tag:"span" ~style_class:"ls-icon-color-wrap"
        [ icon_el (view_type_icon v) ]
    ; dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", V.display_title v) ] []
    ; if_
        ~test:
          (Signal.map
             (fun (s : V.vstate) ->
               s.V.view_uuid = v.Wr.vu && inst.V.feature <> "query-result"
               && count_of s > 0)
             isig)
        (dom ~tag:"span" ~style_class:"ls-count"
           ~text_signal:
             (D.reactive_text (fun s -> string_of_int (count_of s)) isig)
           []) ]

(* .views > tabs + .ls-add-view (a fade target along with .view-actions) *)
let tabs_el inst ~dim : t =
  dom ~style_class:"views"
    [ D.keyed
        ~source:(Signal.map (fun (s : V.vstate) -> s.V.views) (sig_of inst))
        ~key:(fun (v : Wr.view_ent) -> v.Wr.vu)
        ~cmp:String.compare
        ~mount:(fun v_sig -> view_tab inst (Signal.get v_sig))
    ; dom ~tag:"button"
        ~style_class_signal:
          (D.class_signal dim (fun d ->
               E.button_cls ~variant:"text" ~size:"sm"
                 ~cls:("ls-add-view " ^ if d then "ls-dim" else "ls-lit")
                 ()))
        ~attrs:[ ("type", "button"); ("title", I.add_new_view) ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then (V.ops ()).V.o_create_view inst)
        [ icon_el "plus" ] ]

(* ---------- sorting popup ---------- *)

let sorting_popup inst anchor =
  let s = V.get inst in
  let items =
    List.concat_map
      (fun so ->
        match List.find_opt (fun c -> c.V.c_id = so.V.s_id) s.V.columns with
        | None -> []
        | Some c ->
            [ P.MCustom
                (E.h ~cls:"ls-view-order-setting"
                   ~children:
                     [ E.h ~cls:"ls-drag-row"
                         ~children:
                           [ E.h ~tag:"i" ~cls:"ti ti-grip-vertical" ()
                           ; E.h ~cls:"ls-col-name" ~text:(c.V.c_name ^ ":")
                               () ]
                         ()
                     ; E.h ~tag:"span" ~cls:"ls-xs"
                         ~text:(if so.V.s_asc then I.ascending else I.descending)
                         ~on_click:(fun _ ->
                           V.update inst (fun s ->
                               { s with
                                 V.sorting =
                                   List.map
                                     (fun x ->
                                       if x.V.s_id = so.V.s_id then
                                         { x with V.s_asc = not x.V.s_asc }
                                       else x)
                                     s.V.sorting
                               });
                           V.persist_sorting inst;
                           P.close_all ();
                           refresh inst)
                         () ]
                   ()) ])
      s.V.sorting
  in
  ignore
    (P.show_menu ~anchor ~align_end:true
       (items
        @ [ P.MItem
              ( I.delete_sort
              , fun () ->
                  V.update inst (fun s -> { s with V.sorting = [] });
                  V.persist_sorting inst;
                  refresh inst ) ]))

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
        E.clear results;
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
              E.el_add_listener a "click" (fun _ ->
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
      E.el_add_listener inp "input" (fun _ ->
          render_items (Editor_dom.el_value inp));
      E.el_append_child content inner;
      (if ident <> "block/created-at" && ident <> "block/updated-at" then begin
         let mk label op =
           let b =
             E.h ~tag:"button" ~cls:"ls-op-btn"
               ~children:
                 [ E.h ~tag:"span" ~cls:"ls-op-label" ~text:label () ]
               ()
           in
           E.el_add_listener b "click" (fun _ ->
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
      Ed.set_timeout (fun () -> Ed.el_focus inp) 0)

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
  match Ed.get_element_by_id ("vmore-" ^ string_of_int inst.V.id) with
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
  dom ~tag:"button"
    ~style_class:(E.button_cls ~variant:"ghost" ~size:"sm" ~cls:"ls-icon-btn" ())
    ~attrs:[ ("type", "button"); ("aria-expanded", "false") ]
    ~id:("vmore-" ^ string_of_int inst.V.id)
    ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then show_more_menu inst)
    [ icon_el "dots" ]

(* ---------- display type ---------- *)

let display_type_el inst : t =
  let wrap_id = "vtype-" ^ string_of_int inst.V.id in
  dom ~style_class:"view-action-type ls-dim" ~id:wrap_id
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then
        match Ed.get_element_by_id wrap_id with
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
    [ dom ~style_class:"property-value-inner"
        [ dom ~style_class:"jtrigger"
            ~id:("trigger-" ^ Platform.random_uuid ())
            [ dom ~style_class:"select-item"
                [ dom ~tag:"span" ~style_class:"ls-icon-color-wrap"
                    [ Views_table.icon_dyn
                        (Signal.map
                           (fun (s : V.vstate) ->
                             match s.V.display_type with
                             | "list" -> "list"
                             | "gallery" -> "layout-grid"
                             | _ -> "table")
                           (sig_of inst)) ] ] ] ] ]

(* ---------- search ---------- *)

(* cljs renders the search icon ALWAYS (click is a no-op while the input
   is open) — e2e clicks it twice, so the button must not disappear *)
let search_el inst : t =
 fun ctx parent ->
  let deb = E.debounce 300 in
  let input_id = "vsearch-" ^ string_of_int inst.V.id in
  let open_sig =
    Signal.map (fun (s : V.vstate) -> s.V.search_open) (sig_of inst)
  in
  dom ~style_class:"view-action-search"
    [ dom ~style_class:"ls-row"
        [ ghost_btn "search" ~on_click:(fun () ->
              if not (V.get inst).V.search_open then begin
                V.update inst (fun s -> { s with V.search_open = true });
                Ed.set_timeout
                  (fun () ->
                    match Ed.get_element_by_id input_id with
                    | Some el -> E.focus_end el
                    | None -> ())
                  0
              end)
        ; if_ ~test:open_sig
            (D.fragment
               [ dom ~tag:"input" ~style_class:"ls-search-input"
                   ~attrs:
                     [ ("type", "text"); ("id", input_id)
                     ; ("placeholder", I.type_to_search)
                     ; ("data-1p-ignore", "")
                     ; ("value", (V.get inst).V.input) ]
                   ~events:"input keydown"
                   ~on_dom_event:(fun name payload ->
                     match name with
                     | "input" ->
                         let v = Platform.payload_str payload "value" in
                         deb (fun () ->
                             V.update inst (fun s -> { s with V.input = v });
                             refresh inst)
                     | "keydown" -> (
                         match Platform.payload_str payload "key" with
                         | "Escape" ->
                             V.update inst (fun s ->
                                 { s with V.input = ""; search_open = false });
                             refresh inst
                         | _ -> ())
                     | _ -> ())
                   []
               ; dom ~tag:"button" ~style_class:"ls-icon-btn"
                   ~attrs:[ ("type", "button") ]
                   ~events:"click"
                   ~on_dom_event:(fun name _ ->
                     if name = "click" then begin
                       V.update inst (fun s ->
                           { s with V.input = ""; search_open = false });
                       refresh inst
                     end)
                   [ icon_el "x" ] ]) ]
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
  dom ~style_class:"ls-vf-chip"
    [ dom ~tag:"button" ~style_class:"ls-vf-chip-prop"
        ~attrs:[ ("disabled", "true") ]
        [ dom ~tag:"span" ~style_class:"ls-xs" ~text:prop_title [] ]
    ; dom ~tag:"button" ~style_class:"ls-vf-chip-op" ~id:op_btn_id
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then
            match Ed.get_element_by_id op_btn_id with
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
        [ dom ~tag:"span" ~style_class:"ls-xs"
            ~text:(I.operator_text f.V.c_op) [] ]
    ; dom ~tag:"button" ~style_class:"ls-vf-chip-val"
        [ dom ~style_class:"ls-view-filter-value"
            [ dom ~style_class:"ls-view-filter-value-item"
                ~text:(filter_value_label inst f) [] ] ]
    ; dom ~tag:"button" ~style_class:"ls-vf-chip-x"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then begin
            V.update inst (fun s ->
                { s with
                  V.filters =
                    List.filteri (fun i _ -> i <> idx) s.V.filters
                });
            V.persist_filters inst;
            refresh inst
          end)
        [ icon_el "x" ] ]

let filters_row inst : t =
 fun ctx parent ->
  if_ ~test:(Signal.map (fun s -> s.V.filters <> []) (sig_of inst))
    (fun ctx parent ->
      let s = V.get inst in
      let chips =
        List.mapi (fun i f -> filter_chip inst i f) s.V.filters
      in
      dom ~style_class:"filters-row"
        [ dom ~style_class:"ls-vf-chips" chips
        ; (if List.length s.V.filters > 1 then
             dom
               [ dom ~tag:"select" ~style_class:"ls-vf-logic"
                   ~attrs:
                     [ ("value", if s.V.filters_or then "or" else "and") ]
                   ~events:"change"
                   ~on_dom_event:(fun name payload ->
                     if name = "change" then begin
                       V.update inst (fun s ->
                           { s with
                             V.filters_or =
                               Platform.payload_str payload "value" = "or" });
                       V.persist_filters inst;
                       refresh inst
                     end)
                   [ dom ~tag:"option" ~attrs:[ ("value", "and") ]
                       ~text:I.match_all []
                   ; dom ~tag:"option" ~attrs:[ ("value", "or") ]
                       ~text:I.match_any [] ] ]
           else D.nothing)
        ]
        ctx parent)
    ctx parent

(* ---------- head ---------- *)

(* cljs view-head fades actions/tabs to opacity-75, full on hover *)
let render_head inst : t =
 fun ctx parent ->
  let sched = ctx.Lui_ui.ui_scheduler in
  let hover = Signal.state sched false in
  let dim =
    Signal.map2
      (fun h open_ -> not (h || open_))
      hover.Signal.state_signal (P.open_signal sched)
  in
  let s0 = V.get inst in
  let has_add_object =
    match inst.V.kind with
    | V.KTagPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | _ -> false
  in
  dom ~style_class:"ls-view-head"
    ~events:"mouseover mouseout"
    ~on_dom_event:(fun name _ ->
      match name with
      | "mouseover" -> Runtime.signal_set hover true
      | "mouseout" ->
          if !(P.open_popups) = [] then Runtime.signal_set hover false
      | _ -> ())
    [ dom ~style_class:"ls-view-head-left"
        [ (match inst.V.kind with
           | V.KQuery _ ->
               dom ~style_class:"ls-query-count"
                 ~text_signal:
                   (D.reactive_text
                      (fun (s : V.vstate) -> I.live_query (count_of s))
                      (sig_of inst))
                 []
           | _ -> tabs_el inst ~dim) ]
    ; dom
        ~style_class_signal:
          (D.class_signal dim (fun d ->
               "view-actions" ^ if d then " ls-dim" else " ls-lit"))
        [ (if s0.V.sorting <> [] then
             dom ~tag:"button" ~id:("vsort-" ^ string_of_int inst.V.id)
               ~style_class:
                 (E.button_cls ~variant:"ghost" ~size:"sm" ~cls:"ls-icon-btn"
                    ())
               ~attrs:[ ("type", "button") ]
               ~events:"click"
               ~on_dom_event:(fun name _ ->
                 if name = "click" then
                   match
                     Ed.get_element_by_id
                       ("vsort-" ^ string_of_int inst.V.id)
                   with
                   | Some a -> sorting_popup inst a
                   | None -> ())
               [ icon_el "arrows-up-down" ]
           else D.nothing)
        ; dom ~tag:"button" ~id:("vfilter-" ^ string_of_int inst.V.id)
            ~style_class:
              (E.button_cls ~variant:"ghost" ~size:"sm" ~cls:"ls-icon-btn" ())
            ~attrs:[ ("type", "button") ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then
                match
                  Ed.get_element_by_id
                    ("vfilter-" ^ string_of_int inst.V.id)
                with
                | Some a -> filter_popup inst a
                | None -> ())
            [ icon_el "filter" ]
        ; search_el inst
        ; display_type_el inst
        ; more_actions_el inst
        ; (if has_add_object then
             ghost_btn "plus" ~title_:I.new_node
               ~on_click:(fun () -> (V.ops ()).V.o_add_object inst)
           else D.nothing)
        ] ]
    ctx parent
