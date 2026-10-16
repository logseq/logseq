(* Icon resolution for the paint image_of hook.

   The app pushes one "app-icons" envelope at boot on the native
   boot: {name: svg-source}. The paint pass reaches us with the node's
   "name"/"icon" prop and we rasterize lazily per (name, size) —
   Lui_svg.render already yields premultiplied scene images. *)

module J = Yojson.Safe

let svgs : (string, string) Hashtbl.t = Hashtbl.create 256

(* (name, w, h) -> rendered image; entries that fail to parse keep a
   negative cache so a bad icon can't re-fail every frame. *)
let cache :
    (string * int * int * Lui_scene.color option, Lui_scene.image option)
    Hashtbl.t =
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
    Hashtbl.reset svgs;
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
  | None -> (match Lui_store.string_prop store id "icon" with
    | Some _ as name -> name
    | None -> (match Lui_store.kind store id with
      | "select" | "combobox" -> Some "chevron-down"
      | _ -> None))

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
  | None ->
      let resolved = match List.assoc_opt name Host_builtin_icons.all with
        | Some _ as s -> s
        | None -> (
            match Icon_tabler_data.tabler_children name with
            | [] -> None
            | kids -> Some (Icons.svg_of_children ~size:24. name kids)) in
      Option.iter (fun svg -> Hashtbl.add svgs name svg) resolved;
      resolved

(* Effective icon color — web SVGs paint currentColor from the
   inherited CSS color property; here the node (or its nearest
   ancestor's) `foreground` prop plays that role, with the theme
   foreground token as fallback. *)
let effective_fg_css store id =
  let rec walk id =
    match Lui_store.string_prop store id "foreground" with
    | Some _ as c -> c
    | None -> (
      match Lui_store.parent store id with
      | Some p -> walk p
      | None -> None)
  in
  match Lui_store.kind store id with
  | "select" | "combobox" -> Some "muted-foreground"
  | _ -> (match walk id with Some _ as c -> c | None -> Some "foreground")

let index_sub s sub =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then None
    else if String.sub s i m = sub then Some i
    else go (i + 1)
  in
  go 0

(* Inject color="<css>" on the root <svg> tag so stroke/fill=
   "currentColor" (tabler glyphs, pushed app icons) resolves to the
   element's foreground; a root-level color attribute is kept. *)
let with_color src css =
  match index_sub src "<svg" with
  | None -> src
  | Some i -> (
    try
      let gt = String.index_from src i '>' in
      let tag = String.sub src i (gt - i) in
      match index_sub tag "color=" with
      | Some _ -> src
      | None ->
        String.sub src 0 gt
        ^ " color=\"" ^ css ^ "\""
        ^ String.sub src gt (String.length src - gt)
    with Not_found -> src)

(* debug: resolution status for tree dumps — "ok:<name>" when an svg
   matches, "miss:<name>" when nothing does. *)
let resolved_name store id =
  match icon_name store id with
  | None -> None
  | Some name -> (
    match svg_of name with
    | Some _ -> Some ("ok:" ^ name)
    | None -> Some ("miss:" ^ name))

let svg_image_of store scale id r : Lui_scene.image option =
  match icon_name store id with
  | None -> None
  | Some name -> (
      match svg_of name with
      | None -> None
      | Some src0 ->
        let fg_css = effective_fg_css store id in
        let color =
          match fg_css with
          | Some css -> Theme_vars.color_of css
          | None -> None
        in
        let src =
          match color with
          | Some { Lui_scene.r; g; b; _ } ->
            with_color src0 (Printf.sprintf "rgb(%d,%d,%d)" r g b)
          | None -> src0
        in
        let w =
          max 1 (int_of_float (Float.ceil (r.Lui_scene.w *. scale)))
        and h =
          max 1 (int_of_float (Float.ceil (r.Lui_scene.h *. scale)))
        in
        let key = (name, w, h, color) in
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

(* Mounted nodes retain their image. A separately bounded resource cache
   avoids decoding small shared assets again when a surface remounts. *)
let file_images : (int, string * Lui_scene.image) Hashtbl.t = Hashtbl.create 8
let file_store = ref None
let file_revision = ref (-1)

let prune_file_images store =
  let revision = Lui_store.revision store in
  if
    (match !file_store with Some owner -> owner == store | None -> false)
    && revision = !file_revision
  then ()
  else begin
    (match !file_store with
    | Some owner when owner == store -> ()
    | _ -> Hashtbl.clear file_images);
    file_store := Some store;
    file_revision := revision;
    Hashtbl.filter_map_inplace
      (fun id ((path, _) as entry) ->
        if
          Lui_store.mem store id
          && Lui_store.kind store id = "file-image"
          && Lui_store.string_prop store id "path" = Some path
        then Some entry
        else None)
      file_images
  end

let asset_path path =
  if not (Filename.is_relative path) then path
  else
    let root =
      match Sys.getenv_opt "LOGSEQ_NATIVE_ASSET_DIR" with
      | Some "" -> invalid_arg "LOGSEQ_NATIVE_ASSET_DIR must not be empty"
      | Some path -> path
      | None ->
          Filename.concat (Filename.dirname Sys.executable_name) "../Resources"
    in
    Filename.concat root path

let decode_png encoded =
  let decoded =
    ImageLib.PNG.parsefile (ImageUtil.chunk_reader_of_string encoded)
  in
  let pixels = Bytes.create (decoded.width * decoded.height * 4) in
  let channel value =
    ((value * 255) + (decoded.max_val / 2)) / decoded.max_val
  in
  for y = 0 to decoded.height - 1 do
    for x = 0 to decoded.width - 1 do
      Image.read_rgba decoded x y (fun r g b a ->
          let a = channel a and at = ((y * decoded.width) + x) * 4 in
          let premultiply value = ((channel value * a) + 127) / 255 in
          Bytes.set_uint8 pixels at (premultiply r);
          Bytes.set_uint8 pixels (at + 1) (premultiply g);
          Bytes.set_uint8 pixels (at + 2) (premultiply b);
          Bytes.set_uint8 pixels (at + 3) a)
    done
  done;
  Lui_scene.new_image ~w:decoded.width ~h:decoded.height pixels

let file_resources : ((string * string) * Lui_scene.image) list ref = ref []
let file_resource_budget = 1024 * 1024
let file_resource_entries = 32

let file_image path =
  let encoded = In_channel.with_open_bin path In_channel.input_all in
  let key = (path, Digest.string encoded) in
  match List.assoc_opt key !file_resources with
  | Some image -> image
  | None ->
      let image = decode_png encoded in
      if Bytes.length image.Lui_scene.ipix <= file_resource_budget then begin
        let rec retain budget entries = function
          | [] -> []
          | (_, resource_image) :: _
            when entries = 0
                 || Bytes.length resource_image.Lui_scene.ipix > budget ->
              []
          | ((_, resource_image) as resource) :: rest ->
              resource
              :: retain
                   (budget - Bytes.length resource_image.Lui_scene.ipix)
                   (entries - 1) rest
        in
        file_resources :=
          retain file_resource_budget file_resource_entries
            ((key, image) :: !file_resources)
      end;
      image

let image_of store scale id r =
  prune_file_images store;
  if Lui_store.kind store id <> "file-image" then svg_image_of store scale id r
  else
    match Lui_store.string_prop store id "path" with
    | None -> None
    | Some path -> (
        match Hashtbl.find_opt file_images id with
        | Some (cached, image) when cached = path -> Some image
        | _ ->
            let image = file_image (asset_path path) in
            Hashtbl.replace file_images id (path, image);
            Some image)
