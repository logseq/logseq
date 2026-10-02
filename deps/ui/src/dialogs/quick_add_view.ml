(* .ls-quick-add — quick-add dialog body (components/quick_add.cljs): the
   built-in "Quick add" page's blocks rendered editable in container
   "quick-add", plus the "Add to today" submit button. *)

open Lui_elements

let dom = Logseq_dom.dom
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
    dom ~key:"qa-root"
      ~style_class:"ls-quick-add"
      [ dom ~key:"qa-head"
          ~style_class:"ls-qa-head"
          [ dom ~key:"qa-t" ~style_class:"ls-qa-title"
              ~text:(U.t "editor.quick-add/title") [] ]
      ; dom ~key:"qa-c" ~style_class:"ls-qa-content"
          ~attrs:[ ("data-cid", "quick-add") ]
          [ dyn ~equal:(fun a b -> a == b)
              (fun blocks ->
                dom ~key:"qa-list"
                  ~style_class:"page-blocks-inner"
                  (List.map (Tree.block_row ~scope:"quick-add") blocks))
              blocks_sig ]
      ; dom ~key:"qa-btns" ~style_class:"ls-qa-btns"
          [ dom ~key:"qa-add" ~tag:"button"
              ~style_class:"ui__button ls-btn-primary"
              ~attrs:[ ("type", "button") ]
              ~events:"click"
              ~on_dom_event:(fun n _ ->
                if n = "click" then
                  Editor_actions.quick_add_blocks_to_today ())
              [ dom ~key:"qa-add-t"
                  ~text:(U.t "editor.quick-add/add-to-today") [] ] ]
      ]
  in
  node ctx parent
