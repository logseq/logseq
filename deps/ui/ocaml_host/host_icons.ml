(* Icon resolution for the paint image_of hook.

   The app pushes one "app-icons" envelope at boot on the native
   boot: {name: svg-source}. The paint pass reaches us with the node's
   "name"/"icon" prop and we rasterize lazily per (name, size) —
   Lui_svg.render already yields premultiplied scene images. *)

module J = Yojson.Safe

let svgs : (string, string) Hashtbl.t = Hashtbl.create 256

(* (name, w, h) -> rendered image; entries that fail to parse keep a
   negative cache so a bad icon can't re-fail every frame. *)
let cache : (string * int * int, Lui_scene.image option) Hashtbl.t =
  Hashtbl.create 256

(* the app pushes data URIs ("data:image/svg+xml,<percent-encoded>");
   Lui_svg.parse wants the raw document *)
let svg_payload (s : string) =
  let prefix = "data:image/svg+xml," in
  let n = String.length s and pn = String.length prefix in
  if n <= pn || String.sub s 0 pn <> prefix then s
  else
    let body = String.sub s pn (n - pn) in
    let buf = Buffer.create (String.length body) in
    let rec dec i =
      if i < String.length body then
        match body.[i] with
        | '%' when i + 2 < String.length body ->
          (match
             int_of_string_opt ("0x" ^ String.sub body (i + 1) 2)
           with
           | Some c -> Buffer.add_char buf (Char.chr c); dec (i + 3)
           | None -> Buffer.add_char buf '%'; dec (i + 1))
        | '+' -> Buffer.add_char buf ' '; dec (i + 1)
        | c -> Buffer.add_char buf c; dec (i + 1)
    in
    dec 0;
    Buffer.contents buf

let install (payload : string) =
  match J.from_string payload with
  | `Assoc kvs ->
    List.iter
      (fun (name, v) ->
         match v with
         | `String s -> Hashtbl.replace svgs name (svg_payload s)
         | _ -> ())
      kvs;
    Hashtbl.reset cache
  | _ -> ()

let count () = Hashtbl.length svgs

let icon_name store id =
  match Lui_store.string_prop store id "name" with
  | Some _ as n -> n
  | None -> Lui_store.string_prop store id "icon"

(* App-pushed SVGs win; then the builtin icon table (name-only icon
   kinds); then the in-process tabler-children table — the boot
   app-icons envelope only carries the custom/status/priority set, so
   tabler names are rasterized from the same source the web's
   app_icons() registry uses. *)
let svg_of name =
  let name =
    if String.length name > 4 && String.sub name 0 4 = "app:" then
      String.sub name 4 (String.length name - 4)
    else name
  in
  match Hashtbl.find_opt svgs name with
  | Some _ as s -> s
  | None -> (
      match List.assoc_opt name Host_builtin_icons.all with
      | Some _ as s -> s
      | None -> (
          match Icon_tabler_data.tabler_children name with
          | [] -> None
          | kids -> Some (Icons.svg_of_children ~size:24. name kids)))

(* debug: resolution status for tree dumps — "ok:<name>" when an svg
   matches, "miss:<name>" when nothing does. *)
let resolved_name store id =
  match icon_name store id with
  | None -> None
  | Some name -> (
    match svg_of name with
    | Some _ -> Some ("ok:" ^ name)
    | None -> Some ("miss:" ^ name))

let image_of store scale id r : Lui_scene.image option =
  match icon_name store id with
  | None -> None
  | Some name -> (
      match svg_of name with
      | None -> None
      | Some src ->
        let w =
          max 1 (int_of_float (Float.ceil (r.Lui_scene.w *. scale)))
        and h =
          max 1 (int_of_float (Float.ceil (r.Lui_scene.h *. scale)))
        in
        let key = (name, w, h) in
        match Hashtbl.find_opt cache key with
        | Some hit -> hit
        | None ->
          let rendered =
            match Lui_svg.render src ~w ~h with
            | Ok img -> Some img
            | Error _ -> None
          in
          Hashtbl.replace cache key rendered;
          rendered)
