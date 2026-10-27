(* Native twin of virt/virt_list.ml — emits every row as a real child
   (children spine identical to the web backend / master) and lets the
   SwiftUI LazyVStack virtualize at render time: views materialize only
   when scrolled into view, the same model as logseq/chat.

   The data-virt-count attribute selects the lazy column path on the
   host side; the last child's onAppear fires a "virt-end" dom-event
   which drives [on_end] pagination (journals scroll-back; a no-op on
   fixed-size lists). *)

open Lui_elements
module D = Logseq_el

let enabled_min ~virtualize ~min count =
  virtualize && count >= min

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

(* the native host's eager rows sit inside one shared taffy layout, so the Swift
   spine's 48-row warmup is far above its cold-start budget — a single
   viewport of eager rows keeps the first frame cheap; the lazy-mount
   sweep fills in the overscan margin right after paint *)
let clamp_initial_rows ctx n =
  if n >= 0 && Lui_ui.host ctx = Lui_protocol.GenericHost then min n 16 else n

(* Only hosts with a native lazy spine (SwiftUI LazyVStack, the OCaml
   host spine) can deliver "lazy-mount"/"virt-end" dom-events; on every
   other host rows must mount eagerly. *)
let lazy_spine ctx =
  match Lui_ui.host ctx with
  | Lui_protocol.GenericHost | Lui_protocol.SwiftUIHost -> true
  | _ -> false

