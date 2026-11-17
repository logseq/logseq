(* LUI virtualized list — a flat [data] array rendered as absolutely
   positioned rows inside a total-height spacer, driven by a
   @tanstack/virtual-core Virtualizer bound to an outer scroll element
   ([scroll_parent_id], the app scroll container by default).

   The DOM is emitted through the logseq-virt extension
   (Logseq_virt): .ls-virt-list container > .ls-virt-spacer >
   .ls-virt-row[data-index]. All virtualizer machinery — the attach,
   MutationObserver measurement, scroll_to_* registry, and the row
   visibility contract — lives in Logseq_virt; this module only
   assembles the LUI nodes. *)

open Lui_protocol
open Lui_elements

module D = Logseq_el
module P = Outliner_projection

let keyed = Lui_elements.keyed

type section_measurements =
  { spacing_for : string -> float Signal.signal
  ; on_row_measure : string -> string -> string -> float -> unit
  ; on_width_change : float -> unit
  ; observe_eager : Lui_ui.ui_context -> root_id:string -> unit
  }

let section_spacings ctx ~minimum ~(rows : P.row list Signal.signal) =
  let epsilon = 0.25 in
  let row_info : (string, string * string) Hashtbl.t = Hashtbl.create 256 in
  let extents : (string, float) Hashtbl.t = Hashtbl.create 256 in
  let measured_rows : (string, unit) Hashtbl.t = Hashtbl.create 256 in
  let totals : (string, float) Hashtbl.t = Hashtbl.create 32 in
  let sections : (string, unit) Hashtbl.t = Hashtbl.create 32 in
  let measured_sections : (string, unit) Hashtbl.t = Hashtbl.create 32 in
  let spacing_states : (string, float Signal.state) Hashtbl.t = Hashtbl.create 32 in
  let pending : (string, unit) Hashtbl.t = Hashtbl.create 16 in
  let rows_now = ref [] in
  let width = ref None in
  let timer = ref (-1) in
  let spacing_state section =
    match Hashtbl.find_opt spacing_states section with
    | Some state -> state
    | None ->
        let state = Signal.state ctx.Lui_ui.ui_scheduler 0. in
        ignore (Signal.own_signal ctx.Lui_ui.ui_scope (Signal.value state));
        Hashtbl.replace spacing_states section state;
        state
  in
  let set_spacing section =
    if not (Hashtbl.mem sections section) then false
    else
      let next =
        if Hashtbl.mem measured_sections section then
          Float.max 0.
            (minimum
             -. Option.value (Hashtbl.find_opt totals section) ~default:0.)
        else 0.
      in
      match Hashtbl.find_opt spacing_states section with
      | Some state when
          Float.abs (Signal.get (Signal.value state) -. next) > epsilon ->
          Signal.set state next;
          true
      | Some _ -> false
      | None when next > epsilon ->
          let state = spacing_state section in
          Signal.set state next;
          true
      | None -> false
  in
  let flush_spacings changed_sections =
    let changed =
      List.fold_left (fun changed section -> set_spacing section || changed)
        false changed_sections
    in
    if changed then Logseq_virt.flush_now ()
  in
  let schedule_spacing section =
    Hashtbl.replace pending section ();
    if !timer < 0 then
      timer := Logseq_virt.set_timeout_id
        (fun () ->
          timer := -1;
          let changed = Hashtbl.fold (fun key () acc -> key :: acc) pending [] in
          Hashtbl.reset pending;
          flush_spacings changed)
        0
  in
  let identity = function
    | P.Header section ->
        P.key (P.Header section), P.key (P.Header section), "header"
    | P.Footer section ->
        P.key (P.Footer section), P.key (P.Header section), "footer"
    | P.Block row ->
        P.key (P.Block row), P.key (P.Header row.section), "block"
  in
  let rebuild current =
    rows_now := current;
    let next_info : (string, string * string) Hashtbl.t = Hashtbl.create 256 in
    let next_totals : (string, float) Hashtbl.t = Hashtbl.create 32 in
    let next_sections : (string, unit) Hashtbl.t = Hashtbl.create 32 in
    let next_measured_sections : (string, unit) Hashtbl.t =
      Hashtbl.create 32
    in
    let present : (string, unit) Hashtbl.t = Hashtbl.create 256 in
    List.iter
      (fun row ->
        let key, section, kind = identity row in
        Hashtbl.replace next_info key (section, kind);
        Hashtbl.replace present key ();
        Hashtbl.replace next_sections section ();
        if Hashtbl.mem measured_rows key then
          Hashtbl.replace next_measured_sections section ();
        let extent = Option.value (Hashtbl.find_opt extents key) ~default:32. in
        Hashtbl.replace next_totals section
          (Option.value (Hashtbl.find_opt next_totals section) ~default:0. +. extent))
      current;
    let removed =
      Hashtbl.fold
        (fun key _ removed -> if Hashtbl.mem present key then removed else key :: removed)
        extents []
    in
    List.iter (Hashtbl.remove extents) removed;
    List.iter (Hashtbl.remove measured_rows) removed;
    Hashtbl.reset row_info;
    Hashtbl.iter (Hashtbl.replace row_info) next_info;
    Hashtbl.reset totals;
    Hashtbl.iter (Hashtbl.replace totals) next_totals;
    Hashtbl.reset sections;
    Hashtbl.iter (Hashtbl.replace sections) next_sections;
    Hashtbl.reset measured_sections;
    Hashtbl.iter (Hashtbl.replace measured_sections) next_measured_sections;
    let removed_sections =
      Hashtbl.fold
        (fun key _ removed ->
          if Hashtbl.mem sections key then removed else key :: removed)
        spacing_states []
    in
    List.iter (Hashtbl.remove spacing_states) removed_sections;
    flush_spacings (Hashtbl.fold (fun section () acc -> section :: acc) sections [])
  in
  let on_row_measure key section kind extent =
    match Hashtbl.find_opt row_info key with
    | Some (current_section, current_kind)
      when current_section = section && current_kind = kind
           && Float.is_finite extent && extent > epsilon ->
        let previous = Option.value (Hashtbl.find_opt extents key) ~default:32. in
        let first_section_measurement =
          not (Hashtbl.mem measured_sections section)
        in
        let extent_changed = Float.abs (previous -. extent) > epsilon in
        Hashtbl.replace extents key extent;
        Hashtbl.replace measured_rows key ();
        if extent_changed then
          Hashtbl.replace totals section
            (Option.value (Hashtbl.find_opt totals section) ~default:0.
             +. extent -. previous);
        Hashtbl.replace measured_sections section ();
        if first_section_measurement || extent_changed then
          schedule_spacing section
    | _ -> ()
  in
  let on_width_change next =
    match !width with
    | None -> width := Some next
    | Some previous when Float.abs (previous -. next) > 0.5 ->
        width := Some next;
        Hashtbl.clear extents;
        Hashtbl.clear measured_rows;
        Hashtbl.clear measured_sections;
        Hashtbl.clear pending;
        rebuild !rows_now
    | Some _ -> ()
  in
  let row_subscription =
    Signal.subscribe ~emit_initial:true rows rebuild
  in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    if !timer >= 0 then Logseq_virt.clear_timeout !timer;
    Signal.dispose_subscription row_subscription;
    Hashtbl.clear extents;
    Hashtbl.clear measured_rows;
    Hashtbl.clear row_info;
    Hashtbl.clear totals;
    Hashtbl.clear sections;
    Hashtbl.clear measured_sections;
    Hashtbl.clear spacing_states;
    Hashtbl.clear pending);
  let spacing_for section =
    if Hashtbl.mem sections section then Signal.value (spacing_state section)
    else Signal.constant ctx.Lui_ui.ui_scheduler 0.
  in
  let observe_eager ctx ~root_id =
    Logseq_virt.observe_projection_rows ctx ~root_id
      ~on_measure:on_row_measure ~on_width_change
  in
  { spacing_for; on_row_measure; on_width_change; observe_eager }

