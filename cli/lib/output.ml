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
    headers : string list option;
    rows : string list list;
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
    let headers = Option.value t.headers ~default:[] in
    List.map
      (fun row ->
        List.mapi
          (fun index value ->
            let header =
              match List.nth_opt headers index with
              | Some header when is_datetime_header header -> Some header
              | Some header
                when String.lowercase_ascii header = "value"
                     && List.length row >= 2 ->
                  List.nth_opt row 0
              | header -> header
            in
            display_cell ~now_time ?header value)
          row)
      t.rows

  let column_widths rows =
    rows
    |> List.fold_left
         (fun widths row ->
           let width = max (List.length widths) (List.length row) in
           List.init width (fun index ->
               max
                 (Option.value (List.nth_opt widths index) ~default:0)
                 (Display_width.width
                    (Option.value (List.nth_opt row index) ~default:""))))
         []

  let pad_right width value =
    let padding = width - Display_width.width value in
    if padding <= 0 then value else value ^ String.make padding ' '

  let render_row widths row =
    let last_index = List.length widths - 1 in
    widths
    |> List.mapi (fun index width ->
        let value = Option.value (List.nth_opt row index) ~default:"" in
        if index = last_index then value else pad_right width value)
    |> String.concat "  "

  let lines t =
    let rows = display_rows t in
    let table_rows =
      match t.headers with
      | None | Some [] -> rows
      | Some headers -> headers :: rows
    in
    let widths = column_widths table_rows in
    let lines = List.map (render_row widths) table_rows in
    match t.footer with Some footer -> lines @ [ footer ] | None -> lines

  let to_string t = String.concat "\n" (lines t)
end

type _ t =
  | Human : Human_output.t -> human t
  | Edn : Melange_edn.any -> edn t
  | Json : Melange_edn.any -> json t
