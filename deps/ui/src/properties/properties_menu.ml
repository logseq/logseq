(* Property config dropdown — .ls-property-dropdown opened from a row's
   .property-k (or the property page's "Configure" button). Mirrors
   property/config.cljs: name edit, type change, node tags, default
   value, available choices, cardinality, ui-position, hide toggles,
   delete-from-node. *)

open Promise_ext
open Lui_elements
module D = Properties_data
module S = Properties_state
module W = Wire

(* owner context for the row the menu was opened from *)
type menu_ctx =
  { owner_uuid : string (* entity uuid the property lives on *)
  ; owner_id : int option
  ; owner_is_tag : bool (* owner entity is a class/tag *)
  ; owner_title : string
  ; has_owner : bool (* false on the property page: no owner block *)
  ; refresh : unit -> unit
  ; row : W.t
  }

(* imperative-shape menu item as a [t] — callers (the table header's
   sort/pin options) build these and prepend them via ~more_options *)
let menuitem ?(cls = "") ?icon label act : t =
  Ui_components.menu_item ~text:label ~style_class:cls
    ?icon:(Option.map Icons.name_ref icon)
    ~on_press:(fun _ -> act ()) []

let menu_root_class =
  "ui__dropdown-menu-content ls-property-dropdown"

let prop_uuid m = D.entity_uuid_of (D.row_prop m.row)
let prop_ident m = D.row_ident m.row |> Option.value ~default:""
let prop_title m = D.row_title m.row
let prop_entity m = D.row_prop m.row
let prop_type m = D.row_type m.row
let closed_values m = D.row_closed_values m.row

(* cljs dropdown-editor-menuitem .inner-wrap: title (opacity .9) on the
   left; desc (text-xs, opacity .5) or a sm switch on the right *)
let config_trailing ?desc ?desc_el ?toggle ?(chevron = false) ?(forbid = false) title
    : t =
  row ~grow:1. ~main:`space_between ~cross:`center ~gap:4
    ([ Ui_components.with_props
         [ Ui_components.Prop.white_space `nowrap
         ; Ui_components.Prop.opacity 0.9 ]
         (text ~value:title []) ]
     @ (match desc_el, desc with
        | Some element, _ -> [element]
        | None, Some d when d <> "" ->
            [ Ui_components.with_props
                [ Ui_components.Prop.font_size "0.75rem"
                ; Ui_components.Prop.line_height "1rem"
                ; Ui_components.Prop.opacity 0.5
                ; Ui_components.Prop.white_space `nowrap ]
                (text ~value:d []) ]
        | _ -> [])
     @ (match toggle with
        | Some on ->
            [ switch_ ~style_class:"ui__switch" ~width:32 ~height:18
                ~padding:3 ~border_width:0 ~corner_radius:9
                ~background:
                  (if on then "hsl(var(--primary))" else "hsl(var(--input))")
                ~foreground:"hsl(var(--background))" ~checked:on [] ]
        | None -> [])
     @ (if forbid then
          [ Ui_components.with_props [ Ui_components.Prop.opacity 0.4 ]
              (icon ~name:(`app "forbid-2") ~point_size:15 []) ]
        else [])
     @
     if chevron then
       [ Ui_components.with_props [ Ui_components.Prop.opacity 0.3 ]
           (icon ~name:(`app "chevron-right") ~point_size:16 []) ]
     else [])

let config_item ~icon_name ~title ?desc ?desc_el ?toggle ?chevron ?min_height ~on_press () : t =
  (* a menu_item without text needs an accessibility label *)
  Ui_components.with_props [ Ui_components.Prop.accessibility_label title ]
    (Ui_components.menu_item ~icon:(Icons.name_ref icon_name) ?min_height ~on_press
       [ config_trailing ?desc ?desc_el ?toggle ?chevron title ])

(* dropdown-menu-sub: trigger row with desc + chevron, items in a
   popover at the trigger's right edge *)
let config_sub ?(padding = 4) ~icon_name ~title ?desc items : t =
 fun context parent ->
  let open_ = Signal.state context.Lui_ui.ui_scheduler false in
  (Ui_components.with_props [ Ui_components.Prop.accessibility_label title ]
   @@ Ui_components.menu_item ~icon:(Icons.name_ref icon_name)
     ~on_press:(fun _ ->
       Runtime.signal_set open_ (not (Runtime.signal_get open_)))
     ~on_pointer_enter:(fun _ -> Runtime.signal_set open_ true)
     [ config_trailing ?desc ~chevron:true title
     ; if_ ~test:(Signal.value open_)
         (popover ~target:(Anchor { side = `right; source = Parent;
                    align = `start; offset = (-4.); align_offset = 0. }) ~role:`menu ~min_width:128 ~padding
            ~background:"hsl(var(--popover))"
            ~border_color:"hsl(var(--border))" ~border_width:1
            ~corner_radius:6 ~transition:Ui_components.popover_transition
            ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
            [ column ~gap:0 items ])
     ])
    context parent

(* ----- type sub-pane ----- *)

let type_names =
  [ ("default", "property/type-text"); ("number", "property/type-number")
  ; ("date", "property/type-date")
  ; ("datetime", "property/type-datetime")
  ; ("checkbox", "property/type-checkbox"); ("url", "property/type-url")
  ; ("node", "property/type-node"); ("asset", "property/type-asset") ]

(* ----- ui-position sub-pane ----- *)

let positions =
  [ ("properties"
    , "property/ui-position-properties")
  ; ("block-left"
    , "property/ui-position-block-left")
  ; ("block-right"
    , "property/ui-position-block-right")
  ; ("block-below"
    , "property/ui-position-block-below") ]

(* ---------- declarative menu view ---------- *)

(* The same config menu as a [Lui_elements.t]: a role=menu popover
   anchored under the owning row's stack, with form panes swapped in
   place (name edit, choices list, default value) and type/ui-position
   as native submenus. A dropdown_menu only accepts MenuItem/MenuTrigger/
   Divider children, so the pane-swapping column needs a popover.
   [close] releases the caller's open signal. *)

type menu_pane =
  | MMain
  | MName
  | MChoices
  | MDefaultValue
  | MNodeTags
  | MEditChoice of W.t

(* cljs: the type is locked (forbid icon, no submenu) once the property
   has values *)
let rec type_submenu m ~close : t =
 fun context parent ->
  let used = Signal.state context.Lui_ui.ui_scheduler false in
  ignore
    (let* values =
       D.property_values ~property_ident:(prop_ident m)
         ~block:(D.uuid_ref m.owner_uuid)
     in
     if Ui_effect.alive context.Lui_ui.ui_scope then
       Runtime.signal_set used (W.elems values <> []);
     Js.Promise.resolve ());
  let desc = Option.map I18n.t (List.assoc_opt (prop_type m) type_names) in
  (reactive
     (fun locked ->
       if locked then
         Ui_components.with_props
           [ Ui_components.Prop.accessibility_label (I18n.t "property/type") ]
           (Ui_components.menu_item ~icon:(Icons.name_ref "letter-t") ~disabled:true
              [ config_trailing ?desc ~forbid:true (I18n.t "property/type") ])
       else type_sub_open m ~close ?desc ())
     (Signal.value used))
    context parent

and type_sub_open m ~close ?desc () =
  config_sub ~icon_name:"letter-t" ~title:(I18n.t "property/type") ?desc
    (List.map
       (fun (ty, label_key) ->
         Ui_components.menu_item ~text:(I18n.t label_key)
           ~checked:(prop_type m = ty)
           ~on_press:(fun _ ->
             ignore
               (D.upsert_property_no_name ~ident:(prop_ident m)
                  ~schema:
                    (W.Map
                       [ ( W.Keyword "logseq.property/type"
                         , W.Keyword ty )
                       ])
                  ());
             S.refresh_all ();
             close ())
           [] )
       type_names)

let position_submenu m ~close =
  config_sub ~icon_name:"float-left" ~title:(I18n.t "property/ui-position")
    ?desc:(match D.getf (prop_entity m) "logseq.property/ui-position" with
           | Some _ ->
               Option.map I18n.t (List.assoc_opt (D.row_position m.row) positions)
           | None -> None)
    (List.map
       (fun (pos, label_key) ->
         Ui_components.menu_item ~text:(I18n.t label_key)
           ~on_press:(fun _ ->
             match prop_uuid m with
             | Some pu ->
                 ignore
                   (D.set_block_property ~block_uuid:pu
                      ~ident:"logseq.property/ui-position"
                      ~value:(W.Keyword pos));
                 S.refresh_all ();
                 close ()
             | None -> ())
           [])
       positions)

let supports_position m =
  List.mem (prop_type m) ["default"; "number"; "date"; "checkbox"; "node"]
  && not (List.mem (prop_ident m)
    ["logseq.property.class/extends"; "logseq.property.class/properties";
     "logseq.property/enable-history?"; "block/title"; "block/tags";
     "block/created-at"; "block/updated-at"])
  && not (prop_type m = "default" && closed_values m = []
    && D.row_position m.row = "properties")

(* delete confirmation as a semantic dialog on the view-overlay stack *)
let delete_confirm_dialog context m ~close =
  let title = I18n.t "property/delete-from-node" in
  let desc =
    I18n.t1
      (if m.owner_is_tag then "property/delete-from-tag-confirm"
       else "property/delete-from-node-confirm")
      (prop_title m)
  in
  let dismiss _ =
    S.pop_view_overlay context
  in
  let confirm () =
    S.pop_view_overlay context;
    if D.row_is_class_schema m.row || m.owner_is_tag then
      ignore
        (D.class_remove_property ~class_uuid:m.owner_uuid
           ~ident:(prop_ident m))
    else
      ignore
        (D.remove_block_property ~block_uuid:m.owner_uuid
           ~ident:(prop_ident m));
    S.refresh_all ();
    close ()
  in
  Ui_components.dialog ~text:title ~description:desc ~on_dismiss:dismiss
    [ Ui_components.button ~text:(I18n.t "ui/cancel") ~variant:`outline
        ~on_press:dismiss []
    ; Ui_components.button ~text:(I18n.t "ui/confirm") ~variant:`destructive
        ~on_press:(fun _ -> confirm ()) []
    ]

(* title/desc form for name pane + choice editing *)
let text_form_view ~title_v ~desc_v ~title_placeholder ~desc_placeholder
    on_save : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let title_st = Signal.state sched title_v in
  let desc_st = Signal.state sched desc_v in
  let changed title desc =
    String.trim title <> String.trim title_v
    || String.trim desc <> String.trim desc_v
  in
  (column ~gap:8 ~padding:8
    [ Ui_components.text_field ~placeholder:title_placeholder
        ~text:(reactive Fun.id (Signal.value title_st))
        ~on_input:(fun ev ->
          match ev with
          | t -> Signal.set title_st t)
        []
    ; Ui_components.textarea ~placeholder:desc_placeholder
        ~text:(reactive Fun.id (Signal.value desc_st))
        ~on_input:(fun text -> Signal.set desc_st text)
        []
    ; row ~main:`end_
        [ Ui_components.button ~variant:`primary ~text:(I18n.t "ui/save")
            ~disabled:(reactive (fun title desc -> not (changed title desc))
              (Signal.value title_st) (Signal.value desc_st))
            ~on_press:(fun _ ->
              let title = Runtime.signal_get title_st
              and desc = Runtime.signal_get desc_st in
              if changed title desc then on_save title desc)
            []
        ]
    ])
    context parent

let name_pane_view m ~close : t =
  let desc_v =
    match D.getf (prop_entity m) "logseq.property/description" with
    | Some d -> D.ref_title d
    | None -> ""
  in
  text_form_view ~title_v:(prop_title m) ~desc_v
    ~title_placeholder:(I18n.t "property/name-placeholder")
    ~desc_placeholder:(I18n.t "property/description-placeholder")
    (fun new_name new_desc ->
      let new_name = String.trim new_name
      and new_desc = String.trim new_desc in
      if new_name <> "" then (
        (if new_name <> String.trim (prop_title m) then
           ignore
             (D.upsert_property ~ident:(prop_ident m) ~schema:(W.Map [])
                ~property_name:new_name ()));
        (match prop_uuid m with
         | Some pu when new_desc <> "" && new_desc <> String.trim desc_v ->
             ignore
               (D.set_block_property ~block_uuid:pu
                  ~ident:"logseq.property/description"
                  ~value:(W.String new_desc))
         | _ -> ());
        S.refresh_all ();
        close ()))

(* choices pane: scrollable list + add + per-choice edit *)
let choices_pane_view m ~set_pane ~close : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let choices_st : W.t list Signal.state = Signal.state sched [] in
  let refetch () =
    ignore
      (let* w = D.closed_values (W.Keyword (prop_ident m)) in
       Runtime.signal_set choices_st (W.elems w);
       Js.Promise.resolve ())
  in
  refetch ();
  (* per-choice settings submenu (cljs "More settings" popover):
     edit, set-as-default, tag scoping, delete *)
  let choice_children choice =
    let cid = D.entity_id_of choice in
    let scoped_ids =
      match D.getf choice "logseq.property/choice-classes" with
      | Some w -> List.filter_map D.entity_id_of (W.elems w)
      | None -> []
    in
    let owner_scoped =
      match m.owner_id with
      | Some oid -> List.mem oid scoped_ids
      | None -> false
    in
    let scoped_elsewhere = scoped_ids <> [] && not owner_scoped in
    [ Ui_components.dropdown_menu_item ~text:(I18n.t "ui/edit")
        ~on_press:(fun _ ->
          Runtime.signal_set set_pane (MEditChoice choice))
        []
    ]
    @ (match prop_type m, scoped_elsewhere, prop_uuid m, cid with
       | ("default" | "number"), false, Some pu, Some cid ->
           [ Ui_components.dropdown_menu_item ~text:(I18n.t "property/set-default-choice")
               ~on_press:(fun _ ->
                 ignore
                   (D.set_block_property ~block_uuid:pu
                      ~ident:"logseq.property/default-value"
                      ~value:(W.Int cid));
                 S.refresh_all ();
                 close ())
               []
           ]
       | _ -> [])
    @ (match m.owner_is_tag, m.owner_id, cid with
       | true, Some owner_id, Some cid ->
           [ Ui_components.dropdown_menu_item
               ~text:(I18n.t1 "property/hide-for-tag" m.owner_title)
               ~on_press:(fun _ ->
                 ignore
                   (D.set_block_property ~block_uuid:m.owner_uuid
                      ~ident:"logseq.property/choice-exclusions"
                      ~value:(W.Int cid));
                 S.refresh_all ();
                 close ())
               []
           ]
           @ (if owner_scoped then
                [ Ui_components.dropdown_menu_item
                    ~text:
                      (I18n.t1 "property/remove-scope-for-tag"
                         m.owner_title)
                    ~on_press:(fun _ ->
                      ignore
                        (D.set_choice_scope ~choice_id:cid
                           ~class_id:owner_id ~add:false);
                      S.refresh_all ();
                      close ())
                    []
                ]
              else if scoped_ids <> [] then
                [ Ui_components.dropdown_menu_item
                    ~text:
                      (I18n.t1 "property/use-choice-in-tag"
                         m.owner_title)
                    ~on_press:(fun _ ->
                      ignore
                        (D.set_choice_scope ~choice_id:cid
                           ~class_id:owner_id ~add:true);
                      S.refresh_all ();
                      close ())
                    []
                ]
              else [])
       | _ -> [])
    @ (match D.entity_uuid_of choice with
       | Some cu ->
           [ Ui_components.dropdown_menu_item ~variant:`destructive ~text:(I18n.t "ui/delete")
               ~on_press:(fun _ ->
                 ignore
                   (D.delete_closed_value ~ident:(prop_ident m)
                      ~choice_uuid:cu);
                 S.refresh_all ();
                 close ())
               []
           ]
       | None -> [])
  in
  (column ~gap:0
     [ scroll ~max_height:240
         [ (* scroll children overlay each other (lui-scroll > * is grid
              1/1) — the keyed choices stack inside a single column *)
           column ~key:"choices"
             [ keyed
                 ~source:(Signal.value choices_st)
             ~key:(fun c ->
               Option.value (D.entity_uuid_of c) ~default:(D.ref_title c))
             ~cmp:String.compare
             ~mount:(fun c_sig ->
               Ui_components.submenu ~text:(D.ref_title (Signal.get c_sig))
                 (choice_children (Signal.get c_sig))) ]
         ]
     ; Ui_components.menu_item ~icon:(`app "plus") ~text:(I18n.t "property/add-choice")
         ~on_press:(fun _ ->
           (* the add form replaces the pane body *)
           Runtime.signal_set set_pane (MEditChoice (W.Map [])))
         []
     ])
    context parent

let edit_choice_view m choice ~set_pane ~close : t =
  let is_add = D.entity_uuid_of choice = None in
  let title_v = if is_add then "" else D.ref_title choice in
  text_form_view ~title_v ~desc_v:""
    ~title_placeholder:(I18n.t "property/title-placeholder")
    ~desc_placeholder:(I18n.t "property/description-placeholder")
    (fun v _d ->
      if String.trim v <> String.trim title_v then
      if is_add then (
        (* creating a choice while the owner is a tag scopes it to
           that class (cljs ->closed-choice-scope-opts) *)
        let scoped =
          match m.owner_is_tag, m.owner_id with
          | true, Some id -> Some id
          | _ -> None
        in
        ignore
          (let* _ =
             D.upsert_closed_value ~ident:(prop_ident m) ~value:v
               ?scoped_class_id:scoped ()
           in
           Js.Promise.resolve ());
        S.refresh_all ();
        close ())
      else (
        ignore
          (let* _ =
             D.upsert_closed_value ~ident:(prop_ident m)
               ?choice_id:(D.entity_uuid_of choice) ~value:v ()
           in
           Js.Promise.resolve ());
        S.refresh_all ();
        Runtime.signal_set set_pane MChoices))

let node_tags_view m : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let scope = context.Lui_ui.ui_scope in
  let repo = Runtime.repo () in
  let current () = Ui_effect.alive scope && Runtime.repo () = repo in
  let classes = Signal.state sched [] in
  let selected = Signal.state sched
    (match D.getf (prop_entity m) "logseq.property/classes" with
     | Some values -> List.filter_map D.entity_uuid_of (W.elems values)
     | None -> []) in
  let saving = Signal.state sched false in
  let save make_class =
    if current () && not (Runtime.signal_get saving) then begin
      Runtime.signal_set saving true;
      ignore ((let* c = make_class () in
        if not (current ()) then Js.Promise.resolve () else
        let uuid = Option.get (D.entity_uuid_of c) in
        let chosen = Runtime.signal_get selected in
        let add = not (List.mem uuid chosen) in
        let* _ = D.transact
          [W.List [W.Keyword (if add then "db/add" else "db/retract");
            D.uuid_ref (Option.get (prop_uuid m));
            W.Keyword "logseq.property/classes"; D.uuid_ref uuid]] in
        if current () then begin
          Runtime.signal_set selected
            (if add then uuid :: chosen else List.filter ((<>) uuid) chosen);
          if not (List.exists (fun item -> D.entity_uuid_of item = Some uuid)
                    (Runtime.signal_get classes)) then
            Runtime.signal_set classes (Runtime.signal_get classes @ [c]);
          Runtime.signal_set saving false
        end;
        S.refresh_all ();
        Js.Promise.resolve ())
        |> Js.Promise.catch (fun _ ->
          if current () then Runtime.signal_set saving false;
          Ui_services.log_error_message "[properties] node tag update failed";
          Js.Promise.resolve ()))
    end in
  ignore (let* values = D.all_classes () in
    if current () then Runtime.signal_set classes (W.elems values);
    Js.Promise.resolve ());
  let new_tag title = save (fun () ->
    let* result = D.create_class title in
    let uuid = Option.get (D.create_result_uuid result) in
    Js.Promise.resolve (W.Map
      [W.Keyword "block/uuid", W.Uuid uuid;
       W.Keyword "block/title", W.String title])) in
  (column ~gap:4 ~min_width:240
    [ reactive (fun values ->
            let items = List.filter_map (fun c ->
              Option.map (fun uuid ->
                Properties_select.item ~key:uuid (D.ref_title c) (fun () ->
                  save (fun () -> Js.Promise.resolve c))) (D.entity_uuid_of c)) values in
            Properties_select.view ~placeholder:(I18n.t "property/choose-tags")
              ~compact:true ~selected_keys:(Signal.value selected)
              ~new_option:new_tag items) (Signal.value classes) ]) context parent

let supports_default_value m =
  List.mem (prop_type m) ["default"; "number"; "checkbox"]
  && not (D.row_many m.row)
  && closed_values m = []
  && prop_ident m <> "logseq.property/enable-history?"

let multiple_values_item m ~close : t =
 fun context parent ->
  let many = D.row_many m.row in
  let used = Signal.state context.Lui_ui.ui_scheduler None in
  ignore (let* values = D.property_values ~property_ident:(prop_ident m)
    ~block:(D.uuid_ref m.owner_uuid) in
    if Ui_effect.alive context.Lui_ui.ui_scope then
      Runtime.signal_set used (Some (W.elems values <> []));
    Js.Promise.resolve ());
  let save () =
    ignore (let* _ = D.upsert_property_no_name ~ident:(prop_ident m)
      ~schema:(W.Map [(W.Keyword "db/cardinality", W.Keyword (if many then "one" else "many"))]) () in
      S.refresh_all ();
      Js.Promise.resolve ())
  in
  (Ui_components.with_props [ Ui_components.Prop.accessibility_label (I18n.t "property/multiple-values") ]
   @@ Ui_components.menu_item ~icon:(Icons.name_ref "checks")
     ~disabled:(reactive (function None -> true | Some used -> many && used) (Signal.value used))
     ~on_press:(fun _ ->
       match Runtime.signal_get used with
       | None | Some true when many -> ()
       | None -> ()
       | Some used ->
           close ();
           if used then
             Dialogs_state.ask ~title:(I18n.t "property/multiple-values")
               ~desc:(I18n.t "property/multiple-values-confirm") ~on_confirm:save ()
           else save ())
     [ config_trailing ~toggle:many (I18n.t "property/multiple-values") ])
    context parent

let default_value_pane_view m ~close : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let editing = Signal.state sched false in
  let buffer = Signal.state sched "" in
  (column ~gap:0
     [ if_ ~test:(Logseq_el.own context (Signal.map (fun e -> not e) (Signal.value editing)))
         (Ui_components.menu_item ~text:(I18n.t "property/set-default-value")
            ~on_press:(fun _ -> Runtime.signal_set editing true) [])
     ; if_ ~test:(Signal.value editing)
         (Ui_components.text_field ~autofocus:true
            ~text:(reactive Fun.id (Signal.value buffer))
            ~on_input:(fun ev ->
              match ev with
              | t -> Signal.set buffer t)
            ~on_submit:(fun _ ->
              match prop_uuid m with
              | Some pu ->
                  ignore
                    (D.create_property_text_block ~block_uuid:pu
                       ~ident:"logseq.property/default-value"
                       ~title:(Runtime.signal_get buffer)
                       ~new_block_id:(Ui_services.env_random_uuid ()) ());
                  S.refresh_all ();
                  close ()
              | None -> ())
            [])
     ])
    context parent

(* the config items of the main pane — shared by menu_view (in-tree
   anchor) and open_menu (element anchor); [context] is needed for the
   delete item's view-overlay confirm dialog *)
(* cljs checkbox-state-mapping: pick the choice an unchecked / checked
   checkbox maps to (logseq.property/choice-checkbox-state false/true) *)
let checkbox_mapping_item m ~close : t =
  let choices = closed_values m in
  let state_of c =
    match D.getf (D.untag c) "logseq.property/choice-checkbox-state" with
    | Some (W.Bool b) -> Some b
    | _ -> None
  in
  let pick state c =
    match D.entity_uuid_of c with
    | Some cu ->
        ignore
          (let* _ =
             D.set_block_property ~block_uuid:cu
               ~ident:"logseq.property/choice-checkbox-state"
               ~value:(W.Bool state)
           in
           let* _ =
             Js.Promise.all
               (Array.of_list
                  (List.filter_map
                     (fun other ->
                       match D.entity_uuid_of other with
                       | Some ou when ou <> cu && state_of other = Some state ->
                           Some
                             (D.remove_block_property ~block_uuid:ou
                                ~ident:"logseq.property/choice-checkbox-state")
                       | _ -> None)
                     choices))
           in
           S.refresh_all ();
           Js.Promise.resolve ());
        close ()
    | None -> ()
  in
  (* cljs shui/select h-8 per state: trigger shows the mapped choice
     or the placeholder, choices open below it *)
  let select_for key state : t =
   fun context parent ->
    let open_ = Signal.state context.Lui_ui.ui_scheduler false in
    let current = List.find_opt (fun c -> state_of c = Some state) choices in
    (column ~key:("cbm-" ^ key) ~gap:8
       [ text ~value:(I18n.t key) []
       ; box ~key:("cbm-w-" ^ key)
           [ select ~key:("cbm-s-" ^ key)
               ?text:(Option.map D.ref_title current)
               ~placeholder:(I18n.t "property/select-choice")
               ~container_relative_frame:`horizontal ~height:32
               ~corner_radius:6 ~background:"hsl(var(--background))"
               ~border_width:1 ~border_color:"hsl(var(--input))"
               ~on_press:(fun _ ->
                 Runtime.signal_set open_ (not (Runtime.signal_get open_)))
               []
           ; if_ ~test:(Signal.value open_)
               (popover ~target:(Anchor { side = `below; source = Parent;
                          align = `start; offset = 4.; align_offset = 0. }) ~role:`menu ~min_width:128 ~padding:4
                  ~background:"hsl(var(--popover))"
                  ~border_color:"hsl(var(--border))" ~border_width:1
                  ~corner_radius:6
                  ~transition:Ui_components.popover_transition
                  ~on_dismiss:(fun _ -> Runtime.signal_set open_ false)
                  [ column ~gap:0
                      (List.map
                         (fun c ->
                           Ui_components.menu_item ~text:(D.ref_title c)
                             ~checked:(state_of c = Some state)
                             ~on_press:(fun _ -> pick state c) [])
                         choices) ])
           ]
       ])
      context parent
  in
  config_sub ~icon_name:"checkbox"
    ~title:(I18n.t "property/checkbox-state-mapping")
    [ Ui_components.with_props [ Ui_components.Prop.font_size "0.875rem" ]
        (column ~gap:16 ~padding:8 ~width:159
           [ select_for "property/map-unchecked-to" false
           ; select_for "property/map-checked-to" true ]) ]

(* cljs: owner menu toggle adding the property to the owner's
   logseq.property/checkbox-display-properties *)
let show_as_checkbox_item m ~close : t =
 fun context parent ->
  let checked = Signal.state context.Lui_ui.ui_scheduler false in
  let prop_id = D.entity_id_of (prop_entity m) in
  let ref_id w =
    match D.untag w with
    | W.Int i -> Some i
    | W.Map _ as e -> D.geti e "db/id"
    | _ -> None
  in
  ignore
    (let* owner = D.entity_by_uuid m.owner_uuid in
     let ids =
       match D.getf (D.untag owner) "logseq.property/checkbox-display-properties" with
       | Some w -> List.filter_map ref_id (W.elems w)
       | None -> []
     in
     if Ui_effect.alive context.Lui_ui.ui_scope then
       Runtime.signal_set checked
         (match prop_id with Some id -> List.mem id ids | None -> false);
     Js.Promise.resolve ());
  let title =
    I18n.t
      (if m.owner_is_tag then "property/show-as-checkbox-on-tagged-nodes"
       else "property/show-as-checkbox-on-node")
  in
  (reactive
     (fun on ->
       Ui_components.with_props [ Ui_components.Prop.accessibility_label title ]
         (Ui_components.menu_item ~icon:(Icons.name_ref "checkbox")
            ~on_press:(fun _ ->
              match prop_id with
              | Some id ->
                  let ident = "logseq.property/checkbox-display-properties" in
                  ignore
                    (if on then
                       D.delete_property_value ~block_uuid:m.owner_uuid ~ident
                         ~value:(W.Int id)
                     else
                       D.set_block_property ~block_uuid:m.owner_uuid ~ident
                         ~value:(W.Int id));
                  S.refresh_all ();
                  close ()
              | None -> ())
            [ config_trailing ~toggle:on title ]))
     (Signal.value checked))
    context parent

let main_items context m ~set_pane ~close =
  let toggle_view label ident_key =
    let current = D.getb (prop_entity m) ident_key in
    Ui_components.with_props [ Ui_components.Prop.accessibility_label label ]
    @@ Ui_components.menu_item ~icon:(Icons.name_ref "eye-off")
      ~on_press:(fun _ ->
        match prop_uuid m with
        | Some pu ->
            ignore
              (D.set_block_property ~block_uuid:pu ~ident:ident_key
                 ~value:(W.Bool (not current)));
            S.refresh_all ();
            close ()
        | None -> ())
      [ config_trailing ~toggle:current label ]
  in
  let sep k = Menu_item.separator ~key:("cfg-sep-" ^ k) ~mv:8 ~mh:0 in
  let name_description = Ui_components.with_props
    [Ui_components.Prop.font_size "0.75rem"; Ui_components.Prop.line_height "1rem";
     Ui_components.Prop.opacity 0.5]
    (row ~cross:`center ~gap:4
      (Option.fold ~none:[] ~some:(fun icon -> [Icon_picker.icon_el ~size:15. icon])
         (Node_icon.own (prop_entity m))
       @ [text ~value:(prop_title m) []])) in
  [ config_item ~icon_name:"pencil" ~title:(I18n.t "property/name")
      ~desc_el:name_description ~chevron:true ~min_height:44
      ~on_press:(fun _ -> Runtime.signal_set set_pane MName) ()
    ; type_submenu m ~close
    ]
    @ (if prop_type m = "node" then
         [ config_item ~icon_name:"hash"
             ~title:(I18n.t "property/specify-node-tags")
             ~on_press:(fun _ -> Runtime.signal_set set_pane MNodeTags) () ]
       else [])
    @ (if supports_default_value m then
       let title = I18n.t "property/default-value" in
       let desc = if prop_type m = "checkbox" then None else
         Some (match D.getf (prop_entity m) "logseq.property/default-value" with
           | Some value -> D.ref_title value
           | None -> I18n.t "property/set-value") in
       [ Ui_components.with_props [Ui_components.Prop.accessibility_label title]
         (Ui_components.menu_item ~icon:(Icons.name_ref "settings-2")
          ~checked:(prop_type m = "checkbox"
            && D.getb (prop_entity m) "logseq.property/scalar-default-value")
          ~on_press:(fun _ ->
            if prop_type m = "checkbox" then begin
              ignore (let* _ = D.set_block_property
                ~block_uuid:(Option.get (prop_uuid m))
                ~ident:"logseq.property/scalar-default-value"
                ~value:(W.Bool (not (D.getb (prop_entity m)
                  "logseq.property/scalar-default-value"))) in
                S.refresh_all ();
                Js.Promise.resolve ());
              close ()
            end else Runtime.signal_set set_pane MDefaultValue)
          [config_trailing ?desc ~chevron:(prop_type m <> "checkbox") title]) ]
       else [])
    @ (if D.row_supports_choices m.row then
      [ config_item ~icon_name:"list"
          ~title:(I18n.t "property/available-choices")
          ~desc:(match closed_values m with
                 | [] -> ""
                 | vs -> I18n.t1 "property/choices-count"
                           (string_of_int (List.length vs)))
          ~chevron:true
          ~on_press:(fun _ -> Runtime.signal_set set_pane MChoices) ()
      ] else [])
    @ (if D.row_supports_choices m.row
          && List.length (closed_values m) >= 2 then
      [ checkbox_mapping_item m ~close ] else [])
    @ (if D.row_supports_many m.row then
      [ multiple_values_item m ~close ] else [])
    @ [ sep "position" ]
    @ (if supports_position m then [position_submenu m ~close] else [])
    @ [ toggle_view (I18n.t "property/hide-by-default")
          "logseq.property/hide?"
      ; toggle_view (I18n.t "property/hide-empty-value")
          "logseq.property/hide-empty-value"
      ]
    (* cljs: go-to / delete only when opened for an owner block *)
    @ (if not m.has_owner then [] else
      [ sep "owner"
      ; Ui_components.menu_item ~icon:(Icons.name_ref "share-3")
          ~text:(I18n.t "property/go-to-this-property")
          ~on_press:(fun _ ->
            (match prop_uuid m with
             | Some u ->
                 Runtime.mark_nav ();
                 Ui_services.nav_set_hash
                   (Runtime.nav_hash ("#/page/" ^ u))
             | None -> ());
            close ())
          [] ]
    @ (if D.row_supports_choices m.row
          && List.length (closed_values m) >= 2 then
         [ show_as_checkbox_item m ~close ] else [])
    @ [ Ui_components.menu_item ~variant:`destructive ~icon:(Icons.name_ref "x")
          ~text:
            (I18n.t
               (if m.owner_is_tag then "property/delete-from-tag"
                else "property/delete-from-node"))
          ~on_press:(fun _ ->
            S.push_view_overlay context ~key:"property-delete"
              ~view:(delete_confirm_dialog context m ~close)
              ~on_escape:(fun () -> ()))
          []
      ])

(* the pane-swapping body shared by menu_view (in-tree anchor) and
   open_menu (element anchor): MMain lists more_options + the config
   items, the other panes swap in place. The signal lives inside the
   component so imperative openers need no ui_context *)
let menu_body_view ~more_options ~with_title m ~close : t =
 fun context parent ->
  let pane = Signal.state context.Lui_ui.ui_scheduler MMain in
  (reactive
     (fun p ->
        (* stable root: same-kind prop diffs across reactive branches
           emit unsupported set-prop ops on native *)
        column ~gap:0
          [ (match p with
             | MMain ->
                 column ~gap:0
                   ((if with_title then
                       [ Ui_components.with_props
                           [ Ui_components.Prop.padding_vertical 8
                           ; Ui_components.Prop.padding_horizontal 8
                           ; Ui_components.Prop.opacity 0.8 ]
                           (text ~style_class:"ls-menu-h3"
                              ~value:(I18n.t "property/configure") []) ]
                     else [])
                    @ more_options
                    @ main_items context m ~set_pane:pane ~close)
             | MName -> name_pane_view m ~close
             | MChoices -> choices_pane_view m ~set_pane:pane ~close
             | MEditChoice c -> edit_choice_view m c ~set_pane:pane ~close
             | MDefaultValue -> default_value_pane_view m ~close
             | MNodeTags -> node_tags_view m)
          ])
     (Signal.value pane))
    context parent

let menu_view ~owner_uuid ~owner_id ~owner_is_tag ~owner_title ~refresh
    ~close row : t =
 fun context parent ->
  let has_owner = true in
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; has_owner; refresh; row }
  in
  (popover ~target:(Anchor { side = `below; source = Parent;
             align = `start; offset = 4.0; align_offset = 0. }) ~role:`menu
     ~style_class:menu_root_class ~width:Ui_components.property_menu_width
     ~padding:Ui_components.property_menu_padding ~foreground:"inherit"
     ~transition:Ui_components.popover_transition
     ~on_dismiss:(fun _ -> close ())
     [ menu_body_view ~more_options:[] ~with_title:false m ~close ])
    context parent

(* Open the dropdown anchored to a clicked element (property-k) — the
   anchored-opener twin of menu_view: same body, positioned by the
   anchor's rect. `more_options` items lead the config items — cljs
   prepends the table header's sort/pin options and hides the
   Configure title. *)
let open_menu ~(anchor : Ui_services.el) ~owner_uuid ~owner_id
    ~owner_is_tag ~owner_title ~refresh ?(more_options = [])
    ?(with_title = true) ?(has_owner = true) ?anchor_alignment row =
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; has_owner; refresh; row }
  in
  let close = ref (fun () -> ()) in
  let content =
    menu_body_view ~more_options ~with_title m
      ~close:(fun () -> !close ())
  in
  let key =
    Properties_popup.open_anchored ~role:`menu ~cls:menu_root_class
      ~width:Ui_components.property_menu_width ~padding:Ui_components.property_menu_padding
      ~fill_available:true ?anchor_alignment anchor content
  in
  close := (fun () -> S.remove_view_overlay key)
