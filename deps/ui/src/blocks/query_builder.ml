(* Query value block (cljs components/query/builder.cljs): a block that
   is the target of the owner's logseq.property/query ref renders
   .cp__query-builder in place of its text content. The add-filter
   button opens a filter/operator select (component-select); picking
   "tags" chains to a class picker, and the clause is saved as dsl text
   on this block's title — (tags [[uuid]]) — via save-block.

   The add-filter button installs its own click listener (same pattern as
   Asset_dom / Views_builder) — the document-level handler in editor_keys
   only has to keep .cp__query-builder out of the enter_edit path. *)

open Promise_ext
module D = Web_dom
module S = Properties_state
module I18n = I18n
module W = Wire

let dom = Logseq_dom.dom

(* cljs query-builder/db-based-block-filters + operators *)
let filters =
  [ "tags"; "page reference"; "property"; "task"; "priority"; "page"
  ; "full text search"; "between"; "sample" ]

let operators = [ "and"; "or"; "not" ]

(* cljs filter-label — en.edn keys *)
let filter_label = function
  | "tags" -> I18n.t "property.built-in/tags"
  | "page reference" -> I18n.t "query.builder/filter-page-reference-label"
  | "property" -> I18n.t "class.built-in/property"
  | "task" -> I18n.t "class.built-in/task"
  | "priority" -> I18n.t "property.built-in/priority"
  | "page" -> I18n.t "query.builder/filter-page-label"
  | "full text search" -> I18n.t "query.builder/filter-full-text-search-label"
  | "between" -> I18n.t "view.filter/operator-between"
  | "sample" -> I18n.t "query.builder/filter-sample-label"
  | other -> other

(* save the dsl title on the query value block (cljs add-watch :updated
   -> editor-handler/save-block!) *)
let save_dsl uuid dsl =
  ignore
    (let* sop = Outliner_ops.save_block_parsed uuid dsl in
     Outliner_ops.apply_and_refresh [ sop ])

let open_select ~anchor ~placeholder items =
  let root, input = Properties_select.create ~placeholder items in
  ignore (Properties_popup.open_anchored anchor root);
  Web_dom.el_focus input

(* class picker after choosing "tags" — cljs lists all classes by
   title *)
let open_class_picker ~anchor value_uuid =
  ignore
    (let* w = Properties_data.all_classes () in
    let classes =
      match w with W.Array xs | W.List xs -> xs | _ -> []
    in
    let items =
      List.filter_map
        (fun c ->
          match
            ( W.map_get_string c "block/title"
            , W.map_get_uuid c "block/uuid" )
          with
          | Some title, Some u ->
              Some
                (Properties_select.item ~tip:u title
                   (fun () ->
                     S.pop_overlay ();
                     save_dsl value_uuid
                       ("(tags [[" ^ u ^ "]])")))
          | _ -> None)
        classes
    in
    (* replace the filter select with the class picker *)
    S.pop_overlay ();
    open_select ~anchor ~placeholder:(I18n.t "query.builder/add-filter-or-operator-placeholder") items;
    Js.Promise.resolve ())

let open_filter_picker ~anchor value_uuid =
  let items =
    List.map
      (fun f ->
        Properties_select.item (filter_label f) (fun () ->
            if f = "tags" then open_class_picker ~anchor value_uuid
            else ()))
      (filters @ operators)
  in
  open_select ~anchor ~placeholder:(I18n.t "query.builder/add-filter-or-operator-placeholder") items

(* .cp__query-builder > .cp__query-builder-filter > button.add-filter —
   cljs renders the "Filter" label whenever loc=[0] (the root add-filter),
   regardless of the query title *)
let block_el uuid (_b : Model.block) : Lui_elements.t =
  Lui_elements.box ~key:("qwrap-" ^ uuid) ~style_class:"cp__query-builder"
    [ Lui_elements.box ~key:("qfilter-" ^ uuid)
        ~style_class:"cp__query-builder-filter"
        [ (* TODO(component): the button kind renders ~text inside its
             .lui-button-label span — Playwright's button:text('filter')
             locator only matches when the button itself is the smallest
             element containing the text, i.e. a direct text node. Keep
             dom ~text until the e2e contract or the adapter changes. *)
          dom ~key:("qb-" ^ uuid) ~tag:"button" ~id:("qb-" ^ uuid)
            ~style_class:
              "jtrigger !px-1 h-6 add-filter text-muted-foreground"
            ~attrs:[ ("type", "button") ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then
                match D.query_selector ("#qb-" ^ uuid) with
                | Some btn -> open_filter_picker ~anchor:btn uuid
                | None -> ())
            ~text:(I18n.t "query.builder/filter")
            [ Lui_elements.icon ~key:("qi-" ^ uuid) ~name:`plus
                ~style_class:"ui__icon" []
            ]
        ]
    ]
