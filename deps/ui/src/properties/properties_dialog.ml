(* .ls-property-dialog — the "Add property" / "Set property" picker
   opened from the "/" command popover, mod+p / Ctrl+Alt+P, the
   `.ls-new-property` button, or `;;` in the editor.

   One state slot owns the active property workflow. Trigger-owned
   pickers follow their buttons; editor-positioned pickers use a point,
   and commands without a trigger use the centered overlay.

   Phases (cljs property.cljs property-input):
   1. property select — text field + property list ("New option:"
      creates)
   2. type select   — property name + type list
   3. node tags     — class select (+ "Skip choosing tag") for :node
   4. value         — select with placeholder "Set <title>" or the
                      inline date field for date/datetime

   For tag (class) pages an existing property is added via
   class-add-property instead of taking a value. *)

open Promise_ext
open Lui_elements
module D = Properties_data
module S = Properties_state
module Sel = Properties_select
module V = Properties_value
module W = Wire

type target =
  { uuid : string
  ; uuids : string list (* all selected block uuids for batch ops *)
  ; db_id : int option
  ; is_tag : bool
  ; title : string
  }

type phase =
  | Prop_select
  | Type_select of string (* new property name *)
  | Node_tags of W.t (* property entity *)
  | Value_edit of W.t (* property entity *)

type placement = Centered | Point of float * float | Trigger of string

