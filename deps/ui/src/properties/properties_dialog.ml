(* .ls-property-dialog — the "Add property" / "Set property" picker
   opened from the "/" command popover, mod+p / Ctrl+Alt+P, the
   `.ls-new-property` button, or `;;` in the editor.

   Phases (cljs property.cljs property-input):
   1. property select — .ls-property-add > .ls-property-key > .cp__select
      (placeholder "Add or change property"; "New option:" creates)
   2. type select   — property-key span + "Select a property type" list
   3. node tags     — class select (+ "Skip choosing tag") for :node
   4. value         — .cp__select with input[placeholder='Set <title>']
                      or the .ls-property-date-picker for date/datetime

   For tag (class) pages an existing property is added via
   class-add-property instead of taking a value. *)

open Promise_ext
open Editor_dom
open Properties_dom
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

type dlg =
  { target : target
  ; mutable phase : phase
  ; mutable body : Editor_dom.el option
  ; mutable pending_type : string option
  ; mutable select_overlay : Editor_dom.el option
  ; remove : bool (* cljs :editor/new-property remove-property? — the
                     picker removes the chosen property instead of
                     setting a value *)
  }

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
      D.set_block_property ~block_uuid:d.target.uuid
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

(* close this dialog (top overlay) *)
let close () = S.pop_overlay ()

(* close the dialog plus any select dropdown it opened above itself *)
let close_dlg d =
  (match d.select_overlay with
   | Some el -> S.remove_overlay_el el; d.select_overlay <- None
   | None -> ());
  S.pop_overlay ()

(* after "Text"/"URL" is chosen the cljs flow creates the empty value
   block and lands the caret in it — refresh as soon as the write lands
   so the pending editor mounts before the user's next click; entering
   that editor exits the outliner edit (single editing surface) *)
let add_empty_text_block d prop =
  let ident = ident_of prop in
  !(Editor_state.close_block_editor) ();
  V.set_pending_edit ~block_uuid:d.target.uuid ~ident;
  (let* _ =
    D.create_property_text_block ~block_uuid:d.target.uuid ~ident
      ~title:"" ~new_block_id:(Platform.random_uuid ()) ()
  in
  S.refresh_now ();
  Js.Promise.resolve ())
  |> ignore;
  S.refresh_all ()

(* chosen an existing property from the select *)
let rec property_chosen d prop =
  if d.remove then (
    let uuids =
      match d.target.uuids with [] -> [ d.target.uuid ] | us -> us
    in
    List.iter
      (fun u ->
        ignore
          (D.remove_block_property ~block_uuid:u ~ident:(ident_of prop)))
      uuids;
    S.refresh_all ();
    close_dlg d)
  else if d.target.is_tag then (
    ignore
      (D.class_add_property ~class_uuid:d.target.uuid
         ~ident:(ident_of prop));
    S.refresh_all ();
    close_dlg d)
  else if is_checkbox prop then (
    write_prop_value d prop (Some (W.Bool false));
    close_dlg d)
  else (
    d.phase <- Value_edit prop;
    render d)

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
    match d.target.uuids with [] -> [ d.target.uuid ] | us -> us
  in
  if is_many prop then
    (let* ent = D.entity_by_uuid d.target.uuid in
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
           D.delete_property_value ~block_uuid:d.target.uuid
             ~ident ~value:(W.Int id)
       | false, _ :: _ :: _ ->
           D.batch_set_property ~block_uuids:uuids ~ident
             ~value:(W.Int id)
       | false, _ ->
           D.set_block_property ~block_uuid:d.target.uuid ~ident
             ~value:(W.Int id))
    in
    S.refresh_all ();
    render d;
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

(* ---------- phase renderers ---------- *)

and render (d : dlg) =
  match d.body with
  | None -> ()
  | Some body -> (
      (* a select dropdown portaled above the dialog is torn down with
         the phase that opened it *)
      (match d.select_overlay with
       | Some el -> S.remove_overlay_el el; d.select_overlay <- None
       | None -> ());
      el_clear body;
      match d.phase with
      | Prop_select -> render_prop_select d body
      | Type_select name -> render_type_select d body name
      | Node_tags prop -> render_node_tags d body prop
      | Value_edit prop -> render_value_edit d body prop)

