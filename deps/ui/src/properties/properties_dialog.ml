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

open Editor_dom
open Properties_dom
module I18n = Properties_i18n
module D = Properties_data
module S = Properties_state
module Sel = Properties_select
module V = Properties_value
module W = Wire

type target =
  { uuid : string
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

(* close this dialog (top overlay) *)
let close () = S.pop_overlay ()

(* after "Text"/"URL" is chosen the cljs flow creates the empty value
   block and lands the caret in it *)
let add_empty_text_block d prop =
  let ident = ident_of prop in
  V.set_pending_edit ~block_uuid:d.target.uuid ~ident;
  D.create_property_text_block ~block_uuid:d.target.uuid ~ident
    ~title:"" ~new_block_id:(Platform.random_uuid ()) ()
  |> ignore;
  S.refresh_all ()

(* chosen an existing property from the select *)
let rec property_chosen d prop =
  if d.target.is_tag then (
    ignore
      (D.class_add_property ~class_uuid:d.target.uuid
         ~ident:(ident_of prop));
    S.refresh_all ();
    close ())
  else if is_checkbox prop then (
    write_prop_value d prop (Some (W.Bool false));
    close ())
  else (
    d.phase <- Value_edit prop;
    render d)

(* ---------- phase renderers ---------- *)

and render (d : dlg) =
  match d.body with
  | None -> ()
  | Some body -> (
      el_clear body;
      match d.phase with
      | Prop_select -> render_prop_select d body
      | Type_select name -> render_type_select d body name
      | Node_tags prop -> render_node_tags d body prop
      | Value_edit prop -> render_value_edit d body prop)

and render_prop_select d body =
  let wrap =
    mk ~cls:"ls-property-add flex flex-row items-center property-key" "div"
      ~attrs:[ ("data-keep-selection", "true") ]
  in
  let key_wrap = mk ~cls:"ls-property-key" "div" in
  el_append_child wrap key_wrap;
  el_append_child body wrap;
  D.all_properties (D.uuid_ref d.target.uuid)
  |> Js.Promise.then_ (fun w ->
         let props = D.elems w in
         let items =
           List.filter_map
             (fun p ->
               match title_of p with
               | "" -> None
               | t ->
                   Some
                     (Sel.item ~tip:(ident_of p) ~icon:"letter-t" t
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

and type_item d name ty =
  Sel.item (I18n.t ("property/type-" ^ ty)) (fun () ->
      on_type_chosen d name ty)

and render_type_select d body name =
  let wrap =
    mk ~cls:"ls-property-add flex flex-row items-center gap-1" "div"
  in
  let key = mk ~cls:"property-key flex flex-row items-center" "div" in
  el_set_text key name;
  el_append_child wrap key;
  (* cljs renders the select-trigger's placeholder value as visible text;
     e2e asserts get-by-text "Select a property type" *)
  ignore
    (child_text "span" "text-sm text-muted-foreground select-placeholder"
       (I18n.t "property/select-type-placeholder") wrap);
  el_append_child body wrap;
  let items =
    List.map
      (fun ty -> type_item d name ty)
      [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"
      ; "node" ]
  in
  let sel, _input =
    Sel.create
      ~placeholder:(I18n.t "property/select-type-placeholder")
      ~on_escape:close items
  in
  el_append_child wrap sel

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
  |> Js.Promise.then_ (fun res ->
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
                close ())
              else (
                match ty with
                | "checkbox" ->
                    write_prop_value d prop (Some (W.Bool false));
                    close ()
                | "default" | "url" ->
                    add_empty_text_block d prop;
                    close ()
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
  let wrap = mk ~cls:"flex flex-1 col-span-3" "div" in
  el_append_child body wrap;
  D.all_classes ()
  |> Js.Promise.then_ (fun w ->
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
                (D.elems w)
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
    | Some w -> D.elems w
    | None -> []
  in
  if closed <> [] then
    List.filter_map
      (fun c ->
        match D.entity_id_of c with
        | Some id ->
            Some
              (Sel.item (D.ref_title c) (fun () ->
                   write_prop_value d prop (Some (W.Int id));
                   close ()))
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
                       write_prop_value d prop (Some (W.Int id));
                       close ()))
            | None -> None)
          wire_values

and render_value_edit d body prop =
  let wrap = mk ~cls:"flex flex-1 property-select" "div" in
  el_append_child body wrap;
  let ty = type_of prop in
  if ty = "date" || ty = "datetime" then (
    (* inline date picker in the dialog *)
    let picker =
      mk ~cls:"ls-property-date-picker flex flex-row gap-2" "div"
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
            close ()
        | "Escape" -> prevent_default ev; stop_propagation ev; close ()
        | _ -> ())
      true)
  else (
    let placeholder = I18n.t1 "property/set-placeholder" (title_of prop) in
    let fetch, on_search =
      if List.mem ty [ "node"; "page"; "class"; "property" ] then (
        let initial, on_search =
          V.node_items_source ~block:(D.uuid_ref d.target.uuid) ~prop
            ~on_pick:(fun id ->
              write_prop_value d prop (Some (W.Int id));
              close ())
        in
        (initial, Some on_search))
      else
        ( D.property_values ~property_ident:(ident_of prop)
            ~block:(D.uuid_ref d.target.uuid)
          |> Js.Promise.then_ (fun w ->
                 Js.Promise.resolve (value_items d prop (D.elems w)))
        , None )
    in
    fetch
    |> Js.Promise.then_ (fun items ->
           let on_new =
             if ty = "number" then
               Some
                 (fun text ->
                   match Float.of_string_opt (String.trim text) with
                   | Some n ->
                       write_prop_value d prop (Some (W.Float n));
                       close ()
                   | None -> ())
             else if ty = "node" then
               Some
                 (fun text ->
                   D.create_page text
                   |> Js.Promise.then_ (fun res ->
                          (match D.geti res "db/id" with
                           | Some id ->
                               write_prop_value d prop (Some (W.Int id))
                           | None -> ());
                          close ();
                          Js.Promise.resolve ())
                   |> ignore)
             else
               Some
                 (fun text ->
                   (* text value -> create value block *)
                   D.create_property_text_block ~block_uuid:d.target.uuid
                     ~ident:(ident_of prop) ~title:text
                     ~new_block_id:(Platform.random_uuid ()) ()
                   |> ignore;
                   S.refresh_all ();
                   close ())
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
let open_dialog ?anchor target =
  let d = { target; phase = Prop_select; body = None; pending_type = None } in
  let style =
    match anchor with
    | Some (x, y) ->
        Printf.sprintf
          "position:fixed;left:%.0fpx;top:%.0fpx;z-index:9999;min-width:320px"
          x y
    | None ->
        "position:fixed;left:50%;top:30%;transform:translateX(-50%);\
         z-index:9999;min-width:320px"
  in
  (* cljs popup content chrome: rounded popover card *)
  let root =
    mk
      ~cls:
        "ls-property-dialog rounded-md border bg-popover p-1 \
         text-popover-foreground shadow-md"
      "div" ~attrs:[ ("style", style) ]
  in
  let inner =
    mk ~cls:"ls-property-input flex flex-1 flex-row items-center \
             flex-wrap gap-1" "div"
  in
  el_append_child root inner;
  d.body <- Some inner;
  S.push_overlay root ~on_escape:(fun () -> ());
  render d

(* ---------- triggers ---------- *)

(* block uuid the command applies to: editing block > selected block >
   current page *)
let current_target () : target option =
  match Editor_state.editing_uuid () with
  | Some u ->
      Some { uuid = u; db_id = None; is_tag = false; title = "" }
  | None -> (
      match Platform.selected_block_uuids () with
      | u :: _ ->
          Some { uuid = u; db_id = None; is_tag = false; title = "" }
      | [] -> (
          match !Runtime.current_page with
          | Some p ->
              let uuid = Option.value ~default:"" p.Model.page_uuid in
              if uuid = "" then None
              else
                Some
                  { uuid; db_id = p.Model.page_db_id
                  ; is_tag = p.Model.page_is_tag; title = p.Model.page_title
                  }
          | None -> None))

(* open the dialog for a specific block uuid (slash command path) *)
let open_for_block ?anchor uuid =
  open_dialog ?anchor { uuid; db_id = None; is_tag = false; title = "" }

(* open anchored under a DOM element (its bottom-left corner) *)
let open_for_block_at el uuid =
  let l, _t, _r, b, _w = el_rect el in
  open_for_block ~anchor:(l, b +. 4.) uuid

let open_for_current () =
  match current_target () with Some t -> open_dialog t | None -> ()
