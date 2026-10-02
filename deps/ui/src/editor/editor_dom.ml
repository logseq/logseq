(* Raw DOM access for the block editor. LUI's dom-event channel is
   fire-and-forget — it cannot preventDefault, read caret positions, or
   deliver clipboard payloads — so editor key handling, focus/caret
   management and the imperative .block-add-button live here behind
   document-level capture listeners and a MutationObserver. *)

type el
type ev
type node_list
type clipboard_data
type mutation_observer

type mutation_record
type observe_opts

(* identity conversion for code paths that hold elements as Js.Json.t
   (Dom_ext.element) — same runtime value, different abstract view *)
external el_of_json : Js.Json.t -> el = "%identity"

external json_of_el : el -> Js.Json.t = "%identity"

external document_add_listener :
  string -> (ev -> unit) -> bool -> unit = "addEventListener"
  [@@mel.scope "document"]

external get_element_by_id : string -> el option = "getElementById"
  [@@mel.scope "document"] [@@mel.return nullable]

external query_selector_all : string -> node_list = "querySelectorAll"
  [@@mel.scope "document"]

external query_selector : string -> el option = "querySelector"
  [@@mel.scope "document"] [@@mel.return nullable]

external active_element : el option = "document.activeElement"
  [@@mel.return nullable]

external document_element : el = "document.documentElement"

external create_element : string -> el = "createElement"
  [@@mel.scope "document"]

external create_el_ns : string -> string -> el = "createElementNS"
  [@@mel.scope "document"]

external create_text_node : string -> el = "createTextNode"
  [@@mel.scope "document"]

external node_list_length : node_list -> int = "length" [@@mel.get]

external node_list_item : node_list -> int -> el option = "item"
  [@@mel.send] [@@mel.return nullable]

(* event *)
external ev_key : ev -> string = "key" [@@mel.get]
external ev_shift : ev -> bool = "shiftKey" [@@mel.get]
external ev_ctrl : ev -> bool = "ctrlKey" [@@mel.get]
external ev_meta : ev -> bool = "metaKey" [@@mel.get]
external ev_alt : ev -> bool = "altKey" [@@mel.get]
external ev_repeat : ev -> bool = "repeat" [@@mel.get]
external ev_composing : ev -> bool = "isComposing" [@@mel.get]
external ev_target : ev -> el option = "target" [@@mel.get]
  [@@mel.return nullable]
external ev_clipboard : ev -> clipboard_data option = "clipboardData"
  [@@mel.get] [@@mel.return nullable]
external prevent_default : ev -> unit = "preventDefault" [@@mel.send]
external stop_propagation : ev -> unit = "stopPropagation" [@@mel.send]

external stop_immediate : ev -> unit = "stopImmediatePropagation"
  [@@mel.send]

(* CustomEvent.detail for the ls:editor-* channel (popups) *)
external ev_detail : ev -> Js.Json.t option = "detail"
  [@@mel.get] [@@mel.return nullable]

(* clipboard *)
external clipboard_get_text : clipboard_data -> string -> string = "getData"
  [@@mel.send]
external clipboard_set_text :
  clipboard_data -> string -> string -> unit = "setData" [@@mel.send]

(* drag events reuse the clipboard_data opaque type (both are DOM objects
   we only pass through) *)
external ev_data_transfer : ev -> clipboard_data option = "dataTransfer"
  [@@mel.get] [@@mel.return nullable]
external dt_set_data : clipboard_data -> string -> string -> unit = "setData"
  [@@mel.send]

external ev_buttons : ev -> int = "buttons" [@@mel.get]

external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_page_x : ev -> float = "pageX" [@@mel.get]

external json_array_from : Js.Json.t -> Js.Json.t array = "from"
  [@@mel.scope "Array"]

external dt_file_list : clipboard_data -> Js.Json.t = "files" [@@mel.get]

let dt_files dt = json_array_from (dt_file_list dt)

type rect
external el_bounding_rect : el -> rect = "getBoundingClientRect" [@@mel.send]
external rect_top : rect -> float = "top" [@@mel.get]
external rect_left : rect -> float = "left" [@@mel.get]

(* element *)
external el_id : el -> string = "id" [@@mel.get]
external el_tag : el -> string = "tagName" [@@mel.get]
external el_matches : el -> string -> bool = "matches" [@@mel.send]

external el_closest : el -> string -> el option = "closest" [@@mel.send]
  [@@mel.return nullable]

external el_query : el -> string -> el option = "querySelector"
  [@@mel.send] [@@mel.return nullable]
external el_get_attr : el -> string -> string option = "getAttribute"
  [@@mel.send] [@@mel.return nullable]
external el_set_attr : el -> string -> string -> unit = "setAttribute"
  [@@mel.send]
external el_remove_attr : el -> string -> unit = "removeAttribute"
  [@@mel.send]
external el_append_child : el -> el -> unit = "appendChild" [@@mel.send]
external el_contains : el -> el -> bool = "contains" [@@mel.send]
external el_insert_before : el -> el -> el -> unit = "insertBefore"
  [@@mel.send]
