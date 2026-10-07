(* .cp__select widget — the autocomplete select used by the property
   picker, type picker, class picker and value pickers, rendered as
   cross-platform LUI components: a text field over a scrollable menu
   item list (same input-on-top / results-below structure as web
   master's .cp__select).

   Keyboard: Enter picks the current first match (native backends give
   menu items their own arrow navigation); Escape bubbles to the global
   property keydown handler which dismisses the owning popup. *)

open Promise_ext
open Lui_elements

type item =
  { it_title : string
  ; it_tip : string (* ident / sublabel *)
  ; it_icon : string (* tabler icon before the title, "" = none *)
  ; it_new : bool (* renders via the "New option:" affordance *)
  ; it_strong : bool (* title leaf is <strong> (cljs property select) *)
  ; on_choose : unit -> unit
  }

let item ?(tip = "") ?(icon = "") ?(strong = false) title on_choose =
  { it_title = title; it_tip = tip; it_icon = icon; it_new = false
  ; it_strong = strong; on_choose
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
          ; it_new = true
          ; on_choose = (fun () -> on_new (String.trim filter))
          }
        ]
  | _ -> base

(* select view state: filter text + async search results *)
type sel_state =
  { q : string
  ; searched : item list option
  }

(* ---------- imperative widget (query_builder caller) ---------- *)

(* The query-builder filter pickers still mount this widget inside an
   imperative anchored popover — keep the el-based builder until that
   surface is itself ported to LUI components. *)
open Web_dom

type select_config =
  { cfg_placeholder : string
  ; cfg_items : item list
  ; mutable filter : string
  ; mutable chosen : int
  ; new_option : (string -> unit) option
  ; on_escape : unit -> unit
  ; on_enter_text : (string -> unit) option
  ; on_search_cfg : (string -> item list Js.Promise.t) option
  ; mutable searched : item list option
  ; mutable results_inner : Web_dom.el option
  ; mutable results_py : Web_dom.el option
  }

let cfg_visible cfg =
  visible_items ~items:cfg.cfg_items ~filter:cfg.filter
    ~searched:
      (match cfg.on_search_cfg, cfg.searched with
       | Some _, Some found -> Some found
       | _ -> None)
    ~new_option:cfg.new_option

let repaint_chosen cfg =
  match cfg.results_inner with
  | None -> ()
  | Some inner ->
      let links = el_query_all inner "a.menu-link" in
      for i = 0 to nl_length links - 1 do
        match nl_item links i with
        | Some el ->
            el_set_class el
              ("menu-link"
              ^ (if i = cfg.chosen then " chosen" else ""))
        | None -> ()
      done

let item_el idx cfg it =
  let wrap = mk ~cls:"menu-link-wrap" "div" in
  let a =
    mk "a"
      ~cls:
        ("menu-link"
        ^ (if idx = cfg.chosen then " chosen" else ""))
      ~attrs:
        [ ("id", "ac-" ^ string_of_int idx); ("tabindex", "0") ]
  in
  let inner1 = mk ~cls:"menu-item-label" "span" in
  let inner2 =
    mk ~cls:("select-item-row"
             ^ (if idx = cfg.chosen then " chosen" else "")) "div"
  in
  let inner3 = mk ~cls:"select-item-left" "div" in
  let label_span =
    mk ~cls:"select-item-left" "span"
      ~attrs:(if it.it_tip = "" then [] else [ ("title", ":" ^ it.it_tip) ])
  in
  let strong =
    mk ~cls:"ls-normal" (if it.it_strong then "strong" else "span")
  in
  el_set_text_content strong
    (if it.it_new then I18n.t1 "select/new-option" it.it_title
     else it.it_title);
  if it.it_icon <> "" then (
    let ic = mk ~cls:"ls-pt" "span" in
    el_append_child ic (icon ~cls:"ls-icon-dim" it.it_icon);
    el_append_child label_span ic);
  el_append_child label_span strong;
  el_append_child inner3 label_span;
  el_append_child inner2 inner3;
  el_append_child inner1 inner2;
  el_append_child a inner1;
  el_append_child wrap a;
  on_click a (fun _ -> it.on_choose ());
  el_listen a "mousemove"
    (fun _ -> cfg.chosen <- idx; repaint_chosen cfg)
    false;
  wrap

let rebuild_results cfg results_inner =
  cfg.results_inner <- Some results_inner;
  el_replace_children results_inner;
  let vis = cfg_visible cfg in
  if cfg.chosen >= List.length vis then cfg.chosen <- 0;
  List.iteri
    (fun i it -> el_append_child results_inner (item_el i cfg it))
    vis;
  match cfg.results_py with
  | Some py -> el_set_class py (if vis = [] then "" else "ls-py")
  | None -> ()

let pick_cfg cfg =
  let vis = cfg_visible cfg in
  if vis = [] then (
    match cfg.on_enter_text, String.trim cfg.filter with
    | Some f, t when t <> "" -> f t
    | _ -> ())
  else
    match List.nth_opt vis cfg.chosen with
    | Some it -> it.on_choose ()
    | None -> ()

