(* Mounted property areas — declarative LUI views.

   Page level: [title_actions] mounts inside the title row's
   .block-content-wrapper; [page_area] mounts inside the title .ls-block
   after .block-main-container (web parity: a holder div hosting
   .ls-properties-area.ls-page-properties); [bidi_area] mounts in
   .page-inner before the blocks list.

   Block level: [block_area] mounts inside .ls-block after
   .block-main-container (the .ls-block-content-indent slot hosting
   .ls-properties-area.ls-block-properties + .positioned-properties.
   block-below pills); [block_left_chips] mounts inside
   .block-main-content (.positioned-properties.block-left).

   Sidebar: [sidebar_area] fills the emitted
   .ls-sidebar-page-properties host.

   Every area reads a per-key S.area_data signal — S.refresh_all
   re-fetches on sync-db-changes and republishes, so rows re-render
   without DOM surgery. *)

open Promise_ext
open Lui_elements
module D = Properties_data
module S = Properties_state
module V = Properties_value
module Menu = Properties_menu
module W = Wire

(* ---------- row views ---------- *)

(* the key (name + bullet) opens the property menu — the dropdown_menu
   anchors to the enclosing stack *)
let key_cell (ctx : V.ctx) ~owner_is_tag ~owner_title row : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let menu_open = Signal.state sched false in
  (column ~gap:0 ~style_class:"property-key-inner jtrigger-view"
     [ box ~key:"pk-b" ~style_class:"bullet-container"
         [ box ~style_class:"bullet" [] ]
     ; button ~variant:`ghost ~size:`sm ~text_alignment:`start ~grow:1.0
         ~style_class:"property-k flex select-none jtrigger w-full"
         ~label:(D.row_title row)
         ~text:(D.row_title row)
         ~on_press:(fun _ -> Runtime.signal_set menu_open true)
         []
     ; if_ ~test:(Signal.value menu_open)
         (Menu.menu_view ~owner_uuid:ctx.block_uuid ~owner_id:ctx.block_id
            ~owner_is_tag ~owner_title ~refresh:ctx.refresh
            ~close:(fun () -> Runtime.signal_set menu_open false)
            row)
     ])
    context parent

let show_panel_bullet row =
  D.row_closed_values row <> []
  || (match D.row_type row with "default" | "url" -> false | _ -> true)
  || D.value_empty_p (D.row_value row)

let value_cell ctx row : t =
  Lui_elements.row ~gap:4 ~cross:`center ~grow:1.0
    ~style_class:"ls-block property-value-container property-value-panel"
    ((if show_panel_bullet row then
        [ box ~key:"vpb" ~style_class:"property-panel-bullet"
            [ box ~style_class:"bullet-container"
                [ box ~style_class:"bullet" [] ]
            ]
        ]
      else [])
    @ [ V.view ctx row ])

let panel_row (ctx : V.ctx) ~owner_is_tag ~owner_title row : t =
  Lui_elements.row ~gap:0 ~cross:`start ~grow:1.0
    ~style_class:
      ("property-pair property-panel-row"
      ^ (if D.value_empty_p (D.row_value row) then
           " property-panel-row-empty"
         else ""))
    [ column ~min_width:80 ~max_width:200 ~cross:`stretch ~gap:0
        ~style_class:"property-key-panel"
        [ key_cell ctx ~owner_is_tag ~owner_title row ]
    ; value_cell ctx row
    ]

(* hidden-properties toggle row — `p a` parity *)
let toggle_row : t =
  let label =
    I18n.t
      (if !S.show_hidden then "property/collapse-hidden-properties"
       else "property/show-hidden-properties")
  in
  row ~gap:0 ~style_class:"property-pair property-panel-row \
                          hidden-properties-toggle-row"
    [ column ~min_width:80 ~max_width:200 ~style_class:"property-key-panel"
        [ button ~variant:`ghost ~size:`sm ~text_alignment:`start
            ~style_class:
              "property-key-inner jtrigger-view \
               hidden-properties-toggle-key"
            ~label ~text:label
            ~on_press:(fun _ ->
              S.toggle_hidden ();
              S.refresh_all ())
            []
        ]
    ]

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

(* cljs properties' drops icon/query/class-properties from the visible
   panel rows *)
let non_panel_idents =
  [ "logseq.property/icon"; "logseq.property/query"
  ; "logseq.property.class/properties" ]

let is_panel_row r =
  not
    (List.mem (Option.value ~default:"" (D.row_ident r)) non_panel_idents)

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

(* panel rows + hidden rows (when toggled) + the toggle row itself —
   class pages host hidden props in the class section instead *)
let panel_children (ctx : V.ctx) ~owner_is_tag ~owner_title ~can_toggle
    (d : S.area_data) : t list =
  List.map (panel_row ctx ~owner_is_tag ~owner_title) d.rows
  @ (if owner_is_tag then []
     else
       (if !S.show_hidden && d.hidden <> [] then
          List.map (panel_row ctx ~owner_is_tag ~owner_title) d.hidden
        else [])
       @ (if can_toggle && d.hidden <> [] then [ toggle_row ] else []))

let panel_view ctx ~owner_is_tag ~owner_title ~can_toggle d : t =
  column ~gap:2 ~style_class:"properties-panel"
    (panel_children ctx ~owner_is_tag ~owner_title ~can_toggle d)

(* ---------- pills (block-below) ---------- *)

let pill_view (ctx : V.ctx) ~owner_is_tag ~owner_title row : t =
  column ~gap:0
    ~style_class:"bottom-property-pill bottom-property-pill-focusable"
    [ Lui_elements.row ~gap:4 ~cross:`center ~style_class:"flex flex-row items-center"
        [ key_cell ctx ~owner_is_tag ~owner_title row
        ; text ~value:":"
            ~style_class:"select-none" []
        ]
    ; Lui_elements.row ~gap:0 ~min_height:20
        ~style_class:"bottom-property-content property-value-container"
        [ V.view ctx row ]
    ]

let pills_view ctx ~owner_is_tag ~owner_title below_rows : t =
  row ~gap:4 ~grow:1.0
    ~style_class:
      "positioned-properties block-below flex flex-col gap-1 text-sm \
       overflow-x-hidden w-full min-w-0"
    [ row ~gap:8 ~cross:`center ~grow:1.0
        ~style_class:
          "bottom-properties-row flex flex-row gap-2 items-center \
           w-full min-w-0"
        [ row ~gap:8 ~cross:`center ~grow:1.0
            ~style_class:
              "bottom-properties-pills-strip flex flex-row gap-2 \
               items-center min-w-0 flex-1 basis-0"
            (List.map
               (pill_view ctx ~owner_is_tag ~owner_title)
               below_rows)
        ]
    ]

(* cljs new-property: .ls-new-property > secondary sm button with a
   plus icon *)
let new_property_btn (ctx : V.ctx) ~for_class ~owner_title : t =
  row ~gap:0 ~style_class:"ls-new-property"
    [ button ~variant:`secondary ~size:`sm
        ~icon:(`app "tabler-plus")
        ~style_class:"jtrigger flex"
        ~label:(I18n.t "property/add-new")
        ~text:(I18n.t "property/add-new")
        ~on_press:(fun _ ->
          if for_class then
            Properties_dialog.open_dialog
              { Properties_dialog.uuid = ctx.block_uuid
              ; uuids = []
              ; db_id = ctx.block_id
              ; is_tag = true
              ; title = owner_title }
          else Properties_dialog.open_for_block ctx.block_uuid)
        []
    ]

(* ---------- block area ---------- *)

let block_key uuid = "block:" ^ uuid

(* one get-blocks render-data call supplies the positioned property
   maps, the display-properties rows, and the block's own attrs *)
let block_fetch uuid (publish : S.area_data -> unit) : unit Js.Promise.t =
  let* block_w = D.block_render_data uuid in
  (match block_w with
   | W.Map _ ->
       let left = D.positioned_rows block_w "block-left" in
       let below = D.positioned_rows block_w "block-below" in
       let display =
         Option.value ~default:W.Nil
           (W.get block_w "block.temp/display-properties")
       in
       let rows, hidden = D.split_display display in
       publish
         { S.empty_area_data with left; below; rows; hidden }
   | _ -> ());
  Js.Promise.resolve ()

let block_state (context : Lui_ui.ui_context) uuid =
  S.area_state context ~key:(block_key uuid) ~fetch:(block_fetch uuid)

let block_ctx uuid key : V.ctx =
  { block_uuid = uuid
  ; block_id = None
  ; refresh = (fun () -> S.refresh_key key)
  ; is_page = false
  ; class_schema = false
  }

(* panel + below pills — mounts as the .ls-block-content-indent child
   of .ls-block; empty when there is nothing to show *)
let block_area ~uuid : t =
 fun context parent ->
  let key = block_key uuid in
  let st = block_state context uuid in
  let node =
    (reactive
       (fun (d : S.area_data) ->
          if d.rows = [] && d.hidden = [] && d.below = [] then
            (* reactive branch roots must keep identical props: set-prop
               diffs on stack kind (gap/style-class) are unsupported
               on native and abort the whole reconcile *)
            column ~gap:2 ~style_class:"ls-block-content-indent" []
          else
            let ctx = block_ctx uuid key in
            column ~gap:2
              ~style_class:"ls-block-content-indent"
              ((if d.rows = [] && d.hidden = [] then []
                else
                  [ column ~key:("parea-" ^ uuid)
                      ~accessibility_identifier:uuid
                      ~style_class:
                        "ls-properties-area ls-block-properties"
                      [ panel_view ctx ~owner_is_tag:false
                          ~owner_title:""
                          ~can_toggle:
                            (can_toggle_hidden ctx ~below_rows:d.below)
                          d
                      ]
                  ])
              @ (if d.below = [] then []
                 else
                   [ pills_view ctx ~owner_is_tag:false ~owner_title:""
                       d.below
                   ])))
       (Signal.value st))
      context parent
  in
  S.note_area_node ~key node;
  node

(* left chips: .positioned-properties.block-left inline in
   .block-main-content *)
let block_left_chips ~uuid : t =
 fun context parent ->
  let key = block_key uuid in
  let st = block_state context uuid in
  let node =
    (reactive
       (fun (d : S.area_data) ->
          if d.left = [] then
            row ~gap:8 ~cross:`center
              ~style_class:"positioned-properties block-left" []
          else
            let ctx = block_ctx uuid key in
            row ~gap:8 ~cross:`center
              ~style_class:"positioned-properties block-left"
              (List.map
                 (fun r ->
                   row ~gap:2 ~cross:`center
                     ~style_class:"property-value-inner"
                     [ V.view ctx r ])
                 d.left))
       (Signal.map (fun (d : S.area_data) -> d) (Signal.value st))
       ~equal:(fun (a : S.area_data) (b : S.area_data) -> a.left = b.left))
      context parent
  in
  S.note_area_node ~key node;
  node

