(* Inspect the actual native compiler outputs, including resolved aliases and
   target branches. Emit probes that call the real, already typechecked encoders. *)
open Asttypes
open Typedtree

let probes = ref []
let dynamic = ref 0
let dynamic_properties = ref 0
let dynamic_optional_arguments = ref 0
let dynamic_required_arguments = ref 0
let constants = Hashtbl.create 128
let known = Hashtbl.create 128
let key = function Path.Pident id -> Ident.unique_name id | path -> Path.name path
let name expression = match expression.exp_desc with
  | Texp_ident (path,_,_) -> Path.name (Env.normalize_value_path None expression.exp_env path)
  | _ -> ""
let last name = match String.rindex_opt name '.' with
  | Some index -> String.sub name (index+1) (String.length name-index-1)
  | None -> name
let args expressions = List.filter_map (function _,Arg value -> Some value | _ -> None) expressions
let constructor expression = match expression.exp_desc with
  | Texp_construct (_,description,[]) -> Some description.Data_types.cstr_name
  | _ -> None
let host expression = match expression.exp_desc with
  | Texp_apply (fn,_) -> name fn = "Lui_ui.host"
  | _ -> false
let standard fn operation =
  let path=name fn in path="Stdlib." ^ operation || path="Stdlib.(" ^ operation ^ ")"
let rec boolean expression = match expression.exp_desc with
  | Texp_construct (_,description,[]) when description.Data_types.cstr_name = "true" -> Some true
  | Texp_construct (_,description,[]) when description.Data_types.cstr_name = "false" -> Some false
  | Texp_ident (path,_,_) -> Hashtbl.find_opt known (key path)
  | Texp_apply (fn,arguments) -> (match last (name fn),args arguments with
    | "not",[value] when standard fn "not" -> Option.map not (boolean value)
    | (("="|"<>") as operation),[left;right] when standard fn operation ->
        let compare left right = match host left,constructor right with
          | true,Some backend -> Some ((backend="NshHost") = (operation="="))
          | _ -> None in
        (match compare left right with Some _ as value -> value | None -> compare right left)
    | "&&",[left;right] when standard fn "&&" -> (match boolean left,boolean right with
        | Some false,_|_,Some false -> Some false | Some true,Some true -> Some true | _ -> None)
    | "||",[left;right] when standard fn "||" -> (match boolean left,boolean right with
        | Some true,_|_,Some true -> Some true | Some false,Some false -> Some false | _ -> None)
    | _ -> None)
  | _ -> None
(* Only immutable literal syntax is substituted. No user function is run and
   references, arrays, records, signals and arbitrary expressions stay dynamic. *)
let rec all_known transform = function
  | [] -> Some []
  | value::remaining -> Option.bind (transform value) (fun value ->
      Option.map (fun remaining -> value::remaining) (all_known transform remaining))
let max_literal_nodes = 512
let rec literal_with_budget remaining expression =
  let literal = literal_with_budget remaining in
  let with_desc exp_desc = Some {expression with exp_desc} in
  if !remaining = 0 then None else begin
  decr remaining;
  match expression.exp_desc with
  | Texp_ident (path,_,_) ->
      Option.bind (Hashtbl.find_opt constants (key path)) (fun (value,nodes) ->
        if nodes - 1 > !remaining then None
        else (remaining := !remaining - (nodes - 1); Some value))
  | Texp_constant _ -> Some expression
  | Texp_construct (name,description,values)
      when List.mem description.Data_types.cstr_name ["true";"false";"Some";"None";"[]";"::";"()"] ->
      Option.bind (all_known literal values) (fun values ->
        with_desc (Texp_construct (name,description,values)))
  | Texp_variant (_,None) -> Some expression
  | Texp_variant (label,Some value) -> Option.bind (literal value) (fun value ->
      with_desc (Texp_variant (label,Some value)))
  | Texp_tuple values ->
      Option.bind (all_known (fun (label,value) ->
        Option.map (fun value -> label,value) (literal value)) values) (fun values ->
          with_desc (Texp_tuple values))
  | Texp_apply (fn,arguments)
      when List.exists (standard fn) ["~-";"~-.";"~+";"~+."] ->
      Option.bind (all_known (function
        | label,Arg value -> Option.map (fun value -> label,Arg value) (literal value)
        | _,Omitted _ -> None) arguments) (fun arguments ->
          with_desc (Texp_apply (fn,arguments)))
  | _ -> None
  end
