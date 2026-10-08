(* Read translation calls from the OCaml AST, including local aliases. *)
open Parsetree

let translation_functions =
  [ "I18n.t"; "I18n.tf"; "I18n.t1"; "Electron_i18n.t" ]

let rec identifier_name = function
  | Longident.Lident name -> Some name
  | Longident.Ldot (parent, name) ->
      Option.map (fun prefix -> prefix ^ "." ^ name.txt) (identifier_name parent.txt)
  | Longident.Lapply _ -> None

let identifier expression =
  match expression.pexp_desc with
  | Pexp_ident name -> identifier_name name.txt
  | _ -> None

let string_literal expression =
  match expression.pexp_desc with
  | Pexp_constant { pconst_desc = Pconst_string (value, _, _); _ } ->
      Some value
  | _ -> None

let json_string output value =
  output_char output '"';
  String.iter
    (function
      | '"' -> output_string output "\\\""
      | '\\' -> output_string output "\\\\"
      | '\n' -> output_string output "\\n"
      | '\r' -> output_string output "\\r"
      | '\t' -> output_string output "\\t"
      | c when Char.code c < 32 ->
          Printf.fprintf output "\\u%04x" (Char.code c)
      | c -> output_char output c)
    value;
  output_char output '"'

let scan_file path =
  let channel = open_in_bin path in
  let lexbuf = Lexing.from_channel channel in
  Location.init lexbuf path;
  let source =
    Fun.protect ~finally:(fun () -> close_in channel)
      (fun () ->
        try Parse.implementation lexbuf with exception_ ->
          Printf.eprintf "Cannot parse OCaml: %s\n" path;
          Location.report_exception Format.err_formatter exception_;
          exit 1)
  in
  let references = ref [] in
  let add expression =
    Option.iter
      (fun key -> references := (path, key) :: !references)
      (string_literal expression)
  in
  (* Keep aliases scoped to their enclosing let expression or structure. *)
  let translation aliases expression =
    Option.fold ~none:false
      ~some:(fun name -> List.mem name translation_functions
                        || List.mem name aliases)
      (identifier expression)
  in
  let extend aliases bindings =
    let shadowed = ref [] in
    let collector =
      { Ast_iterator.default_iterator with
        pat = (fun iterator pattern ->
          (match pattern.ppat_desc with
           | Ppat_var name -> shadowed := name.txt :: !shadowed
           | _ -> ());
          Ast_iterator.default_iterator.pat iterator pattern) }
    in
    List.iter (fun binding -> collector.pat collector binding.pvb_pat) bindings;
    List.fold_left
      (fun names binding ->
        match binding.pvb_pat.ppat_desc with
        | Ppat_var name when translation aliases binding.pvb_expr -> name.txt :: names
        | _ -> names)
      (List.filter (fun name -> not (List.mem name !shadowed)) aliases)
      bindings
  in
  let rec walk aliases : Ast_iterator.iterator =
    { Ast_iterator.default_iterator with
      expr = (fun iterator expression ->
        match expression.pexp_desc with
        | Pexp_let (_, bindings, body) ->
            List.iter (iterator.value_binding iterator) bindings;
            let nested = walk (extend aliases bindings) in
            nested.expr nested body
        | Pexp_apply (fn, (_, argument) :: _) when translation aliases fn ->
            add argument;
            Ast_iterator.default_iterator.expr iterator expression
        | _ -> Ast_iterator.default_iterator.expr iterator expression);
      structure = (fun _ items ->
        let rec loop names = function
          | [] -> ()
          | item :: rest ->
              let iterator = walk names in
              iterator.structure_item iterator item;
              let names =
                match item.pstr_desc with
                | Pstr_value (_, bindings) -> extend names bindings
                | _ -> names
              in
              loop names rest
        in
        loop aliases items) }
  in
  let iterator = walk [] in
  iterator.structure iterator source;
  List.rev !references

let () =
  let references =
    Array.to_list Sys.argv |> List.tl |> List.concat_map scan_file
  in
  output_char stdout '[';
  List.iteri
    (fun index (path, key) ->
      if index > 0 then output_char stdout ',';
      output_char stdout '[';
      json_string stdout path;
      output_char stdout ',';
      json_string stdout key;
      output_char stdout ']')
    references;
  output_string stdout "]\n"