(* ---------- title actions ---------- *)

let page_key uuid = "page:" ^ uuid

(* cljs db-page-title-actions: "Add icon" (always) + "Set property"
   ("Add tag property" on tag pages). The icon picker's imperative
   open needs a real anchor element — the actions row itself, resolved
   by id. *)
let title_actions (p : Model.page) : t =
 fun context parent ->
  let uuid = Option.value ~default:"" p.Model.page_uuid in
  let key = page_key uuid in
  let anchor_id = "pta-" ^ uuid in
  let add_btn text on_press =
    button ~variant:`ghost ~size:`sm ~text_alignment:`start
      ~style_class:"as-ghost text-muted-foreground"
      ~label:text ~text ~on_press []
  in
  let node =
    (row ~key:"pta" ~accessibility_identifier:anchor_id
       ~cross:`center ~gap:8
       ~style_class:"ls-page-title-actions"
       [ add_btn
           (I18n.t "command.editor/add-property-icon")
           (fun _ ->
             match Web_dom.doc_query ("#" ^ anchor_id) with
             | Some anchor ->
                 Icon_picker.open_picker ~anchor
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
                                 [ Wire.Keyword "type"
                                 , Wire.Keyword "emoji"
                                 ; Wire.Keyword "id", Wire.String id ] ]
                       | Icon_picker.Tabler (id, color) ->
                           Outliner_ops.op "set-block-property"
                             [ Wire.Uuid uuid
                             ; Wire.Keyword "logseq.property/icon"
                             ; Wire.Map
                                 ([ Wire.Keyword "type"
                                  , Wire.Keyword "tabler-icon"
                                  ; Wire.Keyword "id", Wire.String id ]
                                 @ (match color with
                                    | Some c ->
                                        [ Wire.Keyword "color"
                                        , Wire.String c ]
                                    | None -> [])) ]
                     in
                     ignore
                       (let* _ = Outliner_ops.apply [ op ] in
                       !Runtime.reload_current_view ()))
             | None -> ())
       ; (if p.Model.page_is_tag then
            add_btn (I18n.t "class/add-property") (fun _ ->
                Properties_dialog.open_dialog
                  { Properties_dialog.uuid
                  ; uuids = []
                  ; db_id = p.Model.page_db_id
                  ; is_tag = true
                  ; title = p.Model.page_title
                  })
          else
            add_btn (I18n.t "property/set-property") (fun _ ->
                Properties_dialog.open_dialog
                  { Properties_dialog.uuid
                  ; uuids = []
                  ; db_id = p.Model.page_db_id
                  ; is_tag = false
                  ; title = p.Model.page_title
                  }))
       ])
      context parent
  in
  S.note_area_node ~key node;
  node

