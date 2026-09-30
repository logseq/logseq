(* Imperative DOM helpers for views. Reuses Editor_dom's abstract element
   type and document-level listeners; adds the element operations views
   need (children traversal, remove, rects, focus/blur, checked, event
   dispatch) plus a small `h` builder so view trees read declaratively. *)

type el = Editor_dom.el
type ev = Editor_dom.ev

external el_remove : el -> unit = "remove" [@@mel.send]

external el_replace_children : el -> unit = "replaceChildren" [@@mel.send]

external el_children : el -> Editor_dom.node_list = "children" [@@mel.get]

external el_parent : el -> el option = "parentElement"
  [@@mel.get] [@@mel.return nullable]

external el_is_connected : el -> bool = "isConnected" [@@mel.get]

external el_text_content : el -> string = "textContent" [@@mel.get]

external el_set_text_content : el -> string -> unit = "textContent"
  [@@mel.set]

external el_insert_adjacent_text : el -> string -> string -> unit =
  "insertAdjacentText" [@@mel.send]

external el_click : el -> unit = "click" [@@mel.send]

external el_blur : el -> unit = "blur" [@@mel.send]

external el_checked : el -> bool = "checked" [@@mel.get]

external el_set_checked : el -> bool -> unit = "checked" [@@mel.set]

external el_insert_before : el -> el -> el option -> unit = "insertBefore"
  [@@mel.send]

external el_add_listener :
  el -> string -> (ev -> unit) -> unit = "addEventListener" [@@mel.send]

external el_add_listener_capture :
  el -> string -> (ev -> unit) -> bool -> unit = "addEventListener"
  [@@mel.send]

external el_remove_listener :
  el -> string -> (ev -> unit) -> unit = "removeEventListener" [@@mel.send]

external el_contains : el -> el -> bool = "contains" [@@mel.send]

external el_placeholder : el -> string -> unit = "placeholder" [@@mel.set]

external el_type : el -> string -> unit = "type" [@@mel.set]

external el_scroll_into_view : el -> unit = "scrollIntoView" [@@mel.send]

external el_has_attr : el -> string -> bool = "hasAttribute" [@@mel.send]

external el_scroll_top : el -> float = "scrollTop" [@@mel.get]

external el_scroll_height : el -> float = "scrollHeight" [@@mel.get]

external el_client_height : el -> float = "clientHeight" [@@mel.get]

external el_client_width : el -> float = "clientWidth" [@@mel.get]

external el_inner_html_set : el -> string -> unit = "innerHTML" [@@mel.set]

type rect

external window_inner_height : float = "innerHeight"
  [@@mel.scope "window"]

external el_rect : el -> rect = "getBoundingClientRect" [@@mel.send]

external rect_top : rect -> float = "top" [@@mel.get]
external rect_left : rect -> float = "left" [@@mel.get]
external rect_bottom : rect -> float = "bottom" [@@mel.get]
external rect_width : rect -> float = "width" [@@mel.get]
external rect_height : rect -> float = "height" [@@mel.get]

external ev_client_x : ev -> float = "clientX" [@@mel.get]
external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_button : ev -> int = "button" [@@mel.get]
external ev_stop_immediate : ev -> unit = "stopImmediatePropagation"
  [@@mel.send]

external new_event_opts : string -> Js.Json.t -> ev = "Event" [@@mel.new]

external el_dispatch : el -> ev -> unit = "dispatchEvent" [@@mel.send]

let dispatch_bubble el name =
  el_dispatch el
    (new_event_opts name
       (Js.Json.object_
          (Js.Dict.fromList
             [ ("bubbles", Js.Json.boolean true)
             ; ("cancelable", Js.Json.boolean true)
             ])))

external now_ms : unit -> float = "now" [@@mel.scope "Date"]

