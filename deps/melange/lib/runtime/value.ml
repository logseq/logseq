type t =
  | Nil
  | Bool of bool
  | String of string
  | Char of Uchar.t
  | Symbol of string
  | Keyword of Keyword.t
  | Int of int64
  | Big_int of string
  | Float of float
  | Decimal of string
  | Ratio of string
  | Regex of string
  | Binary of string
  | Date of int64
  | Uuid of Uuid.t
  | Uri of string
  | List of t Persistent_vector.t
  | Vector of t Persistent_vector.t
  | Map of (t * t) Persistent_vector.t
  | Set of t Persistent_vector.t
  | Tagged of string * t

let float_equal left right =
  left = right || (classify_float left = FP_nan && classify_float right = FP_nan)

let rec equal left right =
  match (left, right) with
  | Nil, Nil -> true
  | Bool left, Bool right -> Bool.equal left right
  | String left, String right
  | Symbol left, Symbol right
  | Big_int left, Big_int right
  | Decimal left, Decimal right
  | Ratio left, Ratio right
  | Regex left, Regex right
  | Binary left, Binary right
  | Uri left, Uri right ->
      String.equal left right
  | Char left, Char right -> Uchar.to_int left = Uchar.to_int right
  | Keyword left, Keyword right -> Keyword.equal left right
  | Int left, Int right | Date left, Date right -> Int64.equal left right
  | Float left, Float right -> float_equal left right
  | Uuid left, Uuid right -> Uuid.equal left right
  | List left, List right | Vector left, Vector right | Set left, Set right ->
      Persistent_vector.equal equal left right
  | Map left, Map right ->
      Persistent_vector.equal
        (fun (left_key, left_value) (right_key, right_value) ->
          equal left_key right_key && equal left_value right_value)
        left right
  | Tagged (left_tag, left_value), Tagged (right_tag, right_value) ->
      String.equal left_tag right_tag && equal left_value right_value
  | _ -> false