let resolve_literal expression =
  let remaining=ref max_literal_nodes in
  Option.map (fun value -> value,max_literal_nodes - !remaining)
    (literal_with_budget remaining expression)
let literal expression = Option.map fst (resolve_literal expression)
let bind binding = match binding.vb_pat.pat_desc with
  | Tpat_var (id,_,_) ->
      Option.iter (fun value -> Hashtbl.replace known (Ident.unique_name id) value)
        (boolean binding.vb_expr);
      Option.iter (fun value -> Hashtbl.replace constants (Ident.unique_name id) value)
        (resolve_literal binding.vb_expr)
  | _ -> ()
let code expression = Format.asprintf "%a" Pprintast.expression (Untypeast.untype_expression expression)
let location expression = let p=expression.exp_loc.loc_start in
  Printf.sprintf "%s:%d:%d" p.pos_fname p.pos_lnum (p.pos_cnum-p.pos_bol+1)
let property_helper name = String.starts_with ~prefix:"Ui_parts.Prop." name
let property expression =
  let call = match expression.exp_desc with
    | Texp_apply (fn,arguments) when property_helper (name fn) ->
        (match all_known literal (args arguments) with
         | Some values -> Some (name fn ^ " " ^ String.concat " "
             (List.map (fun value -> "(" ^ code value ^ ")") values))
         | None -> incr dynamic_properties; None)
    | Texp_ident _ when property_helper (name expression) ->
        (match Types.get_desc expression.exp_type with Types.Tconstr (_,[],_) -> Some (name expression) | _ -> None)
    | _ -> None in
  Option.iter (fun call -> probes := Printf.sprintf "property %S (%s);" (location expression) call :: !probes) call
let element expression = match expression.exp_desc with
  | Texp_apply (fn,arguments) when String.starts_with ~prefix:"Lui_elements." (name fn) ->
      let values = args (List.filter (fun (label,_) -> label=Nolabel) arguments) in
      let children = match values with [value] -> (match Types.get_desc value.exp_type with
        | Types.Tconstr (path,[_],_) -> Path.name path="list" | _ -> false) | _ -> false in
      let result = match Types.get_desc expression.exp_type with
        | Types.Tconstr (path,[],_) -> Path.name path="Lui_elements.t"
        | Types.Tarrow _ -> true
        | _ -> false in
      if children && result then begin
        let required = ref true and deferred = ref false in
        let labels = List.filter_map (function
          | Optional label,Arg argument ->
              (match literal argument with
               | Some {exp_desc=Texp_construct (_,description,[value]);_}
                   when description.Data_types.cstr_name="Some" ->
                   Some ("~" ^ label ^ ":(" ^ code value ^ ")")
               | Some {exp_desc=Texp_construct (_,description,[]);_}
                   when description.Data_types.cstr_name="None" -> None
               | _ -> deferred:=true; incr dynamic_optional_arguments; None)
          | Labelled label,Arg argument ->
              (match literal argument with
               | Some value -> Some ("~" ^ label ^ ":(" ^ code value ^ ")")
               | None -> required:=false; deferred:=true;
                   incr dynamic_required_arguments; None)
          | Labelled _,Omitted _ ->
              required:=false; deferred:=true; incr dynamic_required_arguments; None
          | _ -> None) arguments in
        if !deferred then incr dynamic;
        if !required then probes := Printf.sprintf "element %S (%s %s []);" (location expression)
          (name fn) (String.concat " " labels) :: !probes
      end
  | _ -> ()

