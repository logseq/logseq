(* Shared ui__dropdown-menu-item markup — the cljs shui dropdown-menu-item
   DOM. Class/attr strings must stay byte-identical to the cljs output
   (the e2e contract queries [role=menuitem] and its exact classes). *)

let base_cls =
  "ui__dropdown-menu-item relative flex cursor-pointer select-none \
   items-center rounded-sm px-2 py-1.5 text-sm outline-none"

(* context-menu variant adds data-state styling *)
let cm_cls =
  base_cls
  ^ " data-[disabled]:opacity-50 data-[disabled]:pointer-events-none \
     data-[highlighted]:bg-muted"

(* shui item suffix shared across the views popup's menu-item /
   checkbox-item / sub-trigger bases *)
let views_item_cls base =
  base
  ^ " relative flex cursor-pointer select-none items-center rounded-sm \
     px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted \
     data-[disabled]:pointer-events-none data-[disabled]:opacity-50"

(* graphs dropdown uses the cljs shui order (cursor-pointer last) *)
let graphs_cls =
  "ui__dropdown-menu-item relative flex select-none items-center \
   rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer "

let separator_cls = "ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted"

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
