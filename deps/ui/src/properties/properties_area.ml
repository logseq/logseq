(* Mounted property areas.

   Page level: .ls-page-title-actions (action buttons), then
   .ls-properties-area.ls-page-properties and .ls-bidirectional-properties
   inserted into .page-inner right after .ls-page-title.

   Block level: a .ls-block-content-indent appended to each .ls-block's
   .flex.flex-col.w-full column, hosting .ls-properties-area.ls-block-properties
   (properties-position rows) and .positioned-properties.block-below
   (pills). Rows are rebuilt by refresh(), invoked on mount and on every
   sync-db-changes broadcast. *)

open Editor_dom
open Properties_dom
module I18n = Properties_i18n
module D = Properties_data
module S = Properties_state
module V = Properties_value
module Menu = Properties_menu
module W = Wire

(* ---------- row DOM ---------- *)

let show_panel_bullet row =
  D.row_closed_values row <> []
  || (match D.row_type row with "default" | "url" -> false | _ -> true)
  || D.value_empty_p (D.row_value row)

(* the property key (name + icon/bullet), used by both the panel row and
   the bottom pill *)
let property_key_inner row ~on_key_click =
  let inner = mk ~cls:"property-key-inner jtrigger-view" "div" in
  let bullet = mk ~cls:"bullet-container" "div" in
  let b = mk ~cls:"bullet" "span" in
  el_append_child bullet b;
  el_append_child inner bullet;
  let a =
    mk "a"
      ~cls:"property-k flex select-none jtrigger w-full"
      ~attrs:[ ("tabindex", "0") ]
  in
  el_set_text a (D.row_title row);
  el_append_child inner a;
  on_click a (fun _ -> on_key_click ());
  inner

let row_el (ctx : V.ctx) ~owner_is_tag ~owner_title row =
  let pair =
    mk "div"
      ~cls:
        ("property-pair property-panel-row"
        ^ (if D.value_empty_p (D.row_value row) then
             " property-panel-row-empty"
           else ""))
      ~attrs:
        [ ("data-property-title", D.row_title row)
        ; ("data-property-type", D.row_type row)
        ]
  in
  let key_panel = mk ~cls:"property-key-panel" "div" in
  el_append_child key_panel
    (property_key_inner row ~on_key_click:(fun () ->
         Menu.open_menu ~anchor:pair ~owner_uuid:ctx.block_uuid
           ~owner_id:ctx.block_id ~owner_is_tag ~owner_title
           ~refresh:ctx.refresh row));
  el_append_child pair key_panel;
  let value_container =
    mk ~cls:"ls-block property-value-container property-value-panel" "div"
  in
  if show_panel_bullet row then (
    let bullet = mk ~cls:"property-panel-bullet" "div" in
    el_set_attr bullet "aria-hidden" "true";
    let bc = mk ~cls:"bullet-container" "span" in
    el_append_child bc (mk ~cls:"bullet" "span");
    el_append_child bullet bc;
    el_append_child value_container bullet);
  el_append_child value_container (V.render ctx row);
  el_append_child pair value_container;
  pair

(* hidden-properties toggle row *)
let toggle_row () =
  let pair =
    mk ~cls:
      "property-pair property-panel-row hidden-properties-toggle-row"
      "div"
  in
  let key_panel = mk ~cls:"property-key-panel" "div" in
  let btn =
    mk "button"
      ~cls:
        "property-key-inner jtrigger-view hidden-properties-toggle-key"
      ~attrs:
        [ ( "aria-label"
          , I18n.t
              (if !S.show_hidden then "property/collapse-hidden-properties"
               else "property/show-hidden-properties") )
        ]
  in
  let icon = mk ~cls:"property-icon" "span" in
  el_append_child btn icon;
  let label =
    child_text "span" "property-k"
      (I18n.t
         (if !S.show_hidden then "property/collapse-hidden-properties"
          else "property/show-hidden-properties"))
      btn
  in
  ignore label;
  el_append_child key_panel btn;
  el_append_child pair key_panel;
  on_click btn (fun _ ->
      S.toggle_hidden ();
      S.refresh_all ());
  pair

(* ---------- pills (block-below) ---------- *)

