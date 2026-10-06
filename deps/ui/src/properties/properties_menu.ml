(* Property config dropdown — .ls-property-dropdown opened from a row's
   .property-k (or the property page's "Configure" button). Mirrors
   property/config.cljs: name edit, type change, node tags, default
   value, available choices, cardinality, ui-position, hide toggles,
   delete-from-node. *)

open Promise_ext
open Web_dom
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
  ; mutable content : Web_dom.el option (* current dropdown body *)
  }

let menuitem ?(cls = "") ?icon label act =
  let el =
    mk "div"
      ~cls:(Menu_item.base_cls ^ " " ^ cls)
      ~attrs:Menu_item.item_attrs
  in
  (match icon with
   | Some name ->
       let inner = mk ~cls:"menu-item-icon-row" "div" in
       let s = mk ~cls:("ui__icon ti ls-icon-" ^ name) "span" in
       (match tabler_svg_el ~size:15. name with
        | Some svg -> el_append_child s svg
        | None -> el_append_child s (mk ~cls:("ti ti-" ^ name) "i"));
       el_append_child inner s;
       let t = mk "div" in
       el_set_text_content t label;
       el_append_child inner t;
       el_append_child el inner
   | None ->
       let t = mk "div" in
       el_set_text_content t label;
       el_append_child el t);
  on_click el (fun _ -> act ());
  el

let prop_uuid m = D.entity_uuid_of (D.row_prop m.row)
let prop_ident m = D.row_ident m.row |> Option.value ~default:""
let prop_title m = D.row_title m.row
let prop_entity m = D.row_prop m.row
let prop_type m = D.row_type m.row
let closed_values m = D.row_closed_values m.row

