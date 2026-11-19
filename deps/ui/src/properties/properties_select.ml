(* .cp__select widget — the autocomplete select used by the property
   picker, type picker, class picker and value pickers, rendered as
   cross-platform LUI components: a text field over a scrollable menu
   item list (same input-on-top / results-below structure as web
   master's .cp__select).

   Keyboard: unmodified Up/Down move selection while input focus stays
   in place; Enter picks that result. Escape is owned by the popup. *)

open Promise_ext
open Lui_elements

type item =
  { it_title : string
  ; it_key : string option
  ; it_tip : string (* ident / sublabel *)
  ; it_icon : string (* tabler icon before the title, "" = none *)
  ; it_new : bool (* renders via the "New option:" affordance *)
  ; it_checked : bool
  ; it_has_header : bool
  ; it_strong : bool (* title leaf is <strong> (cljs property select) *)
  ; on_choose : unit -> unit
  }

type presentation = Standard | Node_picker | Property_name

let item ?key ?(tip = "") ?(icon = "") ?(strong = false) ?(checked = false)
    ?(has_header = false) title on_choose =
  { it_title = title; it_key = key; it_tip = tip; it_icon = icon; it_new = false
  ; it_strong = strong; it_checked = checked; it_has_header = has_header; on_choose
  }

let matches needle item =
  let n = String.lowercase_ascii (String.trim needle) in
  if n = "" then true
  else
    let hay = String.lowercase_ascii item.it_title in
    let nl = String.length n and hl = String.length hay in
    let rec go i =
      i + nl <= hl && (String.sub hay i nl = n || go (i + 1))
    in
    nl <= hl && go 0

let visible_items_with_selection ?(multiple_choices = false) ?(selected_keys = [])
    ~items ~filter ~searched ~new_option ~new_case_sensitive () =
  let query = String.trim filter in
  let base =
    match searched with
    | Some found -> List.take 100 found
    | None -> Fuzzy.fuzzy_search ~extract:(fun it -> it.it_title) ~limit:100 items query
  in
  let base =
    if multiple_choices && query <> "" then
      let selected, unselected =
        List.partition
          (fun it -> Option.fold ~none:false ~some:(fun key -> List.mem key selected_keys) it.it_key)
          base
      in
      selected @ unselected
    else base
  in
  let exact =
    List.exists (fun it ->
      if new_case_sensitive then it.it_title = query
      else String.lowercase_ascii it.it_title = String.lowercase_ascii query) base
  in
  match new_option with
  | Some on_new when query <> "" && not exact ->
      let fresh =
        { it_title = query; it_key = Some "__new__"; it_tip = ""; it_icon = ""; it_strong = false
        ; it_checked = false; it_has_header = false; it_new = true; on_choose = (fun () -> on_new query)
        }
      in
      (* Literal matches lead; a new choice precedes sparse-only matches. *)
      (match base with
       | first :: rest when List.exists (matches query) base -> first :: fresh :: rest
       | _ -> fresh :: base)
  | _ -> base

let visible_items ~items ~filter ~searched ~new_option ~new_case_sensitive =
  visible_items_with_selection ~items ~filter ~searched ~new_option ~new_case_sensitive ()

(* Selection changes retain rows; queries replace their contents. *)
type sel_state =
  { q : string
  ; searched : item list option
  ; active : int
  ; scroll_token : int
  }

(* Builds the select as a [t]: text_field over a scrollable list of
   menu_items. Mounted inside the property dialog card or an anchored
   dropdown_menu. *)
let view ~placeholder ?(compact = false) ?(presentation = Standard)
    ?(clear_input_on_choice = false) ?(multiple_choices = false)
    ?(show_empty_result = true) ?(new_case_sensitive = false) ?new_option ?selected_keys ?(on_enter_text = None)
    ?(on_search = None) items : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let node_picker = presentation = Node_picker in
  let property_name = presentation = Property_name in
  let st = Signal.state sched { q = ""; searched = None; active = 0; scroll_token = 0 } in
  let request = Ui_effect.request () in
  let node_results_max_height () =
    max 0 (int_of_float (0.75 *. Ui_services.dom_viewport_height () -. 64.))
  in
  let highlight_background =
    "var(--lx-gray-04, var(--ls-menu-hover-color, hsl(var(--secondary))))"
  in
  let selected_keys_signal =
    match selected_keys with
    | Some keys -> keys
    | None -> Signal.value (Signal.state sched [])
  in
  let current_selected_keys () =
    if multiple_choices then Signal.get selected_keys_signal else []
  in
  let visible () =
    let s = Runtime.signal_get st in
    visible_items_with_selection ~multiple_choices ~selected_keys:(current_selected_keys ())
      ~items ~filter:s.q ~searched:s.searched ~new_option ~new_case_sensitive ()
  in
  let choose on_choose =
    if clear_input_on_choice then (
      ignore (Ui_effect.issue request);
      let state = Runtime.signal_get st in
      Runtime.signal_set st
        { q = ""; searched = None;
          active = (if node_picker && multiple_choices then state.active else 0);
          scroll_token = state.scroll_token + 1 });
    on_choose ()
  in
  let pick () =
    let vis = visible () in
    if vis = [] then (
      match on_enter_text, String.trim (Runtime.signal_get st).q with
      | Some f, t when t <> "" -> choose (fun () -> f t)
      | _ -> ())
    else
      choose (List.nth vis (Runtime.signal_get st).active).on_choose
  in
  let select index =
    let s = Runtime.signal_get st in
    if s.active <> index then Runtime.signal_set st { s with active = index }
  in
  let navigate direction =
    let count = List.length (visible ()) in
    if count > 0 then begin
      let s = Runtime.signal_get st in
      Runtime.signal_set st
        { s with active = (s.active + direction + count) mod count;
          scroll_token = s.scroll_token + 1 }
    end
  in
  let render_list s selected_key_values =
         let vis =
           visible_items_with_selection ~multiple_choices ~selected_keys:selected_key_values
             ~items ~filter:s.q ~searched:s.searched ~new_option ~new_case_sensitive ()
         in
         let titles = Array.of_list (List.map (fun it -> Option.value it.it_key ~default:it.it_title) vis) in
         let counts = Hashtbl.create (Array.length titles) in
         Array.iter (fun title -> Hashtbl.replace counts title
           (1 + Option.value (Hashtbl.find_opt counts title) ~default:0)) titles;
         let item_key index =
           let title = titles.(index) in
           if Hashtbl.find counts title = 1 then title
           else title ^ "-option-" ^ string_of_int index
         in
         let style_result_list result_list =
           if node_picker then
             Ui_components.with_props
               ([Ui_components.Prop.max_height (node_results_max_height ())]
                @ if vis = [] then [] else [Ui_components.Prop.padding_vertical 4])
               result_list
           else result_list
         in
         (* Bound the results viewport while retaining every option in
            its scrollable content. Empty results collapse the list;
            unmatched nonempty queries display the shared no-result message. *)
         column ~gap:0
           ((if compact && vis <> [] then [box ~height:4 []] else [])
            @ (if show_empty_result && vis = [] && String.trim s.q <> "" then
               [ text ~key:"select-empty"
                   ~value:(I18n.t "search/no-result")
                   [] ]
             else [])
            @ [style_result_list
                 (list
                   ~scroll_target:(reactive (fun state ->
                     match List.nth_opt vis state.active with
                     | Some _ -> item_key state.active
                     | None -> "") (Signal.value st))
                   ~scroll_token:(reactive (fun state -> state.scroll_token) (Signal.value st))
                   ~scroll_anchor:`nearest
                   ~height:(if vis = [] then 0
                     else if compact then min 250 (32 * List.length vis)
                     else if node_picker then
                       (if multiple_choices then
                          List.fold_left (fun height item ->
                            height + if item.it_has_header then 36 else 32) 0 vis
                        else 36 * List.length vis) + 8
                     else 280)
                   (List.mapi
                     (fun index it ->
                       let title = if it.it_new then I18n.t1 "select/new-option" it.it_title else it.it_title in
                       let selected_marker =
                         if multiple_choices then []
                         else match selected_keys with
                           | Some keys ->
                               [ if_ ~test:(reactive (fun selected ->
                                   match it.it_key with
                                   | Some key -> List.mem key selected
                                   | None -> false) keys)
                                   (icon ~name:(`app "check") ~point_size:14 []) ]
                           | None -> if it.it_checked then
                               [icon ~name:(`app "check") ~point_size:14 []] else []
                       in
                       let item_children =
                         if compact then
                           [ row ~gap:0 ~cross:`center ~grow:1.0
                               ((if it.it_icon = "" then [] else
                                   [ Ui_components.with_props [Ui_components.Prop.margin_right 4]
                                       (Icons.icon ~size:(if property_name then 15. else if it.it_icon = "x" then 14. else 18.) it.it_icon) ])
                                @ [ text ~value:title ~grow:1.0 ~min_width:0
                                      ~white_space:(if property_name then "nowrap" else "normal") [] ]
                                @ selected_marker) ]
                         else selected_marker
                       in
                       let item_view =
                         if multiple_choices then
                           let row_height =
                             if node_picker then (if it.it_has_header then 36 else 32)
                             else 32
                           in
                           let checkbox =
                           Ui_components.with_props
                             ([Ui_components.Prop.hover_background highlight_background;
                               Ui_components.Prop.hover_foreground "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))"]
                              @ if node_picker then
                                  [Ui_components.Prop.padding_top
                                     (if it.it_has_header then 10 else 6)]
                                else [])
                             (Ui_components.checkbox ~key:(item_key index)
                               ?gap:(if node_picker then Some 4 else None)
                               ?main:(if node_picker then Some `start else None)
                               ~height:row_height
                               ~min_height:row_height
                               ~padding_horizontal:8
                               ~padding_vertical:(if node_picker then 6 else 4)
                               ~corner_radius:4
                               ~grow:1.0 ~label:title ~text:title
                               ~background:(reactive (fun state ->
                                 if state.active = index then highlight_background else "transparent")
                                 (Signal.value st))
                               ~foreground:(reactive (fun state ->
                                 if state.active = index then
                                   "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))"
                                 else "hsl(var(--popover-foreground) / 0.75)") (Signal.value st))
                               ~checked:(reactive (fun selected ->
                                 match it.it_key with
                                 | Some key -> List.mem key selected
                                 | None -> false) selected_keys_signal)
                               ~on_pointer_enter:(fun _ -> select index)
                               ~on_toggle:(fun _ -> choose it.on_choose)
                               [])
                           in
                           if node_picker then
                             row ~key:(item_key index) ~height:row_height
                               ~min_height:row_height ~cross:`stretch ~min_width:0
                               [checkbox]
                           else checkbox
                         else
                           Ui_components.with_props
                             [Ui_components.Prop.hover_background highlight_background;
                              Ui_components.Prop.hover_foreground "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))"]
                             (list_item ~key:(item_key index)
                           ?height:(if node_picker then Some 36 else if compact then Some 32 else None)
                           ?min_height:(if node_picker then Some 36 else if compact then Some 32 else None)
                           ?padding_horizontal:(if node_picker then Some 8 else if compact then Some 8 else None)
                           ?padding_vertical:(if node_picker then Some 8 else if compact then Some 4 else None)
                           ?corner_radius:(if compact then Some 4 else None)
                           ~background:(reactive (fun state ->
                             if state.active = index then highlight_background else "transparent")
                             (Signal.value st))
                           ~foreground:(reactive (fun state ->
                             if state.active = index then
                               "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))"
                             else if property_name then "hsl(var(--popover-foreground))"
                             else "hsl(var(--popover-foreground) / 0.75)") (Signal.value st))
                           ?text:(if compact then None else Some title)
                           ?icon:(if compact || it.it_icon="" then None else Some (Icons.name_ref it.it_icon))
                           ~on_pointer_enter:(fun _ -> select index) ~on_press:(fun _ -> choose it.on_choose)
                           item_children)
                       in
                       item_view)
                     vis))]
            @ (if compact && vis <> [] then [box ~height:4 []] else []))
  in
  let list_view =
    if multiple_choices then
      reactive
        ~equal:(fun (a, ka) (b, kb) ->
          a.q = b.q && a.searched == b.searched
          && (String.trim a.q = "" || ka = kb))
        (fun s keys -> render_list s keys)
        (Signal.value st) selected_keys_signal
    else
      reactive ~equal:(fun a b -> a.q = b.q && a.searched == b.searched)
        (fun s -> render_list s []) (Signal.value st)
  in
  (Ui_components.with_props
     (if compact || node_picker then
        [Ui_components.Prop.font_size "14px";Ui_components.Prop.line_height "20px"]
      else [])
   (column ~gap:(if compact || node_picker then 0 else 2)
     ~style_class:(if compact then "ls-property-select-compact" else "")
     [ Ui_components.with_props
         (if compact || node_picker then [Ui_components.Prop.background "transparent";
           Ui_components.Prop.border_width 0; Ui_components.Prop.corner_radius 0;
           Ui_components.Prop.foreground "hsl(var(--foreground))";
           Ui_components.Prop.focus_shadow "none"] else [])
       (Ui_components.text_field ~placeholder ~autofocus:true
         ~text:(reactive (fun state -> state.q) (Signal.value st))
         ?height:(if compact || node_picker then Some 32 else None)
         ?padding:(if compact || node_picker then Some 6 else None)
         ?style_class:(if compact then Some "ls-property-select-input" else None)
         ~on_input:(fun ev ->
           match ev with
           | Lui_protocol.TextChanged (_, q) ->
               let ticket = Ui_effect.issue request in
               let state = Runtime.signal_get st in
               Runtime.signal_set st { state with q; searched = None; active = 0 };
               (match on_search with
                | Some search ->
                    ignore
                      (let* found = search q in
                       if Ui_effect.alive context.Lui_ui.ui_scope
                          && Ui_effect.is_current request ticket then
                         Runtime.signal_set st
                           { (Runtime.signal_get st) with searched = Some found; active = 0 };
                       Js.Promise.resolve ())
                | None -> ())
           | _ -> ())
         ~on_navigate:(function
           | Lui_protocol.NavigatePrevious _ -> navigate (-1)
           | Lui_protocol.NavigateNext _ -> navigate 1
           | _ -> ())
         ~on_submit:(fun _ -> pick ())
         [])
     ; list_view
     ]))
    context parent