let pill_el (ctx : V.ctx) ~owner_is_tag ~owner_title row =
  let pill =
    mk "div"
      ~cls:"bottom-property-pill bottom-property-pill-focusable"
      ~attrs:[ ("tabindex", "-1"); ("data-bottom-pill-focusable", "true")
             ; ("data-bottom-row-nav", "true") ]
  in
  let key_row = mk ~cls:"flex flex-row items-center" "div" in
  el_append_child key_row
    (property_key_inner row ~on_key_click:(fun () ->
         Menu.open_menu ~anchor:pill ~owner_uuid:ctx.block_uuid
           ~owner_id:ctx.block_id ~owner_is_tag ~owner_title
           ~refresh:ctx.refresh row));
  let colon = mk ~cls:"select-none" "span" in
  el_set_text colon ":";
  el_append_child key_row colon;
  el_append_child pill key_row;
  let content =
    mk ~cls:"bottom-property-content property-value-container" "div"
      ~attrs:[ ("style", "min-height:20px") ]
  in
  el_append_child content (V.render ctx row);
  el_append_child pill content;
  pill

let pills_el (ctx : V.ctx) ~owner_is_tag ~owner_title rows =
  let pos =
    mk ~cls:
      "positioned-properties block-below flex flex-col gap-1 text-sm \
       overflow-x-hidden w-full min-w-0" "div"
  in
  let prow =
    mk ~cls:
      "bottom-properties-row flex flex-row gap-2 items-center w-full \
       min-w-0" "div"
      ~attrs:
        [ ("data-bottom-properties-row", ctx.block_uuid)
        ; ("tabindex", "-1")
        ]
  in
  let strip =
    mk ~cls:
      "bottom-properties-pills-strip flex flex-row gap-2 items-center \
       min-w-0 flex-1 basis-0" "div"
  in
  List.iter
    (fun r -> el_append_child strip (pill_el ctx ~owner_is_tag ~owner_title r))
    rows;
  el_append_child prow strip;
  el_append_child pos prow;
  pos

(* block-below pills sit before the properties panel in the cljs layout —
   insert before the area so key order matches *)
let insert_pills_before ctx ~owner_is_tag ~owner_title before rows =
  el_insert_adjacent before "beforebegin"
    (pills_el ctx ~owner_is_tag ~owner_title rows)

let remove_all parent sel =
  let nl = el_query_all parent sel in
  let els =
    List.filter_map
      (fun i -> node_list_item nl i)
      (List.init (node_list_length nl) Fun.id)
  in
  List.iter el_remove els

(* ---------- area render ---------- *)

(* left chips: .positioned-properties.block-left inline in
   .block-main-content; one .property-value-inner per row *)
let render_left (ctx : V.ctx) ~owner_is_tag ~owner_title host rows =
  remove_all host ":scope > .positioned-properties.block-left";
  if rows <> [] then begin
    let pos = mk ~cls:"positioned-properties block-left" "div" in
    List.iter
      (fun r ->
        let chip = mk ~cls:"property-value-inner" "div" in
        el_append_child chip (V.render ctx r);
        el_append_child pos chip)
      rows;
    el_append_child host pos
  end;
  ignore owner_is_tag;
  ignore owner_title

let render_panel ctx ~owner_is_tag ~owner_title ~page_area ~show_hidden
    panel rows hidden_rows =
  List.iter
    (fun r -> el_append_child panel (row_el ctx ~owner_is_tag ~owner_title r))
    rows;
  if show_hidden && hidden_rows <> [] then
    List.iter
      (fun r ->
        el_append_child panel (row_el ctx ~owner_is_tag ~owner_title r))
      hidden_rows;
  (* cljs: the panel toggle only renders for the route page or the zoom
     root block; regular blocks expose hidden props via the block-below
     pill row instead *)
  if (page_area || owner_is_tag) && hidden_rows <> [] then
    el_append_child panel (toggle_row ());
  if page_area then (
    let wrap = mk ~cls:"ls-new-property" "div" in
    let btn =
      mk "button" ~cls:"jtrigger flex items-center gap-1"
        ~attrs:[ ("aria-label", I18n.t "property/add-new") ]
    in
    let plus = mk ~cls:"ls-icon-plus" "span" in
    el_append_child btn plus;
    ignore
      (child_text "span" "" (I18n.t "property/add-new") btn);
    el_append_child wrap btn;
    on_click btn (fun _ ->
        Properties_dialog.open_for_block ctx.block_uuid);
    el_append_child panel wrap)

