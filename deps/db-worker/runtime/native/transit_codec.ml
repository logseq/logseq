module T = Transit_core.Json

let rec of_transit (v : T.value) : Wire.t =
  match v with
  | T.Null -> Wire.Nil
  | T.Bool b -> Wire.Bool b
  | T.String s -> Wire.String s
  | T.Int n -> Wire.Int n
  | T.Int64 n -> Wire.Int64 n
  | T.Float f -> Wire.Float f
  | T.Binary s -> Wire.Binary s
  | T.Keyword s -> Wire.Keyword s
  | T.Symbol s -> Wire.Symbol s
  | T.Big_decimal s -> Wire.Big_decimal s
  | T.Big_int s -> Wire.Big_int s
  | T.Date ms -> Wire.Date_ms ms
  | T.Uuid s -> Wire.Uuid s
  | T.Uri s -> Wire.Uri s
  | T.Array xs -> Wire.Array (List.map of_transit xs)
  | T.List xs -> Wire.List (List.map of_transit xs)
  | T.Map kvs -> Wire.Map (List.map (fun (k, v) -> (of_transit k, of_transit v)) kvs)
  | T.Set xs -> Wire.Set (List.map of_transit xs)
  | T.Tagged (tag, rep) -> Wire.Tagged (tag, of_transit rep)

let rec to_transit (t : Wire.t) : T.value =
  match t with
  | Wire.Nil -> T.Null
  | Wire.Bool b -> T.Bool b
  | Wire.String s -> T.String s
  | Wire.Int n -> T.Int n
  | Wire.Int64 n -> T.Int64 n
  | Wire.Float f -> T.Float f
  | Wire.Binary s -> T.Binary s
  | Wire.Keyword s -> T.Keyword s
  | Wire.Symbol s -> T.Symbol s
  | Wire.Big_decimal s -> T.Big_decimal s
  | Wire.Big_int s -> T.Big_int s
  | Wire.Date_ms ms -> T.Date ms
  | Wire.Uuid s -> T.Uuid s
  | Wire.Uri s -> T.Uri s
  | Wire.Array xs -> T.Array (List.map to_transit xs)
  | Wire.List xs -> T.List (List.map to_transit xs)
  | Wire.Map kvs -> T.Map (List.map (fun (k, v) -> (to_transit k, to_transit v)) kvs)
  | Wire.Set xs -> T.Set (List.map to_transit xs)
  | Wire.Tagged (tag, rep) -> T.Tagged (tag, to_transit rep)

let of_string s = of_transit (Transit_native.Transit.Json.of_string s)

let to_string ?(mode = Wire.Normal) t =
  let mode = match mode with Wire.Normal -> T.Normal | Wire.Verbose -> T.Verbose in
  Transit_native.Transit.Json.to_string ~mode (to_transit t)