external el_set_class : el -> string -> unit = "className" [@@mel.set]
external el_focus : el -> unit = "focus" [@@mel.send]
external el_scroll_into_view : el -> unit = "scrollIntoView" [@@mel.send]

let el_class_add : el -> string -> unit =
  [%mel.raw "function (e, c) { e.classList.add(c) }"]

let el_class_remove : el -> string -> unit =
  [%mel.raw "function (e, c) { e.classList.remove(c) }"]

(* textarea *)
external el_value : el -> string = "value" [@@mel.get]
external el_set_value : el -> string -> unit = "value" [@@mel.set]
external el_set_text_content : el -> string -> unit = "textContent"
  [@@mel.set]
external el_selection_start : el -> int = "selectionStart" [@@mel.get]
external el_selection_end : el -> int = "selectionEnd" [@@mel.get]

external el_set_selection_range : el -> int -> int -> unit
  = "setSelectionRange" [@@mel.send]

external el_scroll_height : el -> int = "scrollHeight" [@@mel.get]

external el_set_style_height :
  el -> string -> unit = "height" [@@mel.set] [@@mel.scope "style"]

(* cljs mock-textarea autosize: collapse then grow to the content height *)
let autosize_textarea el =
  el_set_style_height el "auto";
  el_set_style_height el (string_of_int (el_scroll_height el) ^ "px")

(* misc *)
external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"

external clear_timeout : int -> unit = "clearTimeout"

(* debounce: returns a function; each call resets the timer *)
let debounce ms =
  let id = ref (-1) in
  fun f ->
    if !id >= 0 then clear_timeout !id;
    id := set_timeout_id f ms

