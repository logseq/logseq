(* Derive boxed C prototypes from the actual native OCaml external bindings.
   C compilation then rejects mismatched return types or argument counts. *)
let prototypes = Hashtbl.create 8

let boxed_arity declaration =
  if declaration.Parsetree.pval_attributes <> [] then
    Location.raise_errorf ~loc:declaration.pval_loc
      "Native primitive attributes require an explicit C ABI derivation";
  let rec count arity typ =
    if typ.Parsetree.ptyp_attributes <> [] then
      Location.raise_errorf ~loc:typ.ptyp_loc
        "Unboxed native primitive types require an explicit C ABI derivation";
    match typ.ptyp_desc with
    | Parsetree.Ptyp_arrow (_, argument, result) ->
        ignore (count 0 argument);
        count (arity + 1) result
    | _ -> arity
  in
  count 0 declaration.pval_type

let inspect path =
  let channel = open_in path in
  let source = Fun.protect ~finally:(fun () -> close_in channel) (fun () ->
    let lexbuf = Lexing.from_channel channel in
    Location.init lexbuf path;
    Parse.implementation lexbuf) in
  let iterator = {Ast_iterator.default_iterator with value_description =
    (fun _ declaration ->
      match declaration.Parsetree.pval_prim with
      | [] -> ()
      | [symbol] when not (String.starts_with ~prefix:"%" symbol) ->
          if not (String.for_all (function
            | 'a'..'z' | 'A'..'Z' | '0'..'9' | '_' -> true | _ -> false) symbol)
          then Location.raise_errorf ~loc:declaration.pval_loc "Invalid C primitive identifier";
          let arity = boxed_arity declaration in
          if arity = 0 then Location.raise_errorf ~loc:declaration.pval_loc
            "Native C primitive must have a function type";
          (match Hashtbl.find_opt prototypes symbol with
           | Some previous when previous <> arity ->
               Location.raise_errorf ~loc:declaration.pval_loc
                 "Conflicting OCaml arities for C primitive %s" symbol
           | _ -> Hashtbl.replace prototypes symbol arity)
      | symbol :: _ when String.starts_with ~prefix:"%" symbol -> ()
      | _ -> Location.raise_errorf ~loc:declaration.pval_loc
          "Native primitive calling conventions require an explicit C ABI derivation")
  } in
  iterator.structure iterator source

let () =
  try
    Array.iteri (fun index path -> if index > 0 then inspect path) Sys.argv;
    if Hashtbl.length prototypes = 0 then failwith "No native external bindings found";
    print_endline "#include <caml/mlvalues.h>";
    Hashtbl.to_seq prototypes |> List.of_seq
    |> List.sort (fun (a, _) (b, _) -> String.compare a b)
    |> List.iter (fun (symbol, arity) ->
      Printf.printf "CAMLprim value %s(%s);\n" symbol
        (String.concat ", " (List.init arity (fun _ -> "value"))))
  with error -> Location.report_exception Format.err_formatter error; exit 1
