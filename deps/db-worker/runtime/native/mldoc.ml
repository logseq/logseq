(* Native implementation of spec/platform/mldoc.mli, bound directly to the
   OCaml "mldoc" library — the same library the npm bundle wraps
   (mldoc/js/lib.ml).  Error-fallback semantics mirror js/lib.ml exactly:
   the same strings are returned where it returns strings.

   Internal modules are reached through the library's Mldoc__ alias module
   (as mldoc's own js/dune does with -open Mldoc__) because this file's own
   module name shadows the library's public [Mldoc] module. *)

open Angstrom

exception Mldoc_error of string

let ast_to_json ast = Mldoc__.Type.blocks_to_yojson ast |> Yojson.Safe.to_string

let generate backend ?refs config doc output =
  let export = Mldoc__.Exporter.Exporters.find backend in
  Mldoc__.Exporter.Exporters.run export ~refs config doc output

(* Any exception escaping the library surfaces as Mldoc_error — the same
   contract the Melange implementation produces for JS-side failures. *)
let call f =
  try f () with e -> raise (Mldoc_error (Printexc.to_string e))

(* js/lib.ml captures the exporter's writes to stdout into a Buffer via a
   channel flusher; on native the exporter takes an out_channel, so a temp
   file plays the same role. *)
let export_to_string f config doc =
  let tmp = Filename.temp_file "mldoc" ".out" in
  Fun.protect
    ~finally:(fun () -> if Sys.file_exists tmp then Sys.remove tmp)
    (fun () ->
      let oc = open_out_bin tmp in
      Fun.protect
        ~finally:(fun () -> close_out_noerr oc)
        (fun () -> f config doc oc);
      let ic = open_in_bin tmp in
      Fun.protect
        ~finally:(fun () -> close_in_noerr ic)
        (fun () -> really_input_string ic (in_channel_length ic)))

let parse_json ~content ~config:config_json =
  call (fun () ->
      let config_json = Yojson.Safe.from_string config_json in
      match Mldoc__.Conf.of_yojson config_json with
      | Ok config -> (
        try Mldoc__.Mldoc_parser.parse config content |> ast_to_json
        with error ->
          print_endline (Printexc.to_string error);
          content)
      | Error e -> "Config error: " ^ e)

let parse_inline_json ~text:input ~config:config_json =
  call (fun () ->
      let config_json = Yojson.Safe.from_string config_json in
      match Mldoc__.Conf.of_yojson config_json with
      | Ok config -> (
        match parse_string ~consume:All (Mldoc__.Inline.parse config) input with
        | Ok result ->
          Mldoc__.Type.inline_list_to_yojson result |> Yojson.Safe.to_string
        | Error e ->
          print_endline e;
          input)
      | Error e -> "Config error: " ^ e)

let get_references ~text:input ~config:config_json =
  call (fun () ->
      let config_json = Yojson.Safe.from_string config_json in
      match Mldoc__.Conf.of_yojson config_json with
      | Ok config ->
        Mldoc__.Property.property_references config input
        |> Mldoc__.Type.inline_list_no_pos_to_yojson
        |> Yojson.Safe.to_string
      | Error e -> "Config error: " ^ e)

let ast_export_markdown ~ast:ast_json ~config:config_json ~references =
  call (fun () ->
      let ast = Yojson.Safe.from_string ast_json in
      let config_json = Yojson.Safe.from_string config_json in
      let references_json = Yojson.Safe.from_string references in
      match
        ( Mldoc__.Conf.of_yojson config_json
        , Mldoc__.Reference.of_yojson references_json
        , Mldoc__.Type.blocks_of_yojson ast )
      with
      | Ok config, Ok references, Ok ast ->
        let parse_blocks content =
          fst @@ List.split @@ Mldoc__.Mldoc_parser.parse config content
        in
        let parsed_embed_blocks =
          List.map
            (fun (k, (content_include_children, content)) ->
              (k, (parse_blocks content_include_children, parse_blocks content)))
            references.Mldoc__.Reference.embed_blocks
        in
        let parsed_embed_pages =
          List.map
            (fun (k, v) -> (k, parse_blocks v))
            references.Mldoc__.Reference.embed_pages
        in
        let refs : Mldoc__.Reference.parsed_t =
          { Mldoc__.Reference.parsed_embed_blocks
          ; parsed_embed_pages }
        in
        let document = Mldoc__.Document.from_ast None ast in
        export_to_string (generate "markdown" ~refs) config document
      | Error error, _, _ -> "json->config err: " ^ error
      | _, Error error, _ -> "json->references err: " ^ error
      | _, _, Error error -> "json->ast err: " ^ error)