let rec iterator = {Tast_iterator.default_iterator with
  expr=(fun self expression ->
    property expression; element expression;
    match expression.exp_desc with
    | Texp_ifthenelse (condition,yes,no) ->
        self.expr self condition;
        (match boolean condition with
         | Some true -> self.expr self yes
         | Some false -> Option.iter (self.expr self) no
         | None -> self.expr self yes; Option.iter (self.expr self) no)
    | Texp_let (_,bindings,body) ->
        List.iter (fun binding -> self.expr self binding.vb_expr; bind binding) bindings;
        self.expr self body
    | Texp_match (value,cases,effects,partial) when host value || boolean value <> None ->
        let rec matches pattern = match pattern.pat_desc with
          | Tpat_any | Tpat_var _ -> Some true
          | Tpat_alias (pattern,_,_,_,_) -> matches pattern
          | Tpat_or (left,right,_) -> (match matches left,matches right with
              | Some true,_|_,Some true -> Some true
              | Some false,Some false -> Some false | _ -> None)
          | Tpat_construct (_,description,[],_) ->
              Some (match boolean value with
                | Some expected -> description.Data_types.cstr_name=string_of_bool expected
                | None -> description.Data_types.cstr_name="NshHost")
          | _ -> None in
        let rec cases_to_visit = function
          | [] -> ()
          | case::remaining ->
              let pattern,_=Typedtree.split_pattern case.c_lhs in
              let accepted=Option.bind pattern matches in
              (match accepted with
               | Some false -> cases_to_visit remaining
               | _ ->
                   Option.iter (self.expr self) case.c_guard;
                   let guard=Option.bind case.c_guard boolean in
                   if guard<>Some false then self.expr self case.c_rhs;
                   if accepted<>Some true || (case.c_guard<>None && guard<>Some true)
                   then cases_to_visit remaining) in
        self.expr self value;
        ignore effects; ignore partial;
        cases_to_visit cases
    | _ -> Tast_iterator.default_iterator.expr self expression);
  structure_item=(fun self item ->
    Tast_iterator.default_iterator.structure_item self item;
    match item.str_desc with Tstr_value (_,bindings) -> List.iter bind bindings | _ -> ()) }

let inspect filename =
  Hashtbl.clear known;
  Hashtbl.clear constants;
  let info=Cmt_format.read_cmt filename in
  let absolute path = if Filename.is_relative path then Filename.concat info.cmt_builddir path else path in
  Load_path.init ~auto_include:Load_path.no_auto_include
    ~visible:(List.map absolute info.cmt_loadpath.visible)
    ~hidden:(List.map absolute info.cmt_loadpath.hidden);
  match info.cmt_annots with
  | Cmt_format.Implementation structure -> iterator.structure iterator structure
  | _ -> invalid_arg ("Expected native implementation typedtree: " ^ filename)

let archive_typedtrees filename =
  let library=Compilenv.read_library_info filename in
  let base=Filename.remove_extension (Filename.basename filename) in
  let objects=Filename.concat (Filename.dirname filename) ("." ^ base ^ ".objs/byte") in
  List.map (fun (unit,_) ->
    Filename.concat objects (String.uncapitalize_ascii unit.Cmx_format.ui_name ^ ".cmt"))
    library.Cmx_format.lib_units

let () =
  let targets_only=Array.length Sys.argv>1 && Sys.argv.(1)="--cmt-targets" in
  let first=if targets_only then 2 else 1 in
  for index=first to Array.length Sys.argv-1 do
    let filename=Sys.argv.(index) in
    if Filename.check_suffix filename ".cmxa" then
      List.iter (if targets_only then print_endline else inspect) (archive_typedtrees filename)
    else if targets_only then invalid_arg ("Expected an actual native archive: " ^ filename)
    else inspect filename
  done;
  if not targets_only then begin
    Printf.printf "let () =\n%s\nfinish ();;\n" (String.concat "\n" (List.rev !probes));
    Printf.eprintf "Native style source capture: %d literal calls; %d property calls deferred; %d constructor calls contain deferred arguments (%d optional, %d required)\n%!"
      (List.length !probes) !dynamic_properties !dynamic !dynamic_optional_arguments !dynamic_required_arguments
  end
