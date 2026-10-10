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
   compatibility but ignored — role/tabindex are carried by the kind.
   [icon] fills the kind's leading icon slot; only use [before] for
   content that is not an icon (extra slots shift the label) *)
let el ?(cls = base_cls) ?(attrs = item_attrs) ~key ?(before = [])
    ?(after = []) ?(data_attrs = []) ?icon ~label ~on_click () =
  ignore attrs;
  menu_item ~key ~style_class:cls ~data_attrs ~text:label ?icon
    ~on_press:(fun _ -> on_click ())
    (before @ after)

(* retained-tree separator *)
let separator ~key =
  separator ~key ~style_class:separator_cls []

(* dots ghost-icon + anchored dropdown_menu — the cljs shui
   dropdown-menu pairing used by the graphs rows and the collaborators
   member rows. [items] = (extra class, label, disabled, on_click); the
   dropdown anchors below the button (its previous sibling in the row). *)
let dots_menu ~key ?(menu_cls = "") items : t =
 fun ctx parent ->
  let open_ = Signal.state ctx.Lui_ui.ui_scheduler false in
  let close () = Runtime.signal_set open_ false in
  let item i (cls, label, disabled, on_click) =
    menu_item ~key:(Printf.sprintf "%s-mi-%d" key i)
      ?style_class:(if cls = "" then None else Some cls)
      ~text:label ~disabled
      ~on_press:(fun _ ->
        close ();
        on_click ())
      []
  in
  row ~key
    [ button ~key:(key ^ "-btn") ~variant:`ghost ~size:`icon
        ~icon:(Icons.name_ref "dots")
        ~style_class:"graph-action-btn"
        ~label:(I18n.t "ui/more-actions")
        ~data_attrs:(reactive (fun expanded ->
            [ ("aria-haspopup", "menu")
            ; ("aria-expanded", string_of_bool expanded) ]) (Signal.value open_))
        ~on_press:(fun _ -> Runtime.signal_set open_ (not (Runtime.signal_get open_)))
        []
    ; if_ ~test:(Signal.value open_)
        (Ui_components.menu_card ~key:(key ^ "-dm") ~cls:menu_cls
           ~anchor:`below ~anchor_alignment:`end_
           ~on_dismiss:(fun _ -> close ())
           (List.mapi item items))
    ]
    ctx parent