let render_area ?(left_host = None) (ctx : V.ctx) ~owner_is_tag ~owner_title
    ~page_area area_el =
  el_clear area_el;
  let panel = mk ~cls:"properties-panel" "div" in
  el_append_child area_el panel;
  D.display_props ~page_title:page_area ~tag_dialog:false
    ~show_hidden:!S.show_hidden (D.uuid_ref ctx.block_uuid)
  |> Js.Promise.then_ (fun wire ->
         let rows, hidden, positioned = D.split_display wire in
         (* positioned rows come from block.temp/positioned-properties —
            never part of full/hidden; icon renders on the block itself
            (cljs hidden-block-below-property?) *)
         let left_rows = positioned "block-left" in
         let below_rows =
           List.filter
             (fun r -> D.row_ident r <> Some "logseq.property/icon")
             (positioned "block-below")
         in
         (match left_host with
          | Some host ->
              render_left ctx ~owner_is_tag ~owner_title host left_rows
          | None -> ());
         render_panel ctx ~owner_is_tag ~owner_title ~page_area
           ~show_hidden:!S.show_hidden panel rows hidden;
         (* block-below pills sit before the properties panel in the cljs
            layout — insert before the area so key order matches *)
         (* direct children only — the page-level area's parent contains
            every block's indent, and a descendant-scoped querySelectorAll
            would delete their pills *)
         (match el_parent area_el with
          | Some parent ->
              remove_all parent ":scope > .positioned-properties.block-below";
              if below_rows <> [] then
                insert_pills_before ctx ~owner_is_tag ~owner_title area_el
                  below_rows
          | None -> ());
         Js.Promise.resolve ())
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("properties render failed", e);
         Js.Promise.resolve ())
  |> ignore

(* ---------- block mounts ---------- *)

let block_uuid_of_ls_block el =
  let id = el_id el in
  if String.length id > 9 && String.sub id 0 9 = "ls-block-" then
    Some (String.sub id 9 (String.length id - 9))
  else None

(* the indent container hosting area + pills inside the block column *)
let ensure_indent_for col_el uuid =
  let sel = ".ls-block-content-indent" in
  match el_query col_el sel with
  | Some e -> Some e
  | None ->
      let ind = mk ~cls:"ls-block-content-indent" "div" in
      el_append_child col_el ind;
      ignore uuid;
      Some ind

(* register a block's property area: creates the area element once and
   returns the refresh closure *)
let mount_block_area block_el uuid =
  let col =
    match el_query block_el ".block-main-container .flex.flex-col.w-full" with
    | Some col -> Some col
    | None -> el_query block_el ".flex.flex-col.w-full"
  in
  match col with
  | None -> ()
  | Some col -> (
      match ensure_indent_for col uuid with
      | None -> ()
      | Some ind -> (
          match el_query ind ".ls-properties-area" with
          | Some _ -> () (* already mounted *)
          | None ->
              let area =
                mk "div"
                  ~cls:"ls-properties-area ls-block-properties"
                  ~attrs:[ ("id", uuid); ("tabindex", "0") ]
              in
              el_append_child ind area;
              (* block-left chips live inside .block-main-content *)
              let left_host =
                match
                  el_query block_el ".block-main-content"
                with
                | Some bmc -> Some bmc
                | None -> el_query block_el ".block-row"
              in
              let rec ctx : V.ctx =
                { block_uuid = uuid
                ; block_id = None
                ; refresh
                ; is_page = false
                ; class_schema = false
                }
              and refresh () =
                render_area ~left_host ctx ~owner_is_tag:false
                  ~owner_title:"" ~page_area:false area
              in
              refresh ();
              S.register_area area (fun () ->
                  if el_is_connected ind then refresh ()
                  else S.unregister_area area)))

(* ---------- page mount ---------- *)

