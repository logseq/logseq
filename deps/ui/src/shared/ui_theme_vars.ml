(* Custom properties compute within each CSS inheritance layer before the next
   layer inherits them. Keep this shared by native hosts. *)

let var_ref s =
  let len = String.length s in
  if len <= 5 || String.sub s 0 4 <> "var(" || s.[len - 1] <> ')' then None
  else
    let inner = String.sub s 4 (len - 5) in
    let depth = ref 0 and cut = ref None in
    String.iteri
      (fun i c ->
        if c = '(' then incr depth
        else if c = ')' then decr depth
        else if c = ',' && !depth = 0 && !cut = None then cut := Some i)
      inner;
    let name, fallback =
      match !cut with
      | None -> String.trim inner, None
      | Some i ->
          ( String.trim (String.sub inner 0 i)
          , Some (String.trim
              (String.sub inner (i + 1) (String.length inner - i - 1))) )
    in
    if String.length name > 2 && String.starts_with ~prefix:"--" name then
      Some (name, fallback)
    else None

let scan_var s cursor =
  let len = String.length s in
  let rec find i =
    if i + 4 > len then Ok None
    else if s.[i] <> 'v' || s.[i + 1] <> 'a' || s.[i + 2] <> 'r'
            || s.[i + 3] <> '(' then find (i + 1)
    else
      let rec closing j depth =
        if j >= len then Error ()
        else
          match s.[j] with
          | ')' when depth = 1 ->
              (match var_ref (String.sub s i (j - i + 1)) with
              | Some (name, fallback) -> Ok (Some (i, j + 1, name, fallback))
              | None -> Error ())
          | '(' -> closing (j + 1) (depth + 1)
          | ')' -> closing (j + 1) (depth - 1)
          | _ -> closing (j + 1) depth
      in
      closing (i + 4) 1
  in
  find cursor

let rec substitute lookup s =
  match scan_var s 0 with
  | Error () -> None
  | Ok None -> Some s
  | first ->
      let output = Buffer.create (String.length s) in
      let rec expand cursor = function
        | Error () -> None
        | Ok None ->
            Buffer.add_substring output s cursor (String.length s - cursor);
            Some (Buffer.contents output)
        | Ok (Some (start, stop, name, fallback)) ->
            let value =
              match lookup name with
              | Some _ as value -> value
              | None -> Option.bind fallback (substitute lookup)
            in
            (match value with
            | None -> None
            | Some value ->
                Buffer.add_substring output s cursor (start - cursor);
                Buffer.add_string output value;
                expand stop (scan_var s stop))
      in
      expand 0 first

(* Dependencies include references in unused fallbacks, as required for cycles. *)
let references s =
  let rec collect cursor names =
    match scan_var s cursor with
    | Error () | Ok None -> names
    | Ok (Some (start, _, name, _)) -> collect (start + 4) (name :: names)
  in
  collect 0 []

type resolution = Visiting | Resolved of string option

let compute ~parent declarations =
  let raw = Hashtbl.create (List.length declarations) in
  List.iter (fun (name, value) -> Hashtbl.replace raw name value) declarations;
  let states = Hashtbl.create (Hashtbl.length raw)
  and cyclic = Hashtbl.create 8
  and stack = ref [] in
  let rec lookup name =
    match Hashtbl.find_opt raw name with
    | None -> Hashtbl.find_opt parent name
    | Some value ->
        (match Hashtbl.find_opt states name with
        | Some (Resolved result) -> result
        | Some Visiting ->
            let rec mark = function
              | [] -> ()
              | node :: rest ->
                  Hashtbl.replace cyclic node ();
                  if node <> name then mark rest
            in
            mark !stack;
            None
        | None ->
            Hashtbl.replace states name Visiting;
            stack := name :: !stack;
            List.iter (fun dependency -> ignore (lookup dependency))
              (references value);
            let result =
              if Hashtbl.mem cyclic name then None
              else
                match substitute lookup value with
                | None -> None
                | Some value ->
                    (match String.lowercase_ascii (String.trim value) with
                    | "initial" -> None
                    | "inherit" | "unset" -> Hashtbl.find_opt parent name
                    | _ -> Some value)
            in
            stack := List.tl !stack;
            Hashtbl.replace states name (Resolved result);
            result)
  in
  let result = Hashtbl.copy parent in
  Hashtbl.iter
    (fun name _ ->
      match lookup name with
      | None -> Hashtbl.remove result name
      | Some value -> Hashtbl.replace result name value)
    raw;
  result

let resolve_layers ~root ~body ~application ~overrides =
  let root = compute ~parent:(Hashtbl.create 0) root in
  let application_names = Hashtbl.create (List.length application) in
  List.iter (fun (name, _) -> Hashtbl.replace application_names name ()) application;
  let application_overrides, body_overrides = List.partition
    (fun (name, _) -> Hashtbl.mem application_names name) overrides in
  let body = compute ~parent:root (body @ body_overrides) in
  compute ~parent:body (application @ application_overrides)
