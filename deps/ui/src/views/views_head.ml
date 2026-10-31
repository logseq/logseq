(* View chrome: tabs, sort/filter/search actions, filter chips — mirrors
   views.cljs view-head + filters UI.

   Declarative: the head renders through the Lui_elements tree; tabs and
   chip rows reconcile via `keyed`, counts/dimmed state via reactive
   props. Ephemeral surfaces (view-tab menu, column/filter pickers) mount
   imperatively via Views_popup with an id-addressable node as anchor. *)

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
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  (Signal.value (inst.V.st))
let refresh inst = (V.ops ()).V.o_refresh inst
let icon_el = Views_table.icon_el

let action_button ?(extra = "") ~label ?accessibility_identifier ~on_press children : t =
  Ui_components.button ~variant:`ghost ~size:`sm ~label ~style_class:extra
    ~width:24 ~min_width:24 ~height:24 ~min_height:24 ~padding:0
    ~main:`center ~cross:`center ~foreground:"hsl(var(--muted-foreground))"
    ?accessibility_identifier ~on_press children

let ghost_btn ?(extra = "") ~title_ icon_name ~on_click : t =
  action_button ~extra ~label:title_ ~on_press:(fun _ -> on_click ())
    [ icon ~name:(Icons.name_ref icon_name) ~point_size:18 [] ]

