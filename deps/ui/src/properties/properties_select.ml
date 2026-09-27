(* .cp__select widget — the autocomplete select used by the property
   picker, type picker, class picker and value pickers. DOM contract:

     .cp__select.cp__select-main
       .input-wrap > input.cp__select-input.w-full[placeholder]
       .item-results-wrap
         #ui__ac.cp__select-results
           #ui__ac-inner.hide-scrollbar
             .menu-link-wrap
               a.flex.justify-between.menu-link#ac-N[tabindex=0][.chosen]
                 span.flex-1 > item content

   Keyboard: ArrowDown/Up move .chosen, Enter picks .chosen. A
   "New option:" pseudo-item is appended while the input is non-empty
   and doesn't exactly match an item. *)

open Editor_dom
open Properties_dom
module I18n = Properties_i18n

type item =
  { it_title : string
  ; it_tip : string (* ident / sublabel, rendered as title attr *)
  ; it_new : bool (* renders via the "New option:" affordance *)
  ; on_choose : unit -> unit
  }

type select_config =
  { placeholder : string
  ; items : item list
  ; mutable filter : string
  ; mutable chosen : int
  ; new_option : (string -> unit) option (* on_new text *)
  ; on_escape : unit -> unit
  ; on_enter_text : (string -> unit) option (* Enter with no items *)
  ; mutable results_inner : Editor_dom.el option
  }

let item ?(tip = "") title on_choose =
  { it_title = title; it_tip = tip; it_new = false; on_choose }

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

let visible_items cfg =
  let base = List.filter (matches cfg.filter) cfg.items in
  let exact =
    List.exists
      (fun it ->
        String.lowercase_ascii it.it_title
        = String.lowercase_ascii (String.trim cfg.filter))
      cfg.items
  in
  match cfg.new_option with
  | Some on_new when String.trim cfg.filter <> "" && not exact ->
      base
      @ [ { it_title = String.trim cfg.filter
          ; it_tip = ""
          ; it_new = true
          ; on_choose = (fun () -> on_new (String.trim cfg.filter))
          }
        ]
  | _ -> base

(* repaint .chosen without rebuilding (hover) *)
let repaint_chosen cfg =
  match cfg.results_inner with
  | None -> ()
  | Some inner ->
      let links = el_query_all inner "a.menu-link" in
      for i = 0 to node_list_length links - 1 do
        match node_list_item links i with
        | Some el ->
            el_set_class el
              ("flex justify-between menu-link"
              ^ (if i = cfg.chosen then " chosen" else ""))
        | None -> ()
      done

let item_el idx cfg it =
  let wrap = mk ~cls:"menu-link-wrap" "div" in
  let a =
    mk "a"
      ~cls:
        ("flex justify-between menu-link"
        ^ (if idx = cfg.chosen then " chosen" else ""))
      ~attrs:
        [ ("id", "ac-" ^ string_of_int idx); ("tabindex", "0") ]
  in
  let inner = mk ~cls:"flex-1" "span" in
  let lab =
    mk "span" ~cls:"flex gap-1 items-center" ~attrs:[ ("title", it.it_tip) ]
  in
  let strong = mk ~cls:"font-normal" "strong" in
  el_set_text strong
    (if it.it_new then I18n.t "select/new-option" ^ " " ^ it.it_title
     else it.it_title);
  el_append_child lab strong;
  el_append_child inner lab;
  el_append_child a inner;
  el_append_child wrap a;
  on_click a (fun _ -> it.on_choose ());
  el_listen a "mousemove"
    (fun _ -> cfg.chosen <- idx; repaint_chosen cfg)
    false;
  wrap

let rebuild_results cfg results_inner =
  cfg.results_inner <- Some results_inner;
  el_clear results_inner;
  let vis = visible_items cfg in
  if cfg.chosen >= List.length vis then cfg.chosen <- 0;
  List.iteri
    (fun i it -> el_append_child results_inner (item_el i cfg it))
    vis

let pick cfg =
  let vis = visible_items cfg in
  if vis = [] then (
    match cfg.on_enter_text, String.trim cfg.filter with
    | Some f, t when t <> "" -> f t
    | _ -> ())
  else
    match List.nth_opt vis cfg.chosen with
    | Some it -> it.on_choose ()
    | None -> ()

let move cfg results_inner delta =
  let n = List.length (visible_items cfg) in
  if n = 0 then ()
  else (
    cfg.chosen <- (cfg.chosen + delta + n) mod n;
    repaint_chosen cfg;
    ignore results_inner)

(* Creates the select element. Returns (root, input) so the caller can
   mount the root as an overlay/inline element and el_focus the input. *)
let create ~placeholder ?(new_option = None) ?(on_escape = fun () -> ())
    ?(on_enter_text = None) items =
  let cfg =
    { placeholder
    ; items
    ; filter = ""
    ; chosen = 0
    ; new_option
    ; on_escape
    ; on_enter_text
    ; results_inner = None
    }
  in
  let root = mk ~cls:"cp__select cp__select-main" "div" in
  let input_wrap = mk ~cls:"input-wrap" "div" in
  let input =
    mk ~cls:"cp__select-input w-full" "input"
      ~attrs:[ ("placeholder", placeholder) ]
  in
  el_set_attr input "type" "text";
  el_append_child input_wrap input;
  let results_wrap = mk ~cls:"item-results-wrap" "div" in
  let results =
    mk ~cls:"cp__select-results" "div" ~attrs:[ ("id", "ui__ac") ]
  in
  let results_inner =
    mk ~cls:"hide-scrollbar" "div" ~attrs:[ ("id", "ui__ac-inner") ]
  in
  el_append_child results results_inner;
  el_append_child results_wrap results;
  el_append_child root input_wrap;
  el_append_child root results_wrap;
  el_listen input "input"
    (fun _ ->
      cfg.filter <- el_value input;
      cfg.chosen <- 0;
      rebuild_results cfg results_inner)
    true;
  el_listen input "keydown"
    (fun ev ->
      match ev_key ev with
      | "ArrowDown" -> prevent_default ev; move cfg results_inner 1
      | "ArrowUp" -> prevent_default ev; move cfg results_inner (-1)
      | "Enter" -> prevent_default ev; pick cfg
      | "Escape" -> prevent_default ev; cfg.on_escape ()
      | _ -> ())
    true;
  rebuild_results cfg results_inner;
  (root, input)
