(* Browser-global stubs for running the real LUI view tree under node.

   The mounted views only need: document/window listener registries (so
   delegated handlers fire), element factories with attr/classList/
   children/matches/closest/dispatchEvent, localStorage, location/history,
   MutationObserver-style ctors, and a few window fields. Elements are JS
   objects whose methods close over an OCaml record held in __r; event
   objects are plain JS objects flagged via __sp/__sip fields.

   Only the surface the mounted code actually touches is implemented --
   assertions about what UI emitted go through Drive.Model, not this DOM.
*)

external global : Js.Json.t = "globalThis"
external set_field : Js.Json.t -> string -> 'a -> unit = "" [@@mel.set_index]
external get_field : Js.Json.t -> string -> 'a = "" [@@mel.get_index]
external json_of : 'a -> Js.Json.t = "%identity"

external arr_of : Js.Json.t array -> Js.Json.t = "%identity"
external arr_len : Js.Json.t -> int = "length" [@@mel.get]

external define_prop : Js.Json.t -> string -> Js.Json.t -> unit =
  "defineProperty" [@@mel.scope "Object"]
external arr_at : Js.Json.t -> int -> 'a = "" [@@mel.get_index]
external arr_push : Js.Json.t -> 'a -> unit = "push" [@@mel.send]
external arr_splice : Js.Json.t -> int -> int -> unit = "splice" [@@mel.send]

type listener =
  { l_name : string
  ; l_fn : Js.Json.t -> unit
  ; l_capture : bool
  }

type elem =
  { tag : string
  ; is_text : bool
  ; mutable parent : Js.Json.t option
  ; kids : Js.Json.t (* real JS array of child elements/text nodes *)
  ; attrs : (string, string) Hashtbl.t
  ; mutable listeners : listener list
  }

let document_ref : Js.Json.t ref = ref Js.Json.null
let window_ref : Js.Json.t ref = ref Js.Json.null

let rec_r (el : Js.Json.t) : elem = get_field el "__r"
let is_stub el = Js.testAny (get_field el "__r") = false

let truthy_field el name =
  match Js.Json.classify (json_of (get_field el name)) with
  | Js.Json.JSONTrue -> true
  | _ -> false

(* -- JS array helpers -- *)

let with_item_fn (arr : Js.Json.t) : Js.Json.t =
  set_field arr "item" (fun i -> arr_at arr i);
  arr

let index_of (kids : Js.Json.t) (el : Js.Json.t) : int =
  let n = arr_len kids in
  let rec go i =
    if i >= n then -1 else if arr_at kids i == el then i else go (i + 1)
  in
  go 0

