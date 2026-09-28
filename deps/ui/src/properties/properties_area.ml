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

let render_pills (ctx : V.ctx) ~owner_is_tag ~owner_title container rows =
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
  el_append_child container pos

let remove_all parent sel =
  let nl = el_query_all parent sel in
  let els =
    List.filter_map
      (fun i -> node_list_item nl i)
      (List.init (node_list_length nl) Fun.id)
  in
  List.iter el_remove els

(* ---------- area render ---------- *)

(* split rows into block-left chips, block-below pills and panel rows *)
let partition_rows rows =
  let left, rest =
    List.partition
      (fun r -> D.row_position r = "logseq.property.ui-position/block-left")
      rows
  in
  let below, panel =
    List.partition
      (fun r ->
        D.row_position r = "logseq.property.ui-position/block-below")
      rest
  in
  (left, below, panel)

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

(* cljs properties' drops icon/query/class-properties from the visible
   panel rows *)
let non_panel_idents =
  [ "logseq.property/icon"; "logseq.property/query"
  ; "logseq.property.class/properties" ]

let is_panel_row r =
  not
    (List.mem (Option.value ~default:"" (D.row_ident r)) non_panel_idents)

(* cljs new-property: .ls-new-property > button (shui secondary sm +
   "jtrigger flex") > icon plus + label *)
let new_property_btn (ctx : V.ctx) ~for_class ~owner_title =
  let wrap = mk ~cls:"ls-new-property" "div" in
  let btn =
    mk "button"
      ~cls:
        "ui__button inline-flex cursor-pointer items-center \
         justify-center whitespace-nowrap rounded-md text-sm gap-1 \
         font-medium ring-offset-background transition-colors \
         focus-visible:outline-none focus-visible:ring-2 \
         focus-visible:ring-ring focus-visible:ring-offset-2 \
         disabled:pointer-events-none disabled:opacity-50 select-none \
         bg-secondary/70 text-secondary-foreground \
         hover:bg-secondary/100 active:opacity-80 as-secondary \
         h-7 rounded px-3 py-1 jtrigger flex"
      ~attrs:[ ("tabindex", "0")
             ; ("aria-label", I18n.t "property/add-new") ]
  in
  (* shui ui/icon markup: span.ui__icon.ti.ls-icon-plus > i.ti.ti-plus *)
  let plus =
    mk ~cls:"ui__icon ti ls-icon-plus bottom-property-action-icon" "span"
  in
  el_append_child plus (mk ~cls:"ti ti-plus" "i");
  el_append_child btn plus;
  ignore
    (child_text "span" "" (I18n.t "property/add-new") btn);
  el_append_child wrap btn;
  on_click btn (fun _ ->
      if for_class then
        Properties_dialog.open_dialog
          { Properties_dialog.uuid = ctx.block_uuid
          ; db_id = ctx.block_id
          ; is_tag = true
          ; title = owner_title }
      else Properties_dialog.open_for_block ctx.block_uuid);
  wrap

(* cljs show-hidden-properties-toggle-button?: the toggle row only
   renders when the owning surface is the current route page or the
   zoom root block — hidden props on ordinary blocks stay unreachable *)
let can_toggle_hidden (ctx : V.ctx) ~below_rows =
  match !Runtime.current_route with
  | Some (Model.Block_zoom u) ->
      u = ctx.block_uuid && below_rows = []
  | _ -> (
      match !Runtime.current_page with
      | Some (p : Model.page) -> p.page_uuid = Some ctx.block_uuid
      | None -> false)

let render_panel ctx ~owner_is_tag ~owner_title ~page_area ~show_hidden
    ~can_toggle panel rows hidden_rows =
  List.iter
    (fun r -> el_append_child panel (row_el ctx ~owner_is_tag ~owner_title r))
    rows;
  (* cljs: hidden properties (and their toggle) are skipped for class
     pages — the class section hosts them instead *)
  if not owner_is_tag then begin
    if show_hidden && hidden_rows <> [] then
      List.iter
        (fun r ->
          el_append_child panel (row_el ctx ~owner_is_tag ~owner_title r))
        hidden_rows;
    if can_toggle && hidden_rows <> [] then
      el_append_child panel (toggle_row ())
  end;
  ignore page_area

