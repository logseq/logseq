(* frontend.util.url/entity-url-for-copy: prefer graph-qualified web links,
   falling back to desktop protocol links only without a graph identity. *)

let present = function
  | Some value when String.trim value <> "" -> Some value
  | _ -> None

let strip_trailing_slashes value =
  let rec end_ index =
    if index > 0 && value.[index - 1] = '/' then end_ (index - 1) else index
  in
  String.sub value 0 (end_ (String.length value))

let encode_uri value =
  let encoded = Ui_services.uri_encode_component value in
  let output = Buffer.create (String.length encoded) in
  let rec copy index =
    if index < String.length encoded then
      if encoded.[index] = '%' && index + 2 < String.length encoded then begin
        let code = int_of_string ("0x" ^ String.sub encoded (index + 1) 2) in
        let character = Char.chr code in
        if String.contains ";/?:@&=+$,#" character then Buffer.add_char output character
        else Buffer.add_substring output encoded index 3;
        copy (index + 3)
      end
      else begin Buffer.add_char output encoded.[index]; copy (index + 1) end
  in
  copy 0;
  Buffer.contents output

let short_repo repo =
  let basename =
    List.rev (String.split_on_char '/' (String.map (fun c -> if c = '\\' then '/' else c) repo))
    |> List.find_opt (fun part -> part <> "")
    |> Option.value ~default:""
  in
  let prefix = "logseq_db_" in
  if String.starts_with ~prefix basename then
    String.sub basename (String.length prefix) (String.length basename - String.length prefix)
  else basename

let entity_url_for_copy ~app_base_url ~graph_id ~repo ~entity_id ~kind =
  match present graph_id with
  | Some graph_id ->
      if String.trim app_base_url = "" then invalid_arg "Missing app-base-url";
      if String.trim entity_id = "" then invalid_arg "Missing entity-id";
      let segment = match kind with `Page -> "page" | `Block -> "block" in
      Some (strip_trailing_slashes app_base_url ^ "/" ^ segment ^ "/"
            ^ Ui_services.uri_encode_component entity_id ^ "?graph-id="
            ^ Ui_services.uri_encode_component graph_id)
  | None ->
      Option.map (fun repo ->
          "logseq://graph/" ^ encode_uri (short_repo repo) ^ "?block-id=" ^ entity_id)
        (present repo)
