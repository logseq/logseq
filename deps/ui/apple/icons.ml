(* ported from deps/ui/src/core/icons.ml *)
(* Icons — mirrors shui icon v2 (`logseq.shui.icon.v2/root`).

   `window.tablerIcons` (resources/js/tabler.ext.js, Logseq's custom icon
   pack) holds factory functions returning React-element-shaped objects via
   the index.html shim; we walk that object tree into logseq-* elements
   (svg/path/...) so the glyphs stay identical to the cljs SVG output.

   Names not in the pack fall back to font icons exactly like cljs
   `font-icon`: `tie tie-<name>` for tabler-extension names, `ti ti-<name>`
   otherwise (kebab-cased, matching csk/->PascalCase in reverse). *)

module D = Logseq_dom

(* custom icon pack is a JS bundle — none on native; all names fall
   through to tabler children data or font-icon class fallbacks *)
let tabler_icons () :
    (Js.Json.t -> Js.Json.t) Js.Dict.t option =
  None

(* shui v2 tabler-extension-icon-names *)
let tie_names =
  [ "add-link"; "app-feature"; "block"; "block-search"; "cloud-exclamation"
  ; "connector"; "group"; "h-auto"; "heading-off"; "internal-link"
  ; "link-to-block"; "link-to-page"; "link-to-whiteboard"
  ; "move-to-sidebar-right"; "new-block"; "new-page"; "new-whiteboard"
  ; "new-whiteboard-element"; "object-compact"; "object-expanded"
  ; "open-as-page"; "page"; "page-search"; "references-hide"
  ; "references-show"; "select-cursor"; "text"; "ungroup"; "whiteboard"
  ; "whiteboard-element"; "whiteboard-search" ]
;;

let pascal name =
  (* csk/->PascalCase: "pageRef" -> "PageRef", "calendar-dots" ->
     "CalendarDots", "h-1" -> "H1" *)
  let b = Buffer.create (String.length name) in
  let up = ref true in
  String.iter
    (fun c ->
      if c = '-' || c = '_' || c = ' ' then up := true
      else if !up then (Buffer.add_char b (Char.uppercase_ascii c); up := false)
      else Buffer.add_char b c)
    name;
  Buffer.contents b
;;

let kebab name =
  (* csk/->kebab-case: separators and lower->upper boundaries become '-';
     collapsing repeats, no leading dash *)
  let b = Buffer.create (String.length name + 4) in
  let prev_dash = ref true in
  String.iter
    (fun c ->
      if c = ' ' || c = '_' || c = '-' then (
        if not !prev_dash then Buffer.add_char b '-';
        prev_dash := true)
      else (
        (if c >= 'A' && c <= 'Z' then (
           if not !prev_dash then Buffer.add_char b '-';
           Buffer.add_char b (Char.lowercase_ascii c))
         else Buffer.add_char b c);
        prev_dash := false))
    name;
  Buffer.contents b
;;

let string_of_prop v =
  match Js.Json.decodeString v with
  | Some s -> Some s
  | None -> (
      match Js.Json.decodeNumber v with
      | Some n -> Some (Printf.sprintf "%g" n)
      | None -> None)
;;

let attr_of (k, v) =
  if k = "children" || k = "key" || k = "ref" then None
  else
    (* SVG attrs are case-sensitive: viewBox stays verbatim *)
    let name =
      match k with
      | "className" -> "class"
      | "viewBox" -> "viewBox"
      | _ -> kebab k
    in
    Option.map (fun s -> (name, s)) (string_of_prop v)
;;

(* react-element object -> logseq-* element tree *)
let rec els_of_react (v : Js.Json.t) : Lui_elements.t list =
  match Js.Json.decodeObject v with
  | Some obj -> element_el obj
  | None -> (
      match Js.Json.decodeArray v with
      | Some arr -> List.concat_map els_of_react (Array.to_list arr)
      | None -> (
          match Js.Json.decodeString v with
          | Some s when String.trim s <> "" -> [ D.dom ~tag:"span" ~text:s [] ]
          | _ -> []))