and render_prop_select d body =
  let wrap =
    mk ~cls:"ls-property-add property-key" "div"
      ~attrs:[ ("data-keep-selection", "true") ]
  in
  let key_wrap = mk ~cls:"ls-property-key" "div" in
  el_append_child wrap key_wrap;
  el_append_child body wrap;
  (let* w = D.all_properties (D.uuid_ref d.target.uuid) in
  let props = W.elems w in
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
      props
  in
  let sel, input =
    Sel.create ~placeholder:(I18n.t "property/add-or-change")
      ~new_option:
        (Some (fun name ->
             (* no client-side name validation: invalid names go
                through type-select and the worker rejects the
                upsert with a notification toast *)
             d.phase <- Type_select name;
             render d))
      ~on_escape:close items
  in
  el_append_child key_wrap sel;
  el_focus input;
  Js.Promise.resolve ())
  |> ignore

and select_trigger_cls =
  "ui__select-trigger flex w-full items-center justify-between \
   rounded-md border border-input bg-background text-sm \
   ring-offset-background placeholder:text-muted-foreground \
   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 \
   disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 \
   !px-2 !py-0 !h-8"

and select_content_cls =
  "ui__select-content relative z-[99999] min-w-[8rem] overflow-hidden \
   rounded-md border bg-popover text-popover-foreground shadow-md \
   animate-in fade-in-0 zoom-in-95 \
   data-[side=bottom]:slide-in-from-top-2 \
   data-[side=left]:slide-in-from-right-2 \
   data-[side=right]:slide-in-from-left-2 \
   data-[side=top]:slide-in-from-bottom-2"

(* portaled type dropdown under the trigger (cljs shui select-content *
   auto-opens via :default-open in the new-property flow) *)