(* ----- sub-pane swap: replaces the dropdown's body ----- *)

let swap_content m el =
  match m.content with
  | Some body -> el_replace_children body; el_append_child body el
  | None -> ()

let menu_root_class =
  "ls-property-dropdown ui__dropdown-menu-content z-50 min-w-[8rem] \
   rounded-md border bg-popover p-1 text-popover-foreground shadow-md"

(* ----- alert dialog (imperative copy of Page_menu.confirm_view) ----- *)

let alertdialog ~title ~desc ~confirm_label on_confirm =
  let overlay =
    mk ~cls:"ui__alert-dialog-overlay" "div"
  in
  let dlg =
    mk "div"
      ~cls:"ui__alert-dialog-content"
      ~attrs:
        [ ("role", "alertdialog")
        ; ("style", "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%)") ]
  in
  ignore
    (child_text "h2" "ui__alert-dialog-title" title
       dlg);
  ignore
    (child_text "div"
       "ui__alert-dialog-description" desc
       dlg);
  let footer =
    mk ~cls:"ui__alert-dialog-footer" "div"
  in
  let cancel_btn =
    mk "button"
      ~cls:"ui__button ls-btn-outline"
  in
  el_set_text_content cancel_btn (I18n.t "ui/cancel");
  let confirm_btn =
    mk "button"
      ~cls:"ui__button ls-btn-primary"
  in
  el_set_text_content confirm_btn confirm_label;
  el_append_child footer cancel_btn;
  el_append_child footer confirm_btn;
  el_append_child dlg footer;
  el_append_child overlay dlg;
  S.push_overlay overlay ~on_escape:(fun () -> ());
  on_click cancel_btn (fun _ -> S.pop_overlay ());
  on_click confirm_btn (fun _ -> S.pop_overlay (); on_confirm ());
  el_focus confirm_btn

(* ----- name edit pane ----- *)

let name_pane m =
  let pane = mk ~cls:"ls-property-name-edit-pane" "div" in
  let input_wrap =
    mk ~cls:"input-wrap ls-prop-input-wrap" "div"
  in
  let input =
    mk "input"
      ~attrs:[ ("placeholder", I18n.t "property/name-placeholder") ]
  in
  el_set_value input (prop_title m);
  el_append_child input_wrap input;
  let desc =
    mk "textarea" ~cls:"ui__textarea"
      ~attrs:[ ("placeholder", I18n.t "property/description-placeholder") ]
  in
  (match D.getf (prop_entity m) "logseq.property/description" with
   | Some d -> el_set_value desc (D.ref_title d)
   | None -> ());
  let save_btn = mk "button" ~cls:"ui__button" in
  el_set_text_content save_btn (I18n.t "ui/save");
  el_append_child pane input_wrap;
  el_append_child pane desc;
  el_append_child pane save_btn;
  on_click save_btn (fun _ ->
      let new_name = String.trim (el_value input) in
      let new_desc = String.trim (el_value desc) in
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
      S.refresh_all ());
  pane

(* ----- type sub-pane ----- *)

let type_names =
  [ ("default", "property/type-text"); ("number", "property/type-number")
  ; ("date", "property/type-date")
  ; ("datetime", "property/type-datetime")
  ; ("checkbox", "property/type-checkbox"); ("url", "property/type-url")
  ; ("node", "property/type-node"); ("asset", "property/type-asset") ]

let type_pane m =
  let pane = mk ~cls:"ls-property-type-sub-pane" "div" in
  List.iter
    (fun (ty, label_key) ->
      let it =
        menuitem (I18n.t label_key) (fun () ->
            ignore
              (D.upsert_property_no_name ~ident:(prop_ident m)
                 ~schema:(W.Map [ (W.Keyword "logseq.property/type", W.Keyword ty) ])
                 ());
            S.refresh_all ();
            S.close_overlays ())
      in
      el_set_attr it "data-value" ty;
      el_append_child pane it)
    type_names;
  pane

(* ----- ui-position sub-pane ----- *)

let positions =
  [ ("logseq.property.ui-position/properties"
    , "property/ui-position-properties")
  ; ("logseq.property.ui-position/block-left"
    , "property/ui-position-block-left")
  ; ("logseq.property.ui-position/block-right"
    , "property/ui-position-block-right")
  ; ("logseq.property.ui-position/block-below"
    , "property/ui-position-block-below")
  ]

let position_pane m =
  let pane = mk ~cls:"ls-property-ui-position-sub-pane" "div" in
  List.iter
    (fun (pos, label_key) ->
      let it =
        menuitem (I18n.t label_key) (fun () ->
            match prop_uuid m with
            | Some pu ->
                ignore
                  (D.set_block_property ~block_uuid:pu
                     ~ident:"logseq.property/ui-position"
                     ~value:(W.Keyword pos));
                S.refresh_all ();
                S.close_overlays ()
            | None -> ())
      in
      el_set_attr it "data-value" pos;
      el_append_child pane it)
    positions;
  pane

(* ----- choices sub-pane ----- *)

(* "More settings" per-choice dropdown *)
let choice_settings m choice =
  let root =
    mk ~cls:"ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md" "div"
  in
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
  (* Set as default choice — only for default/number types per cljs *)
  (match prop_type m, scoped_elsewhere, prop_uuid m, cid with
   | ("default" | "number"), false, Some pu, Some cid ->
       el_append_child root
         (menuitem (I18n.t "property/set-default-choice") (fun () ->
              ignore
                (D.set_block_property ~block_uuid:pu
                   ~ident:"logseq.property/default-value"
                   ~value:(W.Int cid));
              S.refresh_all ();
              S.close_overlays ()))
   | _ -> ());
  (* tag scoping items — only when the owner is a class/tag *)
  (match m.owner_is_tag, m.owner_id, cid with
   | true, Some owner_id, Some cid ->
       el_append_child root
         (menuitem
            (I18n.t1 "property/hide-for-tag" m.owner_title)
            (fun () ->
              ignore
                (D.set_block_property ~block_uuid:m.owner_uuid
                   ~ident:"logseq.property/choice-exclusions"
                   ~value:(W.Int cid));
              S.refresh_all ();
              S.close_overlays ()));
       if owner_scoped then
         el_append_child root
           (menuitem
              (I18n.t1 "property/remove-scope-for-tag" m.owner_title)
              (fun () ->
                ignore
                  (D.set_choice_scope ~choice_id:cid ~class_id:owner_id
                     ~add:false);
                S.refresh_all ();
                S.close_overlays ()))
       else if scoped_ids <> [] then
         el_append_child root
           (menuitem
              (I18n.t1 "property/use-choice-in-tag" m.owner_title)
              (fun () ->
                ignore
                  (D.set_choice_scope ~choice_id:cid ~class_id:owner_id
                     ~add:true);
                S.refresh_all ();
                S.close_overlays ()))
   | _ -> ());
  (match D.entity_uuid_of choice with
   | Some cu ->
       el_append_child root
         (menuitem ~cls:"del" (I18n.t "ui/delete") (fun () ->
              ignore
                (D.delete_closed_value ~ident:(prop_ident m)
                   ~choice_uuid:cu);
              S.refresh_all ();
              S.close_overlays ()))
   | None -> ());
  root

(* the title/desc create|edit form used for choices *)
let base_edit_form ~title_v ~desc_v on_save =
  let form = mk ~cls:"ls-base-edit-form" "div" in
  let input =
    mk "input"
      ~attrs:[ ("placeholder", I18n.t "property/title-placeholder") ]
  in
  if title_v <> "" then el_set_value input title_v;
  let desc =
    mk "textarea" ~cls:"ui__textarea"
      ~attrs:[ ("placeholder", I18n.t "property/description-placeholder") ]
  in
  if desc_v <> "" then el_set_value desc desc_v;
  let save_btn = mk "button" ~cls:"ui__button" in
  el_set_text_content save_btn (I18n.t "ui/save");
  el_append_child form input;
  el_append_child form desc;
  el_append_child form save_btn;
  on_click save_btn (fun _ ->
      on_save (el_value input) (el_value desc);
      (* the form is always the top overlay — saving closes it *)
      S.pop_overlay ());
  (form, input)

let choice_li m choice rebuild =
  let li = mk "li" in
  let title = D.ref_title choice in
  let strong = mk "strong" ~attrs:[ ("title", title) ] in
  el_set_text_content strong title;
  el_append_child li strong;
  let more =
    mk "button" ~attrs:[ ("title", I18n.t "property/more-settings") ]
  in
  el_set_text_content more "...";
  el_append_child li more;
  on_click strong (fun _ ->
      let form, input =
        base_edit_form ~title_v:title ~desc_v:"" (fun v _d ->
            ignore
              (let* _ =
                D.upsert_closed_value ~ident:(prop_ident m)
                  ?choice_id:(D.entity_uuid_of choice) ~value:v ()
              in
              rebuild ();
              S.refresh_all ();
              Js.Promise.resolve ()))
      in
      ignore
        (Properties_popup.open_anchored ~cls:"ui__popover-content" li
           form);
      el_focus input);
  on_click more (fun _ ->
      ignore
        (Properties_popup.open_anchored more (choice_settings m choice)));
  li

let choices_pane m =
  let pane = mk ~cls:"ls-property-choices-sub-pane" "div" in
  (* refetch on every build — the row's closed-values snapshot is stale
     after add/edit/delete *)
  let rec build () =
    (let* w = D.closed_values (W.Keyword (prop_ident m)) in
    el_replace_children pane;
    let ul = mk ~cls:"choices-list" "ul" in
    (* must overflow-scroll: e2e asserts scrollHeight > clientHeight *)
    set_style ul "max-height:240px;overflow-y:auto";
    List.iter (fun c -> el_append_child ul (choice_li m c build))
      (W.elems w);
    el_append_child pane ul;
    el_append_child pane
      (menuitem (I18n.t "property/add-choice") (fun () ->
           let form, input =
             base_edit_form ~title_v:"" ~desc_v:"" (fun v _d ->
                 (* creating a choice while the owner is a tag scopes
                    it to that class (cljs ->closed-choice-scope-opts) *)
                 let scoped =
                   match m.owner_is_tag, m.owner_id with
                   | true, Some id -> Some id
                   | _ -> None
                 in
                 ignore
                   (let* _ =
                     D.upsert_closed_value ~ident:(prop_ident m)
                       ~value:v ?scoped_class_id:scoped ()
                   in
                   build ();
                   S.refresh_all ();
                   Js.Promise.resolve ());
                 S.refresh_all ())
           in
           ignore
             (Properties_popup.open_anchored
                ~cls:"ui__popover-content" ul form);
           el_focus input));
    Js.Promise.resolve ())
    |> ignore
  in
  build ();
  pane

(* ----- default-value sub-pane ----- *)

let default_value_pane m =
  let pane = mk ~cls:"ls-property-default-value-pane" "div" in
  let btn =
    menuitem (I18n.t "property/set-default-value") (fun () ->
        el_replace_children pane;
        let wrap = mk ~cls:"editor-wrapper" "div" in
        let inner =
          mk ~cls:"editor-inner block-editor" "div"
        in
        let ta = mk "textarea" in
        let mt = mk ~cls:"mock-text" "div" in
        el_set_attr mt "style" Ui_parts.mock_text_style;
        el_append_child inner ta;
        el_append_child inner mt;
        el_append_child wrap inner;
        el_append_child pane wrap;
        el_focus ta;
        el_listen ta "keydown"
          (fun ev ->
            match ev_key ev with
            | "Enter" -> (
                ev_prevent_default ev;
                match prop_uuid m with
                | Some pu ->
                    ignore
                      (D.create_property_text_block ~block_uuid:pu
                         ~ident:"logseq.property/default-value"
                         ~title:(el_value ta)
                         ~new_block_id:(Platform.random_uuid ()) ());
                    (* show the created value block in the pane *)
                    el_replace_children pane;
                    let b = mk ~cls:"ls-block" "div" in
                    ignore
                      (child_text "span" "block-title-wrap"
                         (el_value ta) b);
                    el_append_child pane b;
                    S.refresh_all ()
                | None -> ())
            | "Escape" -> ev_prevent_default ev; ev_stop_propagation ev
            | _ -> ())
          true)
  in
  el_append_child pane btn;
  pane

(* ----- top-level menu ----- *)

let toggle_item m label ident_key =
  let current = D.getb (prop_entity m) ident_key in
  menuitem label (fun () ->
      match prop_uuid m with
      | Some pu ->
          ignore
            (D.set_block_property ~block_uuid:pu ~ident:ident_key
               ~value:(W.Bool (not current)));
          S.refresh_all ();
          S.close_overlays ()
      | None -> ())

let delete_property m =
  alertdialog ~title:(I18n.t "property/delete-from-node")
    ~desc:
      (I18n.t1
         (if m.owner_is_tag then "property/delete-from-tag-confirm"
          else "property/delete-from-node-confirm")
         (prop_title m))
    ~confirm_label:(I18n.t "ui/confirm") (fun () ->
      if D.row_is_class_schema m.row || m.owner_is_tag then
        ignore
          (D.class_remove_property ~class_uuid:m.owner_uuid
             ~ident:(prop_ident m))
      else
        ignore
          (D.remove_block_property ~block_uuid:m.owner_uuid
             ~ident:(prop_ident m));
      S.refresh_all ())

let menu_body ~with_title ~more_options m =
  let body = mk "div" in
  m.content <- Some body;
  (if with_title then begin
     let h3 = mk ~cls:"ls-menu-h3" "h3" in
     el_set_text_content h3 (I18n.t "ui/configure");
     el_append_child body h3
   end);
  List.iter (el_append_child body) more_options;
  el_append_child body
    (menuitem (I18n.t "property/name") (fun () ->
         swap_content m (name_pane m)));
  el_append_child body
    (menuitem (I18n.t "property/type") (fun () ->
         swap_content m (type_pane m)));
  (if prop_type m = "node" then
     el_append_child body
       (menuitem (I18n.t "property/specify-node-tags") (fun () ->
            swap_content m (mk "div"))));
  el_append_child body
    (menuitem (I18n.t "property/default-value") (fun () ->
         swap_content m (default_value_pane m)));
  el_append_child body
    (menuitem (I18n.t "property/available-choices") (fun () ->
         swap_content m (choices_pane m)));
  el_append_child body
    (menuitem (I18n.t "property/multiple-values") (fun () ->
         let many = D.row_many m.row in
         ignore
           (D.upsert_property_no_name ~ident:(prop_ident m)
              ~schema:
                (W.Map
                   [ ( W.Keyword "db/cardinality"
                     , W.Keyword
                         (if many then "one" else "many") )
                   ])
              ());
         S.refresh_all ();
         S.close_overlays ()));
  el_append_child body
    (menuitem (I18n.t "property/ui-position") (fun () ->
         swap_content m (position_pane m)));
  el_append_child body
    (toggle_item m (I18n.t "property/hide-by-default")
       "logseq.property/hide?");
  el_append_child body
    (toggle_item m (I18n.t "property/hide-empty-value")
       "logseq.property/hide-empty-value");
  el_append_child body
    (menuitem (I18n.t "property/go-to-this-property") (fun () ->
         (match prop_uuid m with
          | Some u ->
              Runtime.mark_nav ();
              Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ u))
          | None -> ());
         S.close_overlays ()));
  el_append_child body
    (menuitem ~cls:"del"
       (I18n.t
          (if m.owner_is_tag then "property/delete-from-tag"
           else "property/delete-from-node"))
       (fun () -> delete_property m));
  body