let move cfg delta =
  let n = List.length (cfg_visible cfg) in
  if n = 0 then ()
  else (
    cfg.chosen <- (cfg.chosen + delta + n) mod n;
    repaint_chosen cfg)

let create ~placeholder ?(new_option = None) ?(on_escape = fun () -> ())
    ?(on_enter_text = None) ?(on_search = None) items =
  let cfg =
    { cfg_placeholder = placeholder
    ; cfg_items = items
    ; filter = ""
    ; chosen = 0
    ; new_option
    ; on_escape
    ; on_enter_text
    ; on_search_cfg = on_search
    ; searched = None
    ; results_inner = None
    ; results_py = None
    }
  in
  let root = mk ~cls:"cp__select cp__select-main" "div" in
  let input_wrap = mk ~cls:"input-wrap" "div" in
  let input =
    mk ~cls:"cp__select-input" "input"
      ~attrs:[ ("placeholder", placeholder) ]
  in
  el_set_attr input "type" "text";
  el_append_child input_wrap input;
  let py = mk ~cls:"ls-py" "div" in
  let results_wrap = mk ~cls:"item-results-wrap" "div" in
  let results =
    mk ~cls:"cp__select-results" "div" ~attrs:[ ("id", "ui__ac") ]
  in
  let results_inner =
    mk ~cls:"hide-scrollbar" "div" ~attrs:[ ("id", "ui__ac-inner") ]
  in
  el_append_child results results_inner;
  el_append_child results_wrap results;
  el_append_child py results_wrap;
  el_append_child root input_wrap;
  el_append_child root py;
  cfg.results_py <- Some py;
  el_listen input "input"
    (fun _ ->
      cfg.filter <- el_value input;
      cfg.chosen <- 0;
      (match cfg.on_search_cfg with
       | Some search ->
           let q = cfg.filter in
           (let* found = search q in
           if cfg.filter = q then (
             cfg.searched <- Some found;
             rebuild_results cfg results_inner);
           Js.Promise.resolve ())
           |> ignore
       | None -> ());
      rebuild_results cfg results_inner)
    true;
  el_listen input "keydown"
    (fun ev ->
      match ev_key ev with
      | "ArrowDown" -> ev_prevent_default ev; move cfg 1
      | "ArrowUp" -> ev_prevent_default ev; move cfg (-1)
      | "Enter" -> ev_prevent_default ev; pick_cfg cfg
      | "Escape" -> ev_prevent_default ev; cfg.on_escape ()
      | _ -> ())
    true;
  rebuild_results cfg results_inner;
  (root, input)

(* Builds the select as a [t]: text_field over a scrollable list of
   menu_items. Mounted inside the property dialog card or an anchored
   dropdown_menu. *)
let view ~placeholder ?new_option ?(on_enter_text = None)
    ?(on_search = None) items : t =
 fun context parent ->
  let sched = context.Lui_ui.ui_scheduler in
  let st = Signal.state sched { q = ""; searched = None } in
  let visible () =
    let s = Signal.get_state st in
    visible_items ~items ~filter:s.q ~searched:s.searched ~new_option
  in
  let pick () =
    let vis = visible () in
    if vis = [] then (
      match on_enter_text, String.trim (Signal.get_state st).q with
      | Some f, t when t <> "" -> f t
      | _ -> ())
    else
      match vis with
      | first :: _ -> first.on_choose ()
      | [] -> ()
  in
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
         column ~gap:0
           ((if vis = [] && String.trim s.q <> "" then
               [ text ~key:"select-empty"
                   ~value:(I18n.t "search/no-result")
                   ~style_class:"ls-select-empty" [] ]
             else [])
            @ [ list ~height:(if vis = [] then 0 else 280)
               (List.map
              (fun it ->
                 list_item
                   ~key:(if it.it_new then "__new__" else it.it_title)
                   ~text:
                     (if it.it_new then
                        I18n.t1 "select/new-option" it.it_title
                      else it.it_title)
                   ?icon:
                     (match it.it_icon with
                      | "" -> None
                      | n -> Some (Icons.name_ref n))
                   ~on_press:(fun _ -> it.on_choose ())
                   [])
              vis) ]))
      (Signal.value st)
  in
  (column ~gap:2
     [ text_field ~placeholder ~autofocus:true
         ~on_input:(fun ev ->
           match ev with
           | Lui_protocol.TextChanged (_, q) ->
               (match on_search with
                | Some search ->
                    (* update the filter synchronously so the client-side
                       new-option row shows even while the async search is
                       in flight (or rejects) *)
                    Runtime.signal_set st { q; searched = None };
                    ignore
                      (let* found = search q in
                       (* stale guard — a later keystroke owns the list *)
                       if (Signal.get_state st).q = q then
                         Runtime.signal_set st
                           { q; searched = Some found };
                       Js.Promise.resolve ())
                | None -> Runtime.signal_set st { q; searched = None })
           | _ -> ())
         ~on_submit:(fun _ -> pick ())
         []
     ; list_view
     ])
    context parent
