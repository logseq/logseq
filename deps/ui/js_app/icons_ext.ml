(* Web adapter for the `window.tablerIcons` extension pack — walks the
   react-element descriptors and serializes them to data-URI svgs for
   [Icons.app_icons ~ext]. Browser-only: lives in the js_app target. *)

external tabler_icons_u : (Js.Json.t -> Js.Json.t) Js.Dict.t Js.Undefined.t
  = "tablerIcons"
  [@@mel.scope "window"]

let string_of_prop v =
  match Js.Json.decodeString v with
  | Some s -> Some s
  | None -> (
      match Js.Json.decodeNumber v with
      | Some n -> Some (Printf.sprintf "%g" n)
      | None -> None)

let attr_of (k, v) =
  if k = "children" || k = "key" || k = "ref" then None
  else
    (* SVG attrs are case-sensitive: viewBox stays verbatim *)
    let name =
      match k with
      | "className" -> "class"
      | "viewBox" -> "viewBox"
      | _ -> Icons.kebab k
    in
    Option.map (fun s -> (name, s)) (string_of_prop v)

let icon_props size =
  let d = Js.Dict.empty () in
  Js.Dict.set d "size" (Js.Json.number size);
  Js.Json.object_ d

(* Serialize a react-element tree back to svg markup. *)
let rec markup_of_react (v : Js.Json.t) : string =
  match Js.Json.decodeObject v with
  | Some obj -> element_markup obj
  | None -> (
      match Js.Json.decodeArray v with
      | Some arr ->
          String.concat "" (List.map markup_of_react (Array.to_list arr))
      | None -> (
          match Js.Json.decodeString v with
          | Some s -> s
          | None -> ""))

and element_markup obj : string =
  let tag =
    match Option.bind (Js.Dict.get obj "type") Js.Json.decodeString with
    | Some t -> t
    | None -> ""
  in
  let props =
    match Option.bind (Js.Dict.get obj "props") Js.Json.decodeObject with
    | Some p -> p
    | None -> Js.Dict.empty ()
  in
  let attrs =
    List.filter_map attr_of (Array.to_list (Js.Dict.entries props))
    |> List.map (fun (k, v) -> Printf.sprintf " %s=\"%s\"" k v)
    |> String.concat ""
  in
  let children =
    match Js.Dict.get props "children" with
    | Some c -> markup_of_react c
    | None -> ""
  in
  if tag = "" then children
  else Printf.sprintf "<%s%s>%s</%s>" tag attrs children tag

let app_icons () : (string * string) list =
  match Js.Undefined.toOption tabler_icons_u with
  | None -> []
  | Some dict ->
      Array.to_list (Js.Dict.keys dict)
      |> List.filter_map (fun key ->
             if String.starts_with ~prefix:"Icon" key then
               match Js.Dict.get dict key with
               | Some f ->
                   let name =
                     Icons.kebab (String.sub key 4 (String.length key - 4))
                   in
                   Some
                     ( name
                     , Icons.data_uri_of_svg
                         (markup_of_react (f (icon_props 24.))) )
               | None -> None
             else None)
