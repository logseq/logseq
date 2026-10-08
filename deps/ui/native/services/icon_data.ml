(* Native provider for Icon_tabler_data — loads the bundled
   tabler-children.json (same payload as resources/js/icon-data.js
   minus the JS wrapper) and installs it as the shared decode source.
   Search order: $LOGSEQ_ICON_DATA, the app bundle's Resources dir,
   then the in-repo assets path for dev builds/tests. *)

let table : (string, Json.t) Hashtbl.t option ref = ref None

let candidate_paths () =
  (match Sys.getenv_opt "LOGSEQ_ICON_DATA" with
   | Some p -> [ p ]
   | None -> [])
  @ [ Filename.concat (Filename.dirname Sys.executable_name)
        "../Resources/tabler-children.json"
    ; Filename.concat (Sys.getcwd ()) "deps/ui/assets/tabler-children.json"
    ; Filename.concat (Sys.getcwd ()) "assets/tabler-children.json" ]

let rec json_of_yojson (y : Yojson.Safe.t) : Json.t =
  match y with
  | `Null -> Json.Null
  | `Bool b -> Json.Bool b
  | `Int n -> Json.Number (float_of_int n)
  | `Intlit s -> Json.Number (float_of_string s)
  | `Float f -> Json.Number f
  | `String s -> Json.String s
  | `List xs -> Json.Array (Array.of_list (List.map json_of_yojson xs))
  | `Assoc kvs -> Json.Object (List.map (fun (k, v) -> (k, json_of_yojson v)) kvs)


let load_table () =
  match !table with
  | Some t -> Some t
  | None -> (
      match List.find_opt Sys.file_exists (candidate_paths ()) with
      | Some p -> (
          try
            match Yojson.Safe.from_file p with
            | `Assoc kvs ->
                let t = Hashtbl.create (List.length kvs) in
                List.iter
                  (fun (k, v) -> Hashtbl.replace t k (json_of_yojson v))
                  kvs;
                table := Some t;
                Some t
            | _ -> None
          with _ -> None)
      | None -> None)

let install () =
  Icon_tabler_data.install
    { get =
        (fun name ->
          match load_table () with
          | Some t -> Hashtbl.find_opt t name
          | None -> None)
    ; keys =
        (fun () ->
          match load_table () with
          | Some t -> Array.of_seq (Hashtbl.to_seq_keys t)
          | None -> [||])
    }