(* ---------- class schema section (tag pages) ---------- *)

(* class-schema rows: get-class-properties returns property entities
   (db/ident is a keyword — getk, not map_get_string); each renders as
   a row whose value is the schema config (nil — same shape
   positioned_rows synthesizes) *)
let class_schema_row prop =
  match D.getk (D.untag prop) "db/ident" with
  | Some ident ->
      Some
        (W.Map
           [ (W.Keyword "property-id", W.Keyword ident)
           ; (W.Keyword "property", prop)
           ; (W.Keyword "value", W.Nil) ])
  | None -> None

let class_section (ctx : V.ctx) ~owner_title (class_rows : W.t list) : t =
  column ~gap:4 ~style_class:"flex flex-col gap-1 mt-2"
    [ column ~gap:2 ~style_class:"property-key text-sm"
        [ row ~gap:4 ~cross:`center
            ~style_class:"property-key-inner jtrigger-view"
            [ icon ~name:(`app "tabler-letter-p") ~point_size:14 []
            ; text
                ~value:(I18n.t "property.built-in/class-properties")
                ~style_class:"property-k flex select-none w-full" []
            ]
        ; text ~value:(I18n.t "class/tag-properties-desc")
            ~style_class:"text-muted-foreground ml-5" []
        ]
    ; column ~gap:4 ~style_class:"gap-1 flex flex-col"
        (List.map (panel_row ctx ~owner_is_tag:true ~owner_title)
           class_rows
        @ [ column ~style_class:"ml-5"
              [ new_property_btn ctx ~for_class:true ~owner_title ]
          ])
    ]

