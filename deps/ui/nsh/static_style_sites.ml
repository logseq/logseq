(* Inspect the actual native compiler outputs, including resolved aliases and
   target branches. Emit probes that call the real, already typechecked encoders. *)
open Asttypes
open Typedtree

let probes = ref []
let dynamic = ref 0
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
let bind binding = match binding.vb_pat.pat_desc,boolean binding.vb_expr with
  | Tpat_var (id,_,_),Some value -> Hashtbl.replace known (Ident.unique_name id) value
  | _ -> ()
let rec literal expression = match expression.exp_desc with
  | Texp_constant _ -> true
  | Texp_construct (_,description,values) ->
      List.mem description.Data_types.cstr_name ["true";"false";"Some";"None";"[]";"::";"()"]
      && List.for_all literal values
  | Texp_variant (_,value) -> Option.fold ~none:true ~some:literal value
  | Texp_tuple values -> List.for_all (fun (_,value) -> literal value) values
  | Texp_apply (fn,arguments) ->
      List.mem (last (name fn)) ["~-";"~-.";"~+";"~+."] && List.for_all literal (args arguments)
  | _ -> false
let code expression = Format.asprintf "%a" Pprintast.expression (Untypeast.untype_expression expression)
let location expression = let p=expression.exp_loc.loc_start in
  Printf.sprintf "%s:%d:%d" p.pos_fname p.pos_lnum (p.pos_cnum-p.pos_bol+1)
let property_helper name = String.starts_with ~prefix:"Ui_parts.Prop." name
let property expression =
  let call = match expression.exp_desc with
    | Texp_apply (fn,arguments) when property_helper (name fn)
        && List.for_all literal (args arguments) ->
        Some (name fn ^ " " ^ String.concat " " (List.map (fun value -> "(" ^ code value ^ ")") (args arguments)))
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
        let required = ref true in
        let labels = List.filter_map (function
          | Optional label,Arg ({exp_desc=Texp_construct (_,description,[value]);_})
            when description.Data_types.cstr_name="Some" && literal value -> Some ("~" ^ label ^ ":(" ^ code value ^ ")")
          | Labelled label,Arg value when literal value -> Some ("~" ^ label ^ ":(" ^ code value ^ ")")
          | Labelled _,_ -> required:=false; None
          | _ -> None) arguments in
        if !required then probes := Printf.sprintf "element %S (%s %s []);" (location expression)
          (name fn) (String.concat " " labels) :: !probes
        else incr dynamic
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
  let info=Cmt_format.read_cmt filename in
  let absolute path = if Filename.is_relative path then Filename.concat info.cmt_builddir path else path in
  Load_path.init ~auto_include:Load_path.no_auto_include
    ~visible:(List.map absolute info.cmt_loadpath.visible)
    ~hidden:(List.map absolute info.cmt_loadpath.hidden);
  match info.cmt_annots with
  | Cmt_format.Implementation structure -> iterator.structure iterator structure
  | _ -> invalid_arg ("Expected native implementation typedtree: " ^ filename)

let () =
  for index=1 to Array.length Sys.argv-1 do
    let filename=Sys.argv.(index) in
    if Filename.check_suffix filename ".cmxa" then begin
      let library=Compilenv.read_library_info filename in
      let base=Filename.remove_extension (Filename.basename filename) in
      let objects=Filename.concat (Filename.dirname filename) ("." ^ base ^ ".objs/byte") in
      List.iter (fun (unit,_) ->
        inspect (Filename.concat objects (String.uncapitalize_ascii unit.Cmx_format.ui_name ^ ".cmt"))) library.Cmx_format.lib_units
    end else inspect filename
  done;
  Printf.printf "let () =\n%s\nfinish ();;\n" (String.concat "\n" (List.rev !probes));
  Printf.eprintf "Native style source capture: %d literal calls; %d constructor calls require dynamic values\n%!" (List.length !probes) !dynamic