let children_list el =
  let nl = el_children el in
  let n = Editor_dom.node_list_length nl in
  let rec loop i acc =
    if i >= n then List.rev acc
    else
      match Editor_dom.node_list_item nl i with
      | Some c -> loop (i + 1) (c :: acc)
      | None -> loop (i + 1) acc
  in
  loop 0 []

let append_all parent els =
  List.iter (fun c -> Editor_dom.el_append_child parent c) els

(* build element: tag, class, attrs, optional text/click/children *)
let h ?(tag = "div") ?(cls = "") ?(attrs = []) ?text ?title_ ?on_click
    ?on_input ?on_keydown ?on_mousedown ?children () : el =
  let el = Editor_dom.create_element tag in
  if cls <> "" then Editor_dom.el_set_class el cls;
  List.iter (fun (k, v) -> Editor_dom.el_set_attr el k v) attrs;
  (match title_ with
   | Some t -> Editor_dom.el_set_attr el "title" t
   | None -> ());
  (match text with Some t -> el_set_text_content el t | None -> ());
  (match on_click with
   | Some f -> el_add_listener el "click" (fun ev -> f ev)
   | None -> ());
  (match on_input with
   | Some f -> el_add_listener el "input" (fun ev -> f ev)
   | None -> ());
  (match on_keydown with
   | Some f -> el_add_listener el "keydown" (fun ev -> f ev)
   | None -> ());
  (match on_mousedown with
   | Some f -> el_add_listener el "mousedown" (fun ev -> f ev)
   | None -> ());
  (match children with Some cs -> append_all el cs | None -> ());
  el

external create_el_ns : string -> string -> el = "createElementNS"
  [@@mel.scope "document"]

external tabler_icons : Js.Json.t Js.Dict.t Js.Undefined.t = "tablerIcons"
  [@@mel.scope "window"]

external call_fn : Js.Json.t -> Js.Json.t -> Js.Json.t -> Js.Json.t = "call"
  [@@mel.send]

let undefined_json : Js.Json.t = [%mel.raw "undefined"]

let svg_el tag = create_el_ns "http://www.w3.org/2000/svg" tag

let icon_attr_name k =
  match k with
  | "className" -> "class"
  | "viewBox" -> "viewBox"
  | _ ->
    let b = Buffer.create (String.length k + 2) in
    String.iter
      (fun c ->
        if c >= 'A' && c <= 'Z' then begin
          Buffer.add_char b '-';
          Buffer.add_char b (Char.lowercase_ascii c)
        end
        else Buffer.add_char b c)
      k;
    Buffer.contents b

let json_num_str n =
  let i = int_of_float n in
  if n = float_of_int i then string_of_int i else string_of_float n

(* tabler.ext.js factories return react-element-shaped objects
   ({type, props:{children}}) produced by the ReactJSXRuntime shim in
   index.html — convert them to real DOM elements *)
let rec append_icon_child parent (v : Js.Json.t) : unit =
  match Js.Json.classify v with
  | Js.Json.JSONObject _ -> (
    match dom_of_react_el v with
    | Some el -> Editor_dom.el_append_child parent el
    | None -> ())
  | Js.Json.JSONArray items ->
    Array.iter (append_icon_child parent) items
  | _ -> ()

and dom_of_react_el (v : Js.Json.t) : el option =
  match Js.Json.classify v with
  | Js.Json.JSONObject o -> (
    match Js.Dict.get o "type" with
    | Some ty -> (
      match Js.Json.decodeString ty with
      | None -> None
      | Some tag ->
        let el = svg_el tag in
        (match Js.Dict.get o "props" with
         | Some p -> (
           match Js.Json.decodeObject p with
           | None -> ()
           | Some props ->
             Array.iter
               (fun (k, pv) ->
                 if k <> "children" then
                   match Js.Json.classify pv with
                   | Js.Json.JSONString s ->
                     Editor_dom.el_set_attr el (icon_attr_name k) s
                   | Js.Json.JSONNumber n ->
                     Editor_dom.el_set_attr el (icon_attr_name k)
                       (json_num_str n)
                   | Js.Json.JSONTrue ->
                     Editor_dom.el_set_attr el (icon_attr_name k) ""
                   | _ -> ())
               (Js.Dict.entries props);
             append_icon_child el
               (match Js.Dict.get props "children" with
                | Some ch -> ch
                | None -> Js.Json.null))
         | None -> ());
        Some el)
    | None -> None)
  | _ -> None