and open_type_menu d name trigger =
  let l, t, _r, b, _w = el_rect trigger in
  (* radix mounts below but flips when the list would overflow the
     viewport and there is more room above; cap the height at the space
     on the chosen side so every option stays inside the viewport
     (radix's available-height behaviour) *)
  let below = window_inner_height -. (b +. 4.) -. 8. in
  let above = (t -. 4.) -. 8. in
  let open_above = below < 280. && above > below in
  let pos, avail =
    if open_above then
      ( Printf.sprintf "bottom:%.0fpx" (window_inner_height -. (t -. 4.))
      , above )
    else (Printf.sprintf "top:%.0fpx" (b +. 4.), below)
  in
  let content =
    mk ~cls:select_content_cls "div"
      ~attrs:
        [ ("role", "presentation"); ("tabindex", "-1"); ("data-open", "")
        ; ("data-side", if open_above then "top" else "bottom")
        ; ("data-align", "center")
        ; ("data-state", "open")
        ; ( "style"
          , Printf.sprintf
              "position:fixed;left:%.0fpx;%s;z-index:99999;\
               max-height:%.0fpx;overflow:hidden auto" l pos
              (Float.max avail 120.) ) ]
  in
  let listbox =
    mk ~cls:"ls-p1" "div"
      ~attrs:
        [ ("role", "listbox")
        ; ( "style"
          , "position:relative;max-height:100%;overflow:hidden auto;\
             flex:1 1 auto;min-height:0" ) ]
  in
  let group = mk "div" ~attrs:[ ("role", "group") ] in
  el_append_child listbox group;
  el_append_child content listbox;
  List.iteri
    (fun i ty ->
      let opt =
        mk
          ~cls:
            "ui__select-item flex w-full cursor-default select-none \
             items-center gap-2 rounded-sm px-2 py-1.5 text-sm \
             outline-none data-[highlighted]:bg-muted \
             data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          "div"
          ~attrs:
            [ ("role", "option"); ("aria-selected", "false")
            ; ("tabindex", if i = 0 then "0" else "-1") ]
      in
      if i = 0 then el_set_attr opt "data-highlighted" "";
      el_append_child opt
        (mk ~cls:"ls-check-cell" "span");
      let lbl = mk "div" in
      ignore (child_text "span" "" (I18n.t ("property/type-" ^ ty)) lbl);
      el_append_child opt lbl;
      el_append_child group opt;
      on_click opt (fun _ -> on_type_chosen d name ty))
    (* cljs db-property-type/user-built-in-property-types order *)
    [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"
    ; "asset" ];
  d.select_overlay <- Some content;
  S.push_overlay content ~on_escape:(fun () -> d.select_overlay <- None)

and render_type_select d body name =
  (* cljs DOM contract (property.cljs property-type-select):
     .ls-property-add > .property-key > bullet + name, then
     .flex.flex-row > .flex.items-center > button.ui__select-trigger *)
  let wrap =
    mk ~cls:"ls-property-add ls-pa-row" "div"
  in
  let key =
    mk ~cls:"property-key" "div"
  in
  let bullet = mk ~cls:"bullet-container" "span" in
  el_append_child bullet (mk ~cls:"bullet" "span");
  el_append_child key bullet;
  let label = mk "div" in
  el_set_text label name;
  el_append_child key label;
  el_append_child wrap key;
  let row = mk ~cls:"ls-pd-row" "div" in
  let cell = mk ~cls:"ls-row" "div" in
  el_append_child row cell;
  el_append_child wrap row;
  el_append_child body wrap;
  let trigger =
    mk ~cls:select_trigger_cls "button"
      ~attrs:
        [ ("type", "button"); ("tabindex", "0"); ("role", "combobox")
        ; ("aria-expanded", "true"); ("aria-haspopup", "listbox")
        ; ("data-popup-open", ""); ("data-pressed", "")
        ; ("data-placeholder", ""); ("data-popup-side", "bottom") ]
  in
  let ph =
    child_text "span" "" (I18n.t "property/select-type-placeholder")
      trigger
  in
  el_set_attr ph "data-placeholder" "";
  let icon =
    mk ~cls:"ui__select-icon" "span"
      ~attrs:[ ("data-popup-open", ""); ("aria-hidden", "true") ]
  in
  (match tabler_svg_el ~size:24. "chevron-down" with
   | Some svg ->
       el_set_attr svg "class"
         "tabler-icon tabler-icon-chevron-down ls-icon-sm";
       el_append_child icon svg
   | None -> ());
  el_append_child trigger icon;
  el_append_child cell trigger;
  open_type_menu d name trigger

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
          (fun _ ->
            (* normalize rejection to Nil — the W.Nil arm owns the single
               "failed to create" toast *)
            Js.Promise.resolve W.Nil)
          p)
  in
  (match D.untag res with
   | W.Nil ->
       S.toast_error (I18n.t "property/create-error")
   | W.Map _ as m ->
       let prop = m in
       if d.target.is_tag then (
         (* on a class page the new property is added as schema *)
         (match ident_of prop with
          | "" -> ()
          | ident ->
              ignore
                (D.class_add_property ~class_uuid:d.target.uuid
                   ~ident));
         S.refresh_all ();
         close_dlg d)
       else (
         match ty with
         | "checkbox" ->
             write_prop_value d prop (Some (W.Bool false));
             close_dlg d
         | "default" | "url" ->
             add_empty_text_block d prop;
             close_dlg d
         | "node" ->
             d.phase <- Node_tags prop;
             render d
         | _ ->
             d.phase <- Value_edit prop;
             render d)
   | _ -> S.toast_error (I18n.t "property/create-error"));
  Js.Promise.resolve ())
  |> ignore