(* Open the dropdown anchored to a clicked element (property-k).
   `more_options` items lead the config menuitems — cljs prepends the
   table header's sort/pin options and hides the Configure title. *)
let open_menu ~anchor ~owner_uuid ~owner_id ~owner_is_tag ~owner_title
    ~refresh ?(more_options = []) ?(with_title = true) row =
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; refresh; row
    ; content = None
    }
  in
  let body = menu_body ~with_title ~more_options m in
  ignore
    (Properties_popup.open_anchored ~cls:menu_root_class anchor body)

(* ---------- declarative menu view ---------- *)

(* The same config menu as a [Lui_elements.t]: a dropdown_menu anchored
   under the owning row's stack, with form panes swapped in place (name
   edit, choices list, default value) and type/ui-position as native
   submenus. [close] releases the caller's open signal. *)

open Lui_elements

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
              on_save (Signal.get_state title_st)
                (Signal.get_state desc_st))
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
         [ keyed
             ~source:(Signal.value choices_st)
             ~key:(fun c ->
               Option.value (D.entity_uuid_of c) ~default:(D.ref_title c))
             ~cmp:String.compare
             ~mount:(fun c_sig ->
               submenu ~text:(D.ref_title (Signal.get c_sig))
                 (choice_children (Signal.get c_sig)))
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
     [ if_ ~test:(Logseq_dom.own context (Signal.map (fun e -> not e) (Signal.value editing)))
         (menu_item ~text:(I18n.t "property/set-default-value")
            ~on_press:(fun _ -> Runtime.signal_set editing true) [])
     ; if_ ~test:(Signal.value editing)
         (text_field ~autofocus:true ?submit_on_enter:Properties_select.submit_on_enter_opt
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
                       ~title:(Signal.get_state buffer)
                       ~new_block_id:(Platform.random_uuid ()) ());
                  S.refresh_all ();
                  close ()
              | None -> ())
            [])
     ])
    context parent

