(* .ls-quick-add — quick-add dialog body (components/quick_add.cljs): the
   built-in "Quick add" page's blocks rendered editable in container
   "quick-add", plus the "Add to today" submit button. *)

open Lui_elements

module U = I18n

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Quick_add_state.ensure ctx;
  let blocks_sig =
    Signal.map
      (fun (s : Quick_add_state.t) -> s.Quick_add_state.blocks)
      (Quick_add_state.signal ())
  in
  let node =
    column ~key:"qa-root"
      ~style_class:"ls-quick-add"
      ~gap:16 ~grow:1. ~min_width:384
      [ row ~key:"qa-head"
          ~style_class:"ls-qa-head"
          ~main:`space_between ~cross:`center ~gap:16
          ~data_attrs:
            [ ( "style"
              , "border-bottom:1px solid var(--lui-c-border);\
                 padding-bottom:1rem" ) ]
          [ text ~key:"qa-t" ~style_class:"ls-qa-title" ~font_weight:500
              ~value:(U.t "editor.quick-add/title") [] ]
      ; box ~key:"qa-c" ~style_class:"ls-qa-content"
          ~data_attrs:[ ("style", "margin-left:-1.5rem") ]
          (* cljs .page-blocks-inner[data-cid] marks the editable
             container region — carried as the a11y id until the
             imperative [data-cid] lookup migrates *)
          ~accessibility_identifier:"quick-add"
          [ reactive ~equal:( == )
              (fun blocks ->
                column ~key:"qa-list"
                  ~style_class:"page-blocks-inner"
                  (List.map (Tree.block_row ~scope:"quick-add") blocks
                   @ [ (* cljs quick_add page-blocks mounts
                          page-blocks-cp, which carries add-button *)
                       Add_button.el
                         ?puuid:
                           (Quick_add_state.value ()).Quick_add_state.page_uuid
                         ~flags:(fun ctx ->
                           Signal.constant ctx.Lui_ui.ui_scheduler
                             (blocks <> [], false))
                     ]))
              blocks_sig ]
      ; row ~key:"qa-btns" ~style_class:"ls-qa-btns"
          ~main:`end_
          [ Ui_components.dialog_btn_primary ~key:"qa-add" ~variant:`primary
              ~text:(U.t "editor.quick-add/add-to-today")
              ~on_press:(fun _ ->
                Editor_actions.quick_add_blocks_to_today ()) ]
      ]
  in
  node ctx parent
