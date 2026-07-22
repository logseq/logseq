type form = Datalog_form.t =
  | Symbol of string
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | List_form of form Rrbvec.t
  | Vector_form of form Rrbvec.t

include Rules_data
module String_set = Set.Make (String)

let entry_name (entry : entry) = entry.name
let entry_body (entry : entry) = entry.body
let dependency_name (dependency : dependency) = dependency.name
let dependency_names (dependency : dependency) = dependency.dependencies
let dependency name dependencies = { name; dependencies }

let find_body_in entries name =
  Rrbvec.fold_left
    (fun result (entry : entry) ->
      match result with
      | Some _ -> result
      | None when String.equal entry.name name -> Some entry.body
      | None -> None)
    None entries

let find_body name =
  match find_body_in rules name with
  | Some body -> body
  | None -> invalid_arg ("Datalog rule is missing: " ^ name)

let find_query_body name =
  match find_body_in db_query_dsl_rules name with
  | Some body -> body
  | None -> find_body name

let find_dependencies name dependencies =
  Rrbvec.fold_left
    (fun result dependency ->
      match result with
      | Some _ -> result
      | None when String.equal dependency.name name ->
          Some dependency.dependencies
      | None -> None)
    None dependencies

let full_dependencies initial dependencies =
  let rec collect frontier seen result =
    if Rrbvec.is_empty frontier then result
    else
      let seen, result =
        Rrbvec.fold_left
          (fun (seen, result) name ->
            if String_set.mem name seen then (seen, result)
            else (String_set.add name seen, Rrbvec.push_back result name))
          (seen, result) frontier
      in
      let next =
        Rrbvec.fold_left
          (fun result name ->
            match find_dependencies name dependencies with
            | Some names -> Rrbvec.append result names
            | None -> result)
          Rrbvec.empty frontier
      in
      collect next seen result
  in
  collect initial String_set.empty Rrbvec.empty

let extract_query_rules initial =
  full_dependencies initial rules_dependencies
  |> Rrbvec.fold_left
       (fun result name ->
         let body = find_query_body name in
         match body with
         | Vector_form forms
           when (not (Rrbvec.is_empty forms))
                &&
                match Rrbvec.nth forms 0 with
                | Vector_form _ -> true
                | _ -> false ->
             Rrbvec.append result forms
         | _ -> Rrbvec.push_back result body)
       Rrbvec.empty
