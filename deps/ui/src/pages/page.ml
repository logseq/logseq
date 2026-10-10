(* Page view — mirrors components/page.cljs essentials:

   .page
     div.ls-page-title.title [data-testid='page title'] > .block-title-wrap
     div.ls-page-blocks > .page-blocks-inner > .ls-block*
     .references (linked refs) / .unlinked-references

   Route views: journals list (#journals > .journal-item), not-found,
   library (title rows only). *)

open Promise_ext
open Lui_elements

module S = Editor_state

let dom = Logseq_el.el

(* --- shared pieces ------------------------------------------------ *)

(* crumbs navigate in-app like the old ~url links *)
let nav_crumb hash _ : unit =
  Ui_services.nav_set_hash (Runtime.nav_hash hash)

(* block zoom: .breadcrumb lists ancestor block titles (root first),
   each linking to its own zoom route — kit breadcrumb_trail (ghost
   caption buttons on .lui-breadcrumb) replacing the link row; the
   per-segment 28ch ellipsis is kit gap G4 (plan leftovers) *)
let zoom_breadcrumbs (page : Model.page) : t list =
  (* cljs page-inner omits the breadcrumb node entirely when there's
     nothing to show — an empty placeholder div would still consume a
     grid gap slot *)
  match page.page_parents with
  | [] -> []
  | parents ->
      [ box ~key:"bc" ~style_class:"breadcrumb" ~min_width:0
          [ Lui_element_combine.breadcrumb_trail ~key:"bct"
              ~items:
                (List.map
                   (fun (p : Model.block) ->
                     ( p.block_title
                     , nav_crumb
                         ("#/block/"
                         ^ Option.value p.block_uuid ~default:"") ))
                   parents)
              () ]
      ]

let breadcrumbs (page : Model.page) : t list =
  (* cljs page-inner breadcrumb = :block/parent namespace chain (links)
     + the leaf title (text). Pages whose title still carries "/" but
     have no parent chain (pre-split legacy) fall back to splitting. *)
  match page.Model.page_parents with
  | _ :: _ ->
      [ box ~key:"bc" ~style_class:"breadcrumb" ~min_width:0
          [ Lui_element_combine.breadcrumb_trail ~key:"bct"
              ~items:
                (List.map
                   (fun (p : Model.block) ->
                     (p.block_title, nav_crumb ("#/page/" ^ p.block_title)))
                   page.page_parents
                 @ [ ( page.page_title
                     , nav_crumb
                         ("#/page/"
                         ^ Option.value page.Model.page_uuid
                             ~default:page.page_title) ) ])
              () ] ]
  | [] ->
      (match String.split_on_char '/' page.page_title with
  | [] | [ _ ] -> []
  | parts ->
      let rec crumbs acc prefix = function
        | [] -> List.rev acc
        | last :: [] ->
            (* leaf = the current page itself *)
            (last, nav_crumb ("#/page/" ^ page.page_title))
            :: acc |> List.rev
        | part :: rest ->
            let here = if prefix = "" then part else prefix ^ "/" ^ part in
            crumbs ((part, nav_crumb ("#/page/" ^ here)) :: acc) here rest
      in
      [ box ~key:"bc" ~style_class:"breadcrumb" ~min_width:0
          [ Lui_element_combine.breadcrumb_trail ~key:"bct"
              ~items:(crumbs [] "" parts) () ] ])

(* cljs page-inner block? = (some? (:block/page page)): the route
   entity is a contained block (e.g. a #Tag object living on another
   page) — it renders breadcrumb + the block itself as the outline
   root, without the page title/properties chrome. The object's own
   block arrives as a page_blocks root whose uuid is the route uuid —
   no child of a normal page can share the page's own uuid, so a uuid
   match alone detects the shape (the wire does not carry block/page
   on page blocks). *)
let is_block_route (page : Model.page) : bool =
  match page.page_uuid with
  | Some pu ->
      List.exists
        (fun (b : Model.block) -> b.block_uuid = Some pu)
        page.page_blocks
  | None -> false

(* cljs block-breadcrumb/breadcrumb on a block page:
   .breadcrumb.block-parents.breadcrumb--block-page.my-2 with
   .breadcrumb__segment > .breadcrumb__label ancestors (root first)
   joined by "/" separators, each navigating to #/page/<uuid>.
   Kit breadcrumb_trail now emits the items — ghost caption buttons
   with on_press navigation; .block-parents stays on the wrapper so
   the nowrap/overflow-clip container behavior survives while the
   28ch per-segment ellipsis is kit gap G4 (plan leftovers). my-2's
   8px vertical margins moved to ~padding_vertical. *)
let block_page_breadcrumb (page : Model.page) : t list =
  match page.page_parents with
  | [] -> []
  | parents ->
      [ box ~key:"bc" ~min_width:0 ~padding_vertical:8
          ~style_class:"breadcrumb block-parents"
          [ Lui_element_combine.breadcrumb_trail ~key:"bct"
              ~items:
                (List.map
                   (fun (p : Model.block) ->
                     ( p.block_title
                     , nav_crumb
                         ("#/page/"
                         ^ Option.value p.block_uuid ~default:"") ))
                   parents)
              () ] ]

(* click position payload -> Page_menu_set (context menu = page items
   only, so with_app_items = false) *)
let open_menu (page : Model.page) name payload =
  (* title-tag chips get their own context menu (.block-tag, cljs
     block-tag popup) — only the bare title opens the page menu. Refs
     and other anchors inside the title still open the page menu *)
  let on_tag_chip =
    I18n.contains (Json_payload.str payload "targetClass") "block-tag"
  in
  if name = "contextmenu" && not on_tag_chip then (
    (* cljs popup-show! anchors the menu to the event target element,
       not the raw pointer — elementFromPoint resolves that target *)
    let ax, atop, abot =
      match
        Ui_services.dom_element_at
          (Json_payload.num payload "clientX")
          (Json_payload.num payload "clientY")
      with
      | Some el -> Popups_state.anchor_of_el el
      | None ->
          Popups_state.anchor_at_point
            ~x:(Json_payload.num payload "clientX")
            ~y:(Json_payload.num payload "clientY")
    in
    Runtime.send
      (Action.Page_menu_set
         (Some (ax, atop, abot, false, page.page_uuid)));
    Runtime.flush ())

(* generic: works for any entity uuid (page or block) *)
let set_icon (u : string) (c : Icon_picker.choice) =
  let op =
        match c with
        | Icon_picker.Remove ->
            Outliner_ops.op "remove-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon" ]
        | Icon_picker.Emoji id ->
            Outliner_ops.op "set-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
              ; Wire.Map
                  [ Wire.Keyword "type", Wire.Keyword "emoji"
                  ; Wire.Keyword "id", Wire.String id ]
              ]
        | Icon_picker.Tabler (id, color) ->
            Outliner_ops.op "set-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
              ; Wire.Map
                  ([ Wire.Keyword "type", Wire.Keyword "tabler-icon"
                   ; Wire.Keyword "id", Wire.String id ]
                  @ (match color with
                     | Some c -> [ Wire.Keyword "color", Wire.String c ]
                     | None -> []))
              ]
  in
  ignore
    (let* _ = Outliner_ops.apply [ op ] in
    !Runtime.reload_current_view ())

let set_page_icon (page : Model.page) (c : Icon_picker.choice) =
  match page.page_uuid with
  | None -> ()
  | Some u -> set_icon u c

let page_icon_picker (page : Model.page) (anchor : string) =
  match Ui_services.dom_query anchor with
  | None -> ()
  | Some anchor ->
      Icon_picker.open_picker ~anchor
        ~del:(page.page_icon <> None)
        ~on_chosen:(fun c -> set_page_icon page c)