let menu_view ~owner_uuid ~owner_id ~owner_is_tag ~owner_title ~refresh
    ~close row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let pane = Signal.state sched MMain in
  let m =
    { owner_uuid; owner_id; owner_is_tag; owner_title; refresh; row
    ; content = None
    }
  in
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
  let main_items =
    [ menu_item ~text:(I18n.t "property/name")
        ~on_press:(fun _ -> Runtime.signal_set pane MName) []
    ; type_submenu m ~close
    ]
    @ (if prop_type m = "node" then
         [ menu_item ~text:(I18n.t "property/specify-node-tags")
             ~on_press:(fun _ -> Runtime.signal_set pane MNodeTags) []
         ]
       else [])
    @ [ menu_item ~text:(I18n.t "property/default-value")
          ~on_press:(fun _ -> Runtime.signal_set pane MDefaultValue)
          []
      ; menu_item ~text:(I18n.t "property/available-choices")
          ~on_press:(fun _ -> Runtime.signal_set pane MChoices) []
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
                 Platform.set_location_hash
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
  in
  (dropdown_menu ~anchor:`below ~anchor_alignment:`start
     ~anchor_offset:4.0 ~min_width:200
     ~on_dismiss:(fun _ -> close ())
     [ reactive
         (fun p ->
            (* stable root: same-kind prop diffs across reactive branches
               emit unsupported set-prop ops on native *)
            column ~gap:0
              [ (match p with
                 | MMain -> column ~gap:0 main_items
                 | MName -> name_pane_view m ~close
                 | MChoices -> choices_pane_view m ~set_pane:pane ~close
                 | MEditChoice c ->
                     edit_choice_view m c ~set_pane:pane ~close
                 | MDefaultValue -> default_value_pane_view m ~close
                 | MNodeTags -> column ~gap:0 [])
              ])
         (Signal.value pane)
     ])
    context parent