and element_el obj : Lui_elements.t list =
  let tag = Option.bind (Js.Dict.get obj "type") Js.Json.decodeString in
  let props =
    match Option.bind (Js.Dict.get obj "props") Js.Json.decodeObject with
    | Some p -> p
    | None -> Js.Dict.empty ()
  in
  let attrs = List.filter_map attr_of (Array.to_list (Js.Dict.entries props)) in
  let children =
    match Js.Dict.get props "children" with
    | Some c -> els_of_react c
    | None -> []
  in
  match tag with
  | Some t -> [ D.dom ~tag:t ~attrs children ]
  | None -> children (* Fragment / non-string type: splice children *)
;;

let icon_props size =
  let d = Js.Dict.empty () in
  Js.Dict.set d "size" (Js.Json.number size);
  Js.Json.object_ d
;;

(* Some <svg tree> when the custom pack defines Icon<Pascal name> *)
let ext_svg ?(size = 18.) name =
  match tabler_icons () with
  | None -> None
  | Some dict -> (
      match Js.Dict.get dict ("Icon" ^ pascal name) with
      | Some f -> (
          match els_of_react (f (icon_props size)) with
          | [] -> None
          | els -> Some els)
      | None -> None)
;;

(* @tabler/icons-react svg attrs (size -> width/height) *)
let tabler_svg_attrs ~size ~filled name cls : (string * string) list =
  let base =
    if filled then
      [ ("fill", "currentColor"); ("stroke", "none") ]
    else
      [ ("fill", "none")
      ; ("stroke", "currentColor")
      ; ("stroke-width", "2")
      ; ("stroke-linecap", "round")
      ; ("stroke-linejoin", "round") ]
  in
  [ ("xmlns", "http://www.w3.org/2000/svg")
  ; ("width", Printf.sprintf "%g" size)
  ; ("height", Printf.sprintf "%g" size)
  ; ("viewBox", "0 0 24 24") ]
  @ base @ [ ("class", "tabler-icon tabler-icon-" ^ name ^ cls) ]

let is_filled name = String.ends_with ~suffix:"-filled" name

let base_svg ~size ?(cls = "") name : Lui_elements.t list =
  (* the tabler children data is kebab-keyed; callers pass cljs icon
     names verbatim (camelCase or spaced), so normalize first *)
  let n = kebab name in
  match Icon_tabler_data.tabler_children n with
  | [] -> []
  | kids ->
      [ D.dom ~tag:"svg"
          ~attrs:(tabler_svg_attrs ~size ~filled:(is_filled n) n (" " ^ cls))
          (List.map
             (fun (tag, attrs) -> D.dom ~tag ~attrs [])
             kids) ]
;;

(* equivalent of (shui/tabler-icon name) *)
let icon ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  let cls = if cls = "" then "" else " " ^ cls in
  match ext_svg ~size name with
  | Some els ->
      D.dom ~tag:"span" ~style_class:("ui__icon ti ls-icon-" ^ name ^ cls) els
  | None -> (
      match base_svg ~size name with
      | (_ :: _) as els ->
          D.dom ~tag:"span" ~style_class:("ui__icon ti ls-icon-" ^ name ^ cls)
            els
      | [] ->
          (* cljs font-icon keeps the raw name in the glyph class *)
          let prefix =
            if List.mem (kebab name) tie_names then "tie tie-"
            else "ti ti-"
          in
          D.dom ~tag:"span" ~style_class:("ui__icon " ^ prefix ^ name ^ cls)
            [])
;;

(* raw icon svg without the ui__icon span wrapper — cljs renders the
   svg directly where the call site already provides positioning (e.g.
   submenu chevrons) *)
let raw ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  match ext_svg ~size name with
  | Some (el :: _) -> el
  | Some [] | None -> (
      match base_svg ~size ~cls name with
      | el :: _ -> el
      | [] -> D.dom ~tag:"i" ~style_class:("ti ti-" ^ kebab name) [])

(* bare font glyph without the ui__icon wrapper (existing call sites) *)
let font name = D.dom ~tag:"i" ~style_class:("ti ti-" ^ kebab name) []
