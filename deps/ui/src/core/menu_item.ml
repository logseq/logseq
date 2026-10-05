(* Shared ui__dropdown-menu-item markup — the cljs shui dropdown-menu-item
   DOM. The visuals live in lui-overlay.css (styled on the ui__* classes
   and the [role]/[data-*] hooks); the emit side carries only the
   semantic class names. *)

open Lui_elements

let base_cls = "ui__dropdown-menu-item"

(* context-menu variant (same semantics — kept for call-site parity) *)
(* shui item suffix shared across the views popup's menu-item /
   checkbox-item / sub-trigger bases *)
let views_item_cls base = base

(* graphs dropdown items *)
let graphs_cls = base_cls

let separator_cls = "ui__dropdown-menu-separator"

(* imperative callers (properties_menu, code_mirror) still emit these on
   their own divs *)
let item_attrs = [ ("role", "menuitem"); ("tabindex", "-1") ]

(* retained-tree item: the menu_item kind renders a role=option button
   with icon/label/check spans; [attrs] is accepted for call-site
   compatibility but ignored — role/tabindex are carried by the kind *)
let el ?(cls = base_cls) ?(attrs = item_attrs) ~key ?(before = [])
    ?(after = []) ~label ~on_click () =
  ignore attrs;
  menu_item ~key ~style_class:cls ~text:label
    ~on_press:(fun _ -> on_click ())
    (before @ after)

(* retained-tree separator *)
let separator ~key =
  separator ~key ~style_class:separator_cls []
