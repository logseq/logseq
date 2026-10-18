(* Port of logseq.common.defkeywords — keyword definition registry.

   The cljs defkeywords macro records each defined keyword so a keyword
   re-defined in a different file throws at macro expansion, and returns
   the kw/config pairs for the enclosing map/vector literal. Here the
   same check runs at module init: [defkeywords ~file pairs] registers
   each keyword and returns the pairs. Without ~file the registry treats
   all registrations as same-file (no throw), mirroring the cljs
   file-equality gate. *)

type info = { file : string option }

let defined_kws : (string, info) Hashtbl.t = Hashtbl.create 64

let register ?file kw =
  match Hashtbl.find_opt defined_kws kw with
  | Some i when i.file <> file ->
      (* cljs updates the registry before throwing *)
      Hashtbl.replace defined_kws kw { file };
      invalid_arg ("keyword already defined somewhere else: " ^ kw)
  | _ -> Hashtbl.replace defined_kws kw { file }

let defkeywords ?file pairs =
  List.iter (fun (kw, _) -> register ?file kw) pairs;
  pairs
