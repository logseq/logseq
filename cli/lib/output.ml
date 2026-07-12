type human
type json
type edn

module Mode = struct
  type _ t = Human : human t | Json : json t | Edn : edn t
  and packed = Packed : _ t -> packed

  let default = Human

  let of_string = function
    | "human" -> Some (Packed Human)
    | "json" -> Some (Packed Json)
    | "edn" -> Some (Packed Edn)
    | _ -> None

  let to_string : type a. a t -> string = function
    | Human -> "human"
    | Json -> "json"
    | Edn -> "edn"

  let structured : type a. a t -> bool = function
    | Human -> false
    | Json | Edn -> true
end

module Human_output = struct
  type t = {
    headers : string Rrbvec.t option;
    rows : string Rrbvec.t Rrbvec.t;
    footer : string option;
  }

  let create ?headers ?footer ~rows () = { headers; rows; footer }

  let has_suffix ~suffix value =
    let suffix_len = String.length suffix in
    let value_len = String.length value in
    value_len >= suffix_len
    && String.sub value (value_len - suffix_len) suffix_len = suffix

  let is_datetime_header header =
    let header = String.lowercase_ascii header in
    has_suffix ~suffix:"created-at" header
    || has_suffix ~suffix:"updated-at" header

  let display_cell ~now_time ?header value =
    let value = if value = "" then "-" else value in
    match header with
    | Some header when is_datetime_header header -> (
        match Int64.of_string_opt value with
        | Some epoch_ms ->
            Humanize_types.relative_datetime
              ~then_time:(Time.time_of_epoch_ms epoch_ms)
              ~now_time
        | None -> value)
    | _ -> value

  let display_rows t =
    let now_time = Time.now () in
    let headers = Option.value t.headers ~default:Vec.empty in
    Vec.map
      (fun row ->
        Vec.mapi
          (fun index value ->
            let header =
              match Vec.nth_opt headers index with
              | Some header when is_datetime_header header -> Some header
              | Some header
                when String.lowercase_ascii header = "value"
                     && Vec.length row >= 2 ->
                  Vec.nth_opt row 0
              | header -> header
            in
            display_cell ~now_time ?header value)
          row)
      t.rows

  let column_widths rows =
    rows
    |> Vec.fold_left
         (fun widths row ->
           let width = max (Vec.length widths) (Vec.length row) in
           Vec.init width (fun index ->
               max
                 (Option.value (Vec.nth_opt widths index) ~default:0)
                 (Display_width.width
                    (Option.value (Vec.nth_opt row index) ~default:""))))
         Vec.empty

  let pad_right width value =
    let padding = width - Display_width.width value in
    if padding <= 0 then value else value ^ String.make padding ' '

  let render_row widths row =
    let last_index = Vec.length widths - 1 in
    widths
    |> Vec.mapi (fun index width ->
        let value = Option.value (Vec.nth_opt row index) ~default:"" in
        if index = last_index then value else pad_right width value)
    |> Vec.string_concat "  "

  let strip_leading_colon value =
    if String.length value > 0 && value.[0] = ':' then
      String.sub value 1 (String.length value - 1)
    else value

  let is_keyword_namespace_char = function
    | 'a' .. 'z' | '0' .. '9' | '.' | '-' | '_' -> true
    | _ -> false

  let is_keyword_namespace value =
    value <> "" && String.for_all is_keyword_namespace_char value

  let display_header header =
    let header = strip_leading_colon header in
    let parts = Vec.split_on_char '/' header in
    if Vec.length parts = 2 then
      let namespace = Vec.nth parts 0 in
      let name = Vec.nth parts 1 in
      if is_keyword_namespace namespace && name <> "" then name else header
    else header

  let lines t =
    let rows = display_rows t in
    let table_rows =
      match t.headers with
      | None -> rows
      | Some headers when Vec.is_empty headers -> rows
      | Some headers -> Vec.push_front rows (Vec.map display_header headers)
    in
    let widths = column_widths table_rows in
    let lines = Vec.map (render_row widths) table_rows in
    match t.footer with
    | Some footer -> Vec.push_back lines footer
    | None -> lines

  let to_string t = Vec.string_concat "\n" (lines t)
end

type _ t =
  | Human : Human_output.t -> human t
  | Edn : Melange_edn_melange.any -> edn t
  | Json : Melange_edn_melange.any -> json t