(* ---------- page area ---------- *)

(* cljs: the page surface attaches .ls-properties-area only when there
   are rows to show (or a class section for tag pages); bidirectional
   groups live in .page-inner before .ls-page-blocks *)
let page_fetch ~uuid ~is_tag ~db_id (publish : S.area_data -> unit) :
    unit Js.Promise.t =
  let* wire =
    D.display_props ~page_title:true ~tag_dialog:false
      ~show_hidden:!S.show_hidden (D.uuid_ref uuid)
  in
  let raw_rows, hidden = D.split_display wire in
  let _l, _b, panel_rows =
    partition_rows (List.filter is_panel_row raw_rows)
  in
  let* class_rows =
    if is_tag then
      let* w = D.class_properties (D.uuid_ref uuid) in
      Js.Promise.resolve
        (List.filter_map class_schema_row (W.elems w))
    else Js.Promise.resolve []
  in
  let* bidi =
    match db_id with
    | Some id ->
        let* w = D.bidirectional id in
        Js.Promise.resolve (W.elems w)
    | None -> Js.Promise.resolve []
  in
  publish
    { S.empty_area_data with rows = panel_rows; hidden; class_rows
                           ; bidi };
  Js.Promise.resolve ()

let page_ctx (p : Model.page) key uuid : V.ctx =
  { block_uuid = uuid
  ; block_id = p.Model.page_db_id
  ; refresh = (fun () -> S.refresh_key key)
  ; is_page = true
  ; class_schema = false
  }