(* block.temp/positioned-properties on the get-blocks wire:
   {position -> [display-property-map]} — cljs reads the same key in
   block-positioned-properties. Values come from the block's own attrs. *)
let positioned_rows block_w position =
  match W.get block_w "block.temp/positioned-properties" with
  | Some m -> (
      match W.get m position with
      | Some props ->
          List.filter_map
            (fun p ->
              match D.getk p "db/ident" with
              | Some ident when ident <> "logseq.property/icon" ->
                  Some
                    (W.Map
                       [ (W.Keyword "property-id", W.Keyword ident)
                       ; (W.Keyword "property", p)
                       ; ( W.Keyword "value"
                         , Option.value ~default:W.Nil
                             (W.get block_w ident) )
                       ])
              | _ -> None)
            (D.elems props)
      | None -> [])
  | None -> []

(* cljs show-properties-area?: the area only exists in the DOM when
   there is at least one row (panel/left/below/hidden) to render. *)
let render_area ?(left_host = None) ~host (ctx : V.ctx) ~owner_is_tag
    ~owner_title ~page_area area_el =
  let display =
    D.display_props ~page_title:page_area ~tag_dialog:false
      ~show_hidden:!S.show_hidden (D.uuid_ref ctx.block_uuid)
  in
  let block_w =
    match left_host with
    | Some _ -> D.block_render_data ctx.block_uuid
    | None -> Js.Promise.resolve W.Nil
  in
  Js.Promise.all2 (display, block_w)
  |> Js.Promise.then_ (fun (wire, block_w) ->
         let rows, hidden = D.split_display wire in
         let left_rows, below_rows, panel_rows =
           match left_host with
           | Some _ ->
               ( positioned_rows block_w "block-left"
               , positioned_rows block_w "block-below"
               , rows )
           | None -> partition_rows rows
         in
         let has_content =
           left_rows <> [] || below_rows <> [] || panel_rows <> []
           || hidden <> []
         in
         if has_content && not (el_is_connected area_el) then
           el_append_child host area_el;
         if not has_content then (
           if el_is_connected area_el then el_remove area_el;
           remove_all host ":scope > .positioned-properties.block-below")
         else (
           el_clear area_el;
           let panel = mk ~cls:"properties-panel" "div" in
           el_append_child area_el panel;
           (match left_host with
            | Some lh ->
                render_left ctx ~owner_is_tag ~owner_title lh left_rows
            | None -> ());
           let panel_rows =
             match left_host with
             | Some _ -> panel_rows
             | None -> left_rows @ panel_rows
           in
           render_panel ctx ~owner_is_tag ~owner_title ~page_area
             ~show_hidden:!S.show_hidden
             ~can_toggle:(can_toggle_hidden ctx ~below_rows:[])
             panel panel_rows hidden;
           (* pills render next to the area inside the indent container *)
           remove_all host ":scope > .positioned-properties.block-below";
           if below_rows <> [] then
             render_pills ctx ~owner_is_tag ~owner_title host below_rows);
         Js.Promise.resolve ())
  |> ignore

(* block area: one get-blocks render-data call supplies the positioned
   property maps (position already resolved worker-side like cljs
   :block.temp/positioned-properties), the display-properties rows for
   the panel, and the block's own attrs for values *)
let render_block_area ~ind ~left_host ctx ~owner_is_tag ~owner_title area_el =
  D.block_render_data ctx.block_uuid
  |> Js.Promise.then_ (fun block_wire ->
         match block_wire with
         | W.Map _ ->
             let left_rows =
               D.positioned_rows block_wire "block-left"
             in
             let below_rows =
               D.positioned_rows block_wire "block-below"
             in
             let display =
               Option.value ~default:W.Nil
                 (W.get block_wire "block.temp/display-properties")
             in
             let rows, hidden = D.split_display display in
             let has_content =
               left_rows <> [] || below_rows <> [] || rows <> []
               || hidden <> []
             in
             if has_content && not (el_is_connected area_el) then
               el_append_child ind area_el;
             if not has_content then (
               if el_is_connected area_el then el_remove area_el;
               remove_all ind ":scope > .positioned-properties.block-below")
             else (
               el_clear area_el;
               let panel = mk ~cls:"properties-panel" "div" in
               el_append_child area_el panel;
               (match left_host with
                | Some host ->
                    render_left ctx ~owner_is_tag ~owner_title host
                      left_rows
                | None -> ());
               render_panel ctx ~owner_is_tag ~owner_title ~page_area:false
                 ~show_hidden:!S.show_hidden
                 ~can_toggle:(can_toggle_hidden ctx ~below_rows)
                 panel rows hidden;
               remove_all ind ":scope > .positioned-properties.block-below";
               if below_rows <> [] then
                 render_pills ctx ~owner_is_tag ~owner_title ind below_rows);
             Js.Promise.resolve ()
         | _ -> Js.Promise.resolve ())

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
          match el_get_attr ind "data-props-mounted" with
          | Some _ -> () (* already mounted *)
          | None ->
              el_set_attr ind "data-props-mounted" "1";
              (* created detached — render_area attaches it only when
                 there is something to show *)
              let area =
                mk "div"
                  ~cls:"ls-properties-area ls-block-properties"
                  ~attrs:[ ("id", uuid); ("tabindex", "0") ]
              in
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
                ; refresh = (fun () -> ignore (refresh ()))
                ; is_page = false
                ; class_schema = false
                }
              and refresh () =
                render_block_area ~ind ~left_host ctx ~owner_is_tag:false
                  ~owner_title:"" area
              in
              ignore (refresh ());
              (* register the always-connected indent, not area: the
                 area element stays detached when the block has no
                 visible rows, and live_areas prunes detached containers,
                 which would unregister the refresh before a later
                 property tx lands *)
              S.register_area ind (fun () ->
                  if el_is_connected ind then refresh ()
                  else (
                    S.unregister_area ind;
                    Js.Promise.resolve ()))))