(* one open dialog at a time (cljs treats it as the single active
   modal); the signal is created lazily by the overlay view's context *)
type dlg_state =
  { d_target : target
  ; d_remove : bool
  ; d_placement : placement
  ; mutable d_phase : phase
  ; mutable d_phase_sig : phase Signal.state option
  }

let current : dlg_state option ref = ref None
let current_sig : dlg_state option Signal.state option ref = ref None

let state_signal sched =
  match !current_sig with
  | Some s -> s
  | None ->
      let s = Signal.state sched !current in
      current_sig := Some s;
      s

let publish d =
  match !current_sig with
  | Some s -> Runtime.signal_set s d
  | None -> ()

let set_phase d p =
  d.d_phase <- p;
  match d.d_phase_sig with
  | Some s -> Runtime.signal_set s p
  | None -> ()

let close () =
  current := None;
  publish None

let is_open () = !current <> None

(* Escape closes the dialog (document keydown order: view overlays,
   then this, then imperative popups) *)
let handle_escape () =
  if is_open () then (close (); true) else false

(* ---------- helpers ---------- *)

let ident_of prop =
  D.getk prop "db/ident" |> Option.value ~default:""

let title_of prop =
  D.gets prop "block/title" |> Option.value ~default:""

let type_of prop =
  D.getk prop "logseq.property/type" |> Option.value ~default:"default"

let is_checkbox prop = type_of prop = "checkbox"

(* ---------- writes shared by phases ---------- *)

let write_prop_value d prop w =
  match w with
  | Some v ->
      D.set_block_property ~block_uuid:d.d_target.uuid
        ~ident:(ident_of prop) ~value:v
      |> ignore;
      S.refresh_all ()
  | None -> ()

(* cljs add-or-remove-property-value: for multiple-values properties
   (many cardinality or block/tags) picking an already-selected value
   removes it *)
let is_many prop =
  (match D.getk prop "db/cardinality" with
   | Some "db.cardinality/many" -> true
   | _ -> false)
  || ident_of prop = "block/tags"

(* after "Text"/"URL" is chosen the cljs flow creates the empty value
   block and lands the caret in it — refresh as soon as the write lands
   so the pending editor mounts before the user's next click; entering
   that editor exits the outliner edit (single editing surface) *)
let add_empty_text_block d prop =
  let ident = ident_of prop in
  !(Editor_state.close_block_editor) ();
  V.set_pending_edit ~block_uuid:d.d_target.uuid ~ident;
  (let* _ =
    D.create_property_text_block ~block_uuid:d.d_target.uuid ~ident
      ~title:"" ~new_block_id:(Ui_services.env_random_uuid ()) ()
  in
  S.refresh_now ();
  Js.Promise.resolve ())
  |> ignore;
  S.refresh_all ()

(* chosen an existing property from the select *)
let rec property_chosen d prop =
  if d.d_remove then (
    let uuids =
      match d.d_target.uuids with [] -> [ d.d_target.uuid ] | us -> us
    in
    List.iter
      (fun u ->
        ignore
          (D.remove_block_property ~block_uuid:u ~ident:(ident_of prop)))
      uuids;
    S.refresh_all ();
    close ())
  else if d.d_target.is_tag then (
    ignore
      (D.class_add_property ~class_uuid:d.d_target.uuid
         ~ident:(ident_of prop));
    S.refresh_all ();
    close ())
  else if is_checkbox prop then (
    write_prop_value d prop (Some (W.Bool false));
    close ())
  else set_phase d (Value_edit prop)

(* values may be bare eids, bare ident keywords or entity stubs whose
   db/id is an Int / Keyword / lookup-ref *)
and value_ids ent ident =
  match D.getf (D.untag ent) ident with
  | Some w ->
      List.fold_left
        (fun (ids, idents) e ->
          match e with
          | W.Int i -> (i :: ids, idents)
          | W.Keyword k -> (ids, k :: idents)
          | _ -> (
            match D.getf (D.untag e) "db/id" with
            | Some (W.Int i) -> (i :: ids, idents)
            | Some (W.Keyword k) -> (ids, k :: idents)
            | _ -> (ids, idents)))
        ([], []) (W.elems w)
  | None -> ([], [])

and pick_value d prop id =
  (* cljs stays open on many-cardinality; single picks close *)
  let ident = ident_of prop in
  let uuids =
    match d.d_target.uuids with [] -> [ d.d_target.uuid ] | us -> us
  in
  if is_many prop then
    (let* ent = D.entity_by_uuid d.d_target.uuid in
    let cur_ids, cur_idents = value_ids ent ident in
    let* picked = D.entity (W.Int id) in
    let picked_ident = D.getk (D.untag picked) "db/ident" in
    let hit =
      List.mem id cur_ids
      || (match picked_ident with
          | Some i -> List.mem i cur_idents
          | None -> false)
    in
    let* _ =
      (match hit, uuids with
       | true, _ :: _ :: _ ->
           D.batch_delete_property_value ~block_uuids:uuids
             ~ident ~value:(W.Int id)
       | true, _ ->
           D.delete_property_value ~block_uuid:d.d_target.uuid
             ~ident ~value:(W.Int id)
       | false, _ :: _ :: _ ->
           D.batch_set_property ~block_uuids:uuids ~ident
             ~value:(W.Int id)
       | false, _ ->
           D.set_block_property ~block_uuid:d.d_target.uuid ~ident
             ~value:(W.Int id))
    in
    S.refresh_all ();
    (* re-render the value list — picked items keep their check
       state from the refreshed entity *)
    Js.Promise.resolve ())
    |> ignore
  else (
    (match uuids with
     | _ :: _ :: _ ->
         D.batch_set_property ~block_uuids:uuids ~ident ~value:(W.Int id)
         |> ignore
     | _ -> write_prop_value d prop (Some (W.Int id)));
    S.refresh_all ();
    close ())

and valid_property_name s =
  not (String.length s > 0
       && (s.[0] = '#'
          || (String.length s > 1 && s.[0] = '[' && s.[1] = '[')))

and on_type_chosen d name ty =
  (* cljs add-existing-or-new-property validates the name client-side and
     shows invalid-name without calling the worker *)
  if not (valid_property_name name) then
    S.toast_error (I18n.t "property/invalid-name-error")
  else
  (let* res =
    D.upsert_property
      ~schema:(W.Map [ (W.Keyword "logseq.property/type", W.Keyword ty) ])
      ~property_name:name ()
    |> (fun p ->
        Js.Promise.catch
          (fun _ -> Js.Promise.resolve W.Nil)
          p)
  in
  (match D.untag res with
   | W.Nil ->
       S.toast_error (I18n.t "property/create-error")
   | W.Map _ as prop ->
       if d.d_target.is_tag then (
         (match ident_of prop with
          | "" -> ()
          | ident ->
              ignore
                (D.class_add_property ~class_uuid:d.d_target.uuid
                   ~ident));
         S.refresh_all ();
         close ())
       else (
         match ty with
         | "checkbox" ->
             write_prop_value d prop (Some (W.Bool false));
             close ()
         | "default" | "url" ->
             add_empty_text_block d prop;
             close ()
         | "node" -> set_phase d (Node_tags prop)
         | _ -> set_phase d (Value_edit prop))
   | _ -> S.toast_error (I18n.t "property/create-error"));
  Js.Promise.resolve ())
  |> ignore

(* ---------- phase views ---------- *)

(* fetch-backed list: resolves once, then mounts Sel.view. [compact]
   switches to the anchored popover spec (32px input + 32px rows) —
   master's mod+p picker is that compact dropdown, not the roomier
   centered-card variant *)
let async_select ~placeholder ?(compact = false) ?(new_case_sensitive = false) ?new_option ?on_search
    fetch : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let items_st : Sel.item list option Signal.state =
    Signal.state sched None
  in
  ignore
    (let* items = fetch in
     Runtime.signal_set items_st (Some items);
     Js.Promise.resolve ());
  (reactive ~equal:(fun a b -> Option.is_some a = Option.is_some b)
     (fun m ->
        match m with
        | None -> column ~gap:2 []
        | Some items ->
            Sel.view ~placeholder ~compact ~new_case_sensitive ?new_option ?on_search items)
     (Signal.value items_st))
    context parent

let prop_select_view d : t =
  async_select ~placeholder:(I18n.t "property/add-or-change")
    ~compact:(d.d_placement <> Centered)
    ~new_case_sensitive:true
    ~new_option:(fun name ->
      (* no client-side name validation: invalid names go through
         type-select and the worker rejects the upsert with a
         notification toast *)
      set_phase d (Type_select name))
    (let* w = D.all_properties (D.uuid_ref d.d_target.uuid) in
     let items =
       List.filter_map
         (fun p ->
           match title_of p with
           | "" -> None
           | t ->
               Some
                 (Sel.item ~tip:(ident_of p) ~icon:"letter-t"
                    ~strong:true t
                    (fun () -> property_chosen d p)))
         (W.elems w)
     in
     Js.Promise.resolve items)

let type_select_view d name : t =
 fun context parent ->
  let expanded = Signal.state context.Lui_ui.ui_scheduler true in
  let collapse () = Runtime.signal_set expanded false in
  let dismiss _ = collapse () in
  (row ~gap:4 ~cross:`center
     [ row ~gap:4 ~cross:`center ~min_width:160 ~min_height:28
         [ row ~width:15 ~height:24 ~main:`center ~cross:`center
             [ Ui_components.with_props [Ui_components.Prop.opacity 0.8]
                 (box ~width:6 ~height:6 ~corner_radius:3
                   ~background:"var(--lx-gray-08)" []) ]
         ; text ~value:name ~font_size:"15px" ~line_height:"22.5px" [] ]
     ; box
         [ Ui_components.with_props
             [Ui_components.Prop.font_size "14px";
              Ui_components.Prop.line_height "20px"]
             (select ~key:"type-control"
                ~placeholder:(I18n.t "property/select-type-placeholder")
                ~height:32 ~padding_horizontal:8 ~padding_vertical:0
                ~gap:0 ~corner_radius:6 ~border_width:1
                ~border_color:"hsl(var(--border))"
                ~background:"hsl(var(--background))"
                ~foreground:"hsl(var(--foreground))"
                ~on_press:(fun _ -> Runtime.signal_set expanded
                  (not (Runtime.signal_get expanded)))
                ~on_dismiss:dismiss [])
         ; reactive (fun open_ ->
             if not open_ then spacer []
             else
               Ui_components.menu_card ~key:"type-options"
                 ~anchor:`below
                 ~anchor_alignment:`start ~on_dismiss:dismiss
                 (List.map (fun (ty,label) ->
                   Ui_components.with_props
                     [Ui_components.Prop.hover_background "var(--lx-gray-05)";
                      Ui_components.Prop.hover_foreground "var(--lx-gray-12)"]
                     (menu_item ~key:ty ~text:(I18n.t label)
                       ~selected:false ~selection_placement:`leading ~gap:8
                       ~height:32 ~padding_horizontal:8 ~padding_vertical:6
                       ~corner_radius:4 ~foreground:"var(--lx-gray-12)"
                       ~on_press:(fun _ -> collapse ();
                         on_type_chosen d name ty) []))
                   Properties_menu.type_names)) (Signal.value expanded) ]
     ]) context parent

let node_tags_view d prop : t =
  async_select ~placeholder:(I18n.t "property/choose-tags")
    ~compact:(d.d_placement <> Centered)
    (let* w = D.all_classes () in
     let items =
       Sel.item (I18n.t "property/skip-choosing-tag") (fun () ->
           set_phase d (Value_edit prop))
       :: List.filter_map
            (fun c ->
              match title_of c with
              | "" -> None
              | t -> (
                  match D.entity_id_of c with
                  | Some id ->
                      Some
                        (Sel.item t (fun () ->
                             (match ident_of prop with
                              | "" -> ()
                              | _ ->
                                  ignore
                                    (D.set_block_property
                                       ~block_uuid:
                                         (match
                                            D.entity_uuid_of prop
                                          with
                                         | Some u -> u
                                         | None -> d.d_target.uuid)
                                       ~ident:
                                         "logseq.property/classes"
                                       ~value:(W.Int id)));
                             set_phase d (Value_edit prop)))
                  | None -> None))
            (W.elems w)
     in
     Js.Promise.resolve items)

let value_items d prop wire_values =
  let ty = type_of prop in
  let closed =
    match D.getf prop "property/closed-values" with
    | Some w -> W.elems w
    | None -> []
  in
  if closed <> [] then
    List.filter_map
      (fun c ->
        match D.entity_id_of c with
        | Some id ->
            Some
              (Sel.item (D.ref_title c) (fun () -> pick_value d prop id))
        | None -> None)
      closed
  else
    match ty with
    | "number" | "default" | "url" -> []
    | _ ->
        List.filter_map
          (fun v ->
            match D.entity_id_of v with
            | Some id ->
                Some
                  (Sel.item (D.ref_title v) (fun () ->
                       pick_value d prop id))
            | None -> None)
          wire_values

(* :logseq.property/icon's value editor is the icon picker — the
   generic select paths would write a text-block ref or entity id
   where the icon schema requires a {:type :id} map. Mount an anchor
   element and open the picker on appear (same as the p i chord's
   block picker, which passes ~del:false). *)
let icon_value_view d : t =
 fun context parent ->
  let anchor_id = "pd-icon-" ^ d.d_target.uuid in
  (box ~accessibility_identifier:anchor_id
     ~on_appear:(fun _ ->
       match Ui_services.dom_query ("#" ^ anchor_id) with
       | Some anchor ->
           Icon_picker.open_picker ~anchor ~del:false
             ~on_chosen:(fun c ->
               (match c with
                | Icon_picker.Remove ->
                    D.remove_block_property ~block_uuid:d.d_target.uuid
                      ~ident:"logseq.property/icon"
                | Icon_picker.Emoji id ->
                    D.set_block_property ~block_uuid:d.d_target.uuid
                      ~ident:"logseq.property/icon"
                      ~value:
                        (W.Map
                           [ (W.Keyword "type", W.Keyword "emoji")
                           ; (W.Keyword "id", W.String id) ])
                | Icon_picker.Tabler (id, color) ->
                    D.set_block_property ~block_uuid:d.d_target.uuid
                      ~ident:"logseq.property/icon"
                      ~value:
                        (W.Map
                           ([ (W.Keyword "type", W.Keyword "tabler-icon")
                            ; (W.Keyword "id", W.String id) ]
                            @
                            match color with
                            | Some c -> [ (W.Keyword "color", W.String c) ]
                            | None -> [])))
               |> ignore;
               S.refresh_all ();
               close ())
       | None -> ())
     [])
    context parent

let value_edit_view d prop : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let ty = type_of prop in
  if ty = "date" || ty = "datetime" then (
    (* inline date field — same as the cell editor *)
    let is_datetime = ty = "datetime" in
    let day = V.today_day () in
    let buffer =
      Signal.state sched
        (if is_datetime then ""
         else
           Printf.sprintf "%04d-%02d-%02d" (day / 10000)
             (day mod 10000 / 100) (day mod 100))
    in
    let ctx : V.ctx =
      { block_uuid = d.d_target.uuid; block_id = d.d_target.db_id
      ; refresh = (fun () -> ()); is_page = false; class_schema = false
      }
    in
    (row ~gap:0 ~grow:1.0
       [ text_field ~autofocus:true
           ~text:(Runtime.signal_get buffer)
           ~on_input:(fun ev ->
             match ev with
             | Lui_protocol.TextChanged (_, t) -> Signal.set buffer t
             | _ -> ())
           ~on_submit:(fun _ ->
             V.commit_date_text ctx (ident_of prop) ~is_datetime
               (Runtime.signal_get buffer);
             close ())
           []
       ])
      context parent)
  else if ident_of prop = "logseq.property/icon" then
    icon_value_view d context parent
  else
    let placeholder = I18n.t1 "property/set-placeholder" (title_of prop) in
    let on_new =
      if ty = "number" then
        Some
          (fun text ->
            match Float.of_string_opt (String.trim text) with
            | Some n ->
                write_prop_value d prop (Some (W.Float n));
                close ()
            | None -> ())
      else if ty = "node" || ty = "class" then
        Some
          (fun text ->
            ignore
              (let* res =
                 (* cljs <create-page-if-not-exists!: class-type
                    and block/tags values are classes *)
                 if ty = "class" || ident_of prop = "block/tags"
                 then D.create_class text
                 else D.create_page text
               in
               let* () =
                 match D.create_result_uuid res with
                 | Some uuid -> (
                     let* id = D.db_id_of_uuid uuid in
                     match id with
                     | Some id ->
                         write_prop_value d prop (Some (W.Int id));
                         Js.Promise.resolve ()
                     | None -> Js.Promise.resolve ())
                 | None -> Js.Promise.resolve ()
               in
               close ();
               Js.Promise.resolve ()))
      else
        Some
          (fun text ->
            (* text value -> create value block *)
            D.create_property_text_block ~block_uuid:d.d_target.uuid
              ~ident:(ident_of prop) ~title:text
              ~new_block_id:(Ui_services.env_random_uuid ()) ()
            |> ignore;
            S.refresh_all ();
            close ())
    in
    if List.mem ty [ "node"; "page"; "class"; "property" ] then
      let initial, on_search =
        V.node_items_source ~block:(D.uuid_ref d.d_target.uuid) ~prop
          ~on_pick:(fun id -> pick_value d prop id)
      in
      (async_select ~placeholder ~compact:(d.d_placement <> Centered)
         ?new_option:on_new
         ~on_search:(Some on_search) initial)
        context parent
    else
      (async_select ~placeholder ~compact:(d.d_placement <> Centered)
         ?new_option:on_new
         (let* w =
            D.property_values ~property_ident:(ident_of prop)
              ~block:(D.uuid_ref d.d_target.uuid)
          in
          Js.Promise.resolve (value_items d prop (W.elems w))))
        context parent

let dialog_content ?compact_width d : t =
 fun context parent ->
  let phase_sig = Signal.state context.Lui_ui.ui_scheduler d.d_phase in
  d.d_phase_sig <- Some phase_sig;
  (reactive
     (fun p ->
        (* stable root: same-kind prop diffs across reactive branches emit
           unsupported set-prop ops on native *)
        column ~gap:0 ?width:(match p with Type_select _ -> None | _ -> compact_width)
          [ (match p with
             | Prop_select -> prop_select_view d
             | Type_select name -> type_select_view d name
             | Node_tags prop -> node_tags_view d prop
             | Value_edit prop -> value_edit_view d prop)
          ])
     (Signal.value phase_sig))
    context parent

(* the dialog rendered inside .cp__overlays: with an anchor point it
   is the anchored ui__popover-content dropdown master uses (title
   actions, properties-area buttons); without one it stays a centered
   card like cljs's unanchored command-palette fallback *)
let view : t =
 fun context parent ->
  let s = state_signal context.Lui_ui.ui_scheduler in
  (reactive ~equal:(==)
     (fun dopt ->
        match dopt with
        | None -> column ~gap:2 []
        | Some d -> (
            match d.d_placement with
            | Trigger _ -> column ~gap:0 []
            | Point (x, y) ->
                popover ~key:"prop-pop" ~at:(x, y)
                  ~style_class:"ui__popover-content"
                  ~available_height:
                    (Ui_services.dom_viewport_height () -. y -. 8.)
                  ~data_attrs:[ ("role", "dialog") ]
                  ~transition:Ui_components.popover_transition
                  ~on_dismiss:(fun _ -> close ())
                  [ box ~key:"prop-body"
                      ~style_class:"ls-property-dialog"
                      [ dialog_content ~compact_width:232 d ]
                  ]
            | Centered ->
                dialog ~text:(I18n.t "property/add-or-change")
                  ~style_class:"ls-property-dialog"
                  ~on_dismiss:(fun _ -> close ())
                  [ card ~padding:8 ~min_width:340 ~max_width:520
                      [ dialog_content d ]
                  ]))
     (Signal.value s))
    context parent

(* ---------- open ---------- *)

(* a second open replaces the dialog — cljs treats it as the single
   active modal *)
let open_at ~remove ~phase placement target =
  (* a second open replaces every popup — cljs treats it as the single
     active modal *)
  S.close_overlays ();
  S.close_all_view_overlays ();
  let d = { d_target = target; d_remove = remove; d_placement = placement
          ; d_phase = phase; d_phase_sig = None } in
  current := Some d;
  publish (Some d)

let open_dialog ?(remove = false) ?(phase = Prop_select) ?anchor target =
  open_at ~remove ~phase (match anchor with Some (x,y) -> Point (x,y) | None -> Centered) target

(* Retain the popup under its trigger so both renderers track layout,
   scrolling and resizing without asynchronous rectangle polling. *)
let trigger ~key ?margin_left ~remove ~target make_button : t =
 fun context parent ->
  let state = state_signal context.Lui_ui.ui_scheduler in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
    match !current with
    | Some d when d.d_placement = Trigger key ->
        current := None;
        (* Teardown owns the flush; do not remount siblings during disposal. *)
        Signal.set state None
    | _ -> ());
  (button_group ~key ~gap:0 ?margin_left ~background:"transparent"
     ~border_width:0 ~corner_radius:0
     [ make_button (fun () -> match !current with
         | Some d when d.d_placement = Trigger key -> close ()
         | _ -> match target () with
           | Some target -> open_at ~remove ~phase:Prop_select (Trigger key) target
           | None -> ())
     ; reactive ~equal:(==)
         (fun current -> match current with
           | Some d when d.d_placement = Trigger key ->
               Ui_components.with_props
                 [Ui_components.Prop.overflow `auto; Ui_components.card_shadow]
                 (popover ~anchor:`below ~anchor_offset:0.
                    ~padding:0 ~max_height:288 ~border_width:1
                    ~corner_radius:6 ~background:"hsl(var(--popover))"
                    ~foreground:"hsl(var(--popover-foreground))"
                    ~border_color:"hsl(var(--border))"
                    ~style_class:"ui__popover-content ls-property-dialog"
                    ~data_attrs:["role","dialog"]
                    ~transition:Ui_components.popover_transition
                    ~on_dismiss:(fun _ -> close ()) [dialog_content ~compact_width:224 d])
           | _ -> column ~gap:0 [])
         (Signal.value state)
     ]) context parent

(* anchored-open helper for click triggers: measure the element and
   open the popover at its bottom-left (base-ui align=start). On
   backends with async measurement (the native host) the first rect is
   still
   pending, so retry a few ticks rather than anchoring at 0,0 — and if
   the rect never lands fall back to the unanchored centered card
   instead of pinning the dialog to the corner. *)
let open_for_anchor_el ?(remove = false) ?(phase = Prop_select)
    (anchor : Ui_services.el) target =
  let rec open_measured tries_left =
    if tries_left > 0 && anchor.Ui_services.rect_pending () then
      ignore
        (Ui_services.timers_timeout
           (fun () -> open_measured (tries_left - 1)) 32)
    else
      let x, y, w, h = anchor.Ui_services.rect () in
      if x <> 0. || y <> 0. || w <> 0. || h <> 0. then
        open_dialog ~remove ~phase ~anchor:(x, y +. h) target
      else open_dialog ~remove ~phase target
  in
  open_measured 4

(* ---------- triggers ---------- *)

(* block uuid the command applies to: editing block > selected block >
   current page *)
let current_target () : target option =
  match Editor_state.editing_uuid () with
  | Some u ->
      Some { uuid = u; uuids = []; db_id = None; is_tag = false
           ; title = "" }
  | None -> (
      match Ui_services.dom_selected_block_uuids () with
      | u :: _ as us ->
          Some { uuid = u; uuids = us; db_id = None; is_tag = false
               ; title = "" }
      | [] -> (
          match !Runtime.current_page with
          | Some p ->
              let uuid = Option.value ~default:"" p.Model.page_uuid in
              if uuid = "" then None
              else
                Some
                  { uuid; uuids = []; db_id = p.Model.page_db_id
                  ; is_tag = p.Model.page_is_tag; title = p.Model.page_title
                  }
          | None -> None))

(* open the dialog for a specific block uuid (slash command path) *)
let open_for_block uuid =
  open_dialog
    { uuid; uuids = []; db_id = None; is_tag = false; title = "" }

(* cljs :editor/new-property {:property-key ident}: the dialog jumps
   straight to the value-editing phase for the named property — a
   dedicated picker (date input, closed-value select, node select) —
   across the whole block selection *)
let open_for_block_with_property ~uuids uuid ~ident =
  (let* prop =
    D.entity (W.List [ W.Keyword "db/ident"; W.Keyword ident ])
  in
  (match D.untag prop with
   | W.Map _ as p ->
       open_dialog ~phase:(Value_edit p)
         { uuid; uuids; db_id = None; is_tag = false; title = "" }
   | _ -> ());
  Js.Promise.resolve ())
  |> ignore

let open_for_current () =
  match current_target () with
  | Some t ->
      (* cljs anchors the picker at the block's content left-bottom
         (cal_pos recipe: block x+24, bottom+4) — not at the caret *)
      let anchor_el =
        match Editor_state.editing_uuid () with
        | Some u ->
            Ui_services.dom_query
              (".ls-block[data-blockid='" ^ u ^ "']")
        | None -> None
      in
      (match anchor_el with
       | Some blk ->
           (* cljs anchors the picker at the block's content
              left-bottom (cal_pos recipe: block x+24, bottom+4) — the
              native host answers rect() asynchronously, so measure
              with the same retry as open_for_anchor_el instead of
              anchoring at the pending (0,0,0,0) read *)
           let rec open_measured tries_left =
             if tries_left > 0 && blk.Ui_services.rect_pending () then
               ignore
                 (Ui_services.timers_timeout
                    (fun () -> open_measured (tries_left - 1))
                    32)
             else
               let rx, ry, rw, rh = blk.Ui_services.rect () in
               if rx <> 0. || ry <> 0. || rw <> 0. || rh <> 0. then
                 open_dialog ~anchor:(rx +. 24., ry +. rh +. 4.) t
               else open_dialog t
           in
           open_measured 4
       | None -> open_dialog t)
  | None -> ()
