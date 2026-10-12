let groups =
  [ "editor_outliner", [ "editor_basic"; "outliner_basic"; "undo_redo"; "reference_basic"; "cmdk_scroll_basic" ];
    "properties_tags", [ "bidirectional_properties"; "block_property_basic"; "property_basic"; "property_config_basic"; "property_scoped_choices"; "tag_basic" ];
    "commands_views", [ "commands_basic"; "query_builder_basic"; "query_results_basic"; "view_basic"; "library_basic"; "flashcards_basic" ];
    "navigation", [ "graph"; "graph_navigation_basic"; "left_sidebar_basic"; "multi_tabs"; "right_sidebar" ];
    "assets_rtc", [ "assets_basic"; "import_basic"; "export_basic"; "plugins_basic"; "plugins_marketplace"; "rtc_basic"; "rtc_extra"; "rtc_extra_part2" ] ]

let str s = `String s
let strings xs = `List (List.map str xs)
let source name = "ocaml-e2e/test/test_" ^ name ^ ".ml"
let target name = "native-e2e/tests/test_" ^ name ^ ".ml"

let registrations path =
  let open Parsetree in
  let channel = open_in path in
  let lexbuf = Lexing.from_channel channel in
  Location.init lexbuf path;
  let tree = Fun.protect ~finally:(fun () -> close_in channel)
      (fun () -> Parse.implementation lexbuf) in
  let identifier expression =
    match expression.pexp_desc with
    | Pexp_ident { txt; _ } -> Some (Longident.flatten txt |> String.concat ".")
    | _ -> None
  in
  let binding_name vb = match vb.pvb_pat.ppat_desc with
    | Ppat_var name -> Some name.txt | _ -> None in
  let wrappers = List.concat_map (fun item -> match item.pstr_desc with
      | Pstr_value (_, bindings) -> List.filter_map (fun vb ->
          match binding_name vb, vb.pvb_expr.pexp_desc with
          | Some name, Pexp_function (param :: _, _, _) ->
            (match param.pparam_desc with
             | Pparam_val (Asttypes.Nolabel, None, { ppat_desc = Ppat_var argument; _ }) ->
               let found = ref false in
               let iter = { Ast_iterator.default_iterator with expr = (fun self expr ->
                   (match expr.pexp_desc with
                    | Pexp_apply (fn, (_, arg) :: _) when identifier fn = Some "Fest.Promise.test" && identifier arg = Some argument.txt -> found := true
                    | _ -> ());
                   Ast_iterator.default_iterator.expr self expr) } in
               iter.expr iter vb.pvb_expr;
               if !found then Some (name, argument.txt, vb.pvb_loc) else None
             | _ -> None)
          | _ -> None) bindings
      | _ -> []) tree in
  let names = List.map (fun (name, _, _) -> name) wrappers in
  let dynamic_argument = ref None and registrations = ref [] in
  let reject expr reason = failwith (Printf.sprintf "%s:%d: %s"
      path expr.pexp_loc.loc_start.pos_lnum reason) in
  let iter = { Ast_iterator.default_iterator with
    value_binding = (fun self vb ->
        let previous = !dynamic_argument in
        (match binding_name vb with
         | Some name when List.mem name names ->
           (match List.find_opt (fun (alias, _, loc) -> alias = name && loc = vb.pvb_loc) wrappers with
            | Some (_, argument, _) -> dynamic_argument := Some argument
            | None -> reject vb.pvb_expr "Shadowed registration wrapper")
         | _ -> ());
        Ast_iterator.default_iterator.value_binding self vb;
        dynamic_argument := previous);
    expr = (fun self expr ->
        match expr.pexp_desc with
        | Pexp_apply (fn, args) when identifier fn = Some "Fest.Promise.test" ||
            Option.fold ~none:false ~some:(fun name -> List.mem name names) (identifier fn) ->
          (match args with
           | (_, name) :: _ :: _ ->
             (match name.pexp_desc with
              | Pexp_constant { pconst_desc = Pconst_string (value, _, _); _ } ->
                if String.trim value = "" then reject expr "Empty test name";
                registrations := (value, expr.pexp_loc.loc_start.pos_lnum) :: !registrations
              | _ when identifier fn = Some "Fest.Promise.test" && !dynamic_argument <> None && identifier name = !dynamic_argument -> ()
              | _ -> reject expr "Dynamic registration needs explicit inventory support")
           | _ -> reject expr "Partial registration needs explicit inventory support");
          List.iter (fun (_, arg) -> self.expr self arg) args
        | Pexp_ident _ when identifier expr = Some "Fest.Promise.test" ->
          reject expr "Indirect registration alias needs explicit inventory support"
        | _ -> Ast_iterator.default_iterator.expr self expr)
  } in
  iter.structure iter tree;
  if !registrations = [] then failwith ("No registered tests in " ^ path);
  List.rev !registrations

let () =
  let root = if Array.length Sys.argv > 2 then Sys.argv.(2) else ".." in
  let all = List.concat_map (fun (_, names) -> List.map source names) groups in
  let actual = Sys.readdir (Filename.concat root "ocaml-e2e/test") |> Array.to_list
    |> List.filter (fun f -> String.starts_with ~prefix:"test_" f && Filename.check_suffix f ".ml")
    |> List.map (fun f -> "ocaml-e2e/test/" ^ f) |> List.sort String.compare in
  if List.length all <> 30 || List.sort_uniq String.compare all <> List.sort String.compare all
     || List.sort String.compare all <> actual then
    failwith "Expected exactly 30 upstream files, each owned once";
  let group_json = List.map (fun (name, files) ->
      `Assoc [ "name", str name; "source_files", strings (List.map source files);
               "owned_test_files", strings (List.map target files) ]) groups in
  let cases = List.concat_map (fun (group, files) -> List.concat_map (fun file ->
      let src = source file in
      registrations (Filename.concat root src)
      |> List.map (fun (name, line) ->
          `Assoc [ "id", str (src ^ "::" ^ name); "name", str name;
                   "source_file", str src; "line", `Int line; "group", str group;
                   "contract", str (if file = "graph" then "helper" else "desktop");
                   "target_file", str (target file) ])) files) groups in
  let ids = List.map (fun c -> Yojson.Safe.Util.(c |> member "id" |> to_string)) cases in
  if List.length ids <> List.length (List.sort_uniq String.compare ids) then failwith "Duplicate upstream case";
  let json = `Assoc [ "schema", `Int 1; "groups", `List group_json; "cases", `List cases ] in
  let path = Filename.concat root "native-e2e/upstream.json" in
  if Array.length Sys.argv > 1 && Sys.argv.(1) = "--write" then Yojson.Safe.to_file path json
  else if Yojson.Safe.from_file path <> json then failwith "Inventory drift: regenerate and review mappings";
  Printf.printf "Inventory verified: %d registrations, 30 files, 5 exclusive groups\n%!" (List.length cases)