(* window.tablerIcons.Icon<name> — custom Logseq icons (Backlog, priorityLvl*,
   InProgress50...) that have no tabler font glyph *)
let tabler_icon_el name : el option =
  match Js.Undefined.toOption tabler_icons with
  | Some icons -> (
    match Js.Dict.get icons ("Icon" ^ String.capitalize_ascii name) with
    | Some ctor ->
      let props =
        Js.Json.object_ (Js.Dict.fromList [ ("size", Js.Json.number 18.) ])
      in
      dom_of_react_el (call_fn ctor undefined_json props)
    | None -> None)
  | None -> None

(* <span class="ui__icon ti ls-icon-{name}">…</span> matches shui icon markup;
   cljs prefers window.tablerIcons (custom ext icons), then the
   @tabler/icons-react svg, then the font glyph *)
let icon ?(cls = "") name =
  let span = Editor_dom.create_element "span" in
  Editor_dom.el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  (match tabler_icon_el name with
   | Some el -> Editor_dom.el_append_child span el
   | None -> (
     match Editor_dom.tabler_svg_el name with
     | Some svg -> Editor_dom.el_append_child span svg
     | None ->
       let i = Editor_dom.create_element "i" in
       Editor_dom.el_set_class i ("ti ti-" ^ name);
       Editor_dom.el_append_child span i));
  span

let clear el = el_replace_children el

(* shui/button rendered classes (deps/shui components.cljs) *)
let button_base_cls = "ui__button"

(* cljs shui cn (deps/shui components.cljs): a small tailwind-merge —
   only height/width/padding utilities conflict; later wins unless the
   earlier match is marked important (!). Returns (variant-prefix ^ group,
   important?). *)
let variant_split_index s =
  let n = String.length s in
  let rec go i depth idx =
    if i >= n then idx
    else
      let c = s.[i] in
      if c = '[' then go (i + 1) (depth + 1) idx
      else if c = ']' then go (i + 1) (max 0 (depth - 1)) idx
      else if c = ':' && depth = 0 then go (i + 1) depth (Some i)
      else go (i + 1) depth idx
  in
  go 0 0 None

let utility_groups =
  [ ("min-h-", "min-h"); ("max-h-", "max-h"); ("h-", "h")
  ; ("min-w-", "min-w"); ("max-w-", "max-w"); ("w-", "w")
  ; ("px-", "px"); ("py-", "py"); ("pt-", "pt"); ("pr-", "pr")
  ; ("pb-", "pb"); ("pl-", "pl"); ("p-", "p") ]

let utility_conflict s =
  let vp, u =
    match variant_split_index s with
    | Some i ->
        (String.sub s 0 (i + 1), String.sub s (i + 1) (String.length s - i - 1))
    | None -> ("", s)
  in
  let imp = String.length u > 0 && u.[0] = '!' in
  let u = if imp then String.sub u 1 (String.length u - 1) else u in
  let u = if String.length u > 0 && u.[0] = '-' then String.sub u 1 (String.length u - 1) else u in
  match
    List.find_opt (fun (p, _) ->
        String.length u > String.length p && String.sub u 0 (String.length p) = p)
      utility_groups
  with
  | Some (_, g) -> Some (vp ^ g, imp)
  | None -> None

