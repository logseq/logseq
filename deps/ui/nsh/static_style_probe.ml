(* Linked to the exact native application archives. These probes call public
   constructors/encoders; no application initialization or native window runs. *)
open Lui_protocol
let sites = ref []
let scalar value = Yojson.Safe.from_string (Lui_wire.encode_value value)
let property location value =
  let property,value=Ui_parts.Prop.to_wire value in
  sites := `Assoc ["location",`String location;"kind",`String "column";
    "props",`Assoc [Lui_wire_schema.property_name property,scalar value]] :: !sites
let element location view =
  let nodes=Hashtbl.create 8 in
  let backend={backend_profile=profile MacOS NshHost;apply_batch=(fun batch ->
    List.iter (function
      | CreateNode (id,kind) -> Hashtbl.replace nodes id (kind,ref [])
      | SetProp (id,key,value) -> let _,props=Hashtbl.find nodes id in
          props := (Lui_wire_schema.property_name key,scalar value) :: !props
      | _ -> ()) batch.ops;
    true)} in
  let app=Lui_app.create backend () (fun () () -> ()) (fun _ () _ -> view) in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    Hashtbl.iter (fun _ (kind,props) ->
      sites := `Assoc ["location",`String location;"kind",`String (Lui_wire_schema.node_kind_name kind);
        "props",`Assoc !props] :: !sites) nodes)
let finish () =
  let theme mode =
    let palette=Ui_theme.css_palette mode ~accent:"blue" in
    let snapshot=Ui_theme.snapshot mode in
    let values=Hashtbl.create 512 in
    List.iter (fun (name,value) -> Hashtbl.replace values name (`String value))
      (palette.root @ palette.body @ palette.application @ snapshot.vars);
    `Assoc ["mode",`String (match mode with Ui_theme.Light -> "light" | Dark -> "dark");
      "vars",`Assoc (Hashtbl.fold (fun key value values -> (key,value)::values) values [])] in
  Yojson.Safe.to_channel stdout (`Assoc ["themes",`List [theme Ui_theme.Light;theme Ui_theme.Dark];
    "sites",`List (List.rev !sites)]);
  output_char stdout '\n'