let title_editor (page : Model.page) : t =
 fun ctx parent ->
  let uuid = Option.value page.page_uuid ~default:"" in
  (* the title's own model — block editing state lives in
     Editor_state.editing, the title editor keeps a per-mount model on
     the same Edit_model/Edit_input stack *)
  let model_st =
    Signal.state ctx.Lui_ui.ui_scheduler
      (let m =
         Edit_model.create ~units:S.edit_units page.Model.page_title
       in
       let n = String.length page.Model.page_title in
       Edit_model.select m ~anchor:n ~focus:n)
  in
  let frame =
    Signal.state ctx.Lui_ui.ui_scheduler Edit_input.empty_frame
  in
  let commit ?(select = false) () =
    let value =
      String.trim
        (Runtime.signal_get model_st).Edit_model.source
    in
    (match page.page_uuid with
     | Some u ->
         ignore
           (Page_ops.rename u value
            |> Js.Promise.then_ (fun () ->
              Runtime.send Action.Title_edit_done;
              if select then Editor_actions.select_single u;
              Runtime.flush ();
              Js.Promise.resolve ())
            |> Js.Promise.catch (fun _ ->
              (* rejected rename (e.g. "#" in the name): the worker
                 notification toast already explains it; the editor
                 stays open on the typed text like cljs *)
              Js.Promise.resolve ()))
     | None ->
         Runtime.send Action.Title_edit_done;
         Runtime.flush ())
  in
  (* Enter/Escape both exit selecting the title block (cljs parity);
     blur exits without the selection *)
  let route =
    { Edit_input.split_block = (fun () -> commit ~select:true ())
    ; merge_prev = (fun () -> ())
    ; indent = (fun () -> ())
    ; outdent = (fun () -> ())
    ; cancel = (fun () -> commit ~select:true ())
    ; focused = (fun _ -> ())
    ; menu = (fun _ -> ()) }
  in
  let on_input ev =
    let m = Runtime.signal_get model_st in
    match ev with
    | Edit_input.Blur -> commit ()
    | _ ->
        let conduit =
          Option.value (Editor_sink.conduit uuid)
            ~default:Edit_input.no_conduit
        in
        let m' = Edit_input.handle ~route ~conduit m ev in
        if m' != m then begin
          Signal.update model_st (fun _ -> m');
          (* flush now so the conduit measures the freshly painted
             runs — a stale read would re-emit the old line ranges and
             clamp the just-inserted text out of view *)
          Runtime.flush ()
        end;
        let m2 =
          match conduit.Edit_input.line_ranges () with
          | rs
            when Editor_actions.measured_partitions
                   m'.Edit_model.source
                   rs ->
              Edit_model.set_lines m' rs
          | _ -> m'
        in
        if m2 != m' then begin
          Signal.update model_st (fun _ -> m2);
          Runtime.flush ()
        end;
        Signal.update frame (fun _ -> Edit_input.measure conduit m2)
  in
  (Ui_parts.editor_wrapper ~key:"pt-edit" ~id:("editor-edit-block-" ^ uuid)
     [ Edit_view.view
         ~model:model_st.Signal.state_signal
         ~frame:frame.Signal.state_signal ~block_id:uuid ~on_input ~cls:""
     ])
    ctx parent


(* cljs title-tag chip: .block-tag > .flex.items-center > a.hash-symbol +
   a.tag[draggable][data-ref] > span. The .ls-block-right/.hover wrappers
   render even when the page has no tags (empty container). *)
(* cljs tags-cp drops internal/private/hide-from-node class idents —
   journal pages never show a #Journal chip *)
let title_tag_chips (page : Model.page) : t list =
  let opt_at l i =
    match List.nth_opt l i with
    | Some x -> x
    | None -> ""
  in
  let visible =
    List.filter_map
      (fun (i, tag) ->
        if Tree.hidden_tag_ident (opt_at page.Model.page_tag_idents i) then
          None
        else Some (i, tag))
      (List.mapi (fun i tag -> (i, tag)) page.Model.page_tags)
  in
  [ row ~key:"pt-right" ~gap:4 ~cross:`center
      ~style_class:"ls-block-right"
      [ box ~key:"ptr-ghost"
          (match visible with
           | [] -> []
           | _ ->
               [ row ~key:"pt-tags" ~gap:4 ~style_class:"block-tags"
                   (List.map
                      (fun (i, tag) ->
                        Tree.tag_chip
                          ~key:("p" ^ string_of_int i)
                          ~owner_uuid:
                            (Option.value page.Model.page_uuid ~default:"")
                          ~tag
                          ~tuuid:(opt_at page.Model.page_tag_uuids i)
                          ~ident:(opt_at page.Model.page_tag_idents i)
                          ~dbid:
                            (Option.value
                               (List.nth_opt page.Model.page_tag_db_ids i)
                               ~default:0))
                      visible)
               ])
      ]
  ]

(* display-mode title: #block-content-<page-uuid>.block-content >
   .block-content-inner > .block-head-wrap > .w-full.inline >
   span.block-title-wrap — mirrors block.cljs for page-title blocks *)
(* cljs: pointer-down on .block-content starts editing via
   block-content-on-pointer-down (journal titles redirect instead, which is
   a no-op on their own page — so journals get no edit handler) *)
let title_content (page : Model.page) : t =
  let uuid = Option.value page.page_uuid ~default:"" in
  let events, on_event =
    match page.page_journal_day with
    | Some _ ->
        (* cljs journal titles redirect to the day's page (a no-op on
           their own page) — route through the hash like goto_page *)
        ( [ "click" ]
        , Some
            (fun _name payload ->
              let shift, interactive =
                ( Json_payload.bool payload "shiftKey"
                , Json_payload.bool payload "interactive" )
              in
              match page.page_uuid with
              | Some uuid when not shift && not interactive ->
                  Editor_actions.exit_edit ~select:false;
                  Runtime.mark_nav ();
                  Ui_services.nav_set_hash
                    (Runtime.nav_hash ("#/page/" ^ uuid))
              | _ -> ()) )
    | None ->
        ( [ "click" ]
        , Some
            (fun _name payload ->
              let shift, interactive =
                ( Json_payload.bool payload "shiftKey"
                , Json_payload.bool payload "interactive" )
              in
              (* shift+click opens the page in the right sidebar (handled by
                 the document-level listener); starting title edit would
                 replace the clicked node mid-dispatch *)
              if page.page_uuid <> None && not shift && not interactive then (
                (* cljs edit entry clears any block selection *)
                if S.ready () then Editor_actions.clear_selection ();
                Runtime.send Action.Title_edit_start;
                Runtime.flush ();
                (* land the key input on the freshly mounted sink —
                   the model already carries caret=end *)
                Editor_sink.focus_input uuid)) )
  in
  (* TODO(component): click needs the DOM payload (targetId/
     interactive closest-walk/shiftKey) and blockid/containerid/
     data-type are non-data-* attrs — needs a pointer_detail extension
     (target element identity + interactive hit) and block attrs on the
     block extension *)
  Logseq_el.el ~key:"pt-content"
    ~style_class:"block-content inline !cursor-pointer"
    ~id:("block-content-" ^ uuid) ~events:(String.concat " " events)
    ?on_dom_event:on_event
    ~attrs:
      [ ("data-blockid", uuid); ("data-containerid", uuid); ("data-type", "default")
      ; ("style", "width: 100%") ]
    [ row ~key:"pt-bci" ~main:`space_between
        [ box ~key:"pt-bh" ~style_class:"block-head-wrap"
            [ box ~key:"pt-w"
                [ Render.wrap ~cls:"block-title-wrap"
                    ~self:uuid page.page_title ]
            ]
        ]
    ]

(* plugin page-head injections — cljs plugin.cljs hook-ui-items :pagebar
   renders slotted divs in the title-actions area, and hook-ui-slot
   :page-head-actions emits :page-head-actions-slotted once per mount with
   the slot id so plugins can provideUI({slot: <id>, ...}) *)
let head_slot_fired : string ref = ref ""

let page_plugin_slots ctx (page : Model.page) : t list =
  let slot = "lsp-page-head-actions" in
  if !head_slot_fired <> page.Model.page_title then (
    head_slot_fired := page.Model.page_title;
    Signal.enqueue_effect ctx.Lui_ui.ui_scheduler (fun () ->
        Plugin_host.hook_app
          "page-head-actions-slotted"
          (Js.Json.object_
             (Js.Dict.fromList
                [ ("type", Js.Json.string "slotted")
                ; ("slot", Js.Json.string slot)
                ; ( "payload"
                  , Js.Json.object_
                      (Js.Dict.fromList
                         [ ("page", Js.Json.string page.Model.page_title)
                         ]) ) ]))
          Js.Json.null;
        Plugin_host.inject_toolbar_ui ()));
  box ~key:"lsp-slot" ~accessibility_identifier:slot
    []
  :: List.map
       (fun it ->
         box ~key:("pb-" ^ Plugin_host.item_slot it)
           ~accessibility_identifier:(Plugin_host.item_slot it)
           [])
       (Plugin_host.ui_items_of_type "pagebar")

let page_title_el (m : Model.t) (page : Model.page) : t =
 fun ctx parent ->
  if Ui_services.env_publishing () then
    column ~style_class:"ls-page-title title"
      [ heading ~level:1 ~value:page.page_title []
      ; Properties_area.page_area page ] ctx parent
  else
  (* title rows also render in the journals list before any block row
     mounts the editor state — the .ls-block class signal needs it *)
  let () = S.ensure ctx in
  (
  (* cljs page-icon: custom :logseq.property/icon -> first tag icon ->
     class "hash" -> property "letter-p"; rendered as the icon-picker
     button inside .block-main-content *)
  let icon_el =
    match page.page_icon, page.page_is_tag, page.page_is_property with
    | Some ("emoji", eid), _, _ ->
        Some (Logseq_emoji.el ~key:"pt-e" ~name:eid ())
    | Some (_, iid), _, _ -> Some (Icons.icon ~size:38. iid)
    | None, true, _ -> Some (Icons.icon ~size:38. "hash")
    | None, _, true -> Some (Icons.icon ~size:38. "letter-p")
    | _ -> None
  in
  let uuid = Option.value page.page_uuid ~default:"" in
  (* cljs db-page-title: tag/class pages render collapsed by default; the
     fold state lives in the same collapsed/expanded sets as blocks *)
  let title_collapsed =
    (not (S.is_expanded uuid)) && (S.is_collapsed uuid || page.page_is_tag)
  in
  let toggle_title_collapse () =
    if S.ready () then
      S.set (fun (st : S.t) ->
          if title_collapsed then
            { st with
              S.collapsed = S.String_set.remove uuid st.S.collapsed
            ; S.expanded = S.String_set.add uuid st.S.expanded
            }
          else
            { st with
              S.collapsed = S.String_set.add uuid st.S.collapsed
            ; S.expanded = S.String_set.remove uuid st.S.expanded
            })
  in
  (* cljs collapsable? on a page-title row = db-collapsable? on the page
     entity (any non-internal property keys, e.g. a page property) — the
     fold arrow shows on hover when this or an already-collapsed title
     holds. Live-read the attr too: the mounted properties area keeps
     data-db-collapsable in sync with the page's live property rows *)
  let collapsable_title () =
    page.Model.page_db_collapsable || page.Model.page_is_tag
    || title_collapsed
    ||
    (match Ui_services.dom_query ".ls-page-title .ls-block" with
     | Some tb ->
         tb.Ui_services.attr "data-db-collapsable" = Some "true"
     | None -> false)
  in
  (* cljs *control-show? atom: the fold caret appears only while the
     pointer is over the title row, and only for collapsable titles *)
  let caret_hover = Signal.state ctx.Lui_ui.ui_scheduler false in
  (* cljs shows .ls-page-title-actions on .block-content-wrapper:hover
     (opacity 0 at rest); no stylesheet on native backends, so the same
     pointer enter/leave signal drives the opacity prop instead *)
  let actions_hover = Signal.state ctx.Lui_ui.ui_scheduler false in
  let body =
    (* cljs db-page-title: the page title is a full block row —
       .ls-block > .is-page-title-row > bullet control + nested
       flex-col wrappers > .ls-page-title-container > .block-row >
       .block-content-wrapper(.ls-page-title-actions + content|editor) +
       .ls-block-right(.block-tags). Tags render while editing too. *)
    [ (* flex-1: cljs .ls-block was the flex child directly; the wrapper
         must fill .ls-page-title's row axis or the title collapses *)
      box ~key:"pt-inner" ~grow:1. ~style_class:"relative flex-1"
        [ (* TODO(component): .ls-block title row keeps the imperative
             block attr contract (blockid/containerid/data-… attrs) and
             a dynamic selected class — migrates with the block
             extension *)
          Ui_parts.class_signal (S.selected_sig ())
            (fun selected ->
              if S.String_set.mem uuid selected then "selected ls-block"
              else "ls-block")
            (column ~key:"pt-block"
               ~accessibility_identifier:("ls-block-" ^ uuid)
               ~data_attrs:
              [ ("data-blockid", uuid); ("data-containerid", uuid)
              ; ("data-block-title", page.page_title)
              ; ("data-haschild", "false")
              ; ("data-comment-item", "false")
              ; ("data-comments-area", "false"); ("data-level", "0")
              ; ("data-collapsed", "false")
              ; ( "data-db-collapsable"
                , if page.Model.page_db_collapsable then "true" else "false" )
              ; ("data-block-format", "markdown") ]
            [ (* the -36px/-30px margins the cljs inline style carried
                 live on .is-page-title-row (+ .ls-pt-no-icon) in
                 lui-core.css; cljs page.css gives the title row gap-2 *)
              row ~key:"pt-row"
                ~gap:8 ~style_class:
                  ("block-main-container is-page-title-row"
                   ^ if icon_el = None then " ls-pt-no-icon" else "")
                ~on_pointer_enter:(fun _ ->
                  if collapsable_title () then (
                    Signal.set caret_hover true;
                    Runtime.flush ()))
                ~on_pointer_leave:(fun _ ->
                  if Runtime.signal_get caret_hover then (
                    Signal.set caret_hover false;
                    Runtime.flush ()))
                [ row ~key:"pt-ctrl" ~cross:`center ~width:24 ~height:24
                    ~style_class:
                      ("is-with-icon"
                      ^ (if title_collapsed then " bullet-closed" else "")
                      ^ " bullet-hidden block-control-wrap")
                    [ (let cs =
                          Ui_parts.class_signal
                            (Signal.value caret_hover)
                            (fun hover ->
                              (if hover then "cursor-pointer"
                               else "control-hide")
                              ^ " rotating-arrow"
                              ^
                              if title_collapsed then " collapsed"
                              else " not-collapsed")
                            (box ~key:"pt-ra"
                               ~style_class:
                                 ("control-hide rotating-arrow"
                                  ^ if title_collapsed then " collapsed"
                                    else " not-collapsed")
                               [ Ui_parts.rotating_arrow "pt-arw" ])
                        in
                        Ui_parts.pressable
                          ~on_press:(fun _ ->
                            if collapsable_title () then
                              toggle_title_collapse ())
                          (box ~key:"pt-ca"
                             ~style_class:"block-control"
                             ~accessibility_identifier:("control-" ^ uuid)
                             [ cs ]))
                     ]
        ; column ~key:"pt-col1" ~grow:1. ~cross:`stretch
            [ column ~key:"pt-col2" ~cross:`stretch
                        [ row ~key:"pt-bmc" ~gap:8
                            ((match icon_el with
                              | None -> []
                              | Some ic ->
                                  [ row ~key:"pt-icon"
                                      ~style_class:"ls-page-icon"
                                      [ button ~key:"pt-icbtn"
                                          ~variant:`ghost ~size:`icon
                                          ~label:(I18n.t "context-menu/set-icon")
                                          ~style_class:"ui__button as-ghost ls-page-icon-btn"
                                          ~on_press:(fun _ ->
                                            page_icon_picker page
                                              ".ls-page-title .ls-page-icon")
                                          [ row ~key:"pt-cw" ~cross:`center
                                              ~style_class:"ls-icon-color-wrap"
                                              [ ic ]
                                          ]
                                      ]
                                  ])
                            @ [ column ~key:"pt-col3" ~grow:1. ~cross:`stretch
                                [ box ~key:"pt-wrap"
                                    ~style_class:"ls-page-title-container block-content-or-editor-wrap"
                                    [ box ~key:"pt-inner2"
                                        ~style_class:"block-content-or-editor-inner"
                                        [ row ~key:"pt-row2" ~grow:1.
                                            ~gap:4 ~cross:`center
                                            ~style_class:"block-row"
                                            ([ column ~key:"pt-cw" ~gap:8
                                                 ~grow:1. ~cross:`stretch
                                                 ~style_class:"block-content-wrapper"
                                                 ~on_pointer_enter:(fun _ ->
                                                   Signal.set actions_hover true;
                                                   Runtime.flush ())
                                                 ~on_pointer_leave:(fun _ ->
                                                   if Runtime.signal_get actions_hover then (
                                                     Signal.set actions_hover false;
                                                     Runtime.flush ()))
                                                 ((if m.editing_title then
                                                    []
                                                  else
                                                    [ (* cljs mounts
                                                         :pagebar hook
                                                         items inside the
                                                         title-actions row;
                                                         there they stay
                                                         out of the wrapper
                                                         column's gap *)
                                                      Properties_area.title_actions
                                                        ~hover:actions_hover
                                                        ~slots:(page_plugin_slots
                                                                  ctx page)
                                                        page ])
                                                @ [ (if m.editing_title then
                                                       title_editor page
                                                     else
                                                       title_content page)
                                                  ])
                                             ]
                                            @ title_tag_chips page)
                                        ]
                                    ]
                                ]
                            ]
                        )
                    ]
                ]
            ]
        ; (* cljs db-properties-cp: the page properties area sits
             inside the title's .ls-block, after .block-main-container *)
          Properties_area.page_area page
        ])
      ]
    ; (* cljs plugin slot extension point after the title block *)
      row ~key:"pt-slot"
        [ box ~key:"pt-slot-i"
            ~accessibility_identifier:
              ("slot__"
               ^ (match page.page_uuid with
                  | Some u when String.length u >= 8 -> String.sub u 0 8
                  | _ -> "lui0000"))
            []
        ]
    ]
  in
  (* TODO(component): click needs the DOM payload (targetId/
     interactive closest-walk/shiftKey) — pointer_detail carries
     target_class but not the interactive hit, so title-edit would
     fire on action-button clicks too. Needs a pointer_detail
     extension (target identity + interactive flag) *)
  Logseq_el.el ~key:"page-title"
    ~style_class:"ls-page-title flex flex-1 w-full content items-start title"
    ~attrs:[ ("data-testid", "page title") ]
    ~events:"click contextmenu"
    ~on_dom_event:(fun name payload ->
      match name with
      | "click" ->
          (* icon buttons live inside #page-title; skip title-edit when
             they (or their children) are the click target *)
          let target, interactive =
            ( Json_payload.str payload "targetId"
            , Json_payload.bool payload "interactive" )
          in
          let shift =
            Json_payload.bool payload "shiftKey"
          in
          if
            page.page_uuid <> None && page.page_journal_day = None
            && not shift
            && (target = "" || target = "page-title"
                || target = "page-title-text")
            && not interactive
          then (
            (* cljs edit entry clears any block selection *)
            if S.ready () then Editor_actions.clear_selection ();
            Runtime.send Action.Title_edit_start;
            Runtime.flush ();
            (* land the key input on the freshly mounted sink *)
            Editor_sink.focus_input uuid)
      | _ -> open_menu page name payload)
    body
    ) ctx parent

let blocks_inner ?puuid ?(virtualize = false) ?(library = false)
    ?(scope = "main") ?(container = true) (blocks : Model.block list) : t =
  let inner_attrs =
    match puuid with
    | Some u -> [ ("data-pu", u) ]
    | None -> []
  in
  let items = Array.of_list blocks in
  (* cljs plain-block-list: (when (seq block-uuids)
     [:div.blocks-list-wrap ...]) — empty pages emit no wrap *)
  let list_wrap =
    if blocks = [] then []
    else if Virt_list.enabled ~virtualize (Array.length items) then
      (* cljs parity: .blocks-list-wrap carries
         data-level/data-virtuoso-scroller so the visibility sync and
         dnd/drag paths can find the scroller boundary; rows are
         .ls-virt-row[data-index] > .ls-block *)
      [ box ~key:"blw-virt" ~style_class:"blocks-list-wrap"
          ~data_attrs:
            [ ("data-level", "0"); ("data-virtuoso-scroller", "true") ]
          [ Virt_list.list ~key_of:Tree.block_key
              ~estimate_size:(fun _ -> 32.) ~initial_rows:48
              (* cljs virtuoso overscan 254px + increase-viewport-by
                 254px ≈ 16 rows at the 32px estimate — keeps a
                 comparable render buffer so fast scrolls don't gap *)
              ~overscan:16
              ~data_sig:(fun ctx ->
                Some
                  (Signal.value
                     (Runtime.page_items_sig ctx.Lui_ui.ui_scheduler
                        ~scope ~puuid items)))
              ~pin_key:(fun () ->
                match S.editing () with
                | Some e when e.S.scope = scope ->
                    Some (S.top_level_uuid e.S.uuid)
                | _ -> None)
              ~pin_sig:(fun () ->
                if S.ready () then Some (S.editing_sig ()) else None)
              ~render:(Tree.block_row ~library ~scope ~virtualize) items ] ]
    else
      [ box ~key:"blw" ~style_class:"blocks-list-wrap"
          ~data_attrs:[ ("data-level", "0") ]
          (List.map (Tree.block_row ~library ~scope ~virtualize) blocks) ]
  in
  (* cljs page-root-virtual-list: .blocks-container.flex-1[containerid]
     wraps the .blocks-list-wrap block list; journal-page's
     plain-block-list sits directly under .page-blocks-inner *)
  let body =
    if not container then list_wrap
    else
      [ (* TODO(component): containerid is outside the data-* attribute
           vocabulary — stays a dom attr until the block-container
           contract moves *)
        box ~key:"blc" ~style_class:"flex-1"
          ~data_attrs:
            (match puuid with
             | Some u -> [ ("data-containerid", u) ]
             | None -> [])
          list_wrap ]
  in
  column ~key:"page-blocks" ~style_class:"ls-page-blocks"
    [ box ~key:"page-blocks-inner" ~style_class:"page-blocks-inner relative"
        ~data_attrs:(("data-cid", scope) :: inner_attrs)
        (body
         @ [ Add_button.el ?puuid
               ~flags:(fun ctx ->
                 Signal.constant ctx.Lui_ui.ui_scheduler
                   (blocks <> [], false))
           ])
    ]

let fold_arrow ?on_click ?(collapsed = false) key : t =
  let arrow =
    box ~key ~width:14 ~height:16
      ~style_class:"ls-foldable-title-control block-control"
      [ box ~key:"ch"
          ~style_class:(if collapsed then "" else "control-hide")
          [ box ~key:"ra"
              ~style_class:
                (if collapsed then "rotating-arrow collapsed"
                 else "rotating-arrow not-collapsed")
              [ Ui_parts.rotating_arrow (key ^ "-svg") ]
          ]
      ]
  in
  match on_click with
  | Some f -> Ui_parts.pressable ~on_press:(fun _ -> f ()) arrow
  | None -> arrow

(* cljs ui/foldable-title: .ls-foldable-title > .foldable-title >
   .ls-foldable-header > [a.ls-foldable-title-control] + header —
   the control renders at every level (section and group titles). *)
let foldable_title ?on_click ?(control = true) ?(collapsed = false) key
    inner : t =
  box ~key:(key ^ "-ft") ~style_class:"content"
    [ row ~key:"ftr" ~grow:1. 
        [ row ~key:"fth" ~cross:`center ~gap:4
            ((if control then [ fold_arrow ?on_click ~collapsed (key ^ "-fa") ]
              else [])
             @ [ inner ])
        ]
    ]

let foldable_content key inner : t =
  box ~key:(key ^ "-fc") ~style_class:"ls-foldable-content"
    [ box ~key:"fci"  [ inner ] ]

(* cljs views/view {:add-page-column? true} — each ref row carries the
   source page name. *)
let references_row (b : Model.block) : t =
  match b.Model.block_page_name with
  | Some pname ->
      column
        ~key:("ref-row-" ^ Option.value b.block_uuid ~default:"")
        [ (* a.page-ref[data-ref] is read by sidebar_state *)
          link ~key:"pn" ~url:"#" ~target:`self_ ~style_class:"page-ref"
            ~data_attrs:[ ("data-ref", pname) ] ~text:pname []
        ; Tree.block_row_static b
        ]
  | None -> Tree.block_row_static b

(* cljs reference/references -> views/view :linked-references DOM —
   the section mounts the shared views machinery with the
   linked-references feature: view-head carries the view tabs + the
   filter-cog/sort/filter/search/display-type/menu actions, the body
   renders the grouped-by-page list *)

let references_view ~page_uuid ~has_refs () : t =
  (* cljs references gates the whole section on [:block-ref-count
     page-uuid] > 0 — the unfiltered total, so an include/exclude
     filter can never hide the section itself *)
  if not has_refs then Logseq_el.nothing
  else
    column ~key:"refs" ~style_class:"references"
      [ box ~key:"rvw" ~grow:1.
          [ Views_view.view ~kind:Views_state.KLinkedRefs
              ~owner:(Wire.Uuid page_uuid) ] ]

(* journal linked refs render inside a foldable content wrapper, like
   cljs views/view {:foldable-options ...} — journals default expanded. *)
let journal_references_view (p : Model.page) : t =
  let key = Option.value p.Model.page_uuid ~default:p.Model.page_title in
  match p.Model.page_linked_refs with
  | [] -> Logseq_el.nothing
  | refs ->
      column ~key:("jrefs-" ^ key)
        ~style_class:"references"
        [ box ~key:"jrfc" ~style_class:"ls-foldable-content"
            [ column ~key:"jrb" ~style_class:"ls-view-body"
                (List.map references_row refs)
            ]
        ]

(* cljs lsp-pagebar-slot: a sibling of .ls-page-title inside the title's
   flex-row.space-between wrapper, NOT inside .block-content-wrapper —
   mounting the empty slot box in the wrapper column shifted the whole
   title row down by the column gap. *)
let pagebar_slots_el (page : Model.page) : t =
 fun ctx parent -> (row ~key:"pbar" (page_plugin_slots ctx page)) ctx parent

(* cljs collapsed unlinked head: no .ls-view-head wrapper — .views
   (tab text, no count) + a visible add-view + directly under
   .ls-foldable-header *)
let unlinked_head_collapsed key : t =
  row ~key:(key ^ "-views") ~gap:4 ~cross:`center ~style_class:"views"
    [ button ~key:"uvt" ~variant:`ghost
        ~text:(I18n.t "view/unlinked-references")
        ~style_class:"as-text"
        ~accessibility_identifier:("view-tab-" ^ key)
        []
    ; button ~key:"uva" ~variant:`ghost ~size:`icon ~icon:(`app "plus")
        ~label:(I18n.t "view/add-new-view")
        ~style_class:"as-text"
        []
    ]

(* cljs reference/unlinked-references — the section mounts the shared
   views machinery (:defer-resource? maps to the collapsed default:
   nothing fetches until the fold is opened) *)
let unlinked_references_view (m : Model.t) : t =
  (* cljs renders the section (foldable header included) whenever the
     :block-unlinked-ref-exists resource is true *)
  match m.unlinked_exists, m.route_page with
  | true, Some p -> (
      match p.Model.page_uuid with
      | Some uuid ->
          column ~key:"urefs" ~style_class:"unlinked-references"
            [ column ~key:"uv1" ~gap:8
                [ column ~key:"uv2" ~gap:8
                    [ column ~key:"uv3"
                        [ (if m.unlinked_open
                           then
                             Views_view.view
                               ~kind:Views_state.KUnlinkedRefs
                               ~owner:(Wire.Uuid uuid)
                           else
                             foldable_title "urefs-t" ~collapsed:true
                               ~on_click:(fun () ->
                                 Runtime.send Action.Unlinked_toggle_open;
                                 Runtime.flush ())
                               (unlinked_head_collapsed "urefs"))
                        ]
                    ]
                ]
            ]
      | None -> Logseq_el.nothing)
  | _ -> Logseq_el.nothing

(* --- route views -------------------------------------------------- *)

(* cljs page-inner: data-page-tags="[\"a\", \"b\"]" on the wrap *)
let page_wrap_attrs (page : Model.page) : (string * string) list =
  match page.page_tags with
  | [] -> []
  | tags ->
      [ ( "data-page-tags"
        , "[" ^ String.concat ", " (List.map (fun t -> "\"" ^ t ^ "\"") tags)
          ^ "]" ) ]

let is_today_journal (page : Model.page) : bool =
  match page.page_journal_day with
  | Some d -> d = Dates.today_journal_day ()
  | None -> false

let is_today_page (m : Model.t) (page : Model.page) : bool =
  match page.page_journal_day with
  | Some d -> d = Dates.today_journal_day () && m.route <> Model.Home
  | None -> false

(* cljs page-inner wrap classes — shared by the page route and each
   journal item in the journals list *)
let page_wrap_cls (m : Model.t) (page : Model.page) : string =
  "flex-1 page relative cp__page-inner-wrap"
  ^ (if page.page_journal_day <> None then " is-journals" else "")
  ^ (if is_today_page m page then " is-today-page" else "")
  ^ (if page.page_is_tag || page.page_is_property then " is-node-page"
     else "")

(* journal item backed by the journals signal — the outer keyed
   collection keeps the item mounted across publishes, a title reactive
   repaints title/icon/tag edits, the block list is the same keyed
   collection the page route uses (a delta splice repaints only the
   touched rows), and the refs section repaints when page_linked_refs
   changes. cljs journal-item > page-inner:
   .cp__page-inner-wrap.is-journals containing the same editable
   db-page-title row as a page; the last item drops its separator
   border via .journal-last-item *)
let journal_item_sig (ms : Model.t Signal.signal)
    (ps : Model.page Signal.signal) : t =
 fun ctx parent ->
  let p0 = Signal.get ps in
  let key =
    Option.value p0.Model.page_uuid ~default:p0.Model.page_title
  in
  let is_last () =
    match List.rev (Signal.get ms).Model.journals with
    | last :: _ -> last.Model.page_uuid = (Signal.get ps).Model.page_uuid
    | [] -> false
  in
  let title_eq ((a : Model.page), ea) ((b : Model.page), eb) =
    ea = eb
    && a.Model.page_title = b.Model.page_title
    && a.Model.page_icon = b.Model.page_icon
    && a.Model.page_tags = b.Model.page_tags
    && a.Model.page_is_tag = b.Model.page_is_tag
    && a.Model.page_db_collapsable = b.Model.page_db_collapsable
    && a.Model.page_uuid = b.Model.page_uuid
  in
  (* every derivation off ps/ms is owned into the item's scope —
     otherwise each mounted journal leaves live subscribers on the
     shared model signal *)
  let blocks_sig =
    Logseq_el.own ctx
      (Signal.map (fun (p : Model.page) -> p.Model.page_blocks) ps)
  in
  let nonempty =
    Logseq_el.own ctx (Signal.map (fun bs -> bs <> []) blocks_sig)
  in
  let jrefs_eq (a : Model.page) (b : Model.page) =
    a.Model.page_linked_refs == b.Model.page_linked_refs
    && is_today_journal a = is_today_journal b
  in
  Ui_parts.class_signal
    (Logseq_el.own ctx (Signal.map2 (fun _ _ -> ()) ps ms))
    (fun _ ->
      "journal-item content relative"
      ^ if is_last () then " journal-last-item" else "")
    (column ~key:("ji-" ^ key)
    [ (* data-page-tags is the page-wrap plugin contract *)
      box ~key:("jiw-" ^ key)
        ~style_class:(page_wrap_cls (Signal.get ms) p0)
        ~data_attrs:(page_wrap_attrs p0)
        [ column ~key:("jip-" ^ key) ~gap:32
            ~style_class:"relative page-inner"
            [ row ~key:("jit-" ^ key) ~main:`space_between
                [ reactive ~equal:title_eq
                    (fun (p, editing_title) ->
                      page_title_el
                        { (Signal.get ms) with
                          Model.editing_title = editing_title }
                        p)
                    (Logseq_el.own ctx
                       (Signal.map2
                          (fun (p : Model.page) (m : Model.t) ->
                            (p, m.Model.editing_title))
                          ps ms))
                ; pagebar_slots_el p0
                ]
            ; column ~key:"page-blocks" ~style_class:"mt-4 ls-page-blocks"
                [ box ~key:"page-blocks-inner"
                    ~style_class:"page-blocks-inner relative"
                    ~data_attrs:
                      [ ("data-cid", "main"); ("data-pu", key) ]
                    (* cljs plain-block-list emits no .blocks-list-wrap
                       on empty pages *)
                    [ Lui_elements.if_ ~test:nonempty
                        (box ~key:"blw"
                           ~style_class:"blocks-list-wrap"
                           ~data_attrs:[ ("data-level", "0") ]
                           [ Lazy_children.lazy_rows ~source:blocks_sig
                               ~key:Tree.block_key ~cmp:String.compare
                               ~estimate_height:(fun b ->
                                 32. +. Tree.estimate_children_height b)
                               ~mount:(Tree.block_row_sig ~scope:"main")
                           ])
                    ; (* cljs journal-page mounts add-button inside
                         .page-blocks-inner per day *)
                      Add_button.el ~puuid:key
                        ~flags:(fun ectx ->
                          Logseq_el.own ectx
                            (Signal.map (fun has -> (has, false)) nonempty))
                    ]
                ]
            ]
        ; column ~key:("jrefs-w-" ^ key) ~gap:32 ~style_class:"ml-1"
            (* cljs journal-page: #today-queries div on the today item,
               then one .fade-in.delay refs section (unlinked refs are
               suppressed on the home route) *)
            [ reactive ~equal:jrefs_eq
                (fun (p : Model.page) ->
                  column ~key:("jrefs-i-" ^ key) ~gap:32
                    ((if is_today_journal p then
                        [ box ~key:"tq"
                            ~accessibility_identifier:"today-queries" [] ]
                      else [])
                    @ [ box ~key:"jrefs-f"
                          [ journal_references_view p ]
                      ]))
                ps
            ]
        ]
    ])
    ctx parent

(* cljs all-journals mounts a Virtuoso scroller with custom-scroll-parent:
   #journals > div > div > div[data-testid=virtuoso-item-list] > div >
   journal-item. We keep the same scaffolding and virtualize the outer
   day list through Virt_list — a changed day row remounts on splice
   (virtual rows re-render whole items); each day's inner block list
   stays the keyed Lazy_children collection, so an outliner op only
   repaints the touched day. *)
let journals_view_ms (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let journals_sig =
    Logseq_el.own ctx
      (Signal.map (fun (m : Model.t) -> m.Model.journals) ms)
  in
  (box ~key:"journals" ~accessibility_identifier:"journals"
    ~style_class:"h-full"
    [ box ~key:"js"
        [ box ~key:"jvp"
            [ box ~key:"jil"
                ~accessibility_identifier:"virtuoso-item-list"
                ~data_attrs:[ ("data-testid", "virtuoso-item-list") ]
                [ Lui_elements.if_
                    ~test:
                      (Logseq_el.own ctx
                         (Signal.map (fun js -> js = []) journals_sig))
                    (box ~key:"jp" ~padding:24
                       ~style_class:"journal-item-placeholder animate-pulse" [])
                ; (if Virt_list.enabled ~virtualize:true
                         (List.length (Signal.get journals_sig))
                   then
                     Virt_list.rows_sig
                       ~key:(fun (p : Model.page) ->
                         Option.value p.Model.page_uuid
                           ~default:p.Model.page_title)
                       ~cmp:String.compare
                       ~mount:(journal_item_sig ms)
                       ~initial_rows:4
                       ~estimate_size:(fun _ -> 800.)
                       ~on_end:(fun () ->
                         ignore (!Runtime.journals_load_more ()))
                       journals_sig
                   else
                     Lui_elements.keyed ~source:journals_sig
                       ~key:(fun (p : Model.page) ->
                         Option.value p.Model.page_uuid
                           ~default:p.Model.page_title)
                       ~cmp:String.compare
                       ~mount:(journal_item_sig ms))
                ]
            ]
        ]
    ])
    ctx parent

let not_found_view name : t =
  column ~key:"not-found" ~style_class:"page"
    [ column ~key:"nf-inner" ~cross:`center
        [ text ~key:"nf-t" ~value:(I18n.page_not_found ^ name) [] ]
    ]

(* cljs library/add-pages: secondary button opens a page-picker popup *)
let library_add_pages_button : t =
  box ~key:"lib-add" ~padding_horizontal:4 
    [ button ~key:"lib-add-btn" ~variant:`secondary ~icon:`plus
        ~text:(I18n.t "library/add-existing-pages")
        ~style_class:"ui__button"
        ~on_press:(fun _ -> Runtime.send Action.Toggle_search)
        []
    ]

let empty_state () : t =
  column ~key:"empty" ~style_class:"page"
    [ column ~key:"empty-inner" ~cross:`center
        [ text ~key:"empty-t" ~value:I18n.loading [] ]
    ]

(* --- stable page region --------------------------------------------

   A route page mounts once per navigation. Later publishes — op deltas
   spliced into the model, ref loads, flag changes — repaint through the
   segments below instead of rebuilding the view: the block list is a
   keyed collection so a one-block splice patches one row rather than
   re-rendering the whole tree (~200ms flush on a 200-block page). *)

(* region repaint key: page identity only — splices keep the same page *)
let page_key (p : Model.page option) =
  match p with
  | Some p -> (p.page_uuid, p.page_db_id)
  | None -> (None, None)

let page_route (r : Model.route) =
  (* routes whose content repaints through their own signals — the
     region reactive must stay mounted across data publishes or every
     outliner op rebuilds the whole page (journals: journals_sig pushes
     merged day records into each item; pages: page_sig) *)
  match r with
  | Model.Page _ | Model.Block_zoom _ | Model.Library | Model.Journals
  | Model.Home ->
      true
  | _ -> false

let scope_of_route (r : Model.route) =
  match r with Model.Block_zoom u -> "zoom-" ^ u | _ -> "main"

let page_cls (m : Model.t) =
  let base = "flex-1 page relative cp__page-inner-wrap" in
  match m.route_page with
  | Some page -> page_wrap_cls m page
  | None -> base

let wrap_attrs_of (m : Model.t) =
  match m.route_page with Some p -> page_wrap_attrs p | None -> []

let blocks_sig_of (ms : Model.t Signal.signal) =
  Signal.map
    (fun (m : Model.t) ->
      match m.route_page with
      | Some p -> p.Model.page_blocks
      | None -> [])
    ms

(* top-level block rows as a keyed collection: keyed republishes only
   items whose record actually changed, so a delta splice remounts the
   touched row instead of re-diffing every mounted block *)
let blocks_area ~scope ~library ?puuid (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let blocks_sig = Logseq_el.own ctx (blocks_sig_of ms) in
  let nonempty =
    Logseq_el.own ctx (Signal.map (fun bs -> bs <> []) blocks_sig)
  in
  (* incremental mount: a page swap used to re-emit every row in a
     single flush (~500ms for a 200-block page). Feed keyed only a
     growing prefix and extend it over deferred tasks — each republish
     appends one chunk of Insert patches, so first paint and every step
     stay inside a frame. The per-page reset lives inside the signal
     chain (spine_sig -> windowed) so a route change can't publish a
     full spine before the new limit lands. *)
  let mount_chunk = 16 in
  let rec take n xs =
    match xs with
    | x :: rest when n > 0 -> x :: take (n - 1) rest
    | _ -> []
  in
  let tick = Signal.state ms.Signal.owner 0 in
  let spine_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun (m : Model.t) ->
           match m.Model.route_page with
           | Some p -> (p.Model.page_uuid, p.Model.page_blocks)
           | None -> (None, []))
         ms)
  in
  let emitted = ref mount_chunk and last_uuid = ref None in
  let windowed =
    Logseq_el.own ctx
      (Signal.map2
         (fun (u, bs) _t ->
           if u <> !last_uuid then begin
             last_uuid := u;
             emitted := mount_chunk
           end;
           take (min !emitted (List.length bs)) bs)
         spine_sig (Signal.value tick))
  in
  (* growth driver: deferred tasks bump the window until the whole
     spine is emitted; a spine republish (splice or route change)
     re-arms the loop via the spine_sig subscriber. Only armed when the
     keyed list is the one mounted — virtualized pages window rows
     themselves. *)
  let use_virt =
    Virt_list.enabled ~virtualize:true (List.length (Signal.get blocks_sig))
  in
  if not use_virt then begin
    let grow_pending = ref false and alive = ref true in
    let rec grow () =
      grow_pending := false;
      if !alive then begin
        let total = List.length (snd (Signal.get spine_sig)) in
        if !emitted < total then begin
          (* Once loaded, edits must not truncate the mounted spine. *)
          emitted := if !emitted + mount_chunk >= total then max_int
                     else !emitted + mount_chunk;
          Signal.update tick succ;
          Runtime.flush ();
          schedule_grow ()
        end else emitted := max_int
      end
    and schedule_grow () =
      if not !grow_pending then begin
        grow_pending := true;
        ignore (Ui_services.timers_timeout grow 0)
      end
    in
    ignore
      (Signal.subscribe ~emit_initial:false spine_sig (fun _ ->
           schedule_grow ()));
    Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> alive := false);
    schedule_grow ()
  end;
  let keyed_list =
    box ~key:"blw" ~style_class:"blocks-list-wrap"
      ~data_attrs:[ ("data-level", "0") ]
      [ Lui_elements.keyed ~source:windowed ~key:Tree.block_key
          ~cmp:String.compare
          ~mount:(Tree.block_row_sig ~library ~scope ~virtualize:true) ]
  in
  (* A virtualized list captures its data array at mount, so it can't
     ride the keyed path — rebuild it on a new blocks spine; windowed
     rendering stays active for big pages outside rtc-test *)
  let virt_list =
    box ~key:"blw-virt" ~style_class:"blocks-list-wrap"
      ~data_attrs:
        [ ("data-level", "0"); ("data-virtuoso-scroller", "true") ]
      [ Virt_list.rows_sig ~key:Tree.block_key ~cmp:String.compare
          ~mount:(Tree.block_row_sig ~library ~scope ~virtualize:true)
          ~initial_rows:48 ~estimate_size:(fun _ -> 32.)
          (* cljs virtuoso overscan 254px + increase-viewport-by
             254px ≈ 16 rows at the 32px estimate *)
          ~overscan:16 blocks_sig ]
  in
  (* if_/reactive branches must mount a node — the keyed/virt choice can't be
     a dynamic child, so pick once per region mount; either renderer is
     correct at any size, the threshold is only an optimization *)
  let list_el = if use_virt then virt_list else keyed_list in
  (* cljs plain-block-list emits no .blocks-list-wrap on empty pages *)
  (column ~key:"page-blocks" ~style_class:"mt-4 ls-page-blocks"
    [ box ~key:"page-blocks-inner"
        ~style_class:"page-blocks-inner relative"
        ~data_attrs:
          (("data-cid", scope)
           :: (match puuid with
               | Some u -> [ ("data-pu", u) ]
               | None -> []))
        [ (* TODO(component): containerid is outside the data-*
             attribute vocabulary — stays a dom attr until the
             block-container contract moves *)
          box ~key:"blc" ~style_class:"flex-1"
            ~data_attrs:
              (match puuid with
               | Some u -> [ ("data-containerid", u) ]
               | None -> [])
            [ Lui_elements.if_ ~test:nonempty list_el ]
        ; Add_button.el ?puuid
            ~flags:(fun _ ->
              Logseq_el.own ctx
                (Signal.map
                   (fun (m : Model.t) ->
                     match m.Model.route_page with
                     | Some p when is_block_route p -> (
                         match p.Model.page_blocks with
                         | b :: _ -> (S.children_of b <> [], true)
                         | [] -> (false, true))
                     | Some p -> (p.Model.page_blocks <> [], false)
                     | None -> (false, false))
                   ms))
        ]
    ])
    ctx parent

let title_row (m : Model.t) (page : Model.page) : t =
  row ~key:"page-title-row" ~main:`space_between
    [ page_title_el m page; pagebar_slots_el page ]

(* reactive bodies mount a single node — display:contents keeps the segment
   transparent to .page-inner's grid so its children lay out like the
   direct rows the static build emitted *)
let top_view (m : Model.t) : t =
  match m.route_page with
  | None -> Logseq_el.nothing
  | Some page ->
      (match m.route with
       | Model.Block_zoom _ ->
           box ~key:"ptz" ~display:`contents
             (zoom_breadcrumbs page)
       | Model.Library ->
           box ~key:"ptl" ~display:`contents
             [ title_row m page; library_add_pages_button ]
       | _ ->
           if is_block_route page then
             (* cljs (when (and block? (not sidebar?)) breadcrumb) — a
                block page skips db-page-title, bidirectional properties
                and the tag chips entirely *)
             box ~key:"ptm" ~display:`contents
               (block_page_breadcrumb page)
           else
             box ~key:"ptm" ~display:`contents
               (breadcrumbs page
                @ [ title_row m page
                  ; (* cljs bidirectional-properties-area: sibling of the
                       blocks list inside .page-inner *)
                    Properties_area.bidi_area page ]
                @
                if page.page_is_library then [ library_add_pages_button ]
                else []))

let top_key (p : Model.page option) =
  match p with
  | Some p ->
      Some
        ( p.page_uuid, p.page_title, p.page_icon, p.page_is_tag
        , p.page_is_library, p.page_db_collapsable, p.page_parents
        , p.page_journal_day )
  | None -> None

let top_eq (a : Model.t) (b : Model.t) =
  a.route = b.route
  && a.editing_title = b.editing_title
  && top_key a.route_page = top_key b.route_page

let ref_flags (p : Model.page option) =
  match p with
  | Some p ->
      Some
        ( p.page_journal_day, p.page_is_tag, p.page_is_property
        , p.page_uuid )
  | None -> None

let refs_eq (a : Model.t) (b : Model.t) =
  a.page_ref_count = b.page_ref_count
  && a.unlinked_exists = b.unlinked_exists
  && a.unlinked_open = b.unlinked_open
  && a.route = b.route
  && ref_flags a.route_page = ref_flags b.route_page

let refs_wrap (m : Model.t) : t =
  match m.route_page with
  | None -> Logseq_el.nothing
  | Some page ->
      column ~key:"refs-wrap" ~gap:32 ~style_class:"ml-1"
        (* cljs page-inner: #today-queries div first on today's journal,
           then linked and unlinked refs .fade-in.delay sections *)
        ((if is_today_page m page then
            [ box ~key:"tq" ~accessibility_identifier:"today-queries" [] ]
          else [])
        @ [ (match page.Model.page_uuid with
             | Some uuid ->
                 box ~key:"lrefs"
                   [ references_view ~page_uuid:uuid
                       ~has_refs:(m.page_ref_count > 0) () ]
             | None -> Logseq_el.nothing)
          ; (* cljs when-not class-page?/property-page? — the unlinked
               section is omitted entirely on node pages *)
            (if page.page_is_tag || page.page_is_property
             then Logseq_el.nothing
             else box ~key:"urefs" [ unlinked_references_view m ])
          ])

(* cljs page-inner (show-tabs?): class/property pages render
   .page-tabs > .w-full > .ui__tabs-content > .ml-1 hosting the objects
   view — the view mounts declaratively on the current route page *)
let page_tabs_el (m : Model.t) : t =
  match m.Model.route_page with
  | Some p when p.Model.page_is_tag || p.Model.page_is_property -> (
      match p.Model.page_uuid with
      | None -> Logseq_el.nothing
      | Some uuid ->
          let kind =
            if p.Model.page_is_tag then Views_state.KTagPage uuid
            else Views_state.KPropertyPage uuid
          in
          column ~key:("ptabs-" ^ uuid) ~style_class:"page-tabs"
            [ (* .page-tabs > .w-full is a min-width CSS handle *)
              box ~style_class:"w-full"
                [ box
                    ~style_class:"ui__tabs-content"
                    [ box ~style_class:"ml-1"
                        [ Views_view.view ~kind ~owner:(Wire.Uuid uuid) ] ]
                ]
            ])
  | _ -> Logseq_el.nothing

let page_view_ms (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let m0 = Signal.get ms in
  let scope = scope_of_route m0.route in
  let library =
    m0.route = Model.Library
    ||
    (match m0.route_page with
     | Some p -> p.page_is_library
     | None -> false)
  in
  let puuid =
    match m0.route_page with
    | Some p -> p.page_uuid
    | None -> None
  in
  (* the class signal rides Ui_parts.class_signal (kinds take only a
     static ~style_class); the dynamic data-page-tags wrap attrs ride
     ~data_attrs_signal *)
  (Ui_parts.class_signal ms page_cls
     (box ~key:"page" ~data_attrs:(reactive wrap_attrs_of ms)
        [ column ~key:"page-inner" ~gap:32
            ~style_class:"relative page-inner"
            [ reactive ~equal:top_eq top_view ms
            ; page_tabs_el m0
            ; blocks_area ~scope ~library ?puuid ms
            ]
        ; reactive ~equal:refs_eq refs_wrap ms
        ; Selection_bar.view ()
        ]))
    ctx parent

(* the route-root dynamic segment — page routes keep the region mounted
   across data publishes (the keyed/reactive segments inside repaint
   themselves); all other routes keep repaint-on-data semantics *)
let region (ms : Model.t Signal.signal) : t =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      let shell =
        a.phase = b.phase
        && a.route = b.route
        && a.page_missing = b.page_missing
        && page_key a.route_page = page_key b.route_page
      in
      let r =
        if page_route a.route && page_route b.route then shell
        else
          shell
          && a.data_gen = b.data_gen
          && a.editing_title = b.editing_title
          && a.page_menu = b.page_menu
          && a.confirm = b.confirm
          && a.unlinked_open = b.unlinked_open
      in
      (* journals keep repaint-on-publish semantics only for the
         placeholder<->list structural transition — day-record splices
         repaint through journals_sig without a region remount *)
      let r =
        if not r then r
        else
          match a.route, b.route with
          | (Model.Journals | Model.Home), (Model.Journals | Model.Home)
            when a.data_gen <> b.data_gen ->
              a.journals = [] = (b.journals = [])
          | _ -> r
      in
      r)
    (fun (m : Model.t) ->
      match m.phase, m.route with
      | Model.Ready, (Model.Journals | Model.Home) ->
          (* cljs container.cljs: journals render inside a plain
             route-root div *)
          box ~key:"journals-root"
            [ journals_view_ms ms; Selection_bar.view () ]
      | Model.Ready, Model.Not_found n -> not_found_view n
      | Model.Ready, Model.Graph_view ->
          (* the link-graph canvas isn't ported to the native renderer
             yet — an explicit empty state instead of the 404 chrome *)
          column ~key:"gv" ~style_class:"page"
            [ column ~key:"gv-inner" ~cross:`center ~main:`center
                ~padding_vertical:128
                [ box ~key:"gv-i" ~style_class:"mb-4"
                    [ Icons.icon ~size:48. "hierarchy" ]
                ; heading ~key:"gv-t" ~level:2
                    ~value:(I18n.t "nav/graph-view") ~style_class:"mb-2" []
                ; text ~key:"gv-d"
                    ~value:"Graph view isn't available in this app yet." []
                ]
            ]
      | Model.Ready, Model.All_pages ->
          (* cljs all_pages.cljs renders .ls-all-pages inside the page
             wrapper — the objects view mounts declaratively here *)
          column ~key:"graphs-view" ~style_class:"ls-all-pages"
            [ Views_view.view ~kind:Views_state.KAllPages
                ~owner:(Wire.String "$$$views") ]
      | Model.Ready, Model.All_graphs -> Graphs_view.view ms
      | Model.Ready, Model.Page "Recycle" -> Recycle.view ms
      | Model.Ready, Model.Settings -> Settings_page.view m
      | Model.Ready, Model.Import -> Importer.view ()
      | Model.Ready, _ -> (
          match m.route_page, m.page_missing with
          | Some _, _ -> page_view_ms ms
          | None, true ->
              (* cljs page-aux: missing page/block renders inline
                 (t :page/not-found) inside the content wrap *)
              box ~key:"pg-missing"
                [ text ~key:"pgm-t" ~value:(I18n.t "page/not-found") [] ]
          | None, false -> empty_state ())
      | _ -> empty_state ())
    ms