let merge_classes toks =
  let classes = ref [] in
  let indexes = Hashtbl.create 16 and important = Hashtbl.create 8 in
  List.iteri
    (fun _ tok ->
      match utility_conflict tok with
      | Some (key, imp) -> (
          match Hashtbl.find_opt indexes key with
          | Some i ->
              if not (Hashtbl.find important key && not imp) then (
                classes :=
                  List.mapi (fun j c -> if j = i then "" else c) !classes
                  @ [ tok ];
                Hashtbl.replace indexes key (List.length !classes - 1);
                Hashtbl.replace important key imp)
          | None ->
              classes := !classes @ [ tok ];
              Hashtbl.add indexes key (List.length !classes - 1);
              Hashtbl.add important key imp)
      | None -> classes := !classes @ [ tok ])
    toks;
  !classes

let cn parts =
  parts
  |> List.concat_map
       (fun s -> List.filter (fun t -> t <> "") (String.split_on_char ' ' s))
  |> merge_classes
  |> List.filter (fun t -> t <> "")
  |> String.concat " "

let button_cls ?(variant = "default") ?(size = "default") ?(cls = "") () =
  let v =
    match variant with
    | "text" -> "as-text"
    | "ghost" -> "as-ghost"
    | "outline" -> "as-outline"
    | "secondary" -> "as-secondary"
    | "destructive" -> "as-destructive"
    | "link" -> "as-link"
    | _ -> "as-solid"
  in
  let s =
    match size with
    | "sm" -> "ls-btn-sm"
    | "xs" -> "ls-btn-xs"
    | "md" -> "ls-btn-md"
    | "lg" -> "ls-btn-lg"
    | "icon" -> "ls-btn-icon"
    | _ -> "ls-btn-default"
  in
  cn [ button_base_cls; v; s; cls ]

let query_inside (root : el) sel = Editor_dom.el_query root sel

(* subtree query via :scope — querySelectorAll on element *)
external el_query_all : el -> string -> Editor_dom.node_list
  = "querySelectorAll" [@@mel.send]

let for_each_inside root sel f =
  let nl = el_query_all root sel in
  for i = 0 to Editor_dom.node_list_length nl - 1 do
    match Editor_dom.node_list_item nl i with
    | Some el -> f el
    | None -> ()
  done

let focus_end el = Editor_dom.el_focus el

(* debounce: shared impl lives in Editor_dom *)
let debounce = Editor_dom.debounce

(* mel.send on the receiver's classList: el.classList.add(c) — a bare
   [@@mel.scope "classList"] (no send) would emit global classList.add(el,c) *)
external el_class_add : el -> string -> unit = "add"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_remove : el -> string -> unit = "remove"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_toggle : el -> string -> bool -> unit = "toggle"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_contains : el -> string -> bool = "contains"
  [@@mel.send] [@@mel.scope "classList"]

external el_remove_attr : el -> string -> unit = "removeAttribute" [@@mel.send]

external document_body : el = "body" [@@mel.scope "document"]

external clipboard_write : string -> unit Js.Promise.t = "writeText"
  [@@mel.scope ("navigator", "clipboard")]

external el_shift_key : ev -> bool = "shiftKey" [@@mel.get]

(* generic js property read for values outside attributes *)
external el_prop_string : el -> string -> string = "" [@@mel.get_index]

external document_el : el = "document"

external new_custom_event : string -> Js.Json.t -> ev = "CustomEvent"
  [@@mel.new]

(* `new CustomEvent(name, {detail: payload})` dispatched on document —
   Platform.dispatch's external is broken (dom_ext.ml notes it), so views
   uses this local version like popups do. *)
let dispatch_custom name detail =
  let init = Js.Dict.empty () in
  Js.Dict.set init "detail" detail;
  el_dispatch document_el (new_custom_event name (Js.Json.object_ init))

(* aliases to Editor_dom ops so view modules only need module D *)
let el_append_child = Editor_dom.el_append_child
let el_set_attr = Editor_dom.el_set_attr
let el_get_attr = Editor_dom.el_get_attr
let el_focus = Editor_dom.el_focus
let el_value = Editor_dom.el_value
let el_set_value = Editor_dom.el_set_value
