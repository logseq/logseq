type transit_mode = Normal | Verbose

val edn_of_string : string -> (Value.t, string) result
val edn_to_string : Value.t -> (string, string) result
val transit_of_string : string -> (Value.t, string) result
val transit_to_string : ?mode:transit_mode -> Value.t -> (string, string) result