let lazy_row ?node_key ?(style_class="") ?(pinned=fun () -> false)
    ?(visibility_changed=fun _ -> ())
    ~key ~estimate_size near ns child : t =
 fun ctx parent ->
  let extent = Signal.state ctx.Lui_ui.ui_scheduler (estimate_size 0) in
  (* The native viewport widget owns this binding through Logseq_el.
     A measured floating-point extent preserves scrolling coordinates
     when its content leaves the window. *)
  let height = Signal.map2 (fun mounted height ->
    Lui_protocol.StringValue (if mounted then "auto" else string_of_float height))
    ns (Signal.value extent) in
  (Logseq_el.el ?key:node_key ~style_class ~attrs:["data-lazy-mount",key]
    ~ext_prop_signals:["height",height] ~events:"lazy-mount lazy-unmount"
    ~on_dom_event:(fun name payload ->
      if name="lazy-mount" then begin
        visibility_changed true;
        Signal.set near true
      end
      else if name="lazy-unmount" then begin
        let fields = Option.get (Js.Json.decodeObject (Js.Json.parseExn (Option.get payload))) in
        let height = Option.get (Option.bind (Js.Dict.get fields "height") Js.Json.decodeNumber) in
        if not (Float.is_finite height) || height < 0. then
          invalid_arg "Invalid lazy row measured height";
        Signal.set extent height;
        visibility_changed false;
        if not (pinned ()) then Signal.set near false
      end)
    [if_ ~test:ns child]) ctx parent

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(initial_rows = -1) ?(list_attrs = [])
    ?(list_class = "ls-virt-list") ?(pin_key = fun () -> None)
    ?(pin_sig = fun () -> None)
    ?(data_sig = fun (_ : Lui_ui.ui_context) -> None)
    ?(on_end = fun () -> ())
    ?(same_item = fun (a : 'a) (b : 'a) -> a == b || a = b)
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  fun ctx parent ->
    let sched = ctx.Lui_ui.ui_scheduler in
    let arr_sig =
      match data_sig ctx with
      | Some s -> s
      | None -> Signal.constant sched data
    in
    let attrs_sig =
      Logseq_el.attrs_signal arr_sig (fun (arr : 'a array) ->
          list_attrs
          @ [ ("data-virt-count", string_of_int (Array.length arr)) ])
    in
    (* keyed rows with a per-key render version — mirrors the web twin:
       a splice keeps untouched rows mounted (adopted by key), and only
       rows whose item fails [same_item] get a version bump that remounts
       their row.  Callers whose items repaint internally from their own
       signals (journals' journal_page_sig) pass a key-only equality so
       splices never remount a whole day subtree. *)
    let versions : (string, int) Hashtbl.t = Hashtbl.create 16 in
    let prev_items : (string, 'a) Hashtbl.t = Hashtbl.create 16 in
    let source_sig =
      let prev : 'a array option ref = ref None in
      Signal.map
        (fun (arr : 'a array) ->
          (match !prev with
           | Some old ->
               Hashtbl.reset prev_items;
               Array.iter
                 (fun it -> Hashtbl.replace prev_items (key_of it) it)
                 old;
               Array.iter
                 (fun it ->
                   let k = key_of it in
                   match Hashtbl.find_opt prev_items k with
                   | Some old_it when same_item old_it it -> ()
                   | _ ->
                       (if Sys.getenv_opt "LOGSEQ_PERF" <> None then
                          Printf.eprintf "[virt-bump] %s\n%!" k);
                       Hashtbl.replace versions k
                         (1 + Option.value (Hashtbl.find_opt versions k)
                            ~default:0))
                 arr
           | None -> ());
          prev := Some arr;
          arr)
        arr_sig
    in
    let key_of_versioned (it : 'a) =
      Printf.sprintf "%s|%d" (key_of it)
        (Option.value (Hashtbl.find_opt versions (key_of it)) ~default:0)
    in
    (* [initial_rows >= 0]: every row has a viewport-owned mount state.
       The first [initial_rows] keys start mounted for the initial paint;
       they can leave the viewport like any later row. The
       placeholder is a childless `.ls-virt-row[data-lazy-mount]` the
       flat spine reads as a spacer; its onAppear dom-event flips `near`
       and the real row mounts in place. Row data stays in the keyed
       source, so splices keep identity either way. The eager set is
       keyed by row id, not index — indexing the source would dirty
       every downstream row signal on any splice. *)
    let initial_rows = clamp_initial_rows ctx initial_rows in
    let eager : (string, unit) Hashtbl.t = Hashtbl.create 64 in
    if initial_rows >= 0 then
      Array.iteri
        (fun i it ->
          if i < initial_rows then Hashtbl.replace eager (key_of it) ())
        (Signal.get arr_sig);
    let near_states : (string, bool Signal.state) Hashtbl.t =
      Hashtbl.create 8
    in
    let visible : (string, bool) Hashtbl.t = Hashtbl.create 8 in
    let near_of (k : string) : bool Signal.state =
      match Hashtbl.find_opt near_states k with
      | Some s -> s
      | None ->
          let in_view = Hashtbl.mem eager k in
          Hashtbl.replace visible k in_view;
          let s = Signal.state sched (in_view || pin_key () = Some k) in
          Hashtbl.replace near_states k s;
          s
    in
    (* Programmatic edit/insert can select an offscreen row before the
       viewport sees it. Keep the same pin contract as the web twin. *)
    Option.iter
      (fun source ->
        let last_pin = ref None in
        ignore (Signal.own ctx.Lui_ui.ui_scope
          (Signal.subscribe ~emit_initial:true source (fun _ ->
            let next_pin = pin_key () in
            if next_pin <> !last_pin then begin
              Option.iter (fun k ->
                if Hashtbl.find_opt visible k = Some false then
                  Signal.set (near_of k) false) !last_pin;
              last_pin := next_pin;
              Option.iter (fun k -> Signal.set (near_of k) true) next_pin
            end))))
      (pin_sig ());
    let row_mount (it : 'a) : t =
      let k = key_of it in
      (* Hosts without a lazy-mount spine emit every
         row eagerly — the spacer would otherwise latch at 0px forever *)
      if initial_rows < 0 || not (lazy_spine ctx) then
        box  [ render it ]
      else
        let near = near_of k in
        let ns = (Signal.value (near)) in
        lazy_row ~key:k ~estimate_size ~pinned:(fun () -> pin_key () = Some k)
          ~visibility_changed:(fun in_view -> Hashtbl.replace visible k in_view)
          near ns (render it)
    in
    (* TODO(component): data-virt-count could ride ~data_attrs but the
       virt-end dom-event driving pagination has no component
       equivalent *)
    Logseq_el.el ~style_class:list_class ~events:"virt-end"
      ~attrs_signal_v:attrs_sig
      ~on_dom_event:(fun _name _payload -> on_end ())
      [ Lui_elements.keyed
          ~source:(Signal.map Array.to_list source_sig)
          ~key:key_of_versioned ~cmp:String.compare
          ~mount:(fun item_sig -> row_mount (Signal.get item_sig)) ]
      ctx parent

(* Signal-driven row stream: same [ls-virt-list] shell but children are
   a keyed collection, so a splice republishes only the touched rows —
   on this backend every row is a real child anyway, so diffing per row
   is what keeps outliner ops cheap on huge pages (a single-block edit
   must not re-emit the whole stream). *)
let rows_sig ~key ~cmp ~mount ?(on_end = fun () -> ())
    ?(initial_rows = -1) ?overscan ~estimate_size
    (source : 'a list Signal.signal) : t =
 fun ctx parent ->
  (* rows are real children on this backend; overscan is a windowing concept *)
  ignore overscan;
  let sched = ctx.Lui_ui.ui_scheduler in
  let count_sig = Signal.map List.length source in
  let attrs_sig =
    Logseq_el.attrs_signal count_sig (fun n ->
        [ ("data-virt-count", string_of_int n) ])
  in
  (* Same viewport-owned state as [list]: warmup rows start mounted,
     and the other keys start as a childless spacer. Both retain their
     measured extent when unmounted. The native spine's entry event
     mounts real content when the row approaches the viewport.
     Keyed by row id — index-based gating would dirty every
     downstream signal on a splice. *)
  let initial_rows = clamp_initial_rows ctx initial_rows in
  let eager : (string, unit) Hashtbl.t = Hashtbl.create 64 in
  if initial_rows >= 0 then
    List.iteri
      (fun i it ->
        if i < initial_rows then Hashtbl.replace eager (key it) ())
      (Signal.get source);
  let near_states : (string, bool Signal.state) Hashtbl.t =
    Hashtbl.create 8
  in
  let near_of (k : string) : bool Signal.state =
    match Hashtbl.find_opt near_states k with
    | Some s -> s
    | None ->
        let s = Signal.state sched (Hashtbl.mem eager k) in
        Hashtbl.replace near_states k s;
        s
  in
  let row_mount (item_sig : 'a Signal.signal) : t =
    let k = key (Signal.get item_sig) in
    (* hosts without a lazy-mount spine (GenericHost/SDL) emit every
       row eagerly — the spacer would otherwise latch at 0px forever *)
    if initial_rows < 0 || not (lazy_spine ctx) then
      box  [ mount item_sig ]
    else
      let near = near_of k in
      let ns = (Signal.value (near)) in
      lazy_row ~key:k ~estimate_size near ns (mount item_sig)
  in
  (* TODO(component): same data-virt-count + virt-end dom-event Swift spine
     contract as [list] — stays a logseq-div *)
  (Logseq_el.el  ~events:"virt-end"
     ~attrs_signal_v:attrs_sig
     ~on_dom_event:(fun _name _payload -> on_end ())
     [ Lui_elements.keyed ~source:source ~key ~cmp ~mount:row_mount ])
    ctx parent
