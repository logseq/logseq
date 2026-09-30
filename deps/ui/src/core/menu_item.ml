(* Shared ui__dropdown-menu-item markup — the cljs shui dropdown-menu-item
   DOM. The visuals live in lui-overlay.css (styled on the ui__* classes
   and the [role]/[data-*] hooks); the emit side carries only the
   semantic class names. *)

let base_cls = "ui__dropdown-menu-item"

(* context-menu variant (same semantics — kept for call-site parity) *)
let cm_cls = base_cls

(* shui item suffix shared across the views popup's menu-item /
   checkbox-item / sub-trigger bases *)
let views_item_cls base = base

(* graphs dropdown items *)
let graphs_cls = base_cls

let separator_cls = "ui__dropdown-menu-separator"

let item_attrs = [ ("role", "menuitem"); ("tabindex", "-1") ]

(* retained-tree item: click handler + label in an inner div
   (e2e queries [role=menuitem] > div:text) *)
let el ?(cls = base_cls) ?(attrs = item_attrs) ~key ?(before = [])
    ?(after = []) ~label ~on_click () =
  Logseq_dom.dom ~key ~style_class:cls ~attrs ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then on_click ())
    (before
    @ [ Logseq_dom.dom ~key:(key ^ "-l") ~text:label [] ]
    @ after)

(* retained-tree item with the label as direct text (delegated-handler
   surfaces like the block context menu) *)
let text_el ?(cls = base_cls) ~key ~attrs ~label ?(children = []) () =
  Logseq_dom.dom ~key ~style_class:cls ~attrs ~text:label children

let separator ~key =
  Logseq_dom.dom ~key ~attrs:[ ("role", "separator") ]
    ~style_class:separator_cls []