(* ---------- page mount ---------- *)

let render_bidi_groups wrap w =
  List.iter
    (fun group ->
      let g = mk ~cls:"ls-bidirectional-group" "div" in
      let title = D.gets group "title" |> Option.value ~default:"" in
      let key_wrap = mk ~cls:"property-key-panel" "div" in
      let key =
        mk "a" ~cls:"property-k flex select-none jtrigger w-full"
          ~attrs:[ ("tabindex", "0") ]
      in
      el_set_text key title;
      el_append_child key_wrap key;
      el_append_child g key_wrap;
      let vc = mk ~cls:"ls-block property-value-container" "div" in
      let pv = mk ~cls:"property-value" "div" in
      (match D.getf group "entities" with
       | Some ents ->
           List.iter
             (fun e ->
               ignore
                 (child_text "span" "block-title-wrap" (D.ref_title e) pv))
             (D.elems ents)
       | None -> ());
      el_append_child vc pv;
      el_append_child g vc;
      el_append_child wrap g)
    (D.elems w)

(* shui button ghost sm — cljs components.cljs with-button-classes *)
let ghost_btn_cls =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:pointer-events-none disabled:opacity-50 select-none \
   hover:bg-secondary/70 hover:text-secondary-foreground \
   active:opacity-80 as-ghost h-7 rounded px-3 py-1 \
   px-2 py-0 h-6 text-xs text-muted-foreground"

(* title action buttons — cljs db-page-title-actions: "Add icon" (when no
   icon prop) + "Set property"/"Add tag property"/"Configure" *)
