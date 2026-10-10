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

(* retained-tree separator — the old lui-core rule carried height:1px,
   margin:0.25rem -0.25rem, background:hsl(var(--muted)); ls-property-
   dropdown menus override margins to 0.5rem 0 via ~mv:~mh *)
let separator ?(mv = 4) ?(mh = -4) ~key =
  separator ~key ~style_class:separator_cls ~height:1
    ~margin_vertical:mv ~margin_horizontal:mh
    ~background:"hsl(var(--muted))" []

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

(* `.menu-link` chrome for the imperative <a> anchors the e2e contract
   requires (extension nodes admit no typed props — the inline style
   attr is their only paint channel). [chosen_signal] toggles the
   .chosen class (e2e + gpui reg); [chosen_bg] additionally paints the
   selected background inline — pass it only where no theme-scoped
   .chosen CSS rule is kept (autocomplete rows). [plain_bg] neutralizes
   the inherited .menu-link:hover background (cp__select rows paint
   selection through the class rules instead). *)
let menu_link_base_style =
  "color:hsl(var(--popover-foreground) / 0.75);user-select:none;\
   font-size:0.875rem;line-height:1.25rem;padding:0.375rem 0.5rem;\
   display:flex;justify-content:space-between;border-radius:0.25rem"

let ac_chosen_bg =
  "var(--lx-gray-04, var(--ls-menu-hover-color, hsl(var(--secondary))))"

let menu_link ~key ~id ~on_click ?(transition = true) ?(plain_bg = false)
    ?(chosen = false) ?chosen_bg ?chosen_signal children : t =
  let style_of c =
    menu_link_base_style
    ^ (if transition then ";transition:opacity 0.15s" else
       ";transition:none")
    ^ (if plain_bg then ";background:none" else "")
    ^
    (match chosen_bg with
     | Some bg when c -> ";background:" ^ bg
     | _ -> "")
  in
  Logseq_el.el ~key ~tag:"a" ~id
    ~style_class:
      (match chosen_signal with
       | Some _ -> ""
       | None -> "menu-link" ^ if chosen then " chosen" else "")
    ?style_class_signal:
      (Option.map
         (fun s ->
            Logseq_el.class_signal s (fun c ->
                "menu-link" ^ if c then " chosen" else ""))
         chosen_signal)
    ~attrs:
      (match chosen_signal with
       | Some _ -> []
       | None -> [ ("tabindex", "0"); ("style", style_of chosen) ])
    ?attrs_signal_v:
      (Option.map
         (fun s ->
            Logseq_el.attrs_signal s (fun c ->
                [ ("tabindex", "0"); ("style", style_of c) ]))
         chosen_signal)
    ~events:"click"
    ~on_dom_event:(fun name _payload ->
      if name = "click" then on_click ())
    children