(* the properties block inside the title's .ls-block — a holder div
   carrying .ls-properties-area.ls-page-properties, the class section
   on tag pages, or the "Add property" button elsewhere *)
let page_area (p : Model.page) : t =
 fun context parent ->
  let uuid = Option.value ~default:"" p.Model.page_uuid in
  if uuid = "" then
    (column ~gap:0 []) context parent
  else
    let key = page_key uuid in
    let st =
      S.area_state context ~key
        ~fetch:(page_fetch ~uuid ~is_tag:p.Model.page_is_tag
                  ~db_id:p.Model.page_db_id)
    in
    (* cljs db-properties-cp is a child of the title .ls-block only
       while the title isn't collapsed *)
    let title_collapsed =
      (not (Editor_state.is_expanded uuid))
      && (Editor_state.is_collapsed uuid || p.Model.page_is_tag)
    in
    let node =
      (reactive
         (fun (d : S.area_data) ->
            if title_collapsed then column ~gap:0 []
            else if
              (not p.Model.page_is_tag)
              && d.rows = []
              && d.hidden = []
            then column ~gap:0 []
            else
              let ctx = page_ctx p key uuid in
              column ~key:("parea-" ^ uuid)
                ~accessibility_identifier:uuid
                ~style_class:"ls-properties-area ls-page-properties"
                [ panel_view ctx ~owner_is_tag:p.Model.page_is_tag
                    ~owner_title:p.Model.page_title
                    ~can_toggle:(can_toggle_hidden ctx ~below_rows:[])
                    d
                ; (if p.Model.page_is_tag then
                     class_section ctx ~owner_title:p.Model.page_title
                       d.class_rows
                   else
                     new_property_btn ctx ~for_class:false
                       ~owner_title:p.Model.page_title)
                ])
         (Signal.value st))
        context parent
    in
    S.note_area_node ~key node;
    node

(* bidirectional groups — sibling of the blocks list in .page-inner *)
let bidi_area (p : Model.page) : t =
 fun context parent ->
  let uuid = Option.value ~default:"" p.Model.page_uuid in
  let key = page_key uuid in
  let st =
    S.area_state context ~key
      ~fetch:(page_fetch ~uuid ~is_tag:p.Model.page_is_tag
                ~db_id:p.Model.page_db_id)
  in
  let node =
    (reactive
       (fun (d : S.area_data) ->
          if d.bidi = [] then
            column ~gap:8 ~grow:1.0
              ~style_class:"w-full ls-bidirectional-properties mt-8" []
          else
            column ~gap:8 ~grow:1.0
              ~style_class:"w-full ls-bidirectional-properties mt-8"
              (List.map
                 (fun group ->
                   let title =
                     D.gets group "title" |> Option.value ~default:""
                   in
                   let ents =
                     match D.getf group "entities" with
                     | Some w -> W.elems w
                     | None -> []
                   in
                   column ~gap:2
                     ~style_class:"ls-bidirectional-group"
                     [ row ~gap:0 ~style_class:"property-key-panel"
                         [ text ~value:title
                             ~style_class:
                               "property-k flex select-none w-full" []
                         ]
                     ; row ~gap:4 ~cross:`center
                         ~style_class:"ls-block property-value-container"
                         [ row ~gap:4 ~style_class:"property-value"
                             (List.map
                                (fun e ->
                                  text ~value:(D.ref_title e)
                                    ~style_class:"block-title-wrap" [])
                                ents)
                         ]
                     ])
                 d.bidi))
       (Signal.map (fun (d : S.area_data) -> d) (Signal.value st))
       ~equal:(fun (a : S.area_data) (b : S.area_data) -> a.bidi = b.bidi))
      context parent
  in
  S.note_area_node ~key node;
  node

(* ---------- right-sidebar page properties ---------- *)

(* cljs page.cljs sidebar-page-properties: tag/class pages DO mount the
   area here; a non-class page with no rows renders only the "Add
   property" button (no .ls-properties-area) *)
let sidebar_area ~uuid ~db_id ~title ~is_tag : t =
 fun context parent ->
  let key = "sb:" ^ uuid in
  let st =
    S.area_state context ~key ~fetch:(fun publish ->
        let* wire =
          D.display_props ~page_title:false ~tag_dialog:false
            ~sidebar:true ~show_hidden:!S.show_hidden (D.uuid_ref uuid)
        in
        let rows, hidden = D.split_display wire in
        let rows = List.filter is_panel_row rows in
        let _l, _below, panel_rows = partition_rows rows in
        let* class_rows =
          if is_tag then
            let* w = D.class_properties (D.uuid_ref uuid) in
            Js.Promise.resolve
              (List.filter_map class_schema_row (W.elems w))
          else Js.Promise.resolve []
        in
        let* bidi =
          match db_id with
          | Some id ->
              let* w = D.bidirectional id in
              Js.Promise.resolve (W.elems w)
          | None -> Js.Promise.resolve []
        in
        publish
          { S.empty_area_data with rows = panel_rows; hidden
                                 ; class_rows; bidi };
        Js.Promise.resolve ())
  in
  let ctx =
    { V.block_uuid = uuid
    ; block_id = db_id
    ; refresh = (fun () -> S.refresh_key key)
    ; is_page = true
    ; class_schema = false
    }
  in
  let node =
    (reactive
       (fun (d : S.area_data) ->
          if (not is_tag) && d.rows = [] && d.hidden = [] then
            (* cljs: (and empty-full empty-hidden (not class?)) →
               just [new-property], no .ls-properties-area *)
            new_property_btn ctx ~for_class:false ~owner_title:title
          else
            column ~key:("parea-" ^ uuid)
              ~accessibility_identifier:("sbprops-" ^ uuid)
              ~style_class:"ls-page-properties ls-properties-area"
              (panel_view ctx ~owner_is_tag:is_tag ~owner_title:title
                 ~can_toggle:(can_toggle_hidden ctx ~below_rows:[])
                 d
               ::
               (if is_tag then
                  [ class_section ctx ~owner_title:title d.class_rows ]
                else
                  [ new_property_btn ctx ~for_class:false
                      ~owner_title:title ]))
       )
       (Signal.value st))
      context parent
  in
  S.note_area_node ~key node;
  node

(* A remove-block-property op commits in the worker before the debounced
   sync-db-changes refresh (~150ms) reaches the views, so an sdk caller
   asserting on the page right after the promise resolves would still
   see the stale row. Drop it from the decoded data eagerly — the next
   refresh re-renders the same state. *)
let drop_row = S.drop_row