let count_of (s : V.vstate) =
  max s.V.items_count (Wr.row_count s.V.data)

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
    Logseq_el.own ctx
      (Signal.map (fun (s : V.vstate) -> s.V.view_uuid = v0.Wr.vu) isig)
  in
  (* data-view-tab-id is a DOM marker with no component prop —
     accessibility_identifier carries the stable anchor *)
  (* cljs view-tab-button is text-sm (14px), not the LUI button
     size-sm default 16px; .ls-dim (opacity-75 when not current) is the
     opacity signal *)
  Ui_parts.float_prop Lui_protocol.Opacity
    ~value:(reactive (fun cur -> if cur then 1. else 0.75) current_sig)
    (Ui_components.with_props [ Ui_components.Prop.font_size "0.875rem" ]
    (Ui_components.button ~variant:`ghost ~size:`sm ~label:(V.display_title v0)
       ~style_class:"ls-view-tab"
       ~height:24 ~min_height:24
       ~padding_horizontal:0 ~padding_vertical:0
       ~accessibility_identifier:(view_tab_anchor_id inst v0)
       ~on_press:(fun _ ->
         let v = Signal.get v_sig in
         if (V.get inst).V.view_uuid = v.Wr.vu then
           match Ui_services.dom_by_id (view_tab_anchor_id inst v) with
           | Some b ->
               ignore
                 (P.show_menu ~anchor:b
                    ((* cljs Rename is a dropdown-menu-sub with an inline
                        block-container editor, not a flat item *)
                     P.MSub
                       ( (I.t "view/rename")
                       , [ P.MCustom ((V.ops ()).V.o_rename_box inst v) ] )
                     :: (* cljs only offers Delete when >1 view exists *)
                        (if List.length (V.get inst).V.views > 1 then
                           [ P.MItem
                               ( (I.t "ui/delete")
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
                                       refresh inst) ) ]
                         else [])))
           | None -> ()
         else begin
           V.update inst (fun s ->
               let s' = V.apply_view_entity s v in
               { s' with V.selected = V.Sset.empty });
           refresh inst
         end)
       [ (* cljs view-tab-button: (when-not references? icon) — the refs
            sections show the bare title *)
         if_
           ~test:
             (Logseq_el.own ctx
                (Signal.map
                   (fun (_ : V.vstate) ->
                     match inst.V.kind with
                     | V.KLinkedRefs | V.KUnlinkedRefs -> false
                     | _ -> true)
                   isig))
           (row ~cross:`center ~style_class:"ls-icon-color-wrap"
              [ icon ~point_size:15
                  ~style_class:("ls-icon-" ^ view_type_icon v0)
                  ~name_signal:
                    (Logseq_el.own ctx
                       (Signal.map
                          (fun (v : Wr.view_ent) ->
                            Icons.name_ref (view_type_icon v))
                          v_sig))
                  [] ])
       ; text
           ~value:(reactive V.display_title v_sig)
           []
       ; (* show-items-count? is set for linked-references but not
            unlinked — linked also appends /total when the unfiltered
            block-ref-count exceeds the filtered items-count *)
         if_
           ~test:
             (Logseq_el.own ctx
                (Signal.map
                   (fun (s : V.vstate) ->
                     s.V.view_uuid = v0.Wr.vu
                     && inst.V.feature <> "query-result"
                     && inst.V.kind <> V.KUnlinkedRefs
                     && count_of s > 0)
                   isig))
           (text ~font_size:"0.75rem" ~line_height:"1rem"
              ~foreground:"hsl(var(--muted-foreground))"
              ~value_signal:
                (Logseq_el.own ctx
                   (Signal.map
                      (fun (s : V.vstate) ->
                        let n = count_of s in
                        if inst.V.kind = V.KLinkedRefs && s.V.refs_total > n
                        then Printf.sprintf "%d/%d" n s.V.refs_total
                        else string_of_int n)
                      isig))
              []) ]))
    ctx parent

(* .views > tabs + .ls-add-view — the button rides the same
   head-hover/popup-open opacity signal as .view-actions (G7 pattern:
   Signal.state + ~opacity, no hover primitive) *)
let tabs_el inst ~op : t =
 fun ctx parent ->
  row ~style_class:"views" ~cross:`center ~gap:8 ~min_width:0
    [ Lui_elements.keyed
        ~source:
          (Logseq_el.own ctx
             (Signal.map (fun (s : V.vstate) -> s.V.views) (sig_of inst)))
        ~key:(fun (v : Wr.view_ent) -> v.Wr.vu)
        ~cmp:String.compare
        ~mount:(view_tab inst)
    ; Ui_parts.float_prop Lui_protocol.Opacity ~value_signal:op
        (Ui_components.button ~variant:`ghost ~size:`sm ~label:(I.t "view/add-new-view")
           ~style_class:"ls-add-view"
           ~transition:"opacity 300ms ease-in"
           ~height:28 ~min_height:28 ~padding_horizontal:4 ~padding_vertical:2
           ~margin_left:(-4)
           ~foreground:
             "hsl(var(--muted-foreground))"
           ~on_press:(fun _ -> (V.ops ()).V.o_create_view inst)
           [ icon ~name:(`app "plus") ~point_size:15 [] ]) ]
    ctx parent

(* ---------- sorting popup ---------- *)

let sorting_popup inst anchor =
  let s = V.get inst in
  let set_asc so asc =
    let current = List.find (fun x -> x.V.s_id = so.V.s_id) (V.get inst).V.sorting in
    if current.V.s_asc <> asc then begin
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
      refresh inst
    end
  in
  let remove_sort so =
    if List.length (V.get inst).V.sorting = 1 then P.close_all ();
    V.update inst (fun s ->
        { s with
          V.sorting =
            List.filter (fun x -> x.V.s_id <> so.V.s_id) s.V.sorting
        });
    V.persist_sorting inst;
    refresh inst
  in
  let order_select so_s context parent =
    let opened = Signal.state context.Lui_ui.ui_scheduler false in
    let close () = Runtime.signal_set opened false in
    let choose value = close (); set_asc (Signal.get so_s) value in
    (box ~style_class:"ls-select-wrap"
       [ Ui_components.with_props
           [Ui_components.Prop.font_size "0.875rem"]
         (select ~style_class:"ls-sort-order"
           ~text:(reactive (fun so -> if so.V.s_asc then (I.t "view.table/ascending") else (I.t "view.table/descending")) so_s)
           ~height:32 ~min_height:32 ~padding_horizontal:8
           ~corner_radius:6 ~background:"transparent"
           ~border_width:1 ~border_color:"var(--ls-border-color)"
           ~foreground:"var(--ls-primary-text-color)"
           ~on_press:(fun _ -> Runtime.signal_set opened (not (Runtime.signal_get opened)))
           [])
       ; if_ ~test:(Signal.value opened)
           (Ui_components.menu_card ~key:"sort-options" ~cls:"ls-sort-options"
              ~anchor:`below ~anchor_alignment:`start ~on_dismiss:(fun _ -> close ())
              (List.map (fun (value,label) ->
                 menu_item ~style_class:"ls-sort-option" ~text:label
                   ~selected:(reactive (fun so -> so.V.s_asc = value) so_s)
                   ~selection_placement:`leading
                   ~padding_horizontal:8 ~padding_vertical:6 ~min_height:32
                   ~on_press:(fun _ -> choose value) [])
                 [true,(I.t "view.table/ascending"); false,(I.t "view.table/descending")])) ]) context parent
  in
  let sort_row so_s =
    let so = Signal.sample so_s in
    let c = List.find (fun c -> c.V.c_id = so.V.s_id) s.V.columns in
    row ~style_class:"ls-sort-row" ~cross:`center ~main:`space_between ~gap:8
      ~padding_horizontal:8
      [ row ~cross:`center ~gap:4
          [ icon ~name:(Icons.name_ref "grip-vertical") ~point_size:14 []
          ; text ~value:(c.V.c_name ^ ":") ~white_space:"nowrap"
              ~foreground:"hsl(var(--muted-foreground))" [] ]
      ; row ~cross:`center ~gap:8
          [ order_select so_s
          ; Ui_components.with_props
              [ Ui_components.Prop.hover_background "hsl(var(--muted))" ]
              (Ui_components.button ~variant:`ghost ~size:`sm ~height:32
                 ~padding_horizontal:4 ~corner_radius:4 ~style_class:"ls-sort-x"
                 ~foreground:"hsl(var(--muted-foreground))"
                 ~label:(I.t "view.table/delete-sort") ~icon:(Icons.name_ref "x")
                 ~on_press:(fun _ -> remove_sort (Signal.get so_s)) []) ] ]
  in
  P.show_custom ~anchor ~align_end:true ~cls:"ls-view-order-setting"
    (Ui_components.with_props [Ui_components.Prop.font_size "0.875rem"]
       (column ~gap:8 ~padding_vertical:8
          [ keyed
              ~source:(reactive (fun state ->
                List.filter (fun so ->
                  List.exists (fun c -> c.V.c_id = so.V.s_id) state.V.columns)
                  state.V.sorting) (sig_of inst))
              ~key:(fun so -> so.V.s_id) ~cmp:String.compare ~mount:sort_row
          ; Ui_components.with_props
              [ Ui_components.Prop.hover_background "hsl(var(--muted))" ]
              (Ui_components.button ~variant:`ghost ~main:`start
                 ~corner_radius:4 ~style_class:"ls-sort-delete"
                 ~padding_vertical:6 ~padding_horizontal:8
                 ~foreground:"hsl(var(--muted-foreground))"
                 ~icon:(Icons.name_ref "trash") ~text:(I.t "view.table/delete-sort")
                 ~on_press:(fun _ ->
                   P.close_all ();
                   V.update inst (fun s -> { s with V.sorting = [] });
                   V.persist_sorting inst;
                   refresh inst)
                 []) ]))

(* ---------- filter popup ---------- *)

let filterable_columns (s : V.vstate) =
  List.filter
    (fun c ->
      c.V.c_id <> "select" && c.V.c_id <> "id"
      && c.V.c_id <> "block.temp/refs-count")
    s.V.columns

let filter_options inst fields =
  W.Map (fields @ match (V.get inst).V.view_ent with
    | Some view -> [W.kw "view-id",W.Int view.Wr.vid]
    | None -> [])

(* Shared value phase for new clauses and indexed edits. The picker owns
   one clause and preserves its current operator and selection. *)
let filter_value_phase inst ~anchor ?index (c : V.column) =
  let current = V.current_view inst in
  let filters = (V.get inst).V.filters in
  let ident = c.V.c_id in
  let timestamp = c.V.c_type = "datetime" in
  let initial=Option.map (fun index -> List.nth (V.get inst).V.filters index) index in
  let operator=match initial with Some clause -> clause.V.c_op
    | None -> if timestamp then "after" else "is" in
  let prop_w =
    match c.V.c_prop with
    | Some m -> m
    | None -> W.Map
        [ (W.kw "db/ident", W.Keyword ident)
        ; (W.kw "logseq.property/type", W.Keyword c.V.c_type) ]
  in
  let opts = filter_options inst [W.kw "operator",W.Keyword operator] in
  Views_db.get_view_filter_data ~opts prop_w (fun data ->
    if current () && (V.get inst).V.filters = filters then
      let multiple=match initial with
        | None -> W.get data "value-source"=Some (W.Keyword "property-values")
        | Some _ -> (match W.get data "many?" with Some (W.Bool many) -> many
            | _ -> invalid_arg "view filter data lacks its selection cardinality") in
      let items =
        match W.get data "value-source" with
        | Some (W.Keyword "timestamp") ->
            List.map
              (fun (v, l) -> { P.si_label = l; si_value = v; si_extra = None })
              (I.timestamp_options ())
        | Some (W.Keyword "checkbox") ->
            [ { P.si_label = (I.t "ui/true"); si_value = "true"
              ; si_extra = Some (W.Bool true) }
            ; { P.si_label = (I.t "ui/false"); si_value = "false"
              ; si_extra = Some (W.Bool false) } ]
        | Some (W.Keyword "property-values") ->
            List.mapi
              (fun index it ->
                { P.si_label = (match W.map_get_string it "label" with Some label -> label
                    | None -> invalid_arg "view filter value lacks a label")
                ; si_value = string_of_int index
                ; si_extra = Some (match W.get it "value" with Some value -> value
                    | None -> invalid_arg "view filter value lacks a value") })
              (Wr.W.elems
                 (Option.value (W.get data "values") ~default:W.Nil))
        | _ -> invalid_arg "view filter data has an unsupported value source"
      in
      if W.get data "value-source"=Some (W.Keyword "property-values") then begin
        let ref_titles=Hashtbl.copy (V.get inst).V.ref_titles in
        List.iter (fun item -> match item.P.si_extra with
          | Some (W.Uuid uuid) -> Hashtbl.replace ref_titles uuid item.si_label
          | _ -> ()) items;
        V.update inst (fun state -> {state with ref_titles})
      end;
      let value item=Option.value item.P.si_extra ~default:(W.String item.P.si_value) in
      let initial_values=match initial with
        | Some {V.c_val=Some (W.Set values | W.Array values | W.List values);_} -> values
        | _ -> [] in
      let selected_values=List.filter_map (fun item ->
        if List.mem (value item) initial_values then Some item.P.si_value else None) items in
      let unlisted_values=List.filter (fun selected ->
        not (List.exists (fun item -> value item=selected) items)) initial_values in
      let position=ref index in
      let set_clause clause =
        let state=V.get inst in
        let filters=match !position,clause with
          | None,None -> state.V.filters
          | None,Some clause -> position:=Some (List.length state.filters);state.filters @ [clause]
          | Some index,clause ->
              if index>=List.length state.filters then invalid_arg "view filter session lost its clause";
              (match clause with
               | None -> position:=None;List.filteri (fun i _ -> i<>index) state.filters
               | Some clause -> List.mapi (fun i previous -> if i=index then clause else previous) state.filters) in
        if filters<>state.filters then set_filters inst filters state.filters_or in
      let commit value =
        P.close_all ();
        set_clause (Some {V.c_prop=ident;c_op=operator;c_val=Some value})
      in
      let custom_content it =
        if timestamp && it.P.si_value = "custom-date" then
          Some ("ls-view-date-picker", Ui_components.date_picker ~week_starts_on:(Sdk_config.calendar_week_starts_on ()) ~month_label:I18n.calendar_month_label ~day_label:I18n.calendar_day_label ~translate:I18n.t ~on_pick:(fun date ->
               commit (W.Date_ms (Int64.of_float date))))
        else None
      in
      let ops =
        if ident = "block/created-at" || ident = "block/updated-at"
           || (initial<>None && operator<>"is" && operator<>"is-not") then []
        else
          List.map
            (fun (label, op) ->
              Ui_components.button ~variant:`ghost ~size:`sm ~main:`start
                ~label
                ~on_press:(fun _ ->
                  if initial=None then P.close_all ();
                  set_clause (Some {V.c_prop=ident;c_op=op;c_val=Some (W.Keyword "empty")}))
                [Ui_components.with_props
                   [Ui_components.Prop.opacity 0.75;Ui_components.Prop.hover_opacity 1.]
                   (text ~value:label ~font_weight:400 [])])
            (if initial<>None then [I.t "view.filter/empty",operator]
             else [I.t "view.filter/is-empty","is";I.t "view.filter/is-not-empty","is-not"])
      in
      P.show_select ~anchor ~align_end:(initial=None) ~items:(P.fixed_items items) ~placeholder:c.V.c_name ~multiple ~selected_values
        ~input_padding_horizontal:(if initial=None then 8 else 12)
        ~footer:ops ~custom_content
        ~on_chosen:(fun item _ selected ->
          if multiple then
            set_clause (match selected with [] when initial=None -> None
              | _ -> Some {V.c_prop=ident;c_op=operator;
                  c_val=Some (W.Set (List.map value selected @ unlisted_values))})
          else commit (value item)) ())

let filter_popup inst anchor =
  let items context =
    Logseq_el.own context
      (Signal.map (fun state ->
        List.map (fun c ->
          { P.si_label = c.V.c_name; si_value = c.V.c_id; si_extra = None })
          (filterable_columns state)) (sig_of inst))
  in
  ignore
    (P.show_select ~anchor ~align_end:true ~items ~placeholder:(I.t "view.filter/filter")
       ~on_chosen:(fun it _ _ ->
         let s = V.get inst in
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
             ; "string"; "url" ]
        && (not c.V.c_many || List.mem c.V.c_type [ "class"; "default"; "node" ]))
      s.V.columns
  in
  if List.exists (fun c -> c.V.c_id = "block/page") s.V.columns then
    (Views_table.page_column ()) :: cols
  else cols

let gallery_custom_size inst view : t = fun ctx parent ->
  let width, height = Wr.gallery_dimensions view in
  let width = Signal.state ctx.Lui_ui.ui_scheduler (string_of_int width) in
  let height = Signal.state ctx.Lui_ui.ui_scheduler (string_of_int height) in
  let view_uuid = (V.get inst).V.view_uuid in
  let commit () =
    match int_of_string_opt (Signal.get_state width),
          int_of_string_opt (Signal.get_state height) with
    | Some width, Some height when (V.get inst).V.view_uuid = view_uuid ->
        Views_db.set_gallery_dimensions view_uuid width height (fun () -> refresh inst);
        P.close_all ()
    | _ -> ()
  in
  let field label draft =
    column ~gap:4
      [ text ~value:(I.t label) []
      ; Ui_components.input ~label:(I.t label)
          ~text:(reactive (fun text -> text) (Signal.value draft))
          ~on_input:(function L.TextChanged (_, text) -> Signal.set draft text | _ -> ())
          ~on_submit:(fun _ -> commit ()) [] ]
  in
  column ~gap:8 ~width:240 ~max_width:280 ~padding:12
    [ text ~value:(I.t "view.gallery/custom-size") []
    ; field "view.gallery/width" width
    ; field "view.gallery/height" height
    ; Ui_components.button ~variant:`default ~text:(I.t "ui/save") ~size:`sm
        ~disabled:(reactive (fun width height ->
          int_of_string_opt width = None || int_of_string_opt height = None)
          (Signal.value width) (Signal.value height))
        ~on_press:(fun _ -> commit ()) [] ] ctx parent

let gallery_menu_items inst =
  let s = V.get inst in
  let current = V.current_view inst in
  let request_current request =
    let ticket = Ui_effect.issue request in
    fun () -> current () && Ui_effect.is_current request ticket
  in
  if s.V.display_type <> "gallery" then []
  else
    let cover_columns = List.filter
      (fun c -> List.mem c.V.c_type ["asset"; "url"]) s.V.columns in
    let cover = Wr.gallery_asset_ident ~asset_class:s.V.asset_class
      ~infer:(List.mem inst.V.feature ["class-objects"; "query-result"])
      ~cover_idents:(List.map (fun c -> c.V.c_id) cover_columns) s.V.view_ent in
    let columns = List.filter (fun c -> c.V.c_id <> "select" && c.V.c_id <> "id"
      && Some c.V.c_id <> cover) s.V.columns in
    let display = Wr.gallery_display_idents
      ~column_idents:(List.map (fun c -> c.V.c_id) columns)
      ~asset_ident:cover s.V.view_ent in
    let display_selection = ref display in
    let after () = if current () then refresh inst in
    let size = Option.bind s.V.view_ent (fun view -> view.Wr.vgallery_size) in
    [ P.MSub (I.t "view.gallery/display-properties",
        List.map (fun c -> P.MCheck (c.V.c_name, List.mem c.V.c_id display,
          fun checked ->
            if current () then begin
            let selected = if checked then c.V.c_id :: !display_selection
              else List.filter ((<>) c.V.c_id) !display_selection in
            display_selection := selected;
            Views_db.set_gallery_display_properties s.V.view_uuid
              ~current:(request_current inst.V.gallery_display_request)
              (List.filter_map (fun c ->
                if List.mem c.V.c_id selected then Some c.V.c_id else None) columns) after end)) columns) ]
    @ (if cover_columns = [] then [] else
        [ P.MSub (I.t "view.gallery/cover-property",
            List.map (fun c -> P.MCheck (c.V.c_name, cover = Some c.V.c_id,
              fun checked -> if checked && current () then
                Views_db.set_gallery_asset_property s.V.view_uuid c.V.c_id
                  ~current:(request_current inst.V.gallery_asset_request) after)) cover_columns) ])
    @ [ P.MSub (I.t "view.gallery/card-size",
        [ P.MCheck (I.t "view.gallery/default-size", size = None || size = Some "default",
            fun checked -> if checked then
              Views_db.set_gallery_card_size s.V.view_uuid "default" after)
        ; P.MCheck (I.t "view.gallery/compact-size", size = Some "compact",
            fun checked -> if checked then
              Views_db.set_gallery_card_size s.V.view_uuid "compact" after)
        ; P.MCustom (gallery_custom_size inst s.V.view_ent) ]) ]

let rec show_more_menu inst =
  match Ui_services.dom_by_id ("vmore-" ^ string_of_int inst.V.id) with
  | None -> ()
  | Some anchor ->
          let s = V.get inst in
          let gcs = groupable_columns inst in
          let subs =
            List.concat
              [ (if s.V.display_type = "table" then
                   [ P.MSub ((I.t "view.table/columns-visibility"), column_visibility_items inst) ]
                 else [])
              ; (match gcs with
                 | [] -> []
                 | _ ->
                     [ P.MSub
                         ( (I.t "view.table/group-by")
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
                       ( (I.t "view.table/sort-groups-by")
                       , [ mk_group_sort inst "block/journal-day"
                             (I.t "view.table/group-journal-date")
                         ; mk_group_sort inst "block/title" (I.t "view.table/group-page-name")
                         ; mk_group_sort inst "block/updated-at"
                             (I.t "view.table/group-page-updated-date")
                         ; mk_group_sort inst "block/created-at"
                             (I.t "view.table/group-page-created-date") ] ) ]
                 else [])
              ; (if s.V.group_by <> None then
                   let desc =
                     match s.V.group_desc with
                     | Some d -> d
                     | None -> true
                   in
                   [ P.MSub
                       ( (I.t "view.table/sort-groups-order")
                       , [ P.MCheck
                             ( (I.t "view.table/descending"), desc
                             , fun _ ->
                                 V.persist_group_desc inst true;
                                 refresh inst )
                         ; P.MCheck
                             ( (I.t "view.table/ascending"), not desc
                             , fun _ ->
                                 V.persist_group_desc inst false;
                                 refresh inst ) ] ) ]
                 else [])
              ]
          in
          ignore
            (P.show_menu ~anchor ~align_end:true
               (gallery_menu_items inst @ subs
                @ [ P.MItem ((I.t "view/export-edn"), fun () -> (V.ops ()).V.o_export inst)
                  ]))

and mk_group_sort inst ident label =
  P.MCheck
    ( label
    , (V.get inst).V.group_sort_by = Some ident
    , fun _ ->
        V.persist_group_sort_by_ident inst ident (fun () -> refresh inst) )

let more_actions_el inst : t =
  action_button
    ~label:(I.t "ui/show-more")
    ~accessibility_identifier:("vmore-" ^ string_of_int inst.V.id)
    ~on_press:(fun _ -> show_more_menu inst)
    [ icon ~name:(`app "dots") ~point_size:18 [] ]

(* ---------- display type ---------- *)

(* toolbar-legal: one ghost button whose icon follows display_type —
   the old jtrigger/select-item box stack wasn't a control kind *)
let display_type_el inst : t =
 fun ctx parent ->
  let wrap_id = "vtype-" ^ string_of_int inst.V.id in
  action_button
    ~accessibility_identifier:wrap_id
    ~label:(I.t "property.built-in/view-type")
    ~on_press:(fun _ ->
      match Ui_services.dom_by_id wrap_id with
      | Some anchor ->
          let set dt =
            V.update inst (fun s -> { s with V.display_type = dt });
            V.persist_display_type inst;
            refresh inst
          in
          ignore
            (P.show_menu ~anchor ~align_end:true
               [ P.MItem ((I.t "property.view-type/table"), fun () -> set "table")
               ; P.MItem ((I.t "property.view-type/list"), fun () -> set "list")
               ; P.MItem ((I.t "property.view-type/gallery"), fun () -> set "gallery") ])
      | None -> ())
    [ icon ~point_size:18
        ~name:(reactive (fun (s : V.vstate) ->
          Icons.name_ref (match s.V.display_type with
            | "list" -> "list" | "gallery" -> "layout-grid" | _ -> "table"))
          (sig_of inst)) [] ]
    ctx parent

(* ---------- search ---------- *)

(* Search keeps its trigger while expanded. ButtonGroup is admitted by
   Toolbar and preserves the reference's zero-gap search controls. *)
let search_items inst : t list =
  let deb = Ui_services.timers_debounce 300 in
  let input_id = "vsearch-" ^ string_of_int inst.V.id in
  let open_cond ctx =
    Logseq_el.own ctx
      (Signal.map (fun (s : V.vstate) -> s.V.search_open) (sig_of inst))
  in
  [ ghost_btn "search" ~title_:(I.t "cmdk.action/search")
      ~on_click:(fun () ->
        if not (V.get inst).V.search_open then begin
          V.update inst (fun s -> { s with V.search_open = true });
          ignore
            (Ui_services.timers_timeout
               (fun () ->
                 match Ui_services.dom_by_id input_id with
                 | Some el -> el.Ui_services.focus ()
                 | None -> ())
               0)
        end)
  ; (fun ctx parent ->
     (* DOM-only keydown lost its Escape-closes-search path — no
        component event maps it *)
     if_ ~test:(open_cond ctx)
       ((* input, not search_field: a native search box paints its own
           clear control — with the manual x ghost_btn below that made
           two *)
        Ui_components.with_props
          [ Ui_components.Prop.font_size "0.875rem"
          ; Ui_components.Prop.focus_shadow "none" ]
          (Ui_components.input ~accessibility_identifier:input_id
             ~placeholder:(I.t "view.filter/type-to-search")
             ~text:(reactive (fun (s : V.vstate) -> s.V.input) (sig_of inst))
             ~width:183 ~height:28 ~autofocus:true ~border_width:0
             ~background:"transparent" ~padding_horizontal:12 ~padding_vertical:0
             ~on_input:(fun ev ->
               match ev with
               | L.TextChanged (_, v) ->
                   let view_uuid = (V.get inst).V.view_uuid in
                   V.update inst (fun s -> { s with V.input = v });
                   deb (fun () ->
                       let s = V.get inst in
                       if not (Signal.scope_is_disposed ctx.Lui_ui.ui_scope)
                          && s.V.search_open && s.V.view_uuid = view_uuid
                          && s.V.input = v then refresh inst)
               | _ -> ())
             []))
       ctx parent)
  ; (fun ctx parent ->
     if_ ~test:(open_cond ctx)
       (ghost_btn "x" ~title_:(I.t "ui/close") ~on_click:(fun () ->
          V.update inst (fun s ->
              { s with V.input = ""; search_open = false });
          refresh inst))
       ctx parent)
  ]

let search_el inst : t =
  button_group ~style_class:"view-action-search" ~gap:0 ~cross:`center
    ~background:"transparent" ~border_width:0 ~corner_radius:0
    (search_items inst)

(* ---------- filters row ---------- *)

let filter_value_label inst (f : V.filter_clause) =
  match f.V.c_val with
  | Some (W.Keyword "empty") -> (I.t "view.filter/empty")
  | Some (W.Set [] | W.Array [] | W.List []) -> I.t "view/all"
  | Some v -> (
      match v with
      | W.Date_ms ms ->
          let f = Dates.fields (Int64.to_float ms) in
          Printf.sprintf "%04d-%02d-%02d" f.year f.month f.day
      | W.Map _ -> Option.value (Wr.ref_title v) ~default:""
      | W.Uuid u -> (V.ops ()).V.o_title_of_uuid inst u
      | W.Array xs | W.Set xs | W.List xs ->
          String.concat ", "
            (List.map
               (fun x ->
                 match x with
                 | W.Map _ -> Option.value (Wr.ref_title x) ~default:""
                 | W.Uuid uuid -> (V.ops ()).V.o_title_of_uuid inst uuid
                 | _ -> Wr.prop_text x)
               xs)
      | _ -> Wr.prop_text v)
  | None -> (I.t "view/all")

type filter_editor = Choices | Text | Number | Range

let filter_editor = function
  | "text-contains" | "text-not-contains" -> Text
  | "number-gt" | "number-lt" | "number-gte" | "number-lte" -> Number
  | "between" -> Range
  | _ -> Choices

let input_number draft =
  match float_of_string_opt (String.trim draft) with
  | Some number when Float.is_finite number -> Some number
  | _ -> None

let operand_number = function
  | None | Some W.Nil -> None
  | Some (W.Int number) -> Some (float_of_int number)
  | Some (W.Float number) when Float.is_finite number -> Some number
  | _ -> invalid_arg "Numeric filter operand is not a finite number"

let filter_input inst idx entry editor : t =
 fun context parent ->
  let operand clause slot =
    if editor<>Range then clause.V.c_val
    else match clause.V.c_val with
      | None -> None
      | Some (W.Array values | W.List values | W.Set values) -> List.nth_opt values slot
      | _ -> invalid_arg "Range filter operand is not a collection" in
  let field_text = function None | Some W.Nil -> "" | Some value -> Wr.prop_text value in
  let field slot =
    let _,initial=Signal.get entry in
    let draft=Signal.state context.Lui_ui.ui_scheduler (field_text (operand initial slot)) in
    let placeholder=if editor=Range then Some (I.t (if slot=0 then "view.filter/from" else "view.filter/to")) else None in
    Ui_components.with_props
      [Ui_components.Prop.font_size "14px";Ui_components.Prop.line_height "20px";
       Ui_components.Prop.focus_shadow "none"]
      (Ui_components.input ~key:("filter-input-" ^ string_of_int slot)
        ~accessibility_identifier:(Printf.sprintf "vchip-input-%d-%d-%d" inst.V.id idx slot)
        ?placeholder ~autofocus:(editor=Range && slot=0)
        ~width:96 ~height:24 ~border_width:0 ~padding_vertical:0 ~padding_horizontal:12
        ~text:(reactive (fun (_,clause) draft ->
          let value=operand clause slot in
          let matches=if editor=Text then value=Some (W.String draft)
            else operand_number value=input_number draft in
          if matches then draft else field_text value) entry (Signal.value draft))
        ~on_input:(function
          | L.TextChanged (_,text) ->
              Signal.set draft text;
              let _,clause=Signal.get entry in
              let value=if editor=Text then Some (W.String text)
                else Option.map (fun number -> W.Float number) (input_number text) in
              let value=if editor<>Range then value
                else
                  let endpoints=List.init 2 (fun index ->
                    if index=slot then Option.value value ~default:W.Nil
                    else Option.value (operand clause index) ~default:W.Nil) in
                  if List.for_all ((=) W.Nil) endpoints then None else Some (W.Array endpoints) in
              let state=V.get inst in
              set_filters inst (List.mapi (fun index previous ->
                if index=idx then {previous with V.c_val=value} else previous) state.V.filters) state.filters_or
          | _ -> ()) []) in
  (if editor=Range then row ~gap:0 ~cross:`center [field 0;field 1] else field 0) context parent

let filter_chip inst (entry : ((string * int) * V.filter_clause) Signal.signal) : t =
 fun context parent ->
  let (_,idx),f=Signal.get entry in
  let normalization=Ui_effect.request () in
  let change_operator property operator =
    let current_view = V.current_view inst in
    if Ui_effect.alive context.Lui_ui.ui_scope then begin
      let _,current=Signal.get entry in
      let ticket=Ui_effect.issue normalization in
      let opts=filter_options inst
        [W.kw "operator",W.Keyword operator;
         W.kw "value",Option.value current.c_val ~default:W.Nil] in
      Views_db.get_view_filter_data ~opts property (fun response ->
        let state=V.get inst in
        if Ui_effect.alive context.Lui_ui.ui_scope
           && current_view ()
           && Ui_effect.is_current normalization ticket
           && (match List.nth_opt state.V.filters idx with
               | Some clause -> clause=current | None -> false) then begin
          let value=match W.get response "value-after-operator-change" with
            | Some W.Nil -> None | Some value -> Some value
            | None -> invalid_arg "Filter operator response lacks its normalized value" in
          set_filters inst (List.mapi (fun index clause ->
            if index=idx then {clause with V.c_op=operator;c_val=value} else clause)
            state.V.filters) state.filters_or
        end)
    end in
  let prop_title (s : V.vstate) =
    match List.find_opt (fun c -> c.V.c_id = f.V.c_prop) s.V.columns with
    | Some c -> c.V.c_name
    | None -> f.V.c_prop
  in
  let op_btn_id =
    "vchip-op-" ^ string_of_int inst.V.id ^ "-" ^ string_of_int idx
  in
  let value_btn_id="vchip-value-" ^ string_of_int inst.V.id ^ "-" ^ string_of_int idx in
  row ~cross:`center ~style_class:"ls-vf-chip"
      ~border_width:1 ~border_color:"hsl(var(--border))"
      ~corner_radius:4 ~min_width:0
      ~data_attrs:[ ("style", "max-width:100%") ]
    [ (* per-side borders ride the data_attrs style channel *)
      Ui_components.with_props
        [ Ui_components.Prop.font_size "12px";Ui_components.Prop.line_height "16px"
        ; Ui_components.Prop.disabled_opacity 0.5 ]
        (Ui_components.button ~variant:`ghost ~text:(reactive prop_title (sig_of inst)) ~disabled:true ~padding_horizontal:8
           ~height:28 ~min_height:28 ~padding_vertical:4 ~corner_radius:0
           ~data_attrs:
             [ ("style", "border-right:1px solid hsl(var(--border))") ]
           [])
    ; Ui_components.with_props
        [ Ui_components.Prop.font_size "12px";Ui_components.Prop.line_height "16px" ]
        (Ui_components.button ~variant:`ghost ~padding_horizontal:8
           ~height:28 ~min_height:28 ~padding_vertical:4 ~corner_radius:0
           ~data_attrs:
             [ ("style", "border-right:1px solid hsl(var(--border))") ]
           ~accessibility_identifier:op_btn_id
           ~text:(reactive (fun (_,clause) -> I.operator_text clause.V.c_op) entry)
           ~on_press:(fun _ ->
            match Ui_services.dom_by_id op_btn_id with
            | None -> ()
            | Some anchor ->
                let prop =
                  match
                    List.find_opt (fun c -> c.V.c_id = f.V.c_prop) (V.get inst).V.columns
                  with
                  | Some { V.c_prop = Some m; _ } -> m
                  | _ -> W.Map [ (W.kw "db/ident", W.Keyword f.V.c_prop) ]
                in
                let current_view = V.current_view inst in
                Views_db.get_view_filter_data ~opts:(filter_options inst []) prop (fun data ->
                    if Ui_effect.alive context.Lui_ui.ui_scope && current_view () then begin
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
                                , fun () -> change_operator prop op ))
                            ops))
                    end))
        [])
    ; reactive ~equal:(fun (_,a) (_,b) -> filter_editor a.V.c_op=filter_editor b.V.c_op)
      (fun (_,clause) -> match filter_editor clause.V.c_op with
      | Text | Number | Range as editor -> filter_input inst idx entry editor
      | Choices -> Ui_components.with_props
        [ Ui_components.Prop.font_size "12px";Ui_components.Prop.line_height "16px" ]
      (Ui_parts.string_prop Lui_protocol.AccessibilityLabel
        ~value:(reactive (fun (_,clause) _ -> filter_value_label inst clause) entry (sig_of inst))
      (Ui_components.button ~variant:`ghost ~min_width:0 ~padding_horizontal:8
        ~height:28 ~min_height:28 ~padding_vertical:4 ~corner_radius:0
        ~accessibility_identifier:value_btn_id
        ~on_press:(fun _ ->
          match Ui_services.dom_by_id value_btn_id with
          | None -> ()
          | Some anchor ->
              let column=match List.find_opt (fun column -> column.V.c_id=f.c_prop) (V.get inst).V.columns with
                | Some column -> column
                | None -> Option.get (Views_table.column_of_ident (V.get inst) f.c_prop) in
              filter_value_phase inst ~anchor ~index:idx column)
        ~data_attrs:
          [ ( "style"
            , "max-width:100%;border-right:1px solid hsl(var(--border))" ) ]
        [ text ~value:(reactive (fun (_,clause) _ -> filter_value_label inst clause) entry (sig_of inst))
            ~min_width:0 ~white_space:"nowrap" ~text_overflow:"ellipsis" [] ]))) entry
    ; Ui_components.button ~variant:`ghost ~size:`icon ~icon:(`app "x") ~label:(I.t "ui/delete")
        ~padding_horizontal:4 ~padding_vertical:4 ~height:28 ~min_height:28 ~width:26 ~min_width:26 ~corner_radius:0
        ~foreground:"hsl(var(--muted-foreground))"
        ~on_press:(fun _ ->
          V.update inst (fun s ->
              { s with
                V.filters =
                  List.filteri (fun i _ -> i <> idx) s.V.filters
              });
          V.persist_filters inst;
          refresh inst)
        [] ] context parent

let filters_row ?(margin_bottom=0) inst : t =
 fun ctx parent ->
  if Ui_services.env_publishing () then Logseq_el.nothing ctx parent else
  (if_ ~test:(reactive (fun state -> state.V.filters<>[]) (sig_of inst))
         (row ~style_class:"filters-row" ~cross:`center
             ~main:`space_between ~gap:16 ~padding_vertical:8 ~min_width:0 ~margin_bottom
             ~flex_wrap:`wrap
             ~data_attrs:[ ("style", "max-width:100%") ]
           [ row ~cross:`center ~gap:8 ~min_width:0 ~flex_wrap:`wrap
               ~data_attrs:[ ("style", "max-width:100%") ]
               [keyed ~source:(reactive (fun state -> List.mapi (fun index clause -> (state.V.view_uuid,index),clause) state.V.filters) (sig_of inst))
                  ~key:(fun (index,clause) -> index,clause.V.c_prop) ~cmp:Stdlib.compare
                  ~mount:(filter_chip inst)]
           ; if_ ~test:(reactive (fun state -> List.length state.V.filters>1) (sig_of inst))
                (* ls-vf-logic keeps its class for the .75->1 opacity
                   hooks; the box chrome migrated to props *)
                (Ui_components.with_props
                  [ Ui_components.Prop.font_size "0.875rem" ]
                  (select ~style_class:"ls-vf-logic"
                     ~height:24 ~padding_horizontal:8
                     ~background:"transparent" ~border_width:1
                     ~border_color:"hsl(var(--border))"
                     ~text:(reactive (fun state -> if state.V.filters_or then I.t "view.filter/match-any-filter" else I.t "view.filter/match-all-filters") (sig_of inst))
                     [ menu_item ~text:(I.t "view.filter/match-all-filters") ~selected:(reactive (fun state -> not state.V.filters_or) (sig_of inst))
                         ~on_press:(fun _ ->
                           V.update inst (fun s ->
                               { s with V.filters_or = false });
                           V.persist_filters inst;
                           refresh inst)
                         []
                     ; menu_item ~text:(I.t "view.filter/match-any-filter") ~selected:(reactive (fun state -> state.V.filters_or) (sig_of inst))
                         ~on_press:(fun _ ->
                           V.update inst (fun s ->
                               { s with V.filters_or = true });
                           V.persist_filters inst;
                           refresh inst)
                         [] ]))
           ]))
    ctx parent

(* ---------- linked-references include/exclude (cljs
   reference_filters.cljs filter-dialog) ---------- *)

(* filter-cog color: success includes only, error excludes only,
   warning both (cljs :reference/page-filter icon classes) *)
(* ---------- linked-references filters (include/exclude pages) ---------- *)

(* refetches the owner page's includes/excludes + the unfiltered
   [:block-ref-count] total — the filter-cog icon state and the
   items-count/total suffix in the tab both read these *)
(* [~count] refetches [:block-ref-count]. That walk visits every
   referring datom (~1s on a hub page), so the first view load must
   not request it: it used to sit ahead of view-data on the
   single-threaded worker and the reference rows waited on it.
   Filter edits opt in. The page-side extras kick requests the count
   after the first get-blocks has returned. *)
let load_ref_filters ?(on_done = fun () -> ()) ?(count = false) inst =
  let current = V.current_view inst in
  let on_error () =
    if current () then
      V.update inst (fun s -> { s with V.loading = false; view_error = Some "" })
  in
  match V.owner_uuid inst with
  | Some uuid ->
      Views_db.pull_ref_filters ~on_error uuid (fun (inc, exc) ->
        if current () then begin
          V.update inst (fun s ->
              { s with V.ref_includes = inc; ref_excludes = exc });
          on_done () end);
      if count then
        Views_db.snapshots
          ~on_error
          ~f:(fun snap ->
            if current () then
            match Views_db.snapshot_value snap (Views_db.key_ref_count uuid) with
            | Some (W.Int n) ->
                V.update inst (fun s -> { s with V.refs_total = n })
            | _ -> ())
          [ Views_db.resource_ref_count uuid ]
  | None -> ()

(* page-handler/db-based-save-filter! — click toggles include,
   shift-click toggles exclude; clicking an active filter removes it *)
let save_ref_filter ?(on_done = fun () -> ()) inst ~title ~incl ~add =
  let current = V.current_view inst in
  match V.owner_uuid inst with
  | None -> ()
  | Some uuid ->
      let lc = String.lowercase_ascii (Str_util.trim title) in
      V.resolve_name_id lc (fun eid ->
        if current () then
          match eid with
          | Some eid ->
              Views_db.save_ref_filter ~current uuid
                ~prop:
                  (if incl then Views_db.includes_prop
                   else Views_db.excludes_prop)
                ~ref_eid:eid ~add (fun () ->
                  if current () then begin
                  load_ref_filters ~count:true ~on_done inst;
                  refresh inst end)
          | None -> ())

let refs_cog_class (s : V.vstate) =
  match s.V.ref_includes <> [], s.V.ref_excludes <> [] with
  | true, false -> " text-success"
  | false, true -> " text-error"
  | true, true -> " text-warning"
  | false, false -> ""

let ref_filter_dialog inst anchor =
  let input_id = "vrfsearch-" ^ string_of_int inst.V.id in
  let lc s = String.lowercase_ascii (Str_util.trim s) in
  P.show_custom ~anchor ~align_end:true
    ~cls:"ui__dropdown-menu-content"
    (fun context parent ->
      let sched = context.Lui_ui.ui_scheduler in
      let draft = Signal.state sched "" in
      let query = Signal.state sched "" in
      (* bumped whenever include/exclude filters change so the chips
         and ref rows re-render *)
      let gen = Signal.state sched 0 in
      let deb = Ui_services.timers_debounce 200 in
      let combined =
        Signal.map2 (fun q g -> (q, g)) (Signal.value (query))
          (Signal.value (gen))
      in
      let ref_button title count_opt =
        Ui_components.with_props
          [ Ui_components.Prop.font_size "0.75rem" ]
          ((* ls-ref-btn keeps its class as the imperative hook *)
           Ui_components.with_props
             [ ( Ui_components.Prop.hover_border
                   "var(--ls-secondary-text-color, \
                    hsl(var(--muted-foreground)))" ) ]
             (Ui_components.button ~variant:`ghost ~border_width:1 ~corner_radius:6
                ~padding_vertical:2 ~padding_horizontal:8
                ~background:"transparent" ~style_class:"ls-ref-btn"
                ~foreground:"inherit"
                ~border_color:"var(--ls-border-color, hsl(var(--border)))"
             ~on_press_detail:(fun ev ->
               (* cljs ref-button: add? = ref in neither filter; include?
                  = new click -> not shift, existing -> its current
                  column so delete-property-value targets the right
                  property *)
               match ev with
               | Lui_protocol.PressDetail (_, d) ->
                 let s = V.get inst in
                 let lcr = lc title in
                 let included =
                   List.exists (fun (n, _) -> n = lcr) s.V.ref_includes
                 in
                 let excluded =
                   List.exists (fun (n, _) -> n = lcr) s.V.ref_excludes
                 in
                 let not_in_filters = (not included) && not excluded in
                 save_ref_filter inst ~title
                   ~incl:
                     (if not_in_filters then
                        not (d.Lui_protocol.modifiers land 2 <> 0)
                      else included)
                   ~add:not_in_filters
                   ~on_done:(fun () ->
                     Signal.set gen (Signal.get_state gen + 1))
               | _ -> ())
             ([ text ~value:title [] ]
              @
              match count_opt with
              | Some n ->
                [ text ~as_:`Sup ~value:(" " ^ string_of_int n) [] ]
              | None -> [])))
      in
      let chip_row label xs =
        row ~cross:`center ~flex_wrap:`wrap
          (text ~value:label ~font_weight:500 ~padding_vertical:4
             ~data_attrs:[ ("style", "margin-right:0.25rem") ] []
           :: List.map (fun (_, title) -> ref_button title None) xs)
      in
      let chip_rows =
        reactive
          (fun (_q, _g) ->
            let s = V.get inst in
            D.fragment
              ((if s.V.ref_includes <> [] then
                  [ chip_row (I.t "reference.filter/includes")
                      s.V.ref_includes ]
                else [])
               @
               if s.V.ref_excludes <> [] then
                 [ chip_row (I.t "reference.filter/excludes")
                     s.V.ref_excludes ]
                 else []))
          combined
      in
      let ref_rows =
        reactive
          (fun (q, _g) ->
            let s = V.get inst in
            let in_filters n =
              List.exists
                (fun (x, _) -> x = lc n)
                (s.V.ref_includes @ s.V.ref_excludes)
            in
            let refs =
              s.V.ref_pages_count
              |> List.filter (fun (t, _) -> not (in_filters t))
              |> fun xs ->
              if q = "" then xs
              else
                Fuzzy.fuzzy_search ~extract:fst ~limit:100 xs q
                |> List.stable_sort (fun (_, a) (_, b) -> compare b a)
            in
            if refs = [] then D.nothing
            else
              row ~cross:`center ~gap:8 ~width:500 ~max_width:500
                ~data_attrs:[ ("style", "flex-wrap:wrap") ]
                (List.map (fun (t, n) -> ref_button t (Some n)) refs))
          combined
      in
      (column ~style_class:"ls-filters filters" ~padding:16
         ~min_width:320 ~max_width:500
         [ row ~cross:`start ~gap:16
             ~data_attrs:[ ("style", "padding-bottom:0.5rem") ]
             [ row ~cross:`center ~main:`center
                 ~width:40 ~height:40 ~min_width:40 ~corner_radius:9999
                 ~background:
                   "var(--ls-tertiary-background-color, \
                    rgba(0, 0, 0, 0.06))"
                 ~foreground:
                   "var(--ls-secondary-text-color, \
                    hsl(var(--muted-foreground)))"
                 [ icon ~name:(Icons.name_ref "filter") ~point_size:20
                     ~style_class:"ls-icon-filter" [] ]
             ; column
                 [ heading ~level:3 ~font_size:"1.125rem"
                     ~line_height:"1.5rem" ~font_weight:500
                     ~value:(I.t "reference.filter/title") []
                 ; text ~font_size:"0.75rem"
                     ~value:(I.t "reference.filter/directions") [] ]
             ]
         ; (* cp__filters keeps its class — the :empty rule is a
              leftover hook *)
           column ~style_class:"cp__filters" ~margin_bottom:16
             ~margin_left:8 [ chip_rows ]
         ; row ~cross:`center ~gap:8 ~padding_vertical:4
             ~padding_horizontal:8 ~corner_radius:6
             ~style_class:"cp__filters-input-panel"
             ~foreground:
               "var(--ls-secondary-text-color, hsl(var(--muted-foreground)))"
             [ icon ~name:(Icons.name_ref "search")
                 ~style_class:"ls-icon-search" []
             ; Ui_components.with_props
                 [ Ui_components.Prop.focus_shadow "none" ]
                 (Ui_components.input ~style_class:"cp__filters-input"
                    ~grow:1. ~background:"transparent" ~border_width:0
                    ~text:(reactive Fun.id (Signal.value draft))
                    ~data_attrs:
                      [ ("type", "text")
                      ; ("id", input_id)
                      ; ( "placeholder"
                        , I.t "reference.filter/search-placeholder" ) ]
                    ~autofocus:true
                    ~on_input:(function
                      | L.TextChanged (_, v) ->
                          Signal.set draft v;
                          deb (fun () ->
                            if not (Signal.scope_is_disposed context.Lui_ui.ui_scope)
                            then Signal.set query v)
                      | _ -> ())
                    []) ]
         ; (* ls-filters-refs keeps its class — the :empty rule is a
              leftover hook *)
           box ~style_class:"ls-filters-refs" ~margin_top:16 [ ref_rows ] ])
        context parent)

let refs_filter_btn inst : t =
 fun ctx parent ->
  Ui_parts.class_signal
    (Logseq_el.own ctx
       (Signal.map (fun (s : V.vstate) -> refs_cog_class s) (sig_of inst)))
    (fun c -> c)
    (action_button ~label:(I.t "reference/page-filter")
       ~accessibility_identifier:("vrefcog-" ^ string_of_int inst.V.id)
       ~on_press:(fun _ ->
         match
           Ui_services.dom_by_id ("vrefcog-" ^ string_of_int inst.V.id)
         with
         | Some a -> ref_filter_dialog inst a
         | None -> ())
       [ icon ~name:(Icons.name_ref "filter-cog") ~point_size:18 [] ])
    ctx parent

(* ---------- head ---------- *)

(* cljs view-head fades actions/tabs to opacity-75, lit on hover —
   restored via the G7 pattern (Signal.state + ~opacity on pointer
   enter/leave, also the only hover channel on the native backends);
   refs sections hide actions entirely until the head is hovered or a
   popup is open (opacity-0, was .ls-refs) *)
let render_head inst : t =
 fun ctx parent ->
  if Ui_services.env_publishing () then
    Ui_components.with_props [ Ui_components.Prop.overflow `hidden ]
      (row ~style_class:"ls-view-head" ~gap:8 ~cross:`center
         ~main:`space_between ~height:28 ~min_width:0 ~grow:1.
      [ keyed ~source:(reactive (fun (s : V.vstate) -> s.V.views) (sig_of inst))
          ~key:(fun (v : Wr.view_ent) -> v.Wr.vu) ~cmp:String.compare
          ~mount:(fun vs ->
            Ui_components.button ~variant:`ghost
              ~text:(reactive (fun (v : Wr.view_ent) -> V.display_title v) vs)
              ~on_press:(fun _ ->
                V.update inst (fun s -> V.apply_view_entity s (Signal.get vs));
                refresh inst) [])
      ; text ~value:(reactive (fun s -> I.live_query (count_of s)) (sig_of inst)) []
      ; search_el inst ]) ctx parent
  else
  let sched = ctx.Lui_ui.ui_scheduler in
  let is_refs =
    match inst.V.kind with
    | V.KLinkedRefs | V.KUnlinkedRefs -> true
    | _ -> false
  in
  let has_add_object =
    match inst.V.kind with
    | V.KTagPage _ | V.KPropertyPage _ -> (
        match !Runtime.current_page with
        | Some p -> p.Model.page_add_object
        | None -> false)
    | _ -> false
  in
  let popup_open = P.open_signal sched in
  (* Views_popup's open_st is a global singleton — its owner is
     whichever scheduler created it first, so map2 inputs must both
     live on popup_open's scheduler, not this ctx's *)
  let hover = Signal.state (Signal.signal_owner popup_open) false in
  (* lit = head hovered || a popup is open; the same opacity derivation
     drives .view-actions and .ls-add-view *)
  let op =
    Logseq_el.own ctx
      (Signal.map2
         (fun h open_ ->
           let lit = h || open_ in
           if is_refs then if lit then 1. else 0.
           else if lit then 1.
           else 0.75)
         (Signal.value (hover)) popup_open)
  in
  Ui_components.with_props [ Ui_components.Prop.overflow `hidden ]
    (row
    ~on_pointer_enter:(fun _ -> Signal.set hover true; Runtime.flush ())
    ~on_pointer_leave:(fun _ ->
      Signal.set hover false;
      Runtime.flush ())
    ~style_class:
      "ls-view-head"
    ~cross:`center ~main:`space_between ~gap:4
    ~height:28 ~min_width:0 ~grow:1.
    [ row ~style_class:"ls-view-head-left" ~cross:`center ~gap:8
        [ (match inst.V.kind with
           | V.KQuery _ ->
               text ~font_size:"0.875rem" ~font_weight:500
                 ~data_attrs:[ ("style", "opacity:0.5") ]
                 ~value_signal:
                   (Logseq_el.own ctx
                      (Signal.map
                         (fun (s : V.vstate) -> I.live_query (count_of s))
                         (sig_of inst)))
                 []
           | _ -> tabs_el inst ~op) ]
    ; Ui_components.with_props
        [ Ui_components.Prop.transition "opacity 300ms ease-in" ]
        (Ui_components.flat_toolbar ~key:"actions" ~cls:"view-actions"
           ~label:"View actions" ~opacity_signal:op
        ((match inst.V.kind with
          | V.KLinkedRefs -> [ refs_filter_btn inst ]
          | _ -> [])
         @ [ (* cljs (seq sorting): the button reacts to the applied
                view entity — mount-time sorting is [] until load_views
                lands *)
             if_
               ~test:
                 (Logseq_el.own ctx
                    (Signal.map
                       (fun (s : V.vstate) -> s.V.sorting <> [])
                       (sig_of inst)))
               (action_button ~label:(I.t "view.table/sort-groups-by")
                  ~accessibility_identifier:
                    ("vsort-" ^ string_of_int inst.V.id)
                  ~on_press:(fun _ ->
                    match
                      Ui_services.dom_by_id
                        ("vsort-" ^ string_of_int inst.V.id)
                    with
                    | Some a -> sorting_popup inst a
                    | None -> ())
                  [ icon ~name:(Icons.name_ref "arrows-up-down") ~point_size:18 [] ])
           ; action_button ~label:(I.t "view.filter/filter")
               ~accessibility_identifier:
                 ("vfilter-" ^ string_of_int inst.V.id)
               ~on_press:(fun _ ->
                 match
                   Ui_services.dom_by_id
                     ("vfilter-" ^ string_of_int inst.V.id)
                 with
                 | Some a -> filter_popup inst a
                 | None -> ())
               [ icon ~name:(Icons.name_ref "filter") ~point_size:18 [] ]
           ]
         @ [ search_el inst ]
         @ [ display_type_el inst; more_actions_el inst ]
         @ (if has_add_object then
              [ ghost_btn "plus" ~title_:(I.t "node/new")
                  ~on_click:(fun () -> (V.ops ()).V.o_add_object inst) ]
            else []))) ])
    ctx parent
