type direction = Plus | Minus
type unit_ = Days | Weeks | Months | Years
type time_of_day = { hour : int; minute : int; second : int; millisecond : int }
type offset = { direction : direction; amount : int; unit_ : unit_ }

type t =
  | Current_page
  | Query_page
  | Current_block
  | Parent_block
  | Today
  | Yesterday
  | Tomorrow
  | Right_now_ms
  | Today_time of time_of_day
  | Relative_date of offset
  | Relative_date_time of offset * time_of_day
  | Invalid_relative_namespace of string
  | Invalid_relative_format
  | Unresolved

val start_of_day : time_of_day
val end_of_day : time_of_day
val plan : namespace_:string option -> name:string -> t
