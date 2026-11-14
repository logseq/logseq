(* Page-level .block-add-button — the trailing "click to add block" row
   (cljs components/page.cljs add-button-inner), emitted declaratively as
   the last child of every .page-blocks-inner region (page routes, block
   routes, journal items, sidebar items, previews, quick-add). Presses
   reach Editor_actions.append_block through the semantic event channel. *)

open Lui_elements

(* Project the predecessor in this owner's rendered DFS order, respecting
   the same scoped collapse state as its rows. This is intentionally
   owner-local; Master's DOM lookup can cross container boundaries. *)
let previous_blank ~scope blocks collapse =
  let rec last_visible = function
    | [] -> None
    | _ :: (_ :: _ as rest) -> last_visible rest
    | [ (block : Model.block) ] ->
        let collapsed =
          match block.block_uuid with
          | None -> false
          | Some uuid ->
              Editor_state.effective_collapsed_in_view ~scope uuid
                block.block_default_collapsed collapse
        in
        if collapsed then Some block
        else
          match last_visible (Editor_state.children_of block) with
          | Some _ as last -> last
          | None -> Some block
  in
  Option.map (fun (block : Model.block) -> String.trim block.block_title = "")
    (last_visible blocks)

(* Desktop Master: rest at 0 with children, 0.5 otherwise; hover keeps
   a blank predecessor hidden, reveals a populated owner at 0.5, and
   an empty owner at 1. Appearance never substitutes for semantic Press. *)
let el ?puuid ?(scope = "main") ?(library = false)
    ?previous_blank ?previous_blank_signal
    ~(flags : 'a -> (bool * bool) Signal.signal) () : t =
 fun context parent ->
  if Ui_services.env_publishing () then Logseq_el.nothing context parent
  else
    let fs = flags context in
    let previous =
      match previous_blank, previous_blank_signal with
      | Some value, None -> Signal.constant context.Lui_ui.ui_scheduler value
      | None, Some source -> source
      | _ -> invalid_arg "Add_button.el requires exactly one previous_blank source"
    in
    (Ui_parts.pressable
       ~on_press:(fun _ ->
         Editor_actions.append_block ?for_page:puuid ~scope ~library ())
       (Ui_parts.class_signal fs
       (fun (_has, indented) ->
         "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text !py-0 "
         ^ (if indented then " ls-block-content-indent" else ""))
       (Ui_parts.float_prop Lui_protocol.HoverOpacity
          ~value:(reactive
            (fun (has, _) previous_blank ->
              match previous_blank with
              | Some true -> 0.
              | Some false when has -> 0.5
              | _ -> 1.) fs previous)
       (column ~key:"bab" ~transition:"opacity 100ms ease-in"
          ~data_attrs:
            (("tabindex", "0")
             :: (match puuid with
                 | Some u -> [ ("data-parentblockid", u) ]
                 | None -> []))
          ~opacity:
            (reactive
               (fun (has, _) -> if has then 0. else 0.5) fs)
          [ row ~key:"bab-row"
              [ (* margin-left follows .ls-block-content-indent on the
                   outer column: 22px flat, 6px indented — bound to the
                   same flags signal as the class toggle *)
                Ui_parts.int_prop Lui_protocol.MarginLeft
                  ~value:(reactive (fun (_has, indented) -> if indented then 6 else 22) fs)
                  (row ~key:"bab-inner" ~cross:`center ~height:28 ~grow:1.
                     ~style_class:"bab-inner"
                     [ (* same bullet metrics as the block gutter dot in
                          blocks/tree.ml — style_class alone carries no
                          size on style-less backends *)
                        box ~key:"bab-bc" ~style_class:"bullet-container"
                          ~main:`center ~cross:`center ~width:16 ~height:16
                          ~corner_radius:8
                          [ box ~key:"bab-b" ~style_class:"bullet"
                              ~transition:"transform 0.2s" ~width:6 ~height:6
                              ~corner_radius:999 ~opacity:1.
                              ~background:
                                "var(--lx-gray-09, var(--ls-block-bullet-color))"
                              [] ] ]) ] ]))))
      context parent
