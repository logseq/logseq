module Domain = Melange_db.Db_ident

module Default_runtime = struct
  type global
  type process
  type process_env
  type crypto
  type uint8_array

  external global_this : global = "globalThis"

  external process : global -> process option = "process"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external env : process -> process_env = "env" [@@mel.get]
  external argv : process -> string array = "argv" [@@mel.get]

  external env_get : process_env -> string -> string option = ""
  [@@mel.get_index] [@@mel.return { undefined_to_opt }]

  external random : unit -> float = "random" [@@mel.scope "Math"]
  external floor : float -> float = "floor" [@@mel.scope "Math"]

  external crypto : global -> crypto option = "crypto"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external uint8_array : int -> uint8_array = "Uint8Array" [@@mel.new]

  external get_random_values : crypto -> uint8_array -> uint8_array
    = "getRandomValues"
  [@@mel.send]

  external array_from_uint8_array : uint8_array -> int array = "from"
  [@@mel.scope "Array"]

  let contains_substring value substring =
    let value_length = String.length value in
    let substring_length = String.length substring in
    if substring_length = 0 then true
    else if substring_length > value_length then false
    else
      let rec loop index =
        if index + substring_length > value_length then false
        else if String.sub value index substring_length = substring then true
        else loop (index + 1)
      in
      loop 0

  let nbb_runtime process =
    argv process
    |> Array.exists (fun value -> contains_substring value "nbb-logseq")

  let stable_idents () =
    match process global_this with
    | None -> false
    | Some process -> (
        if nbb_runtime process then true
        else
          match env_get (env process) "LOGSEQ_STABLE_IDENTS" with
        | None -> false
        | Some _ -> true)

  let random_index upper_bound =
    int_of_float (floor (random () *. float_of_int upper_bound))

  let random_bytes size =
    let crypto =
      match crypto global_this with
      | Some crypto -> crypto
      | None ->
          invalid_arg "Random DB idents require crypto.getRandomValues"
    in
    uint8_array size |> get_random_values crypto |> array_from_uint8_array
    |> Rrbvec.of_array
end

let normalizeNamePart value = Domain.normalize_name_part value
let nanoId payload = Domain.nano_id (Rrbvec.of_array payload)

let requiresRandomSuffix namespace_ stable =
  Domain.requires_random_suffix ~namespace_ ~stable

let create namespace_ name suffix =
  Domain.create ~namespace_ ~name ~suffix:(Js.Nullable.toOption suffix)

let createGenerated namespace_ name =
  Domain.create_with ~stable_idents:Default_runtime.stable_idents
    ~random_index:Default_runtime.random_index
    ~random_bytes:Default_runtime.random_bytes ~namespace_ ~name

let ensureUnique base base_exists existing =
  Domain.ensure_unique ~base ~base_exists ~existing:(Rrbvec.of_array existing)

let ensureUniqueWith runtime datascript database ident =
  Domain.ensure_unique_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~keyword_to_string:(Support.Runtime_codec.keyword_to_string runtime)
    ~keyword_from_string:(Support.Runtime_codec.keyword_from_string runtime)
    ~string_to_value:(Support.Runtime_codec.string_to_value runtime)
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~entity_exists:(fun lookup ->
      Support.Datascript.entity datascript database lookup
      |> Js.Nullable.toOption |> Option.is_some)
    ~query:(fun form inputs ->
      Support.Datascript.query datascript form database inputs)
    ident