let title_actions (p : Model.page) =
  let actions = mk ~cls:"ls-page-title-actions" "div" in
  let row = mk ~cls:"flex flex-row items-center gap-2" "div" in
  let uuid = Option.value ~default:"" p.Model.page_uuid in
  let add_btn label on =
    let btn = mk "button" ~cls:ghost_btn_cls in
    el_set_text btn label;
    el_append_child row btn;
    on_click btn on
  in
  (* cljs page.cljs db-page-title-actions: "Add icon" opens the icon
     picker directly, writing logseq.property/icon *)
  add_btn (I18n.t "command.editor/add-property-icon") (fun _ ->
      Icon_picker.open_picker ~anchor:row
        ~del:(p.Model.page_icon <> None)
        ~on_chosen:(fun c ->
          let op =
            match c with
            | Icon_picker.Remove ->
                Outliner_ops.op "remove-block-property"
                  [ Wire.Uuid uuid
                  ; Wire.Keyword "logseq.property/icon" ]
            | Icon_picker.Emoji id ->
                Outliner_ops.op "set-block-property"
                  [ Wire.Uuid uuid
                  ; Wire.Keyword "logseq.property/icon"
                  ; Wire.Map
                      [ Wire.Keyword "type", Wire.Keyword "emoji"
                      ; Wire.Keyword "id", Wire.String id ] ]
            | Icon_picker.Tabler (id, color) ->
                Outliner_ops.op "set-block-property"
                  [ Wire.Uuid uuid
                  ; Wire.Keyword "logseq.property/icon"
                  ; Wire.Map
                      ([ Wire.Keyword "type", Wire.Keyword "tabler-icon"
                       ; Wire.Keyword "id", Wire.String id ]
                      @ (match color with
                         | Some c -> [ Wire.Keyword "color", Wire.String c ]
                         | None -> [])) ]
          in
          let p =
            Outliner_ops.apply [ op ]
            |> Js.Promise.then_ (fun _ -> !Runtime.reload_current_view ())
          in
          ignore p));
  if p.Model.page_is_tag then
    add_btn (I18n.t "class/add-property") (fun _ ->
        let l, _t, _r, b, _w = el_rect row in
        Properties_dialog.open_dialog ~anchor:(l, b +. 4.)
          { Properties_dialog.uuid
          ; db_id = p.Model.page_db_id
          ; is_tag = true
          ; title = p.Model.page_title
          })
  else
    add_btn (I18n.t "property/set-property") (fun _ ->
        Properties_dialog.open_for_block_at row uuid);
  el_append_child actions row;
  actions

(* Page surface: attach .ls-properties-area only when there are rows to
   show (cljs show-properties-area?); attach .ls-bidirectional-properties
   only when bidirectional groups exist. *)
let rec render_page_area ctx (p : Model.page) ~attach_area ~attach_bidi
    ~detach area bidi =
  D.display_props ~page_title:true ~tag_dialog:false
    ~show_hidden:!S.show_hidden (D.uuid_ref ctx.block_uuid)
  |> Js.Promise.then_ (fun wire ->
         let rows, hidden = D.split_display wire in
         let rows = List.filter is_panel_row rows in
         let _left, _below, panel_rows = partition_rows rows in
         (* cljs: on a class/tag page the title block is collapsed, so
            db-properties-cp never mounts — no .ls-properties-area at
            all; the class section only lives in the tag dialog *)
         if p.Model.page_is_tag then
           detach ()
         else if panel_rows = [] && hidden = [] then
           detach ()
         else (
           attach_area ();
           el_clear area;
           let panel = mk ~cls:"properties-panel" "div" in
           el_append_child area panel;
           render_panel ctx ~owner_is_tag:false
             ~owner_title:p.Model.page_title ~page_area:true
             ~show_hidden:!S.show_hidden
             ~can_toggle:(can_toggle_hidden ctx ~below_rows:[])
             panel panel_rows hidden;
           el_append_child area
             (new_property_btn ctx ~for_class:false
                ~owner_title:p.Model.page_title));
         fill_bidirectional_page p ~attach_bidi bidi;
         Js.Promise.resolve ())

and fill_bidirectional_page (p : Model.page) ~attach_bidi bidi =
  match p.Model.page_db_id with
  | None -> ()
  | Some id ->
      D.bidirectional id
      |> Js.Promise.then_ (fun w ->
             let groups =
               match w with
               | W.List xs | W.Array xs -> xs
               | _ -> []
             in
             if groups = [] then begin
               if el_is_connected bidi then el_remove bidi
             end else (
               attach_bidi ();
               el_clear bidi;
               render_bidi_groups bidi w);
             Js.Promise.resolve ())
      |> ignore