(* cljs gating (block.cljs use-virtual-list-opts): ?virtualized=true
   forces windowing; otherwise the standalone page outliner
   window-renders only when it has >=64 top-level rows. rtc-test mode
   disables both unless the flag is set. *)
let enabled_min ~virtualize ~min count =
  let force = Logseq_virt.force_virtualized () in
  (* force amplifies a virtualize:true caller — it must NOT virtualize a
     virtualize:false one (journal items' inner block lists would nest
     scrollers inside the outer journals scroller) *)
  virtualize
  && (force || count >= min)
  && not (Ui_services.env_rtc_test_mode () && not force)

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

(* the keyed reconciler's identity for a row: the item key plus the
   splice-bumped render version, so a changed item remounts its row
   while untouched rows are adopted *)
let row_version_key versions (r : Logseq_virt.vrow) =
  Printf.sprintf "%s|%d" r.v_key
    (Option.value (Hashtbl.find_opt versions r.v_key) ~default:0)

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(initial_rows = -1)
    ?(list_attrs = []) ?(list_class = "ls-virt-list")
    ?(pin_key = fun () -> None) ?(pin_sig = fun () -> None)
    ?(data_sig = fun (_ : Lui_ui.ui_context) -> None)
    ?(on_end = fun () -> ())
    ?(on_projection_measure = fun _ _ _ _ -> ())
    ?(on_projection_width = fun _ -> ())
    ?(same_item = fun (a : 'a) (b : 'a) -> a == b || a = b)
    ~key_of ~render (data : 'a array) : t =
 fun ctx parent ->
  ignore initial_rows;
  let st =
    Signal.state ctx.ui_scheduler
      Logseq_virt.{ v_rows = []; v_total = 0. }
  in
  let margin = ref 0. in
  let list_id = Logseq_virt.fresh_id () in
  let data_sig = data_sig ctx in
  let data = ref data in
  (* bumped per uuid by the items-signal splice when a row's item
     changes — folds into the reload key so only touched rows remount.
     [same_item] decides "same" — callers whose rows repaint internally
     from their own signals (journals' journal_page_sig) pass a key-only
     equality so splices never remount the whole row *)
  let versions : (string, int) Hashtbl.t = Hashtbl.create 16 in
  let vstate_sig = (Signal.value (st)) in
  let height_s =
    Signal.map
      (fun (s : Logseq_virt.vstate) -> FloatValue s.v_total)
      vstate_sig
  in
  let row_mount (row_sig : Logseq_virt.vrow Signal.signal) : t =
    let row = Signal.get row_sig in
    (* the row's data-index attr + absolute translateY style are read by
       the MutationObserver/Virtualizer measure path — both are props on
       the logseq-virt row node *)
    Logseq_virt.row ~key:("vr-" ^ row_version_key versions row)
      ~index_s:
        (Signal.map
           (fun (r : Logseq_virt.vrow) -> IntValue r.v_index)
           row_sig)
      ~offset_s:
        (Signal.map
           (fun (r : Logseq_virt.vrow) ->
             FloatValue (r.v_start -. !margin))
           row_sig)
      [ (if row.v_index < Array.length !data then
           render !data.(row.v_index)
         else box ~key:("vrx-" ^ row.v_key) [])
      ]
  in
  let attach_timer=Logseq_virt.set_timeout_id
    (fun () ->
      Logseq_virt.attach ctx st margin list_id scroll_parent_id data
        versions key_of overscan estimate_size pin_key pin_sig data_sig
        ~on_projection_measure ~on_projection_width same_item on_end)
    0 in
  Signal.on_dispose ctx.ui_scope (fun () -> Logseq_virt.clear_timeout attach_timer);
  Logseq_virt.container ~key:("vl-" ^ list_id) ~id:list_id
    ~style_class:list_class ~data_attrs:list_attrs
    [ Logseq_virt.spacer ~key:("vs-" ^ list_id) ~height_s
        [ keyed
            ~source:(Logseq_el.own ctx (Signal.map (fun s -> s.Logseq_virt.v_rows) vstate_sig))
            ~key:(fun r -> row_version_key versions r)
            ~cmp:String.compare ~mount:row_mount
        ]
    ]
    ctx parent

(* Signal-driven row stream: feeds the items signal into [list]'s
   data_sig splice path so a delta republishes only the touched rows
   instead of remounting the whole list — mirrors the native twin's
   keyed rows_sig. *)
let rows_sig ~key ~cmp ~mount ?(on_end = fun () -> ())
    ?(initial_rows = -1) ?overscan
    ?(on_projection_measure = fun _ _ _ _ -> ())
    ?(on_projection_width = fun _ -> ()) ~estimate_size
    (source : 'a list Signal.signal) : t =
 fun ctx parent ->
  ignore initial_rows;
  if Ui_services.env_rtc_test_mode () && not (Logseq_virt.force_virtualized ()) then
    keyed ~source ~key ~cmp ~mount ctx parent
  else
  let module Items = Map.Make (struct
    type t = string
    let compare = cmp
  end) in
  let items = Logseq_el.own ctx (Signal.map
      (List.fold_left (fun items item -> Items.add (key item) item items) Items.empty)
      source) in
  let render initial : t = fun row_ctx row_parent ->
    let item_key = key initial in
    let current = ref initial in
    let item_sig = Logseq_el.own row_ctx (Signal.map (fun items ->
        (match Items.find_opt item_key items with
         | Some item -> current := item
         | None -> ());
        (* A removed row keeps its final value until the virtualizer retires it. *)
        !current) items) in
    mount item_sig row_ctx row_parent
  in
  let arr_sig = Logseq_el.own ctx (Signal.map Array.of_list source) in
  list ~key_of:key ~estimate_size ~on_end ?overscan
    ~on_projection_measure ~on_projection_width
    ~same_item:(fun a b -> cmp (key a) (key b) = 0)
    ~data_sig:(fun _ -> Some arr_sig)
    ~render
    [||] ctx parent