let fill_bidirectional wrap (p : Model.page) =
  el_clear wrap;
  (match p.Model.page_db_id with
   | Some id ->
       D.bidirectional id
       |> Js.Promise.then_ (fun w ->
                  List.iter
                    (fun group ->
                      let g = mk ~cls:"ls-bidirectional-group" "div" in
                      let title =
                        D.gets group "title" |> Option.value ~default:""
                      in
                      let key_wrap = mk ~cls:"property-key-panel" "div" in
                      let key =
                        mk "a"
                          ~cls:"property-k flex select-none jtrigger w-full"
                          ~attrs:[ ("tabindex", "0") ]
                      in
                      el_set_text key title;
                      el_append_child key_wrap key;
                      el_append_child g key_wrap;
                      let vc =
                        mk ~cls:"ls-block property-value-container" "div"
                      in
                      let pv = mk ~cls:"property-value" "div" in
                      (match D.getf group "entities" with
                       | Some ents ->
                           List.iter
                             (fun e ->
                               ignore
                                 (child_text "span" "block-title-wrap"
                                    (D.ref_title e) pv))
                             (D.elems ents)
                       | None -> ());
                      el_append_child vc pv;
                      el_append_child g vc;
                      el_append_child wrap g)
                    (D.elems w);
              Js.Promise.resolve ())
       |> ignore
   | None -> ())

(* title action buttons: "Set property" / "Add tag property" /
   "Configure" (property page) *)
let title_actions (p : Model.page) =
  let actions = mk ~cls:"ls-page-title-actions" "div" in
  let row = mk ~cls:"flex flex-row items-center gap-2" "div" in
  let uuid = Option.value ~default:"" p.Model.page_uuid in
  if p.Model.page_is_tag then (
    let btn = mk "button" ~cls:"ui__button" in
    el_set_text btn (I18n.t "class/add-property");
    el_append_child row btn;
    on_click btn (fun _ ->
        Properties_dialog.open_dialog
          { Properties_dialog.uuid
          ; db_id = p.Model.page_db_id
          ; is_tag = true
          ; title = p.Model.page_title
          }))
  else (
    let btn = mk "button" ~cls:"ui__button" in
    el_set_text btn (I18n.t "property/set-property");
    el_append_child row btn;
    on_click btn (fun _ ->
        Properties_dialog.open_for_block uuid));
  el_append_child actions row;
  actions

let mount_page_area page_inner =
  (* only once per page-inner instance *)
  match el_query page_inner ".ls-properties-area.ls-page-properties" with
  | Some _ -> ()
  | None -> (
      match !Runtime.current_page, el_query page_inner ".ls-page-title" with
      | Some p, Some title_el -> (
          match p.Model.page_uuid with
          | None -> ()
          | Some uuid ->
              let actions = title_actions p in
              el_insert_adjacent title_el "afterend" actions;
              let area =
                mk "div"
                  ~cls:"ls-properties-area ls-page-properties"
                  ~attrs:[ ("id", uuid); ("tabindex", "0") ]
              in
              el_insert_adjacent actions "afterend" area;
              let bidi =
                mk ~cls:"w-full ls-bidirectional-properties mt-8" "div"
              in
              el_insert_adjacent area "afterend" bidi;
              let rec ctx : V.ctx =
                { block_uuid = uuid
                ; block_id = p.Model.page_db_id
                ; refresh
                ; is_page = true
                ; class_schema = false
                }
              and refresh () =
                render_area ctx ~owner_is_tag:p.Model.page_is_tag
                  ~owner_title:p.Model.page_title ~page_area:true area;
                fill_bidirectional bidi p
              in
              refresh ();
              S.register_area area (fun () ->
                  if el_is_connected area then refresh ()
                  else S.unregister_area area))
      | _ -> ())

(* ---------- observer entry ---------- *)

let ensure_all () =
  S.chain_worker ();
  (* page-level *)
  (match doc_query ".page-inner" with
   | Some inner -> mount_page_area inner
   | None -> ());
  (* block-level *)
  let blocks = query_selector_all ".ls-block" in
  for i = 0 to node_list_length blocks - 1 do
    match node_list_item blocks i with
    | Some el ->
        if not (el_matches el ".block-add-button") then (
          match block_uuid_of_ls_block el with
          | Some uuid -> mount_block_area el uuid
          | None -> ())
    | None -> ()
  done