(* idempotent mount — cljs db-properties-cp sits in a plain div inside
   the title .ls-block, after .block-main-container; registration + the
   mounted marker live on .page-inner, which stays connected for as long
   as the page is mounted (the actions node can be swapped out by an LUI
   re-render) *)
let mount_page_props page_inner (p : Model.page) uuid =
  if el_get_attr page_inner "data-props-mounted" <> Some uuid then (
    el_set_attr page_inner "data-props-mounted" uuid;
    (* a remount (same .page-inner node, different page) must not stack
       a second area on top of the previous page's *)
    (match el_query page_inner ".ls-properties-area" with
     | Some el -> el_remove el
     | None -> ());
    (match el_query page_inner ".ls-bidirectional-properties" with
     | Some el -> el_remove el
     | None -> ());
    (* cljs properties-area renders .ls-properties-area only when
       there is something to show (show-properties-area?) and the
       .ls-new-property button only on sidebar/tag-dialog surfaces —
       the main page surface shows neither when empty. area/bidi are
       attached lazily once data proves non-empty. *)
    let area =
      mk "div"
        ~cls:"ls-properties-area ls-page-properties"
        ~attrs:[ ("id", uuid); ("tabindex", "0") ]
    in
    let bidi =
      mk ~cls:"w-full ls-bidirectional-properties mt-8" "div"
    in
    let holder =
      match el_query page_inner ".ls-page-title .ls-block" with
      | Some block_el ->
          let h = mk "div" in
          el_append_child block_el h;
          h
      | None -> mk "div"
    in
    let attach_area () =
      if not (el_is_connected area) then el_append_child holder area
    in
    let attach_bidi () =
      if not (el_is_connected bidi) then (
        attach_area ();
        el_append_child holder bidi)
    in
    let detach () =
      if el_is_connected bidi then el_remove bidi;
      if el_is_connected area then el_remove area
    in
    let rec ctx : V.ctx =
      { block_uuid = uuid
      ; block_id = p.Model.page_db_id
      ; refresh = (fun () -> ignore (refresh ()))
      ; is_page = true
      ; class_schema = false
      }
    and refresh () =
      render_page_area ctx p ~attach_area ~attach_bidi ~detach
        area bidi
    in
    ignore (refresh ());
    S.unregister_area page_inner;
    S.register_area page_inner (fun () ->
        if el_is_connected page_inner then refresh ()
        else (
          S.unregister_area page_inner;
          Js.Promise.resolve ())))

let mount_page_area page_inner =
  (* cljs db-page-title: title actions hide while the page title itself is
     being edited (page-title-actions-cp only when edit-block ≠ page) *)
  let editing_title =
    el_query page_inner ".ls-page-title .editor-wrapper" <> None
  in
  let with_page f =
    (* journals view mounts one .page-inner per journal — current_page is
       unset there, so resolve the page from the title's block uuid *)
    let page =
      match !Runtime.current_page with
      | Some p -> Some p
      | None -> (
          match el_query page_inner ".ls-page-title [blockid]" with
          | Some title_block -> (
              let bid = el_get_attr title_block "blockid" in
              List.find_opt
                (fun (j : Model.page) -> j.Model.page_uuid = bid)
                !Runtime.current_journals
            )
          | None -> None)
    in
    match page, el_query page_inner ".ls-page-title" with
    | Some p, Some title_el -> (
        match p.Model.page_uuid with
        | Some uuid -> f p uuid ~title_el
        | None -> ())
    | _ -> ()
  in
  match el_query page_inner ".ls-page-title-actions" with
  | Some actions ->
      set_style actions (if editing_title then "display: none" else "");
      with_page (fun p uuid ~title_el:_ ->
          mount_page_props page_inner p uuid)
  | None ->
      with_page (fun p uuid ~title_el ->
          let actions = title_actions p in
          (* cljs: actions sit inside .block-content-wrapper, opacity-0
             until hover; keep them there, not as a sibling of the title *)
          (match el_query page_inner ".ls-page-title .block-content-wrapper"
           with
           | Some cw -> el_insert_adjacent cw "afterbegin" actions
           | None -> el_insert_adjacent title_el "afterend" actions);
          mount_page_props page_inner p uuid)

(* ---------- right-sidebar page properties ---------- *)

(* cljs page.cljs sidebar-page-properties expands db-properties-cp
   (sidebar-properties? => show-properties? and, for classes,
   show-class-properties-area?) inside .ls-sidebar-page-properties.
   Unlike the main-page surface, tag/class pages DO mount the area here;
   a non-class page with no rows renders only the "Add property" button
   (no .ls-properties-area). *)

(* cljs class-properties-key: the built-in
   logseq.property.class/properties key — letter-p icon + "Tag
   Properties" *)
let class_properties_key () =
  let key = mk ~cls:"property-key text-sm" "div" in
  let inner = mk ~cls:"property-key-inner jtrigger-view" "div" in
  let icon = mk ~cls:"property-icon" "div" in
  let btn = mk "button" ~cls:"flex items-center property-m" in
  let s = mk ~cls:"ui__icon ti ls-icon-letter-p opacity-50" "span" in
  el_append_child s (mk ~cls:"ti ti-letter-p" "i");
  el_append_child btn s;
  el_append_child icon btn;
  el_append_child inner icon;
  let a =
    mk "a" ~cls:"property-k flex select-none jtrigger w-full"
      ~attrs:[ ("tabindex", "0") ]
  in
  el_set_text a (I18n.t "property.built-in/class-properties");
  el_append_child inner a;
  el_append_child key inner;
  key

(* class-schema rows: get-class-properties returns property entities;
   properties-section renders each as a row whose value is the schema
   config (nil here — same shape positioned_rows synthesizes) *)
let class_schema_row prop =
  match W.map_get_string prop "db/ident" with
  | Some ident ->
      Some
        (W.Map
           [ (W.Keyword "property-id", W.Keyword ident)
           ; (W.Keyword "property", prop)
           ; (W.Keyword "value", W.Nil) ])
  | None -> None

let render_class_section (ctx : V.ctx) ~owner_title host =
  (* .flex.flex-col.gap-1.mt-2 > [header; .gap-1.flex.flex-col > rows +
     .ml-5 > new-property] *)
  let section = mk ~cls:"flex flex-col gap-1 mt-2" "div" in
  let head = mk ~attrs:[ ("style", "font-size: 15px") ] "div" in
  el_append_child head (class_properties_key ());
  ignore (child_text "div" "text-muted-foreground ml-5"
            (I18n.t "class/tag-properties-desc") head);
  el_append_child section head;
  let col = mk ~cls:"gap-1 flex flex-col" "div" in
  el_append_child section col;
  el_append_child host section;
  D.class_properties (D.uuid_ref ctx.block_uuid)
  |> Js.Promise.then_ (fun w ->
         let props = W.args_list w in
         List.iter
           (fun p ->
             match class_schema_row p with
             | Some row ->
                 el_append_child col
                   (row_el ctx ~owner_is_tag:true ~owner_title row)
             | None -> ())
           props;
         let add_wrap = mk ~cls:"ml-5" "div" in
         el_append_child add_wrap
           (new_property_btn ctx ~for_class:true ~owner_title);
         el_append_child col add_wrap;
         Js.Promise.resolve ())
  |> ignore

(* host is the emitted .ls-properties-area.ls-page-properties div;
   mounts once per element via the data-props-mounted marker *)
let mount_sidebar_area (area : el) =
  match el_get_attr area "data-sb-uuid" with
  | None | Some "" -> ()
  | Some uuid ->
      if el_get_attr area "data-sb-mounted" = Some "1" then ()
      else (
        el_set_attr area "data-sb-mounted" "1";
        let db_id =
          match el_get_attr area "data-sb-db-id" with
          | Some "" | None -> None
          | Some s -> ( try Some (int_of_string s) with _ -> None )
        in
        let title =
          Option.value ~default:"" (el_get_attr area "data-sb-title")
        in
        let is_tag = el_get_attr area "data-sb-tag" = Some "1" in
        let host =
          match el_parent area with
          | Some h -> h
          | None -> area
        in
        let bidi = mk ~cls:"w-full ls-bidirectional-properties mt-8" "div" in
        let rec ctx : V.ctx =
          { block_uuid = uuid
          ; block_id = db_id
          ; refresh = (fun () -> ignore (refresh ()))
          ; is_page = true
          ; class_schema = false
          }
        and refresh () = render ()
        and render () =
          D.display_props ~page_title:false ~tag_dialog:false ~sidebar:true
            ~show_hidden:!S.show_hidden (D.uuid_ref uuid)
          |> Js.Promise.then_ (fun wire ->
                 let rows, hidden = D.split_display wire in
                 let rows = List.filter is_panel_row rows in
                 let _l, below_rows, panel_rows = partition_rows rows in
                 el_clear area;
                 let before_hr el =
                   match el_query host "hr" with
                   | Some hr -> el_insert_adjacent hr "beforebegin" el
                   | None -> el_insert_adjacent host "beforeend" el
                 in
                 if (not is_tag) && panel_rows = [] && hidden = [] then (
                   (* cljs: (and empty-full empty-hidden (not class?)) →
                      just [new-property], no .ls-properties-area *)
                   el_remove area;
                   if el_query host ".ls-new-property" = None then
                     before_hr
                       (new_property_btn ctx ~for_class:false
                          ~owner_title:title))
                 else (
                   if not (el_is_connected area) then begin
                     match el_query host ".ls-new-property" with
                     | Some btn -> el_insert_adjacent btn "afterend" area
                     | None -> before_hr area
                   end;
                   let panel = mk ~cls:"properties-panel" "div" in
                   el_append_child area panel;
                   render_panel ctx ~owner_is_tag:is_tag
                     ~owner_title:title ~page_area:true
                     ~show_hidden:!S.show_hidden
                     ~can_toggle:(can_toggle_hidden ctx ~below_rows)
                     panel panel_rows hidden;
                   if is_tag then
                     render_class_section ctx ~owner_title:title area
                   else
                     el_append_child area
                       (new_property_btn ctx ~for_class:false
                          ~owner_title:title));
                 (* bidirectional area renders for page targets too *)
                 (match db_id with
                  | Some id ->
                      D.bidirectional id
                      |> Js.Promise.then_ (fun w ->
                             let groups =
                               match w with
                               | W.List xs | W.Array xs -> xs
                               | _ -> []
                             in
                             if groups = [] then begin
                               if el_is_connected bidi then el_remove bidi
                             end else (
                               if not (el_is_connected bidi) then
                                 el_insert_adjacent area "afterend" bidi;
                               el_clear bidi;
                               render_bidi_groups bidi w);
                             Js.Promise.resolve ())
                      |> ignore
                  | None -> ());
                 Js.Promise.resolve ())
        in
        ignore (refresh ());
        S.register_area area (fun () ->
            if el_is_connected area || el_is_connected host then render ()
            else (
              S.unregister_area area;
              Js.Promise.resolve ())))

let ensure_sidebar_areas () =
  let els =
    query_selector_all ".ls-sidebar-page-properties [data-sb-uuid]"
  in
  for i = 0 to node_list_length els - 1 do
    match node_list_item els i with
    | Some el -> mount_sidebar_area el
    | None -> ()
  done

(* ---------- observer entry ---------- *)

let ensure_all () =
  S.chain_worker ();
  (* page-level *)
  (match doc_query ".page-inner" with
   | Some inner -> mount_page_area inner
   | None -> ());
  ensure_sidebar_areas ();
  (* block-level *)
  let blocks = query_selector_all ".ls-block" in
  for i = 0 to node_list_length blocks - 1 do
    match node_list_item blocks i with
    | Some el ->
        if
          not
            (el_matches el ".block-add-button"
             || el_closest el ".ls-page-title" <> None)
        then (
          match block_uuid_of_ls_block el with
          | Some uuid -> mount_block_area el uuid
          | None -> ())
    | None -> ()
  done
