module Domain = Melange_db.Input_plan

type encoded_plan = {
  action : string;
  direction : string Js.Nullable.t;
  amount : int;
  unitName : string Js.Nullable.t;
  hour : int;
  minute : int;
  second : int;
  millisecond : int;
  detail : string Js.Nullable.t;
}

let direction = function Domain.Plus -> "+" | Minus -> "-"

let unit_name = function
  | Domain.Days -> "d"
  | Weeks -> "w"
  | Months -> "m"
  | Years -> "y"

let encode ?direction:direction_value ?(amount = 0) ?unit_name:unit_value
    ?(time = Domain.start_of_day) ?detail action =
  {
    action;
    direction =
      direction_value |> Option.map direction |> Js.Nullable.fromOption;
    amount;
    unitName = unit_value |> Option.map unit_name |> Js.Nullable.fromOption;
    hour = time.hour;
    minute = time.minute;
    second = time.second;
    millisecond = time.millisecond;
    detail = Js.Nullable.fromOption detail;
  }

let encode_offset action (offset : Domain.offset) =
  encode ~direction:offset.direction ~amount:offset.amount
    ~unit_name:offset.unit_ action

let encode_offset_time action (offset : Domain.offset)
    (time : Domain.time_of_day) =
  encode ~direction:offset.direction ~amount:offset.amount
    ~unit_name:offset.unit_ ~time action

let plan namespace_ name =
  match Domain.plan ~namespace_:(Js.Nullable.toOption namespace_) ~name with
  | Domain.Current_page -> encode "current-page"
  | Query_page -> encode "query-page"
  | Current_block -> encode "current-block"
  | Parent_block -> encode "parent-block"
  | Today -> encode "today"
  | Yesterday -> encode "yesterday"
  | Tomorrow -> encode "tomorrow"
  | Right_now_ms -> encode "right-now-ms"
  | Today_time time -> encode ~time "today-time"
  | Relative_date offset -> encode_offset "relative-date" offset
  | Relative_date_time (offset, time) ->
      encode_offset_time "relative-date-time" offset time
  | Invalid_relative_namespace namespace_ ->
      encode ~detail:namespace_ "invalid-relative-namespace"
  | Invalid_relative_format -> encode "invalid-relative-format"
  | Unresolved -> encode "unresolved"
