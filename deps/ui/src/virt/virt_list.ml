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

let keyed = Lui_elements.keyed

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "window"]

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
  && not (Platform.rtc_test_mode () && not force)

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
  let vstate_sig = st.Signal.state_signal in
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
  set_timeout
    (fun () ->
      Logseq_virt.attach ctx st margin list_id scroll_parent_id data
        versions key_of overscan estimate_size pin_key pin_sig data_sig
        same_item on_end)
    0;
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
let rows_sig ~key ~cmp:_ ~mount ?(on_end = fun () -> ())
    ?(initial_rows = -1) ~estimate_size
    (source : 'a list Signal.signal) : t =
 fun ctx parent ->
  ignore initial_rows;
  let sched = ctx.Lui_ui.ui_scheduler in
  let arr_sig = Logseq_el.own ctx (Signal.map Array.of_list source) in
  list ~key_of:key ~estimate_size ~on_end
    ~data_sig:(fun _ -> Some arr_sig)
    ~render:(fun it -> mount (Signal.constant sched it))
    [||] ctx parent
