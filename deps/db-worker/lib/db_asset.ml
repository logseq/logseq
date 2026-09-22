(* logseq.db.frontend.asset — asset helpers. The checksum fn needs crypto;
   only the path helpers the importer uses are ported here. *)

(* db-asset/asset-path->type *)
let asset_path_to_type (path : string) : string =
  let ext = Gp_node_path.extname path in
  if String.length ext > 1 then String.lowercase_ascii (String.sub ext 1 (String.length ext - 1))
  else ""

(* db-asset/asset-name->title *)
let asset_name_to_title (path_basename : string) : string =
  (Gp_node_path.parse path_basename).name
