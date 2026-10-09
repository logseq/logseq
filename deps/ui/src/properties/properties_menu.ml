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
  ; refresh : unit -> unit
  ; row : W.t
  }

(* imperative-shape menu item as a [t] — callers (the table header's
   sort/pin options) build these and prepend them via ~more_options *)
let menuitem ?(cls = "") ?icon label act : t =
  menu_item ~text:label ~style_class:cls
    ?icon:(Option.map Icons.name_ref icon)
    ~on_press:(fun _ -> act ()) []

let menu_root_class =
  "ls-property-dropdown ui__dropdown-menu-content z-50 min-w-[8rem] \
   rounded-md border bg-popover p-1 text-popover-foreground shadow-md"

let prop_uuid m = D.entity_uuid_of (D.row_prop m.row)
let prop_ident m = D.row_ident m.row |> Option.value ~default:""
let prop_title m = D.row_title m.row
let prop_entity m = D.row_prop m.row
let prop_type m = D.row_type m.row
let closed_values m = D.row_closed_values m.row

(* ----- type sub-pane ----- *)

let type_names =
  [ ("default", "property/type-text"); ("number", "property/type-number")
  ; ("date", "property/type-date")
  ; ("datetime", "property/type-datetime")
  ; ("checkbox", "property/type-checkbox"); ("url", "property/type-url")
  ; ("node", "property/type-node"); ("asset", "property/type-asset") ]

(* ----- ui-position sub-pane ----- *)