(* -- selectors: [tag][#id][.class]*[[attr(=v)]]* + descendant combinator -- *)

let classes_of el = String.split_on_char ' ' (get_field el "className")

let has_class el c =
  List.exists (fun x -> x = c) (List.filter (fun s -> s <> "") (classes_of el))

let attr_value el name =
  match Hashtbl.find_opt (rec_r el).attrs name with
  | Some v -> Some v
  | None -> (
    match name with
    | "id" -> (match get_field el "id" with "" -> None | s -> Some s)
    | "class" ->
      (match get_field el "className" with "" -> None | s -> Some s)
    | _ -> None)

let read_tok c i =
  let n = String.length c in
  let j = ref i in
  while !j < n && (let ch = c.[!j] in
                   ch <> '.' && ch <> '#' && ch <> '[' && ch <> ':')
  do
    incr j
  done;
  (String.sub c i (!j - i), !j)

let match_attr el spec =
  match String.index_opt spec '=' with
  | Some i ->
    let name = String.sub spec 0 i in
    let v = String.sub spec (i + 1) (String.length spec - i - 1) in
    let v =
      let n = String.length v in
      if n >= 2 && v.[0] = '"' && v.[n - 1] = '"' then String.sub v 1 (n - 2)
      else v
    in
    attr_value el name = Some v
  | None -> Option.is_some (attr_value el spec)

let match_compound el c =
  let n = String.length c in
  let rec go i ok =
    if (not ok) || i >= n then ok
    else
      match c.[i] with
      | '.' -> let t, j = read_tok c (i + 1) in go j (has_class el t)
      | '#' -> let t, j = read_tok c (i + 1) in go j (get_field el "id" = t)
      | '[' -> (
        match String.index_opt c ']' with
        | Some j ->
          let spec = String.sub c (i + 1) (j - i - 1) in
          go (j + 1) (match_attr el spec)
        | None -> false)
      | ':' -> false
      | '*' -> go (i + 1) ok
      | _ ->
        let t, j = read_tok c i in
        go j (String.lowercase_ascii (get_field el "tagName") = String.lowercase_ascii t)
  in
  go 0 true

let matches el sel =
  if not (is_stub el) then false
  else
    match List.filter (fun s -> s <> "") (String.split_on_char ' ' sel) with
    | [] -> false
    | parts ->
      let last = List.nth parts (List.length parts - 1) in
      if not (match_compound el last) then false
      else
        List.for_all
          (fun compound ->
            let rec up n =
              match (rec_r n).parent with
              | None -> false
              | Some p -> match_compound p compound || up p
            in
            up el)
          (List.rev (List.tl (List.rev parts)))

let closest el sel =
  let rec up n = if matches n sel then Some n else
    match (rec_r n).parent with Some p -> up p | None -> None
  in
  if is_stub el then up el else None

let all_descendants el =
  let rec walk acc n =
    List.fold_left
      (fun acc i ->
        let c : Js.Json.t = arr_at (rec_r n).kids i in
        if (rec_r c).is_text then acc else walk (c :: acc) c)
      acc
      (List.init (arr_len (rec_r n).kids) Fun.id)
  in
  List.rev (walk [] el)

let query_selector_all el sel =
  List.filter (fun n -> matches n sel) (all_descendants el)

(* -- events -- *)

let ev_flag ev name = truthy_field ev name

let make_event ?(fields = []) ~target name : Js.Json.t =
  let ev = Js.Json.object_ (Js.Dict.empty ()) in
  (* marks stub events — real Event objects (e.g. new CustomEvent via
     document.dispatchEvent) have readonly target/currentTarget and
     must skip field mutation *)
  set_field ev "__stub" true;
  set_field ev "type" (Js.Json.string name);
  set_field ev "target" (json_of target);
  set_field ev "currentTarget" Js.null;
  set_field ev "bubbles" true;
  set_field ev "cancelable" true;
  set_field ev "defaultPrevented" false;
  set_field ev "eventPhase" 0;
  set_field ev "preventDefault"
    (fun () -> set_field ev "defaultPrevented" true);
  set_field ev "stopPropagation" (fun () -> set_field ev "__sp" true);
  set_field ev "stopImmediatePropagation"
    (fun () ->
      set_field ev "__sp" true;
      set_field ev "__sip" true);
  set_field ev "composedPath" (fun () -> arr_of [||]);
  set_field ev "preventDefaultCalled" false;
  List.iter (fun (k, v) -> set_field ev k v) fields;
  ev

let fire_listeners n ev phase =
  let r = rec_r n in
  if truthy_field ev "__stub" then set_field ev "currentTarget" n;
  let ty =
    match Js.Json.decodeString (json_of (get_field ev "type")) with
    | Some s -> s
    | None -> ""
  in
  List.iter
    (fun l ->
      if (not (ev_flag ev "__sip")) && l.l_capture = phase && l.l_name = ty
      then l.l_fn ev)
    r.listeners

let chain_up el =
  let rec loop acc n =
    match (rec_r n).parent with
    | Some p -> loop (p :: acc) p
    | None -> n :: acc
  in
  loop [] el

let dispatch_el (el : Js.Json.t) (ev : Js.Json.t) : bool =
  if Js.testAny (get_field ev "target") then set_field ev "target" el;
  let chain =
    chain_up el
    @ if el == !document_ref then [] else [ !document_ref ]
  in
  List.iter
    (fun n -> if not (ev_flag ev "__sp") then fire_listeners n ev true)
    chain;
  List.iter
    (fun n -> if not (ev_flag ev "__sp") then fire_listeners n ev false)
    (List.rev chain);
  true

(* -- element structure mutation -- *)

let detach child =
  match (rec_r child).parent with
  | Some p ->
    let i = index_of (rec_r p).kids child in
    if i >= 0 then arr_splice (rec_r p).kids i 1;
    (rec_r child).parent <- None;
    set_field child "parentElement" Js.null;
    set_field child "parentNode" Js.null
  | None -> ()

let append_child parent child =
  detach child;
  arr_push (rec_r parent).kids child;
  (rec_r child).parent <- Some parent;
  set_field child "parentElement" parent;
  set_field child "parentNode" parent;
  if (rec_r child).is_text then
    set_field parent "textContent"
      (get_field parent "textContent" ^ get_field child "textContent")

(* hoisted out of the rec group below: members of a let rec group are
   monomorphic to callers inside the group, so a shared option->null
   helper must be top-level to keep instantiating per call site *)
let nullable = function Some v -> Js.Null.return v | None -> Js.null

let rec make_element ~is_text ~tag () : Js.Json.t =
  let r =
    { tag
    ; is_text
    ; parent = None
    ; kids = with_item_fn (arr_of [||])
    ; attrs = Hashtbl.create 8
    ; listeners = []
    }
  in
  let el = Js.Json.object_ (Js.Dict.empty ()) in
  set_field el "__r" r;
  set_field el "nodeType" (if is_text then 3 else 1);
  set_field el "tagName" (String.uppercase_ascii tag);
  if not is_text then install_fields el r;
  el

and install_fields el r =
  List.iter (fun (k, v) -> set_field el k v)
    [ ("id", json_of "")
    ; ("className", json_of "")
    ; ("value", json_of "")
    ; ("textContent", json_of "")
    ; ("innerHTML", json_of "")
    ; ("checked", json_of false)
    ; ("disabled", json_of false)
    ; ("isConnected", json_of true)
    ; ("parentElement", json_of Js.null)
    ; ("parentNode", json_of Js.null)
    ; ("firstChild", json_of Js.null)
    ; ("scrollTop", json_of 0.)
    ; ("scrollLeft", json_of 0.)
    ; ("scrollHeight", json_of 0.)
    ; ("scrollWidth", json_of 0.)
    ; ("clientHeight", json_of 0.)
    ; ("clientWidth", json_of 0.)
    ; ("offsetHeight", json_of 0.)
    ; ("offsetWidth", json_of 0.)
    ; ("childNodes", r.kids)
    ; ("dataset", json_of (Js.Dict.empty ()))
    ; ("style", style_obj ())
    ; ("classList", class_list el)
    ; ("files", arr_of [||])
    ];
  (* real DOM `children` is element-only and live; `childNodes` stays the
     full kid list. Patch apply indexes `children`, so the distinction
     matters for text-node children (e.g. detached text nodes) *)
  let desc = Js.Json.object_ (Js.Dict.empty ()) in
  set_field desc "enumerable" true;
  set_field desc "get"
    (fun () ->
      let n = arr_len r.kids in
      let rec go i acc =
        if i = n then Array.of_list (List.rev acc)
        else
          let c : Js.Json.t = arr_at r.kids i in
          go (i + 1) (if (get_field c "nodeType" : int) = 1 then c :: acc
                      else acc)
      in
      with_item_fn (arr_of (go 0 [])));
  define_prop el "children" desc;
  install_methods el r

and style_obj () =
  let d = Js.Json.object_ (Js.Dict.empty ()) in
  set_field d "setProperty" (fun _k _v -> ());
  set_field d "removeProperty" (fun _k -> "");
  set_field d "getPropertyValue" (fun _k -> "");
  d

and class_list el =
  let d = Js.Json.object_ (Js.Dict.empty ()) in
  set_field d "add" (fun c -> add_class el c);
  set_field d "remove" (fun c -> remove_class el c);
  set_field d "toggle" (fun c -> toggle_class el c);
  set_field d "contains" (fun c -> has_class el c);
  d

and add_class el c =
  let cs = classes_of el in
  if not (List.mem c cs) then
    set_field el "className" (String.concat " " (cs @ [ c ]) |> String.trim)

and remove_class el c =
  set_field el "className"
    (String.concat " " (List.filter (fun x -> x <> "" && x <> c) (classes_of el)))

and toggle_class el c =
  if has_class el c then remove_class el c else add_class el c

and dispatch_event_stub el (ev : Js.Json.t) : bool =
  if truthy_field ev "__stub" then dispatch_el el ev
  else
    let chain =
      chain_up el
      @ if el == !document_ref then [] else [ !document_ref ]
    in
    List.iter (fun n -> fire_listeners n ev true) chain;
    List.iter (fun n -> fire_listeners n ev false) (List.rev chain);
    true

and install_methods el r =
  let set name f = set_field el name f in
  set "addEventListener"
    (fun (n : string) (f : Js.Json.t -> unit) (cap : Js.Json.t) ->
      let capture =
        match Js.Json.classify cap with Js.Json.JSONTrue -> true | _ -> false
      in
      r.listeners <- r.listeners @ [ { l_name = n; l_fn = f; l_capture = capture } ]);
  set "removeEventListener"
    (fun (n : string) (f : Js.Json.t -> unit) (_cap : Js.Json.t) ->
      r.listeners <-
        List.filter (fun l -> not (l.l_name = n && l.l_fn == f)) r.listeners);
  set "dispatchEvent" (dispatch_event_stub el);
  set "appendChild" (fun c -> append_child el c; c);
  set "insertBefore"
    (fun c ref_el ->
      detach c;
      let i = index_of r.kids ref_el in
      if i < 0 then arr_push r.kids c else arr_insert_at r.kids i c;
      (rec_r c).parent <- Some el;
      set_field c "parentElement" el;
      set_field c "parentNode" el;
      c);
  set "removeChild" (fun c -> detach c; c);
  set "replaceChildren" (fun () -> replace_children el r);
  set "setAttribute" (fun k v -> set_attr el r k v);
  set "getAttribute" (fun k -> nullable (get_attr el r k));
  set "hasAttribute" (fun k -> Option.is_some (get_attr el r k));
  set "removeAttribute" (fun k -> Hashtbl.remove r.attrs k);
  set "matches" (fun s -> matches el s);
  set "closest" (fun s -> nullable (closest el s));
  set "contains" (fun other -> contains_el el other);
  set "querySelector"
    (fun s -> nullable (List.nth_opt (query_selector_all el s) 0));
  set "querySelectorAll"
    (fun s -> with_item_fn (arr_of (Array.of_list (query_selector_all el s))));
  set "getElementsByClassName"
    (fun s -> with_item_fn (arr_of (Array.of_list (query_selector_all el ("." ^ s)))));
  set "getBoundingClientRect" (fun () -> rect_obj ());
  set "focus" (fun () -> set_field !document_ref "activeElement" el);
  set "blur" (fun () -> set_field !document_ref "activeElement" Js.null);
  set "click" (fun () -> ignore (dispatch_el el (make_event ~target:el "click")));
  set "remove" (fun () -> detach el);
  set "setSelectionRange" (fun _a _b -> ());
  set "scrollIntoView" (fun _o -> ());
  set "scrollIntoViewIfNeeded" (fun () -> ());
  set "insertAdjacentText"
    (fun _pos s ->
      let t = make_element ~is_text:true ~tag:"" () in
      set_field t "textContent" s;
      append_child el t);
  set "insertAdjacentElement" (fun pos c -> insert_adjacent el pos c; c);
  set "getRootNode" (fun () -> !document_ref);
  set "animate" (fun _a _b -> Js.Dict.empty ());
  set "setPointerCapture" (fun _ -> ());
  set "releasePointerCapture" (fun _ -> ());
  set "showModal" (fun () -> ());
  set "close" (fun () -> ());
  ()

and arr_insert_at (arr : Js.Json.t) (i : int) (v : Js.Json.t) =
  (* splice(i, 0, v) *)
  external_splice_insert arr i v

and external_splice_insert (arr : Js.Json.t) (i : int) (v : Js.Json.t) =
  let n = arr_len arr in
  arr_push arr Js.null;
  for j = n downto i + 1 do
    set_field arr (string_of_int j) (arr_at arr (j - 1) : Js.Json.t)
  done;
  set_field arr (string_of_int i) v

and replace_children el r =
  for i = 0 to arr_len r.kids - 1 do
    let c : Js.Json.t = arr_at r.kids i in
    (rec_r c).parent <- None;
    set_field c "parentElement" Js.null;
    set_field c "parentNode" Js.null
  done;
  set_field r.kids "length" 0;
  set_field el "textContent" ""

and set_attr el r k v =
  Hashtbl.replace r.attrs k v;
  match k with
  | "id" -> set_field el "id" v
  | "class" -> set_field el "className" v
  | "value" -> set_field el "value" v
  | _ -> ()

and get_attr el r k =
  match Hashtbl.find_opt r.attrs k with
  | Some v -> Some v
  | None -> (
    match k with
    | "id" -> (match get_field el "id" with "" -> None | s -> Some s)
    | _ -> None)

and contains_el el other =
  List.exists (fun n -> n == other) (all_descendants el)

and rect_obj () =
  let d = Js.Json.object_ (Js.Dict.empty ()) in
  List.iter (fun k -> set_field d k 0.) [
    "top"; "left"; "right"; "bottom"; "width"; "height"; "x"; "y" ];
  d

and insert_adjacent el pos c =
  match pos with
  | "beforeend" -> append_child el c
  | "afterbegin" -> insert_child_at el 0 c
  | "beforebegin" -> (
    match (rec_r el).parent with
    | Some p ->
      let i = index_of (rec_r p).kids el in
      insert_child_at p (if i < 0 then arr_len (rec_r p).kids else i) c
    | None -> ())
  | "afterend" -> (
    match (rec_r el).parent with
    | Some p -> insert_child_at p (index_of (rec_r p).kids el + 1) c
    | None -> ())
  | _ -> ()

and insert_child_at parent i c =
  detach c;
  arr_insert_at (rec_r parent).kids i c;
  (rec_r c).parent <- Some parent;
  set_field c "parentElement" parent;
  set_field c "parentNode" parent

(* make_text must see the rec member, so it precedes the wrapper *)
let make_text () = make_element ~is_text:true ~tag:"" ()
let make_element tag = make_element ~is_text:false ~tag ()

(* -- global objects -- *)

let storage () =
  let tbl : (string, string) Hashtbl.t = Hashtbl.create 16 in
  let s = Js.Json.object_ (Js.Dict.empty ()) in
  set_field s "getItem"
    (fun k ->
      match Hashtbl.find_opt tbl k with
      | Some v -> Js.Null.return v
      | None -> Js.null);
  set_field s "setItem"
    (fun k v ->
      Hashtbl.replace tbl k v;
      set_field s "length" (Hashtbl.length tbl));
  set_field s "removeItem"
    (fun k ->
      Hashtbl.remove tbl k;
      set_field s "length" (Hashtbl.length tbl));
  set_field s "clear"
    (fun () ->
      Hashtbl.clear tbl;
      set_field s "length" 0);
  set_field s "key"
    (fun i ->
      let keys = Hashtbl.fold (fun k _ acc -> k :: acc) tbl [] in
      match List.nth_opt keys i with
      | Some k -> Js.Null.return k
      | None -> Js.null);
  set_field s "length" 0;
  s

let match_media () =
  fun _q ->
    let d = Js.Json.object_ (Js.Dict.empty ()) in
    set_field d "matches" false;
    set_field d "media" "";
    set_field d "addEventListener" (fun _n _f -> ());
    set_field d "removeEventListener" (fun _n _f -> ());
    d

let observer_ctor () =
  fun (_cb : Js.Json.t) ->
    let d = Js.Json.object_ (Js.Dict.empty ()) in
    set_field d "observe" (fun _a _b -> ());
    set_field d "unobserve" (fun _a -> ());
    set_field d "disconnect" (fun () -> ());
    d

let computed_style () =
  let d = Js.Json.object_ (Js.Dict.empty ()) in
  set_field d "getPropertyValue" (fun _k -> "");
  d

let location_obj () =
  let l = Js.Json.object_ (Js.Dict.empty ()) in
  List.iter (fun (k, v) -> set_field l k v)
    [ ("hash", json_of "")
    ; ("search", json_of "")
    ; ("href", json_of "http://localhost/")
    ; ("origin", json_of "http://localhost")
    ; ("protocol", json_of "http:")
    ; ("host", json_of "localhost")
    ; ("hostname", json_of "localhost")
    ; ("pathname", json_of "/")
    ; ("assign", json_of (fun _u -> ()))
    ; ("replace", json_of (fun _u -> ()))
    ; ("reload", json_of (fun () -> ()))
    ];
  l

(* rtc-test opt-in: Virt_list disables windowing under rtc-test mode
   (Platform.rtc_test_mode reads location.search) so lists mount eagerly
   in the drive harness, which has no scroll/layout machinery *)
let set_rtc_test_mode () : unit =
  set_field (get_field global "location") "search"
    (json_of "?rtc-test=true")

let history_obj () =
  let h = Js.Json.object_ (Js.Dict.empty ()) in
  set_field h "pushState" (fun _a _b _c -> ());
  set_field h "replaceState" (fun _a _b _c -> ());
  set_field h "back" (fun () -> ());
  set_field h "forward" (fun () -> ());
  set_field h "state" Js.null;
  h

let make_document () =
  let doc = make_element "#document" in
  let body = make_element "body" in
  let html = make_element "html" in
  append_child html body;
  append_child doc html;
  set_field doc "body" body;
  set_field doc "documentElement" html;
  set_field doc "head" (make_element "head");
  set_field doc "activeElement" Js.null;
  set_field doc "createElement" (fun tag -> make_element tag);
  set_field doc "createElementNS" (fun _ns tag -> make_element tag);
  set_field doc "createTextNode"
    (fun s ->
      let t = make_text () in
      set_field t "textContent" s;
      t);
  set_field doc "getElementById" (fun _id -> Js.null);
  set_field doc "fonts" (Js.Json.object_ (Js.Dict.empty ()));
  set_field doc "adoptedStyleSheets" (arr_of [||]);
  set_field doc "cookie" "";
  set_field doc "readyState" "complete";
  doc

let make_window doc =
  let w = make_element "#window" in
  set_field w "innerWidth" 1280;
  set_field w "innerHeight" 800;
  set_field w "devicePixelRatio" 1.;
  set_field w "scrollX" 0.;
  set_field w "scrollY" 0.;
  set_field w "location" (get_field global "location");
  set_field w "history" (get_field global "history");
  set_field w "document" doc;
  set_field w "localStorage" (get_field global "localStorage");
  set_field w "sessionStorage" (get_field global "sessionStorage");
  set_field w "matchMedia" (match_media ());
  set_field w "getComputedStyle" (fun _el -> computed_style ());
  set_field w "parseFloat" (get_field global "parseFloat");
  set_field w "open" (fun _url -> Js.null);
  set_field w "close" (fun () -> ());
  set_field w "scrollTo" (fun _x _y -> ());
  set_field w "scrollBy" (fun _x _y -> ());
  set_field w "requestAnimationFrame"
    (fun cb -> Js.Global.setTimeout ~f:(fun () -> cb 0.) 0);
  set_field w "cancelAnimationFrame" (fun _id -> ());
  set_field w "setTimeout" (fun f ms -> Js.Global.setTimeout ~f ms);
  set_field w "clearTimeout" (fun id -> Js.Global.clearTimeout id);
  set_field w "setInterval" (fun f ms -> Js.Global.setInterval ~f ms);
  set_field w "clearInterval" (fun id -> Js.Global.clearInterval id);
  set_field w "tablerIcons" (Js.Json.object_ (Js.Dict.empty ()));
  set_field w "top" w;
  set_field w "self" w;
  w

let install () =
  let doc = make_document () in
  document_ref := doc;
  set_field global "document" doc;
  set_field global "location" (location_obj ());
  set_field global "history" (history_obj ());
  set_field global "localStorage" (storage ());
  set_field global "sessionStorage" (storage ());
  let w = make_window doc in
  window_ref := w;
  set_field global "window" w;
  set_field global "MutationObserver" (observer_ctor ());
  set_field global "ResizeObserver" (observer_ctor ());
  set_field global "IntersectionObserver" (observer_ctor ());
  set_field global "getComputedStyle" (fun _el -> computed_style ());
  set_field global "matchMedia" (match_media ());
  set_field global "requestAnimationFrame"
    (fun cb -> Js.Global.setTimeout ~f:(fun () -> cb 0.) 0);
  set_field global "cancelAnimationFrame" (fun _id -> ());
  Ui_dom_web.install ();
  ()

(* -- test-side event firing -- *)

let document () = !document_ref
let window () = !window_ref

let fire_document ?(fields = []) name =
  ignore
    (dispatch_el !document_ref
       (make_event ~target:!document_ref ~fields name))

let fire_window ?(fields = []) name =
  ignore
    (dispatch_el !window_ref (make_event ~target:!window_ref ~fields name))

let fire_on ?(fields = []) el name =
  ignore (dispatch_el el (make_event ~target:el ~fields name))

let keydown ?(meta = false) ?(ctrl = false) ?(shift = false) key =
  fire_document ~fields:
    [ ("key", Js.Json.string key)
    ; ("metaKey", Js.Json.boolean meta)
    ; ("ctrlKey", Js.Json.boolean ctrl)
    ; ("shiftKey", Js.Json.boolean shift)
    ; ("altKey", Js.Json.boolean false)
    ]
    "keydown"

let click el = fire_on el "click"

(* find a stub element under `root` matching a compound selector *)
let find_el root sel = List.nth_opt (query_selector_all root sel) 0

(* install at module load: requires are emitted alphabetically and
   Melange__Stub_dom lands before the src modules (View, Model, Popups,
   Views) that dereference window/document during their own init -- the
   DOM globals must already exist when those modules evaluate *)
let () = install ()