and render_node_tags d body prop =
  let wrap = mk ~cls:"ls-span3" "div" in
  el_append_child body wrap;
  (let* w = D.all_classes () in
  let items =
    Sel.item (I18n.t "property/skip-choosing-tag") (fun () ->
        d.phase <- Value_edit prop;
        render d)
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
                                      | None -> d.target.uuid)
                                    ~ident:
                                      "logseq.property/classes"
                                    ~value:(W.Int id)));
                          d.phase <- Value_edit prop;
                          render d))
               | None -> None))
         (W.elems w)
  in
  let sel, input =
    Sel.create ~placeholder:(I18n.t "property/choose-tags")
      ~on_escape:close items
  in
  el_append_child wrap sel;
  el_focus input;
  Js.Promise.resolve ())
  |> ignore

and value_items d prop wire_values =
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

and render_value_edit d body prop =
  let wrap = mk ~cls:"property-select" "div" in
  el_append_child body wrap;
  let ty = type_of prop in
  if ty = "date" || ty = "datetime" then (
    (* inline date picker in the dialog *)
    let picker =
      mk ~cls:"ls-property-date-picker" "div"
    in
    let input =
      mk "input"
        ~attrs:[ ("type", if ty = "datetime" then "datetime-local" else "date") ]
    in
    el_append_child picker input;
    if ty = "date" then (
      let day = V.today_day () in
      el_set_value input
        (Printf.sprintf "%04d-%02d-%02d" (day / 10000)
           (day mod 10000 / 100) (day mod 100)));
    el_append_child wrap picker;
    el_focus input;
    el_listen input "keydown"
      (fun ev ->
        match ev_key ev with
        | "Enter" ->
            prevent_default ev;
            let ctx : V.ctx =
              { block_uuid = d.target.uuid; block_id = d.target.db_id
              ; refresh = (fun () -> ()); is_page = false
              ; class_schema = false
              }
            in
            V.commit_date_input ctx (ident_of prop) ~is_datetime:(ty = "datetime") input;
            close_dlg d
        | "Escape" -> prevent_default ev; stop_propagation ev; close ()
        | _ -> ())
      true)
  else (
    let placeholder = I18n.t1 "property/set-placeholder" (title_of prop) in
    let fetch, on_search =
      if List.mem ty [ "node"; "page"; "class"; "property" ] then (
        let initial, on_search =
          V.node_items_source ~block:(D.uuid_ref d.target.uuid) ~prop
            ~on_pick:(fun id -> pick_value d prop id)
        in
        (initial, Some on_search))
      else
        ( (let* w =
            D.property_values ~property_ident:(ident_of prop)
              ~block:(D.uuid_ref d.target.uuid)
          in
          Js.Promise.resolve (value_items d prop (W.elems w)))
        , None )
    in
    (let* items = fetch in
    let on_new =
      if ty = "number" then
        Some
          (fun text ->
            match Float.of_string_opt (String.trim text) with
            | Some n ->
                write_prop_value d prop (Some (W.Float n));
                close_dlg d
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
               close_dlg d;
               Js.Promise.resolve ()))
      else
        Some
          (fun text ->
            (* text value -> create value block *)
            D.create_property_text_block ~block_uuid:d.target.uuid
              ~ident:(ident_of prop) ~title:text
              ~new_block_id:(Platform.random_uuid ()) ()
            |> ignore;
            S.refresh_all ();
            close_dlg d)
    in
    let sel, input =
      Sel.create ~placeholder ~new_option:on_new ~on_escape:close
        ~on_search items
    in
    el_append_child wrap sel;
    el_focus input;
    Js.Promise.resolve ())
    |> ignore)

(* ---------- open ---------- *)

(* cljs pops the input under the invoking control (popup-show! on the
   click target); callers without an anchor get the centered fallback *)
