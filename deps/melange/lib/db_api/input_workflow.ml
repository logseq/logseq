module Domain = Melange_db.Input_plan

type value = Support.Runtime_codec.cljs_value
type current_page = (unit -> string Js.Nullable.t[@u])
type date_source = (unit -> value[@u])
type date_offset = (value -> int -> value[@u])
type date_ms = (value -> float[@u])
type local_time = (value -> int -> int -> int -> int -> float[@u])
type now_ms = (unit -> float[@u])

type capabilities = {
  currentPage : current_page;
  today : date_source;
  addDays : date_offset;
  addWeeks : date_offset;
  addMonths : date_offset;
  addYears : date_offset;
  dateMs : date_ms;
  setLocalTime : local_time;
  nowMs : now_ms;
}

let lowercase runtime value =
  value
  |> Support.Runtime_codec.string_lowercase runtime
  |> Support.Runtime_codec.string_to_value runtime

let keyword_parts runtime value =
  let ident = Support.Runtime_codec.keyword_to_string runtime value in
  match String.rindex_opt ident '/' with
  | None -> (None, ident)
  | Some index ->
      ( Some (String.sub ident 0 index),
        String.sub ident (index + 1) (String.length ident - index - 1) )

let field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity
    (Support.Runtime_codec.keyword_from_string runtime name)

let current_block runtime datascript database current_block_uuid =
  match Js.Nullable.toOption current_block_uuid with
  | None -> None
  | Some uuid ->
      Support.Runtime_codec.array_to_vector runtime
        [|
          Support.Runtime_codec.keyword_from_string runtime "block/uuid";
          uuid;
        |]
      |> Support.Datascript.entity datascript database
      |> Js.Nullable.toOption

let offset_date (capabilities : capabilities) date (offset : Domain.offset) =
  let amount =
    match offset.direction with
    | Domain.Plus -> offset.amount
    | Minus -> -offset.amount
  in
  match offset.unit_ with
  | Domain.Days -> capabilities.addDays date amount [@u]
  | Weeks -> capabilities.addWeeks date amount [@u]
  | Months -> capabilities.addMonths date amount [@u]
  | Years -> capabilities.addYears date amount [@u]

let journal_day runtime (capabilities : capabilities) date =
  (capabilities.dateMs date [@u])
  |> Melange_common.Date_time.journal_day_of_ms
  |> Support.Runtime_codec.int_to_value runtime

let local_time runtime (capabilities : capabilities) date
    (time : Domain.time_of_day) =
  (capabilities.setLocalTime date time.hour time.minute time.second
     time.millisecond [@u])
  |> Support.Runtime_codec.float_to_value runtime

let resolve_keyword runtime datascript database (capabilities : capabilities)
    current_block_uuid input =
  let namespace_, name = keyword_parts runtime input in
  let today () = (capabilities.today () [@u]) in
  match Domain.plan ~namespace_ ~name with
  | Domain.Current_page ->
      (capabilities.currentPage () [@u])
      |> Js.Nullable.toOption
      |> Option.map (lowercase runtime)
      |> Option.value ~default:input
  | Query_page -> (
      match current_block runtime datascript database current_block_uuid with
      | None -> input
      | Some block ->
          field runtime datascript block "block/page" |> fun page ->
          field runtime datascript page "block/name")
  | Current_block -> (
      match current_block runtime datascript database current_block_uuid with
      | None -> input
      | Some block -> field runtime datascript block "db/id")
  | Parent_block -> (
      match current_block runtime datascript database current_block_uuid with
      | None -> input
      | Some block ->
          field runtime datascript block "block/parent" |> fun parent ->
          field runtime datascript parent "db/id")
  | Today -> today () |> journal_day runtime capabilities
  | Yesterday ->
      offset_date capabilities (today ())
        ({ direction = Minus; amount = 1; unit_ = Days } : Domain.offset)
      |> journal_day runtime capabilities
  | Tomorrow ->
      offset_date capabilities (today ())
        ({ direction = Plus; amount = 1; unit_ = Days } : Domain.offset)
      |> journal_day runtime capabilities
  | Right_now_ms ->
      (capabilities.nowMs () [@u])
      |> Support.Runtime_codec.float_to_value runtime
  | Today_time time -> local_time runtime capabilities (today ()) time
  | Relative_date offset ->
      offset_date capabilities (today ()) offset
      |> journal_day runtime capabilities
  | Relative_date_time (offset, time) ->
      local_time runtime capabilities
        (offset_date capabilities (today ()) offset)
        time
  | Invalid_relative_namespace namespace_ ->
      invalid_arg ("No matching clause: " ^ namespace_)
  | Invalid_relative_format ->
      invalid_arg
        ("Invalid relative date input: "
        ^ Support.Runtime_codec.value_to_string runtime input)
  | Unresolved -> input

let resolveWith runtime datascript database capabilities current_block_uuid
    input =
  if Support.Runtime_codec.value_is_keyword runtime input then
    resolve_keyword runtime datascript database capabilities current_block_uuid
      input
  else if Support.Runtime_codec.value_is_string runtime input then
    let text = Support.Runtime_codec.string_from_value runtime input in
    if Melange_common.Page_ref.is_page_ref text then
      text |> Melange_common.Page_ref.get_page_name
      |> Option.map (lowercase runtime)
      |> Option.value ~default:input
    else input
  else input
