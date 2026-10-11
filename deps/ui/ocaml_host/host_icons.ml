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

let install (payload : string) =
  match J.from_string payload with
  | `Assoc kvs ->
    List.iter
      (fun (name, v) ->
         match v with
         | `String s -> Hashtbl.replace svgs name s
         | _ -> ())
      kvs;
    Hashtbl.reset cache
  | _ -> ()

let count () = Hashtbl.length svgs

let icon_name store id =
  match Lui_store.string_prop store id "name" with
  | Some _ as n -> n
  | None -> Lui_store.string_prop store id "icon"

(* App-pushed SVGs win; then the builtin icon table; then the tabler
   children table — mirroring the gpui host's app_svg fallback, which
   builds the svg from the bundled tabler-children data for names the
   app never pushes (nav icons, page icons, toolbar glyphs). *)
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
