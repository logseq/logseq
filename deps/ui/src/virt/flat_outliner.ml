open Lui_elements

module P = Outliner_projection

type guide = { ancestor : P.ancestor; inset : int }

let guides ~library (row : P.block_row) =
  let _, reversed = List.fold_left (fun (inset, guides) ancestor ->
    let next = inset + Tree.children_indent ~library ancestor.P.ancestor_block in
    next, {ancestor; inset = next} :: guides)
    (0, []) (List.rev row.ancestors) in
  List.rev reversed

let block_of_row = function
  | P.Block block -> block
  | _ -> invalid_arg "Projected row changed its semantic kind"

let section_of_row = function
  | P.Header section | P.Footer section -> section
  | _ -> invalid_arg "Projected section changed its semantic kind"

let block_attrs row =
  let parent = match row.P.ancestors with
    | {P.ancestor_scope; ancestor_block} :: _ when ancestor_scope = row.scope ->
        ancestor_block.Model.block_uuid
    | _ -> None in
  [ "data-projection-owner", row.scope
  ; "data-projection-key", P.key (P.Block row)
  ; "data-projection-section", row.section.section_key
  ; "data-projection-depth", string_of_int row.depth
  ; "data-projection-parent", Option.value parent ~default:""
  ] @ (match row.section.page.Model.page_uuid with
       | Some uuid -> ["data-pu", uuid]
       | None -> [])

let block_row ~state ~library ~source : t =
 fun ctx parent ->
  let initial = block_of_row (Signal.get source) in
  let indent row = List.fold_left (fun total ancestor ->
    total + Tree.children_indent ~library ancestor.P.ancestor_block)
    0 (block_of_row row).ancestors in
  (Ui_components.with_props [Ui_components.Prop.position `relative]
    (column ~key:(P.key (P.Block initial)) ~min_width:0 ~margin_left:(-20)
      ~style_class:"page-blocks-inner"
      ~data_attrs:(reactive (fun row -> block_attrs (block_of_row row)) source)
      [ Outline_viewport_state.row_occurrence state ~key:(P.key (P.Block initial))
        (keyed ~source:(reactive (fun row -> guides ~library (block_of_row row)) source)
          ~key:(fun guide -> P.scoped_key guide.ancestor.ancestor_scope
            (P.block_identity guide.ancestor.ancestor_block)) ~cmp:String.compare
          ~mount:(fun guide ->
            Ui_components.with_props
              [ Ui_components.Prop.position `absolute
              ; Ui_components.Prop.inset_top 0.
              ; Ui_components.Prop.inset_bottom 0. ]
              (Ui_parts.float_prop Lui_protocol.InsetLeft
                ~value:(reactive (fun guide -> float_of_int (guide.inset - 1)) guide)
                (box ~key:(let ancestor = (Signal.get guide).ancestor in
                   P.scoped_key ancestor.ancestor_scope (P.block_identity ancestor.ancestor_block)) ~width:4
                  ~style_class:"block-children-left-border"
                  ~data_attrs:(reactive (fun guide ->
                    ("data-cid", guide.ancestor.ancestor_scope) ::
                    (match guide.ancestor.ancestor_block.Model.block_uuid with
                     | Some uuid -> ["data-blockid", uuid]
                     | None -> [])) guide)
                  [ Ui_components.with_props
                      [ Ui_components.Prop.position `absolute
                      ; Ui_components.Prop.inset_top 0.
                      ; Ui_components.Prop.inset_bottom 0. ]
                      (Ui_parts.float_prop Lui_protocol.InsetLeft
                        ~value:(reactive (fun guide ->
                          let size = Tree.bullet_size ~library guide.ancestor.ancestor_block in
                          1.5 +. float_of_int size /. 2. -. float_of_int (size / 2)) guide)
                        (box ~key:"guide-line" ~width:1
                          ~style_class:"block-children-indent-guide"
                          ~background:"var(--lx-gray-04-alpha, var(--ls-guideline-color))" [])) ]))))
      ; Ui_parts.int_prop Lui_protocol.MarginLeft ~value:(reactive indent source)
          (Tree.projected_block_row ~scope:initial.scope ~library
                ~depth:(reactive (fun row -> (block_of_row row).depth) source)
                ~source:(reactive (fun row -> (block_of_row row).block) source)) ]))
    ctx parent

let view ~state ~library ~header ~footer ?(on_end = fun () -> ()) () : t =
 fun ctx parent ->
  let root = column ~key:"main-outline" ~min_width:0
      ~style_class:"blocks-list-wrap" ~data_attrs:["data-level", "0"] [] ctx parent in
  Outline_viewport_state.register_rows ctx state root;
  let mount source =
    let initial = Signal.get source in
    let content = match initial with
    | P.Block _ -> block_row ~state ~library ~source
    | P.Header _ -> header ~source:(reactive section_of_row source)
    | P.Footer _ -> footer ~source:(reactive section_of_row source) in
    match initial with
    | P.Block _ -> content
    | P.Header _ | P.Footer _ -> column ~key:(P.key initial) ~min_width:0
        ~data_attrs:["data-projection-key", P.key initial]
        [Outline_viewport_state.row_occurrence state ~key:(P.key initial) content] in
  let list = match state.Outline_viewport_state.native with
  | Some native ->
      virtual_list ~key:"main-outline-list" ~viewport:native.source ~item_extent:32.
        ~scroll_target_signal:state.scroll_target ~track_visible_range:true
        ~scroll_token_signal:(Signal.value state.scroll_token)
        ~on_scroll_completed:(function
          | Lui_protocol.ScrollCompleted (_, token, outcome) as event ->
              Issued_reveal.scroll_completed native.navigation event;
              Issued_reveal.scroll_completed native.editing event;
              Signal.set state.scroll_completed (Some (token, outcome))
          | _ -> ())
        ~on_visible_range:(function
          | Lui_protocol.VisibleRange (_, _, last)
            when Signal.get state.row_count > 0 && last >= Signal.get state.row_count - 1 -> on_end ()
          | _ -> ())
        [ virtual_rows ~source:state.rows ~key:P.key ~scroll_key:P.key
            ~cmp:String.compare ~mount () ]
  | None ->
      let windowed count = Virt_list.enabled ~virtualize:true count in
      reactive ~equal:(fun a b -> windowed a = windowed b)
        (fun count ->
          if windowed count then
            Virt_list.rows_sig ~key:P.key ~cmp:String.compare ~mount
              ~estimate_size:(fun _ -> 32.) ~on_end state.rows
          else keyed ~source:state.rows ~key:P.key ~cmp:String.compare ~mount)
        state.row_count
  in
  ignore (list ctx (Some root));
  root
