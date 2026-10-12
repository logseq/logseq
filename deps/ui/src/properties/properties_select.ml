(* .cp__select widget — the autocomplete select used by the property
   picker, type picker, class picker and value pickers, rendered as
   cross-platform LUI components: a text field over a scrollable menu
   item list (same input-on-top / results-below structure as web
   master's .cp__select).

   Keyboard navigation and submission share the selected index; Escape
   bubbles to the property keydown handler which dismisses the popup. *)

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

let visible_items ~items ~filter ~searched ~new_option =
  let base =
    let matched =
      match searched with
      | Some found -> found
      | None -> List.filter (matches filter) items
    in
    let q = String.lowercase_ascii (String.trim filter) in
    if q = "" then matched
    else
      (* cljs fuzzy ranks exact/prefix hits first *)
      List.stable_sort
        (fun a b ->
          let score it =
            let t = String.lowercase_ascii it.it_title in
            if t = q then 0
            else if String.length t > String.length q
                    && String.sub t 0 (String.length q) = q
            then 1
            else 2
          in
          compare (score a) (score b))
        matched
  in
  let exact =
    List.exists
      (fun it ->
        String.lowercase_ascii it.it_title
        = String.lowercase_ascii (String.trim filter))
      base
  in
  match new_option with
  | Some on_new when String.trim filter <> "" && not exact ->
      base
      @ [ { it_title = String.trim filter
          ; it_tip = ""
          ; it_icon = ""
          ; it_strong = false
          ; it_checked = false
          ; it_new = true
          ; on_choose = (fun () -> on_new (String.trim filter))
          }
        ]
  | _ -> base

(* select view state: filter text + async search results *)
type sel_state =
  { q : string
  ; searched : item list option
  ; selected : int
  }

let key_handlers : (string, string -> bool) Hashtbl.t = Hashtbl.create 8
let select_sequence = ref 0

let handle_keydown (ev : Ui_services.ev) =
  match ev.target, ev.key with
  | Some target, Some key when not ev.composing && not ev.meta && not ev.alt ->
      (match target.Ui_services.closest ".ls-property-select" with
       | Some root ->
           (match Hashtbl.find_opt key_handlers (root.Ui_services.id ()) with
            | Some handle ->
                let key =
                  if ev.ctrl && key = "n" then "ArrowDown"
                  else if ev.ctrl && key = "p" then "ArrowUp"
                  else key
                in
                if handle key then (
                  ev.prevent_default ();
                  ev.stop_propagation ();
                  true)
                else false
            | None -> false)
       | None -> false)
  | _ -> false

(* Builds the select as a [t]: text_field over a scrollable list of
   menu_items. Mounted inside the property dialog card or an anchored
   dropdown_menu. *)
let view ~placeholder ?(compact = false) ?new_option ?(on_enter_text = None)
    ?(on_search = None) items : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let st = Signal.state sched { q = ""; searched = None; selected = 0 } in
  let model = Signal.value st in
  let visible () =
    let s = Runtime.signal_get st in
    visible_items ~items ~filter:s.q ~searched:s.searched ~new_option
  in
  let pick () =
    let vis = visible () in
    if vis = [] then (
      match on_enter_text, String.trim (Runtime.signal_get st).q with
      | Some f, t when t <> "" -> f t
      | _ -> ())
    else
      match List.nth_opt vis (Runtime.signal_get st).selected with
      | Some it -> it.on_choose ()
      | None -> ()
  in
  incr select_sequence;
  let select_id = "property-select-" ^ string_of_int !select_sequence in
  Hashtbl.add key_handlers select_id (fun key ->
      match key with
      | "ArrowDown" | "ArrowUp" ->
          let count = List.length (visible ()) in
          if count > 0 then (
            let s = Runtime.signal_get st in
            let delta = if key = "ArrowDown" then 1 else count - 1 in
            Runtime.signal_set st { s with selected = (s.selected + delta) mod count });
          true
      | "Enter" -> pick (); true
      | _ -> false);
  Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
      Hashtbl.remove key_handlers select_id);
  let list_view =
    reactive ~equal:(fun a b -> a.q = b.q && a.searched == b.searched)
      (fun s ->
         let vis =
           visible_items ~items ~filter:s.q ~searched:s.searched
             ~new_option
         in
         (* a native List can't size itself inside a content-sized
            sheet — it needs an explicit height, 0 when empty so the
            sheet still shrinks like web. Keep the node mounted across
            filter edits (height prop, not mount churn) and give rows
            stable keys: a drop+recreate per keystroke leaves taps
            hitting a dead node. The empty-query state shows the same
            "No matched result" note as the shui select *)
         column ~gap:0 ~padding_vertical:(if compact then 4 else 0)
           ((if vis = [] && String.trim s.q <> "" then
               [ text ~key:"select-empty"
                   ~value:(I18n.t "search/no-result")
                   [] ]
             else [])
            @ [ list ~height:(if vis = [] then 0 else if compact then min 280 (32 * List.length vis) else 280)
                ~scroll_target:(reactive (fun s ->
                    match List.nth_opt vis s.selected with
                    | Some it -> if it.it_new then "__new__" else it.it_title
                    | None -> "") model)
               (List.mapi
              (fun index it ->
                 let title = if it.it_new then I18n.t1 "select/new-option" it.it_title else it.it_title in
                 let on_press _ = it.on_choose () in
                 Ui_parts.class_signal model
                   (fun s -> if s.selected = index then "menu-link chosen" else "menu-link")
                   (if compact then
                   list_item ~key:(if it.it_new then "__new__" else it.it_title)
                     ~height:32 ~padding_horizontal:8 ~padding_vertical:4
                     ~corner_radius:4
                     ~selected:(reactive (fun s -> s.selected = index) model) ~on_press
                     [ row ~gap:4 ~cross:`center ~grow:1.0
                         ((if it.it_icon = "" then [] else [ Icons.icon ~size:(if it.it_icon = "x" then 14. else 18.) it.it_icon ])
                          @ [ text ~value:title ~grow:1.0 [] ]
                          @ if it.it_checked then [ icon ~name:(`app "check") ~point_size:14 [] ] else []) ]
                 else
                   list_item
                     ~key:(if it.it_new then "__new__" else it.it_title)
                     ~text:title
                     ~selected:(reactive (fun s -> s.selected = index) model)
                     ?icon:(if it.it_icon = "" then None else Some (Icons.name_ref it.it_icon))
                     ~on_press []))
              vis) ]))
      model
  in
  (column ~gap:(if compact then 0 else 2)
     ~accessibility_identifier:select_id
     ~style_class:(if compact then "ls-property-select ls-property-select-compact" else "ls-property-select")
     [ text_field ~placeholder ~autofocus:true
         ?height:(if compact then Some 32 else None)
         ?padding:(if compact then Some 6 else None)
         ?style_class:(if compact then Some "ls-property-select-input" else None)
         ~on_input:(fun ev ->
           match ev with
           | Lui_protocol.TextChanged (_, q) ->
               (match on_search with
                | Some search ->
                    (* update the filter synchronously so the client-side
                       new-option row shows even while the async search is
                       in flight (or rejects) *)
                    Runtime.signal_set st { q; searched = None; selected = 0 };
                    ignore
                      (let* found = search q in
                       (* stale guard — a later keystroke owns the list *)
                       if (Runtime.signal_get st).q = q then
                         Runtime.signal_set st
                           { q; searched = Some found; selected = 0 };
                       Js.Promise.resolve ())
                | None -> Runtime.signal_set st { q; searched = None; selected = 0 })
           | _ -> ())
         ~on_submit:(fun _ -> pick ())
         []
     ; list_view
     ])
    context parent
