open Yojson.Safe.Util
let contract_name = function Suite.Desktop -> "desktop" | Suite.Api -> "api" | Suite.Helper -> "helper"

let scope_exclusions =
  [ "ocaml-e2e/test/test_graph_navigation_basic.ml::graph-view-mode-settings-test",
    "User excluded Graph View from native desktop test scope."
  ; "ocaml-e2e/test/test_graph_navigation_basic.ml::graph-time-travel-playback-test",
    "User excluded Graph View from native desktop test scope." ]

let () =
  Printexc.record_backtrace true;
  let root = ref ".." and coverage = ref false and inventory_only = ref false
  and group = ref None and filter = ref None and timeout = ref 120. in
  Arg.parse ["--repo", Arg.Set_string root, "Absolute repository root";
             "--coverage", Arg.Set coverage, "Require complete executable coverage";
             "--inventory-only", Arg.Set inventory_only, "Report pending mappings without running tests";
             "--group", Arg.String (fun s -> group := Some s), "Run one owned group";
             "--filter", Arg.String (fun s -> filter := Some s), "Run one exact native case";
             "--timeout", Arg.Set_float timeout, "Per-case deadline in seconds (default 120)"]
    (fun _ -> invalid_arg "Unexpected argument") "native E2E";
  let repo = Unix.realpath !root in
  let manifest = Yojson.Safe.from_file (Filename.concat repo "native-e2e/upstream.json") in
  let cases = manifest |> member "cases" |> to_list in
  let lookup = List.map (fun c -> (c |> member "id" |> to_string), c) cases in
  List.iter (fun (id, _) ->
      if not (List.mem_assoc id lookup) then failwith ("Unknown scope exclusion " ^ id)) scope_exclusions;
  let excluded id = List.mem_assoc id scope_exclusions in
  let effective = List.filter (fun (id, _) -> not (excluded id)) lookup in
  let mappings = Hashtbl.create 512 and names = Hashtbl.create 512 in
  let tests = List.concat_map (fun (file, definitions) ->
      List.map (fun (definition : Suite.test) ->
          let identity = file ^ "::" ^ definition.name in
          if Hashtbl.mem names identity then failwith ("Duplicate native case " ^ identity);
          Hashtbl.add names identity ();
          if definition.additional && definition.covers <> [] then
            failwith ("Additional case cannot claim upstream coverage " ^ identity);
          if definition.covers = [] && not definition.additional then
            failwith ("Unmapped native case " ^ identity);
          if not definition.additional && List.length definition.covers <> 1 then
            failwith ("Parity case must cover exactly one upstream registration " ^ identity);
          List.iter (fun id ->
              if Hashtbl.mem mappings id then failwith ("Duplicate upstream mapping " ^ id);
              let upstream = match List.assoc_opt id lookup with Some c -> c | None -> failwith ("Unknown upstream " ^ id) in
              if upstream |> member "target_file" |> to_string <> file then failwith ("Ownership violation " ^ id);
              let contract = contract_name definition.contract in
              if upstream |> member "contract" |> to_string <> contract then failwith ("Contract mismatch " ^ id);
              Hashtbl.add mappings id identity) definition.covers;
          file, definition) definitions) Registry.suites in
  let tests = List.filter (fun (_, (definition : Suite.test)) ->
      not (List.exists excluded definition.covers)) tests in
  let pending = List.filter (fun (id, _) -> not (Hashtbl.mem mappings id)) effective in
  let additional_count = List.fold_left (fun count (_, (definition : Suite.test)) ->
      if definition.additional then count + 1 else count) 0 tests in
  let parity_count = List.length tests - additional_count in
  Printf.printf "Coverage declarations: %d/%d; pending: %d; excluded: %d; canonical: %d; parity native cases: %d; additional native cases: %d\n%!"
    parity_count (List.length effective) (List.length pending) (List.length scope_exclusions)
    (List.length cases) parity_count additional_count;
  List.iter (fun (id, reason) -> Printf.printf "EXCLUDED %s: %s\n%!" id reason) scope_exclusions;
  let report_missing () =
    if !coverage then
      List.iter (fun (id, _) -> Printf.eprintf "MISSING %s\n" id) pending in
  if !inventory_only then begin
    report_missing ();
    exit (if !coverage && pending <> [] then 2 else 0)
  end;
  let selected = List.filter (fun (file, (definition : Suite.test)) ->
      (match !filter with None -> true | Some name -> definition.name = name) &&
      (match !group with None -> true | Some group_name ->
         List.exists (fun c -> c |> member "target_file" |> to_string = file &&
                                c |> member "group" |> to_string = group_name) cases)) tests in
  if selected = [] then failwith "No executable tests selected";
  if not (Float.is_finite !timeout) || !timeout <= 0. then invalid_arg "Positive finite case timeout required";
  Sys.set_signal Sys.sigalrm (Sys.Signal_handle (fun _ -> raise (Client.Timeout "Native case deadline exceeded")));
  let base = Filename.concat repo (Printf.sprintf "native-e2e/artifacts/run-%.0f-%d" (Unix.gettimeofday () *. 1000.) (Unix.getpid ())) in
  let rec mkdir path = if not (Sys.file_exists path) then (mkdir (Filename.dirname path); Unix.mkdir path 0o700) in
  mkdir base;
  let active = ref None in
  let cleanup () = Option.iter Suite.cleanup !active in
  at_exit cleanup;
  List.iter (fun signal -> Sys.set_signal signal (Sys.Signal_handle (fun _ -> cleanup (); exit 130))) [Sys.sigint; Sys.sigterm];
  let results = List.map (fun (file, (definition : Suite.test)) ->
      let artifacts = Filename.concat base (Digest.to_hex (Digest.string (file ^ definition.name))) in
      let ctx = Suite.context ~repo ~artifacts in
      active := Some ctx;
      let error =
        Fun.protect
          ~finally:(fun () -> ignore (Unix.setitimer Unix.ITIMER_REAL { Unix.it_interval = 0.; it_value = 0. }))
          (fun () ->
        ignore (Unix.setitimer Unix.ITIMER_REAL { Unix.it_interval = 0.; it_value = !timeout });
        try
          definition.run ctx;
          if Suite.assertions ctx = 0 then failwith "Vacuous native test: no executed contract assertion";
          if definition.contract = Suite.Desktop && Suite.inputs ctx = 0 then failwith "Desktop claim without production SDL input";
          if definition.contract = Suite.Api && (Suite.sdk_calls ctx = 0 || Suite.real_apps ctx = 0) then
            failwith "Api claim without a real app and completed production SDK call";
          None
        with exn -> Some (Printexc.to_string exn ^ "\n" ^ Printexc.get_backtrace ())) in
      Suite.cleanup ctx; active := None;
      Printf.printf "%s %s contract=%s assertions=%d inputs=%d sdk_calls=%d\n%!" (if error = None then "PASS" else "FAIL")
        definition.name (contract_name definition.contract) (Suite.assertions ctx) (Suite.inputs ctx) (Suite.sdk_calls ctx);
      Option.iter (Printf.eprintf "%s\n%!") error;
      `Assoc ["file", `String file; "name", `String definition.name;
              "covers", `List (List.map (fun s -> `String s) definition.covers);
              "additional", `Bool definition.additional;
              "contract", `String (contract_name definition.contract);
              "passed", `Bool (error = None); "assertions", `Int (Suite.assertions ctx);
              "inputs", `Int (Suite.inputs ctx); "sdk_calls", `Int (Suite.sdk_calls ctx);
              "real_apps", `Int (Suite.real_apps ctx); "artifacts", `String artifacts;
              "error", (match error with None -> `Null | Some e -> `String e)]) selected in
  Yojson.Safe.to_file (Filename.concat base "results.json")
    (`Assoc ["results", `List results; "pending", `Int (List.length pending);
             "canonical_cases", `Int (List.length cases); "effective_target", `Int (List.length effective);
             "excluded", `List (List.map (fun (id, reason) ->
                 `Assoc ["id", `String id; "reason", `String reason]) scope_exclusions);
             "declared_parity_cases", `Int parity_count; "declared_additional_cases", `Int additional_count]);
  Printf.printf "Results: %s\n%!" base;
  report_missing ();
  if List.exists (fun r -> not (r |> member "passed" |> to_bool)) results then exit 1;
  if !coverage && pending <> [] then exit 2
