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
  ; it_tip : string (* ident / sublabel *)
  ; it_icon : string (* tabler icon before the title, "" = none *)
  ; it_new : bool (* renders via the "New option:" affordance *)
  ; it_checked : bool
  ; it_strong : bool (* title leaf is <strong> (cljs property select) *)
  ; on_choose : unit -> unit
  }

let item ?(tip = "") ?(icon = "") ?(strong = false) ?(checked = false) title on_choose =
  { it_title = title; it_tip = tip; it_icon = icon; it_new = false
  ; it_strong = strong; it_checked = checked; on_choose
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

let visible_items ~items ~filter ~searched ~new_option ~new_case_sensitive =
  let query = String.trim filter in
  let base =
    match searched with
    | Some found -> List.take 100 found
    | None -> Fuzzy.fuzzy_search ~extract:(fun it -> it.it_title) ~limit:100 items query
  in
  let exact =
    List.exists (fun it ->
      if new_case_sensitive then it.it_title = query
      else String.lowercase_ascii it.it_title = String.lowercase_ascii query) base
  in
  match new_option with
  | Some on_new when query <> "" && not exact ->
      let fresh =
        { it_title = query; it_tip = ""; it_icon = ""; it_strong = false
        ; it_checked = false; it_new = true; on_choose = (fun () -> on_new query)
        }
      in
      (* Literal matches lead; a new choice precedes sparse-only matches. *)
      (match base with
       | first :: rest when List.exists (matches query) base -> first :: fresh :: rest
       | _ -> fresh :: base)
  | _ -> base

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
let view ~placeholder ?(compact = false) ?(show_empty_result = true) ?(new_case_sensitive = false) ?new_option ?(on_enter_text = None)
    ?(on_search = None) items : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let st = Signal.state sched { q = ""; searched = None; active = 0; scroll_token = 0 } in
  let request = Ui_effect.request () in
  let visible () =
    let s = Runtime.signal_get st in
    visible_items ~items ~filter:s.q ~searched:s.searched ~new_option ~new_case_sensitive
  in
  let pick () =
    let vis = visible () in
    if vis = [] then (
      match on_enter_text, String.trim (Runtime.signal_get st).q with
      | Some f, t when t <> "" -> f t
      | _ -> ())
    else
      (List.nth vis (Runtime.signal_get st).active).on_choose ()
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
  let item_key it = if it.it_new then "__new__" else it.it_title in
  let list_view =
    reactive ~equal:(fun a b -> a.q = b.q && a.searched == b.searched)
      (fun s ->
         let vis =
           visible_items ~items ~filter:s.q ~searched:s.searched
             ~new_option ~new_case_sensitive
         in
         (* Bound the results viewport while retaining every option in
            its scrollable content. Empty results collapse the list;
            unmatched nonempty queries display the shared no-result message. *)
         column ~gap:0
           ((if compact then [box ~height:4 []] else [])
            @ (if show_empty_result && vis = [] && String.trim s.q <> "" then
               [ text ~key:"select-empty"
                   ~value:(I18n.t "search/no-result")
                   [] ]
             else [])
            @ [ list
               ~scroll_target:(reactive (fun state ->
                 match List.nth_opt vis state.active with
                 | Some item -> item_key item
                 | None -> "") (Signal.value st))
               ~scroll_token:(reactive (fun state -> state.scroll_token) (Signal.value st))
               ~scroll_anchor:`nearest
               ~height:(if vis = [] then 0 else if compact then min 250 (32 * List.length vis) else 280)
               (List.mapi
              (fun index it ->
                 let title = if it.it_new then I18n.t1 "select/new-option" it.it_title else it.it_title in
                 let on_press _ = it.on_choose () in
                 if compact then
                   Ui_components.with_props
                     [Ui_components.Prop.selected_background "var(--lx-gray-04)";
                      Ui_components.Prop.hover_background "var(--lx-gray-04)"]
                   (list_item ~key:(item_key it)
                     ~height:32 ~min_height:32 ~padding_horizontal:8 ~padding_vertical:4
                     ~foreground:"var(--ls-secondary-text-color)"
                     ~corner_radius:4
                     ~selected:(reactive (fun state -> state.active = index) (Signal.value st))
                     ~on_pointer_enter:(fun _ -> select index) ~on_press
                     [ row ~gap:0 ~cross:`center ~grow:1.0
                         ((if it.it_icon = "" then [] else
                             [ Ui_components.with_props [Ui_components.Prop.margin_right 4]
                                 (Icons.icon ~size:(if it.it_icon = "x" then 14. else 18.) it.it_icon) ])
                          @ [ text ~value:title ~grow:1.0 [] ]
                          @ if it.it_checked then [ icon ~name:(`app "check") ~point_size:14 [] ] else []) ])
                 else
                   list_item
                     ~key:(item_key it)
                     ~text:title
                     ~selected:(reactive (fun state -> state.active = index) (Signal.value st))
                     ~on_pointer_enter:(fun _ -> select index)
                     ?icon:(if it.it_icon = "" then None else Some (Icons.name_ref it.it_icon))
                     ~on_press [])
              vis) ]
            @ if compact then [box ~height:4 []] else []))
      (Signal.value st)
  in
  (Ui_components.with_props
     (if compact then [Ui_components.Prop.font_size "14px";Ui_components.Prop.line_height "20px"] else [])
   (column ~gap:(if compact then 0 else 2)
     ~style_class:(if compact then "ls-property-select-compact" else "")
     [ Ui_components.with_props
         (if compact then [Ui_components.Prop.background "transparent";
           Ui_components.Prop.border_width 0; Ui_components.Prop.corner_radius 0;
           Ui_components.Prop.foreground "hsl(var(--foreground))";
           Ui_components.Prop.focus_shadow "none"] else [])
       (Ui_components.text_field ~placeholder ~autofocus:true
         ?height:(if compact then Some 32 else None)
         ?padding:(if compact then Some 6 else None)
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