external new_observer : (unit -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external new_observer_records : (mutation_record array -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external rec_target : mutation_record -> el = "target" [@@mel.get]

external rec_added : mutation_record -> node_list = "addedNodes" [@@mel.get]

external rec_removed : mutation_record -> node_list = "removedNodes" [@@mel.get]

external rec_type : mutation_record -> string = "type" [@@mel.get]

external node_name : el -> string = "nodeName" [@@mel.get]

external el_class : el -> string = "className" [@@mel.get]

external observe_opts :
  childList:bool -> subtree:bool -> observe_opts = "" [@@mel.obj]

external observe : mutation_observer -> el -> observe_opts -> unit
  = "observe" [@@mel.send]

external el_replace_with : el -> el -> unit = "replaceWith" [@@mel.send]

(* the adapter reads this back to keep the Text node in sync — see
   dom_adapter.raw_text_node_get *)
external el_set_swap_text : el -> el -> unit = "__lsText" [@@mel.set]

let for_each_selector sel f =
  let nl = query_selector_all sel in
  for i = 0 to node_list_length nl - 1 do
    match node_list_item nl i with Some el -> f el | None -> ()
  done

external el_query_all : el -> string -> node_list = "querySelectorAll"
  [@@mel.send]

external node_type : el -> int = "nodeType" [@@mel.get]

type el_set

external el_set_new : unit -> el_set = "Set" [@@mel.new]
external el_set_has : el_set -> el -> bool = "has" [@@mel.send]
external el_set_add : el_set -> el -> el_set = "add" [@@mel.send]

(* elements matching [sel] touched by the mutation roots: each root's
   closest ancestor-or-self match plus its matching descendants. Roots
   are the mutation records' addedNodes — a subtree inserted under an
   already-mounted shell is covered by the ancestor direction. *)
let for_each_touched roots sel f =
  (* a page mount feeds hundreds of per-node roots through each scan;
     the dedup must stay O(1) — an identity-list scan measured ~260ms
     on a 200-block nav *)
  let seen = el_set_new () in
  let emit el =
    if not (el_set_has seen el) then begin
      ignore (el_set_add seen el);
      f el
    end
  in
  List.iter
    (fun root ->
      (match el_closest root sel with Some el -> emit el | None -> ());
      let nl = el_query_all root sel in
      for i = 0 to node_list_length nl - 1 do
        match node_list_item nl i with Some el -> emit el | None -> ()
      done)
    roots

(* shared document observer: feature installers register one scan each;
   mutation batches coalesce into a single debounced pass that hands each
   scan the added element roots so scans scope their selector work to the
   changed subtrees instead of re-scanning the whole document *)
type doc_scan =
  { ds_run_if : mutation_record array -> bool
  ; ds_scan : el list -> unit
  ; ds_sync : bool (* run in the observer microtask, before paint *)
  }

let doc_scans : doc_scan list ref = ref []
let doc_scan_timer = ref (-1)
let doc_pending_recs : mutation_record list ref = ref []

let roots_of_recs recs =
  Array.fold_left
    (fun acc r ->
      let nl = rec_added r in
      let rec collect i acc =
        if i >= node_list_length nl then acc
        else
          collect (i + 1)
            (match node_list_item nl i with
             | Some el when node_type el = 1 -> el :: acc
             | _ -> acc)
      in
      collect 0 acc)
    [] recs

let doc_flush () =
  doc_scan_timer := -1;
  let recs = Array.of_list (List.rev !doc_pending_recs) in
  doc_pending_recs := [];
  let roots = roots_of_recs recs in
  List.iter
    (fun ds ->
      if (not ds.ds_sync) && ds.ds_run_if recs then ds.ds_scan roots)
    !doc_scans

let doc_observer_installed = ref false

let register_doc_scan ?(run_if = fun _ -> true) ?(sync = false) scan =
  doc_scans :=
    !doc_scans
    @ [ { ds_run_if = run_if; ds_scan = scan; ds_sync = sync } ];
  scan [ document_element ];
  if not !doc_observer_installed then (
    doc_observer_installed := true;
    let obs =
      new_observer_records (fun recs ->
          (* sync scans run inside the observer microtask — their DOM
             writes must land before the next paint (a 60ms debounce
             leaves e.g. <raw-text> placeholders visibly empty for
             several frames) *)
          List.iter
            (fun ds ->
              if ds.ds_sync && ds.ds_run_if recs then
                ds.ds_scan (roots_of_recs recs))
            !doc_scans;
          doc_pending_recs := Array.to_list recs @ !doc_pending_recs;
          if !doc_scan_timer < 0 then
            doc_scan_timer := set_timeout_id doc_flush 60)
    in
    observe obs document_element (observe_opts ~childList:true ~subtree:true))

(* <raw-text> placeholders carry the intended text in data-raw-text and
   are swapped for real text nodes once they enter the DOM — extension
   create() can only return Elements, so this observer performs the
   swap the adapter cannot.  The swapped node is kept on the placeholder
   as __lsText so later property writes/removals on the (detached)
   placeholder can still reach the live text node. *)
let replace_all_raw_text roots =
  for_each_touched roots "raw-text" (fun el ->
      let tn =
        create_text_node
          (match el_get_attr el "data-raw-text" with
           | Some s -> s
           | None -> "")
      in
      el_set_swap_text el tn;
      el_replace_with el tn)

(* LUI core stamps id="lui-node-<n>" on every registered/extension node
   at create time; cljs emits no such ids, so strip them for DOM parity.
   Ids with a suffix (menu popups, accordion triggers/panels) keep the
   "lui-node-N-*" form and are left alone since LUI core references them. *)
let strip_lui_node_ids roots =
  for_each_touched roots "[id^='lui-node-']" (fun el ->
      match el_get_attr el "id" with
      | Some id ->
          let n = String.length id in
          let rec digits i =
            i >= n || (id.[i] >= '0' && id.[i] <= '9' && digits (i + 1))
          in
          if n > 9 && digits 9 then el_remove_attr el "id"
      | None -> ())

let dom_fixups roots =
  replace_all_raw_text roots;
  strip_lui_node_ids roots

let raw_text_observer_installed = ref false

let ensure_raw_text_observer () =
  if not !raw_text_observer_installed then (
    raw_text_observer_installed := true;
    register_doc_scan ~sync:true dom_fixups)

let closest_sel sel target =
  match target with
  | Some el -> el_closest el sel
  | None -> None

let textarea_of uuid = get_element_by_id ("edit-block-" ^ uuid)

let is_editable_target target =
  match target with
  | Some el ->
      el_tag el = "TEXTAREA" || el_tag el = "INPUT"
      || el_tag el = "SELECT"
      || el_closest el "[contenteditable='true']" <> None
  | None -> false

(* imperative twin of Icons.icon: span.ui__icon.ti.ls-icon-<name> holding
   svg.tabler-icon.tabler-icon-<name> built from Icon_tabler_data; font
   glyph only when no svg data exists *)
let svg_ns_el tag = create_el_ns "http://www.w3.org/2000/svg" tag

let tabler_svg_el ?(size = 18.) name : el option =
  let n = Icons.kebab name in
  match Icon_tabler_data.tabler_children n with
  | [] -> None
  | kids ->
      let svg = svg_ns_el "svg" in
      List.iter
        (fun (k, v) -> el_set_attr svg k v)
        (Icons.tabler_svg_attrs ~size ~filled:(Icons.is_filled n) n " ");
      List.iter
        (fun (tag, attrs) ->
          let k = svg_ns_el tag in
          List.iter (fun (a, v) -> el_set_attr k a v) attrs;
          el_append_child svg k)
        kids;
      Some svg

let ui_icon_el ?(size = 18.) ?(cls = "") name : el =
  let span = create_element "span" in
  (match tabler_svg_el ~size name with
   | Some svg ->
       el_set_class span
         ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
       el_append_child span svg
   | None ->
       let prefix =
         if List.mem (Icons.kebab name) Icons.tie_names then "tie tie-"
         else "ti ti-"
       in
       el_set_class span
         ("ui__icon " ^ prefix ^ name ^ if cls = "" then "" else " " ^ cls));
  span