let positions =
  [ ("logseq.property.ui-position/properties"
    , "property/ui-position-properties")
  ; ("logseq.property.ui-position/block-left"
    , "property/ui-position-block-left")
  ; ("logseq.property.ui-position/block-right"
    , "property/ui-position-block-right")
  ; ("logseq.property.ui-position/block-below"
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

let type_submenu m ~close =
  submenu ~text:(I18n.t "property/type")
    (List.map
       (fun (ty, label_key) ->
         menu_item ~text:(I18n.t label_key)
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
  submenu ~text:(I18n.t "property/ui-position")
    (List.map
       (fun (pos, label_key) ->
         menu_item ~text:(I18n.t label_key)
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
  dialog ~text:title ~description:desc ~on_dismiss:dismiss
    [ button ~text:(I18n.t "ui/cancel") ~variant:`outline
        ~on_press:dismiss []
    ; button ~text:(I18n.t "ui/confirm") ~variant:`destructive
        ~on_press:(fun _ -> confirm ()) []
    ]

(* title/desc form for name pane + choice editing *)
let text_form_view ~title_v ~desc_v ~title_placeholder ~desc_placeholder
    on_save : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let title_st = Signal.state sched title_v in
  let desc_st = Signal.state sched desc_v in
  (column ~gap:8 ~padding:8
    [ text_field ~placeholder:title_placeholder ~text:title_v
        ~on_input:(fun ev ->
          match ev with
          | Lui_protocol.TextChanged (_, t) -> Signal.set title_st t
          | _ -> ())
        []
    ; textarea ~placeholder:desc_placeholder ~text:desc_v
        ~on_input:(fun ev ->
          match ev with
          | Lui_protocol.TextChanged (_, t) -> Signal.set desc_st t
          | _ -> ())
        []
    ; row ~main:`end_
        [ button ~text:(I18n.t "ui/save")
            ~on_press:(fun _ ->
              on_save (Runtime.signal_get title_st)
                (Runtime.signal_get desc_st))
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
      (if new_name <> "" && new_name <> prop_title m then
         ignore
           (D.upsert_property ~ident:(prop_ident m) ~schema:(W.Map [])
              ~property_name:new_name ()));
      (match prop_uuid m with
       | Some pu when new_desc <> "" ->
           ignore
             (D.set_block_property ~block_uuid:pu
                ~ident:"logseq.property/description"
                ~value:(W.String new_desc))
       | _ -> ());
      S.refresh_all ();
      close ())

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
    [ menu_item ~text:(I18n.t "ui/edit")
        ~on_press:(fun _ ->
          Runtime.signal_set set_pane (MEditChoice choice))
        []
    ]
    @ (match prop_type m, scoped_elsewhere, prop_uuid m, cid with
       | ("default" | "number"), false, Some pu, Some cid ->
           [ menu_item ~text:(I18n.t "property/set-default-choice")
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
           [ menu_item
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
                [ menu_item
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
                [ menu_item
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
           [ menu_item ~variant:`destructive ~text:(I18n.t "ui/delete")
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
               submenu ~text:(D.ref_title (Signal.get c_sig))
                 (choice_children (Signal.get c_sig))) ]
         ]
     ; menu_item ~icon:`plus ~text:(I18n.t "property/add-choice")
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

let default_value_pane_view m ~close : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let editing = Signal.state sched false in
  let buffer = Signal.state sched "" in
  (column ~gap:0
     [ if_ ~test:(Logseq_el.own context (Signal.map (fun e -> not e) (Signal.value editing)))
         (menu_item ~text:(I18n.t "property/set-default-value")
            ~on_press:(fun _ -> Runtime.signal_set editing true) [])
     ; if_ ~test:(Signal.value editing)
         (text_field ~autofocus:true
            ~text:""
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, t) -> Signal.set buffer t
              | _ -> ())
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
let main_items context m ~set_pane ~close =
  let toggle_view label ident_key =
    let current = D.getb (prop_entity m) ident_key in
    menu_item ~text:label ~checked:current
      ~on_press:(fun _ ->
        match prop_uuid m with
        | Some pu ->
            ignore
              (D.set_block_property ~block_uuid:pu ~ident:ident_key
                 ~value:(W.Bool (not current)));
            S.refresh_all ();
            close ()
        | None -> ())
      []
  in
  [ menu_item ~text:(I18n.t "property/name")
      ~on_press:(fun _ -> Runtime.signal_set set_pane MName) []
    ; type_submenu m ~close
    ]
    @ (if prop_type m = "node" then
         [ menu_item ~text:(I18n.t "property/specify-node-tags")
             ~on_press:(fun _ -> Runtime.signal_set set_pane MNodeTags)
               [] ]
       else [])
    @ [ menu_item ~text:(I18n.t "property/default-value")
          ~on_press:(fun _ -> Runtime.signal_set set_pane MDefaultValue)
          []
      ; menu_item ~text:(I18n.t "property/available-choices")
          ~on_press:(fun _ -> Runtime.signal_set set_pane MChoices) []
      ; menu_item ~text:(I18n.t "property/multiple-values")
          ~checked:(D.row_many m.row)
          ~on_press:(fun _ ->
            let many = D.row_many m.row in
            ignore
              (D.upsert_property_no_name ~ident:(prop_ident m)
                 ~schema:
                   (W.Map
                      [ ( W.Keyword "db/cardinality"
                        , W.Keyword (if many then "one" else "many") )
                      ])
                 ());
            S.refresh_all ();
            close ())
          []
      ; position_submenu m ~close
      ; toggle_view (I18n.t "property/hide-by-default")
          "logseq.property/hide?"
      ; toggle_view (I18n.t "property/hide-empty-value")
          "logseq.property/hide-empty-value"
      ; menu_item ~text:(I18n.t "property/go-to-this-property")
          ~on_press:(fun _ ->
            (match prop_uuid m with
             | Some u ->
                 Runtime.mark_nav ();
                 Ui_services.nav_set_hash
                   (Runtime.nav_hash ("#/page/" ^ u))
             | None -> ());
            close ())
          []
      ; menu_item ~variant:`destructive
          ~text:
            (I18n.t
               (if m.owner_is_tag then "property/delete-from-tag"
                else "property/delete-from-node"))
          ~on_press:(fun _ ->
            S.push_view_overlay context ~key:"property-delete"
              ~view:(delete_confirm_dialog context m ~close)
              ~on_escape:(fun () -> ()))
          []
      ]

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
                       [ text ~style_class:"ls-menu-h3"
                           ~value:(I18n.t "ui/configure") [] ]
                     else [])
                    @ more_options
                    @ main_items context m ~set_pane:pane ~close)
             | MName -> name_pane_view m ~close
             | MChoices -> choices_pane_view m ~set_pane:pane ~close
             | MEditChoice c -> edit_choice_view m c ~set_pane:pane ~close
             | MDefaultValue -> default_value_pane_view m ~close
             | MNodeTags -> column ~gap:0 [])
          ])
     (Signal.value pane))
    context parent

let menu_view ~owner_uuid ~owner_id ~owner_is_tag ~owner_title ~refresh
    ~close row : t =
 fun context parent ->
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; refresh; row }
  in
  (popover ~anchor:`below ~anchor_alignment:`start ~role:`menu
     ~anchor_offset:4.0 ~min_width:200
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
    ?(with_title = true) row =
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; refresh; row }
  in
  let close = ref (fun () -> ()) in
  let content =
    menu_body_view ~more_options ~with_title m
      ~close:(fun () -> !close ())
  in
  let key =
    Properties_popup.open_anchored ~cls:menu_root_class anchor content
  in
  close := (fun () -> S.remove_view_overlay key)