let open_dialog ?(remove = false) ?anchor target =
  let d =
    { target; phase = Prop_select; body = None; pending_type = None
    ; select_overlay = None; remove
    }
  in
  (* cljs popup body styles: base-ui sets font metrics and the page
     title size var on the popover content *)
  let body_style =
    "font-size:1rem;line-height:1.5;--ls-page-title-size:1rem"
  in
  let style =
    match anchor with
    | Some (x, y) ->
        let avail = Float.max (window_inner_height -. y -. 10.) 200. in
        Printf.sprintf
          "position:fixed;left:%.0fpx;top:%.0fpx;z-index:9999;\
           --available-height:%.0fpx;%s"
          x y avail body_style
    | None ->
        "position:fixed;left:50%;top:30%;transform:translateX(-50%);\
         z-index:9999;--available-height:60vh;" ^ body_style
  in
  (* cljs popup chrome: ui__popover-content card > .ls-property-dialog *)
  let root =
    mk
      ~cls:
        "ui__popover-content rounded-md border bg-popover \
         text-popover-foreground shadow-md outline-none outline-none \
         animate-in fade-in-0 zoom-in-95 \
         data-[side=bottom]:slide-in-from-top-2 \
         data-[side=left]:slide-in-from-right-2 \
         data-[side=right]:slide-in-from-left-2 \
         data-[side=top]:slide-in-from-bottom-2 \
         focus:outline-none focus-visible:outline-none z-50"
      "div"
      ~attrs:
        [ ("role", "dialog"); ("style", style); ("data-open", "")
        ; ("data-side", "bottom"); ("data-align", "start")
        ; ("data-base-ui-focusable", "") ]
  in
  let dlg = mk ~cls:"ls-property-dialog" "div" in
  el_append_child root dlg;
  let inner =
    mk ~cls:"ls-property-input flex flex-1 flex-row items-center \
             flex-wrap gap-1" "div"
  in
  el_append_child dlg inner;
  d.body <- Some inner;
  (* cljs mounts the property dialog as the single active modal — a
     second open replaces any popups left over from the previous flow *)
  S.close_overlays ();
  S.push_overlay root ~on_escape:(fun () -> ());
  render d;
  d

(* ---------- triggers ---------- *)

(* block uuid the command applies to: editing block > selected block >
   current page *)
let current_target () : target option =
  match Editor_state.editing_uuid () with
  | Some u ->
      Some { uuid = u; uuids = []; db_id = None; is_tag = false
           ; title = "" }
  | None -> (
      match Platform.selected_block_uuids () with
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

(* open the dialog for a specific block uuid (slash command path). cljs
   anchors the popover on the editing textarea (#edit-block-<uuid>)
   with align:start — bottom-left corner, 4px left *)
let anchor_of uuid =
  match get_element_by_id ("edit-block-" ^ uuid) with
  | Some ta ->
      let l, _t, _r, b, _w = el_rect ta in
      Some (l -. 4., b)
  | None -> (
      (* no live editor: cljs anchors on the block element itself
         (selection path) — bottom-left of .ls-block *)
      match get_element_by_id ("ls-block-" ^ uuid) with
      | Some blk ->
          let l, _t, _r, b, _w = el_rect blk in
          Some (l, b)
      | None -> None)

let open_for_block ?anchor uuid =
  let anchor =
    match anchor with Some _ -> anchor | None -> anchor_of uuid
  in
  ignore
    (open_dialog ?anchor
       { uuid; uuids = []; db_id = None; is_tag = false; title = "" })

(* cljs :editor/new-property {:property-key X} — the dialog skips the
   property picker and lands in X's value editor (the p s/p p/p t
   chords). [key] matches a property ident or its title ("Tags") *)
let open_for_block_prop uuid key =
  let d =
    open_dialog ?anchor:(anchor_of uuid)
      { uuid; uuids = []; db_id = None; is_tag = false; title = "" }
  in
  ignore
    ((let* w = D.all_properties (D.uuid_ref d.target.uuid) in
     (match
        List.find_opt
          (fun p -> ident_of p = key || title_of p = key)
          (W.elems w)
      with
      (* leave the prop picker up if the property can't be resolved *)
      | Some p -> property_chosen d p
      | None -> ());
     Js.Promise.resolve ()))

(* open anchored under a DOM element (its bottom-left corner) *)
let open_for_block_at el uuid =
  let l, _t, _r, b, _w = el_rect el in
  open_for_block ~anchor:(l, b +. 4.) uuid

let open_for_current () =
  match current_target () with Some t -> ignore (open_dialog t) | None -> ()
